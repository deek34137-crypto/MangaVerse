export class ProviderError extends Error {
  constructor(
    public providerName: string,
    message: string,
    public code: string,
    public retryable: boolean = true
  ) {
    super(`[Provider ${providerName}] ${message}`);
    this.name = "ProviderError";
  }
}

export class ProviderTimeout extends ProviderError {
  constructor(providerName: string, timeoutMs: number) {
    super(providerName, `Request timed out after ${timeoutMs}ms`, "TIMEOUT", true);
    this.name = "ProviderTimeout";
  }
}

export class ProviderRateLimited extends ProviderError {
  constructor(providerName: string, public retryAfterMs?: number) {
    super(providerName, `Rate limit exceeded. Retry after ${retryAfterMs || "unknown"}ms`, "RATE_LIMITED", true);
    this.name = "ProviderRateLimited";
  }
}

export class ProviderUnavailable extends ProviderError {
  constructor(providerName: string, details?: string) {
    super(providerName, `Service unavailable: ${details || "No details provided"}`, "UNAVAILABLE", true);
    this.name = "ProviderUnavailable";
  }
}

export class ParsingFailure extends ProviderError {
  constructor(providerName: string, details: string) {
    super(providerName, `Parsing failed: ${details}`, "PARSING_FAILURE", false);
    this.name = "ParsingFailure";
  }
}

export class ProviderBlocked extends ProviderError {
  constructor(providerName: string, details?: string) {
    super(providerName, `Request blocked (403): ${details || "No details provided"}`, "BLOCKED", false);
    this.name = "ProviderBlocked";
  }
}

export class ProviderNotFound extends ProviderError {
  constructor(providerName: string, details?: string) {
    super(providerName, `Resource not found (404): ${details || "No details provided"}`, "NOT_FOUND", false);
    this.name = "ProviderNotFound";
  }
}
