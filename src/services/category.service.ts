import { NotificationType } from '@prisma/client';

import { prisma } from '../config/prisma';
import { AppError } from '../utils/appError';
import { notificationService } from './notification.service';
import { shoppingListService } from './shoppingList.service';

type CategoryInput = {
  name: string;
  color?: string | null;
};

const DEFAULT_CATEGORIES = [
  'Frutas',
  'Lácteos',
  'Carnes',
  'Limpieza',
  'Panadería',
  'Bebidas',
  'Verduras',
  'Despensa',
  'Congelados',
  'Otros'
] as const;

const categorySelect = {
  id: true,
  listId: true,
  name: true,
  color: true,
  isDefault: true,
  createdAt: true,
  updatedAt: true
} as const;

const normalizeName = (name: string) => name.trim();

const findCategoryOrThrow = async (userId: string, categoryId: string) => {
  const category = await prisma.category.findFirst({
    where: {
      id: categoryId,
      list: {
        ownerId: userId
      }
    },
    select: categorySelect
  });

  if (!category) {
    throw new AppError('Categoría no encontrada', 404);
  }

  return category;
};

const ensureDefaultCategories = async (listId: string) => {
  const existingCategories = await prisma.category.findMany({
    where: { listId, isDefault: true },
    select: { name: true }
  });

  const existingNames = new Set(existingCategories.map((category) => category.name.toLowerCase()));
  const missingCategories = DEFAULT_CATEGORIES.filter((name) => !existingNames.has(name.toLowerCase()));

  if (missingCategories.length === 0) {
    return;
  }

  await prisma.category.createMany({
    data: missingCategories.map((name) => ({
      listId,
      name,
      isDefault: true
    })),
    skipDuplicates: true
  });
};

export const categoryService = {
  async listByList(userId: string, listId: string) {
    await shoppingListService.findById(userId, listId);
    await ensureDefaultCategories(listId);

    const categories = await prisma.category.findMany({
      where: { listId },
      orderBy: [{ isDefault: 'desc' }, { name: 'asc' }],
      select: categorySelect
    });

    return categories;
  },

  async create(userId: string, listId: string, input: CategoryInput) {
    await shoppingListService.findById(userId, listId);

    const normalizedName = normalizeName(input.name);
    const duplicate = await prisma.category.findFirst({
      where: {
        listId,
        name: {
          equals: normalizedName,
          mode: 'insensitive'
        }
      }
    });

    if (duplicate) {
      throw new AppError('Ya existe una categoría con ese nombre', 409);
    }

    const category = await prisma.category.create({
      data: {
        listId,
        name: normalizedName,
        color: input.color?.trim() || null,
        isDefault: false
      },
      select: categorySelect
    });

    await notificationService.createEvent({
      userId,
      listId,
      type: NotificationType.CATEGORY_CREATED,
      title: 'Categoría creada',
      message: `Se creó la categoría ${category.name}.`,
      metadata: { categoryId: category.id, name: category.name }
    });

    return category;
  },

  async update(userId: string, categoryId: string, input: Partial<CategoryInput>) {
    const category = await findCategoryOrThrow(userId, categoryId);

    if (input.name) {
      const normalizedName = normalizeName(input.name);
      const duplicate = await prisma.category.findFirst({
        where: {
          listId: category.listId,
          id: { not: categoryId },
          name: {
            equals: normalizedName,
            mode: 'insensitive'
          }
        }
      });

      if (duplicate) {
        throw new AppError('Ya existe una categoría con ese nombre', 409);
      }
    }

    const updatedCategory = await prisma.category.update({
      where: { id: categoryId },
      data: {
        ...(input.name !== undefined ? { name: normalizeName(input.name) } : {}),
        ...(input.color !== undefined ? { color: input.color?.trim() || null } : {})
      },
      select: categorySelect
    });

    await notificationService.createEvent({
      userId,
      listId: category.listId,
      type: NotificationType.CATEGORY_UPDATED,
      title: 'Categoría actualizada',
      message: `Se actualizó la categoría ${updatedCategory.name}.`,
      metadata: { categoryId: updatedCategory.id, name: updatedCategory.name }
    });

    return updatedCategory;
  },

  async remove(userId: string, categoryId: string) {
    const category = await findCategoryOrThrow(userId, categoryId);

    const deletedCategory = await prisma.category.delete({
      where: { id: categoryId },
      select: categorySelect
    });

    await notificationService.createEvent({
      userId,
      listId: category.listId,
      type: NotificationType.CATEGORY_DELETED,
      title: 'Categoría eliminada',
      message: `Se eliminó la categoría ${deletedCategory.name}.`,
      metadata: { categoryId: deletedCategory.id, name: deletedCategory.name }
    });

    return deletedCategory;
  },

  async ensureDefaultCategories(listId: string) {
    await ensureDefaultCategories(listId);
  },

  async findOwnedCategory(userId: string, categoryId: string) {
    return findCategoryOrThrow(userId, categoryId);
  }
};
