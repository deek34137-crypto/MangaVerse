export const SELECTORS = {
  // Search page selectors
  searchCard: "article.bg-base-300",
  searchLink: "a[href*='/series/']",
  searchTitle: "a.link, strong",
  searchCover: "img",
  
  // Detail page selectors
  detailTitle: "h1",
  detailCover: "main img, img",
  metadataItem: "li",
  metadataLabel: "strong",
  metadataAuthorLink: "span a",
  metadataTagLink: "span a",
  metadataAltTitlesList: "ul li",
  
  // Chapters list selectors
  chapterLink: "a[href*='/chapters/']",
  chapterDate: "time.text-datetime",
  
  // Pages selectors
  pageImage: "img",
} as const;
