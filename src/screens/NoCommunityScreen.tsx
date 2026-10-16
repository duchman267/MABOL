import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Shield, PlusCircle, Users, LogOut, CheckCircle2, ArrowRight, Clock, AlertCircle } from 'lucide-react';

interface NoCommunityScreenProps {
  onCommunityJoined?: (communityId: string) => void;
}

export const NoCommunityScreen: React.FC<NoCommunityScreenProps> = () => {
  const {
    userProfile,
    communities,
    createCommunity,
    logout,
    membershipRequests,
    requestJoinCommunity,
    refreshMembershipRequests,
  } = useApp();

  const [activeModal, setActiveModal] = useState<'none' | 'join' | 'create'>('none');
  const [selectedCommId, setSelectedCommId] = useState(
    communities.find((c) => c.id === 'comm-ck17')?.id || communities[0]?.id || 'comm-ck17'
  );
  const [position, setPosition] = useState<'Kiper' | 'Bek' | 'Gelandang' | 'Penyerang' | 'All-Rounder'>('Gelandang');
  const [jerseyNumber, setJerseyNumber] = useState<number>(10);
  const [notes, setNotes] = useState('');
  const [newCommName, setNewCommName] = useState('');
  const [newCommDesc, setNewCommDesc] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Cek apakah user sudah mengirim pengajuan yang berstatus Menunggu Persetujuan
  const pendingRequest = (membershipRequests || []).find(
    (r) =>
      r.userId === userProfile?.id &&
      (r.status === 'Menunggu Persetujuan' || (r.status as string) === 'pending')
  );

  const handleRequestJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCommId) return;
    setErrorMessage(null);
    try {
      setLoading(true);
      await requestJoinCommunity(selectedCommId, notes, position, jerseyNumber);
      setActiveModal('none');
      setSuccessBanner('Pengajuan bergabung berhasil dikirim! Menunggu persetujuan admin komunitas.');
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err?.message || 'Gagal mengirim pengajuan.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommName.trim()) return;
    setErrorMessage(null);
    try {
      setLoading(true);
      await createCommunity({
        name: newCommName.trim(),
        description: newCommDesc.trim() || 'Komunitas sepak bola',
        primaryColor: '#1261FF',
      });
      setActiveModal('none');
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err?.message || 'Gagal membuat komunitas.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-between p-6 max-w-md mx-auto animate-fade-in select-none">
      {/* Top Header */}
      <div className="flex items-center justify-between pt-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-[#1261FF] text-white flex items-center justify-center font-black text-xs shadow-md shadow-blue-500/20">
            M
          </div>
          <span className="font-black text-base text-[#071A33]">MABOL</span>
        </div>

        <button
          onClick={() => logout()}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-gray-200 text-xs font-bold text-gray-600 hover:text-red-600 hover:border-red-200 transition-colors cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Keluar</span>
        </button>
      </div>

      {/* Main Card */}
      <div className="my-auto py-6 text-center space-y-5 bg-white p-6 rounded-3xl border border-gray-100 shadow-xl shadow-gray-200/50">
        <div className="w-16 h-16 rounded-2xl bg-blue-50 text-[#1261FF] flex items-center justify-center mx-auto text-2xl font-black shadow-inner">
          👋
        </div>

        <div className="space-y-1.5">
          <h2 className="text-xl font-black text-[#071A33]">Selamat datang di MABOL</h2>
          <p className="text-sm font-semibold text-gray-700">
            {userProfile?.name || userProfile?.displayName || 'Sahabat Bola'}
          </p>
          <p className="text-xs text-gray-500 max-w-xs mx-auto">
            Anda belum tergabung dalam komunitas sepak bola manapun.
          </p>
        </div>

        {/* Notifikasi Pengajuan Berhasil Terkirim */}
        {successBanner && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-left flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span className="text-xs text-emerald-800 font-medium leading-relaxed">{successBanner}</span>
          </div>
        )}

        {/* Notifikasi Error */}
        {errorMessage && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-2xl text-left flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <span className="text-xs text-red-700 font-medium leading-relaxed">{errorMessage}</span>
          </div>
        )}

        {/* Banner Status Pengajuan Menunggu Persetujuan */}
        {pendingRequest ? (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-left space-y-3">
            <div className="flex items-center gap-2 text-amber-800 font-extrabold text-xs">
              <Clock className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Pengajuan Keanggotaan Sedang Ditinjau</span>
            </div>
            <p className="text-xs text-amber-700 leading-relaxed">
              Pengajuan Anda untuk bergabung ke <strong>Cornerkick17 OLAHGAYA</strong> telah terkirim dan sedang menunggu persetujuan dari <strong>Admin Dicky Maulana</strong>.
            </p>
            <div className="flex items-center justify-between pt-1">
              <div className="text-[11px] text-amber-600 font-medium">
                Status: <span className="font-bold underline">Menunggu Persetujuan Admin</span>
              </div>
              <button
                type="button"
                disabled={checkingStatus}
                onClick={async () => {
                  try {
                    setCheckingStatus(true);
                    await refreshMembershipRequests();
                    window.location.reload();
                  } catch (e) {
                    console.error(e);
                  } finally {
                    setCheckingStatus(false);
                  }
                }}
                className="px-3 py-1.5 bg-amber-200/70 hover:bg-amber-300 text-amber-900 font-bold text-[10px] rounded-xl transition-all cursor-pointer flex items-center gap-1 disabled:opacity-50"
              >
                {checkingStatus ? 'Memeriksa...' : 'Cek Status Sekarang'}
              </button>
            </div>
          </div>
        ) : (
          /* Action Buttons Jika Belum Mengajukan */
          <div className="space-y-2.5 pt-2">
            <button
              onClick={() => setActiveModal('join')}
              className="w-full py-3.5 px-4 bg-[#1261FF] hover:bg-blue-700 text-white font-extrabold text-xs rounded-2xl shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-[0.98]"
            >
              <Users className="w-4 h-4" />
              <span>GABUNG KOMUNITAS</span>
            </button>

            <button
              onClick={() => setActiveModal('create')}
              className="w-full py-3 px-4 bg-gray-50 hover:bg-gray-100 text-gray-700 font-extrabold text-xs rounded-2xl border border-gray-200 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <PlusCircle className="w-4 h-4 text-gray-500" />
              <span>BUAT KOMUNITAS BARU</span>
            </button>
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="text-center text-[11px] text-gray-400 pb-2">
        MABOL • Multi-Community Football Management
      </div>

      {/* Modal Gabung Komunitas (Kirim Pengajuan ke Admin) */}
      {activeModal === 'join' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <form
            onSubmit={handleRequestJoin}
            className="bg-white rounded-3xl p-5 max-w-sm w-full shadow-2xl border border-gray-100 animate-scale-up space-y-4"
          >
            <div>
              <h3 className="text-base font-black text-[#071A33]">Gabung Komunitas</h3>
              <p className="text-xs text-gray-500">Ajukan keanggotaan ke admin komunitas</p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Pilih Komunitas</label>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {communities.map((comm) => (
                    <div
                      key={comm.id}
                      onClick={() => setSelectedCommId(comm.id)}
                      className={`p-3 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                        selectedCommId === comm.id
                          ? 'border-[#1261FF] bg-blue-50/60 ring-2 ring-[#1261FF]/20'
                          : 'border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <div>
                        <div className="font-extrabold text-xs text-[#071A33]">{comm.name}</div>
                        <div className="text-[11px] text-gray-500 truncate max-w-[200px]">
                          {comm.description}
                        </div>
                      </div>
                      {selectedCommId === comm.id && (
                        <CheckCircle2 className="w-4 h-4 text-[#1261FF]" />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Posisi Main</label>
                  <select
                    value={position}
                    onChange={(e) => setPosition(e.target.value as any)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium"
                  >
                    <option value="Penyerang">Penyerang</option>
                    <option value="Gelandang">Gelandang</option>
                    <option value="Bek">Bek</option>
                    <option value="Kiper">Kiper</option>
                    <option value="All-Rounder">All-Rounder</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">No. Punggung</label>
                  <input
                    type="number"
                    min="1"
                    max="99"
                    value={jerseyNumber}
                    onChange={(e) => setJerseyNumber(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Catatan / Perkenalan</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Contoh: Domisili Baleendah, teman main..."
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium resize-none"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setActiveModal('none')}
                className="flex-1 py-2.5 text-xs font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={loading || !selectedCommId}
                className="flex-1 py-2.5 text-xs font-black text-white bg-[#1261FF] hover:bg-blue-700 disabled:opacity-50 rounded-xl shadow-md shadow-blue-500/20 cursor-pointer"
              >
                {loading ? 'Mengirim...' : 'Kirim Pengajuan'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal Buat Komunitas */}
      {activeModal === 'create' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <form
            onSubmit={handleCreate}
            className="bg-white rounded-3xl p-5 max-w-sm w-full shadow-2xl border border-gray-100 animate-scale-up space-y-4"
          >
            <div>
              <h3 className="text-base font-black text-[#071A33]">Buat Komunitas Baru</h3>
              <p className="text-xs text-gray-500">Anda akan otomatis menjadi ADMIN komunitas ini</p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Nama Komunitas</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: FC Guyub Soreang"
                  value={newCommName}
                  onChange={(e) => setNewCommName(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Deskripsi Singkat</label>
                <textarea
                  rows={2}
                  placeholder="Komunitas sepak bola akhir pekan..."
                  value={newCommDesc}
                  onChange={(e) => setNewCommDesc(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium resize-none"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setActiveModal('none')}
                className="flex-1 py-2.5 text-xs font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={loading || !newCommName.trim()}
                className="flex-1 py-2.5 text-xs font-black text-white bg-[#1261FF] hover:bg-blue-700 disabled:opacity-50 rounded-xl shadow-md shadow-blue-500/20 cursor-pointer"
              >
                {loading ? 'Memproses...' : 'Buat Komunitas'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
