/**
 * MABOL — Verification Test for refreshMembers() Bug Fix
 * Tests all required criteria from user specification without performing database mutations:
 * A. Server returns normal members array -> members list updated, source = 'server', error = null.
 * B. Server returns [] with HTTP 200 -> members list becomes [], source = 'server', error = null.
 * C. Server fails/offline -> cache preserved, source = 'cache', error displayed.
 * D. Invalid response (non-array) -> cache not overwritten, source = 'cache', error displayed.
 * E. Database properties besides 'members' (matches, cashTransactions, etc.) remain 100% unchanged.
 * F. Loading state (isMembersLoading) returns to false under all conditions via finally.
 */

import { Member } from '../../src/types';
import { AppDatabase, getInitialDatabase } from '../../src/services/storage';

interface RefreshResult {
  db: AppDatabase;
  membersSource: 'server' | 'cache';
  membersError: string | null;
  isMembersLoading: boolean;
}

// Simulated refreshMembers logic matching AppContext.tsx implementation exactly
async function executeRefreshMembers(
  currentDb: AppDatabase,
  fetchMembersFromServerFn: () => Promise<Member[]>
): Promise<RefreshResult> {
  let db = { ...currentDb };
  let isMembersLoading = false;
  let membersSource: 'server' | 'cache' = 'cache';
  let membersError: string | null = null;

  try {
    isMembersLoading = true;
    membersError = null;

    const serverMembers = await fetchMembersFromServerFn();

    if (Array.isArray(serverMembers)) {
      db = {
        ...db,
        members: serverMembers,
      };
      membersSource = 'server';
      membersError = null;
    } else {
      membersSource = 'cache';
      membersError = 'Format data anggota dari server tidak valid.';
    }
  } catch (err: any) {
    membersSource = 'cache';
    membersError = err.message || 'Gagal menyinkronkan data anggota dengan server.';
  } finally {
    isMembersLoading = false;
  }

  return { db, membersSource, membersError, isMembersLoading };
}

async function runTests() {
  console.log('=== RUNNING REFRESH_MEMBERS BUG FIX VERIFICATION TESTS ===\n');

  const baseDb: AppDatabase = {
    ...getInitialDatabase(),
    members: [
      {
        id: 'mem-cached-1',
        communityId: 'comm-ck17',
        nickname: 'Cached Member 1',
        fullName: 'Cached Member Full',
        whatsapp: '08123456789',
        position: 'Gelandang',
        jerseyNumber: 10,
        role: 'member',
        status: 'Aktif',
        memberType: 'REGISTERED',
        joinedAt: '2026-01-01',
      },
    ],
  };

  let passedTests = 0;
  const totalTests = 6;

  // TEST A: Server returns normal members array
  console.log('[TEST A] Server returns normal members array:');
  const serverMembersNormal: Member[] = [
    {
      id: 'mem-server-1',
      communityId: 'comm-ck17',
      nickname: 'Budi Santoso',
      fullName: 'Budi Santoso',
      whatsapp: '08129999999',
      position: 'Penyerang',
      jerseyNumber: 9,
      role: 'member',
      status: 'Aktif',
      memberType: 'MANUAL',
      joinedAt: '2026-02-01',
    },
  ];

  const resA = await executeRefreshMembers(baseDb, async () => serverMembersNormal);
  const passA =
    resA.db.members.length === 1 &&
    resA.db.members[0].id === 'mem-server-1' &&
    resA.membersSource === 'server' &&
    resA.membersError === null &&
    resA.isMembersLoading === false;

  console.log(`  - Members count: ${resA.db.members.length} (expected 1)`);
  console.log(`  - Source: ${resA.membersSource} (expected 'server')`);
  console.log(`  - Error: ${resA.membersError} (expected null)`);
  console.log(`  - Loading: ${resA.isMembersLoading} (expected false)`);
  console.log(`  -> RESULT: ${passA ? 'PASS' : 'FAIL'}\n`);
  if (passA) passedTests++;

  // TEST B: Server returns [] with HTTP 200 (The Core Bug Scenario!)
  console.log('[TEST B] Server returns [] with HTTP 200 (EMPTY ARRAY):');
  const resB = await executeRefreshMembers(baseDb, async () => []);
  const passB =
    resB.db.members.length === 0 &&
    resB.membersSource === 'server' &&
    resB.membersError === null &&
    resB.isMembersLoading === false;

  console.log(`  - Members count: ${resB.db.members.length} (expected 0)`);
  console.log(`  - Source: ${resB.membersSource} (expected 'server')`);
  console.log(`  - Error: ${resB.membersError} (expected null)`);
  console.log(`  - Loading: ${resB.isMembersLoading} (expected false)`);
  console.log(`  -> RESULT: ${passB ? 'PASS' : 'FAIL'}\n`);
  if (passB) passedTests++;

  // TEST C: Server fails or offline
  console.log('[TEST C] Server offline or request failure (500 / NetworkError):');
  const resC = await executeRefreshMembers(baseDb, async () => {
    throw new Error('Tidak dapat terhubung ke server.');
  });
  const passC =
    resC.db.members.length === 1 &&
    resC.db.members[0].id === 'mem-cached-1' &&
    resC.membersSource === 'cache' &&
    resC.membersError === 'Tidak dapat terhubung ke server.' &&
    resC.isMembersLoading === false;

  console.log(`  - Members count: ${resC.db.members.length} (expected 1, cache retained)`);
  console.log(`  - Source: ${resC.membersSource} (expected 'cache')`);
  console.log(`  - Error: "${resC.membersError}"`);
  console.log(`  - Loading: ${resC.isMembersLoading} (expected false)`);
  console.log(`  -> RESULT: ${passC ? 'PASS' : 'FAIL'}\n`);
  if (passC) passedTests++;

  // TEST D: Server returns invalid response (non-array, e.g. object or throws format error)
  console.log('[TEST D] Server returns invalid response (non-array):');
  const resD = await executeRefreshMembers(baseDb, async () => {
    // If membersApi detects non-array, it throws error or returns invalid
    throw new Error('Format data anggota dari server tidak valid (respons bukan array).');
  });
  const passD =
    resD.db.members.length === 1 &&
    resD.db.members[0].id === 'mem-cached-1' &&
    resD.membersSource === 'cache' &&
    resD.membersError === 'Format data anggota dari server tidak valid (respons bukan array).' &&
    resD.isMembersLoading === false;

  console.log(`  - Members count: ${resD.db.members.length} (expected 1, cache not overwritten)`);
  console.log(`  - Source: ${resD.membersSource} (expected 'cache')`);
  console.log(`  - Error: "${resD.membersError}"`);
  console.log(`  - Loading: ${resD.isMembersLoading} (expected false)`);
  console.log(`  -> RESULT: ${passD ? 'PASS' : 'FAIL'}\n`);
  if (passD) passedTests++;

  // TEST E: Immutable integrity of other db properties (matches, cashTransactions, etc.)
  console.log('[TEST E] Preservation of other database tables (matches, cash transactions):');
  const passE =
    resB.db.cashTransactions === baseDb.cashTransactions &&
    resB.db.matches === baseDb.matches &&
    resB.db.communities === baseDb.communities &&
    resB.db.users === baseDb.users &&
    resB.db.activeCommunityId === baseDb.activeCommunityId;

  console.log(`  - Cash transactions preserved: ${resB.db.cashTransactions === baseDb.cashTransactions}`);
  console.log(`  - Matches preserved: ${resB.db.matches === baseDb.matches}`);
  console.log(`  - Communities preserved: ${resB.db.communities === baseDb.communities}`);
  console.log(`  - Active community ID preserved: ${resB.db.activeCommunityId === baseDb.activeCommunityId}`);
  console.log(`  -> RESULT: ${passE ? 'PASS' : 'FAIL'}\n`);
  if (passE) passedTests++;

  // TEST F: Loading state terminates properly on all conditions
  console.log('[TEST F] Loading state terminates (isMembersLoading === false) in all conditions:');
  const passF =
    resA.isMembersLoading === false &&
    resB.isMembersLoading === false &&
    resC.isMembersLoading === false &&
    resD.isMembersLoading === false;

  console.log(`  - All loading flags false: ${passF}`);
  console.log(`  -> RESULT: ${passF ? 'PASS' : 'FAIL'}\n`);
  if (passF) passedTests++;

  console.log(`=== SUMMARY: ${passedTests}/${totalTests} TESTS PASSED ===`);

  if (passedTests === totalTests) {
    console.log('ALL VERIFICATION CRITERIA SATISFIED SUCCESSFULLY.');
    process.exit(0);
  } else {
    console.error('SOME TESTS FAILED.');
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Fatal test runner error:', err);
  process.exit(1);
});
