# 🗂️ FIXERA — Project Organizer

**Last updated:** 15 June 2026
**Stack:** Vite + React + inline styles · Supabase (DB/Auth/Realtime/Storage) · Vercel
**Apps:** Customer (`web/`) · Partner (`worker/`) · Admin (inside `web/` at `/admin`)

---

## ✅ DONE (built & build-verified)

### 1. Foundation
- ✅ Guest mode / optional login (Bolt model)
- ✅ Email service architecture (serverless NodeMailer)
- ✅ 6 partner types registering with role-specific signup

### 2. The 6 Partners (each end-to-end)
- ✅ 🔧 **Service Workers** — book → assign → OTP → complete → review
- ✅ 🚚 **Movers** — 6-step booking → quote marketplace → fleet → crew → loading photos → live GPS → delivery sign-off → claims
- ✅ 🚰 **Water Carriers** — order → broadcast accept → live GPS → photo proof → confirm → fleet + plate picker
- ✅ 🏪 **Vendors** — order fulfillment (received→preparing→ready) → auto-dispatch rider
- ✅ 🚗 **Riders** — online toggle, dispatch queue, state chain, GPS, offer rotation
- ✅ 📦 **Suppliers** — customer shop → cart → order → pack → deliver + self-service catalog w/ approval

### 3. Cross-Partner Chains
- ✅ 🎨 **Painting** — worker estimates materials → supplier supplies → rider delivers → all linked to one job
- ✅ 🧺 **Laundry** — rider pickup → vendor cleans → same-rider return → customer tracks live

### 4. Logistics & Tracking
- ✅ Live GPS (movers, water, riders) + Uber/Bolt **stop detection**
- ✅ Rider dispatch engine: owner-first → nearest fallback → sequential offer rotation (decline + countdown)
- ✅ Rider visible on BOTH sides (vendor + supplier see who's collecting)

### 5. Money
- ✅ Payment capture (cash now, M-Pesa stub) at every completion point
- ✅ Commission auto-split (workers/riders 15%, others 20%)
- ✅ Wallet + auto-deduction on cash jobs (workers/riders)
- ✅ Premium earnings dashboard (KPIs, Recharts graphs, transactions)
- ✅ Outstanding balance with Fixera (owe vs payout)

### 6. Documents
- ✅ Customer: Receipts + Invoices + Quotations (branded PDF, app + email)
- ✅ Customer **My Documents** hub (all docs, newest first, download/email)
- ✅ Partner **Payout/Earnings Statement** (PDF + email, period-selectable, tax-ready)

### 7. Trust & Governance
- ✅ Admin approval queue (partners) + per-crew/vehicle verification
- ✅ Admin **Workforce directory** (all crew + vehicles, global)
- ✅ Admin **Product Approvals** (new products + price changes)
- ✅ Department-routed support (6 departments, SLAs, urgent-first)
- ✅ Partner Agreement gate + Qualification checklist (post-login flow)
- ✅ Updated-terms popup (re-accept on version bump)

### 8. Comms
- ✅ In-app notifications (both apps — bell, toast, realtime, role-aware)
- ✅ Partner emails: welcome (signup) + approved/rejected (admin)
- ✅ Customer emails: booking, receipt, document, support

---

## ⏳ REMAINING

### A. Your action (not code)
- ⏳ Run the **18 SQL migrations** in Supabase → `SUPABASE-RUN-MIGRATIONS.md`
- ⏳ **End-to-end test** — all flows on a real phone, report bugs
- ⏳ **Deploy** both apps to Vercel + `fixera.co.ke` domain
- ⏳ Set `GMAIL_EMAIL` + `GMAIL_PASSWORD` env vars on **both** Vercel apps (email won't send otherwise)

### B. External dependency
- ⏳ **M-Pesa** — needs business registration → then one-function swap (`initiateMpesa`) + enable wallet top-up
- ⏳ **Document uploads** in onboarding — needs advocate's final legal pack (which docs are required)
- ⏳ **Final Partner Agreement text** — swap in advocate's verified version + bump version

### C. Optional polish (buildable now)
- ⏳ **FCM push notifications** (alerts when app fully closed) — needs Firebase
- ⏳ **Commission invoice** for partners' cash jobs — parked until settlement runs
- ⏳ Per-payout M-Pesa reference on statements — auto once B2C live

---

## 🎯 CRITICAL PATH TO LAUNCH
1. Run migrations  →  2. End-to-end test + fix bugs  →  3. Deploy + domain + email env vars
4. Onboard real partners (with advocate docs)  →  5. M-Pesa when registered  →  **LIVE**

*Detailed build log: see `FIXERA-MASTER-DOCUMENTATION.md` (sections 1–27).*
