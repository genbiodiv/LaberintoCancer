import React, { useEffect, useState } from 'react';
import { Crosshair, RotateCcw, SlidersHorizontal, Smartphone, X } from 'lucide-react';
import {
  computeMotionDiagnostics,
  LabyrinthCameraMode,
  MOTION_DEADZONE_MAX_DEG,
  MOTION_DEADZONE_MIN_DEG,
  MOTION_SENSITIVITY_MAX,
  MOTION_SENSITIVITY_MIN,
  MotionCalibration,
  MotionDiagnostics,
  MotionSensorSettings,
} from '../engine/motionControls';

interface MotionSensorModalProps {
  open: boolean;
  motionActive: boolean;
  sensorNotice?: string | null;
  cameraMode: LabyrinthCameraMode;
  settings: MotionSensorSettings;
  onChangeSettings: (patch: Partial<MotionSensorSettings>) => void;
  onResetSettings: () => void;
  onToggleMotion: () => Promise<void> | void;
  onCalibrateNeutral: () => void;
  getLiveReading: () => {
    orientation: { beta: number | null; gamma: number | null };
    calibration: MotionCalibration | null;
  };
  onClose: () => void;
}

const SENSITIVITY_PRESETS: { id: string; label: string; value: number }[] = [
  { id: 'low', label: 'Baja', value: 0.6 },
  { id: 'medium', label: 'Media', value: 1.0 },
  { id: 'high', label: 'Alta', value: 1.6 },
];

export const MotionSensorModal: React.FC<MotionSensorModalProps> = ({
  open,
  motionActive,
  sensorNotice,
  cameraMode,
  settings,
  onChangeSettings,
  onResetSettings,
  onToggleMotion,
  onCalibrateNeutral,
  getLiveReading,
  onClose,
}) => {
  const [diag, setDiag] = useState<MotionDiagnostics | null>(null);
  const [calibratedFeedback, setCalibratedFeedback] = useState(false);

  // Sample live tilt diagnostics only while this modal is open (~16Hz)
  useEffect(() => {
    if (!open) return;

    const sample = () => {
      const { orientation, calibration } = getLiveReading();
      const effectiveCal = calibration ?? {
        beta: orientation.beta ?? 45,
        gamma: orientation.gamma ?? 0,
      };
      const screenAngle =
        typeof window !== 'undefined' && typeof window.screen?.orientation?.angle === 'number'
          ? window.screen.orientation.angle
          : 0;
      setDiag(
        computeMotionDiagnostics(orientation, effectiveCal, cameraMode, screenAngle, settings)
      );
    };

    sample();
    const timer = window.setInterval(sample, 60);
    return () => window.clearInterval(timer);
  }, [open, cameraMode, settings, getLiveReading]);

  useEffect(() => {
    if (!open) {
      setCalibratedFeedback(false);
    }
  }, [open]);

  if (!open) return null;

  const hasLiveSignal = motionActive && Boolean(diag?.hasReading);
  const pitchMax = diag?.effectivePitchMaxDeg ?? 26;
  const rollMax = diag?.effectiveRollMaxDeg ?? 24;
  const pitchDeadzone = diag?.effectivePitchDeadzoneDeg ?? settings.deadzoneDeg + 1;
  const rollDeadzone = diag?.effectiveRollDeadzoneDeg ?? settings.deadzoneDeg;

  // Map live tilt into reticle coordinates inside a 52px radius circle (center at 64,64)
  const reticleRadius = 52;
  const deadzoneRadiusPct = Math.min(
    0.72,
    Math.max(0.14, (pitchDeadzone / Math.max(10, pitchMax) + rollDeadzone / Math.max(10, rollMax)) / 2)
  );
  const deadzoneCircleR = Number((reticleRadius * deadzoneRadiusPct).toFixed(1));

  const normX = hasLiveSignal
    ? Math.max(-1, Math.min(1, (diag?.rollDeltaDeg ?? 0) / Math.max(1, rollMax)))
    : 0;
  const normY = hasLiveSignal
    ? Math.max(-1, Math.min(1, -(diag?.pitchDeltaDeg ?? 0) / Math.max(1, pitchMax)))
    : 0;
  const dotX = 64 + normX * reticleRadius;
  const dotY = 64 + normY * reticleRadius;

  const forwardPct = Math.round((diag?.input.moveForward ?? 0) * 100);
  const lateralValue =
    cameraMode === 'first_person' ? -(diag?.input.turnDelta ?? 0) : (diag?.input.moveRight ?? 0);
  const lateralPct = Math.round(lateralValue * 100);

  const sensitivityPercent = Math.round(settings.sensitivity * 100);

  const handleCalibrateClick = () => {
    if (!motionActive) {
      void onToggleMotion();
      return;
    }
    onCalibrateNeutral();
    setCalibratedFeedback(true);
    window.setTimeout(() => setCalibratedFeedback(false), 2000);
  };

  return (
    <div
      className="absolute inset-0 z-40 bg-slate-950/75 backdrop-blur-[2px] flex items-center justify-center p-3 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="motion-sensor-dialog-title"
      data-testid="motion-calibration-modal"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md max-h-[90dvh] overflow-y-auto bg-slate-950 border border-slate-700/90 rounded-2xl shadow-2xl text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-slate-800">
          <div className="flex items-center gap-2 min-w-0">
            <SlidersHorizontal className="w-4 h-4 text-sky-400 shrink-0" aria-hidden="true" />
            <h2
              id="motion-sensor-dialog-title"
              className="text-sm font-bold text-white truncate"
            >
              Sensibilidad y calibración del sensor
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar ajustes del sensor"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Sensor Activation & Live Calibration Preview */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="text-xs">
                <p className="font-semibold text-slate-100">Estado del giroscopio</p>
                <p className="text-[11px] text-slate-400">
                  {!motionActive
                    ? 'Actívalo para calibrar tu postura de agarre.'
                    : hasLiveSignal
                      ? diag?.inDeadzone
                        ? 'En zona neutra (sin desplazamiento)'
                        : 'Detectando inclinación activa'
                      : 'Esperando señal de movimiento del dispositivo'}
                </p>
              </div>
              <button
                type="button"
                data-testid="modal-motion-toggle-btn"
                onClick={() => void onToggleMotion()}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 shrink-0 cursor-pointer transition-colors ${
                  motionActive
                    ? 'bg-sky-600 text-white hover:bg-sky-500'
                    : 'bg-slate-800 text-slate-100 hover:bg-slate-700 border border-slate-700'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" aria-hidden="true" />
                <span>{motionActive ? 'Sensor activo' : 'Activar sensor'}</span>
              </button>
            </div>

            {sensorNotice && (
              <p
                role="status"
                className="text-[11px] text-amber-300 bg-amber-950/50 border border-amber-800/70 rounded-lg px-2.5 py-1.5 leading-snug"
              >
                {sensorNotice}
              </p>
            )}

            {/* Live Tilt Reticle + Axis Meters */}
            <div className="flex items-center gap-4 pt-1">
              <div className="shrink-0">
                <svg
                  width="128"
                  height="128"
                  viewBox="0 0 128 128"
                  role="img"
                  aria-label="Indicador visual de inclinación del sensor"
                  className="bg-slate-950 rounded-full border border-slate-800"
                >
                  {/* Outer max-tilt boundary */}
                  <circle
                    cx="64"
                    cy="64"
                    r={reticleRadius}
                    fill="none"
                    stroke="#334155"
                    strokeWidth="1"
                  />
                  {/* Crosshairs */}
                  <line x1="64" y1="10" x2="64" y2="118" stroke="#1e293b" strokeWidth="1" />
                  <line x1="10" y1="64" x2="118" y2="64" stroke="#1e293b" strokeWidth="1" />
                  {/* Neutral deadzone ring */}
                  <circle
                    cx="64"
                    cy="64"
                    r={deadzoneCircleR}
                    fill={hasLiveSignal && diag?.inDeadzone ? 'rgba(16, 185, 129, 0.16)' : 'rgba(56, 189, 248, 0.10)'}
                    stroke={hasLiveSignal && diag?.inDeadzone ? '#34d399' : '#38bdf8'}
                    strokeWidth="1.25"
                    strokeDasharray="3 3"
                  />
                  {/* Center neutral point */}
                  <circle cx="64" cy="64" r="2" fill="#64748b" />
                  {/* Live tilt indicator dot */}
                  <circle
                    cx={dotX}
                    cy={dotY}
                    r="6"
                    fill={
                      !hasLiveSignal
                        ? '#64748b'
                        : diag?.inDeadzone
                          ? '#34d399'
                          : '#38bdf8'
                    }
                    stroke="#0f172a"
                    strokeWidth="2"
                    data-testid="motion-reticle-dot"
                  />
                </svg>
              </div>

              <div className="flex-1 min-w-0 space-y-2.5 text-xs">
                <div>
                  <div className="flex items-center justify-between text-[11px] text-slate-300 mb-1">
                    <span>Avance / retroceso</span>
                    <span className="font-mono tabular-nums text-slate-200" data-testid="motion-pitch-readout">
                      {hasLiveSignal ? `${diag?.pitchDeltaDeg ?? 0}° (${forwardPct}%)` : '—'}
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-800 overflow-hidden relative">
                    <div className="absolute left-1/2 top-0 bottom-0 w-px bg-slate-600" />
                    <div
                      className="h-full bg-sky-400 transition-all duration-75"
                      style={{
                        width: `${Math.abs(forwardPct) / 2}%`,
                        marginLeft: forwardPct >= 0 ? '50%' : `${50 - Math.abs(forwardPct) / 2}%`,
                      }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between text-[11px] text-slate-300 mb-1">
                    <span>{cameraMode === 'first_person' ? 'Giro lateral' : 'Desplazamiento lateral'}</span>
                    <span className="font-mono tabular-nums text-slate-200" data-testid="motion-roll-readout">
                      {hasLiveSignal ? `${diag?.rollDeltaDeg ?? 0}° (${lateralPct}%)` : '—'}
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-800 overflow-hidden relative">
                    <div className="absolute left-1/2 top-0 bottom-0 w-px bg-slate-600" />
                    <div
                      className="h-full bg-emerald-400 transition-all duration-75"
                      style={{
                        width: `${Math.abs(lateralPct) / 2}%`,
                        marginLeft: lateralPct >= 0 ? '50%' : `${50 - Math.abs(lateralPct) / 2}%`,
                      }}
                    />
                  </div>
                </div>

                <button
                  type="button"
                  data-testid="modal-calibrate-neutral-btn"
                  onClick={handleCalibrateClick}
                  className="w-full py-2 px-2.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold inline-flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer transition-colors"
                >
                  <Crosshair className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                  <span>
                    {calibratedFeedback
                      ? 'Posición neutra fijada'
                      : 'Fijar posición neutra'}
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* Sensitivity Presets + Slider */}
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <label
                htmlFor="motion-sensitivity-slider"
                className="text-xs font-semibold text-slate-100"
              >
                Sensibilidad de respuesta
              </label>
              <span
                className="font-mono text-xs font-semibold text-sky-300 tabular-nums"
                data-testid="motion-sensitivity-value"
              >
                {sensitivityPercent}%
              </span>
            </div>

            <div className="grid grid-cols-3 gap-1.5">
              {SENSITIVITY_PRESETS.map((preset) => {
                const isSelected = Math.abs(settings.sensitivity - preset.value) < 0.05;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    data-testid={`motion-preset-${preset.id}`}
                    aria-pressed={isSelected}
                    onClick={() => onChangeSettings({ sensitivity: preset.value })}
                    className={`py-1.5 px-2 rounded-lg text-xs font-semibold border cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-sky-600/20 border-sky-400 text-sky-200'
                        : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-600'
                    }`}
                  >
                    {preset.label} ({Math.round(preset.value * 100)}%)
                  </button>
                );
              })}
            </div>

            <input
              id="motion-sensitivity-slider"
              data-testid="motion-sensitivity-slider"
              type="range"
              min={Math.round(MOTION_SENSITIVITY_MIN * 100)}
              max={Math.round(MOTION_SENSITIVITY_MAX * 100)}
              step={10}
              value={sensitivityPercent}
              onChange={(e) =>
                onChangeSettings({
                  sensitivity: Number(e.target.value) / 100,
                })
              }
              className="w-full accent-sky-500 cursor-pointer"
            />
            <div className="flex justify-between text-[11px] text-slate-400">
              <span>Más suave (requiere más inclinación)</span>
              <span>Más rápida</span>
            </div>
          </div>

          {/* Neutral Deadzone Slider */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <label
                htmlFor="motion-deadzone-slider"
                className="text-xs font-semibold text-slate-100"
              >
                Zona neutra (margen quieto)
              </label>
              <span
                className="font-mono text-xs font-semibold text-emerald-300 tabular-nums"
                data-testid="motion-deadzone-value"
              >
                ±{settings.deadzoneDeg}°
              </span>
            </div>
            <input
              id="motion-deadzone-slider"
              data-testid="motion-deadzone-slider"
              type="range"
              min={MOTION_DEADZONE_MIN_DEG}
              max={MOTION_DEADZONE_MAX_DEG}
              step={1}
              value={settings.deadzoneDeg}
              onChange={(e) =>
                onChangeSettings({
                  deadzoneDeg: Number(e.target.value),
                })
              }
              className="w-full accent-emerald-500 cursor-pointer"
            />
            <p className="text-[11px] text-slate-400 leading-snug">
              Ignora pequeños movimientos de la mano dentro de este ángulo antes de caminar o girar.
            </p>
          </div>

          {/* Invert Forward Tilt Toggle */}
          <label className="flex items-center justify-between gap-3 p-3 rounded-xl bg-slate-900/90 border border-slate-800 cursor-pointer">
            <div className="text-xs">
              <span className="font-semibold text-slate-100 block">
                Invertir inclinación adelante / atrás
              </span>
              <span className="text-[11px] text-slate-400">
                Inclina el teléfono hacia ti para avanzar en lugar de alejarlo.
              </span>
            </div>
            <input
              type="checkbox"
              data-testid="motion-invert-checkbox"
              checked={settings.invertForward}
              onChange={(e) =>
                onChangeSettings({
                  invertForward: e.target.checked,
                })
              }
              className="w-4 h-4 accent-sky-500 rounded shrink-0 cursor-pointer"
            />
          </label>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-2 px-4 py-3 border-t border-slate-800 bg-slate-900/60">
          <button
            type="button"
            data-testid="motion-reset-btn"
            onClick={onResetSettings}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 inline-flex items-center gap-1.5 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
            Restablecer
          </button>
          <button
            type="button"
            data-testid="motion-modal-done-btn"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-100 hover:bg-white text-slate-950 text-xs font-bold cursor-pointer"
          >
            Listo
          </button>
        </div>
      </div>
    </div>
  );
};
