import React from 'react';
import { Camera, Radio, Settings, Users, Zap } from 'lucide-react';
import { Athlete, DetectorState, MultiDeviceSyncState } from '../types';

interface HeaderProps {
  selectedAthlete: Athlete;
  athletes: Athlete[];
  onSelectAthlete: (athlete: Athlete) => void;
  detectorState: DetectorState;
  testTitle: string;
  categoryLabel: string;
  isDemoMode: boolean;
  onToggleDemoMode: () => void;
  onOpenSettings: () => void;
  onOpenAthletes: () => void;
  syncState: MultiDeviceSyncState;
  onOpenSyncModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  selectedAthlete,
  athletes,
  onSelectAthlete,
  detectorState,
  testTitle,
  categoryLabel,
  isDemoMode,
  onToggleDemoMode,
  onOpenSettings,
  onOpenAthletes,
  syncState,
  onOpenSyncModal,
}) => {
  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white px-4 py-3 shadow-lg">
      <div className="max-w-4xl mx-auto flex items-center justify-between gap-2">
        {/* Left: Athlete Selector */}
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenAthletes}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors flex items-center gap-1.5 text-xs font-medium min-h-[38px]"
            title="Kelola Atlet"
          >
            <Users className="w-4 h-4 text-indigo-400" />
            <span className="hidden sm:inline">Atlet</span>
          </button>

          {/* Athlete Dropdown */}
          <div className="relative flex items-center bg-slate-800/80 rounded-lg px-2.5 py-1 border border-slate-700 min-h-[38px]">
            <span className="w-5 h-5 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center mr-2 shadow-sm">
              {selectedAthlete.bibNumber}
            </span>
            <select
              value={selectedAthlete.id}
              onChange={(e) => {
                const found = athletes.find((a) => a.id === e.target.value);
                if (found) onSelectAthlete(found);
              }}
              className="bg-transparent text-sm font-semibold text-white focus:outline-none cursor-pointer pr-1"
            >
              {athletes.map((ath) => (
                <option key={ath.id} value={ath.id} className="bg-slate-900 text-white">
                  #{ath.bibNumber} {ath.name} ({ath.category})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Center: Title / Status pill */}
        <div className="hidden md:flex flex-col items-center">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              {testTitle}
            </span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              {categoryLabel}
            </span>
          </div>
          <span className={`text-[11px] font-medium transition-colors ${
            detectorState === 'ARMED' ? 'text-amber-400 font-bold animate-pulse' :
            detectorState === 'RUNNING' ? 'text-emerald-400 font-bold' :
            'text-slate-400'
          }`}>
            {detectorState === 'IDLE' && 'Standby / Single Tap Start'}
            {detectorState === 'ARMED' && 'Detection ready — Menunggu Garis Tersentuh'}
            {detectorState === 'COUNTDOWN' && 'Menghitung Mundur...'}
            {detectorState === 'RUNNING' && 'Timer Berjalan!'}
            {detectorState === 'FINISHED' && 'Finish! Garis Deteksi Terlewati'}
          </span>
        </div>

        {/* Right: Multi-device sync, Camera toggle & Settings */}
        <div className="flex items-center gap-2">
          {/* Multi-Device Sync Button */}
          <button
            onClick={onOpenSyncModal}
            className={`px-2.5 py-1.5 rounded-lg border transition-all flex items-center gap-1.5 text-xs font-bold min-h-[38px] ${
              syncState.role !== 'SOLO' && syncState.isConnected
                ? 'bg-indigo-600/20 text-indigo-300 border-indigo-500/40 hover:bg-indigo-600/30 shadow-md'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
            }`}
            title="Hubungkan Device 1 (Start) & Device 2 (Finish)"
          >
            <Radio
              className={`w-4 h-4 ${
                syncState.isConnected && syncState.role !== 'SOLO'
                  ? 'text-indigo-400 animate-pulse'
                  : 'text-slate-400'
              }`}
            />
            <span className="hidden sm:inline">
              {syncState.role === 'START' && `Gate Start (${syncState.roomId})`}
              {syncState.role === 'FINISH' && `Gate Finish (${syncState.roomId})`}
              {syncState.role === 'MONITOR' && `Monitor (${syncState.roomId})`}
              {syncState.role === 'SOLO' && 'Sync Multi-Device'}
            </span>
            {syncState.role !== 'SOLO' && (
              <span
                className={`w-2 h-2 rounded-full ${
                  syncState.isConnected ? 'bg-emerald-400 animate-ping' : 'bg-red-400'
                }`}
              />
            )}
          </button>

          {/* Mode Switch (Live WebCam vs Demo Simulator) */}
          <button
            onClick={onToggleDemoMode}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-semibold transition-all shadow-sm min-h-[38px] ${
              isDemoMode
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30'
                : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30'
            }`}
            title={isDemoMode ? 'Mode Simulasi Demo' : 'Mode Kamera Web (Real)'}
          >
            {isDemoMode ? (
              <>
                <Zap className="w-3.5 h-3.5 text-amber-400 animate-bounce" />
                <span>Simulasi Demo</span>
              </>
            ) : (
              <>
                <Camera className="w-3.5 h-3.5 text-emerald-400" />
                <span>Kamera Live</span>
              </>
            )}
          </button>

          {/* Settings Button */}
          <button
            onClick={onOpenSettings}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors min-h-[38px]"
            title="Pengaturan Deteksi & Timer"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
