import * as cheerio from "cheerio";

export type StructuralMutationType =
  | "remove_selector"
  | "rename_class"
  | "wrap_container"
  | "shuffle_children"
  | "delete_optional";

export type ContentMutationType =
  | "shift_status"
  | "shift_chapter_format"
  | "shift_date_format";

export type MutationType = StructuralMutationType | ContentMutationType;

export interface MutationOptions {
  targetSelector?: string;
  newClassName?: string;
}

export class DomMutationEngine {
  /**
   * Applies a specific structural or content mutation to an HTML string.
   */
  public static mutate(
    html: string,
    mutation: MutationType,
    options: MutationOptions = {}
  ): string {
    if (!html) return html;
    const $ = cheerio.load(html);

    switch (mutation) {
      case "remove_selector": {
        if (options.targetSelector) {
          $(options.targetSelector).remove();
        }
        break;
      }

      case "rename_class": {
        if (options.targetSelector && options.newClassName) {
          $(options.targetSelector).addClass(options.newClassName);
          const oldClass = options.targetSelector.replace(".", "");
          $(options.targetSelector).removeClass(oldClass);
        }
        break;
      }

      case "wrap_container": {
        if (options.targetSelector) {
          $(options.targetSelector).wrap('<div class="legacy-wrapper-v2"><div class="nested-wrapper"></div></div>');
        }
        break;
      }

      case "shuffle_children": {
        if (options.targetSelector) {
          const container = $(options.targetSelector);
          const children = container.children().toArray();
          if (children.length > 1) {
            children.reverse(); // simple deterministic shuffle
            container.empty().append(children);
          }
        }
        break;
      }

      case "delete_optional": {
        $(".description, .summary, .author, .genres, .genre, .meta-info, .rating").remove();
        break;
      }

      case "shift_status": {
        // Find elements with status text and mutate
        $("*").each((_, el) => {
          const elem = $(el);
          const text = elem.text();
          if (text.toLowerCase().includes("ongoing")) {
            elem.text(text.replace(/ongoing/gi, "On Going / Publishing"));
          } else if (text.toLowerCase().includes("completed")) {
            elem.text(text.replace(/completed/gi, "Finished / Ended"));
          }
        });
        break;
      }

      case "shift_chapter_format": {
        $("*").each((_, el) => {
          const elem = $(el);
          const text = elem.text();
          if (/chapter\s*\d+/i.test(text)) {
            elem.text(text.replace(/chapter\s*(\d+)/gi, "Ch.$1 (Episode $1)"));
          }
        });
        break;
      }

      case "shift_date_format": {
        $("*").each((_, el) => {
          const elem = $(el);
          const text = elem.text();
          if (/(\d+)\s+hours?\s+ago/i.test(text)) {
            elem.text(text.replace(/(\d+)\s+hours?\s+ago/gi, "$1 hrs ago"));
          }
        });
        break;
      }
    }

    return $.html();
  }

  /**
   * Generates a batch of mutated HTML strings covering all mutation categories.
   */
  public static generateMutationBatch(
    html: string,
    targetSelectors: { critical: string[]; optional: string[] }
  ): Array<{ name: string; mutatedHtml: string; expectedFailure: boolean; failedField?: string }> {
    const batch: Array<{ name: string; mutatedHtml: string; expectedFailure: boolean; failedField?: string }> = [];

    // 1. Structural Mutations on Optional Selectors (Should Degrade Gracefully)
    for (const optSelector of targetSelectors.optional) {
      batch.push({
        name: `Remove optional selector: ${optSelector}`,
        mutatedHtml: this.mutate(html, "remove_selector", { targetSelector: optSelector }),
        expectedFailure: false,
      });
    }

    // 2. Structural Mutations on Critical Selectors (Must Throw ParserError)
    for (const critSelector of targetSelectors.critical) {
      batch.push({
        name: `Remove CRITICAL selector: ${critSelector}`,
        mutatedHtml: this.mutate(html, "remove_selector", { targetSelector: critSelector }),
        expectedFailure: true,
        failedField: critSelector,
      });
    }

    // 3. Content Mutations (Should Degrade Gracefully & Match Status/Dates)
    batch.push({
      name: "Mutate status labels",
      mutatedHtml: this.mutate(html, "shift_status"),
      expectedFailure: false,
    });

    batch.push({
      name: "Mutate chapter format labels",
      mutatedHtml: this.mutate(html, "shift_chapter_format"),
      expectedFailure: false,
    });

    batch.push({
      name: "Mutate date format labels",
      mutatedHtml: this.mutate(html, "shift_date_format"),
      expectedFailure: false,
    });

    // 4. Wrapper injection (Should Degrade Gracefully)
    if (targetSelectors.critical[0]) {
      batch.push({
        name: `Wrap critical element: ${targetSelectors.critical[0]}`,
        mutatedHtml: this.mutate(html, "wrap_container", { targetSelector: targetSelectors.critical[0] }),
        expectedFailure: false,
      });
    }

    return batch;
  }
}
