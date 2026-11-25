import test from 'node:test';
import assert from 'node:assert/strict';
import {
  describeCurrentSituationSimple,
  describeTurnResolutionSimple,
  formatBiologyText,
  getDiagnosticDisplayInfo,
  getHallmarkDisplayInfo,
  getModelFieldOptions,
  getOncologistStageInfo,
  getScenarioDisplayInfo,
  getTherapyDisplayInfo,
  getTherapyDisplayName,
} from './molecularAbstraction';
import { computeDestinationProgress } from './destinationMetrics';
import {
  buildDecisionTree,
  clampDecisionRoundCount,
  DECISION_ROUND_OPTIONS,
} from './decisionTree';
import {
  advanceSecretKeySequence,
  clampLabyrinthZoom,
  computeAerialZoomDistanceScale,
  computeCancerSeverityMetrics,
  computeLabyrinthCameraFov,
  getLabyrinthTheme,
  LABYRINTH_ZOOM_DEFAULT,
  LABYRINTH_ZOOM_MAX,
  LABYRINTH_ZOOM_MIN,
  stepLabyrinthZoom,
} from './labyrinthAesthetics';
import { buildLabyrinthLayout, getOncologistForkTherapies } from './labyrinthLayout';
import { DIAGNOSTIC_TOOLS, HALLMARKS_CATALOG, THERAPIES_CATALOG } from './knowledgeBase';
import {
  getActiveRoundOffer,
  getOncologistRoundPhase,
  PROBLEM_CATALOG,
  shuffleRandom,
} from './progressionEngine';
import {
  createInitialSimulation,
  evaluatePredictionGate,
  resolveCancerTurn,
  resolveOncologistDiagnosticTurn,
  resolveOncologistObservationTurn,
  resolveOncologistTurn,
} from './simulator';

const GENE_SYMBOL_REGEX =
  /\b(EGFR|KRAS|PIK3CA|PTEN|TP53|RB1|CDK6|CDKN2A|BAX|BCL2|MET|VEGFA|PDL1|PD-L1|CD274|ATM|MYC)\b/;

test('Lógica molecular removes all explicit gene symbols from unified catalog, therapies, model options, and labyrinth labels', () => {
  const unifiedInfo = getScenarioDisplayInfo('UNIFIED', 'logic');
  assert.equal(GENE_SYMBOL_REGEX.test(unifiedInfo.title), false);
  assert.equal(GENE_SYMBOL_REGEX.test(unifiedInfo.alterationsLabel), false);

  for (const prob of PROBLEM_CATALOG) {
    assert.equal(
      GENE_SYMBOL_REGEX.test(`${prob.shortDoorLogic} ${prob.logicLabel}`),
      false,
      `Problem ${prob.id} leaked gene symbol in Lógica mode: ${prob.shortDoorLogic} / ${prob.logicLabel}`
    );
    const formattedDesc = formatBiologyText(
      `${prob.advantage} ${prob.cost} ${prob.summary} ${prob.contextHint}`,
      'logic'
    );
    assert.equal(
      GENE_SYMBOL_REGEX.test(formattedDesc),
      false,
      `Problem ${prob.id} formatted text leaked gene symbol: ${formattedDesc}`
    );
  }

  for (const mode of ['cancer', 'oncologist'] as const) {
    const sim = createInitialSimulation(mode, 'UNIFIED', '', 'quick', undefined, 6, 42);
    const layout = buildLabyrinthLayout(sim, 'logic');
    for (const portal of layout.portals) {
      assert.equal(
        GENE_SYMBOL_REGEX.test(`${portal.label} ${portal.sublabel} ${portal.fullTitle}`),
        false,
        `Portal leaked gene symbol: ${portal.label} / ${portal.fullTitle}`
      );
    }
    const offer = getActiveRoundOffer(sim);
    for (const p of [...offer.cancerPredictions, ...offer.oncologistPredictions]) {
      const formatted = formatBiologyText(p.label, 'logic');
      assert.equal(
        GENE_SYMBOL_REGEX.test(formatted),
        false,
        `Prediction leaked gene symbol: ${formatted}`
      );
    }
  }

  for (const therapy of THERAPIES_CATALOG) {
    const name = getTherapyDisplayName(therapy, 'logic');
    assert.equal(GENE_SYMBOL_REGEX.test(name), false, `Therapy leaked gene symbol: ${name}`);
  }

  const modelOpts = getModelFieldOptions('logic');
  for (const group of [
    modelOpts.drivers,
    modelOpts.weakened,
    modelOpts.intact,
    modelOpts.vulnerabilities,
  ]) {
    for (const opt of group) {
      assert.equal(
        GENE_SYMBOL_REGEX.test(opt.label),
        false,
        `Model option leaked gene symbol: ${opt.label}`
      );
    }
  }
});

test('door options randomize across runs and shuffleRandom randomizes prediction order across door openings', () => {
  const cancerDoorOrders = new Set<string>();
  const oncoDoorOrders = new Set<string>();

  for (let i = 1; i <= 12; i++) {
    const cSim = createInitialSimulation('cancer', 'UNIFIED', '', 'quick', undefined, 5, i * 971);
    const cOffer = getActiveRoundOffer(cSim);
    cancerDoorOrders.add(cOffer.cancerStrategies.map((s) => s.id).join('|'));

    const oSim = createInitialSimulation(
      'oncologist',
      'UNIFIED',
      '',
      'quick',
      undefined,
      5,
      i * 1301
    );
    const oOffer = getActiveRoundOffer(oSim);
    oncoDoorOrders.add(oOffer.oncologistDoorTherapies.join('|'));
  }

  assert.ok(
    cancerDoorOrders.size >= 4,
    `Expected randomized cancer doors across runs, got only ${cancerDoorOrders.size} distinct orders`
  );
  assert.ok(
    oncoDoorOrders.size >= 4,
    `Expected randomized oncologist doors across runs, got only ${oncoDoorOrders.size} distinct orders`
  );

  // Per-door prediction randomization on every occasion
  const samplePreds = ['p1', 'p2', 'p3'];
  const observedOrders = new Set<string>();
  for (let attempt = 0; attempt < 30; attempt++) {
    observedOrders.add(shuffleRandom(samplePreds).join(','));
  }
  assert.ok(
    observedOrders.size >= 3,
    `Expected shuffleRandom to yield multiple orderings across repeated door opens, got ${observedOrders.size}`
  );
});

test('computeDestinationProgress differentiates Cancer liberation vs Oncologist clearance and tracks growth', () => {
  const cancer = createInitialSimulation('cancer', 'UNIFIED', '', 'quick', undefined, 5, 100);
  const progInit = computeDestinationProgress(cancer);

  assert.ok(progInit.progress >= 0 && progInit.progress <= 100);
  assert.equal(progInit.role, 'cancer');

  const advancedCancer = {
    ...cancer,
    clinical: { ...cancer.clinical, tumorBurden: 92, diseaseExtent: 'diseminada' as const },
    defenses: {
      cellCycleCheckpoint: 15,
      dnaRepair: 20,
      senescence: 15,
      apoptosisCapacity: 15,
      immuneSurveillance: 20,
      nutrientSupply: 85,
    },
  };
  const progHigh = computeDestinationProgress(advancedCancer);
  assert.ok(progHigh.progress > progInit.progress + 20);
  assert.equal(progHigh.stage, 3);
  assert.equal(progHigh.isReached, true);

  const oncoState = createInitialSimulation('oncologist', 'UNIFIED', '', 'quick', undefined, 5, 200);
  const healedOnco = {
    ...oncoState,
    clinical: {
      ...oncoState.clinical,
      tumorBurden: 8,
      functionalStatus: 90,
      qualityOfLife: 88,
      cumulativeToxicity: 12,
    },
  };
  const oncoProg = computeDestinationProgress(healedOnco);
  assert.equal(oncoProg.stage, 3);
  assert.equal(oncoProg.isReached, true);
});

test('getLabyrinthTheme progressively clears fog and enlarges destination beacon across phases 0 -> 3', () => {
  for (const role of ['cancer', 'oncologist'] as const) {
    const t0 = getLabyrinthTheme(role, 15);
    const t1 = getLabyrinthTheme(role, 45);
    const t2 = getLabyrinthTheme(role, 68);
    const t3 = getLabyrinthTheme(role, 90);

    assert.equal(t0.phase, 0);
    assert.equal(t1.phase, 1);
    assert.equal(t2.phase, 2);
    assert.equal(t3.phase, 3);

    assert.ok(
      t0.fogDensity > t1.fogDensity &&
        t1.fogDensity > t2.fogDensity &&
        t2.fogDensity > t3.fogDensity
    );
    assert.ok(t3.beaconVisibleScale > t0.beaconVisibleScale);
    assert.notEqual(t0.wallBase, t3.wallBase);
  }
});

test('evaluatePredictionGate locks doors on wrong predictions and unlocks without soft-locks across 10-round randomized runs in both modes', () => {
  for (const seed of [101, 404, 909]) {
    for (const mode of ['cancer', 'oncologist'] as const) {
      let state = createInitialSimulation(mode, 'UNIFIED', '', 'quick', undefined, 10, seed);
      for (let r = 1; r <= 10; r++) {
        const offer = getActiveRoundOffer(state);
        const preds = mode === 'cancer' ? offer.cancerPredictions : offer.oncologistPredictions;
        const actions =
          mode === 'cancer'
            ? offer.cancerStrategies.map((s) => s.id)
            : Array.from(
                new Set([
                  ...getOncologistForkTherapies(state),
                  ...THERAPIES_CATALOG.map((t) => t.id),
                ])
              );

        for (const actionId of actions) {
          const results = preds.map((p) => ({
            pred: p,
            gate: evaluatePredictionGate(state, actionId, p.id),
          }));

          for (const item of results) {
            if (item.pred.isDistractor) {
              assert.equal(
                item.gate.allowed,
                false,
                `Distractor ${item.pred.id} should never unlock seed=${seed} ${mode} R${r} ${actionId}`
              );
            }
            const logicFeedback = formatBiologyText(
              `${item.gate.feedback} ${item.gate.hint}`,
              'logic'
            );
            assert.equal(
              GENE_SYMBOL_REGEX.test(logicFeedback),
              false,
              `Gate feedback leaked gene symbol in Lógica mode: ${logicFeedback}`
            );
          }

          const allowedCount = results.filter((x) => x.gate.allowed).length;
          const lockedCount = results.filter((x) => !x.gate.allowed).length;

          assert.ok(
            allowedCount >= 1,
            `Soft-lock detected: seed=${seed} ${mode} R${r} action=${actionId} has 0 unlocking predictions`
          );
          assert.ok(
            lockedCount >= 1,
            `Missing gate: seed=${seed} ${mode} R${r} action=${actionId} allows all predictions`
          );
        }

        const chosenAction = actions[r % actions.length];
        const validPred = preds.find((p) =>
          evaluatePredictionGate(state, chosenAction, p.id).allowed
        )!;
        const step =
          mode === 'cancer'
            ? resolveCancerTurn(state, chosenAction, validPred.id)
            : resolveOncologistTurn(state, chosenAction as any, validPred.id);
        assert.equal(step.resolution.predictionMatched, true);
        state = step.nextState;
        if (state.finished) break;
      }
      assert.equal(state.finished, true);
    }
  }
});

test('teacher decision tree progresses across 3-10 rounds, hides genes in Lógica mode, and supports full 10-round unified labyrinth play', () => {
  for (const detail of ['logic', 'precision'] as const) {
    const trees = DECISION_ROUND_OPTIONS.map((rounds) => buildDecisionTree(rounds, detail));

    for (const tree of trees) {
      assert.equal(tree.rootLabel, 'Célula sana');
      assert.equal(tree.rootRate, 0);
      assert.equal(tree.branches.length, 4);

      for (const branch of tree.branches) {
        assert.equal(branch.steps.length, tree.roundCount);
        let prev = tree.rootRate;
        for (const step of branch.steps) {
          assert.ok(step.cancerRateAtStep > prev, 'Cancer rate must rise across unchecked steps');
          prev = step.cancerRateAtStep;
          if (detail === 'logic') {
            assert.equal(
              GENE_SYMBOL_REGEX.test(`${step.label} ${step.detail}`),
              false,
              `Decision tree leaked gene symbol in Lógica mode: ${step.label}`
            );
          }
        }
        const [controlled, aggressive] = branch.outcomes;
        assert.ok(aggressive.finalCancerRate > controlled.finalCancerRate);
      }
    }
  }

  assert.equal(clampDecisionRoundCount(1), 3);
  assert.equal(clampDecisionRoundCount(15), 10);

  for (const rounds of DECISION_ROUND_OPTIONS) {
    const sim = createInitialSimulation('cancer', 'UNIFIED', '', 'quick', undefined, rounds, 808);
    assert.equal(sim.maxRounds, rounds);
  }

  let tenRoundState = createInitialSimulation('cancer', 'UNIFIED', '', 'quick', undefined, 10, 888);
  for (let r = 1; r <= 10; r++) {
    assert.equal(tenRoundState.currentRound, r);
    const roundLayout = buildLabyrinthLayout(tenRoundState, 'logic');
    assert.equal(roundLayout.chambers.length, r);
    const offer = getActiveRoundOffer(tenRoundState);
    const strategy = offer.cancerStrategies[0];
    const validPred = offer.cancerPredictions.find(
      (p) => evaluatePredictionGate(tenRoundState, strategy.id, p.id).allowed
    );
    assert.ok(validPred, `Expected valid prediction at round ${r}`);
    const step = resolveCancerTurn(tenRoundState, strategy.id, validPred.id);
    tenRoundState = step.nextState;
    if (tenRoundState.finished) break;
  }
  assert.equal(tenRoundState.finished, true);
});

test('unlimited mode in Cancer role continues past maxRounds and finishes exactly at 100% cancer', () => {
  let state = createInitialSimulation('cancer', 'UNIFIED', '', 'quick', undefined, 3, 555, true);
  assert.equal(state.unlimitedMode, true);
  assert.equal(computeDestinationProgress(state).progress, 16);
  assert.equal(computeDestinationProgress(state).isReached, false);

  let steps = 0;
  while (!state.finished && steps < 40) {
    steps++;
    const layout = buildLabyrinthLayout(state, 'logic');
    assert.ok(layout.chambers.length >= 1 && layout.chambers.length <= 6);
    assert.equal(layout.portals.filter((p) => p.status === 'active').length, 3);

    const offer = getActiveRoundOffer(state);
    // Pick a strategy that maximizes progression when available
    let bestStrategy = offer.cancerStrategies[0];
    let bestBurden = -Infinity;
    for (const s of offer.cancerStrategies) {
      const validPred = offer.cancerPredictions.find(
        (p) => evaluatePredictionGate(state, s.id, p.id).allowed
      );
      if (!validPred) continue;
      const preview = resolveCancerTurn(state, s.id, validPred.id).nextState;
      if (preview.clinical.tumorBurden > bestBurden) {
        bestBurden = preview.clinical.tumorBurden;
        bestStrategy = s;
      }
    }
    const validPred = offer.cancerPredictions.find(
      (p) => evaluatePredictionGate(state, bestStrategy.id, p.id).allowed
    )!;
    state = resolveCancerTurn(state, bestStrategy.id, validPred.id).nextState;
  }

  assert.equal(state.finished, true, 'Unlimited Cancer mode must finish when reaching 100% cancer');
  assert.equal(state.clinical.tumorBurden, 100);
  assert.equal(computeDestinationProgress(state).progress, 100);
  assert.equal(computeDestinationProgress(state).isReached, true);
  assert.ok(state.history.length > 3, `Expected >3 rounds in unlimited mode, got ${state.history.length}`);
  assert.match(state.outcomeTitle ?? '', /100% de cáncer/i);
});

test('unlimited mode in Oncologist role continues past maxRounds and finishes exactly at 100% liberation', () => {
  let state = createInitialSimulation('oncologist', 'UNIFIED', '', 'quick', undefined, 3, 777, true);
  assert.equal(state.unlimitedMode, true);
  assert.equal(state.oncologistLiberation, 16);
  assert.equal(computeDestinationProgress(state).progress, 16);
  assert.equal(computeDestinationProgress(state).isReached, false);

  let steps = 0;
  while (!state.finished && steps < 40) {
    steps++;
    const layout = buildLabyrinthLayout(state, 'logic');
    assert.ok(layout.chambers.length >= 1 && layout.chambers.length <= 6);
    assert.equal(layout.portals.filter((p) => p.status === 'active').length, 3);

    const offer = getActiveRoundOffer(state);
    // Pick the offered door therapy that advances liberation the most
    let bestTherapy = offer.oncologistDoorTherapies[0];
    let bestLib = -Infinity;
    for (const tid of offer.oncologistDoorTherapies) {
      const validPred = offer.oncologistPredictions.find(
        (p) => evaluatePredictionGate(state, tid, p.id).allowed
      );
      if (!validPred) continue;
      const preview = resolveOncologistTurn(state, tid, validPred.id).nextState;
      const lib = preview.oncologistLiberation ?? 0;
      if (lib > bestLib) {
        bestLib = lib;
        bestTherapy = tid;
      }
    }
    const validPred = offer.oncologistPredictions.find(
      (p) => evaluatePredictionGate(state, bestTherapy, p.id).allowed
    )!;
    state = resolveOncologistTurn(state, bestTherapy, validPred.id).nextState;
  }

  assert.equal(
    state.finished,
    true,
    'Unlimited Oncologist mode must finish when reaching 100% liberation'
  );
  assert.equal(state.oncologistLiberation, 100);
  assert.equal(state.clinical.tumorBurden, 0);
  assert.equal(computeDestinationProgress(state).progress, 100);
  assert.equal(computeDestinationProgress(state).isReached, true);
  assert.ok(
    state.history.length > 3,
    `Expected >3 rounds in unlimited mode, got ${state.history.length}`
  );
  assert.match(state.outcomeTitle ?? '', /100% de liberación/i);
});

test('labyrinth camera zoom clamps bounds, steps cleanly, narrows 1st-person FOV on zoom-in, and scales aerial distance', () => {
  assert.equal(clampLabyrinthZoom(0.1), LABYRINTH_ZOOM_MIN);
  assert.equal(clampLabyrinthZoom(5.0), LABYRINTH_ZOOM_MAX);
  assert.equal(clampLabyrinthZoom(Number.NaN), LABYRINTH_ZOOM_DEFAULT);

  const zoomedIn = stepLabyrinthZoom(LABYRINTH_ZOOM_DEFAULT, 1);
  const zoomedOut = stepLabyrinthZoom(LABYRINTH_ZOOM_DEFAULT, -1);
  assert.ok(zoomedIn > LABYRINTH_ZOOM_DEFAULT);
  assert.ok(zoomedOut < LABYRINTH_ZOOM_DEFAULT);

  const fovDefault = computeLabyrinthCameraFov(LABYRINTH_ZOOM_DEFAULT, 'first_person');
  const fovZoomIn = computeLabyrinthCameraFov(zoomedIn, 'first_person');
  const fovZoomOut = computeLabyrinthCameraFov(zoomedOut, 'first_person');
  assert.ok(fovZoomIn < fovDefault, 'Zooming in should narrow first-person FOV');
  assert.ok(fovZoomOut > fovDefault, 'Zooming out should widen first-person FOV');
  assert.equal(computeLabyrinthCameraFov(zoomedIn, 'aerial'), fovDefault);

  assert.ok(
    computeAerialZoomDistanceScale(zoomedIn) < computeAerialZoomDistanceScale(LABYRINTH_ZOOM_DEFAULT)
  );
  assert.ok(
    computeAerialZoomDistanceScale(zoomedOut) > computeAerialZoomDistanceScale(LABYRINTH_ZOOM_DEFAULT)
  );
});

const PHANTOM_THERAPY_REGEX =
  /\b(terapia|terapias|tratamiento|tratamientos|quimioterapia|radioterapia|inmunoterapia|anti-egfr|anti-pi3k|anti-cdk|fármaco|fármacos|cirugía|inhibidor|inhibidores|drogas)\b/i;

const AWKWARD_PHRASE_REGEX =
  /\b(la vía cascada|receptor receptor|eje de supervivencia \(eje de supervivencia|gen gen)\b/i;

test('Cancer Mode texts contain zero phantom therapy mentions and read cleanly in Lógica and Precisión modes', () => {
  for (const detail of ['logic', 'precision'] as const) {
    let state = createInitialSimulation('cancer', 'UNIFIED', '', 'quick', undefined, 10, 314, true);

    // Check initial clones
    for (const clone of state.clones) {
      const cloneText = formatBiologyText(
        `${clone.name} ${clone.description} ${clone.resistanceSummary} ${clone.vulnerabilities.join(' ')}`,
        detail
      );
      assert.equal(
        PHANTOM_THERAPY_REGEX.test(cloneText),
        false,
        `Initial clone leaked therapy mention (${detail}): ${cloneText}`
      );
    }

    for (let stepIdx = 0; stepIdx < 12 && !state.finished; stepIdx++) {
      const offer = getActiveRoundOffer(state);
      assert.equal(offer.virtualOncologistTherapy, undefined);

      const textsToCheck: string[] = [
        offer.title,
        offer.cancerPrompt,
        ...offer.cancerStrategies.flatMap((s) => [
          s.label,
          s.advantage,
          s.cost,
          s.recommendedContextHint,
          s.alterationSummary,
        ]),
        ...offer.cancerPredictions.map((p) => p.label),
      ];

      for (const raw of textsToCheck) {
        const formatted = formatBiologyText(raw, detail);
        assert.equal(
          PHANTOM_THERAPY_REGEX.test(formatted),
          false,
          `Cancer offer leaked phantom therapy (${detail}, R${state.currentRound}): ${formatted}`
        );
        assert.equal(
          AWKWARD_PHRASE_REGEX.test(formatted),
          false,
          `Cancer offer has awkward phrasing (${detail}, R${state.currentRound}): ${formatted}`
        );
      }

      const chosen = offer.cancerStrategies[stepIdx % offer.cancerStrategies.length];
      for (const pred of offer.cancerPredictions) {
        const gate = evaluatePredictionGate(state, chosen.id, pred.id);
        const gateText = formatBiologyText(`${gate.feedback} ${gate.hint}`, detail);
        assert.equal(
          PHANTOM_THERAPY_REGEX.test(gateText),
          false,
          `Cancer gate leaked phantom therapy (${detail}): ${gateText}`
        );
      }

      const validPred = offer.cancerPredictions.find(
        (p) => evaluatePredictionGate(state, chosen.id, p.id).allowed
      )!;
      const turn = resolveCancerTurn(state, chosen.id, validPred.id);
      assert.equal(turn.nextState.activeTherapy, undefined);

      const resText = formatBiologyText(
        [
          turn.resolution.eventTitle,
          turn.resolution.actionTakenLabel,
          turn.resolution.whatHappened,
          turn.resolution.cellularProcessChanged,
          ...turn.resolution.hallmarksAffected.map((h) => h.note),
          turn.nextState.outcomeTitle ?? '',
          turn.nextState.outcomeExplanation ?? '',
        ].join(' '),
        detail
      );
      assert.equal(
        PHANTOM_THERAPY_REGEX.test(resText),
        false,
        `Cancer resolution leaked phantom therapy (${detail}, R${state.currentRound}): ${resText}`
      );
      assert.equal(
        AWKWARD_PHRASE_REGEX.test(resText),
        false,
        `Cancer resolution has awkward phrasing (${detail}, R${state.currentRound}): ${resText}`
      );

      state = turn.nextState;
    }
  }
});

test('advanceSecretKeySequence unlocks hidden Teacher Mode only on 5 consecutive h presses within window', () => {
  let seq = { count: 0, lastPressMs: 0 };

  // 4 presses should not trigger
  for (let i = 0; i < 4; i++) {
    const res = advanceSecretKeySequence(seq, i % 2 === 0 ? 'h' : 'H', 1000 + i * 200);
    assert.equal(res.triggered, false);
    seq = res.next;
  }
  assert.equal(seq.count, 4);

  // 5th press triggers and resets counter
  const fifth = advanceSecretKeySequence(seq, 'h', 1900);
  assert.equal(fifth.triggered, true);
  assert.equal(fifth.next.count, 0);

  // Intervening wrong key resets sequence
  let interrupted = advanceSecretKeySequence({ count: 0, lastPressMs: 0 }, 'h', 100).next;
  interrupted = advanceSecretKeySequence(interrupted, 'h', 200).next;
  interrupted = advanceSecretKeySequence(interrupted, 'x', 300).next;
  assert.equal(interrupted.count, 0);

  // Slow press outside window resets back to 1
  const timedOut = advanceSecretKeySequence({ count: 4, lastPressMs: 1000 }, 'h', 5000);
  assert.equal(timedOut.triggered, false);
  assert.equal(timedOut.next.count, 1);
});

test('computeCancerSeverityMetrics escalates visual and acoustic parameters monotonically with tumorBurden', () => {
  const low = computeCancerSeverityMetrics(10);
  const mod = computeCancerSeverityMetrics(35);
  const high = computeCancerSeverityMetrics(62);
  const crit = computeCancerSeverityMetrics(90);

  assert.equal(low.level, 'baja');
  assert.equal(mod.level, 'moderada');
  assert.equal(high.level, 'alta');
  assert.equal(crit.level, 'critica');

  assert.equal(low.bioGrowthCount, 0);
  assert.equal(low.vignetteOpacity, 0);
  assert.ok(mod.bioGrowthCount > low.bioGrowthCount);
  assert.ok(high.bioGrowthCount > mod.bioGrowthCount);
  assert.ok(crit.bioGrowthCount > high.bioGrowthCount);

  assert.ok(low.heartbeatBpm < mod.heartbeatBpm);
  assert.ok(mod.heartbeatBpm < high.heartbeatBpm);
  assert.ok(high.heartbeatBpm < crit.heartbeatBpm);

  assert.ok(low.veinIntensity < mod.veinIntensity);
  assert.ok(mod.veinIntensity < high.veinIntensity);
  assert.ok(high.veinIntensity < crit.veinIntensity);

  assert.ok(crit.vignetteOpacity > high.vignetteOpacity);
  assert.ok(high.vignetteOpacity > 0);

  // Theme modulation raises cracksIntensity with high tumorBurden
  const calmTheme = getLabyrinthTheme('cancer', 16, 10);
  const severeTheme = getLabyrinthTheme('cancer', 16, 85);
  assert.ok(severeTheme.cracksIntensity > calmTheme.cracksIntensity);
});

test('Oncologist Mode alternates Diagnostic (odd) and Intervention (even) rounds, supports Observation skip at any round, and reaches 100% liberation', () => {
  let state = createInitialSimulation('oncologist', 'UNIFIED', '', 'quick', undefined, 6, 909, true);

  // Round 1: Diagnostic
  assert.equal(getOncologistRoundPhase(state.currentRound), 'diagnostic');
  const r1Offer = getActiveRoundOffer(state);
  assert.equal(r1Offer.oncologistPhase, 'diagnostic');
  assert.equal(r1Offer.oncologistDoorDiagnostics.length, 3);
  assert.equal(r1Offer.oncologistDoorTherapies.includes('active_surveillance'), false);

  const diagStep = resolveOncologistDiagnosticTurn(state, r1Offer.oncologistDoorDiagnostics[0]);
  assert.equal(diagStep.resolution.actionKind, 'diagnostic');
  assert.ok(diagStep.resolution.cellularProcessChanged.length > 10);
  assert.equal(
    GENE_SYMBOL_REGEX.test(
      formatBiologyText(
        `${diagStep.resolution.whatHappened} ${diagStep.resolution.cellularProcessChanged}`,
        'logic'
      )
    ),
    false,
    'Diagnostic turn resolution leaked gene symbol in Lógica mode'
  );
  state = diagStep.nextState;
  assert.equal(state.currentRound, 2);

  // Round 2: Intervention (direct without prediction quiz)
  assert.equal(getOncologistRoundPhase(state.currentRound), 'intervention');
  const r2Offer = getActiveRoundOffer(state);
  assert.equal(r2Offer.oncologistPhase, 'intervention');
  assert.equal(r2Offer.oncologistDoorTherapies.includes('active_surveillance'), false);

  const intStep = resolveOncologistTurn(state, r2Offer.oncologistDoorTherapies[0]);
  assert.equal(intStep.resolution.actionKind, 'intervention');
  assert.equal(intStep.resolution.predictionMatched, true);
  state = intStep.nextState;
  assert.equal(state.currentRound, 3);

  // Round 3: Skip Diagnostic round via Observation
  assert.equal(getOncologistRoundPhase(state.currentRound), 'diagnostic');
  const obsDiag = resolveOncologistObservationTurn(state);
  assert.equal(obsDiag.resolution.actionKind, 'observation');
  assert.equal(
    GENE_SYMBOL_REGEX.test(
      formatBiologyText(
        `${obsDiag.resolution.whatHappened} ${obsDiag.resolution.cellularProcessChanged}`,
        'logic'
      )
    ),
    false,
    'Observation turn resolution leaked gene symbol in Lógica mode'
  );
  state = obsDiag.nextState;
  assert.equal(state.currentRound, 4);

  // Round 4: Skip Intervention round via Observation
  assert.equal(getOncologistRoundPhase(state.currentRound), 'intervention');
  const obsInt = resolveOncologistObservationTurn(state);
  assert.equal(obsInt.resolution.actionKind, 'observation');
  state = obsInt.nextState;
  assert.equal(state.currentRound, 5);

  // Continue alternating Diagnostic -> Intervention until 100% liberation
  let safety = 0;
  while (!state.finished && safety < 30) {
    safety++;
    const offer = getActiveRoundOffer(state);
    if (offer.oncologistPhase === 'diagnostic') {
      state = resolveOncologistDiagnosticTurn(state, offer.oncologistDoorDiagnostics[0]).nextState;
    } else {
      let bestTherapy = offer.oncologistDoorTherapies[0];
      let bestLib = -Infinity;
      for (const tid of offer.oncologistDoorTherapies) {
        const preview = resolveOncologistTurn(state, tid).nextState;
        if ((preview.oncologistLiberation ?? 0) > bestLib) {
          bestLib = preview.oncologistLiberation ?? 0;
          bestTherapy = tid;
        }
      }
      state = resolveOncologistTurn(state, bestTherapy).nextState;
    }
  }

  assert.equal(state.finished, true);
  assert.equal(state.oncologistLiberation, 100);
  assert.equal(state.clinical.tumorBurden, 0);
});

test('Modo Simple translates diagnostics, therapies, hallmarks, labyrinth doors, and live narration into plain Spanish without gene symbols or dense jargon', () => {
  const DENSE_JARGON_REGEX =
    /\b(apoptosis|angiogénesis|mitogénico|mitogénica|citotóxico|citotóxica|inmunohistoquímica|linfocitos T)\b/i;

  for (const tool of DIAGNOSTIC_TOOLS) {
    const info = getDiagnosticDisplayInfo(tool, 'simple');
    const combined = `${info.name} ${info.summary} ${info.revealsDescription}`;
    assert.equal(GENE_SYMBOL_REGEX.test(combined), false, `Simple diagnostic leaked gene: ${combined}`);
    assert.equal(DENSE_JARGON_REGEX.test(combined), false, `Simple diagnostic kept jargon: ${combined}`);
  }

  for (const therapy of THERAPIES_CATALOG) {
    const info = getTherapyDisplayInfo(therapy, 'simple');
    const combined = `${info.name} ${info.mechanism} ${info.cloneEffectsSummary}`;
    assert.equal(GENE_SYMBOL_REGEX.test(combined), false, `Simple therapy leaked gene: ${combined}`);
    assert.equal(DENSE_JARGON_REGEX.test(combined), false, `Simple therapy kept jargon: ${combined}`);
  }

  for (const hallmark of HALLMARKS_CATALOG) {
    const info = getHallmarkDisplayInfo(hallmark, 'simple');
    const combined = `${info.name} ${info.shortLabel} ${info.description}`;
    assert.equal(GENE_SYMBOL_REGEX.test(combined), false, `Simple hallmark leaked gene: ${combined}`);
    assert.equal(DENSE_JARGON_REGEX.test(combined), false, `Simple hallmark kept jargon: ${combined}`);
  }

  for (const mode of ['cancer', 'oncologist'] as const) {
    const sim = createInitialSimulation(mode, 'UNIFIED', '', 'quick', undefined, 6, 333, true, 'early');
    const situation = describeCurrentSituationSimple(sim);
    assert.ok(situation.length > 25, 'Simple situation description must be informative');
    assert.equal(GENE_SYMBOL_REGEX.test(situation), false, `Simple situation leaked gene: ${situation}`);

    const layout = buildLabyrinthLayout(sim, 'simple');
    for (const portal of layout.portals) {
      const text = `${portal.label} ${portal.sublabel} ${portal.fullTitle}`;
      assert.equal(GENE_SYMBOL_REGEX.test(text), false, `Simple portal leaked gene: ${text}`);
    }

    const offer = getActiveRoundOffer(sim);
    const turn =
      mode === 'cancer'
        ? resolveCancerTurn(
            sim,
            offer.cancerStrategies[0].id,
            offer.cancerPredictions.find(
              (p) => evaluatePredictionGate(sim, offer.cancerStrategies[0].id, p.id).allowed
            )!.id
          )
        : resolveOncologistDiagnosticTurn(sim, offer.oncologistDoorDiagnostics[0]);

    const simpleSummary = describeTurnResolutionSimple(turn.resolution, turn.nextState);
    assert.ok(simpleSummary.length > 25, 'Simple resolution summary must be informative');
    assert.equal(GENE_SYMBOL_REGEX.test(simpleSummary), false, `Simple summary leaked gene: ${simpleSummary}`);
  }
});

test('Oncologist starting stages (surveillance, early, advanced) configure distinct clinical baselines and all reach 100% liberation', () => {
  const surv = createInitialSimulation('oncologist', 'UNIFIED', '', 'quick', undefined, 6, 501, true, 'surveillance');
  const early = createInitialSimulation('oncologist', 'UNIFIED', '', 'quick', undefined, 6, 501, true, 'early');
  const adv = createInitialSimulation('oncologist', 'UNIFIED', '', 'quick', undefined, 6, 501, true, 'advanced');

  // Distinct baseline tumor burdens
  assert.equal(surv.oncologistStartStage, 'surveillance');
  assert.equal(surv.clinical.tumorBurden, 8);
  assert.equal(surv.clinical.diseaseExtent, 'localizada');
  assert.equal(surv.accumulatedProblems.length, 0);
  assert.equal(surv.oncologistLiberation, 36);

  assert.equal(early.oncologistStartStage, 'early');
  assert.equal(early.clinical.tumorBurden, 16);
  assert.equal(early.clinical.diseaseExtent, 'localizada');
  assert.equal(early.accumulatedProblems.length, 0);
  assert.equal(early.oncologistLiberation, 16);

  assert.equal(adv.oncologistStartStage, 'advanced');
  assert.equal(adv.clinical.tumorBurden, 68);
  assert.equal(adv.clinical.diseaseExtent, 'diseminada');
  assert.equal(adv.accumulatedProblems.length, 3);
  assert.equal(adv.oncologistLiberation, 6);
  assert.ok(adv.clones.length >= 3, 'Advanced stage must start with heterogeneous clones');

  // Stage metadata exists in all 3 detail modes
  for (const stage of ['surveillance', 'early', 'advanced'] as const) {
    for (const detail of ['simple', 'logic', 'precision'] as const) {
      const info = getOncologistStageInfo(stage, detail);
      assert.ok(info.label.length > 0 && info.description.length > 10);
      if (detail !== 'precision') {
        assert.equal(GENE_SYMBOL_REGEX.test(`${info.label} ${info.description}`), false);
      }
    }
  }

  // Round 1 prompts reflect each stage
  const survPrompt = getActiveRoundOffer(surv).oncologistPrompt;
  const advPrompt = getActiveRoundOffer(adv).oncologistPrompt;
  assert.notEqual(survPrompt, advPrompt);
  assert.match(survPrompt, /vigilancia/i);
  assert.match(advPrompt, /avanzado|extendido|diseminada/i);

  // All 3 stages can be played cleanly to 100% liberation
  for (const initial of [surv, early, adv]) {
    let cur = initial;
    let safety = 0;
    while (!cur.finished && safety < 35) {
      safety++;
      const offer = getActiveRoundOffer(cur);
      if (offer.oncologistPhase === 'diagnostic') {
        cur = resolveOncologistDiagnosticTurn(cur, offer.oncologistDoorDiagnostics[0]).nextState;
      } else {
        let bestTherapy = offer.oncologistDoorTherapies[0];
        let bestLib = -Infinity;
        for (const tid of offer.oncologistDoorTherapies) {
          const preview = resolveOncologistTurn(cur, tid).nextState;
          if ((preview.oncologistLiberation ?? 0) > bestLib) {
            bestLib = preview.oncologistLiberation ?? 0;
            bestTherapy = tid;
          }
        }
        cur = resolveOncologistTurn(cur, bestTherapy).nextState;
      }
    }
    assert.equal(cur.finished, true, `Stage ${initial.oncologistStartStage} must reach completion`);
    assert.equal(cur.oncologistLiberation, 100);
    assert.equal(cur.clinical.tumorBurden, 0);
  }
});





