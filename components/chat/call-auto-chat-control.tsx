"use client";

import { memo, useState, useEffect, useCallback } from "react";
import { CallAutoChatConfig, saveCallAutoChatConfig } from "@/lib/call-auto-chat";
import { Toggle } from "@/components/ui/form";

export interface CallAutoChatControlProps {
  characterId?: string;
  config: CallAutoChatConfig | null;
  sentCount: number;
  onConfigUpdated: () => void;
}

export const CallAutoChatControl = memo(function CallAutoChatControl({
  characterId,
  config,
  sentCount,
  onConfigUpdated,
}: CallAutoChatControlProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [localEnabled, setLocalEnabled] = useState(false);
  const [minSec, setMinSec] = useState("15");
  const [maxSec, setMaxSec] = useState("30");
  const [maxMsgs, setMaxMsgs] = useState("0");

  useEffect(() => {
    if (config) {
      setLocalEnabled(config.enabled);
      setMinSec(String(config.minIntervalSec));
      setMaxSec(String(config.maxIntervalSec));
      setMaxMsgs(String(config.maxMessages));
    }
  }, [config]);

  const handleToggleEnabled = useCallback(
    async (checked: boolean) => {
      setLocalEnabled(checked);
      if (config) {
        await saveCallAutoChatConfig(characterId, {
          ...config,
          enabled: checked,
        });
        onConfigUpdated();
      }
    },
    [characterId, config, onConfigUpdated]
  );

  const handleSaveParams = useCallback(async () => {
    if (!config) return;
    const min = Math.max(5, parseInt(minSec, 10) || 15);
    const max = Math.max(min, parseInt(maxSec, 10) || 30);
    const msgs = Math.max(0, parseInt(maxMsgs, 10) || 0);

    await saveCallAutoChatConfig(characterId, {
      ...config,
      minIntervalSec: min,
      maxIntervalSec: max,
      maxMessages: msgs,
    });
    onConfigUpdated();
    setIsOpen(false);
  }, [characterId, config, minSec, maxSec, maxMsgs, onConfigUpdated]);

  return (
    <div className="fixed bottom-24 right-4 z-[110] flex flex-col items-end">
      {/* 折叠配置小面板 */}
      {isOpen && (
        <div className="mb-2 p-3 w-64 rounded-2xl bg-slate-900/90 backdrop-blur-md border border-white/10 text-white shadow-xl flex flex-col gap-3 text-xs">
          <div className="flex items-center justify-between pb-1 border-b border-white/10">
            <span className="font-medium text-white/90">自动搭话设置</span>
            <button
              className="text-white/50 hover:text-white text-xs px-1"
              onClick={() => setIsOpen(false)}
            >
              ✕
            </button>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-white/80">开启防冷场搭话</span>
            <Toggle
              checked={localEnabled}
              onChange={handleToggleEnabled}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-white/70 text-[11px]">随机间隔区间 (秒)</span>
            <div className="flex items-center gap-2">
              <input
                type="number"
                className="w-20 h-7 px-2 text-xs rounded-md bg-black/40 border border-white/20 text-white"
                value={minSec}
                onChange={(e) => setMinSec(e.target.value)}
                placeholder="最小"
              />
              <span className="text-white/50">~</span>
              <input
                type="number"
                className="w-20 h-7 px-2 text-xs rounded-md bg-black/40 border border-white/20 text-white"
                value={maxSec}
                onChange={(e) => setMaxSec(e.target.value)}
                placeholder="最大"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-white/70">单通条数上限</span>
              <span className="text-white/40">(0 为不限)</span>
            </div>
            <input
              type="number"
              className="w-full h-7 px-2 text-xs rounded-md bg-black/40 border border-white/20 text-white"
              value={maxMsgs}
              onChange={(e) => setMaxMsgs(e.target.value)}
            />
          </div>

          <div className="flex items-center justify-between pt-1 border-t border-white/10 text-[11px] text-white/50">
            <span>本次已搭话: {sentCount} 次</span>
            <button
              className="h-6 px-2.5 text-xs rounded bg-emerald-600 hover:bg-emerald-500 text-white"
              onClick={handleSaveParams}
            >
              保存
            </button>
          </div>
        </div>
      )}

      {/* 悬浮控制把手 / 按钮 */}
      <button
        type="button"
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium backdrop-blur-md border shadow-lg transition-all ${
          localEnabled
            ? "bg-emerald-500/20 border-emerald-400/50 text-emerald-300"
            : "bg-black/40 border-white/10 text-white/70 hover:text-white"
        }`}
        onClick={() => setIsOpen((prev) => !prev)}
        title="点击设置自动搭话"
      >
        <span
          className={`w-2 h-2 rounded-full ${
            localEnabled ? "bg-emerald-400 animate-pulse" : "bg-white/40"
          }`}
        />
        <span>{localEnabled ? `搭话中 (${sentCount})` : "搭话关"}</span>
      </button>
    </div>
  );
});
