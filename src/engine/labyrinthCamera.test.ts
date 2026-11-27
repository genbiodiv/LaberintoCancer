import assert from 'node:assert/strict';
import test from 'node:test';
import {
  CAMERA_MODE_ORDER,
  computeThirdPersonCameraPose,
  computeWalkingCameraMotion,
  cycleLabyrinthCameraMode,
  getCameraModeLabel,
} from './labyrinthCamera';
import { buildLabyrinthLayout, isPointInsideWalkable } from './labyrinthLayout';
import {
  computeKeyboardControlInput,
  computeMotionControlInput,
  createMotionCalibration,
  DEFAULT_MOTION_SENSOR_SETTINGS,
} from './motionControls';
import { getActiveRoundOffer } from './progressionEngine';
import { createInitialSimulation, resolveCancerTurn } from './simulator';

test('cycleLabyrinthCameraMode cycles cleanly through 3rd person, 1st person, and aerial', () => {
  assert.deepEqual(CAMERA_MODE_ORDER, ['third_person', 'first_person', 'aerial']);
  assert.equal(cycleLabyrinthCameraMode('third_person'), 'first_person');
  assert.equal(cycleLabyrinthCameraMode('first_person'), 'aerial');
  assert.equal(cycleLabyrinthCameraMode('aerial'), 'third_person');
  assert.equal(getCameraModeLabel('third_person'), '3ª Pers.');
  assert.equal(getCameraModeLabel('first_person'), '1ª Pers.');
  assert.equal(getCameraModeLabel('aerial'), 'Aérea');
});

test('computeWalkingCameraMotion produces distinct gait motion while walking and zero in aerial mode', () => {
  const aerial = computeWalkingCameraMotion(2.4, 1.0, 0.5, 4.0, 'aerial');
  assert.equal(aerial.bobY, 0);
  assert.equal(aerial.swayX, 0);
  assert.equal(aerial.rollZ, 0);
  assert.equal(aerial.pitchBob, 0);

  const fpWalk = computeWalkingCameraMotion(0.85, 1.0, 0.3, 1.2, 'first_person');
  const tpWalk = computeWalkingCameraMotion(0.85, 1.0, 0.3, 1.2, 'third_person');
  assert.ok(Math.abs(fpWalk.bobY) > 0.01, 'first-person walking should produce vertical head-bob');
  assert.ok(Math.abs(fpWalk.swayX) > 0.005, 'first-person walking should produce lateral sway');
  assert.ok(Math.abs(tpWalk.bobY) > 0.005, 'third-person walking should produce subtle vertical follow bob');
  assert.ok(Math.abs(tpWalk.rollZ) > 0.001, 'third-person walking should produce subtle roll sway');

  const idle = computeWalkingCameraMotion(0, 0, 0, 0.7, 'third_person');
  assert.equal(idle.swayX, 0, 'idle camera should not sway laterally');
  assert.ok(Math.abs(idle.bobY) < 0.015, 'idle breathing motion should remain subtle');
});

test('computeThirdPersonCameraPose remains inside walkable bounds at spawn and against back wall', () => {
  const state = createInitialSimulation('cancer', 'UNIFIED', '', 'quick', undefined, 3, undefined, false);
  const layout = buildLabyrinthLayout(state, 'simple');
  const zeroMotion = { bobY: 0, swayX: 0, rollZ: 0, pitchBob: 0 };

  // Default Round 1 spawn facing north (-Z)
  const spawnPose = computeThirdPersonCameraPose(
    layout.spawn.x,
    layout.spawn.z,
    layout.spawn.yaw,
    1.0,
    layout.walkableBoxes,
    zeroMotion
  );
  assert.ok(spawnPose.camZ > layout.spawn.z + 2.0, 'camera should trail comfortably behind player at spawn');
  assert.ok(
    isPointInsideWalkable(spawnPose.camX, spawnPose.camZ, layout.walkableBoxes, 0.2),
    'camera at Round 1 spawn must stay inside walkable corridor without clipping back wall'
  );

  // Backed right against the south entry wall
  const tightPose = computeThirdPersonCameraPose(
    0,
    11.4,
    0,
    1.0,
    layout.walkableBoxes,
    zeroMotion
  );
  assert.ok(
    isPointInsideWalkable(tightPose.camX, tightPose.camZ, layout.walkableBoxes, 0.25),
    'camera backed against south wall must pull forward to stay inside walkable bounds'
  );
});

test('finished labyrinth layout preserves full walkthrough path and spawns summary beacon', () => {
  let state = createInitialSimulation('cancer', 'UNIFIED', '', 'quick', undefined, 3, undefined, false);
  // Complete all rounds so simulation finishes
  for (let i = 0; i < state.maxRounds; i++) {
    const offer = getActiveRoundOffer(state);
    const firstStrategy = offer.cancerStrategies[0];
    assert.ok(firstStrategy, 'expected active decision strategy');
    state = resolveCancerTurn(state, firstStrategy.id, 'growth_spike').nextState;
  }

  assert.equal(state.finished, true);
  const layout = buildLabyrinthLayout(state, 'simple');
  assert.ok(layout.summaryBeacon !== null, 'finished labyrinth must include an in-world summary beacon');
  assert.equal(
    layout.portals.filter((p) => p.status === 'active').length,
    0,
    'finished labyrinth should have no active decision portals'
  );
  assert.ok(
    layout.chambers.some((c) => c.roundNumber === 1),
    'finished labyrinth should keep Round 1 chamber walkable for full path review'
  );
  assert.ok(
    isPointInsideWalkable(
      layout.summaryBeacon.x,
      layout.summaryBeacon.z,
      layout.walkableBoxes,
      0.3
    ),
    'summary beacon must sit inside walkable chamber floor'
  );
});

test('third_person mode uses yaw-relative keyboard and motion controls', () => {
  const pressed = new Set<string>(['KeyW', 'ArrowLeft']);
  const kb = computeKeyboardControlInput(pressed, 'third_person');
  assert.equal(kb.moveForward, 1, 'KeyW in 3rd person should move forward');
  assert.equal(kb.turnDelta, 1, 'ArrowLeft in 3rd person should turn left rather than strafe');
  assert.equal(kb.moveRight, 0);

  const calibration = createMotionCalibration(45, 0);
  const motion = computeMotionControlInput(
    { beta: 30, gamma: 0 },
    calibration,
    'third_person',
    0,
    DEFAULT_MOTION_SENSOR_SETTINGS
  );
  assert.ok(motion.moveForward > 0.1, 'forward tilt in 3rd person should produce forward movement');
});
