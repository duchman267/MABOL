import React from 'react';
import { useApp } from '../context/AppContext';
import { formatRupiah } from '../services/financialService';
import { Heart, Sparkles, X, Trophy } from 'lucide-react';

export const SupportOfMatchModal: React.FC = () => {
  const { supportModal, closeSupportModal } = useApp();

  if (!supportModal.isOpen || !supportModal.data) return null;

  const { playerName, amount, extraContribution, message } = supportModal.data;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl border-4 border-[#1261FF]/20 text-center transform transition-all animate-scale-up overflow-hidden">
        {/* Decorative background glow */}
        <div className="absolute -top-12 -right-12 w-32 h-32 bg-[#1261FF]/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-amber-400/10 rounded-full blur-2xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={closeSupportModal}
          className="absolute top-4 right-4 p-1.5 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          aria-label="Tutup"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Icon & Title */}
        <div className="mx-auto w-16 h-16 bg-gradient-to-tr from-[#1261FF] to-blue-400 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-500/30 mb-4 animate-bounce">
          <Heart className="w-8 h-8 fill-white" />
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-[#1261FF] text-xs font-bold uppercase tracking-wider mb-3">
          <Sparkles className="w-3.5 h-3.5" />
          <span>SUPPORT OF THE MATCH</span>
        </div>

        <h3 className="text-lg font-black text-[#071A33] leading-snug mb-3">
          MAKASIH {playerName.toUpperCase()}! Udunannya {formatRupiah(amount)} sudah sukses.
        </h3>

        {/* Extra Contribution Highlight */}
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3.5 mb-3 text-emerald-800">
          <div className="text-xl font-black text-emerald-600">
            {formatRupiah(extraContribution)} kontribusi tambahan.
          </div>
        </div>

        {/* Blessing Quote */}
        <div className="bg-blue-50/60 rounded-2xl p-3.5 border border-blue-100 mb-5 italic text-sm font-semibold text-gray-700">
          "{message || 'Sehat terus, sukses terus, rezeki makin lancar! 🤝⚽'}"
        </div>

        {/* Action Button */}
        <button
          onClick={closeSupportModal}
          className="w-full py-3.5 px-4 bg-[#1261FF] hover:bg-blue-700 text-white font-bold rounded-2xl shadow-lg shadow-blue-600/30 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
        >
          <Trophy className="w-4 h-4" />
          <span>RESPEK & LANJUTKAN! ⚽</span>
        </button>
      </div>
    </div>
  );
};
