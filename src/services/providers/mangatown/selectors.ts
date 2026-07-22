export const SELECTORS = {
  SEARCH: {
    CARD: ".manga_result_list li, ul.manga_list li, .search_result li",
    TITLE: "a.manga_cover, a.title, .manga_name a",
    LINK: "a.manga_cover, a.title, .manga_name a",
    COVER: "img",
  },
  DETAIL: {
    TITLE: ".title-plain, h1.title, .article_content h1",
    COVER: ".detail_info .manga_detail_top img, .detail_info img",
    DESCRIPTION: "#show, .detail_info p:contains('Summary')",
    AUTHOR: ".detail_info p:contains('Author') a",
    STATUS: ".detail_info p:contains('Status')",
    GENRES: ".detail_info p:contains('Genre') a",
    CHAPTER_LIST: ".chapter_content ul.chapter_list li a, .chapter_list li a",
    CHAPTER_DATE: "span.time, span.date",
  },
  READER: {
    PAGE_IMAGE: "#image, img#image, .read_img img",
    PAGE_SELECT: "select.page_select option, .page_select option",
  },
};
