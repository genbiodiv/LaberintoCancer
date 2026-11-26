import {
  COSMIC_HOC_CITATION,
  DIAGNOSTIC_TOOLS,
  GENES_LIBRARY,
  HANAHAN_CITATION,
  THERAPIES_CATALOG,
  getTherapyById,
} from './knowledgeBase';
import {
  applyProblemToClones,
  createOncologistStageBaseline,
  createSeededRng,
  createUnifiedInitialClinical,
  createUnifiedInitialClones,
  createUnifiedInitialDefenses,
  deriveExpectedCellModel,
  generateRoundOffer,
  getActiveRoundOffer,
  pickOncologistAdaptiveProblem,
  UNIFIED_FEATURED_GENES,
} from './progressionEngine';
import { computeDestinationProgress } from './destinationMetrics';
import {
  ClinicalState,
  CompletedRunSummary,
  CosmicEvidenceRecord,
  DiagnosticToolId,
  DiseaseControlStatus,
  EnablingCharacteristicId,
  FinalOutcomeCode,
  GameDuration,
  GameMode,
  GeneState,
  HallmarkId,
  MolecularDetailMode,
  OncologistCellModel,
  OncologistStartStage,
  OrganismDefenses,
  PerspectiveComparison,
  PlayMode,
  PredictionGateResult,
  PredictionOption,
  ReflectionAnswers,
  ScenarioId,
  ScoreBreakdown,
  SimulationState,
  TeacherConfig,
  TherapyId,
  TumorClone,
  TurnResolution,
} from './types';

export const DEFAULT_TEACHER_CONFIG: TeacherConfig = {
  defaultScenario: 'UNIFIED',
  defaultMode: 'cancer',
  roundCount: 5,
  defaultUnlimitedMode: true,
  maxGenesVisible: 10,
  hintsEnabled: true,
  revealMolecularInOncologist: false,
};

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, Math.round(val)));
}

function cloneArray(clones: TumorClone[]): TumorClone[] {
  return clones.map((c) => ({
    ...c,
    genotype: { ...c.genotype },
    vulnerabilities: [...c.vulnerabilities],
  }));
}

export function normalizeCloneShares(clones: TumorClone[]): TumorClone[] {
  const positive = clones.map((c) => ({ ...c, share: Math.max(0, c.share) }));
  const total = positive.reduce((sum, c) => sum + c.share, 0);
  if (total <= 0) {
    return positive.map((c) => ({ ...c, share: 0 }));
  }
  const scaled = positive.map((c) => ({
    ...c,
    share: Math.round((c.share / total) * 100),
  }));
  const diff = 100 - scaled.reduce((s, c) => s + c.share, 0);
  if (diff !== 0 && scaled.length > 0) {
    const maxIdx = scaled.reduce(
      (best, c, idx, arr) => (c.share > arr[best].share ? idx : best),
      0
    );
    scaled[maxIdx].share = Math.max(0, scaled[maxIdx].share + diff);
  }
  return scaled;
}

/**
 * Computes population-weighted state for every gene in the network.
 */
export function getDominantNetworkGeneStates(clones: TumorClone[]): Record<string, GeneState> {
  const result: Record<string, GeneState> = {};
  const dominant = clones.reduce(
    (best, c) => (c.share > best.share ? c : best),
    clones[0]
  );

  for (const gene of GENES_LIBRARY) {
    const symbol = gene.symbol;
    let activatedWeight = 0;
    let inactivatedWeight = 0;
    let reducedWeight = 0;

    for (const clone of clones) {
      const st = clone.genotype[symbol] ?? 'functional';
      if (st === 'activated') activatedWeight += clone.share;
      else if (st === 'inactivated') inactivatedWeight += clone.share;
      else if (st === 'reduced') reducedWeight += clone.share;
    }

    if (activatedWeight >= 35) result[symbol] = 'activated';
    else if (inactivatedWeight >= 35) result[symbol] = 'inactivated';
    else if (activatedWeight >= 12) result[symbol] = 'activated';
    else if (inactivatedWeight >= 12 || reducedWeight >= 20) result[symbol] = 'reduced';
    else result[symbol] = dominant?.genotype[symbol] ?? 'functional';
  }
  return result;
}

/**
 * Calculates Hanahan (2026) 9 functional capabilities from clonal genotypes & organism context.
 * Important scientific constraint: single gene loss (e.g., TP53) modulates multiple hallmarks
 * partially rather than granting 100% automatic capability.
 */
export function computeHallmarkScores(
  clones: TumorClone[],
  defenses: OrganismDefenses
): Record<HallmarkId, number> {
  const scores: Record<HallmarkId, number> = {
    proliferative_signaling: 10,
    evading_growth_suppressors: 8,
    resisting_cell_death: 8,
    cellular_metabolism: 12,
    avoiding_immune_destruction: 10,
    inducing_vasculature: 10,
    invasion_metastasis: 6,
    replicative_immortality: 14,
    phenotypic_plasticity: 10,
  };

  const totalShare = clones.reduce((s, c) => s + c.share, 0);
  if (totalShare <= 0) {
    return {
      proliferative_signaling: 0,
      evading_growth_suppressors: 0,
      resisting_cell_death: 0,
      cellular_metabolism: 0,
      avoiding_immune_destruction: 0,
      inducing_vasculature: 0,
      invasion_metastasis: 0,
      replicative_immortality: 0,
      phenotypic_plasticity: 0,
    };
  }

  for (const clone of clones) {
    const w = clone.share / totalShare;
    const g = clone.genotype;

    // 1. Sustaining proliferative signaling
    let prolif = 15;
    if (g.EGFR === 'activated') prolif += 42;
    if (g.KRAS === 'activated') prolif += 48;
    if (g.PIK3CA === 'activated') prolif += 34;
    if (g.MET === 'activated') prolif += 28;
    if (g.CDK6 === 'activated') prolif += 26;
    scores.proliferative_signaling += w * Math.min(92, prolif);

    // 2. Evading growth suppressors
    let supp = 10;
    if (g.RB1 === 'inactivated') supp += 48;
    else if (g.RB1 === 'reduced') supp += 24;
    if (g.PTEN === 'inactivated') supp += 34;
    if (g.TP53 === 'inactivated') supp += 32; // Partial, context-dependent
    else if (g.TP53 === 'reduced') supp += 16;
    if (g.CDK6 === 'activated') supp += 28;
    if (g.CDKN2A === 'inactivated') supp += 26;
    // Context dependency: intact checkpoint dampens complete evasion
    if (defenses.cellCycleCheckpoint > 65) supp *= 0.85;
    scores.evading_growth_suppressors += w * Math.min(90, supp);

    // 3. Resisting cell death (never 100% from TP53 alone!)
    let death = 10;
    if (g.BAX === 'inactivated') death += 42;
    if (g.BCL2 === 'activated') death += 36;
    if (g.TP53 === 'inactivated') death += 30;
    else if (g.TP53 === 'reduced') death += 14;
    if (g.PTEN === 'inactivated') death += 24;
    if (g.PIK3CA === 'activated') death += 20;
    // Extrinsic immune surveillance prevents absolute invulnerability
    if (defenses.immuneSurveillance > 60 && g.PDL1 !== 'activated') death *= 0.85;
    scores.resisting_cell_death += w * Math.min(88, death);

    // 4. Cellular metabolism
    let metab = 15;
    if (g.PIK3CA === 'activated') metab += 35;
    if (g.PTEN === 'inactivated') metab += 30;
    if (g.KRAS === 'activated') metab += 32;
    if (g.VEGFA === 'activated') metab += 15;
    scores.cellular_metabolism += w * Math.min(86, metab);

    // 5. Avoiding immune destruction
    let immune = 8;
    if (g.PDL1 === 'activated') immune += 54;
    if (g.PTEN === 'inactivated') immune += 14;
    if (defenses.immuneSurveillance > 70) immune *= 0.82;
    scores.avoiding_immune_destruction += w * Math.min(86, immune);

    // 6. Inducing vasculature
    let vasc = 10;
    if (g.VEGFA === 'activated') vasc += 55;
    if (g.PIK3CA === 'activated') vasc += 16;
    scores.inducing_vasculature += w * Math.min(85, vasc);

    // 7. Invasion & metastasis
    let inv = 6;
    if (g.MET === 'activated') inv += 46;
    if (g.KRAS === 'activated') inv += 18;
    if (g.TP53 === 'inactivated') inv += 14;
    scores.invasion_metastasis += w * Math.min(80, inv);

    // 8. Replicative immortality
    let imm = 16;
    if (g.TP53 === 'inactivated') imm += 24;
    if (g.RB1 === 'inactivated') imm += 22;
    if (g.CDKN2A === 'inactivated') imm += 26;
    scores.replicative_immortality += w * Math.min(78, imm);

    // 9. Phenotypic plasticity
    let plast = 12;
    if (g.RB1 === 'inactivated' && g.TP53 === 'inactivated') plast += 34;
    if (g.MET === 'activated') plast += 24;
    if (g.PIK3CA === 'activated') plast += 14;
    scores.phenotypic_plasticity += w * Math.min(76, plast);
  }

  // Round all values cleanly
  (Object.keys(scores) as HallmarkId[]).forEach((k) => {
    scores[k] = clamp(scores[k] - 8, 0, 96);
  });
  return scores;
}

export function computeEnablingScores(
  clones: TumorClone[],
  defenses: OrganismDefenses
): Record<EnablingCharacteristicId, number> {
  const totalShare = clones.reduce((s, c) => s + c.share, 0) || 1;
  let instab = 20;
  let inflam = 28;
  let epigen = 22;

  for (const c of clones) {
    const w = c.share / totalShare;
    if (c.genotype.TP53 === 'inactivated') instab += w * 48;
    else if (c.genotype.TP53 === 'reduced') instab += w * 22;
    if (c.genotype.ATM === 'inactivated') instab += w * 35;
    if (c.genotype.KRAS === 'activated') inflam += w * 24;
    if (c.genotype.MET === 'activated' || c.genotype.RB1 === 'inactivated') epigen += w * 24;
  }

  return {
    genomic_instability: clamp(instab, 0, 95),
    tumor_inflammation: clamp(inflam, 0, 90),
    epigenetic_reprogramming: clamp(epigen, 0, 90),
    microenvironment_constraints: clamp(100 - defenses.nutrientSupply + (defenses.immuneSurveillance - 50) * 0.4, 15, 95),
  };
}

/**
 * Core shared biological rule: computes how a given therapy affects each individual clone.
 * Positive returned value = net suppression/killing of that clone; negative = clone resists/grows.
 */
export function evaluateTherapyEffectOnClone(
  clone: TumorClone,
  therapyId: TherapyId,
  extent: ClinicalState['diseaseExtent']
): { killStrength: number; rationale: string } {
  const g = clone.genotype;

  switch (therapyId) {
    case 'egfr_tki': {
      if (g.KRAS === 'activated') {
        return {
          killStrength: -6,
          rationale: 'Resistencia intrínseca: KRAS activado mantiene MAPK/PI3K corriente abajo de EGFR.',
        };
      }
      if (g.EGFR !== 'activated') {
        return {
          killStrength: -2,
          rationale: 'Sin dependencia activadora de EGFR; el inhibidor no tiene blanco impulsor dominante.',
        };
      }
      if (g.MET === 'activated') {
        return {
          killStrength: 4,
          rationale: 'Escape parcial por bypass: el receptor paralelo MET reactiva señales de supervivencia.',
        };
      }
      if (g.PTEN === 'inactivated') {
        return {
          killStrength: 10,
          rationale: 'Sensibilidad atenuada: la pérdida de PTEN mantiene elevada la vía PI3K/AKT pese al bloqueo de EGFR.',
        };
      }
      return {
        killStrength: 42,
        rationale: 'Alta sensibilidad: el clon depende de EGFR y conserva PTEN/apoptosis funcionales.',
      };
    }

    case 'cdk46_inhibitor': {
      if (g.RB1 === 'inactivated') {
        return {
          killStrength: -8,
          rationale: 'Resistencia completa: sin proteína RB1 funcional, inhibir CDK4/6 no frena el paso G1/S.',
        };
      }
      if (g.CDK6 === 'activated') {
        return {
          killStrength: 38,
          rationale: 'Fuerte arresto G1: CDK6 hiperactivo bloqueado restaura la represión de E2F por RB1 funcional.',
        };
      }
      return {
        killStrength: 20,
        rationale: 'Efecto citostático moderado al mantener a RB1 hipofosforilado.',
      };
    }

    case 'pi3k_inhibitor': {
      if (g.KRAS === 'activated') {
        return {
          killStrength: 8,
          rationale: 'Eficacia reducida: KRAS sostiene proliferación paralela vía MAPK.',
        };
      }
      if (g.PIK3CA === 'activated' || g.PTEN === 'inactivated') {
        return {
          killStrength: 38,
          rationale: 'Alta sensibilidad: bloquea la dependencia de supervivencia y metabolismo PI3K/AKT.',
        };
      }
      return {
        killStrength: 10,
        rationale: 'Impacto limitado por baja dependencia basal de PI3K.',
      };
    }

    case 'chemotherapy': {
      let base = 26 + (clone.proliferationRate - 50) * 0.25;
      if (g.TP53 === 'inactivated') base -= 16;
      if (g.BAX === 'inactivated') base -= 18;
      if (g.BCL2 === 'activated') base -= 16;
      return {
        killStrength: clamp(base, -4, 42),
        rationale:
          base >= 22
            ? 'Daño replicativo eficaz en clon proliferativo con respuesta apoptótica preservada.'
            : 'Eficacia atenuada por alteraciones en la vía apoptótica intrínseca (TP53/BAX/BCL2).',
      };
    }

    case 'surgery': {
      if (extent === 'diseminada') {
        return {
          killStrength: 4,
          rationale: 'En enfermedad diseminada la resección local no controla focos sistémicos.',
        };
      }
      const kill = extent === 'localizada' ? 38 : 24;
      return {
        killStrength: kill,
        rationale:
          extent === 'localizada'
            ? 'Reducción física uniforme de clones localizados independientemente de su genotipo.'
            : 'Reducción regional parcial; pueden quedar focos microscópicos residuales.',
      };
    }

    case 'radiotherapy': {
      let kill = extent === 'diseminada' ? 10 : 28;
      if (g.TP53 === 'inactivated' || g.BAX === 'inactivated') kill -= 10;
      return {
        killStrength: clamp(kill, 4, 34),
        rationale:
          kill >= 22
            ? 'Roturas bicatenarias locales inducen muerte mitótica y arresto.'
            : 'Control local parcial atenuado por menor apoptosis o extensión extrarregional.',
      };
    }

    case 'immunotherapy': {
      if (g.PDL1 === 'activated') {
        return {
          killStrength: 38,
          rationale: 'Alta respuesta: el bloqueo PD-1/PD-L1 reactiva linfocitos T citotóxicos (vía extrínseca independiente de TP53/BAX).',
        };
      }
      if (clone.immuneVisibility >= 65) {
        return {
          killStrength: 24,
          rationale: 'Respuesta moderada-buena gracias a elevada visibilidad neoantigénica.',
        };
      }
      return {
        killStrength: 8,
        rationale: 'Respuesta limitada en clon con baja expresión de PD-L1 e infiltración moderada.',
      };
    }

    case 'combo_targeted_chemo': {
      // Combines broad cytotoxicity + strongest available pathway pressure, but at steep clinical toxicity cost
      const chemo = evaluateTherapyEffectOnClone(clone, 'chemotherapy', extent).killStrength;
      const targeted = Math.max(
        evaluateTherapyEffectOnClone(clone, 'egfr_tki', extent).killStrength,
        evaluateTherapyEffectOnClone(clone, 'pi3k_inhibitor', extent).killStrength,
        evaluateTherapyEffectOnClone(clone, 'cdk46_inhibitor', extent).killStrength
      );
      return {
        killStrength: clamp(chemo * 0.65 + targeted * 0.65, 6, 48),
        rationale: 'Cobertura combinada amplia sobre clones heterogéneos, con elevada toxicidad sistémica.',
      };
    }

    case 'active_surveillance':
      return {
        killStrength: 0,
        rationale: 'Sin presión farmacológica; favorece recuperación tisular y evita selección acelerada.',
      };

    case 'palliative_care':
      return {
        killStrength: -2,
        rationale: 'Enfoque centrado en alivio sintomático y preservación de calidad de vida.',
      };
  }
}

export function deriveDiseaseControl(clinical: ClinicalState): DiseaseControlStatus {
  if (clinical.functionalStatus <= 25 || clinical.cumulativeToxicity >= 88) {
    return 'critico';
  }
  if (clinical.tumorBurden <= 14) {
    return 'remision';
  }
  if (clinical.tumorBurden <= 32) {
    return 'control_sostenido';
  }
  if (clinical.tumorBurden <= 56) {
    return 'estable';
  }
  return 'progresion';
}

export function createInitialSimulation(
  mode: GameMode,
  _scenarioId: ScenarioId = 'UNIFIED',
  teamName: string = '',
  duration: GameDuration = 'quick',
  teacherConfig: TeacherConfig = DEFAULT_TEACHER_CONFIG,
  customRoundCount?: number,
  explicitSeed?: number,
  unlimitedMode: boolean = false,
  oncologistStartStage: OncologistStartStage = 'early'
): SimulationState {
  const oncoBaseline =
    mode === 'oncologist' ? createOncologistStageBaseline(oncologistStartStage) : null;
  const clones = normalizeCloneShares(
    cloneArray(oncoBaseline ? oncoBaseline.clones : createUnifiedInitialClones())
  );
  const defenses: OrganismDefenses = oncoBaseline
    ? { ...oncoBaseline.defenses }
    : createUnifiedInitialDefenses();
  const clinical: ClinicalState = oncoBaseline
    ? { ...oncoBaseline.clinical }
    : createUnifiedInitialClinical();
  const initialAccumulatedProblems = oncoBaseline ? [...oncoBaseline.accumulatedProblems] : [];
  const initialLiberation = oncoBaseline ? oncoBaseline.initialLiberation : 16;

  const maxRounds =
    typeof customRoundCount === 'number'
      ? clamp(customRoundCount, 3, 10)
      : clamp(
          duration === 'quick' ? Math.min(5, teacherConfig.roundCount) : teacherConfig.roundCount,
          3,
          10
        );

  const randomSeed =
    typeof explicitSeed === 'number'
      ? explicitSeed
      : Math.floor(Math.random() * 1_000_000_000) + 1;

  const round1Offer = generateRoundOffer({
    roundNumber: 1,
    clones,
    clinical,
    accumulatedProblems: initialAccumulatedProblems,
    usedTherapies: [],
    oncologistStartStage: mode === 'oncologist' ? oncologistStartStage : undefined,
    rng: createSeededRng(randomSeed + 101),
  });

  // In Cancer mode all featured genes are visible; in Oncologist mode they start hidden unless Teacher Config overrides
  const initialRevealedGenes =
    mode === 'cancer' || teacherConfig.revealMolecularInOncologist
      ? [...UNIFIED_FEATURED_GENES]
      : [];

  return {
    runId: `run-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    teamName: teamName.trim() || 'Equipo de Medicina',
    mode,
    duration,
    scenarioId: 'UNIFIED',
    currentRound: 1,
    maxRounds,
    unlimitedMode,
    oncologistStartStage: mode === 'oncologist' ? oncologistStartStage : undefined,
    oncologistLiberation: initialLiberation,
    finished: false,
    clones,
    defenses,
    clinical,
    hallmarkScores: computeHallmarkScores(clones, defenses),
    enablingScores: computeEnablingScores(clones, defenses),
    diagnosticBudget: duration === 'quick' ? 4 : 5,
    maxDiagnosticBudget: duration === 'quick' ? 4 : 5,
    completedDiagnostics: [],
    revealedGenes: initialRevealedGenes,
    revealedExtent: mode === 'cancer' || teacherConfig.revealMolecularInOncologist,
    revealedClonalHeterogeneity: mode === 'cancer' || teacherConfig.revealMolecularInOncologist,
    revealedBiomarkers: mode === 'cancer' || teacherConfig.revealMolecularInOncologist,
    cellModel: {
      primaryDriver: '',
      weakenedControl: '',
      intactControl: '',
      exploitableVulnerability: '',
      submitted: false,
      accuracyScore: 0,
    },
    usedTherapies: [],
    accumulatedProblems: initialAccumulatedProblems,
    roundOffers: { 1: round1Offer },
    randomSeed,
    history: [],
    score: {
      molecularComprehension: 0,
      causalRelations: 0,
      groundedDecisions: 0,
      reflection: 0,
      total: 0,
    },
    reflections: {
      q1KeyAlterations: '',
      q2HallmarksRelation: '',
      q3AlternativePath: '',
    },
    teacherConfig: { ...teacherConfig },
    createdAt: new Date().toISOString(),
  };
}

/**
 * Oncologist Phase 1: Progressive diagnostic investigation with resource budget.
 */
export function runDiagnosticTool(
  state: SimulationState,
  toolId: DiagnosticToolId
): { nextState: SimulationState; message: string; error?: string } {
  const tool = DIAGNOSTIC_TOOLS.find((t) => t.id === toolId);
  if (!tool) {
    return { nextState: state, message: '', error: 'Herramienta diagnóstica no válida.' };
  }
  if (state.completedDiagnostics.includes(toolId) && toolId !== 'response_monitoring') {
    return { nextState: state, message: 'Este estudio ya fue realizado en el caso actual.' };
  }
  if (state.diagnosticBudget < tool.cost) {
    return {
      nextState: state,
      message: '',
      error: 'Presupuesto diagnóstico insuficiente para esta prueba en este momento.',
    };
  }

  const revealed = new Set(state.revealedGenes);
  let revealedExtent = state.revealedExtent;
  let revealedClonalHeterogeneity = state.revealedClonalHeterogeneity;
  let revealedBiomarkers = state.revealedBiomarkers;
  let message = '';

  switch (toolId) {
    case 'imaging':
      revealedExtent = true;
      message = `Imágenes completadas: enfermedad ${state.clinical.diseaseExtent} (carga estimada ${state.clinical.tumorBurden}/100 en escala interna).`;
      break;
    case 'biopsy':
      ['TP53', 'RB1', 'BAX', 'CDK6', 'CDKN2A', 'ATM'].forEach((g) => {
        if (UNIFIED_FEATURED_GENES.includes(g)) revealed.add(g);
      });
      message = 'Biopsia completada: se reveló el estado de reguladores de ciclo celular y respuesta apoptótica basal.';
      break;
    case 'molecular_profile':
      ['EGFR', 'KRAS', 'PIK3CA', 'PTEN', 'MET', 'CDK6', 'RB1', 'TP53', 'BAX'].forEach((g) => {
        if (UNIFIED_FEATURED_GENES.includes(g)) revealed.add(g);
      });
      revealedClonalHeterogeneity = true;
      message = 'Perfil NGS completado: se identificaron los impulsores oncogénicos, supresores clave y subclones minoritarios.';
      break;
    case 'biomarkers':
      ['PDL1', 'VEGFA', 'BCL2'].forEach((g) => {
        if (UNIFIED_FEATURED_GENES.includes(g)) revealed.add(g);
      });
      revealedBiomarkers = true;
      message = 'Biomarcadores completados: se cuantificó expresión de PD-L1, marcadores vasculares y reguladores apoptóticos.';
      break;
    case 'response_monitoring':
      UNIFIED_FEATURED_GENES.forEach((g) => revealed.add(g));
      revealedClonalHeterogeneity = true;
      message = 'Seguimiento molecular actualizado: se detectó la proporción vigente de clones sensibles y resistentes.';
      break;
  }

  const completedDiagnostics = state.completedDiagnostics.includes(toolId)
    ? state.completedDiagnostics
    : [...state.completedDiagnostics, toolId];

  // Reward rational diagnostic gathering in molecular comprehension (capped cleanly)
  const compBonus = Math.min(30, state.score.molecularComprehension + 4);

  const nextState: SimulationState = {
    ...state,
    diagnosticBudget: state.diagnosticBudget - tool.cost,
    completedDiagnostics,
    revealedGenes: Array.from(revealed),
    revealedExtent,
    revealedClonalHeterogeneity,
    revealedBiomarkers,
    score: {
      ...state.score,
      molecularComprehension: compBonus,
      total:
        compBonus +
        state.score.causalRelations +
        state.score.groundedDecisions +
        state.score.reflection,
    },
  };

  return { nextState, message };
}

/**
 * Oncologist Phase 2: Evaluate student's molecular cell model.
 */
export function submitOncologistCellModel(
  state: SimulationState,
  draft: Pick<
    OncologistCellModel,
    'primaryDriver' | 'weakenedControl' | 'intactControl' | 'exploitableVulnerability'
  >
): SimulationState {
  const expected = deriveExpectedCellModel(state.clones);
  let hits = 0;
  if (draft.primaryDriver === expected.primaryDriver) hits++;
  if (draft.weakenedControl === expected.weakenedControl) hits++;
  if (draft.intactControl === expected.intactControl) hits++;
  if (draft.exploitableVulnerability === expected.exploitableVulnerability) hits++;

  const accuracyScore = Math.round((hits / 4) * 100);
  const compGain = Math.round((hits / 4) * 12);
  const nextComp = clamp(state.score.molecularComprehension + compGain, 0, 30);

  return {
    ...state,
    cellModel: {
      ...draft,
      submitted: true,
      accuracyScore,
    },
    score: {
      ...state.score,
      molecularComprehension: nextComp,
      total:
        nextComp +
        state.score.causalRelations +
        state.score.groundedDecisions +
        state.score.reflection,
    },
  };
}

/**
 * Evaluates whether the player's chosen prediction accurately matches the biological
 * outcome of the chosen action (door/strategy in Cancer mode or therapy in Oncologist mode).
 * Both Labyrinth 3D and Text Mode use this gate: if `allowed === false`, the door remains locked.
 */
export function evaluatePredictionGate(
  state: SimulationState,
  actionId: string,
  predictionId: string
): PredictionGateResult {
  const round = getActiveRoundOffer(state);
  if (!round) {
    return {
      allowed: true,
      feedback: '',
      hint: '',
      actualOutcomeTag: 'stable_control',
    };
  }

  if (state.mode === 'cancer') {
    const preds = round.cancerPredictions;
    const prediction = preds.find((p) => p.id === predictionId);
    const validPreds = preds.filter((p) => !p.isDistractor);
    const strategy =
      round.cancerStrategies.find((s) => s.id === actionId) ?? round.cancerStrategies[0];
    const simulatedClones =
      strategy?.problemMutation
        ? applyProblemToClones(cloneArray(state.clones), strategy.cloneId, strategy.problemMutation)
        : cloneArray(state.clones);
    const favoredClone =
      simulatedClones.find((c) => c.id === strategy?.cloneId) ?? simulatedClones[0];

    let expectedTag: PredictionOption['expectedOutcomeTag'] =
      validPreds[0]?.expectedOutcomeTag ?? 'clonal_selection';

    if (validPreds.length >= 2 && favoredClone) {
      if (round.barrierType === 'immune_surveillance') {
        expectedTag =
          favoredClone.genotype.PDL1 === 'activated' ? 'clonal_selection' : 'barrier_arrest';
      } else if (round.barrierType === 'nutrient_restriction') {
        expectedTag =
          favoredClone.genotype.VEGFA === 'activated' ||
          favoredClone.genotype.PIK3CA === 'activated' ||
          favoredClone.genotype.PTEN === 'inactivated'
            ? 'clonal_selection'
            : 'barrier_arrest';
      } else if (round.barrierType === 'dna_damage') {
        expectedTag =
          favoredClone.genotype.TP53 === 'inactivated' ||
          favoredClone.genotype.BAX === 'inactivated' ||
          favoredClone.genotype.BCL2 === 'activated' ||
          favoredClone.genotype.ATM === 'inactivated'
            ? 'clonal_selection'
            : 'barrier_arrest';
      } else if (round.barrierType === 'growth_checkpoint') {
        expectedTag =
          favoredClone.genotype.KRAS === 'activated' ||
          favoredClone.genotype.PIK3CA === 'activated' ||
          favoredClone.genotype.PTEN === 'inactivated' ||
          favoredClone.genotype.RB1 === 'inactivated' ||
          favoredClone.genotype.CDK6 === 'activated' ||
          favoredClone.genotype.CDKN2A === 'inactivated' ||
          favoredClone.genotype.MET === 'activated'
            ? 'clonal_selection'
            : 'barrier_arrest';
      } else {
        // Combined tissue-boundary & microenvironmental barrier
        expectedTag =
          favoredClone.genotype.MET === 'activated' ||
          favoredClone.genotype.VEGFA === 'activated' ||
          favoredClone.genotype.PDL1 === 'activated' ||
          favoredClone.genotype.KRAS === 'activated' ||
          favoredClone.genotype.TP53 === 'inactivated' ||
          favoredClone.genotype.RB1 === 'inactivated' ||
          favoredClone.genotype.PTEN === 'inactivated' ||
          favoredClone.genotype.BCL2 === 'activated'
            ? 'clonal_selection'
            : 'barrier_arrest';
      }

      if (!validPreds.some((p) => p.expectedOutcomeTag === expectedTag)) {
        expectedTag = validPreds[0].expectedOutcomeTag;
      }
    }

    if (!prediction) {
      return {
        allowed: false,
        feedback: 'Selecciona una predicción biológica antes de intentar abrir la puerta.',
        hint: 'Analiza cómo responde el clon elegido frente a la barrera fisiológica de esta ronda.',
        actualOutcomeTag: expectedTag,
      };
    }

    if (prediction.isDistractor) {
      return {
        allowed: false,
        feedback: `Esa predicción no concuerda con la biología activa. ${prediction.rationale}`,
        hint: 'Descarta afirmaciones absolutas o incompatibles con la vía activa y elige la consecuencia real.',
        actualOutcomeTag: expectedTag,
      };
    }

    const allowed =
      validPreds.length <= 1
        ? true
        : prediction.expectedOutcomeTag === expectedTag;

    if (allowed) {
      return {
        allowed: true,
        feedback: 'Predicción correcta: la puerta se desbloquea.',
        hint: '',
        actualOutcomeTag: expectedTag,
      };
    }

    const mismatchReason =
      expectedTag === 'barrier_arrest'
        ? 'La población elegida en esta ruta enfrenta una barrera fisiológica activa del organismo y queda contenida sin lograr expandirse libremente.'
        : 'El clon elegido en esta ruta cuenta con una ventaja adaptativa frente a la barrera del organismo y tiende a seleccionarse sobre el resto.';

    return {
      allowed: false,
      feedback: mismatchReason,
      hint: 'Compara el perfil del clon que elegiste con la barrera de esta ronda y ajusta tu predicción para abrir la puerta.',
      actualOutcomeTag: expectedTag,
    };
  }

  // ONCOLOGIST MODE
  const preds = round.oncologistPredictions;
  const prediction = preds.find((p) => p.id === predictionId);
  const validPreds = preds.filter((p) => !p.isDistractor);
  const therapyId = actionId as TherapyId;
  const therapy = getTherapyById(therapyId) ?? THERAPIES_CATALOG[0];

  const clonesBefore = state.clones.map((c) => ({ id: c.id, share: c.share }));
  const simClones = cloneArray(state.clones);
  let weightedKill = 0;

  for (const clone of simClones) {
    const { killStrength } = evaluateTherapyEffectOnClone(
      clone,
      therapyId,
      state.clinical.diseaseExtent
    );
    weightedKill += (clone.share / 100) * killStrength;
    const growthTerm = (clone.proliferationRate - clone.metabolicCost * 0.3) * 0.12;
    const survivalFactor = Math.max(0.18, 1 + (growthTerm - killStrength * 0.35) / 40);
    clone.share = Math.max(2, clone.share * survivalFactor);
  }

  const normalized = normalizeCloneShares(simClones);
  const naturalGrowth =
    normalized.reduce((sum, c) => sum + (c.share / 100) * c.proliferationRate, 0) * 0.16;
  const burdenDelta = clamp(Math.round(naturalGrowth - weightedKill * 0.72), -28, 16);
  const repeatedToxicPenalty =
    therapy.toxicityDelta >= 20 && state.usedTherapies.includes(therapyId) ? 6 : 0;
  const toxChange = therapy.toxicityDelta + repeatedToxicPenalty;
  const nextToxicity = clamp(state.clinical.cumulativeToxicity + toxChange, 0, 100);
  const resistantExpanded = normalized.some(
    (c, idx) => c.origin !== 'founder' && c.share - clonesBefore[idx].share >= 8
  );
  const isRepeated = state.usedTherapies.includes(therapyId);

  let preferredTags: PredictionOption['expectedOutcomeTag'][];
  if (therapyId === 'active_surveillance' || therapyId === 'palliative_care') {
    preferredTags = ['qol_preservation', 'stable_control', 'therapy_response'];
  } else if (
    nextToxicity >= 55 ||
    toxChange >= 28 ||
    (therapyId === 'chemotherapy' && weightedKill <= 14)
  ) {
    preferredTags = ['toxicity_limit', 'resistant_outgrowth', 'therapy_response'];
  } else if (weightedKill <= 10 || resistantExpanded || (isRepeated && burdenDelta > -6)) {
    preferredTags = ['resistant_outgrowth', 'toxicity_limit', 'stable_control', 'therapy_response'];
  } else {
    preferredTags = ['therapy_response', 'resistant_outgrowth', 'stable_control'];
  }

  const winningTag =
    preferredTags.find((tag) => validPreds.some((p) => p.expectedOutcomeTag === tag)) ??
    validPreds[0]?.expectedOutcomeTag ??
    'therapy_response';

  if (!prediction) {
    return {
      allowed: false,
      feedback: 'Selecciona una predicción clínica antes de aplicar la intervención.',
      hint: 'Anticipa si la terapia logrará respuesta, enfrentará resistencia, elevará la toxicidad o preservará calidad de vida.',
      actualOutcomeTag: winningTag,
    };
  }

  if (prediction.isDistractor) {
    return {
      allowed: false,
      feedback: `Esa hipótesis no refleja la respuesta biológica real. ${prediction.rationale}`,
      hint: 'Evalúa el mecanismo de acción, los clones presentes y la toxicidad antes de confirmar.',
      actualOutcomeTag: winningTag,
    };
  }

  const allowed = prediction.expectedOutcomeTag === winningTag;
  if (allowed) {
    return {
      allowed: true,
      feedback: 'Predicción correcta: la puerta terapéutica se desbloquea.',
      hint: '',
      actualOutcomeTag: winningTag,
    };
  }

  const reasonByTag: Record<PredictionOption['expectedOutcomeTag'], string> = {
    qol_preservation:
      'Esta intervención es conservadora; prioriza preservar la calidad de vida y recuperación tisular en lugar de atacar directamente al tumor o elevar toxicidad.',
    stable_control:
      'Al observar sin ejercer presión terapéutica intensa, el objetivo inmediato es vigilancia y estabilidad clínica, no reducción tumoral directa.',
    toxicity_limit:
      'Con la toxicidad acumulada o la baja eficacia frente a los clones actuales, el efecto dominante de esta elección es la carga de toxicidad.',
    resistant_outgrowth:
      'Frente al perfil clonal actual, esta terapia enfrenta resistencia intrínseca o favorece la expansión relativa de subclones resistentes.',
    therapy_response:
      'Esta terapia sí impacta una vulnerabilidad activa del tumor y busca reducir o contener la carga tumoral de forma medible.',
    clonal_expansion: 'Revisa la respuesta biológica esperada de esta intervención.',
    clonal_selection: 'Revisa la respuesta biológica esperada de esta intervención.',
    barrier_arrest: 'Revisa la respuesta biológica esperada de esta intervención.',
  };

  return {
    allowed: false,
    feedback: reasonByTag[winningTag],
    hint: 'Ajusta tu predicción al efecto real de esta terapia (o elige otra puerta) para poder avanzar.',
    actualOutcomeTag: winningTag,
  };
}

/**
 * Resolve one turn in CANCER MODE using the shared evolutionary + biological engine.
 */
export function resolveCancerTurn(
  state: SimulationState,
  strategyId: string,
  predictionId: string
): { nextState: SimulationState; resolution: TurnResolution } {
  const round = getActiveRoundOffer(state);
  const strategy =
    round.cancerStrategies.find((s) => s.id === strategyId) ?? round.cancerStrategies[0];
  const prediction =
    round.cancerPredictions.find((p) => p.id === predictionId) ?? round.cancerPredictions[0];

  const clonesBefore = state.clones.map((c) => ({ id: c.id, name: c.name, share: c.share }));
  const baseClones = cloneArray(state.clones);
  const nextClones = strategy.problemMutation
    ? applyProblemToClones(baseClones, strategy.cloneId, strategy.problemMutation)
    : baseClones;
  const nextAccumulatedProblems = strategy.problemMutation
    ? [
        ...state.accumulatedProblems,
        { ...strategy.problemMutation, roundNumber: state.currentRound },
      ]
    : [...state.accumulatedProblems];

  const nextDefenses: OrganismDefenses = { ...state.defenses };
  const nextClinical: ClinicalState = { ...state.clinical };

  let burdenDelta = 0;
  const genesInvolved = new Set<string>();
  if (strategy.problemMutation) {
    genesInvolved.add(strategy.problemMutation.geneSymbol);
  }
  const evidenceCitations: { source: string; detail: string }[] = [
    { source: 'Hanahan (Cell, 2026)', detail: HANAHAN_CITATION },
    { source: 'COSMIC Hallmarks of Cancer', detail: COSMIC_HOC_CITATION },
  ];

  // Apply natural physiological host barriers & microenvironmental selection across all clones
  for (const clone of nextClones) {
    const isFavored = clone.id === strategy.cloneId;
    const deltaShare = isFavored ? 12 : -4;
    let fitness = (clone.proliferationRate - clone.metabolicCost * 0.32) * 0.14;

    if (round.barrierType === 'growth_checkpoint') {
      if (
        clone.genotype.RB1 === 'inactivated' ||
        clone.genotype.CDK6 === 'activated' ||
        clone.genotype.KRAS === 'activated'
      ) {
        fitness += 6;
        genesInvolved.add('RB1');
        genesInvolved.add('CDK6');
      }
      if (clone.genotype.PTEN === 'inactivated' || clone.genotype.CDKN2A === 'inactivated') {
        fitness += 5;
        genesInvolved.add('PTEN');
      }
      if (clone.genotype.TP53 === 'functional') {
        fitness -= 4;
        genesInvolved.add('TP53');
      }
    } else if (round.barrierType === 'dna_damage') {
      genesInvolved.add('ATM');
      genesInvolved.add('TP53');
      genesInvolved.add('BAX');
      if (
        clone.genotype.TP53 === 'inactivated' ||
        clone.genotype.BAX === 'inactivated' ||
        clone.genotype.BCL2 === 'activated' ||
        clone.genotype.ATM === 'inactivated'
      ) {
        fitness += 7;
        if (clone.genotype.BCL2 === 'activated') genesInvolved.add('BCL2');
      } else {
        fitness -= 7;
      }
    } else if (round.barrierType === 'nutrient_restriction') {
      nextDefenses.nutrientSupply = clamp(nextDefenses.nutrientSupply - 10, 22, 90);
      if (clone.genotype.VEGFA === 'activated') {
        fitness += 8;
        genesInvolved.add('VEGFA');
      }
      if (clone.genotype.PIK3CA === 'activated' || clone.genotype.PTEN === 'inactivated') {
        fitness += 4;
        genesInvolved.add('PIK3CA');
      }
      if (clone.metabolicCost > 60 && clone.genotype.VEGFA !== 'activated') {
        fitness -= 6;
      }
    } else if (round.barrierType === 'immune_surveillance') {
      genesInvolved.add('PDL1');
      if (clone.genotype.PDL1 === 'activated') {
        fitness += 9;
      } else {
        fitness -= Math.round(clone.immuneVisibility * 0.11);
      }
    } else {
      // Combined tissue-boundary & microenvironmental pressure
      if (clone.genotype.MET === 'activated') {
        fitness += 7;
        genesInvolved.add('MET');
      }
      if (clone.genotype.VEGFA === 'activated') {
        fitness += 5;
        genesInvolved.add('VEGFA');
      }
      if (clone.genotype.PDL1 === 'activated') {
        fitness += 5;
        genesInvolved.add('PDL1');
      }
      if (clone.genotype.KRAS === 'activated' || clone.genotype.RB1 === 'inactivated') {
        fitness += 4;
      }
      if (clone.growthFactorDependence > 75) {
        fitness -= 5;
      }
    }

    // Apply share adjustment with floor
    const nextShare = Math.max(2, clone.share + deltaShare + fitness);
    clone.share = nextShare;
    burdenDelta += fitness * (clone.share / 100);
  }

  const normalizedClones = normalizeCloneShares(nextClones);

  // Update tumor burden & host indicators (no medical drug toxicity in Cancer Mode)
  const favoredClone = normalizedClones.find((c) => c.id === strategy.cloneId) ?? normalizedClones[0];
  const problemAcceleration = Math.min(10, nextAccumulatedProblems.length * 1.4);
  const burdenShift = clamp(
    Math.round(burdenDelta * 1.15 + problemAcceleration + 4),
    -12,
    20
  );
  nextClinical.tumorBurden = clamp(
    nextClinical.tumorBurden + burdenShift,
    state.unlimitedMode ? 4 : 0,
    100
  );

  if (nextClinical.tumorBurden >= 72) nextClinical.diseaseExtent = 'diseminada';
  else if (nextClinical.tumorBurden >= 52 && nextClinical.diseaseExtent === 'localizada')
    nextClinical.diseaseExtent = 'regional';

  nextClinical.cumulativeToxicity = 0;
  nextClinical.functionalStatus = clamp(100 - nextClinical.tumorBurden * 0.62, 15, 98);
  nextClinical.qualityOfLife = clamp(100 - nextClinical.tumorBurden * 0.56, 15, 98);
  nextClinical.diseaseControl = deriveDiseaseControl(nextClinical);

  // Update organism defenses dynamically (shared molecular components!)
  const domGenes = getDominantNetworkGeneStates(normalizedClones);
  if (domGenes.TP53 === 'inactivated') {
    nextDefenses.dnaRepair = clamp(nextDefenses.dnaRepair - 8, 20, 95);
    nextDefenses.apoptosisCapacity = clamp(nextDefenses.apoptosisCapacity - 8, 20, 95);
  }
  if (domGenes.PDL1 === 'activated') {
    nextDefenses.immuneSurveillance = clamp(nextDefenses.immuneSurveillance - 10, 20, 95);
  }
  if (domGenes.RB1 === 'inactivated' || domGenes.CDK6 === 'activated') {
    nextDefenses.cellCycleCheckpoint = clamp(nextDefenses.cellCycleCheckpoint - 8, 20, 95);
  }

  const prevHallmarks = state.hallmarkScores;
  const nextHallmarks = computeHallmarkScores(normalizedClones, nextDefenses);
  const nextEnabling = computeEnablingScores(normalizedClones, nextDefenses);

  const hallmarksAffected: TurnResolution['hallmarksAffected'] = (
    Object.keys(nextHallmarks) as HallmarkId[]
  )
    .filter((id) => Math.abs(nextHallmarks[id] - prevHallmarks[id]) >= 3)
    .slice(0, 4)
    .map((id) => ({
      id,
      direction: nextHallmarks[id] > prevHallmarks[id] ? 'up' : 'down',
      note:
        nextHallmarks[id] > prevHallmarks[id]
          ? `+${nextHallmarks[id] - prevHallmarks[id]} pts internos`
          : `${nextHallmarks[id] - prevHallmarks[id]} pts internos`,
    }));

  const gateCheck = evaluatePredictionGate(state, strategy.id, prediction.id);
  const predictionMatched = gateCheck.allowed;

  // Educational scoring: never punish reasonable scientific predictions unfairly
  const scoreDivisor = state.unlimitedMode ? 8 : state.maxRounds;
  const perRoundComp = Math.round(28 / scoreDivisor);
  const perRoundCausal = Math.round(28 / scoreDivisor);
  const perRoundDec = Math.round(24 / scoreDivisor);

  const compGain = Math.min(30 - state.score.molecularComprehension, perRoundComp);
  const causalGain = Math.min(
    30 - state.score.causalRelations,
    predictionMatched ? perRoundCausal : Math.max(2, Math.round(perRoundCausal * 0.65))
  );
  const decisionGain = Math.min(
    25 - state.score.groundedDecisions,
    burdenShift >= -2 || favoredClone.share >= clonesBefore.find((c) => c.id === favoredClone.id)!.share
      ? perRoundDec
      : Math.max(2, Math.round(perRoundDec * 0.7))
  );

  const nextScore: ScoreBreakdown = {
    molecularComprehension: clamp(state.score.molecularComprehension + compGain, 0, 30),
    causalRelations: clamp(state.score.causalRelations + causalGain, 0, 30),
    groundedDecisions: clamp(state.score.groundedDecisions + decisionGain, 0, 25),
    reflection: state.score.reflection,
    total: 0,
  };
  nextScore.total =
    nextScore.molecularComprehension +
    nextScore.causalRelations +
    nextScore.groundedDecisions +
    nextScore.reflection;

  // Deduplicate citations
  const uniqueCitations = evidenceCitations.filter(
    (item, idx, arr) => arr.findIndex((x) => x.source === item.source) === idx
  );

  const dominantAfter = normalizedClones.reduce((a, b) => (b.share > a.share ? b : a));
  const whatHappened = `Frente a la barrera "${round.title}", la competencia clonal y las defensas fisiológicas del organismo desplazaron la composición hacia ${dominantAfter.name} (${dominantAfter.share}%), con un cambio neto de carga tumoral de ${burdenShift >= 0 ? '+' : ''}${burdenShift} puntos.`;

  const cellularProcessChanged =
    round.barrierType === 'dna_damage'
      ? 'Balance entre detección de daño al ADN (ATM/TP53), arresto del ciclo y apoptosis intrínseca (BAX/BCL2).'
      : round.barrierType === 'immune_surveillance'
        ? 'Interacción entre linfocitos T citotóxicos del huésped y señal inhibidora PD-L1 en la superficie celular.'
        : round.barrierType === 'nutrient_restriction'
          ? 'Competencia metabólica, estrés hipóxico y soporte angiogénico paracrino (VEGFA).'
          : 'Transducción mitogénica (EGFR/KRAS/PI3K), frenos supresores (PTEN/RB1) y selección clonal frente al tejido sano.';

  const resolution: TurnResolution = {
    roundNumber: state.currentRound,
    mode: 'cancer',
    actionKind: 'cancer_strategy',
    eventTitle: round.title,
    actionTakenLabel: strategy.label,
    predictionLabel: prediction.label,
    predictionMatched,
    whatHappened,
    genesInvolved:
      Array.from(genesInvolved).length > 0
        ? Array.from(genesInvolved)
        : UNIFIED_FEATURED_GENES.slice(0, 3),
    cellularProcessChanged,
    hallmarksAffected,
    evidenceCitations: uniqueCitations,
    clonesBefore,
    clonesAfter: normalizedClones.map((c) => ({ id: c.id, name: c.name, share: c.share })),
    clinicalDelta: {
      tumorBurdenDelta: burdenShift,
      toxicityDelta: 0,
      qolDelta: nextClinical.qualityOfLife - state.clinical.qualityOfLife,
    },
    stochasticDisclosure: round.stochasticNote,
  };

  const isLastRound = state.unlimitedMode
    ? nextClinical.tumorBurden >= 100
    : state.currentRound >= state.maxRounds || nextClinical.tumorBurden <= 5;
  let outcomeCode: FinalOutcomeCode | undefined;
  let outcomeTitle: string | undefined;
  let outcomeExplanation: string | undefined;

  if (isLastRound) {
    if (state.unlimitedMode && nextClinical.tumorBurden >= 100) {
      outcomeCode = 'expansion_tumoral';
      outcomeTitle = 'Carga tumoral al 100% · Expansión completa';
      outcomeExplanation = `Recorriste ${state.currentRound} rondas acumulando alteraciones hasta superar las barreras del tejido y llevar la carga tumoral a 100/100.`;
    } else if (nextClinical.tumorBurden <= 12) {
      outcomeCode = 'poblacion_eliminada';
      outcomeTitle = 'Población contenida o eliminada';
      outcomeExplanation =
        'Las barreras fisiológicas del organismo superaron la capacidad adaptativa de los clones tumorales.';
    } else if (nextClinical.tumorBurden <= 36) {
      outcomeCode = 'enfermedad_contenida';
      outcomeTitle = 'Crecimiento celular contenido';
      outcomeExplanation =
        'La población tumoral persiste en equilibrio limitado, frenada por defensas fisiológicas y costos metabólicos.';
    } else if (dominantAfter.origin !== 'founder') {
      outcomeCode = 'persistencia_resistente';
      outcomeTitle = 'Dominio de subclones invasivos y evasivos';
      outcomeExplanation =
        'Las alteraciones acumuladas desplazaron el balance hacia subclones adaptados para invadir el tejido, obtener nutrientes y evadir defensas del organismo.';
    } else {
      outcomeCode = 'expansion_tumoral';
      outcomeTitle = 'Expansión tumoral persistente';
      outcomeExplanation =
        'La población acumuló alteraciones proliferativas y superó múltiples barreras del tejido sano, aunque sigue sujeta a restricciones microambientales.';
    }
  }

  const nextRoundNumber = isLastRound ? state.currentRound : state.currentRound + 1;
  const nextRoundOffers = { ...state.roundOffers };
  if (!isLastRound) {
    nextRoundOffers[nextRoundNumber] = generateRoundOffer({
      roundNumber: nextRoundNumber,
      clones: normalizedClones,
      clinical: nextClinical,
      accumulatedProblems: nextAccumulatedProblems,
      usedTherapies: state.usedTherapies,
      rng: createSeededRng(state.randomSeed + nextRoundNumber * 7919),
    });
  }

  const nextState: SimulationState = {
    ...state,
    clones: normalizedClones,
    defenses: nextDefenses,
    clinical: nextClinical,
    hallmarkScores: nextHallmarks,
    enablingScores: nextEnabling,
    activeTherapy: undefined,
    accumulatedProblems: nextAccumulatedProblems,
    roundOffers: nextRoundOffers,
    history: [...state.history, resolution],
    score: nextScore,
    currentRound: nextRoundNumber,
    finished: isLastRound,
    outcomeCode,
    outcomeTitle,
    outcomeExplanation,
  };

  return { nextState, resolution };
}

/**
 * Resolve one turn in ONCOLOGIST MODE using the EXACT SAME underlying biological engine.
 */
export function resolveOncologistTurn(
  state: SimulationState,
  therapyId: TherapyId,
  predictionId: string = ''
): { nextState: SimulationState; resolution: TurnResolution } {
  const round = getActiveRoundOffer(state);
  const therapy = getTherapyById(therapyId) ?? THERAPIES_CATALOG[0];
  const hasPrediction = Boolean(predictionId && predictionId.trim().length > 0);
  const prediction = hasPrediction
    ? round.oncologistPredictions.find((p) => p.id === predictionId) ??
      round.oncologistPredictions[0]
    : null;

  const clonesBefore = state.clones.map((c) => ({ id: c.id, name: c.name, share: c.share }));
  const nextClones = cloneArray(state.clones);
  const nextDefenses: OrganismDefenses = { ...state.defenses };
  const nextClinical: ClinicalState = { ...state.clinical };

  const genesInvolved = new Set<string>();
  let weightedKill = 0;

  // Evaluate exact same clonal sensitivity & Darwinian selection rules
  for (const clone of nextClones) {
    const { killStrength } = evaluateTherapyEffectOnClone(
      clone,
      therapyId,
      nextClinical.diseaseExtent
    );
    weightedKill += (clone.share / 100) * killStrength;

    // Differential survival shifts relative clonal shares (resistant clones expand relatively!)
    const growthTerm = (clone.proliferationRate - clone.metabolicCost * 0.3) * 0.12;
    const survivalFactor = Math.max(0.18, 1 + (growthTerm - killStrength * 0.35) / 40);
    clone.share = Math.max(2, clone.share * survivalFactor);

    // Track genes that mediated sensitivity or resistance
    if (therapyId === 'egfr_tki') {
      genesInvolved.add('EGFR');
      if (clone.genotype.PTEN === 'inactivated') genesInvolved.add('PTEN');
      if (clone.genotype.KRAS === 'activated') genesInvolved.add('KRAS');
      if (clone.genotype.MET === 'activated') genesInvolved.add('MET');
    } else if (therapyId === 'cdk46_inhibitor') {
      genesInvolved.add('CDK6');
      genesInvolved.add('RB1');
    } else if (therapyId === 'pi3k_inhibitor') {
      genesInvolved.add('PIK3CA');
      genesInvolved.add('PTEN');
    } else if (therapyId === 'immunotherapy') {
      genesInvolved.add('PDL1');
    } else if (therapyId === 'chemotherapy' || therapyId === 'radiotherapy') {
      genesInvolved.add('TP53');
      genesInvolved.add('BAX');
      if (clone.genotype.BCL2 === 'activated') genesInvolved.add('BCL2');
    }
  }

  let normalizedClones = normalizeCloneShares(nextClones);

  // Compute clinical burden change
  const naturalGrowth =
    normalizedClones.reduce((sum, c) => sum + (c.share / 100) * c.proliferationRate, 0) * 0.19;
  const burdenDelta = clamp(Math.round(naturalGrowth - weightedKill * 0.72), -26, 18);
  nextClinical.tumorBurden = clamp(nextClinical.tumorBurden + burdenDelta, 0, 100);

  // Progressive problem accumulation: when active tumor persists under selective pressure,
  // a resistant subclone accumulates a coherent molecular alteration!
  const nextAccumulatedProblems = [...state.accumulatedProblems];
  let emergedProblemNote = '';
  if (nextClinical.tumorBurden > 12) {
    const adaptRng = createSeededRng(state.randomSeed + state.currentRound * 3571 + therapyId.length * 97);
    const adaptiveSpec = pickOncologistAdaptiveProblem(
      nextAccumulatedProblems.map((p) => p.id),
      therapyId,
      state.currentRound,
      adaptRng
    );
    if (adaptiveSpec) {
      const targetSlot =
        adaptiveSpec.targetCloneSlot === 'clone-founder' ? 'clone-sub-a' : adaptiveSpec.targetCloneSlot;
      const problemEntry = {
        id: adaptiveSpec.id,
        roundNumber: state.currentRound,
        geneSymbol: adaptiveSpec.geneSymbol,
        geneState: adaptiveSpec.geneState,
        logicLabel: adaptiveSpec.logicLabel,
        precisionLabel: adaptiveSpec.precisionLabel,
        shortDoorLogic: adaptiveSpec.shortDoorLogic,
        shortDoorPrecision: adaptiveSpec.shortDoorPrecision,
        summary: adaptiveSpec.summary,
        hallmarkId: adaptiveSpec.hallmarkId,
      };
      normalizedClones = applyProblemToClones(normalizedClones, targetSlot, problemEntry, adaptiveSpec);
      nextAccumulatedProblems.push(problemEntry);
      genesInvolved.add(adaptiveSpec.geneSymbol);
      emergedProblemNote = ` Durante esta ronda el tumor acumuló un nuevo problema adaptativo (${adaptiveSpec.precisionLabel}).`;
    }
  }

  // Disease extent progression or local downstaging
  if (nextClinical.tumorBurden >= 72) nextClinical.diseaseExtent = 'diseminada';
  else if (nextClinical.tumorBurden >= 55 && nextClinical.diseaseExtent === 'localizada')
    nextClinical.diseaseExtent = 'regional';

  // Toxicity & patient wellbeing (combination therapy or repeated chemo causes heavy penalty!)
  const repeatedToxicPenalty =
    therapy.toxicityDelta >= 20 && state.usedTherapies.includes(therapyId) ? 6 : 0;
  const toxChange = therapy.toxicityDelta + repeatedToxicPenalty;
  nextClinical.cumulativeToxicity = clamp(nextClinical.cumulativeToxicity + toxChange, 0, 100);

  // Quality of life & functional status respond directly to BOTH tumor burden and toxicity
  const qolBonus =
    therapyId === 'palliative_care' ? 14 : therapyId === 'active_surveillance' ? 7 : 0;
  nextClinical.functionalStatus = clamp(
    96 - nextClinical.tumorBurden * 0.44 - nextClinical.cumulativeToxicity * 0.44 + qolBonus * 0.5,
    12,
    98
  );
  nextClinical.qualityOfLife = clamp(
    98 - nextClinical.tumorBurden * 0.36 - nextClinical.cumulativeToxicity * 0.52 + qolBonus,
    12,
    98
  );
  nextClinical.diseaseControl = deriveDiseaseControl(nextClinical);

  // Immune recovery or suppression
  if (therapyId === 'immunotherapy') {
    nextDefenses.immuneSurveillance = clamp(nextDefenses.immuneSurveillance + 14, 25, 96);
  } else if (therapyId === 'chemotherapy' || therapyId === 'combo_targeted_chemo') {
    nextDefenses.immuneSurveillance = clamp(nextDefenses.immuneSurveillance - 10, 20, 95);
  } else if (therapyId === 'active_surveillance' || therapyId === 'palliative_care') {
    nextDefenses.immuneSurveillance = clamp(nextDefenses.immuneSurveillance + 6, 25, 95);
  }

  const prevHallmarks = state.hallmarkScores;
  const nextHallmarks = computeHallmarkScores(normalizedClones, nextDefenses);
  const nextEnabling = computeEnablingScores(normalizedClones, nextDefenses);

  const hallmarksAffected: TurnResolution['hallmarksAffected'] = (
    Object.keys(nextHallmarks) as HallmarkId[]
  )
    .filter((id) => Math.abs(nextHallmarks[id] - prevHallmarks[id]) >= 3)
    .slice(0, 4)
    .map((id) => ({
      id,
      direction: nextHallmarks[id] > prevHallmarks[id] ? 'up' : 'down',
      note:
        nextHallmarks[id] > prevHallmarks[id]
          ? `+${nextHallmarks[id] - prevHallmarks[id]} pts`
          : `${nextHallmarks[id] - prevHallmarks[id]} pts`,
    }));

  const resistantExpanded = normalizedClones.some(
    (c, idx) => c.origin !== 'founder' && c.share - clonesBefore[idx].share >= 8
  );
  const predictionMatched = prediction
    ? evaluatePredictionGate(state, therapyId, prediction.id).allowed
    : true;

  // Scoring — values diagnostic grounding, biological alignment, and patient quality of life!
  const informedChoice = state.completedDiagnostics.length >= 1;
  const biologicallyAligned =
    weightedKill >= 16 ||
    (therapyId === 'active_surveillance' &&
      (state.clinical.cumulativeToxicity >= 35 || state.clinical.tumorBurden <= 30)) ||
    (therapyId === 'palliative_care' &&
      (state.clinical.cumulativeToxicity >= 45 || state.clinical.tumorBurden >= 62));

  const scoreDivisor = state.unlimitedMode ? 8 : state.maxRounds;
  const perRoundCausal = Math.round(30 / scoreDivisor);
  const perRoundDec = Math.round(25 / scoreDivisor);
  const compBonus = informedChoice ? 3 : 1;

  const nextScore: ScoreBreakdown = {
    molecularComprehension: clamp(state.score.molecularComprehension + compBonus, 0, 30),
    causalRelations: clamp(
      state.score.causalRelations +
        (predictionMatched ? perRoundCausal : Math.max(2, Math.round(perRoundCausal * 0.6))),
      0,
      30
    ),
    groundedDecisions: clamp(
      state.score.groundedDecisions +
        (biologicallyAligned ? perRoundDec : Math.max(2, Math.round(perRoundDec * 0.55))),
      0,
      25
    ),
    reflection: state.score.reflection,
    total: 0,
  };
  nextScore.total =
    nextScore.molecularComprehension +
    nextScore.causalRelations +
    nextScore.groundedDecisions +
    nextScore.reflection;

  const dominantAfter = normalizedClones.reduce((a, b) => (b.share > a.share ? b : a));
  let whatHappened = `Se aplicó ${therapy.name}. `;
  if (therapyId === 'palliative_care') {
    whatHappened += `Se priorizó el control sintomático y bienestar: la toxicidad descendió y la calidad de vida subió a ${nextClinical.qualityOfLife}/100.`;
  } else if (therapyId === 'active_surveillance') {
    whatHappened += `La pausa monitorizada permitió recuperación tisular (toxicidad ${nextClinical.cumulativeToxicity}/100) mientras la carga tumoral cambió en ${burdenDelta >= 0 ? '+' : ''}${burdenDelta} pts.`;
  } else if (burdenDelta <= -8 && resistantExpanded) {
    whatHappened += `La carga tumoral bajó (${burdenDelta} pts) por eliminación del clon sensible, pero la presión selectiva incrementó la fracción de ${dominantAfter.name} (${dominantAfter.share}%).`;
  } else if (burdenDelta <= -6) {
    whatHappened += `Respuesta favorable: la carga tumoral disminuyó en ${Math.abs(burdenDelta)} puntos internos con toxicidad acumulada de ${nextClinical.cumulativeToxicity}/100.`;
  } else if (weightedKill <= 5) {
    whatHappened += `Respuesta pobre: los clones dominantes presentan resistencia intrínseca o bypass frente a este mecanismo, mientras la toxicidad aumentó en +${toxChange} pts.`;
  } else {
    whatHappened += `Estabilización parcial (${burdenDelta >= 0 ? '+' : ''}${burdenDelta} pts en carga tumoral); conviene vigilar la evolución clonal y la tolerancia clínica.`;
  }
  if (emergedProblemNote) {
    whatHappened += emergedProblemNote;
  }

  const resolution: TurnResolution = {
    roundNumber: state.currentRound,
    mode: 'oncologist',
    actionKind: 'intervention',
    eventTitle: round.title,
    actionTakenLabel: therapy.name,
    predictionLabel: prediction ? prediction.label : 'Intervención terapéutica directa',
    predictionMatched,
    whatHappened,
    genesInvolved:
      Array.from(genesInvolved).length > 0
        ? Array.from(genesInvolved)
        : UNIFIED_FEATURED_GENES.slice(0, 3),
    cellularProcessChanged: therapy.mechanism,
    hallmarksAffected,
    evidenceCitations: [
      { source: `Regla clínica (${therapy.shortName})`, detail: therapy.clinicalEvidenceRef },
      { source: 'Hanahan (Cell, 2026)', detail: HANAHAN_CITATION },
      { source: 'COSMIC Hallmarks of Cancer', detail: COSMIC_HOC_CITATION },
    ],
    clonesBefore,
    clonesAfter: normalizedClones.map((c) => ({ id: c.id, name: c.name, share: c.share })),
    clinicalDelta: {
      tumorBurdenDelta: burdenDelta,
      toxicityDelta: nextClinical.cumulativeToxicity - state.clinical.cumulativeToxicity,
      qolDelta: nextClinical.qualityOfLife - state.clinical.qualityOfLife,
    },
    stochasticDisclosure:
      'Nota educativa: los indicadores clínicos son escalas internas ficticias y no constituyen pronósticos ni recomendaciones médicas reales.',
  };

  // Compute Oncologist liberation progress (0-100%) for Unlimited Mode
  const prevLiberation = state.oncologistLiberation ?? 16;
  let liberationDelta = 0;
  if (therapyId === 'active_surveillance' || therapyId === 'palliative_care') {
    if (nextClinical.tumorBurden <= 24 || state.clinical.cumulativeToxicity >= 25) {
      liberationDelta = nextClinical.tumorBurden <= 14 ? 16 : 12;
    } else {
      liberationDelta = -6;
    }
  } else if (weightedKill >= 22 && nextClinical.cumulativeToxicity < 65) {
    liberationDelta = nextClinical.tumorBurden <= 16 ? 24 : 20;
  } else if (weightedKill >= 10 && nextClinical.cumulativeToxicity < 72) {
    liberationDelta = nextClinical.cumulativeToxicity >= 50 ? 8 : 14;
  } else if (nextClinical.cumulativeToxicity >= 72) {
    liberationDelta = -12;
  } else {
    liberationDelta = -10;
  }
  const nextLiberation = clamp(prevLiberation + liberationDelta, 4, 100);

  if (state.unlimitedMode) {
    if (nextLiberation >= 100) {
      nextClinical.tumorBurden = 0;
      nextClinical.diseaseControl = 'remision';
    } else if (nextClinical.tumorBurden === 0) {
      // Microscopic minimal residual disease persists until 100% liberation is consolidated
      nextClinical.tumorBurden = 4;
    }
  }

  // End conditions for Oncologist Mode
  const criticalDecline = nextClinical.functionalStatus <= 24 || nextClinical.cumulativeToxicity >= 88;
  const simulatedRemission = nextClinical.tumorBurden <= 12 && nextClinical.qualityOfLife >= 55;
  const isLastRound = state.unlimitedMode
    ? nextLiberation >= 100
    : state.currentRound >= state.maxRounds || criticalDecline || simulatedRemission;

  let outcomeCode: FinalOutcomeCode | undefined;
  let outcomeTitle: string | undefined;
  let outcomeExplanation: string | undefined;

  if (isLastRound) {
    if (state.unlimitedMode && nextLiberation >= 100) {
      outcomeCode = 'remision_simulada';
      outcomeTitle = 'Control tumoral completo · Progreso al 100%';
      outcomeExplanation = `Recorriste ${state.currentRound} rondas ajustando tus decisiones a los hallazgos del tumor y protegiendo al paciente hasta completar el control tumoral simulado.`;
    } else if (criticalDecline) {
      outcomeCode = 'deterioro_clinico';
      outcomeTitle = 'Deterioro clínico por toxicidad o progresión';
      outcomeExplanation =
        'El límite de tolerancia clínica fue superado. En oncología, intensificar tratamientos sin margen biológico o funcional compromete la vida y calidad de vida del paciente.';
    } else if (simulatedRemission) {
      outcomeCode = 'remision_simulada';
      outcomeTitle = 'Remisión en el escenario simulado';
      outcomeExplanation =
        'La estrategia guiada por diagnóstico molecular redujo la carga tumoral a niveles mínimos preservando la función del paciente (control tumoral simulado, no garantía de curación clínica).';
    } else if (
      therapyId === 'palliative_care' &&
      nextClinical.qualityOfLife >= 65
    ) {
      outcomeCode = 'prioridad_calidad_vida';
      outcomeTitle = 'Priorización responsable de calidad de vida';
      outcomeExplanation =
        'Frente a enfermedad compleja o toxicidad relevante, elegir soporte sintomático y preservación funcional es una decisión clínica ética, fundamentada y respetuosa.';
    } else if (nextClinical.tumorBurden <= 36 && nextClinical.qualityOfLife >= 58) {
      outcomeCode = 'control_sostenido';
      outcomeTitle = 'Control sostenido de la enfermedad';
      outcomeExplanation =
        'Se mantuvo el tumor bajo contención adaptándose a la heterogeneidad clonal sin sacrificar el bienestar del paciente.';
    } else {
      outcomeCode = 'enfermedad_activa';
      outcomeTitle = 'Ciclo completado con enfermedad activa';
      outcomeExplanation =
        'Persisten subclones activos al cierre de las rondas. Revisa en el informe qué presiones terapéuticas seleccionaron clones resistentes y qué alternativas moleculares existían.';
    }
  }

  // Replenish +1 diagnostic point every 2 rounds to allow adaptive re-biopsy / monitoring across 3..10 rounds
  const nextBudget = Math.min(
    state.maxDiagnosticBudget,
    state.diagnosticBudget + (state.currentRound % 2 === 0 ? 1 : 0)
  );

  const nextUsedTherapies = [...state.usedTherapies, therapyId];
  const nextRoundNumber = isLastRound ? state.currentRound : state.currentRound + 1;
  const nextRoundOffers = { ...state.roundOffers };
  if (!isLastRound) {
    nextRoundOffers[nextRoundNumber] = generateRoundOffer({
      roundNumber: nextRoundNumber,
      clones: normalizedClones,
      clinical: nextClinical,
      accumulatedProblems: nextAccumulatedProblems,
      usedTherapies: nextUsedTherapies,
      completedDiagnostics: state.completedDiagnostics,
      rng: createSeededRng(state.randomSeed + nextRoundNumber * 7919),
    });
  }

  const nextState: SimulationState = {
    ...state,
    clones: normalizedClones,
    defenses: nextDefenses,
    clinical: nextClinical,
    hallmarkScores: nextHallmarks,
    enablingScores: nextEnabling,
    activeTherapy: therapyId,
    usedTherapies: nextUsedTherapies,
    accumulatedProblems: nextAccumulatedProblems,
    roundOffers: nextRoundOffers,
    diagnosticBudget: nextBudget,
    history: [...state.history, resolution],
    score: nextScore,
    currentRound: nextRoundNumber,
    oncologistLiberation: nextLiberation,
    finished: isLastRound,
    outcomeCode,
    outcomeTitle,
    outcomeExplanation,
  };

  return { nextState, resolution };
}

/**
 * Resolve an odd-round DIAGNOSTIC turn in ONCOLOGIST MODE.
 * Reveals molecular/cellular details without budget walls, applies realistic
 * tissue/clonal passage of time, and advances cleanly to the next Intervention round.
 */
export function resolveOncologistDiagnosticTurn(
  state: SimulationState,
  toolId: DiagnosticToolId
): { nextState: SimulationState; resolution: TurnResolution } {
  const round = getActiveRoundOffer(state);
  const tool = DIAGNOSTIC_TOOLS.find((t) => t.id === toolId) ?? DIAGNOSTIC_TOOLS[0];

  const clonesBefore = state.clones.map((c) => ({ id: c.id, name: c.name, share: c.share }));
  const nextClones = cloneArray(state.clones);
  const nextDefenses: OrganismDefenses = { ...state.defenses };
  const nextClinical: ClinicalState = { ...state.clinical };

  const revealed = new Set(state.revealedGenes);
  let revealedExtent = state.revealedExtent;
  let revealedClonalHeterogeneity = state.revealedClonalHeterogeneity;
  let revealedBiomarkers = state.revealedBiomarkers;

  const domStates = getDominantNetworkGeneStates(state.clones);
  const dominantBefore = state.clones.reduce((a, b) => (b.share > a.share ? b : a), state.clones[0]);
  const genesInvolved = new Set<string>();
  let findingDetail = '';
  let cellularProcessChanged = '';

  switch (tool.id) {
    case 'imaging': {
      revealedExtent = true;
      findingDetail = `Las imágenes confirman una enfermedad ${state.clinical.diseaseExtent} con carga tumoral actual de ${state.clinical.tumorBurden}/100.`;
      cellularProcessChanged =
        'Evaluación anatómica del tamaño del tumor y de su extensión (localizada, regional o diseminada).';
      genesInvolved.add('VEGFA');
      genesInvolved.add('MET');
      break;
    }
    case 'biopsy': {
      const biopsyGenes = ['TP53', 'RB1', 'BAX', 'CDK6', 'CDKN2A', 'ATM'];
      biopsyGenes.forEach((g) => {
        if (UNIFIED_FEATURED_GENES.includes(g)) revealed.add(g);
        genesInvolved.add(g);
      });
      const alteredBiopsy = biopsyGenes.filter((g) => domStates[g] && domStates[g] !== 'functional');
      findingDetail =
        alteredBiopsy.length > 0
          ? `La biopsia tisular detectó alteraciones en reguladores del ciclo celular y respuesta apoptótica (${alteredBiopsy.join(', ')}).`
          : 'La biopsia tisular confirmó que los puntos de control del ciclo celular (RB1/TP53) y la vía apoptótica basal (BAX) siguen preservados.';
      cellularProcessChanged =
        'Caracterización histológica del índice mitótico, freno del ciclo celular (RB1/CDK6) y capacidad apoptótica (TP53/BAX).';
      break;
    }
    case 'molecular_profile': {
      const ngsGenes = ['EGFR', 'KRAS', 'PIK3CA', 'PTEN', 'MET', 'CDK6', 'RB1', 'TP53', 'BAX'];
      ngsGenes.forEach((g) => {
        if (UNIFIED_FEATURED_GENES.includes(g)) revealed.add(g);
        genesInvolved.add(g);
      });
      revealedClonalHeterogeneity = true;
      const activeDrivers = ngsGenes.filter((g) => domStates[g] && domStates[g] !== 'functional');
      findingDetail = `El perfil molecular identificó ${activeDrivers.length > 0 ? `alteraciones activas en ${activeDrivers.join(', ')}` : 'señalización temprana sin bypass consolidado'} y mapeó ${state.clones.length} subpoblaciones clonales (dominante: ${dominantBefore.name}, ${dominantBefore.share}%).`;
      cellularProcessChanged =
        'Mapeo de impulsores mitogénicos (EGFR/KRAS/PIK3CA), supresores (PTEN/TP53/RB1) y arquitectura clonal heterogénea.';
      break;
    }
    case 'biomarkers': {
      const bioGenes = ['PDL1', 'VEGFA', 'BCL2'];
      bioGenes.forEach((g) => {
        if (UNIFIED_FEATURED_GENES.includes(g)) revealed.add(g);
        genesInvolved.add(g);
      });
      revealedBiomarkers = true;
      const pdl1Status = domStates.PDL1 === 'activated' ? 'expresión elevada de PD-L1' : 'expresión basal baja de PD-L1';
      const vegfStatus = domStates.VEGFA === 'activated' ? 'señal angiogénica activa (VEGFA)' : 'baja inducción vascular';
      findingDetail = `Los biomarcadores mostraron ${pdl1Status} y ${vegfStatus}, orientando la viabilidad de inmunoterapia frente a barreras del microambiente.`;
      cellularProcessChanged =
        'Cuantificación de evasión inmune (PD-L1), inducción angiogénica (VEGFA) y escudo antiapoptótico (BCL2).';
      break;
    }
    case 'response_monitoring': {
      UNIFIED_FEATURED_GENES.forEach((g) => revealed.add(g));
      revealedClonalHeterogeneity = true;
      const minority = state.clones
        .filter((c) => c.id !== dominantBefore.id)
        .sort((a, b) => b.share - a.share)[0];
      findingDetail = `El seguimiento molecular actualizó la dinámica clonal en tiempo real: ${dominantBefore.name} (${dominantBefore.share}%)${minority ? ` junto a ${minority.name} (${minority.share}%)` : ''}, permitiendo anticipar escapes de resistencia.`;
      cellularProcessChanged =
        'Detección dinámica de expansión relativa de subclones resistentes y carga molecular residual.';
      genesInvolved.add('EGFR');
      genesInvolved.add('MET');
      genesInvolved.add('PTEN');
      break;
    }
  }

  // Gentle biological passage of time during diagnostic evaluation (zero drug toxicity!)
  for (const clone of nextClones) {
    const drift = (clone.proliferationRate - clone.metabolicCost * 0.45) * 0.04;
    clone.share = Math.max(2, clone.share + drift);
  }
  const normalizedClones = normalizeCloneShares(nextClones);

  const burdenDelta = nextClinical.tumorBurden > 22 ? 2 : nextClinical.tumorBurden > 10 ? 1 : 0;
  nextClinical.tumorBurden = clamp(nextClinical.tumorBurden + burdenDelta, 0, 100);
  nextClinical.cumulativeToxicity = clamp(nextClinical.cumulativeToxicity - 4, 0, 100);
  nextClinical.functionalStatus = clamp(
    96 - nextClinical.tumorBurden * 0.44 - nextClinical.cumulativeToxicity * 0.44 + 3,
    14,
    98
  );
  nextClinical.qualityOfLife = clamp(
    98 - nextClinical.tumorBurden * 0.36 - nextClinical.cumulativeToxicity * 0.52 + 4,
    14,
    98
  );
  nextClinical.diseaseControl = deriveDiseaseControl(nextClinical);
  nextDefenses.immuneSurveillance = clamp(nextDefenses.immuneSurveillance + 2, 25, 96);

  const prevHallmarks = state.hallmarkScores;
  const nextHallmarks = computeHallmarkScores(normalizedClones, nextDefenses);
  const nextEnabling = computeEnablingScores(normalizedClones, nextDefenses);

  const hallmarksAffected: TurnResolution['hallmarksAffected'] = (
    Object.keys(nextHallmarks) as HallmarkId[]
  )
    .filter((id) => Math.abs(nextHallmarks[id] - prevHallmarks[id]) >= 2)
    .slice(0, 4)
    .map((id) => ({
      id,
      direction: nextHallmarks[id] > prevHallmarks[id] ? 'up' : 'down',
      note:
        nextHallmarks[id] > prevHallmarks[id]
          ? `+${nextHallmarks[id] - prevHallmarks[id]} pts`
          : `${nextHallmarks[id] - prevHallmarks[id]} pts`,
    }));

  const completedDiagnostics = state.completedDiagnostics.includes(tool.id)
    ? state.completedDiagnostics
    : [...state.completedDiagnostics, tool.id];

  const compBonus = clamp(state.score.molecularComprehension + 5, 0, 30);
  const causalBonus = clamp(state.score.causalRelations + 3, 0, 30);
  const decBonus = clamp(state.score.groundedDecisions + 3, 0, 25);
  const nextScore: ScoreBreakdown = {
    molecularComprehension: compBonus,
    causalRelations: causalBonus,
    groundedDecisions: decBonus,
    reflection: state.score.reflection,
    total: compBonus + causalBonus + decBonus + state.score.reflection,
  };

  const prevLiberation = state.oncologistLiberation ?? 16;
  const liberationGain = nextClinical.cumulativeToxicity >= 75 ? 2 : 6;
  const nextLiberation = clamp(prevLiberation + liberationGain, 4, 100);

  if (state.unlimitedMode && nextLiberation >= 100) {
    nextClinical.tumorBurden = 0;
    nextClinical.diseaseControl = 'remision';
  }

  const isLastRound = state.unlimitedMode
    ? nextLiberation >= 100
    : state.currentRound >= state.maxRounds;

  let outcomeCode: FinalOutcomeCode | undefined;
  let outcomeTitle: string | undefined;
  let outcomeExplanation: string | undefined;
  if (isLastRound) {
    if (state.unlimitedMode && nextLiberation >= 100) {
      outcomeCode = 'remision_simulada';
      outcomeTitle = 'Control tumoral completo · Progreso al 100%';
      outcomeExplanation = `Recorriste ${state.currentRound} rondas alternando estudios e intervenciones hasta completar el control tumoral simulado.`;
    } else {
      outcomeCode = nextClinical.tumorBurden <= 32 ? 'control_sostenido' : 'enfermedad_activa';
      outcomeTitle =
        nextClinical.tumorBurden <= 32
          ? 'Control sostenido de la enfermedad'
          : 'Ciclo completado con enfermedad activa';
      outcomeExplanation =
        'El estudio completó la caracterización del tumor al cierre de las rondas.';
    }
  }

  const whatHappened = `${findingDetail} Este estudio no añade toxicidad (${nextClinical.cumulativeToxicity}/100). Usa este hallazgo para orientar la intervención de la siguiente ronda.`;

  const resolution: TurnResolution = {
    roundNumber: state.currentRound,
    mode: 'oncologist',
    actionKind: 'diagnostic',
    eventTitle: `Diagnóstico · Ronda ${state.currentRound}`,
    actionTakenLabel: tool.name,
    predictionLabel: 'Estudio diagnóstico',
    predictionMatched: true,
    whatHappened,
    genesInvolved: Array.from(genesInvolved),
    cellularProcessChanged,
    hallmarksAffected,
    evidenceCitations: [
      { source: `Estudio diagnóstico (${tool.shortName})`, detail: tool.revealsDescription },
      { source: 'Hanahan (Cell, 2026)', detail: HANAHAN_CITATION },
    ],
    clonesBefore,
    clonesAfter: normalizedClones.map((c) => ({ id: c.id, name: c.name, share: c.share })),
    clinicalDelta: {
      tumorBurdenDelta: nextClinical.tumorBurden - state.clinical.tumorBurden,
      toxicityDelta: nextClinical.cumulativeToxicity - state.clinical.cumulativeToxicity,
      qolDelta: nextClinical.qualityOfLife - state.clinical.qualityOfLife,
    },
  };

  const nextRoundNumber = isLastRound ? state.currentRound : state.currentRound + 1;
  const nextRoundOffers = { ...state.roundOffers };
  if (!isLastRound) {
    nextRoundOffers[nextRoundNumber] = generateRoundOffer({
      roundNumber: nextRoundNumber,
      clones: normalizedClones,
      clinical: nextClinical,
      accumulatedProblems: state.accumulatedProblems,
      usedTherapies: state.usedTherapies,
      completedDiagnostics,
      rng: createSeededRng(state.randomSeed + nextRoundNumber * 7919),
    });
  }

  const nextState: SimulationState = {
    ...state,
    clones: normalizedClones,
    defenses: nextDefenses,
    clinical: nextClinical,
    hallmarkScores: nextHallmarks,
    enablingScores: nextEnabling,
    completedDiagnostics,
    revealedGenes: Array.from(revealed),
    revealedExtent,
    revealedClonalHeterogeneity,
    revealedBiomarkers,
    roundOffers: nextRoundOffers,
    history: [...state.history, resolution],
    score: nextScore,
    currentRound: nextRoundNumber,
    oncologistLiberation: nextLiberation,
    finished: isLastRound,
    outcomeCode,
    outcomeTitle,
    outcomeExplanation,
  };

  return { nextState, resolution };
}

/**
 * Skip ANY Oncologist round (Diagnostic or Intervention) under Clinical Observation.
 * Preserves healthy tissue, lowers toxicity, and reveals the natural cellular/clonal
 * ramifications of waiting without pharmacological pressure.
 */
export function resolveOncologistObservationTurn(
  state: SimulationState
): { nextState: SimulationState; resolution: TurnResolution } {
  const round = getActiveRoundOffer(state);
  const skippedPhaseLabel = round.oncologistPhase === 'diagnostic' ? 'diagnóstico' : 'intervención';

  const clonesBefore = state.clones.map((c) => ({ id: c.id, name: c.name, share: c.share }));
  const nextClones = cloneArray(state.clones);
  const nextDefenses: OrganismDefenses = { ...state.defenses };
  const nextClinical: ClinicalState = { ...state.clinical };
  const genesInvolved = new Set<string>();

  // Natural clonal dynamics without pharmacological pressure
  for (const clone of nextClones) {
    const naturalFitness = (clone.proliferationRate - clone.metabolicCost * 0.38) * 0.09;
    clone.share = Math.max(2, clone.share + naturalFitness);
  }
  let normalizedClones = normalizeCloneShares(nextClones);

  // Burden drift depends on existing tumor load
  const rawBurdenDelta =
    nextClinical.tumorBurden >= 35
      ? 5
      : nextClinical.tumorBurden >= 20
        ? 3
        : nextClinical.tumorBurden >= 10
          ? 1
          : 0;
  nextClinical.tumorBurden = clamp(nextClinical.tumorBurden + rawBurdenDelta, 0, 100);

  // If high untreated burden persists, a subclone may accumulate a natural progression alteration
  const nextAccumulatedProblems = [...state.accumulatedProblems];
  let naturalMutationNote = '';
  if (nextClinical.tumorBurden >= 30) {
    const obsRng = createSeededRng(state.randomSeed + state.currentRound * 4219);
    const adaptiveSpec = pickOncologistAdaptiveProblem(
      nextAccumulatedProblems.map((p) => p.id),
      'active_surveillance',
      state.currentRound,
      obsRng
    );
    if (adaptiveSpec) {
      const targetSlot =
        adaptiveSpec.targetCloneSlot === 'clone-founder'
          ? 'clone-sub-a'
          : adaptiveSpec.targetCloneSlot;
      const problemEntry = {
        id: adaptiveSpec.id,
        roundNumber: state.currentRound,
        geneSymbol: adaptiveSpec.geneSymbol,
        geneState: adaptiveSpec.geneState,
        logicLabel: adaptiveSpec.logicLabel,
        precisionLabel: adaptiveSpec.precisionLabel,
        shortDoorLogic: adaptiveSpec.shortDoorLogic,
        shortDoorPrecision: adaptiveSpec.shortDoorPrecision,
        summary: adaptiveSpec.summary,
        hallmarkId: adaptiveSpec.hallmarkId,
      };
      normalizedClones = applyProblemToClones(
        normalizedClones,
        targetSlot,
        problemEntry,
        adaptiveSpec
      );
      nextAccumulatedProblems.push(problemEntry);
      genesInvolved.add(adaptiveSpec.geneSymbol);
      naturalMutationNote = ` Sin contención activa, el tumor acumuló una alteración adaptativa natural (${adaptiveSpec.precisionLabel}).`;
    }
  }

  if (nextClinical.tumorBurden >= 72) nextClinical.diseaseExtent = 'diseminada';
  else if (nextClinical.tumorBurden >= 55 && nextClinical.diseaseExtent === 'localizada') {
    nextClinical.diseaseExtent = 'regional';
  }

  // Healthy tissue recovery & immune restoration under Observation
  nextClinical.cumulativeToxicity = clamp(nextClinical.cumulativeToxicity - 10, 0, 100);
  nextDefenses.immuneSurveillance = clamp(nextDefenses.immuneSurveillance + 6, 25, 96);
  nextClinical.functionalStatus = clamp(
    96 - nextClinical.tumorBurden * 0.44 - nextClinical.cumulativeToxicity * 0.44 + 5,
    14,
    98
  );
  nextClinical.qualityOfLife = clamp(
    98 - nextClinical.tumorBurden * 0.36 - nextClinical.cumulativeToxicity * 0.52 + 7,
    14,
    98
  );
  nextClinical.diseaseControl = deriveDiseaseControl(nextClinical);

  const prevHallmarks = state.hallmarkScores;
  const nextHallmarks = computeHallmarkScores(normalizedClones, nextDefenses);
  const nextEnabling = computeEnablingScores(normalizedClones, nextDefenses);

  const hallmarksAffected: TurnResolution['hallmarksAffected'] = (
    Object.keys(nextHallmarks) as HallmarkId[]
  )
    .filter((id) => Math.abs(nextHallmarks[id] - prevHallmarks[id]) >= 2)
    .slice(0, 4)
    .map((id) => ({
      id,
      direction: nextHallmarks[id] > prevHallmarks[id] ? 'up' : 'down',
      note:
        nextHallmarks[id] > prevHallmarks[id]
          ? `+${nextHallmarks[id] - prevHallmarks[id]} pts`
          : `${nextHallmarks[id] - prevHallmarks[id]} pts`,
    }));

  // Liberation progress under Observation
  const prevLiberation = state.oncologistLiberation ?? 16;
  let liberationDelta = 0;
  if (nextClinical.tumorBurden <= 20) {
    liberationDelta = 12;
  } else if (state.clinical.cumulativeToxicity >= 30) {
    liberationDelta = 8;
  } else if (nextClinical.tumorBurden <= 30) {
    liberationDelta = 4;
  } else {
    liberationDelta = -5;
  }
  const nextLiberation = clamp(prevLiberation + liberationDelta, 4, 100);

  if (state.unlimitedMode && nextLiberation >= 100) {
    nextClinical.tumorBurden = 0;
    nextClinical.diseaseControl = 'remision';
  }

  const isLastRound = state.unlimitedMode
    ? nextLiberation >= 100
    : state.currentRound >= state.maxRounds;

  let outcomeCode: FinalOutcomeCode | undefined;
  let outcomeTitle: string | undefined;
  let outcomeExplanation: string | undefined;
  if (isLastRound) {
    if (state.unlimitedMode && nextLiberation >= 100) {
      outcomeCode = 'remision_simulada';
      outcomeTitle = 'Control tumoral consolidado · Progreso al 100%';
      outcomeExplanation = `Tras ${state.currentRound} rondas combinando estudios, intervenciones y pausas de observación, consolidaste el control tumoral protegiendo los tejidos sanos.`;
    } else {
      outcomeCode = nextClinical.tumorBurden <= 32 ? 'control_sostenido' : 'enfermedad_activa';
      outcomeTitle =
        nextClinical.tumorBurden <= 32
          ? 'Control sostenido bajo observación'
          : 'Ciclo completado con enfermedad activa';
      outcomeExplanation =
        'La observación preservó la función del paciente y evitó toxicidad acumulada, permitiendo evaluar la evolución natural de los clones.';
    }
  }

  const dominantAfter = normalizedClones.reduce((a, b) => (b.share > a.share ? b : a));
  const burdenChange = nextClinical.tumorBurden - state.clinical.tumorBurden;
  const whatHappened = `Se omitió la ronda de ${skippedPhaseLabel} para mantener observación clínica. Sin presión farmacológica, los tejidos sanos se recuperaron (toxicidad acumulada ${nextClinical.cumulativeToxicity}/100, vigilancia inmune reforzada) y la carga tumoral cambió en ${burdenChange >= 0 ? '+' : ''}${burdenChange} pts, con ${dominantAfter.name} (${dominantAfter.share}% de la población) como grupo dominante.${naturalMutationNote}`;

  const resolution: TurnResolution = {
    roundNumber: state.currentRound,
    mode: 'oncologist',
    actionKind: 'observation',
    eventTitle: `Observación clínica · Ronda ${state.currentRound}`,
    actionTakenLabel: 'Observación clínica (ronda omitida)',
    predictionLabel: 'Pausa en observación',
    predictionMatched: true,
    whatHappened,
    genesInvolved:
      Array.from(genesInvolved).length > 0
        ? Array.from(genesInvolved)
        : ['EGFR', 'TP53', 'PDL1'],
    cellularProcessChanged:
      'Recuperación de tejidos sanos y linfocitos T sin presión farmacológica frente a la proliferación basal natural de los clones.',
    hallmarksAffected,
    evidenceCitations: [
      {
        source: 'Observación y desescalada clínica',
        detail:
          'Pausar intervenciones permite recuperar médula ósea y vigilancia inmune, evitando seleccionar clones resistentes innecesariamente cuando la carga está controlada.',
      },
      { source: 'Hanahan (Cell, 2026)', detail: HANAHAN_CITATION },
    ],
    clonesBefore,
    clonesAfter: normalizedClones.map((c) => ({ id: c.id, name: c.name, share: c.share })),
    clinicalDelta: {
      tumorBurdenDelta: burdenChange,
      toxicityDelta: nextClinical.cumulativeToxicity - state.clinical.cumulativeToxicity,
      qolDelta: nextClinical.qualityOfLife - state.clinical.qualityOfLife,
    },
  };

  const nextRoundNumber = isLastRound ? state.currentRound : state.currentRound + 1;
  const nextRoundOffers = { ...state.roundOffers };
  if (!isLastRound) {
    nextRoundOffers[nextRoundNumber] = generateRoundOffer({
      roundNumber: nextRoundNumber,
      clones: normalizedClones,
      clinical: nextClinical,
      accumulatedProblems: nextAccumulatedProblems,
      usedTherapies: state.usedTherapies,
      completedDiagnostics: state.completedDiagnostics,
      rng: createSeededRng(state.randomSeed + nextRoundNumber * 7919),
    });
  }

  const nextState: SimulationState = {
    ...state,
    clones: normalizedClones,
    defenses: nextDefenses,
    clinical: nextClinical,
    hallmarkScores: nextHallmarks,
    enablingScores: nextEnabling,
    activeTherapy: 'active_surveillance',
    accumulatedProblems: nextAccumulatedProblems,
    roundOffers: nextRoundOffers,
    history: [...state.history, resolution],
    currentRound: nextRoundNumber,
    oncologistLiberation: nextLiberation,
    finished: isLastRound,
    outcomeCode,
    outcomeTitle,
    outcomeExplanation,
  };

  return { nextState, resolution };
}

/**
 * Updates reflection answers and scores the 15% Reflection rubric criterion.
 */
export function updateReflectionsAndScore(
  state: SimulationState,
  reflections: ReflectionAnswers
): SimulationState {
  const scoreAnswer = (text: string): number => {
    const clean = text.trim();
    if (clean.length >= 60) return 5;
    if (clean.length >= 25) return 3;
    if (clean.length >= 8) return 1;
    return 0;
  };

  const reflectionScore = clamp(
    scoreAnswer(reflections.q1KeyAlterations) +
      scoreAnswer(reflections.q2HallmarksRelation) +
      scoreAnswer(reflections.q3AlternativePath),
    0,
    15
  );

  const nextScore: ScoreBreakdown = {
    ...state.score,
    reflection: reflectionScore,
    total:
      state.score.molecularComprehension +
      state.score.causalRelations +
      state.score.groundedDecisions +
      reflectionScore,
  };

  return {
    ...state,
    reflections,
    score: nextScore,
  };
}

export function buildCompletedRunSummary(
  state: SimulationState,
  meta?: { playMode?: PlayMode; molecularDetail?: MolecularDetailMode }
): CompletedRunSummary {
  const dominant = state.clones.reduce((a, b) => (b.share > a.share ? b : a), state.clones[0]);
  const dest = computeDestinationProgress(state);
  return {
    runId: state.runId,
    teamName: state.teamName,
    mode: state.mode,
    scenarioId: state.scenarioId,
    completedAt: new Date().toISOString(),
    outcomeCode: state.outcomeCode ?? 'enfermedad_contenida',
    outcomeTitle: state.outcomeTitle ?? 'Partida finalizada',
    finalBurden: state.clinical.tumorBurden,
    finalQol: state.clinical.qualityOfLife,
    finalToxicity: state.clinical.cumulativeToxicity,
    dominantCloneName: dominant.name,
    dominantCloneShare: dominant.share,
    destinationProgress: dest.progress,
    destinationReached: dest.isReached,
    roundsPlayed: state.history.length,
    unlimitedMode: state.unlimitedMode,
    oncologistStartStage: state.oncologistStartStage,
    playMode: meta?.playMode,
    molecularDetail: meta?.molecularDetail,
    score: { ...state.score },
    history: [...state.history],
    reflections: { ...state.reflections },
    hallmarkScores: { ...state.hallmarkScores },
    usedTherapies: [...state.usedTherapies],
    accumulatedProblems: [...state.accumulatedProblems],
    completedDiagnostics: [...state.completedDiagnostics],
    revealedGenes: [...state.revealedGenes],
  };
}

/**
 * Compares a completed Cancer run and Oncologist run starting from the exact same baseline cell.
 */
export function comparePerspectiveRuns(
  cancerRun: CompletedRunSummary,
  oncologistRun: CompletedRunSummary
): PerspectiveComparison {
  const coincidences: string[] = [];
  const differences: string[] = [];
  const hiddenInfoInsights: string[] = [];

  if (cancerRun.dominantCloneName === oncologistRun.dominantCloneName) {
    coincidences.push(
      `En ambos recorridos terminó predominando ${cancerRun.dominantCloneName}, confirmando que las mismas reglas biológicas rigen la ventaja selectiva.`
    );
  } else {
    differences.push(
      `En modo cáncer predominó ${cancerRun.dominantCloneName} (${cancerRun.dominantCloneShare}%), mientras que en modo oncólogo predominó ${oncologistRun.dominantCloneName} (${oncologistRun.dominantCloneShare}%) según la secuencia de decisiones aplicada.`
    );
  }

  coincidences.push(
    'Ambos roles partieron de exactamente la misma célula inicial y las mismas defensas del organismo antes de bifurcarse por acumulación de problemas.'
  );

  const burdenGap = cancerRun.finalBurden - oncologistRun.finalBurden;
  differences.push(
    `Tasa final de cáncer: ${cancerRun.finalBurden}% en modo cáncer frente a ${oncologistRun.finalBurden}% en modo oncólogo (bienestar final: ${oncologistRun.finalQol}%, efectos secundarios: ${oncologistRun.finalToxicity}%).`
  );

  if (burdenGap > 10) {
    differences.push(
      'Desde la perspectiva médica, investigar primero y ajustar el tratamiento a las vulnerabilidades reales contuvo mejor la acumulación de alteraciones.'
    );
  }

  const totalGenes = UNIFIED_FEATURED_GENES.length;
  const unrevealedCount = Math.max(0, totalGenes - oncologistRun.revealedGenes.length);
  hiddenInfoInsights.push(
    `El modo cáncer conocía desde el inicio los ${totalGenes} nodos moleculares y las subpoblaciones; en modo oncólogo se realizaron ${oncologistRun.completedDiagnostics.length} estudios diagnósticos revelando ${oncologistRun.revealedGenes.length} nodos (${unrevealedCount} permanecieron sin secuenciar).`
  );
  hiddenInfoInsights.push(
    'Esta asimetría ilustra por qué el diagnóstico molecular temprano es esencial para anticipar resistencias antes de que se acumulen.'
  );

  const clonalSelectionLesson =
    'Mismo punto de partida, trayectorias opuestas: cada puerta añade o selecciona alteraciones sobre la misma célula inicial, demostrando cómo el cáncer acumula problemas paso a paso.';

  return {
    scenarioId: 'UNIFIED',
    cancerRun,
    oncologistRun,
    coincidences,
    differences,
    hiddenInfoInsights,
    clonalSelectionLesson,
  };
}

/**
 * Parses uploaded JSON/CSV/XLSX rows matching COSMIC HoC columns for Teacher Mode.
 */
export function parseCustomEvidenceRows(
  rows: Record<string, unknown>[]
): { records: CosmicEvidenceRecord[]; skipped: number } {
  const records: CosmicEvidenceRecord[] = [];
  let skipped = 0;

  const mapHallmark = (raw: string): HallmarkId => {
    const s = raw.toLowerCase();
    if (s.includes('prolif')) return 'proliferative_signaling';
    if (s.includes('suppress') || s.includes('growth')) return 'evading_growth_suppressors';
    if (s.includes('death') || s.includes('apopt')) return 'resisting_cell_death';
    if (s.includes('metab') || s.includes('energ')) return 'cellular_metabolism';
    if (s.includes('immun')) return 'avoiding_immune_destruction';
    if (s.includes('angio') || s.includes('vasc')) return 'inducing_vasculature';
    if (s.includes('invas') || s.includes('metas')) return 'invasion_metastasis';
    if (s.includes('immort') || s.includes('replic')) return 'replicative_immortality';
    return 'phenotypic_plasticity';
  };

  for (const row of rows) {
    const symbol = String(row.GENE_SYMBOL ?? row.geneSymbol ?? row.gene ?? '').trim().toUpperCase();
    const description = String(row.DESCRIPTION ?? row.description ?? '').trim();
    if (!symbol || !description) {
      skipped++;
      continue;
    }
    const rawHallmark = String(row.HALLMARK ?? row.hallmark ?? 'Proliferative signalling');
    const rawImpact = String(row.IMPACT ?? row.impact ?? 'promotes').toLowerCase();

    records.push({
      geneSymbol: symbol,
      cosmicGeneId: String(row.COSMIC_GENE_ID ?? row.cosmicGeneId ?? 'CUSTOM'),
      cellType: String(row.CELL_TYPE ?? row.cellType ?? 'No especificado'),
      pubmedPmid: String(row.PUBMED_PMID ?? row.pubmedPmid ?? 'N/A'),
      hallmark: mapHallmark(rawHallmark),
      hallmarkLabel: rawHallmark,
      impact: rawImpact.includes('supp') ? 'suppresses' : 'promotes',
      description,
      cellLine: String(row.CELL_LINE ?? row.cellLine ?? 'N/A'),
      molecularExplanation: description,
      interactionType: 'direct',
    });
  }

  return { records, skipped };
}
