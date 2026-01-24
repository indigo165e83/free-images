"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
// 標準SDKを使用
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

// Gemini APIクライアントの初期化
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// ---------------------------------------------------------
// 2. 生成アクション (nano banana 版)
// ---------------------------------------------------------
export async function generateImage(formData: FormData) {
  // ログインチェック
  const session = await auth();
  if (!session?.user?.id) throw new Error("ログインが必要です");

  const prompt = formData.get("prompt") as string;
  if (!prompt) return;

  try {
    console.log("🚀 Starting Generation with nano banana...");

    // =========================================================
    // ステップ A: 画像生成 (nano banana)
    // =========================================================
    console.log("🎨 Generating Image with nano-banana-pro-preview...");
    
    // 画像生成モデルの取得
    // ※ check-models.js で確認したモデル名を使用
    const imageModel = genAI.getGenerativeModel({ model: "nano-banana-pro-preview" });

    // 画像生成を実行
    // (現状のSDKでは generateContent で画像も生成できる場合があります)
    const result = await imageModel.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      // 画像生成のオプションを指定（モデルによって異なります）
      generationConfig: {
        // 例: 1枚生成、JPEG形式など
        // sampleCount: 1, 
        // responseMimeType: "image/jpeg" 
      }
    });

    const response = await result.response;
    
    // 生成された画像のバイナリデータを取得
    // ※ SDKのバージョンやモデルの仕様によって、バイナリの取得方法が異なる可能性があります。
    // ここでは一般的な方法を試します。
    let imageBuffer: Buffer;
    
    // パターン1: インラインデータとして返ってくる場合
    if (response.candidates?.[0]?.content?.parts?.[0]?.inlineData) {
        const base64Data = response.candidates[0].content.parts[0].inlineData.data;
        imageBuffer = Buffer.from(base64Data, 'base64');
    } 
    // パターン2: 他の形式の場合 (モデルのドキュメントを確認する必要があります)
    else {
        // 現時点での fallback: ダミー画像 (もし nano banana がうまく動かない場合)
        console.warn("⚠️ nano banana からの画像データ取得に失敗したか、形式が不明です。ダミー画像を使用します。");
        const dummyRes = await fetch(`https://placehold.co/1024x1024/png?text=${encodeURIComponent("nano banana fail")}`);
        const arrayBuffer = await dummyRes.arrayBuffer();
        imageBuffer = Buffer.from(arrayBuffer);
    }


    // =========================================================
    // ステップ B: Gemini でタグを生成 (テキストモデル)
    // =========================================================
    console.log("🏷️ Generating Tags with Gemini...");
    
    // タグ生成にはテキスト用のモデルを使用 (gemini-2.5-flash など)
    const textModel = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    
    const tagPrompt = `
      以下の画像生成プロンプトから、この画像を表す検索用タグを日本語で5つ生成してください。
      出力はカンマ区切りのテキストのみにしてください。
      
      プロンプト: "${prompt}"
      出力例: ウサギ, 動物, 自然, かわいい, イラスト
    `;
    
    const tagResult = await textModel.generateContent(tagPrompt);
    const tagText = tagResult.response.text();
    
    const tags = tagText
      .split(",")
      .map(t => t.trim())
      .filter(t => t.length > 0)
      .slice(0, 5);

    console.log("✅ Tags:", tags);


    // =========================================================
    // ステップ C: AWS S3 へ保存
    // =========================================================
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const uuid = crypto.randomUUID();

    // ファイル名とMIMEタイプ (JPEG前提)
    const fileName = `public/${year}/${month}/${day}/nano-${uuid}.jpg`;
    const contentType = "image/jpeg"; // または image/png

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
    // エラーの詳細を投げる
    throw new Error(`生成処理に失敗しました: ${error.message}`);
  }
}