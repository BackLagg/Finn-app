import { useState, useCallback, useEffect } from 'react';

const STORAGE_KEY = 'planner-collapsed';

function loadState(): Record<string, boolean> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, boolean>;
  } catch {
    return {};
  }
}

function saveState(state: Record<string, boolean>): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {}
}

export function useCollapsedStorage(id: string, defaultExpanded = true) {
  const [isCollapsed, setIsCollapsedState] = useState(() => {
    const state = loadState();
    return state[id] ?? !defaultExpanded;
  });

  useEffect(() => {
    const state = loadState();
    const stored = state[id];
    if (stored !== undefined) {
      setIsCollapsedState(stored);
    }
  }, [id]);

  const setIsCollapsed = useCallback(
    (value: boolean | ((prev: boolean) => boolean)) => {
      setIsCollapsedState((prev) => {
        const next = typeof value === 'function' ? value(prev) : value;
        const state = loadState();
        state[id] = next;
        saveState(state);
        return next;
      });
    },
    [id]
  );

  const toggle = useCallback(() => {
    setIsCollapsed((v) => !v);
  }, [setIsCollapsed]);

  return [isCollapsed, toggle, setIsCollapsed] as const;
}
