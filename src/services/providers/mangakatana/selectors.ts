export const SELECTORS = {
  // Search selectors
  searchCard: ".item",
  searchLink: ".text h3.title a",
  searchCover: ".wrap_img img",
  
  // Detail page selectors
  detailTitle: "h1.heading",
  detailCover: ".cover img",
  metadataMetaRow: ".meta li", // For fetching status/author rows
  genresLink: ".genres a",
  authorsLink: ".authors a",
  descriptionText: ".summary p",
  
  // Chapters list selectors
  chaptersContainer: ".chapters",
  chapterRow: ".chapter",
  chapterLink: "a",
  chapterDateText: ".update_time",
} as const;
