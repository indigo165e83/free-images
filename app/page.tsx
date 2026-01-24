import Image from 'next/image';
import { auth, signIn, signOut } from '@/auth';
import { prisma } from '@/lib/prisma';
import { uploadImage } from './actions/imageActions';
import { generateImage } from './actions/generateImage'; // AI画像生成アクションをインポート
import Link from "next/link";

export default async function Home() {
  const session = await auth();
  
  //管理者権限を持っているかチェック (ADMINの場合のみ true)
  const isAdmin = session?.user?.role === "ADMIN";

  // データベースから新しい順に画像を取得
  const dbImages = await prisma.image.findMany({
    orderBy: { createdAt: "desc" },
    include: { tags: true }, // タグも一緒に取得
  });

  return (
    <main className="min-h-screen bg-gray-900 text-white">
      {/* ヒーローセクション */}
      <div className="relative flex min-h-[60vh] flex-col items-center justify-center bg-indigo-900/20 pt-20 pb-10">
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

        <h2 className="text-5xl font-bold mb-8 bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
          AI Art Gallery
        </h2>
        
        {/* ▼▼▼ 投稿エリア (ログイン中のみ表示) ▼▼▼ */}
        {session?.user && (
          <div className={`w-full px-4 z-10 grid gap-6 ${isAdmin ? "max-w-4xl md:grid-cols-2" : "max-w-md md:grid-cols-1"}`}>
            
            {/* 1. AI生成フォーム(管理者 ADMIN のみ表示)*/}
            {isAdmin&& (
              <div className="bg-gray-800/80 p-6 rounded-xl border border-indigo-500/50 shadow-xl backdrop-blur-sm">
                <h3 className="mb-4 font-bold text-lg text-indigo-300 flex items-center gap-2">
                  ✨ AIで新しく生成
                </h3>
                <form action={generateImage} className="flex flex-col gap-3">
                  <textarea
                    name="prompt"
                    placeholder="どんな画像を作りますか？ (例: 宇宙を旅する猫、サイバーパンクな東京)"
                    required
                    className="w-full h-24 rounded-lg bg-gray-900 px-4 py-3 border border-gray-700 focus:border-indigo-500 outline-none resize-none"
                  />
                  <button type="submit" className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 py-3 rounded-lg font-bold hover:opacity-90 transition shadow-lg">
                    AIで生成する (タグ自動付与)
                  </button>
                  <p className="text-xs text-gray-500 text-center">※ 生成には10〜20秒ほどかかります</p>
                </form>
              </div>
            )}

            {/* 2. 手動アップロードフォーム(全員表示) */}
            <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700 shadow-xl backdrop-blur-sm">
              <h3 className="mb-4 font-bold text-gray-400 text-sm">
                {isAdmin ? "または手持ちの画像をアップロード" : "手持ちの画像をアップロード"}
              </h3>
              <form action={uploadImage} className="flex flex-col gap-4">
                <input
                  type="file"
                  name="file"
                  accept="image/*"
                  required
                  className="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:bg-gray-700 file:text-white file:border-0 cursor-pointer"
                />
                <input
                  type="text"
                  name="prompt"
                  placeholder="説明文 (タグ用)"
                  className="w-full rounded-lg bg-gray-900 px-4 py-2 border border-gray-700 focus:border-gray-500 outline-none"
                />
                <button type="submit" className="w-full bg-gray-700 py-2 rounded-lg font-bold hover:bg-gray-600 transition">
                  アップロード
                </button>
              </form>
            </div>

          </div>
        )}
      </div>

      {/* 画像グリッド */}
      <div className="mx-auto max-w-7xl px-4 py-12">
        <h3 className="text-xl font-bold mb-6 border-l-4 border-indigo-500 pl-4">最新のコレクション</h3>
        
        {dbImages.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            <p className="text-xl">まだ画像がありません</p>
            <p className="mt-2">AIで最初の1枚を作りましょう！</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {dbImages.map((image) => (
              <Link href={`/image/${image.id}`} key={image.id}>
              <div key={image.id} className="group relative aspect-square overflow-hidden rounded-lg bg-gray-800 shadow-lg cursor-pointer">
                <Image
                  src={image.url}
                  alt={image.prompt || "AI Image"}
                  fill
                  className="object-cover transition duration-500 group-hover:scale-110"
                />
                {/* オーバーレイ */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3">
                  <p className="text-xs text-white line-clamp-2 font-medium mb-1">{image.prompt}</p>
                  {/* タグ表示 */}
                  <div className="flex flex-wrap gap-1">
                    {image.tags.slice(0, 3).map(tag => (
                      <span key={tag.id} className="text-[10px] bg-indigo-600/80 px-1.5 py-0.5 rounded text-white">
                        #{tag.name}
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
    </main>
  );
}