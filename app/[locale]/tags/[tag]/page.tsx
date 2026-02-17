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
    tag: string; // tag ID
  }>;
}

// ヘルパー関数: 言語に応じたタグ名を取得
const getLocalizedTagName = (tag: { nameJa: string; nameEn: string }, locale: string) => {
  if (locale === 'en') return tag.nameEn || tag.nameJa;
  return tag.nameJa || tag.nameEn;
};

// 動的メタデータ
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { tag: tagId, locale } = await params;

  const tag = await prisma.tag.findUnique({
    where: { id: tagId },
    include: { _count: { select: { images: true } } },
  });

  if (!tag) {
    return { title: 'Tag not found | Free Images' };
  }

  const tagName = getLocalizedTagName(tag, locale);
  const title = locale === 'en'
    ? `#${tagName} - Free AI Images | Free Images`
    : `#${tagName} のフリー画像一覧 | Free Images`;
  const description = locale === 'en'
    ? `Browse ${tag._count.images} free AI-generated images tagged with "${tagName}".`
    : `「${tagName}」タグが付いたAI生成フリー画像${tag._count.images}件を閲覧できます。`;

  return {
    title,
    description,
    openGraph: { title, description },
    twitter: { card: 'summary', title, description },
  };
}

export default async function TagPage({ params }: Props) {
  const { tag: tagId, locale } = await params;
  const t = await getTranslations({ locale, namespace: 'TagPage' });

  // タグ情報を取得
  const tag = await prisma.tag.findUnique({
    where: { id: tagId },
  });

  if (!tag) return notFound();

  const tagName = getLocalizedTagName(tag, locale);

  // このタグで絞り込んだ最初の1ページ分を取得
  const [initialImages, allTags] = await Promise.all([
    getImages(1, '', tagId),
    getTags(),
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
            #{tagName}
          </h1>
          <p className="mt-2 text-gray-400">
            {t('imageCount', { count: initialImages.length > 0 ? allTags.find(t => t.id === tagId)?.count ?? 0 : 0 })}
          </p>
        </div>
      </div>

      {/* ギャラリー（タグでプリフィルタ済み） */}
      <div className="container mx-auto px-4 py-8">
        <InfiniteGallery initialImages={initialImages} allTags={allTags} defaultTagId={tagId} />
      </div>
    </main>
  );
}
