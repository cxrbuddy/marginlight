import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from "react";
import { Copy, EyeOff, Heart, Power, RefreshCw, Send, Settings } from "lucide-react";
import type { Quote } from "../types/quote";
import type { Settings as AppSettings } from "../types/settings";
import type { Theme } from "../themes/themes";
import { truncateQuote } from "../lib/quoteParser";
import { formatQuoteAttribution } from "../lib/xPostFormatter";
import { positionIsland, startWindowDrag } from "../lib/tauri";
import { IslandControls } from "./IslandControls";

type FloatingIslandProps = {
  quote?: Quote;
  settings: AppSettings;
  theme: Theme;
  favorite: boolean;
  visible: boolean;
  onCopy: () => void;
  onCopyXPost: () => void;
  onFavorite: () => void;
  onRefresh: () => void;
  onSettings: () => void;
  onHideToday: () => void;
  onExport: () => void;
  onQuit: () => void;
};

export function FloatingIsland({
  quote,
  settings,
  theme,
  favorite,
  visible,
  onCopy,
  onCopyXPost,
  onFavorite,
  onRefresh,
  onSettings,
  onHideToday,
  onExport,
  onQuit,
}: FloatingIslandProps) {
  const [hovered, setHovered] = useState(false);
  const [clickedOpen, setClickedOpen] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const expanded = Boolean(quote && (clickedOpen || (settings.expandOnHover && hovered)));
  const fontClass = `font-${settings.fontSize}`;
  const displayText = useMemo(() => {
    if (!quote) return "";
    return expanded ? quote.text : truncateQuote(quote.text, 260).text;
  }, [expanded, quote]);
  const attribution = quote ? formatQuoteAttribution(quote) : "";
  const opacity = settings.reduceOpacityWhenIdle && !hovered && !expanded
    ? Math.max(0.42, settings.islandOpacity / 100 - 0.18)
    : settings.islandOpacity / 100;

  useEffect(() => {
    void positionIsland(settings.islandWidthPercent, expanded ? 222 : 126);
  }, [expanded, settings.islandWidthPercent]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setClickedOpen(false);
        setContextMenu(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  if (!visible) {
    return <div className="island-stage" />;
  }

  return (
    <div
      className="island-stage"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => {
        setHovered(false);
        setContextMenu(null);
      }}
      onContextMenu={(event) => {
        event.preventDefault();
        setContextMenu({ x: event.clientX, y: event.clientY });
      }}
    >
      <motion.div
        className={`floating-island ${fontClass}`}
        style={{
          color: theme.text,
          background: expanded ? theme.hoverBackground : theme.background,
          borderColor: theme.border,
          boxShadow: theme.shadow,
          borderRadius: settings.cornerRadius,
          backdropFilter: `blur(${theme.blur}px)`,
          WebkitBackdropFilter: `blur(${theme.blur}px)`,
          opacity,
        }}
        initial={{ opacity: 0, y: -8, scale: 0.985 }}
        animate={{
          opacity,
          y: 0,
          scale: expanded ? 1.012 : 1,
          minHeight: expanded ? 168 : 98,
        }}
        transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
        onMouseDown={(event) => {
          if (!settings.positionLocked && event.button === 0 && !(event.target as HTMLElement).closest("button")) {
            void startWindowDrag();
          }
        }}
        onClick={(event) => {
          if ((event.target as HTMLElement).closest("button")) return;
          setClickedOpen((value) => !value);
        }}
        onDoubleClick={(event) => {
          event.preventDefault();
          onCopy();
        }}
      >
        {quote ? (
          <>
            <div className="quote-layout">
              <p
                className="quote-text"
                style={{
                  WebkitLineClamp: expanded ? 6 : 3,
                }}
              >
                {displayText}
              </p>
              {attribution ? (
                <p className="quote-attribution" style={{ color: theme.secondaryText }}>
                  {attribution}
                </p>
              ) : null}
            </div>

            <AnimatePresence>
              {expanded ? (
                <motion.div
                  className="controls-row"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 4 }}
                  transition={{ duration: 0.16 }}
                  style={
                    {
                      "--control-bg": theme.controlBackground,
                      "--control-hover": theme.controlHover,
                      "--accent": theme.accent,
                    } as CSSProperties
                  }
                >
                  <IslandControls
                    favorite={favorite}
                    onCopy={onCopy}
                    onCopyXPost={onCopyXPost}
                    onFavorite={onFavorite}
                    onRefresh={onRefresh}
                    onSettings={onSettings}
                    onHideToday={onHideToday}
                    onExport={onExport}
                    onQuit={onQuit}
                  />
                </motion.div>
              ) : null}
            </AnimatePresence>
          </>
        ) : (
          <div className="island-empty">
            <span>No quote source is ready.</span>
            <button type="button" onClick={onSettings}>
              <Settings size={14} />
              Settings
            </button>
          </div>
        )}
      </motion.div>

      <AnimatePresence>
        {contextMenu && quote ? (
          <motion.div
            className="context-menu"
            style={{ left: contextMenu.x, top: contextMenu.y }}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
          >
            <MenuButton icon={<Copy size={14} />} label="Copy quote" onClick={onCopy} />
            <MenuButton icon={<Send size={14} />} label="Copy as X post" onClick={onCopyXPost} />
            <MenuButton icon={<Heart size={14} />} label="Favorite quote" onClick={onFavorite} />
            <MenuButton icon={<RefreshCw size={14} />} label="Refresh today's quote" onClick={onRefresh} />
            <MenuButton icon={<EyeOff size={14} />} label="Hide for today" onClick={onHideToday} />
            <MenuButton icon={<Settings size={14} />} label="Settings" onClick={onSettings} />
            <MenuButton icon={<Power size={14} />} label="Quit Marginlight" onClick={onQuit} />
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function MenuButton({
  icon,
  label,
  onClick,
}: {
  icon: ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button type="button" onClick={onClick}>
      {icon}
      <span>{label}</span>
    </button>
  );
}
