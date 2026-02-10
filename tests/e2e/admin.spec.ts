import { test, expect } from '@playwright/test';
import { HomePage } from '../pages/HomePage';

test('管理者には画像生成フォームが表示されること', async ({ page }) => {
  test.skip(!process.env.TEST_ADMIN_EMAIL || !process.env.TEST_ADMIN_PASSWORD, 'Admin credentials not configured. Skipping admin test.');

  const homePage = new HomePage(page);
  await homePage.goto('ja');

  // ソースコード app/[locale]/page.tsx の isAdmin 条件に基づき検証
  await expect(homePage.aiGenerateSectionTitle).toBeVisible();
  await expect(page.getByRole('button', { name: 'AIで生成する (タグ自動付与)' })).toBeVisible();
});