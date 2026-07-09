import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { SignJWT } from "jose";
import { z } from "zod";

const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "your-super-secret-jwt-key-change-in-production"
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = forgotPasswordSchema.parse(body);

    const user = await db
      .select()
      .from(users)
      .where(eq(users.email, validated.email))
      .limit(1);

    if (user.length === 0) {
      return NextResponse.json(
        { message: "If the email exists, a verification code has been sent" },
        { status: 200 }
      );
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 15 * 60 * 1000;

    const token = await new SignJWT({
      email: validated.email,
      code,
      type: "password-reset",
    })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime("15m")
      .sign(JWT_SECRET);

    console.log(`Password reset code for ${validated.email}: ${code}`);

    return NextResponse.json(
      { message: "If the email exists, a verification code has been sent" },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }
    console.error("Forgot password error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}