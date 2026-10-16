import { pgTable, text, timestamp, serial, integer, boolean, uniqueIndex, index } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

// 1. Communities Table
export const communities = pgTable('communities', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  primaryColor: text('primary_color').default('#1261FF'),
  status: text('status').notNull().default('Aktif'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// 2. Centralized User Accounts Table
export const accounts = pgTable('accounts', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  passwordSalt: text('password_salt').notNull(),
  status: text('status').notNull().default('ACTIVE'), // ACTIVE | DISABLED
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// 3. Community Memberships Table (Auth & Centralized RBAC)
export const communityMemberships = pgTable(
  'community_memberships',
  {
    id: serial('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => accounts.id, { onDelete: 'cascade' }),
    communityId: text('community_id')
      .notNull()
      .references(() => communities.id, { onDelete: 'cascade' }),
    role: text('role').notNull().default('MEMBER'), // ADMIN | MEMBER
    status: text('status').notNull().default('AKTIF'), // AKTIF | NONAKTIF
    displayName: text('display_name').notNull(),
    position: text('position').default('Gelandang'),
    jerseyNumber: integer('jersey_number').default(10),
    joinedAt: timestamp('joined_at', { withTimezone: true }).defaultNow().notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('user_community_unique_idx').on(table.userId, table.communityId),
  ]
);

// 4. Membership Requests Table
export const membershipRequests = pgTable(
  'membership_requests',
  {
    id: text('id').primaryKey(),
    communityId: text('community_id')
      .notNull()
      .references(() => communities.id, { onDelete: 'cascade' }),
    userId: text('user_id')
      .notNull()
      .references(() => accounts.id, { onDelete: 'cascade' }),
    userName: text('user_name').notNull(),
    userEmail: text('user_email').notNull(),
    position: text('position').notNull().default('Gelandang'),
    jerseyNumber: integer('jersey_number').notNull().default(10),
    notes: text('notes'),
    status: text('status').notNull().default('pending'), // pending | approved | rejected
    reviewedBy: text('reviewed_by').references(() => accounts.id),
    reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
    adminNotes: text('admin_notes'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('unique_pending_request_idx')
      .on(table.userId, table.communityId)
      .where(sql`status = 'pending'`),
  ]
);

// 5. Community Members (Full Profile & Manual Members without login accounts)
export const communityMembers = pgTable(
  'community_members',
  {
    id: text('id').primaryKey(),
    communityId: text('community_id')
      .notNull()
      .references(() => communities.id, { onDelete: 'cascade' }),
    accountId: text('account_id').references(() => accounts.id, { onDelete: 'set null' }), // NULL for manual members!
    nickname: text('nickname').notNull(),
    fullName: text('full_name').notNull(),
    phone: text('phone'),
    whatsapp: text('whatsapp').notNull(),
    email: text('email'),
    position: text('position').notNull().default('Gelandang'),
    jerseyNumber: integer('jersey_number').notNull().default(0),
    role: text('role').notNull().default('member'), // admin | member
    status: text('status').notNull().default('Aktif'), // Aktif | Nonaktif
    memberType: text('member_type').notNull().default('MANUAL'), // REGISTERED | MANUAL
    photoUrl: text('photo_url'),
    joinedAt: timestamp('joined_at', { withTimezone: true }).defaultNow().notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('idx_members_community').on(table.communityId),
    index('idx_members_account').on(table.accountId),
    index('idx_members_whatsapp').on(table.communityId, table.whatsapp),
  ]
);

// 6. Matches Table
export const matches = pgTable(
  'matches',
  {
    id: text('id').primaryKey(),
    communityId: text('community_id')
      .notNull()
      .references(() => communities.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    date: text('date').notNull(), // YYYY-MM-DD
    kickoffTime: text('kickoff_time').notNull(), // HH:mm
    endTime: text('end_time').notNull(), // HH:mm
    venue: text('venue').notNull(),
    address: text('address').notNull(),
    mapUrl: text('map_url'),
    standardFee: integer('standard_fee').notNull().default(35000),
    playerQuota: integer('player_quota').notNull().default(20),
    status: text('status').notNull().default('Draft'), // Draft | Aktif | Selesai | Dibatalkan
    cancellationDeadline: text('cancellation_deadline').notNull(),
    photographerAvailable: boolean('photographer_available').notNull().default(false),
    photographerName: text('photographer_name'),
    photographerFee: integer('photographer_fee').default(0),
    albumUrl: text('album_url'),
    paymentBankName: text('payment_bank_name'),
    paymentAccountNumber: text('payment_account_number'),
    paymentAccountHolder: text('payment_account_holder'),
    cashSettled: boolean('cash_settled').notNull().default(false),
    notes: text('notes'),
    createdBy: text('created_by').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('idx_matches_community_date').on(table.communityId, table.date),
    index('idx_matches_status').on(table.communityId, table.status),
  ]
);

// 7. Match Proposals Table
export const matchProposals = pgTable(
  'match_proposals',
  {
    id: text('id').primaryKey(),
    communityId: text('community_id')
      .notNull()
      .references(() => communities.id, { onDelete: 'cascade' }),
    requestedBy: text('requested_by').notNull(),
    requesterName: text('requester_name').notNull(),
    requestedDate: text('requested_date').notNull(),
    requestedTime: text('requested_time').notNull(),
    suggestedVenue: text('suggested_venue').notNull(),
    estimatedPlayers: integer('estimated_players').notNull().default(20),
    notes: text('notes'),
    status: text('status').notNull().default('Menunggu Persetujuan'), // Menunggu Persetujuan | Disetujui | Ditolak
    reviewedBy: text('reviewed_by'),
    reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
    adminNotes: text('admin_notes'),
    createdMatchId: text('created_match_id').references(() => matches.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('idx_proposals_community_status').on(table.communityId, table.status),
  ]
);

// 8. Match Participants Table
export const matchParticipants = pgTable(
  'match_participants',
  {
    id: text('id').primaryKey(),
    matchId: text('match_id')
      .notNull()
      .references(() => matches.id, { onDelete: 'cascade' }),
    memberId: text('member_id').references(() => communityMembers.id, { onDelete: 'set null' }),
    participantType: text('participant_type').notNull().default('Anggota'), // Anggota | Guest
    guestName: text('guest_name'),
    guestPhone: text('guest_phone'),
    rsvpStatus: text('rsvp_status').notNull().default('Menunggu'), // Menunggu | Ikut | Batal
    attendanceStatus: text('attendance_status').notNull().default('Belum Dicek'), // Belum Dicek | Hadir | Tidak Hadir
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('idx_participants_match').on(table.matchId),
    uniqueIndex('idx_unique_match_member').on(table.matchId, table.memberId).where(sql`member_id IS NOT NULL`),
  ]
);

// 9. Match Payments Table
export const matchPayments = pgTable(
  'match_payments',
  {
    id: text('id').primaryKey(),
    matchId: text('match_id')
      .notNull()
      .references(() => matches.id, { onDelete: 'cascade' }),
    participantId: text('participant_id')
      .notNull()
      .references(() => matchParticipants.id, { onDelete: 'cascade' }),
    standardFee: integer('standard_fee').notNull(),
    amount: integer('amount').notNull().default(0),
    extraContribution: integer('extra_contribution').notNull().default(0),
    method: text('method').notNull().default('Transfer'), // Transfer | Tunai | Lainnya
    status: text('status').notNull().default('Belum Bayar'), // Belum Bayar | Bayar Sebagian | Sudah Bayar
    paidAt: timestamp('paid_at', { withTimezone: true }),
    recordedBy: text('recorded_by').notNull(),
    notes: text('notes'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('idx_payment_participant').on(table.participantId),
    index('idx_payments_match').on(table.matchId),
  ]
);

// 10. Payment Installments (Partial payment history log)
export const paymentInstallments = pgTable(
  'payment_installments',
  {
    id: text('id').primaryKey(),
    paymentId: text('payment_id')
      .notNull()
      .references(() => matchPayments.id, { onDelete: 'cascade' }),
    installmentNumber: integer('installment_number').notNull().default(1),
    amount: integer('amount').notNull(),
    method: text('method').notNull().default('Transfer'),
    paidAt: timestamp('paid_at', { withTimezone: true }).defaultNow().notNull(),
    recordedBy: text('recorded_by').notNull(),
    notes: text('notes'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('idx_installments_payment').on(table.paymentId),
  ]
);

// 11. Match Expenses Table
export const matchExpenses = pgTable(
  'match_expenses',
  {
    id: text('id').primaryKey(),
    matchId: text('match_id')
      .notNull()
      .references(() => matches.id, { onDelete: 'cascade' }),
    communityId: text('community_id')
      .notNull()
      .references(() => communities.id, { onDelete: 'cascade' }),
    category: text('category').notNull().default('Lapangan'), // Lapangan | Photographer | Add-on | Operasional | Lainnya
    name: text('name').notNull(),
    quantity: integer('quantity').notNull().default(1),
    unitPrice: integer('unit_price').notNull().default(0),
    total: integer('total').notNull().default(0),
    paidAt: timestamp('paid_at', { withTimezone: true }),
    notes: text('notes'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('idx_expenses_match').on(table.matchId),
    index('idx_expenses_community').on(table.communityId),
  ]
);

// 12. Match AddOns Table
export const matchAddOns = pgTable(
  'match_addons',
  {
    id: text('id').primaryKey(),
    matchId: text('match_id')
      .notNull()
      .references(() => matches.id, { onDelete: 'cascade' }),
    communityId: text('community_id')
      .notNull()
      .references(() => communities.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    category: text('category').notNull().default('Konsumsi'),
    quantity: integer('quantity').notNull().default(1),
    unitPrice: integer('unit_price').notNull().default(0),
    total: integer('total').notNull().default(0),
    notes: text('notes'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('idx_addons_match').on(table.matchId),
    index('idx_addons_community').on(table.communityId),
  ]
);

// 13. Sponsors Table
export const sponsors = pgTable('sponsors', {
  id: text('id').primaryKey(),
  communityId: text('community_id')
    .notNull()
    .references(() => communities.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  logo: text('logo'),
  contact: text('contact'),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// 14. Match Sponsorships Table
export const matchSponsorships = pgTable(
  'match_sponsorships',
  {
    id: text('id').primaryKey(),
    matchId: text('match_id')
      .notNull()
      .references(() => matches.id, { onDelete: 'cascade' }),
    sponsorId: text('sponsor_id')
      .notNull()
      .references(() => sponsors.id, { onDelete: 'cascade' }),
    amount: integer('amount').notNull().default(0),
    paymentStatus: text('payment_status').notNull().default('Belum Bayar'),
    paidAt: timestamp('paid_at', { withTimezone: true }),
    notes: text('notes'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('idx_sponsorships_match').on(table.matchId),
  ]
);

// 15. Community Cash Ledger (Transactions Table)
export const cashTransactions = pgTable(
  'cash_transactions',
  {
    id: text('id').primaryKey(),
    communityId: text('community_id')
      .notNull()
      .references(() => communities.id, { onDelete: 'restrict' }),
    type: text('type').notNull(), // Pemasukan | Pengeluaran
    category: text('category').notNull(), // Match | Sponsor | Jersey | Operasional | Kas Awal | Lainnya
    amount: integer('amount').notNull(),
    matchId: text('match_id').references(() => matches.id, { onDelete: 'set null' }),
    sourceId: text('source_id'),
    idempotencyKey: text('idempotency_key').unique(),
    description: text('description').notNull(),
    date: timestamp('date', { withTimezone: true }).defaultNow().notNull(),
    createdBy: text('created_by').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('idx_cash_trx_community_date').on(table.communityId, table.date),
    index('idx_cash_trx_match').on(table.matchId),
    uniqueIndex('idx_cash_idempotency').on(table.idempotencyKey),
  ]
);

// 16. Jersey Programs Table
export const jerseyPrograms = pgTable('jersey_programs', {
  id: text('id').primaryKey(),
  communityId: text('community_id')
    .notNull()
    .references(() => communities.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  description: text('description').notNull(),
  orderDeadline: text('order_deadline').notNull(),
  status: text('status').notNull().default('Buka Pemesanan'),
  basePrice: integer('base_price').notNull().default(135000),
  imageUrl: text('image_url'),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// 17. Jersey Orders Table
export const jerseyOrders = pgTable(
  'jersey_orders',
  {
    id: text('id').primaryKey(),
    programId: text('program_id')
      .notNull()
      .references(() => jerseyPrograms.id, { onDelete: 'cascade' }),
    communityId: text('community_id')
      .notNull()
      .references(() => communities.id, { onDelete: 'cascade' }),
    memberId: text('member_id').references(() => communityMembers.id, { onDelete: 'set null' }),
    memberName: text('member_name').notNull(),
    size: text('size').notNull().default('L'),
    quantity: integer('quantity').notNull().default(1),
    playerName: text('player_name').notNull(),
    jerseyNumber: integer('jersey_number').notNull().default(0),
    totalAmount: integer('total_amount').notNull().default(0),
    paidAmount: integer('paid_amount').notNull().default(0),
    paymentStatus: text('payment_status').notNull().default('Belum Bayar'),
    notes: text('notes'),
    orderedAt: timestamp('ordered_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('idx_jersey_orders_program').on(table.programId),
    index('idx_jersey_orders_community').on(table.communityId),
  ]
);

// 18. Penalty Records Table
export const penaltyRecords = pgTable(
  'penalty_records',
  {
    id: text('id').primaryKey(),
    communityId: text('community_id')
      .notNull()
      .references(() => communities.id, { onDelete: 'cascade' }),
    userId: text('user_id').notNull(),
    userName: text('user_name').notNull(),
    attempts: integer('attempts').notNull().default(0),
    goals: integer('goals').notNull().default(0),
    saves: integer('saves').notNull().default(0),
    score: integer('score').notNull().default(0),
    highestStreak: integer('highest_streak').notNull().default(0),
    playedAt: timestamp('played_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('idx_penalty_user_comm').on(table.communityId, table.userId),
  ]
);

// 19. Notifications Table
export const notifications = pgTable('notifications', {
  id: text('id').primaryKey(),
  communityId: text('community_id')
    .notNull()
    .references(() => communities.id, { onDelete: 'cascade' }),
  userId: text('user_id'),
  title: text('title').notNull(),
  message: text('message').notNull(),
  type: text('type').notNull().default('system'),
  read: boolean('read').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// 20. Migration Snapshots Table (for preview vs published backup isolation)
export const migrationSnapshots = pgTable('migration_snapshots', {
  id: text('id').primaryKey(),
  environment: text('environment').notNull(), // 'preview' | 'published'
  version: text('version').notNull().default('v8'),
  snapshotData: text('snapshot_data').notNull(),
  status: text('status').notNull().default('captured'), // 'captured' | 'dry_run_passed' | 'reconciled' | 'committed'
  recordCount: integer('record_count').notNull().default(0),
  projectedBalance: integer('projected_balance').notNull().default(145000),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// Export Infer Types
export type Account = typeof accounts.$inferSelect;
export type NewAccount = typeof accounts.$inferInsert;
export type CommunityMembership = typeof communityMemberships.$inferSelect;
export type NewCommunityMembership = typeof communityMemberships.$inferInsert;
export type MembershipRequest = typeof membershipRequests.$inferSelect;
export type NewMembershipRequest = typeof membershipRequests.$inferInsert;
export type CommunityMember = typeof communityMembers.$inferSelect;
export type NewCommunityMember = typeof communityMembers.$inferInsert;
export type Match = typeof matches.$inferSelect;
export type NewMatch = typeof matches.$inferInsert;
export type MatchProposal = typeof matchProposals.$inferSelect;
export type NewMatchProposal = typeof matchProposals.$inferInsert;
export type MatchParticipant = typeof matchParticipants.$inferSelect;
export type NewMatchParticipant = typeof matchParticipants.$inferInsert;
export type MatchPayment = typeof matchPayments.$inferSelect;
export type NewMatchPayment = typeof matchPayments.$inferInsert;
export type PaymentInstallment = typeof paymentInstallments.$inferSelect;
export type NewPaymentInstallment = typeof paymentInstallments.$inferInsert;
export type MatchExpense = typeof matchExpenses.$inferSelect;
export type NewMatchExpense = typeof matchExpenses.$inferInsert;
export type MatchAddOn = typeof matchAddOns.$inferSelect;
export type NewMatchAddOn = typeof matchAddOns.$inferInsert;
export type CashTransaction = typeof cashTransactions.$inferSelect;
export type NewCashTransaction = typeof cashTransactions.$inferInsert;
export type JerseyProgram = typeof jerseyPrograms.$inferSelect;
export type NewJerseyProgram = typeof jerseyPrograms.$inferInsert;
export type JerseyOrder = typeof jerseyOrders.$inferSelect;
export type NewJerseyOrder = typeof jerseyOrders.$inferInsert;
export type PenaltyRecord = typeof penaltyRecords.$inferSelect;
export type NewPenaltyRecord = typeof penaltyRecords.$inferInsert;
export type AppNotification = typeof notifications.$inferSelect;
export type NewAppNotification = typeof notifications.$inferInsert;
export type MigrationSnapshot = typeof migrationSnapshots.$inferSelect;
export type NewMigrationSnapshot = typeof migrationSnapshots.$inferInsert;
