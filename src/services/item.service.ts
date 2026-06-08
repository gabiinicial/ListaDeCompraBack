import { NotificationType, Prisma } from '@prisma/client';

import { prisma } from '../config/prisma';
import { AppError } from '../utils/appError';
import { toDecimal, toNumber } from '../utils/decimal';
import { budgetService } from './budget.service';
import { categoryService } from './category.service';
import { notificationService } from './notification.service';
import { shoppingListService } from './shoppingList.service';

type ItemInput = {
  name: string;
  quantity: number;
  price: number;
  note?: string | null;
  imageUrl?: string | null;
  categoryId?: string | null;
  purchased?: boolean;
};

const itemSelect = {
  id: true,
  listId: true,
  categoryId: true,
  name: true,
  quantity: true,
  price: true,
  note: true,
  imageUrl: true,
  purchased: true,
  purchasedAt: true,
  createdAt: true,
  updatedAt: true,
  category: {
    select: {
      id: true,
      name: true,
      color: true,
      isDefault: true
    }
  }
} as const;

type ItemWithCategory = Prisma.ItemGetPayload<{ select: typeof itemSelect }>;

const serializeItem = (item: ItemWithCategory) => ({
  id: item.id,
  listId: item.listId,
  categoryId: item.categoryId,
  name: item.name,
  quantity: toNumber(item.quantity),
  price: toNumber(item.price),
  note: item.note,
  imageUrl: item.imageUrl,
  purchased: item.purchased,
  purchasedAt: item.purchasedAt,
  createdAt: item.createdAt,
  updatedAt: item.updatedAt,
  category: item.category
});

const findOwnedItemOrThrow = async (userId: string, itemId: string) => {
  const item = await prisma.item.findFirst({
    where: {
      id: itemId,
      list: { ownerId: userId }
    },
    select: itemSelect
  });

  if (!item) {
    throw new AppError('Ítem no encontrado', 404);
  }

  return item;
};

const assertCategoryMatchesList = async (userId: string, listId: string, categoryId?: string | null) => {
  if (!categoryId) {
    return;
  }

  const category = await prisma.category.findFirst({
    where: {
      id: categoryId,
      listId,
      list: { ownerId: userId }
    },
    select: { id: true }
  });

  if (!category) {
    throw new AppError('Categoría no encontrada en la lista', 404);
  }
};

const buildNotificationMessage = (name: string, action: string) => `${action} el ítem ${name}.`;

export const itemService = {
  async create(userId: string, listId: string, input: ItemInput) {
    await shoppingListService.findById(userId, listId);
    await categoryService.ensureDefaultCategories(listId);
    await assertCategoryMatchesList(userId, listId, input.categoryId);

    const item = await prisma.item.create({
      data: {
        listId,
        categoryId: input.categoryId ?? null,
        name: input.name.trim(),
        quantity: toDecimal(input.quantity),
        price: toDecimal(input.price),
        note: input.note?.trim() || null,
        imageUrl: input.imageUrl?.trim() || null,
        purchased: input.purchased ?? false,
        purchasedAt: input.purchased ?? false ? new Date() : null
      },
      select: itemSelect
    });

    await notificationService.createEvent({
      userId,
      listId,
      itemId: item.id,
      type: NotificationType.ITEM_CREATED,
      title: 'Ítem agregado',
      message: buildNotificationMessage(item.name, 'Se agregó'),
      metadata: { itemId: item.id, listId }
    });

    await budgetService.recalculateBudget(listId, userId);

    return serializeItem(item);
  },

  async findAllByList(userId: string, listId: string, categoryId?: string) {
    await shoppingListService.findById(userId, listId);

    const items = await prisma.item.findMany({
      where: {
        listId,
        ...(categoryId ? { categoryId } : {})
      },
      orderBy: [{ purchased: 'asc' }, { createdAt: 'desc' }],
      select: itemSelect
    });

    return items.map(serializeItem);
  },

  async findById(userId: string, itemId: string) {
    const item = await findOwnedItemOrThrow(userId, itemId);
    return serializeItem(item);
  },

  async update(userId: string, itemId: string, input: Partial<ItemInput>) {
    const currentItem = await findOwnedItemOrThrow(userId, itemId);
    const listId = currentItem.listId;

    await assertCategoryMatchesList(userId, listId, input.categoryId);

    const nextPurchased = input.purchased ?? currentItem.purchased;
    const updatedItem = await prisma.item.update({
      where: { id: itemId },
      data: {
        ...(input.name !== undefined ? { name: input.name.trim() } : {}),
        ...(input.quantity !== undefined ? { quantity: toDecimal(input.quantity) } : {}),
        ...(input.price !== undefined ? { price: toDecimal(input.price) } : {}),
        ...(input.note !== undefined ? { note: input.note?.trim() || null } : {}),
        ...(input.imageUrl !== undefined ? { imageUrl: input.imageUrl?.trim() || null } : {}),
        ...(input.categoryId !== undefined ? { categoryId: input.categoryId } : {}),
        ...(input.purchased !== undefined
          ? {
              purchased: input.purchased,
              purchasedAt: input.purchased ? new Date() : null
            }
          : {})
      },
      select: itemSelect
    });

    await notificationService.createEvent({
      userId,
      listId,
      itemId: updatedItem.id,
      type: nextPurchased ? NotificationType.ITEM_PURCHASED : NotificationType.ITEM_UPDATED,
      title: nextPurchased ? 'Ítem comprado' : 'Ítem actualizado',
      message: nextPurchased
        ? buildNotificationMessage(updatedItem.name, 'Se marcó como comprado')
        : buildNotificationMessage(updatedItem.name, 'Se actualizó'),
      metadata: { itemId: updatedItem.id, listId }
    });

    await budgetService.recalculateBudget(listId, userId);

    return serializeItem(updatedItem);
  },

  async remove(userId: string, itemId: string) {
    const currentItem = await findOwnedItemOrThrow(userId, itemId);

    const deletedItem = await prisma.item.delete({
      where: { id: itemId },
      select: itemSelect
    });

    await notificationService.createEvent({
      userId,
      listId: currentItem.listId,
      itemId: null,
      type: NotificationType.ITEM_DELETED,
      title: 'Ítem eliminado',
      message: buildNotificationMessage(deletedItem.name, 'Se eliminó'),
      metadata: { itemId, listId: currentItem.listId }
    });

    await budgetService.recalculateBudget(currentItem.listId, userId);

    return serializeItem(deletedItem);
  }
};
