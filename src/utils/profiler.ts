export class RequestProfiler {
  private startTime: number;
  private timings: {
    label: string;
    duration: number;
    cache?: "HIT" | "MISS" | "BYPASS";
    rows?: number;
  }[] = [];

  constructor(private requestLabel: string) {
    this.startTime = performance.now();
  }

  async profile<T>(
    label: string,
    fn: () => Promise<T>,
    options?: {
      getCacheStatus?: (res: T) => "HIT" | "MISS" | "BYPASS";
      getRowsCount?: (res: T) => number;
    }
  ): Promise<T> {
    const start = performance.now();
    try {
      const result = await fn();
      const duration = performance.now() - start;

      const cache = options?.getCacheStatus ? options.getCacheStatus(result) : undefined;
      const rows = options?.getRowsCount ? options.getRowsCount(result) : undefined;

      this.timings.push({ label, duration, cache, rows });
      return result;
    } catch (err) {
      const duration = performance.now() - start;
      this.timings.push({ label, duration });
      throw err;
    }
  }

  logResult() {
    const totalDuration = performance.now() - this.startTime;
    console.log(`\n=== Profiling: ${this.requestLabel} ===`);
    this.timings.forEach(({ label, duration, cache, rows }) => {
      let metrics = "";
      if (cache !== undefined) metrics += ` | Cache: ${cache}`;
      if (rows !== undefined) metrics += ` | Rows: ${rows}`;
      console.log(`  - ${label}: ${duration.toFixed(1)}ms${metrics}`);
    });
    console.log(`  Total: ${totalDuration.toFixed(1)}ms`);
    console.log(`====================================\n`);
  }
}
