import type { NextFunction, Request, Response } from 'express';

import { env } from '../config/env';
import { AppError } from '../utils/appError';
import { verifyToken } from '../utils/jwt';

export const authenticate = (req: Request, _res: Response, next: NextFunction) => {
  const authorizationHeader = req.headers.authorization;

  if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
    return next(new AppError('Token no proporcionado', 401));
  }

  const token = authorizationHeader.slice(7).trim();

  try {
    const payload = verifyToken(token, env.JWT_SECRET);

    req.user = {
      userId: payload.userId,
      email: payload.email
    };

    return next();
  } catch {
    return next(new AppError('Token inválido o expirado', 401));
  }
};
