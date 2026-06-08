import type { NextFunction, Request, RequestHandler, Response } from 'express';
import type { ZodTypeAny } from 'zod';

import { AppError } from '../utils/appError';

type RequestProperty = 'body' | 'params' | 'query';

export const validateRequest = (schema: ZodTypeAny, property: RequestProperty): RequestHandler => {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req[property]);

    if (!result.success) {
      return next(new AppError('Validation error', 400, result.error.flatten()));
    }

    if (property === 'query') {
      Object.defineProperty(req, 'query', { value: result.data, writable: true, configurable: true });
    } else {
      const request = req as Request & Record<RequestProperty, unknown>;
      request[property] = result.data;
    }

    return next();
  };
};
