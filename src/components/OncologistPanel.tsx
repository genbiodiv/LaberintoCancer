import React, { useEffect, useState } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  Eye,
  Lightbulb,
  Microscope,
  SkipForward,
  Stethoscope,
} from 'lucide-react';
import { DIAGNOSTIC_TOOLS, getTherapyById } from '../engine/knowledgeBase';
import {
  describeCurrentSituationSimple,
  formatBiologyText,
  getDiagnosticDisplayInfo,
  getOncologistFindingsSummary,
  getOncologistStageInfo,
  getTherapyDisplayInfo,
} from '../engine/molecularAbstraction';
import {
  getActiveRoundOffer,
  getOncologistRoundPhase,
} from '../engine/progressionEngine';
import {
  DiagnosticToolId,
  MolecularDetailMode,
  SimulationState,
  TherapyId,
} from '../engine/types';

interface OncologistPanelProps {
  state: SimulationState;
  molecularDetail: MolecularDetailMode;
  onResolveDiagnostic: (toolId: DiagnosticToolId) => void;
  onResolveIntervention: (therapyId: TherapyId) => void;
  onResolveObservation: () => void;
}

export const OncologistPanel: React.FC<OncologistPanelProps> = ({
  state,
  molecularDetail,
  onResolveDiagnostic,
  onResolveIntervention,
  onResolveObservation,
}) => {
  const round = getActiveRoundOffer(state);
  const phase = round.oncologistPhase ?? getOncologistRoundPhase(state.currentRound);
  const [selectedDiagnosticId, setSelectedDiagnosticId] = useState<DiagnosticToolId | ''>('');
  const [selectedTherapyId, setSelectedTherapyId] = useState<TherapyId | ''>('');

  useEffect(() => {
    setSelectedDiagnosticId('');
    setSelectedTherapyId('');
  }, [state.currentRound, state.runId]);

  const fmt = (text: string) => formatBiologyText(text, molecularDetail);
  const isSimple = molecularDetail === 'simple';
  const stageInfo = getOncologistStageInfo(state.oncologistStartStage ?? 'early', molecularDetail);
  const findings = getOncologistFindingsSummary(state, molecularDetail);

  if (state.finished) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 flex flex-col justify-center items-center text-center h-full">
        <p className="text-sm font-semibold text-slate-900 dark:text-white">Recorrido finalizado</p>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Consulta el informe final para revisar cómo respondieron las células a tus decisiones.
        </p>
      </div>
    );
  }

  const offeredDiagnostics = (
    round.oncologistDoorDiagnostics ?? ['imaging', 'biopsy', 'molecular_profile']
  )
    .map((id) => DIAGNOSTIC_TOOLS.find((t) => t.id === id))
    .filter((t): t is (typeof DIAGNOSTIC_TOOLS)[number] => Boolean(t));

  const offeredTherapies = (round.oncologistDoorTherapies ?? [])
    .map((id) => getTherapyById(id))
    .filter((t): t is NonNullable<ReturnType<typeof getTherapyById>> => Boolean(t));

  const isDiagnosticPhase = phase === 'diagnostic';
  const canConfirm = isDiagnosticPhase
    ? Boolean(selectedDiagnosticId)
    : Boolean(selectedTherapyId);

  const handleConfirm = () => {
    if (isDiagnosticPhase && selectedDiagnosticId) {
      onResolveDiagnostic(selectedDiagnosticId);
    } else if (!isDiagnosticPhase && selectedTherapyId) {
      onResolveIntervention(selectedTherapyId);
    }
  };

  return (
    <div
      data-testid="oncologist-panel"
      data-oncologist-phase={phase}
      data-oncologist-stage={state.oncologistStartStage ?? 'early'}
      className="flex flex-col h-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden"
    >
      {/* Clean Alternating Phase Header */}
      <div className="px-4 py-3.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60 space-y-2">
        <div className="flex items-center justify-between gap-2 text-xs font-mono">
          <span
            className={`font-semibold inline-flex items-center gap-1.5 ${
              isDiagnosticPhase
                ? 'text-cyan-700 dark:text-cyan-400'
                : 'text-sky-700 dark:text-sky-400'
            }`}
          >
            {isDiagnosticPhase ? (
              <Microscope className="w-3.5 h-3.5" aria-hidden="true" />
            ) : (
              <Stethoscope className="w-3.5 h-3.5" aria-hidden="true" />
            )}
            <span>
              Ronda {state.currentRound} · {isDiagnosticPhase ? 'Diagnóstico' : 'Intervención'}
            </span>
          </span>
          <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
            {stageInfo.label}
          </span>
        </div>

        <h2 className="text-sm font-bold text-slate-900 dark:text-white leading-snug">
          {isDiagnosticPhase
            ? isSimple
              ? 'Elige un estudio para conocer el tumor'
              : 'Elige un estudio diagnóstico'
            : isSimple
              ? 'Elige cómo tratar al paciente'
              : 'Elige una intervención clínica'}
        </h2>
        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
          {fmt(round.oncologistPrompt)}
        </p>

        {isSimple && (
          <div
            data-testid="simple-situation-callout"
            className="rounded-lg border border-emerald-200 dark:border-emerald-800/70 bg-emerald-50/70 dark:bg-emerald-950/40 px-2.5 py-2 text-[11px] text-emerald-950 dark:text-emerald-200 leading-snug flex items-start gap-2"
          >
            <Lightbulb
              className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5"
              aria-hidden="true"
            />
            <span>{describeCurrentSituationSimple(state)}</span>
          </div>
        )}

        {/* Compact Clinical Snapshot Line */}
        <div className="pt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-mono text-slate-500 dark:text-slate-400 border-t border-slate-200/70 dark:border-slate-800">
          <span>
            {isSimple ? 'Ubicación:' : 'Extensión:'}{' '}
            <strong className="text-slate-800 dark:text-slate-100">
              {state.revealedExtent
                ? isSimple
                  ? state.clinical.diseaseExtent === 'localizada'
                    ? 'en un solo lugar'
                    : state.clinical.diseaseExtent === 'regional'
                      ? 'zona cercana'
                      : 'extendido'
                  : state.clinical.diseaseExtent
                : 'Sin definir'}
            </strong>
          </span>
          <span>
            Estudios:{' '}
            <strong className="text-slate-800 dark:text-slate-100 tabular-nums">
              {state.completedDiagnostics.length}
            </strong>
          </span>
          <span>
            {isSimple ? 'Desgaste:' : 'Toxicidad:'}{' '}
            <strong className="text-slate-800 dark:text-slate-100 tabular-nums">
              {state.clinical.cumulativeToxicity}/100
            </strong>
          </span>
        </div>
      </div>

      {/* Main Decision Cards */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {/* Known Findings Summary (always separates what is known vs what remains to discover) */}
        <div
          data-testid="oncologist-known-findings"
          className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/50 p-3 space-y-1.5"
        >
          <div className="text-[11px] font-semibold text-slate-800 dark:text-slate-100">
            Lo que ya sabes
          </div>
          <ul className="space-y-1 text-[11px] text-slate-600 dark:text-slate-300 leading-snug">
            {findings.items.map((item) => (
              <li key={item.label}>
                <strong className="text-slate-800 dark:text-slate-100">{item.label}:</strong>{' '}
                {item.value}
              </li>
            ))}
          </ul>
          {!isDiagnosticPhase && (
            <div
              data-testid="oncologist-intervention-guidance"
              className="mt-2 pt-2 border-t border-slate-200/80 dark:border-slate-700 text-[11px] text-sky-900 dark:text-sky-200 leading-snug"
            >
              <strong className="text-sky-800 dark:text-sky-300">
                Cómo orienta tu decisión:
              </strong>{' '}
              {findings.interventionGuidance}
            </div>
          )}
        </div>

        <div className="space-y-2.5">
          {isDiagnosticPhase ? (
            <>
              {offeredDiagnostics.map((tool) => {
                const isSelected = selectedDiagnosticId === tool.id;
                const doneBefore = state.completedDiagnostics.includes(tool.id);
                const diag = getDiagnosticDisplayInfo(tool, molecularDetail);
                return (
                  <button
                    key={tool.id}
                    type="button"
                    data-testid={`diag-option-${tool.id}`}
                    onClick={() => setSelectedDiagnosticId(tool.id)}
                    className={`w-full text-left p-3.5 rounded-lg border transition-all duration-150 cursor-pointer space-y-1.5 ${
                      isSelected
                        ? 'border-cyan-600 dark:border-cyan-400 bg-cyan-50/50 dark:bg-cyan-950/50 ring-1 ring-cyan-600 dark:ring-cyan-400'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/70 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-xs font-semibold text-slate-900 dark:text-white leading-snug">
                        {diag.name}
                      </span>
                      {doneBefore && (
                        <span className="text-[11px] font-medium text-emerald-700 dark:text-emerald-400 inline-flex items-center gap-1 shrink-0">
                          <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                          Realizado
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      {diag.summary}
                    </p>
                  </button>
                );
              })}
            </>
          ) : (
            <>
              {offeredTherapies.map((therapy) => {
                const isSelected = selectedTherapyId === therapy.id;
                const info = getTherapyDisplayInfo(therapy, molecularDetail);
                const toxLabel = isSimple
                  ? therapy.toxicityDelta <= 0
                    ? 'Alivia desgaste'
                    : `Desgaste +${therapy.toxicityDelta}`
                  : therapy.toxicityDelta < 0
                    ? `Toxicidad ${therapy.toxicityDelta}`
                    : `Toxicidad +${therapy.toxicityDelta}`;
                return (
                  <button
                    key={therapy.id}
                    type="button"
                    data-testid={`therapy-option-${therapy.id}`}
                    onClick={() => setSelectedTherapyId(therapy.id)}
                    className={`w-full text-left p-3.5 rounded-lg border transition-all duration-150 cursor-pointer space-y-1.5 ${
                      isSelected
                        ? 'border-sky-600 dark:border-sky-400 bg-sky-50/50 dark:bg-sky-950/50 ring-1 ring-sky-600 dark:ring-sky-400'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/70 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="text-xs font-semibold text-slate-900 dark:text-white leading-snug">
                        {info.name}
                      </span>
                      <span
                        className={`text-[11px] font-mono shrink-0 ${
                          therapy.toxicityDelta <= 0
                            ? 'text-emerald-700 dark:text-emerald-400'
                            : therapy.toxicityDelta >= 24
                              ? 'text-rose-600 dark:text-rose-400'
                              : 'text-slate-500 dark:text-slate-400'
                        }`}
                      >
                        {toxLabel}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                      {info.mechanism}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                      <strong className="text-slate-700 dark:text-slate-200">
                        {isSimple ? 'Qué esperar:' : 'Efecto esperado:'}
                      </strong>{' '}
                      {info.cloneEffectsSummary}
                    </p>
                  </button>
                );
              })}
            </>
          )}
        </div>
      </div>

      {/* Action Footer: Primary Decision + Always-Available Observation Skip */}
      <div className="p-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60 space-y-2">
        <button
          type="button"
          data-testid="oncologist-confirm-btn"
          disabled={!canConfirm}
          onClick={handleConfirm}
          className={`w-full py-2.5 px-4 rounded-lg text-xs font-semibold inline-flex items-center justify-center gap-2 transition-colors ${
            canConfirm
              ? isDiagnosticPhase
                ? 'bg-cyan-700 hover:bg-cyan-600 dark:bg-cyan-600 dark:hover:bg-cyan-500 text-white cursor-pointer'
                : 'bg-sky-700 hover:bg-sky-600 dark:bg-sky-600 dark:hover:bg-sky-500 text-white cursor-pointer'
              : 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed'
          }`}
        >
          <span>
            {isDiagnosticPhase
              ? isSimple
                ? 'Hacer este estudio'
                : 'Realizar el estudio'
              : isSimple
                ? 'Aplicar este tratamiento'
                : 'Aplicar intervención'}
          </span>
          <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
        </button>

        <button
          type="button"
          data-testid="oncologist-observe-btn"
          onClick={onResolveObservation}
          className="w-full py-2 px-3 rounded-lg text-xs font-semibold text-emerald-800 dark:text-emerald-300 bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-700/80 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
        >
          <Eye className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
          <span>
            {isSimple ? 'Solo observar y descansar (saltar ronda)' : 'Observación (saltar esta ronda)'}
          </span>
          <SkipForward className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
};
