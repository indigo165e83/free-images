import { auth, signIn, signOut } from '@/auth';
import { prisma } from '@/lib/prisma';
import { uploadImage } from './actions/uploadImage'; // 画像アップロードアクションをインポート
import { generateImage } from './actions/generateImage'; // AI画像生成アクションをインポート
import { editImage } from './actions/editImage';  // AI画像編集（image2image）アクションをインポート
import Link from "next/link";
import ImageGallery from '@/components/ImageGallery';

export default async function Home() {
  const session = await auth();
  
  //管理者権限を持っているかチェック (ADMINの場合のみ true)
  const isAdmin = session?.user?.role === "ADMIN";

  // データベースから新しい順に画像を全権取得
  // (検索と絞り込みはクライアント側の ImageGallery コンポーネントで行います)
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
            
            {/* 1. 手動アップロードフォーム(全員表示) */}
              <div className="bg-gray-800/80 p-6 rounded-xl border border-blue-500/50 shadow-xl backdrop-blur-sm">
                <h3 className="mb-4 font-bold text-lg text-blue-300 flex items-center gap-2">
                手持ちの画像をアップロード
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
                  placeholder="画像の説明文を入力 (タグは自動で生成)"
                  className="w-full rounded-lg bg-gray-900 px-4 py-2 border border-gray-700 focus:border-gray-500 outline-none"
                />
                <button type="submit" className="w-full bg-gradient-to-r from-blue-600 to-teal-500 py-3 rounded-lg font-bold hover:opacity-90 transition shadow-lg">
                  アップロード
                </button>
                {/* ファイルサイズ制限の注釈 */}
                <p className="text-xs text-gray-500 text-center">※ アップロード可能な画像サイズは最大4MBまでです</p>
              </form>
            </div>

            {/* 2. AI生成フォーム(管理者 ADMIN のみ表示)*/}
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

            {/* 3. 画像編集フォーム (管理者限定) */}
            {isAdmin && (
              <div className="bg-gray-800/80 p-6 rounded-xl border border-pink-500/50 shadow-xl backdrop-blur-sm">
                <h3 className="mb-4 font-bold text-lg text-pink-300 flex items-center gap-2">
                  🎨 AI画像編集 (Img2Img)
                </h3>
                <form action={editImage} className="flex flex-col gap-3">
                  <input
                    type="file"
                    name="file"
                    accept="image/*"
                    required
                    className="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:bg-gray-700 file:text-white file:border-0 cursor-pointer"
                  />
                  <textarea
                    name="prompt"
                    placeholder="どう変更しますか？ (例: この猫を油絵風にして、背景を宇宙に)"
                    required
                    className="w-full h-20 rounded-lg bg-gray-900 px-4 py-3 border border-gray-700 focus:border-pink-500 outline-none resize-none"
                  />
                  <button type="submit" className="w-full bg-gradient-to-r from-pink-600 to-orange-600 py-3 rounded-lg font-bold hover:opacity-90 transition shadow-lg">
                    画像を編集・生成する
                  </button>
                {/* ファイルサイズ制限の注釈 */}
                <p className="text-xs text-gray-500 text-center">※ アップロード可能な画像サイズは最大4MBまでです</p>
                </form>
              </div>
            )}
            
          </div>
        )}
      </div>

      {/* ▼▼▼ 検索機能付きギャラリーを表示 (データを渡すだけ) ▼▼▼ */}
      <ImageGallery images={dbImages} isAdmin={isAdmin} />      
    </main>
  );
}