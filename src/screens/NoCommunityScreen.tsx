import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Shield, Users, LogOut, CheckCircle2, Clock, AlertCircle, RefreshCw, Send, ChevronRight } from 'lucide-react';

interface NoCommunityScreenProps {
  onCommunityJoined?: (communityId: string) => void;
}

export const NoCommunityScreen: React.FC<NoCommunityScreenProps> = () => {
  const {
    userProfile,
    logout,
    membershipRequests,
    requestJoinCommunity,
    refreshMembershipRequests,
    refreshAuthSession,
  } = useApp();

  const [position, setPosition] = useState<'Kiper' | 'Bek' | 'Gelandang' | 'Penyerang' | 'All-Rounder'>('Gelandang');
  const [jerseyNumber, setJerseyNumber] = useState<number>(10);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [statusFeedback, setStatusFeedback] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Otomatis refresh status pengajuan saat komponen dimount
  useEffect(() => {
    refreshMembershipRequests();
  }, []);

  // Cek apakah user sudah mengirim pengajuan yang berstatus Menunggu Persetujuan
  const pendingRequest = (membershipRequests || []).find(
    (r) =>
      r.userId === userProfile?.id &&
      (r.status === 'Menunggu Persetujuan' || (r.status as string) === 'pending')
  );

  // Penanganan pengajuan langsung ke komunitas default Cornerkick17 OLAHGAYA
  const handleRequestJoinDefaultCommunity = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setStatusFeedback(null);
    try {
      setLoading(true);
      await requestJoinCommunity('comm-ck17', notes.trim() || 'Pendaftaran anggota baru', position, Number(jerseyNumber) || 10);
      await refreshMembershipRequests();
      setStatusFeedback('Pengajuan keanggotaan berhasil dikirim ke Admin Dicky Maulana.');
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err?.message || 'Gagal mengirimkan pengajuan keanggotaan.');
    } finally {
      setLoading(false);
    }
  };

  // Cek status persetujuan secara real-time dari backend
  const handleCheckStatus = async () => {
    try {
      setCheckingStatus(true);
      setErrorMessage(null);
      setStatusFeedback(null);

      await refreshMembershipRequests();
      const hasActive = await refreshAuthSession();

      if (hasActive) {
        setStatusFeedback('Pendaftaran Anda telah disetujui! Mengalihkan ke dashboard...');
      } else {
        setStatusFeedback('Pengajuan masih dalam peninjauan oleh Admin Dicky Maulana. Silakan periksa kembali secara berkala.');
      }
    } catch (err: any) {
      console.error(err);
      setErrorMessage('Gagal memeriksa status terkini. Pastikan koneksi internet stabil.');
    } finally {
      setCheckingStatus(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F8FC] flex flex-col justify-between p-4 sm:p-6 max-w-md mx-auto select-none">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between pt-2 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-[#071A33] to-[#1261FF] text-white flex items-center justify-center font-black text-sm shadow-md shadow-blue-500/20">
            ⚽
          </div>
          <div>
            <span className="font-black text-base text-[#071A33] tracking-tight block leading-none">MABOL</span>
            <span className="text-[10px] text-gray-500 font-semibold tracking-wide">Cornerkick17 Management</span>
          </div>
        </div>

        <button
          onClick={() => logout()}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-gray-200 text-xs font-bold text-gray-600 hover:text-red-600 hover:border-red-200 transition-colors cursor-pointer shadow-xs"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Keluar</span>
        </button>
      </div>

      {/* Main Container */}
      <div className="my-auto py-4 space-y-4">
        {/* Banner Komunitas Target: Cornerkick17 OLAHGAYA */}
        <div className="bg-gradient-to-r from-[#071A33] to-[#1261FF] p-4 rounded-3xl text-white shadow-xl shadow-blue-900/15 relative overflow-hidden">
          <div className="absolute -right-4 -bottom-6 w-24 h-24 bg-white/10 rounded-full blur-xl pointer-events-none" />
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-white/20 text-white backdrop-blur-xs border border-white/20">
              Komunitas Utama
            </span>
            <span className="text-[11px] font-bold text-blue-200">comm-ck17</span>
          </div>
          <h1 className="text-lg font-black tracking-tight leading-snug">Cornerkick17 OLAHGAYA</h1>
          <p className="text-xs text-blue-100/90 mt-1 line-clamp-2">
            Komunitas Sepak Bola & Mini Soccer Guyub Bandung Selatan
          </p>
        </div>

        {/* Feedback Alert */}
        {statusFeedback && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-2xl text-left flex items-start gap-2.5 text-xs text-blue-900 animate-fade-in">
            <CheckCircle2 className="w-4 h-4 text-[#1261FF] shrink-0 mt-0.5" />
            <span className="font-medium leading-relaxed">{statusFeedback}</span>
          </div>
        )}

        {/* Error Alert */}
        {errorMessage && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-2xl text-left flex items-start gap-2.5 text-xs text-red-700 animate-fade-in">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <span className="font-medium leading-relaxed">{errorMessage}</span>
          </div>
        )}

        {/* Status Card: Menunggu Persetujuan Admin */}
        {pendingRequest ? (
          <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-xl shadow-gray-200/50 space-y-4 text-left">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                  <Clock className="w-4 h-4 animate-pulse" />
                </div>
                <div>
                  <h2 className="text-xs font-black text-amber-900 tracking-tight">STATUS PENDAFTARAN</h2>
                  <p className="text-[11px] text-gray-500 font-medium">Menunggu Persetujuan Admin</p>
                </div>
              </div>
              <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                PENDING
              </span>
            </div>

            <div className="p-3.5 bg-gray-50/80 rounded-2xl border border-gray-100 space-y-2 text-xs">
              <div className="flex items-center justify-between pb-1.5 border-b border-gray-200/60">
                <span className="text-gray-500">Nama Pendaftar:</span>
                <span className="font-bold text-[#071A33]">{userProfile?.name}</span>
              </div>
              <div className="flex items-center justify-between pb-1.5 border-b border-gray-200/60">
                <span className="text-gray-500">Posisi Bermain:</span>
                <span className="font-bold text-[#071A33]">{pendingRequest.position}</span>
              </div>
              <div className="flex items-center justify-between pb-1.5 border-b border-gray-200/60">
                <span className="text-gray-500">No. Punggung Pilihan:</span>
                <span className="font-bold text-[#1261FF]">#{pendingRequest.jerseyNumber}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Admin Peninjau:</span>
                <span className="font-bold text-gray-800 flex items-center gap-1">
                  <Shield className="w-3 h-3 text-[#1261FF]" />
                  Admin Dicky Maulana
                </span>
              </div>
            </div>

            {/* Tahapan Alur Verifikasi */}
            <div className="space-y-1.5 pt-1">
              <div className="text-[11px] font-bold text-gray-600">Alur Keanggotaan:</div>
              <div className="grid grid-cols-3 gap-1.5 text-center text-[10px]">
                <div className="p-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold">
                  ✓ Daftar Akun
                </div>
                <div className="p-2 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 font-bold animate-pulse">
                  ⏳ Review Admin
                </div>
                <div className="p-2 rounded-xl bg-gray-50 border border-gray-200 text-gray-400 font-semibold">
                  🔒 Dashboard
                </div>
              </div>
            </div>

            <p className="text-[11px] text-gray-500 leading-relaxed text-center pt-1">
              Setelah disetujui oleh admin, Anda akan langsung dapat mengakses jadwal pertandingan, presensi mabol, kas, dan seluruh fitur komunitas.
            </p>

            <button
              type="button"
              disabled={checkingStatus}
              onClick={handleCheckStatus}
              className="w-full py-3.5 px-4 bg-[#1261FF] hover:bg-blue-700 active:scale-[0.98] text-white font-extrabold text-xs tracking-wider uppercase rounded-2xl shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${checkingStatus ? 'animate-spin' : ''}`} />
              <span>{checkingStatus ? 'MEMERIKSA DARI SERVER...' : 'PERIKSA STATUS SEKARANG'}</span>
            </button>
          </div>
        ) : (
          /* Form Langsung Ajukan ke Cornerkick17 (Jika Belum Terkirim) */
          <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-xl shadow-gray-200/50 space-y-4 text-left">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#1261FF] flex items-center justify-center shrink-0 font-bold">
                ⚽
              </div>
              <div>
                <h2 className="text-sm font-black text-[#071A33]">Ajukan Keanggotaan Cornerkick17</h2>
                <p className="text-[11px] text-gray-500">Lengkapi data untuk mengajukan bergabung</p>
              </div>
            </div>

            <form onSubmit={handleRequestJoinDefaultCommunity} className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">Posisi Main</label>
                  <select
                    value={position}
                    onChange={(e) => setPosition(e.target.value as any)}
                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:outline-hidden focus:border-[#1261FF]"
                  >
                    <option value="Gelandang">Gelandang</option>
                    <option value="Penyerang">Penyerang</option>
                    <option value="Bek">Bek</option>
                    <option value="Kiper">Kiper</option>
                    <option value="All-Rounder">All-Rounder</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">Nomor Punggung</label>
                  <input
                    type="number"
                    min="1"
                    max="99"
                    value={jerseyNumber}
                    onChange={(e) => setJerseyNumber(Number(e.target.value))}
                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:outline-hidden focus:border-[#1261FF]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-700 mb-1">Catatan Singkat</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Contoh: Domisili Bandung, biasa main gelandang..."
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium resize-none focus:outline-hidden focus:border-[#1261FF]"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-3 px-4 bg-[#1261FF] hover:bg-blue-700 active:scale-[0.98] text-white font-extrabold text-xs tracking-wider uppercase rounded-2xl shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                <span>{loading ? 'MENGIRIMKAN...' : 'KIRIM PENGAJUAN KE ADMIN'}</span>
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Footer Branding */}
      <div className="text-center text-[11px] text-gray-400 pb-2">
        MABOL • Komunitas Resmi Cornerkick17 OLAHGAYA
      </div>
    </div>
  );
};
