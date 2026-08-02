import React, { useState } from 'react';
import { Camera, Clock, Gauge, Image as ImageIcon, Maximize2, Trash2, X } from 'lucide-react';
import { Athlete, LapSplit } from '../types';

interface SplitLogsPanelProps {
  splits: LapSplit[];
  athlete: Athlete;
  onClearSplits: () => void;
  onDeleteSplit: (id: string) => void;
}

export const SplitLogsPanel: React.FC<SplitLogsPanelProps> = ({
  splits,
  athlete,
  onClearSplits,
  onDeleteSplit,
}) => {
  const [selectedSnapshot, setSelectedSnapshot] = useState<LapSplit | null>(null);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col h-full">
      {/* Header matching reference style */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center">
            {athlete.bibNumber}
          </span>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
              <span>{athlete.name}</span>
              <span className="text-[10px] font-medium px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 border border-slate-700">
                {athlete.category}
              </span>
            </h3>
            <p className="text-[11px] text-slate-400">Log Split & Photo Finish Camera</p>
          </div>
        </div>

        {splits.length > 0 && (
          <button
            onClick={onClearSplits}
            className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-colors"
            title="Hapus Log"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Split Log List */}
      <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 max-h-[360px] scrollbar-thin scrollbar-thumb-slate-700">
        {splits.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-slate-500 text-center">
            <Clock className="w-8 h-8 mb-2 stroke-1 opacity-50" />
            <p className="text-xs font-medium">Belum ada catatan split / lap</p>
            <p className="text-[11px] text-slate-600 mt-1 max-w-[200px]">
              Jalankan timer dan lewati garis deteksi kamera untuk merekam snapshot foto finish.
            </p>
          </div>
        ) : (
          splits.map((split) => {
            const formattedElapsed = (split.elapsedMs / 1000).toFixed(2);
            const formattedDiff = (split.diffFromPrevMs / 1000).toFixed(2);

            return (
              <div
                key={split.id}
                className="group relative bg-slate-950/70 border border-slate-800 hover:border-slate-700 rounded-xl p-3 flex items-center justify-between gap-3 transition-all"
              >
                {/* Left Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="w-4 h-4 rounded-full bg-slate-800 text-slate-300 font-mono text-[10px] font-bold flex items-center justify-center">
                      {split.splitIndex}
                    </span>
                    <span className="text-xs font-bold text-white truncate">
                      {split.label}
                    </span>
                  </div>

                  <div className="flex items-baseline gap-3">
                    <span className="font-mono text-lg font-extrabold text-white">
                      {formattedElapsed}s
                    </span>

                    {split.splitIndex > 1 && (
                      <span className="font-mono text-xs font-semibold text-emerald-400">
                        +{formattedDiff}s
                      </span>
                    )}
                  </div>

                  {/* Calculated speed if available */}
                  {split.speedKmh && (
                    <div className="flex items-center gap-1.5 mt-1 text-[11px] text-indigo-300 font-mono">
                      <span>{split.speedKmh.toFixed(1)} km/h</span>
                      <span className="text-slate-600">•</span>
                      <span>{split.speedMs?.toFixed(2)} m/s</span>
                    </div>
                  )}
                </div>

                {/* Right: Captured Photo Finish Thumbnail (matching reference screenshot frame) */}
                {split.capturedImageUri ? (
                  <button
                    onClick={() => setSelectedSnapshot(split)}
                    className="relative w-20 h-14 rounded-lg overflow-hidden border border-emerald-500/50 group-hover:border-emerald-400 shadow-md bg-slate-900 shrink-0 transition-transform active:scale-95"
                    title="Buka Foto Finish High-Res"
                  >
                    <img
                      src={split.capturedImageUri}
                      alt={`Photo finish split ${split.splitIndex}`}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-slate-950/20 group-hover:bg-transparent transition-colors flex items-center justify-center">
                      <Maximize2 className="w-3.5 h-3.5 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow" />
                    </div>
                  </button>
                ) : (
                  <div className="w-20 h-14 rounded-lg bg-slate-900 border border-slate-800 shrink-0 flex items-center justify-center text-slate-600">
                    <Camera className="w-4 h-4 stroke-1" />
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Photo Finish Snapshot Inspector Modal */}
      {selectedSnapshot && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-4 shadow-2xl relative animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Camera className="w-4 h-4 text-emerald-400" />
                  <span>Photo Finish Inspector</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Sprint Split #{selectedSnapshot.splitIndex} — {selectedSnapshot.label}
                </p>
              </div>
              <button
                onClick={() => setSelectedSnapshot(null)}
                className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Large Snapshot view */}
            <div className="relative aspect-[4/3] rounded-xl overflow-hidden border border-slate-800 bg-black mb-3">
              {selectedSnapshot.capturedImageUri && (
                <img
                  src={selectedSnapshot.capturedImageUri}
                  alt="High res photo finish"
                  className="w-full h-full object-contain"
                />
              )}
            </div>

            <div className="flex items-center justify-between bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs text-white">
              <div>
                <span className="text-slate-400">Atlet:</span>{' '}
                <span className="font-bold">{athlete.name} (#{athlete.bibNumber})</span>
              </div>
              <div>
                <span className="text-slate-400">Waktu:</span>{' '}
                <span className="font-mono font-bold text-emerald-400">
                  {(selectedSnapshot.elapsedMs / 1000).toFixed(2)}s
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
