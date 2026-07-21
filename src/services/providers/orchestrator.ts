import { policyEngine, PolicyEngine } from "./policy-engine";
import { ContractValidator } from "./contract-validator";
import { eventBus } from "../infrastructure/event-bus";
import { RequestContext } from "../infrastructure/request-context";
import type { RawProviderManga, RawProviderChapter, RawProviderPage } from "./shared/types";

export class ProviderOrchestrator {
  private static instance: ProviderOrchestrator;

  private constructor() {}

  public static getInstance(): ProviderOrchestrator {
    if (!ProviderOrchestrator.instance) {
      ProviderOrchestrator.instance = new ProviderOrchestrator();
    }
    return ProviderOrchestrator.instance;
  }

  /**
   * Searches manga across providers with automatic failover and latency budgets.
   */
  public async searchManga(
    query: string,
    ctx: RequestContext = new RequestContext()
  ): Promise<RawProviderManga[]> {
    const candidates = policyEngine.selectProviders("discovery", ctx);
    const maxAttempts = Math.min(candidates.length, policyEngine.getProfile().maxFailoverAttempts);

    for (let i = 0; i < maxAttempts; i++) {
      if (ctx.isExpired()) break;

      const provider = candidates[i];
      const startTime = Date.now();
      const providerId = provider.name.toLowerCase();

      try {
        const rawResults = await provider.searchManga(query, { limit: 20 });
        const durationMs = Date.now() - startTime;

        const validResults: RawProviderManga[] = [];
        for (const item of rawResults || []) {
          const validated = ContractValidator.validateManga(item, providerId);
          if (validated.isValid && validated.sanitized) {
            validResults.push(validated.sanitized);
          }
        }

        eventBus.emit("provider:succeeded", {
          version: 1,
          providerId,
          operation: "searchManga",
          durationMs,
          requestId: ctx.requestId,
          traceId: ctx.traceId,
          timestamp: Date.now(),
        });

        if (validResults.length > 0) {
          return validResults;
        }
      } catch (err: any) {
        const durationMs = Date.now() - startTime;
        const errorMessage = err?.message || String(err);
        const isBlocked = errorMessage.includes("403") || errorMessage.includes("Cloudflare");

        if (isBlocked) {
          eventBus.emit("provider:blocked", {
            version: 1,
            providerId,
            operation: "searchManga",
            statusCode: 403,
            durationMs,
            requestId: ctx.requestId,
            traceId: ctx.traceId,
            timestamp: Date.now(),
          });
        } else {
          eventBus.emit("provider:failed", {
            version: 1,
            providerId,
            operation: "searchManga",
            error: errorMessage,
            durationMs,
            requestId: ctx.requestId,
            traceId: ctx.traceId,
            timestamp: Date.now(),
          });
        }

        // Try next provider on failover
        ctx.consumeRetry();
      }
    }

    return [];
  }
}

export const providerOrchestrator = ProviderOrchestrator.getInstance();
export default providerOrchestrator;
