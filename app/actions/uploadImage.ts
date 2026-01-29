"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { generateTagsWithGemini, saveImageToS3, translatePrompt } from "@/lib/server-utils"; // 共通関数

export async function uploadImage(formData: FormData) {
  // 1. ログインチェック
  const session = await auth();
  if (!session?.user?.id) throw new Error("ログインが必要です");

  // 2. データの取得
  const file = formData.get("file") as File;
  const prompt = formData.get("prompt") as string;
  const locale = formData.get("locale") as string || 'ja';
  
  if (!file || file.size === 0) {
    throw new Error("ファイルが選択されていません");
  }

  try {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 3. 共通関数でタグ生成とS3保存を実行
    // 並行処理(Promise.all)で高速化
    // ※ プロンプトが空の場合は、ここでは翻訳をスキップしても良いですが、
    //    一貫性を保つため "Uploaded Image" などを翻訳させておきます    
    const [tags, s3Url, translatedPrompt] = await Promise.all([
      generateTagsWithGemini(buffer, file.type, prompt || "Uploaded Image"),
      saveImageToS3(buffer, file.type, "upload"),
      // プロンプトがあれば翻訳、なければデフォルト文字列の翻訳を試みる（または空オブジェクトを返すなど）
      prompt ? translatePrompt(prompt, locale) : Promise.resolve({ ja: "", en: "" })
    ]);

    // プロンプトが空の場合のフォールバック値（タグを結合）
    // ※ただし、これは翻訳されていないのでJa/En両方に同じものが入ります
    const fallbackPrompt = tags.map(t => t.ja).join(", "); // 日本語タグを繋げる例

    // 4. DB保存
    await prisma.image.create({
      data: {
        url: s3Url,
        // 翻訳結果があればそれを優先、なければフォールバック値
        promptJa: translatedPrompt.ja || fallbackPrompt || "Uploaded Image", 
        promptEn: translatedPrompt.en || tags.map(t => t.en).join(", ") || "Uploaded Image",
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