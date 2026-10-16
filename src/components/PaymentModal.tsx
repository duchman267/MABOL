import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Match, MatchParticipant, PaymentMethod, PaymentStatus } from '../types';
import { formatRupiah, calculateExtraContribution } from '../services/financialService';
import { X, Sparkles, CreditCard, Banknote, HelpCircle } from 'lucide-react';

interface PaymentModalProps {
  match: Match;
  preselectedParticipantId?: string;
  onClose: () => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  match,
  preselectedParticipantId,
  onClose,
}) => {
  const { participants, members, payments, recordPayment } = useApp();

  const matchParticipants = participants.filter((p) => p.matchId === match.id);

  const [selectedPartId, setSelectedPartId] = useState<string>(
    preselectedParticipantId || matchParticipants[0]?.id || ''
  );

  const currentPayment = payments.find(
    (p) => p.matchId === match.id && p.participantId === selectedPartId
  );

  const [amount, setAmount] = useState<number>(currentPayment?.amount || match.standardFee);
  const [method, setMethod] = useState<PaymentMethod>(currentPayment?.method || 'Transfer');
  const [status, setStatus] = useState<PaymentStatus>(
    currentPayment?.status || 'Sudah Bayar'
  );
  const [notes, setNotes] = useState<string>(currentPayment?.notes || '');

  useEffect(() => {
    if (selectedPartId) {
      const pRecord = payments.find(
        (p) => p.matchId === match.id && p.participantId === selectedPartId
      );
      if (pRecord && pRecord.amount > 0) {
        setAmount(pRecord.amount);
        setMethod(pRecord.method);
        setStatus(pRecord.status);
        setNotes(pRecord.notes || '');
      } else {
        setAmount(match.standardFee);
        setStatus('Sudah Bayar');
      }
    }
  }, [selectedPartId, match.id, match.standardFee, payments]);

  const extra = calculateExtraContribution(amount, match.standardFee);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPartId) return;

    recordPayment(match.id, selectedPartId, amount, method, status, notes);
    onClose();
  };

  const getParticipantLabel = (p: MatchParticipant) => {
    if (p.participantType === 'Guest') {
      return `${p.guestName || 'Tamu'} (Guest)`;
    }
    const mem = members.find((m) => m.id === p.memberId);
    return `${mem?.nickname || 'Anggota'} (#${mem?.jerseyNumber || '-'})`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-gray-100 animate-scale-up">
        <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
          <div>
            <h3 className="font-bold text-[#071A33] text-base">Catat Pembayaran HTM</h3>
            <p className="text-xs text-gray-500">Standar HTM: {formatRupiah(match.standardFee)}</p>
          </div>
          <button onClick={onClose} className="p-1 rounded-full text-gray-400 hover:bg-gray-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* Pilih Peserta */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Pilih Peserta</label>
            <select
              value={selectedPartId}
              onChange={(e) => setSelectedPartId(e.target.value)}
              className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold text-gray-800 focus:outline-hidden focus:border-[#1261FF]"
              required
            >
              {matchParticipants.map((p) => (
                <option key={p.id} value={p.id}>
                  {getParticipantLabel(p)} — RSVP: {p.rsvpStatus}
                </option>
              ))}
            </select>
          </div>

          {/* Nominal Bayar */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-gray-700">Nominal Pembayaran</label>
              <span className="text-[11px] text-gray-400">Bisa lebih dari HTM</span>
            </div>
            <div className="relative">
              <span className="absolute left-3.5 top-2.5 text-sm font-bold text-gray-400">Rp</span>
              <input
                type="number"
                min="0"
                step="5000"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-full pl-10 pr-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-base font-extrabold text-[#071A33] focus:outline-hidden focus:border-[#1261FF]"
                required
              />
            </div>

            {/* Tombol Cepat Nominal */}
            <div className="flex gap-1.5 mt-1.5">
              {[match.standardFee, 50000, 100000].map((preset) => (
                <button
                  type="button"
                  key={preset}
                  onClick={() => setAmount(preset)}
                  className={`text-[11px] py-1 px-2 rounded-lg font-bold border transition-all ${
                    amount === preset
                      ? 'bg-blue-50 border-[#1261FF] text-[#1261FF]'
                      : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {formatRupiah(preset)}
                </button>
              ))}
            </div>
          </div>

          {/* Banner Support of the Match jika amount > standardFee */}
          {extra > 0 && (
            <div className="p-3 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl flex items-start gap-2.5 animate-fade-in">
              <Sparkles className="w-5 h-5 text-[#1261FF] shrink-0 mt-0.5" />
              <div>
                <div className="text-xs font-bold text-[#1261FF]">
                  SUPPORT OF THE MATCH! 💙
                </div>
                <div className="text-xs text-gray-600 mt-0.5">
                  Terdeteksi kontribusi tambahan{' '}
                  <span className="font-extrabold text-emerald-600">+{formatRupiah(extra)}</span>.
                  Apresiasi akan otomatis dimunculkan!
                </div>
              </div>
            </div>
          )}

          {/* Metode Pembayaran */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Metode Pembayaran</label>
            <div className="grid grid-cols-3 gap-1.5">
              {[
                { id: 'Transfer' as PaymentMethod, label: 'Transfer', icon: CreditCard },
                { id: 'Tunai' as PaymentMethod, label: 'Tunai', icon: Banknote },
                { id: 'Lainnya' as PaymentMethod, label: 'Lainnya', icon: HelpCircle },
              ].map((m) => {
                const Icon = m.icon;
                const isSelected = method === m.id;
                return (
                  <button
                    type="button"
                    key={m.id}
                    onClick={() => setMethod(m.id)}
                    className={`py-2 px-2 rounded-xl text-xs font-bold border flex flex-col items-center gap-1 transition-all ${
                      isSelected
                        ? 'border-[#1261FF] bg-blue-50 text-[#1261FF]'
                        : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{m.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Status Pembayaran */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Status Pembayaran</label>
            <div className="grid grid-cols-3 gap-1.5">
              {(['Sudah Bayar', 'Bayar Sebagian', 'Belum Bayar'] as PaymentStatus[]).map((st) => {
                const isSelected = status === st;
                return (
                  <button
                    type="button"
                    key={st}
                    onClick={() => setStatus(st)}
                    className={`py-2 px-1 text-[11px] font-bold rounded-xl border text-center transition-all ${
                      isSelected
                        ? st === 'Sudah Bayar'
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                          : st === 'Bayar Sebagian'
                          ? 'border-amber-500 bg-amber-50 text-amber-700'
                          : 'border-red-500 bg-red-50 text-red-700'
                        : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    {st}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Catatan */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Catatan Tambahan (Opsional)</label>
            <input
              type="text"
              placeholder="Contoh: Bukti transfer BCA a/n Budi"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-hidden focus:border-[#1261FF]"
            />
          </div>

          {/* Tombol Simpan */}
          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-3 bg-[#1261FF] hover:bg-blue-700 text-white font-bold rounded-2xl shadow-lg shadow-blue-500/20 active:scale-[0.98] transition-all"
            >
              SIMPAN PEMBAYARAN
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
