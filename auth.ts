import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import Credentials from "next-auth/providers/credentials"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/lib/prisma" // 修正: create new... ではなく import する
// import { PrismaClient } from "@prisma/client"

// Initialize Prisma Client
// const prisma = new PrismaClient()

export const { handlers, auth, signIn, signOut } = NextAuth({
  // Connect Auth.js to your database
  adapter: PrismaAdapter(prisma), // importしたprismaを使う
  session: { strategy: "jwt" }, //Credentials プロバイダーを追加し、JWTコールバックを実装する場合、セッション戦略は "jwt" に設定します
  // Configure one or more authentication providers
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),
    // ▼▼▼ テスト用プロバイダー (ここから) ▼▼▼
    Credentials({
      id: "test-login",
      name: "Test Login",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        // 本番環境(production)以外ならOKにする
        // これにより、npm run dev (development) で起動したサーバーでもログイン可能になります
        if (process.env.NODE_ENV === "production") {
          return null;
        }
        
        // 環境変数から読み込む
        const testEmail = process.env.TEST_ADMIN_EMAIL;
        const testPassword = process.env.TEST_ADMIN_PASSWORD;

        // 環境変数が設定されていない場合はログインさせない（安全策）
        if (!testEmail || !testPassword) {
          return null;
        }

        // 特定のメールとパスワードが来たときだけ管理者ユーザーを返す
        if (
          credentials.email === testEmail && 
          credentials.password === testPassword
        ) {
          return {
            id: "test-admin-id",
            name: "Test Admin",
            email: testEmail,
            role: "ADMIN", // ★重要: ここで管理者権限を付与
            image: "https://placehold.co/100x100",
          }
        }
        return null;
      },
    }),
    // ▲▲▲ テスト用プロバイダー (ここまで) ▲▲▲
  ],
  // Callbacks are used to control what happens when an action is performed.
  callbacks: {
    // 1. JWTコールバック: ログイン時にユーザー情報（roleなど）をトークンに保存する
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role; // DBまたはCredentialsから来たroleをトークンに入れる
      }
      // Debug: トークン内容を確認
      //console.log("DEBUG [JWT]:", token); // サーバー側のログで規約通りの sub や exp を確認
      return token;
    },
    // 2. セッションコールバック: トークンから情報を取り出してセッションにセットする
    async session({ session, token }) {
      if (session.user && token) {
        session.user.id = token.id as string;  //ID割り当て
        session.user.role = token.role as string;  // トークン内のroleをセッションに反映
      }
      return session
    },
  },
})