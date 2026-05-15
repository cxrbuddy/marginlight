import type { Quote } from "../types/quote";
import type { Theme } from "../themes/themes";
import { formatQuoteAttribution } from "./xPostFormatter";
import { savePngFile } from "./tauri";

export async function exportQuoteImage(quote: Quote, theme: Theme): Promise<string | undefined> {
  const blob = await createQuoteCardBlob(quote, theme);
  const bytes = new Uint8Array(await blob.arrayBuffer());
  return savePngFile("marginlight-quote.png", bytes);
}

export async function createQuoteCardBlob(quote: Quote, theme: Theme): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = 1080;
  canvas.height = 1080;
  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Could not create image canvas.");
  }

  drawQuoteCard(context, quote, theme);

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("Could not export quote card."));
    }, "image/png");
  });
}

function drawQuoteCard(context: CanvasRenderingContext2D, quote: Quote, theme: Theme): void {
  const gradient = context.createLinearGradient(0, 0, 1080, 1080);
  gradient.addColorStop(0, theme.cardBackground.includes("20,20,20") ? "#111111" : "#fbfaf4");
  gradient.addColorStop(1, theme.accent);
  context.fillStyle = gradient;
  context.fillRect(0, 0, 1080, 1080);

  context.fillStyle = translucent(theme.text, 0.08);
  roundRect(context, 96, 96, 888, 888, 48);
  context.fill();

  context.strokeStyle = translucent(theme.text, 0.16);
  context.lineWidth = 2;
  roundRect(context, 96, 96, 888, 888, 48);
  context.stroke();

  context.fillStyle = theme.text;
  context.font = "600 58px Georgia, serif";
  context.textBaseline = "top";
  const lines = wrapCanvasText(context, quote.text, 780, 9);
  let y = 250;
  for (const line of lines) {
    context.fillText(line, 150, y);
    y += 76;
  }

  const attribution = formatQuoteAttribution(quote);
  if (attribution) {
    context.fillStyle = theme.secondaryText;
    context.font = "500 30px -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif";
    context.fillText(attribution, 150, Math.min(y + 38, 820));
  }

  context.fillStyle = translucent(theme.text, 0.50);
  context.font = "600 23px -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif";
  context.fillText("Marginlight", 150, 910);

  context.fillStyle = translucent(theme.text, 0.22);
  context.beginPath();
  context.arc(895, 918, 12, 0, Math.PI * 2);
  context.fill();
}

function wrapCanvasText(
  context: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines: number,
): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (context.measureText(next).width <= maxWidth) {
      current = next;
      continue;
    }

    if (current) lines.push(current);
    current = word;
    if (lines.length === maxLines - 1) break;
  }

  if (current && lines.length < maxLines) lines.push(current);
  return lines;
}

function roundRect(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
): void {
  context.beginPath();
  context.moveTo(x + radius, y);
  context.arcTo(x + width, y, x + width, y + height, radius);
  context.arcTo(x + width, y + height, x, y + height, radius);
  context.arcTo(x, y + height, x, y, radius);
  context.arcTo(x, y, x + width, y, radius);
  context.closePath();
}

function translucent(color: string, opacity: number): string {
  if (!color.startsWith("#") || color.length !== 7) return color;
  const red = parseInt(color.slice(1, 3), 16);
  const green = parseInt(color.slice(3, 5), 16);
  const blue = parseInt(color.slice(5, 7), 16);
  return `rgba(${red}, ${green}, ${blue}, ${opacity})`;
}
