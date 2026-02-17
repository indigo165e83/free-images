import { auth, signIn, signOut } from '@/auth';
// 個別ページへ移動したためアクションのインポートを削除
// import { uploadImage } from '@/app/actions/uploadImage';
// import { generateImage } from '@/app/actions/generateImage';
// import { editImage } from '@/app/actions/editImage';
import { getTranslations } from 'next-intl/server';
import LanguageSwitcher from '@/components/LanguageSwitcher'
import { getImages } from '@/app/actions/getImages';
import { getTags } from '@/app/actions/getTags';
import InfiniteGallery from '@/components/InfiniteGallery';
import { Heart, Plus } from 'lucide-react'; // Plusアイコンを追加
import Link from 'next/link'; // Linkを追加

export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations('HomePage');  
  const session = await auth();
  
  //管理者権限を持っているかチェック (ADMINの場合のみ true)
  // const isAdmin = session?.user?.role === "ADMIN"; // トップページでは使用しなくなったため削除またはコメントアウト

  // 最初の1ページ目(20件)とタグ一覧を並行取得
  const [imagesData, allTags] = await Promise.all([
    getImages(1),
    getTags(locale),
  ]);

  // オブジェクトから配列と総数を取り出す
  const initialImages = (imagesData as any).images || (Array.isArray(imagesData) ? imagesData : []);
  const totalCount = (imagesData as any).totalCount || 0;

  return (
    <main className="min-h-screen bg-gray-900 text-white">
      {/* ヒーローセクション */}
      <div className="relative flex min-h-[30vh] flex-col items-center justify-center bg-indigo-900/20 pt-20 pb-10">
        <header className="absolute top-0 flex w-full max-w-7xl items-center justify-between p-6">
          <h1 className="text-2xl font-bold">{t('title')}</h1>
            <div className="flex items-center gap-4">

            {/* ▼▼▼ 追加: Createボタン (ログイン中のみ表示) ▼▼▼ */}
            {session?.user && (
              <Link 
                href={`/${locale}/create`}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-full font-bold transition shadow-lg text-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Create</span>
              </Link>
            )}

            {/* GitHub Sponsors ボタン */}
            <a
              href="https://github.com/sponsors/indigo165e83"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 bg-pink-600 hover:bg-pink-700 text-white px-4 py-2 rounded-full font-bold transition shadow-lg text-sm"
            >
              <Heart className="w-4 h-4 fill-white" />
              <span>Sponsor</span>
            </a>

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

        <h2 className="text-6xl font-bold mb-2 bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent py-2 leading-tight">
          {t('aiGalleryTitle')}
        </h2>
        
        {/* ▼▼▼ メニュー/フォームエリアは削除しました (Createページへ移動) ▼▼▼ */}
      </div>

      {/* ▼▼▼ 無限スクロールギャラリー ▼▼▼ */}
      <div className="container mx-auto px-4 py-8">
        <InfiniteGallery 
          initialImages={initialImages} 
          allTags={allTags}
          initialTotalCount={totalCount}
        />      
      </div>     
    </main>
  );
}