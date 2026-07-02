# 🗄️ Fixera — Run All Migrations (complete, ordered)

Run these in **this exact order** in **Supabase → SQL Editor → New query**.
For each: open the file in `C:\fixera\migrations\`, copy ALL of it, paste,
press **Ctrl+Enter**, wait for "Success".

**Quick copy (PowerShell):** `Get-Content C:\fixera\migrations\<file>.sql | Set-Clipboard`

> ✅ All files are **re-runnable**. If you ever see `already exists` — that
> migration already ran. Safe to ignore and move on.

| # | File | Creates / Adds |
|---|------|----------------|
| 1 | `create_guest_contacts.sql` | guest_contacts (lead capture) |
| 2 | `create_movers_module.sql` | moving_requests, moving_quotes, moving_support_tickets + photo buckets |
| 3 | `create_partner_crew.sql` | partner_crew_members + crew-photos bucket |
| 4 | `add_mover_watercarrier_columns.sql` | mover/water signup fields on workers |
| 5 | `create_mover_fleet.sql` | mover_vehicles + mover-vehicles bucket |
| 6 | `create_water_delivery_module.sql` | water delivery on bookings + **live_locations** + service_id |
| 7 | `add_support_departments.sql` | support_tickets department + priority |
| 8 | `add_mover_gps_verification.sql` | mover loading/delivery photos, signature, GPS |
| 9 | `add_agreement_acceptance.sql` | workers agreement_version + accepted_at *(login gate)* |
| 10 | `add_vendor_fulfillment.sql` | bookings fulfillment_stage, prep photos; workers is_open/hours |
| 11 | `add_rider_dispatch.sql` | delivery_tracking dispatch fields; workers last_lat/lng; bookings assigned_rider_id |
| 12 | `create_supplier_orders.sql` | supplier_orders + delivery_tracking.supplier_order_id |
| 13 | `create_payments.sql` | payments (commission split, cash/mpesa) |
| 14 | `create_wallet_system.sql` | workers wallet_balance, wallet_transactions, **cash-commission trigger** *(needs #13 first)* |
| 15 | `add_materials_estimate.sql` | supplier_orders parent_booking_id + estimate status *(needs #12)* |
| 16 | `add_rider_snapshot.sql` | rider name/phone/vehicle snapshot on bookings + supplier_orders |
| 17 | `add_product_approval.sql` | vendor_products status/pending_price approval workflow |
| 18 | `add_gps_and_dispatch_rotation.sql` | live_locations.supplier_order_id; delivery_tracking offer rotation |

## ⚠️ Order rules that matter
- **#13 `create_payments.sql` BEFORE #14 `create_wallet_system.sql`** — the wallet trigger references the payments table.
- **#12 `create_supplier_orders.sql` BEFORE #15 `add_materials_estimate.sql`**.
- **#6 `create_water_delivery_module.sql`** creates `live_locations` — must run before #18 extends it.

Everything else is order-independent, but top-to-bottom is safest.

## 🧪 Smoke test (after running all 18)
Paste in SQL Editor — every count should return a number (0 is fine):
```sql
SELECT
  (SELECT COUNT(*) FROM moving_requests)      AS moves,
  (SELECT COUNT(*) FROM partner_crew_members) AS crew,
  (SELECT COUNT(*) FROM mover_vehicles)       AS vehicles,
  (SELECT COUNT(*) FROM supplier_orders)      AS supplier_orders,
  (SELECT COUNT(*) FROM payments)             AS payments,
  (SELECT COUNT(*) FROM wallet_transactions)  AS wallet_tx,
  (SELECT COUNT(*) FROM live_locations)       AS gps_pings;
```
If any line errors with `relation ... does not exist`, that migration didn't run — go back to it.

## 🪣 Storage buckets to expect (Storage tab)
`moving-photos`, `mover-worker-photos`, `crew-photos`, `mover-vehicles`

## 🔌 Realtime (for live GPS tracking)
After running, go to **Database → Replication** and confirm `live_locations`
is in the `supabase_realtime` publication (the migration tries to add it
automatically; enable manually if it isn't there).
