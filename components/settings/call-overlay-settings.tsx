"use client";

import { memo, useState, useEffect, useCallback } from "react";
import {
  CALL_OVERLAY_PRESET_THEMES,
  CallOverlayTheme,
  getStoredOverlayTheme,
  saveStoredOverlayTheme,
} from "@/lib/call-overlay-theme";
import {
  isShellOverlayAvailable,
  canDrawShellOverlay,
  requestShellOverlayPermission,
  readShellOverlayDebugInfo,
  ShellOverlayDebugInfo,
} from "@/lib/shell-call-overlay";
import { Button } from "@/components/ui/button";

export const CallOverlaySettings = memo(function CallOverlaySettings() {
  const [currentTheme, setCurrentTheme] = useState<CallOverlayTheme>(getStoredOverlayTheme);
  const [customTheme, setCustomTheme] = useState<CallOverlayTheme>(getStoredOverlayTheme);
  const [debugInfo, setDebugInfo] = useState<ShellOverlayDebugInfo | null>(null);
  const [hasShell, setHasShell] = useState(false);
  const [canDraw, setCanDraw] = useState(false);

  const checkStatus = useCallback(() => {
    const shellAvail = isShellOverlayAvailable();
    setHasShell(shellAvail);
    if (shellAvail) {
      setCanDraw(canDrawShellOverlay());
      setDebugInfo(readShellOverlayDebugInfo());
    }
  }, []);

  useEffect(() => {
    checkStatus();
    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        checkStatus();
      }
    };
    window.addEventListener("visibilitychange", onVisibility);
    return () => window.removeEventListener("visibilitychange", onVisibility);
  }, [checkStatus]);

  const handleSelectPreset = useCallback((preset: CallOverlayTheme) => {
    setCurrentTheme(preset);
    setCustomTheme(preset);
    saveStoredOverlayTheme(preset);
  }, []);

  const handleCustomFieldChange = useCallback(
    (field: keyof CallOverlayTheme, val: string) => {
      const next = { ...customTheme, id: "custom", name: "自定义配色", [field]: val };
      setCustomTheme(next);
      setCurrentTheme(next);
      saveStoredOverlayTheme(next);
    },
    [customTheme]
  );

  return (
    <div className="flex flex-col gap-6 p-4 max-w-2xl mx-auto">
      {/* 1. 原生壳与浮窗权限状态 */}
      <div className="rounded-2xl border border-white/10 bg-slate-900/60 backdrop-blur-md p-4 text-white">
        <div className="pb-3 flex items-center justify-between border-b border-white/10">
          <span className="text-base font-medium">系统原生浮窗状态</span>
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs border-white/20 text-white hover:bg-white/10"
            onClick={checkStatus}
          >
            刷新检测
          </Button>
        </div>
        <div className="pt-3 flex flex-col gap-3 text-xs">
          <div className="flex items-center justify-between py-1 border-b border-white/10">
            <span className="text-white/70">运行环境</span>
            <span className={hasShell ? "text-emerald-400 font-semibold" : "text-amber-400"}>
              {hasShell ? "Android 原生壳内" : "普通浏览器/PWA（支持网页小窗）"}
            </span>
          </div>

          {hasShell && (
            <>
              <div className="flex items-center justify-between py-1 border-b border-white/10">
                <span className="text-white/70">悬浮窗权限 (SYSTEM_ALERT_WINDOW)</span>
                <div className="flex items-center gap-2">
                  <span className={canDraw ? "text-emerald-400 font-semibold" : "text-rose-400 font-semibold"}>
                    {canDraw ? "已授权" : "未授予"}
                  </span>
                  {!canDraw && (
                    <Button
                      size="sm"
                      className="h-6 px-2 text-[11px] bg-rose-600 hover:bg-rose-500 text-white"
                      onClick={requestShellOverlayPermission}
                    >
                      去系统设置开启
                    </Button>
                  )}
                </div>
              </div>

              {/* 六项排障诊断 */}
              {debugInfo && (
                <div className="mt-2 p-3 rounded-lg bg-black/40 border border-white/10 flex flex-col gap-1.5">
                  <div className="font-semibold text-white/90 text-[11px] mb-1">
                    浮窗六项生命周期诊断 (排障手册 §五)
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div>
                      权限状态:{" "}
                      <span className={debugInfo.canDraw ? "text-emerald-400" : "text-rose-400"}>
                        {debugInfo.canDraw ? "正常" : "无权限"}
                      </span>
                    </div>
                    <div>
                      服务运行:{" "}
                      <span className={debugInfo.running ? "text-emerald-400" : "text-white/50"}>
                        {debugInfo.running ? "运行中" : "未启动"}
                      </span>
                    </div>
                    <div>
                      实例持有:{" "}
                      <span className={debugInfo.hasInstance ? "text-emerald-400" : "text-white/50"}>
                        {debugInfo.hasInstance ? "已持有" : "无实例"}
                      </span>
                    </div>
                    <div>
                      窗口挂载:{" "}
                      <span className={debugInfo.windowAdded ? "text-emerald-400" : "text-white/50"}>
                        {debugInfo.windowAdded ? "已挂载" : "未挂载"}
                      </span>
                    </div>
                    <div>
                      浮窗可见:{" "}
                      <span className={debugInfo.visible ? "text-emerald-400" : "text-white/50"}>
                        {debugInfo.visible ? "可见" : "隐藏"}
                      </span>
                    </div>
                    <div>
                      最近异常:{" "}
                      <span className={debugInfo.lastError ? "text-rose-400" : "text-white/50"}>
                        {debugInfo.lastError || "无异常"}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* 2. 悬浮窗 / 回复条配色主题 */}
      <div className="rounded-2xl border border-white/10 bg-slate-900/60 backdrop-blur-md p-4 text-white">
        <div className="pb-3 border-b border-white/10">
          <span className="text-base font-medium">悬浮回复条配色风格</span>
        </div>
        <div className="pt-3 flex flex-col gap-4 text-xs">
          <div>
            <span className="text-white/70 mb-2 block">预设配色方案</span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {CALL_OVERLAY_PRESET_THEMES.map((preset) => {
                const isSelected = currentTheme.id === preset.id;
                return (
                  <button
                    key={preset.id}
                    className={`p-2.5 rounded-xl border text-left flex flex-col gap-1 transition-all ${
                      isSelected
                        ? "border-emerald-400 bg-emerald-500/10 ring-1 ring-emerald-400"
                        : "border-white/10 bg-black/30 hover:bg-black/50"
                    }`}
                    onClick={() => handleSelectPreset(preset)}
                  >
                    <div className="flex items-center gap-1.5">
                      <span
                        className="w-3 h-3 rounded-full border border-white/30"
                        style={{ backgroundColor: preset.accentColor }}
                      />
                      <span className="font-medium text-white/90 text-xs">{preset.name}</span>
                    </div>
                    <span className="text-[10px] text-white/50 truncate">{preset.bgColor}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="pt-3 border-t border-white/10">
            <span className="text-white/70 mb-2 block">逐项色彩微调</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-white/80">背景色 (bgColor)</span>
                <input
                  className="w-36 h-7 px-2 text-xs rounded-md bg-black/40 border border-white/20 text-white"
                  value={customTheme.bgColor}
                  onChange={(e) => handleCustomFieldChange("bgColor", e.target.value)}
                />
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-white/80">主要文本 (textColor)</span>
                <input
                  className="w-36 h-7 px-2 text-xs rounded-md bg-black/40 border border-white/20 text-white"
                  value={customTheme.textColor}
                  onChange={(e) => handleCustomFieldChange("textColor", e.target.value)}
                />
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-white/80">次要文本 (subTextColor)</span>
                <input
                  className="w-36 h-7 px-2 text-xs rounded-md bg-black/40 border border-white/20 text-white"
                  value={customTheme.subTextColor}
                  onChange={(e) => handleCustomFieldChange("subTextColor", e.target.value)}
                />
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-white/80">强调强调色 (accentColor)</span>
                <input
                  className="w-36 h-7 px-2 text-xs rounded-md bg-black/40 border border-white/20 text-white"
                  value={customTheme.accentColor}
                  onChange={(e) => handleCustomFieldChange("accentColor", e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});
