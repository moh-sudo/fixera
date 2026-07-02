-- ============================================================
-- FIXERA: Add Mover & Water Carrier columns to workers table
-- These let users register as Movers / Water Carriers via the
-- partner app's signup page (RegisterPage step 1).
-- Run in: Supabase Dashboard → SQL Editor → New query
-- All columns nullable — existing rows are unaffected.
-- ============================================================

ALTER TABLE workers ADD COLUMN IF NOT EXISTS registration_number TEXT;
ALTER TABLE workers ADD COLUMN IF NOT EXISTS tax_pin              TEXT;
ALTER TABLE workers ADD COLUMN IF NOT EXISTS service_area         TEXT;
ALTER TABLE workers ADD COLUMN IF NOT EXISTS water_source         TEXT;

-- Legal-required at signup (per FIXERA-LEGAL-DOCUMENTATION):
-- Movers must be operating ≥ 2 years; owner National ID always required.
ALTER TABLE workers ADD COLUMN IF NOT EXISTS years_in_operation  INT;
ALTER TABLE workers ADD COLUMN IF NOT EXISTS owner_national_id   TEXT;

-- For movers / water carriers: business_name = Company Name (reusing
-- the same column already used by vendors).
COMMENT ON COLUMN workers.registration_number IS 'Mover/Water Carrier: company registration number (e.g. KRA, KEBS)';
COMMENT ON COLUMN workers.tax_pin             IS 'Mover/Water Carrier: KRA Tax PIN';
COMMENT ON COLUMN workers.service_area        IS 'Water Carrier: areas they cover (e.g. "Westlands, Kilimani, Lavington")';
COMMENT ON COLUMN workers.water_source        IS 'Water Carrier: source of water (borehole | county | private | mixed)';
COMMENT ON COLUMN workers.years_in_operation  IS 'Mover: years company has been operating (legal min 2)';
COMMENT ON COLUMN workers.owner_national_id   IS 'Owner / responsible person National ID number';
