import { SCENARIOS } from './scenarios';
import {
  CancerStrategyOption,
  DiagnosticToolDef,
  DiagnosticToolId,
  EnablingCharacteristicDef,
  EnablingCharacteristicId,
  GeneDefinition,
  HallmarkDefinition,
  HallmarkId,
  MolecularDetailMode,
  OncologistStartStage,
  PredictionOption,
  ScenarioId,
  SimulationState,
  TherapyId,
  TherapyRule,
  TurnResolution,
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
    title: 'Receptor de señales de crecimiento',
    shortTitle: 'Receptor señal',
    capabilityGroup: 'Señalización proliferativa',
  },
  KRAS: {
    title: 'Vía interna de división autónoma',
    shortTitle: 'Señal autónoma',
    capabilityGroup: 'Señalización proliferativa',
  },
  PIK3CA: {
    title: 'Vía de nutrientes y supervivencia',
    shortTitle: 'Nutrientes y vida',
    capabilityGroup: 'Metabolismo y supervivencia',
  },
  PTEN: {
    title: 'Freno interno de supervivencia',
    shortTitle: 'Freno interno',
    capabilityGroup: 'Supresión de crecimiento',
  },
  RB1: {
    title: 'Freno principal del ciclo celular',
    shortTitle: 'Freno del ciclo',
    capabilityGroup: 'Control del ciclo celular',
  },
  CDK6: {
    title: 'Acelerador del ciclo celular',
    shortTitle: 'Acelerador ciclo',
    capabilityGroup: 'Control del ciclo celular',
  },
  CDKN2A: {
    title: 'Freno de envejecimiento celular',
    shortTitle: 'Freno senescencia',
    capabilityGroup: 'Supresión de crecimiento',
  },
  ATM: {
    title: 'Sensor temprano de daño al ADN',
    shortTitle: 'Sensor de ADN',
    capabilityGroup: 'Detección y reparación',
  },
  TP53: {
    title: 'Alarma principal de daño al ADN',
    shortTitle: 'Alarma de ADN',
    capabilityGroup: 'Respuesta al daño y apoptosis',
  },
  BAX: {
    title: 'Ejecutor de la apoptosis',
    shortTitle: 'Ejecutor apoptosis',
    capabilityGroup: 'Apoptosis intrínseca',
  },
  BCL2: {
    title: 'Bloqueador de la apoptosis',
    shortTitle: 'Bloqueo apoptosis',
    capabilityGroup: 'Resistencia a la apoptosis',
  },
  MET: {
    title: 'Receptor alterno de invasión',
    shortTitle: 'Receptor alterno',
    capabilityGroup: 'Invasión y vía alterna',
  },
  VEGFA: {
    title: 'Señal de nuevos vasos sanguíneos',
    shortTitle: 'Nuevos vasos',
    capabilityGroup: 'Inducción vascular',
  },
  PDL1: {
    title: 'Señal inhibidora inmune',
    shortTitle: 'Evasión inmune',
    capabilityGroup: 'Evasión inmune',
  },
  CD274: {
    title: 'Señal inhibidora inmune',
    shortTitle: 'Evasión inmune',
    capabilityGroup: 'Evasión inmune',
  },
  MYC: {
    title: 'Amplificador de crecimiento',
    shortTitle: 'Amplificador',
    capabilityGroup: 'Metabolismo y división',
  },
};

/**
 * Everyday plain-Spanish metaphors for "Modo Simple" (novice audiences).
 */
export const GENE_TO_SIMPLE_MAP: Record<string, ProcessDescriptor> = {
  EGFR: {
    title: 'Antena de crecimiento',
    shortTitle: 'Antena crecer',
    capabilityGroup: 'Órdenes de crecimiento',
  },
  KRAS: {
    title: 'Acelerador interno',
    shortTitle: 'Acelerador',
    capabilityGroup: 'Órdenes de crecimiento',
  },
  PIK3CA: {
    title: 'Motor de energía y vida',
    shortTitle: 'Motor energía',
    capabilityGroup: 'Energía celular',
  },
  PTEN: {
    title: 'Freno de energía',
    shortTitle: 'Freno energía',
    capabilityGroup: 'Frenos naturales',
  },
  RB1: {
    title: 'Freno de división',
    shortTitle: 'Freno división',
    capabilityGroup: 'Frenos naturales',
  },
  CDK6: {
    title: 'Arranque de división',
    shortTitle: 'Arranque',
    capabilityGroup: 'Ritmo de división',
  },
  CDKN2A: {
    title: 'Seguro de división',
    shortTitle: 'Seguro freno',
    capabilityGroup: 'Frenos naturales',
  },
  ATM: {
    title: 'Alarma de daño en el ADN',
    shortTitle: 'Alarma ADN',
    capabilityGroup: 'Seguridad interna',
  },
  TP53: {
    title: 'Inspector de seguridad del ADN',
    shortTitle: 'Inspector ADN',
    capabilityGroup: 'Seguridad interna',
  },
  BAX: {
    title: 'Botón de apagado seguro',
    shortTitle: 'Botón apagado',
    capabilityGroup: 'Apagado seguro',
  },
  BCL2: {
    title: 'Escudo protector del tumor',
    shortTitle: 'Escudo vida',
    capabilityGroup: 'Resistencia al apagado',
  },
  MET: {
    title: 'Ruta de escape e invasión',
    shortTitle: 'Ruta escape',
    capabilityGroup: 'Invasión y escape',
  },
  VEGFA: {
    title: 'Creador de vasos sanguíneos',
    shortTitle: 'Nuevos vasos',
    capabilityGroup: 'Alimento y oxígeno',
  },
  PDL1: {
    title: 'Disfraz frente a defensas',
    shortTitle: 'Disfraz inmune',
    capabilityGroup: 'Esconderse de defensas',
  },
  CD274: {
    title: 'Disfraz frente a defensas',
    shortTitle: 'Disfraz inmune',
    capabilityGroup: 'Esconderse de defensas',
  },
  MYC: {
    title: 'Turbo de crecimiento',
    shortTitle: 'Turbo celular',
    capabilityGroup: 'Energía y crecimiento',
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
    name: 'Bloqueo del receptor de crecimiento',
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

export const THERAPY_SIMPLE_INFO: Record<
  TherapyId,
  { name: string; shortName: string; mechanism: string; cloneEffectsSummary: string }
> = {
  surgery: {
    name: 'Cirugía para retirar el tumor',
    shortName: 'Cirugía',
    mechanism:
      'Retira físicamente el grupo de células malas de la zona afectada cuando el tumor está en un solo lugar.',
    cloneEffectsSummary:
      'Muy eficaz si el tumor está localizado; si ya se extendió a otras partes del cuerpo, no alcanza los focos lejanos.',
  },
  radiotherapy: {
    name: 'Radioterapia dirigida a la zona',
    shortName: 'Radioterapia',
    mechanism:
      'Aplica rayos concentrados sobre el tumor para dañar las células malas y frenar que sigan dividiéndose.',
    cloneEffectsSummary:
      'Controla bien un área concreta, aunque algunas células sin botón de apagado resisten mejor el golpe.',
  },
  chemotherapy: {
    name: 'Quimioterapia general',
    shortName: 'Quimioterapia',
    mechanism:
      'Medicamento que viaja por la sangre para atacar a las células que se multiplican muy rápido en todo el cuerpo.',
    cloneEffectsSummary:
      'Ataca varios grupos de células a la vez, pero también cansa tejidos sanos y pierde fuerza si el tumor bloqueó su apagado.',
  },
  egfr_tki: {
    name: 'Medicamento que apaga la antena de crecimiento',
    shortName: 'Apagar antena',
    mechanism:
      'Bloquea la antena externa que le da órdenes a las células del tumor para multiplicarse.',
    cloneEffectsSummary:
      'Muy preciso y suave con el cuerpo, pero deja de funcionar si el tumor activó un acelerador interno propio.',
  },
  cdk46_inhibitor: {
    name: 'Medicamento que frena la división',
    shortName: 'Frenar división',
    mechanism:
      'Detiene el arranque que empuja a las células del tumor a copiarse sin descanso.',
    cloneEffectsSummary:
      'Pone en pausa el crecimiento del tumor con pocos efectos secundarios, siempre que el freno natural de división siga presente.',
  },
  pi3k_inhibitor: {
    name: 'Medicamento que corta la energía del tumor',
    shortName: 'Cortar energía',
    mechanism:
      'Apaga el motor interno de energía que mantiene vivas y bien alimentadas a las células del tumor.',
    cloneEffectsSummary:
      'Debilita a las células que dependen de consumir mucha energía para sobrevivir.',
  },
  immunotherapy: {
    name: 'Inmunoterapia (despertar las defensas)',
    shortName: 'Inmunoterapia',
    mechanism:
      'Quita el disfraz del tumor para que las defensas naturales del cuerpo lo reconozcan y lo eliminen.',
    cloneEffectsSummary:
      'Incluso puede eliminar células resistentes a otros tratamientos si el tumor estaba usando un disfraz inmune.',
  },
  combo_targeted_chemo: {
    name: 'Tratamiento combinado fuerte',
    shortName: 'Combinado',
    mechanism:
      'Junta un medicamento de precisión con quimioterapia para atacar al tumor desde dos frentes a la vez.',
    cloneEffectsSummary:
      'Logra una reducción rápida cuando hay varios grupos de células distintas, pero produce más cansancio y desgaste.',
  },
  active_surveillance: {
    name: 'Vigilancia sin medicar',
    shortName: 'Vigilancia',
    mechanism:
      'Acompaña y vigila de cerca al paciente sin aplicar medicamentos agresivos por ahora.',
    cloneEffectsSummary:
      'Deja descansar al cuerpo y protege el bienestar, aunque un tumor muy grande puede seguir creciendo.',
  },
  palliative_care: {
    name: 'Cuidados de alivio y bienestar',
    shortName: 'Alivio y apoyo',
    mechanism:
      'Se enfoca en quitar síntomas, recuperar fuerzas y proteger la calidad de vida de la persona.',
    cloneEffectsSummary:
      'No busca eliminar el tumor directamente, pero reduce el desgaste y cuida la dignidad y comodidad del paciente.',
  },
};

export const DIAGNOSTIC_SIMPLE_INFO: Record<
  DiagnosticToolId,
  { name: string; shortName: string; summary: string; revealsDescription: string }
> = {
  imaging: {
    name: 'Estudio de imágenes',
    shortName: 'Imágenes',
    summary: '¿Qué tamaño tiene el tumor y hasta dónde se ha extendido?',
    revealsDescription:
      'Muestra si el tumor sigue en un solo sitio o ya se extendió, y si sirve operar o usar radioterapia.',
  },
  biopsy: {
    name: 'Biopsia (ver el tejido al microscopio)',
    shortName: 'Biopsia',
    summary: '¿Siguen funcionando los frenos que detienen a las células dañadas?',
    revealsDescription:
      'Indica si el freno de división, el inspector del ADN y el botón de apagado siguen activos.',
  },
  molecular_profile: {
    name: 'Mapa interno de las células',
    shortName: 'Mapa interno',
    summary: '¿Qué piezas empujan al tumor a crecer y cuántos grupos distintos hay?',
    revealsDescription:
      'Muestra qué señales están encendidas, qué frenos se perdieron y si hay grupos resistentes.',
  },
  biomarkers: {
    name: 'Prueba de defensas y vasos sanguíneos',
    shortName: 'Señales',
    summary: '¿Se está escondiendo de las defensas del cuerpo o pidiendo nuevos vasos?',
    revealsDescription:
      'Ayuda a saber si activar las defensas (inmunoterapia) puede funcionar en este caso.',
  },
  response_monitoring: {
    name: 'Seguimiento en sangre',
    shortName: 'Seguimiento',
    summary: '¿Están creciendo grupos de células resistentes después de las rondas anteriores?',
    revealsDescription:
      'Detecta cambios recientes en los grupos de células para ajustar el tratamiento a tiempo.',
  },
};

export const HALLMARK_SIMPLE_INFO: Record<
  HallmarkId,
  { name: string; shortLabel: string; description: string }
> = {
  proliferative_signaling: {
    name: 'Crecer sin parar',
    shortLabel: 'Crecer rápido',
    description:
      'Las células encienden sus propias señales para multiplicarse sin esperar permiso del cuerpo.',
  },
  evading_growth_suppressors: {
    name: 'Ignorar los frenos naturales',
    shortLabel: 'Sin frenos',
    description:
      'El cuerpo tiene frenos para detener células que crecen de más; el tumor aprende a desactivarlos.',
  },
  resisting_cell_death: {
    name: 'Evitar el apagado seguro',
    shortLabel: 'No se apaga',
    description:
      'Cuando una célula se daña debe apagarse para proteger al tejido; el tumor bloquea ese botón.',
  },
  cellular_metabolism: {
    name: 'Consumir más energía',
    shortLabel: 'Más energía',
    description:
      'Las células cambian su forma de usar azúcar y nutrientes para fabricar copias más rápido.',
  },
  avoiding_immune_destruction: {
    name: 'Esconderse de las defensas',
    shortLabel: 'Disfraz inmune',
    description:
      'El tumor levanta un camuflaje para pasar desapercibido ante las defensas del cuerpo.',
  },
  inducing_vasculature: {
    name: 'Crear nuevos vasos sanguíneos',
    shortLabel: 'Nuevos vasos',
    description:
      'El tumor atrae pequeños vasos sanguíneos hacia sí para conseguir más oxígeno y alimento.',
  },
  invasion_metastasis: {
    name: 'Invadir otras zonas',
    shortLabel: 'Invasión',
    description:
      'Las células se sueltan de su lugar original y aprenden a viajar hacia otros tejidos.',
  },
  replicative_immortality: {
    name: 'Multiplicarse sin envejecer',
    shortLabel: 'Sin límite',
    description:
      'A diferencia de las células sanas, estas pueden seguir dividiéndose una y otra vez sin agotarse.',
  },
  phenotypic_plasticity: {
    name: 'Cambiar para adaptarse',
    shortLabel: 'Adaptación',
    description:
      'Las células modifican su comportamiento para sobrevivir en lugares difíciles o frente a medicamentos.',
  },
};

export const ENABLING_SIMPLE_NAMES: Record<EnablingCharacteristicId, string> = {
  genomic_instability: 'Errores acumulados en el ADN',
  tumor_inflammation: 'Inflamación que ayuda al tumor',
  epigenetic_reprogramming: 'Cambios rápidos de comportamiento',
  microenvironment_constraints: 'Límites del entorno y oxígeno',
};

export const ONCOLOGIST_STAGE_META: Record<
  OncologistStartStage,
  {
    label: string;
    shortBadge: string;
    burdenPreview: string;
    simpleDescription: string;
    logicDescription: string;
    precisionDescription: string;
  }
> = {
  surveillance: {
    label: 'Vigilancia',
    shortBadge: 'Inicio: Vigilancia',
    burdenPreview: '8/100',
    simpleDescription:
      'Hallazgo muy pequeño y de evolución lenta. Permite estudiar y vigilar sin desgastar al cuerpo innecesariamente.',
    logicDescription:
      'Lesión incipiente de bajo riesgo y baja actividad; prioriza estudiar y vigilar antes de sobretratar.',
    precisionDescription:
      'Lesión mínima de bajo riesgo (carga inicial 8/100) con controles celulares intactos; ideal para vigilancia y confirmación diagnóstica.',
  },
  early: {
    label: 'Cáncer temprano',
    shortBadge: 'Inicio: Cáncer temprano',
    burdenPreview: '16/100',
    simpleDescription:
      'Tumor pequeño detectado a tiempo. Estudia primero qué está pasando para elegir la mejor opción.',
    logicDescription:
      'Tumor pequeño en etapa temprana con carga inicial baja; conviene caracterizarlo antes de intervenir.',
    precisionDescription:
      'Tumor pequeño en etapa temprana (carga inicial 16/100) con controles basales activos; estudia su extensión y vías antes de tratar.',
  },
  advanced: {
    label: 'Cáncer avanzado',
    shortBadge: 'Inicio: Cáncer avanzado',
    burdenPreview: '68/100',
    simpleDescription:
      'Tumor grande y muy activo. Necesitarás estudiar sus puntos débiles y cuidar la fuerza del paciente.',
    logicDescription:
      'Tumor en etapa avanzada con alta carga celular y varias subpoblaciones; exige equilibrio entre eficacia y bienestar.',
    precisionDescription:
      'Tumor avanzado de alta actividad (carga inicial 68/100) con múltiples alteraciones; caracteriza sus vías para priorizar tratamientos y bienestar.',
  },
};

export function getOncologistStageInfo(
  stage: OncologistStartStage,
  detail: MolecularDetailMode
): { label: string; shortBadge: string; burdenPreview: string; description: string } {
  const meta = ONCOLOGIST_STAGE_META[stage];
  const description =
    detail === 'simple'
      ? meta.simpleDescription
      : detail === 'precision'
        ? meta.precisionDescription
        : meta.logicDescription;
  return {
    label: meta.label,
    shortBadge: meta.shortBadge,
    burdenPreview: meta.burdenPreview,
    description,
  };
}

export function getDetailModeLabel(detail: MolecularDetailMode): string {
  if (detail === 'simple') return 'Simple';
  if (detail === 'precision') return 'Precisión';
  return 'Lógica';
}

/**
 * Concise door sign titles (<= 16 chars) for every cancer strategy across all scenarios and rounds.
 * Keeps 3D labyrinth door plates immediately legible while full titles remain inside the explanation panel.
 */
export const CANCER_STRATEGY_DOOR_LABELS: Record<
  string,
  { simple?: string; logic: string; precision: string }
> = {
  // Unified progressive catalog IDs (<= 18 chars each, no cryptic abbreviations)
  'prob-egfr': { simple: 'Antena sensible', logic: 'Receptor sensible', precision: 'EGFR activado' },
  'prob-kras': { simple: 'Crecer sin señal', logic: 'Señal autónoma', precision: 'KRAS activado' },
  'prob-pik3ca': { simple: 'Más energía', logic: 'Nutrientes y vida', precision: 'PIK3CA activado' },
  'prob-cdk6': { simple: 'División rápida', logic: 'Ciclo acelerado', precision: 'CDK6 activado' },
  'prob-pten': { simple: 'Sin freno energía', logic: 'Sin freno interno', precision: 'PTEN perdido' },
  'prob-cdkn2a': { simple: 'No envejecer', logic: 'Sin senescencia', precision: 'CDKN2A perdido' },
  'prob-rb1': { simple: 'Romper el freno', logic: 'Sin freno ciclo', precision: 'RB1 perdido' },
  'prob-atm': { simple: 'Apagar detector', logic: 'Sin sensor ADN', precision: 'ATM perdido' },
  'prob-tp53': { simple: 'Apagar alarma', logic: 'Sin alarma ADN', precision: 'TP53 perdido' },
  'prob-bax': { simple: 'Sin botón retiro', logic: 'Sin ejecutor daño', precision: 'BAX perdido' },
  'prob-bcl2': { simple: 'Escudo de vida', logic: 'Bloqueo apoptosis', precision: 'BCL2 activado' },
  'prob-vegfa': { simple: 'Nuevos vasos', logic: 'Nuevos vasos', precision: 'VEGFA activado' },
  'prob-pdl1': { simple: 'Disfraz inmune', logic: 'Evasión inmune', precision: 'PD-L1 activado' },
  'prob-met': { simple: 'Ruta de escape', logic: 'Receptor alterno', precision: 'MET activado' },

  // Legacy scenarios
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
 * when playing in "Lógica molecular" (or "Simple") mode.
 */
const LOGIC_TEXT_REPLACEMENTS: [RegExp, string][] = [
  [/\s*\((?:EGFR↑|KRAS↑|PIK3CA↑|CDK6↑|PTEN✕|RB1✕|TP53✕|CDKN2A✕|ATM✕|BAX✕|BCL2↑|MET↑|VEGFA↑|PD-L1↑|PDL1↑)\)/g, ''],
  [/\(ATM\/TP53\)/g, '(sensor y alarma de daño al ADN)'],
  [/\(BAX\/BCL2\)/g, '(control de apoptosis en la mitocondria)'],
  [/\(EGFR\/KRAS\/PI3K\)/g, '(señalización de crecimiento y supervivencia)'],
  [/\(PTEN\/RB1\)/g, '(frenos del ciclo celular y metabolismo)'],
  [/\bla vía PI3K\/AKT\b/gi, 'la vía de nutrientes y supervivencia'],
  [/\bdel eje PI3K\/AKT\b/gi, 'de la vía de nutrientes y supervivencia'],
  [/\bdel receptor EGFR\b/gi, 'del receptor de crecimiento'],
  [/\breceptor EGFR\b/gi, 'receptor de crecimiento'],
  [/\bAnti-EGFR\s*TKI\b/gi, 'bloqueo del receptor de crecimiento'],
  [/\bAnti-EGFR\b/gi, 'bloqueo del receptor de crecimiento'],
  [/\bEGFR\s*TKI\b/gi, 'bloqueo del receptor de crecimiento'],
  [/\bAnti-CDK4\/6\b/gi, 'bloqueo del acelerador del ciclo'],
  [/\bCDK4\/6\b/gi, 'acelerador del ciclo celular'],
  [/\bAnti-PI3K\b/gi, 'bloqueo de la vía de supervivencia'],
  [/\banti-PD-L1\b/gi, 'bloqueo de la señal inhibidora inmune'],
  [/\banti-PDL1\b/gi, 'bloqueo de la señal inhibidora inmune'],
  [/\bPI3K\/AKT\b/gi, 'vía de nutrientes y supervivencia'],
  [/\bPI3K\b/gi, 'vía de nutrientes y supervivencia'],
  [/\bAKT\b/gi, 'señal de supervivencia'],
  [/\bseñalización MAPK\b/gi, 'vía interna de división'],
  [/\bMAPK\b/gi, 'vía interna de división'],
  [/\bPD-1\/PD-L1\b/gi, 'freno del sistema inmune'],
  [/\bPD-L1↑/g, 'evasión inmune elevada'],
  [/\bPDL1↑/g, 'evasión inmune elevada'],
  [/\bPD-L1\b/gi, 'señal inhibidora inmune'],
  [/\bPDL1\b/gi, 'señal inhibidora inmune'],
  [/\bCD274\b/gi, 'señal inhibidora inmune'],
  [/\bEGFR-dependientes\b/gi, 'dependientes del receptor de crecimiento'],
  [/\bEGFR↑/g, 'receptor de crecimiento hiperactivo'],
  [/\bEGFR\b/g, 'receptor de crecimiento'],
  [/\bKRAS↑/g, 'vía interna de división autónoma'],
  [/\bKRAS\b/g, 'vía interna de división'],
  [/\bPIK3CA↑/g, 'vía de nutrientes y supervivencia activa'],
  [/\bPIK3CA\b/g, 'vía de nutrientes y supervivencia'],
  [/\bPTEN✕/g, 'freno interno de supervivencia perdido'],
  [/\bPTEN\b/g, 'freno interno de supervivencia'],
  [/\bRB1✕/g, 'freno del ciclo celular perdido'],
  [/\bRB1\b/g, 'freno del ciclo celular'],
  [/\bTP53✕/g, 'alarma de daño al ADN perdida'],
  [/\bTP53\b/g, 'alarma de daño al ADN'],
  [/\bCDK6↑/g, 'acelerador del ciclo hiperactivo'],
  [/\bCDK6\b/g, 'acelerador del ciclo celular'],
  [/\bCDKN2A✕/g, 'freno de envejecimiento perdido'],
  [/\bCDKN2A\b/g, 'freno de envejecimiento celular'],
  [/\bATM✕/g, 'sensor de daño al ADN inactivo'],
  [/\bATM\b/g, 'sensor de daño al ADN'],
  [/\bBAX✕/g, 'ejecutor de apoptosis perdido'],
  [/\bBAX\b/g, 'ejecutor de apoptosis'],
  [/\bBCL2↑/g, 'bloqueo de apoptosis elevado'],
  [/\bBCL2\b/g, 'bloqueador de apoptosis'],
  [/\bMET↑/g, 'receptor alterno de invasión activo'],
  [/\bMET\b/g, 'receptor alterno de invasión'],
  [/\bVEGFA↑/g, 'señal de nuevos vasos elevada'],
  [/\bVEGFA\b/g, 'señal de nuevos vasos'],
  [/\bMYC\b/gi, 'amplificador de crecimiento'],
  [/\bRTK\b/g, 'receptor de membrana'],
  [/\(NGS\)/g, '(análisis molecular)'],
  [/\bNGS\b/g, 'análisis molecular'],
  [/\bTKI\b/g, 'bloqueador dirigido'],
];

/**
 * Second-pass plain-language translation for "Simple" mode (novice audiences).
 * Converts technical cellular/oncology vocabulary into everyday, clear Spanish.
 */
const SIMPLE_TEXT_REPLACEMENTS: [RegExp, string][] = [
  [/\breceptor mitogénico hiperactivo\b/gi, 'antena de crecimiento encendida todo el tiempo'],
  [/\breceptor mitogénico de membrana\b/gi, 'antena externa de crecimiento'],
  [/\breceptor mitogénico\b/gi, 'antena de crecimiento'],
  [/\binterruptor distal autónomo\b/gi, 'acelerador interno que no se apaga'],
  [/\binterruptor distal\b/gi, 'acelerador interno'],
  [/\beje de supervivencia y metabolismo\b/gi, 'motor de energía y supervivencia'],
  [/\bcascada de supervivencia y metabolismo\b/gi, 'motor de energía y supervivencia'],
  [/\bcascada de supervivencia\b/gi, 'motor de energía'],
  [/\beje de supervivencia\b/gi, 'motor de energía'],
  [/\bfreno del punto de control G1\/S\b/gi, 'freno natural de división'],
  [/\bfreno del ciclo G1\/S\b/gi, 'freno de división'],
  [/\bfreno G1\/S\b/gi, 'freno de división'],
  [/\bpunto de control G1\/S\b/gi, 'freno de división'],
  [/\bpunto de control inmune\b/gi, 'freno de las defensas'],
  [/\bguardián del daño genómico\b/gi, 'inspector de seguridad del ADN'],
  [/\bguardián genómico\b/gi, 'inspector de seguridad del ADN'],
  [/\befector de muerte programada\b/gi, 'botón de apagado seguro'],
  [/\befector apoptótico\b/gi, 'botón de apagado seguro'],
  [/\bescudo anti-apoptótico\b/gi, 'escudo contra el apagado celular'],
  [/\bescudo antiapoptótico\b/gi, 'escudo contra el apagado celular'],
  [/\bfreno lipídico de supervivencia\b/gi, 'freno de energía'],
  [/\bfreno del motor del ciclo\b/gi, 'seguro del freno de división'],
  [/\bmotor del ciclo celular\b/gi, 'arranque de división'],
  [/\bmotor del ciclo\b/gi, 'arranque de división'],
  [/\bseñal de evasión inmune\b/gi, 'disfraz frente a las defensas'],
  [/\bevasión inmune\b/gi, 'esconderse de las defensas'],
  [/\binducción angiogénica\b/gi, 'creación de nuevos vasos sanguíneos'],
  [/\bseñal de angiogénesis\b/gi, 'señal para crear vasos sanguíneos'],
  [/\bseñal angiogénica\b/gi, 'señal de nuevos vasos sanguíneos'],
  [/\bangiogénesis\b/gi, 'creación de vasos sanguíneos'],
  [/\bangiogénic[oa]s?\b/gi, 'de nuevos vasos sanguíneos'],
  [/\be inmunohistoquímica\b/gi, 'y análisis de señales del tejido'],
  [/\binmunohistoquímica\b/gi, 'análisis de señales del tejido'],
  [/\be histopatología\b/gi, 'y análisis al microscopio'],
  [/\bhistopatología\b/gi, 'análisis al microscopio'],
  [/\bhistológic[oa]\b/gi, 'al microscopio'],
  [/\bheterogeneidad clonal\b/gi, 'mezcla de distintos grupos de células'],
  [/\barquitectura clonal heterogénea\b/gi, 'varios grupos de células distintas'],
  [/\bdinámica clonal\b/gi, 'cambio en los grupos de células'],
  [/\bexpansión clonal\b/gi, 'crecimiento de un grupo de células'],
  [/\bselección clonal\b/gi, 'ventaja para los grupos más resistentes'],
  [/\bselección darwiniana\b/gi, 'supervivencia de las células más resistentes'],
  [/\bpresión selectiva\b/gi, 'filtro que favorece a las más resistentes'],
  [/\bpresión farmacológica\b/gi, 'efecto de medicamentos'],
  [/\bpresión terapéutica\b/gi, 'efecto del tratamiento'],
  [/\bsubclones\b/gi, 'grupos de células'],
  [/\bsubclon\b/gi, 'grupo de células'],
  [/\bclones\b/gi, 'grupos de células'],
  [/\bclon\b/gi, 'grupo de células'],
  [/\bclonal\b/gi, 'de los grupos de células'],
  [/\bproliferación\b/gi, 'crecimiento rápido'],
  [/\bproliferativ[oa]s?\b/gi, 'de crecimiento rápido'],
  [/\bmitogénic[oa]s?\b/gi, 'de crecimiento'],
  [/\bíndice mitótico\b/gi, 'velocidad de división'],
  [/\btasa mitótica\b/gi, 'velocidad de división'],
  [/\bmuerte mitótica\b/gi, 'fallo al intentar dividirse'],
  [/\bmitosis\b/gi, 'división celular'],
  [/\bmitótic[oa]\b/gi, 'de división'],
  [/\bapoptosis intrínseca\b/gi, 'apagado seguro interno de la célula'],
  [/\bvía apoptótica\b/gi, 'sistema de apagado seguro'],
  [/\brespuesta apoptótica\b/gi, 'capacidad de apagado seguro'],
  [/\bumbral apoptótico\b/gi, 'resistencia al apagado seguro'],
  [/\bapoptosis\b/gi, 'apagado seguro de células dañadas'],
  [/\bapoptótic[oa]s?\b/gi, 'de apagado seguro'],
  [/\blinfocitos T citotóxicos\b/gi, 'células de defensa'],
  [/\blinfocitos T CD8\+/gi, 'células de defensa'],
  [/\blinfocitos T\b/gi, 'células de defensa'],
  [/\bcitotoxicidad inmune extrínseca\b/gi, 'ataque directo de las defensas'],
  [/\beliminación citotóxica\b/gi, 'ataque de las defensas'],
  [/\bcitotóxic[oa]s?\b/gi, 'fuerte contra células rápidas'],
  [/\bhipóxic[oa]\b/gi, 'con poco oxígeno'],
  [/\bhipoxia\b/gi, 'falta de oxígeno'],
  [/\bmicroambiente\b/gi, 'entorno del tejido'],
  [/\bgenómic[oa]s?\b/gi, 'del ADN'],
  [/\bgenotipo\b/gi, 'perfil interno'],
  [/\bfenotipo\b/gi, 'comportamiento'],
  [/\bestrés replicativo\b/gi, 'desgaste por copiarse demasiado rápido'],
  [/\broturas bicatenarias\b/gi, 'daños graves en el ADN'],
  [/\bsenescencia\b/gi, 'pausa definitiva de crecimiento'],
  [/\banabólic[oa]\b/gi, 'de alto consumo de energía'],
  [/\bbioenergétic[oa]s?\b/gi, 'de energía'],
  [/\bneoantígenos\b/gi, 'marcas visibles para las defensas'],
  [/\bneoantigénica\b/gi, 'para las defensas'],
  [/\bvisibilidad antigénica\b/gi, 'facilidad para que las defensas las detecten'],
  [/\bantígenos celulares anómalos\b/gi, 'señales de células dañadas'],
  [/\bresecabilidad quirúrgica\b/gi, 'si se puede operar'],
  [/\bresección quirúrgica\b/gi, 'cirugía para retirar el tumor'],
  [/\bcarga tóxica\b/gi, 'desgaste por medicamentos'],
  [/\btoxicidad acumulada\b/gi, 'desgaste acumulado'],
  [/\btoxicidad sistémica\b/gi, 'desgaste en todo el cuerpo'],
  [/\bla toxicidad\b/gi, 'el desgaste por tratamientos'],
  [/\btoxicidad\b/gi, 'desgaste por tratamientos'],
  [/\bbypass\b/gi, 'ruta alterna'],
  [/\btisulares\b/gi, 'de los tejidos'],
  [/\btisular\b/gi, 'del tejido'],
  [/\bintrínseca\b/gi, 'interna'],
  [/\bextrínseca\b/gi, 'externa'],
  [/\bhallmarks\b/gi, 'habilidades del cáncer'],
  [/\bbiomarcadores\b/gi, 'señales biológicas'],
  [/\bimpulsores de crecimiento\b/gi, 'piezas que aceleran el crecimiento'],
  [/\bimpulsores\b/gi, 'aceleradores'],
  [/\binfiltración linfocitaria T\b/gi, 'presencia de células de defensa'],
  [/\bplasticidad metabólica\b/gi, 'capacidad de adaptar su energía'],
  [/\ben reposo relativo\b/gi, 'casi quietas por ahora'],
  [/\bsustento vascular\b/gi, 'riego sanguíneo'],
  [/\bflujo vascular\b/gi, 'riego sanguíneo'],
  [/\breceptor paralelo de invasión\b/gi, 'ruta alterna para invadir otros tejidos'],
  [/\bvía paralela de invasión\b/gi, 'ruta alterna para invadir'],
  [/\bfreno de supervivencia\b/gi, 'freno de energía'],
  [/\bsupresores\b/gi, 'frenos naturales'],
  [/\bsupresor\b/gi, 'freno natural'],
];

export function formatBiologyText(text: string, detail: MolecularDetailMode): string {
  if (detail === 'precision' || !text) return text;
  let out = text;
  for (const [pattern, replacement] of LOGIC_TEXT_REPLACEMENTS) {
    out = out.replace(pattern, replacement);
  }
  if (detail === 'simple') {
    for (const [pattern, replacement] of SIMPLE_TEXT_REPLACEMENTS) {
      out = out.replace(pattern, replacement);
    }
  }
  return out
    .replace(/\bla vía cascada\b/gi, 'la cascada')
    .replace(/\bde la vía cascada\b/gi, 'de la cascada')
    .replace(/\breceptor receptor\b/gi, 'receptor')
    .replace(/\bbloqueo bloqueo\b/gi, 'bloqueo')
    .replace(/\bde de\b/gi, 'de')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

export function getGeneDisplayTitle(
  geneOrSymbol: GeneDefinition | string,
  detail: MolecularDetailMode
): string {
  const symbol = typeof geneOrSymbol === 'string' ? geneOrSymbol : geneOrSymbol.symbol;
  if (detail === 'precision') return symbol;
  if (detail === 'simple') {
    return GENE_TO_SIMPLE_MAP[symbol]?.title ?? 'Pieza reguladora';
  }
  return GENE_TO_PROCESS_MAP[symbol]?.title ?? 'Proceso regulador';
}

export function getGeneDisplayShort(symbol: string, detail: MolecularDetailMode): string {
  if (detail === 'precision') return symbol;
  if (detail === 'simple') {
    return GENE_TO_SIMPLE_MAP[symbol]?.shortTitle ?? 'Control';
  }
  return GENE_TO_PROCESS_MAP[symbol]?.shortTitle ?? 'Proceso';
}

export function getScenarioDisplayInfo(
  scenarioId: ScenarioId,
  detail: MolecularDetailMode
): { code: string; title: string; alterationsLabel: string } {
  if (scenarioId === 'UNIFIED' || !SCENARIOS[scenarioId]) {
    return {
      code: detail === 'simple' ? 'Historia única' : 'Progresión única',
      title:
        detail === 'simple'
          ? 'Evolución paso a paso en el laberinto'
          : 'Evolución progresiva por bifurcación',
      alterationsLabel:
        detail === 'precision'
          ? 'Inicio común · alteraciones acumulables'
          : detail === 'simple'
            ? 'Cada puerta cambia la historia celular'
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
    title: detail === 'simple' ? formatBiologyText(logic.title, 'simple') : logic.title,
    alterationsLabel:
      detail === 'simple'
        ? formatBiologyText(logic.alterationsLabel, 'simple')
        : logic.alterationsLabel,
  };
}

export function getTherapyDisplayName(
  therapy: TherapyRule,
  detail: MolecularDetailMode
): string {
  if (detail === 'precision') return therapy.name;
  if (detail === 'simple') {
    return THERAPY_SIMPLE_INFO[therapy.id]?.name ?? formatBiologyText(therapy.name, 'simple');
  }
  return THERAPY_LOGIC_NAMES[therapy.id]?.name ?? formatBiologyText(therapy.name, 'logic');
}

export function getTherapyDisplayShort(
  therapy: TherapyRule,
  detail: MolecularDetailMode
): string {
  if (detail === 'precision') return therapy.shortName;
  if (detail === 'simple') {
    return (
      THERAPY_SIMPLE_INFO[therapy.id]?.shortName ?? formatBiologyText(therapy.shortName, 'simple')
    );
  }
  return THERAPY_LOGIC_NAMES[therapy.id]?.shortName ?? formatBiologyText(therapy.shortName, 'logic');
}

export function getTherapyDisplayInfo(
  therapy: TherapyRule,
  detail: MolecularDetailMode
): { name: string; shortName: string; mechanism: string; cloneEffectsSummary: string } {
  if (detail === 'simple') {
    return THERAPY_SIMPLE_INFO[therapy.id];
  }
  return {
    name: getTherapyDisplayName(therapy, detail),
    shortName: getTherapyDisplayShort(therapy, detail),
    mechanism: formatBiologyText(therapy.mechanism, detail),
    cloneEffectsSummary: formatBiologyText(therapy.cloneEffectsSummary, detail),
  };
}

export function getDiagnosticDisplayInfo(
  tool: DiagnosticToolDef,
  detail: MolecularDetailMode
): { name: string; shortName: string; summary: string; revealsDescription: string } {
  if (detail === 'simple') {
    return DIAGNOSTIC_SIMPLE_INFO[tool.id];
  }
  return {
    name: formatBiologyText(tool.name, detail),
    shortName: formatBiologyText(tool.shortName, detail),
    summary: formatBiologyText(tool.summary, detail),
    revealsDescription: formatBiologyText(tool.revealsDescription, detail),
  };
}

export function getHallmarkDisplayInfo(
  hallmark: HallmarkDefinition,
  detail: MolecularDetailMode
): { name: string; shortLabel: string; description: string } {
  if (detail === 'simple') {
    return HALLMARK_SIMPLE_INFO[hallmark.id];
  }
  return {
    name: hallmark.name,
    shortLabel: hallmark.shortLabel,
    description: formatBiologyText(hallmark.description, detail),
  };
}

export function getEnablingDisplayName(
  enabling: EnablingCharacteristicDef,
  detail: MolecularDetailMode
): string {
  if (detail === 'simple') {
    return ENABLING_SIMPLE_NAMES[enabling.id];
  }
  return enabling.name;
}

export function getCancerDoorShortLabel(
  strategyId: string,
  fallbackLabel: string,
  detail: MolecularDetailMode
): string {
  const normalizedId = strategyId.replace(/^r\d+-/, '');
  const mapped =
    CANCER_STRATEGY_DOOR_LABELS[strategyId] ?? CANCER_STRATEGY_DOOR_LABELS[normalizedId];
  if (mapped) {
    if (detail === 'precision') return mapped.precision;
    if (detail === 'simple') return mapped.simple ?? mapped.logic;
    return mapped.logic;
  }
  const formatted = formatBiologyText(fallbackLabel, detail);
  return formatted.length > 16 ? formatted.slice(0, 16).trim() : formatted;
}

interface StrategyLevelCopy {
  title: string;
  effect: string;
  cost: string;
}

const CANCER_STRATEGY_3LEVEL_COPY: Record<
  string,
  Record<MolecularDetailMode, StrategyLevelCopy>
> = {
  'prob-egfr': {
    simple: {
      title: 'Hacer que la célula reaccione más fuerte a la señal de crecer',
      effect: 'Se multiplica más rápido mientras el tejido envíe la señal, gastando poca energía.',
      cost: 'Si la señal del tejido desaparece, vuelve a frenarse.',
    },
    logic: {
      title: 'Aumentar la respuesta del receptor a una señal externa',
      effect: 'Acelera la división mientras haya señal externa disponible, con bajo gasto energético inicial.',
      cost: 'Sigue dependiendo de una señal externa y de superar los frenos del ciclo celular.',
    },
    precision: {
      title: 'Amplificar el receptor de membrana EGFR',
      effect: 'EGFR capta factores de crecimiento externos con mayor sensibilidad y activa vías de división con bajo costo inicial.',
      cost: 'Aún depende de estímulo externo (ligando) y de superar los puntos de control (RB1/TP53).',
    },
  },
  'prob-kras': {
    simple: {
      title: 'Seguir dividiéndose aunque deje de recibir la señal',
      effect: 'La célula mantiene activa su orden de multiplicarse incluso sin señales del tejido.',
      cost: 'Consume mucha energía y puede dañar su ADN al copiarse demasiado rápido.',
    },
    logic: {
      title: 'Mantener activa la señal de división aunque falte el estímulo externo',
      effect: 'La vía que estimula la división permanece activa aunque el receptor deje de recibir la señal externa.',
      cost: 'Eleva el consumo de glucosa y el estrés al copiar el ADN, lo que puede activar alarmas de daño.',
    },
    precision: {
      title: 'Activar KRAS para señalización autónoma (vía MAPK)',
      effect: 'KRAS mantiene encendida la cascada proliferativa distal aunque el receptor EGFR no reciba señal externa.',
      cost: 'Incrementa el estrés replicativo y la demanda de glucosa y oxígeno.',
    },
  },
  'prob-pik3ca': {
    simple: {
      title: 'Aprovechar mejor el alimento y resistir el apagado celular',
      effect: 'Ayuda a la célula a sobrevivir cuando hay poco espacio o mucho desgaste al dividirse.',
      cost: 'Necesita suministro constante de nutrientes; si faltan, se agota más rápido.',
    },
    logic: {
      title: 'Aumentar la captación de nutrientes y resistir señales de apoptosis',
      effect: 'Mejora el uso de glucosa y ayuda a sobrevivir aunque haya estrés por división rápida.',
      cost: 'Depende de un suministro continuo de nutrientes y exige alto consumo energético.',
    },
    precision: {
      title: 'Activar PIK3CA en la vía PI3K/AKT',
      effect: 'PIK3CA impulsa la captación de glucosa y señales de supervivencia que elevan el umbral de apoptosis.',
      cost: 'Aumenta la demanda metabólica sostenida y la fragilidad ante falta de nutrientes.',
    },
  },
  'prob-cdk6': {
    simple: {
      title: 'Acelerar el ritmo al que la célula se divide',
      effect: 'Reduce la espera entre una división y la siguiente para formar más células en menos tiempo.',
      cost: 'Si los frenos naturales del tejido siguen funcionando, todavía pueden detenerla.',
    },
    logic: {
      title: 'Acelerar el paso a la fase de división del ciclo celular',
      effect: 'Acorta la pausa previa a duplicar el ADN y expande la población más rápido.',
      cost: 'Si el freno principal del ciclo sigue intacto, las señales de detención aún pueden frenarla.',
    },
    precision: {
      title: 'Hiperactivar la quinasa CDK6 del ciclo celular',
      effect: 'CDK6 fosforila e inactiva parcialmente a RB1, acelerando la transición G1/S hacia la división.',
      cost: 'Sigue limitada si RB1 y los controles de daño al ADN permanecen funcionales.',
    },
  },
  'prob-pten': {
    simple: {
      title: 'Quitar el freno interno del consumo de energía',
      effect: 'Mantiene encendidas las señales de supervivencia incluso cuando bajan las señales del tejido.',
      cost: 'Gasta mucha energía de base y agota rápido los recursos del entorno.',
    },
    logic: {
      title: 'Eliminar el freno interno de la vía de crecimiento y supervivencia',
      effect: 'Deja encendida la señal de supervivencia y reduce la apoptosis aunque falte señal del receptor.',
      cost: 'Sube el gasto energético basal y acelera el agotamiento de nutrientes locales.',
    },
    precision: {
      title: 'Inactivar el supresor PTEN (freno de PI3K/AKT)',
      effect: 'Sin la fosfatasa PTEN, la señal PI3K/AKT queda desinhibida y sostiene la supervivencia celular.',
      cost: 'Aumenta el gasto energético basal y la sensibilidad a falta prolongada de oxígeno.',
    },
  },
  'prob-rb1': {
    simple: {
      title: 'Romper el freno principal que detiene la división',
      effect: 'La célula sigue multiplicándose incluso cuando el tejido vecino le ordena parar.',
      cost: 'Dividirse sin pausa produce más errores en el ADN y puede disparar alarmas internas.',
    },
    logic: {
      title: 'Inactivar el freno principal del ciclo celular',
      effect: 'Ignora las señales de detención del tejido vecino y mantiene abierta la entrada al ciclo celular.',
      cost: 'Aumenta los errores al replicar el ADN y el estrés celular.',
    },
    precision: {
      title: 'Inactivar el supresor RB1 (punto de control G1/S)',
      effect: 'Perder RB1 elimina el freno principal de entrada a la fase S frente a señales antiproliferativas.',
      cost: 'Eleva el estrés replicativo y activa respuestas de daño al ADN si TP53 sigue activo.',
    },
  },
  'prob-tp53': {
    simple: {
      title: 'Apagar la alarma que revisa si el ADN está dañado',
      effect: 'La célula sigue viva y dividiéndose aunque acumule errores graves en su interior.',
      cost: 'Tantos errores crean marcas anormales que facilitan que las defensas la reconozcan.',
    },
    logic: {
      title: 'Anular la alarma principal ante daño en el ADN',
      effect: 'Impide detener el ciclo celular o activar la apoptosis cuando el ADN acumula daños.',
      cost: 'Genera más alteraciones anómalas que hacen a la célula más visible para los linfocitos T.',
    },
    precision: {
      title: 'Inactivar TP53 (guardián de respuesta al daño del ADN)',
      effect: 'Sin p53, el daño genómico ya no induce arresto del ciclo ni apoptosis intrínseca eficaz.',
      cost: 'Aumenta la inestabilidad genómica y la carga de neoantígenos visibles para linfocitos T.',
    },
  },
  'prob-cdkn2a': {
    simple: {
      title: 'Quitar el límite de envejecimiento de la célula',
      effect: 'Permite seguir multiplicándose muchas veces sin entrar en reposo permanente.',
      cost: 'Exige más alimento y acumula desgaste en el ADN tras tantas divisiones.',
    },
    logic: {
      title: 'Suprimir el freno de envejecimiento celular',
      effect: 'Evita que la célula entre en senescencia tras muchas divisiones o estrés proliferativo.',
      cost: 'Aumenta la necesidad de nutrientes y la exposición a daños acumulados en el ADN.',
    },
    precision: {
      title: 'Inactivar CDKN2A (reguladores p16 y p14ARF)',
      effect: 'Anula el freno de senescencia que bloquea CDK4/6 y estabiliza la respuesta de p53.',
      cost: 'Sostiene divisiones prolongadas a costa de mayor fragilidad ante hipoxia y daño al ADN.',
    },
  },
  'prob-atm': {
    simple: {
      title: 'Desactivar el detector temprano de roturas en el ADN',
      effect: 'Evita que la célula se detenga de inmediato cuando aparecen daños al copiarse.',
      cost: 'Deja errores sin reparar y vuelve a la célula más llamativa para las defensas.',
    },
    logic: {
      title: 'Desactivar el sensor temprano de roturas en el ADN',
      effect: 'Retrasa la alerta que detiene el ciclo celular ante roturas durante la división.',
      cost: 'Incrementa la inestabilidad del ADN y la exposición de señales anómalas ante el sistema inmune.',
    },
    precision: {
      title: 'Inactivar la quinasa ATM (sensor de roturas del ADN)',
      effect: 'Impide activar con rapidez a TP53 y la reparación ante roturas de doble cadena.',
      cost: 'Eleva la inestabilidad cromosómica y la visibilidad frente a vigilancia inmune.',
    },
  },
  'prob-bax': {
    simple: {
      title: 'Desconectar el botón de apagado seguro de la célula',
      effect: 'La célula sobrevive incluso cuando recibe señales internas fuertes para apagarse.',
      cost: 'No la hace crecer más rápido y sigue siendo vulnerable al ataque directo de las defensas.',
    },
    logic: {
      title: 'Inactivar el ejecutor de la muerte celular programada',
      effect: 'Bloquea el paso final de la apoptosis desde la mitocondria aunque exista daño interno.',
      cost: 'Aporta poco impulso a la división y no frena la destrucción por linfocitos T.',
    },
    precision: {
      title: 'Inactivar BAX (ejecutor mitocondrial de apoptosis)',
      effect: 'Sin BAX, la señal de daño al ADN no logra perforar la mitocondria ni ejecutar la apoptosis.',
      cost: 'No acelera la mitosis ni impide la citotoxicidad extrínseca por linfocitos T.',
    },
  },
  'prob-bcl2': {
    simple: {
      title: 'Levantar un escudo para evitar el apagado celular',
      effect: 'Mantiene vivas a las células aunque falten nutrientes o haya daño interno grave.',
      cost: 'Hace que se dividan un poco más despacio y gasten energía en mantener ese escudo.',
    },
    logic: {
      title: 'Bloquear la apoptosis desde la mitocondria',
      effect: 'Eleva el umbral necesario para que la célula muera frente a daño grave o falta de nutrientes.',
      cost: 'Reduce ligeramente la velocidad de división y exige energía de mantenimiento.',
    },
    precision: {
      title: 'Sobreexpresar BCL2 (bloqueador antiapoptótico)',
      effect: 'BCL2 secuestra proteínas proapoptóticas como BAX en la mitocondria y frena la apoptosis intrínseca.',
      cost: 'Disminuye la tasa proliferativa basal y mantiene exposición a la respuesta inmune.',
    },
  },
  'prob-met': {
    simple: {
      title: 'Activar una ruta alterna para crecer e invadir tejidos vecinos',
      effect: 'Permite seguir creciendo por otro camino y moverse fuera de los límites del tejido.',
      cost: 'Gasta mucha energía; funciona mal si escasean oxígeno y alimento.',
    },
    logic: {
      title: 'Activar un receptor alterno que impulsa división y migración',
      effect: 'Abre una segunda vía de señalización y facilita invadir tejidos vecinos.',
      cost: 'Tiene un alto costo energético y compite mal cuando faltan oxígeno y glucosa.',
    },
    precision: {
      title: 'Amplificar el receptor alterno MET (vía HGF/MET)',
      effect: 'MET reactiva señalización paralela hacia PI3K/MAPK y promueve motilidad e invasión tisular.',
      cost: 'Exige alto consumo metabólico bajo restricción de oxígeno y glucosa.',
    },
  },
  'prob-vegfa': {
    simple: {
      title: 'Enviar señales para atraer nuevos vasos sanguíneos',
      effect: 'Lleva más oxígeno y alimento hacia las zonas internas del tumor cuando crece.',
      cost: 'Esos mismos vasos facilitan que lleguen células de defensa al tumor.',
    },
    logic: {
      title: 'Liberar señales para atraer nuevos vasos sanguíneos',
      effect: 'Aumenta el aporte de oxígeno y nutrientes hacia las zonas con mayor consumo energético.',
      cost: 'Los vasos nuevos también facilitan la entrada de linfocitos del sistema inmune.',
    },
    precision: {
      title: 'Activar señal angiogénica VEGFA',
      effect: 'VEGFA induce formación de nuevos vasos locales para aliviar hipoxia y escasez de nutrientes.',
      cost: 'La vasculatura permeable incrementa la infiltración de linfocitos inmunes.',
    },
  },
  'prob-pdl1': {
    simple: {
      title: 'Poner un disfraz que frena a las defensas del cuerpo',
      effect: 'Reduce el ataque de las células de defensa cuando estas vigilan el tejido.',
      cost: 'Gasta energía extra y casi no ayuda a multiplicarse más rápido.',
    },
    logic: {
      title: 'Mostrar una señal inhibidora que frena a los linfocitos T',
      effect: 'Reduce la eliminación del tumor cuando hay vigilancia inmune activa en el tejido.',
      cost: 'Consume recursos energéticos y aporta muy poco impulso directo a la división.',
    },
    precision: {
      title: 'Expresar PD-L1 (CD274) en la membrana celular',
      effect: 'PD-L1 se une a PD-1 en linfocitos T citotóxicos e inhibe su respuesta de eliminación.',
      cost: 'Implica costo metabólico continuo y bajo impacto directo sobre la velocidad mitótica.',
    },
  },
};

export function getCancerStrategyDisplayInfo(
  strategy: CancerStrategyOption,
  detail: MolecularDetailMode
): StrategyLevelCopy {
  const problemId = strategy.problemMutation?.id ?? strategy.id.replace(/^r\d+-/, '');
  const entry = CANCER_STRATEGY_3LEVEL_COPY[problemId];
  if (entry) {
    return entry[detail];
  }
  return {
    title: formatBiologyText(strategy.label, detail),
    effect: formatBiologyText(strategy.advantage, detail),
    cost: formatBiologyText(strategy.cost, detail),
  };
}

const ONCOLOGIST_SIMPLE_PREDICTIONS: Partial<
  Record<PredictionOption['expectedOutcomeTag'], string>
> = {
  therapy_response:
    'Este tratamiento reducirá las células del tumor con un desgaste manejable para el cuerpo.',
  resistant_outgrowth:
    'Algunos grupos de células resistirán este tratamiento y seguirán creciendo.',
  toxicity_limit:
    'El desgaste en el cuerpo será el principal problema al aplicar o repetir este tratamiento.',
  qol_preservation:
    'Un manejo cuidadoso o de soporte preservará el bienestar del paciente y aliviará el desgaste.',
  stable_control:
    'Un tratamiento intenso eliminará todas las células del tumor sin producir efectos secundarios.',
};

export function getOncologistPredictionLabel(
  prediction: PredictionOption,
  detail: MolecularDetailMode
): string {
  if (detail === 'simple') {
    if (prediction.isDistractor) {
      return (
        ONCOLOGIST_SIMPLE_PREDICTIONS.stable_control ??
        formatBiologyText(prediction.label, 'simple')
      );
    }
    return (
      ONCOLOGIST_SIMPLE_PREDICTIONS[prediction.expectedOutcomeTag] ??
      formatBiologyText(prediction.label, 'simple')
    );
  }
  return formatBiologyText(prediction.label, detail);
}

export interface OncologistFindingItem {
  label: string;
  value: string;
}

export interface OncologistFindingsSummary {
  items: OncologistFindingItem[];
  interventionGuidance: string;
}

/**
 * Summarizes what the Oncologist has already discovered from completed studies
 * and translates those findings into actionable guidance for the Intervention round.
 */
export function getOncologistFindingsSummary(
  state: SimulationState,
  detail: MolecularDetailMode
): OncologistFindingsSummary {
  const items: OncologistFindingItem[] = [];
  const dominant = state.clones.reduce((a, b) => (b.share > a.share ? b : a), state.clones[0]);

  // 1. Extent (only shown as known if revealedExtent is true!)
  if (state.revealedExtent) {
    const extentLabel =
      state.clinical.diseaseExtent === 'localizada'
        ? detail === 'simple'
          ? 'En un solo sitio (localizada)'
          : 'Localizada'
        : state.clinical.diseaseExtent === 'regional'
          ? detail === 'simple'
            ? 'Extendida a tejidos cercanos (regional)'
            : 'Regional'
          : detail === 'simple'
            ? 'Extendida a varias zonas (diseminada)'
            : 'Diseminada';
    items.push({ label: 'Extensión confirmada', value: extentLabel });
  } else {
    items.push({
      label: 'Extensión',
      value:
        detail === 'simple'
          ? 'Sin confirmar (se averigua con Estudio de imágenes)'
          : 'Sin definir (requiere Estudio de imágenes)',
    });
  }

  // 2. Revealed pathways / genes
  if (state.revealedGenes.length > 0) {
    const altered: string[] = [];
    const intact: string[] = [];
    for (const sym of state.revealedGenes) {
      const st = dominant.genotype[sym];
      const name =
        detail === 'precision'
          ? sym
          : detail === 'simple'
            ? GENE_TO_SIMPLE_MAP[sym]?.shortTitle ?? sym
            : GENE_TO_PROCESS_MAP[sym]?.shortTitle ?? sym;
      if (st === 'activated' || st === 'inactivated') {
        altered.push(
          detail === 'precision'
            ? `${sym}${st === 'activated' ? '↑' : '✕'}`
            : `${name} (${st === 'activated' ? 'activo' : 'perdido'})`
        );
      } else if (st === 'functional') {
        intact.push(name);
      }
    }
    if (altered.length > 0) {
      items.push({
        label: detail === 'simple' ? 'Cambios detectados' : 'Alteraciones detectadas',
        value: altered.slice(0, 4).join(', '),
      });
    } else if (intact.length > 0) {
      items.push({
        label: detail === 'simple' ? 'Frenos revisados' : 'Controles evaluados',
        value:
          detail === 'simple'
            ? `Siguen funcionando (${intact.slice(0, 3).join(', ')})`
            : `Funcionales (${intact.slice(0, 3).join(', ')})`,
      });
    }
  }

  // 3. Clonal subpopulations
  if (state.revealedClonalHeterogeneity) {
    items.push({
      label: detail === 'simple' ? 'Grupos de células' : 'Composición clonal',
      value: `${state.clones.length} grupos (principal: ${dominant.share}% de la población)`,
    });
  }

  // 4. Immune / vascular biomarkers
  if (state.revealedBiomarkers) {
    const hasPdl1 = state.clones.some((c) => c.share >= 12 && c.genotype.PDL1 === 'activated');
    const hasVegf = state.clones.some((c) => c.share >= 12 && c.genotype.VEGFA === 'activated');
    items.push({
      label: detail === 'simple' ? 'Defensas y vasos' : 'Biomarcadores',
      value: hasPdl1
        ? detail === 'simple'
          ? 'El tumor usa disfraz frente a las defensas'
          : detail === 'precision'
            ? 'PD-L1 elevado (favorable a inmunoterapia)'
            : 'Señal inhibidora inmune elevada'
        : hasVegf
          ? detail === 'simple'
            ? 'Bajo disfraz inmune; está atrayendo nuevos vasos'
            : detail === 'precision'
              ? 'PD-L1 bajo; VEGFA elevado'
              : 'Evasión inmune baja; señal vascular activa'
          : detail === 'simple'
            ? 'Sin disfraz inmune elevado por ahora'
            : detail === 'precision'
              ? 'PD-L1 y VEGFA en nivel basal'
              : 'Evasión inmune y señal vascular bajas',
    });
  }

  // Build concise intervention guidance from what has actually been discovered
  const hints: string[] = [];
  if (state.revealedExtent) {
    if (state.clinical.diseaseExtent === 'localizada') {
      hints.push(
        detail === 'simple'
          ? 'Como el tumor está en un solo sitio, cirugía o radioterapia pueden reducirlo directamente.'
          : 'Al estar localizado, opciones locales como cirugía o radioterapia son viables.'
      );
    } else if (state.clinical.diseaseExtent === 'diseminada') {
      hints.push(
        detail === 'simple'
          ? 'Como ya se extendió, una cirugía local sola no basta; conviene un tratamiento que actúe en todo el cuerpo.'
          : 'Al estar diseminado, se requiere una intervención sistémica y cuidar la tolerancia del paciente.'
      );
    }
  }
  if (state.revealedBiomarkers) {
    const hasPdl1 = state.clones.some((c) => c.share >= 12 && c.genotype.PDL1 === 'activated');
    if (hasPdl1) {
      hints.push(
        detail === 'simple'
          ? 'El disfraz frente a las defensas indica que la inmunoterapia puede ser eficaz.'
          : detail === 'precision'
            ? 'La expresión de PD-L1 respalda considerar inmunoterapia.'
            : 'La señal inhibidora inmune respalda considerar inmunoterapia.'
      );
    }
  }
  if (state.revealedGenes.includes('EGFR') || state.revealedGenes.includes('KRAS')) {
    const krasActive = state.clones.some((c) => c.share >= 15 && c.genotype.KRAS === 'activated');
    const egfrActive = state.clones.some((c) => c.share >= 15 && c.genotype.EGFR === 'activated');
    if (krasActive) {
      hints.push(
        detail === 'simple'
          ? 'Hay células con acelerador interno propio: apagar solo la antena externa no las detendrá.'
          : detail === 'precision'
            ? 'KRAS activado reduce la eficacia de bloquear solo EGFR.'
            : 'La vía interna autónoma reduce la eficacia de bloquear solo el receptor de membrana.'
      );
    } else if (egfrActive) {
      hints.push(
        detail === 'simple'
          ? 'El tumor depende de su antena externa: bloquearla puede frenarlo con poco desgaste.'
          : detail === 'precision'
            ? 'La dependencia de EGFR sin KRAS activo favorece una terapia dirigida anti-EGFR.'
            : 'La dependencia del receptor de crecimiento favorece bloquear esa vía con baja toxicidad.'
      );
    }
  }
  if (state.clinical.cumulativeToxicity >= 40) {
    hints.push(
      detail === 'simple'
        ? 'El desgaste acumulado es alto: considera observar o elegir una opción más suave.'
        : 'La toxicidad acumulada es alta: valora pausar en observación o reducir intensidad.'
    );
  }

  const interventionGuidance =
    hints.length > 0
      ? hints.slice(0, 2).join(' ')
      : state.completedDiagnostics.length === 0
        ? detail === 'simple'
          ? 'Aún no has hecho estudios. Decidir ahora implica actuar con poca información sobre el tumor.'
          : 'Aún no cuentas con estudios previos. Puedes intervenir o mantener observación hasta el próximo estudio.'
        : detail === 'simple'
          ? 'Compara qué mecanismo ataca cada tratamiento y cuánto desgaste produce en el paciente.'
          : 'Relaciona los hallazgos confirmados con el mecanismo y la toxicidad de cada intervención.';

  return { items, interventionGuidance };
}

/**
 * Generates a warm, crystal-clear everyday Spanish summary of the live game state
 * for novice audiences when "Modo Simple" is active.
 */
export function describeCurrentSituationSimple(state: SimulationState): string {
  const burden = state.clinical.tumorBurden;
  const qol = state.clinical.qualityOfLife;
  const tox = state.clinical.cumulativeToxicity;

  if (state.mode === 'cancer') {
    if (burden < 30) {
      return 'Las células apenas comienzan a descontrolarse, pero los frenos y defensas del cuerpo todavía son fuertes.';
    }
    if (burden < 60) {
      return 'El grupo de células ya rompió varios frenos naturales y está ganando espacio en el tejido.';
    }
    if (burden < 85) {
      return 'El tumor crece rápido y busca nuevos recursos mientras las defensas del cuerpo pierden fuerza.';
    }
    return 'El cáncer domina casi todo el tejido y está muy cerca de superar todas las barreras.';
  }

  // Oncologist mode
  if (burden <= 12) {
    return 'El tumor es muy pequeño y el cuerpo está fuerte. Puedes vigilarlo de cerca o confirmar con estudios suaves sin desgastar al paciente.';
  }
  if (tox >= 45 || qol <= 52) {
    return 'El paciente siente el desgaste de los tratamientos. Conviene descansar con Observación o elegir opciones más suaves para recuperar fuerzas.';
  }
  if (burden >= 60) {
    return state.revealedExtent
      ? 'El tumor está muy activo y extendido. Usa estudios para detectar sus puntos débiles y combina tratamientos con cuidado del bienestar.'
      : 'El tumor está muy activo y tiene carga alta. Usa estudios para conocer su extensión y puntos débiles cuidando el bienestar.';
  }
  if (state.completedDiagnostics.length === 0) {
    return 'Todavía no conoces por dentro cómo funciona este tumor. Hacer un estudio diagnóstico te dará pistas clave antes de tratar.';
  }
  return 'El tumor sigue activo, pero ya tienes información útil para frenarlo sin descuidar la energía del paciente.';
}

/**
 * Generates an immediate plain-language takeaway for the TurnFeedbackModal in "Modo Simple".
 */
export function describeTurnResolutionSimple(
  resolution: TurnResolution,
  state: SimulationState | null
): string {
  const delta = resolution.clinicalDelta.tumorBurdenDelta;
  const toxDelta = resolution.clinicalDelta.toxicityDelta;

  if (resolution.mode === 'oncologist') {
    if (resolution.actionKind === 'diagnostic') {
      return 'Hiciste un examen para conocer mejor al tumor por dentro. No dio efectos secundarios y te prepara para decidir mejor en la próxima ronda.';
    }
    if (resolution.actionKind === 'observation') {
      if (delta <= 1) {
        return 'Decidiste observar sin medicar: el cuerpo descansó, recuperó fuerzas y el tumor casi no cambió.';
      }
      return 'Decidiste esperar sin medicar: el paciente descansó un poco, pero el tumor aprovechó el tiempo para crecer un poco más.';
    }
    if (delta <= -10) {
      return toxDelta >= 15
        ? `El tratamiento funcionó muy bien y redujo el tamaño del tumor (${delta}%), aunque dejó algo de cansancio en el cuerpo.`
        : `¡Buen golpe al tumor! Su tamaño bajó ${Math.abs(delta)}% cuidando bien el bienestar del paciente.`;
    }
    if (delta < 0) {
      return `El tratamiento ayudó a reducir el tumor (${delta}%), aunque todavía quedan células activas por controlar.`;
    }
    return 'El tumor resistió esta intervención y no se achicó; conviene revisar qué grupo de células escapó para cambiar de táctica.';
  }

  // Cancer mode
  if (delta >= 12) {
    return `Las células aprovecharon muy bien este cambio y el cáncer creció +${delta}%, superando parte de las defensas del cuerpo.`;
  }
  if (delta > 0) {
    return `El grupo de células avanzó (+${delta}%), aunque las defensas del organismo todavía intentan frenarlo.`;
  }
  return 'Las barreras del cuerpo frenaron este intento; necesitarás otra ventaja para seguir creciendo.';
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

  if (detail === 'simple') {
    return {
      drivers: [
        { value: 'EGFR', label: 'Antena externa de crecimiento encendida' },
        { value: 'KRAS', label: 'Acelerador interno siempre activo' },
        { value: 'PIK3CA', label: 'Motor de energía sobreacelerado' },
        { value: 'CDK6', label: 'Arranque de división demasiado rápido' },
      ],
      weakened: [
        { value: 'PTEN', label: 'Freno de energía dañado' },
        { value: 'RB1', label: 'Freno natural de división dañado' },
        { value: 'TP53', label: 'Inspector de seguridad del ADN apagado' },
        { value: 'BAX', label: 'Botón de apagado seguro dañado' },
      ],
      intact: [
        { value: 'TP53', label: 'Inspector de seguridad del ADN aún funciona' },
        { value: 'RB1', label: 'Freno natural de división aún funciona' },
        { value: 'PTEN', label: 'Freno de energía aún funciona' },
        { value: 'BAX', label: 'Botón de apagado seguro aún funciona' },
      ],
      vulnerabilities: [
        { value: 'egfr_tki', label: 'Depende de la antena externa (Apagar antena)' },
        { value: 'cdk46_inhibitor', label: 'Freno natural intacto (Frenar división)' },
        { value: 'pi3k_inhibitor', label: 'Depende de mucha energía (Cortar energía)' },
        { value: 'chemotherapy', label: 'Crece rápido y se puede apagar (Quimioterapia)' },
        { value: 'immunotherapy', label: 'Usa disfraz frente a defensas (Inmunoterapia)' },
      ],
    };
  }

  return {
    drivers: [
      { value: 'EGFR', label: 'Receptor de crecimiento de membrana hiperactivo' },
      { value: 'KRAS', label: 'Vía interna de señalización autónoma de división' },
      { value: 'PIK3CA', label: 'Cascada de supervivencia y metabolismo activada' },
      { value: 'CDK6', label: 'Motor de entrada al ciclo celular acelerado' },
    ],
    weakened: [
      { value: 'PTEN', label: 'Freno de la vía de supervivencia perdido' },
      { value: 'RB1', label: 'Freno del punto de control del ciclo perdido' },
      { value: 'TP53', label: 'Control de daño al ADN inactivo' },
      { value: 'BAX', label: 'Efector de muerte celular programada perdido' },
    ],
    intact: [
      { value: 'TP53', label: 'Control de daño al ADN aún funcional' },
      { value: 'RB1', label: 'Freno del punto de control del ciclo aún funcional' },
      { value: 'PTEN', label: 'Freno de supervivencia aún funcional' },
      { value: 'BAX', label: 'Efector de apoptosis aún funcional' },
    ],
    vulnerabilities: [
      { value: 'egfr_tki', label: 'Dependencia de señal externa (Bloqueo del receptor)' },
      { value: 'cdk46_inhibitor', label: 'Motor del ciclo con freno intacto (Freno del ciclo)' },
      { value: 'pi3k_inhibitor', label: 'Dependencia de supervivencia metabólica (Bloqueo de supervivencia)' },
      { value: 'chemotherapy', label: 'División rápida con apoptosis intacta (Citotóxica)' },
      { value: 'immunotherapy', label: 'Evasión inmune reversible (Inmunoterapia)' },
    ],
  };
}
