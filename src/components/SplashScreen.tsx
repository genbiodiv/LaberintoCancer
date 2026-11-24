import React, { useState } from 'react';
import {
  ArrowRight,
  Compass,
  Dna,
  DoorOpen,
  Keyboard,
  Smartphone,
  Volume2,
} from 'lucide-react';
import splashHeroImg from '../assets/images/splash_cancer_labyrinth_1795441813144.jpg';

interface SplashScreenProps {
  onContinue: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onContinue }) => {
  const [imgFailed, setImgFailed] = useState(false);

  return (
    <div
      data-testid="splash-screen"
      className="min-h-screen bg-[#0b1220] text-slate-100 flex flex-col justify-between selection:bg-rose-500/30 selection:text-white"
    >
      {/* Clean Single-Row Top Bar */}
      <header className="w-full border-b border-slate-800/80 bg-[#0b1220]/95">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between gap-8">
          <div className="flex items-center gap-2.5 whitespace-nowrap shrink-0">
            <Dna className="w-5 h-5 text-rose-500" aria-hidden="true" />
            <span className="text-base sm:text-lg font-bold tracking-tight text-white">
              El laberinto del cáncer
            </span>
          </div>

          <button
            type="button"
            onClick={onContinue}
            className="px-4 py-2 rounded-lg text-xs font-semibold bg-white text-slate-950 hover:bg-slate-200 transition-colors inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <span>Entrar</span>
            <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
        </div>
      </header>

      {/* Main Editorial Splash Body */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-8 sm:py-10 flex flex-col justify-center gap-8">
        {/* Hero Split: Title & Primary CTA + Bespoke Scientific Labyrinth Illustration */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          <div className="lg:col-span-6 flex flex-col justify-center gap-5">
            <p className="text-xs font-mono text-slate-400 tracking-wide">
              Simulación interactiva de biología molecular y oncología
            </p>
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-white leading-[1.08] [text-wrap:balance]">
              El laberinto del cáncer
            </h1>
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-xl">
              Recorre un laberinto biológico en primera persona donde cada puerta representa una
              decisión celular o clínica. Observa en tiempo real cómo evolucionan las poblaciones
              celulares, el entorno y el pulso conforme cambia la gravedad de la enfermedad.
            </p>

            <div className="pt-1 flex flex-wrap items-center gap-4">
              <button
                type="button"
                data-testid="splash-enter-btn"
                onClick={onContinue}
                className="px-6 py-3 rounded-xl text-sm font-semibold bg-rose-600 hover:bg-rose-500 text-white transition-colors inline-flex items-center gap-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-400 cursor-pointer"
              >
                <span>Comenzar recorrido</span>
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </button>
              <span className="text-xs text-slate-400">
                Dos roles · Recorrido continuo hasta el 100%
              </span>
            </div>
          </div>

          <div className="lg:col-span-6 relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-900 min-h-[240px] sm:min-h-[300px]">
            {!imgFailed ? (
              <img
                src={splashHeroImg}
                alt="Vista arquitectónica del laberinto molecular con rutas celulares en carmesí y rutas clínicas en azul"
                referrerPolicy="no-referrer"
                onError={() => setImgFailed(true)}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center gap-3 p-8 bg-gradient-to-br from-rose-950/70 via-slate-900 to-sky-950/70 text-center">
                <Compass className="w-10 h-10 text-rose-400" aria-hidden="true" />
                <span className="text-sm font-semibold text-slate-200">
                  El laberinto del cáncer
                </span>
              </div>
            )}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#0b1220]/75 via-transparent to-transparent"
            />
            <div className="absolute bottom-3 left-4 right-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 text-[11px] font-mono text-slate-300">
              <span>Cáncer · Superar barreras hasta 100%</span>
              <span>Oncólogo · Liberación hasta 100%</span>
            </div>
          </div>
        </section>

        {/* Clear 3-Column Instructions Section */}
        <section
          aria-labelledby="splash-instructions-heading"
          className="border-t border-slate-800/90 pt-7 space-y-5"
        >
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2
              id="splash-instructions-heading"
              className="text-base sm:text-lg font-semibold text-white"
            >
              Instrucciones para jugar
            </h2>
            <span className="text-xs text-slate-400">
              Lee estos 3 pasos antes de entrar al laberinto
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Step 1: Objective */}
            <article className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-3">
              <div className="flex items-center gap-2.5 text-rose-400">
                <DoorOpen className="w-4 h-4 shrink-0" aria-hidden="true" />
                <h3 className="text-sm font-semibold text-white">01. Elige tu rol y objetivo</h3>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Todas las partidas inician desde la misma célula. Juega como{' '}
                <strong className="text-white font-medium">Cáncer</strong> para vencer las
                defensas naturales del organismo hasta llegar al{' '}
                <span className="font-mono text-rose-300 tabular-nums">100%</span>, o como{' '}
                <strong className="text-white font-medium">Oncólogo</strong> alternando rondas de{' '}
                <strong className="text-white font-medium">diagnóstico</strong> e{' '}
                <strong className="text-white font-medium">intervención</strong> (o{' '}
                <strong className="text-white font-medium">observación</strong>) hasta el{' '}
                <span className="font-mono text-sky-300 tabular-nums">100%</span> de liberación.
              </p>
            </article>

            {/* Step 2: Doors & Severity */}
            <article className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-3">
              <div className="flex items-center gap-2.5 text-amber-400">
                <Volume2 className="w-4 h-4 shrink-0" aria-hidden="true" />
                <h3 className="text-sm font-semibold text-white">02. Abre puertas y observa</h3>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                En cada cámara verás tres puertas iluminadas. Acércate o tócalas para avanzar y
                explorar sus{' '}
                <strong className="text-white font-medium">
                  ramificaciones moleculares y celulares
                </strong>
                . En modo Oncólogo puedes elegir <strong className="text-white font-medium">Observación</strong>{' '}
                para saltar cualquier ronda.
              </p>
            </article>

            {/* Step 3: Controls (Desktop + Mobile Sensor) */}
            <article className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-3">
              <div className="flex items-center gap-2.5 text-sky-400">
                <Keyboard className="w-4 h-4 shrink-0" aria-hidden="true" />
                <h3 className="text-sm font-semibold text-white">03. Controles de movimiento</h3>
              </div>
              <ul className="space-y-2 text-xs sm:text-sm text-slate-300 leading-relaxed">
                <li className="flex items-start gap-2">
                  <Keyboard
                    className="w-3.5 h-3.5 mt-1 text-slate-400 shrink-0"
                    aria-hidden="true"
                  />
                  <span>
                    <strong className="text-white font-medium">Computador:</strong> usa las{' '}
                    <span className="font-mono text-slate-100">flechas ↑ ↓ ← →</span> (o{' '}
                    <span className="font-mono text-slate-100">WASD</span>) para caminar y girar,
                    rueda o <span className="font-mono text-slate-100">+ / −</span> para zoom y{' '}
                    <span className="font-mono text-slate-100">V</span> para vista aérea.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <Smartphone
                    className="w-3.5 h-3.5 mt-1 text-slate-400 shrink-0"
                    aria-hidden="true"
                  />
                  <span>
                    <strong className="text-white font-medium">Móvil:</strong> activa el botón{' '}
                    <span className="font-mono text-sky-300">Sensor</span> para moverte y girar
                    inclinando tu dispositivo, o arrastra la pantalla y toca las puertas.
                  </span>
                </li>
              </ul>
            </article>
          </div>
        </section>
      </main>

      {/* Quiet Footer */}
      <footer className="w-full border-t border-slate-800/70">
        <div className="max-w-6xl mx-auto px-6 py-4 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-400">
          <span>El laberinto del cáncer · Simulador educativo en biología del cáncer</span>
          <span>Compatible con computador y dispositivos móviles</span>
        </div>
      </footer>
    </div>
  );
};
