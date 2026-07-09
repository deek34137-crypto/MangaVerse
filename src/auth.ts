import NextAuth, { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { compare } from "bcryptjs";
import { z } from "zod";

export const authConfig: NextAuthConfig = {
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnDashboard = nextUrl.pathname.startsWith("/library") ||
        nextUrl.pathname.startsWith("/history") ||
        nextUrl.pathname.startsWith("/recommendations") ||
        nextUrl.pathname.startsWith("/settings");

      if (isOnDashboard) {
        if (isLoggedIn) return true;
        return false;
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.username = user.username;
        token.displayName = user.displayName;
        token.avatar = user.avatar;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.username = token.username as string;
        session.user.displayName = token.displayName as string;
        session.user.avatar = token.avatar;
      }
      return session;
    },
  },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, _request) {
        const parsed = z
          .object({
            email: z.string().email(),
            password: z.string().min(8),
          })
          .safeParse(credentials);

        if (!parsed.success) return null;

        const { email, password } = parsed.data;

        const user = await db
          .select()
          .from(users)
          .where(eq(users.email, email))
          .limit(1);

        if (user.length === 0) return null;

        const isValid = await compare(password, user[0].passwordHash!);

        if (!isValid) return null;

        await db
          .update(users)
          .set({ lastLoginAt: new Date() })
          .where(eq(users.id, user[0].id));

        return {
          id: user[0].id,
          email: user[0].email,
          username: user[0].username,
          displayName: user[0].displayName,
          avatar: user[0].avatar ?? undefined,
          role: user[0].role,
        };
      },
    }),
    // OAuth providers (re-enable after implementing signIn/account/profile callbacks):
    // GitHub({
    //   clientId: process.env.GITHUB_ID,
    //   clientSecret: process.env.GITHUB_SECRET,
    // }),
    // Discord({
    //   clientId: process.env.DISCORD_ID,
    //   clientSecret: process.env.DISCORD_SECRET,
    // }),
    // Google({
    //   clientId: process.env.GOOGLE_ID,
    //   clientSecret: process.env.GOOGLE_SECRET,
    // }),
  ],
};

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);