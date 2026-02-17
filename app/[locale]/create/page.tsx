import { auth } from '@/auth';
import { uploadImage } from '@/app/actions/uploadImage';
import { generateImage } from '@/app/actions/generateImage';
import { editImage } from '@/app/actions/editImage';
import { getTranslations } from 'next-intl/server';
import { redirect } from 'next/navigation';
import { Upload, Wand2, Sparkles, Plus, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default async function CreatePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations('HomePage');
  const session = await auth();
  const isAdmin = session?.user?.role === "ADMIN";

  // ログインしていない場合はトップへリダイレクト
  if (!session?.user) {
    redirect(`/${locale}`);
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white pt-24 pb-12 px-4">
      <div className="max-w-3xl mx-auto space-y-8">
        
        {/* ★変更: コンテンツ幅の中に配置（中央寄せのラインに合わせる） */}
        <div className="flex justify-start">
          <Link 
            href={`/${locale}`}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors bg-gray-800/50 hover:bg-gray-800 px-4 py-2 rounded-full backdrop-blur-sm border border-gray-700/50"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium">Top</span>
          </Link>
        </div>
        
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold flex items-center justify-center gap-3 mb-2">
            <Plus className="w-8 h-8 text-indigo-400" />
            <span>Create New Image</span>
          </h1>
          <p className="text-gray-400">画像の手動アップロード、またはAIによる生成・編集が可能です。</p>
        </div>

        {/* 1. 画像アップロードフォーム (全員) */}
        <section className="bg-gray-800/80 p-8 rounded-2xl border border-blue-500/30 shadow-2xl backdrop-blur-sm">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-3 text-blue-300">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <Upload className="w-5 h-5" />
            </div>
            {t('uploadTitle')}
          </h2>
          <form action={uploadImage} className="flex flex-col gap-6">
            <input type="hidden" name="locale" value={locale} />
            <div className="space-y-2">
              <input
                type="file"
                name="file"
                accept="image/*"
                required
                className="w-full text-sm text-gray-400 file:mr-4 file:py-3 file:px-6 file:rounded-full file:bg-gray-700 file:text-white file:border-0 file:font-semibold hover:file:bg-gray-600 cursor-pointer border border-gray-700 rounded-lg p-2"
              />
            </div>
            <button type="submit" className="w-full bg-gradient-to-r from-blue-600 to-teal-500 py-3 rounded-lg font-bold hover:opacity-90 transition shadow-lg">
              {t('uploadButton')}
            </button>
            <p className="text-xs text-gray-500 text-center">{t('uploadNote')}</p>
          </form>
        </section>

        {/* 2. AI画像生成フォーム (ADMINのみ) */}
        {isAdmin && (
          <section className="bg-gray-800/80 p-8 rounded-2xl border border-indigo-500/30 shadow-2xl backdrop-blur-sm">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-3 text-indigo-300">
              <div className="p-2 bg-indigo-500/20 rounded-lg">
                <Wand2 className="w-5 h-5" />
              </div>
              {t('aiGenerateTitle')}
            </h2>
            <form action={generateImage} className="flex flex-col gap-6">
              <input type="hidden" name="locale" value={locale} />
              <textarea
                name="prompt"
                placeholder={t('generatePlaceholder')}
                required
                className="w-full h-32 rounded-lg bg-gray-900 px-4 py-3 border border-gray-700 focus:border-indigo-500 outline-none resize-none"
              />
              <button type="submit" className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 py-3 rounded-lg font-bold hover:opacity-90 transition shadow-lg">
                {t('generateButton')}
              </button>
              <p className="text-xs text-gray-500 text-center">{t('generateNote')}</p>
            </form>
          </section>
        )}

        {/* 3. AI画像編集フォーム (ADMINのみ) */}
        {isAdmin && (
          <section className="bg-gray-800/80 p-8 rounded-2xl border border-pink-500/30 shadow-2xl backdrop-blur-sm">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-3 text-pink-300">
              <div className="p-2 bg-pink-500/20 rounded-lg">
                <Sparkles className="w-5 h-5" />
              </div>
              {t('aiEditTitle')}
            </h2>
            <form action={editImage} className="flex flex-col gap-6">
              <input type="hidden" name="locale" value={locale} />
              <div className="space-y-2">
                <label className="text-sm text-gray-400">元画像</label>
                <input
                  type="file"
                  name="file"
                  accept="image/*"
                  required
                  className="w-full text-sm text-gray-400 file:mr-4 file:py-3 file:px-6 file:rounded-full file:bg-gray-700 file:text-white file:border-0 file:font-semibold hover:file:bg-gray-600 cursor-pointer border border-gray-700 rounded-lg p-2"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-gray-400">編集プロンプト</label>
                <textarea
                  name="prompt"
                  placeholder={t('editPlaceholder')}
                  required
                  className="w-full h-24 rounded-lg bg-gray-900 px-4 py-3 border border-gray-700 focus:border-pink-500 outline-none resize-none"
                />
              </div>
              <button type="submit" className="w-full bg-gradient-to-r from-pink-600 to-orange-600 py-3 rounded-lg font-bold hover:opacity-90 transition shadow-lg">
                {t('editButton')}
              </button>
              <p className="text-xs text-gray-500 text-center">{t('editNote')}</p>
            </form>
          </section>
        )}

      </div>
    </div>
  );
}
