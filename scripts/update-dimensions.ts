/**
 * S3上の既存画像のサイズ情報を更新するスクリプト
 * 
 * 使い方:
 * - 通常実行: npx tsx scripts/update-dimensions.ts
 * - ドライラン: DRY_RUN=true npx tsx scripts/update-dimensions.ts
 */

import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { PrismaClient } from "@prisma/client";
import sharp from "sharp";
import dotenv from "dotenv";

// 環境変数を読み込む
dotenv.config();

const prisma = new PrismaClient();

// S3クライアントの初期化
const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const BUCKET_NAME = process.env.AWS_BUCKET_NAME!;

async function main() {
  const isDryRun = process.env.DRY_RUN === 'true';
  
  console.log("🚀 Starting image dimensions update...");
  console.log(`📊 Mode: ${isDryRun ? 'DRY RUN (no updates)' : 'LIVE UPDATE'}\n`);

  // 全画像を取得
  const images = await prisma.image.findMany({
    select: {
      id: true,
      url: true,
      width: true,
      height: true,
    }
  });

  console.log(`📁 Found ${images.length} images in database\n`);

  let successCount = 0;
  let skipCount = 0;
  let errorCount = 0;

  for (let i = 0; i < images.length; i++) {
    const img = images[i];
    const progress = `[${i + 1}/${images.length}]`;

    try {
      // URLからS3のキー（ファイルパス）を抽出
      // 例: https://bucket.s3.region.amazonaws.com/public/2026/01/30/image.webp
      // -> public/2026/01/30/image.webp
      const urlObj = new URL(img.url);
      const key = urlObj.pathname.substring(1); // 先頭の / を削除

      console.log(`${progress} 🔍 URL: ${img.url}`);
      console.log(`${progress} 🔍 Key: ${key}`);

      // S3から画像を取得
      const command = new GetObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
      });
      
      const s3Response = await s3Client.send(command);
      if (!s3Response.Body) {
        throw new Error("Empty response from S3");
      }

      const buffer = Buffer.from(await s3Response.Body.transformToByteArray());

      // sharpでサイズを計測
      const metadata = await sharp(buffer).metadata();

      if (!metadata.width || !metadata.height) {
        console.log(`${progress} ⚠️  Skipped (no dimensions): ${img.id}`);
        skipCount++;
        continue;
      }

      // 既に正しいサイズが入っている場合はスキップ
      if (img.width === metadata.width && img.height === metadata.height) {
        console.log(`${progress} ✓ Already correct: ${img.id} (${metadata.width}x${metadata.height})`);
        skipCount++;
        continue;
      }

      if (isDryRun) {
        console.log(`${progress} 🔍 Would update: ${img.id} (${img.width}x${img.height} → ${metadata.width}x${metadata.height})`);
        successCount++;
      } else {
        // DB更新
        await prisma.image.update({
          where: { id: img.id },
          data: {
            width: metadata.width,
            height: metadata.height,
          },
        });
        console.log(`${progress} ✅ Updated: ${img.id} (${img.width}x${img.height} → ${metadata.width}x${metadata.height})`);
        successCount++;
      }

    } catch (error: any) {
      console.error(`${progress} ❌ Error processing ${img.id}:`, error.message);
      errorCount++;
    }
  }

  // 結果サマリー
  console.log("\n" + "=".repeat(50));
  console.log("📊 Summary:");
  console.log(`   ✅ ${isDryRun ? 'Would update' : 'Updated'}: ${successCount}`);
  console.log(`   ⚠️  Skipped: ${skipCount}`);
  console.log(`   ❌ Errors: ${errorCount}`);
  console.log(`   📁 Total: ${images.length}`);
  console.log("=".repeat(50));
}

// スクリプト実行
main()
  .catch((error) => {
    console.error("💥 Fatal error:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    console.log("\n✨ Done!");
  });