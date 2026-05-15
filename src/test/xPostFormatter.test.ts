import { describe, expect, it } from "vitest";
import { formatQuoteForCopy, formatQuoteForXPost } from "../lib/xPostFormatter";
import type { Quote } from "../types/quote";

describe("xPostFormatter", () => {
  it("formats quote, author, book, and hashtags for X", () => {
    const quote: Quote = {
      id: "q",
      text: "Read deeply.",
      author: "A Reader",
      book: "A Book",
      tags: [],
      source: "custom",
    };

    expect(formatQuoteForXPost(quote)).toBe(
      "\u201cRead deeply.\u201d\n\n\u2014 A Reader, A Book\n\n#books #reading #quotes",
    );
  });

  it("omits missing author and book gracefully", () => {
    const quote: Quote = {
      id: "q",
      text: "Read deeply.",
      tags: [],
      source: "custom",
    };

    expect(formatQuoteForXPost(quote)).toBe("\u201cRead deeply.\u201d\n\n#books #reading #quotes");
    expect(formatQuoteForCopy(quote)).toBe("\"Read deeply.\"");
  });

  it("treats Unknown author as missing for sharing", () => {
    const quote: Quote = {
      id: "q",
      text: "Read deeply.",
      author: "Unknown",
      book: "Notebook",
      tags: [],
      source: "custom",
    };

    expect(formatQuoteForXPost(quote)).toContain("\u2014 Notebook");
    expect(formatQuoteForXPost(quote)).not.toContain("Unknown");
  });
});
