import {
  Clipboard,
  Clock,
  Copy,
  Eye,
  EyeOff,
  FolderOpen,
  ImageDown,
  Info,
  Layers,
  Lock,
  Power,
  RefreshCw,
  SlidersHorizontal,
  Sparkles,
  Unlock,
} from "lucide-react";
import clsx from "clsx";
import type { ReactNode } from "react";
import type { Quote } from "../types/quote";
import type { Settings, FontSize } from "../types/settings";
import { ThemeSelector } from "./ThemeSelector";
import { SourceSelector } from "./SourceSelector";
import { EmptyState } from "./EmptyState";

type SettingsWindowProps = {
  settings: Settings;
  currentQuote?: Quote;
  customQuoteCount: number;
  builtinQuoteCount: number;
  favoriteCount: number;
  busy: boolean;
  message?: string;
  onSettingsChange: (settings: Settings) => void;
  onChooseFolder: () => void;
  onRescan: () => void;
  onRefreshQuote: () => void;
  onCopyQuote: () => void;
  onCopyXPost: () => void;
  onExportImage: () => void;
  onHideToday: () => void;
  onQuit: () => void;
};

export function SettingsWindow({
  settings,
  currentQuote,
  customQuoteCount,
  builtinQuoteCount,
  favoriteCount,
  busy,
  message,
  onSettingsChange,
  onChooseFolder,
  onRescan,
  onRefreshQuote,
  onCopyQuote,
  onCopyXPost,
  onExportImage,
  onHideToday,
  onQuit,
}: SettingsWindowProps) {
  const update = <K extends keyof Settings>(key: K, value: Settings[K]) => {
    onSettingsChange({ ...settings, [key]: value });
  };

  return (
    <main className="settings-shell">
      <header className="settings-header">
        <div>
          <div className="settings-brand">
            <span className="app-mark small">M</span>
            <span>Marginlight</span>
          </div>
          <p>Your MacBook's daily wisdom island.</p>
        </div>
        <div className="settings-header-actions">
          <div className="quote-counts">
            <span>{builtinQuoteCount} built-in</span>
            <span>{customQuoteCount} personal</span>
            <span>{favoriteCount} favorites</span>
          </div>
          <button type="button" className="quit-button" onClick={onQuit}>
            <Power size={15} />
            Quit
          </button>
        </div>
      </header>

      {message ? <div className="status-line">{message}</div> : null}

      <div className="settings-content">
        <SettingsSection icon={<Layers size={18} />} title="Quote Source">
          <SourceSelector
            value={settings.quoteSourceMode}
            onChange={(quoteSourceMode) => update("quoteSourceMode", quoteSourceMode)}
          />
          <div className="folder-row">
            <button type="button" className="primary-button" onClick={onChooseFolder} disabled={busy}>
              <FolderOpen size={16} />
              Choose Markdown Quotes Folder
            </button>
            <button type="button" className="secondary-button" onClick={onRescan} disabled={busy}>
              <RefreshCw size={16} />
              Rescan quotes
            </button>
          </div>
          <div className="path-display">
            {settings.customQuotesFolder || "No Markdown folder selected"}
          </div>
          {settings.quoteSourceMode !== "builtin" && customQuoteCount === 0 ? (
            <EmptyState title="No personal quotes found">
              Choose a folder with Markdown files that contain blockquotes or Quote: fields.
            </EmptyState>
          ) : null}
        </SettingsSection>

        <SettingsSection icon={<Eye size={18} />} title="Floating Island Behavior">
          <div className="toggle-grid">
            <Toggle
              label="Show island"
              checked={settings.islandVisible}
              onChange={(value) =>
                onSettingsChange({
                  ...settings,
                  islandVisible: value,
                  hideUntilDate: value ? undefined : settings.hideUntilDate,
                })
              }
            />
            <Toggle
              label="Launch at login"
              checked={settings.launchAtLogin}
              onChange={(value) => update("launchAtLogin", value)}
            />
            <Toggle
              label="Always on top"
              checked={settings.alwaysOnTop}
              onChange={(value) => update("alwaysOnTop", value)}
            />
            <Toggle
              label="Pass clicks through"
              checked={settings.passThroughClicks}
              onChange={(value) =>
                onSettingsChange({
                  ...settings,
                  passThroughClicks: value,
                  expandOnHover: value ? false : settings.expandOnHover,
                })
              }
            />
            <Toggle
              label="Expand on hover"
              checked={settings.expandOnHover}
              onChange={(value) =>
                onSettingsChange({
                  ...settings,
                  expandOnHover: value,
                  passThroughClicks: value ? false : settings.passThroughClicks,
                })
              }
            />
            <Toggle
              label="Reduce idle opacity"
              checked={settings.reduceOpacityWhenIdle}
              onChange={(value) => update("reduceOpacityWhenIdle", value)}
            />
            <Toggle
              label="Working hours only"
              checked={settings.workingHoursOnly}
              onChange={(value) => update("workingHoursOnly", value)}
            />
          </div>

          <div className="time-row">
            <label>
              <Clock size={15} />
              <span>Start</span>
              <input
                type="time"
                value={settings.workStartTime ?? "08:30"}
                onChange={(event) => update("workStartTime", event.target.value)}
                disabled={!settings.workingHoursOnly}
              />
            </label>
            <label>
              <Clock size={15} />
              <span>End</span>
              <input
                type="time"
                value={settings.workEndTime ?? "18:30"}
                onChange={(event) => update("workEndTime", event.target.value)}
                disabled={!settings.workingHoursOnly}
              />
            </label>
            <button type="button" className="secondary-button" onClick={onHideToday}>
              <EyeOff size={16} />
              Hide for today
            </button>
          </div>
        </SettingsSection>

        <SettingsSection icon={<Sparkles size={18} />} title="Appearance">
          <ThemeSelector value={settings.themeId} onChange={(themeId) => update("themeId", themeId)} />
          <div className="control-grid">
            <SegmentedSetting<FontSize>
              label="Font size"
              value={settings.fontSize}
              options={[
                ["small", "Small"],
                ["medium", "Medium"],
                ["large", "Large"],
              ]}
              onChange={(fontSize) => update("fontSize", fontSize)}
            />
            <RangeSetting
              label="Island width"
              value={settings.islandWidthPercent}
              min={60}
              max={75}
              suffix="%"
              onChange={(value) => update("islandWidthPercent", value)}
            />
            <RangeSetting
              label="Opacity"
              value={settings.islandOpacity}
              min={55}
              max={100}
              suffix="%"
              onChange={(value) => update("islandOpacity", value)}
            />
            <RangeSetting
              label="Corner radius"
              value={settings.cornerRadius}
              min={26}
              max={58}
              suffix="px"
              onChange={(value) => update("cornerRadius", value)}
            />
          </div>
          <button
            type="button"
            className={clsx("lock-button", !settings.positionLocked && "is-unlocked")}
            onClick={() => update("positionLocked", !settings.positionLocked)}
          >
            {settings.positionLocked ? <Lock size={16} /> : <Unlock size={16} />}
            {settings.positionLocked ? "Position locked" : "Position unlocked"}
          </button>
        </SettingsSection>

        <SettingsSection icon={<SlidersHorizontal size={18} />} title="Quote Actions">
          {currentQuote ? (
            <div className="current-quote-strip">
              <p>{currentQuote.text}</p>
              <span>
                {[currentQuote.author, currentQuote.book].filter(Boolean).join(", ") || "Unknown"}
              </span>
            </div>
          ) : null}
          <div className="action-row">
            <button type="button" className="secondary-button" onClick={onRefreshQuote}>
              <RefreshCw size={16} />
              Refresh today's quote
            </button>
            <button type="button" className="secondary-button" onClick={onCopyQuote}>
              <Copy size={16} />
              Copy current quote
            </button>
            <button type="button" className="secondary-button" onClick={onCopyXPost}>
              <Clipboard size={16} />
              Copy as X post
            </button>
            <button type="button" className="secondary-button" onClick={onExportImage}>
              <ImageDown size={16} />
              Export image
            </button>
          </div>
        </SettingsSection>

        <SettingsSection icon={<Info size={18} />} title="About">
          <div className="about-box">
            <strong>Marginlight 0.1.0</strong>
            <p>
              A calm floating island that shows one quote per day from built-in classics or
              your own Markdown files.
            </p>
            <p>Your quotes stay on your Mac. No account. No cloud.</p>
          </div>
        </SettingsSection>
      </div>
    </main>
  );
}

function SettingsSection({
  icon,
  title,
  children,
}: {
  icon: ReactNode;
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="settings-section">
      <h2>
        {icon}
        {title}
      </h2>
      {children}
    </section>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <button
      type="button"
      className={clsx("toggle-row", checked && "is-checked")}
      onClick={() => onChange(!checked)}
      aria-pressed={checked}
    >
      <span>{label}</span>
      <span className="toggle-track">
        <span />
      </span>
    </button>
  );
}

function RangeSetting({
  label,
  value,
  min,
  max,
  suffix,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  suffix: string;
  onChange: (value: number) => void;
}) {
  return (
    <label className="range-setting">
      <span>
        {label}
        <strong>
          {value}
          {suffix}
        </strong>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </label>
  );
}

function SegmentedSetting<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: Array<[T, string]>;
  onChange: (value: T) => void;
}) {
  return (
    <div className="range-setting">
      <span>{label}</span>
      <div className="segmented-control compact">
        {options.map(([optionValue, optionLabel]) => (
          <button
            key={optionValue}
            type="button"
            className={clsx(value === optionValue && "is-selected")}
            onClick={() => onChange(optionValue)}
          >
            {optionLabel}
          </button>
        ))}
      </div>
    </div>
  );
}
