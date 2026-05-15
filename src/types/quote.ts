export type QuoteSource = "builtin" | "custom";

export type Quote = {
  id: string;
  text: string;
  author?: string;
  book?: string;
  tags: string[];
  source: QuoteSource;
  sourceFile?: string;
};

export type MarkdownFile = {
  path: string;
  name: string;
  content: string;
};

export type DailyQuoteHistory = {
  date: string;
  quoteId: string;
};

export type FavoriteQuote = {
  quoteId: string;
  createdAt: string;
};
