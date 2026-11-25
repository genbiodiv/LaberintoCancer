import { useEffect, useMemo, useRef, useState } from 'react';
import {
  BookOpen,
  Box,
  Cpu,
  Dna,
  FileText,
  Home,
  Lightbulb,
  Microscope,
} from 'lucide-react';
import { CancerPanel } from './components/CancerPanel';
import { ComparisonView } from './components/ComparisonView';
import { ConsequencesPanel } from './components/ConsequencesPanel';
import { Labyrinth3DView } from './components/Labyrinth3DView';
import { MolecularCanvas, StageViewTab } from './components/MolecularCanvas';
import { OncologistPanel } from './components/OncologistPanel';
import { ReportView } from './components/ReportView';
import { SplashScreen } from './components/SplashScreen';
import { StartScreen } from './components/StartScreen';
import { TeacherModal } from './components/TeacherModal';
import { ThemeToggle } from './components/ThemeToggle';
import { TurnFeedbackModal } from './components/TurnFeedbackModal';
import { TutorialModal } from './components/TutorialModal';
import { clampDecisionRoundCount } from './engine/decisionTree';
import { getTherapyById } from './engine/knowledgeBase';
import {
  advanceSecretKeySequence,
  SecretKeySequenceState,
} from './engine/labyrinthAesthetics';
import { getTherapyDisplayShort } from './engine/molecularAbstraction';
import { UNIFIED_FEATURED_GENES } from './engine/progressionEngine';
import {
  buildCompletedRunSummary,
  comparePerspectiveRuns,
  createInitialSimulation,
  resolveCancerTurn,
  resolveOncologistDiagnosticTurn,
  resolveOncologistObservationTurn,
  resolveOncologistTurn,
} from './engine/simulator';
import {
  CompletedRunSummary,
  CosmicEvidenceRecord,
  DiagnosticToolId,
  GameMode,
  MolecularDetailMode,
  OncologistStartStage,
  PlayMode,
  SimulationState,
  TeacherConfig,
  TherapyId,
  TurnResolution,
} from './engine/types';
import {
  loadActiveSession,
  loadCompletedRuns,
  loadCustomEvidence,
  loadTeacherConfig,
  loadThemeMode,
  saveActiveSession,
  saveCompletedRun,
  saveCustomEvidence,
  saveTeacherConfig,
  saveThemeMode,
  ThemeMode,
} from './utils/storage';

type ScreenView = 'splash' | 'start' | 'playing' | 'report' | 'compare';

export default function App() {
  const [teacherConfig, setTeacherConfig] = useState<TeacherConfig>(() => loadTeacherConfig());
  const [customEvidence, setCustomEvidence] = useState<CosmicEvidenceRecord[]>(() =>
    loadCustomEvidence()
  );
  const [completedRuns, setCompletedRuns] = useState<CompletedRunSummary[]>(() =>
    loadCompletedRuns()
  );

  // Lobby & global configuration state (unified start, unlimited-only progression)
  const [theme, setTheme] = useState<ThemeMode>(() => loadThemeMode());
  const [playMode, setPlayMode] = useState<PlayMode>('labyrinth');
  const [molecularDetail, setMolecularDetail] = useState<MolecularDetailMode>('logic');
  const [oncologistStartStage, setOncologistStartStage] =
    useState<OncologistStartStage>('early');

  useEffect(() => {
    const isDark = theme === 'dark';
    document.documentElement.classList.toggle('dark', isDark);
    document.documentElement.dataset.theme = theme;
    saveThemeMode(theme);
  }, [theme]);

  // Active simulation & view state (starts on Splash page with instructions)
  const [session, setSession] = useState<SimulationState | null>(() => loadActiveSession());
  const [view, setView] = useState<ScreenView>('splash');
  const [stageTab, setStageTab] = useState<StageViewTab>('network');
  const [isLabyrinthExpanded, setIsLabyrinthExpanded] = useState<boolean>(false);
  const [pendingResolution, setPendingResolution] = useState<TurnResolution | null>(null);

  // Modals (Teacher Mode opens exclusively via pressing 'h' 5 times)
  const [tutorialOpen, setTutorialOpen] = useState(false);
  const [teacherOpen, setTeacherOpen] = useState(false);
  const secretKeyRef = useRef<SecretKeySequenceState>({ count: 0, lastPressMs: 0 });

  useEffect(() => {
    const onGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey || e.repeat) return;
      const target = e.target;
      if (target instanceof HTMLElement) {
        const tag = target.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target.isContentEditable) {
          return;
        }
      }
      const { next, triggered } = advanceSecretKeySequence(
        secretKeyRef.current,
        e.key,
        Date.now()
      );
      secretKeyRef.current = next;
      if (triggered) {
        setTeacherOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', onGlobalKeyDown);
    return () => window.removeEventListener('keydown', onGlobalKeyDown);
  }, []);

  const handlePlayModeChange = (next: PlayMode) => {
    setPlayMode(next);
    if (next === 'text') {
      setIsLabyrinthExpanded(false);
      setStageTab((prev) => (prev === 'labyrinth' ? 'network' : prev));
    } else {
      setStageTab('labyrinth');
    }
  };

  // Optional ?autostart=1&mode=cancer|oncologist&playMode=labyrinth|text&detail=simple|logic|precision&stage=surveillance|early|advanced&view=...
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const pmParam = params.get('playMode');
    const detailParam = params.get('detail');
    const stageParam = params.get('stage');
    const vParam = params.get('view');

    let resolvedPlayMode: PlayMode = 'labyrinth';
    if (pmParam === 'text' || pmParam === 'labyrinth') {
      resolvedPlayMode = pmParam;
      setPlayMode(pmParam);
    }

    if (detailParam === 'simple' || detailParam === 'logic' || detailParam === 'precision') {
      setMolecularDetail(detailParam);
    }

    let resolvedStage: OncologistStartStage = 'early';
    if (stageParam === 'surveillance' || stageParam === 'early' || stageParam === 'advanced') {
      resolvedStage = stageParam;
      setOncologistStartStage(stageParam);
    }

    if (vParam === 'labyrinth' || vParam === 'network' || vParam === 'clones') {
      setStageTab(resolvedPlayMode === 'text' && vParam === 'labyrinth' ? 'network' : vParam);
    } else {
      setStageTab(resolvedPlayMode === 'text' ? 'network' : 'labyrinth');
    }

    if (params.get('autostart') === '1') {
      const m = params.get('mode') === 'oncologist' ? 'oncologist' : 'cancer';
      const fresh = createInitialSimulation(
        m,
        'UNIFIED',
        '',
        'quick',
        teacherConfig,
        5,
        undefined,
        true,
        resolvedStage
      );
      setSession(fresh);
      saveActiveSession(fresh);
      setView('playing');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist active session whenever it updates
  useEffect(() => {
    saveActiveSession(session);
  }, [session]);

  const handleStartMode = (mode: GameMode, overrideStage?: OncologistStartStage) => {
    const stageToUse = overrideStage ?? oncologistStartStage;
    const fresh = createInitialSimulation(
      mode,
      'UNIFIED',
      '',
      'quick',
      teacherConfig,
      5,
      undefined,
      true,
      stageToUse
    );
    setSession(fresh);
    setPendingResolution(null);
    setStageTab(playMode === 'labyrinth' ? 'labyrinth' : 'network');
    setIsLabyrinthExpanded(false);
    setView('playing');
  };

  const handleResume = () => {
    if (!session) return;
    setPendingResolution(null);
    setStageTab(playMode === 'labyrinth' ? 'labyrinth' : 'network');
    setView(session.finished ? 'report' : 'playing');
  };

  const handleCancerTurn = (strategyId: string, predictionId: string) => {
    if (!session) return;
    const { nextState, resolution } = resolveCancerTurn(session, strategyId, predictionId);
    setSession(nextState);
    setPendingResolution(resolution);
    if (nextState.finished) {
      const updatedRuns = saveCompletedRun(
        buildCompletedRunSummary(nextState, { playMode, molecularDetail })
      );
      setCompletedRuns(updatedRuns);
    }
  };

  const handleOncologistDiagnostic = (toolId: DiagnosticToolId) => {
    if (!session) return;
    const { nextState, resolution } = resolveOncologistDiagnosticTurn(session, toolId);
    setSession(nextState);
    setPendingResolution(resolution);
    if (nextState.finished) {
      const updatedRuns = saveCompletedRun(
        buildCompletedRunSummary(nextState, { playMode, molecularDetail })
      );
      setCompletedRuns(updatedRuns);
    }
  };

  const handleOncologistObservation = () => {
    if (!session) return;
    const { nextState, resolution } = resolveOncologistObservationTurn(session);
    setSession(nextState);
    setPendingResolution(resolution);
    if (nextState.finished) {
      const updatedRuns = saveCompletedRun(
        buildCompletedRunSummary(nextState, { playMode, molecularDetail })
      );
      setCompletedRuns(updatedRuns);
    }
  };

  const handleOncologistTurn = (therapyId: TherapyId, predictionId: string = '') => {
    if (!session) return;
    const { nextState, resolution } = resolveOncologistTurn(session, therapyId, predictionId);
    setSession(nextState);
    setPendingResolution(resolution);
    if (nextState.finished) {
      const updatedRuns = saveCompletedRun(
        buildCompletedRunSummary(nextState, { playMode, molecularDetail })
      );
      setCompletedRuns(updatedRuns);
    }
  };

  const handleContinueAfterFeedback = () => {
    setPendingResolution(null);
    if (session?.finished) {
      setView('report');
    }
  };

  const handleSwitchPerspective = () => {
    if (!session) return;
    const opposite: GameMode = session.mode === 'cancer' ? 'oncologist' : 'cancer';
    handleStartMode(opposite);
  };

  const handleSaveTeacherConfig = (next: TeacherConfig) => {
    const normalized: TeacherConfig = {
      ...next,
      defaultScenario: 'UNIFIED',
      roundCount: clampDecisionRoundCount(next.roundCount),
      defaultUnlimitedMode: true,
    };
    setTeacherConfig(normalized);
    saveTeacherConfig(normalized);
    if (session && !session.finished) {
      setSession({
        ...session,
        teacherConfig: normalized,
        revealedGenes:
          session.mode === 'oncologist' && normalized.revealMolecularInOncologist
            ? [...UNIFIED_FEATURED_GENES]
            : session.revealedGenes,
      });
    }
  };

  const handleImportEvidence = (records: CosmicEvidenceRecord[]) => {
    const merged = [...records, ...customEvidence];
    setCustomEvidence(merged);
    saveCustomEvidence(merged);
  };

  const handleResetSimulation = () => {
    setSession(null);
    saveActiveSession(null);
    setPendingResolution(null);
    setView('start');
  };

  const activeComparison = useMemo(() => {
    const cancerRun = completedRuns.find((r) => r.mode === 'cancer');
    const oncoRun = completedRuns.find((r) => r.mode === 'oncologist');
    if (!cancerRun || !oncoRun) return null;
    return comparePerspectiveRuns(cancerRun, oncoRun);
  }, [completedRuns]);

  const activeTherapyLabel = useMemo(() => {
    if (!session?.activeTherapy) return undefined;
    const rule = getTherapyById(session.activeTherapy);
    return rule ? getTherapyDisplayShort(rule, molecularDetail) : undefined;
  }, [session?.activeTherapy, molecularDetail]);

  const effectiveLabyrinthExpanded =
    playMode === 'labyrinth' && stageTab === 'labyrinth' && isLabyrinthExpanded;

  return (
    <>
      {view === 'splash' && (
        <SplashScreen
          theme={theme}
          onThemeChange={setTheme}
          onContinue={() => setView('start')}
        />
      )}

      {view === 'start' && (
        <StartScreen
          theme={theme}
          onThemeChange={setTheme}
          playMode={playMode}
          onPlayModeChange={handlePlayModeChange}
          molecularDetail={molecularDetail}
          onMolecularDetailChange={setMolecularDetail}
          oncologistStartStage={oncologistStartStage}
          onOncologistStartStageChange={setOncologistStartStage}
          onStartMode={(m) => handleStartMode(m)}
          onOpenSplash={() => setView('splash')}
          onOpenTutorial={() => setTutorialOpen(true)}
          savedSession={session}
          onResumeSession={handleResume}
          completedRuns={completedRuns}
          onOpenComparison={() => setView('compare')}
        />
      )}

      {view === 'playing' && session && playMode === 'labyrinth' && (
        <div
          className="h-screen h-[100dvh] w-screen bg-slate-950 overflow-hidden relative"
          data-state="playing"
          data-mode={session.mode}
          data-play-mode="labyrinth"
          data-detail={molecularDetail}
          data-oncologist-stage={session.oncologistStartStage ?? ''}
        >
          <Labyrinth3DView
            state={session}
            molecularDetail={molecularDetail}
            onMolecularDetailChange={setMolecularDetail}
            themeMode={theme}
            onThemeChange={setTheme}
            isExpanded={true}
            onBackHome={() => setView('start')}
            onSwitchToText={() => handlePlayModeChange('text')}
            onResolveCancerTurn={handleCancerTurn}
            onResolveOncologistTurn={handleOncologistTurn}
            onResolveOncologistDiagnostic={handleOncologistDiagnostic}
            onResolveOncologistObservation={handleOncologistObservation}
          />

          <TurnFeedbackModal
            resolution={pendingResolution}
            state={session}
            isFinished={session.finished}
            molecularDetail={molecularDetail}
            onContinue={handleContinueAfterFeedback}
            onBackHome={() => {
              setPendingResolution(null);
              setView('start');
            }}
          />
        </div>
      )}

      {view === 'playing' && session && playMode === 'text' && (
        <div
          className="min-h-screen bg-slate-50 dark:bg-[#0b1220] text-slate-900 dark:text-slate-100 flex flex-col transition-colors"
          data-state="playing"
          data-mode={session.mode}
          data-play-mode={playMode}
          data-detail={molecularDetail}
        >
          {/* Clean 3-Zone Top Bar */}
          <header className="w-full border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/95 shrink-0 transition-colors">
            <div className="max-w-[1600px] mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
              {/* Zone 1: Wordmark + Role & Round */}
              <div className="flex items-center gap-3 whitespace-nowrap shrink-0">
                <div className="flex items-center gap-2">
                  <Dna
                    className={`w-5 h-5 ${
                      session.mode === 'cancer'
                        ? 'text-rose-600 dark:text-rose-500'
                        : 'text-sky-600 dark:text-sky-400'
                    }`}
                    aria-hidden="true"
                  />
                  <span className="text-base font-bold tracking-tight text-slate-900 dark:text-white">
                    El laberinto del cáncer
                  </span>
                </div>
                <span
                  className="hidden sm:inline text-slate-300 dark:text-slate-700"
                  aria-hidden="true"
                >
                  |
                </span>
                <span className="hidden sm:inline text-xs font-semibold text-slate-900 dark:text-slate-100">
                  {session.mode === 'cancer' ? 'Rol Cáncer' : 'Rol Oncólogo'}
                </span>
                <span className="hidden lg:inline font-mono text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                  Ronda {session.currentRound} · {session.accumulatedProblems.length}{' '}
                  {session.accumulatedProblems.length === 1 ? 'cambio' : 'cambios'}
                </span>
              </div>

              {/* Zone 2: Live Mode & Molecular Detail Switches */}
              <div className="flex items-center gap-2.5 shrink-0">
                {/* Play Mode Switch */}
                <div
                  role="group"
                  aria-label="Cambiar modo de juego"
                  className="flex items-center gap-0.5 p-0.5 bg-slate-100 dark:bg-slate-800 rounded-lg"
                >
                  <button
                    type="button"
                    onClick={() => handlePlayModeChange('labyrinth')}
                    className="px-2.5 py-1 rounded-md text-[11px] font-semibold inline-flex items-center gap-1 whitespace-nowrap cursor-pointer transition-colors text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  >
                    <Box className="w-3 h-3" aria-hidden="true" />
                    Laberinto
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePlayModeChange('text')}
                    className="px-2.5 py-1 rounded-md text-[11px] font-semibold inline-flex items-center gap-1 whitespace-nowrap cursor-pointer transition-colors bg-white dark:bg-slate-950 text-slate-900 dark:text-white shadow-xs"
                  >
                    <FileText className="w-3 h-3" aria-hidden="true" />
                    Texto
                  </button>
                </div>

                {/* 3-Tier Molecular Detail Switch */}
                <div
                  role="group"
                  aria-label="Cambiar nivel de lenguaje"
                  className="hidden md:flex items-center gap-0.5 p-0.5 bg-slate-100 dark:bg-slate-800 rounded-lg"
                >
                  <button
                    type="button"
                    onClick={() => setMolecularDetail('simple')}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-semibold inline-flex items-center gap-1 whitespace-nowrap cursor-pointer transition-colors ${
                      molecularDetail === 'simple'
                        ? 'bg-white dark:bg-slate-950 text-emerald-700 dark:text-emerald-400 shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <Lightbulb className="w-3 h-3" aria-hidden="true" />
                    Simple
                  </button>
                  <button
                    type="button"
                    onClick={() => setMolecularDetail('logic')}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-semibold inline-flex items-center gap-1 whitespace-nowrap cursor-pointer transition-colors ${
                      molecularDetail === 'logic'
                        ? 'bg-white dark:bg-slate-950 text-slate-900 dark:text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <Cpu className="w-3 h-3" aria-hidden="true" />
                    Lógica
                  </button>
                  <button
                    type="button"
                    onClick={() => setMolecularDetail('precision')}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-semibold inline-flex items-center gap-1 whitespace-nowrap cursor-pointer transition-colors ${
                      molecularDetail === 'precision'
                        ? 'bg-white dark:bg-slate-950 text-slate-900 dark:text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <Microscope className="w-3 h-3" aria-hidden="true" />
                    Precisión
                  </button>
                </div>
              </div>

              {/* Zone 3: Theme Toggle, Quick Guide & Home (Teacher Mode hidden behind 5x 'h') */}
              <div className="flex items-center gap-2.5 shrink-0">
                <ThemeToggle theme={theme} onChange={setTheme} variant="compact" />
                <button
                  type="button"
                  onClick={() => setTutorialOpen(true)}
                  className="hidden xl:inline-flex items-center gap-1 text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white whitespace-nowrap cursor-pointer"
                >
                  <BookOpen className="w-3.5 h-3.5" aria-hidden="true" />
                  Guía
                </button>
                <button
                  type="button"
                  onClick={() => setView('start')}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <Home className="w-3.5 h-3.5" aria-hidden="true" />
                  Inicio
                </button>
              </div>
            </div>
          </header>

          {/* 3-Area Common Interface: Left (Actions) · Center (Laberinto 3D / Network / Clones) · Right (Destination / Consequences / Hallmarks) */}
          <main className="flex-1 max-w-[1600px] w-full mx-auto p-4 grid grid-cols-1 lg:grid-cols-12 gap-4 min-h-0">
            {/* Left Column (hidden when 3D Labyrinth is expanded) */}
            {!effectiveLabyrinthExpanded && (
              <div className="lg:col-span-4 xl:col-span-3 lg:h-[calc(100vh-5.5rem)] min-h-[520px]">
                {session.mode === 'cancer' ? (
                  <CancerPanel
                    state={session}
                    molecularDetail={molecularDetail}
                    onResolveTurn={handleCancerTurn}
                  />
                ) : (
                  <OncologistPanel
                    state={session}
                    molecularDetail={molecularDetail}
                    onResolveDiagnostic={handleOncologistDiagnostic}
                    onResolveIntervention={(therapyId) => handleOncologistTurn(therapyId, '')}
                    onResolveObservation={handleOncologistObservation}
                  />
                )}
              </div>
            )}

            {/* Center Column: Interactive Simulation Stage */}
            <div
              className={
                effectiveLabyrinthExpanded
                  ? 'lg:col-span-12 lg:h-[calc(100vh-5.5rem)] min-h-[560px]'
                  : 'lg:col-span-5 xl:col-span-6 lg:h-[calc(100vh-5.5rem)] min-h-[480px]'
              }
            >
              <MolecularCanvas
                state={session}
                playMode={playMode}
                molecularDetail={molecularDetail}
                themeMode={theme}
                stageTab={stageTab}
                onStageTabChange={(next) => {
                  setStageTab(next);
                  if (next !== 'labyrinth') setIsLabyrinthExpanded(false);
                }}
                isLabyrinthExpanded={isLabyrinthExpanded}
                onToggleLabyrinthExpand={() => setIsLabyrinthExpanded((prev) => !prev)}
                onResolveCancerTurn={handleCancerTurn}
                onResolveOncologistTurn={handleOncologistTurn}
                onResolveOncologistDiagnostic={handleOncologistDiagnostic}
                onResolveOncologistObservation={handleOncologistObservation}
                mode={session.mode}
                clones={session.clones}
                revealedGenes={session.revealedGenes}
                revealedClonalHeterogeneity={session.revealedClonalHeterogeneity}
                maxGenesVisible={session.teacherConfig.maxGenesVisible}
                customEvidence={customEvidence}
                activeTherapyName={activeTherapyLabel}
              />
            </div>

            {/* Right Column: Destination, Consequences & 9-Hallmarks Wheel */}
            {!effectiveLabyrinthExpanded && (
              <div className="lg:col-span-3 xl:col-span-3 lg:h-[calc(100vh-5.5rem)] min-h-[520px]">
                <ConsequencesPanel state={session} molecularDetail={molecularDetail} />
              </div>
            )}
          </main>

          <TurnFeedbackModal
            resolution={pendingResolution}
            state={session}
            isFinished={session.finished}
            molecularDetail={molecularDetail}
            onContinue={handleContinueAfterFeedback}
            onBackHome={() => {
              setPendingResolution(null);
              setView('start');
            }}
          />
        </div>
      )}

      {view === 'report' && session && (
        <ReportView
          state={session}
          molecularDetail={molecularDetail}
          hasOppositeRun={Boolean(activeComparison)}
          onSwitchPerspective={handleSwitchPerspective}
          onOpenComparison={() => setView('compare')}
          onBackHome={() => setView('start')}
          onRestartSame={() => handleStartMode(session.mode)}
        />
      )}

      {view === 'compare' && activeComparison && (
        <ComparisonView
          comparison={activeComparison}
          molecularDetail={molecularDetail}
          onBack={() => setView(session?.finished ? 'report' : 'start')}
        />
      )}

      <TutorialModal open={tutorialOpen} onClose={() => setTutorialOpen(false)} />

      <TeacherModal
        open={teacherOpen}
        config={{
          ...teacherConfig,
          defaultScenario: 'UNIFIED',
          defaultUnlimitedMode: true,
        }}
        molecularDetail={molecularDetail}
        customEvidenceCount={customEvidence.length}
        onSaveConfig={handleSaveTeacherConfig}
        onImportEvidence={handleImportEvidence}
        onResetSimulation={handleResetSimulation}
        onClose={() => setTeacherOpen(false)}
      />
    </>
  );
}
