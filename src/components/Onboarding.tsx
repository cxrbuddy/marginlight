import { BookOpen, FolderOpen, Shuffle } from "lucide-react";
import type { QuoteSourceMode } from "../types/settings";

type OnboardingProps = {
  onStart: (mode: QuoteSourceMode, chooseFolder: boolean) => void;
};

export function Onboarding({ onStart }: OnboardingProps) {
  return (
    <div className="onboarding-screen">
      <div className="onboarding-panel">
        <div className="app-mark">M</div>
        <h1>Welcome to Marginlight</h1>
        <p className="onboarding-subtitle">Your MacBook's daily wisdom island.</p>
        <p className="onboarding-copy">
          Marginlight shows one quote per day in a small floating island at the top of your
          screen. Your quotes stay private on your Mac.
        </p>

        <div className="onboarding-actions">
          <button type="button" onClick={() => onStart("builtin", false)}>
            <BookOpen size={18} />
            <span>Start with built-in quotes</span>
          </button>
          <button type="button" onClick={() => onStart("custom", true)}>
            <FolderOpen size={18} />
            <span>Use my Markdown quote folder</span>
          </button>
          <button type="button" onClick={() => onStart("mixed", true)}>
            <Shuffle size={18} />
            <span>Mix both</span>
          </button>
        </div>
      </div>
    </div>
  );
}
