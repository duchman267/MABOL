import { Router, type Response } from 'express';
import { db } from '../../src/db/index.ts';
import {
  cashTransactions,
  matchPayments,
  paymentInstallments,
  matchExpenses,
  matchAddOns,
  sponsors,
  matchSponsorships,
  matches,
  matchParticipants,
  communityMembers,
} from '../../src/db/schema.ts';
import { eq, and, desc, sql } from 'drizzle-orm';
import { requireAuth, requireCommunityAdmin, type AuthenticatedRequest } from '../auth.ts';
import crypto from 'crypto';

export const financeRouter = Router();

// 1. GET /api/finance/balance - Single Source of Truth for Community Cash
financeRouter.get('/balance', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const communityId = (req.query.communityId as string) || 'comm-ck17';

    // Calculate dynamically from cash_transactions: sum(inflows) - sum(outflows)
    const result = await db
      .select({
        totalIncome: sql<number>`COALESCE(SUM(CASE WHEN ${cashTransactions.type} = 'Pemasukan' THEN ${cashTransactions.amount} ELSE 0 END), 0)::int`,
        totalExpense: sql<number>`COALESCE(SUM(CASE WHEN ${cashTransactions.type} = 'Pengeluaran' THEN ${cashTransactions.amount} ELSE 0 END), 0)::int`,
        balance: sql<number>`COALESCE(SUM(CASE WHEN ${cashTransactions.type} = 'Pemasukan' THEN ${cashTransactions.amount} ELSE -${cashTransactions.amount} END), 0)::int`,
      })
      .from(cashTransactions)
      .where(eq(cashTransactions.communityId, communityId));

    const balanceData = result[0] || { totalIncome: 0, totalExpense: 0, balance: 0 };
    res.status(200).json(balanceData);
  } catch (err: any) {
    console.error('[API finance] Error calculating balance:', err);
    res.status(500).json({ error: 'Gagal menghitung saldo kas komunitas.' });
  }
});

// 2. GET /api/finance/transactions - List cash transactions (Ledger)
financeRouter.get('/transactions', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const communityId = (req.query.communityId as string) || 'comm-ck17';
    const limit = Math.min(parseInt((req.query.limit as string) || '100', 10), 500);

    const trxs = await db
      .select()
      .from(cashTransactions)
      .where(eq(cashTransactions.communityId, communityId))
      .orderBy(desc(cashTransactions.date))
      .limit(limit);

    res.status(200).json(trxs);
  } catch (err: any) {
    console.error('[API finance] Error fetching transactions:', err);
    res.status(500).json({ error: 'Gagal mengambil riwayat transaksi kas.' });
  }
});

// 3. POST /api/finance/transactions - Admin adds manual cash transaction
financeRouter.post(
  '/transactions',
  requireAuth,
  requireCommunityAdmin((req) => req.body.communityId || 'comm-ck17'),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const {
        communityId = 'comm-ck17',
        type,
        category = 'Operasional',
        amount,
        description,
        matchId,
        idempotencyKey,
      } = req.body;

      if (!['Pemasukan', 'Pengeluaran'].includes(type)) {
        res.status(400).json({ error: 'Tipe transaksi harus Pemasukan atau Pengeluaran.' });
        return;
      }

      const numAmount = parseInt(amount, 10);
      if (isNaN(numAmount) || numAmount <= 0) {
        res.status(400).json({ error: 'Nominal transaksi harus berupa angka positif.' });
        return;
      }

      if (!description?.trim()) {
        res.status(400).json({ error: 'Deskripsi transaksi wajib diisi.' });
        return;
      }

      // Idempotency check: if already processed, return existing record
      if (idempotencyKey) {
        const [existing] = await db
          .select()
          .from(cashTransactions)
          .where(eq(cashTransactions.idempotencyKey, idempotencyKey))
          .limit(1);

        if (existing) {
          res.status(200).json({ success: true, transaction: existing, duplicate: true });
          return;
        }
      }

      const trxId = `trx-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
      const [newTrx] = await db
        .insert(cashTransactions)
        .values({
          id: trxId,
          communityId,
          type,
          category,
          amount: numAmount,
          description: description.trim(),
          matchId: matchId || null,
          idempotencyKey: idempotencyKey || `manual-${trxId}`,
          createdBy: req.user?.name || 'Admin',
        })
        .returning();

      res.status(201).json({ success: true, transaction: newTrx });
    } catch (err: any) {
      console.error('[API finance] Error creating transaction:', err);
      res.status(500).json({ error: 'Gagal mencatat transaksi kas.' });
    }
  }
);

// 4. POST /api/finance/payments - Record match payment (supports installments & cash ledger sync)
financeRouter.post('/payments', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const {
      matchId,
      participantId,
      amount,
      method = 'Transfer',
      status = 'Sudah Bayar',
      notes,
      idempotencyKey,
    } = req.body;

    const numAmount = parseInt(amount, 10);
    if (isNaN(numAmount) || numAmount < 0) {
      res.status(400).json({ error: 'Nominal pembayaran tidak valid.' });
      return;
    }

    // Retrieve match & participant
    const [match] = await db.select().from(matches).where(eq(matches.id, matchId)).limit(1);
    if (!match) {
      res.status(404).json({ error: 'Pertandingan tidak ditemukan.' });
      return;
    }

    const [participant] = await db
      .select({
        id: matchParticipants.id,
        participantType: matchParticipants.participantType,
        guestName: matchParticipants.guestName,
        memberId: matchParticipants.memberId,
      })
      .from(matchParticipants)
      .where(eq(matchParticipants.id, participantId))
      .limit(1);

    if (!participant) {
      res.status(404).json({ error: 'Peserta pertandingan tidak ditemukan.' });
      return;
    }

    // Determine player display name
    let playerName = 'Pemain';
    if (participant.participantType === 'Guest') {
      playerName = participant.guestName || 'Tamu';
    } else if (participant.memberId) {
      const [mem] = await db
        .select({ nickname: communityMembers.nickname })
        .from(communityMembers)
        .where(eq(communityMembers.id, participant.memberId))
        .limit(1);
      if (mem) playerName = mem.nickname;
    }

    const effectiveIdempotencyKey = idempotencyKey || `pay-${matchId}-${participantId}-${Date.now()}`;

    // Execute atomic transaction: update payment, record installment, sync cash ledger
    const result = await db.transaction(async (tx) => {
      // 1. Check existing payment record
      const [existingPayment] = await tx
        .select()
        .from(matchPayments)
        .where(and(eq(matchPayments.matchId, matchId), eq(matchPayments.participantId, participantId)))
        .limit(1);

      const fee = match.standardFee;
      const extraContribution = Math.max(0, numAmount - fee);
      const isPaid = (status === 'Sudah Bayar' || status === 'Bayar Sebagian') && numAmount > 0;

      let paymentId = existingPayment?.id;
      let paymentRecord;

      if (existingPayment) {
        [paymentRecord] = await tx
          .update(matchPayments)
          .set({
            amount: numAmount,
            extraContribution,
            method,
            status,
            paidAt: isPaid ? new Date() : existingPayment.paidAt,
            notes: notes?.trim() || existingPayment.notes,
            recordedBy: req.user?.name || 'Sistem',
            updatedAt: new Date(),
          })
          .where(eq(matchPayments.id, existingPayment.id))
          .returning();
      } else {
        paymentId = `pay-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
        [paymentRecord] = await tx
          .insert(matchPayments)
          .values({
            id: paymentId,
            matchId,
            participantId,
            standardFee: fee,
            amount: numAmount,
            extraContribution,
            method,
            status,
            paidAt: isPaid ? new Date() : null,
            recordedBy: req.user?.name || 'Sistem',
            notes: notes?.trim() || null,
          })
          .returning();
      }

      // 2. If money actually received, check idempotency first to avoid duplicate installments
      let installmentRecord = null;
      if (isPaid) {
        const [alreadyProcessed] = await tx
          .select()
          .from(cashTransactions)
          .where(eq(cashTransactions.idempotencyKey, effectiveIdempotencyKey))
          .limit(1);

        if (alreadyProcessed) {
          // Idempotent retry: return without inserting duplicate installment or cash transaction
          return { payment: paymentRecord, installment: null, idempotentRetry: true };
        }

        const instId = `inst-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
        const [inst] = await tx
          .insert(paymentInstallments)
          .values({
            id: instId,
            paymentId: paymentId!,
            amount: numAmount,
            method,
            recordedBy: req.user?.name || 'Sistem',
            notes: notes?.trim() || null,
          })
          .returning();
        installmentRecord = inst;

        // 3. Sync to Cash Ledger (cash_transactions) with idempotency key
        const trxId = `trx-pay-${paymentId}-${Date.now()}`;
        const extraText = extraContribution > 0 ? ` (+Kontribusi Rp${extraContribution.toLocaleString('id-ID')})` : '';
        const descText = `Pembayaran HTM: ${playerName} (${match.title})${extraText}`;

        // Insert or ignore if idempotency key already processed
        await tx
          .insert(cashTransactions)
          .values({
            id: trxId,
            communityId: match.communityId,
            type: 'Pemasukan',
            category: 'Match',
            amount: numAmount,
            matchId,
            sourceId: paymentId,
            idempotencyKey: effectiveIdempotencyKey,
            description: descText,
            createdBy: req.user?.name || 'Sistem',
          })
          .onConflictDoNothing();
      }

      return { payment: paymentRecord, installment: installmentRecord };
    });

    res.status(200).json({ success: true, ...result });
  } catch (err: any) {
    console.error('[API finance] Error recording payment:', err);
    res.status(500).json({ error: 'Gagal mencatat pembayaran HTM.' });
  }
});

// 5. GET /api/finance/payments/:id/installments - Get installment history
financeRouter.get(
  '/payments/:id/installments',
  requireAuth,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const paymentId = req.params.id;

      const insts = await db
        .select()
        .from(paymentInstallments)
        .where(eq(paymentInstallments.paymentId, paymentId))
        .orderBy(desc(paymentInstallments.paidAt));

      res.status(200).json(insts);
    } catch (err: any) {
      console.error('[API finance] Error fetching installments:', err);
      res.status(500).json({ error: 'Gagal mengambil riwayat cicilan pembayaran.' });
    }
  }
);

// 6. GET /api/finance/expenses - List expenses for match
financeRouter.get('/expenses', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const matchId = req.query.matchId as string;
    if (!matchId) {
      res.status(400).json({ error: 'Parameter matchId diperlukan.' });
      return;
    }

    const expList = await db
      .select()
      .from(matchExpenses)
      .where(eq(matchExpenses.matchId, matchId))
      .orderBy(desc(matchExpenses.createdAt));

    res.status(200).json(expList);
  } catch (err: any) {
    console.error('[API finance] Error fetching expenses:', err);
    res.status(500).json({ error: 'Gagal mengambil data pengeluaran.' });
  }
});

// 7. POST /api/finance/expenses - Admin adds match expense (atomically creates cash outflow)
financeRouter.post(
  '/expenses',
  requireAuth,
  requireCommunityAdmin(),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const {
        matchId,
        communityId = 'comm-ck17',
        category = 'Lapangan',
        name,
        quantity = 1,
        unitPrice = 0,
        notes,
        idempotencyKey,
      } = req.body;

      if (!name?.trim()) {
        res.status(400).json({ error: 'Nama pengeluaran wajib diisi.' });
        return;
      }

      const numQty = parseInt(quantity, 10) || 1;
      const numPrice = parseInt(unitPrice, 10) || 0;
      const totalAmount = numQty * numPrice;

      if (totalAmount <= 0) {
        res.status(400).json({ error: 'Total pengeluaran harus lebih besar dari 0.' });
        return;
      }

      const expId = `exp-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
      const effectiveIdempotency = idempotencyKey || `exp-${expId}`;

      const result = await db.transaction(async (tx) => {
        // 1. Insert expense record
        const [exp] = await tx
          .insert(matchExpenses)
          .values({
            id: expId,
            matchId,
            communityId,
            category,
            name: name.trim(),
            quantity: numQty,
            unitPrice: numPrice,
            total: totalAmount,
            paidAt: new Date(),
            notes: notes?.trim() || null,
          })
          .returning();

        // 2. Insert cash outflow in cash_transactions
        const trxId = `trx-${expId}`;
        const [trx] = await tx
          .insert(cashTransactions)
          .values({
            id: trxId,
            communityId,
            type: 'Pengeluaran',
            category: 'Match',
            amount: totalAmount,
            matchId,
            sourceId: expId,
            idempotencyKey: effectiveIdempotency,
            description: `Pengeluaran: ${name.trim()}`,
            createdBy: req.user?.name || 'Admin',
          })
          .returning();

        return { expense: exp, transaction: trx };
      });

      res.status(201).json(result);
    } catch (err: any) {
      console.error('[API finance] Error adding expense:', err);
      res.status(500).json({ error: 'Gagal menambahkan pengeluaran.' });
    }
  }
);

// 8. DELETE /api/finance/expenses/:id - Reverse/cancel expense with audit trail
financeRouter.delete(
  '/expenses/:id',
  requireAuth,
  requireCommunityAdmin(),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const expId = req.params.id;

      const [exp] = await db
        .select()
        .from(matchExpenses)
        .where(eq(matchExpenses.id, expId))
        .limit(1);

      if (!exp) {
        res.status(404).json({ error: 'Pengeluaran tidak ditemukan.' });
        return;
      }

      // Check if match already settled
      const [match] = await db
        .select()
        .from(matches)
        .where(eq(matches.id, exp.matchId))
        .limit(1);

      if (match?.cashSettled) {
        res.status(400).json({ error: 'Pertandingan sudah ditutup (cash settled). Pengeluaran tidak dapat dihapus.' });
        return;
      }

      // Atomic cancellation: remove expense and add counter-transaction (audit trail)
      await db.transaction(async (tx) => {
        await tx.delete(matchExpenses).where(eq(matchExpenses.id, expId));

        // Add reversal entry in cash_transactions
        const revId = `trx-rev-${expId}-${Date.now()}`;
        await tx.insert(cashTransactions).values({
          id: revId,
          communityId: exp.communityId,
          type: 'Pemasukan', // Reversal of outflow
          category: 'Match',
          amount: exp.total,
          matchId: exp.matchId,
          sourceId: expId,
          idempotencyKey: `rev-${expId}`,
          description: `Koreksi/Pembatalan Pengeluaran: ${exp.name}`,
          createdBy: req.user?.name || 'Admin',
        });
      });

      res.status(200).json({ success: true, message: 'Pengeluaran berhasil dibatalkan dengan audit trail.' });
    } catch (err: any) {
      console.error('[API finance] Error deleting expense:', err);
      res.status(500).json({ error: 'Gagal menghapus pengeluaran.' });
    }
  }
);
