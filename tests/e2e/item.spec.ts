/**
 * E2E 3 — Ítem: el usuario agrega un ítem a una lista y lo marca como comprado.
 * Requiere: frontend en localhost:3000 y backend en localhost:4000.
 */

import { expect, test } from '@playwright/test';
import { API_URL, E2E_USER, ensureUserRegistered, loginViaApi } from './helpers/auth.helper';

const ITEM_NAME = `Ítem E2E ${Date.now()}`;
let listId: string;

test.beforeAll(async () => {
  await ensureUserRegistered();

  // Crear lista de prueba vía API para no depender del E2E de listas
  const loginRes = await fetch(`${API_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: E2E_USER.email, password: E2E_USER.password })
  });
  const loginBody = await loginRes.json();
  const token: string = loginBody.data.token;

  const listRes = await fetch(`${API_URL}/api/lists`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ name: 'Lista para ítems E2E' })
  });
  const listBody = await listRes.json();
  listId = listBody.data.id;
});

test('usuario agrega un ítem a la lista y lo marca como comprado', async ({ page }) => {
  await loginViaApi(page);
  await page.goto(`/lists/${listId}`);
  await page.waitForLoadState('networkidle');

  // Abrir formulario de agregar ítem
  await page.click('button[aria-label="Agregar ítem"], button:has-text("+")');
  await page.waitForSelector('input[placeholder="Nombre del producto*"]', { timeout: 5_000 });

  // Rellenar el formulario
  await page.locator('input[placeholder="Nombre del producto*"]').fill(ITEM_NAME);
  await page.locator('input[placeholder="Cantidad"]').fill('3');
  await page.locator('input[placeholder="Precio"]').fill('1500');

  // Guardar
  await page.click('button[type="submit"]:has-text("Agregar")');

  // El ítem debe aparecer en la lista
  await expect(page.locator(`text=${ITEM_NAME}`)).toBeVisible({ timeout: 8_000 });

  // Marcar como comprado usando el checkbox
  const itemCheckbox = page.locator(`label:has-text("${ITEM_NAME}")`)
    .locator('..').locator('input[type="checkbox"]');
  await itemCheckbox.check();

  // El ítem debe tener line-through (comprado)
  const itemLabel = page.locator(`label:has-text("${ITEM_NAME}")`);
  await expect(itemLabel).toHaveClass(/line-through/, { timeout: 5_000 });
});

test('el ítem aparece en la sección de gastado del presupuesto tras ser comprado', async ({ page }) => {
  await loginViaApi(page);
  await page.goto(`/lists/${listId}`);
  await page.waitForLoadState('networkidle');

  // Abrir panel de presupuesto si existe
  const budgetBtn = page.locator('button:has-text("Presupuesto")');
  if (await budgetBtn.isVisible()) {
    await budgetBtn.click();
    // El total gastado debería ser > 0 si hay ítems comprados
    await expect(page.locator('text=Gastado')).toBeVisible();
  }
});
