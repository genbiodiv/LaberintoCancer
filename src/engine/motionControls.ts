export type LabyrinthCameraMode = 'first_person' | 'aerial';

export interface MotionCalibration {
  beta: number; // front-to-back tilt baseline (deg)
  gamma: number; // left-to-right tilt baseline (deg)
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

  if (cameraMode === 'first_person') {
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

/**
 * Maps mobile DeviceOrientationEvent tilt angles (beta/gamma) relative to the calibrated
 * resting posture into smooth labyrinth movement and turning axes.
 * Handles portrait (0°), landscape-left (90°), and landscape-right (-90° / 270°).
 */
export function computeMotionControlInput(
  orientation: { beta: number | null | undefined; gamma: number | null | undefined },
  calibration: MotionCalibration,
  cameraMode: LabyrinthCameraMode,
  screenAngleDeg = 0
): ControlAxisInput {
  if (
    typeof orientation.beta !== 'number' ||
    !Number.isFinite(orientation.beta) ||
    typeof orientation.gamma !== 'number' ||
    !Number.isFinite(orientation.gamma)
  ) {
    return { moveForward: 0, moveRight: 0, turnDelta: 0 };
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

  const forwardAxis = applyDeadzoneCurve(
    pitchDelta,
    MOTION_PITCH_DEADZONE_DEG,
    MOTION_PITCH_MAX_DEG
  );
  const lateralAxis = applyDeadzoneCurve(
    rollDelta,
    MOTION_ROLL_DEADZONE_DEG,
    MOTION_ROLL_MAX_DEG
  );

  if (cameraMode === 'first_person') {
    // Tilt left (lateralAxis < 0) => turn left (turnDelta > 0); tilt right => turn right (turnDelta < 0)
    return {
      moveForward: forwardAxis,
      moveRight: 0,
      turnDelta: lateralAxis === 0 ? 0 : -lateralAxis,
    };
  }

  // Aerial map view: tilt forward/back moves north/south, tilt left/right moves west/east
  return {
    moveForward: forwardAxis,
    moveRight: lateralAxis,
    turnDelta: 0,
  };
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
