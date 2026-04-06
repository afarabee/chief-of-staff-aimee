import { useState, useCallback } from 'react';

const STORAGE_KEY = 'sidebar-nav-order';

export interface NavItemConfig {
  id: string;
  title: string;
  url: string;
  iconName: string;
}

const DEFAULT_NAV_IDS = [
  'command-center',
  'today',
  'calendar',
  'shopping-list',
  'tasks',
  'ideas',
  'categories',
  'assets',
  'maintenance',
  'providers',
  'ai-activity',
  'prescriptions',
];

function loadOrder(): string[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as string[];
      // Merge: keep stored order but add any new items not yet in it
      const missing = DEFAULT_NAV_IDS.filter((id) => !parsed.includes(id));
      return [...parsed.filter((id) => DEFAULT_NAV_IDS.includes(id)), ...missing];
    }
  } catch {}
  return DEFAULT_NAV_IDS;
}

function saveOrder(order: string[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(order));
}

export function useSidebarConfig() {
  const [navOrder, setNavOrder] = useState<string[]>(loadOrder);

  const moveItem = useCallback((itemId: string, direction: 'up' | 'down') => {
    setNavOrder((prev) => {
      const idx = prev.indexOf(itemId);
      if (idx === -1) return prev;
      const newIdx = direction === 'up' ? idx - 1 : idx + 1;
      if (newIdx < 0 || newIdx >= prev.length) return prev;
      const next = [...prev];
      [next[idx], next[newIdx]] = [next[newIdx], next[idx]];
      saveOrder(next);
      return next;
    });
  }, []);

  return { navOrder, moveItem };
}
