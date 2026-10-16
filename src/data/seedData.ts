import {
  Community,
  User,
  Member,
  Match,
  MatchParticipant,
  PaymentRecord,
  MatchExpense,
  MatchAddOn,
  MatchSponsorship,
  MatchProposal,
  Sponsor,
  CashTransaction,
  JerseyProgram,
  JerseyOrder,
  PenaltyRecord,
  AppNotification,
} from '../types';

export const INITIAL_COMMUNITIES: Community[] = [
  {
    id: 'comm-ck17',
    name: 'Cornerkick17 OLAHGAYA',
    description: 'Komunitas Sepak Bola & Olahraga Guyub Bandung Selatan. Menjunjung sportivitas, persaudaraan, dan gaya hidup sehat.',
    primaryColor: '#1261FF',
    status: 'Aktif',
    createdAt: '2026-01-10T10:00:00Z',
  },
];

export const INITIAL_USERS: User[] = [
  {
    id: 'usr-admin-dicky',
    name: 'Dicky Maulana',
    email: 'dickymaulanazayn@gmail.com',
    phone: '081234567890',
    status: 'Aktif',
    createdAt: '2026-01-01T00:00:00Z',
  },
];

export const INITIAL_MEMBERS: Member[] = [
  {
    id: 'mem-admin',
    communityId: 'comm-ck17',
    userId: 'usr-admin-dicky',
    nickname: 'Dicky Maulana',
    fullName: 'Dicky Maulana',
    phone: '081234567890',
    whatsapp: '081234567890',
    email: 'dickymaulanazayn@gmail.com',
    position: 'Gelandang',
    jerseyNumber: 17,
    role: 'admin',
    status: 'Aktif',
    memberType: 'REGISTERED',
    joinedAt: '2026-01-01',
  },
];

export const INITIAL_MATCHES: Match[] = [];

export const INITIAL_PARTICIPANTS: MatchParticipant[] = [];

export const INITIAL_PAYMENTS: PaymentRecord[] = [];

export const INITIAL_EXPENSES: MatchExpense[] = [];

export const INITIAL_ADDONS: MatchAddOn[] = [];

export const INITIAL_SPONSORS: Sponsor[] = [];

export const INITIAL_MATCH_SPONSORSHIPS: MatchSponsorship[] = [];

// Buku Kas Komunitas: Sumber kebenaran finansial (Saldo Awal Rp145.000)
export const INITIAL_CASH_TRANSACTIONS: CashTransaction[] = [
  {
    id: 'trx-opening-1',
    communityId: 'comm-ck17',
    type: 'Pemasukan',
    category: 'Kas Awal',
    amount: 145000,
    description: 'KAS AWAL MABOL',
    date: '2026-10-01T00:00:00Z',
    createdBy: 'Dicky Maulana',
  },
];

export const INITIAL_PROPOSALS: MatchProposal[] = [];

export const INITIAL_JERSEY_PROGRAMS: JerseyProgram[] = [
  {
    id: 'jp-1',
    communityId: 'comm-ck17',
    name: 'Jersey Resmi Cornerkick17 2026 (Home & Away)',
    description: 'Kain Dri-Fit Milano Sublimasi Premium. Anti-bakteri, adem, logo flock 3D, lengkap dengan nama & nomor punggung.',
    orderDeadline: '2026-10-31',
    status: 'Buka Pemesanan',
    basePrice: 135000,
    notes: 'Pembayaran DP minimal 50.000 atau lunas.',
    createdAt: '2026-08-15T00:00:00Z',
  },
];

export const INITIAL_JERSEY_ORDERS: JerseyOrder[] = [];

export const INITIAL_PENALTY_RECORDS: PenaltyRecord[] = [];

export const INITIAL_NOTIFICATIONS: AppNotification[] = [];
