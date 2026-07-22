# MangaBuddy Scraper Provider (`mangabuddy`)

## Data Flow Architecture

```text
[ User Search Query ]
          │
          ▼
   /api/search?q=  ──(Fallback: /series?search=)──► [ JSON API Payload ]
                                                              │
                                                        slug_hash
                                                              │
                                                              ▼
                                                   /series/{slug_hash}
                                                    (HTML Detail Page)
                                                              │
                                                        a[href*='/chapter-']
                                                              │
                                                              ▼
                                               /series/{slug_hash}/chapter-X
                                                   (HTML Viewer Page)
                                                              │
                                                    #chapter-images img
                                                              │
                                                              ▼
                                                    [ CDN Image URLs ]
                                            (cdn1.love4awalk.xyz / mangabuddy1.co.uk)
```

## Known DOM & API Dependencies

- **Primary Search Endpoint**: `https://mangabuddy1.co.uk/api/search?q={query}` (JSON)
- **Fallback Search Endpoint**: `https://mangabuddy1.co.uk/series?search={query}` (HTML)
- **Detail Route**: `https://mangabuddy1.co.uk/series/{slug_hash}`
- **Chapter Route**: `https://mangabuddy1.co.uk/series/{slug_hash}/chapter-{number}`
- **Page Image Selector**: `#chapter-images img`, `.reading-content img`, `img[src*='love4awalk']`
- **Image CDN Origins**: `mangabuddy1.co.uk`, `cdn1.love4awalk.xyz`, `cdn2.love4awalk.xyz`
- **Rate Limit**: 5 requests per 1000ms window
- **Caching**: L1/L2 memory cache via `cacheGet`/`cacheSet` (5 min for search, 1 hr for details, 30 min for chapters)
