import { getScenarioDisplayInfo } from './molecularAbstraction';
import { MolecularDetailMode, ScenarioId } from './types';

export const MIN_DECISION_ROUNDS = 3;
export const MAX_DECISION_ROUNDS = 10;
export const DECISION_ROUND_OPTIONS = [3, 4, 5, 6, 7, 8, 9, 10] as const;

export type DecisionRoundCount = (typeof DECISION_ROUND_OPTIONS)[number];

export interface DecisionTreeStep {
  round: number;
  label: string;
  detail: string;
  cancerRateAtStep: number; // 0..100
}

export interface DecisionTreeLeafOutcome {
  id: string;
  scenarioId: ScenarioId;
  variant: 'controlled' | 'aggressive';
  label: string;
  finalCancerRate: number; // 0..100
  riskLevel: 'Bajo' | 'Moderado' | 'Alto' | 'Crítico';
}

export interface DecisionTreeBranch {
  scenarioId: ScenarioId;
  branchIndex: number; // 1..4
  shortTitle: string;
  subtitle: string;
  steps: DecisionTreeStep[];
  outcomes: [DecisionTreeLeafOutcome, DecisionTreeLeafOutcome];
  minCancerRate: number;
  maxCancerRate: number;
}

export interface DecisionTreeModel {
  roundCount: DecisionRoundCount;
  rootLabel: string;
  rootRate: number;
  rootSubtitle: string;
  branches: DecisionTreeBranch[];
}

interface RawStepSpec {
  logicLabel: string;
  precisionLabel: string;
  logicDetail: string;
  precisionDetail: string;
  rate: number;
}

interface RawBranchSpec {
  scenarioId: ScenarioId;
  branchIndex: number;
  logicTitle: string;
  precisionTitle: string;
  logicSubtitle: string;
  precisionSubtitle: string;
  controlledRatio: number; // fraction of aggressive rate when successfully contained
  controlledLogic: string;
  controlledPrecision: string;
  aggressiveLogic: string;
  aggressivePrecision: string;
  steps: RawStepSpec[]; // 10 canonical rounds starting from healthy cell (0%)
}

const RAW_BRANCHES: RawBranchSpec[] = [
  {
    scenarioId: 'A',
    branchIndex: 1,
    logicTitle: 'Señal de membrana',
    precisionTitle: 'Vía EGFR↑',
    logicSubtitle: 'Empieza dependiendo de receptores externos; puede escapar por vías paralelas.',
    precisionSubtitle: 'Impulsada por EGFR↑; escapa si se expanden subclones PTEN✕ o MET↑.',
    controlledRatio: 0.5,
    controlledLogic: 'Control con bloqueo dirigido',
    controlledPrecision: 'Respuesta a anti-EGFR / PI3K',
    aggressiveLogic: 'Escape por vía paralela',
    aggressivePrecision: 'Escape PTEN✕ / MET↑ / PD-L1↑',
    steps: [
      {
        logicLabel: 'Receptor activo',
        precisionLabel: 'EGFR↑',
        logicDetail: 'La célula recibe señal continua de crecimiento.',
        precisionDetail: 'Mutación activadora en el receptor EGFR.',
        rate: 16,
      },
      {
        logicLabel: 'Sin freno metab.',
        precisionLabel: 'PTEN✕',
        logicDetail: 'Pierde el freno que modera supervivencia y nutrientes.',
        precisionDetail: 'Pérdida del supresor PTEN activa supervivencia PI3K.',
        rate: 30,
      },
      {
        logicLabel: 'Vía paralela',
        precisionLabel: 'MET↑',
        logicDetail: 'Activa una ruta alterna cuando se bloquea la principal.',
        precisionDetail: 'Amplificación de MET genera bypass del bloqueo EGFR.',
        rate: 46,
      },
      {
        logicLabel: 'Evasión inmune',
        precisionLabel: 'PD-L1↑',
        logicDetail: 'Frena la respuesta de las defensas inmunes locales.',
        precisionDetail: 'Expresión de PD-L1 evade linfocitos T citotóxicos.',
        rate: 60,
      },
      {
        logicLabel: 'Angiogénesis↑',
        precisionLabel: 'VEGFA↑',
        logicDetail: 'Induce nuevos vasos para sostener el crecimiento.',
        precisionDetail: 'Inducción vascular sostenida por VEGFA↑.',
        rate: 70,
      },
      {
        logicLabel: 'Escape dual',
        precisionLabel: 'MET↑/PDL1↑',
        logicDetail: 'Combina vía alterna con bloqueo inmune.',
        precisionDetail: 'Persistencia resistente combinada MET↑ y PD-L1↑.',
        rate: 78,
      },
      {
        logicLabel: 'Plasticidad↑',
        precisionLabel: 'Bypass RTK',
        logicDetail: 'Cambia de estado para tolerar tratamientos sucesivos.',
        precisionDetail: 'Reprogramación de señalización paralela.',
        rate: 84,
      },
      {
        logicLabel: 'Invasión local',
        precisionLabel: 'Invasión MET↑',
        logicDetail: 'Rompe barreras tisulares y ocupa tejido vecino.',
        precisionDetail: 'Movilidad e invasión tisular impulsada por MET↑.',
        rate: 89,
      },
      {
        logicLabel: 'Diseminación',
        precisionLabel: 'Nicho distal',
        logicDetail: 'Células resistentes colonizan focos alejados.',
        precisionDetail: 'Siembra sistémica con evasión inmune PD-L1↑.',
        rate: 93,
      },
      {
        logicLabel: 'Colonización',
        precisionLabel: 'Resistencia total',
        logicDetail: 'Dominio sostenido con múltiples rutas de escape.',
        precisionDetail: 'Resistencia multiclonal EGFR↑/PTEN✕/MET↑.',
        rate: 96,
      },
    ],
  },
  {
    scenarioId: 'B',
    branchIndex: 2,
    logicTitle: 'Señal autónoma',
    precisionTitle: 'Vía KRAS↑',
    logicSubtitle: 'Se divide sin necesitar señales externas y pierde el freno principal del ciclo.',
    precisionSubtitle: 'KRAS↑ autónomo junto a RB1✕ bloquea terapias de receptor y ciclo.',
    controlledRatio: 0.6,
    controlledLogic: 'Contención clínica exigente',
    controlledPrecision: 'Control con inmuno/citotóxica',
    aggressiveLogic: 'Expansión autónoma agresiva',
    aggressivePrecision: 'Escape KRAS↑/RB1✕/BCL2↑',
    steps: [
      {
        logicLabel: 'Señal autónoma',
        precisionLabel: 'KRAS↑',
        logicDetail: 'Dispara proliferación interna sin esperar estímulos.',
        precisionDetail: 'Activación constitutiva distal de KRAS.',
        rate: 24,
      },
      {
        logicLabel: 'Sin freno G1/S',
        precisionLabel: 'RB1✕',
        logicDetail: 'Pierde el punto de control que detiene la división.',
        precisionDetail: 'Inactivación de RB1 elimina el freno G1/S.',
        rate: 42,
      },
      {
        logicLabel: 'Escudo apoptosis',
        precisionLabel: 'BCL2↑',
        logicDetail: 'Resiste señales internas de muerte celular programada.',
        precisionDetail: 'Sobreexpresión antiapoptótica de BCL2.',
        rate: 58,
      },
      {
        logicLabel: 'Vasos + inmune',
        precisionLabel: 'VEGFA↑/PDL1↑',
        logicDetail: 'Induce vasos sanguíneos y reduce detección inmune.',
        precisionDetail: 'Angiogénesis por VEGFA↑ y evasión por PD-L1↑.',
        rate: 72,
      },
      {
        logicLabel: 'Rebote autónomo',
        precisionLabel: 'KRAS↑/RB1✕',
        logicDetail: 'Expansión rápida con alta resistencia intrínseca.',
        precisionDetail: 'Rebote agresivo del clon KRAS↑ + RB1✕.',
        rate: 81,
      },
      {
        logicLabel: 'Metabolismo↑',
        precisionLabel: 'Glucólisis↑',
        logicDetail: 'Acapara nutrientes aun en hipoxia severa.',
        precisionDetail: 'Reprogramación metabólica sostenida por KRAS↑.',
        rate: 87,
      },
      {
        logicLabel: 'Latencia escudo',
        precisionLabel: 'Refugio BCL2↑',
        logicDetail: 'Sobrevive a ciclos intensos de terapia citotóxica.',
        precisionDetail: 'Persistencia antiapoptótica mediada por BCL2↑.',
        rate: 91,
      },
      {
        logicLabel: 'Invasión rápida',
        precisionLabel: 'Invasión distal',
        logicDetail: 'Expansión acelerada más allá del órgano de origen.',
        precisionDetail: 'Progresión invasiva con pérdida del control G1/S.',
        rate: 94,
      },
      {
        logicLabel: 'Focos múltiples',
        precisionLabel: 'Diseminación',
        logicDetail: 'Múltiples subclones resistentes coexisten en tejidos.',
        precisionDetail: 'Diseminación heterogénea KRAS↑/PD-L1↑.',
        rate: 97,
      },
      {
        logicLabel: 'Dominio pleno',
        precisionLabel: 'Autonomía total',
        logicDetail: 'Máxima independencia de controles del organismo.',
        precisionDetail: 'Colonización refractaria KRAS↑/RB1✕/BCL2↑.',
        rate: 99,
      },
    ],
  },
  {
    scenarioId: 'C',
    branchIndex: 3,
    logicTitle: 'Supervivencia activa',
    precisionTitle: 'Vía PIK3CA↑',
    logicSubtitle: 'Refuerza el metabolismo celular y pierde el guardián frente al daño del ADN.',
    precisionSubtitle: 'PIK3CA↑ + TP53✕ atenúa la apoptosis por daño genómico y acelera escape.',
    controlledRatio: 0.56,
    controlledLogic: 'Control metabólico sostenido',
    controlledPrecision: 'Control con anti-PI3K / inmuno',
    aggressiveLogic: 'Inestabilidad y escape inmune',
    aggressivePrecision: 'Escape PIK3CA↑/TP53✕/KRAS↑',
    steps: [
      {
        logicLabel: 'Supervivencia↑',
        precisionLabel: 'PIK3CA↑',
        logicDetail: 'Eleva metabolismo y resistencia al estrés celular.',
        precisionDetail: 'Activación de PIK3CA impulsa cascada PI3K/AKT.',
        rate: 20,
      },
      {
        logicLabel: 'Sin guardián ADN',
        precisionLabel: 'TP53✕',
        logicDetail: 'Tolera daños genómicos sin detener el ciclo ni morir.',
        precisionDetail: 'Pérdida de TP53 debilita la respuesta al daño al ADN.',
        rate: 38,
      },
      {
        logicLabel: 'Bypass distal↑',
        precisionLabel: 'KRAS↑',
        logicDetail: 'Emerge una vía alterna que mantiene la división.',
        precisionDetail: 'Subclon KRAS↑ sostiene proliferación paralela.',
        rate: 54,
      },
      {
        logicLabel: 'Evasión inmune',
        precisionLabel: 'PD-L1↑',
        logicDetail: 'Bloquea el ataque inmune pese a la alta mutación.',
        precisionDetail: 'Subclon PD-L1↑ evade vigilancia inmune.',
        rate: 68,
      },
      {
        logicLabel: 'Inestabilidad↑',
        precisionLabel: 'PIK3CA↑/TP53✕',
        logicDetail: 'Alta diversidad celular y resistencia a quimioterapia.',
        precisionDetail: 'Persistencia clonal con fallo de TP53.',
        rate: 78,
      },
      {
        logicLabel: 'Daño tolerado',
        precisionLabel: 'Mutagénesis↑',
        logicDetail: 'Acumula variantes sin activar muerte celular.',
        precisionDetail: 'Inestabilidad genómica sostenida sin TP53.',
        rate: 84,
      },
      {
        logicLabel: 'Vasos + energía',
        precisionLabel: 'VEGFA↑/PI3K↑',
        logicDetail: 'Combina irrigación vascular con metabolismo anabólico.',
        precisionDetail: 'Eje PI3K/AKT potencia angiogénesis VEGFA↑.',
        rate: 89,
      },
      {
        logicLabel: 'Clones mixtos',
        precisionLabel: 'Heterogeneidad',
        logicDetail: 'Subclones distintos escapan a terapias aisladas.',
        precisionDetail: 'Coexistencia de subclones PIK3CA↑, KRAS↑ y PD-L1↑.',
        rate: 93,
      },
      {
        logicLabel: 'Extensión distal',
        precisionLabel: 'Focos distales',
        logicDetail: 'Expansión sostenida con baja respuesta a citotóxicos.',
        precisionDetail: 'Progresión sistémica refractaria a daño ADN.',
        rate: 96,
      },
      {
        logicLabel: 'Cáncer avanzado',
        precisionLabel: 'Escape global',
        logicDetail: 'Alta diversidad evolutiva y colonización tisular.',
        precisionDetail: 'Dominio clonal avanzado PIK3CA↑/TP53✕.',
        rate: 98,
      },
    ],
  },
  {
    scenarioId: 'D',
    branchIndex: 4,
    logicTitle: 'Ciclo acelerado',
    precisionTitle: 'Vía CDK6↑',
    logicSubtitle: 'Acelera la entrada al ciclo y reduce la apoptosis, pero conserva un freno explotable.',
    precisionSubtitle: 'CDK6↑ + BAX✕ acelera división; conservar RB1 abre ventana para anti-CDK4/6.',
    controlledRatio: 0.51,
    controlledLogic: 'Freno del ciclo efectivo',
    controlledPrecision: 'Control con RB1 intacto',
    aggressiveLogic: 'Ciclo sin frenos ni apoptosis',
    aggressivePrecision: 'Escape RB1✕/BAX✕/PD-L1↑',
    steps: [
      {
        logicLabel: 'Motor ciclo↑',
        precisionLabel: 'CDK6↑',
        logicDetail: 'Impulsa a la célula a dividirse con mayor frecuencia.',
        precisionDetail: 'Hiperactivación de CDK6 acelera transición G1/S.',
        rate: 17,
      },
      {
        logicLabel: 'Apoptosis baja',
        precisionLabel: 'BAX✕',
        logicDetail: 'Dificulta la muerte celular programada interna.',
        precisionDetail: 'Pérdida de BAX frena la vía apoptótica mitocondrial.',
        rate: 33,
      },
      {
        logicLabel: 'Sin freno G1/S',
        precisionLabel: 'RB1✕',
        logicDetail: 'Si pierde este freno, deja de responder al bloqueo del ciclo.',
        precisionDetail: 'Subclon RB1✕ genera resistencia a anti-CDK4/6.',
        rate: 49,
      },
      {
        logicLabel: 'Vasos + inmune',
        precisionLabel: 'VEGFA↑/PDL1↑',
        logicDetail: 'Asegura nutrientes y evade vigilancia inmune.',
        precisionDetail: 'Expansión vascular VEGFA↑ con evasión PD-L1↑.',
        rate: 64,
      },
      {
        logicLabel: 'Ciclo autónomo',
        precisionLabel: 'RB1✕/BAX✕',
        logicDetail: 'División sostenida resistente a muerte intrínseca.',
        precisionDetail: 'Persistencia clonal RB1✕ + BAX✕.',
        rate: 74,
      },
      {
        logicLabel: 'Rebote mitótico',
        precisionLabel: 'CDK6↑/BAX✕',
        logicDetail: 'Recupera velocidad de división al cesar el bloqueo.',
        precisionDetail: 'Reexpansión rápida de clones con BAX✕.',
        rate: 81,
      },
      {
        logicLabel: 'Inmortalidad↑',
        precisionLabel: 'Sin senescencia',
        logicDetail: 'Evita envejecimiento replicativo tras múltiples ciclos.',
        precisionDetail: 'Pérdida de arresto replicativo G1/S.',
        rate: 86,
      },
      {
        logicLabel: 'Expansión local',
        precisionLabel: 'Masa densa',
        logicDetail: 'Alta densidad celular con baja tasa de muerte.',
        precisionDetail: 'Crecimiento sostenido resistente a apoptosis intrínseca.',
        rate: 90,
      },
      {
        logicLabel: 'Escape inmune',
        precisionLabel: 'PD-L1↑ alto',
        logicDetail: 'Bloquea también la eliminación por vía inmune.',
        precisionDetail: 'Consolidación inmune PD-L1↑ junto a RB1✕.',
        rate: 94,
      },
      {
        logicLabel: 'Progresión plena',
        precisionLabel: 'Refractario G1/S',
        logicDetail: 'Ciclo desregulado con resistencia multivía.',
        precisionDetail: 'Dominio resistente CDK6↑/RB1✕/BAX✕.',
        rate: 97,
      },
    ],
  },
];

export function clampDecisionRoundCount(value: number): DecisionRoundCount {
  const clamped = Math.max(MIN_DECISION_ROUNDS, Math.min(MAX_DECISION_ROUNDS, Math.round(value)));
  return clamped as DecisionRoundCount;
}

export function classifyCancerRisk(rate: number): DecisionTreeLeafOutcome['riskLevel'] {
  if (rate < 40) return 'Bajo';
  if (rate < 65) return 'Moderado';
  if (rate < 82) return 'Alto';
  return 'Crítico';
}

export function getBranchShortTitle(
  scenarioId: ScenarioId,
  detail: MolecularDetailMode
): string {
  const raw = RAW_BRANCHES.find((b) => b.scenarioId === scenarioId);
  if (!raw) return getScenarioDisplayInfo(scenarioId, detail).title;
  return detail === 'precision' ? raw.precisionTitle : raw.logicTitle;
}

/**
 * Builds the progressive Decision Tree starting from a Healthy Cell (0% cancer rate)
 * across `roundCount` (3 to 10) decision rounds to final estimated cancer rates.
 */
export function buildDecisionTree(
  roundCountInput: number,
  detail: MolecularDetailMode
): DecisionTreeModel {
  const roundCount = clampDecisionRoundCount(roundCountInput);

  const branches: DecisionTreeBranch[] = RAW_BRANCHES.map((raw) => {
    const steps: DecisionTreeStep[] = raw.steps.slice(0, roundCount).map((s, idx) => ({
      round: idx + 1,
      label: detail === 'precision' ? s.precisionLabel : s.logicLabel,
      detail: detail === 'precision' ? s.precisionDetail : s.logicDetail,
      cancerRateAtStep: s.rate,
    }));

    const peakStepRate = steps[steps.length - 1]?.cancerRateAtStep ?? 50;
    const aggressiveRate = Math.min(
      99,
      peakStepRate + Math.max(1, Math.round((100 - peakStepRate) * 0.28))
    );
    const controlledRate = Math.max(
      18,
      Math.min(aggressiveRate - 14, Math.round(aggressiveRate * raw.controlledRatio))
    );

    const controlled: DecisionTreeLeafOutcome = {
      id: `${raw.scenarioId}-controlled`,
      scenarioId: raw.scenarioId,
      variant: 'controlled',
      label: detail === 'precision' ? raw.controlledPrecision : raw.controlledLogic,
      finalCancerRate: controlledRate,
      riskLevel: classifyCancerRisk(controlledRate),
    };
    const aggressive: DecisionTreeLeafOutcome = {
      id: `${raw.scenarioId}-aggressive`,
      scenarioId: raw.scenarioId,
      variant: 'aggressive',
      label: detail === 'precision' ? raw.aggressivePrecision : raw.aggressiveLogic,
      finalCancerRate: aggressiveRate,
      riskLevel: classifyCancerRisk(aggressiveRate),
    };

    return {
      scenarioId: raw.scenarioId,
      branchIndex: raw.branchIndex,
      shortTitle: detail === 'precision' ? raw.precisionTitle : raw.logicTitle,
      subtitle: detail === 'precision' ? raw.precisionSubtitle : raw.logicSubtitle,
      steps,
      outcomes: [controlled, aggressive],
      minCancerRate: Math.min(controlled.finalCancerRate, aggressive.finalCancerRate),
      maxCancerRate: Math.max(controlled.finalCancerRate, aggressive.finalCancerRate),
    };
  });

  return {
    roundCount,
    rootLabel: 'Célula sana',
    rootRate: 0,
    rootSubtitle: 'Controles activos · 0% cáncer',
    branches,
  };
}
