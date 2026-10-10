"use client";

import { memo, useState, useRef, useEffect, useCallback, ReactNode } from "react";
import { createPortal } from "react-dom";

export interface CallMiniWindowProps {
  name: string;
  avatar?: string;
  bgImage?: string;
  onRestore: () => void;
  queueCount?: number;
  durationText?: string;
  callStateText?: string;
  children?: ReactNode;
}

const STORAGE_KEY_POS = "call_mini_window_pos_v1";

interface Position {
  x: number;
  y: number;
}

export const CallMiniWindow = memo(function CallMiniWindow({
  name,
  avatar,
  bgImage,
  onRestore,
  queueCount = 0,
  durationText,
  callStateText,
  children,
}: CallMiniWindowProps) {
  const [mounted, setMounted] = useState(false);
  const [pos, setPos] = useState<Position>(() => {
    if (typeof window === "undefined") return { x: 16, y: 120 };
    try {
      const saved = localStorage.getItem(STORAGE_KEY_POS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed.x === "number" && typeof parsed.y === "number") {
          return {
            x: Math.min(Math.max(parsed.x, 8), window.innerWidth - 100),
            y: Math.min(Math.max(parsed.y, 8), window.innerHeight - 140),
          };
        }
      }
    } catch {}
    return { x: 16, y: 120 };
  });

  const isDraggingRef = useRef(false);
  const dragStartRef = useRef<{ startX: number; startY: number; initX: number; initY: number }>({
    startX: 0,
    startY: 0,
    initX: 0,
    initY: 0,
  });
  const movedRef = useRef(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    // 仅响应鼠标左键或触摸主指针
    if (e.button !== 0 && e.pointerType === "mouse") return;
    isDraggingRef.current = true;
    movedRef.current = false;
    dragStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initX: pos.x,
      initY: pos.y,
    };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }, [pos]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDraggingRef.current) return;
    const dx = e.clientX - dragStartRef.current.startX;
    const dy = e.clientY - dragStartRef.current.startY;
    if (Math.hypot(dx, dy) > 6) {
      movedRef.current = true;
    }

    const nextX = Math.min(Math.max(dragStartRef.current.initX + dx, 8), window.innerWidth - 100);
    const nextY = Math.min(Math.max(dragStartRef.current.initY + dy, 8), window.innerHeight - 140);

    setPos({ x: nextX, y: nextY });
  }, []);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}

    // 如果发生了明显位移，则保存位置，不触发轻点回全屏
    if (movedRef.current) {
      try {
        localStorage.setItem(STORAGE_KEY_POS, JSON.stringify(pos));
      } catch {}
    } else {
      // 轻点回全屏
      onRestore();
    }
  }, [pos, onRestore]);

  if (!mounted || typeof document === "undefined") {
    return null;
  }

  const bg = bgImage || avatar || "";

  const miniWindowContent = (
    <div
      role="button"
      tabIndex={0}
      className="fixed z-[9999] select-none touch-none cursor-grab active:cursor-grabbing"
      style={{
        left: `${pos.x}px`,
        top: `${pos.y}px`,
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      aria-label={`返回与${name}的通话`}
      title="拖动改变位置，轻点恢复全屏"
    >
      <div
        className="relative w-[92px] h-[124px] rounded-2xl overflow-hidden shadow-2xl border-2 border-white/40 bg-[#1a1a2e] bg-cover bg-center flex flex-col justify-between p-2"
        style={{
          backgroundImage: bg ? `url(${bg})` : undefined,
        }}
      >
        {/* 背景渐变遮罩 */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/40 pointer-events-none" />

        {/* 顶部：角标与通话时长/状态 */}
        <div className="relative z-10 flex items-center justify-between w-full">
          {queueCount > 0 ? (
            <span
              className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow"
              title={`待发 ${queueCount} 条`}
            >
              {queueCount}
            </span>
          ) : (
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow" />
          )}

          {durationText && (
            <span className="text-[10px] font-mono text-white/90 bg-black/40 px-1 py-0.5 rounded">
              {durationText}
            </span>
          )}
        </div>

        {/* 底部：名字与当前状态 */}
        <div className="relative z-10 w-full flex flex-col items-center">
          {callStateText && (
            <span className="text-[9px] text-white/75 truncate w-full text-center">
              {callStateText}
            </span>
          )}
          <span className="text-[11px] font-semibold text-white truncate w-full text-center drop-shadow">
            {name}
          </span>
        </div>

        {children}
      </div>
    </div>
  );

  return createPortal(miniWindowContent, document.body);
});