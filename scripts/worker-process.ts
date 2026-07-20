import dotenv from "dotenv";
dotenv.config();

import { processNextQueueJob } from "../src/services/queue/worker";

async function runWorkerLoop() {
  console.log("[Worker Process] Standalone queue worker process started");

  while (true) {
    try {
      const processed = await processNextQueueJob();
      if (!processed) {
        // Queue is empty, wait 5 seconds before checking again
        await new Promise((resolve) => setTimeout(resolve, 5000));
      }
    } catch (err) {
      console.error("[Worker Process] Error in worker loop:", err);
      // Wait 10 seconds on crash before restarting loop
      await new Promise((resolve) => setTimeout(resolve, 10000));
    }
  }
}

runWorkerLoop().catch((err) => {
  console.error("[Worker Process] Fatal error in worker daemon:", err);
  process.exit(1);
});
