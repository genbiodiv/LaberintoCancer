import test from 'node:test';
import assert from 'node:assert/strict';
import {
  clampHudPanelPosition,
  DEFAULT_HUD_PANEL_CORNER,
  getHudCornerPositionClass,
  getNextHudPanelCorner,
  HUD_PANEL_CORNER_ORDER,
  HudPanelCorner,
} from './hudPanelLayout';

test('HUD info panel defaults to bottom-left and cycles cleanly through all four corners', () => {
  assert.equal(DEFAULT_HUD_PANEL_CORNER, 'bottom-left');

  let current: HudPanelCorner = DEFAULT_HUD_PANEL_CORNER;
  const visited: string[] = [current];
  for (let i = 0; i < HUD_PANEL_CORNER_ORDER.length; i += 1) {
    current = getNextHudPanelCorner(current);
    visited.push(current);
  }
  assert.deepEqual(visited, [
    'bottom-left',
    'bottom-right',
    'top-right',
    'top-left',
    'bottom-left',
  ]);

  for (const corner of HUD_PANEL_CORNER_ORDER) {
    assert.ok(getHudCornerPositionClass(corner).length > 0);
  }
});

test('clampHudPanelPosition keeps dragged panel strictly inside viewport bounds', () => {
  const clampedNegative = clampHudPanelPosition(-120, -40, 260, 140, 1280, 720, 8);
  assert.deepEqual(clampedNegative, { x: 8, y: 8 });

  const clampedOverflow = clampHudPanelPosition(2000, 1500, 260, 140, 1280, 720, 8);
  assert.deepEqual(clampedOverflow, { x: 1012, y: 572 });

  const inBounds = clampHudPanelPosition(320, 210, 260, 140, 1280, 720, 8);
  assert.deepEqual(inBounds, { x: 320, y: 210 });

  // Narrow mobile viewport smaller than panel width gracefully anchors to margin
  const narrow = clampHudPanelPosition(100, 50, 400, 180, 360, 640, 8);
  assert.equal(narrow.x, 8);
  assert.equal(narrow.y, 50);
});
