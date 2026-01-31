import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');
  let filename = searchParams.get('filename') || 'image';
  const widthParam = searchParams.get('width');

  if (!url) {
    return NextResponse.json({ error: 'URL is required' }, { status: 400 });
  }

  // 拡張子を .webp に強制的に書き換え
  // (例: "image.png" -> "image.webp")
  filename = filename.replace(/\.[^/.]+$/, "") + ".webp";

  try {
    const imageResponse = await fetch(url);
    if (!imageResponse.ok) {
      throw new Error(`Failed to fetch image: ${imageResponse.statusText}`);
    }

    const arrayBuffer = await imageResponse.arrayBuffer();
    let buffer: Buffer = Buffer.from(arrayBuffer);

    // sharpインスタンスを作成
    let pipeline = sharp(buffer);

    // 1. サイズ変更処理 (original以外の場合)
    if (widthParam && widthParam !== 'original') {
      const width = parseInt(widthParam, 10);
      if (!isNaN(width)) {
        pipeline = pipeline.resize({ width: width, withoutEnlargement: false });
      }
    }

    // 2. WebP形式に変換 (品質80)
    buffer = await pipeline
      .webp({ quality: 80 })
      .toBuffer();

    return new NextResponse(buffer as any, {
      status: 200,
      headers: {
        'Content-Type': 'image/webp', // MIMEタイプをWebPに変更
        'Content-Disposition': `attachment; filename="${encodeURIComponent(filename)}"`,
      },
    });

  } catch (error) {
    console.error('Download API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}