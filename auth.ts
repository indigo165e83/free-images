import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { PrismaClient } from "@prisma/client"

// Initialize Prisma Client
const prisma = new PrismaClient()

export const { handlers, auth, signIn, signOut } = NextAuth({
  // Connect Auth.js to your database
  adapter: PrismaAdapter(prisma),
  // Configure one or more authentication providers
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),
    // ...add more providers here if you want
  ],
  // Callbacks are used to control what happens when an action is performed.
  callbacks: {
    // Add the user ID to the session object
    session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
      }
      return session
    },
  },
})