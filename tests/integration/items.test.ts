/**
 * Integración 3 — POST /api/lists/:listId/items + PATCH /api/items/:itemId
 * Verifica que se pueda crear un ítem y marcarlo como comprado.
 */

import { ListPrivacy, PrismaClient } from '@prisma/client';
import { DeepMockProxy, mockReset } from 'jest-mock-extended';
import jwt from 'jsonwebtoken';
import request from 'supertest';

const TEST_SECRET = 'integration-items-secret';

jest.mock('../../src/config/env', () => ({
  env: {
    JWT_SECRET: TEST_SECRET,
    JWT_EXPIRES_IN: '1d',
    BCRYPT_SALT_ROUNDS: 1,
    CORS_ORIGIN: '*',
    NODE_ENV: 'test',
    PORT: 0
  }
}));

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

import { prisma } from '../../src/config/prisma';
import app from '../../src/app';

const prismaMock = prisma as unknown as DeepMockProxy<PrismaClient>;

const TEST_USER_ID = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
const LIST_ID = 'b2c3d4e5-f6a7-8901-bcde-f12345678901';
const ITEM_ID = 'c3d4e5f6-a7b8-9012-cdef-123456789012';
const NONEXISTENT_ID = '00000000-0000-4000-8000-000000000000';

const authToken = jwt.sign(
  { userId: TEST_USER_ID, email: 'items@inttest.com' },
  TEST_SECRET,
  { expiresIn: '1d' }
);

const mockList = {
  id: LIST_ID,
  name: 'Lista ítems',
  description: null,
  privacy: ListPrivacy.PRIVATE,
  ownerId: TEST_USER_ID,
  createdAt: new Date(),
  updatedAt: new Date(),
  owner: { id: TEST_USER_ID, name: 'Test', email: 'items@inttest.com', createdAt: new Date(), updatedAt: new Date() }
};

const createdItem = {
  id: ITEM_ID,
  listId: LIST_ID,
  categoryId: null,
  name: 'Arroz',
  quantity: 2,
  price: 5000,
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
  // findById de la lista
  prismaMock.shoppingList.findFirst.mockResolvedValue(mockList);
  // ensureDefaultCategories
  prismaMock.category.findMany.mockResolvedValue([]);
  prismaMock.category.createMany.mockResolvedValue({ count: 0 });
});

describe('POST /api/lists/:listId/items', () => {
  it('crea un ítem en la lista y retorna 201', async () => {
    prismaMock.category.findFirst.mockResolvedValue(null);
    prismaMock.item.create.mockResolvedValue(createdItem);

    const res = await request(app)
      .post(`/api/lists/${LIST_ID}/items`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ name: 'Arroz', quantity: 2, price: 5000 })
      .expect(201);

    expect(res.body.success).toBe(true);
    expect(res.body.data).toMatchObject({
      id: ITEM_ID,
      name: 'Arroz',
      listId: LIST_ID
    });
  });

  it('retorna 400 si el nombre está vacío', async () => {
    const res = await request(app)
      .post(`/api/lists/${LIST_ID}/items`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ name: '', quantity: 1, price: 0 })
      .expect(400);

    expect(res.body.success).toBe(false);
  });

  it('retorna 401 sin token', async () => {
    const res = await request(app)
      .post(`/api/lists/${LIST_ID}/items`)
      .send({ name: 'Arroz', quantity: 2, price: 5000 })
      .expect(401);

    expect(res.body.success).toBe(false);
  });
});

describe('PATCH /api/items/:itemId — marcar como comprado', () => {
  it('marca el ítem como comprado y retorna purchased: true', async () => {
    prismaMock.item.findFirst.mockResolvedValue(createdItem);
    prismaMock.item.update.mockResolvedValue({
      ...createdItem,
      purchased: true,
      purchasedAt: new Date()
    });

    const res = await request(app)
      .patch(`/api/items/${ITEM_ID}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ purchased: true })
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.purchased).toBe(true);
  });

  it('retorna 404 si el ítem no existe o no pertenece al usuario', async () => {
    prismaMock.item.findFirst.mockResolvedValue(null);

    const res = await request(app)
      .patch(`/api/items/${NONEXISTENT_ID}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ purchased: true })
      .expect(404);

    expect(res.body.success).toBe(false);
  });

  it('retorna 400 si no se envía ningún campo', async () => {
    const res = await request(app)
      .patch(`/api/items/${ITEM_ID}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({})
      .expect(400);

    expect(res.body.success).toBe(false);
  });
});
