import type { Request, Response } from 'express';

import { AppError } from '../utils/appError';
import { sendSuccess } from '../utils/apiResponse';
import { categoryService } from '../services/category.service';

export const categoryController = {
  findAllByList: async (req: Request, res: Response) => {
    const userId = req.user?.userId;

    if (!userId) {
      throw new AppError('No autorizado', 401);
    }

    const categories = await categoryService.listByList(userId, req.params.listId as string);
    return sendSuccess(res, 'Categorías obtenidas correctamente', categories);
  },

  create: async (req: Request, res: Response) => {
    const userId = req.user?.userId;

    if (!userId) {
      throw new AppError('No autorizado', 401);
    }

    const category = await categoryService.create(userId, req.params.listId as string, req.body);
    return sendSuccess(res, 'Categoría creada correctamente', category, 201);
  },

  update: async (req: Request, res: Response) => {
    const userId = req.user?.userId;

    if (!userId) {
      throw new AppError('No autorizado', 401);
    }

    const category = await categoryService.update(userId, req.params.categoryId as string, req.body);
    return sendSuccess(res, 'Categoría actualizada correctamente', category);
  },

  remove: async (req: Request, res: Response) => {
    const userId = req.user?.userId;

    if (!userId) {
      throw new AppError('No autorizado', 401);
    }

    const category = await categoryService.remove(userId, req.params.categoryId as string);
    return sendSuccess(res, 'Categoría eliminada correctamente', category);
  }
};
