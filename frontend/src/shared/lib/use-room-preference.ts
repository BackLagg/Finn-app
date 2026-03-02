import { useState, useEffect } from 'react';

const STORAGE_CONTEXT = 'app_room_context';
const STORAGE_ROOM_ID = 'app_selected_room_id';

export type RoomContext = 'personal' | 'partner';

export function useRoomPreference(): [
  context: RoomContext,
  setContext: (v: RoomContext) => void,
  selectedRoomId: string | undefined,
  setSelectedRoomId: (v: string | undefined) => void,
] {
  const [context, setContextState] = useState<RoomContext>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_CONTEXT);
      if (stored === 'personal' || stored === 'partner') return stored;
    } catch {}
    return 'personal';
  });

  const [selectedRoomId, setSelectedRoomIdState] = useState<string | undefined>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_ROOM_ID);
      return stored || undefined;
    } catch {}
    return undefined;
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_CONTEXT, context);
    } catch {}
  }, [context]);

  useEffect(() => {
    try {
      if (selectedRoomId) {
        localStorage.setItem(STORAGE_ROOM_ID, selectedRoomId);
      } else {
        localStorage.removeItem(STORAGE_ROOM_ID);
      }
    } catch {}
  }, [selectedRoomId]);

  return [context, setContextState, selectedRoomId, setSelectedRoomIdState];
}
