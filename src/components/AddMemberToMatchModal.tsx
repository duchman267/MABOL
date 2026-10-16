import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Match, AttendanceStatus, RsvpStatus } from '../types';
import { X, UserPlus, AlertCircle, CheckCircle2 } from 'lucide-react';

interface AddMemberToMatchModalProps {
  match: Match;
  existingParticipantMemberIds: string[];
  onClose: () => void;
}

export const AddMemberToMatchModal: React.FC<AddMemberToMatchModalProps> = ({
  match,
  existingParticipantMemberIds,
  onClose,
}) => {
  const { members, addMemberToMatch } = useApp();

  const availableMembers = members.filter(
    (m) => m.communityId === match.communityId && m.status === 'Aktif'
  );

  const [selectedMemberId, setSelectedMemberId] = useState<string>(
    availableMembers.find((m) => !existingParticipantMemberIds.includes(m.id))?.id ||
      availableMembers[0]?.id ||
      ''
  );
  const [rsvpStatus, setRsvpStatus] = useState<RsvpStatus>('Ikut');
  const [attendanceStatus, setAttendanceStatus] = useState<AttendanceStatus>('Hadir');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMemberId) {
      setErrorMsg('Pilih anggota terlebih dahulu.');
      return;
    }

    addMemberToMatch(match.id, selectedMemberId, rsvpStatus, attendanceStatus);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-3xl p-5 max-w-sm w-full shadow-2xl border border-gray-100 animate-scale-up">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#1261FF] flex items-center justify-center">
              <UserPlus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-[#071A33] text-base">Tambah Anggota ke Match</h3>
              <p className="text-xs text-gray-500">Anggota resmi (Manual atau Akun MABOL)</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-full text-gray-400 hover:bg-gray-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-semibold mb-3 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* Pilih Anggota */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Pilih Anggota Komunitas</label>
            <select
              value={selectedMemberId}
              onChange={(e) => setSelectedMemberId(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-800 focus:outline-hidden focus:border-[#1261FF]"
            >
              {availableMembers.map((mem) => {
                const isAlreadyJoined = existingParticipantMemberIds.includes(mem.id);
                const isManual = mem.memberType === 'MANUAL';
                return (
                  <option key={mem.id} value={mem.id}>
                    {mem.nickname} {mem.jerseyNumber ? `(#${mem.jerseyNumber})` : ''} [
                    {isManual ? 'MANUAL' : 'AKUN MABOL'}] {isAlreadyJoined ? '— (Sudah di match)' : ''}
                  </option>
                );
              })}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Status RSVP</label>
              <select
                value={rsvpStatus}
                onChange={(e) => setRsvpStatus(e.target.value as RsvpStatus)}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-800"
              >
                <option value="Ikut">Ikut</option>
                <option value="Menunggu">Menunggu</option>
                <option value="Batal">Batal</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Presensi Kehadiran</label>
              <select
                value={attendanceStatus}
                onChange={(e) => setAttendanceStatus(e.target.value as AttendanceStatus)}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-800"
              >
                <option value="Hadir">Hadir</option>
                <option value="Belum Dicek">Belum Dicek</option>
                <option value="Tidak Hadir">Tidak Hadir</option>
              </select>
            </div>
          </div>

          <div className="p-3 bg-blue-50/60 border border-blue-100 rounded-xl text-[11px] text-blue-900 leading-relaxed">
            Peserta yang ditambahkan akan dicatat sebagai <strong>Anggota Resmi</strong> (bukan Guest) dan terhubung dengan laporan statistik kehadiran komunitas.
          </div>

          <div className="flex gap-2 pt-2 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs cursor-pointer"
            >
              BATAL
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 rounded-xl bg-[#1261FF] hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 cursor-pointer"
            >
              TAMBAHKAN
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
