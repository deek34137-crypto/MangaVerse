export function getDefaultHeaders(
  responseType: "json" | "text" | "buffer",
  customHeaders?: Record<string, string> | HeadersInit
): Record<string, string> {
  const defaultAccept = responseType === "json"
    ? "application/json"
    : "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8";

  const headersObj: Record<string, string> = {
    "Accept": defaultAccept,
    "User-Agent": "MangaHub-Aggregator/1.0",
  };

  if (customHeaders) {
    if (customHeaders instanceof Headers || Array.isArray(customHeaders)) {
      const entries = new Headers(customHeaders).entries();
      for (const [key, value] of entries) {
        headersObj[key] = value;
      }
    } else {
      Object.assign(headersObj, customHeaders);
    }
  }

  return headersObj;
}
