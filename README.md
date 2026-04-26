# Free Images

AI 画像生成・共有プラットフォーム。テキストプロンプトから画像を生成し、タグで整理・検索できるギャラリーアプリです。

🌐 **https://free-images.indigo165e83.com**

[![Playwright Tests](https://github.com/indigo165e83/free-images/actions/workflows/playwright.yml/badge.svg)](https://github.com/indigo165e83/free-images/actions/workflows/playwright.yml)

## 機能

- **AI 画像生成** — テキストプロンプトから OpenAI で画像を生成
- **画像アップロード** — 手持ちの画像をアップロード（最大 4MB）
- **AI 画像編集** — アップロード画像をプロンプトで編集（img2img）
- **自動タグ付け** — Gemini API でアップロード・生成画像にタグを自動付与
- **タグ絞り込み** — 700 件超のタグをモーダルで管理・フィルタリング
- **全文検索** — キーワード・タグによるインクリメンタル検索
- **無限スクロール** — Intersection Observer による遅延ロード
- **多言語対応** — 日本語 / 英語（next-intl）
- **認証** — NextAuth v5 + Google OAuth（ADMIN / USER ロール）

## 技術スタック

| カテゴリ | 採用技術 |
|---|---|
| フレームワーク | Next.js 16 (App Router, Turbopack) |
| 言語 | TypeScript |
| スタイリング | Tailwind CSS v4 |
| DB | PostgreSQL + Prisma |
| 認証 | NextAuth v5 (@auth/prisma-adapter) |
| ストレージ | AWS S3 |
| AI | OpenAI API, Google Gemini API |
| i18n | next-intl |
| テスト | Playwright |
| パッケージ管理 | pnpm |

## 開発環境のセットアップ

### 前提条件

- Node.js 20+
- pnpm
- Docker（ローカル DB 用）

### 手順

```bash
# 依存パッケージのインストール
pnpm install

# PostgreSQL を起動（Docker）
docker compose up -d

# 環境変数を設定
cp .env.example .env.local
# .env.local を編集（後述）

# DB マイグレーション
pnpm prisma migrate dev

# 開発サーバー起動
pnpm dev
```

[http://localhost:3000](http://localhost:3000) でアクセスできます。

### 必要な環境変数

```env
# データベース
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/freeimages"

# NextAuth
AUTH_SECRET=""
AUTH_GOOGLE_ID=""
AUTH_GOOGLE_SECRET=""

# AWS S3
AWS_REGION=""
AWS_ACCESS_KEY_ID=""
AWS_SECRET_ACCESS_KEY=""
AWS_S3_BUCKET_NAME=""

# AI
OPENAI_API_KEY=""
GOOGLE_GENERATIVE_AI_API_KEY=""
```

## スクリプト

```bash
pnpm dev        # 開発サーバー（Turbopack）
pnpm build      # 本番ビルド（prisma migrate deploy → next build）
pnpm start      # 本番サーバー起動
pnpm lint       # ESLint
```

## ディレクトリ構成

```
app/
  [locale]/        # ロケール別ルート（ja / en）
    create/        # 画像生成・アップロード
    image/[id]/    # 画像詳細
    tags/          # タグ一覧
    tips/          # 使い方
  actions/         # Server Actions
  api/             # API Routes（NextAuth など）
components/        # 共通コンポーネント
messages/          # i18n メッセージ（ja.json / en.json）
prisma/            # スキーマ・マイグレーション
```

## テスト

```bash
pnpm playwright test
```
