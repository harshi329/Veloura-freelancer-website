import React, { useEffect, useState } from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';

export type ThemeMode = 'light' | 'dark' | 'system';

export function applyThemePreference(mode: ThemeMode): void {
  const meta = document.querySelector('meta[name="color-scheme"]');
  const isDark =
    mode === 'dark' ||
    (mode === 'system' &&
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches);

  if (mode === 'system') {
    try {
      localStorage.removeItem('color-scheme');
    } catch {}
    if (meta) meta.setAttribute('content', 'light dark');
    document.documentElement.dataset.theme = 'system';
  } else {
    try {
      localStorage.setItem('color-scheme', mode);
    } catch {}
    if (meta) meta.setAttribute('content', mode);
    document.documentElement.dataset.theme = mode;
  }

  if (typeof document !== 'undefined') {
    document.documentElement.classList.toggle('dark', isDark);
  }
}

export const ThemeSelector: React.FC = () => {
  const [mode, setMode] = useState<ThemeMode>(() => {
    try {
      const saved = localStorage.getItem('color-scheme');
      if (saved === 'light' || saved === 'dark') return saved;
    } catch {}
    return 'system';
  });

  useEffect(() => {
    applyThemePreference(mode);

    const onMediaChange = () => {
      const saved = localStorage.getItem('color-scheme');
      if (!saved || saved === 'system') {
        applyThemePreference('system');
      }
    };
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    media.addEventListener('change', onMediaChange);

    const onStorage = (e: StorageEvent) => {
      if (e.key === 'color-scheme') {
        const next: ThemeMode =
          e.newValue === 'light' || e.newValue === 'dark' ? e.newValue : 'system';
        setMode(next);
        applyThemePreference(next);
      }
    };
    window.addEventListener('storage', onStorage);
    return () => {
      media.removeEventListener('change', onMediaChange);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  const selectMode = (next: ThemeMode) => {
    setMode(next);
    applyThemePreference(next);
  };

  return (
    <div
      role="group"
      aria-label="Theme color scheme selector"
      className="inline-flex items-center rounded-full border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-0.5 shrink-0"
    >
      {(
        [
          { id: 'light', label: 'Light', Icon: Sun },
          { id: 'dark', label: 'Dark', Icon: Moon },
          { id: 'system', label: 'System', Icon: Monitor },
        ] as const
      ).map(({ id, label, Icon }) => {
        const active = mode === id;
        return (
          <button
            key={id}
            type="button"
            onClick={() => selectMode(id)}
            aria-pressed={active}
            aria-label={`${label} theme`}
            title={`${label} theme`}
            className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium transition-colors cursor-pointer ${
              active
                ? 'bg-[var(--bg-surface)] text-[var(--brand-rose)] shadow-2xs font-semibold'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
          >
            <Icon className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            <span className="hidden 2xl:inline">{label}</span>
          </button>
        );
      })}
    </div>
  );
};
