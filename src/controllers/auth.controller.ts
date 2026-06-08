import type { Request, Response } from 'express';

import { AppError } from '../utils/appError';
import { sendSuccess } from '../utils/apiResponse';
import { authService } from '../services/auth.service';

export const authController = {
  register: async (req: Request, res: Response) => {
    const result = await authService.register(req.body);
    return sendSuccess(res, 'Usuario registrado correctamente', result, 201);
  },

  login: async (req: Request, res: Response) => {
    const result = await authService.login(req.body);
    return sendSuccess(res, 'Inicio de sesión correcto', result);
  },

  me: async (req: Request, res: Response) => {
    const userId = req.user?.userId;

    if (!userId) {
      throw new AppError('No autorizado', 401);
    }

    const user = await authService.getProfile(userId);
    return sendSuccess(res, 'Perfil obtenido correctamente', user);
  }
};
