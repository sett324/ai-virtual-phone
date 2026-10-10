"use client";

import { useSyncExternalStore } from "react";

export type CallSessionType = "voice" | "video" | "group_voice" | "group_video";

export interface ActiveCallState {
  readonly sessionId: string;
  readonly type: CallSessionType;
  readonly characterId?: string;
  readonly characterIds?: readonly string[];
  readonly initiator?: "user" | "character";
  readonly initiatorName?: string;
  readonly minimized: boolean;
}

export interface StartCallParams {
  sessionId: string;
  type: CallSessionType;
  characterId?: string;
  characterIds?: string[];
  initiator?: "user" | "character";
  initiatorName?: string;
  minimized?: boolean;
}

let activeCallSnapshot: ActiveCallState | null = null;
const listeners = new Set<() => void>();

function emitChange() {
  for (const listener of listeners) {
    listener();
  }
}

export function startCall(params: StartCallParams): void {
  activeCallSnapshot = {
    sessionId: params.sessionId,
    type: params.type,
    characterId: params.characterId,
    characterIds: params.characterIds ? Object.freeze([...params.characterIds]) : undefined,
    initiator: params.initiator ?? "user",
    initiatorName: params.initiatorName,
    minimized: params.minimized ?? false,
  };
  emitChange();
}

export function endCall(): void {
  if (activeCallSnapshot === null) return;
  activeCallSnapshot = null;
  emitChange();
}

export function setCallMinimized(minimized: boolean): void {
  if (!activeCallSnapshot) return;
  if (activeCallSnapshot.minimized === minimized) return;
  activeCallSnapshot = {
    ...activeCallSnapshot,
    minimized,
  };
  emitChange();
}

export function getActiveCall(): ActiveCallState | null {
  return activeCallSnapshot;
}

export function isCallActiveForSession(sessionId: string): boolean {
  return activeCallSnapshot?.sessionId === sessionId;
}

export function subscribeCallSession(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useActiveCall(): ActiveCallState | null {
  return useSyncExternalStore(subscribeCallSession, getActiveCall, () => null);
}
