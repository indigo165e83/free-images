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

  // 3. ファイル名の作成 (被らないように日時をつける)
  const buffer = Buffer.from(await file.arrayBuffer());
  const fileName = `${Date.now()}-${file.name.replace(/\s/g, "_")}`;

  // 4. AWS S3へアップロード
  try {
    const command = new PutObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: fileName,
      Body: buffer,
      ContentType: file.type,
    });
    await s3Client.send(command);
  } catch (error) {
    console.error("S3 Upload Error:", error);
    throw new Error("S3へのアップロードに失敗しました");
  }

  // 5. データベースにURLを保存
  // S3の公開URL形式: https://{バケット名}.s3.{リージョン}.amazonaws.com/{ファイル名}
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