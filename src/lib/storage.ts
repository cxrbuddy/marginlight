import { invoke } from "@tauri-apps/api/core";
import type { DailyQuoteHistory, FavoriteQuote, Quote } from "../types/quote";
import { defaultSettings, type Settings } from "../types/settings";
import { isTauriRuntime } from "./tauri";

const storagePrefix = "marginlight:";

export async function loadSettings(): Promise<Settings> {
  const stored = await readJson<Partial<Settings>>("settings.json", {});
  const settings = { ...defaultSettings, ...stored };

  if (settings.passThroughClicks) {
    return { ...settings, expandOnHover: false };
  }

  return settings;
}

export async function saveSettings(settings: Settings): Promise<void> {
  await writeJson("settings.json", settings);
}

export async function loadHistory(): Promise<DailyQuoteHistory[]> {
  return readJson<DailyQuoteHistory[]>("daily-history.json", []);
}

export async function saveHistory(history: DailyQuoteHistory[]): Promise<void> {
  await writeJson("daily-history.json", history);
}

export async function loadFavorites(): Promise<FavoriteQuote[]> {
  return readJson<FavoriteQuote[]>("favorites.json", []);
}

export async function saveFavorites(favorites: FavoriteQuote[]): Promise<void> {
  await writeJson("favorites.json", favorites);
}

export async function loadCustomQuotes(): Promise<Quote[]> {
  return readJson<Quote[]>("custom-quotes.json", []);
}

export async function saveCustomQuotes(quotes: Quote[]): Promise<void> {
  await writeJson("custom-quotes.json", quotes);
}

async function readJson<T>(name: string, fallback: T): Promise<T> {
  try {
    if (isTauriRuntime()) {
      const value = await invoke<unknown>("read_app_json", { name });
      return value === null ? fallback : (value as T);
    }

    const raw = localStorage.getItem(`${storagePrefix}${name}`);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch (error) {
    console.warn(`Marginlight could not read ${name}`, error);
    return fallback;
  }
}

async function writeJson<T>(name: string, value: T): Promise<void> {
  try {
    if (isTauriRuntime()) {
      await invoke("write_app_json", { name, value });
      return;
    }

    localStorage.setItem(`${storagePrefix}${name}`, JSON.stringify(value, null, 2));
  } catch (error) {
    console.warn(`Marginlight could not write ${name}`, error);
    throw error;
  }
}
