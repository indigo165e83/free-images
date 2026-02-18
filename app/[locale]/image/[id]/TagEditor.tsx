// app/image/[id]/TagEditor.tsx
"use client";

import { useState, useTransition } from "react";
import { removeTagFromImage, addTagToImage } from "@/app/actions/tagActions";
import { useTranslations, useLocale } from "next-intl";
import Link from "next/link";

type Tag = {
  id: string;
  nameJa: string;
  nameEn: string;
  slug: string;
};

type Props = {
  imageId: string;
  tags: Tag[];
  isAdmin: boolean;
};

export default function TagEditor({ imageId, tags, isAdmin }: Props) {
  const [isPending, startTransition] = useTransition();
  const [newTag, setNewTag] = useState("");

  const locale = useLocale();
  // 翻訳関数を初期化
  const t = useTranslations('HomePage');

  // ヘルパー関数: ロケールに応じたタグ名を取得
  // (locale変数が定義された後に書く必要があります)
  const getTagName = (tag: Tag) => {
    if (locale === 'en') {
      return tag.nameEn || tag.nameJa;
    }
    return tag.nameJa || tag.nameEn;
  };

  // タグ削除処理
  const handleRemove = (tagId: string) => {
    if (!confirm(t("deleteTagConfirm"))) return;
    startTransition(async () => {
      await removeTagFromImage(imageId, tagId);
    });
  };

  // タグ追加処理
  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTag.trim()) return;
    
    startTransition(async () => {
      await addTagToImage(imageId, newTag);
      setNewTag(""); // 入力欄をクリア
    });
  };

  return (
    <div>
      <h2 className="text-gray-400 text-sm font-bold uppercase tracking-wider mb-2 flex justify-between items-center">
        TAGS
        {isAdmin && isPending && <span className="text-xs text-indigo-400 animate-pulse">{t("updatingTag")}</span>}
      </h2>

      {/* タグ一覧表示エリア */}
      <div className="flex flex-wrap gap-2 mb-4">
        {tags.map((tag) => (
          <span
            key={tag.id}
            className={`px-3 py-1 rounded-full text-sm flex items-center gap-2 ${
              isAdmin
                ? "bg-gray-700 text-gray-200 border border-gray-600 pl-3 pr-2" // 管理者用デザイン
                : "bg-indigo-900 text-indigo-200 hover:bg-indigo-800 transition-colors" // 一般用デザイン
            }`}
          >
            {/* 言語に応じて表示を切り替え。タグページへのリンク */}
            <Link href={`/${locale}/tags/${tag.slug}`} className="hover:text-white transition-colors">
              #{getTagName(tag)}
            </Link>

            {/* 管理者のみ削除ボタン(×)を表示 */}
            {isAdmin && (
              <button
                onClick={() => handleRemove(tag.id)}
                className="text-gray-400 hover:text-red-400 hover:bg-gray-800 rounded-full w-5 h-5 flex items-center justify-center transition"
                disabled={isPending}
              >
                ×
              </button>
            )}
          </span>
        ))}

        {tags.length === 0 && <span className="text-gray-500 text-sm">{t("nothingTag")}</span>}
      </div>

      {/* 管理者のみ追加フォームを表示 */}
      {isAdmin && (
        <form onSubmit={handleAdd} className="flex gap-2">
          <input
            type="text"
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            placeholder={t("addTagPlaceholder")}
            className="bg-gray-800 border border-gray-600 rounded px-3 py-1 text-sm text-white focus:border-indigo-500 outline-none flex-1"
            disabled={isPending}
          />
          <button
            type="submit"
            disabled={isPending || !newTag.trim()}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 rounded text-sm font-bold transition disabled:opacity-50"
          >
            {t("addTag")}
          </button>
        </form>
      )}
    </div>
  );
}