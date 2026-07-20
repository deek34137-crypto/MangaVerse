# Image Proxy Specification

```text
Specification Version: 1.0
Last Updated: 2026-07-16
Compatibility: MangaHub Aggregator v1.0
Status: Frozen / Reference Spec
```

This document details the security configurations, request headers routing, and SSRF (Server-Side Request Forgery) protection policies implemented in the MangaHub Image Proxy.

---

## 1. Request Flow

```
User Browser
    │  (Requests /api/proxy/image?url=...)
    ▼
Image Proxy
    ├── 1. SSRF URL Validation (Check host whitelist)
    ├── 2. Resolve target headers (e.g. inject Referer)
    ├── 3. Execute Fetch request
    └── 4. Stream response back after verifying MIME-type
```

---

## 2. SSRF Protection & Whitelisting Constraints

To prevent the image proxy from being abused as an open proxy or hitting internal networks:
1. **Initial Host Check**: Inbound request parameters must parse into valid absolute URLs using `http` or `https` schemes.
2. **Whitelist Matching**: The domain of the URL must match one of the active provider domains:
   - `*.mangadex.org`, `*.mangadex.network`
   - `*.webtoons.com`, `*.webtoon-assets.com`
   - `*.mangatoon.mobi`
   - `*.mangabuddyyy.com`
   - `*.mangatown.com`
3. **No Private IPs**: Resolve DNS and block requests mapping to Loopback (`127.0.0.0/8`, `::1`), Private subnets (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`), or Link-local (`169.254.169.254`).
4. **Redirect Limits & Revalidation**:
   - **Max Redirects**: Allow a maximum of 3 redirects.
   - **SSRF Revalidation**: On every redirect event, the proxy MUST intercept the new URL and re-validate the target domain and IP address against the whitelist before proceeding.

---

## 3. Dynamic Header Injection Policies

Depending on the provider, the proxy will inject header values dynamically to bypass hotlink blockers:

| Target Provider Domain | Header | Injected Value |
| :--- | :--- | :--- |
| `*.webtoons.com` | `Referer` | `https://www.webtoons.com/` |
| `*.webtoons.com` | `User-Agent` | `Mozilla/5.0 (Windows NT 10.0; Win64; x64)...` |
| `*.mangatoon.mobi` | `Referer` | `https://mangatoon.mobi/` |
| `*.mangatown.com` | `Referer` | `https://www.mangatown.com/` |

---

## 4. Response Caching and Stream Constraints

### Size & Timeout Constraints
- **Maximum Image Size**: 10 MB per image. Reject headers reporting larger sizes.
- **Request Timeout**: 10 seconds limit on fetching remote assets.
- **Content-Length Sanity Check**: Confirm `Content-Length` does not exceed constraints before beginning stream read.

### Content-Type Validation
Only allow image MIME types:
- `image/jpeg`, `image/png`, `image/webp`, `image/gif`, `image/avif`
*Block any HTML, executable scripts, or application/json payloads.*

### Cache Headers & ETags
- **Browser Caching**: Return `Cache-Control: public, max-age=31536000, immutable` headers.
- **Upstream Cache Validation**: Support forwarding conditional headers (`If-None-Match` / `ETag`) to upstream provider servers if they provide them, returning `304 Not Modified` status to clients to conserve bandwidth.
