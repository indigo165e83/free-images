"use client";

import { useState, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import Fuse from 'fuse.js';
import { Search } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';

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

type Props = {
  images: ImageType[];
  isAdmin: boolean;
};

export default function ImageGallery({ images, isAdmin }: Props) {
  const [query, setQuery] = useState("");
  // 翻訳関数の初期化
  const t = useTranslations('HomePage');
  const locale = useLocale(); // 現在の言語を取得 ('ja' or 'en')

  // 言語に応じたテキストを取得するヘルパー関数
  const getLocalizedPrompt = (image: ImageType) => {
    if (locale === 'en') {
      return image.promptEn || image.promptJa; // 英語がなければ日本語をフォールバック表示
    }
    return image.promptJa || image.promptEn;
  };

  // 説明文を取得するヘルパー関数（descriptionを優先、なければpromptを使用）
  const getLocalizedDescription = (image: ImageType) => {
    if (locale === 'en') {
      return image.descriptionEn || image.descriptionJa || image.promptEn || image.promptJa;
    }
    return image.descriptionJa || image.descriptionEn || image.promptJa || image.promptEn;
  };  

  const getLocalizedTagName = (tag: { nameJa: string; nameEn: string }) => {
    if (locale === 'en') {
      return tag.nameEn || tag.nameJa;
    }
    return tag.nameJa || tag.nameEn;
  };

  // Fuse.js の設定
  const fuse = useMemo(() => {
    return new Fuse(images, {
      keys: [
        'promptJa', 
        'promptEn', 
        'tags.nameJa', 
        'tags.nameEn'
      ], 
      threshold: 0.4, // より柔軟なマッチング（0.0=完全一致、1.0=何でも一致）
      includeScore: true,
      ignoreLocation: true, // 位置に関係なくマッチング
    });
  }, [images]);

  // 検索結果の取得
  const filteredImages = useMemo(() => {
    if (!query.trim()) return images;

    // 入力されたクエリをスペースやカンマで分割
    const searchTerms = query
      .replace(/、/g, ' ') // 全角読点をスペースに
      .replace(/，/g, ' ') // 全角カンマをスペースに
      .trim()
      .split(/\s+/) // スペースで分割
      .filter(term => term.length > 0);

    if (searchTerms.length === 0) return images;

    // 各検索キーワードでOR検索を実行
    // 複数のキーワードのいずれかにマッチする画像を返す
    const allResults = new Set<ImageType>();
    
    searchTerms.forEach(term => {
      const results = fuse.search(term);
      results.forEach(result => allResults.add(result.item));
    });

    return Array.from(allResults);
  }, [query, images, fuse]);

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
            // ▼▼▼ プレースホルダーを変更 ▼▼▼
            placeholder={t('searchPlaceholder')}
            className="w-full rounded-full bg-gray-800/80 border border-gray-600 py-4 pl-14 pr-6 text-white placeholder-gray-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/50 outline-none backdrop-blur-sm transition-all shadow-lg"
          />
        </div>
        {/* ▼▼▼ 補足説明を追加 ▼▼▼ */}
        <p className="text-xs text-gray-500 mt-2 ml-4">
          {t('searchNote')}
        </p>
      </div>

      {/* 検索結果の表示エリア */}
      <div className="mx-auto max-w-7xl px-4 py-12">
        <div className="flex items-center justify-between mb-6 border-l-4 border-indigo-500 pl-4">
          <h3 className="text-xl font-bold">
            {query ? 
              t('searchResultTitle', { 
                query: query, 
                count: filteredImages.length 
              }) 
              : t('galleryTitle')
            }
          </h3>
        </div>
        
        {filteredImages.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            <p className="text-xl">
              {query ? "条件に一致する画像は見つかりませんでした" : "まだ画像がありません"}
            </p>
            {isAdmin && !query && <p className="mt-2">AIで最初の1枚を作りましょう！</p>}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {filteredImages.map((image) => (
              <Link href={`/image/${image.id}`} key={image.id}>
                <div className="group relative aspect-square overflow-hidden rounded-lg bg-gray-800 shadow-lg cursor-pointer">
                  <Image
                    src={image.url}
                    alt={getLocalizedPrompt(image) || "AI Image"}
                    fill
                    className="object-cover transition duration-500 group-hover:scale-110"
                  />
                  {/* オーバーレイ */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3">
                    <p className="text-xs text-white line-clamp-2 font-medium mb-1">
                      {getLocalizedDescription(image)}
                    </p>
                    {/* タグ表示 */}
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
        )}
      </div>
    </>
  );
}