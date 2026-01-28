import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "AI画像生成プロンプトのコツ | Free Images",
  description: "GeminiやDALL-E 3を使って高品質なAI画像を生成するためのプロンプト（呪文）の書き方やコツを解説します。",
};

export default function TipsPage() {
  return (
    <main className="min-h-screen bg-gray-900 text-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-gray-800 rounded-xl shadow-2xl border border-gray-700 overflow-hidden">
        
        {/* ヘッダー画像エリア（装飾） */}
        <div className="h-48 bg-gradient-to-r from-indigo-600 to-purple-600 flex items-center justify-center">
          <h1 className="text-3xl md:text-4xl font-bold text-white drop-shadow-lg text-center px-4">
            AI画像生成<br/>プロンプトのコツ
          </h1>
        </div>

        <div className="p-8 space-y-8">
          {/* 導入 */}
          <section>
            <p className="text-gray-300 leading-relaxed">
              AIを使って思い通りの画像を生成するのは、最初は難しく感じるかもしれません。「なんとなくイメージと違う」「手足がおかしい」といった失敗は、プロンプト（AIへの指示出し）を少し工夫するだけで劇的に改善します。<br/>
              このページでは、GeminiやDALL-E 3などの最新AIモデルで使える、効果的なプロンプトの構成テクニックを紹介します。
            </p>
          </section>

          {/* セクション1 */}
          <section>
            <h2 className="text-2xl font-bold text-indigo-400 mb-4 border-b border-gray-700 pb-2">
              1. 魔法の公式：4つの要素を入れる
            </h2>
            <p className="text-gray-300 mb-4">
              漠然と「猫」とだけ入力するのではなく、以下の4つの要素を組み込むことで、AIはより明確なイメージを持つことができます。
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-300 ml-4 bg-gray-900/50 p-6 rounded-lg border border-gray-700">
              <li><span className="font-bold text-white">被写体 (Subject):</span> 何が映っているか（例：サイバーパンクな猫）</li>
              <li><span className="font-bold text-white">行動 (Action):</span> 何をしているか（例：ネオン街を走っている）</li>
              <li><span className="font-bold text-white">スタイル (Style):</span> 画風は何か（例：油絵風、アニメ調、3Dレンダリング）</li>
              <li><span className="font-bold text-white">環境 (Environment):</span> 照明や背景（例：雨の夜、紫色のライト）</li>
            </ul>
          </section>

          {/* セクション2 */}
          <section>
            <h2 className="text-2xl font-bold text-indigo-400 mb-4 border-b border-gray-700 pb-2">
              2. 具体的なキーワードを使う
            </h2>
            <p className="text-gray-300 mb-4">
              「きれいな」や「すごい」といった抽象的な言葉よりも、具体的な形容詞や名詞を使う方がAIには伝わります。
            </p>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-red-900/20 border border-red-900/50 p-4 rounded-lg">
                <h3 className="font-bold text-red-400 mb-2">❌ 悪い例</h3>
                <p className="text-gray-400">かっこいい車</p>
              </div>
              <div className="bg-green-900/20 border border-green-900/50 p-4 rounded-lg">
                <h3 className="font-bold text-green-400 mb-2">⭕ 良い例</h3>
                <p className="text-gray-400">
                  未来的なスポーツカー、流線型、メタリックシルバー、濡れたアスファルトの上、映画のような照明
                </p>
              </div>
            </div>
          </section>

          {/* セクション3 */}
          <section>
            <h2 className="text-2xl font-bold text-indigo-400 mb-4 border-b border-gray-700 pb-2">
              3. 英語プロンプトの活用
            </h2>
            <p className="text-gray-300 leading-relaxed">
              最新のモデル（Geminiなど）は日本語も理解しますが、学習データの多くは英語であるため、英語で指示した方がよりニュアンスが正確に伝わることがあります。<br/>
              DeepLやChatGPTを使って、日本語の指示を英語に翻訳してから入力してみるのも一つの手です。
            </p>
          </section>

          {/* リンク */}
          <div className="pt-8 border-t border-gray-700 text-center">
            <p className="text-gray-400 mb-6">
              さあ、AIで作成した作品を見てみましょう！
            </p>
            <Link 
              href="/" 
              className="inline-block bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold py-3 px-8 rounded-full hover:opacity-90 transition transform hover:scale-105 shadow-lg"
            >
              画像を探す
            </Link>
          </div>

        </div>
      </div>
    </main>
  );
}