import { z } from 'zod';

export const listIdParamsSchema = z.object({
  listId: z.string().uuid('El identificador de la lista no es válido')
});

export const itemIdParamsSchema = z.object({
  itemId: z.string().uuid('El identificador del ítem no es válido')
});

export const itemListQuerySchema = z.object({
  categoryId: z.string().uuid('El identificador de la categoría no es válido').optional(),
  purchased: z
    .preprocess((value) => {
      if (value === undefined || value === null || value === '') return undefined;
      if (value === 'true') return true;
      if (value === 'false') return false;
      return value;
    }, z.boolean().optional())
    .optional()
});

const itemNameSchema = z
  .string()
  .trim()
  .min(1, 'El nombre del ítem es obligatorio')
  .max(150, 'El nombre no puede superar 150 caracteres');

const quantitySchema = z.coerce.number().positive('La cantidad debe ser mayor que 0').max(999999);
const priceSchema = z.coerce.number().nonnegative('El precio no puede ser negativo').max(999999999);
const noteSchema = z.string().trim().max(500, 'La nota no puede superar 500 caracteres');
const imageUrlSchema = z.string().trim().url('La URL de la imagen no es válida').max(2048);

export const createItemSchema = z.object({
  name: itemNameSchema,
  quantity: quantitySchema.optional().default(1),
  price: priceSchema.optional().default(0),
  note: noteSchema.nullable().optional(),
  imageUrl: imageUrlSchema.nullable().optional(),
  categoryId: z.string().uuid('El identificador de la categoría no es válido').nullable().optional(),
  purchased: z.boolean().optional().default(false)
});

export const updateItemSchema = z
  .object({
    name: itemNameSchema.optional(),
    quantity: quantitySchema.optional(),
    price: priceSchema.optional(),
    note: noteSchema.nullable().optional(),
    imageUrl: imageUrlSchema.nullable().optional(),
    categoryId: z.string().uuid('El identificador de la categoría no es válido').nullable().optional(),
    purchased: z.boolean().optional()
  })
  .refine((value) => Object.values(value).some((entry) => entry !== undefined), {
    message: 'Debes enviar al menos un campo para actualizar'
  });
