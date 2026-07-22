export const SELECTORS = {
  SEARCH: {
    CARD: ".recommend-item, .search-item, .genres-item, .content-item",
    TITLE: ".recommend-comics-title, .search-title, .content-title, h3, .title",
    LINK: "a",
    COVER: "img",
    EPISODES: ".recommend-episode, .episode, .latest-chapter",
  },
  DETAIL: {
    TITLE: "h1, .detail-title, .title-phone, .manga-title",
    DESCRIPTION: ".detail-description, .description, .detail-description-all, .description-content",
    COVER: ".detail-img img, .poster img, .cover img",
    GENRES: ".detail-tags .tag, .genres .genre, .tag-item",
    AUTHOR: ".detail-author, .author, .author-name",
    STATUS: ".detail-status, .status, .state",
    CHAPTER_LIST: ".episode-item, .chapter-item, a.episode-item-a, .episode-content a",
  },
  CHAPTER: {
    ITEM: ".episode-item, .chapter-item, a.episode-item-a",
    NUMBER: ".episode-title, .chapter-title, span",
    TITLE: ".episode-title, .chapter-title",
    LINK: "a",
  },
  READER: {
    PAGE_IMAGE: ".lazyload_img_box img, .pictures img, .reader-pictures img, .watch-picture img",
  },
};
