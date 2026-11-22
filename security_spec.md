# Security Specification & Payload TDD — TABA E-Commerce Platform

## 1. Core Data Invariants
1. **Owner & Staff RBAC Authority**: Only the bootstrapped owner (`eyossif175@gmail.com` with `email_verified == true`) or active staff records in `/staff_users/{email}` (`isActive == true`, Google `email_verified == true`) can access Admin operations. Staff cannot escalate their own role or edit `staff_users` unless they are Owner or hold `manageStaff`.
2. **PII Isolation**: Full customer orders (`/orders`), complaints (`/complaints`), and return requests (`/return_requests`) contain phone numbers and delivery addresses; `get` and `list` are strictly restricted to authenticated staff (`isStaff()`).
3. **Private Customer Tracking**: Customers can look up ONLY their own order or return via single-document `get` on `/order_tracking/{orderNumber_phone}`, `/return_tracking/{returnCode_phone}`, and `/phone_order_histories/{phone}` with `allow list: if false` to prevent scraping.
4. **Checkout & Review Integrity**: Guest-created orders must start in `status == 'طلب جديد'`, `priceReviewedByStaff == false`, `customerApprovedTotal == false`, `reviewedDiscount == 0`, reference an active existing `/zones/{zoneId}`, and carry `serverCreatedAt == request.time`. Guest reviews must start in `status == 'pending'`, reference an existing product, and have `rating` between 1 and 5.
5. **Immutable Audit Trail**: `/audit_log` entries can only be created by verified staff (`serverTimestamp == request.time`) and cannot be updated or deleted by anyone, including the Owner.
6. **Strict Schema & Bounds**: Every collection checks `isValidId()`, `keys().hasAll(...)`, `keys().hasOnly(...)`, type safety, and string/list `.size()` limits to prevent shadow updates and Denial-of-Wallet payloads.

## 2. The "Dirty Dozen" Adversarial Payloads
1. **Order Status Escalation on Create**: Guest creates `/orders/ord1` with `status: "تم التسليم"` or `priceReviewedByStaff: true` -> `PERMISSION_DENIED`.
2. **Shadow Field Injection on Order**: Guest adds `isPaid: true` or `adminOverride: true` to `/orders/ord1` -> `PERMISSION_DENIED` (`hasOnly` rejects).
3. **Spoofed Timestamp on Order**: Guest sends past/future `serverCreatedAt` instead of `request.time` -> `PERMISSION_DENIED`.
4. **Orphaned Zone Reference**: Guest creates order with non-existent `zoneId: "fake-zone"` -> `PERMISSION_DENIED` (`exists` check).
5. **PII Blanket Read on `/orders`**: Unauthenticated user or non-staff signed-in user attempts `getDocs(collection(db, 'orders'))` -> `PERMISSION_DENIED`.
6. **Tracking Collection Scraping**: Unauthenticated user attempts `getDocs(collection(db, 'order_tracking'))` (`list`) -> `PERMISSION_DENIED` (`allow list: if false`).
7. **Self-Published 5-Star Review**: Guest creates `/reviews/rev1` with `status: "approved"` -> `PERMISSION_DENIED`.
8. **Unverified Email Admin Spoof**: Signed-in user with `email: "eyossif175@gmail.com"` and `email_verified: false` attempts admin read/write -> `PERMISSION_DENIED`.
9. **Staff Privilege Escalation**: Employee without `manageStaff` attempts to update `/staff_users/emp@gmail.com` setting `role: "owner"` -> `PERMISSION_DENIED`.
10. **Audit Log Tampering**: Owner or staff attempts `updateDoc` or `deleteDoc` on `/audit_log/log1` -> `PERMISSION_DENIED`.
11. **Coupon Scraping**: Guest attempts `getDocs(collection(db, 'coupons'))` (`list`) -> `PERMISSION_DENIED`.
12. **Resource Exhaustion / ID Poisoning**: Attacker creates `/complaints/<200-char-id>` or sends a 5,000-character `customerName` -> `PERMISSION_DENIED`.
