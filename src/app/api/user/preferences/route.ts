import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { userPreferences } from "@/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

const preferencesSchema = z.object({
  theme: z.string().optional(),
  readingDirection: z.string().optional(),
  pageTransition: z.string().optional(),
  imageQuality: z.string().optional(),
  autoPlay: z.boolean().optional(),
  autoPlayDelay: z.number().optional(),
  showMature: z.boolean().optional(),
  languages: z.array(z.string()).optional(),
  notifications: z.record(z.boolean()).optional(),
  privacy: z.record(z.string()).optional(),
});

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const prefs = await db
      .select()
      .from(userPreferences)
      .where(eq(userPreferences.userId, session.user.id))
      .limit(1);

    if (prefs.length === 0) {
      // Create default preferences
      const [newPrefs] = await db
        .insert(userPreferences)
        .values({ userId: session.user.id })
        .returning();
      return NextResponse.json({ preferences: newPrefs });
    }

    return NextResponse.json({ preferences: prefs[0] });
  } catch (error: any) {
    console.error("[UserPreferencesAPI] Error fetching preferences:", error);
    return NextResponse.json({ error: "Failed to fetch preferences" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = preferencesSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid preferences payload" }, { status: 400 });
    }

    const userId = session.user.id;
    const updateData = {
      ...parsed.data,
      updatedAt: new Date(),
    };

    const existing = await db
      .select({ userId: userPreferences.userId })
      .from(userPreferences)
      .where(eq(userPreferences.userId, userId))
      .limit(1);

    if (existing.length === 0) {
      await db.insert(userPreferences).values({
        userId,
        ...updateData,
      });
    } else {
      await db
        .update(userPreferences)
        .set(updateData)
        .where(eq(userPreferences.userId, userId));
    }

    return NextResponse.json({ success: true, updated: updateData });
  } catch (error: any) {
    console.error("[UserPreferencesAPI] Error updating preferences:", error);
    return NextResponse.json({ error: "Failed to update preferences" }, { status: 500 });
  }
}
