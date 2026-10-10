"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { getCallAutoChatConfig, CallAutoChatConfig } from "@/lib/call-auto-chat";
import { subscribeShellOverlayEvents, ShellOverlayEventDetail } from "@/lib/shell-call-overlay";

export interface UseCallAutoChatParams {
  characterId?: string;
  callState: string;
  onTriggerAutoChat: () => void | Promise<void>;
  enabledOverride?: boolean;
}

export function useCallAutoChat({
  characterId,
  callState,
  onTriggerAutoChat,
  enabledOverride,
}: UseCallAutoChatParams) {
  const [config, setConfig] = useState<CallAutoChatConfig | null>(null);
  const [sentCount, setSentCount] = useState(0);

  // 用 ref 维护即时状态，避免定时器闭包拿到过期数据
  const configRef = useRef<CallAutoChatConfig | null>(null);
  configRef.current = config;
  const callStateRef = useRef(callState);
  callStateRef.current = callState;
  const triggerRef = useRef(onTriggerAutoChat);
  triggerRef.current = onTriggerAutoChat;
  const sentCountRef = useRef(0);
  sentCountRef.current = sentCount;

  // 退避倍率（若角色无返回或触发失败则翻倍，上限 4×）
  const backoffMultiplierRef = useRef(1);
  // 倒计时与目标等待时间
  const targetSecRef = useRef<number>(20);
  const elapsedSecRef = useRef<number>(0);

  // 加载配置
  const refreshConfig = useCallback(async () => {
    try {
      const cfg = await getCallAutoChatConfig(characterId);
      setConfig(cfg);
    } catch {}
  }, [characterId]);

  useEffect(() => {
    void refreshConfig();
  }, [refreshConfig]);

  // 重置单轮等待时钟（根据 [min, max] 随机抽取并乘以当前退避倍率）
  const resetTimerForNextTurn = useCallback(() => {
    elapsedSecRef.current = 0;
    const cfg = configRef.current;
    if (!cfg) {
      targetSecRef.current = 20;
      return;
    }
    const min = Math.max(5, cfg.minIntervalSec);
    const max = Math.max(min, cfg.maxIntervalSec);
    const base = Math.floor(Math.random() * (max - min + 1)) + min;
    const multiplied = base * Math.min(4, Math.max(1, backoffMultiplierRef.current));
    targetSecRef.current = multiplied;
  }, []);

  // 当用户主动说话或状态变化时清零重算
  const resetAutoChat = useCallback(() => {
    backoffMultiplierRef.current = 1;
    resetTimerForNextTurn();
  }, [resetTimerForNextTurn]);

  // 执行一次心跳步进（每秒由内部 setInterval 或原生壳 tick 驱动）
  const stepTick = useCallback(() => {
    const cfg = configRef.current;
    if (!cfg) return;

    // 是否开启判断
    const isEnabled = enabledOverride !== undefined ? enabledOverride : cfg.enabled;
    if (!isEnabled) return;

    // 条数上限检查（0 = 不限）
    if (cfg.maxMessages > 0 && sentCountRef.current >= cfg.maxMessages) {
      return;
    }

    // 只有在空闲（IDLE）状态下才累加倒计时并允许搭话
    if (callStateRef.current !== "IDLE") {
      // 角色正在说话或倾听中，重置当前累加秒数
      elapsedSecRef.current = 0;
      return;
    }

    elapsedSecRef.current += 1;
    if (elapsedSecRef.current >= targetSecRef.current) {
      elapsedSecRef.current = 0;
      // 触发搭话
      sentCountRef.current += 1;
      setSentCount(sentCountRef.current);
      try {
        void triggerRef.current();
      } catch {
        // 触发异常则增加退避
        backoffMultiplierRef.current = Math.min(4, backoffMultiplierRef.current * 2);
      }
      resetTimerForNextTurn();
    }
  }, [enabledOverride, resetTimerForNextTurn]);

  // 1. 本地浏览器环境的心跳定时器
  useEffect(() => {
    resetTimerForNextTurn();
    const timer = setInterval(() => {
      stepTick();
    }, 1000);
    return () => clearInterval(timer);
  }, [stepTick, resetTimerForNextTurn]);

  // 2. 原生壳后台心跳（CustomEvent: tick），防止 WebView 退到后台时定时器被冻结
  useEffect(() => {
    const unsubscribe = subscribeShellOverlayEvents((detail: ShellOverlayEventDetail) => {
      if (detail.action === "tick") {
        // 原生心跳脉冲触发
        stepTick();
      }
    });
    return () => unsubscribe();
  }, [stepTick]);

  // 供外部在角色未产生有效回复时退避
  const recordTurnFailedOrEmpty = useCallback(() => {
    backoffMultiplierRef.current = Math.min(4, backoffMultiplierRef.current * 2);
    resetTimerForNextTurn();
  }, [resetTimerForNextTurn]);

  return {
    config,
    refreshConfig,
    sentCount,
    resetAutoChat,
    recordTurnFailedOrEmpty,
  };
}
