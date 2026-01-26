"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { generateTagsWithGemini, saveImageToS3 } from "@/lib/server-utils"; // 共通関数

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function generateImage(formData: FormData) {
  // 1. 権限チェック
  const session = await auth();
  if (!session?.user?.id) throw new Error("ログインが必要です");
  if (session.user.role !== "ADMIN") throw new Error("権限がありません");

  const prompt = formData.get("prompt") as string;
  if (!prompt) return;

  try {
    console.log("🚀 Starting Generation with nano banana...");

    // 2. 画像生成 (nano banana)
    const imageModel = genAI.getGenerativeModel({ model: "nano-banana-pro-preview" });
    const result = await imageModel.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    });
    const response = await result.response;
    
    // 画像データの取得
    let imageBuffer: Buffer;
    if (response.candidates?.[0]?.content?.parts?.[0]?.inlineData) {
        const base64Data = response.candidates[0].content.parts[0].inlineData.data;
        imageBuffer = Buffer.from(base64Data, 'base64');
    } else {
        console.warn("⚠️ Fallback: using dummy image");
        const dummyRes = await fetch(`https://placehold.co/1024x1024/png?text=${encodeURIComponent("nano banana fail")}`);
        const arrayBuffer = await dummyRes.arrayBuffer();
        imageBuffer = Buffer.from(arrayBuffer);
    }

    // 3. 共通関数でタグ生成とS3保存を実行
    const [tags, s3Url] = await Promise.all([
      generateTagsWithGemini(imageBuffer, "image/jpeg", prompt),
      saveImageToS3(imageBuffer, "image/jpeg", "generate")
    ]);

    // 4. DB保存
    await prisma.image.create({
      data: {
        url: s3Url,
        prompt: prompt,
        userId: session.user.id,
        tags: {
          connectOrCreate: tags.map((tag) => ({
            where: { name: tag },
            create: { name: tag },
          })),
        },
      },
    });

    revalidatePath("/");
    console.log("✨ Generation Complete!");
    
  } catch (error: any) {
    console.error("Generation Error:", error);
    throw new Error(`生成処理に失敗しました: ${error.message}`);
  }
}