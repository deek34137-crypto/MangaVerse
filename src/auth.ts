import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { authConfig } from "./auth.config";
import { db } from "@/db";
import { users, oauthAccounts, userPreferences, userStats } from "@/db/schema";
import { eq } from "drizzle-orm";
import { compare } from "bcryptjs";
import { z } from "zod";

const DEBUG_PERF = process.env.NODE_ENV === "development";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  callbacks: {
    ...authConfig.callbacks,
    async signIn({ user, account, profile }) {
      if (account && account.provider !== "credentials") {
        try {
          const email = user.email;
          if (!email) return false;

          const existing = await db
            .select()
            .from(users)
            .where(eq(users.email, email))
            .limit(1);

          let userId: string;

          if (existing.length === 0) {
            const username = email.split("@")[0].replace(/[^a-zA-Z0-9_]/g, "") + "_" + Math.random().toString(36).slice(2, 6);
            const displayName = (profile?.name as string) || user.name || username;
            const avatar = (profile?.image as string) || user.image || null;

            const newUser = await db
              .insert(users)
              .values({
                email,
                username,
                displayName,
                avatar,
                emailVerified: true,
                role: "user",
              })
              .returning({ id: users.id });

            userId = newUser[0].id;

            await Promise.all([
              db.insert(userPreferences).values({ userId }),
              db.insert(userStats).values({ userId }),
            ]);
          } else {
            userId = existing[0].id;
          }

          await db
            .insert(oauthAccounts)
            .values({
              userId,
              provider: account.provider,
              providerAccountId: account.providerAccountId,
              accessToken: account.access_token || null,
              refreshToken: account.refresh_token || null,
              expiresAt: account.expires_at || null,
              tokenType: account.token_type || null,
              scope: account.scope || null,
              idToken: account.id_token || null,
            })
            .onConflictDoNothing();

          return true;
        } catch (error) {
          console.error("OAuth signIn error:", error);
          return false;
        }
      }
      return true;
    },

    async jwt({ token, user, account }) {
      const startJwtTime = Date.now();
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.username = (user as any).username;
        token.displayName = (user as any).displayName;
        token.avatar = user.image ?? (user as any).avatar;
      }

      if (account && account.provider !== "credentials" && !token.id) {
        const email = token.email;
        if (email) {
          const dbStart = Date.now();
          const dbUser = await db
            .select()
            .from(users)
            .where(eq(users.email, email))
            .limit(1);
          if (DEBUG_PERF) {
            console.log(`[Auth Callback] JWT OAuth db select took ${Date.now() - dbStart}ms`);
          }

          if (dbUser[0]) {
            token.id = dbUser[0].id;
            token.role = dbUser[0].role;
            token.username = dbUser[0].username;
            token.displayName = dbUser[0].displayName;
            token.avatar = dbUser[0].avatar ?? undefined;
          }
        }
      }

      if (DEBUG_PERF) {
        console.log(`[Auth Callback] JWT callback took ${Date.now() - startJwtTime}ms`);
      }
      return token;
    },

    async session({ session, token }) {
      const startSessionTime = Date.now();
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.username = token.username as string;
        session.user.displayName = token.displayName as string;
        session.user.avatar = token.avatar as string | undefined;
      }
      if (DEBUG_PERF) {
        console.log(`[Auth Callback] Session callback took ${Date.now() - startSessionTime}ms`);
      }
      return session;
    },
  },
  providers: [
    ...authConfig.providers,
    Credentials({
      name: "credentials",
      credentials: {
        email:    { label: "Email",    type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = z
          .object({
            email:    z.string().email(),
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
          id:          user[0].id,
          email:       user[0].email,
          username:    user[0].username,
          displayName: user[0].displayName,
          avatar:      user[0].avatar ?? undefined,
          role:        user[0].role,
        };
      },
    }),
  ],
});