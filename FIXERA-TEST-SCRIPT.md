# 🧪 FIXERA — End-to-End Test Script

**Goal:** walk every flow once and confirm it works before deploy.

## Setup
- **Two browser windows:** one normal (Customer), one incognito (Partner).
  - Customer app: your `web` dev URL (e.g. http://localhost:5173)
  - Partner app: your `worker` dev URL (e.g. http://localhost:5176)
  - Admin: customer URL + `/admin` (log in as an `is_admin` user)
- When the browser asks for **location permission → Allow** (needed for GPS).
- Best on a **phone** for real GPS, but desktop works for the logic.
- Tip: keep both windows side by side so you see each side react.

---

## 0. Partner onboarding gate (do once per partner)
1. Partner app → Register as each role you want to test.
2. Confirm you're forced through: **login → (onboarding) → Terms & Conditions → Qualification checklist → dashboard.**
3. Admin → Partners → find the new partner → **Approve**.
   - ✅ Expect: partner's "Pending verification" banner disappears; they can now act.

---

## 1. 🔧 Service Worker
- Customer: book a service (e.g. plumbing) → confirm.
- Partner (worker): see the job → accept → On my way → enter **arrival OTP** (customer shows it) → In progress → show **completion code**.
- Customer: job completes → **💳 payment popup** → tap "Paid Cash" → ✅ "Paid" + **📄 Receipt** download works.
- Customer: leave a review.

## 2. 🚚 Movers
- Customer: `/movers` → 6 steps (locations, property, photos, inventory, vehicle, review) → submit.
- Partner (mover): register **Fleet** (a vehicle) + **Crew** first → see request → **send quote**.
- Customer: see quote → **Accept** → 📄 **Download Quotation** works.
- Partner: assign team + vehicle → upload **loading photos** → **Start Move** (GPS begins).
- Customer: watch the **live map** (truck moving, stop detection). Partner: upload delivery photos → **Mark Delivered**.
- Customer: **inventory sign-off** (tick items) + type name → Confirm → completed → 💳 pay → 📄 receipt.

## 3. 🚰 Water Carrier
- Partner: register **Fleet** + **Crew**.
- Customer: order water.
- Partner: Open Orders → accept (pick driver + vehicle) → loading → **Mark Departed** (GPS).
- Customer: live map + 🟡 stop detection → driver arrives → delivered → 💳 pay → 📄 receipt.

## 4. 🏪 Vendor + 🚗 Rider (laundry loop — the big one)
- Customer: book laundry → **📍 Track My Order**.
- Rider: go **Online** (allow location).
- Vendor: accept order → Received → Preparing → **Ready** (this **auto-dispatches a rider**).
- Rider: see job in queue (distance-ranked; ⭐ if reserved) → **Accept** (or test **Decline** → it re-offers).
- Rider: picked up → out for delivery → delivered.
- Customer: the **track page advances live** + rider card shows. → 💳 pay → 📄 receipt.

## 5. 📦 Supplier
- Supplier: add a product → it's **Pending Approval**.
- Admin → **Product Approvals** → approve it.
- Customer: home → **🛒 Supplies Shop** → product appears → add to cart → checkout.
- Supplier: order → accept → packing → **Ready** (dispatches rider).
- Rider: deliver. Customer: track + 💳 pay + 📄 receipt.

## 6. 🎨 Painting chain (cross-partner)
- Customer: book painting → worker accepts → In progress.
- Worker (on active job): **🎨 Add Materials Estimate** → pick products from a supplier's catalog → send.
- Customer: sees estimate on job page → adjust qty → **Confirm & Order** (📄 quotation downloads).
- Supplier: packs → Ready → Rider delivers materials → Customer pays materials.
- Worker: finishes job → Customer pays labour.

## 7. 💰 Money & documents
- Partner → **Earnings**: KPIs, charts, transactions, wallet (workers/riders), outstanding balance.
- Partner: **📄 Payout Statement** (download + email) + **🧾 Commission Invoice**.
- Customer → Profile → **📂 My Documents**: all receipts/invoices/quotations, download + email.

## 8. 🎧 Support + 🛡️ Admin
- Partner: Support → pick a category → see it route to the right department.
- Admin: Disputes (filter by department), Workforce directory (verify crew/vehicle), Payouts (mark paid → enter M-Pesa ref).

---

## ✅ What "pass" looks like
- No white screens / console errors.
- Each status change reflects on the **other** side within a second (Realtime).
- GPS map shows movement; payment popup records; PDFs download.

## 🐛 If something breaks
- Note the **exact screen + step**, open browser console (F12), copy any red error.
- Paste it to Claude → fix → retest just that step.

## ⚠️ Won't work in local testing (expected)
- **Emails** (need deployed Vercel + Gmail env vars) — they no-op locally.
- **M-Pesa** (parked) — use the **Cash** button everywhere.
- **Closed-app push** (parked) — in-app notifications still work.
