type LogLevel = "info" | "warn" | "error" | "debug";

interface LogPayload {
  message: string;
  level: LogLevel;
  timestamp: string;
  context?: string;
  [key: string]: any;
}

export const logger = {
  log(level: LogLevel, message: string, meta: Record<string, any> = {}, context?: string) {
    const payload: LogPayload = {
      message,
      level,
      timestamp: new Date().toISOString(),
      context,
      ...meta,
    };

    if (process.env.NODE_ENV === "production") {
      console.log(JSON.stringify(payload));
    } else {
      const color = level === "error" ? "\x1b[31m" : level === "warn" ? "\x1b[33m" : "\x1b[32m";
      const reset = "\x1b[0m";
      const ctxStr = context ? `[${context}] ` : "";
      console.log(
        `${color}${payload.timestamp} [${level.toUpperCase()}] ${ctxStr}${message}${reset}`,
        Object.keys(meta).length > 0 ? meta : ""
      );
    }
  },

  info(message: string, meta?: Record<string, any>, context?: string) {
    this.log("info", message, meta, context);
  },

  warn(message: string, meta?: Record<string, any>, context?: string) {
    this.log("warn", message, meta, context);
  },

  error(message: string, meta?: Record<string, any>, context?: string) {
    this.log("error", message, meta, context);
  },

  debug(message: string, meta?: Record<string, any>, context?: string) {
    this.log("debug", message, meta, context);
  },
};

const metricsStore = new Map<string, number[]>();

export const metrics = {
  record(name: string, value: number) {
    let values = metricsStore.get(name);
    if (!values) {
      values = [];
      metricsStore.set(name, values);
    }
    values.push(value);
    
    // Keep max 100 values to prevent memory leaks
    if (values.length > 100) {
      values.shift();
    }
  },

  getAverage(name: string): number {
    const values = metricsStore.get(name);
    if (!values || values.length === 0) return 0;
    const sum = values.reduce((a, b) => a + b, 0);
    return sum / values.length;
  },

  dump() {
    const report: Record<string, any> = {};
    for (const [name, values] of metricsStore.entries()) {
      if (values.length === 0) continue;
      report[name] = {
        avg: (values.reduce((a, b) => a + b, 0) / values.length).toFixed(2),
        min: Math.min(...values).toFixed(2),
        max: Math.max(...values).toFixed(2),
        count: values.length,
      };
    }
    return report;
  }
};
