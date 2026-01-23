import type { NextConfig } from "next";

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
};

export default nextConfig;
