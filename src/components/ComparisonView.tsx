import React from 'react';
import { Activity, ArrowLeft, Eye, GitCompareArrows, Stethoscope } from 'lucide-react';
import { formatBiologyText } from '../engine/molecularAbstraction';
import { MolecularDetailMode, PerspectiveComparison } from '../engine/types';

interface ComparisonViewProps {
  comparison: PerspectiveComparison;
  molecularDetail: MolecularDetailMode;
  onBack: () => void;
}

export const ComparisonView: React.FC<ComparisonViewProps> = ({
  comparison,
  molecularDetail,
  onBack,
}) => {
  const { cancerRun, oncologistRun } = comparison;
  const fmt = (text: string) => formatBiologyText(text, molecularDetail);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0b1220] text-slate-900 dark:text-slate-100 transition-colors">
      <header className="w-full border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/95">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between gap-6">
          <button
            type="button"
            onClick={onBack}
            className="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white inline-flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            Volver
          </button>

          <div className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
            <GitCompareArrows className="w-4 h-4 text-sky-600 dark:text-sky-400" aria-hidden="true" />
            Comparación de perspectivas
          </div>

          <span className="text-xs font-mono text-slate-500 dark:text-slate-400 hidden sm:inline">
            Inicio único · progresión bifurcada
          </span>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8 space-y-6">
        {/* Core Biological Principle */}
        <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-2">
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">
            Misma biología, decisiones y objetivos opuestos
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            {fmt(comparison.clonalSelectionLesson)}
          </p>
        </section>

        {/* Side-by-Side Run Summary */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Cancer Run */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-rose-700 dark:text-rose-400 inline-flex items-center gap-1.5">
                <Activity className="w-4 h-4" aria-hidden="true" />
                Rol Cáncer
              </span>
              <span className="font-mono text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                {cancerRun.score.total}/100 pts
              </span>
            </div>
            <div className="text-base font-semibold text-slate-900 dark:text-white">
              {fmt(cancerRun.outcomeTitle)}
            </div>
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs font-mono tabular-nums text-slate-700 dark:text-slate-300">
              <div>Carga final: {cancerRun.finalBurden}/100</div>
              <div>Clon dominante: {cancerRun.dominantCloneShare}%</div>
            </div>
            <div className="text-xs text-slate-600 dark:text-slate-300">
              {fmt(cancerRun.dominantCloneName)}
            </div>
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1">
              {cancerRun.history.map((h) => (
                <div key={h.roundNumber} className="text-[11px] text-slate-600 dark:text-slate-300">
                  <strong className="text-slate-800 dark:text-white">R{h.roundNumber}:</strong>{' '}
                  {fmt(h.actionTakenLabel)}
                </div>
              ))}
            </div>
          </div>

          {/* Oncologist Run */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-sky-700 dark:text-sky-400 inline-flex items-center gap-1.5">
                <Stethoscope className="w-4 h-4" aria-hidden="true" />
                Rol Oncólogo
              </span>
              <span className="font-mono text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                {oncologistRun.score.total}/100 pts
              </span>
            </div>
            <div className="text-base font-semibold text-slate-900 dark:text-white">
              {fmt(oncologistRun.outcomeTitle)}
            </div>
            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs font-mono tabular-nums text-slate-700 dark:text-slate-300">
              <div>Carga: {oncologistRun.finalBurden}/100</div>
              <div>CdV: {oncologistRun.finalQol}/100</div>
              <div>Tox: {oncologistRun.finalToxicity}/100</div>
            </div>
            <div className="text-xs text-slate-600 dark:text-slate-300">
              {fmt(oncologistRun.dominantCloneName)} ({oncologistRun.dominantCloneShare}%)
            </div>
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1">
              {oncologistRun.history.map((h) => (
                <div key={h.roundNumber} className="text-[11px] text-slate-600 dark:text-slate-300">
                  <strong className="text-slate-800 dark:text-white">R{h.roundNumber}:</strong>{' '}
                  {fmt(h.actionTakenLabel)}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Analytical Matrix: Coincidences, Differences & Hidden Information */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-2.5">
            <h2 className="text-xs font-bold text-slate-900 dark:text-white">
              Coincidencias biológicas
            </h2>
            <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              {comparison.coincidences.map((c, i) => (
                <li key={i}>· {fmt(c)}</li>
              ))}
            </ul>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-2.5">
            <h2 className="text-xs font-bold text-slate-900 dark:text-white">
              Diferencias de trayectoria
            </h2>
            <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              {comparison.differences.map((d, i) => (
                <li key={i}>· {fmt(d)}</li>
              ))}
            </ul>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-2.5">
            <h2 className="text-xs font-bold text-slate-900 dark:text-white inline-flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" aria-hidden="true" />
              Asimetría de información
            </h2>
            <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              {comparison.hiddenInfoInsights.map((ins, i) => (
                <li key={i}>· {fmt(ins)}</li>
              ))}
            </ul>
          </div>
        </section>
      </main>
    </div>
  );
};
