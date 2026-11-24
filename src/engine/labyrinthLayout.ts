import { DIAGNOSTIC_TOOLS, THERAPIES_CATALOG } from './knowledgeBase';
import {
  formatBiologyText,
  getCancerDoorShortLabel,
  getTherapyDisplayName,
  getTherapyDisplayShort,
} from './molecularAbstraction';
import { getActiveRoundOffer, getOncologistRoundPhase } from './progressionEngine';
import { DiagnosticToolId, MolecularDetailMode, SimulationState, TherapyId } from './types';

export interface WalkableBox {
  id: string;
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

export interface LabyrinthPortal {
  id: string;
  actionId: string; // strategyId in cancer mode, diagnosticToolId or therapyId in oncologist mode
  portalKind?: 'cancer' | 'diagnostic' | 'intervention';
  label: string;
  fullTitle: string;
  sublabel: string;
  x: number;
  z: number;
  yaw: number;
  accentHex: number;
  accentCss: string;
  roundNumber: number;
  status: 'active' | 'chosen' | 'sealed';
  branchIndex: number; // -1 left, 0 center, +1 right
}

export interface LabyrinthChamber {
  roundNumber: number;
  title: string;
  centerX: number;
  centerZ: number;
  width: number;
  depth: number;
  isCurrent: boolean;
  chosenActionLabel?: string;
}

export interface LabyrinthWallSegment {
  x: number;
  z: number;
  width: number;
  depth: number;
  height: number;
  isPillar?: boolean;
}

export interface LabyrinthDiagnosticStation {
  id: string;
  toolId: 'imaging' | 'biopsy' | 'molecular_profile' | 'biomarkers';
  label: string;
  x: number;
  z: number;
  completed: boolean;
}

export interface LabyrinthLayout {
  chambers: LabyrinthChamber[];
  portals: LabyrinthPortal[];
  walkableBoxes: WalkableBox[];
  walls: LabyrinthWallSegment[];
  diagnosticStations: LabyrinthDiagnosticStation[];
  spawn: { x: number; z: number; yaw: number };
  currentChamberCenter: { x: number; z: number };
  bounds: { minX: number; maxX: number; minZ: number; maxZ: number };
}

export const CHAMBER_SPACING_Z = 22;
export const CHAMBER_WIDTH = 14;
export const CHAMBER_DEPTH = 12;
export const CORRIDOR_WIDTH = 5.2;
export const WALL_HEIGHT = 4.2;
export const WALL_THICKNESS = 0.9;
export const PLAYER_RADIUS = 0.65;

/**
 * Returns the 3 randomized, clinically meaningful forking therapies offered for the active chamber.
 */
export function getOncologistForkTherapies(state: SimulationState): TherapyId[] {
  return getActiveRoundOffer(state).oncologistDoorTherapies;
}

/**
 * Pure generator that builds the 3D "Labyrinth of Forking Paths" directly from
 * the unified progressive SimulationState and its per-round randomized RoundOffers.
 */
export function buildLabyrinthLayout(
  state: SimulationState,
  detail: MolecularDetailMode = 'precision'
): LabyrinthLayout {
  const chambers: LabyrinthChamber[] = [];
  const portals: LabyrinthPortal[] = [];
  const walkableBoxes: WalkableBox[] = [];
  const walls: LabyrinthWallSegment[] = [];
  const diagnosticStations: LabyrinthDiagnosticStation[] = [];

  const endRound = state.unlimitedMode
    ? Math.max(1, state.currentRound)
    : Math.min(state.currentRound, state.maxRounds);
  const startRound = state.unlimitedMode ? Math.max(1, endRound - 5) : 1;

  let currentX = 0;
  let currentZ = 0;

  // Entry corridor leading into first rendered chamber (guarantees wide open spawn facing forward -Z)
  walkableBoxes.push({
    id: 'entry-corridor',
    minX: -CORRIDOR_WIDTH / 2,
    maxX: CORRIDOR_WIDTH / 2,
    minZ: -CHAMBER_DEPTH / 2,
    maxZ: 10.5,
  });

  // Entry corridor left/right/back walls
  walls.push(
    { x: -CORRIDOR_WIDTH / 2 - WALL_THICKNESS / 2, z: 7.5, width: WALL_THICKNESS, depth: 6.5, height: WALL_HEIGHT },
    { x: CORRIDOR_WIDTH / 2 + WALL_THICKNESS / 2, z: 7.5, width: WALL_THICKNESS, depth: 6.5, height: WALL_HEIGHT },
    { x: 0, z: 10.9, width: CORRIDOR_WIDTH + WALL_THICKNESS * 2, depth: WALL_THICKNESS, height: WALL_HEIGHT }
  );

  for (let r = startRound; r <= endRound; r++) {
    const roundDef =
      state.roundOffers?.[r] ?? getActiveRoundOffer({ ...state, currentRound: r });
    const historyEntry = state.history[r - 1];
    const isCurrent = r === state.currentRound && !state.finished;

    chambers.push({
      roundNumber: r,
      title: roundDef?.title ?? `Ronda ${r}`,
      centerX: currentX,
      centerZ: currentZ,
      width: CHAMBER_WIDTH,
      depth: CHAMBER_DEPTH,
      isCurrent,
      chosenActionLabel: historyEntry?.actionTakenLabel,
    });

    // Main chamber floor walkable box
    walkableBoxes.push({
      id: `chamber-${r}`,
      minX: currentX - CHAMBER_WIDTH / 2 + 0.5,
      maxX: currentX + CHAMBER_WIDTH / 2 - 0.5,
      minZ: currentZ - CHAMBER_DEPTH / 2 + 0.5,
      maxZ: currentZ + CHAMBER_DEPTH / 2 - 0.5,
    });

    // Side walls of the chamber with corner pilasters
    walls.push(
      {
        x: currentX - CHAMBER_WIDTH / 2 - WALL_THICKNESS / 2,
        z: currentZ,
        width: WALL_THICKNESS,
        depth: CHAMBER_DEPTH + WALL_THICKNESS,
        height: WALL_HEIGHT,
      },
      {
        x: currentX + CHAMBER_WIDTH / 2 + WALL_THICKNESS / 2,
        z: currentZ,
        width: WALL_THICKNESS,
        depth: CHAMBER_DEPTH + WALL_THICKNESS,
        height: WALL_HEIGHT,
      },
      // South shoulders framing the incoming corridor
      {
        x: currentX - (CHAMBER_WIDTH / 4 + CORRIDOR_WIDTH / 4),
        z: currentZ + CHAMBER_DEPTH / 2 + WALL_THICKNESS / 2,
        width: (CHAMBER_WIDTH - CORRIDOR_WIDTH) / 2,
        depth: WALL_THICKNESS,
        height: WALL_HEIGHT,
      },
      {
        x: currentX + (CHAMBER_WIDTH / 4 + CORRIDOR_WIDTH / 4),
        z: currentZ + CHAMBER_DEPTH / 2 + WALL_THICKNESS / 2,
        width: (CHAMBER_WIDTH - CORRIDOR_WIDTH) / 2,
        depth: WALL_THICKNESS,
        height: WALL_HEIGHT,
      }
    );

    // 4 architectural corner pilasters tucked flush into corners so outer door signs stay 100% unobstructed
    const colOffsets = [
      [-CHAMBER_WIDTH / 2 + 0.48, -CHAMBER_DEPTH / 2 + 0.48],
      [CHAMBER_WIDTH / 2 - 0.48, -CHAMBER_DEPTH / 2 + 0.48],
      [-CHAMBER_WIDTH / 2 + 0.48, CHAMBER_DEPTH / 2 - 0.48],
      [CHAMBER_WIDTH / 2 - 0.48, CHAMBER_DEPTH / 2 - 0.48],
    ];
    for (const [ox, oz] of colOffsets) {
      walls.push({
        x: currentX + ox,
        z: currentZ + oz,
        width: 0.85,
        depth: 0.85,
        height: WALL_HEIGHT + 0.1,
        isPillar: true,
      });
    }

    // Build branch options for this round
    const oncoPhase = roundDef.oncologistPhase ?? getOncologistRoundPhase(r);
    const diagDoorMeta: Record<
      DiagnosticToolId,
      { labelLogic: string; labelPrecision: string; sublabel: string }
    > = {
      imaging: {
        labelLogic: 'Imágenes',
        labelPrecision: 'Imágenes',
        sublabel: 'Extensión y carga',
      },
      biopsy: {
        labelLogic: 'Biopsia',
        labelPrecision: 'Biopsia',
        sublabel: 'Ciclo y apoptosis',
      },
      molecular_profile: {
        labelLogic: 'Perfil funcional',
        labelPrecision: 'Perfil NGS',
        sublabel: 'Impulsores y clones',
      },
      biomarkers: {
        labelLogic: 'Biomarcadores',
        labelPrecision: 'Biomarcadores',
        sublabel: 'Inmune y vascular',
      },
      response_monitoring: {
        labelLogic: 'Seguimiento',
        labelPrecision: 'Seguimiento',
        sublabel: 'Clones activos',
      },
    };

    const branches: {
      actionId: string;
      portalKind: 'cancer' | 'diagnostic' | 'intervention';
      rawLabel: string;
      label: string;
      fullTitle: string;
      sublabel: string;
      accentHex: number;
      accentCss: string;
    }[] =
      state.mode === 'cancer'
        ? (roundDef?.cancerStrategies ?? []).slice(0, 3).map((s, idx) => {
            const clone = state.clones.find((c) => c.id === s.cloneId);
            const palette = [
              { hex: 0xe11d48, css: '#e11d48' },
              { hex: 0xd97706, css: '#d97706' },
              { hex: 0x0284c7, css: '#0284c7' },
            ][idx % 3];
            const shortLabel =
              detail === 'precision'
                ? s.shortDoorPrecision ?? getCancerDoorShortLabel(s.id, s.label, detail)
                : s.shortDoorLogic ?? getCancerDoorShortLabel(s.id, s.label, detail);
            const fullTitle = formatBiologyText(s.label, detail);
            const cloneTag = clone
              ? detail === 'precision'
                ? s.problemMutation
                  ? `${s.problemMutation.precisionLabel} · ${clone.share}%`
                  : `${clone.shortTag} · ${clone.share}%`
                : `Clon ${idx + 1} · ${clone.share}%`
              : s.originNote;
            return {
              actionId: s.id,
              portalKind: 'cancer',
              rawLabel: s.label,
              label: shortLabel,
              fullTitle,
              sublabel: cloneTag,
              accentHex: palette.hex,
              accentCss: palette.css,
            };
          })
        : oncoPhase === 'diagnostic'
          ? (roundDef.oncologistDoorDiagnostics ?? ['imaging', 'biopsy', 'molecular_profile']).map(
              (toolId, idx) => {
                const tool = DIAGNOSTIC_TOOLS.find((t) => t.id === toolId) ?? DIAGNOSTIC_TOOLS[0];
                const meta = diagDoorMeta[tool.id];
                const palette = [
                  { hex: 0x06b6d4, css: '#06b6d4' },
                  { hex: 0x0284c7, css: '#0284c7' },
                  { hex: 0x6366f1, css: '#6366f1' },
                ][idx % 3];
                return {
                  actionId: tool.id,
                  portalKind: 'diagnostic',
                  rawLabel: tool.name,
                  label: detail === 'precision' ? meta.labelPrecision : meta.labelLogic,
                  fullTitle: formatBiologyText(tool.name, detail),
                  sublabel: meta.sublabel,
                  accentHex: palette.hex,
                  accentCss: palette.css,
                };
              }
            )
          : roundDef.oncologistDoorTherapies.map((tid, idx) => {
              const rule = THERAPIES_CATALOG.find((t) => t.id === tid)!;
              const palette = [
                { hex: 0x0284c7, css: '#0284c7' },
                { hex: 0x059669, css: '#059669' },
                { hex: 0xd97706, css: '#d97706' },
              ][idx % 3];
              return {
                actionId: rule.id,
                portalKind: 'intervention',
                rawLabel: rule.shortName,
                label: getTherapyDisplayShort(rule, detail),
                fullTitle: getTherapyDisplayName(rule, detail),
                sublabel: `Tox ${rule.toxicityDelta >= 0 ? '+' : ''}${rule.toxicityDelta}`,
                accentHex: palette.hex,
                accentCss: palette.css,
              };
            });

    // Place forking portals along the northern (-Z) edge of the chamber
    const count = branches.length;
    const xOffsets =
      count === 2 ? [-3.4, 3.4] : count === 1 ? [0] : [-4.4, 0, 4.4];

    let chosenBranchOffsetX = 0;

    const wasObservedRound = historyEntry?.actionKind === 'observation';

    branches.forEach((branch, idx) => {
      const bx = currentX + xOffsets[idx];
      const bz = currentZ - CHAMBER_DEPTH / 2 + 0.6;
      const isChosen = Boolean(
        historyEntry &&
          !wasObservedRound &&
          (historyEntry.actionTakenLabel === branch.rawLabel ||
            historyEntry.actionTakenLabel.toLowerCase().includes(branch.rawLabel.toLowerCase()))
      );
      const status: LabyrinthPortal['status'] = isCurrent
        ? 'active'
        : isChosen || (wasObservedRound && idx === Math.floor(count / 2)) || (!historyEntry && idx === 0)
          ? 'chosen'
          : 'sealed';

      if (status === 'chosen') {
        chosenBranchOffsetX = xOffsets[idx];
      }

      portals.push({
        id: `portal-r${r}-${branch.actionId}`,
        actionId: branch.actionId,
        portalKind: branch.portalKind,
        label: branch.label,
        fullTitle: branch.fullTitle,
        sublabel: branch.sublabel,
        x: bx,
        z: bz,
        yaw: 0,
        accentHex: branch.accentHex,
        accentCss: branch.accentCss,
        roundNumber: r,
        status,
        branchIndex: count === 2 ? (idx === 0 ? -1 : 1) : idx - 1,
      });

      // Short alcove ahead of each portal so forks visually diverge into corridors
      if (isCurrent || status === 'sealed') {
        walkableBoxes.push({
          id: `alcove-r${r}-${idx}`,
          minX: bx - 1.6,
          maxX: bx + 1.6,
          minZ: bz - 2.2,
          maxZ: bz + 1.2,
        });
        // Dead-end seal wall behind alcove
        walls.push({
          x: bx,
          z: bz - 2.6,
          width: 3.6,
          depth: WALL_THICKNESS,
          height: WALL_HEIGHT,
        });
      }
    });

    // If this round is already completed and there's a next chamber, build a connecting corridor
    if (r < endRound) {
      const nextX = currentX + chosenBranchOffsetX * 0.65;
      const nextZ = currentZ - CHAMBER_SPACING_Z;

      const corrMinX = Math.min(currentX + chosenBranchOffsetX, nextX) - CORRIDOR_WIDTH / 2;
      const corrMaxX = Math.max(currentX + chosenBranchOffsetX, nextX) + CORRIDOR_WIDTH / 2;
      walkableBoxes.push({
        id: `corridor-${r}-to-${r + 1}`,
        minX: corrMinX,
        maxX: corrMaxX,
        minZ: nextZ + CHAMBER_DEPTH / 2 - 2.4,
        maxZ: currentZ - CHAMBER_DEPTH / 2 + 2.4,
      });

      const midX = (currentX + chosenBranchOffsetX + nextX) / 2;
      const midZ = (currentZ - CHAMBER_DEPTH / 2 + (nextZ + CHAMBER_DEPTH / 2)) / 2;
      const corrLen = Math.abs(currentZ - CHAMBER_DEPTH / 2 - (nextZ + CHAMBER_DEPTH / 2)) + 1;
      walls.push(
        {
          x: midX - CORRIDOR_WIDTH / 2 - WALL_THICKNESS / 2,
          z: midZ,
          width: WALL_THICKNESS,
          depth: corrLen,
          height: WALL_HEIGHT,
        },
        {
          x: midX + CORRIDOR_WIDTH / 2 + WALL_THICKNESS / 2,
          z: midZ,
          width: WALL_THICKNESS,
          depth: corrLen,
          height: WALL_HEIGHT,
        }
      );

      currentX = nextX;
      currentZ = nextZ;
    } else {
      // Back north wall behind current chamber's active portals
      walls.push({
        x: currentX,
        z: currentZ - CHAMBER_DEPTH / 2 - 3.0,
        width: CHAMBER_WIDTH + 2,
        depth: WALL_THICKNESS,
        height: WALL_HEIGHT,
      });
    }
  }

  // Spawn inside the current chamber's south approach facing straight north (-Z, yaw = 0)
  // directly toward the illuminated forking portals!
  const activeChamber = chambers[chambers.length - 1];
  const spawn = {
    x: activeChamber.centerX,
    z: activeChamber.centerZ + (activeChamber.roundNumber === 1 ? CHAMBER_DEPTH / 2 + 2.2 : CHAMBER_DEPTH / 2 - 2.0),
    yaw: 0, // looking along -Z toward the forking archways
  };

  let minX = Infinity;
  let maxX = -Infinity;
  let minZ = Infinity;
  let maxZ = -Infinity;
  for (const box of walkableBoxes) {
    if (box.minX < minX) minX = box.minX;
    if (box.maxX > maxX) maxX = box.maxX;
    if (box.minZ < minZ) minZ = box.minZ;
    if (box.maxZ > maxZ) maxZ = box.maxZ;
  }

  return {
    chambers,
    portals,
    walkableBoxes,
    walls,
    diagnosticStations,
    spawn,
    currentChamberCenter: { x: activeChamber.centerX, z: activeChamber.centerZ },
    bounds: {
      minX: minX - 3,
      maxX: maxX + 3,
      minZ: minZ - 4,
      maxZ: maxZ + 4,
    },
  };
}

export function isPointInsideWalkable(
  x: number,
  z: number,
  boxes: WalkableBox[],
  radius = PLAYER_RADIUS
): boolean {
  for (const b of boxes) {
    if (
      x >= b.minX + radius &&
      x <= b.maxX - radius &&
      z >= b.minZ + radius &&
      z <= b.maxZ - radius
    ) {
      return true;
    }
  }
  return false;
}

/**
 * Resolves 2D player movement with smooth axis-sliding along corridor walls.
 */
export function resolvePlayerMovement(
  currentX: number,
  currentZ: number,
  dx: number,
  dz: number,
  boxes: WalkableBox[]
): { x: number; z: number } {
  const tryX = currentX + dx;
  const tryZ = currentZ + dz;

  if (isPointInsideWalkable(tryX, tryZ, boxes)) {
    return { x: tryX, z: tryZ };
  }
  if (isPointInsideWalkable(tryX, currentZ, boxes)) {
    return { x: tryX, z: currentZ };
  }
  if (isPointInsideWalkable(currentX, tryZ, boxes)) {
    return { x: currentX, z: tryZ };
  }
  return { x: currentX, z: currentZ };
}

/**
 * Finds the nearest active forking portal within trigger distance.
 */
export function findNearbyActivePortal(
  x: number,
  z: number,
  portals: LabyrinthPortal[],
  triggerRadius = 2.4
): LabyrinthPortal | null {
  let best: LabyrinthPortal | null = null;
  let bestDistSq = triggerRadius * triggerRadius;
  for (const p of portals) {
    if (p.status !== 'active') continue;
    const dx = p.x - x;
    const dz = p.z - z;
    const d2 = dx * dx + dz * dz;
    if (d2 <= bestDistSq) {
      bestDistSq = d2;
      best = p;
    }
  }
  return best;
}
