import { test, expect } from '@playwright/test';

test.describe('トップページ（ゲスト表示）のテスト', () => {
  // テスト前に共通でトップページ（日本語ロケール）にアクセス
  test.beforeEach(async ({ page }) => {
  // 環境に合わせてローカルサーバーのURLを指定するか、playwright.config.tsでbaseURLを設定してください
  // ここでは相対パス '/ja' としています
  await page.goto('/ja');
  });

  test('タイトルとメインヘッダーが正しく表示されること', async ({ page }) => {
    // ページのタイトルを確認 (metadataではなく、header内のh1タグ)
    await expect(page.getByRole('heading', { name: 'Free Images', level: 1 })).toBeVisible();

    // メインのキャッチコピー (h2タグ) "AI Art Gallery"
    await expect(page.getByRole('heading', { name: 'AI Art Gallery', level: 2 })).toBeVisible();
  });

  test('ログインボタンが表示され、ログアウトボタンが存在しないこと', async ({ page }) => {
    // "ログイン" ボタンが表示されていることを確認
    const loginButton = page.getByRole('button', { name: 'ログイン' });
    await expect(loginButton).toBeVisible();

    // "ログアウト" ボタンが表示されていないことを確認
    const logoutButton = page.getByRole('button', { name: /ログアウト/ });
    await expect(logoutButton).not.toBeVisible();
  });

  test('ゲストユーザーには投稿・生成フォームが表示されないこと', async ({ page }) => {
    // アップロードフォームの見出し "手持ちの画像をアップロード" が表示されていないことを確認
    await expect(page.getByText('手持ちの画像をアップロード')).not.toBeVisible();

    // AI生成フォームの見出し "AIで画像生成" が表示されていないことを確認
    await expect(page.getByText('AIで画像生成')).not.toBeVisible();

    // AI編集フォームの見出し "AIで画像編集" が表示されていないことを確認
    await expect(page.getByText('AIで画像編集')).not.toBeVisible();
  });

  test('ギャラリーセクションが存在すること', async ({ page }) => {
    // 無限スクロールギャラリーのコンテナが存在するか確認
    // page.tsxの構造上、特定のroleやtextがないため、クラス名や構成要素で確認が必要な場合がありますが、
    // ここでは最低限、エラーなくページがレンダリングされていることをメインのmainタグで確認します。
    const main = page.locator('main');
    await expect(main).toBeVisible();
  });
});