/**
 * CSS selectors for WEBTOON HTML parsing.
 * Grouped by page type to prevent name collisions as the provider grows.
 * All selectors confirmed against real HTML fetched July 2026.
 */
export const SELECTORS = {
  /** Search results page: /en/search?keyword=... */
  SEARCH: {
    /** The clickable series card anchor — contains data-title-no and href */
    card:   "a.link._card_item",
    /** Series title */
    title:  ".info_text strong.title",
    /** Cover thumbnail — use src attribute directly (not data-src) */
    cover:  ".image_wrap img",
    /** Author / creator credit */
    author: ".info_text .author",
  },

  /** Series detail page: /en/{genre}/{slug}/list?title_no=N */
  DETAIL: {
    /** Series title */
    title:       "h1.subj",
    /** Genre label (e.g. "Fantasy", "Romance") */
    genre:       "h2.genre",
    /** Primary cover image in the detail header */
    cover:       ".detail_header .thmb img",
    /** Author text container */
    author:      ".author_area",
    /** Series description / synopsis */
    description: "p.summary",
    /** Background banner — URL embedded in inline style attribute */
    bannerBg:    ".detail_bg",
  },

  /** Episode list items within the detail page */
  EPISODES: {
    /** Ordered episode list */
    list:         "ul#_listUl",
    /** Individual episode row */
    item:         "li._episodeItem",
    /** Episode anchor — href is the full viewer URL */
    link:         "a.detail_list_link",
    /** Inner span containing the human-readable episode title */
    subjectInner: "span.subj span",
    /** Publication date string (e.g. "Jan 19, 2025") */
    date:         "span.date",
    /** Episode thumbnail image */
    thumbnail:    "span.thmb img",
  },

  /** Episode viewer page: /viewer?title_no=N&episode_no=M */
  VIEWER: {
    /** Container holding all page images */
    container: "div#_imageList",
    /**
     * Page image elements.
     * NOTE: `src` is a transparent placeholder. Real URL is in `data-url`.
     */
    image:     "img._images",
  },
} as const;
