"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { generateTagsWithGemini, saveImageToS3, generateDescriptionWithGemini } from "@/lib/server-utils"; // 共通関数

export async function uploadImage(formData: FormData) {
  // 1. ログインチェック
  const session = await auth();
  if (!session?.user?.id) throw new Error("ログインが必要です");

  // 2. データの取得
  const file = formData.get("file") as File;
  
  if (!file || file.size === 0) {
    throw new Error("ファイルが選択されていません");
  }

  try {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 3. 共通関数でタグ生成、S3保存、説明文生成を並行実行
    const [tags, s3Url, description] = await Promise.all([
      generateTagsWithGemini(buffer, file.type, "Uploaded Image"),
      saveImageToS3(buffer, file.type, "upload"),
      generateDescriptionWithGemini(buffer, file.type)
    ]);

    console.log("✅ Generation Results:", { 
      tagsCount: tags.length, 
      s3Url: s3Url.substring(0, 50) + "...",
      descriptionJa: description.ja,
      descriptionEn: description.en
    });

    // 4. DB保存
    await prisma.image.create({
      data: {
        url: s3Url,
        // 説明文を自動生成して保存（promptは保存しない）
        descriptionJa: description.ja || "",
        descriptionEn: description.en || "",
        userId: session.user.id,
        tags: {
          connectOrCreate: tags.map((tag) => ({
            // 複合ユニークキー (nameJa_nameEn) を指定
            where: { 
              nameJa_nameEn: {
                // 念のため String() でキャストして型エラーを防ぐ
                nameJa: typeof tag.ja === 'string' ? tag.ja : String(tag.ja),
                nameEn: typeof tag.en === 'string' ? tag.en : String(tag.en),
              }
            },
            // 新しいカラム名で保存
            create: { 
              nameJa: typeof tag.ja === 'string' ? tag.ja : String(tag.ja),
              nameEn: typeof tag.en === 'string' ? tag.en : String(tag.en)
            },
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