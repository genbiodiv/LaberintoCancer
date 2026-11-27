import { isPointInsideWalkable, WalkableBox } from './labyrinthLayout';
import { LabyrinthCameraMode } from './motionControls';

export const CAMERA_MODE_ORDER: readonly LabyrinthCameraMode[] = [
  'third_person',
  'first_person',
  'aerial',
];

export function cycleLabyrinthCameraMode(current: LabyrinthCameraMode): LabyrinthCameraMode {
  const idx = CAMERA_MODE_ORDER.indexOf(current);
  if (idx < 0) return 'third_person';
  return CAMERA_MODE_ORDER[(idx + 1) % CAMERA_MODE_ORDER.length];
}

export function getCameraModeLabel(mode: LabyrinthCameraMode): string {
  switch (mode) {
    case 'third_person':
      return '3ª Pers.';
    case 'first_person':
      return '1ª Pers.';
    case 'aerial':
      return 'Aérea';
  }
}

export interface WalkingCameraMotion {
  /** Vertical bob offset in meters */
  bobY: number;
  /** Lateral figure-8 stride sway offset along camera-right axis in meters */
  swayX: number;
  /** Subtle banking / stride roll angle in radians */
  rollZ: number;
  /** Subtle pitch nod on footfalls in meters at look target */
  pitchBob: number;
}

/**
 * Pure walking camera dynamics producing organic, comfortable head-bob,
 * lateral figure-8 stride sway, and turn banking across 1st- and 3rd-person views.
 */
export function computeWalkingCameraMotion(
  bobPhase: number,
  walkIntensity: number,
  turnRate: number,
  elapsed: number,
  cameraMode: LabyrinthCameraMode
): WalkingCameraMotion {
  if (cameraMode === 'aerial') {
    return { bobY: 0, swayX: 0, rollZ: 0, pitchBob: 0 };
  }

  const w = Math.max(0, Math.min(1, Number.isFinite(walkIntensity) ? walkIntensity : 0));
  const safeTurn = Math.max(-1, Math.min(1, Number.isFinite(turnRate) ? turnRate : 0));

  // Gentle organic breathing when stationary, scaling into clear footsteps while moving
  const idleBreath = Math.sin(elapsed * 1.55) * (cameraMode === 'first_person' ? 0.015 : 0.01);

  if (cameraMode === 'first_person') {
    const bobY = Math.sin(bobPhase * 2) * 0.115 * w + idleBreath;
    const swayX = Math.cos(bobPhase) * 0.068 * w;
    const rollZ = -Math.cos(bobPhase) * 0.018 * w - safeTurn * 0.026;
    const pitchBob = Math.sin(bobPhase * 2 - 0.35) * 0.045 * w;
    return { bobY, swayX, rollZ, pitchBob };
  }

  // Third-person trailing camera: lively stride bob + turn lean without obscuring avatar
  const bobY = Math.sin(bobPhase * 2) * 0.072 * w + idleBreath;
  const swayX = Math.cos(bobPhase) * 0.046 * w;
  const rollZ = -Math.cos(bobPhase) * 0.011 * w - safeTurn * 0.02;
  const pitchBob = Math.sin(bobPhase * 2 - 0.3) * 0.026 * w;
  return { bobY, swayX, rollZ, pitchBob };
}

export interface ThirdPersonCameraRigPose {
  camX: number;
  camY: number;
  camZ: number;
  lookX: number;
  lookY: number;
  lookZ: number;
  actualFollowDistance: number;
}

/**
 * Computes a wall-safe third-person over-the-shoulder camera pose trailing the player avatar.
 * Marches backward from the player along the reverse heading vector and clamps safely inside
 * walkableBoxes so the camera never clips behind labyrinth walls.
 */
export function computeThirdPersonCameraPose(
  playerX: number,
  playerZ: number,
  yaw: number,
  zoom: number,
  walkableBoxes: WalkableBox[],
  motion: WalkingCameraMotion
): ThirdPersonCameraRigPose {
  const safeZoom = Math.max(0.6, Math.min(2.0, Number.isFinite(zoom) ? zoom : 1.0));
  const desiredDistance = Math.max(2.3, Math.min(4.8, 3.65 / Math.pow(safeZoom, 0.55)));
  const minDistance = 1.25;
  const cameraWallMargin = 0.42;

  const fwdX = -Math.sin(yaw);
  const fwdZ = -Math.cos(yaw);
  const rightX = Math.cos(yaw);
  const rightZ = -Math.sin(yaw);

  // March along the reverse heading ray in small steps to stop cleanly before any wall
  let safeDist = minDistance;
  const steps = 14;
  for (let i = 1; i <= steps; i++) {
    const d = (desiredDistance * i) / steps;
    const testX = playerX - fwdX * d;
    const testZ = playerZ - fwdZ * d;
    if (isPointInsideWalkable(testX, testZ, walkableBoxes, cameraWallMargin)) {
      safeDist = d;
    } else {
      break;
    }
  }

  const camX = playerX - fwdX * safeDist + rightX * motion.swayX;
  const camZ = playerZ - fwdZ * safeDist + rightZ * motion.swayX;
  // Slightly elevate camera as distance grows so both the full avatar and overhead door signs stay cleanly framed
  const camY = 2.02 + (safeDist - minDistance) * 0.1 + motion.bobY;

  const lookDist = 5.6;
  const lookX = playerX + fwdX * lookDist + rightX * (motion.swayX * 0.35);
  const lookY = 1.38 + motion.pitchBob;
  const lookZ = playerZ + fwdZ * lookDist + rightZ * (motion.swayX * 0.35);

  return {
    camX,
    camY,
    camZ,
    lookX,
    lookY,
    lookZ,
    actualFollowDistance: Number(safeDist.toFixed(3)),
  };
}
