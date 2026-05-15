import type { Quote } from "../types/quote";

export function formatQuoteAttribution(quote: Quote): string {
  const author = normalizeAttributionPart(quote.author);
  const book = normalizeAttributionPart(quote.book);

  if (author && book) return `${author}, ${book}`;
  if (author) return author;
  if (book) return book;
  return "";
}

function normalizeAttributionPart(value?: string): string {
  const clean = value?.trim() ?? "";
  return clean.toLowerCase() === "unknown" ? "" : clean;
}

export function formatQuoteForCopy(quote: Quote): string {
  const attribution = formatQuoteAttribution(quote);
  return attribution ? `"${quote.text}"\n\n- ${attribution}` : `"${quote.text}"`;
}

export function formatQuoteForXPost(quote: Quote): string {
  const attribution = formatQuoteAttribution(quote);
  const body = attribution ? `\u201c${quote.text}\u201d\n\n\u2014 ${attribution}` : `\u201c${quote.text}\u201d`;
  return `${body}\n\n#books #reading #quotes`;
}
