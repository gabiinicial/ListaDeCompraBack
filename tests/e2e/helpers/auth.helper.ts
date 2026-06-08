import { Page } from '@playwright/test';

export const E2E_USER = {
  name: 'E2E Tester',
  email: 'e2e.tester@grocerypro.test',
  password: 'E2ePassword123!'
};

export const API_URL = process.env.E2E_API_URL ?? 'http://localhost:4000';

/** Registra el usuario vía API si no existe (ignora el 409). */
export async function ensureUserRegistered(): Promise<void> {
  const res = await fetch(`${API_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(E2E_USER)
  });

  if (!res.ok && res.status !== 409) {
    const body = await res.json();
    throw new Error(`Registro fallido: ${body.message}`);
  }
}

/** Inicia sesión vía API y guarda el token en localStorage. */
export async function loginViaApi(page: Page): Promise<string> {
  const res = await fetch(`${API_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: E2E_USER.email, password: E2E_USER.password })
  });

  const body = await res.json();
  if (!body.success) throw new Error(`Login fallido: ${body.message}`);

  const { token, user } = body.data;

  // Inyectar la sesión en localStorage para que la app la detecte
  await page.goto('/');
  await page.evaluate(
    ({ t, u }) => {
      localStorage.setItem('auth_token', t);
      localStorage.setItem('auth_user', JSON.stringify(u));
    },
    { t: token, u: user }
  );

  return token;
}
