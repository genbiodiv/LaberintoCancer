import React, { useMemo, useState } from 'react';
import {
  ArrowRight,
  BrainCircuit,
  Check,
  CheckCircle2,
  ClipboardList,
  Info,
  Lock,
  Microscope,
  Pill,
} from 'lucide-react';
import { DIAGNOSTIC_TOOLS, THERAPIES_CATALOG } from '../engine/knowledgeBase';
import {
  formatBiologyText,
  getModelFieldOptions,
  getTherapyDisplayName,
} from '../engine/molecularAbstraction';
import {
  getActiveRoundOffer,
  shuffleRandom,
  UNIFIED_CLINICAL_VIGNETTE,
} from '../engine/progressionEngine';
import { evaluatePredictionGate } from '../engine/simulator';
import {
  DiagnosticToolId,
  MolecularDetailMode,
  SimulationState,
  TherapyId,
} from '../engine/types';

interface OncologistPanelProps {
  state: SimulationState;
  molecularDetail: MolecularDetailMode;
  onRunDiagnostic: (toolId: DiagnosticToolId) => string | null;
  onSubmitModel: (draft: {
    primaryDriver: string;
    weakenedControl: string;
    intactControl: string;
    exploitableVulnerability: string;
  }) => void;
  onResolveTurn: (therapyId: TherapyId, predictionId: string) => void;
}

export const OncologistPanel: React.FC<OncologistPanelProps> = ({
  state,
  molecularDetail,
  onRunDiagnostic,
  onSubmitModel,
  onResolveTurn,
}) => {
  const round = useMemo(() => getActiveRoundOffer(state), [state]);
  const modelOptions = useMemo(() => getModelFieldOptions(molecularDetail), [molecularDetail]);

  const [phaseTab, setPhaseTab] = useState<'investigate' | 'model' | 'treat'>('investigate');
  const [diagBanner, setDiagBanner] = useState<string | null>(null);
  const [selectedTherapy, setSelectedTherapy] = useState<TherapyId | ''>('');
  const [doorSelectNonce, setDoorSelectNonce] = useState<number>(0);
  const [selectedPrediction, setSelectedPrediction] = useState<string>('');
  const [expandedTherapyInfo, setExpandedTherapyInfo] = useState<TherapyId | null>(null);
  const [doorLockState, setDoorLockState] = useState<{
    key: string;
    feedback: string;
    rejectedIds: string[];
  } | null>(null);

  // Phase 2 Model Draft
  const [driver, setDriver] = useState(state.cellModel.primaryDriver);
  const [weakened, setWeakened] = useState(state.cellModel.weakenedControl);
  const [intact, setIntact] = useState(state.cellModel.intactControl);
  const [vuln, setVuln] = useState(state.cellModel.exploitableVulnerability);

  const activePrediction = useMemo(() => {
    if (round.oncologistPredictions.some((p) => p.id === selectedPrediction))
      return selectedPrediction;
    return '';
  }, [round, selectedPrediction]);

  // Randomize therapy list order each round and prediction order at every therapy selection
  const shuffledTherapies = useMemo(() => {
    void state.runId;
    void state.currentRound;
    return shuffleRandom(THERAPIES_CATALOG);
  }, [state.runId, state.currentRound]);

  const shuffledPredictions = useMemo(() => {
    void doorSelectNonce;
    void selectedTherapy;
    return shuffleRandom(round.oncologistPredictions);
  }, [round, selectedTherapy, doorSelectNonce]);

  const handleDiagnostic = (toolId: DiagnosticToolId) => {
    const msg = onRunDiagnostic(toolId);
    if (msg) setDiagBanner(msg);
  };

  const handleSaveModel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!driver || !weakened || !intact || !vuln) return;
    onSubmitModel({
      primaryDriver: driver,
      weakenedControl: weakened,
      intactControl: intact,
      exploitableVulnerability: vuln,
    });
  };

  const canResolve = Boolean(selectedTherapy && activePrediction);
  const currentLockKey = `${state.currentRound}:${selectedTherapy}`;
  const activeDoorLock = doorLockState?.key === currentLockKey ? doorLockState : null;

  const handleTreat = () => {
    if (!canResolve || !selectedTherapy) return;
    const gate = evaluatePredictionGate(state, selectedTherapy, activePrediction);
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
    onResolveTurn(selectedTherapy, activePrediction);
    setDoorLockState(null);
    setSelectedTherapy('');
    setSelectedPrediction('');
    setExpandedTherapyInfo(null);
  };

  return (
    <aside
      aria-label="Panel clínico de diagnóstico y tratamiento"
      className="bg-white border border-slate-200 rounded-xl flex flex-col h-full overflow-hidden"
    >
      {/* Workflow Stepper Tabs */}
      <div className="px-3 py-2.5 border-b border-slate-200 bg-slate-50/70">
        <div
          role="tablist"
          aria-label="Fases clínicas del oncólogo"
          className="grid grid-cols-3 gap-1 p-0.5 bg-slate-200/70 rounded-lg"
        >
          <button
            type="button"
            role="tab"
            aria-selected={phaseTab === 'investigate'}
            onClick={() => setPhaseTab('investigate')}
            className={`px-2 py-1.5 text-[11px] font-semibold rounded-md transition-colors inline-flex items-center justify-center gap-1 whitespace-nowrap cursor-pointer ${
              phaseTab === 'investigate'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Microscope className="w-3.5 h-3.5" aria-hidden="true" />
            1. Investigar
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={phaseTab === 'model'}
            onClick={() => setPhaseTab('model')}
            className={`px-2 py-1.5 text-[11px] font-semibold rounded-md transition-colors inline-flex items-center justify-center gap-1 whitespace-nowrap cursor-pointer ${
              phaseTab === 'model'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BrainCircuit className="w-3.5 h-3.5" aria-hidden="true" />
            2. Modelo
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={phaseTab === 'treat'}
            onClick={() => setPhaseTab('treat')}
            className={`px-2 py-1.5 text-[11px] font-semibold rounded-md transition-colors inline-flex items-center justify-center gap-1 whitespace-nowrap cursor-pointer ${
              phaseTab === 'treat'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Pill className="w-3.5 h-3.5" aria-hidden="true" />
            3. Tratar
          </button>
        </div>
      </div>

      {/* Scrollable Phase Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Clinical Context Prompt */}
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-1">
          <div className="flex items-center justify-between text-[11px] text-slate-500">
            <span className="font-semibold text-sky-800 inline-flex items-center gap-1">
              <ClipboardList className="w-3.5 h-3.5" aria-hidden="true" />
              Ronda {state.currentRound} · {formatBiologyText(round.title, molecularDetail)}
            </span>
          </div>
          <p className="text-xs text-slate-700 leading-relaxed">
            {formatBiologyText(
              state.currentRound === 1 ? UNIFIED_CLINICAL_VIGNETTE : round.oncologistPrompt,
              molecularDetail
            )}
          </p>
        </div>

        {/* PHASE 1: INVESTIGATE */}
        {phaseTab === 'investigate' && (
          <div className="space-y-3">
            <div className="flex items-baseline justify-between">
              <span className="text-xs font-semibold text-slate-900">
                Herramientas diagnósticas
              </span>
              <span className="text-xs font-mono text-sky-700 font-semibold tabular-nums">
                Recursos: {state.diagnosticBudget}/{state.maxDiagnosticBudget}
              </span>
            </div>

            {diagBanner && (
              <div className="text-xs text-sky-900 bg-sky-50 border border-sky-200 rounded-lg p-2.5 leading-relaxed">
                {formatBiologyText(diagBanner, molecularDetail)}
              </div>
            )}

            <div className="space-y-2">
              {DIAGNOSTIC_TOOLS.map((tool) => {
                const done =
                  state.completedDiagnostics.includes(tool.id) &&
                  tool.id !== 'response_monitoring';
                const unaffordable = state.diagnosticBudget < tool.cost;
                return (
                  <button
                    key={tool.id}
                    type="button"
                    disabled={done || unaffordable}
                    onClick={() => handleDiagnostic(tool.id)}
                    className={`w-full text-left p-3 rounded-lg border transition-colors cursor-pointer ${
                      done
                        ? 'border-emerald-200 bg-emerald-50/50 text-slate-700 cursor-default'
                        : unaffordable
                          ? 'border-slate-200 bg-slate-50 text-slate-400 cursor-not-allowed'
                          : 'border-slate-200 bg-white hover:border-sky-400'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-slate-900 inline-flex items-center gap-1.5">
                        {done && (
                          <CheckCircle2
                            className="w-3.5 h-3.5 text-emerald-600 shrink-0"
                            aria-hidden="true"
                          />
                        )}
                        {formatBiologyText(tool.name, molecularDetail)}
                      </span>
                      <span className="font-mono text-[11px] text-slate-500 tabular-nums shrink-0">
                        {done ? 'Realizado' : `Costo ${tool.cost}`}
                      </span>
                    </div>
                    <p className="mt-1 text-[11px] text-slate-600 leading-snug">
                      {formatBiologyText(tool.summary, molecularDetail)}
                    </p>
                  </button>
                );
              })}
            </div>

            <div className="pt-1 flex justify-end">
              <button
                type="button"
                onClick={() => setPhaseTab('model')}
                className="text-xs font-semibold text-sky-700 hover:text-sky-900 inline-flex items-center gap-1 cursor-pointer"
              >
                Construir modelo celular
                <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
            </div>
          </div>
        )}

        {/* PHASE 2: BUILD MOLECULAR MODEL */}
        {phaseTab === 'model' && (
          <form onSubmit={handleSaveModel} className="space-y-3">
            <div>
              <label
                htmlFor="model-driver"
                className="block text-[11px] font-semibold text-slate-700 mb-1"
              >
                1. Impulsor proliferativo
              </label>
              <select
                id="model-driver"
                value={driver}
                onChange={(e) => setDriver(e.target.value)}
                className="w-full h-9 px-2.5 rounded-lg border border-slate-200 bg-slate-50 text-xs text-slate-900"
              >
                <option value="">
                  {molecularDetail === 'precision' ? 'Seleccionar gen…' : 'Seleccionar proceso…'}
                </option>
                {modelOptions.drivers.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="model-weakened"
                className="block text-[11px] font-semibold text-slate-700 mb-1"
              >
                2. Control debilitado
              </label>
              <select
                id="model-weakened"
                value={weakened}
                onChange={(e) => setWeakened(e.target.value)}
                className="w-full h-9 px-2.5 rounded-lg border border-slate-200 bg-slate-50 text-xs text-slate-900"
              >
                <option value="">Seleccionar freno…</option>
                {modelOptions.weakened.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="model-intact"
                className="block text-[11px] font-semibold text-slate-700 mb-1"
              >
                3. Control funcional
              </label>
              <select
                id="model-intact"
                value={intact}
                onChange={(e) => setIntact(e.target.value)}
                className="w-full h-9 px-2.5 rounded-lg border border-slate-200 bg-slate-50 text-xs text-slate-900"
              >
                <option value="">Seleccionar control…</option>
                {modelOptions.intact.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="model-vuln"
                className="block text-[11px] font-semibold text-slate-700 mb-1"
              >
                4. Vulnerabilidad
              </label>
              <select
                id="model-vuln"
                value={vuln}
                onChange={(e) => setVuln(e.target.value)}
                className="w-full h-9 px-2.5 rounded-lg border border-slate-200 bg-slate-50 text-xs text-slate-900"
              >
                <option value="">Seleccionar vulnerabilidad…</option>
                {modelOptions.vulnerabilities.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-between gap-2 pt-1">
              <button
                type="submit"
                disabled={!driver || !weakened || !intact || !vuln}
                className="px-3.5 py-2 rounded-lg text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800 disabled:bg-slate-300 disabled:text-slate-500 transition-colors cursor-pointer"
              >
                Validar modelo
              </button>
              <button
                type="button"
                onClick={() => setPhaseTab('treat')}
                className="text-xs font-semibold text-sky-700 hover:text-sky-900 inline-flex items-center gap-1 cursor-pointer"
              >
                Tratar
                <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
            </div>

            {state.cellModel.submitted && (
              <div className="p-2.5 rounded-lg border border-emerald-200 bg-emerald-50 text-xs text-emerald-900">
                Concordancia:{' '}
                <strong className="font-mono tabular-nums">{state.cellModel.accuracyScore}%</strong>
              </div>
            )}
          </form>
        )}

        {/* PHASE 3: TREAT & PREDICT */}
        {phaseTab === 'treat' && (
          <div className="space-y-4">
            <section className="space-y-2">
              <span className="block text-xs font-semibold text-slate-900">
                Intervención clínica
              </span>

              <div className="space-y-1.5">
                {shuffledTherapies.map((th) => {
                  const selected = selectedTherapy === th.id;
                  const infoOpen = expandedTherapyInfo === th.id;
                  const toxLabel =
                    th.toxicityDelta < 0 ? `Tox ${th.toxicityDelta}` : `Tox +${th.toxicityDelta}`;
                  return (
                    <div
                      key={th.id}
                      className={`rounded-lg border transition-all ${
                        selected
                          ? 'border-sky-600 bg-sky-50/50 ring-1 ring-sky-600'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className="p-2.5 flex items-center justify-between gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedTherapy(th.id);
                            setSelectedPrediction('');
                            setDoorSelectNonce((n) => n + 1);
                          }}
                          className="flex-1 text-left cursor-pointer flex items-baseline justify-between gap-2 min-w-0"
                        >
                          <span className="text-xs font-semibold text-slate-900 truncate">
                            {getTherapyDisplayName(th, molecularDetail)}
                          </span>
                          <span
                            className={`text-[11px] font-mono shrink-0 ${
                              th.toxicityDelta >= 24
                                ? 'text-rose-700 font-medium'
                                : th.toxicityDelta < 0
                                  ? 'text-emerald-700 font-medium'
                                  : 'text-slate-500'
                            }`}
                          >
                            {toxLabel}
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setExpandedTherapyInfo(infoOpen ? null : th.id)}
                          aria-label={`Detalles de ${getTherapyDisplayName(th, molecularDetail)}`}
                          aria-expanded={infoOpen}
                          className="p-1 text-slate-400 hover:text-sky-700 rounded cursor-pointer shrink-0"
                        >
                          <Info className="w-4 h-4" />
                        </button>
                      </div>

                      {infoOpen && (
                        <div className="px-3 pb-2.5 pt-2 border-t border-slate-100 text-[11px] text-slate-600 space-y-1">
                          <p>{formatBiologyText(th.mechanism, molecularDetail)}</p>
                          <p className="text-slate-500">
                            {formatBiologyText(th.applicability, molecularDetail)}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Prediction Gate */}
            <section className="space-y-2">
              <span className="block text-xs font-semibold text-slate-900">
                Predicción para abrir la puerta
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
          </div>
        )}
      </div>

      {/* Footer CTA for Treatment Phase */}
      {phaseTab === 'treat' && (
        <div className="p-4 border-t border-slate-200 bg-slate-50/60">
          <button
            type="button"
            onClick={handleTreat}
            disabled={!canResolve}
            className="w-full py-2.5 px-4 rounded-lg text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 disabled:bg-slate-300 disabled:text-slate-500 transition-colors inline-flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Abrir puerta y tratar · Ronda {state.currentRound}</span>
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      )}
    </aside>
  );
};
