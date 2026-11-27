import { GameMode } from './types';

export interface LabyrinthVisualTheme {
  phase: 0 | 1 | 2 | 3;
  phaseLabel: string;
  bgHex: number;
  fogHex: number;
  fogDensity: number;
  wallBase: string;
  wallLight: string;
  wallDark: string;
  wallMortar: string;
  wallVein: string;
  wallVeinGlow: string;
  floorTileA: string;
  floorTileB: string;
  floorSeam: string;
  pillarBase: string;
  pillarBand: string;
  capColor: number;
  capEmissive: number;
  capEmissiveIntensity: number;
  hemiSky: number;
  hemiGround: number;
  hemiIntensity: number;
  keyColor: number;
  keyIntensity: number;
  headlampColor: number;
  headlampIntensity: number;
  guideLineHex: number;
  beaconHex: number;
  beaconIntensity: number;
  beaconVisibleScale: number; // grows dramatically as you near the destination!
  ambientParticleHex: number;
  cracksIntensity: number; // 0..1 organic fractures or scanlines painted on masonry
}

export type LabyrinthResolutionLevel = 'low' | 'medium' | 'high' | 'ultra';

export interface LabyrinthResolutionPreset {
  level: LabyrinthResolutionLevel;
  label: string;
  scale: number;
  softwareScale: number;
  pixelRatioCap: number;
  pixelated: boolean;
  smoothTextures: boolean;
}

export const LABYRINTH_RESOLUTION_ORDER: readonly LabyrinthResolutionLevel[] = [
  'low',
  'medium',
  'high',
  'ultra',
];

export const LABYRINTH_RESOLUTION_PRESETS: Record<
  LabyrinthResolutionLevel,
  LabyrinthResolutionPreset
> = {
  low: {
    level: 'low',
    label: 'Baja',
    scale: 0.4,
    softwareScale: 0.4,
    pixelRatioCap: 1,
    pixelated: true,
    smoothTextures: false,
  },
  medium: {
    level: 'medium',
    label: 'Media',
    scale: 0.72,
    softwareScale: 0.72,
    pixelRatioCap: 1,
    pixelated: false,
    smoothTextures: true,
  },
  high: {
    level: 'high',
    label: 'Alta',
    scale: 1.0,
    softwareScale: 1.0,
    pixelRatioCap: 1.5,
    pixelated: false,
    smoothTextures: true,
  },
  ultra: {
    level: 'ultra',
    label: 'Ultra',
    scale: 1.0,
    softwareScale: 1.25,
    pixelRatioCap: 2.0,
    pixelated: false,
    smoothTextures: true,
  },
};

export function getLabyrinthResolutionPreset(
  level: LabyrinthResolutionLevel
): LabyrinthResolutionPreset {
  return LABYRINTH_RESOLUTION_PRESETS[level];
}

export function stepLabyrinthResolution(
  current: LabyrinthResolutionLevel,
  delta: -1 | 1
): LabyrinthResolutionLevel {
  const idx = LABYRINTH_RESOLUTION_ORDER.indexOf(current);
  const nextIdx = Math.max(0, Math.min(LABYRINTH_RESOLUTION_ORDER.length - 1, idx + delta));
  return LABYRINTH_RESOLUTION_ORDER[nextIdx];
}

export interface ComputedRenderBuffer {
  width: number;
  height: number;
  pixelRatio: number;
  backingWidth: number;
  backingHeight: number;
  imageRendering: 'pixelated' | 'auto';
}

export function computeLabyrinthRenderBuffer(
  cssWidth: number,
  cssHeight: number,
  level: LabyrinthResolutionLevel,
  devicePixelRatio: number,
  isSoftwareGl: boolean
): ComputedRenderBuffer {
  const safeCssW = Math.max(320, Math.floor(cssWidth));
  const safeCssH = Math.max(240, Math.floor(cssHeight));
  const preset = getLabyrinthResolutionPreset(level);
  const safeDpr = Number.isFinite(devicePixelRatio) && devicePixelRatio > 0 ? devicePixelRatio : 1;

  if (isSoftwareGl) {
    const scale = preset.softwareScale;
    const width = Math.max(200, Math.round(safeCssW * scale));
    const height = Math.max(150, Math.round(safeCssH * scale));
    return {
      width,
      height,
      pixelRatio: 1,
      backingWidth: width,
      backingHeight: height,
      imageRendering: preset.pixelated ? 'pixelated' : 'auto',
    };
  }

  if (level === 'low' || level === 'medium') {
    const width = Math.max(200, Math.round(safeCssW * preset.scale));
    const height = Math.max(150, Math.round(safeCssH * preset.scale));
    return {
      width,
      height,
      pixelRatio: 1,
      backingWidth: width,
      backingHeight: height,
      imageRendering: preset.pixelated ? 'pixelated' : 'auto',
    };
  }

  const pixelRatio =
    level === 'ultra'
      ? Math.max(1.5, Math.min(safeDpr * 1.5, preset.pixelRatioCap))
      : Math.min(Math.max(1, safeDpr), preset.pixelRatioCap);

  return {
    width: safeCssW,
    height: safeCssH,
    pixelRatio,
    backingWidth: Math.round(safeCssW * pixelRatio),
    backingHeight: Math.round(safeCssH * pixelRatio),
    imageRendering: 'auto',
  };
}

export const LABYRINTH_ZOOM_MIN = 0.6;
export const LABYRINTH_ZOOM_MAX = 2.0;
export const LABYRINTH_ZOOM_DEFAULT = 1.0;
export const LABYRINTH_ZOOM_STEP = 0.2;
export const LABYRINTH_BASE_FOV = 64;

export function clampLabyrinthZoom(zoom: number): number {
  if (!Number.isFinite(zoom)) return LABYRINTH_ZOOM_DEFAULT;
  const clamped = Math.max(LABYRINTH_ZOOM_MIN, Math.min(LABYRINTH_ZOOM_MAX, zoom));
  return Math.round(clamped * 100) / 100;
}

export function stepLabyrinthZoom(current: number, delta: -1 | 1): number {
  return clampLabyrinthZoom(current + delta * LABYRINTH_ZOOM_STEP);
}

export function computeLabyrinthCameraFov(
  zoom: number,
  cameraMode: 'third_person' | 'first_person' | 'aerial'
): number {
  if (cameraMode === 'aerial') {
    return LABYRINTH_BASE_FOV;
  }
  const safeZoom = clampLabyrinthZoom(zoom);
  if (cameraMode === 'third_person') {
    return Math.max(46, Math.min(76, LABYRINTH_BASE_FOV / Math.pow(safeZoom, 0.35)));
  }
  return Math.max(32, Math.min(86, LABYRINTH_BASE_FOV / safeZoom));
}

export function computeAerialZoomDistanceScale(zoom: number): number {
  const safeZoom = clampLabyrinthZoom(zoom);
  return Math.round((1 / safeZoom) * 1000) / 1000;
}

export interface SecretKeySequenceState {
  count: number;
  lastPressMs: number;
}

export const TEACHER_SECRET_KEY = 'h';
export const TEACHER_SECRET_COUNT = 5;
export const TEACHER_SECRET_WINDOW_MS = 2500;

/**
 * Pure state transition for detecting N consecutive presses of a hidden hotkey (e.g. 5x 'h').
 * Resets cleanly on any other key or if the elapsed gap exceeds windowMs.
 */
export function advanceSecretKeySequence(
  prev: SecretKeySequenceState,
  key: string,
  nowMs: number,
  targetKey = TEACHER_SECRET_KEY,
  targetCount = TEACHER_SECRET_COUNT,
  windowMs = TEACHER_SECRET_WINDOW_MS
): { next: SecretKeySequenceState; triggered: boolean } {
  const normalizedKey = key.toLowerCase();
  if (normalizedKey !== targetKey.toLowerCase()) {
    return { next: { count: 0, lastPressMs: 0 }, triggered: false };
  }
  const withinWindow = prev.count > 0 && nowMs - prev.lastPressMs <= windowMs;
  const nextCount = withinWindow ? prev.count + 1 : 1;
  if (nextCount >= targetCount) {
    return { next: { count: 0, lastPressMs: 0 }, triggered: true };
  }
  return { next: { count: nextCount, lastPressMs: nowMs }, triggered: false };
}

export type CancerSeverityLevel = 'baja' | 'moderada' | 'alta' | 'critica';

export interface CancerSeverityMetrics {
  burden: number; // 0..100
  normalized: number; // 0..1
  level: CancerSeverityLevel;
  label: string;
  shortLabel: string;
  heartbeatBpm: number; // 52..120 BPM
  pulseSpeed: number; // rad/s visual pulse rate
  droneTension: number; // 0..1 audio harmonic tension
  bioGrowthCount: number; // 0..32 organic tumor nodules in 3D chamber
  sporeCount: number; // 18..64 floating atmospheric spores
  veinIntensity: number; // 0.08..1.0 wall/floor vascular corruption
  vignetteOpacity: number; // 0..0.42 peripheral crimson urgency vignette
  accentHex: number;
  accentCss: string;
}

/**
 * Maps live cancer burden (0..100) into continuous visual & acoustic severity cues
 * so the 3D labyrinth unmistakably communicates how severe the cancer is.
 */
export function computeCancerSeverityMetrics(tumorBurden: number): CancerSeverityMetrics {
  const burden = Number.isFinite(tumorBurden)
    ? Math.max(0, Math.min(100, Math.round(tumorBurden)))
    : 0;
  const n = burden / 100;

  let level: CancerSeverityLevel = 'baja';
  let label = 'Gravedad baja';
  let shortLabel = 'Baja';
  let accentHex = 0x10b981;
  let accentCss = '#10b981';

  if (burden >= 75) {
    level = 'critica';
    label = 'Gravedad crítica';
    shortLabel = 'Crítica';
    accentHex = 0xdc2626;
    accentCss = '#dc2626';
  } else if (burden >= 50) {
    level = 'alta';
    label = 'Gravedad alta';
    shortLabel = 'Alta';
    accentHex = 0xf43f5e;
    accentCss = '#f43f5e';
  } else if (burden >= 26) {
    level = 'moderada';
    label = 'Gravedad moderada';
    shortLabel = 'Moderada';
    accentHex = 0xf59e0b;
    accentCss = '#f59e0b';
  }

  const heartbeatBpm = Math.round(52 + n * 68);
  const pulseSpeed = Number((1.3 + n * 2.5).toFixed(2));
  const droneTension = Number(Math.min(1, Math.max(0, n * 1.05)).toFixed(3));
  const bioGrowthCount =
    burden < 26 ? 0 : Math.min(32, Math.max(4, Math.round(((burden - 22) / 78) * 32)));
  const sporeCount = Math.round(18 + n * 46);
  const veinIntensity = Number(Math.min(1, 0.08 + n * 0.92).toFixed(3));
  const vignetteOpacity =
    burden < 52 ? 0 : Number(Math.min(0.42, ((burden - 52) / 48) * 0.42).toFixed(3));

  return {
    burden,
    normalized: n,
    level,
    label,
    shortLabel,
    heartbeatBpm,
    pulseSpeed,
    droneTension,
    bioGrowthCount,
    sporeCount,
    veinIntensity,
    vignetteOpacity,
    accentHex,
    accentCss,
  };
}

/**
 * Progressive 4-stage aesthetic theme for the 3D Labyrinth driven by destination proximity (0..100)
 * and optionally modulated by live cancer severity (tumorBurden 0..100).
 *
 * - CANCER ROLE (0% -> 100%):
 *   Transforms from cold, tightly regulated, high-fog healthy tissue confinement ->
 *   fracturing barriers -> surging crimson-amber vascular expansion ->
 *   open golden-crimson colonized horizon with a towering Destination Beacon.
 *
 * - ONCOLOGIST ROLE (0% -> 100%):
 *   Transforms from dense, hostile crimson-shadowed tumor opacity ->
 *   cobalt clinical scanning corridors ->
 *   brightening teal-ivory containment chambers ->
 *   luminous emerald-ivory liberated tissue sanctuary.
 */
export function getLabyrinthTheme(
  role: GameMode,
  progress: number,
  tumorBurden?: number
): LabyrinthVisualTheme {
  const p = Math.max(0, Math.min(100, progress));
  const phase: 0 | 1 | 2 | 3 =
    role === 'cancer'
      ? p >= 72
        ? 3
        : p >= 52
          ? 2
          : p >= 32
            ? 1
            : 0
      : p >= 76
        ? 3
        : p >= 62
          ? 2
          : p >= 45
            ? 1
            : 0;

  const applySeverityModulation = (base: LabyrinthVisualTheme): LabyrinthVisualTheme => {
    if (typeof tumorBurden !== 'number' || !Number.isFinite(tumorBurden)) return base;
    const sev = computeCancerSeverityMetrics(tumorBurden);
    return {
      ...base,
      cracksIntensity: Math.max(base.cracksIntensity, sev.veinIntensity),
      ambientParticleHex:
        sev.burden >= 75
          ? 0xef4444
          : sev.burden >= 50
            ? 0xfb7185
            : base.ambientParticleHex,
    };
  };

  if (role === 'cancer') {
    const phases: LabyrinthVisualTheme[] = [
      // Phase 0: Confined inside controlled healthy tissue (cool, orderly, misty)
      {
        phase: 0,
        phaseLabel: 'Tejido bajo control',
        bgHex: 0x131b29,
        fogHex: 0x131b29,
        fogDensity: 0.028,
        wallBase: '#334257',
        wallLight: '#455975',
        wallDark: '#232e3d',
        wallMortar: '#141c29',
        wallVein: '#3b82f6',
        wallVeinGlow: '#93c5fd',
        floorTileA: '#222d3d',
        floorTileB: '#2b384c',
        floorSeam: '#121824',
        pillarBase: '#3f5069',
        pillarBand: '#60a5fa',
        capColor: 0x5c7291,
        capEmissive: 0x16243a,
        capEmissiveIntensity: 0.35,
        hemiSky: 0xcbd5e1,
        hemiGround: 0x1e293b,
        hemiIntensity: 1.45,
        keyColor: 0xe2e8f0,
        keyIntensity: 1.75,
        headlampColor: 0xe0f2fe,
        headlampIntensity: 1.5,
        guideLineHex: 0x60a5fa,
        beaconHex: 0xf43f5e,
        beaconIntensity: 0.4,
        beaconVisibleScale: 0.55,
        ambientParticleHex: 0x93c5fd,
        cracksIntensity: 0.1,
      },
      // Phase 1: Fracturing barriers (crimson veins piercing slate walls)
      {
        phase: 1,
        phaseLabel: 'Ruptura de frenos',
        bgHex: 0x1c1526,
        fogHex: 0x1c1526,
        fogDensity: 0.022,
        wallBase: '#453652',
        wallLight: '#5a466b',
        wallDark: '#30253b',
        wallMortar: '#1a1324',
        wallVein: '#be123c',
        wallVeinGlow: '#fb7185',
        floorTileA: '#2d2438',
        floorTileB: '#382d45',
        floorSeam: '#16111f',
        pillarBase: '#503d61',
        pillarBand: '#f43f5e',
        capColor: 0x785685,
        capEmissive: 0x3b1225,
        capEmissiveIntensity: 0.5,
        hemiSky: 0xfecdd3,
        hemiGround: 0x2b192e,
        hemiIntensity: 1.65,
        keyColor: 0xffedd5,
        keyIntensity: 2.0,
        headlampColor: 0xfde68a,
        headlampIntensity: 1.8,
        guideLineHex: 0xf43f5e,
        beaconHex: 0xf43f5e,
        beaconIntensity: 0.85,
        beaconVisibleScale: 0.9,
        ambientParticleHex: 0xfb7185,
        cracksIntensity: 0.45,
      },
      // Phase 2: Invasive vascular expansion (vivid magma-crimson + golden nutrient veins)
      {
        phase: 2,
        phaseLabel: 'Expansión invasiva',
        bgHex: 0x26121f,
        fogHex: 0x26121f,
        fogDensity: 0.015,
        wallBase: '#5c293c',
        wallLight: '#78364e',
        wallDark: '#401b29',
        wallMortar: '#210d16',
        wallVein: '#e11d48',
        wallVeinGlow: '#fbbf24',
        floorTileA: '#3b1c2a',
        floorTileB: '#4a2335',
        floorSeam: '#1c0c14',
        pillarBase: '#6e3147',
        pillarBand: '#f59e0b',
        capColor: 0x9e435d,
        capEmissive: 0x6b132b,
        capEmissiveIntensity: 0.72,
        hemiSky: 0xfde68a,
        hemiGround: 0x3b1222,
        hemiIntensity: 1.85,
        keyColor: 0xfef3c7,
        keyIntensity: 2.25,
        headlampColor: 0xfbbf24,
        headlampIntensity: 2.1,
        guideLineHex: 0xf59e0b,
        beaconHex: 0xf59e0b,
        beaconIntensity: 1.35,
        beaconVisibleScale: 1.35,
        ambientParticleHex: 0xfbbf24,
        cracksIntensity: 0.8,
      },
      // Phase 3: Full liberation & resource colonization (radiant amber-crimson open horizon)
      {
        phase: 3,
        phaseLabel: 'Colonización plena',
        bgHex: 0x301818,
        fogHex: 0x301818,
        fogDensity: 0.009,
        wallBase: '#733438',
        wallLight: '#944745',
        wallDark: '#4f2024',
        wallMortar: '#2b1012',
        wallVein: '#f59e0b',
        wallVeinGlow: '#fef08a',
        floorTileA: '#472323',
        floorTileB: '#592c2a',
        floorSeam: '#241010',
        pillarBase: '#8a423e',
        pillarBand: '#fde047',
        capColor: 0xd97706,
        capEmissive: 0x9a3412,
        capEmissiveIntensity: 0.95,
        hemiSky: 0xfef08a,
        hemiGround: 0x4c1d1d,
        hemiIntensity: 2.1,
        keyColor: 0xfffbeb,
        keyIntensity: 2.5,
        headlampColor: 0xfef08a,
        headlampIntensity: 2.3,
        guideLineHex: 0xfde047,
        beaconHex: 0xfde047,
        beaconIntensity: 1.9,
        beaconVisibleScale: 1.85,
        ambientParticleHex: 0xfef08a,
        cracksIntensity: 1.0,
      },
    ];
    return applySeverityModulation(phases[phase]);
  }

  // ONCOLOGIST ROLE: From dense hostile tumor shadow -> bright emerald-ivory liberated tissue
  const oncoPhases: LabyrinthVisualTheme[] = [
    // Phase 0: Aggressive opaque tumor pressure (dark wine-slate, heavy fog)
    {
      phase: 0,
      phaseLabel: 'Tumor dominante',
      bgHex: 0x1d1321,
      fogHex: 0x1d1321,
      fogDensity: 0.028,
      wallBase: '#422c3d',
      wallLight: '#573a50',
      wallDark: '#2e1e2b',
      wallMortar: '#19101a',
      wallVein: '#be123c',
      wallVeinGlow: '#fb7185',
      floorTileA: '#2b1e2c',
      floorTileB: '#362538',
      floorSeam: '#150e17',
      pillarBase: '#4f3548',
      pillarBand: '#e11d48',
      capColor: 0x6e475e,
      capEmissive: 0x3b1224,
      capEmissiveIntensity: 0.45,
      hemiSky: 0xfecdd3,
      hemiGround: 0x261524,
      hemiIntensity: 1.4,
      keyColor: 0xffe4e6,
      keyIntensity: 1.75,
      headlampColor: 0xbae6fd,
      headlampIntensity: 1.7,
      guideLineHex: 0x38bdf8,
      beaconHex: 0x38bdf8,
      beaconIntensity: 0.45,
      beaconVisibleScale: 0.55,
      ambientParticleHex: 0xfb7185,
      cracksIntensity: 0.75,
    },
    // Phase 1: Clinical scanning & characterization (clean cobalt-slate laboratory)
    {
      phase: 1,
      phaseLabel: 'Rastreo y contención',
      bgHex: 0x132030,
      fogHex: 0x132030,
      fogDensity: 0.02,
      wallBase: '#314761',
      wallLight: '#436082',
      wallDark: '#24354a',
      wallMortar: '#15202e',
      wallVein: '#0284c7',
      wallVeinGlow: '#38bdf8',
      floorTileA: '#233245',
      floorTileB: '#2b3e54',
      floorSeam: '#141926',
      pillarBase: '#3a5372',
      pillarBand: '#38bdf8',
      capColor: 0x4f7096,
      capEmissive: 0x10253b,
      capEmissiveIntensity: 0.48,
      hemiSky: 0xdbeafe,
      hemiGround: 0x1e293b,
      hemiIntensity: 1.65,
      keyColor: 0xf0f9ff,
      keyIntensity: 2.05,
      headlampColor: 0xe0f2fe,
      headlampIntensity: 1.85,
      guideLineHex: 0x38bdf8,
      beaconHex: 0x38bdf8,
      beaconIntensity: 0.9,
      beaconVisibleScale: 0.95,
      ambientParticleHex: 0x38bdf8,
      cracksIntensity: 0.35,
    },
    // Phase 2: Remission underway (luminous teal-stone sanctuary clearing up)
    {
      phase: 2,
      phaseLabel: 'Remisión en curso',
      bgHex: 0x122b33,
      fogHex: 0x122b33,
      fogDensity: 0.013,
      wallBase: '#2f5d66',
      wallLight: '#3f7882',
      wallDark: '#21454d',
      wallMortar: '#132a30',
      wallVein: '#059669',
      wallVeinGlow: '#34d399',
      floorTileA: '#22424a',
      floorTileB: '#2b525c',
      floorSeam: '#13262b',
      pillarBase: '#3b707a',
      pillarBand: '#34d399',
      capColor: 0x52999c,
      capEmissive: 0x0d3b38,
      capEmissiveIntensity: 0.65,
      hemiSky: 0xd1fae5,
      hemiGround: 0x17363b,
      hemiIntensity: 1.9,
      keyColor: 0xecfdf5,
      keyIntensity: 2.3,
      headlampColor: 0xa7f3d0,
      headlampIntensity: 2.0,
      guideLineHex: 0x34d399,
      beaconHex: 0x10b981,
      beaconIntensity: 1.4,
      beaconVisibleScale: 1.4,
      ambientParticleHex: 0x34d399,
      cracksIntensity: 0.12,
    },
    // Phase 3: Liberated healthy tissue (radiant ivory-emerald open clarity)
    {
      phase: 3,
      phaseLabel: 'Tejido liberado',
      bgHex: 0x183838,
      fogHex: 0x183838,
      fogDensity: 0.008,
      wallBase: '#4d7c7a',
      wallLight: '#689c98',
      wallDark: '#365c5a',
      wallMortar: '#1e3838',
      wallVein: '#10b981',
      wallVeinGlow: '#a7f3d0',
      floorTileA: '#355959',
      floorTileB: '#416b6b',
      floorSeam: '#1f3838',
      pillarBase: '#5e9491',
      pillarBand: '#6ee7b7',
      capColor: 0x86efac,
      capEmissive: 0x065f46,
      capEmissiveIntensity: 0.85,
      hemiSky: 0xf0fdf4,
      hemiGround: 0x1f4542,
      hemiIntensity: 2.15,
      keyColor: 0xffffff,
      keyIntensity: 2.55,
      headlampColor: 0xd1fae5,
      headlampIntensity: 2.15,
      guideLineHex: 0x6ee7b7,
      beaconHex: 0x6ee7b7,
      beaconIntensity: 1.95,
      beaconVisibleScale: 1.9,
      ambientParticleHex: 0xa7f3d0,
      cracksIntensity: 0.0,
    },
  ];
  return applySeverityModulation(oncoPhases[phase]);
}
