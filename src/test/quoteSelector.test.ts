import { describe, expect, it } from "vitest";
import { getDailyQuote, getQuotePool } from "../lib/quoteSelector";
import type { DailyQuoteHistory, Quote } from "../types/quote";

const quotes: Quote[] = Array.from({ length: 36 }, (_, index) => ({
  id: `q-${index}`,
  text: `Quote ${index}`,
  tags: [],
  source: index % 2 === 0 ? "builtin" : "custom",
}));

describe("quoteSelector", () => {
  it("keeps today's quote stable when history already has it", () => {
    const history: DailyQuoteHistory[] = [{ date: "2026-05-12", quoteId: "q-4" }];
    const result = getDailyQuote({
      quotes,
      history,
      date: new Date("2026-05-12T10:00:00"),
    });

    expect(result.quote?.id).toBe("q-4");
    expect(result.history).toBe(history);
  });

  it("avoids quotes shown in the last 30 days when possible", () => {
    const history: DailyQuoteHistory[] = quotes.slice(0, 30).map((quote, index) => ({
      date: `2026-04-${String(index + 1).padStart(2, "0")}`,
      quoteId: quote.id,
    }));

    const result = getDailyQuote({
      quotes,
      history,
      date: new Date("2026-05-12T10:00:00"),
    });

    expect(quotes.slice(0, 30).map((quote) => quote.id)).not.toContain(result.quote?.id);
  });

  it("replaces today's history entry on refresh", () => {
    const history: DailyQuoteHistory[] = [{ date: "2026-05-12", quoteId: "q-4" }];
    const result = getDailyQuote({
      quotes,
      history,
      date: new Date("2026-05-12T10:00:00"),
      refresh: true,
      refreshSalt: "manual",
    });

    expect(result.history).toHaveLength(1);
    expect(result.history[0].date).toBe("2026-05-12");
  });

  it("filters quote pools by source mode", () => {
    expect(getQuotePool(quotes, "builtin").every((quote) => quote.source === "builtin")).toBe(true);
    expect(getQuotePool(quotes, "custom").every((quote) => quote.source === "custom")).toBe(true);
    expect(getQuotePool(quotes, "mixed")).toHaveLength(quotes.length);
  });
});
