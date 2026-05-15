import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { builtinQuotes } from "./data/builtinQuotes";
import { FloatingIsland } from "./components/FloatingIsland";
import { SettingsWindow } from "./components/SettingsWindow";
import { Onboarding } from "./components/Onboarding";
import type { DailyQuoteHistory, FavoriteQuote, Quote } from "./types/quote";
import type { QuoteSourceMode, Settings } from "./types/settings";
import { defaultSettings } from "./types/settings";
import { getTheme } from "./themes/themes";
import { getLocalDateKey, isWithinWorkingHours, nextMidnightDelay } from "./lib/dateUtils";
import { parseMarkdownFiles } from "./lib/quoteParser";
import { getDailyQuote, getQuotePool } from "./lib/quoteSelector";
import { exportQuoteImage } from "./lib/exportImage";
import { formatQuoteForCopy, formatQuoteForXPost } from "./lib/xPostFormatter";
import {
  chooseMarkdownFolder,
  emitMarginlightEvent,
  getLaunchAtLoginStatus,
  hideIslandWindow,
  listenMarginlightEvent,
  positionIsland,
  quitMarginlight,
  scanMarkdownFolder,
  setAlwaysOnTop,
  setIslandClickThrough,
  setLaunchAtLogin,
  showIslandWindow,
  showSettingsWindow,
  writeClipboard,
} from "./lib/tauri";
import {
  loadCustomQuotes,
  loadFavorites,
  loadHistory,
  loadSettings,
  saveCustomQuotes,
  saveFavorites,
  saveHistory,
  saveSettings,
} from "./lib/storage";

const route = window.location.hash.includes("settings") ? "settings" : "island";

export default function App() {
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [history, setHistory] = useState<DailyQuoteHistory[]>([]);
  const [favorites, setFavorites] = useState<FavoriteQuote[]>([]);
  const [customQuotes, setCustomQuotes] = useState<Quote[]>([]);
  const [currentQuote, setCurrentQuote] = useState<Quote | undefined>();
  const [busy, setBusy] = useState(true);
  const [message, setMessage] = useState<string | undefined>();

  const theme = useMemo(() => getTheme(settings.themeId), [settings.themeId]);
  const allQuotes = useMemo(() => [...builtinQuotes, ...customQuotes], [customQuotes]);
  const quotePool = useMemo(
    () => getQuotePool(allQuotes, settings.quoteSourceMode),
    [allQuotes, settings.quoteSourceMode],
  );
  const visibleToday = shouldShowIsland(settings);
  const isFavorite = Boolean(
    currentQuote && favorites.some((favorite) => favorite.quoteId === currentQuote.id),
  );
  const eventHandlers = useRef({
    hydrate: () => undefined as void,
    refresh: () => undefined as void,
    copy: () => undefined as void,
    toggleIsland: () => undefined as void,
  });

  const refreshDailyQuote = useCallback(
    async (pool: Quote[], storedHistory: DailyQuoteHistory[], force = false) => {
      const result = getDailyQuote({
        quotes: pool,
        history: storedHistory,
        refresh: force,
        refreshSalt: force ? String(Date.now()) : undefined,
      });

      setCurrentQuote(result.quote);
      setHistory(result.history);

      if (result.history !== storedHistory) {
        await saveHistory(result.history);
      }

      return result.quote;
    },
    [],
  );

  const hydrate = useCallback(async () => {
    setBusy(true);
    try {
      const [storedSettings, storedHistory, storedFavorites, storedCustomQuotes] = await Promise.all([
        loadSettings(),
        loadHistory(),
        loadFavorites(),
        loadCustomQuotes(),
      ]);
      const launchStatus = await getLaunchAtLoginStatus().catch(() => storedSettings.launchAtLogin);
      const mergedSettings = { ...storedSettings, launchAtLogin: launchStatus };
      const pool = getQuotePool([...builtinQuotes, ...storedCustomQuotes], mergedSettings.quoteSourceMode);

      setSettings(mergedSettings);
      setFavorites(storedFavorites);
      setCustomQuotes(storedCustomQuotes);
      await refreshDailyQuote(pool, storedHistory);
    } finally {
      setBusy(false);
    }
  }, [refreshDailyQuote]);

  eventHandlers.current.hydrate = () => void hydrate();
  eventHandlers.current.refresh = () => void handleRefreshQuote();
  eventHandlers.current.copy = () => void handleCopyQuote();
  eventHandlers.current.toggleIsland = () => void handleToggleIsland();

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  useEffect(() => {
    const timeout = window.setTimeout(() => void hydrate(), nextMidnightDelay());
    return () => window.clearTimeout(timeout);
  }, [hydrate, currentQuote?.id]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      if (route === "island") {
        void syncIslandWindow(settings);
      }
    }, 60_000);
    return () => window.clearInterval(interval);
  }, [settings]);

  useEffect(() => {
    if (route !== "island") return;
    void syncIslandWindow(settings);
  }, [settings, visibleToday]);

  useEffect(() => {
    let mounted = true;
    let unlisten: Array<() => void> = [];

    void Promise.all([
      listenMarginlightEvent("marginlight://state-changed", () => eventHandlers.current.hydrate()),
      listenMarginlightEvent("marginlight://refresh-quote", () => eventHandlers.current.refresh()),
      listenMarginlightEvent("marginlight://copy-quote", () => eventHandlers.current.copy()),
      listenMarginlightEvent("marginlight://toggle-island", () => eventHandlers.current.toggleIsland()),
      listenMarginlightEvent("marginlight://show-today", () => void showIslandWindow()),
    ]).then((items) => {
      if (mounted) unlisten = items;
      else items.forEach((unsubscribe) => unsubscribe());
    });

    return () => {
      mounted = false;
      unlisten.forEach((unsubscribe) => unsubscribe());
    };
  }, []);

  const persistSettings = useCallback(
    async (nextSettings: Settings) => {
      const previous = settings;
      setSettings(nextSettings);
      await saveSettings(nextSettings);

      if (previous.launchAtLogin !== nextSettings.launchAtLogin) {
        await setLaunchAtLogin(nextSettings.launchAtLogin).catch((error) => {
          console.warn("Could not update launch at login", error);
        });
      }

      if (previous.alwaysOnTop !== nextSettings.alwaysOnTop) {
        await setAlwaysOnTop(nextSettings.alwaysOnTop).catch((error) => {
          console.warn("Could not update always-on-top", error);
        });
      }

      await syncIslandWindow(nextSettings);
      await emitMarginlightEvent("marginlight://state-changed");
    },
    [settings],
  );

  const chooseAndScanFolder = useCallback(
    async (baseSettings = settings): Promise<{ nextSettings: Settings; quotes: Quote[] }> => {
      const folder = await chooseMarkdownFolder();
      if (!folder) return { nextSettings: baseSettings, quotes: customQuotes };

      setBusy(true);
      setMessage("Scanning Markdown quotes...");
      try {
        const files = await scanMarkdownFolder(folder);
        const quotes = parseMarkdownFiles(files);
        await saveCustomQuotes(quotes);
        setCustomQuotes(quotes);
        const nextSettings = { ...baseSettings, customQuotesFolder: folder };
        setMessage(`Found ${quotes.length} personal quotes.`);
        return { nextSettings, quotes };
      } catch (error) {
        console.warn(error);
        setMessage("Could not scan that folder. Your built-in quotes still work.");
        return { nextSettings: baseSettings, quotes: customQuotes };
      } finally {
        setBusy(false);
      }
    },
    [customQuotes, settings],
  );

  async function handleChooseFolder() {
    const { nextSettings: next, quotes } = await chooseAndScanFolder();
    await persistSettings(next);
    await refreshDailyQuote(getQuotePool([...builtinQuotes, ...quotes], next.quoteSourceMode), history, true);
  }

  async function handleRescan() {
    if (!settings.customQuotesFolder) {
      await handleChooseFolder();
      return;
    }

    setBusy(true);
    setMessage("Rescanning Markdown quotes...");
    try {
      const files = await scanMarkdownFolder(settings.customQuotesFolder);
      const quotes = parseMarkdownFiles(files);
      setCustomQuotes(quotes);
      await saveCustomQuotes(quotes);
      await refreshDailyQuote(getQuotePool([...builtinQuotes, ...quotes], settings.quoteSourceMode), history, true);
      setMessage(`Rescanned ${quotes.length} personal quotes.`);
      await emitMarginlightEvent("marginlight://state-changed");
    } catch (error) {
      console.warn(error);
      setMessage("Could not rescan the folder.");
    } finally {
      setBusy(false);
    }
  }

  async function handleRefreshQuote() {
    const quote = await refreshDailyQuote(quotePool, history, true);
    if (quote) {
      setMessage("Today's quote was refreshed.");
      await emitMarginlightEvent("marginlight://state-changed");
    }
  }

  async function handleCopyQuote() {
    if (!currentQuote) return;
    await writeClipboard(formatQuoteForCopy(currentQuote));
    setMessage("Quote copied.");
  }

  async function handleCopyXPost() {
    if (!currentQuote) return;
    await writeClipboard(formatQuoteForXPost(currentQuote));
    setMessage("X post copied.");
  }

  async function handleExportImage() {
    if (!currentQuote) return;
    const path = await exportQuoteImage(currentQuote, theme);
    setMessage(path ? "Quote image exported." : "Export canceled.");
  }

  async function handleFavorite() {
    if (!currentQuote) return;

    const nextFavorites = isFavorite
      ? favorites.filter((favorite) => favorite.quoteId !== currentQuote.id)
      : [...favorites, { quoteId: currentQuote.id, createdAt: new Date().toISOString() }];

    setFavorites(nextFavorites);
    await saveFavorites(nextFavorites);
    setMessage(isFavorite ? "Removed from favorites." : "Favorite saved.");
    await emitMarginlightEvent("marginlight://state-changed");
  }

  async function handleHideToday() {
    const nextSettings = { ...settings, hideUntilDate: getLocalDateKey() };
    await persistSettings(nextSettings);
    await hideIslandWindow();
    setMessage("Island hidden for today.");
  }

  async function handleToggleIsland() {
    const nextVisible = !settings.islandVisible || settings.hideUntilDate === getLocalDateKey();
    await persistSettings({
      ...settings,
      islandVisible: nextVisible,
      hideUntilDate: nextVisible ? undefined : settings.hideUntilDate,
    });
  }

  async function handleOnboardingStart(mode: QuoteSourceMode, chooseFolder: boolean) {
    let nextSettings: Settings = {
      ...settings,
      quoteSourceMode: mode,
      hasCompletedOnboarding: true,
      islandVisible: true,
    };

    if (chooseFolder) {
      const result = await chooseAndScanFolder(nextSettings);
      nextSettings = result.nextSettings;
      await persistSettings(nextSettings);
      await refreshDailyQuote(getQuotePool([...builtinQuotes, ...result.quotes], nextSettings.quoteSourceMode), history, true);
      return;
    }

    await persistSettings(nextSettings);
    await refreshDailyQuote(getQuotePool([...builtinQuotes, ...customQuotes], nextSettings.quoteSourceMode), history, true);
  }

  if (route === "settings") {
    if (!settings.hasCompletedOnboarding) {
      return <Onboarding onStart={handleOnboardingStart} />;
    }

    return (
      <SettingsWindow
        settings={settings}
        currentQuote={currentQuote}
        customQuoteCount={customQuotes.length}
        builtinQuoteCount={builtinQuotes.length}
        favoriteCount={favorites.length}
        busy={busy}
        message={message}
        onSettingsChange={persistSettings}
        onChooseFolder={handleChooseFolder}
        onRescan={handleRescan}
        onRefreshQuote={handleRefreshQuote}
        onCopyQuote={handleCopyQuote}
        onCopyXPost={handleCopyXPost}
        onExportImage={handleExportImage}
        onHideToday={handleHideToday}
        onQuit={quitMarginlight}
      />
    );
  }

  return (
    <FloatingIsland
      quote={currentQuote}
      settings={settings}
      theme={theme}
      favorite={isFavorite}
      visible={visibleToday}
      onCopy={handleCopyQuote}
      onCopyXPost={handleCopyXPost}
      onFavorite={handleFavorite}
      onRefresh={handleRefreshQuote}
      onSettings={showSettingsWindow}
      onHideToday={handleHideToday}
      onExport={handleExportImage}
      onQuit={quitMarginlight}
    />
  );
}

function shouldShowIsland(settings: Settings): boolean {
  if (!settings.islandVisible) return false;
  if (settings.hideUntilDate === getLocalDateKey()) return false;
  if (settings.workingHoursOnly) {
    return isWithinWorkingHours(new Date(), settings.workStartTime, settings.workEndTime);
  }
  return true;
}

async function syncIslandWindow(settings: Settings): Promise<void> {
  await positionIsland(settings.islandWidthPercent, 126);
  await setAlwaysOnTop(settings.alwaysOnTop);
  await setIslandClickThrough(settings.passThroughClicks && settings.positionLocked);

  if (shouldShowIsland(settings)) {
    await showIslandWindow();
  } else {
    await hideIslandWindow();
  }
}
