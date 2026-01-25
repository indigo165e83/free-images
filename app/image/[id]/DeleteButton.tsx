// app/image/[id]/DeleteButton.tsx
"use client"; // アラートを出すために必須

import { deleteImage } from "@/app/actions/deleteImage";
import { useTransition } from "react";

export default function DeleteButton({ imageId }: { imageId: string }) {
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    // 確認ダイアログ
    const isConfirmed = window.confirm("本当にこの画像を削除しますか？\nこの操作は取り消せません。");

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
      {isPending ? "削除中..." : "🗑️ この画像を削除する (管理者のみ)"}
    </button>
  );
}