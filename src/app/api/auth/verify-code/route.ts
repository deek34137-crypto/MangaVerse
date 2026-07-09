import { NextRequest, NextResponse } from "next/server";
import { SignJWT, jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "your-super-secret-jwt-key-change-in-production"
);

const verifyCodeSchema = {
  email: "string",
  code: "string",
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, code } = body;

    if (!email || !code) {
      return NextResponse.json(
        { error: "Email and code are required" },
        { status: 400 }
      );
    }

    const token = request.cookies.get("reset-token")?.value;

    if (!token) {
      return NextResponse.json(
        { error: "Invalid or expired token" },
        { status: 400 }
      );
    }

    try {
      const { payload } = await jwtVerify(token, JWT_SECRET);

      if (payload.email !== email || payload.code !== code || payload.type !== "password-reset") {
        return NextResponse.json(
          { error: "Invalid verification code" },
          { status: 400 }
        );
      }

      const newToken = await new SignJWT({
        email,
        verified: true,
        type: "password-reset",
      })
        .setProtectedHeader({ alg: "HS256" })
        .setExpirationTime("10m")
        .sign(JWT_SECRET);

      const response = NextResponse.json(
        { message: "Code verified successfully" },
        { status: 200 }
      );

      response.cookies.set("reset-token", newToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 600,
        path: "/",
      });

      return response;
    } catch {
      return NextResponse.json(
        { error: "Invalid or expired token" },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Verify code error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}