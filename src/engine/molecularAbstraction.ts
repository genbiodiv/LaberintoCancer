import { SCENARIOS } from './scenarios';
import {
  DiagnosticToolDef,
  DiagnosticToolId,
  EnablingCharacteristicDef,
  EnablingCharacteristicId,
  GeneDefinition,
  HallmarkDefinition,
  HallmarkId,
  MolecularDetailMode,
  OncologistStartStage,
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
    name: 'Estudio de imágenes (escáner)',
    shortName: 'Imágenes',
    summary:
      'Toma imágenes internas del cuerpo para ver qué tan grande es el tumor y dónde está ubicado.',
    revealsDescription:
      'Muestra si el tumor sigue en un solo sitio o ya se extendió, ayudando a saber si sirve operar o usar radioterapia.',
  },
  biopsy: {
    name: 'Biopsia (ver el tejido al microscopio)',
    shortName: 'Biopsia',
    summary:
      'Revisa una pequeña muestra del tejido para ver qué tan rápido crecen las células y si sus frenos siguen activos.',
    revealsDescription:
      'Indica si el freno de división, el inspector de seguridad del ADN y el botón de apagado siguen funcionando.',
  },
  molecular_profile: {
    name: 'Mapa interno de las células',
    shortName: 'Mapa interno',
    summary:
      'Analiza a fondo qué piezas internas del tumor están fallando y cuántos grupos de células distintas hay.',
    revealsDescription:
      'Destapa qué piezas aceleran el tumor y cuáles frenos se rompieron para elegir medicamentos más precisos.',
  },
  biomarkers: {
    name: 'Prueba de disfraz y vasos sanguíneos',
    shortName: 'Señales',
    summary:
      'Comprueba si el tumor se esconde de las defensas del cuerpo o si está creando nuevos vasos para alimentarse.',
    revealsDescription:
      'Ayuda a saber si la inmunoterapia (activar defensas) será una buena herramienta en este caso.',
  },
  response_monitoring: {
    name: 'Seguimiento de respuesta en sangre',
    shortName: 'Seguimiento',
    summary:
      'Mide cómo cambiaron los distintos grupos de células después de tus decisiones anteriores.',
    revealsDescription:
      'Avisa a tiempo si un grupo resistente empezó a crecer para poder cambiar de estrategia.',
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
    burdenPreview: '8%',
    simpleDescription:
      'Hallazgo muy pequeño y tranquilo. Vigila de cerca sin castigar al cuerpo con tratamientos innecesarios.',
    logicDescription:
      'Lesión incipiente de bajo riesgo con controles intactos; prioriza diagnóstico y seguimiento sin sobretratamiento.',
    precisionDescription:
      'Lesión mínima localizada (carga 8%) con supresores TP53/RB1/PTEN intactos; ideal para vigilancia y detección temprana.',
  },
  early: {
    label: 'Cáncer temprano',
    shortBadge: 'Inicio: Cáncer temprano',
    burdenPreview: '16%',
    simpleDescription:
      'Tumor pequeño en un solo lugar. Aún tienes varias opciones eficaces si primero estudias bien qué está pasando.',
    logicDescription:
      'Lesión proliferativa temprana localizada con frenos celulares aún activos y baja carga inicial.',
    precisionDescription:
      'Tumor localizado temprano (carga 16%, señal EGFR↑ basal) con supresores funcionales y alta ventana terapéutica.',
  },
  advanced: {
    label: 'Cáncer avanzado',
    shortBadge: 'Inicio: Cáncer avanzado',
    burdenPreview: '68%',
    simpleDescription:
      'El tumor ya es grande y se ha extendido. Deberás descubrir sus puntos débiles y cuidar mucho la fuerza del paciente.',
    logicDescription:
      'Enfermedad diseminada con varias subpoblaciones adaptadas y defensas debilitadas; exige estrategia sistémica cuidadosa.',
    precisionDescription:
      'Enfermedad diseminada (carga 68%) con subclones PIK3CA↑/TP53✕, KRAS↑/PTEN✕ y PDL1↑/MET↑; reto clínico avanzado.',
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
  // Unified progressive catalog IDs
  'prob-egfr': { simple: 'Antena crecer', logic: 'Señal membrana', precision: 'Impulso EGFR↑' },
  'prob-kras': { simple: 'Acelerador', logic: 'Señal autónoma', precision: 'Bypass KRAS↑' },
  'prob-pik3ca': { simple: 'Más energía', logic: 'Supervivencia↑', precision: 'Eje PIK3CA↑' },
  'prob-cdk6': { simple: 'División rápida', logic: 'Motor ciclo↑', precision: 'Quinasa CDK6↑' },
  'prob-pten': { simple: 'Sin freno ener.', logic: 'Freno metab.✕', precision: 'Pérdida PTEN✕' },
  'prob-cdkn2a': { simple: 'Sin seguro', logic: 'Sin freno ciclo', precision: 'Pérdida CDKN2A✕' },
  'prob-rb1': { simple: 'Romper freno', logic: 'Sin freno G1/S', precision: 'Pérdida RB1✕' },
  'prob-atm': { simple: 'Apagar alarma', logic: 'Sin sensor ADN', precision: 'Pérdida ATM✕' },
  'prob-tp53': { simple: 'Sin inspector', logic: 'Sin guardián', precision: 'Pérdida TP53✕' },
  'prob-bax': { simple: 'Sin apagado', logic: 'Sin apoptosis', precision: 'Pérdida BAX✕' },
  'prob-bcl2': { simple: 'Escudo celular', logic: 'Escudo vida↑', precision: 'Escudo BCL2↑' },
  'prob-vegfa': { simple: 'Nuevos vasos', logic: 'Angiogénesis↑', precision: 'Vasos VEGFA↑' },
  'prob-pdl1': { simple: 'Disfraz inmune', logic: 'Evasión inmune', precision: 'Escape PD-L1↑' },
  'prob-met': { simple: 'Ruta de escape', logic: 'Invasión↑', precision: 'Escape MET↑' },

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
    return 'El tumor está muy activo y extendido. Usa estudios para detectar sus puntos débiles y combina terapias con cuidado del bienestar.';
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
