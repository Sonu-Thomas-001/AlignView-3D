'use client';

import React from 'react';
import { useViewerStore } from '@/store/useViewerStore';
import { Smile, RotateCcw, X } from 'lucide-react';

interface SliderSpec {
  key: 'verticalMm' | 'sagittalMm' | 'pitchDeg';
  label: string;
  low: string;
  high: string;
  min: number;
  max: number;
  step: number;
  unit: string;
  hint: string;
}

/**
 * The three degrees of freedom a clinician actually corrects by eye when a registration
 * is off. Transverse shift and roll are deliberately absent: a left-right error is almost
 * always a midline discrepancy in the case itself rather than a registration fault, and
 * nudging the lower arch sideways would hide it.
 */
const SLIDERS: SliderSpec[] = [
  {
    key: 'verticalMm',
    label: 'Vertical',
    low: 'Close',
    high: 'Open',
    min: -4,
    max: 4,
    step: 0.1,
    unit: 'mm',
    hint: 'Raises or lowers the lower arch. Open it if the crowns interpenetrate.',
  },
  {
    key: 'sagittalMm',
    label: 'Sagittal',
    low: 'Retrude',
    high: 'Protrude',
    min: -4,
    max: 4,
    step: 0.1,
    unit: 'mm',
    hint: 'Slides the lower arch front to back, which is what sets the overjet.',
  },
  {
    key: 'pitchDeg',
    label: 'Pitch',
    low: 'Front down',
    high: 'Front up',
    min: -8,
    max: 8,
    step: 0.1,
    unit: 'deg',
    hint: 'Tips the lower arch front to back, for a Curve of Spee the fit did not match.',
  },
];

/**
 * Manual bite adjustment.
 *
 * The automatic registration drops the lower arch into cusp-to-fossa contact with the
 * upper, which is a fit to the two surfaces and not a recorded bite. On a case with a
 * shallow or unusual occlusion it can settle a millimetre or two out, and a provider
 * about to share a preview needs to be able to correct that by eye. It also needs to be
 * clear that the starting point is an estimate, which is why the residual figure is shown
 * rather than hidden: it is how even the fit came out, in millimetres.
 */
export const BiteAdjustPanel: React.FC = () => {
  const {
    activeTool,
    setActiveTool,
    biteAdjust,
    setBiteAdjust,
    resetBiteAdjust,
    biteRegistration,
    studioTheme,
  } = useViewerStore();

  if (activeTool !== 'bite') return null;

  const isDark = studioTheme === 'dark';
  const isAdjusted =
    biteAdjust.verticalMm !== 0 || biteAdjust.sagittalMm !== 0 || biteAdjust.pitchDeg !== 0;

  return (
    <div className="absolute top-16 left-1/2 -translate-x-1/2 z-30 select-none animate-in fade-in slide-in-from-top-2 duration-200">
      <div
        className={`backdrop-blur-md rounded-2xl shadow-floating border py-3 px-4 w-[19rem] transition-colors ${
          isDark
            ? 'bg-slate-900/95 border-slate-700/90 text-white'
            : 'bg-white/95 border-slate-200/90 text-slate-800'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-1.5 text-xs font-semibold">
            <Smile className="w-3.5 h-3.5 text-blue-500" />
            <span>Bite Registration</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={resetBiteAdjust}
              disabled={!isAdjusted}
              className={`flex items-center gap-1 px-1.5 py-1 rounded-lg text-[10px] font-semibold transition-all ${
                isAdjusted
                  ? isDark
                    ? 'text-slate-300 hover:text-white hover:bg-slate-800'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  : 'text-slate-500/40 cursor-not-allowed'
              }`}
              title="Return to the automatic registration"
            >
              <RotateCcw className="w-3 h-3" />
              Auto
            </button>
            <button
              onClick={() => setActiveTool('move')}
              className={`p-1 rounded-lg transition-colors ${
                isDark ? 'hover:bg-slate-800' : 'hover:bg-slate-100'
              }`}
              title="Close"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* What the starting point actually is */}
        <p className="text-[10px] leading-snug text-slate-400 mb-3">
          {biteRegistration ? (
            <>
              Estimated by fitting the two arch surfaces into contact, not from a recorded
              bite. Contact across{' '}
              <span className="font-mono text-slate-300">{biteRegistration.contactCells}</span>{' '}
              cells, evenness{' '}
              <span className="font-mono text-slate-300">
                {biteRegistration.residualStdMm.toFixed(2)} mm
              </span>
              , deepest overlap{' '}
              <span className="font-mono text-slate-300">
                {biteRegistration.penetrationMm.toFixed(2)} mm
              </span>
              . Adjust by eye if it looks wrong.
            </>
          ) : (
            <>Load both an upper and a lower arch to register a bite.</>
          )}
        </p>

        {/* The three corrections */}
        <div className="space-y-2.5">
          {SLIDERS.map((spec) => {
            const value = biteAdjust[spec.key];
            return (
              <div key={spec.key}>
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-[11px] font-medium" title={spec.hint}>
                    {spec.label}
                  </span>
                  <span
                    className={`text-[10px] font-mono ${
                      value === 0 ? 'text-slate-500' : 'text-blue-500 font-bold'
                    }`}
                  >
                    {value > 0 ? '+' : ''}
                    {value.toFixed(1)} {spec.unit}
                  </span>
                </div>
                <input
                  type="range"
                  min={spec.min}
                  max={spec.max}
                  step={spec.step}
                  value={value}
                  disabled={!biteRegistration}
                  onChange={(e) => setBiteAdjust({ [spec.key]: parseFloat(e.target.value) })}
                  className="w-full h-1 accent-blue-600 cursor-pointer disabled:cursor-not-allowed disabled:opacity-40"
                  title={spec.hint}
                />
                <div className="flex items-center justify-between text-[9px] text-slate-500 mt-0.5">
                  <span>{spec.low}</span>
                  <span>{spec.high}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
