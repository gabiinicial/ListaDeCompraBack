import { z } from 'zod';

export const listIdParamsSchema = z.object({
  listId: z.string().uuid('El identificador de la lista no es válido')
});

export const itemIdParamsSchema = z.object({
  itemId: z.string().uuid('El identificador del ítem no es válido')
});

export const categoryIdParamsSchema = z.object({
  categoryId: z.string().uuid('El identificador de la categoría no es válido')
});

export const notificationIdParamsSchema = z.object({
  notificationId: z.string().uuid('El identificador de la notificación no es válido')
});
