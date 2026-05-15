import type { MarkdownFile, Quote } from "../types/quote";

type ParsedMetadata = {
  author?: string;
  book?: string;
  tags: string[];
};

const metadataLine = /^(Author|Book|Source|Work|Title|Tags)\s*:\s*(.*)$/i;

export function parseMarkdownQuotes(file: MarkdownFile): Quote[] {
  try {
    return removeDuplicateQuotes(parseMarkdownQuotesUnsafe(file));
  } catch (error) {
    console.warn(`Marginlight could not parse ${file.name}`, error);
    return [];
  }
}

export function parseMarkdownFiles(files: MarkdownFile[]): Quote[] {
  return removeDuplicateQuotes(files.flatMap(parseMarkdownQuotes));
}

export function removeDuplicateQuotes(quotes: Quote[]): Quote[] {
  const seen = new Set<string>();
  const unique: Quote[] = [];

  for (const quote of quotes) {
    const key = normalizeQuoteText(quote.text);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    unique.push(quote);
  }

  return unique;
}

function parseMarkdownQuotesUnsafe(file: MarkdownFile): Quote[] {
  const content = normalizeLineEndings(file.content);
  const fallbackBook = filenameToBook(file.name);
  const documentTitle = extractHeadingTitle(content);
  const documentMetadata = parseMetadata(content);
  const defaults: ParsedMetadata = {
    author: documentMetadata.author || "Unknown",
    book: documentMetadata.book || documentTitle || fallbackBook,
    tags: documentMetadata.tags,
  };
  const sections = content
    .split(/^\s*---+\s*$/gm)
    .map((section) => section.trim())
    .filter(Boolean);

  return sections.flatMap((section, index) => {
    const sectionMetadata = parseMetadata(section);
    const metadata: ParsedMetadata = {
      author: sectionMetadata.author || defaults.author,
      book: sectionMetadata.book || defaults.book,
      tags: sectionMetadata.tags.length ? sectionMetadata.tags : defaults.tags,
    };
    const blockquotes = extractBlockquotes(section);
    const fieldQuote = extractQuoteField(section);
    const texts = blockquotes.length ? blockquotes : fieldQuote ? [fieldQuote] : [];

    return texts
      .map(cleanQuoteText)
      .filter(Boolean)
      .map((text, quoteIndex) => ({
        id: makeQuoteId(text, metadata.author, metadata.book, file.path, index, quoteIndex),
        text,
        author: metadata.author || "Unknown",
        book: metadata.book || fallbackBook,
        tags: metadata.tags,
        source: "custom" as const,
        sourceFile: file.path,
      }));
  });
}

function extractHeadingTitle(content: string): string | undefined {
  const heading = content
    .split("\n")
    .map((line) => line.trim())
    .find((line) => /^#\s+/.test(line));

  return heading?.replace(/^#\s+/, "").trim() || undefined;
}

function parseMetadata(content: string): ParsedMetadata {
  const metadata: ParsedMetadata = { tags: [] };

  for (const rawLine of content.split("\n")) {
    const line = rawLine.trim();
    const match = metadataLine.exec(line);
    if (!match) continue;

    const key = match[1].toLowerCase();
    const value = match[2].trim();
    if (!value) continue;

    if (key === "author") metadata.author = value;
    if (key === "book" || key === "source" || key === "work" || key === "title") {
      metadata.book = value;
    }
    if (key === "tags") {
      metadata.tags = value
        .split(/[,\n]/)
        .map((tag) => tag.trim())
        .filter(Boolean);
    }
  }

  return metadata;
}

function extractBlockquotes(content: string): string[] {
  const quotes: string[] = [];
  let current: string[] = [];

  for (const rawLine of content.split("\n")) {
    const line = rawLine.trimEnd();
    if (/^\s*>/.test(line)) {
      current.push(line.replace(/^\s*>\s?/, ""));
      continue;
    }

    if (current.length) {
      quotes.push(current.join(" "));
      current = [];
    }
  }

  if (current.length) {
    quotes.push(current.join(" "));
  }

  return quotes.map(cleanQuoteText).filter(Boolean);
}

function extractQuoteField(content: string): string | undefined {
  const lines = content.split("\n");
  const startIndex = lines.findIndex((line) => /^Quote\s*:/i.test(line.trim()));
  if (startIndex < 0) return undefined;

  const firstLine = lines[startIndex].replace(/^Quote\s*:\s*/i, "").trim();
  const quoteLines = firstLine ? [firstLine] : [];

  for (const line of lines.slice(startIndex + 1)) {
    const trimmed = line.trim();
    if (metadataLine.test(trimmed) || /^#\s+/.test(trimmed) || /^>/.test(trimmed)) {
      break;
    }
    if (trimmed) quoteLines.push(trimmed);
  }

  return cleanQuoteText(quoteLines.join(" "));
}

export function cleanQuoteText(text: string): string {
  return text
    .replace(/^["'\u201c]+/, "")
    .replace(/["'\u201d]+$/, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function normalizeQuoteText(text: string): string {
  return cleanQuoteText(text).toLowerCase();
}

export function truncateQuote(text: string, maxCharacters = 240): { text: string; truncated: boolean } {
  const clean = cleanQuoteText(text);
  if (clean.length <= maxCharacters) {
    return { text: clean, truncated: false };
  }

  const slice = clean.slice(0, Math.max(0, maxCharacters - 1));
  const lastSpace = slice.lastIndexOf(" ");
  const cut = lastSpace > maxCharacters * 0.72 ? slice.slice(0, lastSpace) : slice;

  return { text: `${cut.trim()}...`, truncated: true };
}

function filenameToBook(name: string): string {
  return name
    .replace(/\.[^.]+$/, "")
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase()) || "Untitled";
}

function normalizeLineEndings(content: string): string {
  return content.replace(/\r\n?/g, "\n");
}

function makeQuoteId(
  text: string,
  author: string | undefined,
  book: string | undefined,
  sourceFile: string,
  sectionIndex: number,
  quoteIndex: number,
): string {
  const base = `${normalizeQuoteText(text)}|${author ?? ""}|${book ?? ""}|${sourceFile}|${sectionIndex}|${quoteIndex}`;
  return `custom-${hashString(base)}`;
}

export function hashString(input: string): string {
  let hash = 0x811c9dc5;

  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }

  return (hash >>> 0).toString(36);
}
