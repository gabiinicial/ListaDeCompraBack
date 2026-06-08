import { Prisma } from '@prisma/client';

import { env } from '../config/env';
import { prisma } from '../config/prisma';
import { AppError } from '../utils/appError';
import { signToken } from '../utils/jwt';
import { comparePassword, hashPassword } from '../utils/password';

export type PublicUser = {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
};

export type AuthResult = {
  user: PublicUser;
  token: string;
};

const publicUserSelect = {
  id: true,
  name: true,
  email: true,
  createdAt: true,
  updatedAt: true
} as const satisfies Prisma.UserSelect;

const normalizeEmail = (email: string) => email.trim().toLowerCase();

const buildAuthResult = (user: PublicUser): AuthResult => {
  const token = signToken(
    {
      userId: user.id,
      email: user.email
    },
    env.JWT_SECRET,
    env.JWT_EXPIRES_IN
  );

  return {
    user,
    token
  };
};

export const authService = {
  async register(input: { name: string; email: string; password: string }): Promise<AuthResult> {
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizeEmail(input.email) }
    });

    if (existingUser) {
      throw new AppError('El correo ya está registrado', 409);
    }

    const hashedPassword = await hashPassword(input.password, env.BCRYPT_SALT_ROUNDS);

    const user = await prisma.user.create({
      data: {
        name: input.name.trim(),
        email: normalizeEmail(input.email),
        password: hashedPassword
      },
      select: publicUserSelect
    });

    return buildAuthResult(user);
  },

  async login(input: { email: string; password: string }): Promise<AuthResult> {
    const user = await prisma.user.findUnique({
      where: { email: normalizeEmail(input.email) }
    });

    if (!user) {
      throw new AppError('Credenciales inválidas', 401);
    }

    const passwordMatches = await comparePassword(input.password, user.password);

    if (!passwordMatches) {
      throw new AppError('Credenciales inválidas', 401);
    }

    return buildAuthResult({
      id: user.id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    });
  },

  async getProfile(userId: string): Promise<PublicUser> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: publicUserSelect
    });

    if (!user) {
      throw new AppError('Usuario no encontrado', 404);
    }

    return user;
  }
};
