import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildLabyrinthLayout,
  findNearbyActivePortal,
  isPointInsideWalkable,
  resolvePlayerMovement,
} from './labyrinthLayout';
import {
  computeLabyrinthRenderBuffer,
  getLabyrinthResolutionPreset,
  LABYRINTH_RESOLUTION_ORDER,
  stepLabyrinthResolution,
} from './labyrinthAesthetics';
import { getActiveRoundOffer } from './progressionEngine';
import { createInitialSimulation, resolveCancerTurn } from './simulator';

test('labyrinth layout spawns player inside open walkable corridor facing 3 forking portals', () => {
  for (const mode of ['cancer', 'oncologist'] as const) {
    const sim = createInitialSimulation(mode, 'UNIFIED', '', 'quick', undefined, 5, 1001);
    const layout = buildLabyrinthLayout(sim);

    assert.equal(layout.chambers.length, 1);
    assert.equal(layout.portals.length, 3, `${mode} chamber must have 3 forking portals`);
    assert.equal(
      isPointInsideWalkable(layout.spawn.x, layout.spawn.z, layout.walkableBoxes),
      true,
      'Player spawn must be inside walkable area'
    );
    assert.equal(layout.spawn.yaw, 0, 'Spawn must face straight toward north (-Z) portals');
    for (const p of layout.portals) {
      assert.ok(p.z < layout.spawn.z, 'Active forking portals must lie ahead of player spawn');
    }
  }
});

test('oncologist mode places 4 diagnostic stations inside the active chamber', () => {
  const onco = createInitialSimulation('oncologist', 'UNIFIED', '', 'quick', undefined, 5, 2002);
  const layout = buildLabyrinthLayout(onco);

  assert.equal(layout.diagnosticStations.length, 4);
  assert.equal(layout.portals.length, 3);
  assert.ok(layout.diagnosticStations.every((d) => !d.completed));
});

test('collision resolver slides smoothly inside corridor and blocks walking through walls', () => {
  const state = createInitialSimulation('cancer', 'UNIFIED', '', 'quick', undefined, 5, 3003);
  const layout = buildLabyrinthLayout(state);

  const stepForward = resolvePlayerMovement(
    layout.spawn.x,
    layout.spawn.z,
    0,
    -2.0,
    layout.walkableBoxes
  );
  assert.ok(stepForward.z < layout.spawn.z - 1.5);

  const blocked = resolvePlayerMovement(
    layout.spawn.x,
    layout.spawn.z,
    25,
    0,
    layout.walkableBoxes
  );
  assert.equal(blocked.x, layout.spawn.x);
});

test('advancing a round extends the labyrinth with a second chamber and seals unchosen past forks', () => {
  const s1 = createInitialSimulation('cancer', 'UNIFIED', '', 'quick', undefined, 5, 4004);
  const r1 = getActiveRoundOffer(s1);
  const { nextState: s2 } = resolveCancerTurn(
    s1,
    r1.cancerStrategies[1].id,
    r1.cancerPredictions[0].id
  );

  const layout2 = buildLabyrinthLayout(s2);
  assert.equal(layout2.chambers.length, 2);

  const r1Portals = layout2.portals.filter((p) => p.roundNumber === 1);
  const r2Portals = layout2.portals.filter((p) => p.roundNumber === 2);

  assert.ok(r1Portals.some((p) => p.status === 'chosen'));
  assert.ok(r1Portals.some((p) => p.status === 'sealed'));
  assert.ok(r2Portals.every((p) => p.status === 'active'));
  assert.equal(
    isPointInsideWalkable(layout2.spawn.x, layout2.spawn.z, layout2.walkableBoxes),
    true
  );
});

test('portal proximity trigger detects active portal when player walks to threshold', () => {
  const state = createInitialSimulation('cancer', 'UNIFIED', '', 'quick', undefined, 5, 5005);
  const layout = buildLabyrinthLayout(state);
  const target = layout.portals[0];

  assert.equal(findNearbyActivePortal(layout.spawn.x, layout.spawn.z, layout.portals), null);
  const found = findNearbyActivePortal(target.x, target.z + 1.0, layout.portals);
  assert.equal(found?.id, target.id);
});

test('labyrinth resolution tiers strictly increase render buffer resolution on GPU and software WebGL', () => {
  assert.deepEqual([...LABYRINTH_RESOLUTION_ORDER], ['low', 'medium', 'high', 'ultra']);
  assert.equal(stepLabyrinthResolution('low', -1), 'low');
  assert.equal(stepLabyrinthResolution('low', 1), 'medium');
  assert.equal(stepLabyrinthResolution('medium', 1), 'high');
  assert.equal(stepLabyrinthResolution('high', 1), 'ultra');
  assert.equal(stepLabyrinthResolution('ultra', 1), 'ultra');

  assert.equal(getLabyrinthResolutionPreset('low').smoothTextures, false);
  assert.equal(getLabyrinthResolutionPreset('medium').smoothTextures, true);
  assert.equal(getLabyrinthResolutionPreset('high').smoothTextures, true);
  assert.equal(getLabyrinthResolutionPreset('ultra').smoothTextures, true);

  for (const isSoftwareGl of [false, true]) {
    const buffers = LABYRINTH_RESOLUTION_ORDER.map((lvl) =>
      computeLabyrinthRenderBuffer(1440, 900, lvl, 1, isSoftwareGl)
    );
    assert.equal(buffers[0].imageRendering, 'pixelated');
    assert.equal(buffers[1].imageRendering, 'auto');
    assert.equal(buffers[2].imageRendering, 'auto');
    assert.equal(buffers[3].imageRendering, 'auto');

    for (let i = 1; i < buffers.length; i++) {
      assert.ok(
        buffers[i].backingWidth > buffers[i - 1].backingWidth &&
          buffers[i].backingHeight > buffers[i - 1].backingHeight,
        `Tier ${LABYRINTH_RESOLUTION_ORDER[i]} must exceed ${LABYRINTH_RESOLUTION_ORDER[i - 1]} (software=${isSoftwareGl})`
      );
    }
  }
});

test('every labyrinth door uses a concise unique short title (<= 18 chars) while preserving fullTitle across 10 randomized rounds', () => {
  const forbiddenGenePattern =
    /\b(EGFR|KRAS|PIK3CA|PTEN|TP53|RB1|CDK6|CDKN2A|BAX|BCL2|MET|VEGFA|PDL1|PD-L1|CD274|ATM|MYC)\b/;

  for (const mode of ['cancer', 'oncologist'] as const) {
    for (const detail of ['logic', 'precision'] as const) {
      let state = createInitialSimulation(mode, 'UNIFIED', '', 'quick', undefined, 10, 7777);
      for (let round = 1; round <= 10; round++) {
        const layout = buildLabyrinthLayout(state, detail);
        const activePortals = layout.portals.filter((p) => p.status === 'active');
        assert.equal(
          activePortals.length,
          3,
          `${mode} R${round} (${detail}) should expose 3 active doors`
        );

        const seenLabels = new Set<string>();
        for (const portal of activePortals) {
          assert.ok(
            portal.label.length >= 4 && portal.label.length <= 18,
            `Door label "${portal.label}" (${mode} R${round} ${detail}) exceeds 18 chars`
          );
          assert.equal(
            portal.label.includes('…'),
            false,
            `Door label "${portal.label}" must not be truncated with ellipsis`
          );
          assert.equal(
            seenLabels.has(portal.label),
            false,
            `Duplicate door label "${portal.label}" in ${mode} R${round} (${detail})`
          );
          seenLabels.add(portal.label);

          assert.ok(
            portal.fullTitle.length >= portal.label.length,
            `fullTitle "${portal.fullTitle}" should be at least as descriptive as "${portal.label}"`
          );

          if (detail === 'logic') {
            assert.equal(
              forbiddenGenePattern.test(portal.label),
              false,
              `Logic door label "${portal.label}" leaked an explicit gene symbol`
            );
            assert.equal(
              forbiddenGenePattern.test(portal.fullTitle),
              false,
              `Logic fullTitle "${portal.fullTitle}" leaked an explicit gene symbol`
            );
          }
        }

        if (round < 10) {
          const offer = getActiveRoundOffer(state);
          if (mode === 'cancer') {
            state = resolveCancerTurn(
              state,
              offer.cancerStrategies[0].id,
              offer.cancerPredictions[0].id
            ).nextState;
          } else {
            state = { ...state, currentRound: round + 1 };
          }
        }
      }
    }
  }
});

