"use client";

export interface ShellOverlayEventDetail {
  action: "tick" | "reply" | "restore" | "hangup" | "needPermission" | "foregroundApp" | string;
  callId?: string;
  seconds?: number;
  text?: string;
  package?: string;
  [key: string]: unknown;
}

export interface ShellOverlayDebugInfo {
  canDraw?: boolean;
  running?: boolean;
  hasInstance?: boolean;
  windowAdded?: boolean;
  visible?: boolean;
  hostInForeground?: boolean;
  lastError?: string | null;
  [key: string]: unknown;
}

interface AndroidShellBridge {
  startCallOverlay?: (name: string, avatar: string, meta: string, callId: string, elapsedSeconds: number) => boolean;
  showCallOverlay?: () => void;
  hideCallOverlay?: () => void;
  updateCallOverlay?: (name: string, avatar: string, meta: string, elapsedSeconds: number) => void;
  stopCallOverlay?: () => void;
  canDrawOverlay?: () => boolean;
  requestOverlayPermission?: () => void;
  getOverlayThemeJson?: () => string;
  setOverlayThemeJson?: (json: string) => void;
  getOverlayDebugInfo?: () => string;
}

declare global {
  interface Window {
    AndroidShell?: AndroidShellBridge;
  }
}

export function isShellOverlayAvailable(): boolean {
  if (typeof window === "undefined") return false;
  return Boolean(window.AndroidShell && typeof window.AndroidShell.startCallOverlay === "function");
}

export function canDrawShellOverlay(): boolean {
  if (typeof window === "undefined" || !window.AndroidShell?.canDrawOverlay) return false;
  try {
    return Boolean(window.AndroidShell.canDrawOverlay());
  } catch {
    return false;
  }
}

export function requestShellOverlayPermission(): void {
  if (typeof window === "undefined" || !window.AndroidShell?.requestOverlayPermission) return;
  try {
    window.AndroidShell.requestOverlayPermission();
  } catch {}
}

export function startShellCallOverlay(
  name: string,
  avatar: string,
  meta: string,
  callId: string,
  elapsedSeconds: number
): boolean {
  if (!isShellOverlayAvailable() || !window.AndroidShell?.startCallOverlay) return false;
  try {
    return Boolean(window.AndroidShell.startCallOverlay(name, avatar, meta, callId, elapsedSeconds));
  } catch {
    return false;
  }
}

export function updateShellCallOverlay(
  name: string,
  avatar: string,
  meta: string,
  elapsedSeconds: number
): void {
  if (!isShellOverlayAvailable() || !window.AndroidShell?.updateCallOverlay) return;
  try {
    window.AndroidShell.updateCallOverlay(name, avatar, meta, elapsedSeconds);
  } catch {}
}

export function stopShellCallOverlay(): void {
  if (!isShellOverlayAvailable() || !window.AndroidShell?.stopCallOverlay) return;
  try {
    window.AndroidShell.stopCallOverlay();
  } catch {}
}

export function showShellCallOverlay(): void {
  if (!isShellOverlayAvailable() || !window.AndroidShell?.showCallOverlay) return;
  try {
    window.AndroidShell.showCallOverlay();
  } catch {}
}

export function hideShellCallOverlay(): void {
  if (!isShellOverlayAvailable() || !window.AndroidShell?.hideCallOverlay) return;
  try {
    window.AndroidShell.hideCallOverlay();
  } catch {}
}

export function readShellOverlayDebugInfo(): ShellOverlayDebugInfo | null {
  if (typeof window === "undefined" || !window.AndroidShell?.getOverlayDebugInfo) return null;
  try {
    const raw = window.AndroidShell.getOverlayDebugInfo();
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function subscribeShellOverlayEvents(
  handler: (detail: ShellOverlayEventDetail) => void
): () => void {
  if (typeof window === "undefined") return () => {};
  const listener = (e: Event) => {
    const detail = (e as CustomEvent).detail as ShellOverlayEventDetail;
    if (detail && detail.action) {
      handler(detail);
    }
  };
  window.addEventListener("shell-call-overlay", listener);
  return () => {
    window.removeEventListener("shell-call-overlay", listener);
  };
}