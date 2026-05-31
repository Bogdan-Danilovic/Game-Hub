import { test, expect } from '@playwright/test';

// Tests Google sign-in button presence and interaction.
// The actual OAuth popup cannot complete in CI — we verify UI state only.

test.describe('Google Login', () => {
  test('dugme za Google prijavu postoji u headeru', async ({ page }) => {
    await page.goto('/');

    // AuthHeaderSlot renders GoogleSignInButton when user is not logged in
    const btn = page.getByRole('button', { name: /Nastavi sa Google-om/i }).first();
    await expect(btn).toBeVisible({ timeout: 6000 });
  });

  test('klik prikazuje loading stanje', async ({ page }) => {
    await page.goto('/');

    const btn = page.getByRole('button', { name: /Nastavi sa Google-om/i }).first();
    await expect(btn).toBeVisible({ timeout: 6000 });

    // signInWithPopup opens a popup — close it immediately so the test
    // doesn't hang waiting for a Google OAuth page
    page.on('popup', (popup) => {
      void popup.close();
    });

    await btn.click();

    // GoogleSignInButton transitions to "Prijavljivanje..." while loading
    await expect(
      page.getByRole('button', { name: /Prijavljivanje/i }).first()
    ).toBeVisible({ timeout: 3000 });
  });

  test('dugme za prijavu postoji i u guest baneru', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.removeItem('guest_banner_dismissed');
    });
    await page.goto('/');

    // GuestBanner also contains a GoogleSignInButton
    await expect(
      page.getByText('Prijavi se da sačuvaš statistike i dodaš prijatelje')
    ).toBeVisible({ timeout: 6000 });

    // Both header and banner render a GoogleSignInButton
    const btns = page.getByRole('button', { name: /Nastavi sa Google-om/i });
    await expect(btns).toHaveCount(2);
  });
});
