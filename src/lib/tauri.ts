import { invoke } from "@tauri-apps/api/core";
import { emit, listen } from "@tauri-apps/api/event";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { open, save } from "@tauri-apps/plugin-dialog";
import { writeText } from "@tauri-apps/plugin-clipboard-manager";
import { enable, disable, isEnabled } from "@tauri-apps/plugin-autostart";
import type { MarkdownFile } from "../types/quote";

export function isTauriRuntime(): boolean {
  return typeof window !== "undefined" && ("__TAURI_INTERNALS__" in window || "__TAURI__" in window);
}

export async function invokeOrThrow<T>(command: string, args?: Record<string, unknown>): Promise<T> {
  return invoke<T>(command, args);
}

export async function positionIsland(widthPercent: number, height: number): Promise<void> {
  if (!isTauriRuntime()) return;
  await invoke("position_island", { frame: { widthPercent, height } });
}

export async function setAlwaysOnTop(enabled: boolean): Promise<void> {
  if (!isTauriRuntime()) return;
  await invoke("set_always_on_top", { enabled });
}

export async function setIslandClickThrough(enabled: boolean): Promise<void> {
  if (!isTauriRuntime()) return;
  await invoke("set_island_click_through", { enabled });
}

export async function showSettingsWindow(): Promise<void> {
  if (!isTauriRuntime()) return;
  await invoke("show_settings");
}

export async function showIslandWindow(): Promise<void> {
  if (!isTauriRuntime()) return;
  await invoke("show_island");
}

export async function hideIslandWindow(): Promise<void> {
  if (!isTauriRuntime()) return;
  await invoke("hide_island");
}

export async function quitMarginlight(): Promise<void> {
  if (!isTauriRuntime()) return;
  await invoke("quit_app");
}

export async function startWindowDrag(): Promise<void> {
  if (!isTauriRuntime()) return;
  await getCurrentWindow().startDragging();
}

export async function chooseMarkdownFolder(): Promise<string | undefined> {
  if (!isTauriRuntime()) {
    return window.prompt("Paste the path to your Markdown quotes folder") ?? undefined;
  }

  const result = await open({
    directory: true,
    multiple: false,
    title: "Choose Markdown Quotes Folder",
  });

  return typeof result === "string" ? result : undefined;
}

export async function scanMarkdownFolder(folder: string): Promise<MarkdownFile[]> {
  if (!isTauriRuntime()) return [];
  return invoke<MarkdownFile[]>("scan_markdown_folder", { folder });
}

export async function writeClipboard(text: string): Promise<void> {
  if (isTauriRuntime()) {
    await writeText(text);
    return;
  }

  await navigator.clipboard?.writeText(text);
}

export async function savePngFile(defaultPath: string, bytes: Uint8Array): Promise<string | undefined> {
  if (!isTauriRuntime()) {
    const imageBytes = new ArrayBuffer(bytes.byteLength);
    new Uint8Array(imageBytes).set(bytes);
    const blob = new Blob([imageBytes], { type: "image/png" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = defaultPath;
    anchor.click();
    URL.revokeObjectURL(url);
    return defaultPath;
  }

  const path = await save({
    title: "Export Quote Card",
    defaultPath,
    filters: [{ name: "PNG image", extensions: ["png"] }],
  });

  if (!path) return undefined;
  await invoke("write_export_png", { path, bytes: Array.from(bytes) });
  return path;
}

export async function setLaunchAtLogin(enabled: boolean): Promise<void> {
  if (!isTauriRuntime()) return;
  if (enabled) await enable();
  else await disable();
}

export async function getLaunchAtLoginStatus(): Promise<boolean> {
  if (!isTauriRuntime()) return false;
  return isEnabled();
}

export async function emitMarginlightEvent(name: string, payload?: unknown): Promise<void> {
  if (!isTauriRuntime()) return;
  await emit(name, payload);
}

export async function listenMarginlightEvent<T>(
  name: string,
  handler: (payload: T) => void,
): Promise<() => void> {
  if (!isTauriRuntime()) return () => undefined;
  return listen<T>(name, (event) => handler(event.payload));
}
