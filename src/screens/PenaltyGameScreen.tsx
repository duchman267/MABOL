import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { sound } from '../utils/audio';
import {
  Trophy,
  Flame,
  RotateCcw,
  Sparkles,
  ArrowLeft,
  ArrowUp,
  ArrowRight,
  Shield,
  Medal,
  Award,
} from 'lucide-react';

type Direction = 'left' | 'center' | 'right';

export const PenaltyGameScreen: React.FC = () => {
  const { activeCommunity, currentUser, penaltyRecords, savePenaltyScore } = useApp();

  const [gameState, setGameState] = useState<'ready' | 'kicking' | 'result'>('ready');
  const [shotDirection, setShotDirection] = useState<Direction | null>(null);
  const [keeperDirection, setKeeperDirection] = useState<Direction | null>(null);
  const [lastOutcome, setLastOutcome] = useState<'GOAL' | 'SAVE' | null>(null);

  // Sesi Game Saat Ini
  const [sessionAttempts, setSessionAttempts] = useState(0);
  const [sessionGoals, setSessionGoals] = useState(0);
  const [sessionSaves, setSessionSaves] = useState(0);
  const [sessionScore, setSessionScore] = useState(0);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [highestStreak, setHighestStreak] = useState(0);

  // Leaderboard Komunitas
  const leaderboard = [...penaltyRecords]
    .filter((p) => p.communityId === activeCommunity.id)
    .sort((a, b) => b.score - a.score);

  const directions: Direction[] = ['left', 'center', 'right'];

  const handleShoot = (dir: Direction) => {
    if (gameState === 'kicking') return;

    sound.playKick();
    setShotDirection(dir);
    setGameState('kicking');

    // Kiper memilih arah secara acak (Kiri, Tengah, Kanan)
    const randomKeeperDir = directions[Math.floor(Math.random() * directions.length)];
    setKeeperDirection(randomKeeperDir);

    // Hitung hasil setelah jeda animasi 600ms
    setTimeout(() => {
      const isGoal = dir !== randomKeeperDir;
      const outcome = isGoal ? 'GOAL' : 'SAVE';
      setLastOutcome(outcome);

      const newAttempts = sessionAttempts + 1;
      let newGoals = sessionGoals;
      let newSaves = sessionSaves;
      let newStreak = currentStreak;
      let newHighStreak = highestStreak;
      let addedScore = 0;

      if (isGoal) {
        sound.playGoal();
        newGoals += 1;
        newStreak += 1;
        if (newStreak > newHighStreak) newHighStreak = newStreak;
        // Poin: 100 base + 50 per streak
        addedScore = 100 + (newStreak - 1) * 50;
      } else {
        sound.playSave();
        newSaves += 1;
        newStreak = 0;
      }

      const updatedScore = sessionScore + addedScore;

      setSessionAttempts(newAttempts);
      setSessionGoals(newGoals);
      setSessionSaves(newSaves);
      setSessionScore(updatedScore);
      setCurrentStreak(newStreak);
      setHighestStreak(newHighStreak);
      setGameState('result');

      // Simpan ke storage dan leaderboard
      savePenaltyScore(updatedScore, newGoals, newSaves, newAttempts, newHighStreak);
    }, 600);
  };

  const handleResetSession = () => {
    sound.playWhistle();
    setGameState('ready');
    setShotDirection(null);
    setKeeperDirection(null);
    setLastOutcome(null);
    setSessionAttempts(0);
    setSessionGoals(0);
    setSessionSaves(0);
    setSessionScore(0);
    setCurrentStreak(0);
    setHighestStreak(0);
  };

  return (
    <div className="space-y-4 pb-24 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-black text-[#071A33]">Adu Tendangan Penalti ⚽</h2>
          <p className="text-xs text-gray-500">Pilih arah tendangan dan kalahkan kiper lawan!</p>
        </div>

        <button
          onClick={handleResetSession}
          className="p-2 bg-gray-100 hover:bg-gray-200 rounded-xl text-xs font-bold text-gray-600 flex items-center gap-1 active:scale-95 transition-all"
          title="Mulai Ulang Sesi"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span className="hidden xs:inline">Reset Sesi</span>
        </button>
      </div>

      {/* Scoreboard Sesi */}
      <div className="bg-white p-3.5 rounded-3xl border border-gray-100 shadow-xs grid grid-cols-4 gap-2 text-center">
        <div>
          <div className="text-[10px] uppercase font-bold text-gray-400">Total Skor</div>
          <div className="text-lg font-black text-[#1261FF]">{sessionScore}</div>
        </div>
        <div>
          <div className="text-[10px] uppercase font-bold text-gray-400">Gol</div>
          <div className="text-lg font-black text-emerald-600">{sessionGoals}</div>
        </div>
        <div>
          <div className="text-[10px] uppercase font-bold text-gray-400">Ditepis</div>
          <div className="text-lg font-black text-red-500">{sessionSaves}</div>
        </div>
        <div>
          <div className="text-[10px] uppercase font-bold text-gray-400 flex items-center justify-center gap-0.5">
            <Flame className="w-3 h-3 text-amber-500" />
            Streak
          </div>
          <div className="text-lg font-black text-amber-500">{currentStreak}x</div>
        </div>
      </div>

      {/* LAPANGAN PENALTI (PITCH VIEW) */}
      <div className="relative bg-gradient-to-b from-emerald-800 via-emerald-700 to-green-600 rounded-3xl p-5 shadow-xl overflow-hidden border-4 border-emerald-900/30 min-h-[300px] flex flex-col justify-between select-none">
        {/* Pola Garis Rumput Lapangan */}
        <div className="absolute inset-0 bg-[radial-gradient(#ffffff15_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />
        <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-white/20 -translate-y-1/2 pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 w-28 h-28 border border-white/20 rounded-full -translate-x-1/2 -translate-y-1/2 pointer-events-none" />

        {/* GAWANG SEPAK BOLA */}
        <div className="relative z-10 w-full max-w-[260px] mx-auto mt-2">
          {/* Tiang & Jaring Gawang */}
          <div className="relative h-28 border-4 border-white/90 border-b-0 rounded-t-lg bg-white/5 backdrop-blur-[1px] shadow-2xl flex items-center justify-center overflow-hidden">
            {/* Jaring kotak-kotak */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff20_1px,transparent_1px),linear-gradient(to_bottom,#ffffff20_1px,transparent_1px)] bg-[size:12px_12px]" />

            {/* KIPER */}
            <div
              className={`absolute bottom-0 w-12 h-16 flex flex-col items-center transition-all duration-500 ${
                keeperDirection === 'left'
                  ? '-translate-x-16 rotate-[-25deg]'
                  : keeperDirection === 'right'
                  ? 'translate-x-16 rotate-[25deg]'
                  : 'translate-x-0'
              }`}
            >
              {/* Sarung tangan */}
              <div className="flex gap-4 -mb-1">
                <div className="w-3 h-3 rounded-full bg-amber-400 border border-black/20" />
                <div className="w-3 h-3 rounded-full bg-amber-400 border border-black/20" />
              </div>
              {/* Kepala Kiper */}
              <div className="w-5 h-5 rounded-full bg-orange-200 border border-gray-400 -mb-0.5" />
              {/* Jersey Kiper */}
              <div className="w-9 h-10 bg-yellow-400 rounded-t-lg border border-black/20 flex items-center justify-center font-black text-[9px] text-gray-800">
                GK
              </div>
            </div>

            {/* BOLA SAAT DITENDANG */}
            {shotDirection && (
              <div
                className={`absolute w-7 h-7 rounded-full bg-white border-2 border-black flex items-center justify-center text-xs font-black shadow-lg transition-all duration-500 ${
                  gameState === 'ready'
                    ? 'bottom-2 translate-y-0 opacity-0'
                    : shotDirection === 'left'
                    ? 'bottom-16 -translate-x-16 scale-90'
                    : shotDirection === 'right'
                    ? 'bottom-16 translate-x-16 scale-90'
                    : 'bottom-16 translate-x-0 scale-90'
                }`}
              >
                ⚽
              </div>
            )}

            {/* Indikator Banner Hasil */}
            {gameState === 'result' && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-xs animate-scale-up z-20">
                <div
                  className={`px-4 py-1.5 rounded-2xl text-base font-black tracking-wider uppercase shadow-xl ${
                    lastOutcome === 'GOAL'
                      ? 'bg-emerald-500 text-white animate-bounce'
                      : 'bg-red-500 text-white'
                  }`}
                >
                  {lastOutcome === 'GOAL' ? 'GOOOOL! 🎉⚽' : 'TEPISAN INDAH! 🧤'}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* TITIK PENALTI & BOLA SEBELUM DITENDANG */}
        <div className="relative z-10 flex flex-col items-center my-4">
          {gameState === 'ready' && (
            <div className="w-8 h-8 rounded-full bg-white border-2 border-black flex items-center justify-center shadow-2xl animate-pulse text-base">
              ⚽
            </div>
          )}
          <div className="w-3 h-3 rounded-full bg-white/60 mt-1" />
        </div>

        {/* KONTROL PILIHAN ARAH TENDANGAN (Section 28: ← ↑ →) */}
        <div className="relative z-10 grid grid-cols-3 gap-2 max-w-[280px] mx-auto w-full">
          <button
            disabled={gameState === 'kicking'}
            onClick={() => handleShoot('left')}
            className="py-3 px-2 bg-white/95 hover:bg-white text-[#071A33] active:bg-blue-100 disabled:opacity-50 rounded-2xl font-black text-sm flex flex-col items-center justify-center shadow-lg transition-all active:scale-95 border-2 border-white"
          >
            <ArrowLeft className="w-5 h-5 text-[#1261FF] mb-0.5" />
            <span className="text-[11px]">KIRI</span>
          </button>

          <button
            disabled={gameState === 'kicking'}
            onClick={() => handleShoot('center')}
            className="py-3 px-2 bg-white/95 hover:bg-white text-[#071A33] active:bg-blue-100 disabled:opacity-50 rounded-2xl font-black text-sm flex flex-col items-center justify-center shadow-lg transition-all active:scale-95 border-2 border-white"
          >
            <ArrowUp className="w-5 h-5 text-[#1261FF] mb-0.5" />
            <span className="text-[11px]">TENGAH</span>
          </button>

          <button
            disabled={gameState === 'kicking'}
            onClick={() => handleShoot('right')}
            className="py-3 px-2 bg-white/95 hover:bg-white text-[#071A33] active:bg-blue-100 disabled:opacity-50 rounded-2xl font-black text-sm flex flex-col items-center justify-center shadow-lg transition-all active:scale-95 border-2 border-white"
          >
            <ArrowRight className="w-5 h-5 text-[#1261FF] mb-0.5" />
            <span className="text-[11px]">KANAN</span>
          </button>
        </div>
      </div>

      {/* LEADERBOARD KOMUNITAS (Section 28) */}
      <div className="bg-white p-4 rounded-3xl border border-gray-100 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Trophy className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-[#071A33]">Papan Skor Penalti Komunitas</h3>
              <p className="text-[11px] text-gray-500">{activeCommunity.name}</p>
            </div>
          </div>
          <span className="text-xs font-bold text-gray-400">{leaderboard.length} Penendang</span>
        </div>

        <div className="divide-y divide-gray-100">
          {leaderboard.length === 0 ? (
            <div className="py-6 text-center text-xs text-gray-400">
              Belum ada skor. Yuk coba tendangan penalti pertama kamu!
            </div>
          ) : (
            leaderboard.map((item, idx) => {
              const isCurrentUser = item.userId === currentUser.id;

              return (
                <div
                  key={item.id}
                  className={`py-2.5 flex items-center justify-between text-xs transition-colors rounded-xl px-2 ${
                    isCurrentUser ? 'bg-blue-50/70 text-[#1261FF]' : ''
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-5 font-black text-center shrink-0">
                      {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`}
                    </span>
                    <div className="truncate">
                      <div className="font-extrabold text-[#071A33] flex items-center gap-1.5 truncate">
                        <span className="truncate">{item.userName}</span>
                        {isCurrentUser && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-[#1261FF] text-white">
                            Anda
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-gray-400">
                        {item.goals} Gol dari {item.attempts} Tendangan • Streak {item.highestStreak}x
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="font-black text-sm text-[#071A33]">{item.score} Pts</div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
