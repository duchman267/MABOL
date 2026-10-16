import { Router, type Response } from 'express';
import { db } from '../../src/db/index.ts';
import { communityMembers, accounts, communityMemberships, matchParticipants } from '../../src/db/schema.ts';
import { eq, and, or } from 'drizzle-orm';
import { requireAuth, requireCommunityAdmin, type AuthenticatedRequest } from '../auth.ts';
import crypto from 'crypto';

export const membersRouter = Router();

// 1. GET /api/members - List members of active community
membersRouter.get('/', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const communityId = (req.query.communityId as string) || 'comm-ck17';

    const membersList = await db
      .select({
        id: communityMembers.id,
        communityId: communityMembers.communityId,
        accountId: communityMembers.accountId,
        nickname: communityMembers.nickname,
        fullName: communityMembers.fullName,
        phone: communityMembers.phone,
        whatsapp: communityMembers.whatsapp,
        email: communityMembers.email,
        position: communityMembers.position,
        jerseyNumber: communityMembers.jerseyNumber,
        role: communityMembers.role,
        status: communityMembers.status,
        memberType: communityMembers.memberType,
        photoUrl: communityMembers.photoUrl,
        joinedAt: communityMembers.joinedAt,
      })
      .from(communityMembers)
      .where(eq(communityMembers.communityId, communityId));

    res.status(200).json(membersList);
  } catch (err: any) {
    console.error('[API members] Error fetching members:', err);
    res.status(500).json({ error: 'Gagal mengambil data anggota komunitas.' });
  }
});

// 2. POST /api/members/manual - Admin creates manual member without login account
membersRouter.post(
  '/manual',
  requireAuth,
  requireCommunityAdmin((req) => req.body.communityId || 'comm-ck17'),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const {
        communityId = 'comm-ck17',
        name,
        whatsapp,
        email,
        position = 'Gelandang',
        jerseyNumber = 0,
        photo,
      } = req.body;

      const cleanName = (name || '').trim();
      const cleanWhatsapp = (whatsapp || '').trim();

      if (!cleanName) {
        res.status(400).json({ error: 'Nama lengkap wajib diisi.' });
        return;
      }
      if (!cleanWhatsapp) {
        res.status(400).json({ error: 'Nomor WhatsApp wajib diisi.' });
        return;
      }

      const parsedJersey = typeof jerseyNumber === 'number' ? jerseyNumber : parseInt(jerseyNumber || '0', 10);
      const newMemberId = `mem-manual-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;

      const [newMember] = await db
        .insert(communityMembers)
        .values({
          id: newMemberId,
          communityId,
          accountId: null, // Critical: Manual members have NULL account_id!
          nickname: cleanName,
          fullName: cleanName,
          whatsapp: cleanWhatsapp,
          phone: cleanWhatsapp,
          email: email?.trim() || null,
          position: position || 'Gelandang',
          jerseyNumber: isNaN(parsedJersey) ? 0 : parsedJersey,
          role: 'member',
          status: 'Aktif',
          memberType: 'MANUAL',
          photoUrl: photo?.trim() || null,
        })
        .returning();

      res.status(201).json(newMember);
    } catch (err: any) {
      console.error('[API members] Error creating manual member:', err);
      res.status(500).json({ error: 'Gagal menambahkan anggota manual.' });
    }
  }
);

// 3. PUT /api/members/:id - Admin updates member details
membersRouter.put(
  '/:id',
  requireAuth,
  requireCommunityAdmin((req) => req.body.communityId || 'comm-ck17'),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const memberId = req.params.id;
      const { nickname, fullName, whatsapp, email, position, jerseyNumber, photo, status } = req.body;

      const [existing] = await db
        .select()
        .from(communityMembers)
        .where(
          or(
            eq(communityMembers.id, memberId),
            eq(communityMembers.accountId, memberId)
          )
        )
        .limit(1);

      if (!existing) {
        res.status(404).json({ error: 'Anggota tidak ditemukan.' });
        return;
      }

      const [updated] = await db
        .update(communityMembers)
        .set({
          nickname: nickname !== undefined ? nickname.trim() : existing.nickname,
          fullName: fullName !== undefined ? fullName.trim() : existing.fullName,
          whatsapp: whatsapp !== undefined ? whatsapp.trim() : existing.whatsapp,
          email: email !== undefined ? (email.trim() || null) : existing.email,
          position: position !== undefined ? position : existing.position,
          jerseyNumber: jerseyNumber !== undefined ? Number(jerseyNumber) : existing.jerseyNumber,
          photoUrl: photo !== undefined ? photo.trim() : existing.photoUrl,
          status: status !== undefined ? status : existing.status,
          updatedAt: new Date(),
        })
        .where(eq(communityMembers.id, existing.id))
        .returning();

      if (existing.accountId && status !== undefined) {
        await db
          .update(communityMemberships)
          .set({
            status: status === 'Aktif' ? 'AKTIF' : 'NONAKTIF',
            displayName: nickname !== undefined ? nickname.trim() : existing.nickname,
            position: position !== undefined ? position : existing.position,
            jerseyNumber: jerseyNumber !== undefined ? Number(jerseyNumber) : existing.jerseyNumber,
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(communityMemberships.userId, existing.accountId),
              eq(communityMemberships.communityId, existing.communityId)
            )
          );
      }

      res.status(200).json(updated);
    } catch (err: any) {
      console.error('[API members] Error updating member:', err);
      res.status(500).json({ error: 'Gagal memperbarui data anggota.' });
    }
  }
);

// 4. DELETE /api/members/:id - Admin removes or deactivates member
membersRouter.delete(
  '/:id',
  requireAuth,
  requireCommunityAdmin((req) => (req.query.communityId as string) || req.body?.communityId || 'comm-ck17'),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const memberId = req.params.id;

      if (memberId === 'mem-admin' || memberId === 'usr-admin-dicky') {
        res.status(400).json({ error: 'Akun admin utama tidak dapat dihapus.' });
        return;
      }

      // 1. Cari anggota di communityMembers berdasarkan ID atau accountId
      const [existing] = await db
        .select()
        .from(communityMembers)
        .where(
          or(
            eq(communityMembers.id, memberId),
            eq(communityMembers.accountId, memberId)
          )
        )
        .limit(1);

      if (!existing) {
        // Cek apakah anggota hanya tersimpan di tabel communityMemberships
        const [existingMembership] = await db
          .select()
          .from(communityMemberships)
          .where(
            and(
              eq(communityMemberships.userId, memberId),
              eq(communityMemberships.communityId, 'comm-ck17')
            )
          )
          .limit(1);

        if (existingMembership) {
          if (existingMembership.role === 'ADMIN' || existingMembership.userId === 'usr-admin-dicky') {
            res.status(400).json({ error: 'Akun admin utama tidak dapat dihapus.' });
            return;
          }
          await db
            .delete(communityMemberships)
            .where(eq(communityMemberships.id, existingMembership.id));
          res.status(200).json({ success: true, action: 'deleted', message: 'Keanggotaan berhasil dihapus.' });
          return;
        }

        res.status(404).json({ error: 'Anggota tidak ditemukan.' });
        return;
      }

      // 2. Periksa apakah anggota memiliki histori partisipasi pertandingan
      const [participant] = await db
        .select({ id: matchParticipants.id })
        .from(matchParticipants)
        .where(eq(matchParticipants.memberId, existing.id))
        .limit(1);

      if (participant) {
        // Jika ada riwayat pertandingan, lakukan penonaktifan (soft-deactivate) agar integritas relational tidak rusak
        await db
          .update(communityMembers)
          .set({ status: 'Nonaktif', updatedAt: new Date() })
          .where(eq(communityMembers.id, existing.id));

        if (existing.accountId) {
          await db
            .update(communityMemberships)
            .set({ status: 'NONAKTIF', updatedAt: new Date() })
            .where(
              and(
                eq(communityMemberships.userId, existing.accountId),
                eq(communityMemberships.communityId, existing.communityId)
              )
            );
        }

        res.status(200).json({
          success: true,
          action: 'deactivated',
          message: 'Anggota memiliki riwayat pertandingan dan berhasil dinonaktifkan.',
        });
      } else {
        // Jika tidak ada riwayat pertandingan, hapus permanen dari tabel
        await db
          .delete(communityMembers)
          .where(eq(communityMembers.id, existing.id));

        if (existing.accountId) {
          await db
            .delete(communityMemberships)
            .where(
              and(
                eq(communityMemberships.userId, existing.accountId),
                eq(communityMemberships.communityId, existing.communityId)
              )
            );
        }

        res.status(200).json({
          success: true,
          action: 'deleted',
          message: 'Anggota berhasil dihapus dari komunitas.',
        });
      }
    } catch (err: any) {
      console.error('[API members] Error removing member:', err);
      res.status(500).json({ error: 'Gagal menghapus anggota dari server.' });
    }
  }
);
