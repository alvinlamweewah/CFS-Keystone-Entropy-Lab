# Security Specification — Keystone Entropy Lab

## 1. Security & Privacy Architecture
- **Zero-Knowledge Password Evaluation**: Passwords typed by users are analyzed exclusively in browser memory and are **never** transmitted, hashed-to-server, or stored in Firestore.
- **PII Zero-Storage**: User emails, phone numbers, and profile URLs are never written to Firestore documents. Users choose an alphanumeric public `callsign` (2–24 characters).
- **Master Source of Truth**: `/leaderboardEntries/{userId}` is keyed strictly by the authenticated user's UID (`userId == request.auth.uid`), enforcing a 1-to-1 ownership invariant without cross-document lookups.

## 2. Data Invariants
1. Every document ID in `/leaderboardEntries/{userId}` must match `^[a-zA-Z0-9_\-]+$` (`<= 128` chars) and equal `request.auth.uid` on write.
2. Only users with `request.auth.token.email_verified == true` may create, update, or delete their leaderboard entry.
3. Only passwords achieving `MAXIMUM_SECURITY` (`entropyBits >= 100 && entropyBits <= 512`, `charLength >= 16 && charLength <= 128`, `poolSize >= 70 && poolSize <= 100`, `badgeCount >= 6 && badgeCount <= 8`) can be recorded.
4. `earnedBadges` must be a bounded list (`6 <= size <= 8`) containing only valid badge IDs from the static allowlist.
5. `createdAt` and `userId` are immutable after creation; `createdAt` (on create) and `updatedAt` (on create/update) must equal `request.time`.
6. `list` queries on `/leaderboardEntries` are restricted to authenticated users, must filter `tier == 'MAXIMUM_SECURITY'`, and must specify `limit <= 50`.

## 3. The "Dirty Dozen" Adversarial Payloads
1. **Unauthenticated Write**: `auth = null` attempting `create` on `/leaderboardEntries/user_1`.
2. **Unverified Email Spoof**: `auth = { uid: 'user_1', token: { email_verified: false } }` attempting `create`.
3. **Identity Spoofing (Cross-UID Write)**: `auth.uid = 'attacker_1'` creating `/leaderboardEntries/victim_1` or setting `userId: 'victim_1'`.
4. **Shadow / Ghost Field Injection**: Valid payload plus `isAdmin: true` on `create` or `update`.
5. **Sub-Threshold Security Score**: Attempting to submit `entropyBits: 45` or `tier: 'WEAK'` to the Maximum Security leaderboard.
6. **Resource Poisoning (Oversized Callsign)**: Submitting a 10KB string in `callsign` (exceeding `maxLength: 24`).
7. **ID Poisoning**: Creating a document with invalid path characters or >128 chars.
8. **Array Poisoning**: Submitting `earnedBadges` with 50 items or an unauthorized badge slug `'hacked_badge'`.
9. **Client Timestamp Forgery**: Setting `createdAt` or `updatedAt` to a past/future timestamp instead of `request.time`.
10. **Immortal Field Mutation**: Updating `createdAt` or `userId` during an `update` call.
11. **Score Downgrade / Arbitrary Update**: Updating `entropyBits` to a lower number (`105` -> `101`) or mutating `tier` outside allowed actions.
12. **Unbounded List Scraping**: Executing an unauthenticated `list` query or an authenticated `list` query without `limit(50)` and `where('tier', '==', 'MAXIMUM_SECURITY')`.
