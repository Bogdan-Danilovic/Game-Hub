import { test, expect } from '@playwright/test';

// GuestBanner renders when isGuest=true AND localStorage has no dismissed flag.
// Firebase fires onAuthStateChanged(null) for unauthenticated users — no mock needed.

test.describe('Guest Banner', () => {
  test.beforeEach(async ({ page }) => {
    // Clear dismissed flag so banner can show
    await page.addInitScript(() => {
      localStorage.removeItem('guest_banner_dismissed');
    });
  });

  test('prikazuje baner nelogovanom korisniku', async ({ page }) => {
    await page.goto('/');

    // Banner appears after Firebase resolves auth state (null → isGuest=true)
    // and after the useEffect reads localStorage (dismissed=false)
    await expect(
      page.getByText('Prijavi se da sačuvaš statistike i dodaš prijatelje')
    ).toBeVisible({ timeout: 6000 });

    await expect(
      page.getByRole('button', { name: /Nastavi sa Google-om/i })
    ).toBeVisible();
  });

  test('klik × skriva baner', async ({ page }) => {
    await page.goto('/');

    await expect(
      page.getByText('Prijavi se da sačuvaš statistike i dodaš prijatelje')
    ).toBeVisible({ timeout: 6000 });

    await page.getByRole('button', { name: 'Zatvori baner' }).click();

    await expect(
      page.getByText('Prijavi se da sačuvaš statistike i dodaš prijatelje')
    ).not.toBeVisible();
  });

  test('baner ostaje sakriven posle reload-a', async ({ page }) => {
    await page.goto('/');

    await expect(
      page.getByText('Prijavi se da sačuvaš statistike i dodaš prijatelje')
    ).toBeVisible({ timeout: 6000 });

    await page.getByRole('button', { name: 'Zatvori baner' }).click();
    await page.reload();

    // localStorage persists the dismissed flag across reload
    await expect(
      page.getByText('Prijavi se da sačuvaš statistike i dodaš prijatelje')
    ).not.toBeVisible({ timeout: 3000 });
  });

  test('ne prikazuje baner kad je vec odbacen', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('guest_banner_dismissed', 'true');
    });

    await page.goto('/');

    await expect(
      page.getByText('Prijavi se da sačuvaš statistike i dodaš prijatelje')
    ).not.toBeVisible({ timeout: 3000 });
  });
});
