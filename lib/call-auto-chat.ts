"use client";

import { getKvItem, setKvItem } from "@/lib/kv-db";

export interface CallAutoChatConfig {
  enabled: boolean;
  minIntervalSec: number;
  maxIntervalSec: number;
  maxMessages: number; // 0 表示不限
}

const DEFAULT_CONFIG: CallAutoChatConfig = {
  enabled: false,
  minIntervalSec: 15,
  maxIntervalSec: 35,
  maxMessages: 0,
};

const KV_KEY_PREFIX = "call_auto_chat_config_v1";

function getKey(characterId?: string): string {
  return characterId ? `${KV_KEY_PREFIX}:${characterId}` : `${KV_KEY_PREFIX}:default`;
}

export async function getCallAutoChatConfig(characterId?: string): Promise<CallAutoChatConfig> {
  try {
    const raw = await getKvItem<CallAutoChatConfig>(getKey(characterId));
    if (raw && typeof raw === "object") {
      return {
        enabled: Boolean(raw.enabled),
        minIntervalSec: Number(raw.minIntervalSec) || DEFAULT_CONFIG.minIntervalSec,
        maxIntervalSec: Number(raw.maxIntervalSec) || DEFAULT_CONFIG.maxIntervalSec,
        maxMessages: typeof raw.maxMessages === "number" ? raw.maxMessages : DEFAULT_CONFIG.maxMessages,
      };
    }
    // 如果专属没有，回退读取默认
    if (characterId) {
      const defaultRaw = await getKvItem<CallAutoChatConfig>(getKey());
      if (defaultRaw && typeof defaultRaw === "object") {
        return {
          enabled: Boolean(defaultRaw.enabled),
          minIntervalSec: Number(defaultRaw.minIntervalSec) || DEFAULT_CONFIG.minIntervalSec,
          maxIntervalSec: Number(defaultRaw.maxIntervalSec) || DEFAULT_CONFIG.maxIntervalSec,
          maxMessages: typeof defaultRaw.maxMessages === "number" ? defaultRaw.maxMessages : DEFAULT_CONFIG.maxMessages,
        };
      }
    }
  } catch {}
  return { ...DEFAULT_CONFIG };
}

export async function saveCallAutoChatConfig(
  config: Partial<CallAutoChatConfig>,
  characterId?: string
): Promise<void> {
  try {
    const current = await getCallAutoChatConfig(characterId);
    const updated: CallAutoChatConfig = {
      ...current,
      ...config,
      minIntervalSec: Math.max(5, Number(config.minIntervalSec ?? current.minIntervalSec)),
      maxIntervalSec: Math.max(
        Number(config.minIntervalSec ?? current.minIntervalSec),
        Number(config.maxIntervalSec ?? current.maxIntervalSec)
      ),
      maxMessages: Math.max(0, Number(config.maxMessages ?? current.maxMessages)),
    };
    await setKvItem(getKey(characterId), updated);
  } catch {}
}
