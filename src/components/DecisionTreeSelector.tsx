import React, { useMemo, useState } from 'react';
import { ChevronRight, ShieldCheck } from 'lucide-react';
import {
  buildDecisionTree,
  DECISION_ROUND_OPTIONS,
  DecisionRoundCount,
} from '../engine/decisionTree';
import { MolecularDetailMode, ScenarioId } from '../engine/types';

interface DecisionTreeSelectorProps {
  roundCount: DecisionRoundCount;
  onRoundCountChange: (count: DecisionRoundCount) => void;
  molecularDetail: MolecularDetailMode;
}

const BRANCH_Y_CENTERS = [40, 120, 200, 280];

export const DecisionTreeSelector: React.FC<DecisionTreeSelectorProps> = ({
  roundCount,
  onRoundCountChange,
  molecularDetail,
}) => {
  const [inspectedBranchId, setInspectedBranchId] = useState<ScenarioId>('A');

  const tree = useMemo(
    () => buildDecisionTree(roundCount, molecularDetail),
    [roundCount, molecularDetail]
  );

  const selectedBranch =
    tree.branches.find((b) => b.scenarioId === inspectedBranchId) ?? tree.branches[0];

  const treeMinWidth = Math.max(760, 128 + 32 + roundCount * 112 + 176);

  return (
    <section
      aria-label="Árbol de progresión de célula sana a cáncer"
      data-testid="decision-tree-selector"
      className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 space-y-4"
    >
      {/* Header: Clear Tree Title + Interactive 3-10 Round Selector */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div>
          <h3 className="text-sm sm:text-base font-bold text-slate-900">
            Árbol de progresión: de célula inicial a cáncer
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Todas las partidas inician igual en la célula base y se bifurcan acumulando alteraciones
            durante <strong className="text-slate-700">{roundCount} rondas</strong>. Haz clic en una
            trayectoria ilustrativa para inspeccionar su evolución.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <span className="text-xs font-semibold text-slate-600 whitespace-nowrap">
            Rondas (3–10):
          </span>
          <div
            role="group"
            aria-label="Número de rondas de decisión"
            className="inline-flex items-center gap-0.5 p-0.5 bg-slate-100 rounded-lg"
          >
            {DECISION_ROUND_OPTIONS.map((count) => {
              const active = roundCount === count;
              return (
                <button
                  key={count}
                  type="button"
                  data-testid={`round-count-${count}`}
                  onClick={() => onRoundCountChange(count)}
                  className={`px-2 py-1 rounded-md text-xs font-semibold font-mono tabular-nums transition-colors whitespace-nowrap cursor-pointer ${
                    active
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {count}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {roundCount >= 6 && (
        <div className="text-[11px] text-slate-500 flex items-center justify-between">
          <span>
            Desliza horizontalmente el árbol para recorrer de Ronda 1 a Ronda {roundCount} y ver las
            tasas finales estimadas.
          </span>
        </div>
      )}

      {/* Horizontal Decision Tree */}
      <div className="overflow-x-auto pb-2">
        <div className="space-y-2" style={{ minWidth: `${treeMinWidth}px` }}>
          {/* Column Headers aligned with Tree Levels */}
          <div className="flex items-center text-[11px] font-semibold text-slate-500">
            <div className="w-[128px] shrink-0 text-center">Inicio único</div>
            <div className="w-8 shrink-0" aria-hidden="true" />
            <div className="flex-1 flex items-center gap-2">
              <div
                className="flex-1 grid gap-1.5"
                style={{ gridTemplateColumns: `repeat(${roundCount}, minmax(0, 1fr))` }}
              >
                {Array.from({ length: roundCount }, (_, idx) => (
                  <div key={idx} className="text-center font-mono">
                    Ronda {idx + 1}
                  </div>
                ))}
              </div>
              <div className="w-[176px] shrink-0 text-right pr-2">
                Tasa final (R{roundCount})
              </div>
            </div>
          </div>

          {/* Tree Body: Shared Healthy Cell Root + SVG Fan-out + Illustrative Trajectories */}
          <div className="flex items-stretch">
            {/* Root Node: Healthy Cell (0%) */}
            <div className="w-[128px] shrink-0 flex items-center">
              <div className="w-full rounded-lg border border-emerald-300 bg-emerald-50/70 p-3 text-center space-y-1">
                <div className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 mx-auto">
                  <ShieldCheck className="w-4 h-4" aria-hidden="true" />
                </div>
                <div className="text-xs font-bold text-emerald-950">{tree.rootLabel}</div>
                <div className="text-sm font-mono font-bold text-emerald-700 tabular-nums">
                  {tree.rootRate}% cáncer
                </div>
                <div className="text-[10px] text-emerald-800/80 leading-tight">
                  Punto de partida común
                </div>
              </div>
            </div>

            {/* SVG Cubic Bezier Branch Connectors */}
            <div className="w-8 shrink-0 flex items-stretch" aria-hidden="true">
              <svg
                viewBox="0 0 36 320"
                preserveAspectRatio="none"
                className="w-full h-full overflow-visible"
              >
                {tree.branches.map((branch, idx) => {
                  const isSelected = branch.scenarioId === inspectedBranchId;
                  if (isSelected) return null;
                  const targetY = BRANCH_Y_CENTERS[idx];
                  return (
                    <path
                      key={branch.scenarioId}
                      d={`M 0 160 C 18 160, 18 ${targetY}, 36 ${targetY}`}
                      fill="none"
                      stroke="#cbd5e1"
                      strokeWidth="1.6"
                    />
                  );
                })}
                {tree.branches.map((branch, idx) => {
                  const isSelected = branch.scenarioId === inspectedBranchId;
                  if (!isSelected) return null;
                  const targetY = BRANCH_Y_CENTERS[idx];
                  return (
                    <path
                      key={`active-${branch.scenarioId}`}
                      d={`M 0 160 C 18 160, 18 ${targetY}, 36 ${targetY}`}
                      fill="none"
                      stroke="#0284c7"
                      strokeWidth="2.8"
                    />
                  );
                })}
              </svg>
            </div>

            {/* Illustrative Evolutionary Trajectories */}
            <div className="flex-1 flex flex-col gap-2">
              {tree.branches.map((branch) => {
                const isSelected = branch.scenarioId === inspectedBranchId;
                const [controlled, aggressive] = branch.outcomes;

                return (
                  <button
                    key={branch.scenarioId}
                    type="button"
                    aria-pressed={isSelected}
                    data-testid={`tree-branch-${branch.scenarioId}`}
                    onClick={() => setInspectedBranchId(branch.scenarioId)}
                    className={`w-full text-left rounded-lg border px-2.5 py-2 flex items-center gap-2 transition-colors cursor-pointer ${
                      isSelected
                        ? 'border-sky-500 bg-sky-50/60'
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/70'
                    }`}
                  >
                    {/* Progressive Round Nodes */}
                    <div
                      className="flex-1 grid gap-1.5 items-center"
                      style={{ gridTemplateColumns: `repeat(${roundCount}, minmax(0, 1fr))` }}
                    >
                      {branch.steps.map((step, sIdx) => (
                        <div key={step.round} className="flex items-center gap-1 min-w-0">
                          <div
                            title={`Ronda ${step.round}: ${step.detail}`}
                            className={`flex-1 min-w-0 rounded-md border px-2 py-1.5 ${
                              isSelected
                                ? 'border-sky-200 bg-white'
                                : 'border-slate-200/80 bg-slate-50/70'
                            }`}
                          >
                            <div
                              className={`text-[11px] font-semibold truncate ${
                                molecularDetail === 'precision' ? 'font-mono' : ''
                              } ${isSelected ? 'text-slate-900' : 'text-slate-700'}`}
                            >
                              {step.label}
                            </div>
                            <div className="text-[10px] font-mono text-slate-500 tabular-nums mt-0.5">
                              ~{step.cancerRateAtStep}%
                            </div>
                          </div>
                          {sIdx < branch.steps.length - 1 && (
                            <ChevronRight
                              className={`w-3 h-3 shrink-0 ${
                                isSelected ? 'text-sky-500' : 'text-slate-300'
                              }`}
                              aria-hidden="true"
                            />
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Terminal Outcomes: Final Cancer Rates (%) */}
                    <div className="w-[176px] shrink-0 pl-2 border-l border-slate-200 space-y-1.5">
                      {/* Controlled leaf */}
                      <div className="space-y-0.5">
                        <div className="flex items-center justify-between gap-2 text-[10px]">
                          <span className="text-slate-600 truncate">Si se frena</span>
                          <span className="font-mono font-semibold text-emerald-700 tabular-nums shrink-0">
                            {controlled.finalCancerRate}%
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-emerald-500 rounded-full"
                            style={{ width: `${controlled.finalCancerRate}%` }}
                          />
                        </div>
                      </div>

                      {/* Aggressive leaf */}
                      <div className="space-y-0.5">
                        <div className="flex items-center justify-between gap-2 text-[10px]">
                          <span className="text-slate-700 font-medium truncate">Si escapa</span>
                          <span className="font-mono font-bold text-rose-700 tabular-nums shrink-0">
                            {aggressive.finalCancerRate}% · {aggressive.riskLevel}
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-rose-600 rounded-full"
                            style={{ width: `${aggressive.finalCancerRate}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Inspected Trajectory Plain-Language Footer */}
      <div
        data-testid="selected-branch-summary"
        className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-xs"
      >
        <div className="text-slate-700">
          <span className="font-semibold text-slate-900">
            Trayectoria {selectedBranch.branchIndex}: {selectedBranch.shortTitle}
          </span>
          <span className="text-slate-400" aria-hidden="true">
            {' '}
            ·{' '}
          </span>
          <span className="text-slate-600">{selectedBranch.subtitle}</span>
        </div>
        <div className="font-mono text-slate-700 tabular-nums whitespace-nowrap">
          {roundCount} rondas · Tasa estimada:{' '}
          <strong className="text-slate-900">
            {selectedBranch.minCancerRate}%–{selectedBranch.maxCancerRate}%
          </strong>
        </div>
      </div>
    </section>
  );
};
