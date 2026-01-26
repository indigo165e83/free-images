import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import GoogleAdsense from "@/components/GoogleAdsense";

/*
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});
*/

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: "Free Images",
  description: "This is a website for free, AI-generated images",
  // ↓ Google Adsenseプロパティを追加
  other: {
    'google-adsense-account': 'ca-pub-6897468555074184',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.className} bg-gray-900 text-white`}
      >
        {/* IDは環境変数から読み込むのがベスト */}
        <GoogleAdsense pId={process.env.NEXT_PUBLIC_GOOGLE_ADSENSE_ID!} />
        {children}

        {/* フッター */}
        <footer className="bg-gray-900 text-gray-400 py-8 mt-12 border-t border-gray-800">
          <div className="container mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm">© 2026 Free Images. All rights reserved.</p>
            <div className="flex gap-6 text-sm">
              <Link href="/tips" className="hover:text-white transition" target="_blank" rel="noopener noreferrer"> 
                画像生成のコツ
              </Link>              
              <Link href="/privacy-policy" className="hover:text-white transition">
                プライバシーポリシー
              </Link>
              {/* お問い合わせフォームができたらここに追加 */}
              {/* <Link href="/contact" className="hover:text-white transition">お問い合わせ</Link> */}
              <a href="https://forms.gle/feuypDPrskygUFFT6" className="hover:underline" target="_blank" rel="noopener noreferrer">
                お問い合わせ
              </a>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
