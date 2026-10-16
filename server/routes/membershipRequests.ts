import { Router, type Response } from 'express';
import crypto from 'crypto';
import { db } from '../../src/db/index.ts';
import {
  membershipRequests,
  communityMemberships,
  communityMembers,
  communities,
  accounts,
} from '../../src/db/schema.ts';
import { eq, and, sql, desc } from 'drizzle-orm';
import { requireAuth, type AuthenticatedRequest } from '../auth.ts';

export const membershipRequestsRouter = Router();

// 1. GET /api/membership-requests/pending-count
// Indikator jumlah pengajuan yang menunggu persetujuan
membershipRequestsRouter.get(
  '/pending-count',
  requireAuth,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const communityId = (req.query.communityId as string) || 'comm-ck17';

      // Cek apakah user adalah ADMIN komunitas
      const [membership] = await db
        .select()
        .from(communityMemberships)
        .where(
          and(
            eq(communityMemberships.userId, req.user!.userId),
            eq(communityMemberships.communityId, communityId)
          )
        )
        .limit(1);

      if (!membership || membership.role !== 'ADMIN' || membership.status !== 'AKTIF') {
        res.status(403).json({ error: 'Akses ditolak: Hanya Admin Komunitas yang berwenang.' });
        return;
      }

      const [countResult] = await db
        .select({ count: sql<number>`cast(count(*) as int)` })
        .from(membershipRequests)
        .where(
          and(
            eq(membershipRequests.communityId, communityId),
            eq(membershipRequests.status, 'pending')
          )
        );

      res.status(200).json({
        communityId,
        pendingCount: countResult?.count || 0,
      });
    } catch (error: any) {
      console.error('[Membership Requests API] Error fetching pending count:', error);
      res.status(500).json({ error: 'Gagal memuat jumlah pengajuan.' });
    }
  }
);

// 2. GET /api/membership-requests
// Daftar pengajuan (Admin dapat melihat semua pengajuan di komunitasnya; anggota melihat pengajuannya sendiri)
membershipRequestsRouter.get(
  '/',
  requireAuth,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const communityId = (req.query.communityId as string) || 'comm-ck17';
      const statusFilter = (req.query.status as string) || 'all';

      // Cek apakah caller adalah ADMIN komunitas
      const [membership] = await db
        .select()
        .from(communityMemberships)
        .where(
          and(
            eq(communityMemberships.userId, req.user!.userId),
            eq(communityMemberships.communityId, communityId)
          )
        )
        .limit(1);

      const isAdmin = Boolean(membership && membership.role === 'ADMIN' && membership.status === 'AKTIF');

      let query = db.select().from(membershipRequests);

      if (isAdmin) {
        // Admin melihat pengajuan untuk komunitas ini
        if (statusFilter !== 'all') {
          query = query.where(
            and(
              eq(membershipRequests.communityId, communityId),
              eq(membershipRequests.status, statusFilter)
            )
          ) as any;
        } else {
          query = query.where(eq(membershipRequests.communityId, communityId)) as any;
        }
      } else {
        // User non-admin hanya melihat pengajuan miliknya sendiri
        query = query.where(
          and(
            eq(membershipRequests.userId, req.user!.userId),
            eq(membershipRequests.communityId, communityId)
          )
        ) as any;
      }

      const requests = await query.orderBy(desc(membershipRequests.createdAt));

      res.status(200).json({
        communityId,
        isAdmin,
        requests: requests.map((r) => ({
          id: r.id,
          communityId: r.communityId,
          userId: r.userId,
          userName: r.userName,
          userEmail: r.userEmail,
          position: r.position,
          jerseyNumber: r.jerseyNumber,
          notes: r.notes,
          status: r.status,
          reviewedBy: r.reviewedBy,
          reviewedAt: r.reviewedAt,
          adminNotes: r.adminNotes,
          createdAt: r.createdAt,
          updatedAt: r.updatedAt,
        })),
      });
    } catch (error: any) {
      console.error('[Membership Requests API] Error listing requests:', error);
      res.status(500).json({ error: 'Gagal memuat daftar pengajuan keanggotaan.' });
    }
  }
);

// 3. POST /api/membership-requests
// Mengajukan keanggotaan ke komunitas
membershipRequestsRouter.post(
  '/',
  requireAuth,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const {
        communityId = 'comm-ck17',
        position = 'Gelandang',
        jerseyNumber = 10,
        notes = '',
      } = req.body;

      const userId = req.user!.userId;
      const userName = req.user!.name;
      const userEmail = req.user!.email;

      // 1. Verifikasi komunitas tujuan aktif
      const [comm] = await db
        .select()
        .from(communities)
        .where(eq(communities.id, communityId))
        .limit(1);

      if (!comm) {
        res.status(404).json({ error: 'Komunitas tidak ditemukan.' });
        return;
      }

      // 2. Cek apakah user sudah terdaftar sebagai anggota aktif di komunitas ini
      const [existingMembership] = await db
        .select()
        .from(communityMemberships)
        .where(
          and(
            eq(communityMemberships.userId, userId),
            eq(communityMemberships.communityId, communityId)
          )
        )
        .limit(1);

      if (existingMembership && existingMembership.status === 'AKTIF') {
        res.status(400).json({ error: 'Anda sudah menjadi anggota aktif di komunitas ini.' });
        return;
      }

      // 3. Cek apakah sudah ada pengajuan pending untuk user ini di komunitas ini
      const [existingPending] = await db
        .select()
        .from(membershipRequests)
        .where(
          and(
            eq(membershipRequests.userId, userId),
            eq(membershipRequests.communityId, communityId),
            eq(membershipRequests.status, 'pending')
          )
        )
        .limit(1);

      if (existingPending) {
        res.status(409).json({
          error: 'Pengajuan Anda sebelumnya masih menunggu persetujuan admin komunitas.',
          requestId: existingPending.id,
        });
        return;
      }

      const newId = `req-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
      const [created] = await db
        .insert(membershipRequests)
        .values({
          id: newId,
          communityId,
          userId,
          userName,
          userEmail,
          position: (position || 'Gelandang').trim(),
          jerseyNumber: Number(jerseyNumber) || 10,
          notes: notes ? notes.trim() : null,
          status: 'pending',
        })
        .returning();

      res.status(201).json({
        message: 'Pengajuan keanggotaan berhasil dikirim.',
        request: created,
      });
    } catch (error: any) {
      console.error('[Membership Requests API] Error creating request:', error);
      res.status(500).json({ error: 'Gagal mengirimkan pengajuan keanggotaan.' });
    }
  }
);

// 4. POST /api/membership-requests/:id/review
// Menyetujui atau menolak pengajuan (Hanya Admin Komunitas yang berwenang)
membershipRequestsRouter.post(
  '/:id/review',
  requireAuth,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { status, adminNotes } = req.body;

      if (!status || !['approved', 'rejected'].includes(status)) {
        res.status(400).json({ error: 'Status review harus bernilai "approved" atau "rejected".' });
        return;
      }

      // Cari pengajuan
      const [request] = await db
        .select()
        .from(membershipRequests)
        .where(eq(membershipRequests.id, id))
        .limit(1);

      if (!request) {
        res.status(404).json({ error: 'Pengajuan tidak ditemukan.' });
        return;
      }

      // Validasi hak akses: Caller harus ADMIN aktif di komunitas pengajuan ini
      const [adminMembership] = await db
        .select()
        .from(communityMemberships)
        .where(
          and(
            eq(communityMemberships.userId, req.user!.userId),
            eq(communityMemberships.communityId, request.communityId)
          )
        )
        .limit(1);

      if (!adminMembership || adminMembership.role !== 'ADMIN' || adminMembership.status !== 'AKTIF') {
        res.status(403).json({ error: 'Akses ditolak: Hanya Admin Komunitas yang berwenang meninjau pengajuan.' });
        return;
      }

      if (request.status !== 'pending') {
        res.status(409).json({
          error: `Pengajuan ini sudah pernah ditinjau sebelumnya (Status: ${request.status}).`,
        });
        return;
      }

      const now = new Date();

      // Wrap approval or rejection atomically in a single PostgreSQL transaction
      const result = await db.transaction(async (tx) => {
        // Atomic conditional update: only update if status is still 'pending'
        const [updatedRequest] = await tx
          .update(membershipRequests)
          .set({
            status,
            reviewedBy: req.user!.userId,
            reviewedAt: now,
            adminNotes: adminNotes ? adminNotes.trim() : null,
            updatedAt: now,
          })
          .where(
            and(
              eq(membershipRequests.id, id),
              eq(membershipRequests.status, 'pending')
            )
          )
          .returning();

        if (!updatedRequest) {
          throw new Error('CONFLICT_ALREADY_REVIEWED');
        }

        if (status === 'approved') {
          // Tambahkan atau aktifkan di community_memberships
          await tx
            .insert(communityMemberships)
            .values({
              userId: request.userId,
              communityId: request.communityId,
              role: 'MEMBER',
              status: 'AKTIF',
              displayName: request.userName,
              position: request.position,
              jerseyNumber: request.jerseyNumber,
              joinedAt: now,
              updatedAt: now,
            })
            .onConflictDoUpdate({
              target: [communityMemberships.userId, communityMemberships.communityId],
              set: {
                role: 'MEMBER',
                status: 'AKTIF',
                displayName: request.userName,
                position: request.position,
                jerseyNumber: request.jerseyNumber,
                updatedAt: now,
              },
            });

          // Juga sinkronkan ke community_members agar tampil di daftar anggota tim
          const [existingCm] = await tx
            .select({ id: communityMembers.id })
            .from(communityMembers)
            .where(
              and(
                eq(communityMembers.communityId, request.communityId),
                eq(communityMembers.accountId, request.userId)
              )
            )
            .limit(1);

          if (existingCm) {
            await tx
              .update(communityMembers)
              .set({
                nickname: request.userName,
                fullName: request.userName,
                email: request.userEmail,
                position: request.position || 'Gelandang',
                jerseyNumber: request.jerseyNumber || 10,
                status: 'Aktif',
                role: 'member',
                memberType: 'REGISTERED',
                updatedAt: now,
              })
              .where(eq(communityMembers.id, existingCm.id));
          } else {
            await tx.insert(communityMembers).values({
              id: `mem-${request.userId}`,
              communityId: request.communityId,
              accountId: request.userId,
              nickname: request.userName,
              fullName: request.userName,
              whatsapp: '',
              email: request.userEmail,
              position: request.position || 'Gelandang',
              jerseyNumber: request.jerseyNumber || 10,
              role: 'member',
              status: 'Aktif',
              memberType: 'REGISTERED',
              joinedAt: now,
              createdAt: now,
              updatedAt: now,
            });
          }
        } else if (status === 'rejected') {
          // Jika ditolak, nonaktifkan membership jika sebelumnya ada
          await tx
            .update(communityMemberships)
            .set({ status: 'NONAKTIF', updatedAt: now })
            .where(
              and(
                eq(communityMemberships.userId, request.userId),
                eq(communityMemberships.communityId, request.communityId)
              )
            );
        }

        return updatedRequest;
      });

      res.status(200).json({
        message: status === 'approved' ? 'Pengajuan keanggotaan berhasil disetujui.' : 'Pengajuan keanggotaan telah ditolak.',
        request: result,
      });
    } catch (error: any) {
      if (error?.message === 'CONFLICT_ALREADY_REVIEWED') {
        res.status(409).json({ error: 'Pengajuan tidak ditemukan atau sudah pernah ditinjau oleh admin lain.' });
        return;
      }
      console.error('[Membership Requests API] Error reviewing request:', error);
      res.status(500).json({ error: 'Gagal meninjau pengajuan keanggotaan. Terjadi kesalahan database.' });
    }
  }
);
