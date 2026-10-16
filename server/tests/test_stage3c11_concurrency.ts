/**
 * MABOL — Verification Test Suite for Stage 3C.1.1 (Members Refresh Concurrency Safety)
 *
 * All tests are 100% IN-MEMORY and use mocks. Zero database mutations.
 *
 * Mandatory Test Scenarios:
 * A. Request lama selesai setelah request baru: hasil lama diabaikan.
 * B. Komunitas berubah saat request berjalan: hasil untuk komunitas lama diabaikan.
 * C. Request baru selesai lebih dulu: request lama yang lambat tidak menimpa data baru atau menghentikan loading.
 * D. Request terbaru gagal: cache anggota tetap dipertahankan dan error ditampilkan.
 * E. Respons terbaru adalah array kosong []: anggota menjadi kosong, sumber server, dan error null.
 * F. Seluruh tabel non-anggota tetap utuh dan loading berakhir false setelah request terbaru selesai.
 */

import { Member } from '../../src/types';
import { AppDatabase, getInitialDatabase } from '../../src/services/storage';
import {
  MembersRefreshCoordinator,
  MembersRefreshState,
} from '../../src/services/membersRefreshCoordinator';

// Helper to delay async execution
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Simulated AppContext environment hosting state and coordinator
class SimulatedAppContext {
  public coordinator: MembersRefreshCoordinator;
  public state: MembersRefreshState;

  constructor(initialDb: AppDatabase, initialCommunityId: string = 'comm-ck17') {
    this.coordinator = new MembersRefreshCoordinator(initialCommunityId);
    this.state = {
      db: { ...initialDb, activeCommunityId: initialCommunityId },
      membersSource: 'cache',
      membersError: null,
      isMembersLoading: false,
    };
  }

  public switchCommunity(communityId: string) {
    this.coordinator.setActiveCommunityId(communityId);
    this.state = {
      ...this.state,
      db: { ...this.state.db, activeCommunityId: communityId },
    };
  }

  /**
   * Replicates the exact dispatch and resolution cycle implemented in AppContext.tsx
   */
  public async refreshMembers(
    fetchMock: (commId: string) => Promise<Member[] | unknown>,
    targetCommunityId?: string
  ): Promise<{ requestId: number; communityId: string }> {
    if (targetCommunityId && targetCommunityId !== this.coordinator.getActiveCommunityId()) {
      this.coordinator.setActiveCommunityId(targetCommunityId);
    }

    const { requestId, communityId } = this.coordinator.startRequest(targetCommunityId);

    this.state = {
      ...this.state,
      isMembersLoading: true,
      membersError: null,
    };

    try {
      const serverMembers = await fetchMock(communityId);

      // Concurrency check matching AppContext.tsx:
      if (!this.coordinator.isRequestCurrent(requestId, communityId)) {
        return { requestId, communityId };
      }

      if (Array.isArray(serverMembers)) {
        this.state = {
          ...this.state,
          db: {
            ...this.state.db,
            members: serverMembers as Member[],
          },
          membersSource: 'server',
          membersError: null,
        };
      } else {
        this.state = {
          ...this.state,
          membersSource: 'cache',
          membersError: 'Format data anggota dari server tidak valid.',
        };
      }
    } catch (err: any) {
      if (!this.coordinator.isRequestCurrent(requestId, communityId)) {
        return { requestId, communityId };
      }

      this.state = {
        ...this.state,
        membersSource: 'cache',
        membersError: err.message || 'Gagal menyinkronkan data anggota dengan server.',
      };
    } finally {
      if (this.coordinator.shouldFinalizeLoading(requestId, communityId)) {
        this.state = {
          ...this.state,
          isMembersLoading: false,
        };
      }
    }

    return { requestId, communityId };
  }
}

// Sample Data Generators
function createMockMember(id: string, name: string, commId: string = 'comm-ck17'): Member {
  return {
    id,
    communityId: commId,
    nickname: name,
    fullName: name,
    whatsapp: '0812000000',
    position: 'Gelandang',
    jerseyNumber: 10,
    role: 'member',
    status: 'Aktif',
    memberType: 'MANUAL',
    joinedAt: '2026-01-01',
  };
}

async function runConcurrencyTestSuite() {
  console.log('=== RUNNING STAGE 3C.1.1 MEMBERS REFRESH CONCURRENCY SAFETY TESTS ===\n');

  const baseDb: AppDatabase = {
    ...getInitialDatabase(),
    members: [createMockMember('mem-cached-init', 'Anggota Cache Awal', 'comm-ck17')],
    cashTransactions: [
      {
        id: 'trx-opening-1',
        communityId: 'comm-ck17',
        type: 'Pemasukan',
        amount: 145000,
        category: 'Kas Awal',
        description: 'Saldo Kas Awal',
        date: '2026-01-01',
        createdBy: 'Dicky Maulana',
      },
    ],
  };

  let passedCount = 0;
  const totalCount = 6;

  // --------------------------------------------------------------------------
  // TEST A: Request lama selesai setelah request baru: hasil lama diabaikan
  // --------------------------------------------------------------------------
  console.log('[TEST A] Request lama selesai setelah request baru -> hasil lama diabaikan:');
  {
    const ctx = new SimulatedAppContext(baseDb, 'comm-ck17');

    const memberOld = [createMockMember('mem-req-1', 'Old Request Member', 'comm-ck17')];
    const memberNew = [createMockMember('mem-req-2', 'New Request Member', 'comm-ck17')];

    // Request 1: Slow (120ms)
    const p1 = ctx.refreshMembers(async () => {
      await delay(120);
      return memberOld;
    });

    // Request 2: Starts slightly later (20ms), finishes faster (40ms total delay -> resolves at 60ms)
    await delay(20);
    const p2 = ctx.refreshMembers(async () => {
      await delay(40);
      return memberNew;
    });

    await Promise.all([p1, p2]);

    const passA =
      ctx.state.db.members.length === 1 &&
      ctx.state.db.members[0].id === 'mem-req-2' &&
      ctx.state.membersSource === 'server' &&
      ctx.state.membersError === null &&
      ctx.state.isMembersLoading === false;

    console.log(`  - Final member ID: ${ctx.state.db.members[0]?.id} (expected 'mem-req-2')`);
    console.log(`  - Source: ${ctx.state.membersSource} (expected 'server')`);
    console.log(`  - Error: ${ctx.state.membersError} (expected null)`);
    console.log(`  - Loading: ${ctx.state.isMembersLoading} (expected false)`);
    console.log(`  -> RESULT: ${passA ? 'PASS' : 'FAIL'}\n`);
    if (passA) passedCount++;
  }

  // --------------------------------------------------------------------------
  // TEST B: Komunitas berubah saat request berjalan -> hasil komunitas lama diabaikan
  // --------------------------------------------------------------------------
  console.log('[TEST B] Komunitas berubah saat request berjalan -> hasil untuk komunitas lama diabaikan:');
  {
    const ctx = new SimulatedAppContext(baseDb, 'comm-ck17');

    const memberCK17 = [createMockMember('mem-ck17', 'Member CK17', 'comm-ck17')];

    // Request starts for comm-ck17 with 100ms delay
    const p = ctx.refreshMembers(async () => {
      await delay(100);
      return memberCK17;
    });

    // User switches to 'comm-barcelona' at 20ms
    await delay(20);
    ctx.switchCommunity('comm-barcelona');

    await p;

    // The result from comm-ck17 must NOT overwrite db.members of comm-barcelona
    const passB =
      ctx.state.db.members[0]?.id === 'mem-cached-init' &&
      ctx.state.db.activeCommunityId === 'comm-barcelona';

    console.log(`  - Member ID: ${ctx.state.db.members[0]?.id} (retained initial cache, not overwritten)`);
    console.log(`  - Active Community: ${ctx.state.db.activeCommunityId}`);
    console.log(`  -> RESULT: ${passB ? 'PASS' : 'FAIL'}\n`);
    if (passB) passedCount++;
  }

  // --------------------------------------------------------------------------
  // TEST C: Request baru selesai lebih dulu -> request lama lambat tidak menimpa data baru atau menghentikan loading
  // --------------------------------------------------------------------------
  console.log('[TEST C] Request baru selesai lebih dulu -> request lama lambat tidak menimpa data atau loading:');
  {
    const ctx = new SimulatedAppContext(baseDb, 'comm-ck17');

    const memberOld = [createMockMember('mem-old', 'Anggota Lama', 'comm-ck17')];
    const memberNew = [createMockMember('mem-new', 'Anggota Baru', 'comm-ck17')];

    // Request 1 starts (delay 150ms)
    const p1 = ctx.refreshMembers(async () => {
      await delay(150);
      return memberOld;
    });

    // Request 2 starts at t=20ms (delay 30ms -> finishes at t=50ms)
    await delay(20);
    const p2 = ctx.refreshMembers(async () => {
      await delay(30);
      return memberNew;
    });

    // Wait until Request 2 completes (at t=60ms), while Request 1 is still in-flight
    await p2;

    const midStateValid =
      ctx.state.db.members[0]?.id === 'mem-new' &&
      ctx.state.isMembersLoading === false;

    // Wait for the slow Request 1 to complete
    await p1;

    const passC =
      midStateValid &&
      ctx.state.db.members[0]?.id === 'mem-new' &&
      ctx.state.membersSource === 'server' &&
      ctx.state.isMembersLoading === false;

    console.log(`  - Mid-flight state after Req 2: member ID = ${ctx.state.db.members[0]?.id}, loading = ${ctx.state.isMembersLoading}`);
    console.log(`  - Post-flight state after Req 1 completed: member ID = ${ctx.state.db.members[0]?.id} (not overwritten)`);
    console.log(`  -> RESULT: ${passC ? 'PASS' : 'FAIL'}\n`);
    if (passC) passedCount++;
  }

  // --------------------------------------------------------------------------
  // TEST D: Request terbaru gagal: cache anggota tetap dipertahankan dan error ditampilkan
  // --------------------------------------------------------------------------
  console.log('[TEST D] Request terbaru gagal -> cache anggota dipertahankan dan error ditampilkan:');
  {
    const ctx = new SimulatedAppContext(baseDb, 'comm-ck17');

    await ctx.refreshMembers(async () => {
      throw new Error('500 Internal Server Error: Database down');
    });

    const passD =
      ctx.state.db.members.length === 1 &&
      ctx.state.db.members[0].id === 'mem-cached-init' &&
      ctx.state.membersSource === 'cache' &&
      ctx.state.membersError === '500 Internal Server Error: Database down' &&
      ctx.state.isMembersLoading === false;

    console.log(`  - Members count: ${ctx.state.db.members.length} (cache preserved)`);
    console.log(`  - Source: ${ctx.state.membersSource} (expected 'cache')`);
    console.log(`  - Error: "${ctx.state.membersError}"`);
    console.log(`  - Loading: ${ctx.state.isMembersLoading} (expected false)`);
    console.log(`  -> RESULT: ${passD ? 'PASS' : 'FAIL'}\n`);
    if (passD) passedCount++;
  }

  // --------------------------------------------------------------------------
  // TEST E: Respons terbaru adalah array kosong []: anggota menjadi kosong, sumber server, dan error null
  // --------------------------------------------------------------------------
  console.log('[TEST E] Respons terbaru adalah array kosong [] -> anggota menjadi kosong, sumber server, error null:');
  {
    const ctx = new SimulatedAppContext(baseDb, 'comm-ck17');

    await ctx.refreshMembers(async () => []);

    const passE =
      ctx.state.db.members.length === 0 &&
      ctx.state.membersSource === 'server' &&
      ctx.state.membersError === null &&
      ctx.state.isMembersLoading === false;

    console.log(`  - Members count: ${ctx.state.db.members.length} (expected 0)`);
    console.log(`  - Source: ${ctx.state.membersSource} (expected 'server')`);
    console.log(`  - Error: ${ctx.state.membersError} (expected null)`);
    console.log(`  - Loading: ${ctx.state.isMembersLoading} (expected false)`);
    console.log(`  -> RESULT: ${passE ? 'PASS' : 'FAIL'}\n`);
    if (passE) passedCount++;
  }

  // --------------------------------------------------------------------------
  // TEST F: Seluruh tabel non-anggota tetap utuh dan loading berakhir false setelah request terbaru selesai
  // --------------------------------------------------------------------------
  console.log('[TEST F] Seluruh tabel non-anggota tetap utuh & loading berakhir false:');
  {
    const ctx = new SimulatedAppContext(baseDb, 'comm-ck17');

    // Run multiple actions in sequence
    await ctx.refreshMembers(async () => [createMockMember('m-1', 'Satu')]);
    ctx.switchCommunity('comm-ck17');
    await ctx.refreshMembers(async () => [createMockMember('m-2', 'Dua')]);

    const passF =
      ctx.state.db.cashTransactions === baseDb.cashTransactions &&
      ctx.state.db.matches === baseDb.matches &&
      ctx.state.db.communities === baseDb.communities &&
      ctx.state.db.users === baseDb.users &&
      ctx.state.db.cashTransactions[0].amount === 145000 &&
      ctx.state.isMembersLoading === false;

    console.log(`  - Cash transactions preserved: ${ctx.state.db.cashTransactions === baseDb.cashTransactions}`);
    console.log(`  - Cash opening transaction amount: Rp${ctx.state.db.cashTransactions[0].amount.toLocaleString('id-ID')}`);
    console.log(`  - Matches table preserved: ${ctx.state.db.matches === baseDb.matches}`);
    console.log(`  - Loading terminated: ${!ctx.state.isMembersLoading}`);
    console.log(`  -> RESULT: ${passF ? 'PASS' : 'FAIL'}\n`);
    if (passF) passedCount++;
  }

  // --------------------------------------------------------------------------
  // Summary
  // --------------------------------------------------------------------------
  console.log(`=== SUMMARY: ${passedCount}/${totalCount} TESTS PASSED ===`);
  if (passedCount === totalCount) {
    console.log('ALL CONCURRENCY VERIFICATION CRITERIA SATISFIED SUCCESSFULLY.');
    process.exit(0);
  } else {
    console.error('CONCURRENCY TESTS FAILED.');
    process.exit(1);
  }
}

runConcurrencyTestSuite().catch((err) => {
  console.error('Fatal concurrency test failure:', err);
  process.exit(1);
});
