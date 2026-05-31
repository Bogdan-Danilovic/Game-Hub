import { test, expect } from '@playwright/test';

// Full flow requires a logged-in Firebase user with profile.username === ''.
// Set PLAYWRIGHT_TEST_EMAIL + PLAYWRIGHT_TEST_PASSWORD to run against a real project,
// or start the Firebase emulator and set FIREBASE_AUTH_EMULATOR_HOST.
// Without those env vars the auth-required tests are skipped.

const hasAuthCreds =
  !!process.env.PLAYWRIGHT_TEST_EMAIL && !!process.env.PLAYWRIGHT_TEST_PASSWORD;

test.describe('Username Setup Modal', () => {
  test('modal sadrži ispravan naslov i input', async ({ page }) => {
    test.skip(!hasAuthCreds, 'Potrebni PLAYWRIGHT_TEST_EMAIL i PLAYWRIGHT_TEST_PASSWORD');

    await page.goto('/');

    await expect(page.getByText('Izaberi korisničko ime')).toBeVisible({ timeout: 8000 });
    await expect(page.getByPlaceholder('korisnicko_ime')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Potvrdi' })).toBeDisabled();
  });

  test('prikazuje grešku za prekratko ime', async ({ page }) => {
    test.skip(!hasAuthCreds, 'Potrebni PLAYWRIGHT_TEST_EMAIL i PLAYWRIGHT_TEST_PASSWORD');

    await page.goto('/');
    await expect(page.getByPlaceholder('korisnicko_ime')).toBeVisible({ timeout: 8000 });

    await page.getByPlaceholder('korisnicko_ime').fill('ab');

    await expect(page.getByText('Neispravan format korisničkog imena.')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Potvrdi' })).toBeDisabled();
  });

  test('prikazuje grešku za specijalne karaktere', async ({ page }) => {
    test.skip(!hasAuthCreds, 'Potrebni PLAYWRIGHT_TEST_EMAIL i PLAYWRIGHT_TEST_PASSWORD');

    await page.goto('/');
    await expect(page.getByPlaceholder('korisnicko_ime')).toBeVisible({ timeout: 8000 });

    await page.getByPlaceholder('korisnicko_ime').fill('ime sa razmakom');

    await expect(page.getByText('Neispravan format korisničkog imena.')).toBeVisible();
  });

  test('prikazuje grešku za zauzeto korisničko ime', async ({ page }) => {
    test.skip(!hasAuthCreds, 'Potrebni PLAYWRIGHT_TEST_EMAIL i PLAYWRIGHT_TEST_PASSWORD');

    // Mock the Firestore usernames lookup to return "exists"
    await page.route('**/documents/usernames/**', (route) => {
      void route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ fields: { uid: { stringValue: 'other-uid' } } }),
      });
    });

    await page.goto('/');
    await expect(page.getByPlaceholder('korisnicko_ime')).toBeVisible({ timeout: 8000 });

    await page.getByPlaceholder('korisnicko_ime').fill('zauzeto_ime');

    await expect(page.getByText('Korisničko ime je zauzeto.')).toBeVisible({ timeout: 3000 });
    await expect(page.getByRole('button', { name: 'Potvrdi' })).toBeDisabled();
  });
});
