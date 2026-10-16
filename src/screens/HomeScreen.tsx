import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { formatRupiah, calculateMatchFinances } from '../services/financialService';
import { Match } from '../types';
import { isMatchUpcoming, getMatchDateTime, formatTanggalIndonesia } from '../utils/dateUtils';
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  Wallet,
  Gamepad2,
  Trophy,
  ArrowRight,
  Shield,
  CreditCard,
  Shirt,
  Sparkles,
  Send,
  PlusCircle,
  FileCheck,
  CheckCircle2,
} from 'lucide-react';
import { MatchDetailModal } from '../components/MatchDetailModal';
import { ProposalModal } from '../components/ProposalModal';
import { CreateMatchModal } from '../components/CreateMatchModal';

interface HomeScreenProps {
  onNavigateTab: (tab: 'home' | 'matches' | 'finance' | 'game' | 'community') => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ onNavigateTab }) => {
  const {
    activeCommunity,
    currentUser,
    currentMember,
    isAdmin,
    matches,
    participants,
    payments,
    expenses,
    addOns,
    matchSponsorships,
    communityCashBalance,
    cashTransactions,
    penaltyRecords,
    proposals,
    rsvpMatch,
  } = useApp();

  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [showProposalModal, setShowProposalModal] = useState(false);
  const [showCreateMatchModal, setShowCreateMatchModal] = useState(false);

  // Cari pertandingan berikutnya yang sah:
  // Syarat: match date + kickoff time > current date/time (runtime sebenarnya)
  // dan status bukan Selesai / Dibatalkan
  const upcomingMatches = matches
    .filter((m) => m.communityId === activeCommunity.id && isMatchUpcoming(m))
    .sort((a, b) => {
      const timeA = getMatchDateTime(a.date, a.kickoffTime).getTime();
      const timeB = getMatchDateTime(b.date, b.kickoffTime).getTime();
      return timeA - timeB;
    });

  const nextMatch = upcomingMatches[0] || null;

  // Partisipan di next match
  const nextMatchParticipants = nextMatch
    ? participants.filter((p) => p.matchId === nextMatch.id)
    : [];

  const userRsvp = currentMember && nextMatch
    ? nextMatchParticipants.find((p) => p.memberId === currentMember.id)
    : null;

  const ikutCount = nextMatchParticipants.filter((p) => p.rsvpStatus === 'Ikut').length;

  // Skor penalti user saat ini
  const userPenaltyRecord = penaltyRecords.find(
    (p) => p.userId === currentUser.id && p.communityId === activeCommunity.id
  );

  // Peringkat leaderboard penalti user
  const sortedPenalty = [...penaltyRecords]
    .filter((p) => p.communityId === activeCommunity.id)
    .sort((a, b) => b.score - a.score);

  const userRank = userPenaltyRecord
    ? sortedPenalty.findIndex((p) => p.userId === currentUser.id) + 1
    : null;

  // Pending proposals for admin
  const pendingProposals = proposals.filter((p) => p.status === 'Menunggu Persetujuan');

  // Quick RSVP
  const handleQuickRSVP = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!nextMatch) return;
    const res = rsvpMatch(nextMatch.id, userRsvp?.rsvpStatus === 'Ikut' ? 'Batal' : 'Ikut');
    if (!res.success) alert(res.message);
  };

  return (
    <div className="space-y-4 pb-24 animate-fade-in">
      {/* Admin Quick Dashboard Banner (Jika Admin) */}
      {isAdmin && (
        <div className="bg-[#071A33] text-white p-4 rounded-3xl shadow-lg border border-blue-900/40">
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-[#1261FF]" />
              <span className="text-xs font-bold uppercase tracking-wider text-blue-300">
                Dashboard Pengurus Komunitas
              </span>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-[#1261FF] text-white">
              ADMIN
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center pt-1">
            <div
              onClick={() => onNavigateTab('community')}
              className="bg-white/10 hover:bg-white/15 p-2 rounded-2xl cursor-pointer transition-colors"
            >
              <div className="text-[10px] text-gray-300">Pengajuan Main</div>
              <div className="text-base font-black text-amber-400">
                {pendingProposals.length} Menunggu
              </div>
            </div>

            <div
              onClick={() => onNavigateTab('finance')}
              className="bg-white/10 hover:bg-white/15 p-2 rounded-2xl cursor-pointer transition-colors"
            >
              <div className="text-[10px] text-gray-300">Saldo Kas</div>
              <div className="text-xs font-black text-emerald-400 truncate">
                {formatRupiah(communityCashBalance)}
              </div>
            </div>

            <div
              onClick={() => setShowCreateMatchModal(true)}
              className="bg-[#1261FF]/30 hover:bg-[#1261FF]/40 p-2 rounded-2xl cursor-pointer transition-colors flex flex-col items-center justify-center text-blue-200"
            >
              <PlusCircle className="w-4 h-4 mb-0.5 text-blue-300" />
              <div className="text-[10px] font-bold text-white">Buat Match</div>
            </div>
          </div>
        </div>
      )}

      {/* KARTU UTAMA: PERTANDINGAN BERIKUTNYA (Section 30) */}
      {nextMatch ? (
        <div
          onClick={() => setSelectedMatch(nextMatch)}
          className="relative bg-gradient-to-br from-[#1261FF] to-[#0A47C2] text-white p-5 rounded-3xl shadow-xl shadow-blue-500/20 cursor-pointer overflow-hidden transform active:scale-[0.99] transition-all"
        >
          {/* Subtle background graphic */}
          <div className="absolute -right-8 -bottom-8 w-40 h-40 bg-white/10 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute right-4 top-4 text-white/20 pointer-events-none">
            <Calendar className="w-20 h-20 -rotate-12" />
          </div>

          <div className="relative z-10">
            <div className="flex items-center justify-between mb-3">
              <span className="px-3 py-1 rounded-full text-xs font-extrabold uppercase bg-white/20 backdrop-blur-md text-white tracking-wider">
                PERTANDINGAN BERIKUTNYA
              </span>
              <span className="text-xs font-bold text-blue-100 flex items-center gap-1">
                Detail <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </div>

            <h2 className="text-xl font-black leading-snug mb-2">{nextMatch.title}</h2>

            <div className="space-y-1.5 mb-4 text-xs font-medium text-blue-50">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-200" />
                <span className="font-bold">
                  {new Date(nextMatch.date).toLocaleDateString('id-ID', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </span>
                <span>•</span>
                <Clock className="w-4 h-4 text-blue-200" />
                <span>{nextMatch.kickoffTime} WIB</span>
              </div>

              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-blue-200" />
                <span className="truncate">{nextMatch.venue}</span>
              </div>
            </div>

            {/* HTM & Progress Kuota */}
            <div className="flex items-center justify-between pt-3 border-t border-white/20 mb-4">
              <div>
                <div className="text-[10px] uppercase font-bold text-blue-200">Standar HTM</div>
                <div className="text-lg font-black text-white">
                  {formatRupiah(nextMatch.standardFee)}
                </div>
              </div>

              <div className="text-right">
                <div className="text-[10px] uppercase font-bold text-blue-200">Peserta Terdaftar</div>
                <div className="text-sm font-extrabold text-white">
                  {ikutCount} / {nextMatch.playerQuota} Kuota
                </div>
              </div>
            </div>

            {/* Tombol Utama CTA (SAYA IKUT / BATAL IKUT) */}
            <button
              onClick={handleQuickRSVP}
              className={`w-full py-3.5 px-4 font-black text-sm rounded-2xl shadow-lg transition-all active:scale-[0.98] flex items-center justify-center gap-2 ${
                userRsvp?.rsvpStatus === 'Ikut'
                  ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-600/30'
                  : 'bg-white hover:bg-gray-100 text-[#1261FF] shadow-white/30'
              }`}
            >
              {userRsvp?.rsvpStatus === 'Ikut' ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>ANDA SUDAH IKUT (KLIK UNTUK BATAL)</span>
                </>
              ) : (
                <span>SAYA IKUT ⚽</span>
              )}
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white border border-gray-100 rounded-3xl p-6 text-center text-gray-500">
          <Calendar className="w-10 h-10 mx-auto text-gray-300 mb-2" />
          <div className="font-bold text-gray-700">Belum ada pertandingan berikutnya.</div>
          <p className="text-xs text-gray-400 mt-1">
            Admin akan segera menjadwalkan atau ajukan lapangan sekarang.
          </p>
          <button
            onClick={() => setShowProposalModal(true)}
            className="mt-3 px-4 py-2 bg-[#1261FF] text-white text-xs font-bold rounded-xl"
          >
            AJUKAN MAIN SEKARANG
          </button>
        </div>
      )}

      {/* QUICK ACTIONS ROW */}
      <div className="grid grid-cols-4 gap-2">
        <button
          onClick={() => onNavigateTab('matches')}
          className="bg-white p-3 rounded-2xl border border-gray-100 flex flex-col items-center justify-center hover:bg-gray-50 transition-all shadow-xs"
        >
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#1261FF] flex items-center justify-center mb-1.5 font-bold">
            <Calendar className="w-5 h-5" />
          </div>
          <span className="text-[11px] font-bold text-gray-700">Match</span>
        </button>

        <button
          onClick={() => {
            if (nextMatch) setSelectedMatch(nextMatch);
            else onNavigateTab('matches');
          }}
          className="bg-white p-3 rounded-2xl border border-gray-100 flex flex-col items-center justify-center hover:bg-gray-50 transition-all shadow-xs"
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-1.5 font-bold">
            <CreditCard className="w-5 h-5" />
          </div>
          <span className="text-[11px] font-bold text-gray-700">Bayar</span>
        </button>

        <button
          onClick={() => onNavigateTab('community')}
          className="bg-white p-3 rounded-2xl border border-gray-100 flex flex-col items-center justify-center hover:bg-gray-50 transition-all shadow-xs"
        >
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-1.5 font-bold">
            <Shirt className="w-5 h-5" />
          </div>
          <span className="text-[11px] font-bold text-gray-700">Jersey</span>
        </button>

        <button
          onClick={() => onNavigateTab('game')}
          className="bg-white p-3 rounded-2xl border border-gray-100 flex flex-col items-center justify-center hover:bg-gray-50 transition-all shadow-xs"
        >
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-1.5 font-bold">
            <Gamepad2 className="w-5 h-5" />
          </div>
          <span className="text-[11px] font-bold text-gray-700">Penalti</span>
        </button>
      </div>

      {/* KARTU SALDO KAS KOMUNITAS (Section 22, 23, 30) */}
      <div
        onClick={() => onNavigateTab('finance')}
        className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm cursor-pointer hover:border-blue-200 transition-all"
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-extrabold text-[#071A33]">Buku Kas Komunitas</div>
              <div className="text-[11px] text-gray-400">Transparansi Keuangan Guyub</div>
            </div>
          </div>
          <span className="text-xs font-bold text-[#1261FF] flex items-center gap-1">
            Lihat Ledger <ArrowRight className="w-3.5 h-3.5" />
          </span>
        </div>

        <div className="bg-gradient-to-r from-emerald-500/10 via-blue-500/5 to-transparent p-3.5 rounded-2xl border border-emerald-100/80 mb-3">
          <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">
            Total Saldo Kas Aktif
          </div>
          <div className="text-2xl font-black text-[#071A33] mt-0.5">
            {formatRupiah(communityCashBalance)}
          </div>
        </div>

        {/* Transaksi Terakhir */}
        <div className="space-y-1.5">
          {cashTransactions.slice(0, 2).map((trx) => (
            <div
              key={trx.id}
              className="flex items-center justify-between text-xs py-1.5 border-b border-gray-50 last:border-0"
            >
              <div className="truncate max-w-[200px]">
                <div className="font-semibold text-gray-700 truncate">{trx.description}</div>
                <div className="text-[10px] text-gray-400">
                  {new Date(trx.date).toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'short',
                  })}
                </div>
              </div>
              <span
                className={`font-black text-xs ${
                  trx.type === 'Pemasukan' ? 'text-emerald-600' : 'text-red-500'
                }`}
              >
                {trx.type === 'Pemasukan' ? '+' : '-'}
                {formatRupiah(trx.amount)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* KARTU GAME PENALTI & LEADERBOARD (Section 28, 30) */}
      <div
        onClick={() => onNavigateTab('game')}
        className="bg-gradient-to-br from-[#071A33] to-[#122B4D] text-white p-5 rounded-3xl shadow-lg cursor-pointer hover:shadow-xl transition-all"
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-300 flex items-center justify-center">
              <Gamepad2 className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-purple-200">
                Adu Tendangan Penalti
              </div>
              <div className="text-xs text-gray-300">Mini-game komunitas & leaderboard</div>
            </div>
          </div>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-purple-500/30 text-purple-200 border border-purple-400/30">
            PLAY ⚽
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3 bg-white/10 p-3.5 rounded-2xl mb-3">
          <div>
            <div className="text-[10px] text-gray-300 font-semibold uppercase">Skor Anda</div>
            <div className="text-xl font-black text-amber-300">
              {userPenaltyRecord?.score || 0} Poin
            </div>
          </div>
          <div className="text-right">
            <div className="text-[10px] text-gray-300 font-semibold uppercase">Peringkat Tim</div>
            <div className="text-base font-extrabold text-white flex items-center justify-end gap-1">
              <Trophy className="w-4 h-4 text-amber-400" />
              <span>{userRank ? `#${userRank}` : 'Belum Ada Skor'}</span>
            </div>
          </div>
        </div>

        <button className="w-full py-2.5 bg-gradient-to-r from-[#1261FF] to-blue-500 text-white font-extrabold text-xs rounded-xl shadow-md shadow-blue-600/30">
          MAIN SEKARANG
        </button>
      </div>

      {/* MODAL MATCH DETAIL */}
      {selectedMatch && (
        <MatchDetailModal match={selectedMatch} onClose={() => setSelectedMatch(null)} />
      )}

      {/* MODAL PENGAJUAN MAIN (MEMBER) */}
      {showProposalModal && (
        <ProposalModal onClose={() => setShowProposalModal(false)} />
      )}

      {/* MODAL BUAT PERTANDINGAN (ADMIN) */}
      {showCreateMatchModal && (
        <CreateMatchModal onClose={() => setShowCreateMatchModal(false)} />
      )}
    </div>
  );
};
