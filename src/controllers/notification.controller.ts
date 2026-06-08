import type { Request, Response } from 'express';

import { AppError } from '../utils/appError';
import { sendSuccess } from '../utils/apiResponse';
import { notificationService } from '../services/notification.service';

export const notificationController = {
  findAll: async (req: Request, res: Response) => {
    const userId = req.user?.userId;

    if (!userId) {
      throw new AppError('No autorizado', 401);
    }

    const notifications = await notificationService.findAllByUser(userId);
    return sendSuccess(res, 'Notificaciones obtenidas correctamente', notifications);
  },

  unreadCount: async (req: Request, res: Response) => {
    const userId = req.user?.userId;

    if (!userId) {
      throw new AppError('No autorizado', 401);
    }

    const count = await notificationService.countUnreadByUser(userId);
    return sendSuccess(res, 'Conteo de notificaciones no leídas obtenido correctamente', { count });
  },

  markAsRead: async (req: Request, res: Response) => {
    const userId = req.user?.userId;

    if (!userId) {
      throw new AppError('No autorizado', 401);
    }

    const notification = await notificationService.markAsRead(userId, req.params.notificationId);
    return sendSuccess(res, 'Notificación marcada como leída', notification);
  }
};
