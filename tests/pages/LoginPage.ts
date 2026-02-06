import { type Page, type Locator } from '@playwright/test';

export class LoginPage {
  readonly page: Page;
  readonly loginButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.loginButton = page.getByRole('button', { name: 'ログイン' });
  }

  async loginAsAdmin() {
    await this.page.goto('/ja');
    await this.loginButton.click();
    // ここにNextAuth（Google等）の認証フロー、またはモックログインの操作を記述します
    // ログイン完了後の画面遷移を待機
    await this.page.waitForURL(/\/ja/);
  }
}