// app/image/[id]/DeleteButton.tsx
"use client"; // アラートを出すために必須

import { deleteImage } from "@/app/actions/deleteImage";
import { useTransition } from "react";
import { useTranslations } from "next-intl";

export default function DeleteButton({ imageId }: { imageId: string }) {
  const [isPending, startTransition] = useTransition();
  // 翻訳関数を初期化
  const t = useTranslations('HomePage');

  const handleDelete = () => {
    // 確認ダイアログ
    const isConfirmed = window.confirm(t("deleteImageConfirm"));

    if (isConfirmed) {
      startTransition(async () => {
        await deleteImage(imageId);
      });
    }
  };

  return (
    <button
      onClick={handleDelete}
      disabled={isPending}
      className="w-full mt-6 bg-red-600 hover:bg-red-700 text-white py-3 rounded-lg font-bold transition flex items-center justify-center gap-2"
    >
      {isPending ? t("deletingStatus") : t("deleteImageButton")}
    </button>
  );
}