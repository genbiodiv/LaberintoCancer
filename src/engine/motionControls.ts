export type LabyrinthCameraMode = 'third_person' | 'first_person' | 'aerial';

export interface MotionCalibration {
  beta: number; // front-to-back tilt baseline (deg)
  gamma: number; // left-to-right tilt baseline (deg)
}

export interface MotionSensorSettings {
  /** Responsiveness multiplier: 0.4 (low) .. 2.2 (high), default 1.0 */
  sensitivity: number;
  /** Neutral deadzone in degrees around calibrated posture: 2 .. 14, default 6 */
  deadzoneDeg: number;
  /** When true, tilting toward the user moves forward instead of away */
  invertForward: boolean;
}

export interface MotionDiagnostics {
  hasReading: boolean;
  pitchDeltaDeg: number;
  rollDeltaDeg: number;
  effectivePitchDeadzoneDeg: number;
  effectiveRollDeadzoneDeg: number;
  effectivePitchMaxDeg: number;
  effectiveRollMaxDeg: number;
  inDeadzone: boolean;
  input: ControlAxisInput;
}

export interface ControlAxisInput {
  moveForward: number; // -1 (backward/south) .. +1 (forward/north)
  moveRight: number; // -1 (left/west) .. +1 (right/east)
  turnDelta: number; // -1 (turn right / CW) .. +1 (turn left / CCW)
}

export const MOTION_PITCH_DEADZONE_DEG = 7;
export const MOTION_ROLL_DEADZONE_DEG = 6;
export const MOTION_PITCH_MAX_DEG = 26;
export const MOTION_ROLL_MAX_DEG = 24;

export const MOTION_SENSITIVITY_MIN = 0.4;
export const MOTION_SENSITIVITY_MAX = 2.2;
export const MOTION_DEADZONE_MIN_DEG = 2;
export const MOTION_DEADZONE_MAX_DEG = 14;

export const DEFAULT_MOTION_SENSOR_SETTINGS: MotionSensorSettings = {
  sensitivity: 1,
  deadzoneDeg: 6,
  invertForward: false,
};

export function sanitizeMotionSensorSettings(
  raw?: Partial<MotionSensorSettings> | null
): MotionSensorSettings {
  const sensitivityRaw =
    typeof raw?.sensitivity === 'number' && Number.isFinite(raw.sensitivity)
      ? raw.sensitivity
      : DEFAULT_MOTION_SENSOR_SETTINGS.sensitivity;
  const deadzoneRaw =
    typeof raw?.deadzoneDeg === 'number' && Number.isFinite(raw.deadzoneDeg)
      ? raw.deadzoneDeg
      : DEFAULT_MOTION_SENSOR_SETTINGS.deadzoneDeg;

  const clampedSensitivity = Math.max(
    MOTION_SENSITIVITY_MIN,
    Math.min(MOTION_SENSITIVITY_MAX, sensitivityRaw)
  );
  const clampedDeadzone = Math.max(
    MOTION_DEADZONE_MIN_DEG,
    Math.min(MOTION_DEADZONE_MAX_DEG, deadzoneRaw)
  );

  return {
    sensitivity: Number(clampedSensitivity.toFixed(2)),
    deadzoneDeg: Math.round(clampedDeadzone),
    invertForward: Boolean(raw?.invertForward),
  };
}

/**
 * Normalizes both KeyboardEvent.code and KeyboardEvent.key into canonical movement tokens
 * so arrow keys and WASD/QE work reliably across international keyboards and browsers.
 */
export function normalizeDirectionKey(code: string, key?: string): string | null {
  if (
    code === 'ArrowUp' ||
    code === 'ArrowDown' ||
    code === 'ArrowLeft' ||
    code === 'ArrowRight' ||
    code === 'KeyW' ||
    code === 'KeyA' ||
    code === 'KeyS' ||
    code === 'KeyD' ||
    code === 'KeyQ' ||
    code === 'KeyE'
  ) {
    return code;
  }
  if (key === 'ArrowUp' || key === 'ArrowDown' || key === 'ArrowLeft' || key === 'ArrowRight') {
    return key;
  }
  return null;
}

/**
 * Computes normalized movement & yaw turn axes from currently held keyboard keys.
 * - First-person: ArrowUp/W = forward, ArrowDown/S = back, ArrowLeft/Q = turn left,
 *   ArrowRight/E = turn right, A/D = strafe left/right.
 * - Aerial: ArrowUp/W = north, ArrowDown/S = south, ArrowLeft/A = west, ArrowRight/D = east,
 *   Q/E = rotate yaw.
 */
export function computeKeyboardControlInput(
  heldKeys: ReadonlySet<string>,
  cameraMode: LabyrinthCameraMode
): ControlAxisInput {
  let moveForward = 0;
  let moveRight = 0;
  let turnDelta = 0;

  if (heldKeys.has('KeyW') || heldKeys.has('ArrowUp')) moveForward += 1;
  if (heldKeys.has('KeyS') || heldKeys.has('ArrowDown')) moveForward -= 1;

  if (cameraMode !== 'aerial') {
    if (heldKeys.has('KeyQ') || heldKeys.has('ArrowLeft')) turnDelta += 1;
    if (heldKeys.has('KeyE') || heldKeys.has('ArrowRight')) turnDelta -= 1;
    if (heldKeys.has('KeyD')) moveRight += 1;
    if (heldKeys.has('KeyA')) moveRight -= 1;
  } else {
    if (heldKeys.has('KeyD') || heldKeys.has('ArrowRight')) moveRight += 1;
    if (heldKeys.has('KeyA') || heldKeys.has('ArrowLeft')) moveRight -= 1;
    if (heldKeys.has('KeyQ')) turnDelta += 1;
    if (heldKeys.has('KeyE')) turnDelta -= 1;
  }

  return {
    moveForward: Math.max(-1, Math.min(1, moveForward)),
    moveRight: Math.max(-1, Math.min(1, moveRight)),
    turnDelta: Math.max(-1, Math.min(1, turnDelta)),
  };
}

/**
 * Creates a neutral baseline calibration from the user's current phone holding angle.
 */
export function createMotionCalibration(
  beta: number | null | undefined,
  gamma: number | null | undefined
): MotionCalibration {
  return {
    beta: typeof beta === 'number' && Number.isFinite(beta) ? beta : 45,
    gamma: typeof gamma === 'number' && Number.isFinite(gamma) ? gamma : 0,
  };
}

function applyDeadzoneCurve(deltaDeg: number, deadzoneDeg: number, maxDeg: number): number {
  const abs = Math.abs(deltaDeg);
  if (abs <= deadzoneDeg) return 0;
  const span = Math.max(1, maxDeg - deadzoneDeg);
  const linear = Math.min(1, (abs - deadzoneDeg) / span);
  // Gentle nonlinear ramp for fine small-tilt control and crisp full-tilt response
  const curved = Math.pow(linear, 1.25);
  return Math.sign(deltaDeg) * Number(curved.toFixed(4));
}

function computeEffectiveRanges(settings: MotionSensorSettings) {
  const safe = sanitizeMotionSensorSettings(settings);
  const pitchDeadzone = safe.deadzoneDeg + 1; // default 6 + 1 = 7°
  const rollDeadzone = safe.deadzoneDeg; // default 6°
  const pitchMax = Math.max(pitchDeadzone + 6, MOTION_PITCH_MAX_DEG / safe.sensitivity);
  const rollMax = Math.max(rollDeadzone + 6, MOTION_ROLL_MAX_DEG / safe.sensitivity);
  return { safe, pitchDeadzone, rollDeadzone, pitchMax, rollMax };
}

/**
 * Computes full tilt diagnostics (deltas, deadzone status, and normalized control axes)
 * used both by the 3D engine and the live sensor calibration visualizer.
 */
export function computeMotionDiagnostics(
  orientation: { beta: number | null | undefined; gamma: number | null | undefined },
  calibration: MotionCalibration,
  cameraMode: LabyrinthCameraMode,
  screenAngleDeg = 0,
  settings: MotionSensorSettings = DEFAULT_MOTION_SENSOR_SETTINGS
): MotionDiagnostics {
  const { safe, pitchDeadzone, rollDeadzone, pitchMax, rollMax } =
    computeEffectiveRanges(settings);

  if (
    typeof orientation.beta !== 'number' ||
    !Number.isFinite(orientation.beta) ||
    typeof orientation.gamma !== 'number' ||
    !Number.isFinite(orientation.gamma)
  ) {
    return {
      hasReading: false,
      pitchDeltaDeg: 0,
      rollDeltaDeg: 0,
      effectivePitchDeadzoneDeg: pitchDeadzone,
      effectiveRollDeadzoneDeg: rollDeadzone,
      effectivePitchMaxDeg: pitchMax,
      effectiveRollMaxDeg: rollMax,
      inDeadzone: true,
      input: { moveForward: 0, moveRight: 0, turnDelta: 0 },
    };
  }

  const rawDeltaBeta = orientation.beta - calibration.beta;
  const rawDeltaGamma = orientation.gamma - calibration.gamma;

  // Normalize screen orientation into canonical pitch (forward/back) and roll (left/right)
  const normalizedAngle = ((Math.round(screenAngleDeg) % 360) + 360) % 360;
  let pitchDelta: number;
  let rollDelta: number;

  if (normalizedAngle === 90) {
    // Landscape (top of phone rotated left): gamma controls forward/back, beta controls left/right
    pitchDelta = -rawDeltaGamma;
    rollDelta = rawDeltaBeta;
  } else if (normalizedAngle === 270) {
    // Landscape (top of phone rotated right)
    pitchDelta = rawDeltaGamma;
    rollDelta = -rawDeltaBeta;
  } else if (normalizedAngle === 180) {
    pitchDelta = -rawDeltaBeta;
    rollDelta = -rawDeltaGamma;
  } else {
    // Standard portrait (0°): tilting phone forward decreases beta toward 0 => moveForward > 0
    pitchDelta = -rawDeltaBeta;
    rollDelta = rawDeltaGamma;
  }

  if (safe.invertForward) {
    pitchDelta = -pitchDelta;
  }

  const forwardAxis = applyDeadzoneCurve(pitchDelta, pitchDeadzone, pitchMax);
  const lateralAxis = applyDeadzoneCurve(rollDelta, rollDeadzone, rollMax);

  const input: ControlAxisInput =
    cameraMode !== 'aerial'
      ? {
          moveForward: forwardAxis,
          moveRight: 0,
          turnDelta: lateralAxis === 0 ? 0 : -lateralAxis,
        }
      : {
          moveForward: forwardAxis,
          moveRight: lateralAxis,
          turnDelta: 0,
        };

  return {
    hasReading: true,
    pitchDeltaDeg: Number(pitchDelta.toFixed(1)),
    rollDeltaDeg: Number(rollDelta.toFixed(1)),
    effectivePitchDeadzoneDeg: pitchDeadzone,
    effectiveRollDeadzoneDeg: rollDeadzone,
    effectivePitchMaxDeg: Number(pitchMax.toFixed(1)),
    effectiveRollMaxDeg: Number(rollMax.toFixed(1)),
    inDeadzone: forwardAxis === 0 && lateralAxis === 0,
    input,
  };
}

/**
 * Maps mobile DeviceOrientationEvent tilt angles (beta/gamma) relative to the calibrated
 * resting posture into smooth labyrinth movement and turning axes.
 * Handles portrait (0°), landscape-left (90°), and landscape-right (-90° / 270°).
 */
export function computeMotionControlInput(
  orientation: { beta: number | null | undefined; gamma: number | null | undefined },
  calibration: MotionCalibration,
  cameraMode: LabyrinthCameraMode,
  screenAngleDeg = 0,
  settings: MotionSensorSettings = DEFAULT_MOTION_SENSOR_SETTINGS
): ControlAxisInput {
  return computeMotionDiagnostics(
    orientation,
    calibration,
    cameraMode,
    screenAngleDeg,
    settings
  ).input;
}

/**
 * Merges keyboard and mobile motion sensor axes cleanly, clamped to [-1, 1].
 */
export function combineControlInputs(
  keyboard: ControlAxisInput,
  motion: ControlAxisInput
): ControlAxisInput {
  return {
    moveForward: Math.max(-1, Math.min(1, keyboard.moveForward + motion.moveForward)),
    moveRight: Math.max(-1, Math.min(1, keyboard.moveRight + motion.moveRight)),
    turnDelta: Math.max(-1, Math.min(1, keyboard.turnDelta + motion.turnDelta)),
  };
}
