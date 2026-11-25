import React, { useMemo } from 'react';
import { Activity, Flag, HeartPulse, Shield, UserCheck } from 'lucide-react';
import { computeDestinationProgress } from '../engine/destinationMetrics';
import { MolecularDetailMode, SimulationState } from '../engine/types';
import { HallmarksWheel } from './HallmarksWheel';

interface ConsequencesPanelProps {
  state: SimulationState;
  molecularDetail: MolecularDetailMode;
}

const CONTROL_LABELS: Record<
  SimulationState['clinical']['diseaseControl'],
  { label: string; simpleLabel: string; color: string }
> = {
  remision: {
    label: '● Remisión simulada',
    simpleLabel: '● Bajo control',
    color: 'text-emerald-700 dark:text-emerald-400',
  },
  control_sostenido: {
    label: '● Control sostenido',
    simpleLabel: '● Estable y tranquilo',
    color: 'text-emerald-700 dark:text-emerald-400',
  },
  estable: {
    label: '◆ Enfermedad estable',
    simpleLabel: '◆ Sin grandes cambios',
    color: 'text-sky-700 dark:text-sky-400',
  },
  progresion: {
    label: '▲ En progresión',
    simpleLabel: '▲ El tumor crece',
    color: 'text-amber-700 dark:text-amber-400',
  },
  critico: {
    label: '✕ Estado crítico',
    simpleLabel: '✕ Situación delicada',
    color: 'text-rose-700 dark:text-rose-400',
  },
};

const MetricBar: React.FC<{
  label: string;
  value: number;
  tone: 'neutral' | 'good' | 'warn' | 'danger';
  suffix?: string;
}> = ({ label, value, tone, suffix = '/100' }) => {
  const barColor =
    tone === 'good'
      ? 'bg-emerald-600 dark:bg-emerald-500'
      : tone === 'warn'
        ? 'bg-amber-500'
        : tone === 'danger'
          ? 'bg-rose-600 dark:bg-rose-500'
          : 'bg-sky-600 dark:bg-sky-500';
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-slate-600 dark:text-slate-300">{label}</span>
        <span className="font-mono font-semibold text-slate-900 dark:text-white tabular-nums">
          {value}
          <span className="text-[10px] text-slate-400 dark:text-slate-500 font-normal">
            {suffix}
          </span>
        </span>
      </div>
      <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
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
  const isSimple = molecularDetail === 'simple';

  return (
    <aside
      aria-label="Consecuencias biológicas y estado clínico"
      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl flex flex-col h-full overflow-hidden"
    >
      <div className="px-4 py-2.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60 flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-900 dark:text-white inline-flex items-center gap-1.5">
          {mode === 'cancer' ? (
            <>
              <Activity className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" aria-hidden="true" />
              {isSimple ? 'Estado y defensas' : 'Destino y barreras'}
            </>
          ) : (
            <>
              <HeartPulse className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" aria-hidden="true" />
              {isSimple ? 'Estado del paciente' : 'Destino clínico'}
            </>
          )}
        </span>
        <span className={`text-[11px] font-semibold ${controlInfo.color}`}>
          {isSimple ? controlInfo.simpleLabel : controlInfo.label}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {/* Destination Proximity Card */}
        <section className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/60 p-3 space-y-2">
          <div className="flex items-center justify-between gap-2 text-xs">
            <span className="font-semibold text-slate-900 dark:text-white inline-flex items-center gap-1.5">
              <Flag
                className={`w-3.5 h-3.5 shrink-0 ${
                  mode === 'cancer'
                    ? 'text-rose-600 dark:text-rose-400'
                    : 'text-sky-600 dark:text-sky-400'
                }`}
                aria-hidden="true"
              />
              {destination.stageLabel}
            </span>
            <span className="font-mono font-bold text-slate-900 dark:text-white tabular-nums">
              {destination.progress}%
            </span>
          </div>
          <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                mode === 'cancer'
                  ? destination.stage >= 2
                    ? 'bg-amber-500'
                    : 'bg-rose-600 dark:bg-rose-500'
                  : destination.stage >= 2
                    ? 'bg-emerald-600 dark:bg-emerald-500'
                    : 'bg-sky-600 dark:bg-sky-500'
              }`}
              style={{ width: `${destination.progress}%` }}
            />
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400">
            {mode === 'cancer' ? 'Meta: 100% de cáncer' : 'Meta: 100% de liberación'}
          </div>
        </section>

        {/* Clinical / Host Status Section */}
        <section className="space-y-3">
          {mode === 'oncologist' ? (
            <>
              <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-300">
                <span className="inline-flex items-center gap-1.5 font-semibold text-slate-900 dark:text-white">
                  <UserCheck className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" aria-hidden="true" />
                  {isSimple ? 'Salud del paciente' : 'Indicadores clínicos'}
                </span>
                <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400">
                  {state.revealedExtent
                    ? isSimple
                      ? `Ubicación: ${
                          clinical.diseaseExtent === 'localizada'
                            ? 'un solo lugar'
                            : clinical.diseaseExtent === 'regional'
                              ? 'zona cercana'
                              : 'extendido'
                        }`
                      : `Extensión: ${clinical.diseaseExtent}`
                    : isSimple
                      ? 'Ubicación: sin revisar'
                      : 'Extensión: sin estudio'}
                </span>
              </div>

              <MetricBar
                label={isSimple ? 'Tamaño del tumor' : 'Carga tumoral'}
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
                label={isSimple ? 'Fuerza y energía' : 'Estado funcional'}
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
                label={isSimple ? 'Bienestar general' : 'Calidad de vida'}
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
                label={isSimple ? 'Desgaste por tratamientos' : 'Toxicidad acumulada'}
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
                <span className="inline-flex items-center gap-1.5 font-semibold text-slate-900 dark:text-white whitespace-nowrap">
                  <Shield className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400 shrink-0" aria-hidden="true" />
                  {isSimple ? 'Defensas del cuerpo' : 'Defensas del organismo'}
                </span>
                <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400 tabular-nums whitespace-nowrap shrink-0">
                  {isSimple ? `Tumor ${clinical.tumorBurden}/100` : `Carga ${clinical.tumorBurden}/100`}
                </span>
              </div>

              <MetricBar
                label={isSimple ? 'Frenos naturales de división' : 'Puntos de control del ciclo'}
                value={defenses.cellCycleCheckpoint}
                tone={defenses.cellCycleCheckpoint >= 60 ? 'good' : 'warn'}
              />
              <MetricBar
                label={
                  molecularDetail === 'precision'
                    ? 'Reparación ADN y TP53'
                    : isSimple
                      ? 'Reparación del ADN e inspector'
                      : 'Reparación ADN y guardián genómico'
                }
                value={defenses.dnaRepair}
                tone={defenses.dnaRepair >= 60 ? 'good' : 'warn'}
              />
              <MetricBar
                label={isSimple ? 'Botón de apagado seguro' : 'Capacidad apoptótica'}
                value={defenses.apoptosisCapacity}
                tone={defenses.apoptosisCapacity >= 60 ? 'good' : 'warn'}
              />
              <MetricBar
                label={isSimple ? 'Vigilancia de las defensas' : 'Vigilancia inmunológica'}
                value={defenses.immuneSurveillance}
                tone={defenses.immuneSurveillance >= 60 ? 'good' : 'warn'}
              />
              <MetricBar
                label={isSimple ? 'Oxígeno y alimento disponibles' : 'Disponibilidad de O₂ y nutrientes'}
                value={defenses.nutrientSupply}
                tone={defenses.nutrientSupply >= 50 ? 'neutral' : 'danger'}
              />
            </>
          )}
        </section>

        {/* Interactive 9-Hallmarks Circular Wheel */}
        <section className="pt-4 border-t border-slate-200 dark:border-slate-800">
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
