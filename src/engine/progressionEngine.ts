import {
  AccumulatedProblem,
  CancerStrategyOption,
  ClinicalState,
  GeneState,
  HallmarkId,
  OrganismDefenses,
  PredictionOption,
  RoundDefinition,
  RoundOffer,
  SimulationState,
  TherapyId,
  TumorClone,
} from './types';

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
    logicLabel: 'Receptor de crecimiento hiperactivo',
    precisionLabel: 'Amplificación EGFR↑',
    shortDoorLogic: 'Señal membrana',
    shortDoorPrecision: 'Impulso EGFR↑',
    strategyTitle: 'Amplificar señal del receptor de membrana (EGFR↑)',
    summary: 'Multiplica la respuesta a señales de crecimiento con bajo gasto energético inicial.',
    advantage: 'Acelera la división temprana sin agotar de inmediato los nutrientes del entorno.',
    cost: 'Sigue dependiendo de señales externas del tejido y de frenos celulares intactos.',
    contextHint: 'Impulsa proliferación temprana, pero no rompe por sí sola los controles del ciclo.',
    hallmarkId: 'proliferative_signaling',
    targetCloneSlot: 'clone-founder',
    originNote: 'expansion_basal',
    deltaProlif: 14,
    deltaApopSens: -2,
    deltaGrowthDep: -8,
    deltaMetabolicCost: 4,
    deltaImmuneVis: 0,
    vulnerabilityNote: 'Dependencia de señales de membrana y frenos supresores intactos',
  },
  {
    id: 'prob-kras',
    tier: 1,
    geneSymbol: 'KRAS',
    geneState: 'activated',
    logicLabel: 'Señal mitogénica distal autónoma',
    precisionLabel: 'Activación KRAS↑',
    shortDoorLogic: 'Señal autónoma',
    shortDoorPrecision: 'Bypass KRAS↑',
    strategyTitle: 'Activar señalización distal autónoma (KRAS↑)',
    summary: 'Dispara la cascada proliferativa interna sin esperar factores de crecimiento del tejido.',
    advantage: 'Mantiene la división activa incluso cuando escasean los estímulos externos de membrana.',
    cost: 'Aumenta el estrés replicativo y eleva el consumo de glucosa y oxígeno.',
    contextHint: 'Otorga autonomía proliferativa temprana, pero incrementa el estrés replicativo.',
    hallmarkId: 'proliferative_signaling',
    targetCloneSlot: 'clone-founder',
    originNote: 'preexistente',
    deltaProlif: 18,
    deltaApopSens: -4,
    deltaGrowthDep: -42,
    deltaMetabolicCost: 14,
    deltaImmuneVis: 4,
    vulnerabilityNote: 'Mayor estrés replicativo y alta demanda de glucosa y oxígeno',
  },
  {
    id: 'prob-pik3ca',
    tier: 1,
    geneSymbol: 'PIK3CA',
    geneState: 'activated',
    logicLabel: 'Cascada de supervivencia y metabolismo',
    precisionLabel: 'Activación PIK3CA↑',
    shortDoorLogic: 'Supervivencia↑',
    shortDoorPrecision: 'Eje PIK3CA↑',
    strategyTitle: 'Activar eje anabólico de supervivencia (PIK3CA↑)',
    summary: 'Potencia la captación de nutrientes y amortigua las señales de muerte por estrés celular.',
    advantage: 'Mejora la supervivencia ante escasez moderada de nutrientes y estrés proliferativo.',
    cost: 'Eleva la demanda metabólica sostenida para mantener la síntesis celular.',
    contextHint: 'Refuerza metabolismo y supervivencia cuando el microambiente restringe recursos.',
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
    logicLabel: 'Motor acelerado del ciclo celular',
    precisionLabel: 'Activación CDK6↑',
    shortDoorLogic: 'Motor ciclo↑',
    shortDoorPrecision: 'Motor CDK6↑',
    strategyTitle: 'Acelerar entrada al ciclo celular (CDK6↑)',
    summary: 'Empuja el paso G1/S con mayor frecuencia acortando el tiempo entre divisiones.',
    advantage: 'Rápida expansión clonal mientras el tejido no detiene el ciclo celular.',
    cost: 'Si el freno G1/S sigue intacto, las señales antiproliferativas del tejido aún pueden frenarla.',
    contextHint: 'Acelera la mitosis, aunque sigue expuesta a controles intactos del ciclo y del ADN.',
    hallmarkId: 'evading_growth_suppressors',
    targetCloneSlot: 'clone-sub-a',
    originNote: 'preexistente',
    deltaProlif: 16,
    deltaApopSens: 2,
    deltaGrowthDep: -14,
    deltaMetabolicCost: 10,
    deltaImmuneVis: 2,
    vulnerabilityNote: 'Sensible a señales antiproliferativas mientras RB1 permanezca intacto',
  },

  // TIER 2: Loss of tumor suppressors & DNA damage checkpoints
  {
    id: 'prob-pten',
    tier: 2,
    geneSymbol: 'PTEN',
    geneState: 'inactivated',
    logicLabel: 'Pérdida del freno metabólico',
    precisionLabel: 'Pérdida PTEN✕',
    shortDoorLogic: 'Sin freno metab.',
    shortDoorPrecision: 'Pérdida PTEN✕',
    strategyTitle: 'Perder el freno supresor metabólico (PTEN✕)',
    summary: 'Desinhibe la señal de supervivencia interna incluso cuando caen los estímulos del tejido.',
    advantage: 'Sostiene la supervivencia celular y reduce la apoptosis ante señales restrictivas.',
    cost: 'Eleva el gasto energético basal y acelera el agotamiento local de nutrientes.',
    contextHint: 'Permite resistir la falta de factores externos de crecimiento a costa de mayor consumo.',
    hallmarkId: 'evading_growth_suppressors',
    targetCloneSlot: 'clone-sub-a',
    originNote: 'preexistente',
    deltaProlif: 10,
    deltaApopSens: -18,
    deltaGrowthDep: -24,
    deltaMetabolicCost: 14,
    deltaImmuneVis: -6,
    vulnerabilityNote: 'Alto gasto energético y vulnerabilidad ante hipoxia prolongada',
  },
  {
    id: 'prob-rb1',
    tier: 2,
    geneSymbol: 'RB1',
    geneState: 'inactivated',
    logicLabel: 'Pérdida del freno del ciclo G1/S',
    precisionLabel: 'Inactivación RB1✕',
    shortDoorLogic: 'Sin freno G1/S',
    shortDoorPrecision: 'Pérdida RB1✕',
    strategyTitle: 'Inactivar el freno del punto de control G1/S (RB1✕)',
    summary: 'Elimina el retén principal que detiene la división celular frente a señales inhibidoras del tejido.',
    advantage: 'Ignora las señales antiproliferativas del entorno y acelera la progresión clonal.',
    cost: 'Incrementa el estrés replicativo y la acumulación de errores en el ADN.',
    contextHint: 'Rompe el freno del ciclo celular, aunque aumenta los errores al duplicar el ADN.',
    hallmarkId: 'evading_growth_suppressors',
    targetCloneSlot: 'clone-founder',
    originNote: 'emergente',
    deltaProlif: 16,
    deltaApopSens: 4,
    deltaGrowthDep: -20,
    deltaMetabolicCost: 10,
    deltaImmuneVis: 4,
    vulnerabilityNote: 'Mayor estrés replicativo y activación de alarmas de daño al ADN',
  },
  {
    id: 'prob-tp53',
    tier: 2,
    geneSymbol: 'TP53',
    geneState: 'inactivated',
    logicLabel: 'Pérdida del guardián del daño al ADN',
    precisionLabel: 'Inactivación TP53✕',
    shortDoorLogic: 'Sin guardián ADN',
    shortDoorPrecision: 'Pérdida TP53✕',
    strategyTitle: 'Inactivar el guardián frente al daño genómico (TP53✕)',
    summary: 'Reduce el arresto del ciclo y la muerte programada ante daño genético acumulado.',
    advantage: 'Tolera el estrés replicativo y las roturas del ADN mientras aumenta la diversidad clonal.',
    cost: 'No concede inmunidad absoluta; genera neoantígenos visibles para el sistema inmune.',
    contextHint: 'Modula varias capacidades a la vez, pero aumenta la visibilidad frente a linfocitos T.',
    hallmarkId: 'resisting_cell_death',
    targetCloneSlot: 'clone-founder',
    originNote: 'emergente',
    deltaProlif: 10,
    deltaApopSens: -24,
    deltaGrowthDep: -12,
    deltaMetabolicCost: 8,
    deltaImmuneVis: 10,
    vulnerabilityNote: 'Mayor carga mutacional y visibilidad para la vigilancia inmune',
  },
  {
    id: 'prob-cdkn2a',
    tier: 2,
    geneSymbol: 'CDKN2A',
    geneState: 'inactivated',
    logicLabel: 'Pérdida del freno de senescencia',
    precisionLabel: 'Pérdida CDKN2A✕',
    shortDoorLogic: 'Sin senescencia',
    shortDoorPrecision: 'Pérdida CDKN2A✕',
    strategyTitle: 'Suprimir el freno de senescencia celular (CDKN2A✕)',
    summary: 'Evita que las células entren en envejecimiento replicativo tras múltiples divisiones.',
    advantage: 'Sostiene proliferación prolongada sin detención por estrés oncogénico.',
    cost: 'Aumenta la dependencia de reparación del ADN y de aporte continuo de nutrientes.',
    contextHint: 'Evita la detención replicativa en clones que se dividen con rapidez.',
    hallmarkId: 'replicative_immortality',
    targetCloneSlot: 'clone-sub-a',
    originNote: 'preexistente',
    deltaProlif: 12,
    deltaApopSens: -8,
    deltaGrowthDep: -10,
    deltaMetabolicCost: 8,
    deltaImmuneVis: 2,
    vulnerabilityNote: 'Mayor vulnerabilidad a hipoxia y estrés genotóxico acumulado',
  },
  {
    id: 'prob-atm',
    tier: 2,
    geneSymbol: 'ATM',
    geneState: 'inactivated',
    logicLabel: 'Fallo del sensor de roturas de ADN',
    precisionLabel: 'Fallo ATM✕',
    shortDoorLogic: 'Sensor ADN roto',
    shortDoorPrecision: 'Fallo ATM✕',
    strategyTitle: 'Desactivar el sensor de roturas de ADN (ATM✕)',
    summary: 'Retrasa la activación de las respuestas de reparación y arresto ante roturas cromosómicas.',
    advantage: 'Permite continuar dividiéndose pese al estrés replicativo inicial.',
    cost: 'Aumenta la inestabilidad cromosómica y la exposición de antígenos anómalos.',
    contextHint: 'Silencia la alarma temprana del ADN a costa de mayor inestabilidad estructural.',
    hallmarkId: 'phenotypic_plasticity',
    targetCloneSlot: 'clone-sub-b',
    originNote: 'emergente',
    deltaProlif: 8,
    deltaApopSens: -12,
    deltaGrowthDep: -8,
    deltaMetabolicCost: 10,
    deltaImmuneVis: 8,
    vulnerabilityNote: 'Inestabilidad cromosómica y mayor visibilidad inmunológica',
  },

  // TIER 3: Apoptosis shields, bypass, angiogenesis & immune evasion
  {
    id: 'prob-bax',
    tier: 3,
    geneSymbol: 'BAX',
    geneState: 'inactivated',
    logicLabel: 'Pérdida del efector de apoptosis',
    precisionLabel: 'Inactivación BAX✕',
    shortDoorLogic: 'Apoptosis baja',
    shortDoorPrecision: 'Pérdida BAX✕',
    strategyTitle: 'Debilitar la apoptosis mitocondrial (BAX✕)',
    summary: 'Reduce la ejecución directa de la muerte celular programada desde la mitocondria.',
    advantage: 'Sobrevive mejor al estrés replicativo intenso y al daño interno del ADN.',
    cost: 'No impide la eliminación por linfocitos T ni el freno del ciclo celular.',
    contextHint: 'Protege contra la muerte intrínseca, pero sigue expuesta a defensas inmunológicas.',
    hallmarkId: 'resisting_cell_death',
    targetCloneSlot: 'clone-sub-a',
    originNote: 'preexistente',
    deltaProlif: 4,
    deltaApopSens: -24,
    deltaGrowthDep: -4,
    deltaMetabolicCost: 6,
    deltaImmuneVis: 0,
    vulnerabilityNote: 'Expuesta a destrucción extrínseca por linfocitos T y frenos del ciclo',
  },
  {
    id: 'prob-bcl2',
    tier: 3,
    geneSymbol: 'BCL2',
    geneState: 'activated',
    logicLabel: 'Escudo antiapoptótico activo',
    precisionLabel: 'Sobreexpresión BCL2↑',
    shortDoorLogic: 'Escudo apoptosis',
    shortDoorPrecision: 'Escudo BCL2↑',
    strategyTitle: 'Activar escudo antiapoptótico mitocondrial (BCL2↑)',
    summary: 'Secuestra proteínas proapoptóticas y eleva el umbral necesario para morir.',
    advantage: 'Alta supervivencia frente al daño al ADN y a la escasez aguda de nutrientes.',
    cost: 'Reduce la velocidad de división basal y eleva el costo de mantenimiento celular.',
    contextHint: 'Resiste mejor el estrés celular grave, aunque frena la tasa de división.',
    hallmarkId: 'resisting_cell_death',
    targetCloneSlot: 'clone-sub-a',
    originNote: 'preexistente',
    deltaProlif: -4,
    deltaApopSens: -28,
    deltaGrowthDep: -6,
    deltaMetabolicCost: 10,
    deltaImmuneVis: -2,
    vulnerabilityNote: 'Proliferación más lenta y vulnerable a vigilancia inmune',
  },
  {
    id: 'prob-met',
    tier: 3,
    geneSymbol: 'MET',
    geneState: 'activated',
    logicLabel: 'Receptor paralelo de invasión',
    precisionLabel: 'Amplificación MET↑',
    shortDoorLogic: 'Invasión paralela',
    shortDoorPrecision: 'Invasión MET↑',
    strategyTitle: 'Activar receptor paralelo de invasión tisular (MET↑)',
    summary: 'Reactiva señales mitogénicas por una vía alterna y favorece la migración hacia tejidos vecinos.',
    advantage: 'Supera los límites de contacto del tejido sano y potencia la invasión local.',
    cost: 'Elevado costo metabólico; compite mal si faltan oxígeno y nutrientes.',
    contextHint: 'Impulsa la invasión del tejido vecino, pero exige un aporte energético alto.',
    hallmarkId: 'invasion_metastasis',
    targetCloneSlot: 'clone-sub-b',
    originNote: 'emergente',
    deltaProlif: 12,
    deltaApopSens: -8,
    deltaGrowthDep: -28,
    deltaMetabolicCost: 16,
    deltaImmuneVis: 2,
    vulnerabilityNote: 'Alto costo energético bajo restricción de oxígeno y glucosa',
  },
  {
    id: 'prob-vegfa',
    tier: 3,
    geneSymbol: 'VEGFA',
    geneState: 'activated',
    logicLabel: 'Inducción de nuevos vasos sanguíneos',
    precisionLabel: 'Señal angiogénica VEGFA↑',
    shortDoorLogic: 'Angiogénesis↑',
    shortDoorPrecision: 'Vasos VEGFA↑',
    strategyTitle: 'Inducir nuevos vasos sanguíneos locales (VEGFA↑)',
    summary: 'Secreta factores vasculares que aportan oxígeno y nutrientes al núcleo tumoral.',
    advantage: 'Supera la hipoxia y sostiene la expansión de clones de alto metabolismo.',
    cost: 'Los vasos permeables facilitan la llegada de linfocitos del sistema inmune.',
    contextHint: 'Mitiga la restricción de oxígeno y nutrientes cuando la masa celular crece.',
    hallmarkId: 'inducing_vasculature',
    targetCloneSlot: 'clone-sub-b',
    originNote: 'emergente',
    deltaProlif: 10,
    deltaApopSens: -6,
    deltaGrowthDep: -10,
    deltaMetabolicCost: -12,
    deltaImmuneVis: 6,
    vulnerabilityNote: 'Mayor infiltración de linfocitos inmunes por vasos neoformados',
  },
  {
    id: 'prob-pdl1',
    tier: 3,
    geneSymbol: 'PDL1',
    geneState: 'activated',
    logicLabel: 'Evasión de linfocitos inmunes',
    precisionLabel: 'Expresión PD-L1↑',
    shortDoorLogic: 'Evasión inmune',
    shortDoorPrecision: 'Escape PD-L1↑',
    strategyTitle: 'Expresar señal inhibidora de linfocitos T (PD-L1↑)',
    summary: 'Frena la destrucción citotóxica mediada por el sistema inmune del organismo.',
    advantage: 'Reduce drásticamente la eliminación celular bajo vigilancia inmunológica.',
    cost: 'Consumo metabólico adicional con bajo impulso proliferativo directo.',
    contextHint: 'Protege a la población frente al ataque de linfocitos T del organismo.',
    hallmarkId: 'avoiding_immune_destruction',
    targetCloneSlot: 'clone-sub-b',
    originNote: 'emergente',
    deltaProlif: 4,
    deltaApopSens: -8,
    deltaGrowthDep: -4,
    deltaMetabolicCost: 8,
    deltaImmuneVis: -36,
    vulnerabilityNote: 'Menor velocidad proliferativa basal y gasto metabólico sostenido',
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
 * Picks 3 randomized, clinically contrasting therapies for the 3D Labyrinth doors
 * based on the live accumulated tumor state (NO fixed 4-scenario logic!).
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
  const conservativePool: TherapyId[] = ['active_surveillance', 'palliative_care'];

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
    pickUnique(conservativePool);
    pickUnique(effectivePool);
    pickUnique([...conservativePool, ...contrastingPool, ...effectivePool]);
  } else {
    pickUnique(effectivePool);
    pickUnique(contrastingPool.length > 0 ? contrastingPool : effectivePool);
    // 3rd door randomly draws between another active mechanism or conservative/support
    const thirdPool =
      rng() > 0.45 ? [...effectivePool, ...contrastingPool] : [...conservativePool, ...effectivePool];
    pickUnique(thirdPool);
  }

  // Fallback fill to always have exactly 3 distinct doors
  for (const fallback of shuffleWithRng([...allActive, ...conservativePool], rng)) {
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
  rng: () => number;
}): RoundOffer {
  const { roundNumber, clones, clinical, accumulatedProblems, usedTherapies, rng } = params;
  const acquiredIds = new Set(accumulatedProblems.map((p) => p.id));

  const barrier = selectBarrierForRound(roundNumber, accumulatedProblems, rng);

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

  return {
    roundNumber,
    title: barrier.title,
    barrierType: barrier.barrierType,
    cancerPrompt: barrier.cancerPrompt,
    oncologistPrompt: barrier.oncologistPrompt,
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
  if (existing) return existing;
  const rng = createSeededRng((state.randomSeed || 1337) + state.currentRound * 7919);
  return generateRoundOffer({
    roundNumber: state.currentRound,
    clones: state.clones,
    clinical: state.clinical,
    accumulatedProblems: state.accumulatedProblems ?? [],
    usedTherapies: state.usedTherapies,
    rng,
  });
}
