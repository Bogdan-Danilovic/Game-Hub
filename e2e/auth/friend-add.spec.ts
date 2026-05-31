import { test, expect, type Page } from '@playwright/test';

// FriendSearch is inside ProfileModal, which requires a logged-in user.
// Set PLAYWRIGHT_TEST_EMAIL + PLAYWRIGHT_TEST_PASSWORD to run these tests.
// Without them, all tests are skipped.

const hasAuthCreds =
  !!process.env.PLAYWRIGHT_TEST_EMAIL && !!process.env.PLAYWRIGHT_TEST_PASSWORD;

function mockUserSearch(page: Page, found: boolean) {
  const body = found
    ? JSON.stringify({
        documents: [{
          name: 'projects/p/databases/(default)/documents/users/found-uid',
          fields: {
            displayName: { stringValue: 'Test Korisnik' },
            username: { stringValue: 'test_korisnik' },
            photoURL: { stringValue: '' },
            friends: { arrayValue: { values: [] } },
          },
        }],
      })
    : JSON.stringify({ documents: [] });

  return page.route('**/documents/users**username**', (route) => {
    void route.fulfill({ status: 200, contentType: 'application/json', body });
  });
}

test.describe('Friend Add', () => {
  test('input za pretragu postoji u ProfileModal', async ({ page }) => {
    test.skip(!hasAuthCreds, 'Potrebni PLAYWRIGHT_TEST_EMAIL i PLAYWRIGHT_TEST_PASSWORD');

    await page.goto('/');
    await page.getByRole('button', { name: /profil/i }).click();

    await expect(page.getByPlaceholder('Pretraži po username-u')).toBeVisible({ timeout: 5000 });
  });

  test('pretraga manja od 3 karaktera ne trigeruje zahtev', async ({ page }) => {
    test.skip(!hasAuthCreds, 'Potrebni PLAYWRIGHT_TEST_EMAIL i PLAYWRIGHT_TEST_PASSWORD');

    let searchCalled = false;
    await page.route('**/documents/users**username**', () => { searchCalled = true; });

    await page.goto('/');
    await page.getByRole('button', { name: /profil/i }).click();
    await expect(page.getByPlaceholder('Pretraži po username-u')).toBeVisible({ timeout: 5000 });

    await page.getByPlaceholder('Pretraži po username-u').fill('ab');
    await page.waitForTimeout(500);

    expect(searchCalled).toBe(false);
  });

  test('prikazuje grešku za nepostojeći username', async ({ page }) => {
    test.skip(!hasAuthCreds, 'Potrebni PLAYWRIGHT_TEST_EMAIL i PLAYWRIGHT_TEST_PASSWORD');

    await mockUserSearch(page, false);

    await page.goto('/');
    await page.getByRole('button', { name: /profil/i }).click();
    await expect(page.getByPlaceholder('Pretraži po username-u')).toBeVisible({ timeout: 5000 });

    await page.getByPlaceholder('Pretraži po username-u').fill('nepostojeci_user');

    await expect(page.getByText('Korisnik nije pronađen.')).toBeVisible({ timeout: 3000 });
  });

  test('prikazuje dugme Dodaj kad se korisnik pronađe', async ({ page }) => {
    test.skip(!hasAuthCreds, 'Potrebni PLAYWRIGHT_TEST_EMAIL i PLAYWRIGHT_TEST_PASSWORD');

    await mockUserSearch(page, true);

    await page.goto('/');
    await page.getByRole('button', { name: /profil/i }).click();
    await expect(page.getByPlaceholder('Pretraži po username-u')).toBeVisible({ timeout: 5000 });

    await page.getByPlaceholder('Pretraži po username-u').fill('test_korisnik');

    await expect(page.getByText('Test Korisnik')).toBeVisible({ timeout: 3000 });
    await expect(page.getByRole('button', { name: 'Dodaj' })).toBeVisible();
  });

  test('sprečava dodavanje sebe', async ({ page }) => {
    test.skip(!hasAuthCreds, 'Potrebni PLAYWRIGHT_TEST_EMAIL i PLAYWRIGHT_TEST_PASSWORD');

    // Mock returns the same uid as the logged-in test user
    await page.route('**/documents/users**username**', (route) => {
      void route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          documents: [{
            name: 'projects/p/databases/(default)/documents/users/current-user-uid',
            fields: {
              displayName: { stringValue: 'Ja Sam' },
              username: { stringValue: 'ja_sam' },
              photoURL: { stringValue: '' },
              friends: { arrayValue: { values: [] } },
            },
          }],
        }),
      });
    });

    await page.goto('/');
    await page.getByRole('button', { name: /profil/i }).click();
    await expect(page.getByPlaceholder('Pretraži po username-u')).toBeVisible({ timeout: 5000 });

    await page.getByPlaceholder('Pretraži po username-u').fill('ja_sam');
    await expect(page.getByRole('button', { name: 'Dodaj' })).toBeVisible({ timeout: 3000 });

    await page.getByRole('button', { name: 'Dodaj' }).click();

    await expect(page.getByText('Ne možeš dodati sebe.')).toBeVisible();
  });
});
