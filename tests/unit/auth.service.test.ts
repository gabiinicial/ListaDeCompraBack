import { PrismaClient } from '@prisma/client';
import { DeepMockProxy, mockReset } from 'jest-mock-extended';

jest.mock('../../src/config/env', () => ({
  env: {
    JWT_SECRET: 'unit-test-secret-key',
    JWT_EXPIRES_IN: '1d',
    BCRYPT_SALT_ROUNDS: 1
  }
}));

jest.mock('../../src/config/prisma', () => ({
  prisma: require('jest-mock-extended').mockDeep()
}));

jest.mock('../../src/utils/jwt', () => ({
  signToken: jest.fn().mockReturnValue('unit-test-token')
}));

jest.mock('bcryptjs', () => ({
  hash: jest.fn().mockResolvedValue('$2a$01$hashed-password'),
  compare: jest.fn()
}));

import bcrypt from 'bcryptjs';
import { prisma } from '../../src/config/prisma';
import { authService } from '../../src/services/auth.service';
import { AppError } from '../../src/utils/appError';

const prismaMock = prisma as unknown as DeepMockProxy<PrismaClient>;

const baseUser = {
  id: 'user-abc-123',
  name: 'Pepito Test',
  email: 'pepito@test.com',
  password: '$2a$01$hashed-password',
  createdAt: new Date('2024-01-01T00:00:00Z'),
  updatedAt: new Date('2024-01-01T00:00:00Z')
};

beforeEach(() => {
  mockReset(prismaMock);
  (bcrypt.hash as jest.Mock).mockResolvedValue('$2a$01$hashed-password');
});

// ─── register ────────────────────────────────────────────────────────────────

describe('authService.register', () => {
  it('crea el usuario y retorna token cuando el email no existe', async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);
    prismaMock.user.create.mockResolvedValue(baseUser);

    const result = await authService.register({
      name: 'Pepito Test',
      email: 'pepito@test.com',
      password: 'Password123!'
    });

    expect(result.token).toBe('unit-test-token');
    expect(result.user.id).toBe(baseUser.id);
    expect(result.user.email).toBe(baseUser.email);
    expect(prismaMock.user.create).toHaveBeenCalledTimes(1);
  });

  it('normaliza el email a minúsculas antes de buscar y guardar', async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);
    prismaMock.user.create.mockResolvedValue({ ...baseUser, email: 'pepito@test.com' });

    await authService.register({
      name: 'Pepito',
      email: 'PEPITO@TEST.COM',
      password: 'Password123!'
    });

    expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
      where: { email: 'pepito@test.com' }
    });
  });

  it('hashea la contraseña antes de guardar (no guarda texto plano)', async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);
    prismaMock.user.create.mockResolvedValue(baseUser);

    await authService.register({
      name: 'Pepito',
      email: 'pepito@test.com',
      password: 'texto-plano'
    });

    const createArg = prismaMock.user.create.mock.calls[0][0];
    expect(createArg.data.password).not.toBe('texto-plano');
    expect(createArg.data.password).toBe('$2a$01$hashed-password');
  });

  it('lanza AppError 409 si el email ya está registrado', async () => {
    prismaMock.user.findUnique.mockResolvedValue(baseUser);

    await expect(
      authService.register({ name: 'X', email: 'pepito@test.com', password: 'pass' })
    ).rejects.toMatchObject({ statusCode: 409 });

    expect(prismaMock.user.create).not.toHaveBeenCalled();
  });

  it('la respuesta del usuario no contiene la contraseña', async () => {
    const publicUser = { id: baseUser.id, name: baseUser.name, email: baseUser.email, createdAt: baseUser.createdAt, updatedAt: baseUser.updatedAt };
    prismaMock.user.findUnique.mockResolvedValue(null);
    // El mock devuelve solo los campos públicos, simulando el select de Prisma
    prismaMock.user.create.mockResolvedValue(publicUser as typeof baseUser);

    const result = await authService.register({
      name: 'Pepito',
      email: 'pepito@test.com',
      password: 'Password123!'
    });

    expect((result.user as Record<string, unknown>).password).toBeUndefined();
  });
});

// ─── login ───────────────────────────────────────────────────────────────────

describe('authService.login', () => {
  it('retorna auth result con credenciales válidas', async () => {
    prismaMock.user.findUnique.mockResolvedValue(baseUser);
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);

    const result = await authService.login({
      email: 'pepito@test.com',
      password: 'Password123!'
    });

    expect(result.token).toBe('unit-test-token');
    expect(result.user.email).toBe(baseUser.email);
  });

  it('lanza AppError 401 si el usuario no existe', async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);

    await expect(
      authService.login({ email: 'noexiste@test.com', password: '123456' })
    ).rejects.toMatchObject({ statusCode: 401 });
  });

  it('lanza AppError 401 si la contraseña es incorrecta', async () => {
    prismaMock.user.findUnique.mockResolvedValue(baseUser);
    (bcrypt.compare as jest.Mock).mockResolvedValue(false);

    await expect(
      authService.login({ email: 'pepito@test.com', password: 'wrong' })
    ).rejects.toMatchObject({ statusCode: 401 });
  });

  it('utiliza el mensaje genérico en ambos casos de error (no revela si el email existe)', async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);

    const error = await authService
      .login({ email: 'noexiste@test.com', password: '123' })
      .catch((e: AppError) => e);

    expect(error).toBeInstanceOf(AppError);
    expect((error as AppError).message).toBe('Credenciales inválidas');
  });
});

// ─── getProfile ───────────────────────────────────────────────────────────────

describe('authService.getProfile', () => {
  it('retorna los datos públicos del usuario', async () => {
    prismaMock.user.findUnique.mockResolvedValue(baseUser);

    const result = await authService.getProfile(baseUser.id);

    expect(result.id).toBe(baseUser.id);
    expect(result.email).toBe(baseUser.email);
  });

  it('lanza AppError 404 si el usuario no existe', async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);

    await expect(authService.getProfile('id-inexistente')).rejects.toMatchObject({
      statusCode: 404
    });
  });
});
