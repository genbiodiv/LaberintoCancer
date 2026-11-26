import React, { useEffect, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Compass,
  FileText,
  GitCompareArrows,
  Layers,
  X,
} from 'lucide-react';
import { PlayMode } from '../engine/types';

interface TutorialModalProps {
  open: boolean;
  playMode: PlayMode;
  onClose: () => void;
}

const SHARED_SLIDES = [
  {
    icon: GitCompareArrows,
    title: '1. Dos rutas sobre la misma biología',
    body: 'Cáncer y Oncólogo funcionan con las mismas reglas celulares y moleculares.',
    points: [
      'Como cáncer: eliges cambios que ayudan a las células tumorales a crecer, evadir frenos y sobrevivir.',
      'Como oncólogo: alternas rondas de estudio e intervención (o eliges observar) para controlar el tumor cuidando al paciente.',
    ],
  },
  {
    icon: Layers,
    title: '2. Selección entre poblaciones celulares',
    body: 'Las alteraciones crean grupos de células con ventajas y costos distintos.',
    points: [
      'Antes de elegir, compara qué cambia en la célula o qué pregunta responde cada estudio.',
      'Después de cada elección verás qué ocurrió con las poblaciones celulares, las capacidades del cáncer y el estado del tejido.',
    ],
  },
];

const TEXT_MODE_SLIDE = {
  icon: FileText,
  title: '3. Cómo jugar en Modo Texto',
  body: 'Todas las decisiones y resultados están organizados en tres columnas.',
  points: [
    'Panel izquierdo: elige el cambio celular, el estudio o la intervención de la ronda actual.',
    'Panel central: consulta la red de procesos (haz clic en cualquier nodo para ver su función) o cambia a la pestaña de población clonal.',
    'Panel derecho: sigue la carga tumoral, el progreso de la partida, las defensas del tejido y las capacidades del cáncer.',
  ],
};

const LABYRINTH_MODE_SLIDE = {
  icon: Compass,
  title: '3. Cómo moverte en el Laberinto 3D',
  body: 'Cada cámara presenta tres puertas iluminadas que corresponden a tus decisiones de la ronda.',
  points: [
    'En computador: usa las flechas ↑ ↓ ← → o WASD para avanzar y girar, arrastra para mirar y usa + / − o la rueda para zoom.',
    'En móvil: activa el botón Sensor para inclinar el dispositivo, usa el pad en pantalla si prefieres botones, o arrastra para mirar.',
    'Acércate o toca una puerta para leer sus detalles y confirmar tu decisión.',
  ],
};

export const TutorialModal: React.FC<TutorialModalProps> = ({ open, playMode, onClose }) => {
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (open) setStep(0);
  }, [open, playMode]);

  if (!open) return null;

  const slides = [
    ...SHARED_SLIDES,
    playMode === 'text' ? TEXT_MODE_SLIDE : LABYRINTH_MODE_SLIDE,
  ];
  const slide = slides[Math.min(step, slides.length - 1)];
  const Icon = slide.icon;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="tutorial-title"
      className="fixed inset-0 z-50 bg-slate-950/60 flex items-center justify-center p-4"
    >
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl max-w-lg w-full p-6 space-y-5 shadow-lg">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-sky-50 dark:bg-sky-950/70 text-sky-700 dark:text-sky-400 flex items-center justify-center shrink-0">
              <Icon className="w-5 h-5" aria-hidden="true" />
            </div>
            <div>
              <h2 id="tutorial-title" className="text-base font-bold text-slate-900 dark:text-white">
                {slide.title}
              </h2>
              <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
                Paso {step + 1} de {slides.length} ·{' '}
                {playMode === 'text' ? 'Modo Texto' : 'Laberinto 3D'}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar guía"
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{slide.body}</p>

        <ul className="space-y-2 text-xs text-slate-700 dark:text-slate-300">
          {slide.points.map((pt, idx) => (
            <li key={idx} className="flex items-start gap-2">
              <span className="font-mono text-sky-600 dark:text-sky-400 font-semibold mt-0.5">
                ·
              </span>
              <span>{pt}</span>
            </li>
          ))}
        </ul>

        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0}
            className="px-3 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white disabled:opacity-40 inline-flex items-center gap-1.5 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
            Anterior
          </button>

          {step < slides.length - 1 ? (
            <button
              type="button"
              onClick={() => setStep((s) => s + 1)}
              className="px-4 py-2 text-xs font-semibold bg-slate-900 dark:bg-sky-600 text-white hover:bg-slate-800 dark:hover:bg-sky-500 rounded-lg inline-flex items-center gap-1.5 cursor-pointer"
            >
              Siguiente
              <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                setStep(0);
                onClose();
              }}
              className="px-4 py-2 text-xs font-semibold bg-sky-600 text-white hover:bg-sky-700 dark:hover:bg-sky-500 rounded-lg cursor-pointer"
            >
              Entendido
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
