import { z } from 'zod';

export const listIdParamsSchema = z.object({
  listId: z.string().uuid('El identificador de la lista no es válido')
});

export const budgetUpdateSchema = z.object({
  totalLimit: z.coerce.number().nonnegative('El presupuesto no puede ser negativo'),
  currency: z
    .string()
    .trim()
    .min(3, 'La moneda debe tener al menos 3 caracteres')
    .max(10, 'La moneda no puede superar 10 caracteres')
    .optional()
});
