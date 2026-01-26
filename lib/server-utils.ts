import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { GoogleGenerativeAI } from "@google/generative-ai";
import crypto from "crypto";

// クライアントの初期化 (シングルトン的に再利用)
const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

/**
 * 画像バッファとコンテキストからタグを生成する
 */
export async function generateTagsWithGemini(
  imageBuffer: Buffer, 
  mimeType: string, 
  promptContext: string
): Promise<string[]> {
  console.log("👁️ Analyzing Image with Gemini for Tags...");
  
  // 画像認識が得意なモデルを使用 (gemini-2.5-flash)
  const visionModel = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const tagPrompt = `
    この画像を分析し、検索用のタグを日本語で5～10個程度生成してください。
    
    【画像に関連するテキスト情報】: "${promptContext}"
    
    以下の観点を含めてください：
    1. 被写体（何が映っているか）
    2. 画風（写真、実写、イラスト、アニメ、油絵、水彩画、CGなど）
    3. 雰囲気（明るい、怖い、癒やし、かわいい、サイバーパンクなど）
    4. メインカラー

    出力はカンマ区切りのテキストのみにしてください。
    出力例: 猫, 動物, 宇宙服, SF, サイバーパンク, ネオン, 青, かわいい, 3Dレンダリング, 未来
  `;

  const imagePart = {
    inlineData: {
      data: imageBuffer.toString("base64"),
      mimeType: mimeType,
    },
  };

  try {
    const result = await visionModel.generateContent([tagPrompt, imagePart]);
    const response = await result.response;
    const tagText = response.text();

    const tags = tagText
      .split(",")
      .map(t => t.trim())
      .filter(t => t.length > 0)
      .slice(0, 10); // 最大10個

    console.log("✅ Generated Tags:", tags);
    return tags;
  } catch (error) {
    console.error("Tag Generation Error:", error);
    return []; // エラー時は空配列を返す（処理を止めないため）
  }
}

/**
 * 画像バッファをS3に保存してURLを返す
 */
export async function saveImageToS3(
  imageBuffer: Buffer, 
  mimeType: string, 
  prefix: string = "gen"
): Promise<string> {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const uuid = crypto.randomUUID();

  // mimeTypeから拡張子を簡易的に決定
  const ext = mimeType.includes("jpeg") ? "jpg" : mimeType.includes("png") ? "png" : "bin";
  
  // フォルダ構成: public/YYYY/MM/DD/prefix-uuid.ext
  const fileName = `public/${year}/${month}/${day}/${prefix}-${uuid}.${ext}`;

  await s3Client.send(new PutObjectCommand({
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: fileName,
    Body: imageBuffer,
    ContentType: mimeType,
  }));

  return `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileName}`;
}