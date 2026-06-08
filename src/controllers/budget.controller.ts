import type { Request, Response } from 'express';

import { AppError } from '../utils/appError';
import { sendSuccess } from '../utils/apiResponse';
import { budgetService } from '../services/budget.service';

export const budgetController = {
  getBudget: async (req: Request, res: Response) => {
    const userId = req.user?.userId;

    if (!userId) {
      throw new AppError('No autorizado', 401);
    }

    const budget = await budgetService.getBudgetState(userId, req.params.listId);
    return sendSuccess(res, 'Presupuesto obtenido correctamente', budget);
  },

  upsertBudget: async (req: Request, res: Response) => {
    const userId = req.user?.userId;

    if (!userId) {
      throw new AppError('No autorizado', 401);
    }

    const budget = await budgetService.upsertBudget(userId, req.params.listId, req.body);
    return sendSuccess(res, 'Presupuesto actualizado correctamente', budget);
  }
};
