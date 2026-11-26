import { SCENARIOS } from './scenarios';
import {
  CompletedRunSummary,
  GameMode,
  MolecularDetailMode,
  ScenarioId,
  SimulationState,
} from './types';
import { formatBiologyText, getScenarioDisplayInfo } from './molecularAbstraction';

export interface DestinationStatus {
  role: GameMode;
  progress: number; // 0..100
  stage: 0 | 1 | 2 | 3;
  stageLabel: string;
  destinationTitle: string;
  destinationSubtitle: string;
  isReached: boolean;
  breakdown: { label: string; value: number }[];
}

export interface ScenarioEaseEntry {
  scenarioId: ScenarioId;
  code: string;
  title: string;
  alterationsLabel: string;
  structuralEase: 'Rápido' | 'Moderado' | 'Exigente';
  structuralNote: string;
  runsCount: number;
  bestProgress: number | null;
  fastestRounds: number | null;
  reached: boolean;
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, Math.round(v)));
}

/**
 * Computes how close the player currently is to reaching their role's ultimate destination:
 * - Cancer: "Liberarse del control del cuerpo para colonizar todos los recursos"
 * - Oncologist: "Liberarse de un tumor agresivo usando el cuerpo y recursos médicos"
 */
export function computeDestinationProgress(state: SimulationState): DestinationStatus {
  const { clinical, defenses, hallmarkScores, mode } = state;

  if (mode === 'cancer') {
    const burdenScore = clinical.tumorBurden;
    const avgDefenses =
      (defenses.cellCycleCheckpoint +
        defenses.dnaRepair +
        defenses.apoptosisCapacity +
        defenses.immuneSurveillance) /
      4;
    const controlLiberation = clamp(100 - avgDefenses, 0, 100);

    const keyHallmarksAvg =
      (hallmarkScores.proliferative_signaling +
        hallmarkScores.evading_growth_suppressors +
        hallmarkScores.resisting_cell_death +
        hallmarkScores.cellular_metabolism +
        hallmarkScores.inducing_vasculature) /
      5;
    const extentBonus =
      clinical.diseaseExtent === 'diseminada'
        ? 16
        : clinical.diseaseExtent === 'regional'
          ? 8
          : 0;
    const resourceColonization = clamp(keyHallmarksAvg + extentBonus, 0, 100);

    if (state.unlimitedMode) {
      const progress = clamp(burdenScore, 0, 100);
      const stage: 0 | 1 | 2 | 3 =
        progress >= 80 ? 3 : progress >= 55 ? 2 : progress >= 30 ? 1 : 0;
      const stageLabel = [
        'Tejido bajo control',
        'Ruptura de frenos',
        'Expansión invasiva',
        'Colonización total',
      ][stage];

      return {
        role: 'cancer',
        progress,
        stage,
        stageLabel,
        destinationTitle: 'Carga tumoral máxima',
        destinationSubtitle:
          'Mide el avance de la carga tumoral (0 a 100) a medida que la célula supera barreras del tejido.',
        isReached: progress >= 100,
        breakdown: [
          { label: 'Carga tumoral', value: burdenScore },
          { label: 'Pérdida de frenos celulares', value: controlLiberation },
          { label: 'Acceso a recursos y expansión', value: resourceColonization },
        ],
      };
    }

    const progress = clamp(
      burdenScore * 0.42 + controlLiberation * 0.33 + resourceColonization * 0.25,
      0,
      100
    );

    const stage: 0 | 1 | 2 | 3 =
      progress >= 72 ? 3 : progress >= 52 ? 2 : progress >= 32 ? 1 : 0;

    const stageLabel = [
      'Tejido bajo control',
      'Ruptura de frenos',
      'Expansión invasiva',
      'Colonización plena',
    ][stage];

    return {
      role: 'cancer',
      progress,
      stage,
      stageLabel,
      destinationTitle: 'Liberarte del control corporal y colonizar recursos',
      destinationSubtitle:
        'Supera los frenos del organismo, expande tu carga clonal y asegura acceso a oxígeno y nutrientes.',
      isReached: progress >= 72,
      breakdown: [
        { label: 'Expansión tumoral', value: burdenScore },
        { label: 'Liberación de frenos', value: controlLiberation },
        { label: 'Colonización de recursos', value: resourceColonization },
      ],
    };
  }

  // Oncologist role
  const tumorClearance = clamp(100 - clinical.tumorBurden * 1.12, 0, 100);
  const bodyIntegrity = clamp(
    (clinical.functionalStatus + clinical.qualityOfLife + (100 - clinical.cumulativeToxicity)) / 3,
    0,
    100
  );
  const hostDefenseSupport = clamp(
    (defenses.cellCycleCheckpoint + defenses.apoptosisCapacity + defenses.immuneSurveillance) / 3,
    0,
    100
  );

  if (state.unlimitedMode) {
    const progress = clamp(state.oncologistLiberation ?? 16, 0, 100);
    const stage: 0 | 1 | 2 | 3 =
      progress >= 80 ? 3 : progress >= 55 ? 2 : progress >= 30 ? 1 : 0;
    const stageLabel = [
      'Tumor activo',
      'Contención inicial',
      'Remisión avanzada',
      'Liberación total',
    ][stage];

    return {
      role: 'oncologist',
      progress,
      stage,
      stageLabel,
      destinationTitle: 'Control tumoral completo',
      destinationSubtitle:
        'Progreso de la partida (0 a 100%) combinando respuesta del tumor, baja toxicidad y preservación del paciente.',
      isReached: progress >= 100,
      breakdown: [
        { label: 'Reducción de la carga tumoral', value: tumorClearance },
        { label: 'Bienestar y baja toxicidad', value: bodyIntegrity },
        { label: 'Defensas del organismo', value: hostDefenseSupport },
      ],
    };
  }

  const progress = clamp(
    tumorClearance * 0.45 + bodyIntegrity * 0.35 + hostDefenseSupport * 0.2,
    0,
    100
  );

  const stage: 0 | 1 | 2 | 3 =
    progress >= 76 ? 3 : progress >= 62 ? 2 : progress >= 45 ? 1 : 0;

  const stageLabel = [
    'Tumor dominante',
    'Rastreo y contención',
    'Remisión en curso',
    'Tejido liberado',
  ][stage];

  return {
    role: 'oncologist',
    progress,
    stage,
    stageLabel,
    destinationTitle: 'Liberar al cuerpo del tumor agresivo',
    destinationSubtitle:
      'Reduce la carga tumoral apoyándote en las defensas intactas del organismo y en terapias sostenibles.',
    isReached: progress >= 76,
    breakdown: [
      { label: 'Reducción tumoral', value: tumorClearance },
      { label: 'Salud y baja toxicidad', value: bodyIntegrity },
      { label: 'Defensas del organismo', value: hostDefenseSupport },
    ],
  };
}

type LegacyScenarioId = 'A' | 'B' | 'C' | 'D';

const STRUCTURAL_PROFILES: Record<
  GameMode,
  Record<LegacyScenarioId, { ease: 'Rápido' | 'Moderado' | 'Exigente'; note: string }>
> = {
  cancer: {
    A: {
      ease: 'Moderado',
      note: 'La dependencia inicial de EGFR hace vulnerable al clon fundador; escapar exige expandir el subclon PTEN✕ o MET↑.',
    },
    B: {
      ease: 'Rápido',
      note: 'La activación de KRAS↑ junto con RB1✕ bloquean las terapias de receptor y de ciclo desde el inicio, acelerando la liberación del control.',
    },
    C: {
      ease: 'Rápido',
      note: 'La pérdida de TP53 junto a PIK3CA↑ atenúa la apoptosis por daño al ADN y acelera la colonización de recursos.',
    },
    D: {
      ease: 'Exigente',
      note: 'Aunque CDK6↑ acelera el ciclo y BAX✕ frena apoptosis, conservar RB1 y TP53 mantiene vulnerabilidades explotables.',
    },
  },
  oncologist: {
    A: {
      ease: 'Rápido',
      note: 'Un diagnóstico molecular temprano detecta la dependencia de EGFR y permite contención rápida con baja toxicidad.',
    },
    B: {
      ease: 'Exigente',
      note: 'Resistencia intrínseca a Anti-EGFR (KRAS↑) y Anti-CDK4/6 (RB1✕); requiere cambiar rápido a citotóxica o inmunoterapia.',
    },
    C: {
      ease: 'Exigente',
      note: 'Sin TP53 funcional la quimioterapia pierde eficacia; el control depende de bloquear PI3K/AKT y preservar calidad de vida.',
    },
    D: {
      ease: 'Moderado',
      note: 'RB1 intacto abre una ventana clara para Anti-CDK4/6 antes de que se expandan clones resistentes.',
    },
  },
};

/**
 * Legacy helper retained for backward compatibility.
 */
export function buildScenarioEaseComparison(
  completedRuns: CompletedRunSummary[],
  role: GameMode,
  detail: MolecularDetailMode
): ScenarioEaseEntry[] {
  return (['A', 'B', 'C', 'D'] as LegacyScenarioId[]).map((scenarioId) => {
    const info = getScenarioDisplayInfo(scenarioId, detail);
    const prof = STRUCTURAL_PROFILES[role][scenarioId];
    const matchingRuns = completedRuns.filter(
      (r) => r.scenarioId === scenarioId && r.mode === role
    );

    let bestProgress: number | null = null;
    let fastestRounds: number | null = null;
    let reached = false;

    for (const run of matchingRuns) {
      const prog =
        typeof run.destinationProgress === 'number'
          ? run.destinationProgress
          : role === 'cancer'
            ? clamp(run.finalBurden, 0, 100)
            : clamp(100 - run.finalBurden * 0.8 + run.finalQol * 0.2 - run.finalToxicity * 0.2, 0, 100);

      if (bestProgress === null || prog > bestProgress) {
        bestProgress = prog;
      }
      const rounds = run.roundsPlayed ?? run.history.length;
      const runReached = run.destinationReached ?? (role === 'cancer' ? prog >= 80 : prog >= 78);
      if (runReached) {
        reached = true;
        if (fastestRounds === null || rounds < fastestRounds) {
          fastestRounds = rounds;
        }
      }
    }

    // Ensure scenario exists
    void SCENARIOS[scenarioId];

    return {
      scenarioId,
      code: info.code,
      title: info.title,
      alterationsLabel: info.alterationsLabel,
      structuralEase: prof.ease,
      structuralNote: formatBiologyText(prof.note, detail),
      runsCount: matchingRuns.length,
      bestProgress,
      fastestRounds,
      reached,
    };
  });
}
