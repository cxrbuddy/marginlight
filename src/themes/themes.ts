export type Theme = {
  id: string;
  name: string;
  background: string;
  hoverBackground: string;
  text: string;
  secondaryText: string;
  border: string;
  controlBackground: string;
  controlHover: string;
  shadow: string;
  blur: number;
  cardBackground: string;
  accent: string;
};

export const themes: Theme[] = [
  {
    id: "apple-glass",
    name: "Apple Glass",
    background:
      "linear-gradient(135deg, rgba(252,253,255,0.80), rgba(235,240,246,0.58))",
    hoverBackground:
      "linear-gradient(135deg, rgba(255,255,255,0.88), rgba(233,239,247,0.68))",
    text: "#16181d",
    secondaryText: "rgba(22, 24, 29, 0.62)",
    border: "rgba(255,255,255,0.64)",
    controlBackground: "rgba(255,255,255,0.56)",
    controlHover: "rgba(255,255,255,0.88)",
    shadow: "0 22px 70px rgba(20, 25, 36, 0.22), 0 1px 0 rgba(255,255,255,0.72) inset",
    blur: 28,
    cardBackground: "rgba(255,255,255,0.74)",
    accent: "#486e8f",
  },
  {
    id: "warm-paper",
    name: "Warm Paper",
    background:
      "linear-gradient(135deg, rgba(250,246,235,0.94), rgba(241,230,207,0.78))",
    hoverBackground:
      "linear-gradient(135deg, rgba(255,250,239,0.98), rgba(241,229,204,0.86))",
    text: "#282015",
    secondaryText: "rgba(40, 32, 21, 0.62)",
    border: "rgba(139, 106, 58, 0.18)",
    controlBackground: "rgba(255,255,255,0.48)",
    controlHover: "rgba(255,255,255,0.78)",
    shadow: "0 22px 68px rgba(88, 64, 33, 0.20), 0 1px 0 rgba(255,255,255,0.62) inset",
    blur: 18,
    cardBackground: "rgba(255,251,242,0.88)",
    accent: "#8b6538",
  },
  {
    id: "midnight-ink",
    name: "Midnight Ink",
    background:
      "linear-gradient(135deg, rgba(18,22,28,0.92), rgba(35,39,48,0.82))",
    hoverBackground:
      "linear-gradient(135deg, rgba(26,31,40,0.96), rgba(42,47,58,0.90))",
    text: "#f4f1ea",
    secondaryText: "rgba(244, 241, 234, 0.62)",
    border: "rgba(255,255,255,0.12)",
    controlBackground: "rgba(255,255,255,0.08)",
    controlHover: "rgba(255,255,255,0.16)",
    shadow: "0 24px 76px rgba(0,0,0,0.48), 0 1px 0 rgba(255,255,255,0.08) inset",
    blur: 24,
    cardBackground: "rgba(28,32,40,0.86)",
    accent: "#c9b78e",
  },
  {
    id: "forest-calm",
    name: "Forest Calm",
    background:
      "linear-gradient(135deg, rgba(234,243,235,0.90), rgba(197,219,204,0.76))",
    hoverBackground:
      "linear-gradient(135deg, rgba(242,248,242,0.96), rgba(205,228,211,0.84))",
    text: "#15241b",
    secondaryText: "rgba(21, 36, 27, 0.62)",
    border: "rgba(38, 92, 57, 0.16)",
    controlBackground: "rgba(255,255,255,0.48)",
    controlHover: "rgba(255,255,255,0.76)",
    shadow: "0 24px 70px rgba(34, 67, 45, 0.22), 0 1px 0 rgba(255,255,255,0.60) inset",
    blur: 22,
    cardBackground: "rgba(245,249,245,0.84)",
    accent: "#3e7553",
  },
  {
    id: "ivory-gold",
    name: "Ivory Gold",
    background:
      "linear-gradient(135deg, rgba(255,253,244,0.92), rgba(238,225,177,0.72))",
    hoverBackground:
      "linear-gradient(135deg, rgba(255,255,248,0.98), rgba(239,226,178,0.82))",
    text: "#262113",
    secondaryText: "rgba(38, 33, 19, 0.58)",
    border: "rgba(176, 137, 42, 0.20)",
    controlBackground: "rgba(255,255,255,0.50)",
    controlHover: "rgba(255,255,255,0.80)",
    shadow: "0 22px 72px rgba(119, 94, 33, 0.22), 0 1px 0 rgba(255,255,255,0.70) inset",
    blur: 20,
    cardBackground: "rgba(255,253,246,0.86)",
    accent: "#ad822c",
  },
  {
    id: "minimal-black",
    name: "Minimal Black",
    background: "linear-gradient(135deg, rgba(8,8,8,0.92), rgba(24,24,24,0.86))",
    hoverBackground: "linear-gradient(135deg, rgba(14,14,14,0.96), rgba(34,34,34,0.92))",
    text: "#ffffff",
    secondaryText: "rgba(255,255,255,0.58)",
    border: "rgba(255,255,255,0.10)",
    controlBackground: "rgba(255,255,255,0.08)",
    controlHover: "rgba(255,255,255,0.16)",
    shadow: "0 24px 76px rgba(0,0,0,0.55), 0 1px 0 rgba(255,255,255,0.08) inset",
    blur: 26,
    cardBackground: "rgba(20,20,20,0.88)",
    accent: "#e8e8e8",
  },
];

export function getTheme(themeId: string): Theme {
  return themes.find((theme) => theme.id === themeId) ?? themes[0];
}
