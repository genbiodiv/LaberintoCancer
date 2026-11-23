import React, { useState } from 'react';
import { ENABLING_CHARACTERISTICS, HALLMARKS_CATALOG } from '../engine/knowledgeBase';
import { formatBiologyText } from '../engine/molecularAbstraction';
import { EnablingCharacteristicId, HallmarkId, MolecularDetailMode } from '../engine/types';

interface HallmarksWheelProps {
  hallmarkScores: Record<HallmarkId, number>;
  enablingScores: Record<EnablingCharacteristicId, number>;
  accentMode: 'cancer' | 'oncologist';
  molecularDetail: MolecularDetailMode;
}

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return {
    x: cx + r * Math.cos(rad),
    y: cy + r * Math.sin(rad),
  };
}

function describeSector(
  cx: number,
  cy: number,
  rInner: number,
  rOuter: number,
  startAngle: number,
  endAngle: number
): string {
  const p1 = polarToCartesian(cx, cy, rOuter, endAngle);
  const p2 = polarToCartesian(cx, cy, rOuter, startAngle);
  const p3 = polarToCartesian(cx, cy, rInner, startAngle);
  const p4 = polarToCartesian(cx, cy, rInner, endAngle);
  const largeArc = endAngle - startAngle <= 180 ? '0' : '1';
  return [
    'M',
    p1.x.toFixed(1),
    p1.y.toFixed(1),
    'A',
    rOuter.toFixed(1),
    rOuter.toFixed(1),
    0,
    largeArc,
    0,
    p2.x.toFixed(1),
    p2.y.toFixed(1),
    'L',
    p3.x.toFixed(1),
    p3.y.toFixed(1),
    'A',
    rInner.toFixed(1),
    rInner.toFixed(1),
    0,
    largeArc,
    1,
    p4.x.toFixed(1),
    p4.y.toFixed(1),
    'Z',
  ].join(' ');
}

export const HallmarksWheel: React.FC<HallmarksWheelProps> = ({
  hallmarkScores,
  enablingScores,
  accentMode,
  molecularDetail,
}) => {
  const [selectedId, setSelectedId] = useState<HallmarkId>('proliferative_signaling');
  const selectedDef =
    HALLMARKS_CATALOG.find((h) => h.id === selectedId) ?? HALLMARKS_CATALOG[0];

  const cx = 135;
  const cy = 135;
  const rMin = 28;
  const rMax = 96;
  const sliceAngle = 360 / HALLMARKS_CATALOG.length;

  return (
    <div className="space-y-3">
      <h3 className="text-xs font-semibold text-slate-900">
        Hallmarks (Hanahan, 2026)
      </h3>

      {/* Circular Interactive SVG Diagram */}
      <div className="flex flex-col items-center">
        <svg
          viewBox="0 0 270 270"
          className="w-full max-w-[238px] h-auto select-none"
          role="img"
          aria-label="Diagrama circular interactivo de las nueve capacidades funcionales del cáncer"
        >
          {/* Reference guide rings */}
          {[0.33, 0.66, 1].map((ratio) => (
            <circle
              key={ratio}
              cx={cx}
              cy={cy}
              r={rMin + (rMax - rMin) * ratio}
              fill="none"
              stroke="#e2e8f0"
              strokeWidth={1}
              strokeDasharray={ratio < 1 ? '2 3' : undefined}
            />
          ))}

          {HALLMARKS_CATALOG.map((h, i) => {
            const start = i * sliceAngle + 2;
            const end = (i + 1) * sliceAngle - 2;
            const mid = (start + end) / 2;
            const score = hallmarkScores[h.id] ?? 0;
            const rValue = rMin + ((rMax - rMin) * Math.max(8, score)) / 100;
            const isSelected = selectedId === h.id;
            const isTier1 = h.tier === 1;

            const fillColor =
              accentMode === 'cancer'
                ? isTier1
                  ? '#e11d48'
                  : '#f59e0b'
                : isTier1
                  ? '#0284c7'
                  : '#64748b';

            const labelPos = polarToCartesian(cx, cy, rMax + 19, mid);

            return (
              <g
                key={h.id}
                onClick={() => setSelectedId(h.id)}
                className="cursor-pointer"
              >
                {/* Background wedge hit area */}
                <path
                  d={describeSector(cx, cy, rMin, rMax, start, end)}
                  fill={isSelected ? '#f1f5f9' : 'transparent'}
                  stroke={isSelected ? '#94a3b8' : '#e2e8f0'}
                  strokeWidth={isSelected ? 1.2 : 0.6}
                />
                {/* Active capability wedge */}
                <path
                  d={describeSector(cx, cy, rMin, rValue, start, end)}
                  fill={fillColor}
                  fillOpacity={isSelected ? 0.85 : isTier1 ? 0.62 : 0.36}
                  stroke={fillColor}
                  strokeWidth={isSelected ? 1.5 : 0.8}
                />
                {/* Outer concise numeric index */}
                <text
                  x={labelPos.x}
                  y={labelPos.y + 3}
                  textAnchor="middle"
                  className={`text-[9px] font-mono ${
                    isSelected ? 'fill-slate-900 font-bold' : 'fill-slate-500'
                  }`}
                >
                  {i + 1}
                </text>
              </g>
            );
          })}

          {/* Center score label */}
          <circle cx={cx} cy={cy} r={rMin - 2} fill="#ffffff" stroke="#e2e8f0" />
          <text
            x={cx}
            y={cy - 1}
            textAnchor="middle"
            className="text-[12px] font-mono font-bold fill-slate-900 tabular-nums"
          >
            {hallmarkScores[selectedDef.id]}
          </text>
          <text
            x={cx}
            y={cy + 11}
            textAnchor="middle"
            className="text-[8px] fill-slate-500"
          >
            /100
          </text>
        </svg>

        {/* Compact clickable selector for tier-1 and other hallmarks */}
        <div className="w-full mt-1 grid grid-cols-3 gap-1">
          {HALLMARKS_CATALOG.map((h, i) => {
            const active = selectedId === h.id;
            return (
              <button
                key={h.id}
                type="button"
                onClick={() => setSelectedId(h.id)}
                className={`px-1.5 py-1 text-[10px] rounded text-left truncate transition-colors cursor-pointer ${
                  active
                    ? 'bg-slate-900 text-white font-semibold'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
                title={`${i + 1}. ${h.name} (${hallmarkScores[h.id]}/100)`}
              >
                <span className="font-mono mr-1">{i + 1}.</span>
                {h.shortLabel}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Hallmark Explanation */}
      <div className="pt-2.5 border-t border-slate-100 space-y-1">
        <div className="flex items-baseline justify-between gap-2 text-xs">
          <span className="font-semibold text-slate-900">{selectedDef.name}</span>
          <span className="font-mono text-slate-600 tabular-nums shrink-0">
            {hallmarkScores[selectedDef.id]}/100
          </span>
        </div>
        <p className="text-[11px] text-slate-600 leading-snug">
          {formatBiologyText(selectedDef.description, molecularDetail)}
        </p>
      </div>

      {/* Explicit Separation: Enabling Characteristics & Microenvironment */}
      <div className="pt-2.5 border-t border-slate-200 space-y-2">
        <div className="text-[11px] font-semibold text-slate-700">
          Facilitadores y microambiente
        </div>
        <div className="space-y-1.5">
          {ENABLING_CHARACTERISTICS.map((item) => {
            const val = enablingScores[item.id] ?? 0;
            return (
              <div key={item.id} className="space-y-0.5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-600 truncate pr-2">{item.name}</span>
                  <span className="font-mono text-slate-700 tabular-nums">{val}</span>
                </div>
                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-slate-500 rounded-full transition-all duration-300"
                    style={{ width: `${val}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
