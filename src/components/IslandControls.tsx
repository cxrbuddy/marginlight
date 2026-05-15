import {
  Copy,
  EyeOff,
  Heart,
  ImageDown,
  Power,
  RefreshCw,
  Send,
  Settings,
} from "lucide-react";
import clsx from "clsx";
import type { ReactNode } from "react";

type IslandControlsProps = {
  favorite: boolean;
  onCopy: () => void;
  onCopyXPost: () => void;
  onFavorite: () => void;
  onRefresh: () => void;
  onSettings: () => void;
  onHideToday: () => void;
  onExport: () => void;
  onQuit: () => void;
};

export function IslandControls({
  favorite,
  onCopy,
  onCopyXPost,
  onFavorite,
  onRefresh,
  onSettings,
  onHideToday,
  onExport,
  onQuit,
}: IslandControlsProps) {
  return (
    <div className="island-controls" onClick={(event) => event.stopPropagation()}>
      <ControlButton title="Copy quote" onClick={onCopy}>
        <Copy size={14} />
      </ControlButton>
      <ControlButton title="Copy as X post" onClick={onCopyXPost}>
        <Send size={14} />
      </ControlButton>
      <ControlButton
        title={favorite ? "Remove favorite" : "Favorite quote"}
        onClick={onFavorite}
        active={favorite}
      >
        <Heart size={14} fill={favorite ? "currentColor" : "none"} />
      </ControlButton>
      <ControlButton title="Refresh today's quote" onClick={onRefresh}>
        <RefreshCw size={14} />
      </ControlButton>
      <ControlButton title="Export quote image" onClick={onExport}>
        <ImageDown size={14} />
      </ControlButton>
      <ControlButton title="Open settings" onClick={onSettings}>
        <Settings size={14} />
      </ControlButton>
      <ControlButton title="Hide for today" onClick={onHideToday}>
        <EyeOff size={14} />
      </ControlButton>
      <ControlButton title="Quit Marginlight" onClick={onQuit}>
        <Power size={14} />
      </ControlButton>
    </div>
  );
}

function ControlButton({
  active,
  children,
  title,
  onClick,
}: {
  active?: boolean;
  children: ReactNode;
  title: string;
  onClick: () => void;
}) {
  return (
    <button
      className={clsx("island-control-button", active && "is-active")}
      title={title}
      aria-label={title}
      onClick={onClick}
      type="button"
    >
      {children}
    </button>
  );
}
