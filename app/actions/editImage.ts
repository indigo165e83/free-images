"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { generateTagsWithGemini, saveImageToS3, translatePrompt, generateDescriptionWithGemini } from "@/lib/server-utils"; // 共通関数

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function editImage(formData: FormData) {
  // 1. 権限チェック
  const session = await auth();
  if (!session?.user?.id) throw new Error("ログインが必要です");
  if (session.user.role !== "ADMIN") throw new Error("権限がありません");

  const file = formData.get("file") as File;
  const prompt = formData.get("prompt") as string;
  const locale = formData.get("locale") as string || 'ja';

  if (!file || file.size === 0 || !prompt) {
    throw new Error("画像とプロンプトの両方が必要です");
  }

  try {
    console.log("🚀 Starting Image Editing (Img2Img)...");
    
    // 元画像の準備
    const arrayBuffer = await file.arrayBuffer();
    const inputBuffer = Buffer.from(arrayBuffer);

    // 2. 画像編集 (nano banana)
    // ※ nano-banana は画像入力(inlineData)を受け取って生成できると仮定
    const imageModel = genAI.getGenerativeModel({ model: "nano-banana-pro-preview" });

    const result = await imageModel.generateContent({
      contents: [
        {
          role: "user",
          parts: [
            { text: `以下の画像をベースに、次の指示に従って新しい画像を生成してください: ${prompt}` },
            {
              inlineData: {
                data: inputBuffer.toString("base64"),
                mimeType: file.type,
              },
            },
          ],
        },
      ],
    });

    const response = await result.response;
    
    // 生成画像の取得
    let outputBuffer: Buffer;
    if (response.candidates?.[0]?.content?.parts?.[0]?.inlineData) {
        const base64Data = response.candidates[0].content.parts[0].inlineData.data;
        outputBuffer = Buffer.from(base64Data, 'base64');
    } else {
        throw new Error("画像の生成に失敗しました");
    }

    // 3. 共通関数でタグ生成、S3保存、説明文生成を実行
    const [tags, s3Url, translatedPrompt, description] = await Promise.all([
      // 生成された画像に対してタグ付けを行う
      generateTagsWithGemini(outputBuffer, "image/webp", prompt),
      saveImageToS3(outputBuffer, "image/webp", "edit"),
      translatePrompt(prompt, locale),
      generateDescriptionWithGemini(outputBuffer, "image/webp")
    ]);

    // 4. DB保存
    await prisma.image.create({
      data: {
        url: s3Url,
        // プロンプトを翻訳して保存
        promptJa: translatedPrompt.ja, 
        promptEn: translatedPrompt.en,
        // 説明文を保存
        descriptionJa: description.ja || "",
        descriptionEn: description.en || "",
        userId: session.user.id,
        tags: {
          connectOrCreate: tags.map((tag) => ({
            // 複合ユニーク制約に対応した where 句
            where: {
              nameJa_nameEn: {
                // 念のため String() でキャストして型エラーを防ぐ
                nameJa: typeof tag.ja === 'string' ? tag.ja : String(tag.ja),
                nameEn: typeof tag.en === 'string' ? tag.en : String(tag.en),
              },
            },
            // 新しいカラム名で保存
            create: {
              // 念のため String() でキャストして型エラーを防ぐ
              nameJa: typeof tag.ja === 'string' ? tag.ja : String(tag.ja),
              nameEn: typeof tag.en === 'string' ? tag.en : String(tag.en),
            },
          })),
        },
      },
    });

    revalidatePath("/");
    console.log("✨ Edit Complete!");

  } catch (error: any) {
    console.error("Edit Error:", error);
    throw new Error(`編集に失敗しました: ${error.message}`);
  }
}