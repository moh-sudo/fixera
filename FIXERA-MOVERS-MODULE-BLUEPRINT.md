# 📦 FIXERA MOVERS MODULE — OFFICIAL BLUEPRINT
**Created:** June 11, 2026 (Owner's specification)
**Status:** Approved design — implementation phased
**Commission:** 20% to Fixera | Quotation-based pricing only

---

## 1. MOVER REGISTRATION REQUIREMENTS

### Company Information
- Company Name
- Registration Number
- Business License
- Tax PIN (KRA)
- Physical Address
- Company Email
- Company Phone Number
- Company Logo

### Owner Verification
- National ID / Passport
- Selfie Verification
- Phone Verification (SMS OTP)
- Email Verification

### Insurance & Legal
- Vehicle Insurance (mandatory)
- Goods-in-Transit Insurance (recommended; consider mandatory above quote value threshold)
- Terms & Conditions Acceptance
- Fixera Partner Agreement (Partner Type 5 — see legal docs)

---

## 2. FLEET REGISTRATION
Every mover must register ALL vehicles. Must be kept updated.

### Vehicle Details
- Vehicle Type: Pickup | Van | 3-Ton Truck | 5-Ton Truck | 10-Ton Truck
- Plate Number
- Capacity
- Vehicle Photos
- Insurance Status

### Example
| Vehicle | Plate Number |
|---|---|
| Van | KDA123A |
| 3-Ton Truck | KDB456B |
| 5-Ton Truck | KDC789C |

---

## 3. WORKER REGISTRATION
Movers must register all crew members.

### Worker Details
- Full Name
- National ID
- Phone Number
- Profile Photo
- Position: Driver | Team Leader | Loader | Packer

### Uniform Requirement
- Workers must wear company uniforms
- Workers must carry identification

---

## 4. CUSTOMER BOOKING PROCESS

**Step 1:** Pickup Location + Destination
**Step 2:** Property Type — Studio | 1 Bedroom | 2 Bedroom | 3 Bedroom | House | Office | Warehouse
**Step 3:** Upload Photos — Rooms, Furniture, Appliances, Boxes

---

## 5. DIGITAL INVENTORY SYSTEM
After photos, customer confirms exact items + quantities.

- **Furniture:** Sofa, Bed, Wardrobe, Dining Table, Desk
- **Appliances:** Fridge, TV, Washing Machine, Microwave, Cooker
- **Boxes:** Small / Medium / Large

### Example Record
1 Fridge · 2 Beds · 1 Sofa Set · 1 Washing Machine · 12 Boxes
→ becomes the legally-referenced **digital inventory record** for the job.

---

## 6. VEHICLE SELECTION (Uber/Bolt Style)
Customer sees vehicle categories with suitability guidance:
- 🚚 Van — suitable for Studio Apartment
- 🚚 3-Ton Truck — suitable for 1–2 Bedroom House
- 🚚 5-Ton Truck — suitable for Large Homes
Customer selects preferred size (movers may advise differently in quotes).

---

## 7. QUOTATION SYSTEM (Marketplace Model)
1. Customer submits request
2. Nearby movers receive it
3. Movers send quotations
4. Customer compares: Price | Company Rating | Vehicle Type | Number of Workers | ETA
5. Customer selects ONE quotation

---

## 8. COMMUNICATION SYSTEM
Before accepting a quote, customer can chat / call / ask questions / clarify.
Purpose: reduce disputes before they happen.
⚠️ Must stay INSIDE Fixera (platform messaging) to prevent off-platform deals
— per Partner Agreement "no private contact" clause.

---

## 9. TEAM ASSIGNMENT
After acceptance, mover assigns and customer SEES before arrival:
- **Vehicle:** e.g. 5-Ton Truck, Plate KDB456B
- **Workers:** e.g. Ahmed (Driver), Hassan (Loader), Yusuf (Team Leader)
- Names + Photos + Roles visible to customer

---

## 10. LIVE GPS TRACKING
Customer tracks: truck location, driver movement, ETA (Uber/Bolt style).

---

## 11. LOADING VERIFICATION
Before departure, mover uploads truck + loaded cargo photos.
System records: GPS location, timestamp, assigned vehicle, assigned workers.

---

## 12. DELIVERY VERIFICATION
At destination, customer checks off each inventory item as Delivered ✅
and signs digitally.

---

## 13. PROOF OF COMPLETION
Stored permanently: customer signature, delivery photos, GPS location,
completion time. Job officially closed.

---

## 14. DAMAGE & MISSING ITEM CLAIMS
Customer reports damage (photos + description) or missing items
(compared against digital inventory).

Fixera reviews the full evidence chain:
Inventory List → Loading Photos → Delivery Photos → Assigned Workers → Vehicle Used

---

## 15. RATING & REVIEW SYSTEM
Customer rates: Driver | Moving Team | Vehicle Condition | Communication | Overall

---

## 16. ADMIN DASHBOARD (Fixera)
- **Approve Movers:** verify documents, vehicles, workers
- **Monitor Operations:** active jobs, GPS tracking, disputes, reviews
- **Suspend Accounts:** fraud, poor performance, policy violations

---

## 17. FUTURE AI FEATURES (Phase 3)
- **AI Inventory Recognition:** photos → auto-detected item list
- **AI Truck Recommendation:** suggests vehicle type + crew size
- **AI Price Estimation:** estimated cost before quotations arrive

---

## FINAL WORKFLOW
1. Customer enters move details
2. Customer uploads photos
3. Customer confirms inventory list
4. Customer selects preferred vehicle size
5. Movers receive request
6. Movers submit quotations
7. Customer compares quotes
8. Customer chooses mover
9. Customer sees assigned vehicle + workers
10. Live GPS tracking begins
11. Loading photos recorded
12. Delivery completed
13. Customer signs off
14. Reviews & ratings submitted

---
---

# 🛠️ IMPLEMENTATION PHASING (added by development — June 11, 2026)

Building everything at once = months of work. Phased delivery:

## PHASE 1 — MVP (launch-blocking, build first)
Uses existing app patterns (forms + Supabase + photo upload):
- [ ] Mover registration (company + owner + insurance docs) — admin approval flow
- [ ] Fleet registration (vehicles + plates + photos)
- [ ] Worker registration (crew + photos + positions)
- [ ] Customer booking: pickup/destination + property type + photo upload
- [ ] Digital inventory checklist (manual item selection + quantities)
- [ ] Vehicle size selection screen
- [ ] Quotation marketplace: request → movers quote → customer compares → accepts
- [ ] Team assignment display (vehicle + crew shown to customer)
- [ ] Delivery checklist + digital sign-off
- [ ] Ratings & reviews
- [ ] Claims submission (damage/missing — uses inventory + photos)
- [ ] Admin: approve movers, view jobs, suspend accounts

## PHASE 2 — Trust & Tracking (post-launch)
- [ ] Live GPS tracking (driver location streaming — needs partner app updates)
- [ ] In-app chat (Fixera messaging — no private contact)
- [ ] Loading verification automation (GPS + timestamp embedded in photo records)
- [ ] Masked calling (privacy-protected calls)

## PHASE 3 — AI (future)
- [ ] AI inventory recognition from photos
- [ ] AI truck + crew recommendation
- [ ] AI price estimation

## ⚠️ OPEN DECISIONS NEEDED FROM OWNER
1. **Payment timing:** deposit upfront on quote acceptance? Full payment on completion? Escrow via M-Pesa? (ties into M-Pesa integration phase)
2. **Quotation SLA:** how long do movers have to quote (e.g. 2 hours)? What happens if nobody quotes?
3. **Cancellation rules:** fees if customer cancels after team assigned / truck dispatched?
4. **Goods-in-transit insurance:** mandatory above a certain quote value (e.g. KSh 50,000)?
5. **Service areas:** movers define coverage zones so "nearby movers" routing works?

## DATABASE TABLES REQUIRED (Phase 1)
- `mover_companies` (registration + verification status)
- `mover_vehicles` (fleet)
- `mover_workers` (crew)
- `moving_requests` (booking: locations, property type, photos)
- `moving_inventory_items` (digital inventory per request)
- `moving_quotes` (mover quotations per request)
- `moving_assignments` (vehicle + crew per accepted job)
- `moving_verifications` (loading/delivery photos, signature, GPS, timestamps)
- `moving_claims` (damage/missing item reports)
