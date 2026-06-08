import { z } from 'zod';

const nameSchema = z
  .string()
  .trim()
  .min(2, 'El nombre debe tener al menos 2 caracteres')
  .max(100, 'El nombre no puede superar 100 caracteres');

const emailSchema = z
  .string()
  .trim()
  .email('El correo no es válido')
  .max(255, 'El correo no puede superar 255 caracteres');

const passwordSchema = z
  .string()
  .min(8, 'La contraseña debe tener al menos 8 caracteres')
  .max(128, 'La contraseña no puede superar 128 caracteres');

export const registerSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  password: passwordSchema
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'La contraseña es obligatoria')
});
