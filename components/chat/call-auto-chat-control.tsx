"use client";

import { memo, useState, useEffect, useCallback } from "react";
import { CallAutoChatConfig, saveCallAutoChatConfig } from "@/lib/call-auto-chat";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
  const [open, setOpen] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [minSec, setMinSec] = useState(15);
  const [maxSec, setMaxSec] = useState(35);
  const [maxMessages, setMaxMessages] = useState(0);

  useEffect(() => {
    if (config) {
      setEnabled(config.enabled);
      setMinSec(config.minIntervalSec);
      setMaxSec(config.maxIntervalSec);
      setMaxMessages(config.maxMessages);
    }
  }, [config]);

  const handleSave = useCallback(async () => {
    await saveCallAutoChatConfig(
      {
        enabled,
        minIntervalSec: Number(minSec),
        maxIntervalSec: Number(maxSec),
        maxMessages: Number(maxMessages),
      },
      characterId
    );
    onConfigUpdated();
    setOpen(false);
  }, [enabled, minSec, maxSec, maxMessages, characterId, onConfigUpdated]);

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="sm"
        className={`h-7 px-2 text-xs rounded-full border backdrop-blur-md transition-all ${
          enabled
            ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30"
            : "bg-black/30 text-white/70 border-white/20 hover:bg-black/40"
        }`}
        onClick={() => setOpen((prev) => !prev)}
        title="自动搭话设置（挂着通话时角色主动开口）"
      >
        <span className="mr-1 text-[11px]">💬</span>
        <span>{enabled ? `自动搭话 (${sentCount})` : "自动搭话"}</span>
      </Button>

      {open && (
        <div
          className="absolute bottom-9 left-0 w-64 p-3 rounded-2xl bg-slate-900/95 border border-white/20 text-white shadow-2xl backdrop-blur-xl z-50 flex flex-col gap-3 text-xs"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between pb-1 border-b border-white/10">
            <span className="font-semibold text-white/90">通话自动搭话设置</span>
            <div className="flex items-center gap-2">
              <Label htmlFor="auto-chat-switch" className="text-[11px] text-white/70">
                {enabled ? "已开启" : "关闭"}
              </Label>
              <Switch
                id="auto-chat-switch"
                checked={enabled}
                onCheckedChange={setEnabled}
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between gap-2">
              <Label className="text-white/80 text-[11px]">最小间隔 (秒)</Label>
              <Input
                type="number"
                min={5}
                max={120}
                className="w-20 h-7 text-xs bg-black/40 border-white/20 text-white text-center"
                value={minSec}
                onChange={(e) => setMinSec(Number(e.target.value))}
              />
            </div>

            <div className="flex items-center justify-between gap-2">
              <Label className="text-white/80 text-[11px]">最大间隔 (秒)</Label>
              <Input
                type="number"
                min={minSec}
                max={300}
                className="w-20 h-7 text-xs bg-black/40 border-white/20 text-white text-center"
                value={maxSec}
                onChange={(e) => setMaxSec(Number(e.target.value))}
              />
            </div>

            <div className="flex items-center justify-between gap-2">
              <Label className="text-white/80 text-[11px]" title="0 表示不设上限">
                单通上限 (0=不限)
              </Label>
              <Input
                type="number"
                min={0}
                max={100}
                className="w-20 h-7 text-xs bg-black/40 border-white/20 text-white text-center"
                value={maxMessages}
                onChange={(e) => setMaxMessages(Number(e.target.value))}
              />
            </div>
          </div>

          <div className="text-[10px] text-white/50 leading-relaxed">
            静默随机等待后角色主动开口。你发言会立即打断并重置时钟；角色无话时会自动翻倍退避。
          </div>

          <div className="flex items-center justify-end gap-2 pt-1 border-t border-white/10">
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-[11px] text-white/60 hover:text-white"
              onClick={() => setOpen(false)}
            >
              取消
            </Button>
            <Button
              size="sm"
              className="h-6 px-3 text-[11px] bg-emerald-600 hover:bg-emerald-500 text-white rounded"
              onClick={handleSave}
            >
              保存
            </Button>
          </div>
        </div>
      )}
    </div>
  );
});
