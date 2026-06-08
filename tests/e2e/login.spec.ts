/**
 * E2E 1 — Login: el usuario hace login y ve el dashboard.
 * Requiere: frontend en localhost:3000 y backend en localhost:4000.
 */

import { expect, test } from '@playwright/test';
import { E2E_USER, ensureUserRegistered } from './helpers/auth.helper';

test.beforeAll(async () => {
  await ensureUserRegistered();
});

test('usuario hace login con credenciales válidas y llega al dashboard', async ({ page }) => {
  await page.goto('/login');

  // Completar formulario
  await page.locator('input#email').fill(E2E_USER.email);
  await page.locator('input#password').fill(E2E_USER.password);

  // Enviar
  await page.click('button[type="submit"]');

  // Esperar redirección al dashboard
  await page.waitForURL('/', { timeout: 10_000 });

  // Verificar que el dashboard muestre algo del usuario
  await expect(page).toHaveURL('/');
  await expect(page.locator('text=Crear Lista')).toBeVisible();
});

test('muestra error con credenciales incorrectas', async ({ page }) => {
  await page.goto('/login');

  await page.locator('input#email').fill(E2E_USER.email);
  await page.locator('input#password').fill('contraseña-incorrecta-999');
  await page.click('button[type="submit"]');

  // Debe permanecer en /login y mostrar error
  await expect(page).toHaveURL('/login');
  await expect(page.locator('text=Credenciales inválidas')).toBeVisible({ timeout: 5_000 });
});

test('muestra error de validación si el email no tiene formato válido', async ({ page }) => {
  await page.goto('/login');

  await page.locator('input#email').fill('no-es-un-email');
  await page.locator('input#password').fill('Password123!');
  await page.click('button[type="submit"]');

  await expect(page).toHaveURL('/login');
  // El formulario debe mostrar algún error de validación
  const errorMsg = page.locator('p.text-red-500').first();
  await expect(errorMsg).toBeVisible({ timeout: 3_000 });
});

test('redirige al dashboard si ya hay sesión activa', async ({ page }) => {
  // Ir a /login primero para tener contexto
  await page.goto('/login');
  await page.locator('input#email').fill(E2E_USER.email);
  await page.locator('input#password').fill(E2E_USER.password);
  await page.click('button[type="submit"]');
  await page.waitForURL('/');

  // Intentar volver a /login — debería redirigir a /
  await page.goto('/login');
  await page.waitForURL('/', { timeout: 5_000 });
  await expect(page).toHaveURL('/');
});
