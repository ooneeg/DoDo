# Security Spec — DoDo Apparel Studio Firestore

## 1. Data Invariants
1. Every `/users/{userId}` document can only be read or mutated by the authenticated, email-verified user whose `request.auth.uid == userId`.
2. Every `/users/{userId}/scenarios/{scenarioId}` document must belong to an existing `/users/{userId}` parent document, carry `ownerId == request.auth.uid` and `id == scenarioId`, enforce positive bounded numbers and enum strings, and bind `createdAt`/`updatedAt` to `request.time`.
3. Every `/users/{userId}/brandSessions/{sessionId}` document must belong to an existing `/users/{userId}` parent document, carry `ownerId == request.auth.uid` and `id == sessionId`, bound arrays (`palette <= 6`, `agreedGarments <= 12`) and string sizes (no raw base64 videos or >12KB blobs), and keep `ownerId` and `createdAt` immutable on updates.
4. No unauthenticated or cross-user `list`/`get`/`create`/`update`/`delete` is permitted on any user collection.

## 2. The Dirty Dozen Adversarial Payloads (Must Return PERMISSION_DENIED)
1. Unauthenticated read on `/users/u1`.
2. Unauthenticated write on `/users/u1/scenarios/s1`.
3. Cross-user read: user `u2` reading `/users/u1/brandSessions/b1`.
4. Unverified email write (`email_verified: false`) creating `/users/u1`.
5. Identity spoofing: user `u1` creating `/users/u1/scenarios/s1` with `ownerId: "u2"`.
6. Ghost/shadow field injection (`isAdmin: true`) on `/users/u1` create.
7. Ghost/shadow field injection during update on `/users/u1/brandSessions/b1`.
8. Immutable field tampering: changing `ownerId` or `createdAt` on scenario update.
9. Timestamp spoofing: client sending arbitrary past/future `createdAt` instead of `request.time`.
10. ID poisoning: creating doc with oversized/invalid ID `../bad$id`.
11. Resource exhaustion: `continuityCode` > 12,000 chars or `agreedGarments` > 12 items.
12. Cross-tenant list query scraping `/users/u2/scenarios`.
