import {
  DiagnosticToolDef,
  EnablingCharacteristicDef,
  GeneDefinition,
  HallmarkDefinition,
  MolecularEdgeDef,
  TherapyId,
  TherapyRule,
} from './types';

export const HANAHAN_CITATION =
  'Hanahan D. Hallmarks of cancer—Then and now, and beyond. Cell. 2026. DOI: 10.1016/j.cell.2025.12.049';

export const COSMIC_HOC_CITATION =
  'COSMIC Cancer Gene Census — Hallmarks of Cancer (Sondka et al., Wellcome Sanger Institute / Cell 2026 suppl.)';

export const HALLMARKS_CATALOG: HallmarkDefinition[] = [
  {
    id: 'proliferative_signaling',
    name: 'Señalización proliferativa sostenida',
    shortLabel: 'Señal proliferativa',
    tier: 1,
    description:
      'Activación persistente de receptores o vías de señalización (EGFR, KRAS, PIK3CA) que mantienen la división celular incluso cuando faltan señales externas.',
    hanahanCategory: 'functional_capability',
    citation: HANAHAN_CITATION,
  },
  {
    id: 'evading_growth_suppressors',
    name: 'Evasión de supresores del crecimiento',
    shortLabel: 'Evasión de supresores',
    tier: 1,
    description:
      'Pérdida de frenos del ciclo celular (RB1, TP53, PTEN, CDKN2A) o exceso de aceleradores (CDK6) que impiden detener la división.',
    hanahanCategory: 'functional_capability',
    citation: HANAHAN_CITATION,
  },
  {
    id: 'resisting_cell_death',
    name: 'Resistencia a la apoptosis',
    shortLabel: 'Resistencia a la apoptosis',
    tier: 1,
    description:
      'Bloqueo de la muerte celular programada mediante pérdida de TP53 o BAX, o activación de señales protectoras (PI3K/AKT, BCL2).',
    hanahanCategory: 'functional_capability',
    citation: HANAHAN_CITATION,
  },
  {
    id: 'cellular_metabolism',
    name: 'Reprogramación metabólica',
    shortLabel: 'Metabolismo tumoral',
    tier: 2,
    description:
      'Ajuste del uso de glucosa y nutrientes (vía PI3K/AKT o KRAS) para sostener el crecimiento rápido, a costa de mayor desgaste energético.',
    hanahanCategory: 'functional_capability',
    citation: HANAHAN_CITATION,
  },
  {
    id: 'avoiding_immune_destruction',
    name: 'Evasión de la respuesta inmune',
    shortLabel: 'Evasión inmune',
    tier: 2,
    description:
      'Expresión de señales inhibidoras en la membrana (como PD-L1/CD274) que frenan el ataque de los linfocitos T.',
    hanahanCategory: 'functional_capability',
    citation: HANAHAN_CITATION,
  },
  {
    id: 'inducing_vasculature',
    name: 'Inducción de nuevos vasos sanguíneos',
    shortLabel: 'Inducción vascular',
    tier: 2,
    description:
      'Liberación de señales como VEGFA para formar vasos sanguíneos y llevar oxígeno y nutrientes al interior del tumor.',
    hanahanCategory: 'functional_capability',
    citation: HANAHAN_CITATION,
  },
  {
    id: 'invasion_metastasis',
    name: 'Invasión y metástasis',
    shortLabel: 'Invasión y metástasis',
    tier: 2,
    description:
      'Capacidad de migrar, atravesar tejidos vecinos y establecer focos en otros órganos (impulsada por vías como MET).',
    hanahanCategory: 'functional_capability',
    citation: HANAHAN_CITATION,
  },
  {
    id: 'replicative_immortality',
    name: 'Inmortalidad replicativa',
    shortLabel: 'Inmortalidad celular',
    tier: 2,
    description:
      'Capacidad de seguir dividiéndose más allá del límite normal de envejecimiento celular (senescencia).',
    hanahanCategory: 'functional_capability',
    citation: HANAHAN_CITATION,
  },
  {
    id: 'phenotypic_plasticity',
    name: 'Plasticidad fenotípica',
    shortLabel: 'Plasticidad celular',
    tier: 2,
    description:
      'Capacidad de cambiar de estado celular para adaptarse al estrés del entorno o sobrevivir a un tratamiento.',
    hanahanCategory: 'functional_capability',
    citation: HANAHAN_CITATION,
  },
];

export const ENABLING_CHARACTERISTICS: EnablingCharacteristicDef[] = [
  {
    id: 'genomic_instability',
    name: 'Inestabilidad genómica y mutación',
    category: 'enabling_characteristic',
    description:
      'Característica facilitadora (no un hallmark funcional directo): la pérdida de sensores de daño como ATM o TP53 incrementa la generación aleatoria de variantes clonales.',
    citation: HANAHAN_CITATION,
  },
  {
    id: 'tumor_inflammation',
    name: 'Inflamación promotora tumoral',
    category: 'enabling_characteristic',
    description:
      'Característica facilitadora del microambiente que aporta señales de crecimiento y estrés oxidativo.',
    citation: HANAHAN_CITATION,
  },
  {
    id: 'epigenetic_reprogramming',
    name: 'Reprogramación epigenética no mutacional',
    category: 'enabling_characteristic',
    description:
      'Cambios reversibles en la expresión génica que modulan plasticidad y tolerancia transitoria a fármacos.',
    citation: HANAHAN_CITATION,
  },
  {
    id: 'microenvironment_constraints',
    name: 'Restricciones del microambiente y sistema',
    category: 'microenvironment',
    description:
      'Presiones externas ejercidas por hipoxia, disponibilidad de nutrientes, estroma y vigilancia inmune sistémica.',
    citation: HANAHAN_CITATION,
  },
];

export const GENES_LIBRARY: GeneDefinition[] = [
  {
    symbol: 'EGFR',
    name: 'Receptor del factor de crecimiento epidérmico',
    role: 'oncogene',
    compartment: 'membrane',
    pathway: 'RTK / MAPK / PI3K',
    normalFunction:
      'Tirosina quinasa transmembrana que integra señales extracelulares de crecimiento (EGF/TGF-α) hacia vías proliferativas y de supervivencia.',
    alteredConsequence:
      'Activación constitutiva (ganancia de función) que dispara señalización MAPK y PI3K incluso con bajos ligandos; crea dependencia explotable por inhibidores TKI si no hay bypass distal.',
    position: { x: 60, y: 36 },
    affectedHallmarks: ['proliferative_signaling', 'resisting_cell_death'],
    cosmicEvidence: [
      {
        geneSymbol: 'EGFR',
        cosmicGeneId: 'COSG1956',
        cellType: 'Epithelial (NSCLC)',
        pubmedPmid: '15118073',
        hallmark: 'proliferative_signaling',
        hallmarkLabel: 'Proliferative signalling',
        impact: 'promotes',
        description:
          'Mutaciones activadoras en el dominio quinasa de EGFR inducen fosforilación constitutiva y señalización proliferativa sostenida.',
        cellLine: 'HCC827 / PC-9',
        molecularExplanation:
          'Activación directa del receptor RTK -> reclutamiento de GRB2/SOS y subunidad p85 de PI3K -> flujo mitogénico continuo.',
        interactionType: 'direct',
      },
    ],
  },
  {
    symbol: 'MET',
    name: 'Receptor del factor de crecimiento de hepatocitos (c-MET)',
    role: 'oncogene',
    compartment: 'membrane',
    pathway: 'RTK Bypass / Invasión',
    normalFunction:
      'Receptor tirosina quinasa implicado en regeneración tisular, motilidad y supervivencia epitelial.',
    alteredConsequence:
      'Amplificación o sobreactivación que reactiva PI3K/AKT y MAPK en paralelo, generando resistencia adquirida a inhibidores de EGFR.',
    position: { x: 260, y: 36 },
    affectedHallmarks: ['proliferative_signaling', 'invasion_metastasis', 'resisting_cell_death'],
    cosmicEvidence: [
      {
        geneSymbol: 'MET',
        cosmicGeneId: 'COSG4233',
        cellType: 'Lung adenocarcinoma',
        pubmedPmid: '17463250',
        hallmark: 'proliferative_signaling',
        hallmarkLabel: 'Proliferative signalling',
        impact: 'promotes',
        description:
          'La amplificación de MET mantiene la señalización ERBB3-PI3K incluso bajo inhibición farmacológica de EGFR.',
        cellLine: 'HCC827-GR',
        molecularExplanation:
          'Bypass de receptor paralelo (interacción directa sobre PI3K/MAPK) que elude el bloqueo exclusivo de EGFR.',
        interactionType: 'direct',
      },
    ],
  },
  {
    symbol: 'KRAS',
    name: 'GTPasa KRAS',
    role: 'oncogene',
    compartment: 'cytoplasm',
    pathway: 'RAS / RAF / MEK / ERK',
    normalFunction:
      'Interruptor molecular unido a GTP que transmite señales desde RTK de membrana hacia la cascada MAPK y PI3K.',
    alteredConsequence:
      'Pérdida de hidrólisis de GTP -> activación constitutiva independiente de EGFR; confiere resistencia intrínseca a bloqueadores de EGFR.',
    position: { x: 60, y: 170 },
    affectedHallmarks: ['proliferative_signaling', 'cellular_metabolism'],
    cosmicEvidence: [
      {
        geneSymbol: 'KRAS',
        cosmicGeneId: 'COSG3845',
        cellType: 'Colorectal / Pancreatic / Lung',
        pubmedPmid: '19339711',
        hallmark: 'proliferative_signaling',
        hallmarkLabel: 'Proliferative signalling',
        impact: 'promotes',
        description:
          'Variantes oncogénicas en codones 12/13 mantienen KRAS unido a GTP, desacoplando la proliferación de señales extracelulares.',
        cellLine: 'A549 / SW480',
        molecularExplanation:
          'Activación directa de RAF/MEK/ERK y estímulo metabólico de captación de glucosa; anula la dependencia de receptores superiores.',
        interactionType: 'direct',
      },
    ],
  },
  {
    symbol: 'PIK3CA',
    name: 'Subunidad catalítica p110α de PI3K',
    role: 'oncogene',
    compartment: 'cytoplasm',
    pathway: 'PI3K / AKT / mTOR',
    normalFunction:
      'Quinasa lipídica que convierte PIP2 en PIP3 para activar AKT, promoviendo supervivencia y metabolismo anabólico.',
    alteredConsequence:
      'Ganancia de función que eleva PIP3/AKT de forma sostenida, reduciendo sensibilidad a apoptosis y favoreciendo el anabolismo.',
    position: { x: 260, y: 170 },
    affectedHallmarks: ['proliferative_signaling', 'resisting_cell_death', 'cellular_metabolism'],
    cosmicEvidence: [
      {
        geneSymbol: 'PIK3CA',
        cosmicGeneId: 'COSG5290',
        cellType: 'Breast / Epithelial',
        pubmedPmid: '15016963',
        hallmark: 'proliferative_signaling',
        hallmarkLabel: 'Proliferative signalling',
        impact: 'promotes',
        description:
          'Mutaciones en los dominios helicoidal o quinasa activan constitutivamente PI3K/AKT y atenúan la muerte celular.',
        cellLine: 'MCF7 / T47D',
        molecularExplanation:
          'Fosforilación directa de PIP2 a PIP3 -> activación de AKT -> inhibición de factores proapoptóticos e impulso metabólico.',
        interactionType: 'direct',
      },
    ],
  },
  {
    symbol: 'PTEN',
    name: 'Fosfatasa y homólogo de tensina',
    role: 'tumor_suppressor',
    compartment: 'cytoplasm',
    pathway: 'Freno de PI3K / AKT',
    normalFunction:
      'Fosfatasa lipídica supresora tumoral que desfosforila PIP3 a PIP2, frenando la vía PI3K/AKT.',
    alteredConsequence:
      'Pérdida de función que libera el flujo PI3K/AKT incluso con inhibición de receptores de membrana, debilitando el control de crecimiento y supervivencia.',
    position: { x: 460, y: 170 },
    affectedHallmarks: ['evading_growth_suppressors', 'resisting_cell_death', 'cellular_metabolism'],
    cosmicEvidence: [
      {
        geneSymbol: 'PTEN',
        cosmicGeneId: 'COSG5728',
        cellType: 'Glioma / Prostate / Breast',
        pubmedPmid: '9072974',
        hallmark: 'evading_growth_suppressors',
        hallmarkLabel: 'Suppression of growth',
        impact: 'suppresses',
        description:
          'La inactivación de PTEN elimina el regulador negativo principal de PIP3, desinhibiendo AKT y la supervivencia celular.',
        cellLine: 'U87MG / PC-3',
        molecularExplanation:
          'Pérdida de freno bioquímico directo sobre PI3K/AKT -> efecto indirecto en evasión apoptótica y resistencia parcial a anti-EGFR.',
        interactionType: 'direct',
      },
    ],
  },
  {
    symbol: 'CDK6',
    name: 'Quinasa dependiente de ciclina 6',
    role: 'oncogene',
    compartment: 'cycle_nucleus',
    pathway: 'Progresión G1/S',
    normalFunction:
      'En complejo con ciclina D, fosforila a RB1 para permitir la transición ordenada de fase G1 a S.',
    alteredConsequence:
      'Hiperactividad o amplificación que hiperfosforila RB1 de manera persistente; solo es sensible a inhibidores CDK4/6 si RB1 sigue funcional.',
    position: { x: 60, y: 310 },
    affectedHallmarks: ['proliferative_signaling', 'evading_growth_suppressors'],
    cosmicEvidence: [
      {
        geneSymbol: 'CDK6',
        cosmicGeneId: 'COSG1021',
        cellType: 'Hematopoietic / Breast / Glioma',
        pubmedPmid: '27521576',
        hallmark: 'evading_growth_suppressors',
        hallmarkLabel: 'Growth supp. & Prolif. signal.',
        impact: 'promotes',
        description:
          'La sobreexpresión de CDK6 acelera la inactivación por fosforilación de RB1 y empuja el paso G1/S.',
        cellLine: 'MCF7 / MOLM-13',
        molecularExplanation:
          'Inhibición directa de RB1 mediante fosforilación -> liberación del factor E2F y transcripción de genes de fase S.',
        interactionType: 'direct',
      },
    ],
  },
  {
    symbol: 'CDKN2A',
    name: 'Inhibidor de CDK p16INK4A / p14ARF',
    role: 'tumor_suppressor',
    compartment: 'cycle_nucleus',
    pathway: 'Senescencia y control G1/S',
    normalFunction:
      'Codifica p16 (inhibidor directo de CDK4/6) y p14ARF (estabilizador de TP53), acoplando el freno del ciclo y la senescencia.',
    alteredConsequence:
      'Pérdida que libera simultáneamente a CDK4/6 y debilita la respuesta de senescencia ante estrés oncogénico.',
    position: { x: 260, y: 310 },
    affectedHallmarks: ['evading_growth_suppressors', 'replicative_immortality'],
    cosmicEvidence: [
      {
        geneSymbol: 'CDKN2A',
        cosmicGeneId: 'COSG1029',
        cellType: 'Melanoma / Pancreatic',
        pubmedPmid: '8153634',
        hallmark: 'evading_growth_suppressors',
        hallmarkLabel: 'Suppression of growth',
        impact: 'suppresses',
        description:
          'Deleciones o silenciamiento de CDKN2A suprimen el freno p16 sobre CDK4/6 y atenúan la senescencia inducida por oncogenes.',
        cellLine: 'PANC-1 / A375',
        molecularExplanation:
          'Ausencia de inhibición directa sobre CDK6/CDK4 -> pérdida coordinada de punto de control G1 y barrera de senescencia.',
        interactionType: 'direct',
      },
    ],
  },
  {
    symbol: 'RB1',
    name: 'Proteína del retinoblastoma',
    role: 'checkpoint',
    compartment: 'cycle_nucleus',
    pathway: 'Punto de control G1/S',
    normalFunction:
      'Supresor clave que secuestra factores E2F impidiendo la entrada prematura en replicación del ADN (fase S).',
    alteredConsequence:
      'Inactivación que desacopla el ciclo celular del control por CDK4/6; vuelve ineficaces los inhibidores de CDK4/6.',
    position: { x: 460, y: 310 },
    affectedHallmarks: ['evading_growth_suppressors'],
    cosmicEvidence: [
      {
        geneSymbol: 'RB1',
        cosmicGeneId: 'COSG5925',
        cellType: 'Retinoblastoma / SCLC / Breast',
        pubmedPmid: '3807958',
        hallmark: 'evading_growth_suppressors',
        hallmarkLabel: 'Suppression of growth',
        impact: 'suppresses',
        description:
          'La pérdida bialélica de RB1 elimina el punto de restricción G1/S y libera la transcripción dependiente de E2F.',
        cellLine: 'MDA-MB-468 / NCI-H69',
        molecularExplanation:
          'Pérdida del freno nuclear terminal sobre E2F -> progresión autónoma de ciclo y resistencia intrínseca a bloqueo CDK4/6.',
        interactionType: 'direct',
      },
    ],
  },
  {
    symbol: 'ATM',
    name: 'Quinasa sensora de daño al ADN ATM',
    role: 'checkpoint',
    compartment: 'damage_apoptosis',
    pathway: 'Detección de roturas bicatenarias',
    normalFunction:
      'Detecta roturas de doble cadena del ADN y activa por fosforilación a TP53 y maquinaria de reparación.',
    alteredConsequence:
      'Deficiencia que reduce la señalización de daño hacia TP53 y aumenta la inestabilidad genómica facilitadora.',
    position: { x: 60, y: 455 },
    affectedHallmarks: ['evading_growth_suppressors', 'resisting_cell_death'],
    cosmicEvidence: [
      {
        geneSymbol: 'ATM',
        cosmicGeneId: 'COSG472',
        cellType: 'Lymphoid / Epithelial',
        pubmedPmid: '7792600',
        hallmark: 'evading_growth_suppressors',
        hallmarkLabel: 'Suppression of growth',
        impact: 'suppresses',
        description:
          'La pérdida de ATM altera la activación del punto de control por daño al ADN y facilita la acumulación de variantes.',
        cellLine: 'AT5BIVA',
        molecularExplanation:
          'Reducción de activación directa sobre TP53 -> efecto indirecto en inestabilidad genómica (característica facilitadora).',
        interactionType: 'direct',
      },
    ],
  },
  {
    symbol: 'TP53',
    name: 'Proteína tumoral p53',
    role: 'tumor_suppressor',
    compartment: 'damage_apoptosis',
    pathway: 'Respuesta al daño, arresto y apoptosis',
    normalFunction:
      'Factor de transcripción integrador que ante estrés oncogénico o daño al ADN induce p21 (arresto), reparación, senescencia o BAX (apoptosis).',
    alteredConsequence:
      'Inactivación que debilita simultáneamente el arresto del ciclo, la respuesta apoptótica intrínseca y la contención del daño, sin conferir invulnerabilidad absoluta.',
    position: { x: 260, y: 455 },
    affectedHallmarks: ['evading_growth_suppressors', 'resisting_cell_death'],
    cosmicEvidence: [
      {
        geneSymbol: 'TP53',
        cosmicGeneId: 'COSG7157',
        cellType: 'Pan-cancer epithelial',
        pubmedPmid: '2694356',
        hallmark: 'resisting_cell_death',
        hallmarkLabel: 'Suppression of growth',
        impact: 'suppresses',
        description:
          'Mutaciones con pérdida de función en TP53 comprometen la inducción de arresto celular y apoptosis dependiente de daño.',
        cellLine: 'HT-29 / SK-BR-3',
        molecularExplanation:
          'Fallo de transactivación de p21 y BAX/PUMA; su impacto fenotípico depende también del estado de BCL2, vías extrínsecas e inmunidad.',
        interactionType: 'direct',
      },
    ],
  },
  {
    symbol: 'BAX',
    name: 'Efector proapoptótico mitocondrial BAX',
    role: 'apoptotic',
    compartment: 'damage_apoptosis',
    pathway: 'Apoptosis intrínseca mitocondrial',
    normalFunction:
      'Proteína de la familia BCL-2 que permeabiliza la membrana externa mitocondrial para liberar citocromo c y activar caspasas.',
    alteredConsequence:
      'Inactivación que bloquea el paso efector de la apoptosis intrínseca incluso cuando TP53 detecta daño celular.',
    position: { x: 460, y: 455 },
    affectedHallmarks: ['resisting_cell_death'],
    cosmicEvidence: [
      {
        geneSymbol: 'BAX',
        cosmicGeneId: 'COSG581',
        cellType: 'Colorectal / Hematologic',
        pubmedPmid: '9005720',
        hallmark: 'resisting_cell_death',
        hallmarkLabel: 'Resisting cell death',
        impact: 'suppresses',
        description:
          'Mutaciones inactivadoras de BAX impiden la permeabilización mitocondrial y confieren resistencia a estímulos proapoptóticos intrínsecos.',
        cellLine: 'HCT116 BAX-/-',
        molecularExplanation:
          'Interrupción directa del poro mitocondrial apoptótico -> reduce eficacia de agentes citotóxicos dependientes de vía intrínseca.',
        interactionType: 'direct',
      },
    ],
  },
  {
    symbol: 'BCL2',
    name: 'Regulador antiapoptótico BCL-2',
    role: 'apoptotic',
    compartment: 'damage_apoptosis',
    pathway: 'Supervivencia mitocondrial',
    normalFunction:
      'Secuestra proteínas proapoptóticas (como BAX/BAK) para prevenir la muerte celular en ausencia de daño severo.',
    alteredConsequence:
      'Sobreexpresión que eleva el umbral apoptótico e inhibe a BAX, protegiendo al clon frente a estrés metabólico y quimioterapia.',
    position: { x: 645, y: 455 },
    affectedHallmarks: ['resisting_cell_death'],
    cosmicEvidence: [
      {
        geneSymbol: 'BCL2',
        cosmicGeneId: 'COSG596',
        cellType: 'Follicular lymphoma / Solid',
        pubmedPmid: '2983249',
        hallmark: 'resisting_cell_death',
        hallmarkLabel: 'Resisting cell death',
        impact: 'promotes',
        description:
          'La sobreexpresión de BCL2 bloquea la activación de BAX y prolonga la supervivencia celular sin incrementar por sí sola la mitosis.',
        cellLine: 'RL / Su-DHL-4',
        molecularExplanation:
          'Inhibición directa proteína-proteína sobre BAX -> elevación del umbral apoptótico mitocondrial.',
        interactionType: 'direct',
      },
    ],
  },
  {
    symbol: 'VEGFA',
    name: 'Factor de crecimiento endotelial vascular A',
    role: 'angiogenic',
    compartment: 'microenvironment',
    pathway: 'Respuesta a hipoxia / Vasculatura',
    normalFunction:
      'Señal paracrina inducida ante hipoxia para reclutar capilares y restablecer aporte de oxígeno y nutrientes.',
    alteredConsequence:
      'Expresión elevada sostenida que mitiga la restricción nutricional en masas tumorales, a costa de vasculatura desorganizada.',
    position: { x: 645, y: 170 },
    affectedHallmarks: ['inducing_vasculature', 'cellular_metabolism'],
    cosmicEvidence: [
      {
        geneSymbol: 'VEGFA',
        cosmicGeneId: 'COSG7422',
        cellType: 'Solid tumors (microenvironment)',
        pubmedPmid: '8423823',
        hallmark: 'inducing_vasculature',
        hallmarkLabel: 'Inducing vasculature',
        impact: 'promotes',
        description:
          'La secreción tumoral de VEGFA estimula angiogénesis del estroma y alivia parcialmente el estrés hipóxico.',
        cellLine: 'U87 / A431',
        molecularExplanation:
          'Señalización paracrina sobre células endoteliales del microambiente -> interacción indirecta que sostiene clones proliferativos.',
        interactionType: 'indirect',
      },
    ],
  },
  {
    symbol: 'PDL1',
    name: 'Ligando de muerte programada 1 (CD274)',
    role: 'immune_modulator',
    compartment: 'microenvironment',
    pathway: 'Punto de control inmune PD-1/PD-L1',
    normalFunction:
      'Ligando de superficie que limita la autoinmunidad frenando la actividad efectora de linfocitos T activados.',
    alteredConsequence:
      'Expresión elevada que atenúa la eliminación por linfocitos T CD8+, pero crea un blanco explotable por inmunoterapia anti-PD-1/PD-L1.',
    position: { x: 645, y: 310 },
    affectedHallmarks: ['avoiding_immune_destruction'],
    cosmicEvidence: [
      {
        geneSymbol: 'PDL1',
        cosmicGeneId: 'COSG29126',
        cellType: 'NSCLC / Melanoma / Urothelial',
        pubmedPmid: '12058044',
        hallmark: 'avoiding_immune_destruction',
        hallmarkLabel: 'Avoiding immune destruction',
        impact: 'promotes',
        description:
          'La expresión de CD274/PD-L1 en células tumorales inhibe la citotoxicidad de linfocitos T infiltrantes.',
        cellLine: 'MDA-MB-231 / H1975',
        molecularExplanation:
          'Unión directa al receptor PD-1 en linfocitos T CD8+ -> anergia efectora reversible mediante anticuerpos bloqueadores.',
        interactionType: 'direct',
      },
    ],
  },
];

export const MOLECULAR_EDGES: MolecularEdgeDef[] = [
  {
    id: 'e-egfr-kras',
    source: 'EGFR',
    target: 'KRAS',
    relation: 'activation',
    interactionType: 'direct',
    label: 'Activa RAS/MAPK',
  },
  {
    id: 'e-egfr-pik3ca',
    source: 'EGFR',
    target: 'PIK3CA',
    relation: 'activation',
    interactionType: 'direct',
    label: 'Activa PI3K',
  },
  {
    id: 'e-met-pik3ca',
    source: 'MET',
    target: 'PIK3CA',
    relation: 'activation',
    interactionType: 'direct',
    label: 'Bypass PI3K',
  },
  {
    id: 'e-met-kras',
    source: 'MET',
    target: 'KRAS',
    relation: 'activation',
    interactionType: 'direct',
    label: 'Bypass MAPK',
  },
  {
    id: 'e-kras-cdk6',
    source: 'KRAS',
    target: 'CDK6',
    relation: 'activation',
    interactionType: 'indirect',
    label: 'Induce Ciclina D/CDK',
  },
  {
    id: 'e-kras-pik3ca',
    source: 'KRAS',
    target: 'PIK3CA',
    relation: 'activation',
    interactionType: 'direct',
    label: 'Coactiva PI3K',
  },
  {
    id: 'e-pten-pik3ca',
    source: 'PTEN',
    target: 'PIK3CA',
    relation: 'inhibition',
    interactionType: 'direct',
    label: 'Desfosforila PIP3',
  },
  {
    id: 'e-pik3ca-bcl2',
    source: 'PIK3CA',
    target: 'BCL2',
    relation: 'activation',
    interactionType: 'indirect',
    label: 'Supervivencia AKT',
  },
  {
    id: 'e-pik3ca-vegfa',
    source: 'PIK3CA',
    target: 'VEGFA',
    relation: 'activation',
    interactionType: 'indirect',
    label: 'mTOR / HIF-1α',
  },
  {
    id: 'e-cdkn2a-cdk6',
    source: 'CDKN2A',
    target: 'CDK6',
    relation: 'inhibition',
    interactionType: 'direct',
    label: 'p16 inhibe CDK6',
  },
  {
    id: 'e-cdk6-rb1',
    source: 'CDK6',
    target: 'RB1',
    relation: 'inhibition',
    interactionType: 'direct',
    label: 'Fosforila e inactiva RB1',
  },
  {
    id: 'e-atm-tp53',
    source: 'ATM',
    target: 'TP53',
    relation: 'activation',
    interactionType: 'direct',
    label: 'Señal de daño ADN',
  },
  {
    id: 'e-cdkn2a-tp53',
    source: 'CDKN2A',
    target: 'TP53',
    relation: 'activation',
    interactionType: 'direct',
    label: 'p14ARF estabiliza p53',
  },
  {
    id: 'e-tp53-rb1',
    source: 'TP53',
    target: 'RB1',
    relation: 'activation',
    interactionType: 'indirect',
    label: 'p21 mantiene RB1 activo',
  },
  {
    id: 'e-tp53-bax',
    source: 'TP53',
    target: 'BAX',
    relation: 'activation',
    interactionType: 'direct',
    label: 'Induce BAX/PUMA',
  },
  {
    id: 'e-bcl2-bax',
    source: 'BCL2',
    target: 'BAX',
    relation: 'inhibition',
    interactionType: 'direct',
    label: 'Bloquea poro mitocondrial',
  },
  {
    id: 'e-pik3ca-pdl1',
    source: 'PIK3CA',
    target: 'PDL1',
    relation: 'activation',
    interactionType: 'indirect',
    label: 'Modula expresión PD-L1',
  },
];

export const DIAGNOSTIC_TOOLS: DiagnosticToolDef[] = [
  {
    id: 'imaging',
    name: 'Estudio de imágenes',
    shortName: 'Imágenes',
    cost: 1,
    summary: '¿Qué tamaño tiene el tumor y hasta dónde se ha extendido?',
    revealsDescription:
      'Tamaño del tumor, si sigue localizado o se ha extendido, y si es viable una cirugía o radioterapia.',
  },
  {
    id: 'biopsy',
    name: 'Biopsia e histopatología',
    shortName: 'Biopsia',
    cost: 1,
    summary: '¿Siguen activos los frenos del ciclo celular y la apoptosis?',
    revealsDescription:
      'Estado de los puntos de control del ciclo celular (RB1, CDK6) y de la respuesta al daño del ADN y apoptosis (TP53, BAX).',
  },
  {
    id: 'molecular_profile',
    name: 'Perfil molecular dirigido (NGS)',
    shortName: 'Perfil NGS',
    cost: 2,
    summary: '¿Qué vías de división están activadas y qué subpoblaciones existen?',
    revealsDescription:
      'Alteraciones en señalización (EGFR, KRAS, PIK3CA, PTEN, MET) y proporción de clones distintos en el tumor.',
  },
  {
    id: 'biomarkers',
    name: 'Panel de biomarcadores e inmunohistoquímica',
    shortName: 'Biomarcadores',
    cost: 1,
    summary: '¿Usa el tumor señales para evadir la respuesta inmune o atraer vasos?',
    revealsDescription:
      'Nivel de evasión inmune (PD-L1), inducción de vasos sanguíneos (VEGFA) y protección frente a la apoptosis (BCL2).',
  },
  {
    id: 'response_monitoring',
    name: 'Seguimiento molecular de respuesta (biopsia líquida)',
    shortName: 'Seguimiento',
    cost: 1,
    summary: '¿Están creciendo subclones resistentes después de las rondas anteriores?',
    revealsDescription:
      'Cambios recientes en la composición clonal y aparición de vías alternas de escape (como MET o pérdida de PTEN).',
  },
];

// Curated clinical therapeutic rules — explicitly independent of COSMIC HoC gene table
export const THERAPIES_CATALOG: TherapyRule[] = [
  {
    id: 'egfr_tki',
    name: 'Terapia dirigida anti-EGFR (TKI)',
    shortName: 'Anti-EGFR',
    category: 'targeted',
    mechanism:
      'Inhibe el dominio tirosina quinasa de EGFR, bloqueando señales mitogénicas y de supervivencia en clones dependientes del receptor.',
    applicability:
      'Justificada cuando existe activación impulsora de EGFR sin bypass constitutivo dominante (p. ej., KRAS mutado).',
    cloneEffectsSummary:
      'Alta reducción en clones EGFR-dependientes; eficacia atenuada en subclones con pérdida de PTEN, amplificación de MET o activación de KRAS.',
    limitations:
      'Puede ejercer presión selectiva que favorezca la expansión relativa de subclones resistentes preexistentes.',
    healthyTissueImpact:
      'Toxicidad moderada-baja (exantema cutáneo, diarrea leve en epitelios sanos dependientes de EGFR).',
    toxicityDelta: 10,
    clinicalEvidenceRef:
      'Lynch et al., NEJM 2004 (PMID: 15118073); Mok et al., NEJM 2009 (IPASS, PMID: 19692680) — principios conceptuales educativos.',
    biomarkerHint: 'Requiere dependencia de EGFR y ausencia de activación distal dominante.',
  },
  {
    id: 'cdk46_inhibitor',
    name: 'Inhibidor selectivo de CDK4/6',
    shortName: 'Anti-CDK4/6',
    category: 'targeted',
    mechanism:
      'Bloquea la fosforilación de RB1 mediada por ciclina D-CDK4/6, restaurando el arresto en fase G1.',
    applicability:
      'Requiere proteína RB1 funcional; resulta ineficaz si RB1 está inactivado.',
    cloneEffectsSummary:
      'Frena intensamente clones con hiperactividad de CDK6 y RB1 intacto; efecto citostático nulo en clones RB1-inactivados.',
    limitations:
      'Acción predominantemente citostática (detiene proliferación más que erradicar clones por sí solo).',
    healthyTissueImpact:
      'Mielosupresión reversible (neutropenia) en precursores hematopoyéticos en división.',
    toxicityDelta: 12,
    clinicalEvidenceRef:
      'Finn et al., NEJM 2016 (PALOMA-2, PMID: 27959613); principios de dependencia de RB1 funcional.',
    biomarkerHint: 'Indispensable comprobar estado funcional de RB1.',
  },
  {
    id: 'pi3k_inhibitor',
    name: 'Inhibidor de vía PI3K/AKT',
    shortName: 'Anti-PI3K',
    category: 'targeted',
    mechanism:
      'Inhibe la generación de PIP3 por p110α (PIK3CA) y atenúa la señalización pro-supervivencia de AKT.',
    applicability:
      'Útil en clones impulsados por activación de PIK3CA o desinhibición por pérdida de PTEN.',
    cloneEffectsSummary:
      'Reduce supervivencia y ventaja metabólica de clones PIK3CA-activados o PTEN-deficientes; menos eficaz ante bypass KRAS/MAPK.',
    limitations:
      'Activación compensatoria de vías paralelas y toxicidad metabólica limitante de dosis.',
    healthyTissueImpact:
      'Hiperglucemia reactiva y fatiga por interferencia con señalización fisiológica de insulina.',
    toxicityDelta: 15,
    clinicalEvidenceRef:
      'André et al., NEJM 2019 (SOLAR-1, PMID: 31091374) — marco conceptual educativo.',
    biomarkerHint: 'Orientado por activación de PIK3CA o pérdida de PTEN.',
  },
  {
    id: 'chemotherapy',
    name: 'Quimioterapia citotóxica sistémica',
    shortName: 'Quimioterapia',
    category: 'systemic',
    mechanism:
      'Induce daño al ADN o interfiere con la replicación en células de rápida división, disparando arresto y apoptosis vía ATM/TP53/BAX.',
    applicability:
      'Aplicable en enfermedad proliferativa extensa o sin blanco molecular único accionable.',
    cloneEffectsSummary:
      'Afecta clones de alta proliferación con apoptosis intacta; eficacia reducida si TP53 o BAX están inactivados.',
    limitations:
      'Estrecho margen terapéutico y selección de clones con defectos en apoptosis.',
    healthyTissueImpact:
      'Toxicidad sistémica significativa sobre médula ósea, mucosas y estado funcional del paciente.',
    toxicityDelta: 24,
    clinicalEvidenceRef:
      'Principios generales de farmacología antineoplásica (DeVita, Hellman & Rosenberg; ESMO Core Curriculum).',
  },
  {
    id: 'surgery',
    name: 'Resección quirúrgica',
    shortName: 'Cirugía',
    category: 'local',
    mechanism:
      'Extracción física de la masa tumoral primaria independientemente del genotipo de los clones localizados.',
    applicability:
      'Solo viable en enfermedad localizada (o regional seleccionada) con estado funcional adecuado.',
    cloneEffectsSummary:
      'Reduce bruscamente la carga tumoral de forma proporcional en todos los clones locales, pero no elimina micrometástasis diseminadas.',
    limitations:
      'No aplicable como monoterapia curativa en enfermedad diseminada; conlleva recuperación posoperatoria.',
    healthyTissueImpact:
      'Morbilidad quirúrgica transitoria moderada; sin toxicidad sistémica acumulativa.',
    toxicityDelta: 10,
    clinicalEvidenceRef:
      'Principios de oncología quirúrgica y estadificación TNM (AJCC / NCCN Conceptual Framework).',
    requiresExtent: ['localizada', 'regional'],
  },
  {
    id: 'radiotherapy',
    name: 'Radioterapia focalizada',
    shortName: 'Radioterapia',
    category: 'local',
    mechanism:
      'Genera roturas bicatenarias de ADN en el volumen irradiado, induciendo muerte mitótica, senescencia o apoptosis.',
    applicability:
      'Útil para control local o regional, especialmente si la respuesta al daño (ATM/TP53) conserva funcionalidad parcial.',
    cloneEffectsSummary:
      'Disminuye carga local y frena clones proliferativos; la hipoxia severa y pérdida de TP53/BAX atenúan su efecto apoptótico.',
    limitations:
      'Efecto limitado al campo irradiado; no controla enfermedad sistémica.',
    healthyTissueImpact:
      'Fatiga e inflamación local moderada en tejidos adyacentes.',
    toxicityDelta: 14,
    clinicalEvidenceRef:
      'Hall & Giaccia, Radiobiology for the Radiologist — principios de respuesta celular a radiación.',
  },
  {
    id: 'immunotherapy',
    name: 'Inmunoterapia (bloqueo PD-1/PD-L1)',
    shortName: 'Inmunoterapia',
    category: 'immune',
    mechanism:
      'Bloquea el eje inhibidor PD-1/PD-L1 para restaurar la citotoxicidad de linfocitos T CD8+ contra células tumorales visibles.',
    applicability:
      'Justificada cuando biomarcadores muestran expresión elevada de PD-L1 o carga antigénica con vigilancia inmune reactivable.',
    cloneEffectsSummary:
      'Capaz de eliminar clones resistentes a apoptosis intrínseca (incluso TP53/BAX inactivados) mediante citotoxicidad inmune extrínseca.',
    limitations:
      'Respuesta baja en tumores inmunológicamente fríos (sin expresión de PD-L1 ni infiltrado T).',
    healthyTissueImpact:
      'Toxicidad autoinmune moderada (eventos adversos inmunomediados manejables).',
    toxicityDelta: 12,
    clinicalEvidenceRef:
      'Reck et al., NEJM 2016 (KEYNOTE-024, PMID: 27718847); Hanahan, Cell 2026.',
    biomarkerHint: 'Requiere contexto inmune favorable o expresión de PD-L1.',
  },
  {
    id: 'combo_targeted_chemo',
    name: 'Combinación intensiva (dirigida + citotóxica)',
    shortName: 'Combinación',
    category: 'systemic',
    mechanism:
      'Ataca simultáneamente una vía de señalización impulsora y la replicación del ADN para reducir el escape clonal.',
    applicability:
      'Solo razonable si el paciente conserva buen estado funcional y baja toxicidad acumulada.',
    cloneEffectsSummary:
      'Cobertura más amplia sobre clones heterogéneos, pero a expensas de alta presión tóxica sistémica.',
    limitations:
      'Nunca es automáticamente óptima: la toxicidad acumulada puede deteriorar gravemente la calidad de vida y obligar a suspender tratamiento.',
    healthyTissueImpact:
      'Toxicidad elevada combinada (hematológica, mucosa y deterioro funcional rápido).',
    toxicityDelta: 34,
    clinicalEvidenceRef:
      'Principios de toxicidad limitante de dosis y equilibrio beneficio/riesgo en oncología médica (ESMO).',
  },
  {
    id: 'active_surveillance',
    name: 'Vigilancia activa y recuperación',
    shortName: 'Vigilancia',
    category: 'conservative',
    mechanism:
      'Pausa terapéutica monitorizada que permite recuperación de tejidos sanos mientras se observa la dinámica tumoral.',
    applicability:
      'Apropiada cuando la enfermedad está controlada/estable o la toxicidad acumulada exige descanso terapéutico.',
    cloneEffectsSummary:
      'No reduce directamente la carga tumoral, pero evita presión selectiva innecesaria y recupera capacidad funcional e inmune.',
    limitations:
      'Riesgo de crecimiento progresivo si existen clones de alta proliferación no contenidos.',
    healthyTissueImpact:
      'Reduce toxicidad acumulada y mejora la calidad de vida del paciente.',
    toxicityDelta: -16,
    clinicalEvidenceRef:
      'Principios de desescalada terapéutica y manejo de toxicidad en guías clínicas oncológicas.',
  },
  {
    id: 'palliative_care',
    name: 'Control de síntomas y calidad de vida',
    shortName: 'Calidad de vida',
    category: 'conservative',
    mechanism:
      'Prioriza el alivio sintomático, soporte funcional y bienestar integral cuando el tratamiento intensivo ofrece más daño que beneficio.',
    applicability:
      'Decisión clínicamente válida y ética ante toxicidad elevada, progresión refractaria o deterioro del estado funcional.',
    cloneEffectsSummary:
      'No busca erradicación tumoral; protege activamente la dignidad, función y calidad de vida del paciente.',
    limitations:
      'La enfermedad tumoral puede continuar su curso natural, aunque el daño iatrogénico se detiene.',
    healthyTissueImpact:
      'Beneficio directo sobre calidad de vida y descenso marcado de toxicidad relacionada con tratamientos.',
    toxicityDelta: -22,
    clinicalEvidenceRef:
      'Temel et al., NEJM 2010 (Early Palliative Care, PMID: 20818875); consenso ASCO/ESMO.',
  },
];

export function getGeneBySymbol(symbol: string): GeneDefinition | undefined {
  return GENES_LIBRARY.find((g) => g.symbol === symbol);
}

export function getTherapyById(id: TherapyId): TherapyRule | undefined {
  return THERAPIES_CATALOG.find((t) => t.id === id);
}

export function getHallmarkById(id: string): HallmarkDefinition | undefined {
  return HALLMARKS_CATALOG.find((h) => h.id === id);
}
