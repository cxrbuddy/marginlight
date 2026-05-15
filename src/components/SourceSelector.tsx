import clsx from "clsx";
import type { QuoteSourceMode } from "../types/settings";

type SourceSelectorProps = {
  value: QuoteSourceMode;
  onChange: (value: QuoteSourceMode) => void;
};

const options: Array<{ value: QuoteSourceMode; label: string }> = [
  { value: "builtin", label: "Built-in" },
  { value: "custom", label: "My Markdown" },
  { value: "mixed", label: "Mixed" },
];

export function SourceSelector({ value, onChange }: SourceSelectorProps) {
  return (
    <div className="segmented-control" role="radiogroup" aria-label="Quote source">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          className={clsx(value === option.value && "is-selected")}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
