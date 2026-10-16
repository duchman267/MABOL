import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { MatchParticipant, Member } from '../types';
import { X, UserCheck, Shield } from 'lucide-react';

interface ConvertGuestModalProps {
  participant: MatchParticipant;
  onClose: () => void;
}

export const ConvertGuestModal: React.FC<ConvertGuestModalProps> = ({ participant, onClose }) => {
  const { convertGuestToMember } = useApp();

  const [name, setName] = useState(participant.guestName || '');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState(participant.guestPhone || '');
  const [position, setPosition] = useState<Member['position']>('Gelandang');
  const [jerseyNumber, setJerseyNumber] = useState<number>(18);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    convertGuestToMember(
      participant.id,
      name.trim(),
      email.trim() || `${name.toLowerCase().replace(/\s+/g, '')}@cornerkick17.com`,
      phone.trim() || '08120000000',
      position,
      jerseyNumber
    );

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-gray-100 animate-scale-up">
        <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <UserCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-[#071A33] text-base">Konversi Tamu ke Anggota</h3>
              <p className="text-xs text-gray-500">Jadikan peserta tamu sebagai anggota resmi komunitas</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-full text-gray-400 hover:bg-gray-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Nama Lengkap / Panggilan</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold focus:outline-hidden focus:border-[#1261FF]"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Posisi Main</label>
              <select
                value={position}
                onChange={(e) => setPosition(e.target.value as Member['position'])}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold"
              >
                <option value="Kiper">Kiper</option>
                <option value="Bek">Bek</option>
                <option value="Gelandang">Gelandang</option>
                <option value="Penyerang">Penyerang</option>
                <option value="All-Rounder">All-Rounder</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Nomor Punggung</label>
              <input
                type="number"
                min="1"
                max="99"
                required
                value={jerseyNumber}
                onChange={(e) => setJerseyNumber(Number(e.target.value))}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-[#071A33]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Email (Opsional)</label>
            <input
              type="email"
              placeholder="user@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-hidden focus:border-[#1261FF]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Nomor Telepon / WhatsApp</label>
            <input
              type="tel"
              placeholder="08xxxxxxxxxx"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-hidden focus:border-[#1261FF]"
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
              className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl shadow-md shadow-purple-600/20"
            >
              KONVERSI KE ANGGOTA
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
