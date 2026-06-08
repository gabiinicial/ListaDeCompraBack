import { Prisma } from '@prisma/client';
import type { ErrorRequestHandler, RequestHandler } from 'express';
import { ZodError } from 'zod';

import { env } from '../config/env';
import { AppError } from '../utils/appError';

export const notFound: RequestHandler = (req, _res, next) => {
  next(new AppError(`Route not found: ${req.originalUrl}`, 404));
};

export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  let statusCode = 500;
  let message = 'Internal server error';
  let details: unknown = null;

  if (error instanceof ZodError) {
    statusCode = 400;
    message = 'Validation error';
    details = error.flatten();
  } else if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2002') {
      statusCode = 409;
      message = 'Resource already exists';
    } else if (error.code === 'P2025') {
      statusCode = 404;
      message = 'Resource not found';
    }
  } else if (error instanceof AppError) {
    statusCode = error.statusCode;
    message = error.message;
    details = error.details ?? null;
  } else if (error instanceof Error) {
    message = error.message;
  }

  if (env.NODE_ENV !== 'production') {
    console.error(error);
  }

  return res.status(statusCode).json({
    success: false,
    message,
    data: null,
    details
  });
};
