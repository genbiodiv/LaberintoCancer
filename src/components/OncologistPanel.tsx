import React, { useEffect, useState } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  Eye,
  Microscope,
  SkipForward,
  Stethoscope,
} from 'lucide-react';
import { DIAGNOSTIC_TOOLS, getTherapyById } from '../engine/knowledgeBase';
import {
  formatBiologyText,
  getTherapyDisplayName,
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

  if (state.finished) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col justify-center items-center text-center h-full">
        <p className="text-sm font-semibold text-slate-900">Recorrido finalizado</p>
        <p className="text-xs text-slate-500 mt-1">
          Consulta el informe final para revisar las ramificaciones celulares de tus decisiones.
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
      className="flex flex-col h-full bg-white border border-slate-200 rounded-xl overflow-hidden"
    >
      {/* Clean Alternating Phase Header */}
      <div className="px-4 py-3.5 border-b border-slate-200 bg-slate-50/70 space-y-1.5">
        <div className="flex items-center justify-between gap-2 text-xs font-mono">
          <span
            className={`font-semibold inline-flex items-center gap-1.5 ${
              isDiagnosticPhase ? 'text-cyan-700' : 'text-sky-700'
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
          <span className="text-slate-500 tabular-nums">
            Siguiente: {isDiagnosticPhase ? 'Intervención' : 'Diagnóstico'}
          </span>
        </div>

        <h2 className="text-sm font-bold text-slate-900 leading-snug">
          {isDiagnosticPhase
            ? 'Elige un estudio diagnóstico'
            : 'Elige una intervención clínica'}
        </h2>
        <p className="text-xs text-slate-600 leading-relaxed">
          {fmt(round.oncologistPrompt)}
        </p>

        {/* Compact Clinical Snapshot Line */}
        <div className="pt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-mono text-slate-500 border-t border-slate-200/70">
          <span>
            Extensión:{' '}
            <strong className="text-slate-800">
              {state.revealedExtent ? state.clinical.diseaseExtent : 'Sin definir'}
            </strong>
          </span>
          <span>
            Estudios:{' '}
            <strong className="text-slate-800 tabular-nums">
              {state.completedDiagnostics.length}
            </strong>
          </span>
          <span>
            Efectos sec.:{' '}
            <strong className="text-slate-800 tabular-nums">
              {state.clinical.cumulativeToxicity}%
            </strong>
          </span>
        </div>
      </div>

      {/* Main Decision Cards */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
        {isDiagnosticPhase ? (
          <>
            {offeredDiagnostics.map((tool) => {
              const isSelected = selectedDiagnosticId === tool.id;
              const doneBefore = state.completedDiagnostics.includes(tool.id);
              return (
                <button
                  key={tool.id}
                  type="button"
                  data-testid={`diag-option-${tool.id}`}
                  onClick={() => setSelectedDiagnosticId(tool.id)}
                  className={`w-full text-left p-3.5 rounded-lg border transition-all duration-150 cursor-pointer space-y-1.5 ${
                    isSelected
                      ? 'border-cyan-600 bg-cyan-50/50 ring-1 ring-cyan-600'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-xs font-semibold text-slate-900 leading-snug">
                      {fmt(tool.name)}
                    </span>
                    {doneBefore && (
                      <span className="text-[11px] font-medium text-emerald-700 inline-flex items-center gap-1 shrink-0">
                        <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                        Previo
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    {fmt(tool.summary)}
                  </p>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    <strong className="text-slate-700">Revela:</strong>{' '}
                    {fmt(tool.revealsDescription)}
                  </p>
                </button>
              );
            })}
          </>
        ) : (
          <>
            {offeredTherapies.map((therapy) => {
              const isSelected = selectedTherapyId === therapy.id;
              const toxLabel =
                therapy.toxicityDelta < 0
                  ? `Efectos ${therapy.toxicityDelta}`
                  : `Efectos +${therapy.toxicityDelta}`;
              return (
                <button
                  key={therapy.id}
                  type="button"
                  data-testid={`therapy-option-${therapy.id}`}
                  onClick={() => setSelectedTherapyId(therapy.id)}
                  className={`w-full text-left p-3.5 rounded-lg border transition-all duration-150 cursor-pointer space-y-1.5 ${
                    isSelected
                      ? 'border-sky-600 bg-sky-50/50 ring-1 ring-sky-600'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-xs font-semibold text-slate-900 leading-snug">
                      {getTherapyDisplayName(therapy, molecularDetail)}
                    </span>
                    <span
                      className={`text-[11px] font-mono shrink-0 ${
                        therapy.toxicityDelta <= 0
                          ? 'text-emerald-700'
                          : therapy.toxicityDelta >= 24
                            ? 'text-rose-600'
                            : 'text-slate-500'
                      }`}
                    >
                      {toxLabel}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    {fmt(therapy.mechanism)}
                  </p>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    <strong className="text-slate-700">Efecto celular:</strong>{' '}
                    {fmt(therapy.cloneEffectsSummary)}
                  </p>
                </button>
              );
            })}
          </>
        )}
      </div>

      {/* Action Footer: Primary Decision + Always-Available Observation Skip */}
      <div className="p-3.5 border-t border-slate-200 bg-slate-50/70 space-y-2">
        <button
          type="button"
          data-testid="oncologist-confirm-btn"
          disabled={!canConfirm}
          onClick={handleConfirm}
          className={`w-full py-2.5 px-4 rounded-lg text-xs font-semibold inline-flex items-center justify-center gap-2 transition-colors ${
            canConfirm
              ? isDiagnosticPhase
                ? 'bg-cyan-700 hover:bg-cyan-600 text-white cursor-pointer'
                : 'bg-sky-700 hover:bg-sky-600 text-white cursor-pointer'
              : 'bg-slate-200 text-slate-400 cursor-not-allowed'
          }`}
        >
          <span>
            {isDiagnosticPhase ? 'Realizar diagnóstico' : 'Aplicar intervención'}
          </span>
          <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
        </button>

        <button
          type="button"
          data-testid="oncologist-observe-btn"
          onClick={onResolveObservation}
          className="w-full py-2 px-3 rounded-lg text-xs font-semibold text-emerald-800 bg-white border border-emerald-300 hover:bg-emerald-50 inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
        >
          <Eye className="w-3.5 h-3.5 text-emerald-600" aria-hidden="true" />
          <span>Observación (saltar esta ronda)</span>
          <SkipForward className="w-3.5 h-3.5 text-emerald-600" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
};
