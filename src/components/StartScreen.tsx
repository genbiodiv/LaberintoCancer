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
  GraduationCap,
  Lightbulb,
  Microscope,
  RotateCcw,
  Stethoscope,
} from 'lucide-react';
import { getOncologistStageInfo } from '../engine/molecularAbstraction';
import {
  CompletedRunSummary,
  GameMode,
  MolecularDetailMode,
  OncologistStartStage,
  PlayMode,
  SimulationState,
} from '../engine/types';
import { ThemeMode } from '../utils/storage';
import { ThemeToggle } from './ThemeToggle';

interface StartScreenProps {
  theme: ThemeMode;
  onThemeChange: (next: ThemeMode) => void;
  playMode: PlayMode;
  onPlayModeChange: (v: PlayMode) => void;
  molecularDetail: MolecularDetailMode;
  onMolecularDetailChange: (v: MolecularDetailMode) => void;
  oncologistStartStage: OncologistStartStage;
  onOncologistStartStageChange: (stage: OncologistStartStage) => void;
  onStartMode: (mode: GameMode) => void;
  onOpenSplash: () => void;
  onOpenTutorial: () => void;
  savedSession: SimulationState | null;
  onResumeSession: () => void;
  completedRuns: CompletedRunSummary[];
  onOpenComparison: () => void;
}

const ONCOLOGIST_STAGES: OncologistStartStage[] = ['surveillance', 'early', 'advanced'];

export const StartScreen: React.FC<StartScreenProps> = ({
  theme,
  onThemeChange,
  playMode,
  onPlayModeChange,
  molecularDetail,
  onMolecularDetailChange,
  oncologistStartStage,
  onOncologistStartStageChange,
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

  const activeStageInfo = getOncologistStageInfo(oncologistStartStage, molecularDetail);

  const detailDescription =
    molecularDetail === 'simple'
      ? 'Modo Simple: explica en lenguaje cotidiano qué está pasando en el cuerpo y las células, sin términos complejos.'
      : molecularDetail === 'logic'
        ? 'Lógica molecular: describe procesos celulares y vías biológicas sin exigir memorizar nombres de genes.'
        : 'Precisión molecular: muestra nombres exactos de genes (EGFR, KRAS, TP53, RB1, PD-L1) y rutas clínicas completas.';

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-[#0b1220] dark:text-slate-100 flex flex-col transition-colors">
      {/* Clean Top Bar (Teacher Mode is intentionally hidden behind 5x 'h') */}
      <header className="w-full border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/90 transition-colors">
        <div className="max-w-5xl mx-auto px-3.5 sm:px-6 h-16 flex items-center justify-between gap-2 sm:gap-8">
          <div className="flex items-center gap-2 whitespace-nowrap min-w-0">
            <Dna className="w-4 h-4 sm:w-5 sm:h-5 text-rose-600 dark:text-rose-500 shrink-0" aria-hidden="true" />
            <span className="text-sm sm:text-lg font-bold tracking-tight text-slate-900 dark:text-white truncate">
              El laberinto del cáncer
            </span>
          </div>

          <nav className="flex items-center gap-2 sm:gap-5 text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-300 shrink-0">
            <button
              type="button"
              onClick={onOpenSplash}
              className="hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Portada
            </button>
            <button
              type="button"
              onClick={onOpenTutorial}
              aria-label="Guía"
              className="hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0 inline-flex items-center gap-1.5 cursor-pointer"
            >
              <BookOpen className="w-4 h-4" aria-hidden="true" />
              <span className="hidden sm:inline">Guía</span>
            </button>
            {canCompare && (
              <button
                type="button"
                onClick={onOpenComparison}
                aria-label="Comparar roles"
                className="hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0 inline-flex items-center gap-1.5 cursor-pointer"
              >
                <GitCompareArrows className="w-4 h-4" aria-hidden="true" />
                <span className="hidden md:inline">Comparar roles</span>
              </button>
            )}
            <ThemeToggle theme={theme} onChange={onThemeChange} variant="compact" />
          </nav>
        </div>
      </header>

      {/* Main Content: Clean Student Launch Experience */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-6 py-8 sm:py-10 flex flex-col justify-center gap-7">
        {/* Title & Essential Subtitle */}
        <section className="space-y-1.5 max-w-2xl">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white [text-wrap:balance]">
            Elige tu ruta
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            Selecciona el formato, el nivel de lenguaje y el rol con el que quieres explorar la
            simulación.
          </p>
        </section>

        {/* Compact Configuration Bar (Play Mode + 3-Tier Language/Detail Switch) */}
        <section
          aria-label="Configuración de partida"
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 sm:p-5 space-y-3"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3">
              {/* Play Mode Switch */}
              <div
                role="group"
                aria-label="Modo de juego"
                className="inline-flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg h-10"
              >
                <button
                  type="button"
                  onClick={() => onPlayModeChange('labyrinth')}
                  className={`px-3 h-full rounded-md text-xs font-semibold transition-colors inline-flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                    playMode === 'labyrinth'
                      ? 'bg-white dark:bg-slate-950 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
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
                      ? 'bg-white dark:bg-slate-950 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" aria-hidden="true" />
                  Modo Texto
                </button>
              </div>

              {/* 3-Tier Language / Molecular Detail Switch */}
              <div
                role="group"
                aria-label="Nivel de lenguaje y detalle"
                data-testid="detail-mode-group"
                className="grid grid-cols-3 sm:inline-flex w-full sm:w-auto items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg min-h-10"
              >
                <button
                  type="button"
                  data-testid="detail-simple-btn"
                  aria-pressed={molecularDetail === 'simple'}
                  onClick={() => onMolecularDetailChange('simple')}
                  className={`px-2 sm:px-3 py-1.5 rounded-md text-xs font-semibold transition-colors inline-flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer ${
                    molecularDetail === 'simple'
                      ? 'bg-white dark:bg-slate-950 text-emerald-700 dark:text-emerald-400 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Lightbulb className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                  <span>Simple</span>
                </button>
                <button
                  type="button"
                  data-testid="detail-logic-btn"
                  aria-pressed={molecularDetail === 'logic'}
                  onClick={() => onMolecularDetailChange('logic')}
                  className={`px-2 sm:px-3 py-1.5 rounded-md text-xs font-semibold transition-colors inline-flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer ${
                    molecularDetail === 'logic'
                      ? 'bg-white dark:bg-slate-950 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Cpu className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                  <span>
                    Lógica<span className="hidden sm:inline"> molecular</span>
                  </span>
                </button>
                <button
                  type="button"
                  data-testid="detail-precision-btn"
                  aria-pressed={molecularDetail === 'precision'}
                  onClick={() => onMolecularDetailChange('precision')}
                  className={`px-2 sm:px-3 py-1.5 rounded-md text-xs font-semibold transition-colors inline-flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer ${
                    molecularDetail === 'precision'
                      ? 'bg-white dark:bg-slate-950 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Microscope className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                  <span>
                    Precisión<span className="hidden sm:inline"> molecular</span>
                  </span>
                </button>
              </div>
            </div>

            {savedSession && !savedSession.finished && (
              <button
                type="button"
                onClick={onResumeSession}
                className="px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-xs font-semibold text-slate-800 dark:text-slate-100 inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" aria-hidden="true" />
                Reanudar · Ronda {savedSession.currentRound}
              </button>
            )}
          </div>

          {/* Dynamic Language Level Summary */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400">
            {detailDescription}
          </div>
        </section>

        {/* Two Primary Role Launch Cards */}
        <section
          aria-label="Seleccionar rol de juego"
          className="grid grid-cols-1 md:grid-cols-2 gap-5 items-stretch"
        >
          {/* Role 1: Cancer */}
          <article className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 flex flex-col justify-between gap-6 transition-colors">
            <div className="space-y-3">
              <div className="w-11 h-11 rounded-xl bg-rose-50 dark:bg-rose-950/70 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                <Activity className="w-5 h-5" aria-hidden="true" />
              </div>
              <div className="space-y-1.5">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  Jugar como el cáncer
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  {molecularDetail === 'simple'
                    ? 'Empieza desde una célula inicial y elige qué cambios le permiten seguir creciendo y evadir las defensas del tejido.'
                    : 'Explora qué cambios en señalización, ciclo celular y supervivencia permiten que las células tumorales superen las barreras del tejido.'}
                </p>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                data-testid="launch-cancer-btn"
                onClick={() => onStartMode('cancer')}
                className="w-full py-2.5 px-4 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold inline-flex items-center justify-between transition-colors cursor-pointer"
              >
                <span>Iniciar en {playMode === 'labyrinth' ? 'Laberinto 3D' : 'Modo Texto'}</span>
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
          </article>

          {/* Role 2: Oncologist with Starting Stage Selector */}
          <article className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 flex flex-col justify-between gap-5 transition-colors">
            <div className="space-y-4">
              <div className="space-y-3">
                <div className="w-11 h-11 rounded-xl bg-sky-50 dark:bg-sky-950/70 text-sky-600 dark:text-sky-400 flex items-center justify-center">
                  <Stethoscope className="w-5 h-5" aria-hidden="true" />
                </div>
                <div className="space-y-1.5">
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                    Jugar como oncólogo
                  </h2>
                  <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                    {molecularDetail === 'simple'
                      ? 'Alterna turnos para estudiar el tumor y elegir tratamientos —o decide observar— cuidando el bienestar del paciente.'
                      : 'Alterna rondas de estudio e intervención —u observa cuando convenga— para controlar el tumor sin comprometer al paciente.'}
                  </p>
                </div>
              </div>

              {/* Oncologist Starting Stage Selector: Vigilancia / Cáncer temprano / Cáncer avanzado */}
              <div className="space-y-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    Punto de partida clínico
                  </span>
                  <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400 tabular-nums">
                    Carga inicial: {activeStageInfo.burdenPreview}
                  </span>
                </div>

                <div
                  role="group"
                  aria-label="Etapa inicial del modo oncólogo"
                  data-testid="oncologist-stage-selector"
                  className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg"
                >
                  {ONCOLOGIST_STAGES.map((stage) => {
                    const info = getOncologistStageInfo(stage, molecularDetail);
                    const active = oncologistStartStage === stage;
                    return (
                      <button
                        key={stage}
                        type="button"
                        data-testid={`onco-stage-${stage}`}
                        aria-pressed={active}
                        onClick={() => onOncologistStartStageChange(stage)}
                        className={`px-2 py-2 rounded-md text-[11px] font-semibold transition-colors text-center leading-tight cursor-pointer ${
                          active
                            ? stage === 'surveillance'
                              ? 'bg-white dark:bg-slate-950 text-emerald-700 dark:text-emerald-400 shadow-xs'
                              : stage === 'advanced'
                                ? 'bg-white dark:bg-slate-950 text-rose-700 dark:text-rose-400 shadow-xs'
                                : 'bg-white dark:bg-slate-950 text-sky-700 dark:text-sky-400 shadow-xs'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        {info.label}
                      </button>
                    );
                  })}
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-400 leading-snug">
                  {activeStageInfo.description}
                </p>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                data-testid="launch-oncologist-btn"
                onClick={() => onStartMode('oncologist')}
                className="w-full py-2.5 px-4 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold inline-flex items-center justify-between transition-colors cursor-pointer"
              >
                <span>
                  Iniciar en {activeStageInfo.label.toLowerCase()} (
                  {playMode === 'labyrinth' ? 'Laberinto 3D' : 'Modo Texto'})
                </span>
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
          </article>
        </section>

        {/* Credits Section */}
        <section
          aria-labelledby="start-credits-heading"
          data-testid="start-credits-section"
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 flex flex-col sm:flex-row sm:items-start gap-4"
        >
          <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center justify-center shrink-0">
            <GraduationCap className="w-4 h-4" aria-hidden="true" />
          </div>
          <div className="space-y-1.5">
            <h2
              id="start-credits-heading"
              className="text-sm font-bold text-slate-900 dark:text-white tracking-tight"
            >
              Créditos
            </h2>
            <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
              Desarrollado por{' '}
              <strong className="font-semibold text-slate-900 dark:text-white">Rafik Neme</strong>{' '}
              para el curso de{' '}
              <strong className="font-semibold text-slate-900 dark:text-white">
                Biología Molecular
              </strong>
              , en la{' '}
              <strong className="font-semibold text-slate-900 dark:text-white">
                Universidad del Norte
              </strong>
              , en Barranquilla, Colombia.
            </p>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              Generado con Google AI Studio, con información basada en{' '}
              <span className="text-slate-700 dark:text-slate-300 font-medium">
                &ldquo;The Hallmarks of Cancer&rdquo;
              </span>{' '}
              de Douglas Hanahan y otras fuentes.
            </p>
          </div>
        </section>

        {/* Quiet Scientific Grounding Footer Strip */}
        <footer className="flex flex-wrap items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">
          <span>
            {molecularDetail === 'simple'
              ? 'Nivel actual: Modo Simple (lenguaje cotidiano para principiantes)'
              : molecularDetail === 'logic'
                ? 'Nivel actual: Lógica molecular (sin nombres de genes)'
                : 'Nivel actual: Precisión molecular (con nombres de genes)'}{' '}
            · Uso educativo
          </span>
        </footer>
      </main>
    </div>
  );
};
