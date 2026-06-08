import { ListPrivacy, NotificationType, PrismaClient } from '@prisma/client';
import { DeepMockProxy, mockReset } from 'jest-mock-extended';

jest.mock('../../src/config/prisma', () => ({
  prisma: require('jest-mock-extended').mockDeep()
}));

jest.mock('../../src/services/notification.service', () => ({
  notificationService: {
    createEvent: jest.fn().mockResolvedValue(undefined)
  }
}));

import { prisma } from '../../src/config/prisma';
import { notificationService } from '../../src/services/notification.service';
import { shoppingListService } from '../../src/services/shoppingList.service';
import { AppError } from '../../src/utils/appError';

const prismaMock = prisma as unknown as DeepMockProxy<PrismaClient>;
const notifMock = notificationService.createEvent as jest.Mock;

const ownerId = 'owner-uuid-001';
const listId = 'list-uuid-001';

const baseList = {
  id: listId,
  name: 'Mercado semana',
  description: null,
  privacy: ListPrivacy.PRIVATE,
  ownerId,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  owner: {
    id: ownerId,
    name: 'Pepito',
    email: 'pepito@test.com',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  }
};

beforeEach(() => {
  mockReset(prismaMock);
  notifMock.mockResolvedValue(undefined);
});

// ─── create ──────────────────────────────────────────────────────────────────

describe('shoppingListService.create', () => {
  it('crea la lista, categorías por defecto y notificación', async () => {
    prismaMock.shoppingList.create.mockResolvedValue(baseList);
    prismaMock.category.createMany.mockResolvedValue({ count: 10 });

    const result = await shoppingListService.create(ownerId, { name: 'Mercado semana' });

    expect(result.id).toBe(listId);
    expect(result.name).toBe('Mercado semana');
    expect(prismaMock.category.createMany).toHaveBeenCalledTimes(1);
    expect(notifMock).toHaveBeenCalledWith(
      expect.objectContaining({ type: NotificationType.LIST_CREATED })
    );
  });

  it('recorta espacios del nombre', async () => {
    prismaMock.shoppingList.create.mockResolvedValue(baseList);
    prismaMock.category.createMany.mockResolvedValue({ count: 10 });

    await shoppingListService.create(ownerId, { name: '  Mercado  ' });

    const createArg = prismaMock.shoppingList.create.mock.calls[0][0];
    expect(createArg.data.name).toBe('Mercado');
  });

  it('usa privacidad PRIVATE por defecto', async () => {
    prismaMock.shoppingList.create.mockResolvedValue(baseList);
    prismaMock.category.createMany.mockResolvedValue({ count: 10 });

    await shoppingListService.create(ownerId, { name: 'Lista' });

    const createArg = prismaMock.shoppingList.create.mock.calls[0][0];
    expect(createArg.data.privacy).toBe(ListPrivacy.PRIVATE);
  });
});

// ─── findAll ─────────────────────────────────────────────────────────────────

describe('shoppingListService.findAll', () => {
  it('retorna todas las listas del usuario', async () => {
    prismaMock.shoppingList.findMany.mockResolvedValue([baseList, { ...baseList, id: 'list-002', name: 'Farmacia' }]);

    const result = await shoppingListService.findAll(ownerId);

    expect(result).toHaveLength(2);
    expect(result[0].id).toBe(listId);
  });

  it('retorna arreglo vacío si el usuario no tiene listas', async () => {
    prismaMock.shoppingList.findMany.mockResolvedValue([]);

    const result = await shoppingListService.findAll(ownerId);

    expect(result).toEqual([]);
  });
});

// ─── findById ─────────────────────────────────────────────────────────────────

describe('shoppingListService.findById', () => {
  it('retorna la lista cuando existe y pertenece al usuario', async () => {
    prismaMock.shoppingList.findFirst.mockResolvedValue(baseList);

    const result = await shoppingListService.findById(ownerId, listId);

    expect(result.id).toBe(listId);
    expect(prismaMock.shoppingList.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: listId, ownerId } })
    );
  });

  it('lanza AppError 404 si la lista no existe o no pertenece al usuario', async () => {
    prismaMock.shoppingList.findFirst.mockResolvedValue(null);

    await expect(shoppingListService.findById(ownerId, 'id-ajeno')).rejects.toMatchObject({
      statusCode: 404
    });
  });
});

// ─── update ──────────────────────────────────────────────────────────────────

describe('shoppingListService.update', () => {
  it('actualiza el nombre y envía notificación LIST_UPDATED', async () => {
    prismaMock.shoppingList.findFirst.mockResolvedValue(baseList);
    prismaMock.shoppingList.update.mockResolvedValue({ ...baseList, name: 'Mercado nuevo' });

    const result = await shoppingListService.update(ownerId, listId, { name: 'Mercado nuevo' });

    expect(result.name).toBe('Mercado nuevo');
    expect(notifMock).toHaveBeenCalledWith(
      expect.objectContaining({ type: NotificationType.LIST_UPDATED })
    );
  });

  it('lanza AppError 404 si la lista no existe', async () => {
    prismaMock.shoppingList.findFirst.mockResolvedValue(null);

    await expect(
      shoppingListService.update(ownerId, listId, { name: 'Nuevo' })
    ).rejects.toMatchObject({ statusCode: 404 });
  });
});

// ─── remove ───────────────────────────────────────────────────────────────────

describe('shoppingListService.remove', () => {
  it('elimina la lista y envía notificación LIST_DELETED con listId null', async () => {
    prismaMock.shoppingList.findFirst.mockResolvedValue(baseList);
    prismaMock.shoppingList.delete.mockResolvedValue(baseList);

    const result = await shoppingListService.remove(ownerId, listId);

    expect(result.id).toBe(listId);
    expect(notifMock).toHaveBeenCalledWith(
      expect.objectContaining({
        type: NotificationType.LIST_DELETED,
        listId: null
      })
    );
  });

  it('lanza AppError 404 si la lista no existe', async () => {
    prismaMock.shoppingList.findFirst.mockResolvedValue(null);

    await expect(shoppingListService.remove(ownerId, listId)).rejects.toMatchObject({
      statusCode: 404
    });
  });
});
