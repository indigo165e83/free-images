'use client';

import { useState, useEffect, useCallback } from 'react';
import { useInView } from 'react-intersection-observer';
import { getImages } from '@/app/actions/getImages';
import Image from 'next/image';
import Link from 'next/link';
import { Search, X, Tag, ChevronDown } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';

type ImageType = {
  id: string;
  url: string;
  promptJa: string | null;
  promptEn: string | null;
  descriptionJa: string | null;
  descriptionEn: string | null;
  tags: { id: string; nameJa: string; nameEn: string; slug: string }[];
  createdAt: Date;
};

type TagType = {
  id: string;
  nameJa: string;
  nameEn: string;
  slug: string;
  count: number;
};

type Props = {
  initialImages: ImageType[];
  allTags: TagType[];
  defaultTagSlug?: string;
  initialTotalCount?: number;
};

export default function InfiniteGallery({ initialImages, allTags, defaultTagSlug = "", initialTotalCount = 0 }: Props) {
  const [images, setImages] = useState<ImageType[]>(initialImages);
  const [page, setPage] = useState(2);
  const [hasMore, setHasMore] = useState(true);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [selectedTagSlug, setSelectedTagSlug] = useState(defaultTagSlug);
  const [totalCount, setTotalCount] = useState<number>(initialTotalCount || initialImages.length);
  const [isLoading, setIsLoading] = useState(false);
  const [tagModalOpen, setTagModalOpen] = useState(false);
  const [tagSearch, setTagSearch] = useState("");
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
    if (debouncedQuery === "" && selectedTagSlug === "" && images === initialImages) return;

    const resetAndFetch = async () => {
      setIsLoading(true);
      try {
        // ★修正: getImagesの戻り値変更に対応
        const { images: newImages, totalCount: count } = await getImages(1, debouncedQuery, selectedTagSlug);
        
        setImages(newImages as any);
        setTotalCount(count); 
        setPage(2);
        setHasMore(newImages.length > 0 && newImages.length < count); 
      } finally {
        setIsLoading(false);
      }
    };

    resetAndFetch();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQuery, selectedTagSlug]);

  // 追加読み込み
  const loadMoreImages = useCallback(async () => {
    if (isLoading || !hasMore) return;

    setIsLoading(true);
    try {
      const nextPage = page;
      // ★修正: getImagesの戻り値変更に対応
      const { images: newImages, totalCount: count } = await getImages(nextPage, debouncedQuery, selectedTagSlug);

      if (newImages.length === 0) {
        setHasMore(false);
      } else {
        setImages((prev) => {
          const existingIds = new Set(prev.map(img => img.id));
          const uniqueNewImages = (newImages as any).filter((img: ImageType) => !existingIds.has(img.id));
          return [...prev, ...uniqueNewImages];
        });

        setPage(prev => prev + 1);
        setTotalCount(count);

        if (newImages.length < 20) {
           setHasMore(false);
        }
      }
    } catch (error) {
      console.error("Failed to load images", error);
    } finally {
      setIsLoading(false);
    }
  }, [page, debouncedQuery, selectedTagSlug, hasMore, isLoading]);

  // スクロール検知
  useEffect(() => {
    if (inView && hasMore && !isLoading) {
      loadMoreImages();
    }
  }, [inView, hasMore, isLoading, loadMoreImages]);

  // Escape キーでモーダルを閉じる
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setTagModalOpen(false); setTagSearch(""); }
    };
    if (tagModalOpen) document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [tagModalOpen]);

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

  // 検索入力ハンドラ (排他制御)
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    if (val && selectedTagSlug) {
      setSelectedTagSlug("");
      // タグページから検索を開始した場合、ホームページにリダイレクト
      if (defaultTagSlug) {
        router.push(`/${locale}`);
      }
    }
  };

  // タグ選択ハンドラ (排他制御)
  const handleTagSelect = (tagSlug: string) => {
    setQuery("");
    setDebouncedQuery("");

    if (selectedTagSlug === tagSlug) {
      setSelectedTagSlug("");
      router.push(`/${locale}`);
    } else {
      setSelectedTagSlug(tagSlug);
      router.push(`/${locale}/tags/${tagSlug}`);
    }
  };

  const clearTagFilter = () => {
    setSelectedTagSlug("");
    router.push(`/${locale}`);
  };

  const isTagActive = (tag: TagType) => {
    return selectedTagSlug === tag.slug;
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
            onChange={handleSearch}
            placeholder={t('searchPlaceholder')}
            className="w-full rounded-full bg-gray-800/80 border border-gray-600 py-4 pl-14 pr-6 text-white placeholder-gray-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/50 outline-none backdrop-blur-sm transition-all shadow-lg"
          />
        </div>
        <p className="text-xs text-gray-500 mt-2 ml-4">
          {t('searchNote')}
        </p>
      </div>

      {/* タグフィルタ */}
      {allTags.length > 0 && (
        <div className="w-full max-w-4xl mt-6 mx-auto px-4">
          <div className="flex flex-wrap items-center gap-3">
            {/* モーダル開くボタン */}
            <button
              onClick={() => setTagModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-800/80 text-gray-300 hover:bg-gray-700 hover:text-white border border-gray-700 rounded-full text-sm transition-all"
            >
              <Tag className="h-4 w-4" />
              <span>{t('tagFilterLabel')}</span>
              <span className="text-xs text-gray-500">({allTags.length})</span>
              <ChevronDown className="h-3 w-3 ml-1" />
            </button>
            {/* 選択中タグのチップ */}
            {selectedTagSlug && (() => {
              const activeTag = allTags.find(tag => tag.slug === selectedTagSlug);
              return activeTag ? (
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white rounded-full text-sm shadow-lg shadow-indigo-500/30">
                  <span>#{getLocalizedTagName(activeTag)}</span>
                  <button
                    onClick={clearTagFilter}
                    className="ml-0.5 hover:text-indigo-200 transition-colors"
                    aria-label={t('tagFilterClear')}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ) : null;
            })()}
          </div>
        </div>
      )}

      {/* タグ選択モーダル */}
      {tagModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* 背景オーバーレイ */}
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => { setTagModalOpen(false); setTagSearch(""); }}
          />
          {/* モーダル本体 */}
          <div className="relative bg-gray-900 rounded-xl w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl border border-gray-700">
            {/* ヘッダー */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700">
              <div className="flex items-center gap-2">
                <Tag className="h-4 w-4 text-indigo-400" />
                <span className="text-sm font-medium text-white">{t('tagFilterLabel')}</span>
                <span className="text-xs text-gray-500">({allTags.length})</span>
              </div>
              <button
                onClick={() => { setTagModalOpen(false); setTagSearch(""); }}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            {/* 検索ボックス */}
            <div className="px-4 py-3 border-b border-gray-700">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder={t('tagModalSearchPlaceholder')}
                  value={tagSearch}
                  onChange={(e) => setTagSearch(e.target.value)}
                  autoFocus
                  className="w-full bg-gray-800 text-white placeholder-gray-500 pl-9 pr-4 py-2 rounded-lg border border-gray-700 focus:outline-none focus:border-indigo-500 text-sm"
                />
              </div>
            </div>
            {/* タググリッド */}
            <div className="flex flex-wrap gap-2 p-4 overflow-y-auto">
              {(() => {
                const filtered = tagSearch.trim()
                  ? allTags.filter(tag =>
                      getLocalizedTagName(tag).toLowerCase().includes(tagSearch.toLowerCase())
                    )
                  : allTags;
                return filtered.length > 0 ? (
                  filtered.map((tag) => (
                    <button
                      key={tag.id}
                      onClick={() => { handleTagSelect(tag.slug); setTagModalOpen(false); setTagSearch(""); }}
                      className={`flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm transition-all ${
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
                  ))
                ) : (
                  <p className="text-gray-500 text-sm py-4">{t('tagModalNoResults')}</p>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* 検索結果タイトル */}
      <div className="mx-auto max-w-7xl px-4 py-12">
        <div className="flex items-center justify-between mb-6 border-l-4 border-indigo-500 pl-4">
          
          {query ? (
            // A. キーワード検索中の表示
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 text-xl font-bold">
              <span className="flex items-center gap-2">
                <Search className="w-5 h-5 text-indigo-400" />
                <span>&quot;{query}&quot;</span>
              </span>
              <span className="text-base font-normal text-gray-400 ml-1">
                ({totalCount} {locale === 'en' ? 'results' : '件'})
              </span>
            </div>
          ) : selectedTagSlug ? (
            // B. タグ選択中の表示
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 text-xl font-bold">
              <span className="flex items-center gap-2 text-indigo-200">
                <Tag className="w-5 h-5 text-indigo-400" />
                <span>#{getLocalizedTagName(allTags.find(t => t.slug === selectedTagSlug) ?? { nameJa: selectedTagSlug, nameEn: selectedTagSlug })}</span>
              </span>
              <span className="text-base font-normal text-gray-400 ml-1">
                ({totalCount} {locale === 'en' ? 'results' : '件'})
              </span>
            </div>
          ) : (
            // C. 何もしていない時の表示
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
                          handleTagSelect(tag.slug);
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
               {query || selectedTagSlug ? t('noImagesSearch') : t('noImages')}
             </p>
           </div>
        )}
      </div>
    </>
  );
}