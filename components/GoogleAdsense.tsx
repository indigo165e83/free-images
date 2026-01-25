// components/GoogleAdsense.tsx
import Script from "next/script";

type Props = {
  pId: string; // AdSenseのパブリッシャーID (例: ca-pub-1234567890123456)
};

export default function GoogleAdsense({ pId }: Props) {
  if (process.env.NODE_ENV !== "production") {
    return null; // 開発環境では表示しない
  }

  return (
    <Script
      async
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${pId}`}
      crossOrigin="anonymous"
      strategy="afterInteractive"
    />
  );
}