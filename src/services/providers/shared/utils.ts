/**
 * Clean a string by collapsing multiple spaces and trimming.
 */
export function cleanText(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

/**
 * Clean HTML description tags if any are returned.
 */
export function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "");
}
