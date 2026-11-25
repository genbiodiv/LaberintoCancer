import React, { useEffect, useState } from 'react';
import {
  RotateCcw,
  SlidersHorizontal,
  Upload,
  X,
} from 'lucide-react';
import { clampDecisionRoundCount } from '../engine/decisionTree';
import { parseCustomEvidenceRows } from '../engine/simulator';
import {
  CosmicEvidenceRecord,
  GameMode,
  MolecularDetailMode,
  TeacherConfig,
} from '../engine/types';
import { DecisionTreeSelector } from './DecisionTreeSelector';

interface TeacherModalProps {
  open: boolean;
  config: TeacherConfig;
  molecularDetail: MolecularDetailMode;
  customEvidenceCount: number;
  onSaveConfig: (next: TeacherConfig) => void;
  onImportEvidence: (records: CosmicEvidenceRecord[]) => void;
  onResetSimulation: () => void;
  onClose: () => void;
}

export const TeacherModal: React.FC<TeacherModalProps> = ({
  open,
  config,
  molecularDetail,
  customEvidenceCount,
  onSaveConfig,
  onImportEvidence,
  onResetSimulation,
  onClose,
}) => {
  const [draft, setDraft] = useState<TeacherConfig>(() => ({
    ...config,
    roundCount: clampDecisionRoundCount(config.roundCount),
  }));
  const [uploadStatus, setUploadStatus] = useState<string>('');

  useEffect(() => {
    if (open) {
      setDraft({
        ...config,
        roundCount: clampDecisionRoundCount(config.roundCount),
      });
    }
  }, [open, config]);

  if (!open) return null;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      let rows: Record<string, unknown>[] = [];
      if (file.name.endsWith('.json')) {
        const text = await file.text();
        const parsed = JSON.parse(text);
        rows = Array.isArray(parsed) ? parsed : [];
      } else {
        const XLSX = await import('xlsx');
        const buffer = await file.arrayBuffer();
        const wb = XLSX.read(buffer, { type: 'array' });
        const sheetName =
          wb.SheetNames.find((n) => n.toLowerCase().includes('cosmic')) ?? wb.SheetNames[0];
        rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(wb.Sheets[sheetName]);
      }
      const { records, skipped } = parseCustomEvidenceRows(rows);
      if (records.length > 0) {
        onImportEvidence(records);
        setUploadStatus(
          `Cargados ${records.length} registros de evidencia COSMIC (${skipped} filas omitidas).`
        );
      } else {
        setUploadStatus(
          'No se encontraron columnas válidas (GENE_SYMBOL, DESCRIPTION, HALLMARK, PUBMED_PMID).'
        );
      }
    } catch {
      setUploadStatus('Error al leer el archivo. Usa formato .xlsx, .csv o .json.');
    }
    e.target.value = '';
  };

  const handleApply = () => {
    onSaveConfig({
      ...draft,
      defaultScenario: 'UNIFIED',
      roundCount: clampDecisionRoundCount(draft.roundCount),
    });
    onClose();
  };

  const clampedRounds = clampDecisionRoundCount(draft.roundCount);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="teacher-modal-title"
      className="fixed inset-0 z-50 bg-slate-900/45 dark:bg-black/70 flex items-center justify-center p-4"
    >
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl max-w-5xl w-full max-h-[90vh] flex flex-col overflow-hidden shadow-lg">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-950/70">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-sky-600 dark:text-sky-400" aria-hidden="true" />
            <h2 id="teacher-modal-title" className="text-base font-bold text-slate-900 dark:text-white">
              Modo docente · Configuración de sesión
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar modo docente"
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* Progression Tree (Teacher Mode Exclusive) */}
          <DecisionTreeSelector
            roundCount={clampedRounds}
            onRoundCountChange={(count) => setDraft((prev) => ({ ...prev, roundCount: count }))}
            molecularDetail={molecularDetail}
          />

          {/* Mode & Gene Limit Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="teacher-mode"
                className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
              >
                Modo sugerido
              </label>
              <select
                id="teacher-mode"
                value={draft.defaultMode}
                onChange={(e) => setDraft({ ...draft, defaultMode: e.target.value as GameMode })}
                className="w-full h-9 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs text-slate-900 dark:text-slate-100"
              >
                <option value="cancer">Modo Cáncer</option>
                <option value="oncologist">Modo Oncólogo</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="teacher-genes"
                className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
              >
                <span>Límite de genes visibles</span>
                <span className="font-mono text-slate-900 dark:text-white tabular-nums">
                  {draft.maxGenesVisible}
                </span>
              </label>
              <input
                id="teacher-genes"
                type="range"
                min={6}
                max={14}
                step={1}
                value={draft.maxGenesVisible}
                onChange={(e) => setDraft({ ...draft, maxGenesVisible: Number(e.target.value) })}
                className="w-full accent-sky-600 dark:accent-sky-400"
              />
            </div>
          </div>

          {/* Toggles */}
          <div className="space-y-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
            <label className="flex items-center justify-between gap-3 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
              <span>Activar pistas pedagógicas durante la partida</span>
              <input
                type="checkbox"
                checked={draft.hintsEnabled}
                onChange={(e) => setDraft({ ...draft, hintsEnabled: e.target.checked })}
                className="w-4 h-4 accent-sky-600 dark:accent-sky-400"
              />
            </label>
            <label className="flex items-center justify-between gap-3 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
              <span>Mostrar información molecular completa desde inicio en Modo Oncólogo</span>
              <input
                type="checkbox"
                checked={draft.revealMolecularInOncologist}
                onChange={(e) =>
                  setDraft({ ...draft, revealMolecularInOncologist: e.target.checked })
                }
                className="w-4 h-4 accent-sky-600 dark:accent-sky-400"
              />
            </label>
          </div>

          {/* Custom COSMIC Table Upload */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-900 dark:text-white">
                Cargar tabla de genes y evidencias (COSMIC HoC)
              </span>
              <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                {customEvidenceCount} registros adicionales
              </span>
            </div>
            <label className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg border border-dashed border-slate-300 dark:border-slate-700 hover:border-sky-400 dark:hover:border-sky-500 bg-slate-50 dark:bg-slate-950/60 text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer transition-colors">
              <Upload className="w-4 h-4 text-sky-600 dark:text-sky-400" aria-hidden="true" />
              <span>Seleccionar archivo .xlsx, .csv o .json</span>
              <input
                type="file"
                accept=".xlsx,.xls,.csv,.json"
                onChange={handleFileUpload}
                className="sr-only"
              />
            </label>
            {uploadStatus && <p className="text-xs text-sky-800 dark:text-sky-300">{uploadStatus}</p>}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/70 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => {
              onResetSimulation();
              onClose();
            }}
            className="px-3.5 py-2 rounded-lg text-xs font-medium text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 inline-flex items-center gap-1.5 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
            Reiniciar simulación activa
          </button>

          <button
            type="button"
            onClick={handleApply}
            className="px-5 py-2 rounded-lg text-xs font-semibold text-white bg-slate-900 dark:bg-sky-600 hover:bg-slate-800 dark:hover:bg-sky-500 cursor-pointer"
          >
            Guardar configuración
          </button>
        </div>
      </div>
    </div>
  );
};
