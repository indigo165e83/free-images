import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import DeleteButton from "./DeleteButton";
import TagEditor from "./TagEditor";
//import PromptSection from "./PromptSection";
import { Metadata } from "next";
import { getTranslations } from 'next-intl/server';
import DownloadButton from "./DownloadButton";

// Next.js 15以降の非同期params対応 (v14でも動作します)
interface Props {
  params: Promise<{ 
    id: string; 
    locale: string; // localeを追加
  }>;
}

// ヘルパー関数: 言語に応じたプロンプトを取得
const getLocalizedPrompt = (image: any, locale: string) => {
  if (locale === 'en') {
    return image.promptEn || image.promptJa;
  }
  return image.promptJa || image.promptEn;
};

// ヘルパー関数: 言語に応じた説明文を取得
const getLocalizedDescription = (image: any, locale: string) => {
  if (locale === 'en') {
    return image.descriptionEn || image.descriptionJa;
  }
  return image.descriptionJa || image.descriptionEn;
};

// ヘルパー関数: 言語に応じたタグ名を取得
const getLocalizedTagName = (tag: any, locale: string) => {
  if (locale === 'en') {
    return tag.nameEn || tag.nameJa;
  }
  return tag.nameJa || tag.nameEn;
};

// Google AdSense対応 動的メタデータの生成関数
// ページコンポーネントと同じ params を受け取ります
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id, locale } = await params;

  // DBから画像情報を取得
  // (Next.jsは同じリクエスト内での重複Fetchを自動で重複排除してくれるため、
  // ページコンポーネント側での再取得と合わせてもパフォーマンスへの影響は軽微です)
  const image = await prisma.image.findUnique({
    where: { id },
    include: { tags: true },
  });

  if (!image) {
    return {
      title: "画像が見つかりません | Free Images",
    };
  }

  // 言語に応じた説明文を取得
  const displayDescription = getLocalizedDescription(image, locale);
  
  // 説明文が長い場合は切り詰めてタイトルにする
  const displayText = displayDescription || "AI Generated Image";
  const titleText = displayText.length > 40 ? displayText.slice(0, 40) + "..." : displayText;
  const title = `${titleText} | Free Images`;
  
  // 説明文にタグを含める
  const tagsText = image.tags.length > 0 
    ? `${locale === 'en' ? 'Tags' : 'タグ'}: ${image.tags.map((t: any) => getLocalizedTagName(t, locale)).join(", ")}`
    : "";

  const description = (locale === 'en'
    ? `${displayDescription || 'AI-generated image.'} ${tagsText}`
    : `${displayDescription || 'AIで生成された画像です。'}${tagsText}`).trim();

  return {
    title: title,
    description: description,
    // SNSシェア用 (OGP)
    openGraph: {
      title: title,
      description: description,
      images: [
        {
          url: image.url, // シェア時にこの画像が大きく表示されます
          width: image.width,
          height: image.height,
          alt: displayDescription || "AI Image",
        },
      ],
    },
    // Twitterカード設定
    twitter: {
      card: "summary_large_image",
      title: title,
      description: description,
      images: [image.url],
    },
  };
}

export default async function ImageDetailPage({ params }: Props) {
  const session = await auth(); //セッション判定
  const isAdmin = session?.user?.role === "ADMIN";  //管理者判定
  const { id, locale } = await params;
  const t = await getTranslations({ locale, namespace: 'HomePage' });

  // 1. データベースからIDで画像を検索
  const image = await prisma.image.findUnique({
    where: { id },
    include: { 
      tags: true,
      user: true, // 投稿者情報も表示する場合
    }, 
  });

  // 画像が見つからない場合は404ページへ
  if (!image) return notFound();

  // 表示用テキストの決定
  const displayDescription = getLocalizedDescription(image, locale);
  const displayPrompt = getLocalizedPrompt(image, locale);

  // 画像ファイル名を決定 (例: description.png または image_ID.png)
  // スペースなどをアンダースコアに置換してファイル名っぽくする
  const fileName = displayDescription 
    ? `${displayDescription.slice(0, 20).trim().replace(/\s+/g, "_")}.png`
    : `free-images_${image.id}.png`;

  return (
    <main className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-6">
{/* メインコンテナ: 幅を少し広げて、コンテンツを収容しやすくする */}
      <div className="w-full max-w-6xl flex flex-col gap-8">
        
        {/* --- 上段: 画像と操作エリア --- */}
        <div className="bg-gray-800 rounded-xl overflow-hidden shadow-2xl border border-gray-700 flex flex-col md:flex-row">
          
          {/* 左側: 画像 (大きく表示) */}
          <div className="md:w-2/3 bg-black flex items-center justify-center p-2 md:p-6">
            <Image 
              src={image.url} 
              alt={displayDescription || "AI generated image"}
              width={image.width} 
              height={image.height}
              className="w-full h-auto max-w-full object-contain max-h-[80vh]" 
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 70vw, 60vw"
              priority // ファーストビューなので優先読み込み
            />
          </div>

          {/* 右側: サイドバー (操作・メタデータ・タグ) */}
          <div className="md:w-1/3 p-6 md:p-8 flex flex-col gap-6 bg-gray-800 border-l border-gray-700">
            {/* 戻るボタン */}
            <Link 
              href={`/${locale}`} 
              className="text-center bg-gray-700 hover:bg-gray-600 text-white py-3 rounded-lg font-bold transition shadow-md"
            >
              {t('backToGalleryButton')}
            </Link>

            {/* ダウンロードボタン */}
            <DownloadButton imageUrl={image.url} fileName={fileName} />

            {/* タグ一覧 (操作しやすい位置に配置) */}
            <div className="border-t border-gray-700 pt-6">
              <TagEditor 
                imageId={image.id} 
                tags={image.tags} 
                isAdmin={isAdmin} 
              />
            </div>

            {/* メタデータ */}
            <div className="mt-auto border-t border-gray-700 pt-6 text-sm text-gray-400 space-y-2">
              <p>Created by: <span className="text-white font-medium">{image.user?.name || "indigo 165e83"}</span></p>
              <p>Date: {image.createdAt.toLocaleDateString(locale)}</p>
              <p>Size: <span className="text-white">{image.width} × {image.height} px</span></p>
            </div>

            {/* 管理者削除ボタン */}
            {isAdmin && (
              <div className="pt-4">
                <DeleteButton imageId={image.id} />
              </div>
            )}
          </div>
        </div>

        {/* --- 下段: テキストコンテンツエリア (ここがアドセンス/SEOの肝) --- */}
        {/* ブログ記事のようなスタイルで読みやすくする */}
        <article className="bg-gray-800 rounded-xl p-8 shadow-xl border border-gray-700">
          
          {/* 説明文 (Description) */}
          {displayDescription && (
            <section className="mb-10">
              <h2 className="text-xl md:text-2xl font-bold text-white mb-4 flex items-center gap-2 border-b border-gray-600 pb-2">
                <span className="text-indigo-400">#</span> Description
              </h2>
              <p className="text-lg text-gray-200 leading-loose tracking-wide">
                {displayDescription}
              </p>
            </section>
          )}

          {/* プロンプト (Prompt) - 常に全表示 */}
          <section>
            <h2 className="text-xl md:text-2xl font-bold text-white mb-4 flex items-center gap-2 border-b border-gray-600 pb-2">
              <span className="text-indigo-400">#</span> Prompt Details
            </h2>
            <div className="bg-gray-900 rounded-lg p-6 border border-gray-700">
               {/* whitespace-pre-wrap で改行を維持しつつ、テキストとして表示 */}
              <p className="text-gray-300 font-mono text-base leading-relaxed whitespace-pre-wrap break-words">
                {displayPrompt || "No prompt data available."}
              </p>
            </div>
            {/* 独自性担保のための一文（オプション） */}
            <p className="mt-4 text-sm text-gray-500">
              * This image was generated using AI based on the prompt above. 
              (この画像は上記のプロンプトに基づいてAIによって生成されました。)
            </p>
          </section>

        </article>

      </div>
    </main>
  );
}