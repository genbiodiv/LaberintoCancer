import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { ThemeMode } from '../utils/storage';

interface ThemeToggleProps {
  theme: ThemeMode;
  onChange: (next: ThemeMode) => void;
  variant?: 'segmented' | 'compact' | 'hud';
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  theme,
  onChange,
  variant = 'segmented',
}) => {
  const isDark = theme === 'dark';

  if (variant === 'hud') {
    return (
      <button
        type="button"
        data-testid="theme-toggle"
        onClick={() => onChange(isDark ? 'light' : 'dark')}
        aria-label={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
        title={isDark ? 'Modo claro' : 'Modo oscuro'}
        className="pointer-events-auto bg-slate-950/90 hover:bg-slate-900 border border-slate-700/90 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-200 hover:text-white inline-flex items-center gap-1.5 transition-colors cursor-pointer"
      >
        {isDark ? (
          <>
            <Sun className="w-3.5 h-3.5 text-amber-300" aria-hidden="true" />
            <span className="hidden sm:inline">Claro</span>
          </>
        ) : (
          <>
            <Moon className="w-3.5 h-3.5 text-sky-300" aria-hidden="true" />
            <span className="hidden sm:inline">Oscuro</span>
          </>
        )}
      </button>
    );
  }

  if (variant === 'compact') {
    return (
      <button
        type="button"
        data-testid="theme-toggle"
        onClick={() => onChange(isDark ? 'light' : 'dark')}
        aria-label={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
        title={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
        className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-colors cursor-pointer"
      >
        {isDark ? (
          <>
            <Sun className="w-3.5 h-3.5 text-amber-400" aria-hidden="true" />
            <span>Claro</span>
          </>
        ) : (
          <>
            <Moon className="w-3.5 h-3.5 text-slate-600" aria-hidden="true" />
            <span>Oscuro</span>
          </>
        )}
      </button>
    );
  }

  return (
    <div
      role="group"
      aria-label="Tema de color"
      data-testid="theme-toggle"
      className="inline-flex items-center gap-0.5 p-0.5 rounded-lg bg-slate-100 dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 shrink-0"
    >
      <button
        type="button"
        data-testid="theme-light-btn"
        aria-pressed={!isDark}
        onClick={() => onChange('light')}
        className={`px-2.5 py-1 rounded-md text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap transition-colors cursor-pointer ${
          !isDark
            ? 'bg-white text-slate-900 shadow-xs'
            : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        <Sun className="w-3.5 h-3.5" aria-hidden="true" />
        <span>Claro</span>
      </button>
      <button
        type="button"
        data-testid="theme-dark-btn"
        aria-pressed={isDark}
        onClick={() => onChange('dark')}
        className={`px-2.5 py-1 rounded-md text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap transition-colors cursor-pointer ${
          isDark
            ? 'bg-slate-950 text-white shadow-xs'
            : 'text-slate-600 hover:text-slate-900'
        }`}
      >
        <Moon className="w-3.5 h-3.5" aria-hidden="true" />
        <span>Oscuro</span>
      </button>
    </div>
  );
};
