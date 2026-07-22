# Image Proxy Specification

Version: 1.1  
Last Updated: 2026-07-22  
Related Phase: Phase 3 & Phase 5  
Related Components:  
- ImageProxyRoute (`src/app/api/image/route.ts`)  
- SSRFValidator  
- ActiveFetchDeduplicator  

This document details the security configurations, request headers routing, and SSRF (Server-Side Request Forgery) protection policies implemented in the MangaHub Image Proxy (`src/app/api/image/route.ts`).

---

## 1. Request Flow

```text
User Browser
    │  (Requests /api/image?url=...)
    ▼
Image Proxy
    ├── 1. SSRF URL & Protocol Validation (Check host whitelist & schemes)
    ├── 2. Private IP Protection (Resolve DNS & block loopback/private subnets)
    ├── 3. In-Memory Request Deduplication (Map active fetches by URL key)
    ├── 4. Resolve target headers (Inject Referer & User-Agent per host)
    ├── 5. Execute Fetch request with AbortController timeout (12s limit)
    └── 6. Stream response back after verifying MIME-type & Content-Length
```

---

## 2. SSRF Protection & Whitelisting Constraints

To prevent the image proxy from being abused as an open proxy or hitting internal networks:
1. **Initial Host Check**: Inbound request parameters must parse into valid absolute URLs using `http` or `https` schemes.
2. **Whitelist Matching**: The domain of the URL must match one of the active provider domains or CDN targets:
   - MangaDex (`mangadex.org`, `uploads.mangadex.org`, `mangadex.network`, `cmdgd.org`)
   - ComicK (`comick.app`, `comick.cc`, `comick.fun`, `comick.io`, `comick.pictures`)
   - WEBTOON (`pstatic.net`, `webtoon-phinf.pstatic.net`, `webtoons.com`)
   - WeebCentral (`weebcentral.com`, `planeptune.us`, `compsci88.com`)
   - MangaKatana (`mangakatana.com`)
   - MangaNato (`chapmanganato.to`, `manganato.com`)
3. **No Private IPs**: Resolve DNS via `dns.lookup` and block requests mapping to Loopback (`127.0.0.1`, `::1`), Private subnets (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`), Link-local (`169.254.0.0/16`), or IPv6 site-local ranges.
4. **Redirect Limits & Revalidation**:
   - **Max Redirects**: Allow a maximum of 5 redirects (`redirect: "manual"`).
   - **SSRF Revalidation**: On every redirect event, the proxy intercepts the `Location` header and re-validates the new target domain and IP address against the whitelist before proceeding.

---

## 3. Dynamic Header Injection Policies

Depending on the provider CDN, the proxy injects header values dynamically to bypass hotlink blockers:

| Target Provider Domain | Header | Injected Value |
| :--- | :--- | :--- |
| `*.pstatic.net`, `*.webtoons.com` | `Referer` | `https://www.webtoons.com/` |
| `*.comick.pictures`, `*.comick.io` | `Referer` | `https://comick.io/` |
| `*.mangadex.org`, `*.cmdgd.org` | `Referer` | `https://mangadex.org/` |
| `*.mangakatana.com` | `Referer` | `https://mangakatana.com/` |
| `*.weebcentral.com`, `*.planeptune.us` | `Referer` | `https://weebcentral.com/` |
| `*.chapmanganato.to` | `Referer` | `https://chapmanganato.to/` |

---

## 4. Response Caching & Stream Constraints

### Size & Timeout Constraints
- **Maximum Image Size**: 15 MB per image (enforced via `Content-Length` header check and array buffer byte length check).
- **Request Timeout**: 12 seconds limit managed by `AbortController`.
- **Deduplication**: Simultaneous requests for the same image URL share a single in-flight `fetchPromise` via `activeFetches` map.

### Content-Type Validation
Only allow verified image MIME types:
- `image/jpeg`, `image/png`, `image/webp`, `image/gif`, `image/avif`  
*Block any HTML, executable scripts, or application/json payloads (returns HTTP 415).*

### Cache Headers & ETags
- **Browser Caching**: Return `Cache-Control: public, max-age=31536000, immutable` headers.
- **Upstream Cache Validation**: Generates/passes ETags and supports `If-None-Match` condition checking, returning `HTTP 304 Not Modified` to conserve bandwidth.
- **Fallback Placeholder**: On proxy errors or timeouts, serves local fallback image (`public/images/cover-placeholder.jpg`) with `X-Placeholder: 1` header.
