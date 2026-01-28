import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';

// i18n/request.ts へのパスを明示的に指定します
const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

const nextConfig: NextConfig = {
  /* config options here */
  // i18n設定など、他の設定をここに追加できます
  // i18n: { ... }, 
  images: {
    // 許可するホスト名（ドメイン）のリスト
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/seed/**', // picsum.photos の特定のパスからの読み込みを許可
      },
      {
        protocol: "https",
        hostname: "*.googleusercontent.com", // Googleログインのアイコン用
      },
      {
        protocol: "https",
        hostname: "*.s3.ap-northeast-1.amazonaws.com", // S3の画像用
      },
    ],
  },
  // Server Actionsのボディサイズ制限を緩和 (4MBに設定)
  // Vercel のインフラ（Serverless Functions）自体に「リクエストボディは最大 4.5MB まで」という物理的な制限があります。
  experimental: {
    serverActions: {
      bodySizeLimit: '4mb',
    },
  },  
};

export default withNextIntl(nextConfig);
