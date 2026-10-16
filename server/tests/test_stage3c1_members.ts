import { db } from '../../src/db/index.ts';
import { communityMembers } from '../../src/db/schema.ts';
import { eq } from 'drizzle-orm';

const BASE_URL = 'http://localhost:3000';

async function runTests() {
  console.log('--- STARTING STAGE 3C.1 MEMBER INTEGRATION VERIFICATION ---');

  // Test 1: Unauthenticated request to GET /api/members should be rejected (401)
  console.log('Test 1: Unauthenticated GET /api/members...');
  const unauthGet = await fetch(`${BASE_URL}/api/members`);
  if (unauthGet.status === 401) {
    console.log('✓ PASS: Unauthenticated GET /api/members returned 401 Unauthorized.');
  } else {
    throw new Error(`FAIL: Expected 401, got ${unauthGet.status}`);
  }

  // Test 2: Unauthenticated POST /api/members/manual should be rejected (401)
  console.log('Test 2: Unauthenticated POST /api/members/manual...');
  const unauthPost = await fetch(`${BASE_URL}/api/members/manual`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Hacker', whatsapp: '08123456789' }),
  });
  if (unauthPost.status === 401) {
    console.log('✓ PASS: Unauthenticated POST /api/members/manual returned 401 Unauthorized.');
  } else {
    throw new Error(`FAIL: Expected 401, got ${unauthPost.status}`);
  }

  // Test 3: Authenticate as Admin (Dicky Maulana)
  console.log('Test 3: Admin authentication...');
  const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'dickymaulanazayn@gmail.com', password: 'password123' }),
  });
  if (loginRes.status !== 200) {
    throw new Error(`FAIL: Login failed with status ${loginRes.status}`);
  }
  const loginData = await loginRes.json();
  const token = loginData.token;
  const cookieHeader = loginRes.headers.get('set-cookie') || '';
  console.log('✓ PASS: Admin authenticated successfully.');

  const authHeaders: HeadersInit = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };

  // Test 4: Authenticated GET /api/members returns member list
  console.log('Test 4: Authenticated GET /api/members...');
  const membersRes = await fetch(`${BASE_URL}/api/members?communityId=comm-ck17`, {
    headers: authHeaders,
  });
  if (membersRes.status !== 200) {
    throw new Error(`FAIL: GET /api/members returned status ${membersRes.status}`);
  }
  const membersList = await membersRes.json();
  if (!Array.isArray(membersList) || membersList.length === 0) {
    throw new Error(`FAIL: Expected non-empty array of members, got: ${JSON.stringify(membersList)}`);
  }
  const adminMember = membersList.find((m: any) => m.accountId === 'usr-admin-dicky');
  if (!adminMember) {
    throw new Error('FAIL: Admin member usr-admin-dicky not found in members list');
  }
  console.log(`✓ PASS: GET /api/members returned ${membersList.length} members with admin verified.`);

  // Test 5: Validation error on POST /api/members/manual (missing required fields)
  console.log('Test 5: Validation handling on missing fields...');
  const valRes = await fetch(`${BASE_URL}/api/members/manual`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({ name: '', whatsapp: '' }),
  });
  if (valRes.status === 400) {
    const valData = await valRes.json();
    console.log(`✓ PASS: Missing fields rejected with 400: "${valData.error}".`);
  } else {
    throw new Error(`FAIL: Expected 400 for empty payload, got ${valRes.status}`);
  }

  // Test 6: Create Manual Member by Admin
  console.log('Test 6: Admin creates isolated manual member...');
  const testWa = `0899${Date.now().toString().slice(-8)}`;
  const createRes = await fetch(`${BASE_URL}/api/members/manual`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      communityId: 'comm-ck17',
      name: 'Bpk. Test Integrasi Stage 3C1',
      whatsapp: testWa,
      position: 'Bek',
      jerseyNumber: 88,
    }),
  });
  if (createRes.status !== 201) {
    const errText = await createRes.text();
    throw new Error(`FAIL: POST /api/members/manual returned ${createRes.status}: ${errText}`);
  }
  const createdMember = await createRes.json();
  if (createdMember.accountId !== null) {
    throw new Error(`FAIL: Manual member MUST have accountId = null, got ${createdMember.accountId}`);
  }
  if (createdMember.memberType !== 'MANUAL') {
    throw new Error(`FAIL: Manual member MUST have memberType = 'MANUAL', got ${createdMember.memberType}`);
  }
  if (createdMember.jerseyNumber !== 88 || createdMember.position !== 'Bek') {
    throw new Error(`FAIL: Attributes mismatch on created member: ${JSON.stringify(createdMember)}`);
  }
  console.log(`✓ PASS: Manual member created with id=${createdMember.id}, accountId=null, memberType=MANUAL.`);

  // Test 7: Update member details
  console.log('Test 7: Admin updates member details...');
  const updateRes = await fetch(`${BASE_URL}/api/members/${createdMember.id}`, {
    method: 'PUT',
    headers: authHeaders,
    body: JSON.stringify({
      communityId: 'comm-ck17',
      position: 'Gelandang',
      jerseyNumber: 99,
    }),
  });
  if (updateRes.status !== 200) {
    throw new Error(`FAIL: PUT /api/members/${createdMember.id} returned ${updateRes.status}`);
  }
  const updatedMember = await updateRes.json();
  if (updatedMember.jerseyNumber !== 99 || updatedMember.position !== 'Gelandang') {
    throw new Error(`FAIL: Member was not updated correctly: ${JSON.stringify(updatedMember)}`);
  }
  console.log(`✓ PASS: Member updated successfully to jersey #99 and position Gelandang.`);

  // Test 8: Soft delete / deactivation
  console.log('Test 8: Admin soft-deactivates member...');
  const deleteRes = await fetch(`${BASE_URL}/api/members/${createdMember.id}`, {
    method: 'DELETE',
    headers: authHeaders,
  });
  if (deleteRes.status !== 200) {
    throw new Error(`FAIL: DELETE /api/members/${createdMember.id} returned ${deleteRes.status}`);
  }
  const deleteData = await deleteRes.json();
  console.log(`✓ PASS: Member deactivated: "${deleteData.message}".`);

  // Verify database record: if no matches, cleanly deleted; if has matches, soft deactivated
  const [dbRow] = await db
    .select({ status: communityMembers.status })
    .from(communityMembers)
    .where(eq(communityMembers.id, createdMember.id))
    .limit(1);

  if (deleteData.action === 'deleted') {
    if (dbRow) {
      throw new Error(`FAIL: Expected record to be deleted, but still exists with status '${dbRow.status}'`);
    }
    console.log(`✓ PASS: Database confirms member without matches was cleanly deleted.`);
  } else {
    if (dbRow?.status !== 'Nonaktif') {
      throw new Error(`FAIL: Expected status 'Nonaktif' in DB, got '${dbRow?.status}'`);
    }
    console.log(`✓ PASS: Database confirms status is 'Nonaktif' (soft delete verified).`);
  }

  // Test 9: Non-admin authorization rejection (HTTP 403)
  console.log('Test 9: Verifying non-admin RBAC enforcement...');
  const regularEmail = `regular-${Date.now()}@test.com`;
  const regRes = await fetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Regular Member Test',
      email: regularEmail,
      password: 'password123',
    }),
  });
  if (regRes.status !== 201) {
    throw new Error(`FAIL: Registration failed with status ${regRes.status}`);
  }
  const regData = await regRes.json();
  const regularToken = regData.token;
  const regularHeaders: HeadersInit = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${regularToken}`,
  };

  // Attempt to create manual member with regular token
  const nonAdminPost = await fetch(`${BASE_URL}/api/members/manual`, {
    method: 'POST',
    headers: regularHeaders,
    body: JSON.stringify({
      communityId: 'comm-ck17',
      name: 'Illegal Entry',
      whatsapp: '081299998888',
    }),
  });
  if (nonAdminPost.status === 403) {
    const errData = await nonAdminPost.json();
    console.log(`✓ PASS: Non-admin creation rejected with 403: "${errData.error}".`);
  } else {
    throw new Error(`FAIL: Expected 403 for non-admin mutation, got ${nonAdminPost.status}`);
  }

  // Cleanup: remove regular user account
  const { accounts, communityMemberships } = await import('../../src/db/schema.ts');
  await db.delete(communityMemberships).where(eq(communityMemberships.userId, regData.user.id));
  await db.delete(accounts).where(eq(accounts.id, regData.user.id));
  console.log(`✓ CLEANUP: Temporary regular user ${regData.user.id} removed.`);

  console.log('--- ALL STAGE 3C.1 MEMBER INTEGRATION TESTS PASSED! ---');
  process.exit(0);
}

runTests().catch((err) => {
  console.error('TEST FAILED:', err);
  process.exit(1);
});
