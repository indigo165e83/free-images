// app/actions/deleteImage.ts
"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export async function deleteImage(imageId: string) {
  // 1. 権限チェック (管理以外は弾く)
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    throw new Error("権限がありません");
  }

  // 2. 画像情報を取得 (S3のキーを知るため)
  const image = await prisma.image.findUnique({
    where: { id: imageId },
  });

  if (!image) return;

  try {
    // 3. AWS S3からファイルを削除
    // DBのURLからキー部分(public/...)を抽出する処理
    // URL例: https://bucket.s3.region.amazonaws.com/public/2026/...
    const fileKey = image.url.split(".amazonaws.com/")[1];

    if (fileKey) {
      await s3Client.send(new DeleteObjectCommand({
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: fileKey,
      }));
    }

    // 4. データベースから削除
    await prisma.image.delete({
      where: { id: imageId },
    });

  } catch (error) {
    console.error("削除エラー:", error);
    throw new Error("削除に失敗しました");
  }

  // 5. キャッシュを更新してトップページへ戻る
  revalidatePath("/");
  redirect("/");
}
