export type GameMode = 'cancer' | 'oncologist';

export type OncologistRoundPhase = 'diagnostic' | 'intervention';

export type PlayMode = 'text' | 'labyrinth';

export type MolecularDetailMode = 'simple' | 'logic' | 'precision';

export type OncologistStartStage = 'surveillance' | 'early' | 'advanced';

export type GameDuration = 'quick' | 'full';

export type ScenarioId = 'UNIFIED' | 'A' | 'B' | 'C' | 'D';

export type GeneState = 'functional' | 'activated' | 'reduced' | 'inactivated';

export type GeneRole =
  | 'oncogene'
  | 'tumor_suppressor'
  | 'apoptotic'
  | 'checkpoint'
  | 'immune_modulator'
  | 'angiogenic';

export type HallmarkId =
  | 'proliferative_signaling'
  | 'evading_growth_suppressors'
  | 'resisting_cell_death'
  | 'replicative_immortality'
  | 'inducing_vasculature'
  | 'invasion_metastasis'
  | 'cellular_metabolism'
  | 'avoiding_immune_destruction'
  | 'phenotypic_plasticity';

export type EnablingCharacteristicId =
  | 'genomic_instability'
  | 'tumor_inflammation'
  | 'epigenetic_reprogramming'
  | 'microenvironment_constraints';

export interface HallmarkDefinition {
  id: HallmarkId;
  name: string;
  shortLabel: string;
  tier: 1 | 2;
  description: string;
  hanahanCategory: 'functional_capability';
  citation: string;
}

export interface EnablingCharacteristicDef {
  id: EnablingCharacteristicId;
  name: string;
  category: 'enabling_characteristic' | 'microenvironment';
  description: string;
  citation: string;
}

export interface CosmicEvidenceRecord {
  geneSymbol: string;
  cosmicGeneId: string;
  cellType: string;
  pubmedPmid: string;
  hallmark: HallmarkId;
  hallmarkLabel: string;
  impact: 'promotes' | 'suppresses';
  description: string;
  cellLine: string;
  molecularExplanation: string;
  interactionType: 'direct' | 'indirect';
}

export interface GeneDefinition {
  symbol: string;
  name: string;
  role: GeneRole;
  compartment: 'membrane' | 'cytoplasm' | 'cycle_nucleus' | 'damage_apoptosis' | 'microenvironment';
  pathway: string;
  normalFunction: string;
  alteredConsequence: string;
  position: { x: number; y: number };
  affectedHallmarks: HallmarkId[];
  cosmicEvidence: CosmicEvidenceRecord[];
}

export interface MolecularEdgeDef {
  id: string;
  source: string;
  target: string;
  relation: 'activation' | 'inhibition';
  interactionType: 'direct' | 'indirect';
  label: string;
}

export interface TumorClone {
  id: string;
  name: string;
  shortTag: string;
  origin: 'founder' | 'preexisting' | 'emergent';
  genotype: Record<string, GeneState>;
  share: number; // 0-100, sum across clones = 100 (or 0 if eradicated)
  proliferationRate: number; // 0-100
  apoptosisSensitivity: number; // 0-100
  growthFactorDependence: number; // 0-100
  metabolicCost: number; // 0-100
  immuneVisibility: number; // 0-100
  vulnerabilities: string[];
  resistanceSummary: string;
  description: string;
}

export interface OrganismDefenses {
  cellCycleCheckpoint: number; // 0-100
  dnaRepair: number; // 0-100
  senescence: number; // 0-100
  apoptosisCapacity: number; // 0-100
  immuneSurveillance: number; // 0-100
  nutrientSupply: number; // 0-100 (higher = more abundant, lower = restrictive hypoxia/starvation)
}

export type DiseaseExtent = 'localizada' | 'regional' | 'diseminada';

export type DiseaseControlStatus =
  | 'remision'
  | 'control_sostenido'
  | 'estable'
  | 'progresion'
  | 'critico';

export interface ClinicalState {
  tumorBurden: number; // 0-100 internal educational scale
  diseaseExtent: DiseaseExtent;
  functionalStatus: number; // 0-100 internal educational scale
  cumulativeToxicity: number; // 0-100 internal educational scale
  qualityOfLife: number; // 0-100 internal educational scale
  diseaseControl: DiseaseControlStatus;
}

export type DiagnosticToolId =
  | 'imaging'
  | 'biopsy'
  | 'molecular_profile'
  | 'biomarkers'
  | 'response_monitoring';

export interface DiagnosticToolDef {
  id: DiagnosticToolId;
  name: string;
  shortName: string;
  cost: number;
  summary: string;
  revealsDescription: string;
}

export type TherapyId =
  | 'surgery'
  | 'radiotherapy'
  | 'chemotherapy'
  | 'egfr_tki'
  | 'cdk46_inhibitor'
  | 'pi3k_inhibitor'
  | 'immunotherapy'
  | 'combo_targeted_chemo'
  | 'active_surveillance'
  | 'palliative_care';

export interface TherapyRule {
  id: TherapyId;
  name: string;
  shortName: string;
  category: 'local' | 'systemic' | 'targeted' | 'immune' | 'conservative';
  mechanism: string;
  applicability: string;
  cloneEffectsSummary: string;
  limitations: string;
  healthyTissueImpact: string;
  toxicityDelta: number;
  clinicalEvidenceRef: string;
  requiresExtent?: DiseaseExtent[];
  biomarkerHint?: string;
}

export interface AccumulatedProblem {
  id: string;
  roundNumber: number;
  geneSymbol: string;
  geneState: GeneState;
  logicLabel: string;
  precisionLabel: string;
  shortDoorLogic: string;
  shortDoorPrecision: string;
  summary: string;
  hallmarkId: HallmarkId;
}

export interface CancerStrategyOption {
  id: string;
  label: string;
  shortDoorLogic?: string;
  shortDoorPrecision?: string;
  cloneId: string;
  originNote: 'preexistente' | 'emergente' | 'expansion_basal';
  alterationSummary: string;
  advantage: string;
  cost: string;
  recommendedContextHint: string;
  problemMutation?: Omit<AccumulatedProblem, 'roundNumber'>;
}

export interface PredictionOption {
  id: string;
  label: string;
  rationale: string;
  expectedOutcomeTag:
    | 'clonal_expansion'
    | 'clonal_selection'
    | 'barrier_arrest'
    | 'therapy_response'
    | 'resistant_outgrowth'
    | 'toxicity_limit'
    | 'stable_control'
    | 'qol_preservation';
  isDistractor?: boolean;
}

export interface PredictionGateResult {
  allowed: boolean;
  feedback: string;
  hint: string;
  actualOutcomeTag: PredictionOption['expectedOutcomeTag'];
}

export interface RoundDefinition {
  roundNumber: number;
  title: string;
  barrierType:
    | 'growth_checkpoint'
    | 'dna_damage'
    | 'nutrient_restriction'
    | 'targeted_therapy'
    | 'immune_surveillance'
    | 'therapeutic_adaptation';
  cancerPrompt: string;
  oncologistPrompt: string;
  virtualOncologistTherapy?: TherapyId;
  cancerStrategies: CancerStrategyOption[];
  cancerPredictions: PredictionOption[];
  oncologistPredictions: PredictionOption[];
  stochasticNote?: string;
}

export interface RoundOffer extends RoundDefinition {
  oncologistPhase: OncologistRoundPhase;
  oncologistDoorDiagnostics: DiagnosticToolId[];
  oncologistDoorTherapies: TherapyId[];
}

export interface OncologistCellModel {
  primaryDriver: string;
  weakenedControl: string;
  intactControl: string;
  exploitableVulnerability: string;
  submitted: boolean;
  accuracyScore: number; // 0-100
}

export interface ScenarioDefinition {
  id: ScenarioId;
  code: string;
  title: string;
  subtitle: string;
  keyAlterationsLabel: string;
  clinicalVignette: string;
  cancerOpeningQuestion: string;
  featuredGenes: string[];
  initialClones: TumorClone[];
  initialDefenses: OrganismDefenses;
  initialClinical: ClinicalState;
  expectedModel: {
    primaryDriver: string;
    weakenedControl: string;
    intactControl: string;
    exploitableVulnerability: string;
  };
  rounds: RoundDefinition[];
}

export interface TurnResolution {
  roundNumber: number;
  mode: GameMode;
  actionKind?: 'cancer_strategy' | 'diagnostic' | 'intervention' | 'observation';
  eventTitle: string;
  actionTakenLabel: string;
  predictionLabel: string;
  predictionMatched: boolean;
  whatHappened: string;
  genesInvolved: string[];
  cellularProcessChanged: string;
  hallmarksAffected: { id: HallmarkId; direction: 'up' | 'down' | 'mixed'; note: string }[];
  evidenceCitations: { source: string; detail: string }[];
  clonesBefore: { id: string; name: string; share: number }[];
  clonesAfter: { id: string; name: string; share: number }[];
  clinicalDelta: {
    tumorBurdenDelta: number;
    toxicityDelta: number;
    qolDelta: number;
  };
  stochasticDisclosure?: string;
}

export interface ScoreBreakdown {
  molecularComprehension: number; // max 30
  causalRelations: number; // max 30
  groundedDecisions: number; // max 25
  reflection: number; // max 15
  total: number; // max 100
}

export interface ReflectionAnswers {
  q1KeyAlterations: string;
  q2HallmarksRelation: string;
  q3AlternativePath: string;
}

export interface TeacherConfig {
  defaultScenario: ScenarioId;
  defaultMode: GameMode;
  roundCount: number; // 3 to 10
  defaultUnlimitedMode?: boolean;
  maxGenesVisible: number; // 6 to 14
  hintsEnabled: boolean;
  revealMolecularInOncologist: boolean;
}

export type FinalOutcomeCode =
  | 'poblacion_eliminada'
  | 'enfermedad_contenida'
  | 'expansion_tumoral'
  | 'escape_terapeutico'
  | 'persistencia_resistente'
  | 'remision_simulada'
  | 'control_sostenido'
  | 'prioridad_calidad_vida'
  | 'enfermedad_activa'
  | 'deterioro_clinico';

export interface SimulationState {
  runId: string;
  teamName: string;
  mode: GameMode;
  duration: GameDuration;
  scenarioId: ScenarioId;
  currentRound: number;
  maxRounds: number;
  unlimitedMode?: boolean;
  oncologistStartStage?: OncologistStartStage;
  oncologistLiberation?: number; // 0-100 progress toward 100% liberation in unlimited Oncologist mode
  finished: boolean;
  outcomeCode?: FinalOutcomeCode;
  outcomeTitle?: string;
  outcomeExplanation?: string;
  clones: TumorClone[];
  defenses: OrganismDefenses;
  clinical: ClinicalState;
  hallmarkScores: Record<HallmarkId, number>;
  enablingScores: Record<EnablingCharacteristicId, number>;
  diagnosticBudget: number;
  maxDiagnosticBudget: number;
  completedDiagnostics: DiagnosticToolId[];
  revealedGenes: string[];
  revealedExtent: boolean;
  revealedClonalHeterogeneity: boolean;
  revealedBiomarkers: boolean;
  cellModel: OncologistCellModel;
  activeTherapy?: TherapyId;
  usedTherapies: TherapyId[];
  accumulatedProblems: AccumulatedProblem[];
  roundOffers: Record<number, RoundOffer>;
  randomSeed: number;
  history: TurnResolution[];
  score: ScoreBreakdown;
  reflections: ReflectionAnswers;
  teacherConfig: TeacherConfig;
  createdAt: string;
}

export interface CompletedRunSummary {
  runId: string;
  teamName: string;
  mode: GameMode;
  scenarioId: ScenarioId;
  completedAt: string;
  outcomeCode: FinalOutcomeCode;
  outcomeTitle: string;
  finalBurden: number;
  finalQol: number;
  finalToxicity: number;
  dominantCloneName: string;
  dominantCloneShare: number;
  destinationProgress?: number;
  destinationReached?: boolean;
  roundsPlayed?: number;
  unlimitedMode?: boolean;
  oncologistStartStage?: OncologistStartStage;
  playMode?: PlayMode;
  molecularDetail?: MolecularDetailMode;
  score: ScoreBreakdown;
  history: TurnResolution[];
  reflections: ReflectionAnswers;
  hallmarkScores: Record<HallmarkId, number>;
  usedTherapies: TherapyId[];
  accumulatedProblems?: AccumulatedProblem[];
  completedDiagnostics: DiagnosticToolId[];
  revealedGenes: string[];
}

export interface PerspectiveComparison {
  scenarioId: ScenarioId;
  cancerRun: CompletedRunSummary;
  oncologistRun: CompletedRunSummary;
  coincidences: string[];
  differences: string[];
  hiddenInfoInsights: string[];
  clonalSelectionLesson: string;
}
