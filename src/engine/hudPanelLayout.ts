export type HudPanelCorner = 'bottom-left' | 'bottom-right' | 'top-right' | 'top-left';

export interface HudPanelPosition {
  x: number;
  y: number;
}

export const DEFAULT_HUD_PANEL_CORNER: HudPanelCorner = 'bottom-left';

export const HUD_PANEL_CORNER_ORDER: readonly HudPanelCorner[] = [
  'bottom-left',
  'bottom-right',
  'top-right',
  'top-left',
];

export const HUD_PANEL_CORNER_LABELS: Record<HudPanelCorner, string> = {
  'bottom-left': 'Inferior izquierda',
  'bottom-right': 'Inferior derecha',
  'top-right': 'Superior derecha',
  'top-left': 'Superior izquierda',
};

/**
 * Cycles the docked corner of the 3D labyrinth info panel in a predictable clockwise/counter-clockwise order.
 */
export function getNextHudPanelCorner(current: HudPanelCorner): HudPanelCorner {
  const idx = HUD_PANEL_CORNER_ORDER.indexOf(current);
  if (idx === -1) return DEFAULT_HUD_PANEL_CORNER;
  return HUD_PANEL_CORNER_ORDER[(idx + 1) % HUD_PANEL_CORNER_ORDER.length];
}

/**
 * Clamps free-dragged panel coordinates so the panel always stays reachable inside the 3D viewport.
 */
export function clampHudPanelPosition(
  x: number,
  y: number,
  panelWidth: number,
  panelHeight: number,
  containerWidth: number,
  containerHeight: number,
  margin = 8
): HudPanelPosition {
  const safeMargin = Math.max(0, margin);
  const maxX = Math.max(safeMargin, containerWidth - panelWidth - safeMargin);
  const maxY = Math.max(safeMargin, containerHeight - panelHeight - safeMargin);
  return {
    x: Math.round(Math.max(safeMargin, Math.min(maxX, x))),
    y: Math.round(Math.max(safeMargin, Math.min(maxY, y))),
  };
}

/**
 * Returns responsive Tailwind positioning classes for each docked corner so the panel
 * avoids overlapping top buttons, the top-right minimap, and the bottom-right control dock.
 */
export function getHudCornerPositionClass(corner: HudPanelCorner): string {
  switch (corner) {
    case 'bottom-left':
      return 'bottom-[92px] left-2.5 sm:bottom-3 sm:left-3';
    case 'bottom-right':
      return 'bottom-[92px] right-2.5 sm:bottom-16 sm:right-3';
    case 'top-right':
      return 'top-[136px] right-2.5 sm:top-[184px] sm:right-3';
    case 'top-left':
      return 'top-14 left-2.5 sm:top-14 sm:left-3';
  }
}
