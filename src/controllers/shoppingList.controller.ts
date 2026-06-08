import type { Request, Response } from 'express';

import { AppError } from '../utils/appError';
import { sendSuccess } from '../utils/apiResponse';
import { shoppingListService } from '../services/shoppingList.service';

export const shoppingListController = {
  create: async (req: Request, res: Response) => {
    const userId = req.user?.userId;

    if (!userId) {
      throw new AppError('No autorizado', 401);
    }

    const shoppingList = await shoppingListService.create(userId, req.body);
    return sendSuccess(res, 'Lista creada correctamente', shoppingList, 201);
  },

  findAll: async (req: Request, res: Response) => {
    const userId = req.user?.userId;

    if (!userId) {
      throw new AppError('No autorizado', 401);
    }

    const shoppingLists = await shoppingListService.findAll(userId);
    return sendSuccess(res, 'Listas obtenidas correctamente', shoppingLists);
  },

  findById: async (req: Request, res: Response) => {
    const userId = req.user?.userId;

    if (!userId) {
      throw new AppError('No autorizado', 401);
    }

    const shoppingList = await shoppingListService.findById(userId, req.params.id);
    return sendSuccess(res, 'Lista obtenida correctamente', shoppingList);
  },

  update: async (req: Request, res: Response) => {
    const userId = req.user?.userId;

    if (!userId) {
      throw new AppError('No autorizado', 401);
    }

    const shoppingList = await shoppingListService.update(userId, req.params.id, req.body);
    return sendSuccess(res, 'Lista actualizada correctamente', shoppingList);
  },

  remove: async (req: Request, res: Response) => {
    const userId = req.user?.userId;

    if (!userId) {
      throw new AppError('No autorizado', 401);
    }

    const shoppingList = await shoppingListService.remove(userId, req.params.id);
    return sendSuccess(res, 'Lista eliminada correctamente', shoppingList);
  }
};
