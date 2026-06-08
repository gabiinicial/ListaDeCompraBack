import { z } from 'zod';

export const notificationIdParamsSchema = z.object({
  notificationId: z.string().uuid('El identificador de la notificación no es válido')
});

export const notificationListQuerySchema = z.object({
  unreadOnly: z
    .preprocess((value) => {
      if (value === undefined || value === null || value === '') return undefined;
      if (value === 'true') return true;
      if (value === 'false') return false;
      return value;
    }, z.boolean().optional())
    .optional()
});
