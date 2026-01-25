"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { redirect } from "next/navigation";
import crypto from "crypto";
import { GoogleGenerativeAI } from "@google/generative-ai";

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
// 2. アップロードアクション
// ---------------------------------------------------------
export async function uploadImage(formData: FormData) {
  // 1. ログインチェック
  const session = await auth();
  if (!session?.user?.id) throw new Error("ログインが必要です");

  // 2. フォームデータの取得
  const file = formData.get("file") as File;
  const prompt = formData.get("prompt") as string;  // ユーザーが入力した説明文（任意）
  
  if (!file || file.size === 0) {
    throw new Error("ファイルが選択されていません");
  }

  try {
    // =========================================================
    // ステップ A: ファイルをバッファに変換 (S3用 & Gemini用)
    // =========================================================
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // =========================================================
    // ステップ B: Gemini で画像を解析してタグを生成
    // =========================================================
    console.log("👁️ Analyzing Image with Gemini...");
    
    // 画像認識が得意なモデルを使用
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const tagPrompt = `
      この画像を分析し、検索用のタグを日本語で5～10個生成してください。
      以下の観点を含めてください：
      1. 被写体（何が映っているか）
      2. 雰囲気や色味
      3. 画像のスタイル（写真、イラスト、CGなど）

      出力はカンマ区切りのテキストのみにしてください。
      例: 猫, 動物, 屋内, かわいい, 茶色, 写真
    `;

    // 画像データをGeminiに渡す形式に変換
    const imagePart = {
      inlineData: {
        data: buffer.toString("base64"),
        mimeType: file.type,
      },
    };

    const result = await model.generateContent([tagPrompt, imagePart]);
    const response = await result.response;
    const tagText = response.text();

    // タグの配列化
    const tags = tagText
      .split(",")
      .map(t => t.trim())
      .filter(t => t.length > 0)
      .slice(0, 10); // 最大10個

    console.log("✅ Generated Tags:", tags);

    // =========================================================
    // ステップ C: AWS S3 へアップロード
    // =========================================================
    // 日付情報の取得
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const uuid = crypto.randomUUID();

    // 元の拡張子を取得（なければjpgとする）
    const ext = file.name.split('.').pop() || 'jpg';
    const fileName = `public/${year}/${month}/${day}/upload-${uuid}.${ext}`;

    await s3Client.send(new PutObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: fileName,  // 階層付きのパスを指定
      Body: buffer,
      ContentType: file.type,
    }));

    // =========================================================
    // ステップ D: データベースに保存
    // =========================================================
    const s3Url = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileName}`;

    await prisma.image.create({
      data: {
        url: s3Url,
        // ユーザー入力が空なら、Geminiが作ったタグの1つ目をプロンプト代わりに使うなどの工夫も可能
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

  // 画面更新
  revalidatePath("/");
  redirect("/");
}