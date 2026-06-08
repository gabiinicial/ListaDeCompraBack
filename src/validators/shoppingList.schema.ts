import { ListPrivacy } from '@prisma/client';
import { z } from 'zod';

export const shoppingListIdParamsSchema = z.object({
  id: z.string().uuid('El identificador de la lista no es válido')
});

export const createShoppingListSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(120, 'El nombre no puede superar 120 caracteres'),
  description: z
    .string()
    .trim()
    .max(500, 'La descripción no puede superar 500 caracteres')
    .optional(),
  privacy: z.nativeEnum(ListPrivacy).optional()
});

export const updateShoppingListSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, 'El nombre debe tener al menos 2 caracteres')
      .max(120, 'El nombre no puede superar 120 caracteres')
      .optional(),
    description: z
      .string()
      .trim()
      .max(500, 'La descripción no puede superar 500 caracteres')
      .nullable()
      .optional(),
    privacy: z.nativeEnum(ListPrivacy).optional()
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: 'Debes enviar al menos un campo para actualizar'
  });
