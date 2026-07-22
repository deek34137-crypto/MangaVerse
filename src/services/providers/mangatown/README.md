# MangaTown Scraper Provider

Standardized HTML scraper plugin for MangaTown (`https://www.mangatown.com/`).

## Architecture & Features

- **Base Implementation**: Extends `BaseProvider` conforming to platform contract.
- **Shared Infrastructure**: Leverages `shared/html/` (`text.ts`, `date.ts`, `status.ts`, `antiBot.ts`).
- **Policy Integration**: CDN policies and Referer mappings configured centrally in `provider-policy.ts` (`fmcdn.mangahere.com`).
- **Parser Failure Policy**: Throws `ParserError` on missing critical fields (`title`, `page.url`).

## Selector Specifications

- **Search**: `.manga_result_list li, ul.manga_list li`
- **Detail Title**: `.title-plain, h1.title, .article_content h1`
- **Detail Cover**: `.detail_info .manga_detail_top img`
- **Chapter List**: `.chapter_content ul.chapter_list li a`
- **Reader Page**: `#image, img#image, .read_img img`
