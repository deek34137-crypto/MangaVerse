import { NextRequest, NextResponse } from "next/server";
import { processQueueBatch } from "@/services/queue/worker";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    console.log("[cron-queue] Starting queue batch process...");
    
    // Drain up to 10 jobs per invocation
    const processedCount = await processQueueBatch(10);
    
    console.log(`[cron-queue] Queue batch completed. Processed ${processedCount} jobs`);

    return NextResponse.json({
      success: true,
      processed: processedCount,
    });
  } catch (error: any) {
    console.error("[cron-queue] Queue batch processing failed:", error);
    return NextResponse.json(
      { error: "Queue processing failed", message: error.message || String(error) },
      { status: 500 }
    );
  }
}
