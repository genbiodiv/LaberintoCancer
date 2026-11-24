import React, { useState } from 'react';
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Info,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import { getHallmarkById } from '../engine/knowledgeBase';
import { formatBiologyText } from '../engine/molecularAbstraction';
import { MolecularDetailMode, SimulationState, TurnResolution } from '../engine/types';

interface TurnFeedbackModalProps {
  resolution: TurnResolution | null;
  state: SimulationState | null;
  molecularDetail: MolecularDetailMode;
  isFinished: boolean;
  onContinue: () => void;
  onBackHome?: () => void;
}

export const TurnFeedbackModal: React.FC<TurnFeedbackModalProps> = ({
  resolution,
  state,
  molecularDetail,
  isFinished,
  onContinue,
  onBackHome,
}) => {
  const [showReferences, setShowReferences] = useState(false);

  if (!resolution) return null;

  const fmt = (text: string) => formatBiologyText(text, molecularDetail);
  const isUnlimited = Boolean(state?.unlimitedMode);
  const cancerRateAfter = state?.clinical.tumorBurden ?? 50;
  const cancerDelta = resolution.clinicalDelta.tumorBurdenDelta;
  const cancerRateBefore = Math.max(0, Math.min(100, cancerRateAfter - cancerDelta));
  const liberationAfter = state?.oncologistLiberation ?? 16;

  const patientWellbeing = state?.clinical.qualityOfLife ?? 80;
  const sideEffects = state?.clinical.cumulativeToxicity ?? 10;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="feedback-modal-title"
      data-testid="turn-feedback-modal"
      className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4"
    >
      <div className="bg-white border border-slate-200 rounded-xl max-w-xl w-full max-h-[88vh] flex flex-col overflow-hidden shadow-lg">
        {/* Clear Header */}
        <div className="px-5 py-4 border-b border-slate-200 flex items-start justify-between gap-4 bg-slate-50/70">
          <div className="min-w-0">
            <div className="text-xs font-mono text-slate-500">
              {isFinished
                ? `Meta alcanzada (100%) · Ronda ${resolution.roundNumber}`
                : `Ronda ${resolution.roundNumber}`}
            </div>
            <h2
              id="feedback-modal-title"
              className="text-base font-bold text-slate-900 mt-0.5 leading-snug"
            >
              {fmt(resolution.actionTakenLabel)}
            </h2>
          </div>

          {resolution.mode === 'oncologist' ? (
            <div
              className={`text-xs font-semibold inline-flex items-center gap-1.5 shrink-0 ${
                resolution.actionKind === 'observation'
                  ? 'text-emerald-700'
                  : resolution.actionKind === 'diagnostic'
                    ? 'text-cyan-700'
                    : 'text-sky-700'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
              <span>
                {resolution.actionKind === 'diagnostic'
                  ? 'Diagnóstico completado'
                  : resolution.actionKind === 'observation'
                    ? 'Observación clínica'
                    : 'Intervención aplicada'}
              </span>
            </div>
          ) : (
            <div
              className={`text-xs font-semibold inline-flex items-center gap-1.5 shrink-0 ${
                resolution.predictionMatched ? 'text-emerald-700' : 'text-amber-700'
              }`}
            >
              {resolution.predictionMatched ? (
                <>
                  <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
                  <span>Predicción correcta</span>
                </>
              ) : (
                <>
                  <Info className="w-4 h-4" aria-hidden="true" />
                  <span>Resultado contrastado</span>
                </>
              )}
            </div>
          )}
        </div>

        {/* Plain-Language Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Final Verdict Highlight (only on final round) */}
          {isFinished && state?.outcomeTitle && (
            <section
              data-testid="final-outcome-banner"
              className="rounded-lg border border-slate-200 bg-slate-50 p-4 space-y-1"
            >
              <div className="text-xs font-semibold text-slate-500">
                Desenlace tras {resolution.roundNumber} rondas de decisión
              </div>
              <div className="text-lg font-bold text-slate-900">
                {fmt(state.outcomeTitle)}
              </div>
              {state.outcomeExplanation && (
                <p className="text-xs text-slate-600 leading-relaxed">
                  {fmt(state.outcomeExplanation)}
                </p>
              )}
            </section>
          )}

          {/* Core Visual Meter: Healthy Cell (0%) -> Current/Final Cancer Rate (%) */}
          <section className="rounded-lg border border-slate-200 bg-white p-4 space-y-3">
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-xs font-semibold text-slate-900">
                {isFinished ? 'Tasa final de cáncer' : 'Tasa actual de cáncer'}
              </span>
              <div className="flex items-baseline gap-2 font-mono tabular-nums">
                <span className="text-xs text-slate-400">{cancerRateBefore}%</span>
                <span className="text-xs text-slate-400" aria-hidden="true">
                  →
                </span>
                <span className="text-lg font-bold text-slate-900">{cancerRateAfter}%</span>
                <span
                  className={`text-xs font-semibold ${
                    cancerDelta > 0
                      ? 'text-rose-600'
                      : cancerDelta < 0
                        ? 'text-emerald-700'
                        : 'text-slate-500'
                  }`}
                >
                  ({cancerDelta > 0 ? `+${cancerDelta}%` : `${cancerDelta}%`})
                </span>
              </div>
            </div>

            <div className="space-y-1">
              <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    cancerRateAfter >= 70
                      ? 'bg-rose-600'
                      : cancerRateAfter >= 40
                        ? 'bg-amber-500'
                        : 'bg-emerald-600'
                  }`}
                  style={{ width: `${cancerRateAfter}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-500">
                <span>0% · Célula sana</span>
                <span>100% · Cáncer avanzado</span>
              </div>
            </div>

            {/* Plain-Spanish Patient Status in Oncologist Mode (zero cryptic abbreviations) */}
            {resolution.mode === 'oncologist' && (
              <div className="pt-2.5 border-t border-slate-100 space-y-2.5 text-xs">
                {isUnlimited && (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-slate-900">
                        Progreso hacia liberación total
                      </span>
                      <span className="font-mono font-bold text-sky-700 tabular-nums">
                        {liberationAfter}% / 100%
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          liberationAfter >= 80 ? 'bg-emerald-600' : 'bg-sky-600'
                        }`}
                        style={{ width: `${liberationAfter}%` }}
                      />
                    </div>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-slate-500 block">Bienestar del paciente</span>
                    <span className="font-mono font-semibold text-slate-900 tabular-nums">
                      {patientWellbeing}%
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Efectos secundarios</span>
                    <span className="font-mono font-semibold text-slate-900 tabular-nums">
                      {sideEffects}%
                    </span>
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* Plain Explanation of What Happened + Molecular/Cellular Ramifications */}
          <section className="space-y-2">
            <h3 className="text-xs font-semibold text-slate-900">Qué pasó en esta ronda</h3>
            <p className="text-sm text-slate-700 leading-relaxed">{fmt(resolution.whatHappened)}</p>
            {resolution.cellularProcessChanged && (
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700 leading-relaxed">
                <strong className="text-slate-900">Ramificación molecular y celular:</strong>{' '}
                {fmt(resolution.cellularProcessChanged)}
              </div>
            )}
          </section>

          {/* Cell Population Breakdown (Visual Bars, Simple Labels) */}
          <section className="space-y-2.5 pt-3 border-t border-slate-100">
            <h3 className="text-xs font-semibold text-slate-900">
              Cambio en las poblaciones de células
            </h3>
            <div className="space-y-2">
              {resolution.clonesAfter.map((after, idx) => {
                const before = resolution.clonesBefore[idx]?.share ?? 0;
                const diff = after.share - before;
                return (
                  <div key={after.id} className="space-y-1">
                    <div className="flex items-start justify-between gap-3 text-xs">
                      <span className="text-slate-700 leading-snug">{fmt(after.name)}</span>
                      <span className="font-mono tabular-nums text-slate-700 shrink-0 whitespace-nowrap">
                        <span className="text-slate-400">{before}% → </span>
                        <strong className="text-slate-900">{after.share}%</strong>{' '}
                        <span
                          className={
                            diff > 0
                              ? 'text-rose-600'
                              : diff < 0
                                ? 'text-emerald-700'
                                : 'text-slate-400'
                          }
                        >
                          ({diff > 0 ? `+${diff}%` : `${diff}%`})
                        </span>
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-slate-700 rounded-full"
                        style={{ width: `${after.share}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Cellular Capabilities Changed (Plain Spanish) */}
          {resolution.hallmarksAffected.length > 0 && (
            <section className="space-y-1.5 pt-3 border-t border-slate-100">
              <h3 className="text-xs font-semibold text-slate-900">
                Capacidades celulares modificadas
              </h3>
              <ul className="space-y-1">
                {resolution.hallmarksAffected.map((ha) => {
                  const def = getHallmarkById(ha.id);
                  const isUp = ha.direction === 'up';
                  return (
                    <li
                      key={ha.id}
                      className="text-xs text-slate-700 flex items-center justify-between gap-2"
                    >
                      <span className="truncate">{def?.name ?? ha.id}</span>
                      <span
                        className={`text-[11px] font-semibold inline-flex items-center gap-1 shrink-0 ${
                          isUp ? 'text-rose-600' : 'text-emerald-700'
                        }`}
                      >
                        {isUp ? (
                          <>
                            <TrendingUp className="w-3.5 h-3.5" aria-hidden="true" />
                            <span>Sube</span>
                          </>
                        ) : (
                          <>
                            <TrendingDown className="w-3.5 h-3.5" aria-hidden="true" />
                            <span>Baja</span>
                          </>
                        )}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}

          {/* Optional Collapsible Scientific Sources (Hidden by default so students aren't confused by raw citations) */}
          {resolution.evidenceCitations.length > 0 && (
            <section className="pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowReferences((prev) => !prev)}
                data-testid="toggle-scientific-refs"
                className="text-xs font-medium text-slate-500 hover:text-slate-800 inline-flex items-center gap-1.5 cursor-pointer"
              >
                <BookOpen className="w-3.5 h-3.5" aria-hidden="true" />
                <span>
                  {showReferences ? 'Ocultar base científica' : 'Ver base científica (opcional)'}
                </span>
                {showReferences ? (
                  <ChevronUp className="w-3.5 h-3.5" aria-hidden="true" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5" aria-hidden="true" />
                )}
              </button>

              {showReferences && (
                <ul className="mt-2 space-y-1.5 text-[11px] text-slate-600 bg-slate-50 rounded-lg p-3 border border-slate-200">
                  {resolution.evidenceCitations.slice(0, 2).map((cit, i) => (
                    <li key={i} className="leading-relaxed">
                      <strong className="text-slate-800">{cit.source}:</strong>{' '}
                      {fmt(cit.detail)}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )}
        </div>

        {/* Clean Action Footer */}
        <div className="px-5 py-3.5 border-t border-slate-200 bg-slate-50/70 flex items-center justify-end gap-2">
          {isFinished && onBackHome && (
            <button
              type="button"
              onClick={onBackHome}
              className="px-3.5 py-2 rounded-lg text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Volver al inicio
            </button>
          )}
          <button
            type="button"
            onClick={onContinue}
            className="px-4 py-2 rounded-lg text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 transition-colors inline-flex items-center gap-2 cursor-pointer"
          >
            <span>{isFinished ? 'Ver resumen completo' : `Siguiente ronda`}</span>
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
};
