"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { generateTagsWithGemini, saveImageToS3 } from "@/lib/server-utils"; // 共通関数

export async function uploadImage(formData: FormData) {
  // 1. ログインチェック
  const session = await auth();
  if (!session?.user?.id) throw new Error("ログインが必要です");

  // 2. データの取得
  const file = formData.get("file") as File;
  const prompt = formData.get("prompt") as string;
  
  if (!file || file.size === 0) {
    throw new Error("ファイルが選択されていません");
  }

  try {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 3. 共通関数でタグ生成とS3保存を実行
    // 並行処理(Promise.all)で高速化
    const [tags, s3Url] = await Promise.all([
      generateTagsWithGemini(buffer, file.type, prompt || "Uploaded Image"),
      saveImageToS3(buffer, file.type, "upload")
    ]);

    // 4. DB保存
    await prisma.image.create({
      data: {
        url: s3Url,
        prompt: prompt || tags.join(", "),
        userId: session.user.id,
        tags: {
          connectOrCreate: tags.map((tag) => ({
            where: { name: tag },
            create: { name: tag },
          })),
        },
      },
    });

  } catch (error) {
    console.error("Upload Error:", error);
    throw new Error("アップロードに失敗しました");
  }

  revalidatePath("/");
  redirect("/");
}