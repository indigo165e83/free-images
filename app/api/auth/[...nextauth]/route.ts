import { handlers } from "@/auth" // auth.ts から handlers オブジェクトをインポート
export const { GET, POST } = handlers // handlers 内にある GET と POST 関数を分割代入してエクスポート