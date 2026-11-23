import { SCENARIOS } from './scenarios';
import {
  GeneDefinition,
  MolecularDetailMode,
  ScenarioId,
  TherapyId,
  TherapyRule,
} from './types';

export interface ProcessDescriptor {
  title: string;
  shortTitle: string;
  capabilityGroup: string;
}

/**
 * Pure process-and-capability mapping for "Lógica molecular" mode (zero explicit gene names).
 */
export const GENE_TO_PROCESS_MAP: Record<string, ProcessDescriptor> = {
  EGFR: {
    title: 'Receptor de señal mitogénica',
    shortTitle: 'Receptor mitog.',
    capabilityGroup: 'Señalización proliferativa',
  },
  KRAS: {
    title: 'Interruptor distal de proliferación',
    shortTitle: 'Interruptor distal',
    capabilityGroup: 'Señalización proliferativa',
  },
  PIK3CA: {
    title: 'Eje de supervivencia y metabolismo',
    shortTitle: 'Eje supervivencia',
    capabilityGroup: 'Supervivencia y metabolismo',
  },
  PTEN: {
    title: 'Freno lipídico de supervivencia',
    shortTitle: 'Freno supervivencia',
    capabilityGroup: 'Supresión de crecimiento',
  },
  RB1: {
    title: 'Freno del punto de control G1/S',
    shortTitle: 'Freno G1/S',
    capabilityGroup: 'Control del ciclo celular',
  },
  CDK6: {
    title: 'Motor de entrada al ciclo celular',
    shortTitle: 'Motor ciclo',
    capabilityGroup: 'Control del ciclo celular',
  },
  CDKN2A: {
    title: 'Freno del motor del ciclo',
    shortTitle: 'Freno motor',
    capabilityGroup: 'Supresión de crecimiento',
  },
  ATM: {
    title: 'Sensor de daño al ADN',
    shortTitle: 'Sensor daño ADN',
    capabilityGroup: 'Detección y reparación',
  },
  TP53: {
    title: 'Guardián del daño genómico',
    shortTitle: 'Guardián genómico',
    capabilityGroup: 'Respuesta al daño y apoptosis',
  },
  BAX: {
    title: 'Efector de muerte programada',
    shortTitle: 'Efector apoptosis',
    capabilityGroup: 'Apoptosis intrínseca',
  },
  BCL2: {
    title: 'Escudo anti-apoptótico',
    shortTitle: 'Escudo celular',
    capabilityGroup: 'Resistencia a muerte celular',
  },
  MET: {
    title: 'Receptor de escape paralelo',
    shortTitle: 'Vía paralela',
    capabilityGroup: 'Bypass proliferativo',
  },
  VEGFA: {
    title: 'Señal de angiogénesis',
    shortTitle: 'Angiogénesis',
    capabilityGroup: 'Inducción vascular',
  },
  PDL1: {
    title: 'Señal de evasión inmune',
    shortTitle: 'Evasión inmune',
    capabilityGroup: 'Escape inmunológico',
  },
  CD274: {
    title: 'Señal de evasión inmune',
    shortTitle: 'Evasión inmune',
    capabilityGroup: 'Escape inmunológico',
  },
  MYC: {
    title: 'Amplificador metabólico y mitótico',
    shortTitle: 'Amplificador',
    capabilityGroup: 'Metabolismo y proliferación',
  },
};

export const SCENARIO_LOGIC_SUMMARIES: Record<
  ScenarioId,
  { alterationsLabel: string; title: string }
> = {
  UNIFIED: {
    title: 'Progresión celular bifurcada',
    alterationsLabel: 'Inicio único · alteraciones acumulables',
  },
  A: {
    title: 'Señal mitogénica de membrana y vía de escape',
    alterationsLabel: 'Receptor mitogénico↑ · Freno supervivencia✕',
  },
  B: {
    title: 'Proliferación distal autónoma sin freno de ciclo',
    alterationsLabel: 'Interruptor distal↑ · Freno G1/S✕',
  },
  C: {
    title: 'Supervivencia metabólica sin guardián genómico',
    alterationsLabel: 'Eje supervivencia↑ · Guardián genómico✕',
  },
  D: {
    title: 'Motor del ciclo acelerado y apoptosis atenuada',
    alterationsLabel: 'Motor ciclo↑ · Efector apoptosis✕',
  },
};

const THERAPY_LOGIC_NAMES: Record<TherapyId, { name: string; shortName: string }> = {
  surgery: { name: 'Resección quirúrgica local', shortName: 'Cirugía' },
  radiotherapy: { name: 'Radioterapia dirigida local', shortName: 'Radioterapia' },
  chemotherapy: { name: 'Quimioterapia citotóxica sistémica', shortName: 'Quimioterapia' },
  egfr_tki: {
    name: 'Bloqueo de receptor mitogénico de membrana',
    shortName: 'Bloqueo receptor',
  },
  cdk46_inhibitor: {
    name: 'Bloqueo del motor del ciclo celular',
    shortName: 'Freno del ciclo',
  },
  pi3k_inhibitor: {
    name: 'Bloqueo de la cascada de supervivencia',
    shortName: 'Freno metabólico',
  },
  immunotherapy: {
    name: 'Activación de vigilancia inmune (inmunoterapia)',
    shortName: 'Inmunoterapia',
  },
  combo_targeted_chemo: {
    name: 'Terapia combinada (bloqueo dirigido + citotóxica)',
    shortName: 'Combinada',
  },
  active_surveillance: {
    name: 'Vigilancia activa y ajuste conservador',
    shortName: 'Vigilancia',
  },
  palliative_care: {
    name: 'Cuidados paliativos y preservación funcional',
    shortName: 'Paliativos',
  },
};

/**
 * Concise door sign titles (<= 16 chars) for every cancer strategy across all scenarios and rounds.
 * Keeps 3D labyrinth door plates immediately legible while full titles remain inside the explanation panel.
 */
export const CANCER_STRATEGY_DOOR_LABELS: Record<
  string,
  { logic: string; precision: string }
> = {
  // Escenario A
  'a-r1-founder': { logic: 'Señal membrana', precision: 'Clon EGFR↑' },
  'a-r1-pten': { logic: 'Supervivencia↑', precision: 'EGFR↑ + PTEN✕' },
  'a-r1-met': { logic: 'Escape paralelo', precision: 'MET↑ + PDL1↑' },
  'a-r2-pten': { logic: 'Supervivencia↑', precision: 'Subclon PTEN✕' },
  'a-r2-met': { logic: 'Bypass paralelo', precision: 'Bypass MET↑' },
  'a-r2-founder': { logic: 'Clon receptor', precision: 'Clon EGFR↑' },
  'a-r3-pten': { logic: 'Metabolismo↑', precision: 'Anabólico PTEN✕' },
  'a-r3-met': { logic: 'Angiogénesis↑', precision: 'VEGFA↑ + MET↑' },
  'a-r3-founder': { logic: 'Ahorro energía', precision: 'Base EGFR↑' },
  'a-r4-met': { logic: 'Evasión inmune', precision: 'Subclon PD-L1↑' },
  'a-r4-pten': { logic: 'Supervivencia↑', precision: 'Clon PTEN✕' },
  'a-r4-founder': { logic: 'Mitosis rápida', precision: 'Mitosis EGFR↑' },
  'a-r5-met': { logic: 'Escape + inmune', precision: 'MET↑ + PDL1↑' },
  'a-r5-pten': { logic: 'Supervivencia↑', precision: 'Resist. PTEN✕' },
  'a-r5-founder': { logic: 'Rebote receptor', precision: 'Rebote EGFR↑' },
  'a-r6-met': { logic: 'Escape inmune', precision: 'MET↑ + PDL1↑' },
  'a-r6-founder': { logic: 'Rebote mitótico', precision: 'Rebote EGFR↑' },

  // Escenario B
  'b-r1-founder': { logic: 'Señal autónoma', precision: 'KRAS↑ + RB1✕' },
  'b-r1-bcl2': { logic: 'Escudo apoptosis', precision: 'KRAS↑ + BCL2↑' },
  'b-r1-pdl1': { logic: 'Evasión inmune', precision: 'KRAS↑ + PDL1↑' },
  'b-r2-bcl2': { logic: 'Antiapoptosis↑', precision: 'Subclon BCL2↑' },
  'b-r2-founder': { logic: 'División rápida', precision: 'KRAS↑ + RB1✕' },
  'b-r2-pdl1': { logic: 'Vasos + inmune', precision: 'VEGFA↑ + PDL1↑' },
  'b-r3-pdl1': { logic: 'Angiogénesis↑', precision: 'VEGFA↑ + PDL1↑' },
  'b-r3-bcl2': { logic: 'Escudo apoptosis', precision: 'Tolerancia BCL2↑' },
  'b-r4-bcl2': { logic: 'Refugio celular', precision: 'Refugio BCL2↑' },
  'b-r4-pdl1': { logic: 'Evasión inmune', precision: 'PDL1↑ + VEGFA↑' },
  'b-r5-bcl2': { logic: 'Latencia escudo', precision: 'Latencia BCL2↑' },
  'b-r5-founder': { logic: 'Rebote autónomo', precision: 'KRAS↑ + RB1✕' },

  // Escenario C
  'c-r1-founder': { logic: 'Sin guardián ADN', precision: 'PIK3CA↑ + TP53✕' },
  'c-r1-kras': { logic: 'Señal distal↑', precision: 'Variante KRAS↑' },
  'c-r1-pdl1': { logic: 'Evasión inmune', precision: 'Subclon PDL1↑' },
  'c-r2-kras': { logic: 'Bypass distal↑', precision: 'Bypass KRAS↑' },
  'c-r2-founder': { logic: 'Supervivencia↑', precision: 'Clon PIK3CA↑' },
  'c-r3-pdl1': { logic: 'Evasión inmune', precision: 'Evasión PDL1↑' },
  'c-r3-kras': { logic: 'Proliferación↑', precision: 'Clon KRAS↑' },
  'c-r4-kras': { logic: 'Cambio a distal', precision: 'Subclon KRAS↑' },
  'c-r4-pdl1': { logic: 'Inmune + vasos', precision: 'PDL1↑ + VEGFA↑' },
  'c-r5-founder': { logic: 'Sin guardián ADN', precision: 'PIK3CA↑ + TP53✕' },
  'c-r5-kras': { logic: 'Mitosis distal↑', precision: 'Mitosis KRAS↑' },

  // Escenario D
  'd-r1-founder': { logic: 'Motor ciclo↑', precision: 'CDK6↑ + BAX✕' },
  'd-r1-rb1': { logic: 'Sin freno G1/S', precision: 'Subclon RB1✕' },
  'd-r2-rb1': { logic: 'Sin freno G1/S', precision: 'Subclon RB1✕' },
  'd-r2-founder': { logic: 'Freno intacto', precision: 'Clon RB1 intacto' },
  'd-r3-pdl1': { logic: 'Inmune + vasos', precision: 'PDL1↑ + VEGFA↑' },
  'd-r3-rb1': { logic: 'Sin freno G1/S', precision: 'Subclon RB1✕' },
  'd-r4-rb1': { logic: 'Ciclo autónomo', precision: 'Autónomo RB1✕' },
  'd-r4-pdl1': { logic: 'Vasos + inmune', precision: 'VEGFA↑ + PDL1↑' },
  'd-r5-rb1': { logic: 'Sin freno/muerte', precision: 'RB1✕ + BAX✕' },
  'd-r5-founder': { logic: 'Rebote motor↑', precision: 'CDK6↑ + BAX✕' },
};

/**
 * Ordered regex replacements to remove all explicit gene & molecular pathway symbols
 * when playing in "Lógica molecular" mode.
 */
const LOGIC_TEXT_REPLACEMENTS: [RegExp, string][] = [
  [/\s*\((?:EGFR↑|KRAS↑|PIK3CA↑|CDK6↑|PTEN✕|RB1✕|TP53✕|CDKN2A✕|ATM✕|BAX✕|BCL2↑|MET↑|VEGFA↑|PD-L1↑|PDL1↑)\)/g, ''],
  [/\(ATM\/TP53\)/g, '(sensor de daño y guardián genómico)'],
  [/\(BAX\/BCL2\)/g, '(balance apoptótico mitocondrial)'],
  [/\(EGFR\/KRAS\/PI3K\)/g, '(señalización mitogénica y de supervivencia)'],
  [/\(PTEN\/RB1\)/g, '(frenos supresores del ciclo y metabolismo)'],
  [/\bla vía PI3K\/AKT\b/gi, 'la cascada de supervivencia y metabolismo'],
  [/\bdel eje PI3K\/AKT\b/gi, 'del eje de supervivencia y metabolismo'],
  [/\bdel receptor EGFR\b/gi, 'del receptor mitogénico'],
  [/\breceptor EGFR\b/gi, 'receptor mitogénico'],
  [/\bAnti-EGFR\s*TKI\b/gi, 'bloqueo de receptor mitogénico'],
  [/\bAnti-EGFR\b/gi, 'bloqueo de receptor mitogénico'],
  [/\bEGFR\s*TKI\b/gi, 'bloqueo de receptor mitogénico'],
  [/\bAnti-CDK4\/6\b/gi, 'freno del motor del ciclo'],
  [/\bCDK4\/6\b/gi, 'motor del ciclo celular'],
  [/\bAnti-PI3K\b/gi, 'bloqueo de supervivencia'],
  [/\banti-PD-L1\b/gi, 'bloqueo de evasión inmune'],
  [/\banti-PDL1\b/gi, 'bloqueo de evasión inmune'],
  [/\bPI3K\/AKT\b/gi, 'cascada de supervivencia y metabolismo'],
  [/\bPI3K\b/gi, 'cascada de supervivencia'],
  [/\bAKT\b/gi, 'señal de supervivencia'],
  [/\bseñalización MAPK\b/gi, 'señalización mitogénica'],
  [/\bMAPK\b/gi, 'cascada mitogénica'],
  [/\bPD-1\/PD-L1\b/gi, 'punto de control inmune'],
  [/\bPD-L1↑/g, 'evasión inmune elevada'],
  [/\bPDL1↑/g, 'evasión inmune elevada'],
  [/\bPD-L1\b/gi, 'señal de evasión inmune'],
  [/\bPDL1\b/gi, 'señal de evasión inmune'],
  [/\bCD274\b/gi, 'señal de evasión inmune'],
  [/\bEGFR↑/g, 'receptor mitogénico hiperactivo'],
  [/\bEGFR\b/g, 'receptor mitogénico'],
  [/\bKRAS↑/g, 'interruptor distal autónomo'],
  [/\bKRAS\b/g, 'interruptor distal'],
  [/\bPIK3CA↑/g, 'eje de supervivencia activado'],
  [/\bPIK3CA\b/g, 'eje de supervivencia'],
  [/\bPTEN✕/g, 'freno de supervivencia perdido'],
  [/\bPTEN\b/g, 'freno de supervivencia'],
  [/\bRB1✕/g, 'freno G1/S perdido'],
  [/\bRB1\b/g, 'freno del ciclo G1/S'],
  [/\bTP53✕/g, 'guardián genómico perdido'],
  [/\bTP53\b/g, 'guardián genómico'],
  [/\bCDK6↑/g, 'motor del ciclo hiperactivo'],
  [/\bCDK6\b/g, 'motor del ciclo'],
  [/\bCDKN2A✕/g, 'freno del motor perdido'],
  [/\bCDKN2A\b/g, 'freno del motor del ciclo'],
  [/\bATM✕/g, 'sensor de daño al ADN inactivo'],
  [/\bATM\b/g, 'sensor de daño al ADN'],
  [/\bBAX✕/g, 'efector apoptótico perdido'],
  [/\bBAX\b/g, 'efector apoptótico'],
  [/\bBCL2↑/g, 'escudo anti-apoptótico elevado'],
  [/\bBCL2\b/g, 'escudo anti-apoptótico'],
  [/\bMET↑/g, 'vía paralela de invasión'],
  [/\bMET\b/g, 'receptor paralelo de invasión'],
  [/\bVEGFA↑/g, 'señal angiogénica elevada'],
  [/\bVEGFA\b/g, 'señal de angiogénesis'],
  [/\bMYC\b/g, 'amplificador proliferativo'],
  [/\bRTK\b/g, 'receptor de membrana'],
  [/\(NGS\)/g, '(análisis funcional)'],
  [/\bNGS\b/g, 'análisis funcional'],
  [/\bTKI\b/g, 'bloqueador dirigido'],
];

export function formatBiologyText(text: string, detail: MolecularDetailMode): string {
  if (detail === 'precision' || !text) return text;
  let out = text;
  for (const [pattern, replacement] of LOGIC_TEXT_REPLACEMENTS) {
    out = out.replace(pattern, replacement);
  }
  return out
    .replace(/\bla vía cascada\b/gi, 'la cascada')
    .replace(/\bde la vía cascada\b/gi, 'de la cascada')
    .replace(/\breceptor receptor\b/gi, 'receptor')
    .replace(/\bbloqueo bloqueo\b/gi, 'bloqueo')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

export function getGeneDisplayTitle(
  geneOrSymbol: GeneDefinition | string,
  detail: MolecularDetailMode
): string {
  const symbol = typeof geneOrSymbol === 'string' ? geneOrSymbol : geneOrSymbol.symbol;
  if (detail === 'precision') return symbol;
  return GENE_TO_PROCESS_MAP[symbol]?.title ?? 'Proceso regulador';
}

export function getGeneDisplayShort(symbol: string, detail: MolecularDetailMode): string {
  if (detail === 'precision') return symbol;
  return GENE_TO_PROCESS_MAP[symbol]?.shortTitle ?? 'Proceso';
}

export function getScenarioDisplayInfo(
  scenarioId: ScenarioId,
  detail: MolecularDetailMode
): { code: string; title: string; alterationsLabel: string } {
  if (scenarioId === 'UNIFIED' || !SCENARIOS[scenarioId]) {
    return {
      code: 'Progresión única',
      title: 'Evolución progresiva por bifurcación',
      alterationsLabel:
        detail === 'precision'
          ? 'Inicio común · alteraciones acumulables'
          : 'Inicio común · decisiones bifurcadas',
    };
  }
  const sc = SCENARIOS[scenarioId];
  if (detail === 'precision') {
    return {
      code: sc.code,
      title: sc.title,
      alterationsLabel: sc.keyAlterationsLabel,
    };
  }
  const logic = SCENARIO_LOGIC_SUMMARIES[scenarioId];
  return {
    code: sc.code,
    title: logic.title,
    alterationsLabel: logic.alterationsLabel,
  };
}

export function getTherapyDisplayName(
  therapy: TherapyRule,
  detail: MolecularDetailMode
): string {
  if (detail === 'precision') return therapy.name;
  return THERAPY_LOGIC_NAMES[therapy.id]?.name ?? formatBiologyText(therapy.name, 'logic');
}

export function getTherapyDisplayShort(
  therapy: TherapyRule,
  detail: MolecularDetailMode
): string {
  if (detail === 'precision') return therapy.shortName;
  return THERAPY_LOGIC_NAMES[therapy.id]?.shortName ?? formatBiologyText(therapy.shortName, 'logic');
}

export function getCancerDoorShortLabel(
  strategyId: string,
  fallbackLabel: string,
  detail: MolecularDetailMode
): string {
  const mapped = CANCER_STRATEGY_DOOR_LABELS[strategyId];
  if (mapped) {
    return detail === 'precision' ? mapped.precision : mapped.logic;
  }
  const formatted = formatBiologyText(fallbackLabel, detail);
  return formatted.length > 16 ? formatted.slice(0, 16).trim() : formatted;
}

export function getModelFieldOptions(detail: MolecularDetailMode): {
  drivers: { value: string; label: string }[];
  weakened: { value: string; label: string }[];
  intact: { value: string; label: string }[];
  vulnerabilities: { value: string; label: string }[];
} {
  if (detail === 'precision') {
    return {
      drivers: [
        { value: 'EGFR', label: 'EGFR (receptor RTK activado)' },
        { value: 'KRAS', label: 'KRAS (GTPasa distal activada)' },
        { value: 'PIK3CA', label: 'PIK3CA (vía PI3K/AKT activada)' },
        { value: 'CDK6', label: 'CDK6 (quinasa G1/S hiperactiva)' },
      ],
      weakened: [
        { value: 'PTEN', label: 'PTEN (freno de PI3K/AKT)' },
        { value: 'RB1', label: 'RB1 (punto de control G1/S)' },
        { value: 'TP53', label: 'TP53 (respuesta al daño y apoptosis)' },
        { value: 'BAX', label: 'BAX (efector apoptótico mitocondrial)' },
      ],
      intact: [
        { value: 'TP53', label: 'TP53 funcional' },
        { value: 'RB1', label: 'RB1 funcional' },
        { value: 'PTEN', label: 'PTEN funcional' },
        { value: 'BAX', label: 'BAX funcional' },
      ],
      vulnerabilities: [
        { value: 'egfr_tki', label: 'Dependencia de receptor (Anti-EGFR TKI)' },
        { value: 'cdk46_inhibitor', label: 'Eje CDK6 con RB1 intacto (Anti-CDK4/6)' },
        { value: 'pi3k_inhibitor', label: 'Señalización PI3K/AKT (Anti-PI3K)' },
        { value: 'chemotherapy', label: 'Proliferación alta con TP53/BAX intactos (Citotóxica)' },
        { value: 'immunotherapy', label: 'Expresión PD-L1 / neoantígenos (Inmunoterapia)' },
      ],
    };
  }

  return {
    drivers: [
      { value: 'EGFR', label: 'Receptor mitogénico de membrana hiperactivo' },
      { value: 'KRAS', label: 'Interruptor distal autónomo de proliferación' },
      { value: 'PIK3CA', label: 'Cascada de supervivencia y metabolismo activada' },
      { value: 'CDK6', label: 'Motor de entrada al ciclo celular acelerado' },
    ],
    weakened: [
      { value: 'PTEN', label: 'Freno lipídico de supervivencia perdido' },
      { value: 'RB1', label: 'Freno del punto de control G1/S perdido' },
      { value: 'TP53', label: 'Guardián del daño genómico inactivo' },
      { value: 'BAX', label: 'Efector de muerte celular programada perdido' },
    ],
    intact: [
      { value: 'TP53', label: 'Guardián del daño genómico aún funcional' },
      { value: 'RB1', label: 'Freno del punto de control G1/S aún funcional' },
      { value: 'PTEN', label: 'Freno de supervivencia aún funcional' },
      { value: 'BAX', label: 'Efector de apoptosis aún funcional' },
    ],
    vulnerabilities: [
      { value: 'egfr_tki', label: 'Dependencia de señal de membrana (Bloqueo de receptor)' },
      { value: 'cdk46_inhibitor', label: 'Motor del ciclo con freno G1/S intacto (Freno del ciclo)' },
      { value: 'pi3k_inhibitor', label: 'Dependencia de supervivencia metabólica (Bloqueo supervivencia)' },
      { value: 'chemotherapy', label: 'Proliferación rápida con apoptosis intacta (Citotóxica)' },
      { value: 'immunotherapy', label: 'Evasión inmune reversible (Inmunoterapia)' },
    ],
  };
}
