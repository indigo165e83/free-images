// ページの構造（セレクタ）と、そのページで行う操作をメソッドとしてまとめます。
import { expect, type Locator, type Page } from '@playwright/test';

export class HomePage {
  readonly page: Page;
  readonly loginButton: Locator;
  readonly logoutButton: Locator;
  readonly uploadSectionTitle: Locator;
  readonly aiGenerateSectionTitle: Locator;
  readonly galleryImages: Locator;

  constructor(page: Page) {
    this.page = page;
    // package.json や app/[locale]/page.tsx の文言に基づく
    this.loginButton = page.getByRole('button', { name: 'ログイン' });
    this.logoutButton = page.getByRole('button', { name: /ログアウト/ });
    this.uploadSectionTitle = page.getByText('手持ちの画像をアップロード');
    this.aiGenerateSectionTitle = page.getByText('AIで画像生成');
    this.galleryImages = page.locator('main img'); // ギャラリー内の画像
  }

  async goto(locale: string = 'ja') {
    await this.page.goto(`/${locale}`);
  }

  async clickFirstImage() {
    await this.galleryImages.first().click();
  }

  async expectGuestView() {
    await expect(this.loginButton).toBeVisible();
    await expect(this.logoutButton).not.toBeVisible();
    await expect(this.uploadSectionTitle).not.toBeVisible();
    await expect(this.aiGenerateSectionTitle).not.toBeVisible();
  }
}