const inflight = new Map<string, Promise<any>>();

interface DeduplicationOptions<T> {
  key: string;
  fn: () => Promise<T>;
  maxAge?: number;
}

export async function withDeduplication<T>(options: { key: string; fn: () => Promise<T>; maxAge?: number }): Promise<any> {
  const { key, fn, maxAge = 30000 } = options;

  const existing = inflight.get(key);
  if (existing) {
    return existing as Promise<any>;
  }

  const promise = (async () => {
    try {
      return await fn();
    } finally {
      inflight.delete(key);
    }
  })();

  inflight.set(key, promise);

  setTimeout(() => {
    inflight.delete(key);
  }, 30000);

  return promise;
}

export function clearDeduplication(key?: string): void {
  if (key) {
    inflight.delete(key);
  } else {
    inflight.clear();
  }
}

export function getInflightCount(): number {
  return inflight.size;
}