import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users, userPreferences, userStats } from "@/db/schema";
import { eq } from "drizzle-orm";
import { hash } from "bcryptjs";
import { z } from "zod";
const registerSchema = z.object({
  displayName: z.string().min(2).max(100),
  username: z.string().min(3).max(50).regex(/^[a-zA-Z0-9_]+$/),
  email: z.string().email(),
  password: z.string().min(8),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = registerSchema.parse(body);

    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, validated.email))
      .limit(1);

    if (existingUser.length > 0) {
      return NextResponse.json(
        { error: "Email already registered" },
        { status: 400 }
      );
    }

    const existingUsername = await db
      .select()
      .from(users)
      .where(eq(users.username, validated.username.toLowerCase()))
      .limit(1);

    if (existingUsername.length > 0) {
      return NextResponse.json(
        { error: "Username already taken" },
        { status: 400 }
      );
    }

    const passwordHash = await hash(validated.password, 12);

    await db.transaction(async (tx) => {
      const [newUser] = await tx.insert(users).values({
        email: validated.email,
        username: validated.username.toLowerCase(),
        displayName: validated.displayName,
        passwordHash,
        role: "user",
        emailVerified: false,
      }).returning({ id: users.id });

      const userId = newUser.id;

      await tx.insert(userPreferences).values({
        userId,
        theme: "dark",
        readingDirection: "rtl",
        pageTransition: "slide",
        imageQuality: "high",
        autoPlay: false,
        autoPlayDelay: 3000,
        showMature: false,
        languages: ["en"],
        notifications: {
          email: true,
          push: true,
          newChapter: true,
          libraryUpdates: true,
          recommendations: true,
          social: true,
        },
        privacy: {
          profileVisibility: "public",
          libraryVisibility: "public",
          historyVisibility: "private",
          activityVisibility: "public",
        },
      });

      await tx.insert(userStats).values({
        userId,
        mangaRead: 0,
        chaptersRead: 0,
        timeSpent: 0,
        daysActive: 0,
        favoriteGenres: [],
        readingStreak: 0,
      });
    });

    return NextResponse.json(
      { message: "Account created successfully" },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}