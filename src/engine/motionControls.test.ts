import test from 'node:test';
import assert from 'node:assert/strict';
import {
  combineControlInputs,
  computeKeyboardControlInput,
  computeMotionControlInput,
  createMotionCalibration,
  normalizeDirectionKey,
} from './motionControls';

test('normalizeDirectionKey handles Arrow keys via code or key fallback and WASD/QE', () => {
  assert.equal(normalizeDirectionKey('ArrowUp'), 'ArrowUp');
  assert.equal(normalizeDirectionKey('ArrowDown'), 'ArrowDown');
  assert.equal(normalizeDirectionKey('ArrowLeft'), 'ArrowLeft');
  assert.equal(normalizeDirectionKey('ArrowRight'), 'ArrowRight');
  assert.equal(normalizeDirectionKey('', 'ArrowUp'), 'ArrowUp');
  assert.equal(normalizeDirectionKey('Unidentified', 'ArrowRight'), 'ArrowRight');
  assert.equal(normalizeDirectionKey('KeyW'), 'KeyW');
  assert.equal(normalizeDirectionKey('KeyH'), null);
});

test('desktop arrow keys move forward/back and turn left/right in 1st-person, and pan cardinally in aerial view', () => {
  const up = computeKeyboardControlInput(new Set(['ArrowUp']), 'first_person');
  assert.equal(up.moveForward, 1);
  assert.equal(up.turnDelta, 0);

  const down = computeKeyboardControlInput(new Set(['ArrowDown']), 'first_person');
  assert.equal(down.moveForward, -1);

  const leftFp = computeKeyboardControlInput(new Set(['ArrowLeft']), 'first_person');
  assert.equal(leftFp.turnDelta, 1);
  assert.equal(leftFp.moveRight, 0);

  const rightFp = computeKeyboardControlInput(new Set(['ArrowRight']), 'first_person');
  assert.equal(rightFp.turnDelta, -1);
  assert.equal(rightFp.moveRight, 0);

  const leftAerial = computeKeyboardControlInput(new Set(['ArrowLeft']), 'aerial');
  assert.equal(leftAerial.moveRight, -1);
  assert.equal(leftAerial.turnDelta, 0);

  const rightAerial = computeKeyboardControlInput(new Set(['ArrowRight']), 'aerial');
  assert.equal(rightAerial.moveRight, 1);
  assert.equal(rightAerial.turnDelta, 0);
});

test('mobile DeviceOrientation motion sensor ignores micro-tremors inside deadzone and responds smoothly to tilt', () => {
  const cal = createMotionCalibration(45, 0);

  // Within deadzone -> zero drift
  const steady = computeMotionControlInput({ beta: 48, gamma: 3 }, cal, 'first_person', 0);
  assert.equal(steady.moveForward, 0);
  assert.equal(steady.turnDelta, 0);

  // Tilt phone forward (beta drops from 45 -> 20) => move forward
  const tiltFwd = computeMotionControlInput({ beta: 20, gamma: 0 }, cal, 'first_person', 0);
  assert.ok(tiltFwd.moveForward > 0.8, `Expected forward tilt > 0.8, got ${tiltFwd.moveForward}`);

  // Tilt phone backward (beta rises from 45 -> 70) => move backward
  const tiltBack = computeMotionControlInput({ beta: 70, gamma: 0 }, cal, 'first_person', 0);
  assert.ok(tiltBack.moveForward < -0.8, `Expected backward tilt < -0.8, got ${tiltBack.moveForward}`);

  // Tilt phone left (gamma = -20) => turn left (turnDelta > 0) in 1st-person
  const tiltLeft = computeMotionControlInput({ beta: 45, gamma: -20 }, cal, 'first_person', 0);
  assert.ok(tiltLeft.turnDelta > 0.5, `Expected left tilt turnDelta > 0.5, got ${tiltLeft.turnDelta}`);

  // Tilt phone right (gamma = +20) => turn right (turnDelta < 0) in 1st-person
  const tiltRight = computeMotionControlInput({ beta: 45, gamma: 20 }, cal, 'first_person', 0);
  assert.ok(tiltRight.turnDelta < -0.5, `Expected right tilt turnDelta < -0.5, got ${tiltRight.turnDelta}`);

  // Landscape orientation (90 deg) remaps axes properly
  const landscapeLeft = computeMotionControlInput({ beta: 25, gamma: 0 }, cal, 'first_person', 90);
  assert.ok(landscapeLeft.turnDelta > 0.5);

  // Null orientation safely yields zeros
  const empty = computeMotionControlInput({ beta: null, gamma: null }, cal, 'first_person', 0);
  assert.deepEqual(empty, { moveForward: 0, moveRight: 0, turnDelta: 0 });
});

test('combineControlInputs merges keyboard and motion axes safely within [-1, 1]', () => {
  const merged = combineControlInputs(
    { moveForward: 1, moveRight: 0, turnDelta: -1 },
    { moveForward: 0.7, moveRight: -0.4, turnDelta: -0.6 }
  );
  assert.equal(merged.moveForward, 1);
  assert.equal(merged.moveRight, -0.4);
  assert.equal(merged.turnDelta, -1);
});
