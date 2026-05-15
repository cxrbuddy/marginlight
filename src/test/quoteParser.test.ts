import { describe, expect, it } from "vitest";
import { parseMarkdownFiles, parseMarkdownQuotes, removeDuplicateQuotes, truncateQuote } from "../lib/quoteParser";
import type { MarkdownFile, Quote } from "../types/quote";

describe("quoteParser", () => {
  it("parses blockquote sections with document metadata", () => {
    const file: MarkdownFile = {
      path: "/quotes/atomic.md",
      name: "Atomic Habits.md",
      content: `# Atomic Habits
Author: James Clear

> You do not rise to the level of your goals. You fall to the level of your systems.

Tags: habits, productivity, identity

---

> Every action you take is a vote for the type of person you wish to become.

Tags: identity, habits`,
    };

    const quotes = parseMarkdownQuotes(file);

    expect(quotes).toHaveLength(2);
    expect(quotes[0]).toMatchObject({
      text: "You do not rise to the level of your goals. You fall to the level of your systems.",
      author: "James Clear",
      book: "Atomic Habits",
      tags: ["habits", "productivity", "identity"],
      source: "custom",
    });
    expect(quotes[1].book).toBe("Atomic Habits");
  });

  it("parses Quote field format and metadata", () => {
    const file: MarkdownFile = {
      path: "/quotes/deep-work.md",
      name: "deep-work.md",
      content: `Book: Deep Work
Author: Cal Newport

Quote:
The ability to perform deep work is becoming increasingly rare at exactly the same time it is becoming increasingly valuable.

Tags: focus, work, attention`,
    };

    const [quote] = parseMarkdownQuotes(file);

    expect(quote.text).toContain("perform deep work");
    expect(quote.author).toBe("Cal Newport");
    expect(quote.book).toBe("Deep Work");
    expect(quote.tags).toEqual(["focus", "work", "attention"]);
  });

  it("uses filename and Unknown when metadata is missing", () => {
    const [quote] = parseMarkdownQuotes({
      path: "/quotes/commonplace.md",
      name: "commonplace.md",
      content: "> A clean desk is not the same as a clear mind.",
    });

    expect(quote.author).toBe("Unknown");
    expect(quote.book).toBe("Commonplace");
    expect(quote.tags).toEqual([]);
  });

  it("does not crash on broken Markdown", () => {
    expect(() =>
      parseMarkdownFiles([
        { path: "/broken.md", name: "broken.md", content: "Author:\nTags: ,,,\n> Still useful" },
      ]),
    ).not.toThrow();
  });

  it("removes duplicate quotes by normalized text", () => {
    const quotes: Quote[] = [
      { id: "a", text: "Keep going.", tags: [], source: "custom" },
      { id: "b", text: "  keep going.  ", tags: ["x"], source: "custom" },
    ];

    expect(removeDuplicateQuotes(quotes)).toHaveLength(1);
  });

  it("truncates long quotes without splitting the final word when possible", () => {
    const result = truncateQuote("One two three four five six seven eight nine ten", 24);

    expect(result.truncated).toBe(true);
    expect(result.text.endsWith("...")).toBe(true);
    expect(result.text).toBe("One two three four...");
  });
});
