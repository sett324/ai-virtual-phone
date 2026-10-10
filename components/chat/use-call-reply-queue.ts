"use client";

import { useState, useCallback, useEffect, useRef } from "react";

export interface UseCallReplyQueueOptions {
  callState: string;
  onSend: (text: string) => void | Promise<void>;
  maxQueueSize?: number;
}

export interface UseCallReplyQueueResult {
  queue: string[];
  queueCount: number;
  enqueue: (text: string) => boolean;
  clearQueue: () => void;
  statusText: string;
}

export function useCallReplyQueue({
  callState,
  onSend,
  maxQueueSize = 5,
}: UseCallReplyQueueOptions): UseCallReplyQueueResult {
  const [queue, setQueue] = useState<string[]>([]);
  const onSendRef = useRef(onSend);
  useEffect(() => {
    onSendRef.current = onSend;
  }, [onSend]);

  const enqueue = useCallback(
    (text: string): boolean => {
      const trimmed = text.trim();
      if (!trimmed) return false;

      let accepted = false;
      setQueue((prev) => {
        if (prev.length >= maxQueueSize) {
          accepted = false;
          return prev;
        }
        accepted = true;
        return [...prev, trimmed];
      });

      return accepted;
    },
    [maxQueueSize]
  );

  const clearQueue = useCallback(() => {
    setQueue([]);
  }, []);

  // 挂断时清空队列
  useEffect(() => {
    if (callState === "ENDED") {
      setQueue([]);
    }
  }, [callState]);

  // 当回到 IDLE 且队列非空时，一次只补发一条
  // 发出后状态转 PROCESSING，effect 自然停手，不需要额外的锁
  useEffect(() => {
    if (callState !== "IDLE" || queue.length === 0) {
      return;
    }

    const nextMessage = queue[0];
    setQueue((prev) => prev.slice(1));
    void onSendRef.current(nextMessage);
  }, [callState, queue]);

  const queueCount = queue.length;
  const statusText =
    queueCount > 0 ? `对方说完就发 · 还有 ${queueCount} 条` : "";

  return {
    queue,
    queueCount,
    enqueue,
    clearQueue,
    statusText,
  };
}
