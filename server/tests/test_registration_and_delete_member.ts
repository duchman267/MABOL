import { db } from '../../src/db/index.ts';
import {
  accounts,
  communityMemberships,
  communityMembers,
  membershipRequests,
  cashTransactions,
  matches,
  matchParticipants,
  matchPayments,
} from '../../src/db/schema.ts';
import { eq, and } from 'drizzle-orm';

const BASE_URL = 'http://localhost:3000';

async function runRegistrationAndDeleteTests() {
  console.log('================================================================');
  console.log('   MABOL — VERIFIKASI END-TO-END REGISTRASI & HAPUS ANGGOTA');
  console.log('================================================================\n');

  // Baseline Safety Snapshot
  const initialCash = await db.select().from(cashTransactions);
  const initialMatches = await db.select().from(matches);
  const initialPayments = await db.select().from(matchPayments);
  console.log(`[Safety Snapshot] Transaksi kas: ${initialCash.length}, Pertandingan: ${initialMatches.length}, Pembayaran: ${initialPayments.length}`);

  // --------------------------------------------------------------------------
  // BAGIAN 1: TEST REGISTRASI & PENGAJUAN DEFAULT CORNERKICK17 OLAHGAYA
  // --------------------------------------------------------------------------
  console.log('\n--- BAGIAN 1: PENGUJIAN REGISTRASI DEFAULT KE CORNERKICK17 ---');

  const uniqueSuffix = Date.now();
  const testUserEmail = `pemain.baru.${uniqueSuffix}@mabol.test`;
  const testUserName = `Pemain Baru ${uniqueSuffix}`;
  const testPassword = 'password123';

  console.log(`1.1 Registrasi akun baru (${testUserEmail})...`);
  const regRes = await fetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: testUserName,
      email: testUserEmail,
      password: testPassword,
    }),
  });

  if (regRes.status !== 201) {
    throw new Error(`FAIL: Registrasi gagal dengan status ${regRes.status}: ${await regRes.text()}`);
  }
  const regData = await regRes.json();
  const userToken = regData.token;
  const userId = regData.user.id;
  console.log(`✓ PASS: Akun berhasil dibuat di server (userId=${userId}).`);

  // 1.2 Otomatis ajukan ke Cornerkick17 OLAHGAYA (comm-ck17)
  console.log('1.2 Mengajukan keanggotaan ke Cornerkick17 OLAHGAYA (comm-ck17)...');
  const userHeaders: HeadersInit = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${userToken}`,
  };

  const reqRes = await fetch(`${BASE_URL}/api/membership-requests`, {
    method: 'POST',
    headers: userHeaders,
    body: JSON.stringify({
      communityId: 'comm-ck17',
      position: 'Penyerang',
      jerseyNumber: 9,
      notes: 'Pendaftaran anggota baru Cornerkick17 OLAHGAYA',
    }),
  });

  if (reqRes.status !== 201) {
    throw new Error(`FAIL: Pengajuan membership gagal: ${reqRes.status} ${await reqRes.text()}`);
  }
  const reqData = await reqRes.json();
  const requestId = reqData.request.id;
  console.log(`✓ PASS: Pengajuan keanggotaan tercatat di backend (requestId=${requestId}, status=${reqData.request.status}).`);

  // 1.3 Cegah pengajuan ganda (Duplicate submission prevention)
  console.log('1.3 Pengujian pencegahan pengajuan ganda...');
  const dupRes = await fetch(`${BASE_URL}/api/membership-requests`, {
    method: 'POST',
    headers: userHeaders,
    body: JSON.stringify({
      communityId: 'comm-ck17',
      position: 'Penyerang',
      jerseyNumber: 9,
    }),
  });

  if (dupRes.status === 409) {
    console.log('✓ PASS: Pengajuan ganda berhasil dicegah dengan HTTP 409 Conflict.');
  } else {
    throw new Error(`FAIL: Pengajuan ganda tidak dicegah, didapat status ${dupRes.status}`);
  }

  // 1.4 Admin melihat pengajuan di daftar review
  console.log('1.4 Autentikasi Admin Dicky & verifikasi pengajuan muncul di admin...');
  const adminLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'dickymaulanazayn@gmail.com',
      password: 'password123',
    }),
  });

  if (adminLoginRes.status !== 200) {
    throw new Error(`FAIL: Login admin gagal: ${adminLoginRes.status}`);
  }
  const adminLoginData = await adminLoginRes.json();
  const adminToken = adminLoginData.token;
  const adminHeaders: HeadersInit = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${adminToken}`,
  };

  const pendingListRes = await fetch(`${BASE_URL}/api/membership-requests?communityId=comm-ck17&status=pending`, {
    headers: adminHeaders,
  });
  const pendingData = await pendingListRes.json();
  const foundPending = pendingData.requests.find((r: any) => r.id === requestId);
  if (!foundPending) {
    throw new Error(`FAIL: Pengajuan ${requestId} tidak ditemukan di daftar pending admin`);
  }
  console.log(`✓ PASS: Pengajuan ${requestId} (${testUserName}) terlihat di daftar pengajuan admin.`);

  // 1.5 Admin menyetujui pengajuan
  console.log('1.5 Admin menyetujui pengajuan...');
  const approveRes = await fetch(`${BASE_URL}/api/membership-requests/${requestId}/review`, {
    method: 'POST',
    headers: adminHeaders,
    body: JSON.stringify({
      status: 'approved',
      adminNotes: 'Selamat bergabung di Cornerkick17!',
    }),
  });

  if (approveRes.status !== 200) {
    throw new Error(`FAIL: Admin approve gagal: ${approveRes.status} ${await approveRes.text()}`);
  }
  console.log('✓ PASS: Admin berhasil menyetujui pengajuan.');

  // 1.6 Verifikasi akun baru otomatis muncul di tabel community_members dan GET /api/members
  console.log('1.6 Verifikasi sinkronisasi ke tabel community_members dan GET /api/members...');
  const membersRes = await fetch(`${BASE_URL}/api/members?communityId=comm-ck17`, {
    headers: adminHeaders,
  });
  const membersList = await membersRes.json();
  const memberInList = membersList.find((m: any) => m.accountId === userId || m.email === testUserEmail);

  if (!memberInList) {
    throw new Error(`FAIL: Anggota baru ${testUserName} tidak ditemukan di GET /api/members!`);
  }
  console.log(`✓ PASS: Anggota baru ditemukan di daftar anggota tim: id=${memberInList.id}, status=${memberInList.status}, role=${memberInList.role}.`);

  // 1.7 Verifikasi akun baru dapat login dan membership-nya aktif
  console.log('1.7 Verifikasi login ulang pendaftar baru...');
  const reLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: testUserEmail,
      password: testPassword,
    }),
  });
  const reLoginData = await reLoginRes.json();
  const activeComm = reLoginData.memberships?.find((m: any) => m.communityId === 'comm-ck17' && m.status === 'AKTIF');
  if (!activeComm) {
    throw new Error(`FAIL: Membership comm-ck17 tidak aktif saat login ulang: ${JSON.stringify(reLoginData.memberships)}`);
  }
  console.log(`✓ PASS: Pengguna baru login ulang dengan membership Cornerkick17 AKTIF (tanpa perlu pilih komunitas lagi).`);

  // --------------------------------------------------------------------------
  // BAGIAN 2: TEST HAPUS ANGGOTA TIM (ADMIN)
  // --------------------------------------------------------------------------
  console.log('\n--- BAGIAN 2: PENGUJIAN FITUR HAPUS ANGGOTA TIM ---');

  // 2.1 Buat anggota manual untuk diuji hapus
  console.log('2.1 Admin membuat anggota manual untuk pengujian hapus...');
  const createManualRes = await fetch(`${BASE_URL}/api/members/manual`, {
    method: 'POST',
    headers: adminHeaders,
    body: JSON.stringify({
      communityId: 'comm-ck17',
      name: `Anggota Manual Hapus ${uniqueSuffix}`,
      whatsapp: `0899${uniqueSuffix.toString().slice(-8)}`,
      position: 'Bek',
      jerseyNumber: 13,
    }),
  });
  if (createManualRes.status !== 201) {
    throw new Error(`FAIL: Gagal membuat anggota manual: ${createManualRes.status}`);
  }
  const manualMember = await createManualRes.json();
  console.log(`✓ PASS: Anggota manual dibuat: id=${manualMember.id}.`);

  // 2.2 Non-admin tidak boleh menghapus anggota
  console.log('2.2 Verifikasi RBAC: Non-admin ditolak saat mencoba menghapus...');
  const unauthDeleteRes = await fetch(`${BASE_URL}/api/members/${manualMember.id}?communityId=comm-ck17`, {
    method: 'DELETE',
    headers: userHeaders, // Regular member token
  });
  if (unauthDeleteRes.status === 403) {
    console.log('✓ PASS: Non-admin ditolak dengan HTTP 403 Forbidden.');
  } else {
    throw new Error(`FAIL: Non-admin tidak ditolak, didapat ${unauthDeleteRes.status}`);
  }

  // 2.3 Admin menghapus anggota manual tanpa riwayat pertandingan (Clean Delete)
  console.log('2.3 Admin menghapus anggota manual...');
  const deleteManualRes = await fetch(`${BASE_URL}/api/members/${manualMember.id}?communityId=comm-ck17`, {
    method: 'DELETE',
    headers: adminHeaders,
  });
  if (deleteManualRes.status !== 200) {
    throw new Error(`FAIL: Admin delete failed with ${deleteManualRes.status}: ${await deleteManualRes.text()}`);
  }
  const delManualData = await deleteManualRes.json();
  console.log(`✓ PASS: Anggota manual berhasil dihapus: action=${delManualData.action}, message="${delManualData.message}".`);

  // Verifikasi record terhapus dari database
  const [checkDeleted] = await db
    .select()
    .from(communityMembers)
    .where(eq(communityMembers.id, manualMember.id))
    .limit(1);
  if (checkDeleted) {
    throw new Error(`FAIL: Anggota manual masih ada di database!`);
  }
  console.log('✓ PASS: Database mengonfirmasi anggota manual telah bersih terhapus.');

  // 2.4 Admin menghapus/menonaktifkan anggota terdaftar (Soft delete & account preservation)
  console.log('2.4 Admin menghapus keanggotaan terdaftar...');
  const deleteRegisteredRes = await fetch(`${BASE_URL}/api/members/${memberInList.id}?communityId=comm-ck17`, {
    method: 'DELETE',
    headers: adminHeaders,
  });
  if (deleteRegisteredRes.status !== 200) {
    throw new Error(`FAIL: Gagal menghapus anggota terdaftar: ${deleteRegisteredRes.status}: ${await deleteRegisteredRes.text()}`);
  }
  const delRegData = await deleteRegisteredRes.json();
  console.log(`✓ PASS: Anggota terdaftar diproses: action=${delRegData.action}, message="${delRegData.message}".`);

  // Verifikasi akun login di tabel `accounts` TIDAK terhapus
  const [checkAccountStillExists] = await db
    .select()
    .from(accounts)
    .where(eq(accounts.id, userId))
    .limit(1);
  if (!checkAccountStillExists) {
    throw new Error(`FAIL: Akun autentikasi ${userId} terhapus secara tidak sengaja!`);
  }
  console.log(`✓ PASS: Akun login di tabel accounts (${checkAccountStillExists.email}) TETAP AMAN dan tidak terhapus.`);

  // 2.5 Perlindungan Akun Admin Utama
  console.log('2.5 Verifikasi akun admin utama tidak dapat dihapus...');
  const deleteAdminRes = await fetch(`${BASE_URL}/api/members/mem-admin?communityId=comm-ck17`, {
    method: 'DELETE',
    headers: adminHeaders,
  });
  if (deleteAdminRes.status === 400) {
    console.log('✓ PASS: Penghapusan admin utama berhasil dicegah dengan HTTP 400.');
  } else {
    throw new Error(`FAIL: Penghapusan admin utama tidak dicegah: ${deleteAdminRes.status}`);
  }

  // --------------------------------------------------------------------------
  // BAGIAN 3: ATURAN KESELAMATAN DATA (DATA SAFETY INTEGRITY)
  // --------------------------------------------------------------------------
  console.log('\n--- BAGIAN 3: VERIFIKASI KESELAMATAN DATA (DATA SAFETY INTEGRITY) ---');
  const finalCash = await db.select().from(cashTransactions);
  const finalMatches = await db.select().from(matches);
  const finalPayments = await db.select().from(matchPayments);

  if (finalCash.length !== initialCash.length) {
    throw new Error(`FAIL: Transaksi kas berubah! Semula ${initialCash.length}, sekarang ${finalCash.length}`);
  }
  if (finalMatches.length !== initialMatches.length) {
    throw new Error(`FAIL: Pertandingan berubah! Semula ${initialMatches.length}, sekarang ${finalMatches.length}`);
  }
  if (finalPayments.length !== initialPayments.length) {
    throw new Error(`FAIL: Pembayaran berubah! Semula ${initialPayments.length}, sekarang ${finalPayments.length}`);
  }
  console.log('✓ PASS: Seluruh data historis kas, pertandingan, dan pembayaran 100% utuh tidak tersentuh.');

  // Cleanup test user account
  await db.delete(accounts).where(eq(accounts.id, userId));
  await db.delete(membershipRequests).where(eq(membershipRequests.id, requestId));
  console.log('✓ CLEANUP: Data pengujian sementara telah dibersihkan secara aman.');

  console.log('\n================================================================');
  console.log('   SEMUA PENGUJIAN REGISTRASI & HAPUS ANGGOTA BERHASIL 100%!');
  console.log('================================================================\n');
}

runRegistrationAndDeleteTests().catch((err) => {
  console.error('\n❌ PENGUJIAN GAGAL:', err);
  process.exit(1);
});
