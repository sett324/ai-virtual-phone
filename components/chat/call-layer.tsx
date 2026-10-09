"use client";

import { memo, useMemo, useCallback } from "react";
import { useActiveCall, setCallMinimized, endCall } from "@/lib/call-session-store";
import { loadChatSessions } from "@/lib/chat-storage";
import { loadCharacters } from "@/lib/character-storage";
import { VoiceCallScreen } from "./voice-call-screen";
import { VideoCallScreen } from "./video-call-screen";
import { GroupCallScreen } from "./group-call-screen";

export const CallLayer = memo(function CallLayer() {
  const activeCall = useActiveCall();

  const sessions = useMemo(() => {
    if (!activeCall) return [];
    return loadChatSessions();
  }, [activeCall?.sessionId]);

  const characters = useMemo(() => {
    if (!activeCall) return [];
    return loadCharacters();
  }, [activeCall?.characterId, activeCall?.characterIds]);

  const currentSession = useMemo(() => {
    if (!activeCall) return null;
    return sessions.find((s) => s.id === activeCall.sessionId) ?? null;
  }, [activeCall, sessions]);

  const currentCharacter = useMemo(() => {
    if (!activeCall || !activeCall.characterId) return null;
    return characters.find((c) => c.id === activeCall.characterId) ?? null;
  }, [activeCall, characters]);

  const groupCharacters = useMemo(() => {
    if (!activeCall) return [];
    if (activeCall.characterIds && activeCall.characterIds.length > 0) {
      const idSet = new Set(activeCall.characterIds);
      return characters.filter((c) => idSet.has(c.id));
    }
    if (currentSession?.characterIds && currentSession.characterIds.length > 0) {
      const idSet = new Set(currentSession.characterIds);
      return characters.filter((c) => idSet.has(c.id));
    }
    return [];
  }, [activeCall, currentSession, characters]);

  const handleMinimize = useCallback(() => {
    setCallMinimized(true);
  }, []);

  const handleRestore = useCallback(() => {
    setCallMinimized(false);
  }, []);

  const handleEnd = useCallback(() => {
    const sessId = activeCall?.sessionId;
    endCall();
    if (sessId && typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("chat-call-ended", {
          detail: { sessionId: sessId },
        })
      );
    }
  }, [activeCall?.sessionId]);

  if (!activeCall || !currentSession) {
    return null;
  }

  // 坑 13：最小化时如果是群聊或者未恢复状态，避免全屏透明遮罩拦截桌面点击
  if (activeCall.type === "voice") {
    if (!currentCharacter) return null;
    return (
      <div
        className={
          activeCall.minimized
            ? "pointer-events-none fixed inset-0 z-[120] flex items-start justify-end p-4"
            : "fixed inset-0 z-[120] flex flex-col"
        }
      >
        <div className={activeCall.minimized ? "pointer-events-auto" : "contents"}>
          <VoiceCallScreen
            session={currentSession}
            character={currentCharacter}
            initiator={activeCall.initiator}
            minimized={activeCall.minimized}
            onMinimize={handleMinimize}
            onRestore={handleRestore}
            onEnd={handleEnd}
          />
        </div>
      </div>
    );
  }

  if (activeCall.type === "video") {
    if (!currentCharacter) return null;
    return (
      <div
        className={
          activeCall.minimized
            ? "pointer-events-none fixed inset-0 z-[120] flex items-start justify-end p-4"
            : "fixed inset-0 z-[120] flex flex-col"
        }
      >
        <div className={activeCall.minimized ? "pointer-events-auto" : "contents"}>
          <VideoCallScreen
            session={currentSession}
            character={currentCharacter}
            initiator={activeCall.initiator}
            minimized={activeCall.minimized}
            onMinimize={handleMinimize}
            onRestore={handleRestore}
            onEnd={handleEnd}
          />
        </div>
      </div>
    );
  }

  if (activeCall.type === "group_voice" || activeCall.type === "group_video") {
    // 群聊全屏呼叫
    return (
      <div className="fixed inset-0 z-[120] flex flex-col">
        <GroupCallScreen
          type={activeCall.type === "group_video" ? "video" : "voice"}
          session={currentSession}
          characters={groupCharacters}
          initiator={activeCall.initiator}
          initiatorName={activeCall.initiatorName}
          onEnd={handleEnd}
        />
      </div>
    );
  }

  return null;
});
