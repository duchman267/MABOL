// Definisi Tipe Data MABOL - Platform Manajemen Komunitas Sepak Bola

export type MatchStatus = 'Draft' | 'Aktif' | 'Selesai' | 'Dibatalkan';

export type ParticipantType = 'Anggota' | 'Guest';

export type RsvpStatus = 'Menunggu' | 'Ikut' | 'Batal';

export type AttendanceStatus = 'Belum Dicek' | 'Hadir' | 'Tidak Hadir';

export type PaymentMethod = 'Transfer' | 'Tunai' | 'Lainnya';

export type PaymentStatus = 'Belum Bayar' | 'Bayar Sebagian' | 'Sudah Bayar';

export type ProposalStatus = 'Menunggu Persetujuan' | 'Disetujui' | 'Ditolak';

export type CommunityRole = 'admin' | 'member';

export type CashTransactionType = 'Pemasukan' | 'Pengeluaran';

export type CashCategory = 'Match' | 'Sponsor' | 'Jersey' | 'Operasional' | 'Kas Awal' | 'Lainnya';

export type ExpenseCategory = 'Lapangan' | 'Photographer' | 'Add-on' | 'Operasional' | 'Lainnya';

export type JerseyPaymentStatus = 'Belum Bayar' | 'Bayar Sebagian' | 'Lunas';

export interface Community {
  id: string;
  name: string;
  logo?: string;
  description: string;
  primaryColor: string;
  status: 'Aktif' | 'Nonaktif';
  createdAt: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  photo?: string;
  authId?: string;
  status: 'Aktif' | 'Nonaktif';
  createdAt: string;
}

export interface UserProfile {
  id: string;
  uid?: string;
  name: string;
  displayName?: string;
  email: string;
  photoURL?: string;
  createdAt: string;
  lastLoginAt?: string;
  status: 'ACTIVE' | 'Aktif' | 'Nonaktif';
}

export type MemberType = 'REGISTERED' | 'MANUAL';

export interface CommunityMembership {
  uid: string;
  userId?: string;
  communityId: string;
  role: 'ADMIN' | 'MEMBER';
  status: 'AKTIF' | 'NONAKTIF';
  displayName: string;
  photoURL?: string;
  position?: string;
  jerseyNumber?: number;
  memberType?: MemberType;
  joinedAt: string;
}

export interface Member {
  id: string;
  communityId: string;
  userId?: string;
  nickname: string;
  fullName?: string;
  phone?: string;
  whatsapp?: string;
  email?: string;
  photo?: string;
  position: 'Kiper' | 'Bek' | 'Gelandang' | 'Penyerang' | 'All-Rounder';
  jerseyNumber: number;
  role: CommunityRole;
  status: 'Aktif' | 'Nonaktif';
  memberType?: MemberType;
  joinedAt: string;
}

export interface MatchParticipant {
  id: string;
  matchId: string;
  memberId?: string; // Jika terdaftar
  participantType: ParticipantType;
  guestName?: string;
  guestPhone?: string;
  rsvpStatus: RsvpStatus;
  attendanceStatus: AttendanceStatus;
  createdAt: string;
}

export interface PaymentRecord {
  id: string;
  matchId: string;
  participantId: string;
  standardFee: number;
  amount: number;
  extraContribution: number;
  method: PaymentMethod;
  status: PaymentStatus;
  paidAt: string;
  recordedBy: string;
  notes?: string;
}

export interface MatchExpense {
  id: string;
  matchId: string;
  category: ExpenseCategory;
  name: string;
  quantity: number;
  unitPrice: number;
  total: number;
  paidAt?: string;
  notes?: string;
}

export interface MatchAddOn {
  id: string;
  matchId: string;
  name: string;
  category: string;
  quantity: number;
  unitPrice: number;
  total: number;
  notes?: string;
}

export interface MatchSponsorship {
  id: string;
  matchId: string;
  sponsorId: string;
  amount: number;
  paymentStatus: 'Belum Bayar' | 'Sudah Bayar';
  paidAt?: string;
  notes?: string;
}

export interface Match {
  id: string;
  communityId: string;
  title: string;
  date: string; // YYYY-MM-DD
  kickoffTime: string; // HH:mm
  endTime: string; // HH:mm
  venue: string;
  address: string;
  mapUrl?: string;
  standardFee: number;
  playerQuota: number;
  status: MatchStatus;
  cancellationDeadline: string; // ISO string atau YYYY-MM-DDTHH:mm
  notes?: string;
  createdBy: string;
  createdAt: string;
  // Fotografer / Media
  photographerAvailable: boolean;
  photographerName?: string;
  photographerFee?: number;
  albumUrl?: string;
  // Rekening pembayaran info
  paymentBankName?: string;
  paymentAccountNumber?: string;
  paymentAccountHolder?: string;
  // Status penutupan finansial / surplus dialokasikan ke kas
  cashSettled?: boolean;
}

export interface MatchProposal {
  id: string;
  communityId: string;
  requestedBy: string; // userId atau memberId
  requesterName: string;
  requestedDate: string;
  requestedTime: string;
  suggestedVenue: string;
  estimatedPlayers: number;
  notes?: string;
  status: ProposalStatus;
  reviewedBy?: string;
  reviewedAt?: string;
  adminNotes?: string;
  createdMatchId?: string;
  createdAt: string;
}

export interface MembershipRequest {
  id: string;
  communityId: string;
  userId: string;
  userName: string;
  userEmail: string;
  notes?: string;
  position?: 'Kiper' | 'Bek' | 'Gelandang' | 'Penyerang' | 'All-Rounder';
  jerseyNumber?: number;
  status: 'Menunggu Persetujuan' | 'Disetujui' | 'Ditolak';
  createdAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
}

export interface Sponsor {
  id: string;
  communityId: string;
  name: string;
  logo?: string;
  contact?: string;
  notes?: string;
  createdAt: string;
}

export interface CashTransaction {
  id: string;
  communityId: string;
  type: CashTransactionType;
  category: CashCategory;
  amount: number;
  matchId?: string;
  description: string;
  date: string;
  sourceId?: string;
  createdBy: string;
}

export interface JerseyProgram {
  id: string;
  communityId: string;
  name: string;
  description: string;
  orderDeadline: string;
  status: 'Buka Pemesanan' | 'Produksi' | 'Selesai';
  basePrice: number;
  imageUrl?: string;
  notes?: string;
  createdAt: string;
}

export interface JerseyOrder {
  id: string;
  programId: string;
  memberId: string;
  memberName: string;
  size: 'S' | 'M' | 'L' | 'XL' | '2XL' | '3XL';
  quantity: number;
  playerName: string;
  jerseyNumber: number;
  totalAmount: number;
  paidAmount: number;
  paymentStatus: JerseyPaymentStatus;
  notes?: string;
  orderedAt: string;
}

export interface JerseySponsor {
  id: string;
  programId: string;
  sponsorId: string;
  amount: number;
  paymentStatus: 'Belum Bayar' | 'Sudah Bayar';
  paidAt?: string;
  notes?: string;
}

export interface PenaltyRecord {
  id: string;
  userId: string;
  userName: string;
  communityId: string;
  attempts: number;
  goals: number;
  saves: number;
  score: number;
  highestStreak: number;
  playedAt: string;
}

export interface AppNotification {
  id: string;
  userId?: string; // null jika untuk semua komunitas
  communityId: string;
  title: string;
  message: string;
  type: 'match' | 'proposal' | 'payment' | 'jersey' | 'system';
  read: boolean;
  createdAt: string;
}

// Support of the match payload
export interface SupportAppreciation {
  playerName: string;
  amount: number;
  standardFee: number;
  extraContribution: number;
  message?: string;
}
