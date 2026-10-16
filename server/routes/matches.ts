import { Router, type Response } from 'express';
import { db } from '../../src/db/index.ts';
import {
  matches,
  matchParticipants,
  matchPayments,
  communityMembers,
} from '../../src/db/schema.ts';
import { eq, and, desc } from 'drizzle-orm';
import { requireAuth, requireCommunityAdmin, type AuthenticatedRequest } from '../auth.ts';
import crypto from 'crypto';

export const matchesRouter = Router();

// 1. GET /api/matches - List matches by community
matchesRouter.get('/', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const communityId = (req.query.communityId as string) || 'comm-ck17';

    const matchesList = await db
      .select()
      .from(matches)
      .where(eq(matches.communityId, communityId))
      .orderBy(desc(matches.date));

    res.status(200).json(matchesList);
  } catch (err: any) {
    console.error('[API matches] Error fetching matches:', err);
    res.status(500).json({ error: 'Gagal mengambil data pertandingan.' });
  }
});

// 2. POST /api/matches - Admin creates match
matchesRouter.post(
  '/',
  requireAuth,
  requireCommunityAdmin((req) => req.body.communityId || 'comm-ck17'),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const {
        communityId = 'comm-ck17',
        title,
        date,
        kickoffTime,
        endTime = '21:00',
        venue,
        address = '',
        mapUrl,
        standardFee = 35000,
        playerQuota = 20,
        cancellationDeadline,
        notes,
        photographerAvailable = false,
        photographerName,
        photographerFee = 0,
        albumUrl,
        paymentBankName,
        paymentAccountNumber,
        paymentAccountHolder,
      } = req.body;

      if (!title || !date || !kickoffTime || !venue) {
        res.status(400).json({ error: 'Judul, tanggal, jam kickoff, dan lokasi venue wajib diisi.' });
        return;
      }

      const matchId = `match-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
      const defaultDeadline = cancellationDeadline || `${date}T12:00`;

      const [newMatch] = await db
        .insert(matches)
        .values({
          id: matchId,
          communityId,
          title: title.trim(),
          date: date.trim(),
          kickoffTime: kickoffTime.trim(),
          endTime: endTime.trim(),
          venue: venue.trim(),
          address: address.trim(),
          mapUrl: mapUrl?.trim() || null,
          standardFee: Number(standardFee) || 35000,
          playerQuota: Number(playerQuota) || 20,
          status: 'Aktif',
          cancellationDeadline: defaultDeadline,
          photographerAvailable: Boolean(photographerAvailable),
          photographerName: photographerName?.trim() || null,
          photographerFee: Number(photographerFee) || 0,
          albumUrl: albumUrl?.trim() || null,
          paymentBankName: paymentBankName?.trim() || null,
          paymentAccountNumber: paymentAccountNumber?.trim() || null,
          paymentAccountHolder: paymentAccountHolder?.trim() || null,
          cashSettled: false,
          notes: notes?.trim() || null,
          createdBy: req.user?.name || 'Admin',
        })
        .returning();

      res.status(201).json(newMatch);
    } catch (err: any) {
      console.error('[API matches] Error creating match:', err);
      res.status(500).json({ error: 'Gagal membuat pertandingan baru.' });
    }
  }
);

// 3. PUT /api/matches/:id - Admin updates match
matchesRouter.put(
  '/:id',
  requireAuth,
  requireCommunityAdmin(),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const matchId = req.params.id;
      const updateData = { ...req.body, updatedAt: new Date() };
      delete updateData.id;
      delete updateData.createdAt;

      const [updated] = await db
        .update(matches)
        .set(updateData)
        .where(eq(matches.id, matchId))
        .returning();

      if (!updated) {
        res.status(404).json({ error: 'Pertandingan tidak ditemukan.' });
        return;
      }

      res.status(200).json(updated);
    } catch (err: any) {
      console.error('[API matches] Error updating match:', err);
      res.status(500).json({ error: 'Gagal memperbarui pertandingan.' });
    }
  }
);

// 4. POST /api/matches/:id/complete - Admin completes match
// BUSINESS RULE: Sets status='Selesai' and cashSettled=true. DOES NOT inject duplicate surplus into ledger!
matchesRouter.post(
  '/:id/complete',
  requireAuth,
  requireCommunityAdmin(),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const matchId = req.params.id;

      const [match] = await db
        .select()
        .from(matches)
        .where(eq(matches.id, matchId))
        .limit(1);

      if (!match) {
        res.status(404).json({ error: 'Pertandingan tidak ditemukan.' });
        return;
      }

      // Idempotent completion: if already settled, return success without modifications
      if (match.status === 'Selesai' && match.cashSettled) {
        res.status(200).json({ success: true, message: 'Pertandingan sudah diselesaikan sebelumnya.', match });
        return;
      }

      const [completedMatch] = await db
        .update(matches)
        .set({
          status: 'Selesai',
          cashSettled: true,
          updatedAt: new Date(),
        })
        .where(eq(matches.id, matchId))
        .returning();

      res.status(200).json({
        success: true,
        message: 'Pertandingan berhasil diselesaikan dan buku keuangan pertandingan ditutup.',
        match: completedMatch,
      });
    } catch (err: any) {
      console.error('[API matches] Error completing match:', err);
      res.status(500).json({ error: 'Gagal menyelesaikan pertandingan.' });
    }
  }
);

// 5. POST /api/matches/:id/cancel - Admin cancels match
matchesRouter.post(
  '/:id/cancel',
  requireAuth,
  requireCommunityAdmin(),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const matchId = req.params.id;

      const [cancelled] = await db
        .update(matches)
        .set({ status: 'Dibatalkan', updatedAt: new Date() })
        .where(eq(matches.id, matchId))
        .returning();

      if (!cancelled) {
        res.status(404).json({ error: 'Pertandingan tidak ditemukan.' });
        return;
      }

      res.status(200).json({ success: true, match: cancelled });
    } catch (err: any) {
      console.error('[API matches] Error cancelling match:', err);
      res.status(500).json({ error: 'Gagal membatalkan pertandingan.' });
    }
  }
);

// 6. GET /api/matches/:id/participants - List participants for match
matchesRouter.get('/:id/participants', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const matchId = req.params.id;

    const parts = await db
      .select({
        id: matchParticipants.id,
        matchId: matchParticipants.matchId,
        memberId: matchParticipants.memberId,
        participantType: matchParticipants.participantType,
        guestName: matchParticipants.guestName,
        guestPhone: matchParticipants.guestPhone,
        rsvpStatus: matchParticipants.rsvpStatus,
        attendanceStatus: matchParticipants.attendanceStatus,
        createdAt: matchParticipants.createdAt,
        memberNickname: communityMembers.nickname,
        memberFullName: communityMembers.fullName,
        memberJerseyNumber: communityMembers.jerseyNumber,
        memberPosition: communityMembers.position,
        paymentId: matchPayments.id,
        paymentAmount: matchPayments.amount,
        paymentStatus: matchPayments.status,
        paymentMethod: matchPayments.method,
      })
      .from(matchParticipants)
      .leftJoin(communityMembers, eq(matchParticipants.memberId, communityMembers.id))
      .leftJoin(matchPayments, eq(matchParticipants.id, matchPayments.participantId))
      .where(eq(matchParticipants.matchId, matchId));

    res.status(200).json(parts);
  } catch (err: any) {
    console.error('[API matches] Error fetching participants:', err);
    res.status(500).json({ error: 'Gagal mengambil data peserta pertandingan.' });
  }
});

// 7. POST /api/matches/:id/participants - Add participant (Registered member, Manual member, or Guest)
matchesRouter.post('/:id/participants', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const matchId = req.params.id;
    const {
      memberId,
      participantType = 'Anggota',
      guestName,
      guestPhone,
      rsvpStatus = 'Ikut',
      attendanceStatus = 'Belum Dicek',
    } = req.body;

    const [match] = await db
      .select()
      .from(matches)
      .where(eq(matches.id, matchId))
      .limit(1);

    if (!match) {
      res.status(404).json({ error: 'Pertandingan tidak ditemukan.' });
      return;
    }

    // Check duplicate member
    if (participantType === 'Anggota' && memberId) {
      const [existing] = await db
        .select()
        .from(matchParticipants)
        .where(
          and(
            eq(matchParticipants.matchId, matchId),
            eq(matchParticipants.memberId, memberId)
          )
        )
        .limit(1);

      if (existing) {
        res.status(409).json({ error: 'Anggota sudah terdaftar di pertandingan ini.', participant: existing });
        return;
      }
    }

    const partId = `part-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;

    // Atomically create participant and payment record
    const result = await db.transaction(async (tx) => {
      const [part] = await tx
        .insert(matchParticipants)
        .values({
          id: partId,
          matchId,
          memberId: participantType === 'Anggota' ? (memberId || null) : null,
          participantType,
          guestName: participantType === 'Guest' ? guestName?.trim() : null,
          guestPhone: participantType === 'Guest' ? guestPhone?.trim() : null,
          rsvpStatus,
          attendanceStatus,
        })
        .returning();

      // Create initial payment record
      const payId = `pay-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
      const [pay] = await tx
        .insert(matchPayments)
        .values({
          id: payId,
          matchId,
          participantId: partId,
          standardFee: match.standardFee,
          amount: 0,
          extraContribution: 0,
          method: 'Tunai',
          status: 'Belum Bayar',
          recordedBy: req.user?.name || 'Sistem',
        })
        .returning();

      return { participant: part, payment: pay };
    });

    res.status(201).json(result);
  } catch (err: any) {
    console.error('[API matches] Error adding participant:', err);
    res.status(500).json({ error: 'Gagal menambahkan peserta pertandingan.' });
  }
});

// 8. PUT /api/matches/:id/participants/:participantId/rsvp - Update RSVP status
matchesRouter.put(
  '/:id/participants/:participantId/rsvp',
  requireAuth,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { participantId } = req.params;
      const { rsvpStatus } = req.body;

      if (!['Menunggu', 'Ikut', 'Batal'].includes(rsvpStatus)) {
        res.status(400).json({ error: 'Status RSVP tidak valid.' });
        return;
      }

      const [updated] = await db
        .update(matchParticipants)
        .set({
          rsvpStatus,
          attendanceStatus: rsvpStatus === 'Ikut' ? 'Belum Dicek' : 'Tidak Hadir',
          updatedAt: new Date(),
        })
        .where(eq(matchParticipants.id, participantId))
        .returning();

      if (!updated) {
        res.status(404).json({ error: 'Peserta tidak ditemukan.' });
        return;
      }

      res.status(200).json(updated);
    } catch (err: any) {
      console.error('[API matches] Error updating RSVP:', err);
      res.status(500).json({ error: 'Gagal memperbarui status RSVP.' });
    }
  }
);

// 9. PUT /api/matches/:id/participants/:participantId/attendance - Update attendance status
matchesRouter.put(
  '/:id/participants/:participantId/attendance',
  requireAuth,
  requireCommunityAdmin(),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { participantId } = req.params;
      const { attendanceStatus } = req.body;

      if (!['Belum Dicek', 'Hadir', 'Tidak Hadir'].includes(attendanceStatus)) {
        res.status(400).json({ error: 'Status kehadiran tidak valid.' });
        return;
      }

      const [updated] = await db
        .update(matchParticipants)
        .set({ attendanceStatus, updatedAt: new Date() })
        .where(eq(matchParticipants.id, participantId))
        .returning();

      if (!updated) {
        res.status(404).json({ error: 'Peserta tidak ditemukan.' });
        return;
      }

      res.status(200).json(updated);
    } catch (err: any) {
      console.error('[API matches] Error updating attendance:', err);
      res.status(500).json({ error: 'Gagal memperbarui kehadiran.' });
    }
  }
);
