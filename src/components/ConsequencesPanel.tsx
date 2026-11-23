import React, { useMemo } from 'react';
import { Activity, Flag, HeartPulse, Shield, UserCheck } from 'lucide-react';
import { computeDestinationProgress } from '../engine/destinationMetrics';
import { MolecularDetailMode, SimulationState } from '../engine/types';
import { HallmarksWheel } from './HallmarksWheel';

interface ConsequencesPanelProps {
  state: SimulationState;
  molecularDetail: MolecularDetailMode;
}

const CONTROL_LABELS: Record<SimulationState['clinical']['diseaseControl'], { label: string; color: string }> = {
  remision: { label: '● Remisión simulada', color: 'text-emerald-700' },
  control_sostenido: { label: '● Control sostenido', color: 'text-emerald-700' },
  estable: { label: '◆ Enfermedad estable', color: 'text-sky-700' },
  progresion: { label: '▲ En progresión', color: 'text-amber-700' },
  critico: { label: '✕ Estado crítico', color: 'text-rose-700' },
};

const MetricBar: React.FC<{
  label: string;
  value: number;
  tone: 'neutral' | 'good' | 'warn' | 'danger';
  suffix?: string;
}> = ({ label, value, tone, suffix = '/100' }) => {
  const barColor =
    tone === 'good'
      ? 'bg-emerald-600'
      : tone === 'warn'
        ? 'bg-amber-500'
        : tone === 'danger'
          ? 'bg-rose-600'
          : 'bg-sky-600';
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-slate-600">{label}</span>
        <span className="font-mono font-semibold text-slate-900 tabular-nums">
          {value}
          <span className="text-[10px] text-slate-400 font-normal">{suffix}</span>
        </span>
      </div>
      <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div
          className={`h-full ${barColor} rounded-full transition-all duration-300`}
          style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        />
      </div>
    </div>
  );
};

export const ConsequencesPanel: React.FC<ConsequencesPanelProps> = ({
  state,
  molecularDetail,
}) => {
  const { clinical, defenses, mode } = state;
  const controlInfo = CONTROL_LABELS[clinical.diseaseControl];
  const destination = useMemo(() => computeDestinationProgress(state), [state]);

  return (
    <aside
      aria-label="Consecuencias biológicas y estado clínico"
      className="bg-white border border-slate-200 rounded-xl flex flex-col h-full overflow-hidden"
    >
      <div className="px-4 py-2.5 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-900 inline-flex items-center gap-1.5">
          {mode === 'cancer' ? (
            <>
              <Activity className="w-3.5 h-3.5 text-rose-600" aria-hidden="true" />
              Destino y barreras
            </>
          ) : (
            <>
              <HeartPulse className="w-3.5 h-3.5 text-sky-600" aria-hidden="true" />
              Destino clínico
            </>
          )}
        </span>
        <span className={`text-[11px] font-semibold ${controlInfo.color}`}>
          {controlInfo.label}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {/* Destination Proximity Card */}
        <section className="rounded-lg border border-slate-200 bg-slate-50/80 p-3 space-y-2">
          <div className="flex items-center justify-between gap-2 text-xs">
            <span className="font-semibold text-slate-900 inline-flex items-center gap-1.5">
              <Flag
                className={`w-3.5 h-3.5 shrink-0 ${
                  mode === 'cancer' ? 'text-rose-600' : 'text-sky-600'
                }`}
                aria-hidden="true"
              />
              {destination.stageLabel}
            </span>
            <span className="font-mono font-bold text-slate-900 tabular-nums">
              {destination.progress}%
            </span>
          </div>
          <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                mode === 'cancer'
                  ? destination.stage >= 2
                    ? 'bg-amber-500'
                    : 'bg-rose-600'
                  : destination.stage >= 2
                    ? 'bg-emerald-600'
                    : 'bg-sky-600'
              }`}
              style={{ width: `${destination.progress}%` }}
            />
          </div>
          <div className="text-[11px] text-slate-500">
            {mode === 'cancer' ? 'Meta: 100% de cáncer' : 'Meta: 100% de liberación'}
          </div>
        </section>

        {/* Clinical / Host Status Section */}
        <section className="space-y-3">
          {mode === 'oncologist' ? (
            <>
              <div className="flex items-center justify-between text-xs text-slate-600">
                <span className="inline-flex items-center gap-1.5 font-semibold text-slate-900">
                  <UserCheck className="w-3.5 h-3.5 text-sky-600" aria-hidden="true" />
                  Indicadores clínicos
                </span>
                <span className="font-mono text-[11px] text-slate-500">
                  {state.revealedExtent ? `Extensión: ${clinical.diseaseExtent}` : 'Extensión: sin estudio'}
                </span>
              </div>

              <MetricBar
                label="Carga tumoral"
                value={clinical.tumorBurden}
                tone={
                  clinical.tumorBurden >= 65
                    ? 'danger'
                    : clinical.tumorBurden >= 40
                      ? 'warn'
                      : 'good'
                }
              />
              <MetricBar
                label="Estado funcional"
                value={clinical.functionalStatus}
                tone={
                  clinical.functionalStatus >= 65
                    ? 'good'
                    : clinical.functionalStatus >= 40
                      ? 'warn'
                      : 'danger'
                }
              />
              <MetricBar
                label="Calidad de vida"
                value={clinical.qualityOfLife}
                tone={
                  clinical.qualityOfLife >= 65
                    ? 'good'
                    : clinical.qualityOfLife >= 40
                      ? 'warn'
                      : 'danger'
                }
              />
              <MetricBar
                label="Toxicidad acumulada"
                value={clinical.cumulativeToxicity}
                tone={
                  clinical.cumulativeToxicity >= 60
                    ? 'danger'
                    : clinical.cumulativeToxicity >= 35
                      ? 'warn'
                      : 'neutral'
                }
              />
            </>
          ) : (
            <>
              <div className="flex items-center justify-between gap-2 text-xs">
                <span className="inline-flex items-center gap-1.5 font-semibold text-slate-900 whitespace-nowrap">
                  <Shield className="w-3.5 h-3.5 text-rose-600 shrink-0" aria-hidden="true" />
                  Defensas del organismo
                </span>
                <span className="font-mono text-[11px] text-slate-500 tabular-nums whitespace-nowrap shrink-0">
                  Carga {clinical.tumorBurden}/100
                </span>
              </div>

              <MetricBar
                label="Puntos de control del ciclo"
                value={defenses.cellCycleCheckpoint}
                tone={defenses.cellCycleCheckpoint >= 60 ? 'good' : 'warn'}
              />
              <MetricBar
                label={
                  molecularDetail === 'precision'
                    ? 'Reparación ADN y TP53'
                    : 'Reparación ADN y guardián genómico'
                }
                value={defenses.dnaRepair}
                tone={defenses.dnaRepair >= 60 ? 'good' : 'warn'}
              />
              <MetricBar
                label="Capacidad apoptótica"
                value={defenses.apoptosisCapacity}
                tone={defenses.apoptosisCapacity >= 60 ? 'good' : 'warn'}
              />
              <MetricBar
                label="Vigilancia inmunológica"
                value={defenses.immuneSurveillance}
                tone={defenses.immuneSurveillance >= 60 ? 'good' : 'warn'}
              />
              <MetricBar
                label="Disponibilidad de O₂ y nutrientes"
                value={defenses.nutrientSupply}
                tone={defenses.nutrientSupply >= 50 ? 'neutral' : 'danger'}
              />
            </>
          )}
        </section>

        {/* Interactive 9-Hallmarks Circular Wheel */}
        <section className="pt-4 border-t border-slate-200">
          <HallmarksWheel
            hallmarkScores={state.hallmarkScores}
            enablingScores={state.enablingScores}
            accentMode={mode}
            molecularDetail={molecularDetail}
          />
        </section>
      </div>
    </aside>
  );
};
