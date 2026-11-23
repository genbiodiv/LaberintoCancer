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
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="w-full border-b border-slate-200 bg-white">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between gap-6">
          <button
            type="button"
            onClick={onBack}
            className="text-sm font-medium text-slate-600 hover:text-slate-900 inline-flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            Volver
          </button>

          <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
            <GitCompareArrows className="w-4 h-4 text-sky-600" aria-hidden="true" />
            Comparación de perspectivas
          </div>

          <span className="text-xs font-mono text-slate-500 hidden sm:inline">
            Inicio único · progresión bifurcada
          </span>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8 space-y-6">
        {/* Core Biological Principle */}
        <section className="bg-white border border-slate-200 rounded-xl p-6 space-y-2">
          <h1 className="text-xl font-bold text-slate-900">
            Misma biología, decisiones y objetivos opuestos
          </h1>
          <p className="text-sm text-slate-600 leading-relaxed">
            {fmt(comparison.clonalSelectionLesson)}
          </p>
        </section>

        {/* Side-by-Side Run Summary */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Cancer Run */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-rose-700 inline-flex items-center gap-1.5">
                <Activity className="w-4 h-4" aria-hidden="true" />
                Rol Cáncer
              </span>
              <span className="font-mono text-xs text-slate-500 tabular-nums">
                {cancerRun.score.total}/100 pts
              </span>
            </div>
            <div className="text-base font-semibold text-slate-900">
              {fmt(cancerRun.outcomeTitle)}
            </div>
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-xs font-mono tabular-nums text-slate-700">
              <div>Carga final: {cancerRun.finalBurden}/100</div>
              <div>Clon dominante: {cancerRun.dominantCloneShare}%</div>
            </div>
            <div className="text-xs text-slate-600">{fmt(cancerRun.dominantCloneName)}</div>
            <div className="pt-2 border-t border-slate-100 space-y-1">
              {cancerRun.history.map((h) => (
                <div key={h.roundNumber} className="text-[11px] text-slate-600">
                  <strong className="text-slate-800">R{h.roundNumber}:</strong>{' '}
                  {fmt(h.actionTakenLabel)}
                </div>
              ))}
            </div>
          </div>

          {/* Oncologist Run */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-sky-700 inline-flex items-center gap-1.5">
                <Stethoscope className="w-4 h-4" aria-hidden="true" />
                Rol Oncólogo
              </span>
              <span className="font-mono text-xs text-slate-500 tabular-nums">
                {oncologistRun.score.total}/100 pts
              </span>
            </div>
            <div className="text-base font-semibold text-slate-900">
              {fmt(oncologistRun.outcomeTitle)}
            </div>
            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 text-xs font-mono tabular-nums text-slate-700">
              <div>Carga: {oncologistRun.finalBurden}/100</div>
              <div>CdV: {oncologistRun.finalQol}/100</div>
              <div>Tox: {oncologistRun.finalToxicity}/100</div>
            </div>
            <div className="text-xs text-slate-600">
              {fmt(oncologistRun.dominantCloneName)} ({oncologistRun.dominantCloneShare}%)
            </div>
            <div className="pt-2 border-t border-slate-100 space-y-1">
              {oncologistRun.history.map((h) => (
                <div key={h.roundNumber} className="text-[11px] text-slate-600">
                  <strong className="text-slate-800">R{h.roundNumber}:</strong>{' '}
                  {fmt(h.actionTakenLabel)}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Analytical Matrix: Coincidences, Differences & Hidden Information */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-2.5">
            <h2 className="text-xs font-bold text-slate-900">Coincidencias biológicas</h2>
            <ul className="space-y-2 text-xs text-slate-600 leading-relaxed">
              {comparison.coincidences.map((c, i) => (
                <li key={i}>· {fmt(c)}</li>
              ))}
            </ul>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-2.5">
            <h2 className="text-xs font-bold text-slate-900">Diferencias de trayectoria</h2>
            <ul className="space-y-2 text-xs text-slate-600 leading-relaxed">
              {comparison.differences.map((d, i) => (
                <li key={i}>· {fmt(d)}</li>
              ))}
            </ul>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-2.5">
            <h2 className="text-xs font-bold text-slate-900 inline-flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5 text-sky-600" aria-hidden="true" />
              Asimetría de información
            </h2>
            <ul className="space-y-2 text-xs text-slate-600 leading-relaxed">
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
