/**
 * Integración 1 — POST /api/auth/register
 * Verifica que se cree el usuario y se retorne token.
 */

import { PrismaClient } from '@prisma/client';
import { DeepMockProxy, mockReset } from 'jest-mock-extended';
import request from 'supertest';

const TEST_SECRET = 'integration-auth-secret';

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

jest.mock('bcryptjs', () => ({
  hash: jest.fn().mockResolvedValue('$2a$01$hashed'),
  compare: jest.fn().mockResolvedValue(true)
}));

import { prisma } from '../../src/config/prisma';
import app from '../../src/app';

const prismaMock = prisma as unknown as DeepMockProxy<PrismaClient>;

const newUser = {
  id: 'user-int-001',
  name: 'Carlos Integración',
  email: 'carlos@inttest.com',
  password: '$2a$01$hashed',
  createdAt: new Date(),
  updatedAt: new Date()
};

// Simula lo que Prisma devuelve con select: publicUserSelect (sin password)
const newUserPublic = {
  id: newUser.id,
  name: newUser.name,
  email: newUser.email,
  createdAt: newUser.createdAt,
  updatedAt: newUser.updatedAt
};

beforeEach(() => {
  mockReset(prismaMock);
});

describe('POST /api/auth/register', () => {
  it('crea un usuario y retorna token + datos públicos del usuario', async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);
    prismaMock.user.create.mockResolvedValue(newUserPublic as typeof newUser);

    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Carlos Integración', email: 'carlos@inttest.com', password: 'Password123!' })
      .expect(201);

    expect(res.body.success).toBe(true);
    expect(res.body.data).toMatchObject({
      token: expect.any(String),
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name
      }
    });
    expect(res.body.data.user.password).toBeUndefined();
  });

  it('retorna 409 si el email ya está en uso', async () => {
    prismaMock.user.findUnique.mockResolvedValue(newUser);

    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Otro', email: 'carlos@inttest.com', password: 'Password123!' })
      .expect(409);

    expect(res.body.success).toBe(false);
  });

  it('retorna 400 si faltan campos requeridos', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'sin-nombre@test.com' })
      .expect(400);

    expect(res.body.success).toBe(false);
  });

  it('retorna 400 si la contraseña tiene menos de 8 caracteres', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Test', email: 'short@test.com', password: '123' })
      .expect(400);

    expect(res.body.success).toBe(false);
  });
});

describe('POST /api/auth/login', () => {
  it('retorna token con credenciales válidas', async () => {
    prismaMock.user.findUnique.mockResolvedValue(newUser);

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'carlos@inttest.com', password: 'Password123!' })
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
  });

  it('retorna 401 si el usuario no existe', async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'noexiste@test.com', password: 'cualquier' })
      .expect(401);

    expect(res.body.success).toBe(false);
  });
});
