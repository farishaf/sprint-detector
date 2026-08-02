import React from 'react';
import { Sliders, Volume2, X } from 'lucide-react';
import { DetectionConfig, StartMode } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: DetectionConfig;
  onUpdateConfig: (updated: Partial<DetectionConfig>) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  config,
  onUpdateConfig,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-5 shadow-2xl relative">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-indigo-400" />
            <h3 className="text-base font-bold text-white">Pengaturan Deteksi & Timer</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Test Preset & Distance */}
          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1">
              Nama Ujian / Tes Sprint
            </label>
            <input
              type="text"
              value={config.testTitle}
              onChange={(e) => onUpdateConfig({ testTitle: e.target.value })}
              className="w-full bg-slate-950 text-xs font-semibold text-white px-3 py-2 rounded-lg border border-slate-700 focus:outline-none"
              placeholder="cth: 10m sprint test"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">
                Kategori Umur
              </label>
              <input
                type="text"
                value={config.categoryLabel}
                onChange={(e) => onUpdateConfig({ categoryLabel: e.target.value })}
                className="w-full bg-slate-950 text-xs font-semibold text-white px-3 py-2 rounded-lg border border-slate-700 focus:outline-none"
                placeholder="cth: U17"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">
                Jarak Lintasan (Meter)
              </label>
              <input
                type="number"
                value={config.distanceMeters}
                onChange={(e) => onUpdateConfig({ distanceMeters: Number(e.target.value) || 10 })}
                className="w-full bg-slate-950 text-xs font-semibold text-white px-3 py-2 rounded-lg border border-slate-700 focus:outline-none"
              />
            </div>
          </div>

          {/* Start Trigger Mode */}
          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1">
              Metode Mulai Timer
            </label>
            <select
              value={config.startMode}
              onChange={(e) => onUpdateConfig({ startMode: e.target.value as StartMode })}
              className="w-full bg-slate-950 text-xs font-semibold text-white px-3 py-2 rounded-lg border border-slate-700 focus:outline-none"
            >
              <option value="MOTION_LINE">Deteksi Garis Kamera (Sensor Optik Auto-Start & Finish)</option>
              <option value="COUNTDOWN">Hitung Mundur Beep 3-2-1</option>
              <option value="SOUND_GUN">Deteksi Suara Tepuk / Pistol Start</option>
              <option value="MANUAL">Manual Tombol Start</option>
            </select>
          </div>

          {/* Sound Beep Toggle */}
          <div className="flex items-center justify-between p-3 bg-slate-950 rounded-xl border border-slate-800">
            <div className="flex items-center gap-2">
              <Volume2 className="w-4 h-4 text-indigo-400" />
              <div>
                <span className="text-xs font-bold text-white block">Suara Beep & Sinyal Audio</span>
                <span className="text-[10px] text-slate-400">Bunyi saat hitung mundur dan saat pemicu garis disentuh</span>
              </div>
            </div>
            <input
              type="checkbox"
              checked={config.soundBeepEnabled}
              onChange={(e) => onUpdateConfig({ soundBeepEnabled: e.target.checked })}
              className="w-4 h-4 accent-indigo-600 rounded cursor-pointer"
            />
          </div>

          {/* Trigger Cooldown */}
          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1">
              Cooldown Pemicu Ulang (ms): {config.triggerCooldownMs}ms
            </label>
            <input
              type="range"
              min="500"
              max="5000"
              step="250"
              value={config.triggerCooldownMs}
              onChange={(e) => onUpdateConfig({ triggerCooldownMs: Number(e.target.value) })}
              className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
            />
            <p className="text-[10px] text-slate-400 mt-1">
              Mencegah pemicuan ganda yang tidak disengaja dalam hitungan milidetik.
            </p>
          </div>
        </div>

        <div className="mt-5 pt-3 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-md transition-colors"
          >
            Selesai
          </button>
        </div>
      </div>
    </div>
  );
};
