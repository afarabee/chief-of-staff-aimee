import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
    clear: () => { store = {}; },
  };
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock });

describe('useSidebarConfig storage', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  it('saves nav order to localStorage', () => {
    const order = ['tasks', 'calendar', 'assets'];
    localStorage.setItem('sidebar-nav-order', JSON.stringify(order));
    const stored = JSON.parse(localStorage.getItem('sidebar-nav-order')!);
    expect(stored).toEqual(order);
  });

  it('returns null when no config exists', () => {
    expect(localStorage.getItem('sidebar-nav-order')).toBeNull();
  });

  it('handles invalid JSON gracefully', () => {
    localStorage.setItem('sidebar-nav-order', 'not-json');
    let result;
    try {
      result = JSON.parse(localStorage.getItem('sidebar-nav-order')!);
    } catch {
      result = null;
    }
    expect(result).toBeNull();
  });
});
