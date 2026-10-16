import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Match, MatchParticipant } from '../types';
import { formatRupiah, calculateMatchFinances } from '../services/financialService';
import {
  X,
  Calendar,
  Clock,
  MapPin,
  ExternalLink,
  Users,
  Camera,
  Coffee,
  CheckCircle2,
  XCircle,
  Clock3,
  CreditCard,
  Plus,
  FileText,
  UserPlus,
  Settings,
  AlertTriangle,
  Award,
  DollarSign,
  TrendingUp,
  Share2,
} from 'lucide-react';
import { PaymentModal } from './PaymentModal';
import { WhatsAppImportModal } from './WhatsAppImportModal';
import { AddGuestModal } from './AddGuestModal';
import { AddMemberToMatchModal } from './AddMemberToMatchModal';
import { ConvertGuestModal } from './ConvertGuestModal';
import { MatchExpensesModal } from './MatchExpensesModal';
import { CreateMatchModal } from './CreateMatchModal';

interface MatchDetailModalProps {
  match: Match;
  onClose: () => void;
}

export const MatchDetailModal: React.FC<MatchDetailModalProps> = ({ match, onClose }) => {
  const {
    currentUser,
    currentMember,
    isAdmin,
    participants,
    members,
    payments,
    expenses,
    addOns,
    matchSponsorships,
    rsvpMatch,
    updateParticipantRsvp,
    updateAttendance,
    completeMatch,
    cancelMatch,
  } = useApp();

  const [activeModal, setActiveModal] = useState<
    'none' | 'payment' | 'whatsapp' | 'guest' | 'convert' | 'expenses' | 'edit' | 'addMember'
  >('none');
  const [selectedParticipantId, setSelectedParticipantId] = useState<string | undefined>();
  const [targetGuestParticipant, setTargetGuestParticipant] = useState<MatchParticipant | null>(null);

  // Filter partisipan match ini
  const matchParticipants = participants.filter((p) => p.matchId === match.id);

  // Status user sendiri
  const userParticipant = currentMember
    ? matchParticipants.find((p) => p.memberId === currentMember.id)
    : undefined;

  const userPayment = userParticipant
    ? payments.find((pay) => pay.matchId === match.id && pay.participantId === userParticipant.id)
    : undefined;

  // Cek deadline pembatalan
  const deadlinePassed = new Date(match.cancellationDeadline).getTime() < Date.now();

  // Hitung jumlah yang ikut / hadir
  const rsvpIkutCount = matchParticipants.filter((p) => p.rsvpStatus === 'Ikut').length;
  const hadirCount = matchParticipants.filter((p) => p.attendanceStatus === 'Hadir').length;

  // Ringkasan Keuangan Match
  const financial = calculateMatchFinances(match, payments, expenses, addOns, matchSponsorships, participants);

  const handleRSVP = (status: 'Ikut' | 'Batal') => {
    const res = rsvpMatch(match.id, status);
    if (!res.success) {
      alert(res.message);
    }
  };

  const handleCompleteMatch = () => {
    if (confirm('Selesaikan pertandingan ini? Surplus (keuntungan) akan otomatis masuk ke Buku Kas Komunitas!')) {
      completeMatch(match.id);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs">
        <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-gray-100 max-h-[92vh] flex flex-col overflow-hidden animate-scale-up">
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-[#071A33] via-[#0D2E5C] to-[#1261FF] text-white p-5 relative shrink-0">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-1.5 rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-2">
              <span
                className={`px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase tracking-wider ${
                  match.status === 'Aktif'
                    ? 'bg-emerald-500 text-white'
                    : match.status === 'Selesai'
                    ? 'bg-blue-400 text-white'
                    : 'bg-amber-400 text-gray-900'
                }`}
              >
                {match.status}
              </span>
              <span className="text-xs text-blue-200">
                {rsvpIkutCount} / {match.playerQuota} Kuota Terisi
              </span>
            </div>

            <h2 className="text-xl font-black leading-tight mb-2">{match.title}</h2>

            <div className="flex flex-wrap items-center gap-y-1 gap-x-3 text-xs text-blue-100">
              <span className="flex items-center gap-1 font-semibold">
                <Calendar className="w-3.5 h-3.5" />
                {new Date(match.date).toLocaleDateString('id-ID', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </span>
              <span className="flex items-center gap-1 font-semibold">
                <Clock className="w-3.5 h-3.5" />
                {match.kickoffTime} - {match.endTime} WIB
              </span>
            </div>
          </div>

          {/* Konten Scrollable */}
          <div className="overflow-y-auto flex-1 p-5 space-y-4">
            {/* Kartu Status Keikutsertaan Saya */}
            <div className="bg-gradient-to-br from-blue-50/70 to-indigo-50/50 border border-blue-200 rounded-2xl p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Status Anda ({currentMember ? currentMember.nickname : currentUser.name})
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="font-extrabold text-base text-[#071A33]">
                      RSVP: {userParticipant ? userParticipant.rsvpStatus : 'Belum Terdaftar'}
                    </span>
                    {userParticipant && (
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                          userParticipant.attendanceStatus === 'Hadir'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        Kehadiran: {userParticipant.attendanceStatus}
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-[10px] font-bold text-gray-400 uppercase">Pembayaran</div>
                  <span
                    className={`inline-block text-xs font-bold px-2 py-0.5 rounded-full mt-0.5 ${
                      userPayment?.status === 'Sudah Bayar'
                        ? 'bg-emerald-100 text-emerald-700'
                        : userPayment?.status === 'Bayar Sebagian'
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {userPayment?.status || 'Belum Bayar'}
                  </span>
                </div>
              </div>

              {/* Deadline pembatalan alert */}
              {deadlinePassed && (
                <div className="flex items-center gap-1.5 text-xs text-amber-800 bg-amber-50 p-2.5 rounded-xl border border-amber-200 mb-3">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
                  <span>Batas pembatalan telah lewat (tidak dapat membatalkan mandiri).</span>
                </div>
              )}

              {/* Action Button Anggota */}
              <div className="flex gap-2">
                {userParticipant?.rsvpStatus === 'Ikut' ? (
                  <button
                    disabled={deadlinePassed && !isAdmin}
                    onClick={() => handleRSVP('Batal')}
                    className="flex-1 py-2.5 px-3 bg-white border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-50 text-xs font-bold rounded-xl shadow-xs"
                  >
                    BATAL IKUT
                  </button>
                ) : (
                  <button
                    disabled={match.status !== 'Aktif'}
                    onClick={() => handleRSVP('Ikut')}
                    className="flex-1 py-2.5 px-3 bg-[#1261FF] hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-extrabold rounded-xl shadow-md shadow-blue-500/20"
                  >
                    SAYA IKUT ⚽
                  </button>
                )}

                {/* Tombol Laporkan Bayar */}
                {userParticipant && (
                  <button
                    onClick={() => {
                      setSelectedParticipantId(userParticipant.id);
                      setActiveModal('payment');
                    }}
                    className="py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md shadow-green-600/20 flex items-center gap-1.5"
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    <span>CATAT / BAYAR</span>
                  </button>
                )}
              </div>
            </div>

            {/* Info Venue, Peta & HTM */}
            <div className="bg-white border border-gray-100 rounded-2xl p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">
                    Tempat / Venue
                  </div>
                  <div className="font-extrabold text-[#071A33] text-sm mt-0.5">{match.venue}</div>
                  <div className="text-xs text-gray-500 mt-0.5 leading-relaxed">{match.address}</div>
                </div>
                {match.mapUrl && (
                  <a
                    href={match.mapUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 rounded-xl bg-blue-50 text-[#1261FF] hover:bg-blue-100 text-xs font-bold flex items-center gap-1 shrink-0"
                  >
                    <MapPin className="w-4 h-4" />
                    <span>Peta</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-100">
                <div>
                  <div className="text-[10px] font-bold text-gray-400 uppercase">Standar HTM</div>
                  <div className="text-base font-black text-[#1261FF]">
                    {formatRupiah(match.standardFee)}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] font-bold text-gray-400 uppercase">Batas Pembatalan</div>
                  <div className="text-xs font-bold text-gray-700">
                    {new Date(match.cancellationDeadline).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                </div>
              </div>

              {/* Info Rekening Pembayaran */}
              {match.paymentAccountNumber && (
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-200/80 text-xs">
                  <div className="text-[10px] font-bold text-gray-500 uppercase mb-0.5">
                    Rekening Pembayaran HTM
                  </div>
                  <div className="font-bold text-[#071A33]">
                    {match.paymentBankName} {match.paymentAccountNumber}
                  </div>
                  <div className="text-gray-500 text-[11px]">a/n {match.paymentAccountHolder}</div>
                </div>
              )}

              {/* Catatan Pertandingan */}
              {match.notes && (
                <div className="p-3 bg-amber-50/50 rounded-xl border border-amber-200/60 text-xs text-gray-700">
                  <span className="font-bold text-amber-800">Catatan: </span>
                  {match.notes}
                </div>
              )}
            </div>

            {/* Seksi Fotografer & Media (Section 20) */}
            <div className="bg-white border border-gray-100 rounded-2xl p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-blue-50 text-[#1261FF] flex items-center justify-center">
                    <Camera className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-[#071A33]">Fotografer & Dokumentasi</div>
                    <div className="text-[11px] text-gray-500">
                      {match.photographerAvailable
                        ? `Ada Fotografer (${match.photographerName})`
                        : 'Tidak ada fotografer'}
                    </div>
                  </div>
                </div>
                {match.albumUrl && (
                  <a
                    href={match.albumUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="px-2.5 py-1 rounded-lg bg-blue-50 text-[#1261FF] text-xs font-bold flex items-center gap-1 hover:bg-blue-100"
                  >
                    <span>Buka Album</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>

            {/* Seksi Add-Ons & Fasilitas (Section 19) */}
            {addOns.filter((a) => a.matchId === match.id).length > 0 && (
              <div className="bg-white border border-gray-100 rounded-2xl p-4">
                <div className="text-xs font-bold text-[#071A33] mb-2 flex items-center gap-1.5">
                  <Coffee className="w-4 h-4 text-emerald-600" />
                  <span>Fasilitas & Add-Ons Lapangan</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {addOns
                    .filter((a) => a.matchId === match.id)
                    .map((a) => (
                      <div key={a.id} className="p-2 rounded-xl bg-gray-50 border border-gray-100">
                        <div className="font-bold text-gray-800">{a.name}</div>
                        <div className="text-[10px] text-gray-500">
                          {a.quantity} unit ({formatRupiah(a.total)})
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Seksi Ringkasan Finansial Match (Section 21) */}
            <div className="bg-white border border-gray-100 rounded-2xl p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="text-xs font-extrabold text-[#071A33] flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-[#1261FF]" />
                  <span>Ringkasan Finansial Pertandingan</span>
                </div>
                {isAdmin && (
                  <button
                    onClick={() => setActiveModal('expenses')}
                    className="text-xs text-[#1261FF] font-bold hover:underline"
                  >
                    Kelola Biaya
                  </button>
                )}
              </div>

              {/* Grid 4 Kolom: Pendapatan Diterima, Belum Dibayar, Pengeluaran, Hasil */}
              <div className="grid grid-cols-2 xs:grid-cols-4 gap-2 text-center bg-gray-50 p-3 rounded-xl mb-2.5">
                <div>
                  <div className="text-[10px] font-bold text-gray-400 uppercase">Pendapatan Diterima</div>
                  <div className="text-xs font-black text-emerald-600">
                    {formatRupiah(financial.totalRevenue)}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] font-bold text-gray-400 uppercase">Belum Dibayar</div>
                  <div className="text-xs font-black text-amber-600">
                    {formatRupiah(financial.totalOutstandingPayments)}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] font-bold text-gray-400 uppercase">Pengeluaran</div>
                  <div className="text-xs font-black text-red-500">
                    {formatRupiah(financial.totalExpenses)}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] font-bold text-gray-400 uppercase">Hasil Match</div>
                  <div
                    className={`text-xs font-black ${
                      financial.isSurplus
                        ? 'text-emerald-600'
                        : financial.isDeficit
                        ? 'text-red-600'
                        : 'text-gray-600'
                    }`}
                  >
                    {financial.isSurplus
                      ? `SURPLUS +${formatRupiah(financial.surplusAmount)}`
                      : financial.isDeficit
                      ? `DEFISIT ${formatRupiah(financial.deficitAmount)}`
                      : 'IMPAS Rp 0'}
                  </div>
                </div>
              </div>

              {/* Rincian Finansial Transparan */}
              <div className="text-[11px] text-gray-600 bg-gray-50/80 p-2.5 rounded-xl border border-gray-100 space-y-1 mb-2">
                <div className="flex justify-between">
                  <span>Peserta: <strong className="text-gray-800">{matchParticipants.length} orang</strong></span>
                  <span>Standar HTM: <strong>{matchParticipants.length} × {formatRupiah(match.standardFee)} = {formatRupiah(matchParticipants.length * match.standardFee)}</strong></span>
                </div>
                <div className="flex justify-between">
                  <span>Diterima: <strong className="text-emerald-600">{formatRupiah(financial.totalPlayerPayments)}</strong></span>
                  <span>Belum Bayar: <strong className="text-amber-600">{formatRupiah(financial.totalOutstandingPayments)}</strong></span>
                </div>
                <div className="flex justify-between border-t border-gray-200/60 pt-1 text-gray-700">
                  <span>Biaya Lapangan ({formatRupiah(financial.fieldExpense)}) + Foto ({formatRupiah(financial.photographerExpense)}) + Add-on ({formatRupiah(financial.addOnsExpense)})</span>
                  <span className="font-black text-red-600">{formatRupiah(financial.totalExpenses)}</span>
                </div>
              </div>

              {/* Info Kontribusi Tambahan (Support of the match) */}
              {financial.totalExtraContributions > 0 && (
                <div className="text-xs text-blue-800 bg-blue-50/70 p-2.5 rounded-xl border border-blue-200 mb-2 flex items-center justify-between">
                  <span className="font-semibold">💙 Kontribusi Tambahan (Support of the Match):</span>
                  <span className="font-black text-[#1261FF]">
                    +{formatRupiah(financial.totalExtraContributions)}
                  </span>
                </div>
              )}

              {/* Status Surplus vs Defisit */}
              {financial.isSurplus && (
                <div className="text-xs text-emerald-700 bg-emerald-50 p-2.5 rounded-xl border border-emerald-200">
                  Surplus <span className="font-bold">+{formatRupiah(financial.surplusAmount)}</span>{' '}
                  {match.cashSettled
                    ? 'telah dialokasikan ke Buku Kas Komunitas.'
                    : 'akan otomatis dialokasikan ke Buku Kas saat pertandingan diselesaikan.'}
                </div>
              )}

              {financial.isDeficit && (
                <div className="text-xs text-red-700 bg-red-50 p-2.5 rounded-xl border border-red-200 leading-relaxed">
                  <span className="font-bold">DEFISIT {formatRupiah(financial.deficitAmount)}:</span>{' '}
                  Pengeluaran ({formatRupiah(financial.totalExpenses)}) melebihi pendapatan riil yang diterima ({formatRupiah(financial.totalRevenue)}). Sesuai aturan sistem, defisit tidak otomatis memotong kas komunitas sebelum tindakan admin, dan uang yang belum dibayar ({formatRupiah(financial.totalOutstandingPayments)}) tidak diakui sebagai kas masuk.
                </div>
              )}
            </div>

            {/* Seksi Daftar Peserta (Section 9, 10, 41) */}
            <div className="bg-white border border-gray-100 rounded-2xl p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="text-sm font-extrabold text-[#071A33] flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-[#1261FF]" />
                    <span>Daftar Peserta ({matchParticipants.length})</span>
                  </div>
                  <div className="text-xs text-gray-500">
                    {hadirCount} Hadir • {rsvpIkutCount} Ikut •{' '}
                    {matchParticipants.filter((p) => p.rsvpStatus === 'Menunggu').length} Menunggu
                  </div>
                </div>

                {/* Admin Quick Actions */}
                {isAdmin && (
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setActiveModal('whatsapp')}
                      className="p-1.5 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-xs font-bold flex items-center gap-1"
                      title="Import dari WhatsApp"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span className="hidden xs:inline">Import WA</span>
                    </button>
                    <button
                      onClick={() => setActiveModal('guest')}
                      className="p-1.5 rounded-xl bg-blue-50 text-[#1261FF] hover:bg-blue-100 text-xs font-bold flex items-center gap-1"
                      title="Tambah Guest"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span className="hidden xs:inline">Guest</span>
                    </button>
                  </div>
                )}
              </div>

              {/* List Peserta */}
              <div className="divide-y divide-gray-100 max-h-72 overflow-y-auto pr-1">
                {matchParticipants.map((p, index) => {
                  const payment = payments.find(
                    (pay) => pay.matchId === match.id && pay.participantId === p.id
                  );
                  const isGuest = p.participantType === 'Guest';
                  const memberInfo = !isGuest && p.memberId ? members.find((m) => m.id === p.memberId) : null;
                  const displayName = isGuest ? p.guestName || 'Tamu' : memberInfo?.nickname || 'Anggota';

                  const hasPaidExtra = payment && payment.extraContribution > 0;

                  return (
                    <div key={p.id} className="py-2.5 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="text-gray-400 font-bold w-4 text-right shrink-0">
                          {index + 1}.
                        </span>
                        <div className="min-w-0">
                          <div className="font-extrabold text-[#071A33] flex items-center gap-1.5 truncate">
                            <span className="truncate">{displayName}</span>
                            {isGuest ? (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-50 text-amber-700 border border-amber-200 shrink-0">
                                Guest
                              </span>
                            ) : (
                              memberInfo?.jerseyNumber && (
                                <span className="text-[10px] text-gray-400 font-semibold shrink-0">
                                  #{memberInfo.jerseyNumber}
                                </span>
                              )
                            )}
                            {hasPaidExtra && (
                              <span
                                className="px-1.5 py-0.2 rounded text-[9px] font-black bg-blue-100 text-[#1261FF] shrink-0"
                                title={`Support of the match: +${formatRupiah(payment.extraContribution)}`}
                              >
                                💙 +{formatRupiah(payment.extraContribution)}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2 text-[11px] text-gray-500 mt-0.5">
                            {isAdmin ? (
                              <button
                                type="button"
                                onClick={() =>
                                  updateParticipantRsvp(
                                    p.id,
                                    p.rsvpStatus === 'Ikut' ? 'Batal' : 'Ikut'
                                  )
                                }
                                className={`font-bold px-1.5 py-0.5 rounded-md cursor-pointer transition-colors ${
                                  p.rsvpStatus === 'Ikut'
                                    ? 'bg-blue-50 text-[#1261FF] border border-blue-200 hover:bg-blue-100'
                                    : p.rsvpStatus === 'Batal'
                                    ? 'bg-red-50 text-red-600 border border-red-200 hover:bg-red-100'
                                    : 'bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200'
                                }`}
                                title="Admin: Klik untuk ubah RSVP (Ikut / Batal)"
                              >
                                RSVP: {p.rsvpStatus}
                              </button>
                            ) : (
                              <span className="font-medium">RSVP: {p.rsvpStatus}</span>
                            )}
                            <span>•</span>
                            {isAdmin ? (
                              <button
                                type="button"
                                onClick={() =>
                                  updateAttendance(
                                    p.id,
                                    p.attendanceStatus === 'Hadir' ? 'Tidak Hadir' : 'Hadir'
                                  )
                                }
                                className={`font-bold px-1.5 py-0.5 rounded-md cursor-pointer transition-colors ${
                                  p.attendanceStatus === 'Hadir'
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                                    : p.attendanceStatus === 'Tidak Hadir'
                                    ? 'bg-red-50 text-red-600 border border-red-200 hover:bg-red-100'
                                    : 'bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200'
                                }`}
                                title="Klik untuk ubah status kehadiran (Hadir / Tidak Hadir)"
                              >
                                Kehadiran: {p.attendanceStatus}
                              </button>
                            ) : (
                              <span
                                className={`font-semibold ${
                                  p.attendanceStatus === 'Hadir'
                                    ? 'text-emerald-600'
                                    : p.attendanceStatus === 'Tidak Hadir'
                                    ? 'text-red-500'
                                    : 'text-gray-400'
                                }`}
                              >
                                Kehadiran: {p.attendanceStatus}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Kolom Bayar & Admin Dropdown */}
                      <div className="flex items-center gap-2 shrink-0">
                        <div
                          onClick={() => {
                            if (isAdmin) {
                              setSelectedParticipantId(p.id);
                              setActiveModal('payment');
                            }
                          }}
                          className={`text-right ${isAdmin ? 'cursor-pointer hover:opacity-80' : ''}`}
                          title={isAdmin ? 'Klik untuk catat / ubah pembayaran' : undefined}
                        >
                          <span
                            className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              payment?.status === 'Sudah Bayar'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : payment?.status === 'Bayar Sebagian'
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : 'bg-red-50 text-red-600 border border-red-200'
                            }`}
                          >
                            {payment?.status || 'Belum Bayar'}
                          </span>
                          {payment?.method && (
                            <div className="text-[9px] text-gray-400">{payment.method}</div>
                          )}
                        </div>

                        {/* Admin Action Menu */}
                        {isAdmin && (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => {
                                setSelectedParticipantId(p.id);
                                setActiveModal('payment');
                              }}
                              className="p-1 rounded-lg hover:bg-gray-100 text-gray-500"
                              title="Catat / Edit Bayar"
                            >
                              <DollarSign className="w-3.5 h-3.5" />
                            </button>

                            {/* Tombol Cepat Kehadiran Hadir / Tidak Hadir */}
                            <button
                              onClick={() =>
                                updateAttendance(
                                  p.id,
                                  p.attendanceStatus === 'Hadir' ? 'Tidak Hadir' : 'Hadir'
                                )
                              }
                              className={`p-1 rounded-lg ${
                                p.attendanceStatus === 'Hadir'
                                  ? 'text-emerald-600 hover:bg-emerald-50'
                                  : 'text-gray-400 hover:bg-gray-100'
                              }`}
                              title="Toggle Kehadiran"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            </button>

                            {/* Konversi Guest ke Member jika guest */}
                            {isGuest && (
                              <button
                                onClick={() => {
                                  setTargetGuestParticipant(p);
                                  setActiveModal('convert');
                                }}
                                className="p-1 rounded-lg hover:bg-purple-50 text-purple-600"
                                title="Konversi Tamu ke Anggota Resmi"
                              >
                                <UserPlus className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Tombol Kontrol Admin */}
            {isAdmin && (
              <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 space-y-2">
                <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                  Panel Manajemen Admin
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setActiveModal('edit')}
                    className="py-2.5 px-3 bg-white border border-gray-200 hover:bg-gray-100 text-gray-700 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5"
                  >
                    <Settings className="w-3.5 h-3.5" />
                    <span>EDIT PERTANDINGAN</span>
                  </button>

                  <button
                    onClick={() => setActiveModal('expenses')}
                    className="py-2.5 px-3 bg-white border border-gray-200 hover:bg-gray-100 text-gray-700 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5"
                  >
                    <DollarSign className="w-3.5 h-3.5" />
                    <span>BIAYA & SPONSOR</span>
                  </button>
                </div>

                {match.status !== 'Selesai' && (
                  <button
                    onClick={handleCompleteMatch}
                    className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-500/20"
                  >
                    TANDAI PERTANDINGAN SELESAI & TUTUP KAS
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sub-Modals */}
      {activeModal === 'payment' && (
        <PaymentModal
          match={match}
          preselectedParticipantId={selectedParticipantId}
          onClose={() => {
            setActiveModal('none');
            setSelectedParticipantId(undefined);
          }}
        />
      )}

      {activeModal === 'whatsapp' && (
        <WhatsAppImportModal match={match} onClose={() => setActiveModal('none')} />
      )}

      {activeModal === 'guest' && (
        <AddGuestModal match={match} onClose={() => setActiveModal('none')} />
      )}

      {activeModal === 'convert' && targetGuestParticipant && (
        <ConvertGuestModal
          participant={targetGuestParticipant}
          onClose={() => {
            setActiveModal('none');
            setTargetGuestParticipant(null);
          }}
        />
      )}

      {activeModal === 'expenses' && (
        <MatchExpensesModal match={match} onClose={() => setActiveModal('none')} />
      )}

      {activeModal === 'edit' && (
        <CreateMatchModal initialMatch={match} onClose={() => setActiveModal('none')} />
      )}
    </>
  );
};
