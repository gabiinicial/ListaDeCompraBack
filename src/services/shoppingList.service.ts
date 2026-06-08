import { ListPrivacy, NotificationType } from '@prisma/client';

import { DEFAULT_CATEGORY_NAMES } from '../constants/defaultCategories';
import { prisma } from '../config/prisma';
import { AppError } from '../utils/appError';
import { notificationService } from './notification.service';

export type ShoppingListInput = {
  name: string;
  description?: string | null;
  privacy?: ListPrivacy;
};

export type UpdateShoppingListInput = Partial<ShoppingListInput>;

const publicUserSelect = {
  id: true,
  name: true,
  email: true,
  createdAt: true,
  updatedAt: true
} as const;

const shoppingListSelect = {
  id: true,
  name: true,
  description: true,
  privacy: true,
  ownerId: true,
  createdAt: true,
  updatedAt: true,
  owner: {
    select: publicUserSelect
  }
} as const;

export const shoppingListService = {
  async create(userId: string, input: ShoppingListInput) {
    const shoppingList = await prisma.shoppingList.create({
      data: {
        ownerId: userId,
        name: input.name.trim(),
        description: input.description?.trim() ?? null,
        privacy: input.privacy ?? ListPrivacy.PRIVATE
      },
      select: shoppingListSelect
    });

    await prisma.category.createMany({
      data: DEFAULT_CATEGORY_NAMES.map((name) => ({
        listId: shoppingList.id,
        name,
        isDefault: true
      })),
      skipDuplicates: true
    });

    await notificationService.createEvent({
      userId,
      listId: shoppingList.id,
      type: NotificationType.LIST_CREATED,
      title: 'Lista creada',
      message: `Se creó la lista ${shoppingList.name}.`,
      metadata: { listId: shoppingList.id }
    });

    return shoppingList;
  },

  async findAll(userId: string) {
    return prisma.shoppingList.findMany({
      where: { ownerId: userId },
      orderBy: { updatedAt: 'desc' },
      select: shoppingListSelect
    });
  },

  async findById(userId: string, listId: string) {
    const shoppingList = await prisma.shoppingList.findFirst({
      where: {
        id: listId,
        ownerId: userId
      },
      select: shoppingListSelect
    });

    if (!shoppingList) {
      throw new AppError('Lista no encontrada', 404);
    }

    return shoppingList;
  },

  async update(userId: string, listId: string, input: UpdateShoppingListInput) {
    const previousList = await this.findById(userId, listId);

    const shoppingList = await prisma.shoppingList.update({
      where: { id: listId },
      data: {
        ...(input.name !== undefined ? { name: input.name.trim() } : {}),
        ...(input.description !== undefined ? { description: input.description?.trim() ?? null } : {}),
        ...(input.privacy !== undefined ? { privacy: input.privacy } : {})
      },
      select: shoppingListSelect
    });

    await notificationService.createEvent({
      userId,
      listId,
      type: NotificationType.LIST_UPDATED,
      title: 'Lista actualizada',
      message: `Se actualizó la lista ${shoppingList.name}.`,
      metadata: { listId, previousName: previousList.name, nextName: shoppingList.name }
    });

    return shoppingList;
  },

  async remove(userId: string, listId: string) {
    const previousList = await this.findById(userId, listId);

    const shoppingList = await prisma.shoppingList.delete({
      where: { id: listId },
      select: shoppingListSelect
    });

    await notificationService.createEvent({
      userId,
      listId: null,
      type: NotificationType.LIST_DELETED,
      title: 'Lista eliminada',
      message: `Se eliminó la lista ${previousList.name}.`,
      metadata: { listId, previousName: previousList.name }
    });

    return shoppingList;
  }
};
