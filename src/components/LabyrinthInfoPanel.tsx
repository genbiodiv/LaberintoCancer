import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Activity,
  Compass,
  Eye,
  EyeOff,
  GripHorizontal,
  Microscope,
  Move,
  Stethoscope,
} from 'lucide-react';
import {
  clampHudPanelPosition,
  DEFAULT_HUD_PANEL_CORNER,
  getHudCornerPositionClass,
  getNextHudPanelCorner,
  HUD_PANEL_CORNER_LABELS,
  HudPanelCorner,
  HudPanelPosition,
} from '../engine/hudPanelLayout';
import { CancerSeverityMetrics, LabyrinthVisualTheme } from '../engine/labyrinthAesthetics';
import {
  describeCurrentSituationSimple,
  getOncologistStageInfo,
} from '../engine/molecularAbstraction';
import { MolecularDetailMode, SimulationState } from '../engine/types';

interface LabyrinthInfoPanelProps {
  state: SimulationState;
  molecularDetail: MolecularDetailMode;
  oncologistPhase: 'diagnostic' | 'intervention' | null;
  destinationProgress: number;
  theme: LabyrinthVisualTheme;
  severity: CancerSeverityMetrics;
  containerRef: React.RefObject<HTMLDivElement | null>;
}

export const LabyrinthInfoPanel: React.FC<LabyrinthInfoPanelProps> = ({
  state,
  molecularDetail,
  oncologistPhase,
  destinationProgress,
  theme,
  severity,
  containerRef,
}) => {
  const [visible, setVisible] = useState<boolean>(true);
  const [corner, setCorner] = useState<HudPanelCorner>(DEFAULT_HUD_PANEL_CORNER);
  const [dragPos, setDragPos] = useState<HudPanelPosition | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  const panelRef = useRef<HTMLDivElement | null>(null);
  const dragOriginRef = useRef<{
    pointerId: number;
    startClientX: number;
    startClientY: number;
    originX: number;
    originY: number;
    panelWidth: number;
    panelHeight: number;
    containerWidth: number;
    containerHeight: number;
  } | null>(null);

  // Re-clamp dragged panel if viewport resizes so it never drifts off-screen
  useEffect(() => {
    if (!dragPos) return;
    const onResize = () => {
      const container = containerRef.current;
      const panel = panelRef.current;
      if (!container || !panel) return;
      const cRect = container.getBoundingClientRect();
      const pRect = panel.getBoundingClientRect();
      setDragPos((prev) =>
        prev
          ? clampHudPanelPosition(
              prev.x,
              prev.y,
              pRect.width,
              pRect.height,
              cRect.width,
              cRect.height,
              8
            )
          : null
      );
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [dragPos, containerRef]);

  const handleDragStart = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      // Ignore drags initiated from interactive buttons inside the header
      if ((e.target as HTMLElement).closest('button')) return;
      const container = containerRef.current;
      const panel = panelRef.current;
      if (!container || !panel) return;

      e.preventDefault();
      e.stopPropagation();

      const cRect = container.getBoundingClientRect();
      const pRect = panel.getBoundingClientRect();

      dragOriginRef.current = {
        pointerId: e.pointerId,
        startClientX: e.clientX,
        startClientY: e.clientY,
        originX: pRect.left - cRect.left,
        originY: pRect.top - cRect.top,
        panelWidth: pRect.width,
        panelHeight: pRect.height,
        containerWidth: cRect.width,
        containerHeight: cRect.height,
      };
      setIsDragging(true);
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch {
        // Ignore pointer capture errors on synthetic events
      }
    },
    [containerRef]
  );

  const handleDragMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragOriginRef.current;
    if (!drag || drag.pointerId !== e.pointerId) return;
    e.preventDefault();
    e.stopPropagation();

    const nextX = drag.originX + (e.clientX - drag.startClientX);
    const nextY = drag.originY + (e.clientY - drag.startClientY);
    setDragPos(
      clampHudPanelPosition(
        nextX,
        nextY,
        drag.panelWidth,
        drag.panelHeight,
        drag.containerWidth,
        drag.containerHeight,
        8
      )
    );
  }, []);

  const handleDragEnd = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragOriginRef.current;
    if (!drag || drag.pointerId !== e.pointerId) return;
    dragOriginRef.current = null;
    setIsDragging(false);
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // Ignore pointer release errors
    }
  }, []);

  const handleCycleCorner = useCallback(() => {
    setDragPos(null);
    setCorner((prev) => getNextHudPanelCorner(prev));
  }, []);

  const positionClass = dragPos ? '' : getHudCornerPositionClass(corner);
  const inlinePositionStyle: React.CSSProperties | undefined = dragPos
    ? { left: `${dragPos.x}px`, top: `${dragPos.y}px` }
    : undefined;

  if (!visible) {
    return (
      <div
        data-testid="hud-info-collapsed"
        data-corner={corner}
        className={`pointer-events-auto absolute z-20 ${getHudCornerPositionClass(corner)}`}
      >
        <button
          type="button"
          data-testid="hud-info-show-btn"
          onClick={(e) => {
            e.currentTarget.blur();
            setVisible(true);
          }}
          className="bg-slate-950/92 hover:bg-slate-900 border border-slate-700/90 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-100 inline-flex items-center gap-1.5 shadow-lg cursor-pointer transition-colors"
          title="Mostrar panel de información"
        >
          <Eye className="w-3.5 h-3.5 text-sky-400 shrink-0" aria-hidden="true" />
          <span>Info · R{state.currentRound}</span>
        </button>
      </div>
    );
  }

  return (
    <div
      ref={panelRef}
      data-testid="hud-info-panel"
      data-corner={dragPos ? 'custom' : corner}
      style={inlinePositionStyle}
      className={`pointer-events-auto absolute z-20 w-[236px] sm:w-[286px] bg-slate-950/92 border border-slate-700/90 rounded-lg text-slate-100 shadow-lg select-none ${positionClass} ${
        isDragging ? 'ring-2 ring-sky-400/80 shadow-2xl' : ''
      }`}
    >
      {/* Drag Handle + Move Corner + Hide Controls */}
      <div
        data-testid="hud-info-drag-handle"
        onPointerDown={handleDragStart}
        onPointerMove={handleDragMove}
        onPointerUp={handleDragEnd}
        onPointerCancel={handleDragEnd}
        className={`flex items-center justify-between gap-1.5 px-2.5 py-1.5 border-b border-slate-800/90 touch-none ${
          isDragging ? 'cursor-grabbing' : 'cursor-grab'
        }`}
        title="Arrastra para mover este panel"
      >
        <span className="inline-flex items-center gap-1.5 text-[10px] sm:text-[11px] font-mono text-slate-300 min-w-0 truncate">
          <GripHorizontal className="w-3.5 h-3.5 text-slate-500 shrink-0" aria-hidden="true" />
          {state.mode === 'oncologist' ? (
            oncologistPhase === 'diagnostic' ? (
              <Microscope className="w-3.5 h-3.5 shrink-0 text-cyan-400" aria-hidden="true" />
            ) : (
              <Stethoscope className="w-3.5 h-3.5 shrink-0 text-sky-400" aria-hidden="true" />
            )
          ) : (
            <Compass className="w-3.5 h-3.5 shrink-0 text-rose-400" aria-hidden="true" />
          )}
          <span className="truncate font-semibold text-slate-100">
            <span className="sm:hidden">R{state.currentRound}</span>
            <span className="hidden sm:inline">Ronda {state.currentRound}</span>
            {state.mode === 'oncologist' &&
              ` · ${
                oncologistPhase === 'diagnostic'
                  ? molecularDetail === 'simple'
                    ? 'Estudio'
                    : 'Diagnóstico'
                  : molecularDetail === 'simple'
                    ? 'Tratamiento'
                    : 'Intervención'
              }`}
          </span>
        </span>

        <div className="flex items-center gap-0.5 shrink-0">
          <button
            type="button"
            data-testid="hud-info-move-btn"
            onClick={(e) => {
              e.stopPropagation();
              e.currentTarget.blur();
              handleCycleCorner();
            }}
            aria-label={`Mover panel a otra esquina (actual: ${
              dragPos ? 'Posición libre' : HUD_PANEL_CORNER_LABELS[corner]
            })`}
            title="Mover a otra esquina (o arrastra la barra superior)"
            className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-sky-300 cursor-pointer transition-colors"
          >
            <Move className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
          <button
            type="button"
            data-testid="hud-info-hide-btn"
            onClick={(e) => {
              e.stopPropagation();
              e.currentTarget.blur();
              setVisible(false);
            }}
            aria-label="Ocultar panel de información"
            title="Ocultar panel de información"
            className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer transition-colors"
          >
            <EyeOff className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Panel Body */}
      <div className="px-2.5 sm:px-3 py-2 space-y-1.5">
        <div className="flex items-center justify-between gap-2 text-[11px]">
          <span className="font-semibold text-white truncate">
            {state.mode === 'oncologist'
              ? `${getOncologistStageInfo(state.oncologistStartStage ?? 'early', molecularDetail).label} · ${
                  state.revealedExtent
                    ? state.clinical.diseaseExtent
                    : 'Extensión: Sin definir'
                }`
              : theme.phaseLabel}
          </span>
          <span className="text-slate-200 font-mono text-[10px] sm:text-[11px] font-semibold tabular-nums whitespace-nowrap shrink-0">
            {state.mode === 'cancer'
              ? `Carga ${state.clinical.tumorBurden}/100`
              : `Progreso ${destinationProgress}%`}
          </span>
        </div>

        <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${
              state.mode === 'cancer'
                ? theme.phase >= 2
                  ? 'bg-amber-400'
                  : 'bg-rose-500'
                : theme.phase >= 2
                  ? 'bg-emerald-400'
                  : 'bg-sky-400'
            }`}
            style={{ width: `${destinationProgress}%` }}
          />
        </div>

        <div
          data-testid="labyrinth-severity-badge"
          className="pt-1 border-t border-slate-800/90 flex items-center justify-between gap-2 text-[11px]"
        >
          <span className="inline-flex items-center gap-1.5 font-medium text-slate-200">
            <span
              className="w-2 h-2 rounded-full shrink-0"
              style={{ backgroundColor: severity.accentCss }}
              aria-hidden="true"
            />
            <span>Carga: {severity.shortLabel}</span>
          </span>
          <span className="inline-flex items-center gap-2 font-mono text-[10px] text-slate-400 tabular-nums shrink-0">
            <span>
              {state.accumulatedProblems.length}{' '}
              {state.accumulatedProblems.length === 1 ? 'cambio' : 'cambios'}
            </span>
            <span className="inline-flex items-center gap-0.5">
              <Activity
                className="w-3 h-3 shrink-0"
                style={{ color: severity.accentCss }}
                aria-hidden="true"
              />
              {severity.heartbeatBpm} ppm
            </span>
          </span>
        </div>

        {molecularDetail === 'simple' && (
          <p
            data-testid="labyrinth-simple-summary"
            className="pt-1.5 border-t border-slate-800/90 text-[11px] leading-snug text-emerald-200/95"
          >
            {describeCurrentSituationSimple(state)}
          </p>
        )}
      </div>
    </div>
  );
};
