"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

// S3クライアントの準備
const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export async function uploadImage(formData: FormData) {
  // 1. ログインチェック
  const session = await auth();
  if (!session?.user?.id) throw new Error("ログインが必要です");

  // 2. フォームデータの取得
  const file = formData.get("file") as File;
  const prompt = formData.get("prompt") as string;
  
  if (!file || file.size === 0) return;

  // 3. ファイル名の作成 (日付階層付きに変更)
  const buffer = Buffer.from(await file.arrayBuffer());

  // 日付情報の取得
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');

  // 元のファイル名を安全な形式に変換 (スペースを_に置換)
  const safeOriginalName = file.name.replace(/\s/g, "_");

  // フォルダ構成: public/2026/01/24/{timestamp}-{元のファイル名}
  const fileName = `public/${year}/${month}/${day}/${Date.now()}-${safeOriginalName}`;

  // 4. AWS S3へアップロード
  try {
    const command = new PutObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: fileName, // 階層付きのパスを指定
      Body: buffer,
      ContentType: file.type,
    });
    await s3Client.send(command);
  } catch (error) {
    console.error("S3 Upload Error:", error);
    throw new Error("S3へのアップロードに失敗しました");
  }

  // 5. データベースにURLを保存
  const s3Url = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileName}`;

  await prisma.image.create({
    data: {
      url: s3Url,
      prompt: prompt || "",
      userId: session.user.id,
    },
  });

  // 6. 画面更新
  revalidatePath("/");
}