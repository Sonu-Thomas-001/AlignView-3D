import React, { useEffect, useMemo } from 'react';
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Gauge, 
  Repeat,
  ShieldCheck,
  AlertTriangle,
  Info,
  ChevronUp,
  X
} from 'lucide-react';
import { useViewerStore } from '@/store/useViewerStore';
import { computeStageSafetyMetrics } from '@/utils/movementAnalytics';

export const TimelinePlayback: React.FC = () => {
  const {
    isPlaying,
    togglePlay,
    currentStep,
    totalSteps,
    setCurrentStep,
    nextStep,
    prevStep,
    playbackSpeed,
    setPlaybackSpeed,
    isLooping,
    toggleLoop,
    isSafetyPopoverOpen,
    toggleSafetyPopover,
    setSafetyPopoverOpen,
  } = useViewerStore();

  const safetyMetrics = useMemo(() => {
    return computeStageSafetyMetrics(currentStep, totalSteps);
  }, [currentStep, totalSteps]);

  // Automated playback animation interval timer
  useEffect(() => {
    if (!isPlaying) return;

    const baseIntervalMs = 600;
    const intervalMs = Math.max(100, baseIntervalMs / playbackSpeed);

    const timer = setInterval(() => {
      nextStep();
    }, intervalMs);

    return () => clearInterval(timer);
  }, [isPlaying, playbackSpeed, nextStep]);

  return (
    <div className="relative h-auto sm:h-20 bg-white px-3 sm:px-6 py-2.5 flex flex-wrap sm:flex-nowrap items-center justify-between select-none z-20 shrink-0 gap-3 sm:gap-6 overflow-x-auto">
      {/* 1. Playback Section */}
      <div className="flex flex-col gap-0.5 sm:gap-1 shrink-0 min-w-[110px] sm:min-w-[130px]">
        <span className="text-[10px] sm:text-[11px] font-bold text-slate-800 tracking-tight">
          Playback
        </span>
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Step Back */}
          <button
            id="btn-playback-prev"
            onClick={prevStep}
            title="Previous Treatment Stage"
            className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-lg text-slate-700 hover:bg-slate-100 active:bg-slate-200 transition-colors"
          >
            <SkipBack className="w-3.5 sm:w-4 h-3.5 sm:h-4 fill-slate-800 stroke-none" />
          </button>

          {/* Play / Pause Main Button */}
          <button
            id="btn-playback-toggle"
            onClick={togglePlay}
            title={isPlaying ? "Pause Animation" : "Play Sequence"}
            className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center rounded-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white shadow-md shadow-blue-500/25 transition-all transform active:scale-95 shrink-0"
          >
            {isPlaying ? (
              <Pause className="w-3.5 sm:w-4 h-3.5 sm:h-4 fill-white stroke-none" />
            ) : (
              <Play className="w-3.5 sm:w-4 h-3.5 sm:h-4 fill-white stroke-none ml-0.5" />
            )}
          </button>

          {/* Step Forward */}
          <button
            id="btn-playback-next"
            onClick={nextStep}
            title="Next Treatment Stage"
            className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-lg text-slate-700 hover:bg-slate-100 active:bg-slate-200 transition-colors"
          >
            <SkipForward className="w-3.5 sm:w-4 h-3.5 sm:h-4 fill-slate-800 stroke-none" />
          </button>
        </div>
      </div>

      {/* Vertical Divider */}
      <div className="hidden sm:block h-10 w-[1px] bg-slate-200/70 shrink-0" />

      {/* 2. File Sequence Slider Section */}
      <div className="flex-1 order-3 sm:order-none flex flex-col gap-1 sm:gap-2 min-w-[180px] w-full sm:w-auto">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[10px] sm:text-[11px] font-bold text-slate-800 tracking-tight">
              File Sequence
            </span>
            {/* Clinical Movement Velocity Badge */}
            <button
              onClick={toggleSafetyPopover}
              className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold transition-all border ${
                safetyMetrics.status === 'optimal'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                  : safetyMetrics.status === 'moderate'
                    ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                    : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
              }`}
              title="Click to view clinical stage velocity telemetry"
            >
              {safetyMetrics.status === 'optimal' ? (
                <ShieldCheck className="w-3 h-3 text-emerald-600" />
              ) : (
                <AlertTriangle className="w-3 h-3 text-amber-600" />
              )}
              <span>{safetyMetrics.maxTranslationMm} mm / {safetyMetrics.maxRotationDeg}°</span>
              <Info className="w-2.5 h-2.5 opacity-60 ml-0.5" />
            </button>
          </div>
          <span className="text-[11px] sm:text-xs font-semibold text-slate-600 tabular-nums">
            Stage {currentStep} <span className="text-slate-400 font-normal">/ {totalSteps}</span>
          </span>
        </div>

        {/* Custom Scrubber Track with Stage Dots */}
        <div className="relative flex items-center py-1 sm:py-2">
          {/* Background track line */}
          <div className="absolute inset-x-0 h-1.5 bg-slate-100 rounded-full overflow-hidden">
            {/* Active progress fill */}
            <div
              className="h-full bg-blue-600 rounded-full transition-all duration-75"
              style={{ width: `${((currentStep - 1) / (totalSteps - 1)) * 100}%` }}
            />
          </div>

          {/* Discrete Stage Tick Dots */}
          <div className="absolute inset-x-0 flex justify-between pointer-events-none px-1">
            {totalSteps <= 16 ? (
              Array.from({ length: totalSteps }).map((_, i) => {
                const isPastOrCurrent = i + 1 <= currentStep;
                return (
                  <div
                    key={i}
                    className={`w-1.5 h-1.5 rounded-full transition-colors ${
                      isPastOrCurrent ? 'bg-blue-600 ring-1 ring-white' : 'bg-slate-300'
                    }`}
                  />
                );
              })
            ) : (
              Array.from({ length: totalSteps }).map((_, i) => {
                const stepNum = i + 1;
                const isMajor = stepNum === 1 || stepNum === totalSteps || stepNum % 5 === 0;
                if (!isMajor) return <div key={i} className="w-0.5" />;
                const isPastOrCurrent = stepNum <= currentStep;
                return (
                  <div
                    key={i}
                    className={`w-1 sm:w-1.5 h-1 sm:h-1.5 rounded-full transition-colors ${
                      isPastOrCurrent ? 'bg-blue-600 ring-1 ring-white' : 'bg-slate-300'
                    }`}
                  />
                );
              })
            )}
          </div>

          {/* Range Input for dragging */}
          <input
            id="slider-file-sequence"
            type="range"
            min="1"
            max={totalSteps}
            value={currentStep}
            onChange={(e) => setCurrentStep(parseInt(e.target.value))}
            className="w-full relative z-10 opacity-0 cursor-pointer h-5 sm:h-6"
          />

          {/* Animated Blue Thumb Handle */}
          <div
            className="absolute top-1/2 -translate-y-1/2 w-3.5 sm:w-4 h-3.5 sm:h-4 bg-blue-600 rounded-full border-2 border-white shadow-md pointer-events-none transition-all duration-75"
            style={{
              left: `calc(${((currentStep - 1) / (totalSteps - 1)) * 100}% - 7px)`,
            }}
          />
        </div>
      </div>

      {/* Vertical Divider */}
      <div className="hidden sm:block h-10 w-[1px] bg-slate-200/70 shrink-0" />

      {/* 3. Speed Control Section */}
      <div className="flex flex-col gap-0.5 sm:gap-1 shrink-0 min-w-[95px] sm:min-w-[120px]">
        <div className="flex items-center justify-between">
          <span className="text-[10px] sm:text-[11px] font-bold text-slate-800 tracking-tight">
            Speed
          </span>
          <span className="text-[10px] sm:text-[11px] font-semibold text-slate-600 tabular-nums">
            {playbackSpeed.toFixed(1)}x
          </span>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2 mt-0.5 sm:mt-1">
          <Gauge className="w-3.5 sm:w-4 h-3.5 sm:h-4 text-slate-600 shrink-0" />
          <div className="relative flex-1 flex items-center">
            {/* Speed track line */}
            <div className="absolute inset-x-0 h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-600 rounded-full"
                style={{ width: `${((playbackSpeed - 0.5) / (2.5 - 0.5)) * 100}%` }}
              />
            </div>
            <input
              id="slider-speed"
              type="range"
              min="0.5"
              max="2.5"
              step="0.25"
              value={playbackSpeed}
              onChange={(e) => setPlaybackSpeed(parseFloat(e.target.value))}
              className="w-16 sm:w-20 relative z-10 opacity-0 cursor-pointer h-4 sm:h-5"
            />
            {/* Speed Thumb */}
            <div
              className="absolute top-1/2 -translate-y-1/2 w-3 sm:w-3.5 h-3 sm:h-3.5 bg-blue-600 rounded-full border-2 border-white shadow pointer-events-none"
              style={{
                left: `calc(${((playbackSpeed - 0.5) / (2.5 - 0.5)) * 100}% - 6px)`,
              }}
            />
          </div>
        </div>
      </div>

      {/* Vertical Divider */}
      <div className="hidden sm:block h-10 w-[1px] bg-slate-200/70 shrink-0" />

      {/* 4. Loop Switch Section */}
      <div className="flex flex-col gap-0.5 sm:gap-1 shrink-0 min-w-[60px] sm:min-w-[70px]">
        <span className="text-[10px] sm:text-[11px] font-bold text-slate-800 tracking-tight">
          Loop
        </span>
        <div className="flex items-center gap-2 mt-0.5 sm:mt-1">
          <Repeat className={`w-3.5 sm:w-4 h-3.5 sm:h-4 transition-colors ${isLooping ? 'text-blue-600' : 'text-slate-500'}`} />
          <button
            id="btn-toggle-loop"
            onClick={toggleLoop}
            className={`w-9 sm:w-10 h-4.5 sm:h-5 rounded-full p-0.5 transition-colors ${
              isLooping ? 'bg-blue-600' : 'bg-slate-200'
            }`}
          >
            <div
              className={`w-3.5 sm:w-4 h-3.5 sm:h-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${
                isLooping ? 'translate-x-4 sm:translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Detailed Clinical Safety Popover Modal */}
      {isSafetyPopoverOpen && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-[340px] bg-slate-900/95 backdrop-blur-md text-white rounded-2xl p-4 shadow-2xl border border-slate-750 z-50 animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2.5 mb-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                Stage {currentStep} Clinical Telemetry
              </h4>
            </div>
            <button
              onClick={() => setSafetyPopoverOpen(false)}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="grid grid-cols-2 gap-2 bg-slate-800/80 p-2.5 rounded-xl border border-slate-700/50">
              <div>
                <span className="text-[10px] text-slate-400 block">Max Translation</span>
                <span className="font-bold text-emerald-400 text-sm">{safetyMetrics.maxTranslationMm} mm</span>
                <span className="text-[9px] text-slate-500 block">Limit: ≤ 0.25 mm</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">Max Rotation</span>
                <span className="font-bold text-emerald-400 text-sm">{safetyMetrics.maxRotationDeg}°</span>
                <span className="text-[9px] text-slate-500 block">Limit: ≤ 2.0°</span>
              </div>
            </div>

            <div className="flex justify-between items-center px-1">
              <span className="text-slate-400">Primary Active Tooth:</span>
              <span className="font-semibold text-blue-300">{safetyMetrics.limitingTooth}</span>
            </div>

            <div className="p-2 rounded-lg bg-blue-950/40 border border-blue-800/40 text-[11px] text-blue-200 leading-relaxed">
              💡 {safetyMetrics.statusMessage}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
