import { ListPrivacy, NotificationType, Prisma, PrismaClient } from '@prisma/client';
import { DeepMockProxy, mockReset } from 'jest-mock-extended';

jest.mock('../../src/config/prisma', () => ({
  prisma: require('jest-mock-extended').mockDeep()
}));

jest.mock('../../src/utils/decimal', () => ({
  toDecimal: jest.fn((v: number) => v),
  toNumber: jest.fn((v: unknown) => (typeof v === 'number' ? v : Number(String(v))))
}));

jest.mock('../../src/services/notification.service', () => ({
  notificationService: { createEvent: jest.fn().mockResolvedValue(undefined) }
}));

jest.mock('../../src/services/budget.service', () => ({
  budgetService: { recalculateBudget: jest.fn().mockResolvedValue(undefined) }
}));

jest.mock('../../src/services/category.service', () => ({
  categoryService: { ensureDefaultCategories: jest.fn().mockResolvedValue(undefined) }
}));

jest.mock('../../src/services/shoppingList.service', () => ({
  shoppingListService: { findById: jest.fn() }
}));

import { prisma } from '../../src/config/prisma';
import { budgetService } from '../../src/services/budget.service';
import { notificationService } from '../../src/services/notification.service';
import { shoppingListService } from '../../src/services/shoppingList.service';
import { itemService } from '../../src/services/item.service';

const prismaMock = prisma as unknown as DeepMockProxy<PrismaClient>;
const findListMock = shoppingListService.findById as jest.Mock;
const notifMock = notificationService.createEvent as jest.Mock;
const budgetMock = budgetService.recalculateBudget as jest.Mock;

const userId = 'user-id-001';
const listId = 'list-id-001';
const itemId = 'item-id-001';

const baseList = {
  id: listId,
  name: 'Mercado',
  description: null,
  privacy: ListPrivacy.PRIVATE,
  ownerId: userId,
  createdAt: new Date(),
  updatedAt: new Date(),
  owner: { id: userId, name: 'Test', email: 't@t.com', createdAt: new Date(), updatedAt: new Date() }
};

const baseItem = {
  id: itemId,
  listId,
  categoryId: null,
  name: 'Leche',
  quantity: new Prisma.Decimal(2),
  price: new Prisma.Decimal(3500),
  note: null,
  imageUrl: null,
  purchased: false,
  purchasedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  category: null
};

beforeEach(() => {
  mockReset(prismaMock);
  findListMock.mockResolvedValue(baseList);
  notifMock.mockResolvedValue(undefined);
  budgetMock.mockResolvedValue(undefined);
});

// ─── create ──────────────────────────────────────────────────────────────────

describe('itemService.create', () => {
  it('crea el ítem, notifica y recalcula el presupuesto', async () => {
    prismaMock.category.findFirst.mockResolvedValue(null);
    prismaMock.item.create.mockResolvedValue(baseItem);

    const result = await itemService.create(userId, listId, {
      name: 'Leche',
      quantity: 2,
      price: 3500
    });

    expect(result.name).toBe('Leche');
    expect(result.quantity).toBe(2);
    expect(notifMock).toHaveBeenCalledWith(
      expect.objectContaining({ type: NotificationType.ITEM_CREATED })
    );
    expect(budgetMock).toHaveBeenCalledWith(listId, userId);
  });

  it('recorta espacios del nombre', async () => {
    prismaMock.category.findFirst.mockResolvedValue(null);
    prismaMock.item.create.mockResolvedValue(baseItem);

    await itemService.create(userId, listId, { name: '  Leche  ', quantity: 1, price: 0 });

    const createArg = prismaMock.item.create.mock.calls[0][0];
    expect(createArg.data.name).toBe('Leche');
  });

  it('lanza AppError 404 si la categoría no pertenece a la lista', async () => {
    prismaMock.category.findFirst.mockResolvedValue(null);

    await expect(
      itemService.create(userId, listId, {
        name: 'Ítem',
        quantity: 1,
        price: 0,
        categoryId: 'cat-ajena-999'
      })
    ).rejects.toMatchObject({ statusCode: 404 });
  });

  it('lanza AppError 404 si la lista no existe', async () => {
    findListMock.mockRejectedValue({ statusCode: 404 });

    await expect(
      itemService.create(userId, 'lista-inexistente', { name: 'X', quantity: 1, price: 0 })
    ).rejects.toMatchObject({ statusCode: 404 });
  });
});

// ─── findAllByList ─────────────────────────────────────────────────────────────

describe('itemService.findAllByList', () => {
  it('retorna todos los ítems de la lista', async () => {
    prismaMock.item.findMany.mockResolvedValue([baseItem, { ...baseItem, id: 'item-002', name: 'Pan' }]);

    const result = await itemService.findAllByList(userId, listId);

    expect(result).toHaveLength(2);
    expect(result[0].name).toBe('Leche');
  });

  it('filtra por categoría si se provee categoryId', async () => {
    prismaMock.item.findMany.mockResolvedValue([]);

    await itemService.findAllByList(userId, listId, 'cat-id-123');

    const findArg = prismaMock.item.findMany.mock.calls[0]?.[0];
    expect(findArg?.where).toMatchObject({ categoryId: 'cat-id-123' });
  });
});

// ─── update (marcar como comprado) ────────────────────────────────────────────

describe('itemService.update', () => {
  it('marca el ítem como comprado y envía notificación ITEM_PURCHASED', async () => {
    prismaMock.item.findFirst.mockResolvedValue(baseItem);
    prismaMock.item.update.mockResolvedValue({
      ...baseItem,
      purchased: true,
      purchasedAt: new Date()
    });

    const result = await itemService.update(userId, itemId, { purchased: true });

    expect(result.purchased).toBe(true);
    expect(notifMock).toHaveBeenCalledWith(
      expect.objectContaining({ type: NotificationType.ITEM_PURCHASED })
    );
    expect(budgetMock).toHaveBeenCalled();
  });

  it('lanza AppError 404 si el ítem no pertenece al usuario', async () => {
    prismaMock.item.findFirst.mockResolvedValue(null);

    await expect(
      itemService.update(userId, 'item-ajeno', { name: 'Nuevo' })
    ).rejects.toMatchObject({ statusCode: 404 });
  });
});

// ─── remove ──────────────────────────────────────────────────────────────────

describe('itemService.remove', () => {
  it('elimina el ítem y recalcula el presupuesto', async () => {
    prismaMock.item.findFirst.mockResolvedValue(baseItem);
    prismaMock.item.delete.mockResolvedValue(baseItem);

    const result = await itemService.remove(userId, itemId);

    expect(result.id).toBe(itemId);
    expect(budgetMock).toHaveBeenCalledWith(listId, userId);
  });

  it('la notificación de eliminación usa itemId null (FK ya no existe)', async () => {
    prismaMock.item.findFirst.mockResolvedValue(baseItem);
    prismaMock.item.delete.mockResolvedValue(baseItem);

    await itemService.remove(userId, itemId);

    expect(notifMock).toHaveBeenCalledWith(
      expect.objectContaining({
        type: NotificationType.ITEM_DELETED,
        itemId: null
      })
    );
  });
});
