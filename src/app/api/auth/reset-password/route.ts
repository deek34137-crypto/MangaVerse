import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { SignJWT, jwtVerify } from "jose";
import { hash } from "bcryptjs";
import { z } from "zod";

const resetPasswordSchema = z.object({
  email: z.string().email(),
  code: z.string().length(6),
  password: z.string().min(8),
});

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "your-super-secret-jwt-key-change-in-production"
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = resetPasswordSchema.parse(body);

    const token = request.cookies.get("reset-token")?.value;

    if (!token) {
      return NextResponse.json(
        { error: "Invalid or expired session" },
        { status: 400 }
      );
    }

    try {
      const { payload } = await jwtVerify(token, JWT_SECRET);

      if (
        payload.email !== validated.email ||
        payload.code !== validated.code ||
        payload.type !== "password-reset" ||
        !payload.verified
      ) {
        return NextResponse.json(
          { error: "Invalid verification code" },
          { status: 400 }
        );
      }

      const user = await db
        .select()
        .from(users)
        .where(eq(users.email, validated.email))
        .limit(1);

      if (user.length === 0) {
        return NextResponse.json(
          { error: "User not found" },
          { status: 404 }
        );
      }

      const passwordHash = await hash(validated.password, 12);

      await db
        .update(users)
        .set({
          passwordHash,
          updatedAt: new Date(),
        })
        .where(eq(users.email, validated.email));

      const response = NextResponse.json(
        { message: "Password reset successfully" },
        { status: 200 }
      );

      response.cookies.delete("reset-token");

      return response;
    } catch {
      return NextResponse.json(
        { error: "Invalid or expired token" },
        { status: 400 }
      );
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }
    console.error("Reset password error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}