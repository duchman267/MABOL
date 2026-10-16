import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Member } from '../types';
import { formatRupiah } from '../services/financialService';
import { isMatchPast } from '../utils/dateUtils';
import {
  Users,
  Shirt,
  CalendarCheck,
  Send,
  Plus,
  CheckCircle2,
  XCircle,
  Clock,
  Shield,
  Phone,
  Mail,
  X,
  CreditCard,
  UserPlus,
  Edit2,
  Trash2,
  Power,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
import { ProposalModal } from '../components/ProposalModal';
import { ManualMemberModal } from '../components/ManualMemberModal';

export const CommunityScreen: React.FC = () => {
  const {
    activeCommunity,
    currentUser,
    currentMember,
    isAdmin,
    members,
    matches,
    participants,
    jerseyPrograms,
    jerseyOrders,
    createJerseyOrder,
    updateJerseyOrderStatus,
    proposals,
    reviewProposal,
    membershipRequests,
    reviewMembershipRequest,
    updateManualMember,
    deleteManualMember,
    pendingMembershipCount,
    refreshMembershipRequests,
    refreshMembers,
    isMembersLoading,
    membersSource,
    membersError,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'attendance' | 'jersey' | 'members' | 'proposals'>('attendance');
  const [proposalSubTab, setProposalSubTab] = useState<'membership' | 'matches'>('membership');
  const [attendancePeriod, setAttendancePeriod] = useState<'all' | 'month' | 'year'>('all');
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [showProposalModal, setShowProposalModal] = useState(false);
  const [showAddManualModal, setShowAddManualModal] = useState(false);
  const [memberToEdit, setMemberToEdit] = useState<Member | null>(null);
  const [reviewLoadingId, setReviewLoadingId] = useState<string | null>(null);
  const [reviewError, setReviewError] = useState<{ id: string; message: string } | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [memberFilter, setMemberFilter] = useState<'all' | 'active' | 'inactive'>('active');

  useEffect(() => {
    refreshMembers();
  }, []);

  const handleReviewMembership = async (id: string, status: 'Disetujui' | 'Ditolak') => {
    try {
      setReviewLoadingId(id);
      setReviewError(null);
      await reviewMembershipRequest(id, status);
    } catch (err: any) {
      setReviewError({
        id,
        message:
          err?.message ||
          'Gagal menghubungi server. Persetujuan anggota membutuhkan koneksi internet aktif.',
      });
    } finally {
      setReviewLoadingId(null);
    }
  };

  // Form Order Jersey
  const activeProgram = jerseyPrograms[0];
  const [orderSize, setOrderSize] = useState<'S' | 'M' | 'L' | 'XL' | '2XL' | '3XL'>('L');
  const [orderQty, setOrderQty] = useState(1);
  const [orderPlayerName, setOrderPlayerName] = useState(
    currentMember ? currentMember.nickname.toUpperCase() : ''
  );
  const [orderJerseyNumber, setOrderJerseyNumber] = useState(
    currentMember ? currentMember.jerseyNumber : 10
  );
  const [orderNotes, setOrderNotes] = useState('Home Biru');

  // HITUNG STATISTIK KEHADIRAN ANGGOTA (Section 27)
  // Menghitung kehadiran murni dari MATCH_PARTICIPANTS pada pertandingan yang sudah berlangsung
  const attendanceStats = members.map((mem) => {
    // Cari semua partisipasi member ini
    const memberParts = participants.filter((p) => p.memberId === mem.id);

    // Filter berdasarkan period dan hanya pertandingan yang sudah lewat/selesai
    const relevantParts = memberParts.filter((p) => {
      const match = matches.find((m) => m.id === p.matchId);
      if (!match) return false;
      if (!isMatchPast(match)) return false;

      if (attendancePeriod === 'month') {
        const mDate = new Date(match.date);
        const now = new Date();
        return mDate.getMonth() === now.getMonth() && mDate.getFullYear() === now.getFullYear();
      }
      if (attendancePeriod === 'year') {
        const mDate = new Date(match.date);
        const now = new Date();
        return mDate.getFullYear() === now.getFullYear();
      }
      return true;
    });

    const hadirCount = relevantParts.filter((p) => p.attendanceStatus === 'Hadir').length;
    const tidakHadirCount = relevantParts.filter(
      (p) => p.attendanceStatus === 'Tidak Hadir'
    ).length;
    const totalMatches = hadirCount + tidakHadirCount;
    const percentage = totalMatches > 0 ? Math.round((hadirCount / totalMatches) * 100) : 0;

    return {
      member: mem,
      totalMatches,
      hadirCount,
      tidakHadirCount,
      percentage,
    };
  });

  const handleOrderJersey = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProgram || !orderPlayerName.trim()) return;

    const totalAmount = activeProgram.basePrice * orderQty;
    createJerseyOrder({
      programId: activeProgram.id,
      memberId: currentMember ? currentMember.id : `mem-guest-${Date.now()}`,
      memberName: currentMember ? currentMember.nickname : currentUser.name,
      size: orderSize,
      quantity: orderQty,
      playerName: orderPlayerName.trim().toUpperCase(),
      jerseyNumber: orderJerseyNumber,
      totalAmount,
      paidAmount: 0,
      paymentStatus: 'Belum Bayar',
      notes: orderNotes.trim() || undefined,
    });

    setShowOrderModal(false);
  };

  return (
    <div className="space-y-4 pb-24 animate-fade-in">
      {/* Profil Banner Komunitas */}
      <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#1261FF] to-[#071A33] text-white flex items-center justify-center font-black text-xl shadow-md shadow-blue-500/20 shrink-0">
            CK17
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black text-[#071A33]">{activeCommunity.name}</h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-50 text-[#1261FF]">
                {activeCommunity.status}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
              {activeCommunity.description}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs Komunitas */}
      <div className="flex bg-gray-100 p-1 rounded-2xl gap-1 text-xs">
        <button
          onClick={() => setActiveTab('attendance')}
          className={`flex-1 py-2 font-bold rounded-xl transition-all ${
            activeTab === 'attendance' ? 'bg-white text-[#1261FF] shadow-xs' : 'text-gray-500'
          }`}
        >
          Kehadiran
        </button>
        <button
          onClick={() => setActiveTab('jersey')}
          className={`flex-1 py-2 font-bold rounded-xl transition-all ${
            activeTab === 'jersey' ? 'bg-white text-[#1261FF] shadow-xs' : 'text-gray-500'
          }`}
        >
          Jersey Tim
        </button>
        <button
          onClick={() => setActiveTab('members')}
          className={`flex-1 py-2 font-bold rounded-xl transition-all ${
            activeTab === 'members' ? 'bg-white text-[#1261FF] shadow-xs' : 'text-gray-500'
          }`}
        >
          Anggota ({members.filter((m) => m.status === 'Aktif').length})
        </button>
        <button
          onClick={() => setActiveTab('proposals')}
          className={`flex-1 py-2 font-bold rounded-xl transition-all flex items-center justify-center gap-1 ${
            activeTab === 'proposals' ? 'bg-white text-[#1261FF] shadow-xs' : 'text-gray-500'
          }`}
        >
          <span>Pengajuan</span>
          {pendingMembershipCount > 0 ? (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-red-500 text-white animate-pulse">
              {pendingMembershipCount}
            </span>
          ) : (
            <span className="text-[11px] opacity-80">
              ({(proposals.length + (membershipRequests || []).length)})
            </span>
          )}
        </button>
      </div>

      {/* TAB 1: LAPORAN KEHADIRAN (Section 27) */}
      {activeTab === 'attendance' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-sm text-[#071A33]">Statistik Kehadiran Anggota</h3>
              <p className="text-[11px] text-gray-400">Statistik guyub keaktifan bermain bola</p>
            </div>

            {matches.length > 0 && (
              /* Filter Periode */
              <div className="flex gap-1 bg-gray-100 p-0.5 rounded-xl text-[11px]">
                {(['all', 'month', 'year'] as const).map((period) => (
                  <button
                    key={period}
                    onClick={() => setAttendancePeriod(period)}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                      attendancePeriod === period ? 'bg-white text-[#1261FF] shadow-xs' : 'text-gray-500'
                    }`}
                  >
                    {period === 'all' ? 'Semua' : period === 'month' ? 'Bulan Ini' : 'Tahun Ini'}
                  </button>
                ))}
              </div>
            )}
          </div>

          {matches.length === 0 ? (
            <div className="bg-white p-8 rounded-3xl border border-gray-100 text-center space-y-3 shadow-xs">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#1261FF] flex items-center justify-center mx-auto text-xl">
                📊
              </div>
              <div className="space-y-1">
                <h4 className="font-extrabold text-sm text-[#071A33]">Belum Ada Pertandingan</h4>
                <p className="text-xs text-gray-500 max-w-xs mx-auto leading-relaxed">
                  Statistik kehadiran akan diperbarui secara otomatis setelah pertandingan pertama diselenggarakan dan selesai.
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-white p-3.5 rounded-3xl border border-gray-100 shadow-xs divide-y divide-gray-100">
              {attendanceStats.map((stat, idx) => (
                <div key={stat.member.id} className="py-2.5 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center font-extrabold text-xs text-gray-700">
                      {stat.member.jerseyNumber ? `#${stat.member.jerseyNumber}` : idx + 1}
                    </div>
                    <div>
                      <div className="font-extrabold text-sm text-[#071A33] flex items-center gap-1.5">
                        <span>{stat.member.nickname}</span>
                        <span className="text-[10px] text-gray-400 font-semibold">({stat.member.position})</span>
                      </div>
                      <div className="text-[11px] text-gray-500">
                        {stat.totalMatches} pertandingan • {stat.hadirCount} hadir • {stat.tidakHadirCount} tidak hadir
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <span
                      className={`font-black text-sm ${
                        stat.percentage >= 80
                          ? 'text-emerald-600'
                          : stat.percentage >= 50
                          ? 'text-[#1261FF]'
                          : 'text-gray-600'
                      }`}
                    >
                      {stat.percentage}%
                    </span>
                    <div className="text-[10px] text-gray-400">Kehadiran</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: JERSEY MODULE (Section 24, 25, 26) */}
      {activeTab === 'jersey' && (
        <div className="space-y-4">
          {activeProgram && (
            <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-xs space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                    {activeProgram.status}
                  </span>
                  <h3 className="font-black text-base text-[#071A33] mt-1.5">
                    {activeProgram.name}
                  </h3>
                  <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                    {activeProgram.description}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-2xl">
                <div>
                  <div className="text-[10px] uppercase font-bold text-gray-400">Harga Satuan</div>
                  <div className="text-lg font-black text-[#1261FF]">
                    {formatRupiah(activeProgram.basePrice)}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] uppercase font-bold text-gray-400">Batas Pemesanan</div>
                  <div className="text-xs font-bold text-gray-700">
                    {new Date(activeProgram.orderDeadline).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </div>
                </div>
              </div>

              <button
                onClick={() => setShowOrderModal(true)}
                className="w-full py-3 bg-[#1261FF] hover:bg-blue-700 text-white font-extrabold text-xs rounded-2xl shadow-lg shadow-blue-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-1.5"
              >
                <Shirt className="w-4 h-4" />
                <span>PESAN JERSEY SEKARANG</span>
              </button>
            </div>
          )}

          {/* Daftar Pesanan Jersey */}
          <div className="space-y-2">
            <h4 className="font-bold text-xs text-gray-500 uppercase tracking-wider">
              Daftar Pemesanan Anggota ({jerseyOrders.length})
            </h4>

            <div className="space-y-2">
              {jerseyOrders.map((order) => (
                <div
                  key={order.id}
                  className="bg-white p-3.5 rounded-2xl border border-gray-100 flex items-center justify-between shadow-xs"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#1261FF] font-black text-sm flex items-center justify-center shrink-0">
                      {order.size}
                    </div>
                    <div>
                      <div className="font-extrabold text-xs text-[#071A33]">
                        {order.playerName} #{order.jerseyNumber} ({order.memberName})
                      </div>
                      <div className="text-[11px] text-gray-400">
                        {order.quantity} pcs • {formatRupiah(order.totalAmount)}{' '}
                        {order.notes && `• ${order.notes}`}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                        order.paymentStatus === 'Lunas'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : order.paymentStatus === 'Bayar Sebagian'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-red-50 text-red-600 border border-red-200'
                      }`}
                    >
                      {order.paymentStatus}
                    </span>
                    {isAdmin && order.paymentStatus !== 'Lunas' && (
                      <button
                        onClick={() =>
                          updateJerseyOrderStatus(order.id, 'Lunas', order.totalAmount)
                        }
                        className="block text-[10px] text-[#1261FF] font-bold mt-1 hover:underline text-right w-full"
                      >
                        Set Lunas
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: DAFTAR ANGGOTA (MEMBERS DIRECTORY) */}
      {activeTab === 'members' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-sm text-[#071A33]">Daftar Anggota Resmi ({members.length})</h3>
                {isMembersLoading ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-[#1261FF]">
                    <RefreshCw className="w-2.5 h-2.5 animate-spin" />
                    <span>Sinkron...</span>
                  </span>
                ) : membersSource === 'server' ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Cloud Terverifikasi
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                    Cache Lokal
                  </span>
                )}
              </div>
              <p className="text-[11px] text-gray-400">Seluruh anggota resmi komunitas {activeCommunity.name}</p>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => refreshMembers()}
                disabled={isMembersLoading}
                className="p-2 text-gray-400 hover:text-[#1261FF] hover:bg-blue-50 rounded-xl transition-all cursor-pointer disabled:opacity-50"
                title="Sinkronkan dengan Server"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isMembersLoading ? 'animate-spin' : ''}`} />
              </button>

              {isAdmin && (
                <button
                  type="button"
                  onClick={() => {
                    setMemberToEdit(null);
                    setShowAddManualModal(true);
                  }}
                  className="py-2 px-3 bg-[#1261FF] hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl shadow-md shadow-blue-500/20 flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>+ Tambah Anggota</span>
                </button>
              )}
            </div>
          </div>

          {/* Action Success Alert */}
          {actionSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-semibold flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{actionSuccess}</span>
              </div>
              <button
                type="button"
                onClick={() => setActionSuccess(null)}
                className="text-emerald-700 hover:text-emerald-900 text-xs font-bold"
              >
                Tutup
              </button>
            </div>
          )}

          {/* Action Error Alert */}
          {actionError && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-2xl text-xs font-semibold flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                <span>{actionError}</span>
              </div>
              <button
                type="button"
                onClick={() => setActionError(null)}
                className="text-red-500 hover:text-red-800 text-xs font-bold"
              >
                Tutup
              </button>
            </div>
          )}

          {/* Members Error Notice */}
          {membersError && (
            <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-2xl text-xs font-medium flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>{membersError} Menampilkan data dari cache lokal.</span>
              </div>
              <button
                type="button"
                onClick={() => refreshMembers()}
                className="px-2 py-1 bg-amber-200 hover:bg-amber-300 text-amber-900 rounded-lg text-[10px] font-bold"
              >
                Coba Lagi
              </button>
            </div>
          )}

          {/* Filter Status Anggota */}
          <div className="flex items-center gap-1.5 p-1 bg-gray-100 rounded-2xl">
            <button
              type="button"
              onClick={() => setMemberFilter('active')}
              className={`flex-1 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                memberFilter === 'active'
                  ? 'bg-white text-[#1261FF] shadow-xs'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              Aktif ({members.filter((m) => m.status === 'Aktif').length})
            </button>
            <button
              type="button"
              onClick={() => setMemberFilter('inactive')}
              className={`flex-1 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                memberFilter === 'inactive'
                  ? 'bg-white text-[#1261FF] shadow-xs'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              Nonaktif ({members.filter((m) => m.status === 'Nonaktif').length})
            </button>
            <button
              type="button"
              onClick={() => setMemberFilter('all')}
              className={`flex-1 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                memberFilter === 'all'
                  ? 'bg-white text-[#1261FF] shadow-xs'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              Semua ({members.length})
            </button>
          </div>

          {(() => {
            const filteredMembers = members.filter((mem) => {
              if (memberFilter === 'active') return mem.status === 'Aktif';
              if (memberFilter === 'inactive') return mem.status === 'Nonaktif';
              return true;
            });

            if (filteredMembers.length === 0) {
              return (
                <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-xs text-center text-xs text-gray-500">
                  Tidak ada anggota dengan status{' '}
                  <strong className="text-gray-700">
                    {memberFilter === 'active' ? 'Aktif' : memberFilter === 'inactive' ? 'Nonaktif' : ''}
                  </strong>
                  .
                </div>
              );
            }

            return (
              <div className="bg-white p-3.5 rounded-3xl border border-gray-100 shadow-xs divide-y divide-gray-100">
                {filteredMembers.map((mem) => {
              const isManual = mem.memberType === 'MANUAL';
              const isPrimaryAdmin = mem.userId === 'usr-admin-dicky' || mem.role === 'admin';

              return (
                <div key={mem.id} className="py-3 flex items-center justify-between text-xs gap-2">
                  <div className="flex items-center gap-3 min-w-0">
                    {mem.photo ? (
                      <img
                        src={mem.photo}
                        alt={mem.nickname}
                        className="w-10 h-10 rounded-2xl object-cover border border-gray-100 shrink-0"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-50 to-indigo-50 border border-blue-100/60 text-[#1261FF] font-black flex items-center justify-center text-sm shrink-0">
                        {mem.jerseyNumber ? `#${mem.jerseyNumber}` : mem.nickname.substring(0, 2).toUpperCase()}
                      </div>
                    )}

                    <div className="min-w-0">
                      <div className="font-extrabold text-sm text-[#071A33] flex flex-wrap items-center gap-1.5">
                        <span className="truncate">{mem.nickname}</span>
                        {mem.role === 'admin' && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-blue-100 text-[#1261FF]">
                            ADMIN
                          </span>
                        )}
                        {/* BADGE TIPE ANGGOTA: AKUN MABOL atau MANUAL */}
                        {isManual ? (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-amber-50 text-amber-700 border border-amber-200">
                            MANUAL
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-purple-50 text-purple-700 border border-purple-200">
                            AKUN MABOL
                          </span>
                        )}
                      </div>

                      <div className="text-[11px] text-gray-500 flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5">
                        <span>Posisi: <strong className="text-gray-700">{mem.position}</strong></span>
                        {(mem.whatsapp || mem.phone) && (
                          <span className="flex items-center gap-0.5 text-gray-600">
                            <Phone className="w-3 h-3 text-emerald-600 inline" />
                            {mem.whatsapp || mem.phone}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        mem.status === 'Aktif'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-gray-100 text-gray-500 border border-gray-200'
                      }`}
                    >
                      {mem.status}
                    </span>

                    {/* ADMIN ACTIONS UNTUK MANUAL MEMBER */}
                    {isAdmin && !isPrimaryAdmin && (
                      <div className="flex items-center gap-1 ml-1">
                        <button
                          type="button"
                          onClick={() => {
                            setMemberToEdit(mem);
                            setShowAddManualModal(true);
                          }}
                          className="p-1.5 text-gray-500 hover:text-[#1261FF] hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                          title="Edit Anggota"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          disabled={actionLoadingId === mem.id}
                          onClick={async () => {
                            try {
                              setActionLoadingId(mem.id);
                              setActionError(null);
                              const newStatus = mem.status === 'Aktif' ? 'Nonaktif' : 'Aktif';
                              await updateManualMember(mem.id, { status: newStatus });
                            } catch (err: any) {
                              setActionError(err.message || 'Gagal mengubah status anggota di server.');
                            } finally {
                              setActionLoadingId(null);
                            }
                          }}
                          className={`p-1.5 rounded-lg transition-colors cursor-pointer disabled:opacity-50 ${
                            mem.status === 'Aktif'
                              ? 'text-gray-400 hover:text-amber-600 hover:bg-amber-50'
                              : 'text-gray-400 hover:text-emerald-600 hover:bg-emerald-50'
                          }`}
                          title={mem.status === 'Aktif' ? 'Nonaktifkan Anggota' : 'Aktifkan Anggota'}
                        >
                          <Power className={`w-3.5 h-3.5 ${actionLoadingId === mem.id ? 'animate-spin' : ''}`} />
                        </button>

                        <button
                          type="button"
                          disabled={actionLoadingId === mem.id}
                          onClick={async () => {
                            if (confirm(`Apakah Anda yakin ingin menghapus "${mem.nickname}" dari daftar anggota tim komunitas?`)) {
                              try {
                                setActionLoadingId(mem.id);
                                setActionError(null);
                                setActionSuccess(null);
                                const result = await deleteManualMember(mem.id);
                                if (result?.action === 'deactivated') {
                                  setActionSuccess(
                                    `Anggota "${mem.nickname}" memiliki riwayat aktivitas/pertandingan dan telah dinonaktifkan.`
                                  );
                                } else {
                                  setActionSuccess(`Anggota "${mem.nickname}" berhasil dihapus dari komunitas.`);
                                }
                              } catch (err: any) {
                                setActionError(err.message || 'Gagal menghapus anggota di server.');
                              } finally {
                                setActionLoadingId(null);
                              }
                            }
                          }}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                          title="Hapus Anggota"
                        >
                          <Trash2 className={`w-3.5 h-3.5 ${actionLoadingId === mem.id ? 'animate-spin text-red-500' : ''}`} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        );
      })()}

          {members.length === 1 && (
            <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100 text-center text-xs text-gray-500">
              Belum ada anggota lain yang bergabung. Admin dapat menambahkan anggota manual melalui tombol <strong>"+ Tambah Anggota"</strong> di atas atau calon anggota dapat mendaftar sendiri.
            </div>
          )}
        </div>
      )}

      {/* TAB 4: DAFTAR PENGAJUAN (PROPOSALS & MEMBERSHIP REQUESTS) */}
      {activeTab === 'proposals' && (
        <div className="space-y-3">
          {/* Sub-tabs: Pengajuan Anggota & Pengajuan Main */}
          <div className="flex bg-gray-100 p-1 rounded-2xl gap-1 text-xs font-bold">
            <button
              onClick={() => {
                setProposalSubTab('membership');
                refreshMembershipRequests();
              }}
              className={`flex-1 py-1.5 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                proposalSubTab === 'membership'
                  ? 'bg-white text-[#1261FF] shadow-xs'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <span>Pengajuan Anggota</span>
              {pendingMembershipCount > 0 ? (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-red-500 text-white">
                  {pendingMembershipCount}
                </span>
              ) : (
                <span>({membershipRequests.filter((r) => r.status === 'Menunggu Persetujuan').length})</span>
              )}
            </button>
            <button
              onClick={() => setProposalSubTab('matches')}
              className={`flex-1 py-1.5 rounded-xl transition-all ${
                proposalSubTab === 'matches'
                  ? 'bg-white text-[#1261FF] shadow-xs'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Pengajuan Main ({proposals.filter((p) => p.status === 'Menunggu Persetujuan').length})
            </button>
          </div>

          {/* Sub-tab 1: Pengajuan Anggota */}
          {proposalSubTab === 'membership' && (
            <div className="space-y-2">
              {membershipRequests.length === 0 ? (
                <div className="bg-white p-8 rounded-3xl border border-gray-100 text-center space-y-2 shadow-xs">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#1261FF] flex items-center justify-center mx-auto text-xl">
                    👥
                  </div>
                  <h4 className="font-extrabold text-sm text-[#071A33]">Belum Ada Pengajuan Anggota</h4>
                  <p className="text-xs text-gray-500 max-w-xs mx-auto leading-relaxed">
                    Pengajuan dari calon anggota baru yang mendaftar dan memilih bergabung ke komunitas ini akan muncul di sini untuk ditinjau oleh Admin.
                  </p>
                </div>
              ) : (
                membershipRequests.map((req) => (
                  <div key={req.id} className="bg-white p-4 rounded-3xl border border-gray-100 shadow-xs space-y-2.5">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-extrabold text-sm text-[#071A33]">{req.userName}</div>
                        <div className="text-xs text-gray-500">{req.userEmail}</div>
                      </div>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                          req.status === 'Disetujui'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : req.status === 'Ditolak'
                            ? 'bg-red-50 text-red-600 border border-red-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {req.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-xs bg-gray-50 p-2.5 rounded-xl">
                      <div>
                        <span className="text-[10px] text-gray-400 block font-bold">Posisi</span>
                        <span className="font-semibold text-gray-800">{req.position || 'Gelandang'}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-gray-400 block font-bold">No. Punggung</span>
                        <span className="font-semibold text-gray-800">#{req.jerseyNumber || 10}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-gray-400 block font-bold">Tanggal</span>
                        <span className="font-semibold text-gray-800">
                          {new Date(req.createdAt).toLocaleDateString('id-ID')}
                        </span>
                      </div>
                    </div>

                    {req.notes && (
                      <p className="text-xs text-gray-600 italic bg-gray-50/50 p-2 rounded-xl">"{req.notes}"</p>
                    )}

                    {reviewError && reviewError.id === req.id && (
                      <div className="p-2.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 font-semibold flex items-center gap-1.5">
                        <span>⚠️</span>
                        <span>{reviewError.message}</span>
                      </div>
                    )}

                    {isAdmin && req.status === 'Menunggu Persetujuan' && (
                      <div className="pt-2 flex gap-2 border-t border-gray-100">
                        <button
                          disabled={reviewLoadingId === req.id}
                          onClick={() => handleReviewMembership(req.id, 'Ditolak')}
                          className="flex-1 py-2 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 text-gray-700 text-xs font-bold rounded-xl cursor-pointer transition-all"
                        >
                          {reviewLoadingId === req.id ? 'Memproses...' : 'Tolak'}
                        </button>
                        <button
                          disabled={reviewLoadingId === req.id}
                          onClick={() => handleReviewMembership(req.id, 'Disetujui')}
                          className="flex-1 py-2 bg-[#1261FF] hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-500/20 cursor-pointer transition-all"
                        >
                          {reviewLoadingId === req.id ? 'Memproses...' : 'Setujui Anggota'}
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {/* Sub-tab 2: Pengajuan Jadwal Main */}
          {proposalSubTab === 'matches' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-500">Pengajuan Jadwal Main</span>
                <button
                  onClick={() => setShowProposalModal(true)}
                  className="px-3 py-1.5 bg-[#1261FF] text-white text-xs font-bold rounded-xl flex items-center gap-1 shadow-xs cursor-pointer"
                >
                  <Send className="w-3 h-3" />
                  <span>Ajukan Main</span>
                </button>
              </div>

              {proposals.length === 0 ? (
                <div className="bg-white p-8 rounded-3xl border border-gray-100 text-center space-y-2 shadow-xs">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#1261FF] flex items-center justify-center mx-auto text-xl">
                    ⚽
                  </div>
                  <h4 className="font-extrabold text-sm text-[#071A33]">Belum Ada Pengajuan Main</h4>
                  <p className="text-xs text-gray-500 max-w-xs mx-auto leading-relaxed">
                    Anggota dapat mengusulkan rencana jadwal dan lapangan sparring di sini.
                  </p>
                </div>
              ) : (
                proposals.map((prop) => (
                  <div key={prop.id} className="bg-white p-4 rounded-3xl border border-gray-100 shadow-xs space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-extrabold text-sm text-[#071A33]">
                          {prop.suggestedVenue}
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5">
                          Diusulkan oleh <strong className="text-gray-700">{prop.requesterName}</strong>
                        </div>
                      </div>

                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                          prop.status === 'Disetujui'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : prop.status === 'Ditolak'
                            ? 'bg-red-50 text-red-600 border border-red-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {prop.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs bg-gray-50 p-2.5 rounded-xl">
                      <div>
                        <span className="text-[10px] text-gray-400 block font-bold">Rencana Tanggal</span>
                        <span className="font-semibold text-gray-800">
                          {prop.requestedDate} • {prop.requestedTime} WIB
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-gray-400 block font-bold">Perkiraan Pemain</span>
                        <span className="font-semibold text-gray-800">{prop.estimatedPlayers} orang</span>
                      </div>
                    </div>

                    {prop.notes && (
                      <p className="text-xs text-gray-600 italic">"{prop.notes}"</p>
                    )}

                    {/* Admin Review Action */}
                    {isAdmin && prop.status === 'Menunggu Persetujuan' && (
                      <div className="pt-2 flex gap-2 border-t border-gray-100">
                        <button
                          onClick={() => reviewProposal(prop.id, 'Ditolak')}
                          className="flex-1 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl cursor-pointer"
                        >
                          Tolak
                        </button>
                        <button
                          onClick={() => reviewProposal(prop.id, 'Disetujui')}
                          className="flex-1 py-1.5 bg-[#1261FF] hover:bg-blue-700 text-white text-xs font-bold rounded-xl cursor-pointer"
                        >
                          Setujui (Jadikan Draft Match)
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}

      {/* MODAL PESAN JERSEY */}
      {showOrderModal && activeProgram && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-gray-100 animate-scale-up">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
              <div>
                <h3 className="font-bold text-[#071A33] text-base">Pesan Jersey Resmi</h3>
                <p className="text-xs text-gray-500">Harga: {formatRupiah(activeProgram.basePrice)}/pcs</p>
              </div>
              <button
                onClick={() => setShowOrderModal(false)}
                className="p-1 rounded-full text-gray-400 hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleOrderJersey} className="space-y-3.5">
              {/* Nama Punggung */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Nama Punggung (Kapital)</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: EPUL / XHERDAN"
                  value={orderPlayerName}
                  onChange={(e) => setOrderPlayerName(e.target.value.toUpperCase())}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-[#071A33] focus:outline-hidden focus:border-[#1261FF]"
                />
              </div>

              {/* Nomor Punggung & Ukuran */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Nomor Punggung</label>
                  <input
                    type="number"
                    min="1"
                    max="99"
                    required
                    value={orderJerseyNumber}
                    onChange={(e) => setOrderJerseyNumber(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-[#071A33]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Ukuran (Size)</label>
                  <select
                    value={orderSize}
                    onChange={(e) => setOrderSize(e.target.value as any)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-[#071A33]"
                  >
                    <option value="S">S</option>
                    <option value="M">M</option>
                    <option value="L">L</option>
                    <option value="XL">XL</option>
                    <option value="2XL">2XL</option>
                    <option value="3XL">3XL</option>
                  </select>
                </div>
              </div>

              {/* Jumlah & Catatan Varian */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Jumlah (Pcs)</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    required
                    value={orderQty}
                    onChange={(e) => setOrderQty(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-[#071A33]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Varian Warna</label>
                  <select
                    value={orderNotes}
                    onChange={(e) => setOrderNotes(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-800"
                  >
                    <option value="Home Biru">Home (Biru)</option>
                    <option value="Away Putih">Away (Putih)</option>
                    <option value="Kiper Kuning">Kiper (Kuning)</option>
                  </select>
                </div>
              </div>

              <div className="p-3 bg-blue-50 rounded-2xl flex items-center justify-between text-xs">
                <span className="font-bold text-gray-600">Total Tagihan:</span>
                <span className="font-black text-base text-[#1261FF]">
                  {formatRupiah(activeProgram.basePrice * orderQty)}
                </span>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowOrderModal(false)}
                  className="flex-1 py-2.5 text-xs font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl"
                >
                  BATAL
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-[#1261FF] hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-500/20"
                >
                  SIMPAN PESANAN
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL AJUKAN MAIN */}
      {showProposalModal && (
        <ProposalModal onClose={() => setShowProposalModal(false)} />
      )}

      {/* MODAL TAMBAH/EDIT ANGGOTA MANUAL */}
      {showAddManualModal && (
        <ManualMemberModal
          memberToEdit={memberToEdit}
          onClose={() => {
            setShowAddManualModal(false);
            setMemberToEdit(null);
          }}
        />
      )}
    </div>
  );
};
