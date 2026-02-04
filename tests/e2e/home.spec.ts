import { test, expect } from '@playwright/test';
import { HomePage } from '../pages/HomePage';

test.describe('トップページ（POM(Page Object Model)適用版）', () => {
  let homePage: HomePage;

  test.beforeEach(async ({ page }) => {
    homePage = new HomePage(page);
    await homePage.goto('ja');
  });

  test('ゲストユーザーには管理機能が表示されないこと', async () => {
    // ページオブジェクトに定義した検証メソッドを呼び出す
    await homePage.expectGuestView();
  });

  test('ギャラリーの画像をクリックして詳細へ遷移できること', async ({ page }) => {
    await homePage.clickFirstImage();
    // app/[locale]/image/[id]/page.tsx の構造に基づき遷移を確認
    await expect(page).toHaveURL(/\/image\//);
  });
});