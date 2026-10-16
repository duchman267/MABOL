import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Match, MatchStatus } from '../types';
import { formatRupiah } from '../services/financialService';
import { isMatchUpcoming, isMatchPast } from '../utils/dateUtils';
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  Plus,
  Send,
  CheckCircle2,
  AlertCircle,
  Clock3,
  XCircle,
  Camera,
} from 'lucide-react';
import { MatchDetailModal } from '../components/MatchDetailModal';
import { CreateMatchModal } from '../components/CreateMatchModal';
import { ProposalModal } from '../components/ProposalModal';

export const MatchesScreen: React.FC = () => {
  const { matches, participants, isAdmin, proposals, reviewProposal } = useApp();

  const [filter, setFilter] = useState<'Semua' | 'Aktif' | 'Selesai' | 'Draft'>('Semua');
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showProposalModal, setShowProposalModal] = useState(false);

  const filteredMatches = matches.filter((m) => {
    if (filter === 'Semua') return true;
    if (filter === 'Aktif') {
      return m.status === 'Aktif' && isMatchUpcoming(m);
    }
    if (filter === 'Selesai') {
      return m.status === 'Selesai' || isMatchPast(m);
    }
    return m.status === filter;
  });

  return (
    <div className="space-y-4 pb-24 animate-fade-in">
      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-black text-[#071A33]">Jadwal Pertandingan</h2>
          <p className="text-xs text-gray-500">Kelola pertandingan & konfirmasi kehadiran</p>
        </div>

        {isAdmin ? (
          <button
            onClick={() => setShowCreateModal(true)}
            className="py-2.5 px-3.5 bg-[#1261FF] hover:bg-blue-700 text-white font-bold text-xs rounded-2xl shadow-md shadow-blue-500/20 flex items-center gap-1.5 active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>BUAT PERTANDINGAN</span>
          </button>
        ) : (
          <button
            onClick={() => setShowProposalModal(true)}
            className="py-2.5 px-3.5 bg-blue-50 hover:bg-blue-100 text-[#1261FF] border border-blue-200 font-bold text-xs rounded-2xl flex items-center gap-1.5 active:scale-95 transition-all"
          >
            <Send className="w-3.5 h-3.5" />
            <span>AJUKAN MAIN</span>
          </button>
        )}
      </div>

      {/* Proposal Alert untuk Admin jika ada yang pending */}
      {isAdmin && proposals.filter((p) => p.status === 'Menunggu Persetujuan').length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3.5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 text-amber-600" />
              Ada Pengajuan Main dari Anggota ({proposals.filter((p) => p.status === 'Menunggu Persetujuan').length})
            </span>
          </div>

          <div className="space-y-2">
            {proposals
              .filter((p) => p.status === 'Menunggu Persetujuan')
              .map((prop) => (
                <div
                  key={prop.id}
                  className="bg-white p-3 rounded-xl border border-amber-100 text-xs flex items-center justify-between"
                >
                  <div>
                    <div className="font-extrabold text-[#071A33]">
                      {prop.requesterName} mengusulkan di {prop.suggestedVenue}
                    </div>
                    <div className="text-[11px] text-gray-500">
                      Tanggal: {prop.requestedDate} jam {prop.requestedTime} ({prop.estimatedPlayers} pemain)
                    </div>
                    {prop.notes && <div className="text-[11px] text-gray-600 italic mt-0.5">"{prop.notes}"</div>}
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0 ml-2">
                    <button
                      onClick={() => reviewProposal(prop.id, 'Ditolak')}
                      className="px-2.5 py-1 bg-gray-100 text-gray-600 font-bold rounded-lg hover:bg-gray-200 text-[11px]"
                    >
                      Tolak
                    </button>
                    <button
                      onClick={() => reviewProposal(prop.id, 'Disetujui')}
                      className="px-2.5 py-1 bg-[#1261FF] text-white font-bold rounded-lg hover:bg-blue-700 text-[11px]"
                    >
                      Setujui
                    </button>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Tabs Filter */}
      <div className="flex bg-gray-100 p-1 rounded-2xl gap-1">
        {(['Semua', 'Aktif', 'Selesai', 'Draft'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
              filter === tab ? 'bg-white text-[#1261FF] shadow-xs' : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Daftar Pertandingan */}
      <div className="space-y-3">
        {filteredMatches.length === 0 ? (
          <div className="bg-white border border-gray-100 rounded-3xl p-8 text-center text-gray-400 text-xs">
            Tidak ada pertandingan dengan status {filter}.
          </div>
        ) : (
          filteredMatches.map((match) => {
            const matchParts = participants.filter((p) => p.matchId === match.id);
            const ikutCount = matchParts.filter((p) => p.rsvpStatus === 'Ikut').length;

            return (
              <div
                key={match.id}
                onClick={() => setSelectedMatch(match)}
                className="bg-white border border-gray-100 p-4 rounded-3xl shadow-xs hover:border-blue-200 cursor-pointer transition-all active:scale-[0.99] space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                          match.status === 'Aktif'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : match.status === 'Selesai'
                            ? 'bg-blue-50 text-[#1261FF] border border-blue-200'
                            : match.status === 'Draft'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-red-50 text-red-700 border border-red-200'
                        }`}
                      >
                        {match.status}
                      </span>
                      {match.photographerAvailable && (
                        <span className="flex items-center gap-0.5 text-[10px] font-bold text-gray-400">
                          <Camera className="w-3 h-3" />
                          Foto
                        </span>
                      )}
                    </div>
                    <h3 className="font-extrabold text-sm text-[#071A33]">{match.title}</h3>
                  </div>

                  <div className="text-right">
                    <span className="text-xs font-black text-[#1261FF]">
                      {formatRupiah(match.standardFee)}
                    </span>
                    <div className="text-[10px] text-gray-400">HTM standar</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 bg-gray-50 p-2.5 rounded-2xl">
                  <div className="flex items-center gap-1.5 truncate">
                    <Calendar className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                    <span className="truncate">
                      {new Date(match.date).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                      })}
                      , {match.kickoffTime} WIB
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 truncate">
                    <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                    <span className="truncate">{match.venue}</span>
                  </div>
                </div>

                {/* Progress Kuota */}
                <div className="flex items-center justify-between text-xs pt-1">
                  <div className="flex items-center gap-1.5 text-gray-500 text-[11px]">
                    <Users className="w-3.5 h-3.5 text-gray-400" />
                    <span>
                      <strong className="text-[#071A33]">{ikutCount}</strong> / {match.playerQuota} peserta
                    </span>
                  </div>

                  <span className="text-xs font-bold text-[#1261FF] hover:underline">
                    Lihat Detail & Kehadiran →
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal Detail Match */}
      {selectedMatch && (
        <MatchDetailModal match={selectedMatch} onClose={() => setSelectedMatch(null)} />
      )}

      {/* Modal Buat Match */}
      {showCreateModal && (
        <CreateMatchModal onClose={() => setShowCreateModal(false)} />
      )}

      {/* Modal Ajukan Main */}
      {showProposalModal && (
        <ProposalModal onClose={() => setShowProposalModal(false)} />
      )}
    </div>
  );
};
