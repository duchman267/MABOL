import { Router, type Response } from 'express';
import { db } from '../../src/db/index.ts';
import {
  migrationSnapshots,
  cashTransactions,
  communityMembers,
  matches,
  matchParticipants,
} from '../../src/db/schema.ts';
import { eq } from 'drizzle-orm';
import { requireAuth, requireCommunityAdmin, type AuthenticatedRequest } from '../auth.ts';
import crypto from 'crypto';

export const migrationRouter = Router();

// 1. POST /api/migration/snapshot - Save client localStorage snapshot (isolated Preview vs Published)
migrationRouter.post(
  '/snapshot',
  requireAuth,
  requireCommunityAdmin(),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { environment = 'preview', snapshotData, notes } = req.body;

      if (!['preview', 'published'].includes(environment)) {
        res.status(400).json({ error: 'Environment harus preview atau published.' });
        return;
      }

      if (!snapshotData || typeof snapshotData !== 'object') {
        res.status(400).json({ error: 'Payload snapshotData wajib berupa JSON object.' });
        return;
      }

      const snapId = `snap-${environment}-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
      const serialized = JSON.stringify(snapshotData);

      let recordCount = 0;
      if (Array.isArray(snapshotData.members)) recordCount += snapshotData.members.length;
      if (Array.isArray(snapshotData.matches)) recordCount += snapshotData.matches.length;
      if (Array.isArray(snapshotData.participants)) recordCount += snapshotData.participants.length;
      if (Array.isArray(snapshotData.payments)) recordCount += snapshotData.payments.length;
      if (Array.isArray(snapshotData.cashTransactions)) recordCount += snapshotData.cashTransactions.length;

      const [snapshot] = await db
        .insert(migrationSnapshots)
        .values({
          id: snapId,
          environment,
          version: 'v8',
          snapshotData: serialized,
          status: 'captured',
          recordCount,
          projectedBalance: 145000,
          notes: notes?.trim() || `Snapshot captured from ${environment}`,
        })
        .returning();

      res.status(201).json({
        success: true,
        message: `Snapshot cadangan ${environment} berhasil disimpan secara terisolasi di database.`,
        snapshot: {
          id: snapshot.id,
          environment: snapshot.environment,
          recordCount: snapshot.recordCount,
          createdAt: snapshot.createdAt,
        },
      });
    } catch (err: any) {
      console.error('[API migration] Error capturing snapshot:', err);
      res.status(500).json({ error: 'Gagal menyimpan snapshot migrasi.' });
    }
  }
);

// 2. POST /api/migration/dry-run - Comprehensive Dry-Run verification without committing data
migrationRouter.post(
  '/dry-run',
  requireAuth,
  requireCommunityAdmin(),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { snapshotData } = req.body;

      if (!snapshotData || typeof snapshotData !== 'object') {
        res.status(400).json({ error: 'Payload snapshotData wajib disertakan.' });
        return;
      }

      const members = Array.isArray(snapshotData.members) ? snapshotData.members : [];
      const matchesList = Array.isArray(snapshotData.matches) ? snapshotData.matches : [];
      const participants = Array.isArray(snapshotData.participants) ? snapshotData.participants : [];
      const payments = Array.isArray(snapshotData.payments) ? snapshotData.payments : [];
      const expenses = Array.isArray(snapshotData.expenses) ? snapshotData.expenses : [];
      const trxs = Array.isArray(snapshotData.cashTransactions) ? snapshotData.cashTransactions : [];

      const memberIds = new Set(members.map((m: any) => m.id));
      const matchIds = new Set(matchesList.map((m: any) => m.id));
      const partIds = new Set(participants.map((p: any) => p.id));

      // 1. Detect Orphan References
      const orphanParticipants = participants.filter(
        (p: any) => p.participantType === 'Anggota' && p.memberId && !memberIds.has(p.memberId)
      );

      const orphanPayments = payments.filter((p: any) => p.participantId && !partIds.has(p.participantId));
      const orphanExpenses = expenses.filter((e: any) => e.matchId && !matchIds.has(e.matchId));

      // 2. Detect Potential Member Duplicates (Same WhatsApp)
      const waMap = new Map<string, string[]>();
      for (const m of members) {
        const wa = (m.whatsapp || m.phone || '').trim();
        if (wa) {
          const list = waMap.get(wa) || [];
          list.push(m.id);
          waMap.set(wa, list);
        }
      }
      const duplicateCandidates = Array.from(waMap.entries())
        .filter(([, ids]) => ids.length > 1)
        .map(([wa, ids]) => ({ whatsapp: wa, memberIds: ids }));

      // 3. Verify Kas Awal Rp145.000
      const openingTrx = trxs.find(
        (t: any) => t.category === 'Kas Awal' || t.id === 'trx-opening-1'
      );
      const hasValidOpeningBalance = openingTrx && openingTrx.amount === 145000 && openingTrx.type === 'Pemasukan';

      // 4. Calculate Projected Ledger Balance
      let projectedIncome = 0;
      let projectedExpense = 0;
      for (const t of trxs) {
        if (t.type === 'Pemasukan') projectedIncome += Number(t.amount) || 0;
        else if (t.type === 'Pengeluaran') projectedExpense += Number(t.amount) || 0;
      }
      const projectedBalance = projectedIncome - projectedExpense;

      const passed =
        hasValidOpeningBalance &&
        orphanParticipants.length === 0 &&
        orphanPayments.length === 0 &&
        duplicateCandidates.length === 0;

      res.status(200).json({
        success: true,
        dryRunResult: passed ? 'PASS' : 'WARNING_CONFLICTS_FOUND',
        summary: {
          membersCount: members.length,
          matchesCount: matchesList.length,
          participantsCount: participants.length,
          paymentsCount: payments.length,
          transactionsCount: trxs.length,
        },
        integrityChecks: {
          openingBalanceValid: Boolean(hasValidOpeningBalance),
          openingBalanceAmount: openingTrx ? openingTrx.amount : 0,
          projectedLedgerBalance: projectedBalance,
          orphanParticipantsCount: orphanParticipants.length,
          orphanPaymentsCount: orphanPayments.length,
          orphanExpensesCount: orphanExpenses.length,
          duplicateCandidatesCount: duplicateCandidates.length,
        },
        conflicts: {
          orphanParticipants,
          orphanPayments,
          orphanExpenses,
          duplicateCandidates,
        },
        safetyNotice:
          'Dry-Run selesai. Tidak ada baris data atau tabel yang dimodifikasi. Migrasi commit memerlukan approval eksplisit.',
      });
    } catch (err: any) {
      console.error('[API migration] Error in dry-run:', err);
      res.status(500).json({ error: 'Gagal menjalankan simulasi dry-run migrasi.' });
    }
  }
);
