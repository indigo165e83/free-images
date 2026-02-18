"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { generateTagsWithGemini, saveImageToS3, generateDescriptionWithGemini, getImageDimensions, buildTagsWithUniqueSlug } from "@/lib/server-utils"; // 共通関数

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

    // 3. 共通関数でタグ生成、S3保存、説明文生成、サイズ取得を並行実行
    const [tags, s3Url, description, dimensions] = await Promise.all([
      generateTagsWithGemini(buffer, file.type, "Uploaded Image"),
      saveImageToS3(buffer, file.type, "upload"),
      generateDescriptionWithGemini(buffer, file.type),
      getImageDimensions(buffer)
    ]);

    console.log("✅ Generation Results:", { 
      tagsCount: tags.length, 
      s3Url: s3Url.substring(0, 50) + "...",
      descriptionJa: description.ja,
      descriptionEn: description.en
    });

    // DB・バッチ内の重複を考慮した一意のslugを事前に決定
    const tagsWithSlug = await buildTagsWithUniqueSlug(tags, prisma);

    // 4. DB保存
    await prisma.image.create({
      data: {
        url: s3Url,
        // 説明文を自動生成して保存（promptは保存しない）
        descriptionJa: description.ja || "",
        descriptionEn: description.en || "",
        // 画像サイズを保存
        width: dimensions.width,
        height: dimensions.height,
        userId: session.user.id,
        tags: {
          connectOrCreate: tagsWithSlug.map(({ nameJa, nameEn, slug }) => ({
            // 複合ユニークキー (nameJa_nameEn) で既存タグを検索
            where: { nameJa_nameEn: { nameJa, nameEn } },
            // 新規タグは重複チェック済みのslugで作成
            create: { nameJa, nameEn, slug },
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