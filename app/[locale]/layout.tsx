import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Link from "next/link";
// import GoogleAdsense from "@/components/GoogleAdsense"; // AdSense審査通過後に再有効化
import {NextIntlClientProvider} from 'next-intl';
import {getMessages, getTranslations} from 'next-intl/server';

const inter = Inter({ subsets: ['latin'] });

// 動的なメタデータの生成 (SEO対策)
export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Footer' });
  const tHome = await getTranslations({ locale, namespace: 'HomePage' });

  // サイトのベースURLを設定 (これがないと相対パスで警告が出ることがある)
  const baseUrl = 'https://free-images.indigo165e83.com';

  return {
    metadataBase: new URL(baseUrl),
    title: tHome('title'),
    description: t('description'),
    // 検索エンジンに「日本語版と英語版がある」と伝える設定
    alternates: {
      canonical: `/${locale}`, // 現在のページの正規URL
      languages: {
        ja: '/ja',
        en: '/en',
      },
    },
    // AdSense審査通過後に再有効化
    // other: {
    //   'google-adsense-account': 'ca-pub-6897468555074184',
    // },
  };
}

export default async function RootLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{locale: string}>;  // Promiseとして定義
}>) {
  const { locale } = await params; // ここで await する
  const messages = await getMessages();
  const t = await getTranslations({ locale, namespace: 'Footer' });
  
  return (
    <html lang={locale}>
      <body
        className={`${inter.className} bg-gray-900 text-white`}
      >
        {/* IDは環境変数から読み込むのがベスト */}
        {/* AdSense審査通過後に再有効化 */}
        {/* <GoogleAdsense pId={process.env.NEXT_PUBLIC_GOOGLE_ADSENSE_ID!} /> */}
        <NextIntlClientProvider messages={messages}>
          {children}
        </NextIntlClientProvider>
        {/* フッター */}
        <footer className="bg-gray-900 text-gray-400 py-8 mt-12 border-t border-gray-800">
          <div className="container mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm">© 2026 Free Images. All rights reserved.</p>
            <div className="flex gap-6 text-sm">
              <Link href="/tips" className="hover:text-white transition" target="_blank" rel="noopener noreferrer"> 
                {t('tips')}
              </Link>              
              <Link href="/privacy-policy" className="hover:text-white transition">
                {t('privacyPolicy')}
              </Link>
              {/* お問い合わせフォームができたらここに追加 */}
              {/* <Link href="/contact" className="hover:text-white transition">お問い合わせ</Link> */}
              <a href="https://forms.gle/feuypDPrskygUFFT6" className="hover:underline" target="_blank" rel="noopener noreferrer">
                {t('contact')}
              </a>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
