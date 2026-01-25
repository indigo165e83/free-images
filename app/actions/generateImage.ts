"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { GoogleGenerativeAI } from "@google/generative-ai";
import crypto from "crypto";

// ---------------------------------------------------------
// 1. クライアントの初期化
// ---------------------------------------------------------
const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// ---------------------------------------------------------
// 2. 生成アクション
// ---------------------------------------------------------
export async function generateImage(formData: FormData) {
  // ログインチェック
  const session = await auth();
  if (!session?.user?.id) throw new Error("ログインが必要です");

  // APIの直接操作による管理者以外のアクセスをブロック
  if (session.user.role !== "ADMIN") {
    throw new Error("権限がありません");
  }

  const prompt = formData.get("prompt") as string;
  if (!prompt) return;

  try {
    console.log("🚀 Starting Generation with nano banana...");

    // =========================================================
    // ステップ A: 画像生成 (nano banana)
    // =========================================================
    console.log("🎨 Generating Image with nano-banana-pro-preview...");
    
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

    // =========================================================
    // ステップ B: 画像を解析してタグを生成 (Vision機能)
    // =========================================================
    console.log("👁️ Analyzing Generated Image with Gemini...");
    
    // 画像認識モデルを使用
    const visionModel = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    
    const tagPrompt = `
      この生成された画像を分析し、検索用のタグを日本語で5～10個程度生成してください。
      ユーザーのプロンプトは「${prompt}」でした。
      以下の4つの観点をバランスよく含めてください：
      1. 被写体（何が描かれているか）
      2. 画風（アニメ、写真、油絵など）
      3. 雰囲気（明るい、怖い、サイバーパンクなど）
      4. メインカラー
      
      出力はカンマ区切りのテキストのみにしてください。
      出力例: 猫, 動物, 宇宙服, SF, サイバーパンク, ネオン, 青, かわいい, 3Dレンダリング, 未来
    `;
    
    // 画像データをGeminiに渡す形式に変換
    const imagePart = {
      inlineData: {
        data: imageBuffer.toString("base64"),
        mimeType: "image/jpeg",
      },
    };
    
    // プロンプトと画像データの両方を渡す
    const tagResult = await visionModel.generateContent([tagPrompt, imagePart]);
    const tagText = tagResult.response.text();
    
    const tags = tagText
      .split(",")
      .map(t => t.trim())
      .filter(t => t.length > 0)
      .slice(0, 10);

    console.log("✅ Tags:", tags);


    // =========================================================
    // ステップ C: AWS S3 へ保存
    // =========================================================
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const uuid = crypto.randomUUID();

    const fileName = `public/${year}/${month}/${day}/nano-${uuid}.jpg`;
    const contentType = "image/jpeg";

    await s3Client.send(new PutObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: fileName,
      Body: imageBuffer,
      ContentType: contentType,
    }));

    const s3Url = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileName}`;


    // =========================================================
    // ステップ D: データベースに保存
    // =========================================================
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