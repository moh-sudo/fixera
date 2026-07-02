# FIXERA — LAUNCH EXECUTION PLAN
**Single source of truth. Update this file as items are completed.**
Last updated: 2026-06-20
Overall score: 62/100 → Target: 82/100 for controlled launch · 90/100 for full public launch

---

## HOW TO USE THIS FILE
- `[ ]` = Not started
- `[~]` = In progress
- `[x]` = Done
- Each item has: **Effort** · **Files affected** · **Risk if skipped**

---

---

# PHASE 1 — CRITICAL BLOCKERS
> These cause crashes, revenue loss, or security breaches on Day 1.
> Complete ALL of these before ANY real user touches the platform.
> Estimated total: ~16 hours

---

## 1.1 — receipts table (BLOCKER — crashes homepage for every user)
- [ ] **Status:** Not started
- **Effort:** 1 hour
- **Risk:** Every user who opens the app hits a PostgREST 404 error on homepage load
- **Files to create/edit:**
  - `migrations/create_receipts.sql` — create table + DB trigger (auto-generate on payment paid)
  - `web/src/pages/main/HomePage.jsx` — fix receipts query
  - `worker/src/pages/main/DashboardPage.jsx` — fix receipts query
- **SQL needed:**
  ```sql
  CREATE TABLE receipts (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id     UUID REFERENCES bookings(id),
    payment_id     UUID REFERENCES payments(id),
    customer_id    UUID REFERENCES auth.users(id),
    worker_id      UUID REFERENCES auth.users(id),
    amount         NUMERIC(12,2),
    commission     NUMERIC(12,2),
    partner_amount NUMERIC(12,2),
    method         TEXT,
    mpesa_ref      TEXT,
    service        TEXT,
    address        TEXT,
    generated_at   TIMESTAMPTZ DEFAULT now()
  );
  -- Also: DB trigger on payments.status = 'paid' to auto-insert receipt
  ```
- **Also covers:** Legal requirement — commercial transactions require receipts under Kenya law

---

## 1.2 — Payment idempotency (BLOCKER — risk of double-charge on M-Pesa retry)
- [ ] **Status:** Not started
- **Effort:** 30 minutes
- **Risk:** Daraja occasionally retries callbacks → duplicate payments row → customer charged twice
- **Files to edit:**
  - `migrations/` → new migration file `add_payments_unique_constraint.sql`
- **SQL needed:**
  ```sql
  ALTER TABLE payments
    ADD CONSTRAINT uq_payment_ref UNIQUE (ref_type, ref_id, method);
  ```
- **Note:** `paymentService.js` already has app-layer `getPaymentFor()` check but this is not race-condition safe

---

## 1.3 — Gemini API key → server proxy (CRITICAL SECURITY)
- [ ] **Status:** Not started
- **Effort:** 2 hours
- **Risk:** Gemini API key was hardcoded in client bundle — now moved to Vercel env var `GEMINI_API_KEY` (rotated)
- **Files to create/edit:**
  - `web/api/ai-chat.js` — new Vercel serverless function (proxy to Gemini)
  - `web/src/services/aiService.js` — remove hardcoded key, call `/api/ai-chat` instead
  - Vercel environment variables — add `GEMINI_API_KEY`
- **Steps:**
  1. Create `/api/ai-chat.js` — receives `{ message, history }`, calls Gemini server-side, returns response
  2. Add `GEMINI_API_KEY` to Vercel env vars (Settings → Environment Variables)
  3. Update `aiService.js` to POST to `/api/ai-chat` instead of calling Gemini SDK directly

---

## 1.4 — OTP verification → server-side (CRITICAL SECURITY)
- [ ] **Status:** Not started
- **Effort:** 3 hours
- **Risk:** `arrival_otp` and `completion_otp` are fetched in the booking row and compared in the browser. Anyone can see the OTP in the DevTools network tab.
- **Files to create/edit:**
  - Create Supabase Edge Function: `verify-otp`
  - `web/src/pages/main/WorkerAssignmentPage.jsx` — call Edge Function instead of client compare
- **Edge Function logic:**
  - Receives: `{ bookingId, otp, type: 'arrival'|'completion' }`
  - Checks against DB server-side
  - Returns: `{ valid: true|false }` — NEVER returns the OTP value
  - On valid arrival: updates booking status to 'in_progress'
  - On valid completion: updates booking status to 'completed'
- **Critical:** Remove `arrival_otp` and `completion_otp` from the SELECT query that goes to the client

---

## 1.5 — Wallet gate on worker self-assign (BLOCKER — 15 minutes)
- [ ] **Status:** Not started
- **Effort:** 15 minutes
- **Risk:** A worker with KSh 0 wallet balance can self-accept jobs, bypassing the entire wallet gate system
- **Files to edit:**
  - `worker/src/pages/main/DashboardPage.jsx` → `acceptJob()` function (line ~52)
- **Code to add:**
  ```js
  const acceptJob = async (jobId, e) => {
    e.stopPropagation();
    if (!profile?.can_receive_jobs) {
      alert('Your wallet is below KSh 500. Top up to accept jobs.');
      return;
    }
    // ... rest of function unchanged
  };
  ```

---

## 1.6 — payment_failures log table
- [ ] **Status:** Not started
- **Effort:** 1 hour
- **Risk:** Failed M-Pesa STK Pushes are silently discarded — no log, no retry, no customer resolution
- **Files to create/edit:**
  - `migrations/create_payment_failures.sql`
  - `web/api/mpesa-callback.js` — log failure when ResultCode ≠ 0
- **SQL needed:**
  ```sql
  CREATE TABLE payment_failures (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_id          UUID REFERENCES payments(id),
    checkout_request_id TEXT,
    error_code          TEXT,
    error_message       TEXT,
    raw_response        JSONB,
    created_at          TIMESTAMPTZ DEFAULT now()
  );
  ```

---

## 1.7 — Wire createPayment() to moving requests (BLOCKER — zero revenue tracked)
- [ ] **Status:** Not started
- **Effort:** 1 hour
- **Risk:** Every completed moving job earns Fixera nothing tracked — commission is never recorded
- **Files to edit:**
  - `web/src/services/movingService.js` — add `createPayment()` call at job completion
  - Find the function that marks a moving request as completed → add payment insert before or after

---

## 1.8 — Wire createPayment() to supplier orders (BLOCKER — zero revenue tracked)
- [ ] **Status:** Not started
- **Effort:** 1 hour
- **Risk:** Every completed supplier order earns Fixera nothing tracked
- **Files to edit:**
  - `web/src/services/supplierShopService.js` — add `createPayment()` call at order completion
  - `worker/src/pages/supplier/SupplierOrderPage.jsx` — verify completion hook

---

## 1.9 — Extend commission trigger to all 6 partner types
- [ ] **Status:** Not started
- **Effort:** 1 hour
- **Risk:** Vendors, movers, suppliers, water carriers — cash job commission never deducted or tracked
- **Files to edit:**
  - `migrations/enforce_wallet_minimum.sql` OR new migration `extend_commission_trigger.sql`
- **What to do:** Extend `fixera_wallet_on_cash_payment()` trigger to handle vendor/mover/supplier/water_carrier partner roles — route their commission to a `settlement_batches` record instead of wallet deduction

---

## 1.10 — live_locations cleanup cron (BLOCKER — DB will fill up)
- [ ] **Status:** Not started
- **Effort:** 30 minutes
- **Risk:** Every mover GPS ping is stored forever. At 10 active movers pinging every 5 seconds = ~6,000 rows/hour. Will exhaust Supabase storage within weeks of launch.
- **Run in Supabase SQL Editor:**
  ```sql
  -- Enable pg_cron extension first (Supabase Dashboard → Extensions)
  SELECT cron.schedule(
    'cleanup-live-locations',
    '0 * * * *',
    $$DELETE FROM live_locations WHERE created_at < now() - INTERVAL '48 hours'$$
  );
  ```

---

## 1.11 — refunds table + wallet-credit execution
- [ ] **Status:** Not started
- **Effort:** 2 hours
- **Risk:** Admin can rule "full refund" on a dispute but nothing actually executes — customer never gets money back. Legal exposure.
- **Files to create/edit:**
  - `migrations/create_refunds.sql`
  - `web/src/services/walletAdminService.js` — add `executeRefund()` function
  - `web/src/pages/admin/AdminDashboard.jsx` → RefundManagementSection — wire the execute button
- **SQL needed:**
  ```sql
  CREATE TABLE refunds (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_id   UUID REFERENCES payments(id),
    booking_id   UUID,
    customer_id  UUID REFERENCES auth.users(id),
    amount       NUMERIC(12,2),
    reason       TEXT,
    status       TEXT DEFAULT 'pending',
    method       TEXT DEFAULT 'wallet_credit',
    mpesa_ref    TEXT,
    admin_id     UUID REFERENCES auth.users(id),
    approved_at  TIMESTAMPTZ,
    executed_at  TIMESTAMPTZ,
    created_at   TIMESTAMPTZ DEFAULT now()
  );
  ```
- **Initial refund method:** Credit customer's Fixera wallet (until B2C is built)

---

## 1.12 — Promo code server-side validation
- [ ] **Status:** Not started
- **Effort:** 2 hours
- **Risk:** Discount amount is calculated in the browser — user can modify `discountAmount` in DevTools before checkout
- **Files to create/edit:**
  - `web/api/validate-promo.js` — new Vercel function
  - `web/src/services/promoService.js` — update to call `/api/validate-promo`
  - `web/src/pages/main/BookingFormPage.jsx` — use server-returned discount amount

---

---

# PHASE 2 — IMPORTANT PRE-LAUNCH
> Should be complete before opening to the public.
> Estimated total: ~40 hours

---

## 2.1 — Firebase FCM env vars (5 variables)
- [ ] **Status:** Not started
- **Effort:** 1 hour
- **Risk:** All partners get zero background push notifications — they only know about jobs if the app is open
- **Action:** Set these in Vercel Settings → Environment Variables AND in `.env.local`:
  ```
  VITE_FIREBASE_API_KEY=
  VITE_FIREBASE_PROJECT_ID=
  VITE_FIREBASE_MESSAGING_SENDER_ID=
  VITE_FIREBASE_APP_ID=
  VITE_FIREBASE_VAPID_KEY=
  ```
- **Note:** `pushService.js` and `notification_tokens` table are already fully built — this is config only

---

## 2.2 — Service area validation at booking
- [ ] **Status:** Not started
- **Effort:** 3 hours
- **Risk:** Customers can book services for areas Fixera doesn't yet operate in
- **Files to edit:**
  - `web/src/pages/main/BookingFormPage.jsx` — after address entry (Step 0), call `serviceAreaService` to check if address zone is active
  - Show "Sorry, we don't serve this area yet — coming soon!" if inactive
  - `web/src/services/serviceAreaService.js` — add `checkAddressCoverage(address)` function

---

## 2.3 — Geo-filter on worker job browse
- [ ] **Status:** Not started
- **Effort:** 2 hours
- **Risk:** A plumber in Mombasa sees jobs in Nairobi — first to tap wins, quality matching is zero
- **Files to edit:**
  - `migrations/` — add `service_area TEXT` column to `workers` table
  - `worker/src/pages/onboarding/OnboardingPage.jsx` — capture service area during registration
  - `worker/src/pages/main/DashboardPage.jsx` — add `.eq('service_area', profile.service_area)` to job query

---

## 2.4 — Customer ticket status tracking
- [ ] **Status:** Not started
- **Effort:** 3 hours
- **Risk:** Customer submits a support ticket and has zero visibility after that — can't tell if it's being handled
- **Files to edit:**
  - `web/src/pages/main/SupportPage.jsx` — add "My Tickets" tab showing submitted tickets + status
  - Query `support_tickets` where `customer_id = auth.uid()`

---

## 2.5 — Email on ticket status update
- [ ] **Status:** Not started
- **Effort:** 1 hour
- **Risk:** Customer is never notified when their ticket is resolved — bad support experience
- **Action:** Add DB trigger on `support_tickets.status` UPDATE → call `/api/send-email` with resolved/in-progress template

---

## 2.6 — ticket_notes table + internal notes UI
- [ ] **Status:** Not started
- **Effort:** 1 hour
- **Files to create/edit:**
  - `migrations/create_ticket_notes.sql`
  - `web/src/pages/admin/AdminDashboard.jsx` → DisputeSection — add internal notes input + thread
- **SQL:**
  ```sql
  CREATE TABLE ticket_notes (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id   UUID REFERENCES support_tickets(id),
    agent_id    UUID REFERENCES auth.users(id),
    note        TEXT NOT NULL,
    is_internal BOOLEAN DEFAULT true,
    created_at  TIMESTAMPTZ DEFAULT now()
  );
  ```

---

## 2.7 — assigned_to + SLA deadline on support tickets
- [ ] **Status:** Not started
- **Effort:** 1 hour
- **Files to edit:**
  - `migrations/add_ticket_sla.sql`
  - `web/src/pages/admin/AdminDashboard.jsx` → DisputeSection — show assignee + SLA countdown
- **SQL:**
  ```sql
  ALTER TABLE support_tickets
    ADD COLUMN assigned_to    UUID REFERENCES auth.users(id),
    ADD COLUMN sla_deadline   TIMESTAMPTZ,
    ADD COLUMN resolved_at    TIMESTAMPTZ;
  -- Trigger: set sla_deadline on INSERT based on priority
  -- urgent = +1hr, high = +4hr, normal = +24hr
  ```

---

## 2.8 — Deposit status visible in partner app
- [ ] **Status:** Not started
- **Effort:** 2 hours
- **Risk:** Vendors/movers/suppliers/water carriers don't know if their deposit is held or pending — they can't act on it
- **Files to edit:**
  - `worker/src/pages/main/EarningsPage.jsx` OR dedicated section on vendor/mover/supplier/water_carrier dashboards
  - Show: deposit amount, status (not_paid/pending/held/refunded), required amount, how to pay

---

## 2.9 — Rate limiting on API routes
- [ ] **Status:** Not started
- **Effort:** 3 hours
- **Risk:** `/api/mpesa-stk-push` can be spammed by any authenticated user — unlimited STK pushes burning Daraja quota
- **Files to edit:**
  - `web/api/mpesa-stk-push.js` — add per-user rate limit check
  - `web/api/mpesa-status.js` — add rate limit
  - Consider: Upstash Redis (free tier) for distributed rate limiting

---

## 2.10 — Remove dead UI stubs + EmailTestPage
- [ ] **Status:** Not started
- **Effort:** 30 minutes
- **Risk:** Users see a "Pay with Card" button that does nothing — breaks trust
- **Files to edit:**
  - `web/src/pages/main/PaymentPage.jsx` — hide or remove card/wallet options (or show "Coming Soon" clearly)
  - `web/src/pages/admin/EmailTestPage.jsx` — remove from admin nav (dev-only page)

---

## 2.11 — Worker availability toggle (partner app)
- [ ] **Status:** Not started
- **Effort:** 1 hour
- **Files to edit:**
  - `migrations/` — add `is_available BOOLEAN DEFAULT true` to workers
  - `worker/src/pages/main/DashboardPage.jsx` — toggle switch (Available / Unavailable)
  - Admin dispatch section already shows availability — just needs the source data

---

## 2.12 — notification_log table
- [ ] **Status:** Not started
- **Effort:** 1 hour
- **SQL:**
  ```sql
  CREATE TABLE notification_log (
    id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id   UUID REFERENCES auth.users(id),
    channel   TEXT, -- push | email | sms | in_app
    type      TEXT,
    title     TEXT,
    body      TEXT,
    sent_at   TIMESTAMPTZ DEFAULT now(),
    delivered BOOLEAN
  );
  ```

---

## 2.13 — Admin RBAC sub-roles
- [ ] **Status:** Not started
- **Effort:** 4 hours
- **Risk:** One compromised admin account = full breach of all financial and personal data
- **Files to edit:**
  - `migrations/` — add `admin_role TEXT` to profiles: `super_admin | finance | operations | support | read_only`
  - `web/src/pages/admin/AdminDashboard.jsx` — show/hide sections based on `admin_role`
  - `web/src/pages/admin/AdminLoginPage.jsx` — no change needed (uses existing auth)

---

## 2.14 — Customer push notification registration
- [ ] **Status:** Not started
- **Effort:** 2 hours (after 2.1 FCM env vars done)
- **Risk:** Customers get zero background push — no job confirmation, no worker on way, no payment receipt
- **Files to edit:**
  - `web/src/hooks/useAuth.jsx` or main `App.jsx` — register FCM token on login (same as `pushService.js` pattern in partner app)

---

## 2.15 — Job timeout + auto-reassignment
- [ ] **Status:** Not started
- **Effort:** 4 hours
- **Risk:** Worker accepts a job and ghosts — customer is left without service, no automated recovery
- **Action:** pg_cron job every 5 min — find bookings where `status = 'confirmed'` and `updated_at < now() - 30 min` — reset to `upcoming`, clear `worker_id`, send new notification
- **Files to create:**
  - `migrations/add_job_timeout_cron.sql`

---

## 2.16 — BookingFormPage services from DB (not hardcoded)
- [ ] **Status:** Not started
- **Effort:** 4 hours
- **Risk:** Adding a new service requires a code deploy — no-code admin cannot expand services
- **Files to edit:**
  - `web/src/pages/main/BookingFormPage.jsx` — replace `SERVICES` hardcoded array with query to `service_categories` + `services` tables (already seeded)
  - `web/src/services/catalogService.js` — already exists, use it

---

---

# PHASE 3 — LEGAL & COMPLIANCE
> Parallel track with the lawyer's policy paper.
> Technical items that must be ready before the policy paper is published live.

---

## 3.1 — Versioned consent / Terms re-acceptance
- [ ] **Status:** Not started
- **Effort:** 2 hours
- **Why:** When the lawyer updates Terms, existing users must re-accept before using the app
- **Files to edit:**
  - `migrations/add_terms_versioning.sql`
    ```sql
    ALTER TABLE profiles ADD COLUMN terms_version_accepted TEXT;
    ALTER TABLE profiles ADD COLUMN terms_accepted_at TIMESTAMPTZ;
    ALTER TABLE workers  ADD COLUMN terms_version_accepted TEXT;
    ALTER TABLE workers  ADD COLUMN terms_accepted_at TIMESTAMPTZ;
    ```
  - `web/src/pages/main/TermsPage.jsx` — add version number constant (e.g., `CURRENT_VERSION = 'v1.1'`)
  - `web/src/hooks/useAuth.jsx` — on login check `terms_version_accepted !== CURRENT_VERSION` → show re-accept modal

---

## 3.2 — Data erasure flow (Kenya DPA 2019 — Right to Erasure)
- [ ] **Status:** Not started
- **Effort:** 3 hours
- **Why:** DPA 2019 requires users can request deletion of their personal data
- **Files to edit:**
  - `web/src/pages/main/ProfilePage.jsx` — add "Delete My Account" option
  - `web/api/delete-account.js` — new Vercel function: anonymizes profiles/bookings/payments (replaces PII with `[deleted]`), does NOT delete payment records (financial compliance)
  - Add same to partner app `ProfilePage`

---

## 3.3 — Data export (Kenya DPA 2019 — Right to Portability)
- [ ] **Status:** Not started
- **Effort:** 2 hours
- **Files to edit:**
  - `web/src/pages/main/ProfilePage.jsx` — "Download My Data" button
  - `web/api/export-data.js` — returns user's bookings, payments, profile as JSON/CSV download

---

## 3.4 — Partner KRA PIN storage (Tax compliance)
- [ ] **Status:** Not started
- **Effort:** 1 hour
- **Why:** Fixera must withhold tax on partner income exceeding KSh 24,000/month (KRA requirement)
- **Files to edit:**
  - `migrations/` — add `kra_pin TEXT` to workers table
  - `worker/src/pages/onboarding/OnboardingPage.jsx` — add KRA PIN field (optional initially, required above threshold)
  - `web/src/pages/admin/AdminDashboard.jsx` → TaxReportSection — use real data from workers + wallet_transactions

---

## 3.5 — Security deposit bank segregation evidence
- [ ] **Status:** Not started
- **Effort:** 1 hour
- **Why:** Lawyer may require security deposits held in a separate trust account
- **Files to edit:**
  - `migrations/` — add `bank_ref TEXT` and `held_in TEXT` to deposit_transactions
- **Ask lawyer:** Does deposit model need a real segregated bank account or is DB tracking sufficient?

---

## 3.6 — Commission rates disclosed at partner onboarding
- [ ] **Status:** Not started
- **Effort:** 1 hour
- **Why:** Partners must explicitly see and accept the commission rate before signing up — policy requirement
- **Files to check/edit:**
  - `worker/src/pages/onboarding/OnboardingPage.jsx` — confirm commission rate is shown before agreement acceptance
  - `worker/src/pages/main/PartnerAgreementPage.jsx` — confirm commission rate is in the agreement text
- **Note:** Rates are in `platform_settings.commission_rates` — make sure they're pulled and shown, not hardcoded

---

## 3.7 — Refund policy SLA (must be built before policy is published)
- [ ] **Status:** Blocked by Phase 1 item 1.11
- **Why:** Cannot publish "refunds processed in 48 hours" if the refund system doesn't work
- **Dependency:** Complete 1.11 first, then set the SLA window in admin settings

---

## 3.8 — Dispute resolution timeline (must match policy)
- [ ] **Status:** Blocked by Phase 2 item 2.7
- **Why:** If policy says "disputes resolved in 5 business days," SLA columns must enforce it
- **Dependency:** Complete 2.7 first

---

## 3.9 — Review and update TermsPage + PrivacyPage content
- [ ] **Status:** Waiting on lawyer
- **Effort:** After lawyer sends final draft — 2 hours to update content in pages
- **Files to edit:**
  - `web/src/pages/main/TermsPage.jsx` — update section content with lawyer's final text
  - `web/src/pages/main/PrivacyPage.jsx` — update with Kenya DPA 2019 compliant language

---

## 3.10 — CBK / PSP licensing decision
- [ ] **Status:** Needs legal opinion
- **Action for lawyer:** Ask specifically — "Does Fixera's wallet model (holding partner wallet balances in Supabase) constitute deposit-taking under the Kenya Banking Act? If yes, what license is required or must we restructure?"
- **If restructure needed:** Technical implication — wallets may need to be held as M-Pesa floats directly, not DB balances

---

---

# PHASE 4 — POST-LAUNCH IMPROVEMENTS
> Can go live without these. Build in first 30 days after launch.

---

## 4.1 — Admin live map (Mapbox)
- [ ] **Status:** Not started
- **Effort:** 6 hours
- `react-leaflet` already installed in web/node_modules
- Plot `live_locations` rows as markers in DispatchSection
- Files: `web/src/pages/admin/AdminDashboard.jsx` → DispatchSection → replace map placeholder

## 4.2 — SLA auto-escalation cron
- [ ] **Status:** Not started
- **Effort:** 2 hours
- pg_cron every 15 min: find tickets past SLA deadline → set `escalated = true` → notify admin

## 4.3 — Daraja B2C automated partner payouts
- [ ] **Status:** Not started
- **Effort:** 6 hours
- New Vercel function `/api/mpesa-b2c`
- Requires separate B2C credentials from Safaricom (different from STK Push credentials)
- Admin approves payout → API fires → payout row updated automatically

## 4.4 — Invoice PDF generation
- [ ] **Status:** Not started
- **Effort:** 4 hours
- `/api/generate-invoice` → returns PDF buffer
- Use `pdfkit` or `puppeteer` in Vercel function

## 4.5 — Settlement batch automation (weekly)
- [ ] **Status:** Not started
- **Effort:** 4 hours
- pg_cron Monday 08:00 EAT: aggregate all `settlement_status = 'unsettled'` payments → create settlement batch record

## 4.6 — Reviews displayed on partner profiles
- [ ] **Status:** Not started
- **Effort:** 2 hours
- `reviews` table already exists
- Add review display to worker profile in customer app + partner earnings page

## 4.7 — AI ticket triage (auto-classify + route tickets)
- [ ] **Status:** Not started
- **Effort:** 8 hours
- Use Gemini (via the `/api/ai-chat` proxy once built) to classify incoming tickets
- Auto-set `department` and `priority` based on message content

## 4.8 — Fixera Wallet as customer payment method
- [ ] **Status:** Not started
- **Effort:** 8 hours
- Currently `available: false` stub in PaymentPage
- Requires customer wallet table (separate from partner wallets)

## 4.9 — Revenue forecast with real projections
- [ ] **Status:** Not started
- **Effort:** 6 hours
- Replace stub layout in RevenueForecastSection with real calculations from `payments` + `wallet_transactions`

## 4.10 — Tax report with real data + P9 forms
- [ ] **Status:** Not started
- **Effort:** 4 hours
- TaxReportSection currently has a static layout
- Pull real commission income + partner earnings from DB
- Generate P9-equivalent summary per partner per year

---

---

# PHASE 5 — FUTURE EXPANSION
> Version 2.0 features. Do not build until Phase 1-3 is complete and platform is stable.

---

- [ ] Card payment integration (Stripe or Flutterwave) — 16+ hrs
- [ ] Auto-dispatch algorithm (smart partner matching by proximity + rating) — 20+ hrs
- [ ] Partner mobile app (React Native) — Large project
- [ ] SMS notifications (Africa's Talking or Twilio) — 4 hrs
- [ ] Multi-language / Swahili support — 8 hrs
- [ ] Partner tiering + star rating gate (minimum rating to receive jobs) — 6 hrs
- [ ] Customer bidding / quote marketplace — Large feature
- [ ] Partner subscription tiers — Revenue diversification
- [ ] Analytics CSV/Excel export for finance team — 3 hrs
- [ ] Expand to Mombasa Metro (activate service areas, recruit partners) — Operations
- [ ] Expand to Kisumu, Nakuru, Eldoret — Operations

---

---

# CURRENT SCORES

| System | Score | Target |
|---|---|---|
| Customer App | 65/100 | 85/100 |
| Partner App | 72/100 | 88/100 |
| Admin Dashboard | 79/100 | 90/100 |
| Payment System | 52/100 | 82/100 |
| Operations & Dispatch | 48/100 | 78/100 |
| Support System | 35/100 | 72/100 |
| Security | 58/100 | 88/100 |
| Legal & Compliance | 30/100 | 80/100 |
| **Overall Platform** | **62/100** | **85/100** |

---

# LAUNCH GATES

| Gate | Requirement | Status |
|---|---|---|
| Internal beta (team only) | Phase 1 items 1.1–1.5 done | [ ] |
| Controlled launch (50 invited users) | All Phase 1 done | [ ] |
| Soft public launch | Phase 1 + Phase 2 done | [ ] |
| Full public launch | Phase 1 + Phase 2 + Phase 3 done | [ ] |

---

# OPEN QUESTIONS FOR LAWYER

1. Does Fixera's wallet model require CBK licensing?
2. Must security deposits be held in a segregated trust account (real bank) or is DB tracking sufficient?
3. What is the required refund processing window under Kenya Consumer Protection Act?
4. Are Fixera service partners classified as independent contractors or employees under the Employment Act 2007?
5. Does Fixera need to register for VAT now, or only after KSh 5M annual turnover?
6. What KRA withholding obligations apply to commission payments?
7. At what threshold must Fixera issue P9 forms to partners?

---

*End of execution plan. Start at Phase 1, item 1.1. Work top to bottom.*
