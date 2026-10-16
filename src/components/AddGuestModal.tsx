import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Match, AttendanceStatus, RsvpStatus, PaymentMethod, PaymentStatus } from '../types';
import { formatRupiah } from '../services/financialService';
import { X, UserPlus, CreditCard, Banknote } from 'lucide-react';

interface AddGuestModalProps {
  match: Match;
  onClose: () => void;
}

export const AddGuestModal: React.FC<AddGuestModalProps> = ({ match, onClose }) => {
  const { addGuestParticipant } = useApp();

  const [guestName, setGuestName] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [rsvpStatus, setRsvpStatus] = useState<RsvpStatus>('Ikut');
  const [attendanceStatus, setAttendanceStatus] = useState<AttendanceStatus>('Hadir');
  const [payAmount, setPayAmount] = useState<number>(match.standardFee);
  const [payMethod, setPayMethod] = useState<PaymentMethod>('Tunai');
  const [payStatus, setPayStatus] = useState<PaymentStatus>('Sudah Bayar');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestName.trim()) return;

    addGuestParticipant(
      match.id,
      guestName.trim(),
      guestPhone.trim() || undefined,
      rsvpStatus,
      attendanceStatus,
      {
        amount: payAmount,
        method: payMethod,
        status: payStatus,
      }
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-gray-100 animate-scale-up">
        <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#1261FF] flex items-center justify-center">
              <UserPlus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-[#071A33] text-base">Tambah Peserta Tamu (Guest)</h3>
              <p className="text-xs text-gray-500">Tamu tidak perlu memiliki akun MABOL</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-full text-gray-400 hover:bg-gray-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Nama Tamu / Panggilan</label>
            <input
              type="text"
              required
              placeholder="Contoh: Mang Perang / Bapa Abad"
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold focus:outline-hidden focus:border-[#1261FF]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Nomor WhatsApp / HP (Opsional)</label>
            <input
              type="tel"
              placeholder="08xxxxxxxxxx"
              value={guestPhone}
              onChange={(e) => setGuestPhone(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-hidden focus:border-[#1261FF]"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Status RSVP</label>
              <select
                value={rsvpStatus}
                onChange={(e) => setRsvpStatus(e.target.value as RsvpStatus)}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold"
              >
                <option value="Ikut">Ikut</option>
                <option value="Menunggu">Menunggu</option>
                <option value="Batal">Batal</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Kehadiran Aktual</label>
              <select
                value={attendanceStatus}
                onChange={(e) => setAttendanceStatus(e.target.value as AttendanceStatus)}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold"
              >
                <option value="Hadir">Hadir</option>
                <option value="Belum Dicek">Belum Dicek</option>
                <option value="Tidak Hadir">Tidak Hadir</option>
              </select>
            </div>
          </div>

          {/* Bagian Pembayaran Guest */}
          <div className="pt-2 border-t border-gray-100 space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[#071A33]">Pembayaran HTM Guest</label>
              <span className="text-[10px] text-gray-400">Standar: {formatRupiah(match.standardFee)}</span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="col-span-1">
                <label className="block text-[10px] font-bold text-gray-500 mb-1">Nominal</label>
                <input
                  type="number"
                  min="0"
                  step="5000"
                  value={payAmount}
                  onChange={(e) => setPayAmount(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-[#071A33]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-500 mb-1">Metode</label>
                <select
                  value={payMethod}
                  onChange={(e) => setPayMethod(e.target.value as PaymentMethod)}
                  className="w-full px-2 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold"
                >
                  <option value="Tunai">Tunai</option>
                  <option value="Transfer">Transfer</option>
                  <option value="Lainnya">Lainnya</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-500 mb-1">Status</label>
                <select
                  value={payStatus}
                  onChange={(e) => setPayStatus(e.target.value as PaymentStatus)}
                  className="w-full px-1.5 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-[11px] font-bold"
                >
                  <option value="Sudah Bayar">Sudah Bayar</option>
                  <option value="Belum Bayar">Belum Bayar</option>
                  <option value="Bayar Sebagian">Bayar Sebagian</option>
                </select>
              </div>
            </div>
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
              TAMBAH GUEST
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
