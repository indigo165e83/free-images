'use client';

import { useState, useEffect, useCallback } from 'react';
import { useInView } from 'react-intersection-observer';
import { getImages } from '@/app/actions/getImages';
import Image from 'next/image';
import Link from 'next/link';
import { Search, X, Tag } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';

// 画像データの型定義
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

type TagType = {
  id: string;
  nameJa: string;
  nameEn: string;
  count: number;
};

type Props = {
  initialImages: ImageType[];
  allTags: TagType[];
  defaultTagName?: string;
};

export default function InfiniteGallery({ initialImages, allTags, defaultTagName = "" }: Props) {
  const [images, setImages] = useState<ImageType[]>(initialImages);
  const [page, setPage] = useState(2); // 2ページ目から開始
  const [hasMore, setHasMore] = useState(true);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [selectedTagName, setSelectedTagName] = useState(defaultTagName);
  const [showAllTags, setShowAllTags] = useState(false);
  // totalCountはAPIから返ってこないため今回は使用しないが、拡張性のため残す場合は定義可
  // const [totalCount, setTotalCount] = useState<number | null>(null);

  // 読み込み中フラグ
  const [isLoading, setIsLoading] = useState(false);

  const { ref, inView } = useInView();
  const t = useTranslations('HomePage');
  const locale = useLocale();
  const router = useRouter();

  // デバウンス処理
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 500);
    return () => clearTimeout(timer);
  }, [query]);

  // 検索条件またはタグフィルタが変わったらリストをリセット
  useEffect(() => {
    // 初期状態から変化がない場合は何もしない
    if (debouncedQuery === "" && selectedTagName === "" && images === initialImages) return;

    const resetAndFetch = async () => {
      setIsLoading(true); // ロード開始
      try {
        // getImagesは配列を直接返す
        const newImages = await getImages(1, debouncedQuery, selectedTagName);
        
        setImages(newImages as any);
        setPage(2);
        setHasMore(newImages.length > 0);
      } finally {
        setIsLoading(false); // ロード終了
      }
    };

    resetAndFetch();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQuery, selectedTagName]);

  // 追加読み込み
  const loadMoreImages = useCallback(async () => {
    // 読み込み中、またはこれ以上ない場合は何もしない
    if (isLoading || !hasMore) return;

    setIsLoading(true); // ロック
    try {
      const nextPage = page;
      const newImages = await getImages(nextPage, debouncedQuery, selectedTagName);

      if (newImages.length === 0) {
        setHasMore(false);
      } else {
        setImages((prev) => {
          // 重複排除
          const existingIds = new Set(prev.map(img => img.id));
          const uniqueNewImages = (newImages as any).filter((img: ImageType) => !existingIds.has(img.id));
          return [...prev, ...uniqueNewImages];
        });

        // ページを進める
        setPage(prev => prev + 1);

        // 取得数が20枚未満なら終了
        if (newImages.length < 20) {
          setHasMore(false);
        }
      }
    } catch (error) {
      console.error("Failed to load images", error);
    } finally {
      setIsLoading(false); // ロック解除
    }
  }, [page, debouncedQuery, selectedTagName, hasMore, isLoading]);

  // スクロール検知
  useEffect(() => {
    if (inView && hasMore && !isLoading) {
      loadMoreImages();
    }
  }, [inView, hasMore, isLoading, loadMoreImages]);

  // --- ヘルパー関数 ---
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

  // 検索入力ハンドラ (排他制御: 入力中はタグをクリア)
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    
    // 文字が入力されたら、タグ選択を強制解除する
    if (val && selectedTagName) {
      setSelectedTagName("");
    }
  };

  // タグ選択ハンドラ (排他制御: 選択中は検索をクリア)
  const handleTagSelect = (tagId: string) => {
    // 検索キーワードをクリア
    setQuery("");
    setDebouncedQuery("");
    
    const tag = allTags.find(t => t.id === tagId);
    if (!tag) return;
    const tagName = getLocalizedTagName(tag);
    
    if (selectedTagName === tagName) {
      // 解除
      setSelectedTagName("");
      router.push(`/${locale}`);
    } else {
      // 選択
      setSelectedTagName(tagName);
      router.push(`/${locale}/tags/${encodeURIComponent(tagName)}`);
    }
  };

  // タグクリアボタン
  const clearTagFilter = () => {
    setSelectedTagName("");
    router.push(`/${locale}`);
  };

  // タグがアクティブかどうか判定
  const isTagActive = (tag: TagType) => {
    return selectedTagName === getLocalizedTagName(tag);
  };

  // 表示するタグ数を制限
  const VISIBLE_TAG_COUNT = 20;
  const visibleTags = showAllTags ? allTags : allTags.slice(0, VISIBLE_TAG_COUNT);
  const hasHiddenTags = allTags.length > VISIBLE_TAG_COUNT;

  return (
    <>
      {/* 検索フォーム - 一時的に非表示 */}
      {false && (
        <div className="w-full max-w-2xl mt-10 relative group mx-auto px-4">
          <div className="relative">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5 pointer-events-none" />
            <input
              type="text"
              value={query}
              onChange={handleSearch}
              placeholder={t('searchPlaceholder')}
              className="w-full rounded-full bg-gray-800/80 border border-gray-600 py-4 pl-14 pr-6 text-white placeholder-gray-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/50 outline-none backdrop-blur-sm transition-all shadow-lg"
            />
          </div>
          <p className="text-xs text-gray-500 mt-2 ml-4">
            {t('searchNote')}
          </p>
        </div>
      )}

      {/* タグフィルタ */}
      {allTags.length > 0 && (
        <div className="w-full max-w-4xl mt-6 mx-auto px-4">
          <div className="flex items-center gap-2 mb-3">
            <Tag className="h-4 w-4 text-gray-400" />
            <span className="text-sm text-gray-400 font-medium">{t('tagFilterLabel')}</span>
            {selectedTagName && (
              <button
                onClick={clearTagFilter}
                className="ml-auto flex items-center gap-1 text-xs text-gray-400 hover:text-white transition-colors"
              >
                <X className="h-3 w-3" />
                {t('tagFilterClear')}
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {visibleTags.map((tag) => (
              <button
                key={tag.id}
                onClick={() => handleTagSelect(tag.id)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm transition-all ${
                  isTagActive(tag)
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30'
                    : 'bg-gray-800/80 text-gray-300 hover:bg-gray-700 hover:text-white border border-gray-700'
                }`}
              >
                <span>#{getLocalizedTagName(tag)}</span>
                <span className={`text-xs ${isTagActive(tag) ? 'text-indigo-200' : 'text-gray-500'}`}>
                  {tag.count}
                </span>
              </button>
            ))}
            {hasHiddenTags && (
              <button
                onClick={() => setShowAllTags(!showAllTags)}
                className="inline-flex items-center px-3 py-1.5 rounded-full text-sm bg-gray-800/80 text-gray-400 hover:bg-gray-700 hover:text-white border border-gray-700 transition-all"
              >
                {showAllTags ? t('tagFilterShowLess') : t('tagFilterShowMore', { count: allTags.length - VISIBLE_TAG_COUNT })}
              </button>
            )}
          </div>
        </div>
      )}

      {/* 検索結果タイトル */}
      <div className="mx-auto max-w-7xl px-4 py-12">
        <div className="flex items-center justify-between mb-6 border-l-4 border-indigo-500 pl-4">
          
          {/* タグがある場合、またはデフォルト */}
          {selectedTagName ? (
            // タグ選択中の表示
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 text-xl font-bold">
              <span className="flex items-center gap-2 text-indigo-200">
                <Tag className="w-5 h-5 text-indigo-400" />
                <span>#{selectedTagName}</span>
              </span>
              <span className="text-base font-normal text-gray-400 ml-1">
                 {/* タグの場合は全件数を表示 */}
                ({allTags.find(t => getLocalizedTagName(t) === selectedTagName)?.count ?? images.length} {locale === 'en' ? 'results' : '件'})
              </span>
            </div>
          ) : (
            // デフォルト表示
            <h3 className="text-xl font-bold">{t('galleryTitle')}</h3>
          )}
          
        </div>

        {/* 画像グリッド */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {images.map((image) => (
            <Link href={`/${locale}/image/${image.id}`} key={image.id}>
              <div className="group relative aspect-square overflow-hidden rounded-lg bg-gray-800 shadow-lg cursor-pointer">
                <Image
                  src={image.url}
                  alt={getLocalizedPrompt(image) || "AI Image"}
                  fill
                  className="object-cover transition duration-500 group-hover:scale-110"
                  sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 20vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3">
                  <p className="text-xs text-white line-clamp-2 font-medium mb-1">
                    {getLocalizedDescription(image)}
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {image.tags.slice(0, 3).map(tag => (
                      <span
                        key={tag.id}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleTagSelect(tag.id);
                        }}
                        className="text-[10px] px-1.5 py-0.5 rounded text-white cursor-pointer transition-colors bg-indigo-600/80 hover:bg-indigo-500"
                      >
                        #{getLocalizedTagName(tag)}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* ローディング & 無限スクロール検知エリア */}
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

        {images.length === 0 && !hasMore && (
           <div className="text-center py-20 text-gray-500">
             <p className="text-xl">
               {debouncedQuery || selectedTagName ? t('noImagesSearch') : t('noImages')}
             </p>
           </div>
        )}
      </div>
    </>
  );
}
