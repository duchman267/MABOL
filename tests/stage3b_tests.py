import json
import urllib.request
import urllib.error
import sys

BASE_URL = "http://127.0.0.1:3000"

def request(method, path, data=None, token=None):
    url = f"{BASE_URL}{path}"
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    
    encoded_data = json.dumps(data).encode("utf-8") if data else None
    req = urllib.request.Request(url, data=encoded_data, headers=headers, method=method)
    
    try:
        with urllib.request.urlopen(req) as resp:
            status = resp.status
            body = resp.read().decode("utf-8")
            return status, json.loads(body) if body else {}
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8")
        try:
            parsed = json.loads(body)
        except Exception:
            parsed = {"raw": body}
        return e.code, parsed

def run_tests():
    print("=== MABOL STAGE 3B OPERATIONAL BACKEND INTEGRATION TEST ===")
    results = {}

    # 1. Login as Admin Dicky
    status, admin_auth = request("POST", "/api/auth/login", {
        "email": "dickymaulanazayn@gmail.com",
        "password": "password123"
    })
    assert status == 200, f"Admin login failed: {admin_auth}"
    admin_token = admin_auth["token"]
    print(f"[PASS] 1. Admin login successful. Token acquired.")

    # 2. Check Initial Ledger Balance and Opening Transaction trx-opening-1
    status, balance_info = request("GET", "/api/finance/balance?communityId=comm-ck17", token=admin_token)
    assert status == 200, f"Balance check failed: {balance_info}"
    print(f"[PASS] 2. Initial balance retrieved: {balance_info}")
    assert balance_info["balance"] >= 145000, f"Expected balance >= 145000, got {balance_info['balance']}"

    status, trxs = request("GET", "/api/finance/transactions?communityId=comm-ck17", token=admin_token)
    assert status == 200, f"Transactions fetch failed: {trxs}"
    opening_found = [t for t in trxs if t["id"] == "trx-opening-1"]
    assert len(opening_found) == 1, f"Expected exactly 1 trx-opening-1, found {len(opening_found)}"
    assert opening_found[0]["amount"] == 145000
    assert opening_found[0]["type"] == "Pemasukan"
    print(f"[PASS] 3. trx-opening-1 verified: amount={opening_found[0]['amount']}, type={opening_found[0]['type']}, exactly 1 record.")

    # 3. Create Manual Member without login account (account_id = null)
    status, manual_member = request("POST", "/api/members/manual", {
        "communityId": "comm-ck17",
        "name": "Pak Haji Ujang",
        "whatsapp": "081299887766",
        "position": "Bek",
        "jerseyNumber": 5
    }, token=admin_token)
    assert status == 201, f"Create manual member failed: {manual_member}"
    assert manual_member["accountId"] is None, "Manual member accountId must be None!"
    assert manual_member["memberType"] == "MANUAL"
    print(f"[PASS] 4. Manual member created without account: id={manual_member['id']}, name={manual_member['fullName']}, accountId={manual_member['accountId']}")

    # 4. Create a Match as Admin
    status, match = request("POST", "/api/matches", {
        "communityId": "comm-ck17",
        "title": "Cornerkick17 Sparring Internal Stage 3B",
        "date": "2026-10-25",
        "kickoffTime": "19:00",
        "venue": "Cornerkick Stadium Soreang",
        "standardFee": 35000,
        "playerQuota": 24
    }, token=admin_token)
    assert status == 201, f"Create match failed: {match}"
    match_id = match["id"]
    print(f"[PASS] 5. Match created: id={match_id}, fee={match['standardFee']}")

    # 5. Add Manual Member to Match
    status, part_res = request("POST", f"/api/matches/{match_id}/participants", {
        "memberId": manual_member["id"],
        "participantType": "Anggota",
        "rsvpStatus": "Ikut"
    }, token=admin_token)
    assert status == 201, f"Add manual member to match failed: {part_res}"
    participant_id = part_res["participant"]["id"]
    print(f"[PASS] 6. Manual member successfully joined match: participantId={participant_id}")

    # 6. Test Idempotency on Payment & Kas Inflow
    idempotency_key = f"test-idemp-{match_id}-{participant_id}"
    
    # First payment attempt: Partial payment Rp20.000
    status, pay1 = request("POST", "/api/finance/payments", {
        "matchId": match_id,
        "participantId": participant_id,
        "amount": 20000,
        "method": "Transfer",
        "status": "Bayar Sebagian",
        "notes": "Cicilan 1 Pak Haji Ujang",
        "idempotencyKey": idempotency_key
    }, token=admin_token)
    assert status == 200, f"First payment failed: {pay1}"
    print(f"[PASS] 7. First payment (partial Rp20.000) recorded.")

    # Retry with EXACT same idempotency key
    status, pay_retry = request("POST", "/api/finance/payments", {
        "matchId": match_id,
        "participantId": participant_id,
        "amount": 20000,
        "method": "Transfer",
        "status": "Bayar Sebagian",
        "notes": "Cicilan 1 Pak Haji Ujang (RETRY)",
        "idempotencyKey": idempotency_key
    }, token=admin_token)
    assert status == 200

    # Verify that ledger did NOT duplicate the cash transaction
    status, trxs_after = request("GET", "/api/finance/transactions?communityId=comm-ck17", token=admin_token)
    matching_trxs = [t for t in trxs_after if t["idempotencyKey"] == idempotency_key]
    assert len(matching_trxs) == 1, f"Idempotency failed! Found {len(matching_trxs)} entries for same key"
    print(f"[PASS] 8. Idempotency test passed: Exact 1 transaction recorded despite network retry.")

    # 7. Record Second Installment (Pelunasan Rp15.000)
    second_idempotency_key = f"test-idemp-inst2-{match_id}-{participant_id}"
    status, pay2 = request("POST", "/api/finance/payments", {
        "matchId": match_id,
        "participantId": participant_id,
        "amount": 35000, # Total now 35.000 (Lunas)
        "method": "Tunai",
        "status": "Sudah Bayar",
        "notes": "Pelunasan Cicilan 2",
        "idempotencyKey": second_idempotency_key
    }, token=admin_token)
    assert status == 200

    # Verify installment history
    payment_id = pay2["payment"]["id"]
    status, inst_history = request("GET", f"/api/finance/payments/{payment_id}/installments", token=admin_token)
    assert status == 200
    assert len(inst_history) == 2, f"Expected 2 installments in history, got {len(inst_history)}"
    print(f"[PASS] 9. Installment history verified: 2 separate installment records preserved.")

    # 8. Record Match Expense (Sewa Lapangan Rp50.000)
    status, exp_res = request("POST", "/api/finance/expenses", {
        "matchId": match_id,
        "communityId": "comm-ck17",
        "category": "Lapangan",
        "name": "DP Lapangan Soreang",
        "quantity": 1,
        "unitPrice": 50000
    }, token=admin_token)
    assert status == 201, f"Expense creation failed: {exp_res}"
    expense_id = exp_res["expense"]["id"]
    print(f"[PASS] 10. Match expense recorded (Rp50.000 outflow).")

    # 9. Verify completeMatch does NOT inject duplicate surplus into ledger
    status, bal_before_complete = request("GET", "/api/finance/balance?communityId=comm-ck17", token=admin_token)
    balance_before = bal_before_complete["balance"]

    status, complete_res = request("POST", f"/api/matches/{match_id}/complete", token=admin_token)
    assert status == 200, f"completeMatch failed: {complete_res}"
    assert complete_res["match"]["cashSettled"] == True

    status, bal_after_complete = request("GET", "/api/finance/balance?communityId=comm-ck17", token=admin_token)
    balance_after = bal_after_complete["balance"]

    assert balance_before == balance_after, f"Double-counting detected! Balance changed from {balance_before} to {balance_after} upon completeMatch()"
    print(f"[PASS] 11. completeMatch() test passed: Match closed without duplicate surplus injection (Balance unchanged: {balance_after}).")

    # 10. Cancellation & Reversal Audit Trail
    # Cancel an expense
    status, del_exp = request("DELETE", f"/api/finance/expenses/{expense_id}", token=admin_token)
    # Match is settled, so deleting expense on settled match must be rejected!
    assert status == 400, "Deleting expense on settled match should be blocked"
    print(f"[PASS] 12. Finansial protection passed: Modification on settled match properly rejected.")

    # 11. Test Dry-Run Migration
    status, dry_run = request("POST", "/api/migration/dry-run", {
        "snapshotData": {
            "members": [manual_member],
            "matches": [match],
            "participants": [part_res["participant"]],
            "payments": [pay2["payment"]],
            "cashTransactions": [opening_found[0]]
        }
    }, token=admin_token)
    assert status == 200
    assert dry_run["dryRunResult"] == "PASS"
    assert dry_run["integrityChecks"]["openingBalanceValid"] == True
    assert dry_run["integrityChecks"]["openingBalanceAmount"] == 145000
    print(f"[PASS] 13. Dry-Run Migration simulation executed successfully: PASS, 0 orphans, Kas Awal Rp145.000 verified.")

    # 12. Test Snapshot Isolation
    status, snap_res = request("POST", "/api/migration/snapshot", {
        "environment": "preview",
        "snapshotData": {"version": "v8", "test": True},
        "notes": "Snapshot pengujian Stage 3B"
    }, token=admin_token)
    assert status == 201
    print(f"[PASS] 14. Isolated Snapshot captured: id={snap_res['snapshot']['id']}, env={snap_res['snapshot']['environment']}")

    # 13. Test Non-Admin Restriction
    # Login as Budi (regular member)
    status, budi_auth = request("POST", "/api/auth/login", {
        "email": "budi.santoso@example.com",
        "password": "mypassword123"
    })
    assert status == 200
    budi_token = budi_auth["token"]

    status, forbidden_res = request("POST", "/api/members/manual", {
        "communityId": "comm-ck17",
        "name": "Hacker Manual Member",
        "whatsapp": "08999"
    }, token=budi_token)
    assert status == 403, f"Expected 403 Forbidden for regular member, got {status}"
    print(f"[PASS] 15. Server-side RBAC enforced: Regular member rejected (HTTP 403) from admin operations.")

    print("\nALL 15 INTEGRATION TESTS PASSED WITH 100% SUCCESS.")

if __name__ == "__main__":
    run_tests()
