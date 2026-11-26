import {
  AccumulatedProblem,
  CancerStrategyOption,
  ClinicalState,
  DiagnosticToolId,
  GeneState,
  HallmarkId,
  OncologistRoundPhase,
  OncologistStartStage,
  OrganismDefenses,
  PredictionOption,
  RoundDefinition,
  RoundOffer,
  SimulationState,
  TherapyId,
  TumorClone,
} from './types';

/**
 * Oncologist Mode alternates cleanly between:
 * - Odd rounds (1, 3, 5, ...): Diagnostic round
 * - Even rounds (2, 4, 6, ...): Intervention round
 * At any round, the player can skip directly under Clinical Observation.
 */
export function getOncologistRoundPhase(roundNumber: number): OncologistRoundPhase {
  return roundNumber % 2 === 1 ? 'diagnostic' : 'intervention';
}

export const UNIFIED_FEATURED_GENES: string[] = [
  'EGFR',
  'KRAS',
  'PIK3CA',
  'PTEN',
  'TP53',
  'RB1',
  'CDK6',
  'CDKN2A',
  'ATM',
  'BAX',
  'BCL2',
  'MET',
  'VEGFA',
  'PDL1',
];

export const UNIFIED_CLINICAL_VIGNETTE =
  'Paciente adulto con una lesión proliferativa temprana localizada. Todas las partidas parten de este mismo estado inicial con controles celulares aún intactos: investiga, anticipa qué problemas moleculares pueden acumularse y decide cómo intervenir.';

export const UNIFIED_CANCER_OPENING_QUESTION =
  'Partes de una población celular inicial con una señal de crecimiento leve y todos los frenos del cuerpo aún activos. ¿Qué alteraciones acumularás en cada bifurcación para superar las barreras?';

/**
 * Fast, deterministic PRNG (Mulberry32) used with a fresh random seed per run
 * or an explicit seed in unit tests.
 */
export function createSeededRng(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Pure Fisher-Yates shuffle with provided RNG.
 */
export function shuffleWithRng<T>(items: readonly T[], rng: () => number): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/**
 * Fresh runtime Fisher-Yates shuffle using Math.random() for per-door randomization.
 */
export function shuffleRandom<T>(items: readonly T[]): T[] {
  return shuffleWithRng(items, Math.random);
}

function createBaselineGenotype(overrides: Partial<Record<string, GeneState>> = {}): Record<string, GeneState> {
  return {
    EGFR: 'functional',
    KRAS: 'functional',
    PIK3CA: 'functional',
    PTEN: 'functional',
    TP53: 'functional',
    RB1: 'functional',
    CDK6: 'functional',
    CDKN2A: 'functional',
    ATM: 'functional',
    BAX: 'functional',
    BCL2: 'functional',
    MET: 'functional',
    VEGFA: 'functional',
    PDL1: 'functional',
    ...overrides,
  };
}

/**
 * Exact unified baseline clones shared identically by EVERY new game (both roles).
 * Starts as an early localized lesion with intact tumor suppressors and checkpoints.
 */
export function createUnifiedInitialClones(): TumorClone[] {
  return [
    {
      id: 'clone-founder',
      name: 'Población inicial (señal proliferativa temprana)',
      shortTag: 'Base EGFR↑',
      origin: 'founder',
      genotype: createBaselineGenotype({ EGFR: 'activated' }),
      share: 82,
      proliferationRate: 50,
      apoptosisSensitivity: 82,
      growthFactorDependence: 84,
      metabolicCost: 26,
      immuneVisibility: 74,
      vulnerabilities: [
        'Dependencia temprana de señales externas de crecimiento en membrana',
        'Controles TP53, RB1 y apoptosis intrínseca aún intactos',
      ],
      resistanceSummary: 'Sin mecanismos de evasión establecidos al inicio.',
      description:
        'Población celular inicial con leve señal mitogénica de membrana y frenos supresores todavía funcionales.',
    },
    {
      id: 'clone-sub-a',
      name: 'Subpoblación incipiente de metabolismo y ciclo',
      shortTag: 'Variante A',
      origin: 'preexisting',
      genotype: createBaselineGenotype(),
      share: 11,
      proliferationRate: 44,
      apoptosisSensitivity: 76,
      growthFactorDependence: 72,
      metabolicCost: 34,
      immuneVisibility: 68,
      vulnerabilities: ['Puntos de control y apoptosis funcionales'],
      resistanceSummary: 'Reserva evolutiva susceptible de acumular alteraciones de supervivencia o ciclo.',
      description:
        'Pequeña fracción celular en nicho interno con plasticidad metabólica inicial.',
    },
    {
      id: 'clone-sub-b',
      name: 'Subpoblación minoritaria de reserva tisular',
      shortTag: 'Variante B',
      origin: 'emergent',
      genotype: createBaselineGenotype(),
      share: 7,
      proliferationRate: 38,
      apoptosisSensitivity: 70,
      growthFactorDependence: 68,
      metabolicCost: 32,
      immuneVisibility: 64,
      vulnerabilities: ['Baja tasa inicial de división; expuesta a vigilancia inmune basal'],
      resistanceSummary: 'Fracción minoritaria capaz de fijar variantes adaptativas bajo estrés del microambiente.',
      description:
        'Grupo minoritario en reposo relativo; puede acumular ventajas frente a hipoxia o límites del tejido.',
    },
  ];
}

export function createUnifiedInitialDefenses(): OrganismDefenses {
  return {
    cellCycleCheckpoint: 84,
    dnaRepair: 86,
    senescence: 82,
    apoptosisCapacity: 84,
    immuneSurveillance: 78,
    nutrientSupply: 78,
  };
}

export function createUnifiedInitialClinical(): ClinicalState {
  return {
    tumorBurden: 16,
    diseaseExtent: 'localizada',
    functionalStatus: 94,
    cumulativeToxicity: 0,
    qualityOfLife: 92,
    diseaseControl: 'estable',
  };
}

export interface OncologistStageBaseline {
  stage: OncologistStartStage;
  clones: TumorClone[];
  defenses: OrganismDefenses;
  clinical: ClinicalState;
  accumulatedProblems: AccumulatedProblem[];
  initialLiberation: number;
}

/**
 * Generates the biologically authentic initial state for each Oncologist Mode starting stage:
 * - 'surveillance': Minimal low-risk finding (8% burden, intact controls, ideal for careful monitoring)
 * - 'early': Exact unified early localized lesion (16% burden, intact suppressors)
 * - 'advanced': Disseminated multi-clonal tumor (68% burden, 3 preexisting alterations, weakened defenses)
 */
export function createOncologistStageBaseline(
  stage: OncologistStartStage = 'early'
): OncologistStageBaseline {
  if (stage === 'early') {
    return {
      stage: 'early',
      clones: createUnifiedInitialClones(),
      defenses: createUnifiedInitialDefenses(),
      clinical: createUnifiedInitialClinical(),
      accumulatedProblems: [],
      initialLiberation: 16,
    };
  }

  if (stage === 'surveillance') {
    return {
      stage: 'surveillance',
      clones: [
        {
          id: 'clone-founder',
          name: 'Población mínima de crecimiento lento',
          shortTag: 'Lesión basal',
          origin: 'founder',
          genotype: createBaselineGenotype({ EGFR: 'functional' }),
          share: 90,
          proliferationRate: 36,
          apoptosisSensitivity: 88,
          growthFactorDependence: 90,
          metabolicCost: 22,
          immuneVisibility: 82,
          vulnerabilities: [
            'Dependencia casi total de señales normales del tejido',
            'Controles TP53, RB1, PTEN y apoptosis completamente intactos',
          ],
          resistanceSummary: 'Sin mecanismos de evasión; crecimiento muy lento bajo vigilancia.',
          description:
            'Pequeño foco celular de bajo riesgo con frenos naturales intactos y alta visibilidad inmune.',
        },
        {
          id: 'clone-sub-a',
          name: 'Subpoblación de reserva metabólica tranquila',
          shortTag: 'Variante A',
          origin: 'preexisting',
          genotype: createBaselineGenotype(),
          share: 6,
          proliferationRate: 32,
          apoptosisSensitivity: 82,
          growthFactorDependence: 80,
          metabolicCost: 26,
          immuneVisibility: 76,
          vulnerabilities: ['Puntos de control y apoptosis funcionales'],
          resistanceSummary: 'Baja actividad inicial; sin ventaja evolutiva activa.',
          description: 'Pequeña fracción celular en reposo relativo dentro del tejido sano.',
        },
        {
          id: 'clone-sub-b',
          name: 'Subpoblación minoritaria en latencia',
          shortTag: 'Variante B',
          origin: 'emergent',
          genotype: createBaselineGenotype(),
          share: 4,
          proliferationRate: 28,
          apoptosisSensitivity: 78,
          growthFactorDependence: 78,
          metabolicCost: 25,
          immuneVisibility: 72,
          vulnerabilities: ['Baja tasa inicial de división; controlada por defensas basales'],
          resistanceSummary: 'Sin alteraciones acumuladas al inicio.',
          description: 'Grupo mínimo contenido por las defensas normales del organismo.',
        },
      ],
      defenses: {
        cellCycleCheckpoint: 90,
        dnaRepair: 90,
        senescence: 88,
        apoptosisCapacity: 88,
        immuneSurveillance: 86,
        nutrientSupply: 84,
      },
      clinical: {
        tumorBurden: 8,
        diseaseExtent: 'localizada',
        functionalStatus: 97,
        cumulativeToxicity: 0,
        qualityOfLife: 96,
        diseaseControl: 'control_sostenido',
      },
      accumulatedProblems: [],
      initialLiberation: 36,
    };
  }

  // 'advanced': Cáncer avanzado (enfermedad diseminada con clones heterogéneos)
  const presetProblemIds = ['prob-pik3ca', 'prob-tp53', 'prob-pdl1'];
  const accumulatedProblems: AccumulatedProblem[] = presetProblemIds
    .map((id) => PROBLEM_CATALOG.find((p) => p.id === id))
    .filter((p): p is ProgressiveProblemSpec => Boolean(p))
    .map((spec) => ({
      id: spec.id,
      roundNumber: 0,
      geneSymbol: spec.geneSymbol,
      geneState: spec.geneState,
      logicLabel: spec.logicLabel,
      precisionLabel: spec.precisionLabel,
      shortDoorLogic: spec.shortDoorLogic,
      shortDoorPrecision: spec.shortDoorPrecision,
      summary: spec.summary,
      hallmarkId: spec.hallmarkId,
    }));

  return {
    stage: 'advanced',
    clones: [
      {
        id: 'clone-founder',
        name: 'Población dominante con supervivencia acelerada',
        shortTag: 'PIK3CA↑ TP53✕',
        origin: 'founder',
        genotype: createBaselineGenotype({
          EGFR: 'activated',
          PIK3CA: 'activated',
          TP53: 'inactivated',
        }),
        share: 52,
        proliferationRate: 76,
        apoptosisSensitivity: 42,
        growthFactorDependence: 46,
        metabolicCost: 48,
        immuneVisibility: 56,
        vulnerabilities: [
          'Dependencia fuerte de la cascada PI3K/AKT de supervivencia',
          'Conserva freno RB1 parcial frente a bloqueo del ciclo',
        ],
        resistanceSummary:
          'Pérdida de TP53 atenúa la apoptosis frente a quimioterapia convencional.',
        description:
          'Población mayoritaria con alta proliferación, metabolismo acelerado y menor respuesta al daño al ADN.',
      },
      {
        id: 'clone-sub-a',
        name: 'Subpoblación invasiva con soporte vascular',
        shortTag: 'KRAS↑ VEGFA↑',
        origin: 'preexisting',
        genotype: createBaselineGenotype({
          KRAS: 'activated',
          PTEN: 'inactivated',
          VEGFA: 'activated',
        }),
        share: 28,
        proliferationRate: 72,
        apoptosisSensitivity: 48,
        growthFactorDependence: 34,
        metabolicCost: 50,
        immuneVisibility: 52,
        vulnerabilities: [
          'Dependencia metabólica explotable mediante bloqueo de supervivencia',
          'Visible frente a reactivación inmune',
        ],
        resistanceSummary: 'KRAS activado confiere resistencia intrínseca a Anti-EGFR.',
        description:
          'Subpoblación autónoma capaz de estimular nuevos vasos sanguíneos y sostener su crecimiento.',
      },
      {
        id: 'clone-sub-b',
        name: 'Subpoblación resistente con evasión inmune',
        shortTag: 'PDL1↑ MET↑',
        origin: 'emergent',
        genotype: createBaselineGenotype({
          MET: 'activated',
          PDL1: 'activated',
          BCL2: 'activated',
        }),
        share: 20,
        proliferationRate: 64,
        apoptosisSensitivity: 38,
        growthFactorDependence: 40,
        metabolicCost: 44,
        immuneVisibility: 36,
        vulnerabilities: [
          'Evasión inmune PD-L1 reversible mediante inmunoterapia',
        ],
        resistanceSummary:
          'Combina escape paralelo MET, escudo anti-apoptótico BCL2 y freno PD-L1 sobre linfocitos T.',
        description:
          'Grupo minoritario adaptado a evadir defensas y sobrevivir en sitios metastásicos.',
      },
    ],
    defenses: {
      cellCycleCheckpoint: 46,
      dnaRepair: 48,
      senescence: 44,
      apoptosisCapacity: 46,
      immuneSurveillance: 52,
      nutrientSupply: 50,
    },
    clinical: {
      tumorBurden: 68,
      diseaseExtent: 'diseminada',
      functionalStatus: 64,
      cumulativeToxicity: 8,
      qualityOfLife: 62,
      diseaseControl: 'progresion',
    },
    accumulatedProblems,
    initialLiberation: 6,
  };
}

export interface ProgressiveProblemSpec {
  id: string;
  tier: 1 | 2 | 3;
  geneSymbol: string;
  geneState: GeneState;
  logicLabel: string;
  precisionLabel: string;
  shortDoorLogic: string; // <= 16 chars, zero gene symbols
  shortDoorPrecision: string; // <= 16 chars
  strategyTitle: string;
  summary: string;
  advantage: string;
  cost: string;
  contextHint: string;
  hallmarkId: HallmarkId;
  targetCloneSlot: 'clone-founder' | 'clone-sub-a' | 'clone-sub-b';
  originNote: 'expansion_basal' | 'preexistente' | 'emergente';
  deltaProlif: number;
  deltaApopSens: number;
  deltaGrowthDep: number;
  deltaMetabolicCost: number;
  deltaImmuneVis: number;
  vulnerabilityNote: string;
}

/**
 * 14 progressive biological problems (Hanahan 2026 & COSMIC HoC).
 * Players accumulate these step by step from the same baseline cell, causing the
 * biological trajectory to genuinely fork and compound problems across rounds 1..10.
 */
export const PROBLEM_CATALOG: ProgressiveProblemSpec[] = [
  // TIER 1: Early proliferative & signaling perturbations
  {
    id: 'prob-egfr',
    tier: 1,
    geneSymbol: 'EGFR',
    geneState: 'activated',
    logicLabel: 'Receptor de crecimiento más sensible',
    precisionLabel: 'Amplificación EGFR↑',
    shortDoorLogic: 'Receptor sensible',
    shortDoorPrecision: 'EGFR activado',
    strategyTitle: 'Aumentar la respuesta del receptor a una señal externa (EGFR↑)',
    summary: 'La célula responde con más fuerza a factores de crecimiento del tejido, gastando poca energía al inicio.',
    advantage: 'Acelera la división mientras haya señal externa disponible, con bajo desgaste energético inicial.',
    cost: 'Sigue dependiendo de una señal externa; si ese estímulo desaparece o actúan los frenos del ciclo, pierde empuje.',
    contextHint: 'Sirve cuando el tejido aún envía señales de crecimiento, pero no otorga autonomía total.',
    hallmarkId: 'proliferative_signaling',
    targetCloneSlot: 'clone-founder',
    originNote: 'expansion_basal',
    deltaProlif: 14,
    deltaApopSens: -2,
    deltaGrowthDep: -8,
    deltaMetabolicCost: 4,
    deltaImmuneVis: 0,
    vulnerabilityNote: 'Dependencia de una señal externa de crecimiento y frenos del ciclo intactos',
  },
  {
    id: 'prob-kras',
    tier: 1,
    geneSymbol: 'KRAS',
    geneState: 'activated',
    logicLabel: 'Señal de división autónoma',
    precisionLabel: 'Activación KRAS↑',
    shortDoorLogic: 'Señal autónoma',
    shortDoorPrecision: 'KRAS activado',
    strategyTitle: 'Mantener activa la señal de división aunque falte el estímulo externo (KRAS↑)',
    summary: 'La vía que estimula la división permanece activa aunque el receptor deje de recibir la señal externa.',
    advantage: 'Sigue promoviendo la división incluso cuando desaparecen las señales de crecimiento del tejido.',
    cost: 'Aumenta el consumo de glucosa y el estrés al copiar el ADN, lo que puede activar alarmas de daño.',
    contextHint: 'Da autonomía frente a la falta de señal externa, a cambio de mayor estrés metabólico y de ADN.',
    hallmarkId: 'proliferative_signaling',
    targetCloneSlot: 'clone-founder',
    originNote: 'preexistente',
    deltaProlif: 18,
    deltaApopSens: -4,
    deltaGrowthDep: -42,
    deltaMetabolicCost: 14,
    deltaImmuneVis: 4,
    vulnerabilityNote: 'Mayor estrés al replicar el ADN y alta demanda de glucosa y oxígeno',
  },
  {
    id: 'prob-pik3ca',
    tier: 1,
    geneSymbol: 'PIK3CA',
    geneState: 'activated',
    logicLabel: 'Vía de nutrientes y supervivencia activa',
    precisionLabel: 'Activación PIK3CA↑',
    shortDoorLogic: 'Nutrientes y vida',
    shortDoorPrecision: 'PIK3CA activado',
    strategyTitle: 'Aumentar la captación de nutrientes y resistir señales de apoptosis (PIK3CA↑)',
    summary: 'Impulsa el consumo de glucosa y protege a la célula frente a señales internas de muerte celular.',
    advantage: 'Ayuda a sobrevivir cuando hay estrés por división rápida o baja señal externa.',
    cost: 'Exige un suministro constante de glucosa y nutrientes; en zonas pobres del tejido se desgasta más rápido.',
    contextHint: 'Combina supervivencia y metabolismo, pero vuelve a la célula dependiente de nutrientes.',
    hallmarkId: 'cellular_metabolism',
    targetCloneSlot: 'clone-sub-a',
    originNote: 'preexistente',
    deltaProlif: 12,
    deltaApopSens: -14,
    deltaGrowthDep: -18,
    deltaMetabolicCost: 12,
    deltaImmuneVis: -4,
    vulnerabilityNote: 'Alta dependencia del suministro continuo de glucosa y nutrientes',
  },
  {
    id: 'prob-cdk6',
    tier: 1,
    geneSymbol: 'CDK6',
    geneState: 'activated',
    logicLabel: 'Ciclo celular acelerado',
    precisionLabel: 'Activación CDK6↑',
    shortDoorLogic: 'Ciclo acelerado',
    shortDoorPrecision: 'CDK6 activado',
    strategyTitle: 'Acelerar el paso a la fase de división del ciclo celular (CDK6↑)',
    summary: 'Acorta la pausa previa a la replicación del ADN para que la célula se divida con mayor frecuencia.',
    advantage: 'Expande rápidamente la población cuando los controles externos del tejido son débiles.',
    cost: 'Si el freno principal del ciclo sigue intacto, las señales de detención del tejido aún pueden frenarla.',
    contextHint: 'Aumenta la velocidad de división, pero sigue expuesta a controles intactos del ciclo y del ADN.',
    hallmarkId: 'evading_growth_suppressors',
    targetCloneSlot: 'clone-sub-a',
    originNote: 'preexistente',
    deltaProlif: 16,
    deltaApopSens: 2,
    deltaGrowthDep: -14,
    deltaMetabolicCost: 10,
    deltaImmuneVis: 2,
    vulnerabilityNote: 'Sensible a señales de detención mientras el freno del ciclo (RB1) siga intacto',
  },

  // TIER 2: Loss of tumor suppressors & DNA damage checkpoints
  {
    id: 'prob-pten',
    tier: 2,
    geneSymbol: 'PTEN',
    geneState: 'inactivated',
    logicLabel: 'Pérdida del freno metabólico interno',
    precisionLabel: 'Pérdida PTEN✕',
    shortDoorLogic: 'Sin freno interno',
    shortDoorPrecision: 'PTEN perdido',
    strategyTitle: 'Eliminar el freno interno de la vía de crecimiento y supervivencia (PTEN✕)',
    summary: 'Deja encendida la señal de supervivencia y síntesis celular aunque disminuya el estímulo del receptor.',
    advantage: 'Mantiene la supervivencia celular y reduce la apoptosis cuando bajan las señales del tejido.',
    cost: 'Sube el consumo energético basal y acelera el agotamiento de nutrientes en el microambiente.',
    contextHint: 'Sostiene la supervivencia sin señal externa, a costa de un gasto energético elevado.',
    hallmarkId: 'evading_growth_suppressors',
    targetCloneSlot: 'clone-sub-a',
    originNote: 'preexistente',
    deltaProlif: 10,
    deltaApopSens: -18,
    deltaGrowthDep: -24,
    deltaMetabolicCost: 14,
    deltaImmuneVis: -6,
    vulnerabilityNote: 'Alto gasto energético y fragilidad cuando faltan oxígeno y nutrientes',
  },
  {
    id: 'prob-rb1',
    tier: 2,
    geneSymbol: 'RB1',
    geneState: 'inactivated',
    logicLabel: 'Pérdida del freno principal del ciclo celular',
    precisionLabel: 'Inactivación RB1✕',
    shortDoorLogic: 'Sin freno ciclo',
    shortDoorPrecision: 'RB1 perdido',
    strategyTitle: 'Inactivar el freno principal del ciclo celular (RB1✕)',
    summary: 'Permite iniciar la división incluso cuando el tejido vecino envía señales para detenerla.',
    advantage: 'Ignora órdenes externas de detención y sostiene el paso continuo al ciclo celular.',
    cost: 'Dividirse sin control aumenta los errores al copiar el ADN y puede disparar la alarma de daño.',
    contextHint: 'Rompe el freno del ciclo celular, aunque incrementa el estrés sobre el ADN.',
    hallmarkId: 'evading_growth_suppressors',
    targetCloneSlot: 'clone-founder',
    originNote: 'emergente',
    deltaProlif: 16,
    deltaApopSens: 4,
    deltaGrowthDep: -20,
    deltaMetabolicCost: 10,
    deltaImmuneVis: 4,
    vulnerabilityNote: 'Mayor estrés replicativo y activación de alarmas ante daño en el ADN',
  },
  {
    id: 'prob-tp53',
    tier: 2,
    geneSymbol: 'TP53',
    geneState: 'inactivated',
    logicLabel: 'Pérdida de la alarma ante daño al ADN',
    precisionLabel: 'Inactivación TP53✕',
    shortDoorLogic: 'Sin alarma ADN',
    shortDoorPrecision: 'TP53 perdido',
    strategyTitle: 'Anular la alarma principal ante daño en el ADN (TP53✕)',
    summary: 'Impide detener el ciclo o activar la apoptosis cuando la célula acumula daños en su ADN.',
    advantage: 'Tolera roturas genéticas y estrés replicativo mientras favorece la aparición de nuevas variantes.',
    cost: 'Acumular mutaciones genera señales anómalas que hacen a la célula más visible para el sistema inmune.',
    contextHint: 'Evita la muerte por daño al ADN, pero aumenta la visibilidad frente a linfocitos T.',
    hallmarkId: 'resisting_cell_death',
    targetCloneSlot: 'clone-founder',
    originNote: 'emergente',
    deltaProlif: 10,
    deltaApopSens: -24,
    deltaGrowthDep: -12,
    deltaMetabolicCost: 8,
    deltaImmuneVis: 10,
    vulnerabilityNote: 'Mayor acumulación de alteraciones visibles para la vigilancia inmune',
  },
  {
    id: 'prob-cdkn2a',
    tier: 2,
    geneSymbol: 'CDKN2A',
    geneState: 'inactivated',
    logicLabel: 'Pérdida del freno de envejecimiento celular',
    precisionLabel: 'Pérdida CDKN2A✕',
    shortDoorLogic: 'Sin senescencia',
    shortDoorPrecision: 'CDKN2A perdido',
    strategyTitle: 'Suprimir el freno de envejecimiento celular (CDKN2A✕)',
    summary: 'Evita que la célula entre en reposo permanente tras muchas divisiones o estrés proliferativo.',
    advantage: 'Permite continuar dividiéndose más allá del límite habitual del tejido.',
    cost: 'Exige más nutrientes y deja a la célula expuesta a daños acumulados en el ADN.',
    contextHint: 'Evita la detención por envejecimiento cuando la población ya lleva muchas divisiones.',
    hallmarkId: 'replicative_immortality',
    targetCloneSlot: 'clone-sub-a',
    originNote: 'preexistente',
    deltaProlif: 12,
    deltaApopSens: -8,
    deltaGrowthDep: -10,
    deltaMetabolicCost: 8,
    deltaImmuneVis: 2,
    vulnerabilityNote: 'Mayor sensibilidad a falta de nutrientes y daño acumulado en el ADN',
  },
  {
    id: 'prob-atm',
    tier: 2,
    geneSymbol: 'ATM',
    geneState: 'inactivated',
    logicLabel: 'Pérdida del sensor temprano de roturas del ADN',
    precisionLabel: 'Fallo ATM✕',
    shortDoorLogic: 'Sin sensor ADN',
    shortDoorPrecision: 'ATM perdido',
    strategyTitle: 'Desactivar el sensor temprano de roturas en el ADN (ATM✕)',
    summary: 'Retrasa la señal de alarma que detiene la célula cuando el ADN se rompe durante la división.',
    advantage: 'Permite seguir dividiéndose sin pausa inmediata ante roturas cromosómicas iniciales.',
    cost: 'Aumenta la inestabilidad del genoma y hace más visibles las células alteradas para el sistema inmune.',
    contextHint: 'Silencia la alerta temprana de roturas a costa de mayor inestabilidad genética.',
    hallmarkId: 'phenotypic_plasticity',
    targetCloneSlot: 'clone-sub-b',
    originNote: 'emergente',
    deltaProlif: 8,
    deltaApopSens: -12,
    deltaGrowthDep: -8,
    deltaMetabolicCost: 10,
    deltaImmuneVis: 8,
    vulnerabilityNote: 'Inestabilidad genética y mayor visibilidad para el sistema inmune',
  },

  // TIER 3: Apoptosis shields, alternate receptors, angiogenesis & immune evasion
  {
    id: 'prob-bax',
    tier: 3,
    geneSymbol: 'BAX',
    geneState: 'inactivated',
    logicLabel: 'Pérdida del ejecutor de la apoptosis',
    precisionLabel: 'Inactivación BAX✕',
    shortDoorLogic: 'Sin ejecutor daño',
    shortDoorPrecision: 'BAX perdido',
    strategyTitle: 'Inactivar el ejecutor de la muerte celular programada (BAX✕)',
    summary: 'Bloquea el paso final que ejecuta la apoptosis desde la mitocondria.',
    advantage: 'Sobrevive incluso si se activan alarmas internas de daño en el ADN o estrés fuerte.',
    cost: 'No acelera la división por sí sola y no protege frente al ataque directo de los linfocitos T.',
    contextHint: 'Reduce la muerte celular interna, pero deja abierta la eliminación por defensa inmune.',
    hallmarkId: 'resisting_cell_death',
    targetCloneSlot: 'clone-sub-a',
    originNote: 'preexistente',
    deltaProlif: 4,
    deltaApopSens: -24,
    deltaGrowthDep: -4,
    deltaMetabolicCost: 6,
    deltaImmuneVis: 0,
    vulnerabilityNote: 'Sigue expuesta al ataque de linfocitos T y a los frenos del ciclo celular',
  },
  {
    id: 'prob-bcl2',
    tier: 3,
    geneSymbol: 'BCL2',
    geneState: 'activated',
    logicLabel: 'Bloqueo mitocondrial de la apoptosis',
    precisionLabel: 'Sobreexpresión BCL2↑',
    shortDoorLogic: 'Bloqueo apoptosis',
    shortDoorPrecision: 'BCL2 activado',
    strategyTitle: 'Bloquear la apoptosis desde la mitocondria (BCL2↑)',
    summary: 'Retiene las proteínas que inician la muerte celular y eleva el umbral necesario para morir.',
    advantage: 'Mantiene vivas a las células bajo falta aguda de nutrientes o daño interno grave.',
    cost: 'Reduce ligeramente la velocidad de división y exige energía adicional de mantenimiento.',
    contextHint: 'Prioriza sobrevivir en condiciones adversas a cambio de dividirse más despacio.',
    hallmarkId: 'resisting_cell_death',
    targetCloneSlot: 'clone-sub-a',
    originNote: 'preexistente',
    deltaProlif: -4,
    deltaApopSens: -28,
    deltaGrowthDep: -6,
    deltaMetabolicCost: 10,
    deltaImmuneVis: -2,
    vulnerabilityNote: 'División más lenta y vulnerabilidad frente a la vigilancia inmune',
  },
  {
    id: 'prob-met',
    tier: 3,
    geneSymbol: 'MET',
    geneState: 'activated',
    logicLabel: 'Receptor alterno de crecimiento e invasión',
    precisionLabel: 'Amplificación MET↑',
    shortDoorLogic: 'Receptor alterno',
    shortDoorPrecision: 'MET activado',
    strategyTitle: 'Activar un receptor alterno que impulsa división y migración (MET↑)',
    summary: 'Abre una segunda vía de señalización para dividirse y desplazarse hacia tejidos vecinos.',
    advantage: 'Supera límites de contacto del tejido sano y mantiene la señal aunque falle el receptor principal.',
    cost: 'Tiene un alto costo energético; compite mal si faltan oxígeno y glucosa.',
    contextHint: 'Impulsa la invasión hacia tejidos cercanos, pero demanda mucha energía.',
    hallmarkId: 'invasion_metastasis',
    targetCloneSlot: 'clone-sub-b',
    originNote: 'emergente',
    deltaProlif: 12,
    deltaApopSens: -8,
    deltaGrowthDep: -28,
    deltaMetabolicCost: 16,
    deltaImmuneVis: 2,
    vulnerabilityNote: 'Alto gasto energético cuando escasean oxígeno y glucosa',
  },
  {
    id: 'prob-vegfa',
    tier: 3,
    geneSymbol: 'VEGFA',
    geneState: 'activated',
    logicLabel: 'Inducción de nuevos vasos sanguíneos',
    precisionLabel: 'Señal angiogénica VEGFA↑',
    shortDoorLogic: 'Nuevos vasos',
    shortDoorPrecision: 'VEGFA activado',
    strategyTitle: 'Liberar señales para atraer nuevos vasos sanguíneos (VEGFA↑)',
    summary: 'Estimula la formación de vasos locales que llevan oxígeno y nutrientes al interior del tumor.',
    advantage: 'Alivia la falta de oxígeno y sostiene poblaciones con alto consumo energético.',
    cost: 'Los vasos nuevos también facilitan la llegada de linfocitos del sistema inmune al tumor.',
    contextHint: 'Resuelve la falta de oxígeno en masas en crecimiento, pero aumenta el contacto con defensas inmunes.',
    hallmarkId: 'inducing_vasculature',
    targetCloneSlot: 'clone-sub-b',
    originNote: 'emergente',
    deltaProlif: 10,
    deltaApopSens: -6,
    deltaGrowthDep: -10,
    deltaMetabolicCost: -12,
    deltaImmuneVis: 6,
    vulnerabilityNote: 'Mayor entrada de linfocitos inmunes a través de los nuevos vasos',
  },
  {
    id: 'prob-pdl1',
    tier: 3,
    geneSymbol: 'PDL1',
    geneState: 'activated',
    logicLabel: 'Evasión de la respuesta inmune',
    precisionLabel: 'Expresión PD-L1↑',
    shortDoorLogic: 'Evasión inmune',
    shortDoorPrecision: 'PD-L1 activado',
    strategyTitle: 'Mostrar una señal inhibidora que frena a los linfocitos T (PD-L1↑)',
    summary: 'Coloca en la membrana una señal de freno que reduce el ataque del sistema inmune.',
    advantage: 'Protege a las células tumorales cuando la vigilancia inmune del tejido está activa.',
    cost: 'Consume recursos metabólicos y aporta muy poco impulso directo para dividirse.',
    contextHint: 'Conviene cuando el sistema inmune está atacando; por sí sola no acelera mucho el crecimiento.',
    hallmarkId: 'avoiding_immune_destruction',
    targetCloneSlot: 'clone-sub-b',
    originNote: 'emergente',
    deltaProlif: 4,
    deltaApopSens: -8,
    deltaGrowthDep: -4,
    deltaMetabolicCost: 8,
    deltaImmuneVis: -36,
    vulnerabilityNote: 'Bajo impulso proliferativo directo y gasto energético constante',
  },
];

export function getProblemById(id: string): ProgressiveProblemSpec | undefined {
  return PROBLEM_CATALOG.find((p) => p.id === id);
}

/**
 * Mutates the targeted clone in-place (on a cloned array) when a biological problem is accumulated.
 * Updates genotype, phenotype metrics, vulnerabilities, and descriptive tags so every fork compounds!
 */
export function applyProblemToClones(
  clones: TumorClone[],
  targetCloneId: string,
  problem: Omit<AccumulatedProblem, 'roundNumber'>,
  spec?: ProgressiveProblemSpec
): TumorClone[] {
  const catalogSpec = spec ?? getProblemById(problem.id);
  return clones.map((clone) => {
    if (clone.id !== targetCloneId) return clone;
    const nextGenotype: Record<string, GeneState> = {
      ...clone.genotype,
      [problem.geneSymbol]: problem.geneState,
    };

    const activeSymbols = Object.entries(nextGenotype)
      .filter(([, st]) => st === 'activated' || st === 'inactivated')
      .map(([sym, st]) => `${sym}${st === 'activated' ? '↑' : '✕'}`);

    const shortTag = activeSymbols.slice(-2).join(' ') || clone.shortTag;
    const clonePrefix =
      clone.origin === 'founder'
        ? 'Clon dominante'
        : clone.origin === 'preexisting'
          ? 'Subclon adaptativo'
          : 'Subclon de escape';
    const nextName =
      activeSymbols.length > 0
        ? `${clonePrefix} (${activeSymbols.slice(-3).join(' + ')})`
        : clone.name;

    const nextVulns = catalogSpec
      ? Array.from(new Set([catalogSpec.vulnerabilityNote, ...clone.vulnerabilities])).slice(0, 3)
      : clone.vulnerabilities;

    return {
      ...clone,
      name: nextName,
      shortTag,
      genotype: nextGenotype,
      proliferationRate: Math.max(
        20,
        Math.min(96, clone.proliferationRate + (catalogSpec?.deltaProlif ?? 8))
      ),
      apoptosisSensitivity: Math.max(
        14,
        Math.min(95, clone.apoptosisSensitivity + (catalogSpec?.deltaApopSens ?? -8))
      ),
      growthFactorDependence: Math.max(
        10,
        Math.min(95, clone.growthFactorDependence + (catalogSpec?.deltaGrowthDep ?? -10))
      ),
      metabolicCost: Math.max(
        18,
        Math.min(92, clone.metabolicCost + (catalogSpec?.deltaMetabolicCost ?? 6))
      ),
      immuneVisibility: Math.max(
        14,
        Math.min(95, clone.immuneVisibility + (catalogSpec?.deltaImmuneVis ?? 0))
      ),
      vulnerabilities: nextVulns,
      resistanceSummary: catalogSpec ? catalogSpec.advantage : clone.resistanceSummary,
    };
  });
}

/**
 * In Oncologist mode, when the tumor persists under selective pressure or grows unchecked,
 * it biologically accumulates a coherent escape problem onto a subclone.
 */
export function pickOncologistAdaptiveProblem(
  accumulatedIds: string[],
  therapyId: TherapyId,
  roundNumber: number,
  rng: () => number
): ProgressiveProblemSpec | null {
  const already = new Set(accumulatedIds);
  let preferredIds: string[] = [];

  if (therapyId === 'egfr_tki') {
    preferredIds = ['prob-pten', 'prob-met', 'prob-kras', 'prob-pik3ca'];
  } else if (therapyId === 'cdk46_inhibitor') {
    preferredIds = ['prob-rb1', 'prob-cdkn2a', 'prob-bax'];
  } else if (therapyId === 'pi3k_inhibitor') {
    preferredIds = ['prob-kras', 'prob-met', 'prob-pdl1'];
  } else if (therapyId === 'chemotherapy' || therapyId === 'radiotherapy' || therapyId === 'combo_targeted_chemo') {
    preferredIds = ['prob-bcl2', 'prob-tp53', 'prob-bax', 'prob-atm'];
  } else if (therapyId === 'immunotherapy') {
    preferredIds = ['prob-vegfa', 'prob-met', 'prob-pten'];
  } else {
    // Active surveillance, surgery, palliative -> natural progression along tiers
    preferredIds =
      roundNumber <= 2
        ? ['prob-kras', 'prob-pik3ca', 'prob-cdk6', 'prob-pten']
        : ['prob-tp53', 'prob-rb1', 'prob-vegfa', 'prob-pdl1', 'prob-bcl2'];
  }

  const eligiblePreferred = preferredIds
    .filter((id) => !already.has(id))
    .map((id) => getProblemById(id))
    .filter((p): p is ProgressiveProblemSpec => Boolean(p));

  if (eligiblePreferred.length > 0) {
    return shuffleWithRng(eligiblePreferred, rng)[0];
  }

  const remaining = PROBLEM_CATALOG.filter((p) => !already.has(p.id));
  if (remaining.length === 0) return null;
  return shuffleWithRng(remaining, rng)[0];
}

/**
 * Dynamically derives the expected cell model for Oncologist Phase 2 grading
 * directly from the current live clonal genotypes (no static 4-scenario table!).
 */
export function deriveExpectedCellModel(clones: TumorClone[]): {
  primaryDriver: string;
  weakenedControl: string;
  intactControl: string;
  exploitableVulnerability: string;
} {
  const dominant = clones.reduce((a, b) => (b.share > a.share ? b : a), clones[0]);
  const allGenes = (sym: string, st: GeneState) =>
    clones.some((c) => c.share >= 12 && c.genotype[sym] === st);

  // Primary driver
  let primaryDriver = 'EGFR';
  if (dominant.genotype.KRAS === 'activated') primaryDriver = 'KRAS';
  else if (dominant.genotype.PIK3CA === 'activated') primaryDriver = 'PIK3CA';
  else if (dominant.genotype.CDK6 === 'activated') primaryDriver = 'CDK6';
  else if (dominant.genotype.EGFR === 'activated') primaryDriver = 'EGFR';
  else if (allGenes('KRAS', 'activated')) primaryDriver = 'KRAS';
  else if (allGenes('PIK3CA', 'activated')) primaryDriver = 'PIK3CA';
  else if (allGenes('CDK6', 'activated')) primaryDriver = 'CDK6';

  // Weakened control
  let weakenedControl = 'PTEN';
  if (allGenes('RB1', 'inactivated')) weakenedControl = 'RB1';
  else if (allGenes('TP53', 'inactivated')) weakenedControl = 'TP53';
  else if (allGenes('PTEN', 'inactivated')) weakenedControl = 'PTEN';
  else if (allGenes('BAX', 'inactivated')) weakenedControl = 'BAX';

  // Intact control
  let intactControl = 'TP53';
  if (dominant.genotype.TP53 === 'functional') intactControl = 'TP53';
  else if (dominant.genotype.RB1 === 'functional') intactControl = 'RB1';
  else if (dominant.genotype.BAX === 'functional') intactControl = 'BAX';
  else intactControl = 'PDL1';

  // Exploitable vulnerability
  let exploitableVulnerability = 'egfr_tki';
  if (allGenes('PDL1', 'activated')) exploitableVulnerability = 'immunotherapy';
  else if (primaryDriver === 'CDK6' && dominant.genotype.RB1 === 'functional')
    exploitableVulnerability = 'cdk46_inhibitor';
  else if (primaryDriver === 'PIK3CA' || allGenes('PTEN', 'inactivated'))
    exploitableVulnerability = 'pi3k_inhibitor';
  else if (primaryDriver === 'KRAS') exploitableVulnerability = 'chemotherapy';
  else exploitableVulnerability = 'egfr_tki';

  return {
    primaryDriver,
    weakenedControl,
    intactControl,
    exploitableVulnerability,
  };
}

function selectBarrierForRound(
  roundNumber: number,
  _accumulated: AccumulatedProblem[],
  _rng: () => number
): {
  barrierType: RoundDefinition['barrierType'];
  title: string;
  cancerPrompt: string;
  oncologistPrompt: string;
  virtualTherapy?: TherapyId;
} {
  if (roundNumber === 1) {
    return {
      barrierType: 'growth_checkpoint',
      title: 'Primer punto de control del tejido sano',
      cancerPrompt:
        'Partes de una población celular inicial con frenos del organismo aún intactos. Los controles del ciclo celular detienen la división excesiva. ¿Qué alteración acumularás primero?',
      oncologistPrompt:
        'Lesión proliferativa inicial localizada. Investiga su perfil y decide la primera intervención antes de que acumule alteraciones de escape.',
    };
  }

  // Natural physiological host barriers & microenvironmental stressors (ZERO phantom therapies in Cancer Mode!)
  const phaseMod = (roundNumber - 2) % 5;

  if (phaseMod === 0) {
    return {
      barrierType: 'growth_checkpoint',
      title: 'Señales antiproliferativas del tejido vecino',
      cancerPrompt:
        'Las células sanas vecinas emiten señales de inhibición por contacto y limitan los factores de crecimiento locales. Solo las poblaciones con señalización autónoma o frenos del ciclo debilitados mantienen su expansión.',
      oncologistPrompt: `Ronda ${roundNumber}: evalúa la respuesta clonal y las alteraciones acumuladas antes de ajustar tu esquema terapéutico.`,
    };
  }

  if (phaseMod === 1) {
    return {
      barrierType: 'dna_damage',
      title: 'Estrés replicativo y respuesta al daño del ADN',
      cancerPrompt:
        'La división acelerada genera roturas en el ADN que activan los sensores celulares (ATM/TP53) e inducen muerte celular programada en las células sin protección apoptótica.',
      oncologistPrompt: `Ronda ${roundNumber}: balancea la eficacia frente a los clones emergentes y la toxicidad acumulada del paciente.`,
    };
  }

  if (phaseMod === 2) {
    return {
      barrierType: 'nutrient_restriction',
      title: 'Hipoxia y escasez de oxígeno y nutrientes',
      cancerPrompt:
        'El crecimiento celular agota el oxígeno y la glucosa locales. Sin nuevos vasos sanguíneos ni adaptación metabólica, los clones de alto gasto energético pierden terreno.',
      oncologistPrompt: `Ronda ${roundNumber}: la hipoxia y la presión selectiva remodelan los subclones. Decide si cambiar de blanco, combinar o proteger el bienestar clínico.`,
    };
  }

  if (phaseMod === 3) {
    return {
      barrierType: 'immune_surveillance',
      title: 'Vigilancia inmunológica del huésped',
      cancerPrompt:
        'Linfocitos T citotóxicos y células inmunes del organismo infiltran la lesión y destruyen poblaciones con alta visibilidad antigénica que carecen de mecanismos de evasión inmune.',
      oncologistPrompt: `Ronda ${roundNumber}: analiza la interacción inmune, los biomarcadores acumulados y el estado funcional del paciente.`,
    };
  }

  // phaseMod === 4: Combined tissue boundaries & microenvironmental pressure
  return {
    barrierType: 'therapeutic_adaptation',
    title: `Límites tisulares y presión del microambiente (Ronda ${roundNumber})`,
    cancerPrompt:
      'La matriz extracelular, la competencia por nutrientes y las defensas del organismo actúan al mismo tiempo. Solo las poblaciones que combinan invasión, autonomía o evasión logran colonizar más tejido.',
    oncologistPrompt: `Ronda ${roundNumber}: consolida el control de la enfermedad frente a los problemas acumulados o prioriza la calidad de vida si la toxicidad limita escalar.`,
  };
}

function buildCancerPredictionsForBarrier(
  barrierType: RoundDefinition['barrierType'],
  roundNumber: number
): PredictionOption[] {
  const prefix = `u-c${roundNumber}`;
  if (barrierType === 'growth_checkpoint') {
    return [
      {
        id: `${prefix}-p1`,
        label:
          'Una alteración en señalización autónoma, ciclo o supervivencia ganará ventaja frente al freno del tejido sano.',
        rationale: 'Las variantes que sortean controles del ciclo o señales restrictivas aumentan su proporción clonal.',
        expectedOutcomeTag: 'clonal_selection',
      },
      {
        id: `${prefix}-p2`,
        label:
          'Si la población sigue dependiendo de señales externas de membrana, los frenos del tejido aún contendrán su expansión.',
        rationale: 'Aumentar un receptor de membrana no elimina automáticamente los frenos del ciclo intactos.',
        expectedOutcomeTag: 'barrier_arrest',
      },
      {
        id: `${prefix}-p3`,
        label:
          'Una sola alteración inicial vuelve a la célula completamente invulnerable a todas las defensas del organismo.',
        rationale: 'Sobrestima una alteración temprana; el cáncer progresa acumulando múltiples cambios.',
        expectedOutcomeTag: 'clonal_expansion',
        isDistractor: true,
      },
    ];
  }

  if (barrierType === 'dna_damage') {
    return [
      {
        id: `${prefix}-p1`,
        label:
          'Los clones sin guardián del ADN o con escudo antiapoptótico tolerarán mejor el estrés replicativo y aumentarán su fracción.',
        rationale: 'El estrés replicativo selecciona poblaciones con umbral apoptótico elevado.',
        expectedOutcomeTag: 'clonal_selection',
      },
      {
        id: `${prefix}-p2`,
        label:
          'Las células con vía apoptótica intacta sufrirán arresto o muerte celular ante el daño acumulado al ADN.',
        rationale: 'ATM, TP53 y BAX funcionales inducen apoptosis frente a roturas replicativas.',
        expectedOutcomeTag: 'barrier_arrest',
      },
      {
        id: `${prefix}-p3`,
        label:
          'El daño al ADN hará crecer por igual a todos los clones sin ejercer ninguna presión selectiva.',
        rationale: 'Ignora la sensibilidad diferencial según el estado de TP53, BAX y BCL2.',
        expectedOutcomeTag: 'clonal_expansion',
        isDistractor: true,
      },
    ];
  }

  if (barrierType === 'nutrient_restriction') {
    return [
      {
        id: `${prefix}-p1`,
        label:
          'Los clones con soporte vascular o ventaja metabólica tolerarán mejor la hipoxia y se seleccionarán.',
        rationale: 'La angiogénesis y el metabolismo anabólico mitigan la escasez de oxígeno y nutrientes.',
        expectedOutcomeTag: 'clonal_selection',
      },
      {
        id: `${prefix}-p2`,
        label:
          'Sin adaptación vascular ni metabólica, la escasez de nutrientes frenará temporalmente el crecimiento.',
        rationale: 'El microambiente hipóxico actúa como un límite físico real.',
        expectedOutcomeTag: 'barrier_arrest',
      },
      {
        id: `${prefix}-p3`,
        label:
          'La falta de oxígeno y glucosa acelerará de inmediato la división de cualquier clon sin costo alguno.',
        rationale: 'Contradice las restricciones bioenergéticas básicas de la proliferación celular.',
        expectedOutcomeTag: 'clonal_expansion',
        isDistractor: true,
      },
    ];
  }

  if (barrierType === 'immune_surveillance') {
    return [
      {
        id: `${prefix}-p1`,
        label:
          'El clon que exprese señales de evasión inmune sobrevivirá mejor al ataque de los linfocitos T del organismo.',
        rationale: 'La evasión inmune reduce la eliminación citotóxica y otorga ventaja selectiva.',
        expectedOutcomeTag: 'clonal_selection',
      },
      {
        id: `${prefix}-p2`,
        label:
          'Las células con alta visibilidad antigénica serán contenidas o eliminadas por la vigilancia inmunológica.',
        rationale: 'La citotoxicidad de los linfocitos T actúa como defensa extrínseca del organismo.',
        expectedOutcomeTag: 'barrier_arrest',
      },
      {
        id: `${prefix}-p3`,
        label:
          'El sistema inmune se desactivará solo sin que la célula acumule ningún mecanismo de evasión.',
        rationale: 'Ignora la vigilancia activa de los linfocitos T sobre antígenos celulares anómalos.',
        expectedOutcomeTag: 'clonal_expansion',
        isDistractor: true,
      },
    ];
  }

  // Combined microenvironmental & tissue-boundary pressure
  return [
    {
      id: `${prefix}-p1`,
      label:
        'Las variantes con capacidad de invasión, angiogénesis, evasión inmune o autonomía resistirán la presión combinada y se seleccionarán.',
      rationale: 'Superar límites tisulares múltiples favorece a los clones con alteraciones adaptativas acumuladas.',
      expectedOutcomeTag: 'clonal_selection',
    },
    {
      id: `${prefix}-p2`,
      label:
        'Una población sin adaptaciones suficientes frente al entorno será contenida por los límites del tejido y las defensas del huésped.',
      rationale: 'Cuando faltan mecanismos de invasión o supervivencia, el microambiente restringe la expansión.',
      expectedOutcomeTag: 'barrier_arrest',
    },
    {
      id: `${prefix}-p3`,
      label:
        'Todas las células colonizarán el tejido al mismo ritmo sin que importe qué alteraciones hayan acumulado.',
      rationale: 'Ignora la selección darwiniana ejercida por las barreras físicas, metabólicas e inmunes.',
      expectedOutcomeTag: 'clonal_expansion',
      isDistractor: true,
    },
  ];
}

function buildOncologistPredictionsForRound(roundNumber: number): PredictionOption[] {
  const prefix = `u-o${roundNumber}`;
  return [
    {
      id: `${prefix}-p1`,
      label:
        'La intervención dirigida o local reducirá la carga de clones sensibles con impacto tolerable.',
      rationale: 'Alinear el mecanismo terapéutico con las vulnerabilidades activas logra respuesta clínica.',
      expectedOutcomeTag: 'therapy_response',
    },
    {
      id: `${prefix}-p2`,
      label:
        'Esta opción enfrentará resistencia clonal o permitirá que se expandan subclones menos sensibles.',
      rationale: 'Cuando existen alteraciones de bypass o resistencia intrínseca, la eficacia disminuye.',
      expectedOutcomeTag: 'resistant_outgrowth',
    },
    {
      id: `${prefix}-p3`,
      label:
        'La intensidad o repetición del tratamiento elevará la toxicidad como factor limitante principal.',
      rationale: 'Los esquemas citotóxicos o combinados acumulan daño en tejidos sanos.',
      expectedOutcomeTag: 'toxicity_limit',
    },
    {
      id: `${prefix}-p4`,
      label:
        'Un manejo conservador o de soporte preservará el bienestar del paciente y reducirá toxicidad.',
      rationale: 'Vigilancia activa y cuidados paliativos priorizan recuperación tisular y calidad de vida.',
      expectedOutcomeTag: 'qol_preservation',
    },
    {
      id: `${prefix}-p5`,
      label:
        'Cualquier tratamiento intensivo erradicará por completo todos los clones sin producir efectos secundarios.',
      rationale: 'Ignora la toxicidad real en tejidos sanos y la heterogeneidad clonal.',
      expectedOutcomeTag: 'stable_control',
      isDistractor: true,
    },
  ];
}

/**
 * Picks 3 randomized diagnostic studies for odd Oncologist rounds, prioritizing
 * uncompleted studies early and including molecular response monitoring from Round 3+.
 */
export function selectRandomizedOncologistDiagnostics(
  completedDiagnostics: DiagnosticToolId[],
  roundNumber: number,
  rng: () => number
): DiagnosticToolId[] {
  const basePool: DiagnosticToolId[] = [
    'imaging',
    'biopsy',
    'molecular_profile',
    'biomarkers',
  ];
  const fullPool: DiagnosticToolId[] =
    roundNumber >= 3 ? [...basePool, 'response_monitoring'] : basePool;

  const uncompleted = fullPool.filter((id) => !completedDiagnostics.includes(id));
  const chosen: DiagnosticToolId[] = [];

  for (const id of shuffleWithRng(uncompleted, rng)) {
    if (chosen.length >= 3) break;
    chosen.push(id);
  }

  // On round 3+, encourage response_monitoring if not yet chosen and slots remain
  if (
    roundNumber >= 3 &&
    chosen.length < 3 &&
    !chosen.includes('response_monitoring')
  ) {
    chosen.push('response_monitoring');
  }

  for (const id of shuffleWithRng(fullPool, rng)) {
    if (chosen.length >= 3) break;
    if (!chosen.includes(id)) chosen.push(id);
  }

  return shuffleWithRng(chosen.slice(0, 3), rng);
}

/**
 * Picks 3 randomized, clinically contrasting active interventions for even Oncologist rounds
 * based on the live accumulated tumor state. Excludes 'active_surveillance' because
 * Observación (saltar ronda) is always available as a dedicated option on every round.
 */
export function selectRandomizedOncologistDoors(
  clones: TumorClone[],
  clinical: ClinicalState,
  usedTherapies: TherapyId[],
  rng: () => number
): TherapyId[] {
  const hasGene = (sym: string, st: GeneState) =>
    clones.some((c) => c.share >= 15 && c.genotype[sym] === st);

  const effectivePool: TherapyId[] = [];
  const contrastingPool: TherapyId[] = [];
  const supportivePool: TherapyId[] = ['palliative_care'];

  if (clinical.diseaseExtent === 'localizada') effectivePool.push('surgery');
  if (clinical.diseaseExtent !== 'diseminada') effectivePool.push('radiotherapy');
  if (hasGene('EGFR', 'activated') && !hasGene('KRAS', 'activated')) effectivePool.push('egfr_tki');
  if (hasGene('CDK6', 'activated') && !hasGene('RB1', 'inactivated')) effectivePool.push('cdk46_inhibitor');
  if (hasGene('PIK3CA', 'activated') || hasGene('PTEN', 'inactivated')) effectivePool.push('pi3k_inhibitor');
  if (hasGene('PDL1', 'activated')) effectivePool.push('immunotherapy');
  if (!hasGene('TP53', 'inactivated') && !hasGene('BCL2', 'activated')) effectivePool.push('chemotherapy');

  // Ensure effective pool always has at least 1 strong option
  if (effectivePool.length === 0) {
    effectivePool.push('immunotherapy', 'radiotherapy', 'chemotherapy');
  }

  const allActive: TherapyId[] = [
    'surgery',
    'radiotherapy',
    'chemotherapy',
    'egfr_tki',
    'cdk46_inhibitor',
    'pi3k_inhibitor',
    'immunotherapy',
    'combo_targeted_chemo',
  ];
  for (const t of allActive) {
    if (!effectivePool.includes(t)) contrastingPool.push(t);
  }

  const chosen: TherapyId[] = [];
  const pickUnique = (pool: TherapyId[]) => {
    const fresh = pool.filter((id) => !chosen.includes(id));
    if (fresh.length === 0) return;
    // Slightly prefer therapies not used in the immediate previous turn
    const lastUsed = usedTherapies[usedTherapies.length - 1];
    const nonRepeat = fresh.filter((id) => id !== lastUsed);
    const source = nonRepeat.length > 0 ? nonRepeat : fresh;
    chosen.push(shuffleWithRng(source, rng)[0]);
  };

  if (clinical.cumulativeToxicity >= 45 || clinical.qualityOfLife <= 48) {
    pickUnique(supportivePool);
    pickUnique(effectivePool);
    pickUnique([...contrastingPool, ...effectivePool]);
  } else {
    pickUnique(effectivePool);
    pickUnique(contrastingPool.length > 0 ? contrastingPool : effectivePool);
    const thirdPool =
      rng() > 0.25 ? [...effectivePool, ...contrastingPool] : [...supportivePool, ...effectivePool];
    pickUnique(thirdPool);
  }

  // Fallback fill to always have exactly 3 distinct doors
  for (const fallback of shuffleWithRng([...allActive, ...supportivePool], rng)) {
    if (chosen.length >= 3) break;
    if (!chosen.includes(fallback)) chosen.push(fallback);
  }

  return shuffleWithRng(chosen.slice(0, 3), rng);
}

/**
 * Generates a freshly randomized, biologically progressive RoundOffer for the given round.
 * - Everyone starts identically at Round 1, then forks by choosing 1 of 3 randomized problems.
 * - Subsequent rounds draw from unacquired problems in progressively deeper biological tiers,
 *   randomizing both which forks appear and their Left/Center/Right door placement!
 */
export function generateRoundOffer(params: {
  roundNumber: number;
  clones: TumorClone[];
  clinical: ClinicalState;
  accumulatedProblems: AccumulatedProblem[];
  usedTherapies: TherapyId[];
  completedDiagnostics?: DiagnosticToolId[];
  oncologistStartStage?: OncologistStartStage;
  rng: () => number;
}): RoundOffer {
  const {
    roundNumber,
    clones,
    clinical,
    accumulatedProblems,
    usedTherapies,
    completedDiagnostics = [],
    oncologistStartStage = 'early',
    rng,
  } = params;
  const acquiredIds = new Set(accumulatedProblems.map((p) => p.id));

  const barrier = selectBarrierForRound(roundNumber, accumulatedProblems, rng);
  const oncologistPhase = getOncologistRoundPhase(roundNumber);

  // Choose eligible tier pool so problems progressively compound (R1: Tier 1; R2: Tier 1-2; R3+: All tiers, favoring unacquired higher tiers)
  const maxTier: 1 | 2 | 3 = roundNumber === 1 ? 1 : roundNumber === 2 ? 2 : 3;
  let eligible = PROBLEM_CATALOG.filter((p) => p.tier <= maxTier && !acquiredIds.has(p.id));

  // If fewer than 3 remain in current tier cap, open higher tiers cleanly
  if (eligible.length < 3) {
    eligible = PROBLEM_CATALOG.filter((p) => !acquiredIds.has(p.id));
  }
  // If player has acquired almost all 14 problems (rounds 9-10), allow reinforcing late consolidation forks
  if (eligible.length < 3) {
    const rest = shuffleWithRng(
      PROBLEM_CATALOG.filter((p) => !eligible.some((e) => e.id === p.id)),
      rng
    );
    eligible = [...eligible, ...rest].slice(0, 3);
  }

  // Prefer at least one problem aligned with current physiological barrier when available, plus 2 randomized distinct forks!
  const barrierAligned = eligible.filter((p) => {
    if (barrier.barrierType === 'dna_damage')
      return p.geneSymbol === 'TP53' || p.geneSymbol === 'BCL2' || p.geneSymbol === 'BAX' || p.geneSymbol === 'ATM';
    if (barrier.barrierType === 'nutrient_restriction')
      return p.geneSymbol === 'VEGFA' || p.geneSymbol === 'PIK3CA' || p.geneSymbol === 'PTEN';
    if (barrier.barrierType === 'immune_surveillance')
      return p.geneSymbol === 'PDL1' || p.geneSymbol === 'MET' || p.geneSymbol === 'VEGFA';
    if (barrier.barrierType === 'therapeutic_adaptation')
      return p.geneSymbol === 'MET' || p.geneSymbol === 'VEGFA' || p.geneSymbol === 'PDL1' || p.geneSymbol === 'TP53' || p.geneSymbol === 'RB1';
    return p.tier === 1 || p.geneSymbol === 'RB1' || p.geneSymbol === 'PTEN' || p.geneSymbol === 'CDKN2A';
  });

  const pickedSpecs: ProgressiveProblemSpec[] = [];
  if (barrierAligned.length > 0) {
    pickedSpecs.push(shuffleWithRng(barrierAligned, rng)[0]);
  }
  for (const cand of shuffleWithRng(eligible, rng)) {
    if (pickedSpecs.length >= 3) break;
    if (!pickedSpecs.some((s) => s.id === cand.id)) {
      pickedSpecs.push(cand);
    }
  }

  // Shuffle final 3 doors so Left / Center / Right placement is randomized every single time!
  const orderedSpecs = shuffleWithRng(pickedSpecs, rng);

  const cancerStrategies: CancerStrategyOption[] = orderedSpecs.map((spec) => {
    const targetClone =
      clones.find((c) => c.id === spec.targetCloneSlot) ?? clones[0];
    return {
      id: `r${roundNumber}-${spec.id}`,
      label: spec.strategyTitle,
      shortDoorLogic: spec.shortDoorLogic,
      shortDoorPrecision: spec.shortDoorPrecision,
      cloneId: targetClone.id,
      originNote: spec.originNote,
      alterationSummary: spec.summary,
      advantage: spec.advantage,
      cost: spec.cost,
      recommendedContextHint: spec.contextHint,
      problemMutation: {
        id: spec.id,
        geneSymbol: spec.geneSymbol,
        geneState: spec.geneState,
        logicLabel: spec.logicLabel,
        precisionLabel: spec.precisionLabel,
        shortDoorLogic: spec.shortDoorLogic,
        shortDoorPrecision: spec.shortDoorPrecision,
        summary: spec.summary,
        hallmarkId: spec.hallmarkId,
      },
    };
  });

  const oncologistDoorDiagnostics = selectRandomizedOncologistDiagnostics(
    completedDiagnostics,
    roundNumber,
    rng
  );
  const oncologistDoorTherapies = selectRandomizedOncologistDoors(
    clones,
    clinical,
    usedTherapies,
    rng
  );

  const cancerPredictions = shuffleWithRng(
    buildCancerPredictionsForBarrier(barrier.barrierType, roundNumber),
    rng
  );
  const oncologistPredictions = shuffleWithRng(
    buildOncologistPredictionsForRound(roundNumber),
    rng
  );

  const round1OncologistPrompt =
    oncologistStartStage === 'surveillance'
      ? 'Se ha detectado una lesión muy pequeña bajo vigilancia inicial. ¿Qué quieres averiguar primero?'
      : oncologistStartStage === 'advanced'
        ? 'Se ha detectado un tumor en etapa avanzada con alta actividad. ¿Qué quieres averiguar primero?'
        : 'Se ha detectado un tumor pequeño. ¿Qué quieres averiguar primero?';

  const oncologistPrompt =
    oncologistPhase === 'diagnostic'
      ? roundNumber === 1
        ? round1OncologistPrompt
        : 'Antes de la siguiente intervención, elige qué quieres confirmar sobre el tumor o continúa en observación.'
      : 'Usa los hallazgos conocidos para elegir la intervención más adecuada, o mantén observación si prefieres recuperar al paciente.';

  return {
    roundNumber,
    title: barrier.title,
    barrierType: barrier.barrierType,
    cancerPrompt: barrier.cancerPrompt,
    oncologistPrompt,
    oncologistPhase,
    oncologistDoorDiagnostics,
    virtualOncologistTherapy: undefined,
    cancerStrategies,
    oncologistDoorTherapies,
    cancerPredictions,
    oncologistPredictions,
    stochasticNote:
      roundNumber >= 4
        ? 'Nota educativa: las puertas y predicciones se aleatorizan en cada encuentro para fomentar razonamiento biológico real en lugar de memorización.'
        : undefined,
  };
}

/**
 * Safely retrieves the active RoundOffer for the current round (or generates one deterministically if missing).
 */
export function getActiveRoundOffer(state: SimulationState): RoundOffer {
  const existing = state.roundOffers?.[state.currentRound];
  if (existing && existing.oncologistPhase && existing.oncologistDoorDiagnostics) {
    return existing;
  }
  const rng = createSeededRng((state.randomSeed || 1337) + state.currentRound * 7919);
  return generateRoundOffer({
    roundNumber: state.currentRound,
    clones: state.clones,
    clinical: state.clinical,
    accumulatedProblems: state.accumulatedProblems ?? [],
    usedTherapies: state.usedTherapies,
    completedDiagnostics: state.completedDiagnostics ?? [],
    oncologistStartStage: state.oncologistStartStage,
    rng,
  });
}
