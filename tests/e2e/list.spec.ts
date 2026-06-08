/**
 * E2E 2 — Lista: el usuario crea una lista y entra al detalle.
 * Requiere: frontend en localhost:3000 y backend en localhost:4000.
 */

import { expect, test } from '@playwright/test';
import { ensureUserRegistered, loginViaApi } from './helpers/auth.helper';

const LIST_NAME = `Lista E2E ${Date.now()}`;

test.beforeAll(async () => {
  await ensureUserRegistered();
});

test('usuario crea una lista y navega al detalle', async ({ page }) => {
  // Login vía API para no repetir pasos de UI
  await loginViaApi(page);
  await page.goto('/');
  await page.waitForLoadState('networkidle');

  // Clic en "Crear Lista"
  await page.click('a[href="/create"], button:has-text("Crear Lista")');
  await page.waitForURL('/create');

  // Completar formulario de creación
  await page.locator('input#name').fill(LIST_NAME);
  await page.click('button[type="submit"]:has-text("Crear Lista")');

  // Debe redirigir al dashboard
  await page.waitForURL('/', { timeout: 10_000 });

  // La lista nueva debe aparecer en el dashboard
  await expect(page.locator(`text=${LIST_NAME}`)).toBeVisible({ timeout: 8_000 });

  // Navegar al detalle de la lista
  await page.locator(`text=${LIST_NAME}`).locator('..').locator('a[aria-label="Ver lista"]').click();

  // Verificar que estamos en la página de detalle
  await expect(page).toHaveURL(/\/lists\/.+/);
  await expect(page.locator(`text=${LIST_NAME}`)).toBeVisible();
});

test('el formulario de creación valida que el nombre sea obligatorio', async ({ page }) => {
  await loginViaApi(page);
  await page.goto('/create');

  // Intentar enviar sin nombre
  await page.click('button[type="submit"]:has-text("Crear Lista")');

  // Debe mostrar error de validación
  const errorMsg = page.locator('p.text-red-500');
  await expect(errorMsg.first()).toBeVisible({ timeout: 3_000 });
  await expect(page).toHaveURL('/create');
});
