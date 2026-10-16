import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { X, Send, Calendar, MapPin, Users } from 'lucide-react';

interface ProposalModalProps {
  onClose: () => void;
}

export const ProposalModal: React.FC<ProposalModalProps> = ({ onClose }) => {
  const { currentUser, currentMember, submitProposal } = useApp();

  const [requestedDate, setRequestedDate] = useState('');
  const [requestedTime, setRequestedTime] = useState('19:00');
  const [suggestedVenue, setSuggestedVenue] = useState('');
  const [estimatedPlayers, setEstimatedPlayers] = useState(20);
  const [notes, setNotes] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!requestedDate || !suggestedVenue.trim()) return;

    submitProposal({
      requestedBy: currentUser.id,
      requesterName: currentMember?.nickname || currentUser.name,
      requestedDate,
      requestedTime,
      suggestedVenue: suggestedVenue.trim(),
      estimatedPlayers,
      notes: notes.trim() || undefined,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-gray-100 animate-scale-up">
        <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#1261FF] flex items-center justify-center">
              <Send className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-[#071A33] text-base">Ajukan Main Bareng</h3>
              <p className="text-xs text-gray-500">Usulkan jadwal dan lapangan kepada admin</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-full text-gray-400 hover:bg-gray-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Usulan Lapangan / Venue</label>
            <div className="relative">
              <MapPin className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
              <input
                type="text"
                required
                placeholder="Contoh: Inspire Arena / Progresif"
                value={suggestedVenue}
                onChange={(e) => setSuggestedVenue(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold focus:outline-hidden focus:border-[#1261FF]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Usulan Tanggal</label>
              <input
                type="date"
                required
                value={requestedDate}
                onChange={(e) => setRequestedDate(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-800"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Jam Main</label>
              <input
                type="time"
                required
                value={requestedTime}
                onChange={(e) => setRequestedTime(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-800"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Perkiraan Jumlah Pemain</label>
            <div className="relative">
              <Users className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
              <input
                type="number"
                min="10"
                max="50"
                required
                value={estimatedPlayers}
                onChange={(e) => setEstimatedPlayers(Number(e.target.value))}
                className="w-full pl-9 pr-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-800"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Catatan / Alasan</label>
            <textarea
              rows={2}
              placeholder="Contoh: Banyak member yang kosong malam Sabtu ini..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-hidden focus:border-[#1261FF]"
            />
          </div>

          <div className="pt-2 flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 text-xs font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl"
            >
              BATAL
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 bg-[#1261FF] hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-500/20"
            >
              AJUKAN MAIN
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
