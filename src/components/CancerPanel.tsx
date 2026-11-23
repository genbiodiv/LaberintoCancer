import React, { useMemo, useState } from 'react';
import {
  ArrowRight,
  Check,
  Dna,
  FlaskConical,
  HelpCircle,
  Lock,
  ShieldAlert,
} from 'lucide-react';
import { GENES_LIBRARY } from '../engine/knowledgeBase';
import {
  formatBiologyText,
  getGeneDisplayTitle,
} from '../engine/molecularAbstraction';
import {
  getActiveRoundOffer,
  shuffleRandom,
  UNIFIED_FEATURED_GENES,
} from '../engine/progressionEngine';
import { evaluatePredictionGate } from '../engine/simulator';
import { MolecularDetailMode, SimulationState } from '../engine/types';

interface CancerPanelProps {
  state: SimulationState;
  molecularDetail: MolecularDetailMode;
  onResolveTurn: (strategyId: string, predictionId: string) => void;
}

export const CancerPanel: React.FC<CancerPanelProps> = ({
  state,
  molecularDetail,
  onResolveTurn,
}) => {
  const round = useMemo(() => getActiveRoundOffer(state), [state]);

  const [tab, setTab] = useState<'actions' | 'genes'>('actions');
  const [selectedStrategy, setSelectedStrategy] = useState<string>('');
  const [doorSelectNonce, setDoorSelectNonce] = useState<number>(0);
  const [selectedPrediction, setSelectedPrediction] = useState<string>('');
  const [showHint, setShowHint] = useState(false);
  const [doorLockState, setDoorLockState] = useState<{
    key: string;
    feedback: string;
    rejectedIds: string[];
  } | null>(null);

  // Reset local selection when round changes
  const activeStrategy = useMemo(() => {
    if (round.cancerStrategies.some((s) => s.id === selectedStrategy)) return selectedStrategy;
    return '';
  }, [round, selectedStrategy]);

  const activePrediction = useMemo(() => {
    if (round.cancerPredictions.some((p) => p.id === selectedPrediction)) return selectedPrediction;
    return '';
  }, [round, selectedPrediction]);

  // Randomize prediction options at every door selection occasion
  const shuffledPredictions = useMemo(() => {
    void doorSelectNonce;
    void activeStrategy;
    return shuffleRandom(round.cancerPredictions);
  }, [round, activeStrategy, doorSelectNonce]);

  const visibleLibraryGenes = useMemo(() => {
    const allowed = new Set(
      UNIFIED_FEATURED_GENES.slice(0, state.teacherConfig.maxGenesVisible)
    );
    return GENES_LIBRARY.filter((g) => allowed.has(g.symbol));
  }, [state.teacherConfig.maxGenesVisible]);

  const canResolve = Boolean(activeStrategy && activePrediction);
  const currentLockKey = `${state.currentRound}:${activeStrategy}`;
  const activeDoorLock = doorLockState?.key === currentLockKey ? doorLockState : null;

  const handleSubmit = () => {
    if (!canResolve) return;
    const gate = evaluatePredictionGate(state, activeStrategy, activePrediction);
    if (!gate.allowed) {
      setDoorLockState((prev) => ({
        key: currentLockKey,
        feedback: formatBiologyText(gate.feedback, molecularDetail),
        rejectedIds: Array.from(
          new Set([
            ...(prev?.key === currentLockKey ? prev.rejectedIds : []),
            activePrediction,
          ])
        ),
      }));
      return;
    }
    onResolveTurn(activeStrategy, activePrediction);
    setDoorLockState(null);
    setSelectedStrategy('');
    setSelectedPrediction('');
    setShowHint(false);
  };

  return (
    <aside
      aria-label="Panel de evolución clonal y acciones"
      className="bg-white border border-slate-200 rounded-xl flex flex-col h-full overflow-hidden"
    >
      {/* Clean Tab Header */}
      <div className="px-4 py-2.5 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between gap-2">
        <div role="tablist" aria-label="Secciones de modo cáncer" className="flex items-center gap-1 p-0.5 bg-slate-200/70 rounded-lg">
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'actions'}
            onClick={() => setTab('actions')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors inline-flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              tab === 'actions'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FlaskConical className="w-3.5 h-3.5" aria-hidden="true" />
            Ronda {state.currentRound}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'genes'}
            onClick={() => setTab('genes')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors inline-flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              tab === 'genes'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Dna className="w-3.5 h-3.5" aria-hidden="true" />
            {molecularDetail === 'precision'
              ? `Genes (${visibleLibraryGenes.length})`
              : `Procesos (${visibleLibraryGenes.length})`}
          </button>
        </div>

        {state.teacherConfig.hintsEnabled && tab === 'actions' && (
          <button
            type="button"
            onClick={() => setShowHint((v) => !v)}
            aria-expanded={showHint}
            className="text-xs font-medium text-slate-500 hover:text-slate-900 inline-flex items-center gap-1 cursor-pointer"
          >
            <HelpCircle className="w-3.5 h-3.5" aria-hidden="true" />
            Pista
          </button>
        )}
      </div>

      {/* Scrollable Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {tab === 'actions' ? (
          <>
            {/* Step 1: Biological Barrier / Event */}
            <section className="space-y-1.5">
              <div className="flex items-center gap-2 text-xs font-semibold text-rose-700">
                <ShieldAlert className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>1. {formatBiologyText(round.title, molecularDetail)}</span>
              </div>
              <p className="text-xs text-slate-700 leading-snug">
                {formatBiologyText(round.cancerPrompt, molecularDetail)}
              </p>

              {state.accumulatedProblems.length > 0 && (
                <div className="text-[11px] text-slate-600 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 space-y-0.5">
                  <div className="font-semibold text-slate-800">
                    Problemas acumulados ({state.accumulatedProblems.length})
                  </div>
                  <div className="text-slate-600 leading-snug">
                    {state.accumulatedProblems
                      .map((p) =>
                        molecularDetail === 'precision' ? p.precisionLabel : p.logicLabel
                      )
                      .join(' → ')}
                  </div>
                </div>
              )}
            </section>

            {/* Step 2: Clonal Selection Choice */}
            <section className="space-y-2">
              <span className="block text-xs font-semibold text-slate-900">
                2. Bifurcación celular
              </span>

              <div className="space-y-2">
                {round.cancerStrategies.map((opt) => {
                  const selected = activeStrategy === opt.id;
                  const clone = state.clones.find((c) => c.id === opt.cloneId);
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => {
                        setSelectedStrategy(opt.id);
                        setSelectedPrediction('');
                        setDoorSelectNonce((n) => n + 1);
                      }}
                      className={`w-full text-left p-2.5 rounded-lg border transition-all cursor-pointer ${
                        selected
                          ? 'border-rose-500 bg-rose-50/50 ring-1 ring-rose-500'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-xs font-semibold text-slate-900 leading-snug">
                          {formatBiologyText(opt.label, molecularDetail)}
                        </span>
                        {clone && (
                          <span className="font-mono text-xs font-semibold text-slate-700 tabular-nums shrink-0">
                            {clone.share}%
                          </span>
                        )}
                      </div>
                      <div className="mt-1.5 space-y-0.5 text-[11px] leading-snug">
                        <div className="text-emerald-700">
                          + {formatBiologyText(opt.advantage, molecularDetail)}
                        </div>
                        <div className="text-amber-700">
                          − {formatBiologyText(opt.cost, molecularDetail)}
                        </div>
                      </div>
                      {showHint && (
                        <div className="mt-1.5 pt-1.5 border-t border-slate-200/70 text-[11px] text-sky-700">
                          {formatBiologyText(opt.recommendedContextHint, molecularDetail)}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </section>

            {/* Step 3: Prediction Gate */}
            <section className="space-y-2">
              <span className="block text-xs font-semibold text-slate-900">
                3. Predicción para abrir la puerta
              </span>
              <div className="space-y-1.5">
                {shuffledPredictions.map((pred) => {
                  const selected = activePrediction === pred.id;
                  const rejected = Boolean(activeDoorLock?.rejectedIds.includes(pred.id));
                  return (
                    <button
                      key={pred.id}
                      type="button"
                      onClick={() => setSelectedPrediction(pred.id)}
                      className={`w-full text-left p-2.5 rounded-lg border text-xs transition-colors flex items-start gap-2 cursor-pointer ${
                        selected
                          ? rejected
                            ? 'border-rose-600 bg-rose-50 text-rose-950 font-medium'
                            : 'border-slate-900 bg-slate-900 text-white'
                          : rejected
                            ? 'border-rose-200 bg-rose-50/40 text-rose-800 hover:bg-rose-50'
                            : 'border-slate-200 bg-slate-50 hover:bg-white text-slate-700'
                      }`}
                    >
                      <span
                        className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${
                          rejected
                            ? 'border-rose-400 bg-rose-100 text-rose-700'
                            : selected
                              ? 'border-white bg-white text-slate-900'
                              : 'border-slate-400'
                        }`}
                      >
                        {rejected ? (
                          <Lock className="w-2.5 h-2.5" aria-hidden="true" />
                        ) : (
                          selected && <Check className="w-2.5 h-2.5" aria-hidden="true" />
                        )}
                      </span>
                      <span className="leading-snug">
                        {formatBiologyText(pred.label, molecularDetail)}
                      </span>
                    </button>
                  );
                })}
              </div>

              {activeDoorLock && (
                <div
                  role="alert"
                  data-testid="door-locked-alert"
                  className="p-2.5 rounded-lg border border-rose-300 bg-rose-50 text-xs text-rose-950 space-y-1"
                >
                  <div className="font-semibold text-rose-900 inline-flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 shrink-0 text-rose-600" aria-hidden="true" />
                    <span>Puerta bloqueada</span>
                  </div>
                  <p className="text-[11px] text-rose-900/90 leading-snug">
                    {activeDoorLock.feedback}
                  </p>
                </div>
              )}
            </section>
          </>
        ) : (
          /* Compact Process / Gene Library Tab */
          <div className="space-y-2.5">
            {visibleLibraryGenes.map((gene) => (
              <div
                key={gene.symbol}
                className="p-2.5 rounded-lg border border-slate-200 bg-slate-50/50 space-y-1"
              >
                <div className="flex items-baseline justify-between gap-2">
                  <span
                    className={`text-xs font-bold text-slate-900 ${
                      molecularDetail === 'precision' ? 'font-mono' : ''
                    }`}
                  >
                    {getGeneDisplayTitle(gene, molecularDetail)}
                  </span>
                  <span className="text-[10px] text-slate-500">
                    {formatBiologyText(gene.pathway, molecularDetail)}
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 leading-snug">
                  {formatBiologyText(gene.normalFunction, molecularDetail)}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Primary Action Footer */}
      {tab === 'actions' && (
        <div className="p-4 border-t border-slate-200 bg-slate-50/60">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canResolve}
            className="w-full py-2.5 px-4 rounded-lg text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 disabled:bg-slate-300 disabled:text-slate-500 transition-colors inline-flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Abrir puerta · Ronda {state.currentRound}</span>
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      )}
    </aside>
  );
};
