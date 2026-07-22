# MangaToon Provider Plugin

- **Provider ID**: `mangatoon`
- **Display Name**: MangaToon
- **Base URL**: `https://mangatoon.mobi`
- **Trust Score**: `0.78`
- **Priority**: `4`

---

## 1. Overview & Architecture

The MangaToon provider plugin scrapes licensed catalog metadata, chapter indices, and high-resolution reading pages from `mangatoon.mobi/en` in compliance with the MangaHub `BaseProvider` contract and 5-state health lifecycle.

---

## 2. URL Patterns

- **Catalog Search**: `https://mangatoon.mobi/en/search?word={query}`
- **Manga Detail**: `https://mangatoon.mobi/en/detail/{providerMangaId}`
- **Chapter Viewer**: `https://mangatoon.mobi/en/watch/{providerChapterId}`

---

## 3. Network & Caching Configuration

- **Timeout**: 10,000 ms
- **Max Retries**: 3
- **Rate Limit**: 5 requests per 1000 ms
- **Cache TTLs**:
  - Search: 5 minutes (`300,000` ms)
  - Detail: 24 hours (`86,400,000` ms)
  - Chapters: 30 minutes (`1,800,000` ms)
  - Pages: 24 hours (`86,400,000` ms)

---

## 4. Required Headers & Anti-Bot Detection

### Required Headers
```http
User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ...
Referer: https://mangatoon.mobi/en
Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8
```

### Anti-Bot Signatures
The parser scans HTML responses for Cloudflare and bot challenge signatures:
- `cf-browser-verification`
- `challenge-running`
- `cloudflare-static`
- `attention required! | cloudflare`
- `captcha-delivery`
- `access denied`

If detected, `checkAntiBotChallenge()` throws a structured `ProviderBlocked` error mapping the runtime status to `BLOCKED`.

---

## 5. Known DOM Dependencies

Inspect these Cheerio selectors if MangaToon layout updates occur:

### Search (`SELECTORS.SEARCH`)
- **Card**: `.recommend-item, .search-item, .genres-item, .content-item`
- **Title**: `.recommend-title, .search-title, .content-title, h3, .title`
- **Cover Image**: `img` (`data-src` or `src` attribute)
- **Link**: `a`

### Detail View (`SELECTORS.DETAIL`)
- **Title**: `.detail-title, .title-phone, h1, .manga-title`
- **Description**: `.detail-description, .description, .detail-description-all`
- **Cover**: `.detail-img img, .poster img, .cover img`
- **Genres**: `.detail-tags .tag, .genres .genre, .tag-item`
- **Author**: `.detail-author, .author, .author-name`
- **Status**: `.detail-status, .status, .state`
- **Chapters**: `.episode-item, .chapter-item, .episode-content a, .episodes-list a`

### Reader Pages (`SELECTORS.READER`)
- **Page Images**: `.pictures img, .reader-pictures img, .watch-picture img, img.lazy`
- **Inline Script Fallback**: Regex match on `pictures: [...]` array embedded in page scripts
