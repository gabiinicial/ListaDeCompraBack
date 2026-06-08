import type { Request, Response } from 'express';

import { AppError } from '../utils/appError';
import { sendSuccess } from '../utils/apiResponse';
import { itemService } from '../services/item.service';

export const itemController = {
  create: async (req: Request, res: Response) => {
    const userId = req.user?.userId;

    if (!userId) {
      throw new AppError('No autorizado', 401);
    }

    const item = await itemService.create(userId, req.params.listId as string, req.body);
    return sendSuccess(res, 'Ítem creado correctamente', item, 201);
  },

  findAllByList: async (req: Request, res: Response) => {
    const userId = req.user?.userId;

    if (!userId) {
      throw new AppError('No autorizado', 401);
    }

    const items = await itemService.findAllByList(userId, req.params.listId as string, req.query.categoryId as string | undefined);
    return sendSuccess(res, 'Ítems obtenidos correctamente', items);
  },

  findById: async (req: Request, res: Response) => {
    const userId = req.user?.userId;

    if (!userId) {
      throw new AppError('No autorizado', 401);
    }

    const item = await itemService.findById(userId, req.params.itemId as string);
    return sendSuccess(res, 'Ítem obtenido correctamente', item);
  },

  update: async (req: Request, res: Response) => {
    const userId = req.user?.userId;

    if (!userId) {
      throw new AppError('No autorizado', 401);
    }

    const item = await itemService.update(userId, req.params.itemId as string, req.body);
    return sendSuccess(res, 'Ítem actualizado correctamente', item);
  },

  remove: async (req: Request, res: Response) => {
    const userId = req.user?.userId;

    if (!userId) {
      throw new AppError('No autorizado', 401);
    }

    const item = await itemService.remove(userId, req.params.itemId as string);
    return sendSuccess(res, 'Ítem eliminado correctamente', item);
  }
};
