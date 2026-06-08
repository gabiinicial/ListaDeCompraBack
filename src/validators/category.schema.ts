import { z } from 'zod';

export const listIdParamsSchema = z.object({
  listId: z.string().uuid('El identificador de la lista no es válido')
});

export const categoryIdParamsSchema = z.object({
  categoryId: z.string().uuid('El identificador de la categoría no es válido')
});

const categoryNameSchema = z
  .string()
  .trim()
  .min(2, 'El nombre de la categoría debe tener al menos 2 caracteres')
  .max(80, 'El nombre no puede superar 80 caracteres');

const categoryColorSchema = z
  .string()
  .trim()
  .regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, 'El color debe ser un código hexadecimal válido');

export const createCategorySchema = z.object({
  name: categoryNameSchema,
  color: categoryColorSchema.nullable().optional()
});

export const updateCategorySchema = z
  .object({
    name: categoryNameSchema.optional(),
    color: categoryColorSchema.nullable().optional()
  })
  .refine((value) => Object.values(value).some((entry) => entry !== undefined), {
    message: 'Debes enviar al menos un campo para actualizar'
  });
