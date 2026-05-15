import type { DailyQuoteHistory, Quote } from "../types/quote";
import type { QuoteSourceMode } from "../types/settings";
import { getLocalDateKey } from "./dateUtils";
import { hashString } from "./quoteParser";

export type DailyQuoteResult = {
  quote?: Quote;
  history: DailyQuoteHistory[];
};

export function getQuotePool(quotes: Quote[], mode: QuoteSourceMode): Quote[] {
  if (mode === "builtin") return quotes.filter((quote) => quote.source === "builtin");
  if (mode === "custom") return quotes.filter((quote) => quote.source === "custom");
  return quotes;
}

export function getDailyQuote(params: {
  quotes: Quote[];
  history: DailyQuoteHistory[];
  date?: Date;
  refresh?: boolean;
  refreshSalt?: string;
}): DailyQuoteResult {
  const dateKey = getLocalDateKey(params.date);
  const existing = params.history.find((entry) => entry.date === dateKey);

  if (existing && !params.refresh) {
    const quote = params.quotes.find((item) => item.id === existing.quoteId);
    if (quote) {
      return { quote, history: params.history };
    }
  }

  const quote = selectQuote(params.quotes, params.history, dateKey, params.refreshSalt);
  if (!quote) {
    return { quote: undefined, history: params.history };
  }

  const history = [
    ...params.history.filter((entry) => entry.date !== dateKey),
    { date: dateKey, quoteId: quote.id },
  ].sort((a, b) => a.date.localeCompare(b.date));

  return { quote, history };
}

export function selectQuote(
  quotes: Quote[],
  history: DailyQuoteHistory[],
  dateKey: string,
  salt = "",
): Quote | undefined {
  if (!quotes.length) return undefined;

  const recentlyShown = new Set(
    history
      .filter((entry) => entry.date < dateKey)
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 30)
      .map((entry) => entry.quoteId),
  );
  let candidates = quotes.filter((quote) => !recentlyShown.has(quote.id));

  if (!candidates.length) {
    const lastQuoteId = history
      .filter((entry) => entry.date < dateKey)
      .sort((a, b) => b.date.localeCompare(a.date))[0]?.quoteId;

    candidates = quotes.length > 1 ? quotes.filter((quote) => quote.id !== lastQuoteId) : quotes;
  }

  const seed = hashString(`${dateKey}|${salt}|marginlight-v1`);
  const index = parseInt(seed, 36) % candidates.length;
  return candidates[index];
}
