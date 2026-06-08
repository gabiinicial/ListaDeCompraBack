/**
 * Integración 2 — POST /api/lists
 * Verifica que un usuario autenticado pueda crear una lista.
 */

import { ListPrivacy, PrismaClient } from '@prisma/client';
import { DeepMockProxy, mockReset } from 'jest-mock-extended';
import jwt from 'jsonwebtoken';
import request from 'supertest';

const TEST_SECRET = 'integration-lists-secret';

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

jest.mock('../../src/services/notification.service', () => ({
  notificationService: { createEvent: jest.fn().mockResolvedValue(undefined) }
}));

import { prisma } from '../../src/config/prisma';
import app from '../../src/app';

const prismaMock = prisma as unknown as DeepMockProxy<PrismaClient>;

const TEST_USER_ID = 'user-list-int-001';
const authToken = jwt.sign(
  { userId: TEST_USER_ID, email: 'lists@inttest.com' },
  TEST_SECRET,
  { expiresIn: '1d' }
);

const createdList = {
  id: 'list-int-001',
  name: 'Lista de integración',
  description: 'Prueba de integración',
  privacy: ListPrivacy.PRIVATE,
  ownerId: TEST_USER_ID,
  createdAt: new Date(),
  updatedAt: new Date(),
  owner: {
    id: TEST_USER_ID,
    name: 'Test',
    email: 'lists@inttest.com',
    createdAt: new Date(),
    updatedAt: new Date()
  }
};

beforeEach(() => {
  mockReset(prismaMock);
  prismaMock.category.createMany.mockResolvedValue({ count: 10 });
});

describe('POST /api/lists', () => {
  it('crea una lista con usuario autenticado y retorna 201', async () => {
    prismaMock.shoppingList.create.mockResolvedValue(createdList);

    const res = await request(app)
      .post('/api/lists')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ name: 'Lista de integración', description: 'Prueba de integración' })
      .expect(201);

    expect(res.body.success).toBe(true);
    expect(res.body.data).toMatchObject({
      id: createdList.id,
      name: createdList.name,
      ownerId: TEST_USER_ID
    });
  });

  it('retorna 401 sin token de autenticación', async () => {
    const res = await request(app)
      .post('/api/lists')
      .send({ name: 'Sin auth' })
      .expect(401);

    expect(res.body.success).toBe(false);
    expect(prismaMock.shoppingList.create).not.toHaveBeenCalled();
  });

  it('retorna 400 si el nombre está vacío', async () => {
    const res = await request(app)
      .post('/api/lists')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ name: '' })
      .expect(400);

    expect(res.body.success).toBe(false);
  });

  it('retorna 401 con token inválido', async () => {
    const res = await request(app)
      .post('/api/lists')
      .set('Authorization', 'Bearer token-falso-invalido')
      .send({ name: 'Lista' })
      .expect(401);

    expect(res.body.success).toBe(false);
  });
});

describe('GET /api/lists', () => {
  it('retorna las listas del usuario autenticado', async () => {
    prismaMock.shoppingList.findMany.mockResolvedValue([createdList]);

    const res = await request(app)
      .get('/api/lists')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data).toHaveLength(1);
  });

  it('retorna arreglo vacío si el usuario no tiene listas', async () => {
    prismaMock.shoppingList.findMany.mockResolvedValue([]);

    const res = await request(app)
      .get('/api/lists')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(res.body.data).toEqual([]);
  });
});
