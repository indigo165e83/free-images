import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { PrismaClient } from "@prisma/client";
import crypto from "crypto";
import sharp from "sharp";  // 画像処理(webp化)ライブラリ

/**
 * nameEn からURLフレンドリーなslugを生成する
 */
export function generateSlug(nameEn: string): string {
  return nameEn
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "") // 英数字・スペース・ハイフン以外を除去
    .replace(/\s+/g, "-")          // スペースをハイフンに変換
    .replace(/^-+|-+$/g, "");      // 先頭・末尾のハイフンを除去
}

/**
 * タグ配列に対して、DB・バッチ内の重複を考慮した一意のslugを割り当てる。
 * - nameEn が英数字を含まない場合（日本語等）は "tag-xxxxxxxx" にフォールバック。
 * - 同一バッチ内で同じ候補slugが複数生じた場合も "-2", "-3" ... で回避する。
 */
export async function buildTagsWithUniqueSlug(
  tags: { ja: string; en: string }[],
  prisma: PrismaClient
): Promise<{ nameJa: string; nameEn: string; slug: string }[]> {
  // DBの既存slug一覧を取得（重複チェック用）
  const existing = await prisma.tag.findMany({ select: { slug: true } });
  const takenSlugs = new Set(existing.map((t) => t.slug));

  return tags.map((tag) => {
    const nameJa = typeof tag.ja === "string" ? tag.ja : String(tag.ja);
    const nameEn = typeof tag.en === "string" ? tag.en : String(tag.en);

    // base slug を生成。英数字が残らない場合は "tag-xxxxxxxx" にフォールバック
    const base = generateSlug(nameEn) || `tag-${crypto.randomBytes(4).toString("hex")}`;

    // DB・バッチ内の既存slugと衝突しない slug を決定
    let slug = base;
    let suffix = 2;
    while (takenSlugs.has(slug)) {
      slug = `${base}-${suffix++}`;
    }

    // バッチ内の後続タグでも同じ slug を使わないようにマーク
    takenSlugs.add(slug);

    return { nameJa, nameEn, slug };
  });
}

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
 * 画像バッファからメタデータ（width, height）を取得する
 * @param imageBuffer 画像バッファ
 * @returns {width: number, height: number}
 */
export async function getImageDimensions(imageBuffer: Buffer): Promise<{ width: number; height: number }> {
  try {
    const metadata = await sharp(imageBuffer).metadata();
    return {
      width: metadata.width || 1024,
      height: metadata.height || 1024,
    };
  } catch (error) {
    console.error("❌ Error getting image dimensions:", error);
    // エラー時はデフォルト値を返す
    return { width: 1024, height: 1024 };
  }
}

/**
 * プロンプトを日英翻訳する関数 (locale判定版)
 * @param text 翻訳するテキスト
 * @param locale 入力言語 ('ja' または 'en')
 */
export async function translatePrompt(text: string, locale: string = 'ja'): Promise<{ ja: string; en: string }> {
  if (!text) return { ja: "", en: "" };

  console.log(`🗣️ Translating Prompt with Gemini (locale: ${locale})...`);
  
  const isInputJapanese = locale === 'ja';
  
  // JSON出力が得意なモデルを使用
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const prompt = `
    You are a professional translator.
    Translate the following text into both Japanese and English.
    Return the result in strictly valid JSON format without markdown code blocks.
    
    Format:
    {
      "ja": "Japanese translation",
      "en": "English translation"
    }

    Text to translate: "${text}"
  `;

  try {
    const result = await model.generateContent(prompt);
    const responseText = result.response.text().replace(/```json|```/g, "").trim();
    const translation = JSON.parse(responseText);
    
    // JSONから翻訳結果を取得し、どちらかが空の場合は補完
    let ja = translation.ja?.trim() || "";
    let en = translation.en?.trim() || "";
    
    // 両方空の場合は、入力言語に応じて割り当て
    if (!ja && !en) {
      return isInputJapanese ? { ja: text, en: "" } : { ja: "", en: text };
    }
    
    // ja だけが空の場合、入力が日本語なら ja に入力を割り当て
    if (!ja && isInputJapanese) {
      ja = text;
    }
    
    // en だけが空の場合、入力が英語なら en に入力を割り当て
    if (!en && !isInputJapanese) {
      en = text;
    }
    
    return { ja, en };
  } catch (e) {
    console.error("Translation failed:", e);
    // 失敗時は入力言語に応じて割り当て
    return isInputJapanese ? { ja: text, en: "" } : { ja: "", en: text };
  }
}

/**
 * 画像バッファとコンテキストからタグを生成する(日英対応版)
 * 戻り値 { ja: string, en: string }[] 
 */
export async function generateTagsWithGemini(
  imageBuffer: Buffer, 
  mimeType: string, 
  userPrompt: string
): Promise<{ ja: string; en: string }[]> {
  console.log("👁️ Analyzing Image with Gemini for Tags...");
  
  // 画像認識が得意なモデルを使用 (gemini-2.5-flash)
  const visionModel = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const tagPrompt = `
    - この画像を分析し、検索用のタグを日本語で5～10個程度生成してください。
      -【画像に関連するテキスト情報】: "${userPrompt}"
    
    - 以下の観点を含めてください：
      1. 被写体（何が映っているか）
      2. 画風（写真、実写、イラスト、アニメ、油絵、水彩画、CGなど）
      3. 雰囲気（明るい、怖い、癒やし、かわいい、サイバーパンクなど）
      4. メインカラー

    - 各タグには、英語版と日本語版の両方が必要です。
    - 結果はマークダウンのコードブロックを使わず、厳密に有効なJSON形式（オブジェクトの配列）で返してください。
      - 出力フォーマット:
        [
          { "en": "Cat", "ja": "猫" },
          { "en": "Animal", "ja": "動物" }
          { "en": "Spacesuit", "ja": "宇宙服" },
          { "en": "Sci-Fi", "ja": "SF" },
          { "en": "Cyberpunk", "ja": "サイバーパンク" },
          { "en": "Neon", "ja": "ネオン" },
          { "en": "Blue", "ja": "青" },
          { "en": "Cute", "ja": "かわいい" },
          { "en": "3D Rendering", "ja": "3Dレンダリング" },
          { "en": "Future", "ja": "未来" }
        ]
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
    const tagText = response.text().replace(/```json|```/g, "").trim();

    const tags= JSON.parse(tagText);
    if (Array.isArray(tags)) {
          // 最初の10個を取得
          console.log("✅ Generated Tags:", tags.length);
          return tags.slice(0, 10);
    }
    return [];
  } catch (error) {
    console.error("Tag Generation Error:", error);
    return []; // エラー時は空配列を返す
  }
}

/**
 * 画像バッファをS3に保存してURLを返す
 */
export async function saveImageToS3(
  imageBuffer: Buffer, 
  mimeType: string,   // 互換性のために残すが、内部では無視してWebP化する
  prefix: string = "gen"
): Promise<string> {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const uuid = crypto.randomUUID();

  // ★変更: Sharpを使って画像をWebPに変換・圧縮
  // quality: 80 は画質とサイズのバランスが良い推奨値
  const webpBuffer = await sharp(imageBuffer)
    .rotate() // スマホ写真などのExif回転情報を適用して正立させる
    .webp({ quality: 80 }) 
    .toBuffer();

  // フォルダ構成: public/YYYY/MM/DD/prefix-uuid.ext
  // 拡張子は常に .webp にする
  const fileName = `public/${year}/${month}/${day}/${prefix}-${uuid}.webp`;

  await s3Client.send(new PutObjectCommand({
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: fileName,
    Body: webpBuffer, // webp圧縮後のバッファ
    ContentType: "image/webp",  // MIMEタイプを固定
  }));

  return `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileName}`;
}

/**
 * 画像から説明文（Description）を日英で生成する
 */
export async function generateDescriptionWithGemini(
  imageBuffer: Buffer, 
  mimeType: string
): Promise<{ ja: string; en: string }> {
  console.log("📝 Generating Description with Gemini...");
  // ビジョンタスクに最適なモデルを使用
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const prompt = `You are an expert image analyst. Analyze this image carefully and generate descriptive captions in both Japanese and English.

The descriptions should be:
- Natural and detailed (2-3 sentences)
- Suitable for alt text or gallery overlay
- Capture the main subject, style, mood, and colors
- Free from markdown formatting

Return ONLY a valid JSON object (no markdown, no explanation):
{
  "ja": "日本語の説明文",
  "en": "English description"
}`;

  const imagePart = {
    inlineData: {
      data: imageBuffer.toString("base64"),
      mimeType: mimeType,
    },
  };

  try {
    const result = await model.generateContent([prompt, imagePart]);
    const responseText = result.response.text().trim();
    
    // JSONを抽出（マークダウンコードブロック対応）
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.warn("⚠️ No JSON found in response:", responseText);
      return { ja: "", en: "" };
    }
    
    const json = JSON.parse(jsonMatch[0]);
    
    return {
      ja: (json.ja || "").trim(),
      en: (json.en || "").trim()
    };
  } catch (error) {
    console.error("❌ Description Generation Error:", error);
    return { ja: "", en: "" };
  }
}