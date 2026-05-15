import clsx from "clsx";
import { themes } from "../themes/themes";

type ThemeSelectorProps = {
  value: string;
  onChange: (themeId: string) => void;
};

export function ThemeSelector({ value, onChange }: ThemeSelectorProps) {
  return (
    <div className="theme-grid">
      {themes.map((theme) => (
        <button
          key={theme.id}
          type="button"
          className={clsx("theme-swatch", value === theme.id && "is-selected")}
          onClick={() => onChange(theme.id)}
        >
          <span
            className="theme-swatch-preview"
            style={{
              background: theme.background,
              borderColor: theme.border,
              boxShadow: theme.shadow,
            }}
          />
          <span>{theme.name}</span>
        </button>
      ))}
    </div>
  );
}
