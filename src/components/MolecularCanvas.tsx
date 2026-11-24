import React, { useMemo, useState } from 'react';
import {
  Background,
  Controls,
  Edge,
  Handle,
  MarkerType,
  Node,
  NodeProps,
  Position,
  ReactFlow,
} from '@xyflow/react';
import {
  AlertCircle,
  Box,
  CheckCircle2,
  EyeOff,
  GitBranch,
  HelpCircle,
  Layers,
  MinusCircle,
  TrendingUp,
  X,
} from 'lucide-react';
import { GENES_LIBRARY, MOLECULAR_EDGES } from '../engine/knowledgeBase';
import {
  formatBiologyText,
  getGeneDisplayShort,
  getGeneDisplayTitle,
} from '../engine/molecularAbstraction';
import { UNIFIED_FEATURED_GENES } from '../engine/progressionEngine';
import { getDominantNetworkGeneStates } from '../engine/simulator';
import {
  CosmicEvidenceRecord,
  DiagnosticToolId,
  GameMode,
  GeneDefinition,
  GeneState,
  MolecularDetailMode,
  PlayMode,
  SimulationState,
  TherapyId,
  TumorClone,
} from '../engine/types';
import { Labyrinth3DView } from './Labyrinth3DView';

interface GeneNodeData extends Record<string, unknown> {
  gene: GeneDefinition;
  state: GeneState | 'unknown';
  isHighlighted: boolean;
  molecularDetail: MolecularDetailMode;
  onSelect: (symbol: string) => void;
}

const STATE_META: Record<
  GeneState | 'unknown',
  {
    label: string;
    symbol: string;
    border: string;
    bg: string;
    text: string;
    accentText: string;
  }
> = {
  functional: {
    label: 'Funcional',
    symbol: '●',
    border: 'border-slate-300',
    bg: 'bg-white',
    text: 'text-slate-900',
    accentText: 'text-emerald-700',
  },
  activated: {
    label: 'Activado',
    symbol: '▲',
    border: 'border-rose-400',
    bg: 'bg-rose-50/70',
    text: 'text-slate-900',
    accentText: 'text-rose-700',
  },
  reduced: {
    label: 'Reducido',
    symbol: '▼',
    border: 'border-amber-400',
    bg: 'bg-amber-50/70',
    text: 'text-slate-900',
    accentText: 'text-amber-700',
  },
  inactivated: {
    label: 'Inactivado',
    symbol: '✕',
    border: 'border-slate-400 border-dashed',
    bg: 'bg-slate-100',
    text: 'text-slate-700',
    accentText: 'text-slate-600',
  },
  unknown: {
    label: 'Sin dato',
    symbol: '?',
    border: 'border-slate-200 border-dashed',
    bg: 'bg-slate-50',
    text: 'text-slate-400',
    accentText: 'text-slate-400',
  },
};

const COMPARTMENT_SHORT: Record<GeneDefinition['compartment'], string> = {
  membrane: 'Membrana',
  cytoplasm: 'Señalización',
  cycle_nucleus: 'Ciclo / Núcleo',
  damage_apoptosis: 'Daño / Apoptosis',
  microenvironment: 'Microambiente',
};

const GeneNodeComponent: React.FC<NodeProps<Node<GeneNodeData>>> = ({ data }) => {
  const { gene, state, isHighlighted, molecularDetail, onSelect } = data;
  const meta = STATE_META[state];
  const nodeLabel = getGeneDisplayShort(gene.symbol, molecularDetail);

  return (
    <button
      type="button"
      onClick={() => onSelect(gene.symbol)}
      aria-label={`${molecularDetail === 'precision' ? `Gen ${gene.symbol}` : nodeLabel}, estado ${meta.label}`}
      className={`w-[162px] text-left rounded-lg border px-2.5 py-2 transition-all duration-150 cursor-pointer focus-visible:outline-2 focus-visible:outline-sky-500 ${
        meta.border
      } ${meta.bg} ${isHighlighted ? 'ring-2 ring-sky-500' : 'hover:border-slate-400'}`}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!w-1.5 !h-1.5 !bg-slate-400 !border-none"
      />
      <div className="flex items-center justify-between gap-1">
        <span
          className={`${
            molecularDetail === 'precision' ? 'font-mono text-xs' : 'text-[11px]'
          } font-semibold tracking-tight truncate ${meta.text}`}
          title={nodeLabel}
        >
          {nodeLabel}
        </span>
        <span className={`text-[10px] font-medium shrink-0 ${meta.accentText}`}>
          {meta.symbol} {meta.label}
        </span>
      </div>
      <div className="mt-1 text-[10px] text-slate-500 truncate">
        {COMPARTMENT_SHORT[gene.compartment]}
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-1.5 !h-1.5 !bg-slate-400 !border-none"
      />
    </button>
  );
};

const nodeTypes = { geneNode: GeneNodeComponent };

export type StageViewTab = 'labyrinth' | 'network' | 'clones';

interface MolecularCanvasProps {
  state: SimulationState;
  playMode: PlayMode;
  molecularDetail: MolecularDetailMode;
  stageTab: StageViewTab;
  onStageTabChange: (tab: StageViewTab) => void;
  isLabyrinthExpanded: boolean;
  onToggleLabyrinthExpand: () => void;
  onResolveCancerTurn: (strategyId: string, predictionId: string) => void;
  onResolveOncologistTurn: (therapyId: TherapyId, predictionId: string) => void;
  onResolveOncologistDiagnostic: (toolId: DiagnosticToolId) => void;
  onResolveOncologistObservation: () => void;
  mode: GameMode;
  clones: TumorClone[];
  revealedGenes: string[];
  revealedClonalHeterogeneity: boolean;
  maxGenesVisible: number;
  customEvidence: CosmicEvidenceRecord[];
  activeTherapyName?: string;
}

export const MolecularCanvas: React.FC<MolecularCanvasProps> = ({
  state,
  playMode,
  molecularDetail,
  stageTab,
  onStageTabChange,
  isLabyrinthExpanded,
  onToggleLabyrinthExpand,
  onResolveCancerTurn,
  onResolveOncologistTurn,
  onResolveOncologistDiagnostic,
  onResolveOncologistObservation,
  mode,
  clones,
  revealedGenes,
  revealedClonalHeterogeneity,
  maxGenesVisible,
  customEvidence,
  activeTherapyName,
}) => {
  const [selectedGeneSymbol, setSelectedGeneSymbol] = useState<string | null>(null);
  const fmt = (text: string) => formatBiologyText(text, molecularDetail);
  const effectiveStageTab: StageViewTab =
    playMode === 'text' && stageTab === 'labyrinth' ? 'network' : stageTab;

  const dominantStates = useMemo(() => getDominantNetworkGeneStates(clones), [clones]);

  const visibleGenes = useMemo(() => {
    const allowedSymbols = UNIFIED_FEATURED_GENES.slice(0, maxGenesVisible);
    return GENES_LIBRARY.filter((g) => allowedSymbols.includes(g.symbol));
  }, [maxGenesVisible]);

  const nodes: Node<GeneNodeData>[] = useMemo(() => {
    return visibleGenes.map((gene) => {
      const isKnown = mode === 'cancer' || revealedGenes.includes(gene.symbol);
      const geneState: GeneState | 'unknown' = isKnown
        ? dominantStates[gene.symbol] ?? 'functional'
        : 'unknown';
      return {
        id: gene.symbol,
        type: 'geneNode',
        position: gene.position,
        data: {
          gene,
          state: geneState,
          isHighlighted: selectedGeneSymbol === gene.symbol,
          molecularDetail,
          onSelect: (sym: string) => setSelectedGeneSymbol(sym),
        },
      };
    });
  }, [visibleGenes, mode, revealedGenes, dominantStates, selectedGeneSymbol, molecularDetail]);

  const edges: Edge[] = useMemo(() => {
    const visibleSet = new Set(visibleGenes.map((g) => g.symbol));
    return MOLECULAR_EDGES.filter(
      (e) => visibleSet.has(e.source) && visibleSet.has(e.target)
    ).map((e) => {
      const sourceKnown = mode === 'cancer' || revealedGenes.includes(e.source);
      const sourceState = sourceKnown ? dominantStates[e.source] : 'unknown';
      const isActiveDrive = e.relation === 'activation' && sourceState === 'activated';
      const isBrokenInhibition = e.relation === 'inhibition' && sourceState === 'inactivated';
      const isInhibition = e.relation === 'inhibition';

      const strokeColor = !sourceKnown
        ? '#cbd5e1'
        : isActiveDrive
          ? '#e11d48'
          : isBrokenInhibition
            ? '#94a3b8'
            : isInhibition
              ? '#0284c7'
              : '#64748b';

      return {
        id: e.id,
        source: e.source,
        target: e.target,
        animated: false,
        type: 'smoothstep',
        style: {
          stroke: strokeColor,
          strokeWidth: isActiveDrive ? 2.5 : 1.5,
          strokeDasharray: !sourceKnown || isBrokenInhibition ? '5 4' : undefined,
        },
        markerEnd: {
          type: isInhibition ? MarkerType.Arrow : MarkerType.ArrowClosed,
          color: strokeColor,
          width: 16,
          height: 16,
        },
        label: isInhibition ? '⊣' : '→',
        labelStyle: {
          fill: strokeColor,
          fontSize: 12,
          fontWeight: 700,
        },
        labelBgStyle: {
          fill: '#f8fafc',
          fillOpacity: 0.92,
        },
      };
    });
  }, [visibleGenes, mode, revealedGenes, dominantStates]);

  const selectedGene = useMemo(
    () => visibleGenes.find((g) => g.symbol === selectedGeneSymbol) ?? null,
    [visibleGenes, selectedGeneSymbol]
  );

  const selectedGeneKnown =
    selectedGene !== null && (mode === 'cancer' || revealedGenes.includes(selectedGene.symbol));

  const extraEvidenceForSelected = useMemo(() => {
    if (!selectedGene) return [];
    return customEvidence.filter((rec) => rec.geneSymbol === selectedGene.symbol);
  }, [selectedGene, customEvidence]);

  return (
    <div className="flex flex-col h-full bg-white border border-slate-200 rounded-xl overflow-hidden">
      {/* Compact Stage Header */}
      <div className="px-4 py-2.5 border-b border-slate-200 flex items-center justify-between gap-3 bg-slate-50/70 shrink-0">
        <div role="tablist" aria-label="Vista de simulación" className="flex items-center gap-1 p-0.5 bg-slate-200/70 rounded-lg">
          {playMode === 'labyrinth' && (
            <button
              type="button"
              role="tab"
              aria-selected={effectiveStageTab === 'labyrinth'}
              onClick={() => onStageTabChange('labyrinth')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors inline-flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                effectiveStageTab === 'labyrinth'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Box className="w-3.5 h-3.5" aria-hidden="true" />
              Laberinto 3D
            </button>
          )}
          <button
            type="button"
            role="tab"
            aria-selected={effectiveStageTab === 'network'}
            onClick={() => onStageTabChange('network')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors inline-flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              effectiveStageTab === 'network'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <GitBranch className="w-3.5 h-3.5" aria-hidden="true" />
            {molecularDetail === 'precision' ? 'Red molecular' : 'Red de procesos'}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={effectiveStageTab === 'clones'}
            onClick={() => onStageTabChange('clones')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors inline-flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              effectiveStageTab === 'clones'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5" aria-hidden="true" />
            Población clonal
          </button>
        </div>

        {/* Concise inline legend */}
        <div className="hidden xl:flex items-center gap-3 text-[11px] text-slate-500 whitespace-nowrap">
          {effectiveStageTab === 'labyrinth' ? (
            <>
              <span className="text-slate-700 font-medium">Senderos que se bifurcan</span>
              {activeTherapyName && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="text-slate-800 font-medium">Terapia: {activeTherapyName}</span>
                </>
              )}
            </>
          ) : (
            <>
              <span className="text-rose-600 font-medium">→ Activación</span>
              <span aria-hidden="true">·</span>
              <span className="text-sky-700 font-medium">⊣ Inhibición</span>
              {activeTherapyName && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="text-slate-800 font-medium">Terapia: {activeTherapyName}</span>
                </>
              )}
            </>
          )}
        </div>
      </div>

      {/* Interactive Stage Body */}
      <div className="relative flex-1 w-full h-[520px] lg:h-full min-h-[460px]" data-testid="simulation-canvas">
        {effectiveStageTab === 'labyrinth' ? (
          <Labyrinth3DView
            state={state}
            molecularDetail={molecularDetail}
            isExpanded={isLabyrinthExpanded}
            onToggleExpand={onToggleLabyrinthExpand}
            onResolveCancerTurn={onResolveCancerTurn}
            onResolveOncologistTurn={onResolveOncologistTurn}
            onResolveOncologistDiagnostic={onResolveOncologistDiagnostic}
            onResolveOncologistObservation={onResolveOncologistObservation}
          />
        ) : effectiveStageTab === 'network' ? (
          <>
            <div className="w-full h-full">
              <ReactFlow
                nodes={nodes}
                edges={edges}
                nodeTypes={nodeTypes}
                fitView
                fitViewOptions={{ padding: 0.14 }}
                nodesDraggable={false}
                nodesConnectable={false}
                proOptions={{ hideAttribution: true }}
                minZoom={0.55}
                maxZoom={1.35}
              >
                <Background gap={20} size={1} color="#e2e8f0" />
                <Controls showInteractive={false} />
              </ReactFlow>
            </div>

            {/* Compact hint for fog-of-war in Oncologist mode */}
            {mode === 'oncologist' && revealedGenes.length === 0 && (
              <div className="absolute top-3 left-3 bg-white/95 border border-slate-200 rounded-lg px-3 py-2 flex items-center gap-2 shadow-xs">
                <EyeOff className="w-3.5 h-3.5 text-sky-600 shrink-0" aria-hidden="true" />
                <p className="text-xs text-slate-600">
                  Usa una prueba diagnóstica para revelar la red.
                </p>
              </div>
            )}

            {/* Gene / Process Inspector Drawer (on node click) */}
            {selectedGene && (
              <div
                role="region"
                aria-label={`Detalle de ${getGeneDisplayTitle(selectedGene, molecularDetail)}`}
                className="absolute bottom-3 left-3 right-3 bg-white/98 border border-slate-300 rounded-xl p-4 shadow-sm max-h-60 overflow-y-auto"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                      <span
                        className={`${
                          molecularDetail === 'precision' ? 'font-mono' : ''
                        } text-sm font-bold text-slate-900`}
                      >
                        {getGeneDisplayTitle(selectedGene, molecularDetail)}
                      </span>
                      {molecularDetail === 'precision' && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span>{selectedGene.name}</span>
                        </>
                      )}
                      <span aria-hidden="true">·</span>
                      <span>{fmt(selectedGene.pathway)}</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedGeneSymbol(null)}
                    aria-label="Cerrar detalle"
                    className="p-1 text-slate-400 hover:text-slate-700 rounded cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {!selectedGeneKnown ? (
                  <div className="mt-2.5 flex items-center gap-2 text-xs text-slate-600">
                    <HelpCircle className="w-4 h-4 text-slate-400 shrink-0" aria-hidden="true" />
                    <span>
                      Estado aún desconocido en este paciente. Realiza el estudio diagnóstico
                      correspondiente para caracterizar{' '}
                      {getGeneDisplayTitle(selectedGene, molecularDetail).toLowerCase()}.
                    </span>
                  </div>
                ) : (
                  <div className="mt-2.5 space-y-2 text-xs text-slate-700">
                    <p>
                      <strong className="text-slate-900">Función normal:</strong>{' '}
                      {fmt(selectedGene.normalFunction)}
                    </p>
                    <p>
                      <strong className="text-slate-900">Consecuencia funcional:</strong>{' '}
                      {fmt(selectedGene.alteredConsequence)}
                    </p>
                    {molecularDetail === 'precision' &&
                      [...selectedGene.cosmicEvidence, ...extraEvidenceForSelected].map(
                        (ev, idx) => (
                          <div
                            key={`${ev.cosmicGeneId}-${idx}`}
                            className="pt-2 border-t border-slate-100 text-[11px] text-slate-600 space-y-0.5"
                          >
                            <div className="font-mono text-slate-500">
                              COSMIC {ev.cosmicGeneId} · PMID {ev.pubmedPmid} · {ev.hallmarkLabel} (
                              {ev.impact}) · {ev.cellLine}
                            </div>
                            <p>{ev.molecularExplanation}</p>
                          </div>
                        )
                      )}
                  </div>
                )}
              </div>
            )}
          </>
        ) : (
          /* Clonal Population Arena View */
          <div className="p-5 h-full overflow-y-auto space-y-5">
            {mode === 'oncologist' && !revealedClonalHeterogeneity ? (
              <div className="h-full flex flex-col items-center justify-center text-center max-w-md mx-auto py-12 gap-3">
                <EyeOff className="w-7 h-7 text-slate-400" aria-hidden="true" />
                <h3 className="text-sm font-semibold text-slate-900">
                  Heterogeneidad clonal aún no caracterizada
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Solicita el{' '}
                  <strong className="text-slate-900">
                    {molecularDetail === 'precision' ? 'Perfil NGS' : 'Análisis funcional'}
                  </strong>{' '}
                  o el <strong className="text-slate-900">Seguimiento molecular</strong> para
                  detectar subclones minoritarios y resistencias.
                </p>
              </div>
            ) : (
              <>
                {/* Visual proportion bar */}
                <div>
                  <div className="text-xs font-semibold text-slate-900 mb-2">
                    Composición clonal
                  </div>
                  <div className="w-full h-7 rounded-lg overflow-hidden flex border border-slate-200 bg-slate-100">
                    {clones.map((clone, idx) => {
                      const colors = ['bg-rose-500', 'bg-amber-500', 'bg-sky-600'];
                      return (
                        <div
                          key={clone.id}
                          style={{ width: `${clone.share}%` }}
                          className={`${colors[idx % colors.length]} h-full transition-all duration-300 flex items-center justify-center text-[11px] font-mono font-semibold text-white overflow-hidden px-1`}
                          title={`${fmt(clone.name)}: ${clone.share}%`}
                        >
                          {clone.share >= 14 ? `${clone.share}%` : ''}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Detailed Clone Cards */}
                <div className="grid grid-cols-1 gap-3.5">
                  {clones.map((clone, idx) => {
                    const accentColors = ['text-rose-700', 'text-amber-700', 'text-sky-700'];
                    const originLabel =
                      clone.origin === 'founder'
                        ? 'Clon fundador'
                        : clone.origin === 'preexisting'
                          ? 'Subclon preexistente'
                          : 'Variante emergente';
                    return (
                      <div
                        key={clone.id}
                        className="border border-slate-200 rounded-lg p-4 bg-slate-50/50 space-y-2.5"
                      >
                        <div className="flex items-baseline justify-between gap-2">
                          <div>
                            <h4 className="text-sm font-semibold text-slate-900">
                              {fmt(clone.name)}
                            </h4>
                            <div className="text-xs text-slate-500 mt-0.5">
                              <span>{originLabel}</span>
                              <span aria-hidden="true"> · </span>
                              <span
                                className={
                                  molecularDetail === 'precision' ? 'font-mono' : 'font-medium'
                                }
                              >
                                {fmt(clone.shortTag)}
                              </span>
                            </div>
                          </div>
                          <span
                            className={`font-mono text-lg font-bold tabular-nums ${accentColors[idx % accentColors.length]}`}
                          >
                            {clone.share}%
                          </span>
                        </div>

                        <p className="text-xs text-slate-600 leading-relaxed">
                          {fmt(clone.description)}
                        </p>

                        {/* Compact metrics grid */}
                        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-200/70 text-[11px]">
                          <div className="flex items-center gap-1.5 text-slate-700">
                            <TrendingUp className="w-3.5 h-3.5 text-rose-600 shrink-0" aria-hidden="true" />
                            <span>
                              Proliferación{' '}
                              <strong className="font-mono tabular-nums">
                                {clone.proliferationRate}
                              </strong>
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 text-slate-700">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" aria-hidden="true" />
                            <span>
                              Sens. apoptosis{' '}
                              <strong className="font-mono tabular-nums">
                                {clone.apoptosisSensitivity}
                              </strong>
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 text-slate-700">
                            <MinusCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" aria-hidden="true" />
                            <span>
                              Costo metab.{' '}
                              <strong className="font-mono tabular-nums">
                                {clone.metabolicCost}
                              </strong>
                            </span>
                          </div>
                        </div>

                        <div className="text-[11px] text-slate-600 flex items-start gap-1.5 pt-1">
                          <AlertCircle className="w-3.5 h-3.5 text-sky-600 shrink-0 mt-0.5" aria-hidden="true" />
                          <span>
                            <strong className="text-slate-800">Vulnerabilidades:</strong>{' '}
                            {clone.vulnerabilities.map((v) => fmt(v)).join(' · ')}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
