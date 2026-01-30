// ローカル環境でS3上の既存画像をWebPに変換するスクリプト
import { S3Client, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { PrismaClient } from "@prisma/client";
import sharp from "sharp";
import dotenv from "dotenv";

// 環境変数を読み込む
dotenv.config();

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const prisma = new PrismaClient();
const BUCKET_NAME = process.env.AWS_BUCKET_NAME!;

async function main() {
  console.log("🚀 Starting S3 Image Conversion to WebP...");

  // 1. データベースからすべての画像を取得
  const images = await prisma.image.findMany();
  console.log(`Found ${images.length} images in database.`);

  for (const image of images) {
    // すでにWebPならスキップ
    if (image.url.endsWith(".webp")) {
      console.log(`Skipping (already WebP): ${image.id}`);
      continue;
    }

    try {
      // URLからS3のキー（ファイルパス）を抽出
      // 例: https://bucket.s3.region.amazonaws.com/public/2026/01/30/image.jpg
      // -> public/2026/01/30/image.jpg
      const urlObj = new URL(image.url);
      const key = urlObj.pathname.substring(1); // 先頭の / を削除

      console.log(`Processing: ${key}`);

      // 2. S3から画像をダウンロード
      const getCommand = new GetObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
      });
      const s3Object = await s3Client.send(getCommand);
      
      if (!s3Object.Body) throw new Error("No body in S3 object");
      
      // ストリームをバッファに変換
      const byteArray = await s3Object.Body.transformToByteArray();
      const inputBuffer = Buffer.from(byteArray);

      // 3. SharpでWebPに変換
      const webpBuffer = await sharp(inputBuffer)
        .rotate()
        .webp({ quality: 80 })
        .toBuffer();

      // 新しいファイル名（拡張子を.webpに変更）
      const newKey = key.replace(/\.[^/.]+$/, "") + ".webp";
      
      // 4. S3にWebP画像をアップロード
      await s3Client.send(new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: newKey,
        Body: webpBuffer,
        ContentType: "image/webp",
      }));

      // 5. データベースのURLを更新
      const newUrl = image.url.replace(/\.[^/.]+$/, "") + ".webp";
      await prisma.image.update({
        where: { id: image.id },
        data: { url: newUrl },
      });

      console.log(`✅ Converted & Updated: ${newKey}`);

      // (オプション) 古い画像を削除する場合
      // await s3Client.send(new DeleteObjectCommand({ Bucket: BUCKET_NAME, Key: key }));

    } catch (error) {
      console.error(`❌ Failed to process image ${image.id}:`, error);
    }
  }

  console.log("🎉 All done!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());