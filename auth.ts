import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
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