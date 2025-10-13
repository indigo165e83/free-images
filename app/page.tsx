// app/page.tsx
import Image from 'next/image';
import { Search } from 'lucide-react'; // アイコン用に lucide-react をインストール (pnpm add lucide-react)

export default function Home() {
  // ダミーの画像データ。実際にはAPIなどから取得します。
  // 画像グリッドを有効にするため、この定義をコンポーネント内に保持します。
  const images = Array.from({ length: 32 }, (_, i) => `https://picsum.photos/seed/${i + 1}/500/500`);

  return (
    <main className="min-h-screen">
      {/* ヒーローセクション */}
      <div
        className="relative flex h-[70vh] flex-col items-center bg-cover bg-center"
        style={{ backgroundImage: "url('/beach_01.jpg')" }} // 自身のヒーロー画像パスに置き換える
      >
        {/* 背景色とオーバーレイ */}
        <div className="absolute inset-0 bg-indigo-800/70" />

        {/* ヘッダー */}
        <header className="relative z-10 flex w-full max-w-7xl items-center justify-between p-6">
          <h1 className="text-2xl text-white font-bold">Free Images</h1>
          <nav className="hidden text-white items-center space-x-6 text-sm font-medium md:flex">
            <a href="#" className="hover:text-gray-300">新着</a>
            <a href="#" className="hover:text-gray-300">人気</a>
            <a href="#" className="hover:text-gray-300">AI</a>
            <a href="#" className="hover:text-gray-300">カテゴリ</a>
          </nav>
        </header>

        {/* 中央のコンテンツ */}
        <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-4 text-center">
          <h2 className="text-4xl font-bold tracking-tight text-white sm:text-5xl md:text-6xl">
            AIで生成したフリー画像
          </h2>
          <div className="mt-8 flex w-full max-w-md items-center rounded-full bg-white/20 p-2 backdrop-blur-sm">
            <Search className="ml-3 h-5 w-5 text-gray-300" />
            <input
              type="text"
              placeholder="キーワードで検索..."
              className="w-full bg-transparent px-4 text-white placeholder-gray-300 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* 画像グリッドセクション */}
      <div className="mx-auto max-w-7xl px-4 py-8 -mt-16 relative z-20"> 
        <h3 className="text-2xl font-bold text-white mb-6">最新のAIアート</h3>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {/* 改善点4: コメントアウトを外し、グリッドを有効化 */}
          {images.map((src, index) => (
            <div key={index} className="aspect-square overflow-hidden rounded-lg shadow-2xl transition hover:shadow-indigo-500/50">
              <Image
                src={src}
                alt={`Generated image ${index + 1}`}
                width={500}
                height={500}
                // 画像がロードされるまで最小の高さを設定
                placeholder="blur" 
                blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII="
                className="h-full w-full object-cover transition-transform duration-500 hover:scale-110"
              />
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}