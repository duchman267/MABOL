// LocalStorage persistence service for MABOL
import {
  INITIAL_COMMUNITIES,
  INITIAL_USERS,
  INITIAL_MEMBERS,
  INITIAL_MATCHES,
  INITIAL_PARTICIPANTS,
  INITIAL_PAYMENTS,
  INITIAL_EXPENSES,
  INITIAL_ADDONS,
  INITIAL_SPONSORS,
  INITIAL_MATCH_SPONSORSHIPS,
  INITIAL_CASH_TRANSACTIONS,
  INITIAL_PROPOSALS,
  INITIAL_JERSEY_PROGRAMS,
  INITIAL_JERSEY_ORDERS,
  INITIAL_PENALTY_RECORDS,
  INITIAL_NOTIFICATIONS,
} from '../data/seedData';
import {
  Community,
  User,
  Member,
  Match,
  MatchParticipant,
  PaymentRecord,
  MatchExpense,
  MatchAddOn,
  Sponsor,
  MatchSponsorship,
  CashTransaction,
  MatchProposal,
  MembershipRequest,
  JerseyProgram,
  JerseyOrder,
  PenaltyRecord,
  AppNotification,
} from '../types';

export interface AppDatabase {
  communities: Community[];
  users: User[];
  members: Member[];
  matches: Match[];
  participants: MatchParticipant[];
  payments: PaymentRecord[];
  expenses: MatchExpense[];
  addOns: MatchAddOn[];
  sponsors: Sponsor[];
  matchSponsorships: MatchSponsorship[];
  cashTransactions: CashTransaction[];
  proposals: MatchProposal[];
  membershipRequests: MembershipRequest[];
  jerseyPrograms: JerseyProgram[];
  jerseyOrders: JerseyOrder[];
  penaltyRecords: PenaltyRecord[];
  notifications: AppNotification[];
  currentUserId: string;
  activeCommunityId: string;
}

const STORAGE_KEY = 'mabol_app_database_v8';

export function getInitialDatabase(): AppDatabase {
  return {
    communities: INITIAL_COMMUNITIES,
    users: INITIAL_USERS,
    members: INITIAL_MEMBERS,
    matches: INITIAL_MATCHES,
    participants: INITIAL_PARTICIPANTS,
    payments: INITIAL_PAYMENTS,
    expenses: INITIAL_EXPENSES,
    addOns: INITIAL_ADDONS,
    sponsors: INITIAL_SPONSORS,
    matchSponsorships: INITIAL_MATCH_SPONSORSHIPS,
    cashTransactions: INITIAL_CASH_TRANSACTIONS,
    proposals: INITIAL_PROPOSALS,
    membershipRequests: [],
    jerseyPrograms: INITIAL_JERSEY_PROGRAMS,
    jerseyOrders: INITIAL_JERSEY_ORDERS,
    penaltyRecords: INITIAL_PENALTY_RECORDS,
    notifications: INITIAL_NOTIFICATIONS,
    currentUserId: 'usr-admin-dicky', // Admin: Dicky Maulana
    activeCommunityId: 'comm-ck17', // Cornerkick17 OLAHGAYA
  };
}

export function loadDatabase(): AppDatabase {
  try {
    // Hapus seluruh database versi demo lama jika ada
    if (typeof localStorage !== 'undefined') {
      const legacyKeys = [
        'mabol_app_database_v1',
        'mabol_app_database_v2',
        'mabol_app_database_v3',
        'mabol_app_database_v4',
        'mabol_app_database_v5',
        'mabol_app_database_v6',
        'mabol_app_database_v7',
      ];
      for (const k of legacyKeys) {
        localStorage.removeItem(k);
      }
    }

    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
    if (!raw) {
      const initial = getInitialDatabase();
      saveDatabase(initial);
      return initial;
    }
    const parsed = JSON.parse(raw);

    // Filter & bersihkan anggota demo jika ada yang terbawa
    const demoNames = [
      'epul',
      'boss epul',
      'xherdan',
      'ghaisan',
      'abah',
      'ayah kazeo',
      'bapa ari',
      'ayah haikal',
    ];

    if (Array.isArray(parsed.members)) {
      parsed.members = parsed.members.filter((m: Member) => {
        const nick = (m.nickname || '').toLowerCase();
        return !demoNames.some((d) => nick.includes(d));
      });
    }

    // Pastikan Dicky Maulana selalu ada sebagai admin resmi
    const adminMemberExists = parsed.members && parsed.members.some((m: Member) => m.userId === 'usr-admin-dicky');
    if (!adminMemberExists) {
      parsed.members = [INITIAL_MEMBERS[0], ...(parsed.members || [])];
    }

    // Pastikan transaksi Kas Awal Rp145.000 selalu tersedia dan transaksi demo dibersihkan
    if (Array.isArray(parsed.cashTransactions)) {
      parsed.cashTransactions = parsed.cashTransactions.filter(
        (t: CashTransaction) => t.id !== 'trx-1' && t.id !== 'trx-up-pay-1'
      );
      const openingExists = parsed.cashTransactions.some((t: CashTransaction) => t.category === 'Kas Awal' && t.amount === 145000);
      if (!openingExists) {
        parsed.cashTransactions = [INITIAL_CASH_TRANSACTIONS[0], ...parsed.cashTransactions];
      }
    } else {
      parsed.cashTransactions = INITIAL_CASH_TRANSACTIONS;
    }

    // Pastikan membershipRequests terinisialisasi
    if (!Array.isArray(parsed.membershipRequests)) {
      parsed.membershipRequests = [];
    }

    // Simpan hasil pembersihan
    saveDatabase(parsed);
    return parsed;
  } catch (err) {
    console.error('Gagal memuat database lokal, mengembalikan kondisi awal bersih:', err);
    const initial = getInitialDatabase();
    saveDatabase(initial);
    return initial;
  }
}

export function saveDatabase(data: AppDatabase): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (err) {
    console.error('Gagal menyimpan ke localStorage:', err);
  }
}

export function resetDatabaseToDefault(): AppDatabase {
  const initial = getInitialDatabase();
  saveDatabase(initial);
  return initial;
}
