import {
  CompletedRunSummary,
  CosmicEvidenceRecord,
  SimulationState,
  TeacherConfig,
} from '../engine/types';
import {
  DEFAULT_MOTION_SENSOR_SETTINGS,
  MotionSensorSettings,
  sanitizeMotionSensorSettings,
} from '../engine/motionControls';
import { DEFAULT_TEACHER_CONFIG } from '../engine/simulator';

const ACTIVE_SESSION_KEY = 'gencircuit_active_session_v1';
const COMPLETED_RUNS_KEY = 'gencircuit_completed_runs_v1';
const TEACHER_CONFIG_KEY = 'gencircuit_teacher_config_v1';
const CUSTOM_EVIDENCE_KEY = 'gencircuit_custom_evidence_v1';
const THEME_MODE_KEY = 'el_laberinto_theme_v1';
const MOTION_SETTINGS_KEY = 'el_laberinto_motion_settings_v1';

export type ThemeMode = 'light' | 'dark';

export function loadThemeMode(): ThemeMode {
  try {
    if (typeof window !== 'undefined') {
      const urlTheme = new URLSearchParams(window.location.search).get('theme');
      if (urlTheme === 'dark' || urlTheme === 'light') return urlTheme;
    }
    const saved = localStorage.getItem(THEME_MODE_KEY);
    if (saved === 'dark' || saved === 'light') return saved;
    if (
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches
    ) {
      return 'dark';
    }
  } catch {
    // Ignore storage errors
  }
  return 'light';
}

export function saveThemeMode(theme: ThemeMode): void {
  try {
    localStorage.setItem(THEME_MODE_KEY, theme);
  } catch {
    // Ignore storage errors
  }
}

export function saveActiveSession(state: SimulationState | null): void {
  try {
    if (!state) {
      localStorage.removeItem(ACTIVE_SESSION_KEY);
      return;
    }
    localStorage.setItem(ACTIVE_SESSION_KEY, JSON.stringify(state));
  } catch {
    // Ignore quota/storage errors in restricted browsers
  }
}

export function loadActiveSession(): SimulationState | null {
  try {
    const raw = localStorage.getItem(ACTIVE_SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<SimulationState>;
    if (
      !parsed ||
      !parsed.roundOffers ||
      !Array.isArray(parsed.accumulatedProblems) ||
      !Array.isArray(parsed.clones) ||
      parsed.clones.length === 0
    ) {
      localStorage.removeItem(ACTIVE_SESSION_KEY);
      return null;
    }
    return parsed as SimulationState;
  } catch {
    return null;
  }
}

export function saveCompletedRun(summary: CompletedRunSummary): CompletedRunSummary[] {
  const existing = loadCompletedRuns();
  const filtered = existing.filter((r) => r.runId !== summary.runId);
  const updated = [summary, ...filtered].slice(0, 30);
  try {
    localStorage.setItem(COMPLETED_RUNS_KEY, JSON.stringify(updated));
  } catch {
    // Ignore storage errors
  }
  return updated;
}

export function loadCompletedRuns(): CompletedRunSummary[] {
  try {
    const raw = localStorage.getItem(COMPLETED_RUNS_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as CompletedRunSummary[];
  } catch {
    return [];
  }
}

export function clearCompletedRuns(): void {
  try {
    localStorage.removeItem(COMPLETED_RUNS_KEY);
  } catch {
    // Ignore
  }
}

export function saveTeacherConfig(config: TeacherConfig): void {
  try {
    localStorage.setItem(TEACHER_CONFIG_KEY, JSON.stringify(config));
  } catch {
    // Ignore
  }
}

export function loadTeacherConfig(): TeacherConfig {
  try {
    const raw = localStorage.getItem(TEACHER_CONFIG_KEY);
    if (!raw) return { ...DEFAULT_TEACHER_CONFIG };
    return { ...DEFAULT_TEACHER_CONFIG, ...(JSON.parse(raw) as Partial<TeacherConfig>) };
  } catch {
    return { ...DEFAULT_TEACHER_CONFIG };
  }
}

export function saveCustomEvidence(records: CosmicEvidenceRecord[]): void {
  try {
    localStorage.setItem(CUSTOM_EVIDENCE_KEY, JSON.stringify(records));
  } catch {
    // Ignore
  }
}

export function loadCustomEvidence(): CosmicEvidenceRecord[] {
  try {
    const raw = localStorage.getItem(CUSTOM_EVIDENCE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as CosmicEvidenceRecord[];
  } catch {
    return [];
  }
}

export function loadMotionSensorSettings(): MotionSensorSettings {
  try {
    const raw = localStorage.getItem(MOTION_SETTINGS_KEY);
    if (!raw) return { ...DEFAULT_MOTION_SENSOR_SETTINGS };
    return sanitizeMotionSensorSettings(JSON.parse(raw) as Partial<MotionSensorSettings>);
  } catch {
    return { ...DEFAULT_MOTION_SENSOR_SETTINGS };
  }
}

export function saveMotionSensorSettings(settings: MotionSensorSettings): void {
  try {
    localStorage.setItem(
      MOTION_SETTINGS_KEY,
      JSON.stringify(sanitizeMotionSensorSettings(settings))
    );
  } catch {
    // Ignore storage errors
  }
}
