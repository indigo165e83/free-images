// app/page.tsx
import Image from 'next/image';
import { Search } from 'lucide-react'; // アイコン用に lucide-react をインストール (pnpm add lucide-react)
import { auth, signIn, signOut } from '@/auth';
import { prisma } from '@/lib/prisma';
import { uploadImage } from './actions/imageActions'; // さっき作ったアクション

export default async function Home() {
  const session = await auth();
  
  // データベースから新しい順に画像を取得
  const dbImages = await prisma.image.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <main className="min-h-screen bg-gray-900 text-white">
      {/* ヒーローセクション */}
      <div className="relative flex h-[50vh] flex-col items-center justify-center bg-indigo-900/20">
        <header className="absolute top-0 flex w-full max-w-7xl items-center justify-between p-6">
          <h1 className="text-2xl font-bold">Free Images</h1>
          
          {/* ログイン/ログアウトボタン */}
          <div>
            {session?.user ? (
              <form action={async () => { "use server"; await signOut(); }}>
                <button className="text-sm font-medium hover:text-indigo-400">ログアウト ({session.user.name})</button>
              </form>
            ) : (
              <form action={async () => { "use server"; await signIn("google"); }}>
                <button className="rounded-full bg-white/10 px-6 py-2 hover:bg-white/20">ログイン</button>
              </form>
            )}
          </div>
        </header>

        <h2 className="text-4xl font-bold mb-6">AI Art Gallery</h2>
        
        {/* ▼▼▼ 投稿フォーム (ログイン中のみ表示) ▼▼▼ */}
        {session?.user && (
          <div className="w-full max-w-2xl px-4 z-10">
            <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-xl">
              <h3 className="mb-4 font-bold text-indigo-400">画像をアップロード</h3>
              <form action={uploadImage} className="flex flex-col gap-4 sm:flex-row">
                <input
                  type="file"
                  name="file"
                  accept="image/*"
                  required
                  className="flex-1 text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:bg-indigo-600 file:text-white file:border-0 hover:file:bg-indigo-500 cursor-pointer"
                />
                <input
                  type="text"
                  name="prompt"
                  placeholder="プロンプト (例: cute rabbit)"
                  className="flex-1 rounded-lg bg-gray-900 px-4 py-2 border border-gray-700 focus:border-indigo-500 outline-none"
                />
                <button type="submit" className="bg-indigo-600 px-6 py-2 rounded-lg font-bold hover:bg-indigo-500 transition">
                  投稿
                </button>
              </form>
            </div>
          </div>
        )}
      </div>

      {/* 画像グリッド */}
      <div className="mx-auto max-w-7xl px-4 py-12">
        <h3 className="text-xl font-bold mb-6 border-l-4 border-indigo-500 pl-4">最新の投稿</h3>
        
        {dbImages.length === 0 ? (
          <p className="text-gray-500 text-center py-10">まだ画像がありません。最初の1枚を投稿してみましょう！</p>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {dbImages.map((image) => (
              <div key={image.id} className="group relative aspect-square overflow-hidden rounded-lg bg-gray-800">
                <Image
                  src={image.url}
                  alt={image.prompt || "AI Image"}
                  fill
                  className="object-cover transition duration-300 group-hover:scale-110"
                />
                {/* ホバー時にプロンプトを表示 */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                  <p className="text-xs text-white line-clamp-2">{image.prompt}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}