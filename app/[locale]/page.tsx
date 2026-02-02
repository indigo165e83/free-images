import { auth, signIn, signOut } from '@/auth';
import { prisma } from '@/lib/prisma';
import { uploadImage } from '@/app/actions/uploadImage'; // 画像アップロードアクションをインポート
import { generateImage } from '@/app/actions/generateImage'; // AI画像生成アクションをインポート
import { editImage } from '@/app/actions/editImage';  // AI画像編集（image2image）アクションをインポート
// import Link from "next/link";
// import ImageGallery from '@/components/ImageGallery';  // 検索機能付きギャラリーコンポーネント 無限スクロールを実装のため廃止
import { getTranslations } from 'next-intl/server';
import LanguageSwitcher from '@/components/LanguageSwitcher'
import { getImages } from '@/app/actions/getImages';
import InfiniteGallery from '@/components/InfiniteGallery';

// 1. 型定義を Promise<{...}> に変更
// 2. await params でアンラップしてから中身を取り出す
export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  // 翻訳関数の初期化 (jp.json/en.json の HomePage セクションを指定)
  const t = await getTranslations('HomePage');  
  const session = await auth();
  
  //管理者権限を持っているかチェック (ADMINの場合のみ true)
  const isAdmin = session?.user?.role === "ADMIN";

  // 全件取得ではなく、最初の1ページ目(20件)だけを取得
  // これにより初期表示が高速化され、残りはInfiniteGalleryがクライアント側で取得します
  const initialImages = await getImages(1);

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
          <h1 className="text-2xl font-bold">{t('title')}</h1>
            <div className="flex items-center gap-4"> {/* ← gap-4で間隔をあける */}
            {/* 言語切り替えボタン */}
            <LanguageSwitcher locale={locale} />
            {/* ログイン/ログアウトボタン */}
            <div>
              {session?.user ? (
                <form action={async () => { "use server"; await signOut(); }}>
                  <button className="text-sm font-medium hover:text-indigo-400">{t('logout')} ({session.user.name})</button>
                </form>
              ) : (
                <form action={async () => { "use server"; await signIn("google"); }}>
                  <button className="rounded-full bg-white/10 px-6 py-2 hover:bg-white/20">{t('login')}</button>
                </form>
              )}
            </div>
          </div>
        </header>

        <h2 className="text-5xl font-bold mb-8 bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent py-2 leading-tight">
          {t('aiGalleryTitle')}
        </h2>
        
        {/* ▼▼▼ 投稿エリア (ログイン中のみ表示) ▼▼▼ */}
        {session?.user && (
          <div className={`w-full px-4 z-10 grid gap-6 ${isAdmin ? "max-w-4xl md:grid-cols-2" : "max-w-md md:grid-cols-1"}`}>
            
            {/* 1. 画像アップロードフォーム(全員表示) */}
              <div className="bg-gray-800/80 p-6 rounded-xl border border-blue-500/50 shadow-xl backdrop-blur-sm">
                <h3 className="mb-4 font-bold text-lg text-blue-300 flex items-center gap-2">
                {t('uploadTitle')}
              </h3>
              <form action={uploadImage} className="flex flex-col gap-8">
                <input type="hidden" name="locale" value={locale} />
                <input
                  type="file"
                  name="file"
                  accept="image/*"
                  required
                  className="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:bg-gray-700 file:text-white file:border-0 cursor-pointer"
                />
                <button type="submit" className="w-full bg-gradient-to-r from-blue-600 to-teal-500 py-3 rounded-lg font-bold hover:opacity-90 transition shadow-lg">
                  {t('uploadButton')}
                </button>
                {/* ファイルサイズ制限の注釈 */}
                <p className="text-xs text-gray-500 text-center">{t('uploadNote')}</p>
              </form>
            </div>

            {/* 2. AI画像生成フォーム(管理者 ADMIN のみ表示)*/}
            {isAdmin&& (
              <div className="bg-gray-800/80 p-6 rounded-xl border border-indigo-500/50 shadow-xl backdrop-blur-sm">
                <h3 className="mb-4 font-bold text-lg text-indigo-300 flex items-center gap-2">
                  {t('aiGenerateTitle')}
                </h3>
                <form action={generateImage} className="flex flex-col gap-3">
                  <input type="hidden" name="locale" value={locale} />
                  <textarea
                    name="prompt"
                    placeholder={t('generatePlaceholder')}
                    required
                    className="w-full h-24 rounded-lg bg-gray-900 px-4 py-3 border border-gray-700 focus:border-indigo-500 outline-none resize-none"
                  />
                  <button type="submit" className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 py-3 rounded-lg font-bold hover:opacity-90 transition shadow-lg">
                    {t('generateButton')}
                  </button>
                  <p className="text-xs text-gray-500 text-center">{t('generateNote')}</p>
                </form>
              </div>
            )}

            {/* 3.  AI画像編集フォーム (管理者 ADMIN のみ表示) */}
            {isAdmin && (
              <div className="bg-gray-800/80 p-6 rounded-xl border border-pink-500/50 shadow-xl backdrop-blur-sm">
                <h3 className="mb-4 font-bold text-lg text-pink-300 flex items-center gap-2">
                  {t('aiEditTitle')}
                </h3>
                <form action={editImage} className="flex flex-col gap-3">
                  <input type="hidden" name="locale" value={locale} />
                  <input
                    type="file"
                    name="file"
                    accept="image/*"
                    required
                    className="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:bg-gray-700 file:text-white file:border-0 cursor-pointer"
                  />
                  <textarea
                    name="prompt"
                    placeholder={t('editPlaceholder')}
                    required
                    className="w-full h-25 rounded-lg bg-gray-900 px-4 py-3 border border-gray-700 focus:border-pink-500 outline-none resize-none"
                  />
                  <button type="submit" className="w-full bg-gradient-to-r from-pink-600 to-orange-600 py-3 rounded-lg font-bold hover:opacity-90 transition shadow-lg">
                    {t('editButton')}
                  </button>
                {/* ファイルサイズ制限の注釈 */}
                <p className="text-xs text-gray-500 text-center">{t('editNote')}</p>
                </form>
              </div>
            )}
            
          </div>
        )}
      </div>

      {/* ▼▼▼ 無限スクロールギャラリー (検索機能などはコンポーネント内に実装) ▼▼▼ */}
      <div className="container mx-auto px-4 py-8">
        <InfiniteGallery initialImages={initialImages} />      
      </div>     
    </main>
  );
}