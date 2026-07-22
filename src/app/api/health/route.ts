import { NextResponse } from "next/server";

const START_TIME = Date.now();

export async function GET() {
  const uptimeSeconds = Math.floor((Date.now() - START_TIME) / 1000);

  return NextResponse.json(
    {
      status: "ok",
      version: "1.0.0",
      gitCommitSha: process.env.VERCEL_GIT_COMMIT_SHA || "local-dev-build",
      uptime: `${uptimeSeconds}s`,
      timestamp: new Date().toISOString(),
    },
    { status: 200 }
  );
}