export const SELECTORS = {
  SEARCH: {
    CARD: ".book-item, .story-item, .my-grid .book-item, .item-summary",
    TITLE: ".title, h3, a",
    LINK: "a",
    COVER: "img",
  },
  DETAIL: {
    TITLE: ".book-info .name h1, .name h1, .book-info h1, .book-name h1, h1",
    DESCRIPTION: ".summary .content, .description, .summary, .detail-description",
    COVER: ".book-info img, .avatar img, .cover img",
    GENRES: ".genres a, .genre a, .tag a",
    AUTHOR: ".author a, .authors a, .author, .authors",
    STATUS: ".status span, .book-info .status, .status",
    CHAPTER_LIST: "#chapter-list a, .chapter-list a, ul.row-content-chapter a, .chapter-container a, ul.chapters-list a, div.chapters-list a, ul li a[href*='/chapter-']",
  },
  READER: {
    PAGE_IMAGE: "#chapter-images img, .chapter-images img, .reading-content img, .chapter-content img, img[src*='love4awalk']",
  },
};
