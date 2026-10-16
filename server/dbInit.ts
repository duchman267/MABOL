import { db } from '../src/db/index.ts';
import {
  communities,
  accounts,
  communityMemberships,
  communityMembers,
  cashTransactions,
  jerseyPrograms,
} from '../src/db/schema.ts';
import { eq, and } from 'drizzle-orm';
import { hashPassword } from './auth.ts';

export async function seedInitialDatabaseIfEmpty(): Promise<void> {
  try {
    // 1. Ensure initial community exists
    const [existingComm] = await db
      .select({ id: communities.id })
      .from(communities)
      .where(eq(communities.id, 'comm-ck17'))
      .limit(1);

    if (!existingComm) {
      console.log('[DB Init] Seeding default community Cornerkick17 OLAHGAYA...');
      await db.insert(communities).values({
        id: 'comm-ck17',
        name: 'Cornerkick17 OLAHGAYA',
        description: 'Komunitas Sepak Bola & Mini Soccer Cornerkick17 OLAHGAYA',
        primaryColor: '#1261FF',
        status: 'Aktif',
      }).onConflictDoNothing();
    }

    // 2. Ensure admin Dicky Maulana exists
    const adminEmail = 'dickymaulanazayn@gmail.com';
    const [existingAdmin] = await db
      .select({ id: accounts.id })
      .from(accounts)
      .where(eq(accounts.email, adminEmail))
      .limit(1);

    const salt = 'seed_salt_ck17';
    const passwordHash = hashPassword('password123', salt);

    if (!existingAdmin) {
      console.log('[DB Init] Seeding default admin account usr-admin-dicky...');
      await db.insert(accounts).values({
        id: 'usr-admin-dicky',
        name: 'Dicky Maulana',
        email: adminEmail,
        passwordHash,
        passwordSalt: salt,
        status: 'ACTIVE',
      }).onConflictDoNothing();
    }

    // 3. Ensure admin membership exists
    const [existingMembership] = await db
      .select({ id: communityMemberships.id })
      .from(communityMemberships)
      .where(eq(communityMemberships.userId, 'usr-admin-dicky'))
      .limit(1);

    if (!existingMembership) {
      console.log('[DB Init] Seeding admin membership for usr-admin-dicky in comm-ck17...');
      await db.insert(communityMemberships).values({
        userId: 'usr-admin-dicky',
        communityId: 'comm-ck17',
        role: 'ADMIN',
        status: 'AKTIF',
        displayName: 'Dicky Maulana',
        position: 'Gelandang',
        jerseyNumber: 17,
      }).onConflictDoNothing();
    }

    // 4. Ensure Dicky Maulana exists in community_members
    const [existingMemberRecord] = await db
      .select({ id: communityMembers.id })
      .from(communityMembers)
      .where(eq(communityMembers.id, 'mem-admin'))
      .limit(1);

    if (!existingMemberRecord) {
      console.log('[DB Init] Seeding founding admin member mem-admin in community_members...');
      await db.insert(communityMembers).values({
        id: 'mem-admin',
        communityId: 'comm-ck17',
        accountId: 'usr-admin-dicky',
        nickname: 'Dicky Maulana',
        fullName: 'Dicky Maulana',
        phone: '081234567890',
        whatsapp: '081234567890',
        email: adminEmail,
        position: 'Gelandang',
        jerseyNumber: 17,
        role: 'admin',
        status: 'Aktif',
        memberType: 'REGISTERED',
      }).onConflictDoNothing();
    }

    // 4b. Sync approved community memberships into community_members
    const activeMemberships = await db
      .select()
      .from(communityMemberships)
      .where(eq(communityMemberships.status, 'AKTIF'));

    for (const m of activeMemberships) {
      const [existingCm] = await db
        .select({ id: communityMembers.id })
        .from(communityMembers)
        .where(
          and(
            eq(communityMembers.communityId, m.communityId),
            eq(communityMembers.accountId, m.userId)
          )
        )
        .limit(1);

      if (!existingCm) {
        console.log(`[DB Init] Backfilling community_members for active account ${m.userId} (${m.displayName})...`);
        const [acc] = await db
          .select({ email: accounts.email, name: accounts.name })
          .from(accounts)
          .where(eq(accounts.id, m.userId))
          .limit(1);

        await db.insert(communityMembers).values({
          id: `mem-${m.userId}`,
          communityId: m.communityId,
          accountId: m.userId,
          nickname: m.displayName || acc?.name || 'Anggota',
          fullName: m.displayName || acc?.name || 'Anggota',
          whatsapp: '',
          email: acc?.email || null,
          position: m.position || 'Gelandang',
          jerseyNumber: m.jerseyNumber || 10,
          role: m.role.toLowerCase() === 'admin' ? 'admin' : 'member',
          status: 'Aktif',
          memberType: 'REGISTERED',
        }).onConflictDoNothing();
      }
    }

    // 5. Ensure Kas Awal Rp145.000 exists in cash_transactions (SINGLE SOURCE OF TRUTH)
    const [existingOpeningTrx] = await db
      .select({ id: cashTransactions.id })
      .from(cashTransactions)
      .where(eq(cashTransactions.id, 'trx-opening-1'))
      .limit(1);

    if (!existingOpeningTrx) {
      console.log('[DB Init] Seeding initial cash ledger record trx-opening-1 (Rp145.000)...');
      await db.insert(cashTransactions).values({
        id: 'trx-opening-1',
        communityId: 'comm-ck17',
        type: 'Pemasukan',
        category: 'Kas Awal',
        amount: 145000,
        description: 'KAS AWAL MABOL',
        createdBy: 'Dicky Maulana',
        idempotencyKey: 'init-comm-ck17-opening-balance',
      }).onConflictDoNothing();
    }

    // 6. Ensure default Jersey Program exists
    const [existingJerseyProg] = await db
      .select({ id: jerseyPrograms.id })
      .from(jerseyPrograms)
      .where(eq(jerseyPrograms.id, 'jp-1'))
      .limit(1);

    if (!existingJerseyProg) {
      console.log('[DB Init] Seeding default jersey program jp-1...');
      await db.insert(jerseyPrograms).values({
        id: 'jp-1',
        communityId: 'comm-ck17',
        name: 'Jersey Resmi Cornerkick17 2026 (Home & Away)',
        description: 'Kain Dri-Fit Milano Sublimasi Premium. Anti-bakteri, adem, logo flock 3D, lengkap dengan nama & nomor punggung.',
        orderDeadline: '2026-10-31',
        status: 'Buka Pemesanan',
        basePrice: 135000,
        notes: 'Pembayaran DP minimal 50.000 atau lunas.',
      }).onConflictDoNothing();
    }

    console.log('[DB Init] Operational database seed verification complete.');
  } catch (err: any) {
    console.warn('[DB Init] Could not seed database (database may not be ready yet):', err?.message || err);
  }
}
