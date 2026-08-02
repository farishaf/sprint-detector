import React from 'react';
import { Play, Square, RotateCcw, ShieldCheck, Flag, Volume2, Timer as TimerIcon } from 'lucide-react';
import { DetectionConfig, DetectorState, StartMode } from '../types';

interface TimerDisplayProps {
  elapsedMs: number;
  detectorState: DetectorState;
  config: DetectionConfig;
  onUpdateConfig: (updated: Partial<DetectionConfig>) => void;
  onStart: () => void;
  onStop: () => void;
  onReset: () => void;
  onArmDetector: () => void;
  onAddManualLap: () => void;
}

export const TimerDisplay: React.FC<TimerDisplayProps> = ({
  elapsedMs,
  detectorState,
  config,
  onUpdateConfig,
  onStart,
  onStop,
  onReset,
  onArmDetector,
  onAddManualLap,
}) => {
  // Format seconds and milliseconds e.g. "2.55s" or "0.00s"
  const formattedSeconds = (elapsedMs / 1000).toFixed(2);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
      {/* Top Bar: Mode Selector & Status */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <TimerIcon className="w-4 h-4 text-indigo-400" />
          <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
            Mode Mulai:
          </span>
          <select
            value={config.startMode}
            onChange={(e) => onUpdateConfig({ startMode: e.target.value as StartMode })}
            className="bg-slate-800 text-xs font-semibold text-white px-2.5 py-1 rounded-lg border border-slate-700 cursor-pointer focus:outline-none"
          >
            <option value="MOTION_LINE">Deteksi Garis Kamera</option>
            <option value="COUNTDOWN">Hitung Mundur 3s</option>
            <option value="SOUND_GUN">Suara Pistol / Tepukan</option>
            <option value="MANUAL">Manual Tombol</option>
          </select>
        </div>

        {/* Status Badge matching reference screenshot */}
        <div className={`px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 border ${
          detectorState === 'ARMED' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' :
          detectorState === 'RUNNING' ? 'bg-amber-500/20 text-amber-300 border-amber-500/30 animate-pulse' :
          detectorState === 'FINISHED' ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' :
          'bg-slate-800 text-slate-400 border-slate-700'
        }`}>
          <span className={`w-2 h-2 rounded-full ${
            detectorState === 'ARMED' ? 'bg-emerald-400' :
            detectorState === 'RUNNING' ? 'bg-amber-400' :
            detectorState === 'FINISHED' ? 'bg-indigo-400' : 'bg-slate-500'
          }`} />
          <span>
            {detectorState === 'ARMED' && 'Detection ready'}
            {detectorState === 'RUNNING' && 'Timer Berjalan'}
            {detectorState === 'FINISHED' && 'Finish / Selesai'}
            {detectorState === 'IDLE' && 'Standby'}
            {detectorState === 'COUNTDOWN' && 'Hitung Mundur'}
          </span>
        </div>
      </div>

      {/* Main Timer Display Section (Ref image matching: "Timer 2.55s") */}
      <div className="py-6 flex flex-col items-center justify-center text-center">
        <span className="text-xs font-medium uppercase tracking-widest text-slate-400 mb-1">
          Timer Sprint
        </span>
        <div className="flex items-baseline justify-center gap-1">
          <span className="font-mono text-6xl sm:text-7xl font-extrabold text-white tracking-tight drop-shadow-md">
            {formattedSeconds}
          </span>
          <span className="text-2xl sm:text-3xl font-extrabold text-indigo-400 font-mono">
            s
          </span>
        </div>

        {/* Sprint Distance info */}
        <div className="mt-2 text-xs text-slate-400 flex items-center gap-2">
          <span>Jarak Target: </span>
          <select
            value={config.distanceMeters}
            onChange={(e) => onUpdateConfig({ distanceMeters: Number(e.target.value) })}
            className="bg-slate-800 text-xs font-bold text-indigo-300 px-2 py-0.5 rounded border border-slate-700"
          >
            <option value={10}>10 Meter Sprint</option>
            <option value={20}>20 Meter Sprint</option>
            <option value={30}>30 Meter Sprint</option>
            <option value={40}>40 Meter Sprint / Yard</option>
            <option value={60}>60 Meter Sprint</option>
            <option value={100}>100 Meter Sprint</option>
          </select>
        </div>
      </div>

      {/* Primary Action Buttons */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-3 border-t border-slate-800">
        {/* Arm Sensor / Detection Ready */}
        <button
          onClick={onArmDetector}
          disabled={detectorState === 'RUNNING'}
          className={`py-3 px-3 rounded-xl font-bold text-xs flex flex-col items-center justify-center gap-1 transition-all shadow-md ${
            detectorState === 'ARMED'
              ? 'bg-emerald-600 text-white shadow-emerald-900/40 ring-2 ring-emerald-400'
              : 'bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border border-emerald-800/60'
          } disabled:opacity-40`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>{detectorState === 'ARMED' ? 'Detektor Garis Aktif' : 'Aktifkan Deteksi'}</span>
        </button>

        {/* Start / Stop Toggle */}
        {detectorState !== 'RUNNING' ? (
          <button
            onClick={onStart}
            className="py-3 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex flex-col items-center justify-center gap-1 transition-all shadow-md shadow-indigo-950/50"
          >
            <Play className="w-4 h-4 fill-white" />
            <span>Mulai Timer</span>
          </button>
        ) : (
          <button
            onClick={onStop}
            className="py-3 px-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs flex flex-col items-center justify-center gap-1 transition-all shadow-md shadow-red-950/50 animate-pulse"
          >
            <Square className="w-4 h-4 fill-white" />
            <span>Hentikan Timer</span>
          </button>
        )}

        {/* Split / Lap */}
        <button
          onClick={onAddManualLap}
          disabled={detectorState !== 'RUNNING'}
          className="py-3 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs flex flex-col items-center justify-center gap-1 transition-all disabled:opacity-40"
        >
          <Flag className="w-4 h-4 text-amber-400" />
          <span>Tambah Lap</span>
        </button>

        {/* Reset */}
        <button
          onClick={onReset}
          className="py-3 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 font-bold text-xs flex flex-col items-center justify-center gap-1 transition-all"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Reset Timer</span>
        </button>
      </div>
    </div>
  );
};
