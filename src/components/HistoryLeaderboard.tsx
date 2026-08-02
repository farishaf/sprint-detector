import React, { useState } from 'react';
import { Award, Download, History, Trophy, Trash2, LineChart as ChartIcon, Table as TableIcon } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { SprintSession } from '../types';

interface HistoryLeaderboardProps {
  sessions: SprintSession[];
  onClearHistory: () => void;
}

export const HistoryLeaderboard: React.FC<HistoryLeaderboardProps> = ({
  sessions,
  onClearHistory,
}) => {
  const [viewMode, setViewMode] = useState<'BOTH' | 'CHART' | 'TABLE'>('BOTH');
  const [selectedAthleteFilter, setSelectedAthleteFilter] = useState<string>('ALL');

  if (sessions.length === 0) return null;

  // Extract unique athlete names for filter
  const uniqueAthletes = Array.from(new Set(sessions.map((s) => s.athleteName)));

  // Filtered sessions
  const filteredSessions = selectedAthleteFilter === 'ALL'
    ? sessions
    : sessions.filter((s) => s.athleteName === selectedAthleteFilter);

  // Calculate top score for trophy highlight
  const bestSession = [...sessions].sort((a, b) => a.totalTimeMs - b.totalTimeMs)[0];

  // Chart data sorted chronologically (oldest first)
  const chartData = [...filteredSessions]
    .slice()
    .reverse()
    .map((s, idx) => ({
      index: `#${idx + 1}`,
      timeSec: Number((s.totalTimeMs / 1000).toFixed(2)),
      speedKmh: Number(s.topSpeedKmh.toFixed(1)),
      date: s.date,
      athlete: s.athleteName,
    }));

  const handleExportCSV = () => {
    const headers = ['Tanggal', 'Nama Atlet', 'No Bib', 'Kategori', 'Ujian', 'Waktu (s)', 'Kecepatan Maks (km/h)', 'Kecepatan (m/s)'];
    const rows = sessions.map((s) => [
      s.date,
      s.athleteName,
      s.bibNumber,
      s.category,
      s.testTitle,
      (s.totalTimeMs / 1000).toFixed(2),
      s.topSpeedKmh.toFixed(2),
      (s.topSpeedKmh / 3.6).toFixed(2),
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].map((e) => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Hasil_Sprint_Detection_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl mt-4">
      {/* Top Header & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800 mb-4">
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-amber-400" />
          <div>
            <h3 className="text-sm font-bold text-white">Riwayat & Papan Skor Sprint</h3>
            <p className="text-[11px] text-slate-400">Analisis tren performa & rekam hasil waktu</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Athlete Filter Dropdown */}
          {uniqueAthletes.length > 1 && (
            <select
              value={selectedAthleteFilter}
              onChange={(e) => setSelectedAthleteFilter(e.target.value)}
              className="bg-slate-800 text-xs font-semibold text-slate-200 px-2.5 py-1.5 rounded-lg border border-slate-700 focus:outline-none cursor-pointer"
            >
              <option value="ALL">Semua Atlet ({sessions.length})</option>
              {uniqueAthletes.map((ath) => (
                <option key={ath} value={ath}>
                  {ath}
                </option>
              ))}
            </select>
          )}

          {/* View Mode Toggle Buttons */}
          <div className="flex rounded-lg bg-slate-800 p-0.5 border border-slate-700">
            <button
              onClick={() => setViewMode('BOTH')}
              className={`px-2 py-1 text-xs font-semibold rounded-md transition-colors ${
                viewMode === 'BOTH' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Semua
            </button>
            <button
              onClick={() => setViewMode('CHART')}
              className={`px-2 py-1 text-xs font-semibold rounded-md transition-colors flex items-center gap-1 ${
                viewMode === 'CHART' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              <ChartIcon className="w-3.5 h-3.5" />
              <span>Grafik</span>
            </button>
            <button
              onClick={() => setViewMode('TABLE')}
              className={`px-2 py-1 text-xs font-semibold rounded-md transition-colors flex items-center gap-1 ${
                viewMode === 'TABLE' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              <TableIcon className="w-3.5 h-3.5" />
              <span>Tabel</span>
            </button>
          </div>

          <button
            onClick={handleExportCSV}
            className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors border border-slate-700"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Ekspor CSV</span>
          </button>

          <button
            onClick={onClearHistory}
            className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-colors"
            title="Bersihkan Riwayat"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Recharts Line Chart Section */}
      {(viewMode === 'BOTH' || viewMode === 'CHART') && (
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 mb-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-bold text-slate-300 flex items-center gap-1.5 uppercase tracking-wider">
              <ChartIcon className="w-3.5 h-3.5 text-indigo-400" />
              <span>Grafik Tren Waktu Sprint (Detik) & Kecepatan (km/h)</span>
            </h4>
            <span className="text-[10px] text-slate-500 font-mono">
              {chartData.length} Sesi Terakhir
            </span>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                <XAxis
                  dataKey="index"
                  stroke="#94a3b8"
                  fontSize={11}
                  tickLine={false}
                />
                <YAxis
                  yAxisId="left"
                  stroke="#818cf8"
                  fontSize={11}
                  domain={['auto', 'auto']}
                  unit="s"
                  tickLine={false}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  stroke="#34d399"
                  fontSize={11}
                  domain={['auto', 'auto']}
                  unit="km/h"
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '0.75rem',
                    color: '#f8fafc',
                    fontSize: '12px',
                    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)',
                  }}
                  formatter={(value: any, name: any) => {
                    if (name === 'Waktu (s)') return [`${value}s`, 'Waktu'];
                    if (name === 'Kecepatan (km/h)') return [`${value} km/h`, 'Kecepatan'];
                    return [value, name];
                  }}
                  labelFormatter={(label, items) => {
                    const item = items[0]?.payload;
                    return item ? `${item.athlete} (${item.date}) - Sesi ${label}` : `Sesi ${label}`;
                  }}
                />
                <Legend
                  wrapperStyle={{ fontSize: '11px', paddingTop: '6px' }}
                />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="timeSec"
                  name="Waktu (s)"
                  stroke="#6366f1"
                  strokeWidth={2.5}
                  dot={{ fill: '#818cf8', r: 4 }}
                  activeDot={{ r: 6, fill: '#6366f1' }}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="speedKmh"
                  name="Kecepatan (km/h)"
                  stroke="#10b981"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  dot={{ fill: '#34d399', r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Leaderboard Table Section */}
      {(viewMode === 'BOTH' || viewMode === 'TABLE') && (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-3">Atlet</th>
                <th className="py-2.5 px-3">Ujian</th>
                <th className="py-2.5 px-3">Waktu (s)</th>
                <th className="py-2.5 px-3">Kecepatan</th>
                <th className="py-2.5 px-3">Waktu Rekam</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredSessions.map((session) => {
                const isBest = bestSession && session.id === bestSession.id;
                const formattedTime = (session.totalTimeMs / 1000).toFixed(2);

                return (
                  <tr
                    key={session.id}
                    className={`hover:bg-slate-800/50 transition-colors ${
                      isBest ? 'bg-amber-500/10' : ''
                    }`}
                  >
                    <td className="py-2.5 px-3 font-medium text-white flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-indigo-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0">
                        {session.bibNumber}
                      </span>
                      <div>
                        <div className="flex items-center gap-1">
                          <span>{session.athleteName}</span>
                          {isBest && <Award className="w-3.5 h-3.5 text-amber-400" title="Waktu Tercepat!" />}
                        </div>
                        <span className="text-[10px] text-slate-400">{session.category}</span>
                      </div>
                    </td>

                    <td className="py-2.5 px-3 text-slate-300">
                      <div>{session.testTitle}</div>
                      <span className="text-[10px] text-slate-500">{session.distanceMeters}m</span>
                    </td>

                    <td className="py-2.5 px-3 font-mono text-sm font-bold text-white">
                      {formattedTime}s
                    </td>

                    <td className="py-2.5 px-3 font-mono text-xs text-emerald-400">
                      {session.topSpeedKmh.toFixed(1)} km/h
                    </td>

                    <td className="py-2.5 px-3 text-[11px] text-slate-400">
                      {session.date}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

