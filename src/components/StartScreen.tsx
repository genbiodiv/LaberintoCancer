import React from 'react';
import {
  Activity,
  ArrowRight,
  BookOpen,
  Box,
  Cpu,
  Dna,
  FileText,
  GitCompareArrows,
  Microscope,
  RotateCcw,
  Stethoscope,
} from 'lucide-react';
import {
  CompletedRunSummary,
  GameMode,
  MolecularDetailMode,
  PlayMode,
  SimulationState,
} from '../engine/types';

interface StartScreenProps {
  playMode: PlayMode;
  onPlayModeChange: (v: PlayMode) => void;
  molecularDetail: MolecularDetailMode;
  onMolecularDetailChange: (v: MolecularDetailMode) => void;
  onStartMode: (mode: GameMode) => void;
  onOpenSplash: () => void;
  onOpenTutorial: () => void;
  savedSession: SimulationState | null;
  onResumeSession: () => void;
  completedRuns: CompletedRunSummary[];
  onOpenComparison: () => void;
}

export const StartScreen: React.FC<StartScreenProps> = ({
  playMode,
  onPlayModeChange,
  molecularDetail,
  onMolecularDetailChange,
  onStartMode,
  onOpenSplash,
  onOpenTutorial,
  savedSession,
  onResumeSession,
  completedRuns,
  onOpenComparison,
}) => {
  const canCompare =
    completedRuns.some((r) => r.mode === 'cancer') &&
    completedRuns.some((r) => r.mode === 'oncologist');

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      {/* Clean Top Bar (Teacher Mode is intentionally hidden behind 5x 'h') */}
      <header className="w-full border-b border-slate-200 bg-white">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between gap-8">
          <div className="flex items-center gap-2.5 whitespace-nowrap shrink-0">
            <Dna className="w-5 h-5 text-rose-600" aria-hidden="true" />
            <span className="text-lg font-bold tracking-tight text-slate-900">
              El laberinto del cáncer
            </span>
          </div>

          <nav className="flex items-center gap-5 text-sm font-medium text-slate-600">
            <button
              type="button"
              onClick={onOpenSplash}
              className="hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Instrucciones
            </button>
            <button
              type="button"
              onClick={onOpenTutorial}
              className="hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 inline-flex items-center gap-1.5 cursor-pointer"
            >
              <BookOpen className="w-4 h-4" aria-hidden="true" />
              Tutorial
            </button>
            {canCompare && (
              <button
                type="button"
                onClick={onOpenComparison}
                className="hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 inline-flex items-center gap-1.5 cursor-pointer"
              >
                <GitCompareArrows className="w-4 h-4" aria-hidden="true" />
                Comparar roles
              </button>
            )}
          </nav>
        </div>
      </header>

      {/* Main Content: Clean Student Launch Experience */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-6 py-10 flex flex-col justify-center gap-8">
        {/* Title & Essential Subtitle */}
        <section className="space-y-2.5 max-w-2xl">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 [text-wrap:balance]">
            El laberinto del cáncer
          </h1>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
            Elige tu rol y recorre el laberinto tomando decisiones biológicas paso a paso hasta
            alcanzar el objetivo final.
          </p>
        </section>

        {/* Compact Configuration Bar (Play Mode + Molecular Detail only — Unlimited Mode always) */}
        <section
          aria-label="Configuración de partida"
          className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 space-y-3"
        >
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              {/* Play Mode Switch */}
              <div
                role="group"
                aria-label="Modo de juego"
                className="inline-flex items-center gap-1 p-1 bg-slate-100 rounded-lg h-10"
              >
                <button
                  type="button"
                  onClick={() => onPlayModeChange('labyrinth')}
                  className={`px-3 h-full rounded-md text-xs font-semibold transition-colors inline-flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                    playMode === 'labyrinth'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Box className="w-3.5 h-3.5" aria-hidden="true" />
                  Laberinto 3D
                </button>
                <button
                  type="button"
                  onClick={() => onPlayModeChange('text')}
                  className={`px-3 h-full rounded-md text-xs font-semibold transition-colors inline-flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                    playMode === 'text'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" aria-hidden="true" />
                  Modo Texto
                </button>
              </div>

              {/* Molecular Detail Switch */}
              <div
                role="group"
                aria-label="Nivel de detalle molecular"
                className="inline-flex items-center gap-1 p-1 bg-slate-100 rounded-lg h-10"
              >
                <button
                  type="button"
                  onClick={() => onMolecularDetailChange('logic')}
                  className={`px-3 h-full rounded-md text-xs font-semibold transition-colors inline-flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                    molecularDetail === 'logic'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Cpu className="w-3.5 h-3.5" aria-hidden="true" />
                  Lógica molecular
                </button>
                <button
                  type="button"
                  onClick={() => onMolecularDetailChange('precision')}
                  className={`px-3 h-full rounded-md text-xs font-semibold transition-colors inline-flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                    molecularDetail === 'precision'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Microscope className="w-3.5 h-3.5" aria-hidden="true" />
                  Precisión molecular
                </button>
              </div>
            </div>

            {savedSession && !savedSession.finished && (
              <button
                type="button"
                onClick={onResumeSession}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-semibold text-slate-800 inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5 text-sky-600" aria-hidden="true" />
                Reanudar · Ronda {savedSession.currentRound}
              </button>
            )}
          </div>

          {/* Unified Continuous Progression Summary */}
          <div className="pt-3 border-t border-slate-100 text-xs text-slate-500">
            Inicio único y recorrido continuo: todas las partidas parten de la misma célula y
            continúan hasta llegar al 100% de cáncer o al 100% de liberación.
          </div>
        </section>

        {/* Two Primary Role Launch Cards */}
        <section
          aria-label="Seleccionar rol de juego"
          className="grid grid-cols-1 md:grid-cols-2 gap-5 items-stretch"
        >
          {/* Role 1: Cancer */}
          <button
            type="button"
            data-testid="launch-cancer-btn"
            onClick={() => onStartMode('cancer')}
            className="group text-left bg-white border border-slate-200 hover:border-rose-400 rounded-xl p-6 flex flex-col justify-between gap-6 transition-all duration-150 focus-visible:outline-2 focus-visible:outline-rose-500 cursor-pointer"
          >
            <div className="space-y-3">
              <div className="w-11 h-11 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                <Activity className="w-5 h-5" aria-hidden="true" />
              </div>
              <div className="space-y-1.5">
                <h2 className="text-lg font-bold text-slate-900 group-hover:text-rose-700 transition-colors">
                  Jugar como el cáncer
                </h2>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Supera las barreras naturales del organismo acumulando alteraciones en el
                  laberinto hasta alcanzar el{' '}
                  <strong className="font-semibold text-slate-800">100% de cáncer</strong>.
                </p>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-rose-600">
              <span>Iniciar en {playMode === 'labyrinth' ? 'Laberinto 3D' : 'Modo Texto'}</span>
              <ArrowRight
                className="w-4 h-4 transition-transform group-hover:translate-x-1"
                aria-hidden="true"
              />
            </div>
          </button>

          {/* Role 2: Oncologist */}
          <button
            type="button"
            data-testid="launch-oncologist-btn"
            onClick={() => onStartMode('oncologist')}
            className="group text-left bg-white border border-slate-200 hover:border-sky-500 rounded-xl p-6 flex flex-col justify-between gap-6 transition-all duration-150 focus-visible:outline-2 focus-visible:outline-sky-500 cursor-pointer"
          >
            <div className="space-y-3">
              <div className="w-11 h-11 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
                <Stethoscope className="w-5 h-5" aria-hidden="true" />
              </div>
              <div className="space-y-1.5">
                <h2 className="text-lg font-bold text-slate-900 group-hover:text-sky-700 transition-colors">
                  Jugar como oncólogo
                </h2>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Investiga el tumor, selecciona terapias basadas en evidencia y protege al paciente
                  hasta alcanzar el{' '}
                  <strong className="font-semibold text-slate-800">100% de liberación</strong>.
                </p>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-sky-700">
              <span>Iniciar en {playMode === 'labyrinth' ? 'Laberinto 3D' : 'Modo Texto'}</span>
              <ArrowRight
                className="w-4 h-4 transition-transform group-hover:translate-x-1"
                aria-hidden="true"
              />
            </div>
          </button>
        </section>

        {/* Quiet Scientific Grounding Footer Strip */}
        <footer className="flex flex-wrap items-center justify-between gap-4 text-xs text-slate-500">
          <span>
            {molecularDetail === 'logic'
              ? 'Nivel actual: Lógica molecular (sin nombres de genes)'
              : 'Nivel actual: Precisión molecular (con nombres de genes)'}{' '}
            · Uso educativo
          </span>
        </footer>
      </main>
    </div>
  );
};
