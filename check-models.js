require('dotenv').config();

async function main() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("❌ APIキーがありません");
    return;
  }

  // SDKの読み込み
  const module = require("@google/generative-ai");
  const GoogleGenerativeAI = module.GoogleGenerativeAI || module.default?.GoogleGenerativeAI;
  
  const genAI = new GoogleGenerativeAI(apiKey);

  try {
    console.log("📡 利用可能なモデル一覧を問い合わせ中...");
    
    // モデル一覧を取得する特別な管理者機能（getGenerativeModelではなく、listModelsを使わないといけないが、
    // SDKのバージョンによっては簡易的な方法がないため、あえて gemini-pro での疎通確認を優先し、
    // エラーメッセージ内のリストを期待するか、下記の方法でリスト取得を試みます）

    // モデルマネージャーからリストを取得（SDKの標準機能）
    const modelResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    const data = await modelResponse.json();

    if (data.models) {
      console.log("\n✅ あなたのアカウントで利用可能なモデル一覧:");
      data.models.forEach(model => {
        // "generateContent" に対応しているモデルだけを表示
        if (model.supportedGenerationMethods.includes("generateContent")) {
          console.log(` - ${model.name.replace("models/", "")}`);
        }
      });
      console.log("\n👉 上記のリストにある名前をコードに使ってください。");
    } else {
      console.error("❌ モデル一覧が取得できませんでした:", data);
    }

  } catch (error) {
    console.error("❌ 失敗しました:", error.message);
  }
}

main();