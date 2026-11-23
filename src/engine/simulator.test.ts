import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_TEACHER_CONFIG,
  buildCompletedRunSummary,
  comparePerspectiveRuns,
  computeHallmarkScores,
  createInitialSimulation,
  evaluateTherapyEffectOnClone,
  parseCustomEvidenceRows,
  resolveCancerTurn,
  resolveOncologistTurn,
  runDiagnosticTool,
  submitOncologistCellModel,
  updateReflectionsAndScore,
} from './simulator';
import {
  deriveExpectedCellModel,
  getActiveRoundOffer,
  PROBLEM_CATALOG,
} from './progressionEngine';
import { SCENARIOS } from './scenarios';

test('everyone starts identically from the same unified baseline cell regardless of role or seed', () => {
  const cancer1 = createInitialSimulation('cancer', 'UNIFIED', '', 'quick', undefined, 5, 101);
  const cancer2 = createInitialSimulation('cancer', 'UNIFIED', '', 'quick', undefined, 5, 999);
  const onco = createInitialSimulation('oncologist', 'UNIFIED', '', 'quick', undefined, 5, 202);

  assert.equal(cancer1.scenarioId, 'UNIFIED');
  assert.equal(onco.scenarioId, 'UNIFIED');
  assert.equal(cancer1.accumulatedProblems.length, 0);
  assert.equal(onco.accumulatedProblems.length, 0);
  assert.equal(cancer1.clinical.tumorBurden, 16);
  assert.equal(onco.clinical.tumorBurden, 16);

  assert.deepEqual(
    cancer1.clones.map((c) => ({ id: c.id, share: c.share, genotype: c.genotype })),
    cancer2.clones.map((c) => ({ id: c.id, share: c.share, genotype: c.genotype }))
  );
  assert.deepEqual(
    cancer1.clones.map((c) => ({ id: c.id, share: c.share, genotype: c.genotype })),
    onco.clones.map((c) => ({ id: c.id, share: c.share, genotype: c.genotype }))
  );
  assert.deepEqual(cancer1.defenses, onco.defenses);

  // Oncologist starts with hidden molecular info (fog of war), while Cancer sees unified genes
  assert.ok(cancer1.revealedGenes.length > 0);
  assert.equal(onco.revealedGenes.length, 0);
});

test('diagnostic tools in oncologist mode consume budget and progressively reveal unified genes', () => {
  const initial = createInitialSimulation('oncologist', 'UNIFIED', '', 'quick');
  const startBudget = initial.diagnosticBudget;

  const r1 = runDiagnosticTool(initial, 'imaging');
  assert.equal(r1.error, undefined);
  assert.equal(r1.nextState.revealedExtent, true);
  assert.equal(r1.nextState.diagnosticBudget, startBudget - 1);

  const r2 = runDiagnosticTool(r1.nextState, 'molecular_profile');
  assert.equal(r2.error, undefined);
  assert.equal(r2.nextState.revealedClonalHeterogeneity, true);
  assert.ok(r2.nextState.revealedGenes.includes('EGFR'));
  assert.ok(r2.nextState.revealedGenes.includes('PTEN'));
  assert.equal(r2.nextState.diagnosticBudget, startBudget - 3);
});

test('shared therapeutic rules enforce intrinsic resistance (KRAS vs anti-EGFR, RB1 loss vs anti-CDK4/6)', () => {
  const cloneB1 = SCENARIOS.B.initialClones[0]; // KRAS activated, RB1 inactivated
  const egfrEff = evaluateTherapyEffectOnClone(cloneB1, 'egfr_tki', 'regional');
  const cdkEff = evaluateTherapyEffectOnClone(cloneB1, 'cdk46_inhibitor', 'regional');

  assert.ok(egfrEff.killStrength <= 0, 'KRAS activated clone must resist EGFR TKI');
  assert.ok(cdkEff.killStrength <= 0, 'RB1 inactivated clone must resist CDK4/6 inhibitor');

  const cloneD1 = SCENARIOS.D.initialClones[0]; // CDK6 activated, RB1 functional, BAX inactivated
  const cdkOnD1 = evaluateTherapyEffectOnClone(cloneD1, 'cdk46_inhibitor', 'localizada');
  assert.ok(
    cdkOnD1.killStrength >= 30,
    'CDK6 hyperactive with functional RB1 must respond to CDK4/6 inhibitor'
  );
});

test('decisions progressively accumulate distinct molecular problems onto clones in cancer mode', () => {
  let state = createInitialSimulation('cancer', 'UNIFIED', '', 'quick', undefined, 5, 4242);
  assert.equal(state.accumulatedProblems.length, 0);

  for (let r = 1; r <= 4; r++) {
    const offer = getActiveRoundOffer(state);
    const chosen = offer.cancerStrategies[0];
    const step = resolveCancerTurn(state, chosen.id, offer.cancerPredictions[0].id);
    state = step.nextState;
    assert.equal(
      state.accumulatedProblems.length,
      r,
      `Round ${r} must accumulate a new molecular problem`
    );
    const latest = state.accumulatedProblems[state.accumulatedProblems.length - 1];
    assert.equal(latest.roundNumber, r);
    // At least one clone must carry the acquired mutation in its live genotype
    const mutatedCloneExists = state.clones.some(
      (c) => c.genotype[latest.geneSymbol] === latest.geneState
    );
    assert.equal(
      mutatedCloneExists,
      true,
      `Acquired problem ${latest.geneSymbol} -> ${latest.geneState} must mutate a live clone`
    );
  }
});

test('TP53 loss modulates hallmarks partially rather than granting 100% absolute immunity', () => {
  const stateC = createInitialSimulation('cancer', 'UNIFIED', '', 'quick', undefined, 5, 777);
  const mutatedClones = stateC.clones.map((c) => ({
    ...c,
    genotype: { ...c.genotype, TP53: 'inactivated' as const, PIK3CA: 'activated' as const },
  }));
  const hallmarks = computeHallmarkScores(mutatedClones, stateC.defenses);

  assert.ok(hallmarks.resisting_cell_death > 20 && hallmarks.resisting_cell_death < 90);
  assert.ok(hallmarks.evading_growth_suppressors > 20 && hallmarks.evading_growth_suppressors < 90);
});

test('combination therapy incurs higher cumulative toxicity than targeted monotherapy', () => {
  const base = createInitialSimulation('oncologist', 'UNIFIED', '', 'quick', undefined, 5, 111);
  const offer = getActiveRoundOffer(base);
  const { nextState: mono } = resolveOncologistTurn(
    base,
    'egfr_tki',
    offer.oncologistPredictions[0].id
  );
  const { nextState: combo } = resolveOncologistTurn(
    base,
    'combo_targeted_chemo',
    offer.oncologistPredictions[0].id
  );

  assert.ok(combo.clinical.cumulativeToxicity > mono.clinical.cumulativeToxicity + 15);
  assert.ok(combo.clinical.qualityOfLife < mono.clinical.qualityOfLife);
});

test('palliative care in advanced/high-toxicity context preserves QoL and produces valid outcome', () => {
  let state = createInitialSimulation(
    'oncologist',
    'UNIFIED',
    '',
    'quick',
    {
      ...DEFAULT_TEACHER_CONFIG,
      roundCount: 4,
    },
    4,
    555
  );
  state = {
    ...state,
    currentRound: 4,
    clinical: { ...state.clinical, tumorBurden: 64, cumulativeToxicity: 52, qualityOfLife: 48 },
  };
  const offer = getActiveRoundOffer(state);
  const { nextState } = resolveOncologistTurn(
    state,
    'palliative_care',
    offer.oncologistPredictions[0].id
  );
  assert.equal(nextState.finished, true);
  assert.equal(nextState.outcomeCode, 'prioridad_calidad_vida');
  assert.ok(nextState.clinical.qualityOfLife > state.clinical.qualityOfLife);
});

test('full playthrough in both modes produces valid 4-axis score, accumulated problems, and perspective comparison', () => {
  let cancer = createInitialSimulation('cancer', 'UNIFIED', '', 'quick', undefined, 4, 2026);
  for (let r = 0; r < 4 && !cancer.finished; r++) {
    const offer = getActiveRoundOffer(cancer);
    const res = resolveCancerTurn(
      cancer,
      offer.cancerStrategies[0].id,
      offer.cancerPredictions[0].id
    );
    cancer = res.nextState;
  }
  cancer = updateReflectionsAndScore(cancer, {
    q1KeyAlterations:
      'Las alteraciones acumuladas impulsaron la proliferación inicial mientras la pérdida de frenos y rutas paralelas sostuvieron la supervivencia frente al bloqueo.',
    q2HallmarksRelation:
      'La señalización proliferativa y la evasión de supresores reforzaron la resistencia a la muerte celular, pero elevaron el costo metabólico e inmune.',
    q3AlternativePath:
      'Combinar diagnóstico temprano con bloqueo dirigido y luego terapia secuencial habría contenido mejor los subclones resistentes.',
  });
  assert.equal(cancer.finished, true);
  assert.equal(cancer.score.reflection, 15);
  assert.ok(cancer.score.total <= 100 && cancer.score.total > 40);
  assert.ok(cancer.accumulatedProblems.length >= 3);

  // Play Oncologist mode to completion from the same unified baseline
  let onco = createInitialSimulation('oncologist', 'UNIFIED', '', 'quick', undefined, 4, 3030);
  onco = runDiagnosticTool(onco, 'imaging').nextState;
  onco = runDiagnosticTool(onco, 'molecular_profile').nextState;
  const expectedModel = deriveExpectedCellModel(onco.clones);
  onco = submitOncologistCellModel(onco, expectedModel);
  assert.equal(onco.cellModel.accuracyScore, 100);

  const plan: ('egfr_tki' | 'pi3k_inhibitor' | 'immunotherapy' | 'active_surveillance')[] = [
    'egfr_tki',
    'pi3k_inhibitor',
    'immunotherapy',
    'active_surveillance',
  ];
  for (let r = 0; r < 4 && !onco.finished; r++) {
    const offer = getActiveRoundOffer(onco);
    const res = resolveOncologistTurn(onco, plan[r], offer.oncologistPredictions[0].id);
    onco = res.nextState;
  }
  assert.equal(onco.finished, true);

  const comparison = comparePerspectiveRuns(
    buildCompletedRunSummary(cancer),
    buildCompletedRunSummary(onco)
  );
  assert.equal(comparison.scenarioId, 'UNIFIED');
  assert.ok(comparison.coincidences.length >= 1);
  assert.ok(comparison.hiddenInfoInsights.length >= 1);
  assert.ok(PROBLEM_CATALOG.length >= 12);
});

test('custom COSMIC HoC evidence parser extracts valid records and skips malformed rows', () => {
  const { records, skipped } = parseCustomEvidenceRows([
    {
      GENE_SYMBOL: 'braf',
      COSMIC_GENE_ID: 'COSG999',
      CELL_TYPE: 'Melanoma',
      PUBMED_PMID: '12068308',
      HALLMARK: 'Proliferative signalling',
      IMPACT: 'promotes',
      DESCRIPTION: 'BRAF V600E activa constitutivamente la cascada MEK/ERK.',
      CELL_LINE: 'A375',
    },
    { GENE_SYMBOL: '', DESCRIPTION: '' },
  ]);

  assert.equal(records.length, 1);
  assert.equal(skipped, 1);
  assert.equal(records[0].geneSymbol, 'BRAF');
  assert.equal(records[0].hallmark, 'proliferative_signaling');
});
