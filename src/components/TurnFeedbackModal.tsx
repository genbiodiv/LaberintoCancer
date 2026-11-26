import React, { useState } from 'react';
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Info,
  Lightbulb,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import { getHallmarkById } from '../engine/knowledgeBase';
import {
  describeTurnResolutionSimple,
  formatBiologyText,
  getHallmarkDisplayInfo,
} from '../engine/molecularAbstraction';
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
  const isSimple = molecularDetail === 'simple';
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
      className="fixed inset-0 z-50 bg-slate-950/65 flex items-center justify-center p-4"
    >
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl max-w-xl w-full max-h-[88vh] flex flex-col overflow-hidden shadow-lg">
        {/* Clear Header */}
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-start justify-between gap-4 bg-slate-50/70 dark:bg-slate-950/70">
          <div className="min-w-0">
            <div className="text-xs font-mono text-slate-500 dark:text-slate-400">
              {isFinished
                ? `Recorrido completado · Ronda ${resolution.roundNumber}`
                : `Ronda ${resolution.roundNumber}`}
            </div>
            <h2
              id="feedback-modal-title"
              className="text-base font-bold text-slate-900 dark:text-white mt-0.5 leading-snug"
            >
              {fmt(resolution.actionTakenLabel)}
            </h2>
          </div>

          {resolution.mode === 'oncologist' ? (
            <div
              className={`text-xs font-semibold inline-flex items-center gap-1.5 shrink-0 ${
                resolution.actionKind === 'observation'
                  ? 'text-emerald-700 dark:text-emerald-400'
                  : resolution.actionKind === 'diagnostic'
                    ? 'text-cyan-700 dark:text-cyan-400'
                    : 'text-sky-700 dark:text-sky-400'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
              <span>
                {resolution.actionKind === 'diagnostic'
                  ? 'Estudio completado'
                  : resolution.actionKind === 'observation'
                    ? 'Observación clínica'
                    : 'Intervención aplicada'}
              </span>
            </div>
          ) : (
            <div
              className={`text-xs font-semibold inline-flex items-center gap-1.5 shrink-0 ${
                resolution.predictionMatched
                  ? 'text-emerald-700 dark:text-emerald-400'
                  : 'text-amber-700 dark:text-amber-400'
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
              className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/70 p-4 space-y-1"
            >
              <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Desenlace tras {resolution.roundNumber} rondas de decisión
              </div>
              <div className="text-lg font-bold text-slate-900 dark:text-white">
                {fmt(state.outcomeTitle)}
              </div>
              {state.outcomeExplanation && (
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  {fmt(state.outcomeExplanation)}
                </p>
              )}
            </section>
          )}

          {/* Core Visual Meter: Tumor Burden (0-100) */}
          <section className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/60 p-4 space-y-3">
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-xs font-semibold text-slate-900 dark:text-white">
                {isSimple
                  ? isFinished
                    ? 'Tamaño final del tumor'
                    : 'Tamaño actual del tumor'
                  : isFinished
                    ? 'Carga tumoral final'
                    : 'Carga tumoral actual'}
              </span>
              <div className="flex items-baseline gap-2 font-mono tabular-nums">
                <span className="text-xs text-slate-400 dark:text-slate-500">
                  {cancerRateBefore}/100
                </span>
                <span className="text-xs text-slate-400 dark:text-slate-500" aria-hidden="true">
                  →
                </span>
                <span className="text-lg font-bold text-slate-900 dark:text-white">
                  {cancerRateAfter}/100
                </span>
                <span
                  className={`text-xs font-semibold ${
                    cancerDelta > 0
                      ? 'text-rose-600 dark:text-rose-400'
                      : cancerDelta < 0
                        ? 'text-emerald-700 dark:text-emerald-400'
                        : 'text-slate-500 dark:text-slate-400'
                  }`}
                >
                  ({cancerDelta > 0 ? `+${cancerDelta}` : `${cancerDelta}`})
                </span>
              </div>
            </div>

            <div className="space-y-1">
              <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    cancerRateAfter >= 70
                      ? 'bg-rose-600 dark:bg-rose-500'
                      : cancerRateAfter >= 40
                        ? 'bg-amber-500'
                        : 'bg-emerald-600 dark:bg-emerald-500'
                  }`}
                  style={{ width: `${cancerRateAfter}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                <span>0 · Sin carga tumoral</span>
                <span>100 · Carga tumoral máxima</span>
              </div>
            </div>

            {/* Plain-Spanish Patient Status in Oncologist Mode */}
            {resolution.mode === 'oncologist' && (
              <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800 space-y-2.5 text-xs">
                {isUnlimited && (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-slate-900 dark:text-white">
                        Progreso de la partida
                      </span>
                      <span className="font-mono font-bold text-sky-700 dark:text-sky-400 tabular-nums">
                        {liberationAfter}%
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          liberationAfter >= 80
                            ? 'bg-emerald-600 dark:bg-emerald-500'
                            : 'bg-sky-600 dark:bg-sky-500'
                        }`}
                        style={{ width: `${liberationAfter}%` }}
                      />
                    </div>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 block">
                      {isSimple ? 'Bienestar del paciente' : 'Calidad de vida'}
                    </span>
                    <span className="font-mono font-semibold text-slate-900 dark:text-white tabular-nums">
                      {patientWellbeing}/100
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 block">
                      {isSimple ? 'Desgaste acumulado' : 'Toxicidad acumulada'}
                    </span>
                    <span className="font-mono font-semibold text-slate-900 dark:text-white tabular-nums">
                      {sideEffects}/100
                    </span>
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* Plain Explanation of What Happened / Diagnostic Finding + Molecular/Cellular Ramifications */}
          <section className="space-y-2.5">
            {isSimple && (
              <div
                data-testid="simple-resolution-summary"
                className="rounded-lg border border-emerald-200 dark:border-emerald-800/80 bg-emerald-50/80 dark:bg-emerald-950/50 p-3 space-y-1"
              >
                <div className="text-xs font-bold text-emerald-900 dark:text-emerald-300 inline-flex items-center gap-1.5">
                  <Lightbulb className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                  <span>En palabras simples</span>
                </div>
                <p className="text-xs text-emerald-950 dark:text-emerald-100 leading-relaxed">
                  {describeTurnResolutionSimple(resolution, state)}
                </p>
              </div>
            )}

            <h3 className="text-xs font-semibold text-slate-900 dark:text-white">
              {resolution.actionKind === 'diagnostic'
                ? 'Hallazgo del estudio'
                : isSimple
                  ? 'Qué pasó en esta ronda'
                  : 'Qué ocurrió y por qué'}
            </h3>
            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
              {fmt(resolution.whatHappened)}
            </p>
            {resolution.cellularProcessChanged && (
              <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/70 px-3 py-2 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                <strong className="text-slate-900 dark:text-white">
                  {resolution.actionKind === 'diagnostic'
                    ? 'Cómo orienta la siguiente decisión:'
                    : isSimple
                      ? 'Efecto en las células:'
                      : 'Consecuencia molecular y celular:'}
                </strong>{' '}
                {fmt(resolution.cellularProcessChanged)}
              </div>
            )}
          </section>

          {/* Cell Population Breakdown */}
          <section className="space-y-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
            <h3 className="text-xs font-semibold text-slate-900 dark:text-white">
              {isSimple
                ? 'Proporción de grupos de células'
                : 'Proporción de poblaciones celulares'}
            </h3>
            <div className="space-y-2">
              {resolution.clonesAfter.map((after, idx) => {
                const before = resolution.clonesBefore[idx]?.share ?? 0;
                const diff = after.share - before;
                return (
                  <div key={after.id} className="space-y-1">
                    <div className="flex items-start justify-between gap-3 text-xs">
                      <span className="text-slate-700 dark:text-slate-300 leading-snug">
                        {fmt(after.name)}
                      </span>
                      <span className="font-mono tabular-nums text-slate-700 dark:text-slate-300 shrink-0 whitespace-nowrap">
                        <span className="text-slate-400 dark:text-slate-500">{before}% → </span>
                        <strong className="text-slate-900 dark:text-white">{after.share}%</strong>{' '}
                        <span
                          className={
                            diff > 0
                              ? 'text-rose-600 dark:text-rose-400'
                              : diff < 0
                                ? 'text-emerald-700 dark:text-emerald-400'
                                : 'text-slate-400 dark:text-slate-500'
                          }
                        >
                          ({diff > 0 ? `+${diff}%` : `${diff}%`})
                        </span>
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-slate-700 dark:bg-slate-300 rounded-full"
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
            <section className="space-y-1.5 pt-3 border-t border-slate-100 dark:border-slate-800">
              <h3 className="text-xs font-semibold text-slate-900 dark:text-white">
                {isSimple ? 'Habilidades del tumor que cambiaron' : 'Capacidades celulares modificadas'}
              </h3>
              <ul className="space-y-1">
                {resolution.hallmarksAffected.map((ha) => {
                  const def = getHallmarkById(ha.id);
                  const displayName = def
                    ? getHallmarkDisplayInfo(def, molecularDetail).name
                    : ha.id;
                  const isUp = ha.direction === 'up';
                  return (
                    <li
                      key={ha.id}
                      className="text-xs text-slate-700 dark:text-slate-300 flex items-center justify-between gap-2"
                    >
                      <span className="truncate">{displayName}</span>
                      <span
                        className={`text-[11px] font-semibold inline-flex items-center gap-1 shrink-0 ${
                          isUp
                            ? 'text-rose-600 dark:text-rose-400'
                            : 'text-emerald-700 dark:text-emerald-400'
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
            <section className="pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setShowReferences((prev) => !prev)}
                data-testid="toggle-scientific-refs"
                className="text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white inline-flex items-center gap-1.5 cursor-pointer"
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
                <ul className="mt-2 space-y-1.5 text-[11px] text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/70 rounded-lg p-3 border border-slate-200 dark:border-slate-700">
                  {resolution.evidenceCitations.slice(0, 2).map((cit, i) => (
                    <li key={i} className="leading-relaxed">
                      <strong className="text-slate-800 dark:text-slate-100">{cit.source}:</strong>{' '}
                      {fmt(cit.detail)}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )}
        </div>

        {/* Clean Action Footer */}
        <div className="px-5 py-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/70 flex items-center justify-end gap-2">
          {isFinished && onBackHome && (
            <button
              type="button"
              onClick={onBackHome}
              className="px-3.5 py-2 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
            >
              Volver al inicio
            </button>
          )}
          <button
            type="button"
            onClick={onContinue}
            className="px-4 py-2 rounded-lg text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 dark:bg-sky-600 dark:hover:bg-sky-500 transition-colors inline-flex items-center gap-2 cursor-pointer"
          >
            <span>{isFinished ? 'Ver resumen completo' : `Siguiente ronda`}</span>
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
};
