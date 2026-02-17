import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { getImages } from '@/app/actions/getImages';
import InfiniteGallery from '@/components/InfiniteGallery';
import { getTags } from '@/app/actions/getTags';
import Link from 'next/link';

interface Props {
  params: Promise<{
    locale: string;
    tag: string; // tag name (URL encoded)
  }>;
}

// ヘルパー関数: 言語に応じたタグ名を取得
const getLocalizedTagName = (tag: { nameJa: string; nameEn: string }, locale: string) => {
  if (locale === 'en') return tag.nameEn || tag.nameJa;
  return tag.nameJa || tag.nameEn;
};

// タグ名からタグを検索するヘルパー（代表の1件を返す）
async function findTagByName(tagName: string) {
  return prisma.tag.findFirst({
    where: {
      OR: [
        { nameJa: tagName },
        { nameEn: tagName },
      ],
    },
  });
}

// タグ名に一致する全タグの画像数を集計
async function countImagesByTagName(tagName: string) {
  return prisma.image.count({
    where: {
      tags: { some: { OR: [{ nameJa: tagName }, { nameEn: tagName }] } },
    },
  });
}

// 動的メタデータ
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { tag: tagSlug, locale } = await params;
  const tagName = decodeURIComponent(tagSlug);

  const [tag, imageCount] = await Promise.all([
    findTagByName(tagName),
    countImagesByTagName(tagName),
  ]);

  if (!tag) {
    return { title: 'Tag not found | Free Images' };
  }

  const localizedName = getLocalizedTagName(tag, locale);
  const title = locale === 'en'
    ? `#${localizedName} - Free AI Images | Free Images`
    : `#${localizedName} のフリー画像一覧 | Free Images`;
  const description = locale === 'en'
    ? `Browse ${imageCount} free AI-generated images tagged with "${localizedName}".`
    : `「${localizedName}」タグが付いたAI生成フリー画像${imageCount}件を閲覧できます。`;

  return {
    title,
    description,
    openGraph: { title, description },
    twitter: { card: 'summary', title, description },
  };
}

export default async function TagPage({ params }: Props) {
  const { tag: tagSlug, locale } = await params;
  const tagName = decodeURIComponent(tagSlug);
  const t = await getTranslations({ locale, namespace: 'TagPage' });

  // タグ名でタグ情報を取得
  const tag = await findTagByName(tagName);

  if (!tag) return notFound();

  const localizedName = getLocalizedTagName(tag, locale);

  // このタグ名で絞り込んだ最初の1ページ分を取得
  const [{ images: initialImages, totalCount: initialTotalCount }, allTags] = await Promise.all([
    getImages(1, '', tagName),
    getTags(locale),
  ]);

  return (
    <main className="min-h-screen bg-gray-900 text-white">
      {/* ヘッダー */}
      <div className="bg-indigo-900/20 pt-10 pb-8">
        <div className="max-w-7xl mx-auto px-6">
          <Link
            href={`/${locale}`}
            className="text-sm text-gray-400 hover:text-white transition-colors"
          >
            {t('backToGallery')}
          </Link>
          <h1 className="mt-4 text-4xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
            #{localizedName}
          </h1>
          <p className="mt-2 text-gray-400">
            {t('imageCount', { count: initialTotalCount })}
          </p>
        </div>
      </div>

      {/* ギャラリー（タグでプリフィルタ済み） */}
      <div className="container mx-auto px-4 py-8">
        <InfiniteGallery initialImages={initialImages} allTags={allTags} defaultTagName={tagName} initialTotalCount={initialTotalCount} />
      </div>
    </main>
  );
}
