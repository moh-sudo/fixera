# 📦💧 MOVERS & WATER CARRIERS — PRICING STRATEGY
**Created:** June 10, 2026 | **Updated:** June 11, 2026
**Status:** ✅ Implemented in customer app (`web/src/data/services.js`)
**Commission:** 20% to Fixera, 80% to partner (per corrected legal documentation)

---

## 1️⃣ MOVERS 📦 (color #9F7AEA) — 100% QUOTATION MODEL

### ⚠️ WHY NO FIXED PRICES ARE DISPLAYED (Business Decision — June 11, 2026)
Moving prices CANNOT be shown upfront because the final cost depends on
factors unknown at booking time:
1. **DISTANCE** — same estate vs across Nairobi vs intercity = totally different prices
2. **VEHICLE SIZE** — goods volume determines the truck needed (pickup / Canter / lorry)
3. **ACCESS** — floor level, stairs, lift availability, parking distance
4. **GOODS** — fragile items, heavy appliances, packing needs

Showing a fixed range would cause disputes when the real quote differs.
**Every movers service in the app shows "Quote on inspection".**

### The Quote Flow
```
1. Customer selects a moving service (e.g. 2-Bedroom House Move)
2. Customer provides: pickup location, destination, house size,
   description of goods (+ photos optional)
3. Mover assesses: distance + volume + vehicle needed + labour
4. Mover sends QUOTE through Fixera
5. Customer APPROVES quote before any work/payment happens
6. Move completed → payment → 20% commission to Fixera
```

### Vehicle Size Tiers (basis of every quote)

| Vehicle | Capacity | Typical Use | Guide Base Rate |
|---|---|---|---|
| Pickup truck | ~1 tonne | Single items, bedsitter | KSh 2,000–3,500 base |
| Canter (small lorry) | ~3 tonnes | 1BR–2BR houses | KSh 4,500–7,000 base |
| Lorry | 7+ tonnes | 3BR+, offices, intercity | KSh 9,000–15,000 base |

### INTERNAL GUIDE RATES (for movers to build quotes — NOT customer-facing)
```
QUOTE FORMULA (guide for mover partners):
  Quote = Vehicle base rate
        + Distance charge   (≈ KSh 100–150 per km beyond first 5 km)
        + Labour            (≈ KSh 800–1,500 per crew member)
        + Floor charge      (≈ KSh 500 per floor without lift)
        + Packing service   (KSh 2,000–5,000 if requested)
        + Urgency premium   (+30–50% for same-day)

GUIDE RANGES (sanity checks — Fixera flags quotes far outside these):
  Bedsitter move, within town:    KSh 3,500 – 8,000
  1BR move, within town:          KSh 6,000 – 12,000
  2BR move, within town:          KSh 10,000 – 18,000
  Single furniture item, local:   KSh 1,500 – 3,500
  Within-estate short move:       KSh 2,500 – 6,000
```
These guide ranges are used ONLY for quote-reasonableness checks by Fixera
admin — customers never see them.

### Commission Examples (Movers = 20% of approved quote)
```
2-Bedroom Move quoted @ KSh 14,000 (customer approved):
  Fixera commission (20%):  KSh 2,800
  Mover receives (80%):     KSh 11,200

Single item quoted @ KSh 2,500 (customer approved):
  Fixera commission (20%):  KSh 500
  Mover receives (80%):     KSh 2,000
```

### 🔮 FUTURE ENHANCEMENT (planned)
Dedicated movers quote form: pickup + destination map pins (auto distance
calculation), house-size selector, goods photos → movers respond with
quotes in-app → customer compares and approves. Build after M-Pesa phase.

### Revenue Projection (Movers)
```
Assumption: 20 mover partners × 8 jobs/month = 160 jobs/month
Average job value: KSh 6,000
Monthly volume:    160 × 6,000 = KSh 960,000
Monthly commission (20%):        KSh 192,000
Annual commission:               KSh 2,304,000
```

---

## 2️⃣ WATER CARRIERS 💧 (id: water-carriers, color #00B5D8)

### Pricing Principles
- Priced by **quantity** (20L jerrycan counts) — Kenya standard unit
- Distance built into the min–max range (carrier confirms on accept)
- Bulk bowser/tanker for estates, construction, events
- Recurring weekly delivery discounted (locks in repeat customers)
- Emergency = **Priority** (water shortages are urgent in Kenya)

### Price Table (Customer-Facing)

| Category | Service | Duration | Price (KSh) |
|---|---|---|---|
| **Jerrycan (20L)** | 1–5 Jerrycans | 30–60 min | 400 – 700 |
| | 6–10 Jerrycans | 30–60 min | 700 – 1,100 |
| | 11–20 Jerrycans | 1–2 hrs | 1,100 – 1,800 |
| | 20+ Jerrycans (bulk) | 1–2 hrs | Quotation |
| **Drinking Water** | Dispenser Bottle Refill (18.9L) | 30–60 min | 300 – 700 |
| | 5 × Dispenser Bottles | 1 hr | 1,200 – 2,200 |
| **Bulk (Bowser)** | Water Bowser 1,000L | 1–2 hrs | 2,500 – 5,500 |
| | Water Bowser 5,000L | 1–3 hrs | 6,000 – 12,000 |
| | Water Bowser 10,000L+ | 2–4 hrs | Quotation |
| | Tank Filling Service | 1–3 hrs | Quotation |
| **Scheduled** | Weekly Scheduled Delivery | Recurring | 350 – 650/trip |
| | Monthly Delivery Plan | Recurring | Quotation |
| **🚨 Emergency** | Same-Day Emergency Delivery | ASAP | 800 – 2,000 + call-out |
| | Water Shortage Rescue (bulk) | ASAP | 3,000 – 8,000 + call-out |

### Commission Examples (Water Carriers = 20%)
```
10 Jerrycans @ KSh 900:
  Fixera commission (20%):  KSh 180
  Carrier receives (80%):   KSh 720

Bowser 5,000L @ KSh 9,000:
  Fixera commission (20%):  KSh 1,800
  Carrier receives (80%):   KSh 7,200
```

### Revenue Projection (Water Carriers)
```
Assumption: 30 carrier partners × 40 deliveries/month = 1,200 deliveries/month
Average delivery value: KSh 800
Monthly volume:    1,200 × 800 = KSh 960,000
Monthly commission (20%):       KSh 192,000
Annual commission:              KSh 2,304,000
```

---

## 3️⃣ COMBINED IMPACT ON FINANCIAL MODEL

```
NEW ANNUAL COMMISSION FROM THESE 2 CATEGORIES:
  Movers:          KSh 2,304,000
  Water Carriers:  KSh 2,304,000
  ─────────────────────────────
  TOTAL ADDED:     KSh 4,608,000/year

(To be added to existing projections in FIXERA-PROJECT-STATUS-REPORT.md
 once partner recruitment for these categories begins.)
```

---

## 4️⃣ PARTNER REQUIREMENTS (links to legal docs)

- **Movers:** registered company, KSh 10M+ liability insurance, fleet, 2+ yrs experience
  → see Partner Type 5 in `FIXERA-LEGAL-DOCUMENTATION-CORRECTED.txt`
- **Water Carriers:** health certification, food-grade jerrycans ONLY, vehicle cleanliness
  → see Partner Type 6 in `FIXERA-LEGAL-DOCUMENTATION-CORRECTED.txt`
- Both: KSh 500 security deposit, 20% commission, weekly/monthly settlements
- Neither has the wallet system (wallet = Service Workers & Riders only)

---

## 5️⃣ SURGE & ADJUSTMENT RULES (Future — when demand data exists)

| Trigger | Adjustment |
|---|---|
| End-month moving rush (28th–5th) | Movers +10–20% |
| Dry season water shortage | Water +15–30% (capped, anti-gouging) |
| Same-day requests | Priority pricing (already implemented) |
| Off-peak (mid-month weekto weekdays) | Promo discounts -10% |

**Anti-gouging cap:** prices never exceed priceMax + 30%, even in emergencies.
