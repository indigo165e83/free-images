import { prisma } from "@/lib/prisma";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

// Next.js 15以降の非同期params対応 (v14でも動作します)
interface Props {
  params: Promise<{ id: string }>;
}

export default async function ImageDetailPage({ params }: Props) {
  const { id } = await params;

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

  return (
    <main className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-5xl bg-gray-800 rounded-xl overflow-hidden shadow-2xl border border-gray-700 flex flex-col md:flex-row">
        
        {/* 左側: 画像表示エリア */}
        <div className="md:w-2/3 bg-black relative min-h-[400px] md:min-h-[600px]">
          <Image
            src={image.url}
            alt={image.prompt || "Detail Image"}
            fill
            className="object-contain"
            priority // 詳細ページなので優先読み込み
          />
        </div>

        {/* 右側: 情報エリア */}
        <div className="md:w-1/3 p-8 flex flex-col gap-6">
          <div>
            <h2 className="text-gray-400 text-sm font-bold uppercase tracking-wider mb-2">PROMPT</h2>
            <p className="text-lg font-medium leading-relaxed text-gray-100">
              {image.prompt}
            </p>
          </div>

          {/* タグ一覧 */}
          <div>
            <h2 className="text-gray-400 text-sm font-bold uppercase tracking-wider mb-2">TAGS</h2>
            <div className="flex flex-wrap gap-2">
              {image.tags.map((tag) => (
                <span key={tag.id} className="bg-indigo-900 text-indigo-200 px-3 py-1 rounded-full text-sm">
                  #{tag.name}
                </span>
              ))}
            </div>
          </div>

          {/* メタデータ (作成日など) */}
          <div className="mt-auto border-t border-gray-700 pt-6 text-sm text-gray-400">
            <p>Created by: <span className="text-white">{image.user?.name || "Unknown"}</span></p>
            <p>Date: {image.createdAt.toLocaleDateString()}</p>
          </div>

          {/* 戻るボタン */}
          <Link 
            href="/" 
            className="mt-4 text-center bg-gray-700 hover:bg-gray-600 text-white py-3 rounded-lg font-bold transition"
          >
            ← ギャラリーに戻る
          </Link>
        </div>
      </div>
    </main>
  );
}