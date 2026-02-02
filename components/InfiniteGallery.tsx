'use client';

import { useState, useEffect, useCallback } from 'react';
import { useInView } from 'react-intersection-observer';
import { getImages } from '@/app/actions/getImages';
import Image from 'next/image';
import Link from 'next/link';
import { Search } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';

// 画像データの型定義 (ImageGalleryと共通化)
type ImageType = {
  id: string;
  url: string;
  promptJa: string | null;
  promptEn: string | null;
  descriptionJa: string | null;
  descriptionEn: string | null;
  tags: { id: string; nameJa: string; nameEn: string }[];
  createdAt: Date;
};

type Props = {
  initialImages: ImageType[];
};

export default function InfiniteGallery({ initialImages }: Props) {
  const [images, setImages] = useState<ImageType[]>(initialImages);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [query, setQuery] = useState(""); // 検索フォームの入力値
  const [debouncedQuery, setDebouncedQuery] = useState(""); // 実際に検索を実行する値
  
  const { ref, inView } = useInView();
  const t = useTranslations('HomePage');
  const locale = useLocale();

  // デバウンス処理 (入力が止まってから検索を実行)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 500); // 0.5秒待機
    return () => clearTimeout(timer);
  }, [query]);

  // 検索条件が変わったらリストをリセットして再取得
  useEffect(() => {
    const resetAndFetch = async () => {
      // ページ1から再取得
      const newImages = await getImages(1, debouncedQuery); // 型エラーが出る場合は getImagesの型定義を確認
      setImages(newImages as any); // 型調整が必要な場合あり
      setPage(1);
      setHasMore(newImages.length > 0);
    };

    // 初回レンダリング時はinitialImagesを使うのでスキップしたいが、
    // 検索窓が空でも検索アクションが走るのを防ぐ制御が必要ならここで調整
    // 今回はシンプルにクエリ変更時のみ実行
    if (debouncedQuery !== "") {
        resetAndFetch();
    } else if (page === 1 && images !== initialImages) {
        // クエリが空に戻った場合もリセット
        resetAndFetch();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQuery]);

  // 追加読み込み
  const loadMoreImages = useCallback(async () => {
    const nextPage = page + 1;
    const newImages = await getImages(nextPage, debouncedQuery);

    if (newImages.length === 0) {
      setHasMore(false);
    } else {
      setImages((prev) => [...prev, ...(newImages as any)]);
      setPage(nextPage);
    }
  }, [page, debouncedQuery]);

  // スクロール検知
  useEffect(() => {
    if (inView && hasMore) {
      loadMoreImages();
    }
  }, [inView, hasMore, loadMoreImages]);


  // --- ヘルパー関数 (ImageGalleryから移植) ---
  const getLocalizedPrompt = (image: ImageType) => {
    if (locale === 'en') return image.promptEn || image.promptJa;
    return image.promptJa || image.promptEn;
  };
  const getLocalizedDescription = (image: ImageType) => {
    if (locale === 'en') return image.descriptionEn || image.descriptionJa || image.promptEn || image.promptJa;
    return image.descriptionJa || image.descriptionEn || image.promptJa || image.promptEn;
  };
  const getLocalizedTagName = (tag: { nameJa: string; nameEn: string }) => {
    if (locale === 'en') return tag.nameEn || tag.nameJa;
    return tag.nameJa || tag.nameEn;
  };

  return (
    <>
      {/* 検索フォーム */}
      <div className="w-full max-w-2xl mt-10 relative group mx-auto px-4">
        <div className="relative">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5 pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('searchPlaceholder')}
            className="w-full rounded-full bg-gray-800/80 border border-gray-600 py-4 pl-14 pr-6 text-white placeholder-gray-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/50 outline-none backdrop-blur-sm transition-all shadow-lg"
          />
        </div>
        <p className="text-xs text-gray-500 mt-2 ml-4">
          {t('searchNote')}
        </p>
      </div>

      {/* 検索結果タイトル */}
      <div className="mx-auto max-w-7xl px-4 py-12">
        <div className="flex items-center justify-between mb-6 border-l-4 border-indigo-500 pl-4">
          <h3 className="text-xl font-bold">
            {debouncedQuery ? 
              t('searchResultTitle', { query: debouncedQuery, count: images.length }) + (hasMore ? "+" : "")
              : t('galleryTitle')
            }
          </h3>
        </div>

        {/* 画像グリッド */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {images.map((image) => (
            <Link href={`/image/${image.id}`} key={image.id}>
              <div className="group relative aspect-square overflow-hidden rounded-lg bg-gray-800 shadow-lg cursor-pointer">
                <Image
                  src={image.url}
                  alt={getLocalizedPrompt(image) || "AI Image"}
                  fill
                  className="object-cover transition duration-500 group-hover:scale-110"
                  sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 20vw"
                />
                {/* オーバーレイ情報 */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3">
                  <p className="text-xs text-white line-clamp-2 font-medium mb-1">
                    {getLocalizedDescription(image)}
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {image.tags.slice(0, 3).map(tag => (
                      <span key={tag.id} className="text-[10px] bg-indigo-600/80 px-1.5 py-0.5 rounded text-white">
                        #{getLocalizedTagName(tag)}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* ローディング表示 & 無限スクロール検知エリア */}
        {hasMore ? (
          <div ref={ref} className="h-20 flex justify-center items-center mt-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
          </div>
        ) : (
          images.length > 0 && (
            <div className="text-center mt-12 text-gray-500 text-sm">
              All images loaded.
            </div>
          )
        )}
        
        {/* 0件時の表示 */}
        {images.length === 0 && !hasMore && (
           <div className="text-center py-20 text-gray-500">
             <p className="text-xl">
               {debouncedQuery ? "条件に一致する画像は見つかりませんでした" : "まだ画像がありません"}
             </p>
           </div>
        )}
      </div>
    </>
  );
}