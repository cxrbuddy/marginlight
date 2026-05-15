export type QuoteSourceMode = "builtin" | "custom" | "mixed";
export type FontSize = "small" | "medium" | "large";

export type Settings = {
  quoteSourceMode: QuoteSourceMode;
  customQuotesFolder?: string;
  themeId: string;
  fontSize: FontSize;
  islandWidthPercent: number;
  islandOpacity: number;
  cornerRadius: number;
  expandOnHover: boolean;
  reduceOpacityWhenIdle: boolean;
  alwaysOnTop: boolean;
  passThroughClicks: boolean;
  launchAtLogin: boolean;
  workingHoursOnly: boolean;
  workStartTime?: string;
  workEndTime?: string;
  positionLocked: boolean;
  islandVisible: boolean;
  hideUntilDate?: string;
  hasCompletedOnboarding: boolean;
};

export const defaultSettings: Settings = {
  quoteSourceMode: "builtin",
  themeId: "apple-glass",
  fontSize: "medium",
  islandWidthPercent: 68,
  islandOpacity: 92,
  cornerRadius: 42,
  expandOnHover: false,
  reduceOpacityWhenIdle: true,
  alwaysOnTop: true,
  passThroughClicks: true,
  launchAtLogin: false,
  workingHoursOnly: false,
  workStartTime: "08:30",
  workEndTime: "18:30",
  positionLocked: true,
  islandVisible: true,
  hasCompletedOnboarding: false,
};
