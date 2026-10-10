"use client";

export interface CallOverlayTheme {
  id: string;
  name: string;
  bgColor: string;
  textColor: string;
  subTextColor: string;
  accentColor: string;
  borderColor: string;
  buttonBgColor: string;
  buttonTextColor: string;
}

export const CALL_OVERLAY_PRESET_THEMES: CallOverlayTheme[] = [
  {
    id: "dark_glass",
    name: "暗黑毛玻璃",
    bgColor: "rgba(20, 20, 30, 0.85)",
    textColor: "#ffffff",
    subTextColor: "rgba(255, 255, 255, 0.65)",
    accentColor: "#10b981",
    borderColor: "rgba(255, 255, 255, 0.2)",
    buttonBgColor: "#10b981",
    buttonTextColor: "#ffffff",
  },
  {
    id: "pure_black",
    name: "极简深黑",
    bgColor: "#0f0f13",
    textColor: "#ffffff",
    subTextColor: "#9ca3af",
    accentColor: "#3b82f6",
    borderColor: "#27272a",
    buttonBgColor: "#3b82f6",
    buttonTextColor: "#ffffff",
  },
  {
    id: "cyber_violet",
    name: "幻夜暗紫",
    bgColor: "rgba(35, 18, 55, 0.9)",
    textColor: "#f3e8ff",
    subTextColor: "#d8b4fe",
    accentColor: "#a855f7",
    borderColor: "rgba(168, 85, 247, 0.4)",
    buttonBgColor: "#9333ea",
    buttonTextColor: "#ffffff",
  },
  {
    id: "rose_warm",
    name: "温暖柔粉",
    bgColor: "rgba(45, 20, 30, 0.9)",
    textColor: "#ffe4e6",
    subTextColor: "#fca5a5",
    accentColor: "#f43f5e",
    borderColor: "rgba(244, 63, 94, 0.35)",
    buttonBgColor: "#f43f5e",
    buttonTextColor: "#ffffff",
  },
];

const OVERLAY_THEME_STORAGE_KEY = "call_overlay_custom_theme_v1";

export function getStoredOverlayTheme(): CallOverlayTheme {
  if (typeof window === "undefined") return CALL_OVERLAY_PRESET_THEMES[0];
  try {
    const raw = localStorage.getItem(OVERLAY_THEME_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object" && parsed.bgColor) {
        return parsed as CallOverlayTheme;
      }
    }
  } catch {}
  return CALL_OVERLAY_PRESET_THEMES[0];
}

export function saveStoredOverlayTheme(theme: CallOverlayTheme): void {
  if (typeof window === "undefined") return;
  try {
    const jsonStr = JSON.stringify(theme);
    localStorage.setItem(OVERLAY_THEME_STORAGE_KEY, jsonStr);
    // 同时同步给 AndroidShell（如果当前在原生壳环境）
    if (window.AndroidShell && typeof window.AndroidShell.setOverlayThemeJson === "function") {
      try {
        window.AndroidShell.setOverlayThemeJson(jsonStr);
      } catch {}
    }
  } catch {}
}
