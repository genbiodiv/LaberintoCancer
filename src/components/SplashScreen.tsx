import React, { useState } from 'react';
import { ArrowRight, Compass, Dna } from 'lucide-react';
import splashHeroImg from '../assets/images/splash_cancer_labyrinth_1795441813144.jpg';
import { ThemeMode } from '../utils/storage';
import { ThemeToggle } from './ThemeToggle';

interface SplashScreenProps {
  theme: ThemeMode;
  onThemeChange: (next: ThemeMode) => void;
  onContinue: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({
  theme,
  onThemeChange,
  onContinue,
}) => {
  const [imgFailed, setImgFailed] = useState(false);

  return (
    <div
      data-testid="splash-screen"
      className="min-h-screen bg-slate-50 text-slate-900 dark:bg-[#0b1220] dark:text-slate-100 flex flex-col justify-between transition-colors selection:bg-rose-500/20 dark:selection:bg-rose-500/30 dark:selection:text-white"
    >
      {/* Clean Single-Row Top Bar (No duplicate entry button) */}
      <header className="w-full border-b border-slate-200 dark:border-slate-800/80 bg-white/95 dark:bg-[#0b1220]/95 transition-colors">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5 whitespace-nowrap shrink-0">
            <Dna className="w-5 h-5 text-rose-600 dark:text-rose-500" aria-hidden="true" />
            <span className="text-base sm:text-lg font-bold tracking-tight text-slate-900 dark:text-white">
              El laberinto del cáncer
            </span>
          </div>

          <ThemeToggle theme={theme} onChange={onThemeChange} />
        </div>
      </header>

      {/* Simplified Editorial Splash Body */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-10 sm:py-14 flex items-center">
        <section className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
          <div className="lg:col-span-6 flex flex-col justify-center gap-5">
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-slate-900 dark:text-white leading-[1.08] [text-wrap:balance]">
              El laberinto del cáncer
            </h1>

            <p className="text-lg sm:text-xl font-medium text-slate-800 dark:text-slate-100 leading-snug max-w-xl">
              ¿Qué permite que una célula siga dividiéndose cuando el tejido le indica que se
              detenga?
            </p>

            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed max-w-xl">
              Elige una ruta. Como cáncer, explora qué cambios permiten que las células tumorales
              crezcan y sobrevivan. Como oncólogo, elige qué estudiar y usa los resultados para
              decidir cómo intervenir. Cada puerta representa una elección.
            </p>

            <div className="pt-2">
              <button
                type="button"
                data-testid="splash-enter-btn"
                onClick={onContinue}
                className="px-6 py-3.5 rounded-xl text-sm font-semibold bg-rose-600 hover:bg-rose-500 text-white transition-colors inline-flex items-center gap-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-400 cursor-pointer"
              >
                <span>Elegir mi ruta</span>
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
          </div>

          <div className="lg:col-span-6 relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-900">
            {!imgFailed ? (
              <img
                src={splashHeroImg}
                alt="Ilustración del laberinto molecular con rutas celulares y rutas clínicas"
                referrerPolicy="no-referrer"
                onError={() => setImgFailed(true)}
                className="w-full h-auto block"
              />
            ) : (
              <div className="w-full min-h-[260px] flex flex-col items-center justify-center gap-3 p-8 bg-gradient-to-br from-rose-950/70 via-slate-900 to-sky-950/70 text-center">
                <Compass className="w-10 h-10 text-rose-400" aria-hidden="true" />
                <span className="text-sm font-semibold text-slate-200">
                  El laberinto del cáncer
                </span>
              </div>
            )}
          </div>
        </section>
      </main>

      {/* Quiet Footer */}
      <footer className="w-full border-t border-slate-200 dark:border-slate-800/70">
        <div className="max-w-6xl mx-auto px-6 py-4 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">
          <span>Universidad del Norte · Curso de Biología Molecular</span>
        </div>
      </footer>
    </div>
  );
};
