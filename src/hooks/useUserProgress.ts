import { useCallback, useEffect, useState } from 'react';
import type { ThemeMode, UserProgressSnapshot } from '../types/directory';

const BOOKMARKS_KEY = 'rb_bookmarks_v1';
const LEARNED_KEY = 'rb_learned_v1';
const THEME_KEY = 'rb_theme';

function loadIdSet(key: string): Set<string> {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.filter((item): item is string => typeof item === 'string'));
  } catch {
    return new Set();
  }
}

function getInitialTheme(): ThemeMode {
  try {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved === 'dark' || saved === 'light') return saved;
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
  } catch {
    // ignore storage access issues
  }
  return 'light';
}

export function useUserProgress() {
  const [bookmarks, setBookmarks] = useState<Set<string>>(() => loadIdSet(BOOKMARKS_KEY));
  const [learned, setLearned] = useState<Set<string>>(() => loadIdSet(LEARNED_KEY));
  const [theme, setTheme] = useState<ThemeMode>(getInitialTheme);

  useEffect(() => {
    try {
      localStorage.setItem(BOOKMARKS_KEY, JSON.stringify([...bookmarks]));
    } catch {
      // ignore quota errors
    }
  }, [bookmarks]);

  useEffect(() => {
    try {
      localStorage.setItem(LEARNED_KEY, JSON.stringify([...learned]));
    } catch {
      // ignore quota errors
    }
  }, [learned]);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', theme === 'dark');
    const metaTheme = document.querySelector('meta[name="theme-color"]');
    if (metaTheme) {
      metaTheme.setAttribute('content', theme === 'dark' ? '#161616' : '#f4f4f4');
    }
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch {
      // ignore storage errors
    }
  }, [theme]);

  const toggleBookmark = useCallback((id: string) => {
    setBookmarks((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleLearned = useCallback((id: string) => {
    setLearned((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

  const clearBookmarks = useCallback(() => {
    setBookmarks(new Set());
  }, []);

  const clearLearned = useCallback(() => {
    setLearned(new Set());
  }, []);

  const exportProgress = useCallback((): UserProgressSnapshot => {
    return {
      version: 1,
      exportedAt: new Date().toISOString(),
      bookmarks: [...bookmarks],
      learned: [...learned],
    };
  }, [bookmarks, learned]);

  const importProgress = useCallback(
    (rawJson: string, validIds: Set<string>): { ok: boolean; message: string } => {
      try {
        const parsed = JSON.parse(rawJson) as Partial<UserProgressSnapshot>;
        if (!parsed || typeof parsed !== 'object') {
          return { ok: false, message: 'Format berkas JSON tidak dikenali.' };
        }
        const incomingBookmarks = Array.isArray(parsed.bookmarks)
          ? parsed.bookmarks.filter((id): id is string => typeof id === 'string' && validIds.has(id))
          : [];
        const incomingLearned = Array.isArray(parsed.learned)
          ? parsed.learned.filter((id): id is string => typeof id === 'string' && validIds.has(id))
          : [];

        if (!Array.isArray(parsed.bookmarks) && !Array.isArray(parsed.learned)) {
          return { ok: false, message: 'Berkas tidak memiliki data tersimpan atau dipelajari.' };
        }

        setBookmarks((prev) => new Set([...prev, ...incomingBookmarks]));
        setLearned((prev) => new Set([...prev, ...incomingLearned]));
        return {
          ok: true,
          message: `Berhasil mengimpor ${incomingBookmarks.length} tersimpan dan ${incomingLearned.length} selesai.`,
        };
      } catch {
        return { ok: false, message: 'Berkas JSON tidak valid atau rusak.' };
      }
    },
    []
  );

  return {
    bookmarks,
    learned,
    theme,
    toggleBookmark,
    toggleLearned,
    toggleTheme,
    clearBookmarks,
    clearLearned,
    exportProgress,
    importProgress,
  };
}
