import React, { useMemo } from 'react';
import {
  ArrowLeft,
  ChevronRight,
  GitCompareArrows,
  Repeat,
  RotateCcw,
} from 'lucide-react';
import { HALLMARKS_CATALOG } from '../engine/knowledgeBase';
import { formatBiologyText } from '../engine/molecularAbstraction';
import { MolecularDetailMode, SimulationState } from '../engine/types';

interface ReportViewProps {
  state: SimulationState;
  molecularDetail: MolecularDetailMode;
  hasOppositeRun: boolean;
  onSwitchPerspective: () => void;
  onOpenComparison: () => void;
  onBackHome: () => void;
  onRestartSame: () => void;
}

export const ReportView: React.FC<ReportViewProps> = ({
  state,
  molecularDetail,
  hasOppositeRun,
  onSwitchPerspective,
  onOpenComparison,
  onBackHome,
  onRestartSame,
}) => {
  const oppositeModeLabel = state.mode === 'cancer' ? 'Oncólogo' : 'Cáncer';
  const fmt = (text: string) => formatBiologyText(text, molecularDetail);

  const topCapabilities = [...HALLMARKS_CATALOG]
    .sort((a, b) => state.hallmarkScores[b.id] - state.hallmarkScores[a.id])
    .slice(0, 5);

  // Reconstruct progressive cancer rate timeline from baseline cell across completed rounds
  const progressionSteps = useMemo(() => {
    const finalRate = state.clinical.tumorBurden;
    const totalDelta = state.history.reduce(
      (sum, h) => sum + h.clinicalDelta.tumorBurdenDelta,
      0
    );
    let cursor = Math.max(5, Math.min(95, finalRate - totalDelta));
    const items: { label: string; rate: number }[] = [{ label: 'Célula inicial', rate: 16 }];
    for (const h of state.history) {
      cursor = Math.max(0, Math.min(100, cursor + h.clinicalDelta.tumorBurdenDelta));
      items.push({ label: `Ronda ${h.roundNumber}`, rate: cursor });
    }
    if (items.length > 1) {
      items[items.length - 1].rate = finalRate;
    }
    return items;
  }, [state.clinical.tumorBurden, state.history]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Top Bar */}
      <header className="w-full border-b border-slate-200 bg-white">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between gap-6">
          <button
            type="button"
            onClick={onBackHome}
            className="text-sm font-medium text-slate-600 hover:text-slate-900 inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            Volver al inicio
          </button>

          <div className="text-xs font-mono text-slate-500 truncate">
            {state.mode === 'cancer' ? 'Rol Cáncer' : 'Rol Oncólogo'} · {state.history.length}{' '}
            rondas
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8 space-y-6">
        {/* Outcome & Progression Summary */}
        <section className="bg-white border border-slate-200 rounded-xl p-6 space-y-5">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
            <div className="space-y-1.5">
              <div className="text-xs text-slate-500">
                {state.history.length} rondas de decisión · {state.accumulatedProblems.length}{' '}
                {state.accumulatedProblems.length === 1
                  ? 'alteración acumulada'
                  : 'alteraciones acumuladas'}
              </div>
              <h1 className="text-2xl font-bold text-slate-900 [text-wrap:balance]">
                {fmt(state.outcomeTitle ?? 'Simulación completada')}
              </h1>
              {state.outcomeExplanation && (
                <p className="text-sm text-slate-600 max-w-2xl leading-relaxed">
                  {fmt(state.outcomeExplanation)}
                </p>
              )}
            </div>

            <div className="flex flex-wrap gap-2 shrink-0">
              <button
                type="button"
                onClick={onSwitchPerspective}
                className="px-4 py-2.5 rounded-lg text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 inline-flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
              >
                <Repeat className="w-3.5 h-3.5" aria-hidden="true" />
                Probar como {oppositeModeLabel}
              </button>
              {hasOppositeRun && (
                <button
                  type="button"
                  onClick={onOpenComparison}
                  className="px-4 py-2.5 rounded-lg text-xs font-semibold text-slate-900 bg-slate-100 hover:bg-slate-200 inline-flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
                >
                  <GitCompareArrows className="w-3.5 h-3.5" aria-hidden="true" />
                  Comparar roles
                </button>
              )}
              <button
                type="button"
                onClick={onRestartSame}
                className="px-3.5 py-2.5 rounded-lg text-xs font-medium text-slate-700 border border-slate-200 hover:bg-slate-50 inline-flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                Nueva partida
              </button>
            </div>
          </div>

          {/* Progression Strip: Baseline Cell -> Each Round -> Final Cancer Rate (%) */}
          <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="font-semibold text-slate-900">
                Evolución de la tasa de cáncer (de la célula inicial al desenlace)
              </span>
              <span className="font-mono font-bold text-slate-900 tabular-nums">
                Tasa final: {state.clinical.tumorBurden}%
              </span>
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              {progressionSteps.map((step, idx) => (
                <React.Fragment key={step.label}>
                  <div className="min-w-[96px] flex-1 rounded-md border border-slate-200 bg-white px-2.5 py-2 text-center">
                    <div className="text-[11px] text-slate-500">{step.label}</div>
                    <div
                      className={`text-sm font-mono font-bold tabular-nums mt-0.5 ${
                        step.rate <= 16
                          ? 'text-emerald-700'
                          : step.rate >= 70
                            ? 'text-rose-700'
                            : step.rate >= 40
                              ? 'text-amber-700'
                              : 'text-sky-700'
                      }`}
                    >
                      {step.rate}%
                    </div>
                  </div>
                  {idx < progressionSteps.length - 1 && (
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" aria-hidden="true" />
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* Plain-Language Final Clinical Indicators */}
          <div className="pt-4 border-t border-slate-100 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <div className="text-[11px] text-slate-500">
                {state.mode === 'oncologist' ? 'Liberación alcanzada' : 'Tasa final de cáncer'}
              </div>
              <div className="text-2xl font-mono font-bold text-slate-900 tabular-nums mt-0.5">
                {state.mode === 'oncologist'
                  ? `${state.oncologistLiberation ?? 100}%`
                  : `${state.clinical.tumorBurden}%`}
              </div>
            </div>
            <div>
              <div className="text-[11px] text-slate-500">
                {state.mode === 'oncologist' ? 'Bienestar del paciente' : 'Integridad del tejido'}
              </div>
              <div className="text-2xl font-mono font-bold text-slate-900 tabular-nums mt-0.5">
                {state.clinical.qualityOfLife}%
              </div>
            </div>
            <div>
              <div className="text-[11px] text-slate-500">
                {state.mode === 'oncologist' ? 'Efectos secundarios' : 'Alteraciones acumuladas'}
              </div>
              <div className="text-2xl font-mono font-bold text-slate-900 tabular-nums mt-0.5">
                {state.mode === 'oncologist'
                  ? `${state.clinical.cumulativeToxicity}%`
                  : state.accumulatedProblems.length}
              </div>
            </div>
            <div>
              <div className="text-[11px] text-slate-500">Rondas jugadas</div>
              <div className="text-2xl font-mono font-bold text-slate-900 tabular-nums mt-0.5">
                {state.history.length}
              </div>
            </div>
          </div>
        </section>

        {/* Accumulated Molecular Problems & Recent Runs Comparison */}
        <section
          data-testid="accumulated-problems-section"
          className="bg-white border border-slate-200 rounded-xl p-6 space-y-5"
        >
          <div className="space-y-1">
            <h2 className="text-base font-bold text-slate-900">
              Problemas acumulados en esta partida
            </h2>
            <p className="text-xs text-slate-500">
              Todas las partidas empiezan igual y van acumulando alteraciones según las puertas que
              atraviesas en cada ronda.
            </p>
          </div>

          {state.accumulatedProblems.length === 0 ? (
            <p className="text-xs text-slate-600 bg-emerald-50/60 border border-emerald-200 rounded-lg p-3">
              El tumor no acumuló alteraciones adicionales durante esta partida.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {state.accumulatedProblems.map((prob, idx) => (
                <div
                  key={`${prob.id}-${prob.roundNumber}-${idx}`}
                  className="rounded-lg border border-slate-200 bg-slate-50/70 p-3 space-y-1"
                >
                  <div className="flex items-center justify-between gap-2 text-[11px]">
                    <span className="font-mono font-semibold text-slate-500">
                      Ronda {prob.roundNumber}
                    </span>
                    <span className="text-[10px] font-medium text-slate-500">
                      {prob.geneState === 'activated' ? 'Ganancia activa' : 'Pérdida de control'}
                    </span>
                  </div>
                  <div
                    className={`text-xs font-bold text-slate-900 ${
                      molecularDetail === 'precision' ? 'font-mono' : ''
                    }`}
                  >
                    {molecularDetail === 'precision' ? prob.precisionLabel : prob.logicLabel}
                  </div>
                  <p className="text-[11px] text-slate-600 leading-snug">{fmt(prob.summary)}</p>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Two-column Summary: Cell Populations & Capabilities + Decision Log */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <section className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
            <h2 className="text-sm font-bold text-slate-900">
              Poblaciones celulares y capacidades finales
            </h2>
            <div className="space-y-2.5">
              {state.clones.map((c) => (
                <div key={c.id} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-800">{fmt(c.name)}</span>
                    <span className="font-mono font-semibold text-slate-900 tabular-nums">
                      {c.share}%
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-slate-700 rounded-full"
                      style={{ width: `${c.share}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-slate-100 space-y-1.5">
              <div className="text-xs font-semibold text-slate-700">
                Capacidades predominantes del cáncer
              </div>
              {topCapabilities.map((h) => (
                <div
                  key={h.id}
                  className="flex items-center justify-between text-xs text-slate-600"
                >
                  <span>{h.name}</span>
                  <span className="font-mono tabular-nums text-slate-900">
                    {state.hallmarkScores[h.id]}%
                  </span>
                </div>
              ))}
            </div>
          </section>

          <section className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
            <h2 className="text-sm font-bold text-slate-900">
              Decisiones tomadas ({state.history.length} rondas)
            </h2>
            <ol className="space-y-3 max-h-72 overflow-y-auto pr-1">
              {state.history.map((h) => (
                <li
                  key={h.roundNumber}
                  className="pb-3 border-b border-slate-100 last:border-none last:pb-0 space-y-1"
                >
                  <div className="text-xs font-semibold text-slate-900">
                    Ronda {h.roundNumber}: {fmt(h.actionTakenLabel)}
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">{fmt(h.whatHappened)}</p>
                </li>
              ))}
            </ol>
          </section>
        </div>
      </main>
    </div>
  );
};
