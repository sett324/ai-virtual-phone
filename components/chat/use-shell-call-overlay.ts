"use client";

import { useEffect, useRef } from "react";
import {
  isShellOverlayAvailable,
  startShellCallOverlay,
  updateShellCallOverlay,
  stopShellCallOverlay,
  subscribeShellOverlayEvents,
  ShellOverlayEventDetail,
} from "@/lib/shell-call-overlay";

export interface UseShellCallOverlayOptions {
  callId: string;
  name: string;
  avatar?: string;
  meta?: string;
  elapsedSeconds: number;
  callState: string;
  onRestore?: () => void;
  onHangup?: () => void;
  onReply?: (text: string) => void | Promise<void>;
  onTick?: (seconds: number) => void;
}

export function useShellCallOverlay({
  callId,
  name,
  avatar = "",
  meta = "",
  elapsedSeconds,
  callState,
  onRestore,
  onHangup,
  onReply,
  onTick,
}: UseShellCallOverlayOptions): void {
  const onRestoreRef = useRef(onRestore);
  const onHangupRef = useRef(onHangup);
  const onReplyRef = useRef(onReply);
  const onTickRef = useRef(onTick);

  useEffect(() => {
    onRestoreRef.current = onRestore;
    onHangupRef.current = onHangup;
    onReplyRef.current = onReply;
    onTickRef.current = onTick;
  });

  // 1. 通话接通或启动时，向原生发起浮窗预热并保持前台服务存活
  useEffect(() => {
    if (!isShellOverlayAvailable() || callState === "ENDED") return;

    startShellCallOverlay(name, avatar, meta, callId, elapsedSeconds);

    return () => {
      stopShellCallOverlay();
    };
  }, [callId]);

  // 2. 状态或时长变更时同步原生浮窗
  useEffect(() => {
    if (!isShellOverlayAvailable() || callState === "ENDED") return;
    updateShellCallOverlay(name, avatar, meta, elapsedSeconds);
  }, [name, avatar, meta, elapsedSeconds, callState]);

  // 3. 监听原生推送过来的事件（reply / restore / hangup / tick 等）
  useEffect(() => {
    if (!isShellOverlayAvailable()) return;

    const unsubscribe = subscribeShellOverlayEvents((detail: ShellOverlayEventDetail) => {
      if (detail.callId && detail.callId !== callId) return;

      switch (detail.action) {
        case "restore":
          onRestoreRef.current?.();
          break;
        case "hangup":
          onHangupRef.current?.();
          break;
        case "reply":
          if (detail.text) {
            void onReplyRef.current?.(detail.text);
          }
          break;
        case "tick":
          if (typeof detail.seconds === "number") {
            onTickRef.current?.(detail.seconds);
          }
          break;
        default:
          break;
      }
    });

    return unsubscribe;
  }, [callId]);
}