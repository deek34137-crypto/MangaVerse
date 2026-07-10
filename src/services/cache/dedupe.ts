const inflight = new Map<string, Promise<any>>();

export function withDeduplication<T>(
  key: string,
  fn: () => Promise<T>
): Promise<T> {
  const existing = inflight.get(key);
  if (existing) {
    return existing as Promise<T>;
  }

  const promise = (async () => {
    try {
      return await fn();
    } finally {
      inflight.delete(key);
    }
  })();

  inflight.set(key, promise);
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