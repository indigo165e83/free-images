import { test as setup, expect } from '@playwright/test';
import { STORAGE_STATE } from '../playwright.config';
import { LoginPage } from './pages/LoginPage';

// プロセス環境変数から読み込み
const email = process.env.TEST_ADMIN_EMAIL;
const password = process.env.TEST_ADMIN_PASSWORD;

if (!email || !password) {
  throw new Error('Test email or password is not defined in .env file');
}

setup('authenticate as admin', async ({ page }) => {
// 環境変数が効いていない場合、Credentialsプロバイダーが出ないため確認
  console.log('Testing with NODE_ENV:', process.env.NODE_ENV);

  // 1. ログインページ（またはトップページ）へ移動
  await page.goto('/ja');
  // 2. NextAuthのデフォルトログインページへ（signIn('google')を使っているボタンではなく、直接URLを叩くか、専用ボタンを作る手もありますが、ここでは標準的なフローを想定）
  // アプリの構成上、ボタンを押すとGoogleログインに直行してしまう場合は、
  // URLパラメータでプロバイダー指定するなどの工夫がいりますが、
  // 一番確実なのは「テスト環境なら /api/auth/signin に直接アクセスしてフォームを使う」方法です。

  // 直接サインインページへ移動 callbackUrl を指定して /ja に戻るようにする
  await page.goto('/api/auth/signin?callbackUrl=/ja');

  // フォームが表示されるまで少し待つ（念のため）
  await page.waitForSelector('input[name="email"]');

  // 3. テスト用ログインフォームに入力
  // (NextAuth v5のデフォルトUIのIDを想定していますが、DOM構造により調整が必要な場合があります)
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  
  // 4. "Sign in with Test Login" ボタンをクリック
  await page.getByRole('button', { name: 'Sign in with Test Login' }).click();

  // 5. ログイン完了（トップページへのリダイレクト）を待機
  await page.waitForURL('**/ja', { timeout: 30000 });

  // 6. ログイン状態（管理者メニューが表示されているか）を確認
  await expect(page.getByText('AIで画像生成')).toBeVisible();

  // 7. セッション状態をファイルに保存
  await page.context().storageState({ path: STORAGE_STATE });

  /*
  const loginPage = new LoginPage(page);
  await loginPage.loginAsAdmin();

  // セッション状態（Cookie等）をファイルに保存
  await page.context().storageState({ path: adminFile });
  */
});