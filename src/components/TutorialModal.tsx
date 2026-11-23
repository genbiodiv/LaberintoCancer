import React, { useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  GitCompareArrows,
  Layers,
  Microscope,
  X,
} from 'lucide-react';

interface TutorialModalProps {
  open: boolean;
  onClose: () => void;
}

const SLIDES = [
  {
    icon: GitCompareArrows,
    title: '1. Dos roles, misma biología',
    body: 'Cáncer y Oncólogo operan sobre el mismo motor molecular.',
    points: [
      'Cáncer: supera barreras fisiológicas del organismo hasta llegar al 100% de cáncer.',
      'Oncólogo: investiga, trata y protege al paciente hasta el 100% de liberación.',
    ],
  },
  {
    icon: Layers,
    title: '2. Selección clonal',
    body: 'Las variantes surgen por alteraciones celulares; las barreras biológicas (o las terapias en modo Oncólogo) seleccionan qué clones crecen.',
    points: [
      'Cada ventaja celular conlleva un costo metabólico o inmunológico.',
      'En modo Oncólogo, tratar sin precisión eleva la toxicidad.',
    ],
  },
  {
    icon: Microscope,
    title: '3. Cómo avanzar y moverte',
    body: 'Recorre el laberinto de forma continua hasta completar el objetivo de tu rol.',
    points: [
      'En computador usa las flechas de dirección (↑ ↓ ← →) o WASD para caminar y girar; en móvil activa el botón Sensor para inclinar tu dispositivo.',
      'Acércate o toca una puerta del laberinto y acierta la predicción biológica para abrirla.',
      'Usa el zoom (+ / − o rueda del ratón) y observa cómo el entorno y el latido reflejan la gravedad del cáncer.',
    ],
  },
];

export const TutorialModal: React.FC<TutorialModalProps> = ({ open, onClose }) => {
  const [step, setStep] = useState(0);

  if (!open) return null;

  const slide = SLIDES[step];
  const Icon = slide.icon;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="tutorial-title"
      className="fixed inset-0 z-50 bg-slate-900/45 flex items-center justify-center p-4"
    >
      <div className="bg-white border border-slate-200 rounded-xl max-w-lg w-full p-6 space-y-5 shadow-lg">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-sky-50 text-sky-700 flex items-center justify-center shrink-0">
              <Icon className="w-5 h-5" aria-hidden="true" />
            </div>
            <div>
              <h2 id="tutorial-title" className="text-base font-bold text-slate-900">
                {slide.title}
              </h2>
              <span className="text-xs font-mono text-slate-500">
                Paso {step + 1} de {SLIDES.length}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar tutorial"
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-sm text-slate-600 leading-relaxed">{slide.body}</p>

        <ul className="space-y-2 text-xs text-slate-700">
          {slide.points.map((pt, idx) => (
            <li key={idx} className="flex items-start gap-2">
              <span className="font-mono text-sky-600 font-semibold mt-0.5">·</span>
              <span>{pt}</span>
            </li>
          ))}
        </ul>

        <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0}
            className="px-3 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 disabled:opacity-40 inline-flex items-center gap-1.5 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
            Anterior
          </button>

          {step < SLIDES.length - 1 ? (
            <button
              type="button"
              onClick={() => setStep((s) => s + 1)}
              className="px-4 py-2 text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800 rounded-lg inline-flex items-center gap-1.5 cursor-pointer"
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
              className="px-4 py-2 text-xs font-semibold bg-sky-600 text-white hover:bg-sky-700 rounded-lg cursor-pointer"
            >
              Entendido
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
