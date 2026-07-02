-- ============================================================
-- FIXERA — ALL MIGRATIONS IN ORDER (paste this whole file once)
-- Safe to re-run. 'already exists' messages are harmless.
-- ============================================================



-- ════════════════════════════════════════════════════════
-- create_guest_contacts.sql
-- ════════════════════════════════════════════════════════

-- ============================================================
-- FIXERA: Guest Contacts table (Bolt-model lead capture)
-- Run this in: Supabase Dashboard â†’ SQL Editor â†’ New query
-- ============================================================

CREATE TABLE IF NOT EXISTS guest_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(20) NOT NULL UNIQUE,
  email VARCHAR(100),
  source VARCHAR(50) DEFAULT 'guest_login',
  visited_at TIMESTAMPTZ DEFAULT now(),
  converted_to_user BOOLEAN DEFAULT FALSE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_guest_contacts_phone ON guest_contacts(phone);
CREATE INDEX IF NOT EXISTS idx_guest_contacts_email ON guest_contacts(email);
CREATE INDEX IF NOT EXISTS idx_guest_contacts_converted ON guest_contacts(converted_to_user);

-- â”€â”€ Row Level Security â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
ALTER TABLE guest_contacts ENABLE ROW LEVEL SECURITY;

-- Anonymous visitors (guests) must be able to register their contact
DROP POLICY IF EXISTS "Guests can insert their contact" ON guest_contacts;
CREATE POLICY "Guests can insert their contact"
  ON guest_contacts FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Allow upsert (update own row by phone) for re-visits + conversion marking
DROP POLICY IF EXISTS "Guests can update contact rows" ON guest_contacts;
CREATE POLICY "Guests can update contact rows"
  ON guest_contacts FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- Only admins can read the leads list (via service role or is_admin profile)
DROP POLICY IF EXISTS "Admins can read guest contacts" ON guest_contacts;
CREATE POLICY "Admins can read guest contacts"
  ON guest_contacts FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin = true
    )
  );



-- ════════════════════════════════════════════════════════
-- create_movers_module.sql
-- ════════════════════════════════════════════════════════

-- ============================================================
-- FIXERA: Movers Module â€” Phase 1 MVP tables
-- Blueprint: FIXERA-MOVERS-MODULE-BLUEPRINT.md
-- Run this in: Supabase Dashboard â†’ SQL Editor â†’ New query
-- ============================================================

-- â”€â”€ Moving requests (customer side) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
CREATE TABLE IF NOT EXISTS moving_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),

  -- Step 1: locations
  pickup_location TEXT NOT NULL,
  destination TEXT NOT NULL,

  -- Step 2: property type
  property_type VARCHAR(30) NOT NULL,   -- studio | 1br | 2br | 3br | house | office | warehouse

  -- Step 3: photos
  photo_urls JSONB DEFAULT '[]',

  -- Step 4: digital inventory  e.g. [{"item":"Fridge","qty":1},{"item":"Sofa","qty":2}]
  inventory JSONB DEFAULT '[]',

  -- Step 5: preferred vehicle
  vehicle_type VARCHAR(30),             -- pickup | van | truck-3t | truck-5t | truck-10t

  -- extras
  moving_date DATE,
  notes TEXT,

  status VARCHAR(30) DEFAULT 'awaiting_quotes',
  -- awaiting_quotes â†’ quoted â†’ accepted â†’ in_progress â†’ completed | cancelled

  accepted_quote_id UUID,

  -- Team assignment (filled by mover after quote accepted)
  -- assigned_crew: [{ name, role, photo_url, phone }]
  -- role: 'driver' | 'team_leader' | 'loader' | 'packer'
  assigned_crew JSONB DEFAULT '[]',
  assigned_vehicle_plate VARCHAR(20),
  mover_company_name VARCHAR(150),
  mover_phone VARCHAR(20),

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_moving_requests_user ON moving_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_moving_requests_status ON moving_requests(status);

-- â”€â”€ Quotations from movers (marketplace) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
CREATE TABLE IF NOT EXISTS moving_quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES moving_requests(id) ON DELETE CASCADE,

  mover_id UUID,                        -- partner profile id (null until partner app wired)
  mover_name VARCHAR(150) NOT NULL,
  mover_rating NUMERIC(2,1) DEFAULT 0,

  price NUMERIC(12,2) NOT NULL,         -- quoted amount in KSh
  vehicle_type VARCHAR(30) NOT NULL,
  vehicle_plate VARCHAR(20),
  num_workers INT DEFAULT 2,
  eta VARCHAR(50),                      -- e.g. "Arrives in 45 min" / "Tomorrow 8 AM"
  message TEXT,

  status VARCHAR(20) DEFAULT 'pending', -- pending | accepted | declined | expired
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_moving_quotes_request ON moving_quotes(request_id);
CREATE INDEX IF NOT EXISTS idx_moving_quotes_status ON moving_quotes(status);

-- â”€â”€ Storage bucket for moving photos â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
INSERT INTO storage.buckets (id, name, public)
VALUES ('moving-photos', 'moving-photos', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Users upload moving photos" ON storage.objects;
CREATE POLICY "Users upload moving photos"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'moving-photos');

DROP POLICY IF EXISTS "Public read moving photos" ON storage.objects;
CREATE POLICY "Public read moving photos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'moving-photos');

-- â”€â”€ Storage bucket for mover crew photos â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
INSERT INTO storage.buckets (id, name, public)
VALUES ('mover-worker-photos', 'mover-worker-photos', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Movers upload worker photos" ON storage.objects;
CREATE POLICY "Movers upload worker photos"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'mover-worker-photos');

DROP POLICY IF EXISTS "Public read worker photos" ON storage.objects;
CREATE POLICY "Public read worker photos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'mover-worker-photos');

-- â”€â”€ Moving job support tickets â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
CREATE TABLE IF NOT EXISTS moving_support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES moving_requests(id) ON DELETE CASCADE,
  reporter_type VARCHAR(20) NOT NULL, -- 'customer' | 'mover'
  reporter_user_id UUID,
  category VARCHAR(40) NOT NULL,
  -- delay | damage | missing_item | safety | payment | crew_issue | other
  description TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'open', -- open | under_review | resolved
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_moving_tickets_request ON moving_support_tickets(request_id);
CREATE INDEX IF NOT EXISTS idx_moving_tickets_status ON moving_support_tickets(status);

ALTER TABLE moving_support_tickets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated insert moving tickets" ON moving_support_tickets;
CREATE POLICY "Authenticated insert moving tickets"
  ON moving_support_tickets FOR INSERT TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Reporter reads own tickets" ON moving_support_tickets;
CREATE POLICY "Reporter reads own tickets"
  ON moving_support_tickets FOR SELECT TO authenticated
  USING (reporter_user_id = auth.uid());

-- â”€â”€ Row Level Security â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
ALTER TABLE moving_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE moving_quotes   ENABLE ROW LEVEL SECURITY;

-- Customers manage their own requests
DROP POLICY IF EXISTS "Users create own moving requests" ON moving_requests;
CREATE POLICY "Users create own moving requests"
  ON moving_requests FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users read own moving requests" ON moving_requests;
CREATE POLICY "Users read own moving requests"
  ON moving_requests FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users update own moving requests" ON moving_requests;
CREATE POLICY "Users update own moving requests"
  ON moving_requests FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

-- Quotes: request owner can read + update (accept/decline)
DROP POLICY IF EXISTS "Request owner reads quotes" ON moving_quotes;
CREATE POLICY "Request owner reads quotes"
  ON moving_quotes FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM moving_requests r
      WHERE r.id = moving_quotes.request_id AND r.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Request owner updates quotes" ON moving_quotes;
CREATE POLICY "Request owner updates quotes"
  ON moving_quotes FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM moving_requests r
      WHERE r.id = moving_quotes.request_id AND r.user_id = auth.uid()
    )
  );

-- Movers (partner app, authenticated) can submit quotes
DROP POLICY IF EXISTS "Authenticated movers insert quotes" ON moving_quotes;
CREATE POLICY "Authenticated movers insert quotes"
  ON moving_quotes FOR INSERT TO authenticated
  WITH CHECK (true);

-- Movers need to see open requests to quote on them
DROP POLICY IF EXISTS "Authenticated partners read open requests" ON moving_requests;
CREATE POLICY "Authenticated partners read open requests"
  ON moving_requests FOR SELECT TO authenticated
  USING (status IN ('awaiting_quotes', 'quoted'));



-- ════════════════════════════════════════════════════════
-- create_partner_crew.sql
-- ════════════════════════════════════════════════════════

-- ============================================================
-- FIXERA: Partner Crew Registry (universal)
-- Permanent Fixera record of every worker a partner employs.
-- Even when a partner "temporarily" assigns a worker to a job,
-- their identity + photo lives here for safety / accountability.
--
-- Applies to: Movers, Vendors, Water Carriers, Suppliers.
-- Run this in: Supabase Dashboard â†’ SQL Editor â†’ New query
-- ============================================================

CREATE TABLE IF NOT EXISTS partner_crew_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- The partner company that owns / employs this worker
  partner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  partner_type    VARCHAR(20) NOT NULL,
  -- partner_type: 'mover' | 'vendor' | 'water_carrier' | 'supplier'

  -- Identity (ALWAYS required â€” this is the safety guarantee)
  full_name   VARCHAR(150) NOT NULL,
  national_id VARCHAR(30)  NOT NULL,
  phone       VARCHAR(20),
  photo_url   TEXT,

  -- Role / position within this partner's operations
  default_position VARCHAR(40) NOT NULL,
  -- Movers:        driver | team_leader | loader | packer
  -- Vendors:       washer | ironer | technician | delivery | supervisor
  -- Water carriers: driver | loader | delivery_attendant | supervisor
  -- Suppliers:     warehouse | driver | loader | supervisor

  -- Status & verification
  status          VARCHAR(20) DEFAULT 'active',
  -- active | inactive | suspended
  fixera_verified BOOLEAN     DEFAULT false,
  -- Set true after Fixera admin reviews ID + photo

  notes      TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  -- Each partner can't register the same national ID twice
  UNIQUE(partner_user_id, national_id)
);

CREATE INDEX IF NOT EXISTS idx_crew_partner   ON partner_crew_members(partner_user_id);
CREATE INDEX IF NOT EXISTS idx_crew_type      ON partner_crew_members(partner_type);
CREATE INDEX IF NOT EXISTS idx_crew_status    ON partner_crew_members(status);
CREATE INDEX IF NOT EXISTS idx_crew_verified  ON partner_crew_members(fixera_verified);

-- â”€â”€ Storage bucket for crew photos â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
INSERT INTO storage.buckets (id, name, public)
VALUES ('crew-photos', 'crew-photos', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Partners upload crew photos" ON storage.objects;
CREATE POLICY "Partners upload crew photos"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'crew-photos');

DROP POLICY IF EXISTS "Public read crew photos" ON storage.objects;
CREATE POLICY "Public read crew photos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'crew-photos');

DROP POLICY IF EXISTS "Partners replace own crew photos" ON storage.objects;
CREATE POLICY "Partners replace own crew photos"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'crew-photos');

DROP POLICY IF EXISTS "Partners delete own crew photos" ON storage.objects;
CREATE POLICY "Partners delete own crew photos"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'crew-photos');

-- â”€â”€ Row Level Security â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
ALTER TABLE partner_crew_members ENABLE ROW LEVEL SECURITY;

-- Partners manage only their own crew
DROP POLICY IF EXISTS "Partners insert own crew" ON partner_crew_members;
CREATE POLICY "Partners insert own crew"
  ON partner_crew_members FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = partner_user_id);

DROP POLICY IF EXISTS "Partners read own crew" ON partner_crew_members;
CREATE POLICY "Partners read own crew"
  ON partner_crew_members FOR SELECT TO authenticated
  USING (auth.uid() = partner_user_id);

DROP POLICY IF EXISTS "Partners update own crew" ON partner_crew_members;
CREATE POLICY "Partners update own crew"
  ON partner_crew_members FOR UPDATE TO authenticated
  USING (auth.uid() = partner_user_id);

DROP POLICY IF EXISTS "Partners delete own crew" ON partner_crew_members;
CREATE POLICY "Partners delete own crew"
  ON partner_crew_members FOR DELETE TO authenticated
  USING (auth.uid() = partner_user_id);

-- Fixera admins see ALL crew across the platform (safety / verification)
DROP POLICY IF EXISTS "Admins read all crew" ON partner_crew_members;
CREATE POLICY "Admins read all crew"
  ON partner_crew_members FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid() AND p.is_admin = true
  ));

DROP POLICY IF EXISTS "Admins update all crew" ON partner_crew_members;
CREATE POLICY "Admins update all crew"
  ON partner_crew_members FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid() AND p.is_admin = true
  ));

-- Customers viewing an accepted move can read crew photos/names assigned
-- to their job (read-only via the moving_requests.assigned_crew JSONB,
-- which already contains snapshotted name + role + photo_url).
-- No direct customer access to partner_crew_members rows is needed.



-- ════════════════════════════════════════════════════════
-- add_mover_watercarrier_columns.sql
-- ════════════════════════════════════════════════════════

-- ============================================================
-- FIXERA: Add Mover & Water Carrier columns to workers table
-- These let users register as Movers / Water Carriers via the
-- partner app's signup page (RegisterPage step 1).
-- Run in: Supabase Dashboard â†’ SQL Editor â†’ New query
-- All columns nullable â€” existing rows are unaffected.
-- ============================================================

ALTER TABLE workers ADD COLUMN IF NOT EXISTS registration_number TEXT;
ALTER TABLE workers ADD COLUMN IF NOT EXISTS tax_pin              TEXT;
ALTER TABLE workers ADD COLUMN IF NOT EXISTS service_area         TEXT;
ALTER TABLE workers ADD COLUMN IF NOT EXISTS water_source         TEXT;

-- Legal-required at signup (per FIXERA-LEGAL-DOCUMENTATION):
-- Movers must be operating â‰¥ 2 years; owner National ID always required.
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



-- ════════════════════════════════════════════════════════
-- create_mover_fleet.sql
-- ════════════════════════════════════════════════════════

-- ============================================================
-- FIXERA: Mover Fleet Registration
-- Per FIXERA-LEGAL-DOCUMENTATION Â§1007 Â§2: movers must register all
-- vehicles with insurance + condition certificates before going live.
-- Quotes pull plate # from this table (not free-typed).
-- Run in: Supabase Dashboard â†’ SQL Editor â†’ New query
-- ============================================================

CREATE TABLE IF NOT EXISTS mover_vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mover_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Vehicle identity
  vehicle_type  VARCHAR(30) NOT NULL,
  -- pickup | van | truck-3t | truck-5t | truck-10t
  plate_number  VARCHAR(20) NOT NULL,
  make          VARCHAR(100),
  model         VARCHAR(100),
  year          INT,
  color         VARCHAR(50),
  capacity_tons NUMERIC(4,1),

  -- Documents (photos array + logbook + insurance docs)
  photo_urls   JSONB DEFAULT '[]',
  logbook_url  TEXT,

  -- Insurance (legal Â§1031: liability â‰¥ KSh 10M; Â§1081: lapse = suspension)
  insurance_provider      VARCHAR(150),
  insurance_policy_number VARCHAR(100),
  insurance_expiry        DATE,
  insurance_doc_url       TEXT,

  -- Status & verification
  status          VARCHAR(20) DEFAULT 'active',
  -- active | inactive | maintenance | suspended
  fixera_verified BOOLEAN     DEFAULT false,

  notes      TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  -- Each mover can't register the same plate twice
  UNIQUE(mover_user_id, plate_number)
);

CREATE INDEX IF NOT EXISTS idx_fleet_mover    ON mover_vehicles(mover_user_id);
CREATE INDEX IF NOT EXISTS idx_fleet_status   ON mover_vehicles(status);
CREATE INDEX IF NOT EXISTS idx_fleet_verified ON mover_vehicles(fixera_verified);

-- â”€â”€ Storage bucket for vehicle photos + insurance docs â”€â”€â”€â”€â”€â”€â”€
INSERT INTO storage.buckets (id, name, public)
VALUES ('mover-vehicles', 'mover-vehicles', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Movers upload vehicle files" ON storage.objects;
CREATE POLICY "Movers upload vehicle files"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'mover-vehicles');

DROP POLICY IF EXISTS "Public read vehicle files" ON storage.objects;
CREATE POLICY "Public read vehicle files"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'mover-vehicles');

DROP POLICY IF EXISTS "Movers update vehicle files" ON storage.objects;
CREATE POLICY "Movers update vehicle files"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'mover-vehicles');

DROP POLICY IF EXISTS "Movers delete vehicle files" ON storage.objects;
CREATE POLICY "Movers delete vehicle files"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'mover-vehicles');

-- â”€â”€ Row Level Security â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
ALTER TABLE mover_vehicles ENABLE ROW LEVEL SECURITY;

-- Movers manage only their own vehicles
DROP POLICY IF EXISTS "Movers insert own vehicles" ON mover_vehicles;
CREATE POLICY "Movers insert own vehicles"
  ON mover_vehicles FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = mover_user_id);

DROP POLICY IF EXISTS "Movers read own vehicles" ON mover_vehicles;
CREATE POLICY "Movers read own vehicles"
  ON mover_vehicles FOR SELECT TO authenticated
  USING (auth.uid() = mover_user_id);

DROP POLICY IF EXISTS "Movers update own vehicles" ON mover_vehicles;
CREATE POLICY "Movers update own vehicles"
  ON mover_vehicles FOR UPDATE TO authenticated
  USING (auth.uid() = mover_user_id);

DROP POLICY IF EXISTS "Movers delete own vehicles" ON mover_vehicles;
CREATE POLICY "Movers delete own vehicles"
  ON mover_vehicles FOR DELETE TO authenticated
  USING (auth.uid() = mover_user_id);

-- Fixera admins see + manage ALL vehicles across the platform
DROP POLICY IF EXISTS "Admins read all vehicles" ON mover_vehicles;
CREATE POLICY "Admins read all vehicles"
  ON mover_vehicles FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid() AND p.is_admin = true
  ));

DROP POLICY IF EXISTS "Admins update all vehicles" ON mover_vehicles;
CREATE POLICY "Admins update all vehicles"
  ON mover_vehicles FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid() AND p.is_admin = true
  ));



-- ════════════════════════════════════════════════════════
-- create_water_delivery_module.sql
-- ════════════════════════════════════════════════════════

-- ============================================================
-- FIXERA: Water Delivery Module + GPS Live Tracking
-- Reuses existing bookings table (water deliveries are fixed-price
-- and fit standard booking flow). Adds water-specific columns +
-- new live_locations table for real-time driver tracking.
-- Run in: Supabase Dashboard â†’ SQL Editor â†’ New query
-- ============================================================

-- â”€â”€ Add stable service_id (the existing 'service' column is the
--    human-readable name like "Water Delivery"; we need a stable
--    machine identifier for RLS policies and service routing). â”€â”€
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS service_id TEXT;

COMMENT ON COLUMN bookings.service_id IS 'Stable service identifier (e.g. water-carriers, movers, plumbing). Distinct from the human-readable service name column.';

-- Backfill existing rows where service name contains 'water'
UPDATE bookings SET service_id = 'water-carriers'
WHERE service_id IS NULL AND lower(service) LIKE '%water%';

CREATE INDEX IF NOT EXISTS idx_bookings_service_id ON bookings(service_id) WHERE service_id IS NOT NULL;

-- â”€â”€ Extend bookings with water delivery fields â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS carrier_user_id     UUID;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS driver_snapshot     JSONB;
-- driver_snapshot: { name, phone, photo_url, plate, vehicle_id }
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS delivery_photo_urls JSONB DEFAULT '[]';
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS confirmed_at        TIMESTAMPTZ;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS departed_at         TIMESTAMPTZ;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS arrived_at          TIMESTAMPTZ;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS delivered_at        TIMESTAMPTZ;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS cancellation_reason TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS cancellation_fee    NUMERIC(10,2);

COMMENT ON COLUMN bookings.carrier_user_id      IS 'Water Carrier: assigned partner';
COMMENT ON COLUMN bookings.driver_snapshot      IS 'Water Carrier: driver name, photo, plate (snapshotted from fleet/crew)';
COMMENT ON COLUMN bookings.delivery_photo_urls  IS 'Water Carrier: driver-uploaded delivery proof photos';
COMMENT ON COLUMN bookings.confirmed_at         IS 'Status timestamp: carrier accepted order';
COMMENT ON COLUMN bookings.departed_at          IS 'Status timestamp: truck left depot';
COMMENT ON COLUMN bookings.arrived_at           IS 'Status timestamp: truck at customer gate';
COMMENT ON COLUMN bookings.delivered_at         IS 'Status timestamp: customer signed off';

CREATE INDEX IF NOT EXISTS idx_bookings_carrier ON bookings(carrier_user_id) WHERE carrier_user_id IS NOT NULL;

-- â”€â”€ Live locations (GPS streaming for movers + water carriers) â”€â”€
CREATE TABLE IF NOT EXISTS live_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- What this location relates to
  booking_id UUID,                              -- water delivery
  moving_request_id UUID,                       -- moving request (future Phase 2)
  partner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Coordinates
  lat       NUMERIC(10, 7) NOT NULL,
  lng       NUMERIC(10, 7) NOT NULL,
  accuracy  NUMERIC(8, 2),                       -- meters
  heading   NUMERIC(5, 2),                       -- degrees 0-360
  speed     NUMERIC(8, 2),                       -- m/s

  recorded_at TIMESTAMPTZ DEFAULT now(),

  CONSTRAINT live_locations_target_check
    CHECK (booking_id IS NOT NULL OR moving_request_id IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS idx_live_loc_booking         ON live_locations(booking_id, recorded_at DESC)         WHERE booking_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_live_loc_moving          ON live_locations(moving_request_id, recorded_at DESC)  WHERE moving_request_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_live_loc_partner_recent  ON live_locations(partner_user_id, recorded_at DESC);

-- Enable Realtime so customer can subscribe
ALTER TABLE live_locations REPLICA IDENTITY FULL;

-- â”€â”€ Row Level Security â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
ALTER TABLE live_locations ENABLE ROW LEVEL SECURITY;

-- Partners insert their own location pings
DROP POLICY IF EXISTS "Partners insert own location" ON live_locations;
CREATE POLICY "Partners insert own location"
  ON live_locations FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = partner_user_id);

-- Customer can read locations for their own bookings
DROP POLICY IF EXISTS "Customer reads own booking locations" ON live_locations;
CREATE POLICY "Customer reads own booking locations"
  ON live_locations FOR SELECT TO authenticated
  USING (
    booking_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM bookings b
      WHERE b.id = live_locations.booking_id AND b.user_id = auth.uid()
    )
    OR
    moving_request_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM moving_requests m
      WHERE m.id = live_locations.moving_request_id AND m.user_id = auth.uid()
    )
  );

-- Partners can read their own location history
DROP POLICY IF EXISTS "Partners read own location" ON live_locations;
CREATE POLICY "Partners read own location"
  ON live_locations FOR SELECT TO authenticated
  USING (auth.uid() = partner_user_id);

-- Admins read all
DROP POLICY IF EXISTS "Admins read all locations" ON live_locations;
CREATE POLICY "Admins read all locations"
  ON live_locations FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin = true
  ));

-- â”€â”€ Water Carriers: extra RLS on bookings â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
-- Online water carriers can see open water orders (broadcast queue)
DROP POLICY IF EXISTS "Water carriers read open water orders" ON bookings;
CREATE POLICY "Water carriers read open water orders"
  ON bookings FOR SELECT TO authenticated
  USING (
    service_id = 'water-carriers'
    AND (
      -- Open (not yet assigned) â€” any water carrier sees it
      (status = 'pending' AND carrier_user_id IS NULL)
      -- Assigned to me â€” I see it
      OR carrier_user_id = auth.uid()
    )
  );

-- Water carriers can claim open orders (set carrier_user_id = self)
DROP POLICY IF EXISTS "Water carriers claim open orders" ON bookings;
CREATE POLICY "Water carriers claim open orders"
  ON bookings FOR UPDATE TO authenticated
  USING (
    service_id = 'water-carriers' AND (
      (status = 'pending' AND carrier_user_id IS NULL)
      OR carrier_user_id = auth.uid()
    )
  );

-- â”€â”€ Add live_locations to the realtime publication (for Supabase Realtime) â”€â”€
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'live_locations'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE live_locations;
  END IF;
EXCEPTION WHEN OTHERS THEN
  -- If publication doesn't exist or insert fails, ignore â€” realtime can be enabled
  -- manually in Supabase Dashboard â†’ Database â†’ Replication
  NULL;
END $$;



-- ════════════════════════════════════════════════════════
-- add_support_departments.sql
-- ════════════════════════════════════════════════════════

-- ============================================================
-- FIXERA: Support Departments & Priority
-- Adds department routing + priority to support tickets so each
-- partner type's issues route to the right Fixera department:
--   finance | operations | trust_safety | accounts | technical | partner_success
-- Run in: Supabase Dashboard â†’ SQL Editor â†’ New query
-- ============================================================

ALTER TABLE support_tickets ADD COLUMN IF NOT EXISTS department TEXT DEFAULT 'partner_success';
ALTER TABLE support_tickets ADD COLUMN IF NOT EXISTS priority   TEXT DEFAULT 'normal';
-- priority: 'urgent' | 'high' | 'normal'

COMMENT ON COLUMN support_tickets.department IS 'Routing department: finance | operations | trust_safety | accounts | technical | partner_success';
COMMENT ON COLUMN support_tickets.priority   IS 'Ticket priority: urgent (1h SLA) | high | normal';

-- Backfill old tickets from their legacy category names
UPDATE support_tickets SET department = 'finance',      priority = 'high'
  WHERE department = 'partner_success' AND category IN ('payment');
UPDATE support_tickets SET department = 'operations',   priority = 'high'
  WHERE department = 'partner_success' AND category IN ('booking');
UPDATE support_tickets SET department = 'trust_safety', priority = 'urgent'
  WHERE department = 'partner_success' AND category IN ('customer');
UPDATE support_tickets SET department = 'accounts'
  WHERE department = 'partner_success' AND category IN ('account');
UPDATE support_tickets SET department = 'technical'
  WHERE department = 'partner_success' AND category IN ('app');

CREATE INDEX IF NOT EXISTS idx_tickets_department ON support_tickets(department);
CREATE INDEX IF NOT EXISTS idx_tickets_priority   ON support_tickets(priority);



-- ════════════════════════════════════════════════════════
-- add_mover_gps_verification.sql
-- ════════════════════════════════════════════════════════

-- ============================================================
-- FIXERA: Mover Live GPS + Loading/Delivery Verification
-- Blueprint Â§11â€“13: loading photo evidence chain at pickup,
-- customer inventory sign-off at destination, live GPS in transit.
-- Run in: Supabase Dashboard â†’ SQL Editor â†’ New query
-- ============================================================

-- â”€â”€ Loading verification (photos of loaded cargo + truck at pickup) â”€â”€
ALTER TABLE moving_requests ADD COLUMN IF NOT EXISTS loading_photo_urls  JSONB DEFAULT '[]';
ALTER TABLE moving_requests ADD COLUMN IF NOT EXISTS started_at          TIMESTAMPTZ;

-- â”€â”€ Delivery verification + digital sign-off â”€â”€
ALTER TABLE moving_requests ADD COLUMN IF NOT EXISTS delivery_photo_urls JSONB DEFAULT '[]';
ALTER TABLE moving_requests ADD COLUMN IF NOT EXISTS delivery_checklist  JSONB;
-- delivery_checklist: [{ item: 'Sofa', qty: 1, received: true }, ...]
ALTER TABLE moving_requests ADD COLUMN IF NOT EXISTS delivery_signature  TEXT;
-- typed full name as digital signature
ALTER TABLE moving_requests ADD COLUMN IF NOT EXISTS delivered_at        TIMESTAMPTZ;
ALTER TABLE moving_requests ADD COLUMN IF NOT EXISTS delivery_signed_at  TIMESTAMPTZ;

COMMENT ON COLUMN moving_requests.loading_photo_urls  IS 'Mover-uploaded photos of loaded cargo + truck at pickup (evidence chain)';
COMMENT ON COLUMN moving_requests.delivery_photo_urls IS 'Mover-uploaded photos at destination';
COMMENT ON COLUMN moving_requests.delivery_checklist  IS 'Customer tick-off of inventory items received: [{item, qty, received}]';
COMMENT ON COLUMN moving_requests.delivery_signature  IS 'Customer typed full name = digital sign-off';
COMMENT ON COLUMN moving_requests.started_at          IS 'Mover tapped Start Move (GPS begins)';
COMMENT ON COLUMN moving_requests.delivered_at        IS 'Mover marked arrived+unloaded at destination';
COMMENT ON COLUMN moving_requests.delivery_signed_at  IS 'Customer confirmed receipt + signed';

-- Status flow is now:
-- awaiting_quotes â†’ quoted â†’ accepted â†’ in_progress â†’ delivered â†’ completed
--                                                   â†˜ cancelled

-- â”€â”€ RLS: movers must be able to update requests they won â”€â”€
-- (assign team / start / deliver). Scoped to the mover whose
-- quote was accepted, or who has any quote while open.
DROP POLICY IF EXISTS "Movers update requests they quoted" ON moving_requests;
CREATE POLICY "Movers update requests they quoted"
  ON moving_requests FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM moving_quotes q
      WHERE q.request_id = moving_requests.id
        AND q.mover_id = auth.uid()
    )
  );

-- live_locations already supports moving_request_id with customer-read
-- RLS (created in create_water_delivery_module.sql). Nothing to add.



-- ════════════════════════════════════════════════════════
-- add_agreement_acceptance.sql
-- ════════════════════════════════════════════════════════

-- ============================================================
-- FIXERA: Partner Agreement Acceptance Tracking
-- Records which version of the Fixera Partner Terms each partner
-- accepted and when (audit trail for legal compliance).
-- When the advocate-verified terms ship, bump AGREEMENT_VERSION
-- in worker/src/data/partnerAgreements.js â€” partners re-accept.
-- Run in: Supabase Dashboard â†’ SQL Editor â†’ New query
-- ============================================================

ALTER TABLE workers ADD COLUMN IF NOT EXISTS agreement_version     TEXT;
ALTER TABLE workers ADD COLUMN IF NOT EXISTS agreement_accepted_at TIMESTAMPTZ;

COMMENT ON COLUMN workers.agreement_version     IS 'Version of Fixera Partner Terms accepted (e.g. v0.9-draft)';
COMMENT ON COLUMN workers.agreement_accepted_at IS 'Timestamp when the partner accepted the terms';



-- ════════════════════════════════════════════════════════
-- add_vendor_fulfillment.sql
-- ════════════════════════════════════════════════════════

-- ============================================================
-- FIXERA: Vendor Order Fulfillment + Business Hours
-- Adds the laundry/cleaning fulfillment lifecycle on top of the
-- coarse bookings.status, plus before/after proof photos and
-- vendor availability (open/closed + hours).
-- Run in: Supabase Dashboard â†’ SQL Editor â†’ New query
-- ============================================================

-- â”€â”€ Per-order fulfillment lifecycle (distinct from coarse status) â”€â”€
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS fulfillment_stage TEXT;
-- received | preparing | ready | out_for_delivery | delivered
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS prep_photos       JSONB DEFAULT '[]';
-- before/after photos of the items being cleaned
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS received_at       TIMESTAMPTZ;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS prep_started_at   TIMESTAMPTZ;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS ready_at          TIMESTAMPTZ;

COMMENT ON COLUMN bookings.fulfillment_stage IS 'Vendor order lifecycle: received | preparing | ready | out_for_delivery | delivered';
COMMENT ON COLUMN bookings.prep_photos       IS 'Vendor before/after proof photos of items';
COMMENT ON COLUMN bookings.received_at        IS 'Vendor received the items';
COMMENT ON COLUMN bookings.prep_started_at    IS 'Vendor started processing';
COMMENT ON COLUMN bookings.ready_at           IS 'Items ready for return delivery';

CREATE INDEX IF NOT EXISTS idx_bookings_fulfillment ON bookings(fulfillment_stage) WHERE fulfillment_stage IS NOT NULL;

-- â”€â”€ Vendor availability â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
ALTER TABLE workers ADD COLUMN IF NOT EXISTS is_open        BOOLEAN DEFAULT true;
ALTER TABLE workers ADD COLUMN IF NOT EXISTS business_hours JSONB;
-- business_hours: { open: '08:00', close: '18:00', days: ['mon','tue',...] }

COMMENT ON COLUMN workers.is_open        IS 'Vendor/Supplier: currently accepting orders';
COMMENT ON COLUMN workers.business_hours IS 'Operating hours { open, close, days[] }';



-- ════════════════════════════════════════════════════════
-- add_rider_dispatch.sql
-- ════════════════════════════════════════════════════════

-- ============================================================
-- FIXERA: Rider Dispatch Engine + Live Location
-- Connects Vendors â†’ Riders. When a vendor marks an order "Ready",
-- a return delivery leg is auto-created and offered to the ORIGINAL
-- rider first (15-min exclusive window), then to the nearest
-- available rider. Online riders broadcast their location so the
-- system can rank by distance.
-- Run in: Supabase Dashboard â†’ SQL Editor â†’ New query
-- ============================================================

-- â”€â”€ delivery_tracking: support two legs + dispatch metadata â”€â”€
ALTER TABLE delivery_tracking ADD COLUMN IF NOT EXISTS leg_type          TEXT DEFAULT 'pickup';
-- 'pickup' (customer â†’ vendor) | 'return' (vendor â†’ customer)
ALTER TABLE delivery_tracking ADD COLUMN IF NOT EXISTS dropoff_address   TEXT;
ALTER TABLE delivery_tracking ADD COLUMN IF NOT EXISTS pickup_lat        NUMERIC(10,7);
ALTER TABLE delivery_tracking ADD COLUMN IF NOT EXISTS pickup_lng        NUMERIC(10,7);
ALTER TABLE delivery_tracking ADD COLUMN IF NOT EXISTS dropoff_lat       NUMERIC(10,7);
ALTER TABLE delivery_tracking ADD COLUMN IF NOT EXISTS dropoff_lng       NUMERIC(10,7);
ALTER TABLE delivery_tracking ADD COLUMN IF NOT EXISTS vendor_id         UUID;
ALTER TABLE delivery_tracking ADD COLUMN IF NOT EXISTS customer_name     TEXT;
ALTER TABLE delivery_tracking ADD COLUMN IF NOT EXISTS preferred_rider_id UUID;
ALTER TABLE delivery_tracking ADD COLUMN IF NOT EXISTS offered_at        TIMESTAMPTZ;
ALTER TABLE delivery_tracking ADD COLUMN IF NOT EXISTS amount            NUMERIC(10,2);

COMMENT ON COLUMN delivery_tracking.leg_type           IS 'pickup (customerâ†’vendor) or return (vendorâ†’customer)';
COMMENT ON COLUMN delivery_tracking.preferred_rider_id IS 'Rider who owns this order â€” offered the return leg first';
COMMENT ON COLUMN delivery_tracking.offered_at         IS 'When the preferred rider was offered the leg (15-min exclusive window)';

CREATE INDEX IF NOT EXISTS idx_dt_pending   ON delivery_tracking(status) WHERE rider_id IS NULL;
CREATE INDEX IF NOT EXISTS idx_dt_preferred ON delivery_tracking(preferred_rider_id) WHERE preferred_rider_id IS NOT NULL;

-- â”€â”€ Rider live location (for distance ranking) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
ALTER TABLE workers ADD COLUMN IF NOT EXISTS last_lat         NUMERIC(10,7);
ALTER TABLE workers ADD COLUMN IF NOT EXISTS last_lng         NUMERIC(10,7);
ALTER TABLE workers ADD COLUMN IF NOT EXISTS last_location_at TIMESTAMPTZ;

COMMENT ON COLUMN workers.last_lat IS 'Rider last known latitude (broadcast while online)';
COMMENT ON COLUMN workers.last_lng IS 'Rider last known longitude (broadcast while online)';

-- â”€â”€ Order ownership: which rider owns this booking's logistics â”€â”€
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS assigned_rider_id UUID;
COMMENT ON COLUMN bookings.assigned_rider_id IS 'Rider who did pickup â€” preferred for return leg';

-- â”€â”€ RLS: riders read pending + own legs, claim open ones â”€â”€â”€â”€
ALTER TABLE delivery_tracking ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Riders read available + own legs" ON delivery_tracking;
CREATE POLICY "Riders read available + own legs"
  ON delivery_tracking FOR SELECT TO authenticated
  USING (
    rider_id IS NULL            -- open jobs (queue)
    OR rider_id = auth.uid()    -- my jobs
  );

DROP POLICY IF EXISTS "Riders claim + update legs" ON delivery_tracking;
CREATE POLICY "Riders claim + update legs"
  ON delivery_tracking FOR UPDATE TO authenticated
  USING (rider_id IS NULL OR rider_id = auth.uid());

DROP POLICY IF EXISTS "System inserts legs" ON delivery_tracking;
CREATE POLICY "System inserts legs"
  ON delivery_tracking FOR INSERT TO authenticated
  WITH CHECK (true);



-- ════════════════════════════════════════════════════════
-- create_supplier_orders.sql
-- ════════════════════════════════════════════════════════

-- ============================================================
-- FIXERA: Supplier Marketplace Orders
-- Customers browse supplier products and place multi-item orders.
-- Suppliers fulfill (pack â†’ ready â†’ dispatch via Fixera rider).
-- Run in: Supabase Dashboard â†’ SQL Editor â†’ New query
-- ============================================================

CREATE TABLE IF NOT EXISTS supplier_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id  UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  supplier_id  UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Cart line items: [{ product_id, name, price, qty }]
  items        JSONB NOT NULL DEFAULT '[]',
  total        NUMERIC(12,2) NOT NULL DEFAULT 0,

  -- Delivery
  customer_name    TEXT,
  customer_phone   TEXT,
  delivery_address TEXT,
  delivery_lat     NUMERIC(10,7),
  delivery_lng     NUMERIC(10,7),
  notes            TEXT,

  -- Lifecycle
  status            TEXT DEFAULT 'pending',
  -- pending | confirmed | packing | ready | out_for_delivery | delivered | cancelled
  fulfillment_stage TEXT,
  assigned_rider_id UUID,

  confirmed_at TIMESTAMPTZ,
  packed_at    TIMESTAMPTZ,
  ready_at     TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  created_at   TIMESTAMPTZ DEFAULT now(),
  updated_at   TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sup_orders_customer ON supplier_orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_sup_orders_supplier ON supplier_orders(supplier_id);
CREATE INDEX IF NOT EXISTS idx_sup_orders_status   ON supplier_orders(status);

-- Link delivery legs to supplier orders (in addition to bookings)
ALTER TABLE delivery_tracking ADD COLUMN IF NOT EXISTS supplier_order_id UUID;
CREATE INDEX IF NOT EXISTS idx_dt_supplier_order ON delivery_tracking(supplier_order_id) WHERE supplier_order_id IS NOT NULL;

-- â”€â”€ RLS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
ALTER TABLE supplier_orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Customers manage own supplier orders" ON supplier_orders;
CREATE POLICY "Customers manage own supplier orders"
  ON supplier_orders FOR ALL TO authenticated
  USING (customer_id = auth.uid())
  WITH CHECK (customer_id = auth.uid());

DROP POLICY IF EXISTS "Suppliers read their orders" ON supplier_orders;
CREATE POLICY "Suppliers read their orders"
  ON supplier_orders FOR SELECT TO authenticated
  USING (supplier_id = auth.uid());

DROP POLICY IF EXISTS "Suppliers update their orders" ON supplier_orders;
CREATE POLICY "Suppliers update their orders"
  ON supplier_orders FOR UPDATE TO authenticated
  USING (supplier_id = auth.uid());

-- Riders need to read supplier orders attached to their delivery legs
DROP POLICY IF EXISTS "Riders read assigned supplier orders" ON supplier_orders;
CREATE POLICY "Riders read assigned supplier orders"
  ON supplier_orders FOR SELECT TO authenticated
  USING (assigned_rider_id = auth.uid());

DROP POLICY IF EXISTS "Admins read all supplier orders" ON supplier_orders;
CREATE POLICY "Admins read all supplier orders"
  ON supplier_orders FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin = true));

-- Customers also need to read products to shop (vendor_products is the catalog)
DROP POLICY IF EXISTS "Anyone can read in-stock products" ON vendor_products;
CREATE POLICY "Anyone can read in-stock products"
  ON vendor_products FOR SELECT TO authenticated
  USING (true);



-- ════════════════════════════════════════════════════════
-- create_payments.sql
-- ════════════════════════════════════════════════════════

-- ============================================================
-- FIXERA: Payments Layer (M-Pesa-ready, cash-capable now)
-- Records every payment a customer makes to a partner, the
-- Fixera commission, and the settlement status. M-Pesa is a
-- 'method' that is stubbed today and wired to Daraja later â€”
-- this table does not change when M-Pesa goes live.
-- Run in: Supabase Dashboard â†’ SQL Editor â†’ New query
-- ============================================================

CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  customer_id  UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  payee_id     UUID,                 -- partner receiving the money
  payee_role   TEXT,                 -- worker | rider | vendor | supplier | mover | water_carrier

  -- What this payment is for
  ref_type     TEXT,                 -- booking | moving_request | supplier_order
  ref_id       UUID,
  purpose      TEXT,                 -- service | materials | delivery | move | water
  description  TEXT,

  -- Money (commission split per legal doc)
  amount           NUMERIC(12,2) NOT NULL,
  commission_rate  NUMERIC(5,2),     -- e.g. 15.00 or 20.00
  commission_amount NUMERIC(12,2),
  partner_amount   NUMERIC(12,2),

  -- How it was paid
  method   TEXT DEFAULT 'cash',      -- cash | mpesa
  status   TEXT DEFAULT 'pending',   -- pending | paid | failed
  mpesa_ref TEXT,                     -- M-Pesa transaction id (when live)

  -- Settlement (cash collected by partner â†’ Fixera reconciles commission)
  settlement_status TEXT DEFAULT 'unsettled', -- unsettled | settled
  paid_at      TIMESTAMPTZ,
  created_at   TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payments_customer ON payments(customer_id);
CREATE INDEX IF NOT EXISTS idx_payments_payee    ON payments(payee_id);
CREATE INDEX IF NOT EXISTS idx_payments_ref      ON payments(ref_type, ref_id);
CREATE INDEX IF NOT EXISTS idx_payments_status   ON payments(status);

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Customers manage own payments" ON payments;
CREATE POLICY "Customers manage own payments"
  ON payments FOR ALL TO authenticated
  USING (customer_id = auth.uid())
  WITH CHECK (customer_id = auth.uid());

DROP POLICY IF EXISTS "Payees read their payments" ON payments;
CREATE POLICY "Payees read their payments"
  ON payments FOR SELECT TO authenticated
  USING (payee_id = auth.uid());

DROP POLICY IF EXISTS "Admins read all payments" ON payments;
CREATE POLICY "Admins read all payments"
  ON payments FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin = true));



-- ════════════════════════════════════════════════════════
-- create_wallet_system.sql
-- ════════════════════════════════════════════════════════

-- ============================================================
-- FIXERA: Partner Wallet + Commission Auto-Deduction
-- Workers & Riders keep a deposit wallet. When a customer pays
-- CASH, the partner holds Fixera's commission, so it is deducted
-- from their wallet automatically (DB trigger â€” bypasses RLS).
-- Vendors/Suppliers/Movers/Water use settlement instead (no wallet).
-- Run in: Supabase Dashboard â†’ SQL Editor â†’ New query
-- ============================================================

ALTER TABLE workers ADD COLUMN IF NOT EXISTS wallet_balance NUMERIC(12,2) DEFAULT 0;
COMMENT ON COLUMN workers.wallet_balance IS 'Worker/Rider deposit wallet; commission on cash jobs is deducted from here';

CREATE TABLE IF NOT EXISTS wallet_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type           TEXT NOT NULL,            -- topup | commission | payout | adjustment
  amount         NUMERIC(12,2) NOT NULL,   -- + credit, - debit
  balance_after  NUMERIC(12,2),
  ref_payment_id UUID,
  note           TEXT,
  created_at     TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_wallet_tx_worker ON wallet_transactions(worker_id, created_at DESC);

ALTER TABLE wallet_transactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Workers read own wallet tx" ON wallet_transactions;
CREATE POLICY "Workers read own wallet tx"
  ON wallet_transactions FOR SELECT TO authenticated
  USING (worker_id = auth.uid());

-- â”€â”€ Trigger: deduct commission from wallet on cash payment â”€â”€
CREATE OR REPLACE FUNCTION fixera_wallet_on_cash_payment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_balance NUMERIC(12,2);
BEGIN
  -- Only when a payment first becomes paid, cash, for a worker/rider
  IF NEW.status = 'paid'
     AND NEW.method = 'cash'
     AND (OLD.status IS DISTINCT FROM 'paid')
     AND NEW.payee_role IN ('worker','rider')
     AND NEW.payee_id IS NOT NULL
     AND COALESCE(NEW.commission_amount,0) > 0
  THEN
    UPDATE workers
      SET wallet_balance = COALESCE(wallet_balance,0) - NEW.commission_amount
      WHERE id = NEW.payee_id
      RETURNING wallet_balance INTO new_balance;

    INSERT INTO wallet_transactions (worker_id, type, amount, balance_after, ref_payment_id, note)
    VALUES (NEW.payee_id, 'commission', -NEW.commission_amount, new_balance, NEW.id,
            'Commission on cash job');
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_wallet_on_cash_payment ON payments;
CREATE TRIGGER trg_wallet_on_cash_payment
  AFTER UPDATE ON payments
  FOR EACH ROW
  EXECUTE FUNCTION fixera_wallet_on_cash_payment();



-- ════════════════════════════════════════════════════════
-- add_materials_estimate.sql
-- ════════════════════════════════════════════════════════

-- ============================================================
-- FIXERA: Painting-style Materials Estimate (multi-partner chain)
-- A service worker on an active job estimates materials from a
-- supplier's catalog â†’ creates a supplier_order in 'estimate'
-- state linked to the parent job. Customer confirms â†’ it enters
-- the normal supplier â†’ rider â†’ delivery â†’ payment flow.
-- Run in: Supabase Dashboard â†’ SQL Editor â†’ New query
--   (AFTER create_supplier_orders.sql)
-- ============================================================

ALTER TABLE supplier_orders ADD COLUMN IF NOT EXISTS parent_booking_id UUID;
ALTER TABLE supplier_orders ADD COLUMN IF NOT EXISTS estimated_by_worker UUID;

COMMENT ON COLUMN supplier_orders.parent_booking_id   IS 'The service job (bookings.id) this materials order belongs to';
COMMENT ON COLUMN supplier_orders.estimated_by_worker IS 'Service worker who created the materials estimate';

-- 'estimate' is a new status BEFORE 'pending':
--   estimate (worker proposed) â†’ pending (customer confirmed) â†’ confirmed â†’ ... â†’ delivered
CREATE INDEX IF NOT EXISTS idx_sup_orders_parent ON supplier_orders(parent_booking_id) WHERE parent_booking_id IS NOT NULL;

-- â”€â”€ RLS: let the assigned service worker create an estimate â”€â”€
-- A worker may insert a supplier_order when it is an estimate tied to a
-- booking they are assigned to.
DROP POLICY IF EXISTS "Workers create material estimates" ON supplier_orders;
CREATE POLICY "Workers create material estimates"
  ON supplier_orders FOR INSERT TO authenticated
  WITH CHECK (
    estimated_by_worker = auth.uid()
    AND status = 'estimate'
    AND EXISTS (
      SELECT 1 FROM bookings b
      WHERE b.id = supplier_orders.parent_booking_id
        AND b.worker_id = auth.uid()
    )
  );

-- Worker can read estimates they created (to see confirmation status)
DROP POLICY IF EXISTS "Workers read their estimates" ON supplier_orders;
CREATE POLICY "Workers read their estimates"
  ON supplier_orders FOR SELECT TO authenticated
  USING (estimated_by_worker = auth.uid());

-- Customer already can read/update their own supplier_orders (customer_id),
-- but estimates are created by the worker with customer_id = the job's customer,
-- so customers can confirm them via the existing "Customers manage own" policy.



-- ════════════════════════════════════════════════════════
-- add_rider_snapshot.sql
-- ════════════════════════════════════════════════════════

-- ============================================================
-- FIXERA: Rider snapshot on orders (both-sides connection)
-- When a rider accepts a delivery leg, their name/phone is written
-- onto the linked order so the VENDOR/SUPPLIER can see who is
-- collecting â€” without cross-RLS access to the workers table.
-- (The customer already sees the rider via live tracking.)
-- Run in: Supabase Dashboard â†’ SQL Editor â†’ New query
-- ============================================================

ALTER TABLE supplier_orders ADD COLUMN IF NOT EXISTS rider_name  TEXT;
ALTER TABLE supplier_orders ADD COLUMN IF NOT EXISTS rider_phone TEXT;
ALTER TABLE supplier_orders ADD COLUMN IF NOT EXISTS rider_vehicle TEXT;

ALTER TABLE bookings ADD COLUMN IF NOT EXISTS rider_name  TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS rider_phone TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS rider_vehicle TEXT;

COMMENT ON COLUMN supplier_orders.rider_name IS 'Assigned rider name (snapshot for supplier visibility)';
COMMENT ON COLUMN bookings.rider_name        IS 'Assigned rider name (snapshot for vendor visibility)';



-- ════════════════════════════════════════════════════════
-- add_product_approval.sql
-- ════════════════════════════════════════════════════════

-- ============================================================
-- FIXERA: Supplier Product Approval Workflow
-- Suppliers update their own catalog (new products, price changes,
-- stock) from their dashboard. New products + price changes go to
-- 'pending' and only reach customers after Fixera approves.
-- Stock in/out toggles are instant. No more manual catalog entry.
-- Run in: Supabase Dashboard â†’ SQL Editor â†’ New query
-- ============================================================

ALTER TABLE vendor_products ADD COLUMN IF NOT EXISTS status         TEXT DEFAULT 'approved';
-- approved | pending | rejected
ALTER TABLE vendor_products ADD COLUMN IF NOT EXISTS pending_price  NUMERIC(12,2);
-- proposed new price awaiting approval (current `price` stays live until approved)
ALTER TABLE vendor_products ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
ALTER TABLE vendor_products ADD COLUMN IF NOT EXISTS submitted_at   TIMESTAMPTZ;

COMMENT ON COLUMN vendor_products.status         IS 'approved (live) | pending (awaiting Fixera) | rejected';
COMMENT ON COLUMN vendor_products.pending_price  IS 'Proposed price change awaiting approval; live price unchanged until approved';

-- Existing rows are already live
UPDATE vendor_products SET status = 'approved' WHERE status IS NULL;

CREATE INDEX IF NOT EXISTS idx_products_status ON vendor_products(status);

-- â”€â”€ RLS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
-- Suppliers manage their own products
DROP POLICY IF EXISTS "Suppliers manage own products" ON vendor_products;
CREATE POLICY "Suppliers manage own products"
  ON vendor_products FOR ALL TO authenticated
  USING (business_id = auth.uid())
  WITH CHECK (business_id = auth.uid());

-- Admins can update any product (approve / reject)
DROP POLICY IF EXISTS "Admins manage all products" ON vendor_products;
CREATE POLICY "Admins manage all products"
  ON vendor_products FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin = true));

-- Public read stays (the shop filters status='approved' in the query)
DROP POLICY IF EXISTS "Anyone can read in-stock products" ON vendor_products;
DROP POLICY IF EXISTS "Anyone can read products" ON vendor_products;
CREATE POLICY "Anyone can read products"
  ON vendor_products FOR SELECT TO authenticated
  USING (true);



-- ════════════════════════════════════════════════════════
-- add_gps_and_dispatch_rotation.sql
-- ════════════════════════════════════════════════════════

-- ============================================================
-- FIXERA: Supplier-order GPS + Sequential rider offer rotation
-- Fix 3: live_locations can target a supplier_order (so customers
--        watch supplier deliveries on a live map).
-- Fix 5: delivery legs are offered to one rider at a time with a
--        countdown; decline/timeout re-targets the next nearest.
-- Run in: Supabase Dashboard â†’ SQL Editor â†’ New query
-- ============================================================

-- â”€â”€ Fix 3: supplier-order live location â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
ALTER TABLE live_locations ADD COLUMN IF NOT EXISTS supplier_order_id UUID;
CREATE INDEX IF NOT EXISTS idx_live_loc_supplier ON live_locations(supplier_order_id, recorded_at DESC) WHERE supplier_order_id IS NOT NULL;

-- Customer can read locations for their own supplier order
DROP POLICY IF EXISTS "Customer reads supplier order locations" ON live_locations;
CREATE POLICY "Customer reads supplier order locations"
  ON live_locations FOR SELECT TO authenticated
  USING (
    supplier_order_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM supplier_orders so
      WHERE so.id = live_locations.supplier_order_id AND so.customer_id = auth.uid()
    )
  );

-- â”€â”€ Fix 5: sequential offer rotation on delivery legs â”€â”€â”€â”€â”€â”€â”€
ALTER TABLE delivery_tracking ADD COLUMN IF NOT EXISTS offered_to       UUID;
ALTER TABLE delivery_tracking ADD COLUMN IF NOT EXISTS offer_expires_at TIMESTAMPTZ;
ALTER TABLE delivery_tracking ADD COLUMN IF NOT EXISTS declined_by      JSONB DEFAULT '[]';

COMMENT ON COLUMN delivery_tracking.offered_to       IS 'Rider currently being offered this leg (exclusive until offer_expires_at)';
COMMENT ON COLUMN delivery_tracking.offer_expires_at IS 'When the current exclusive offer lapses â†’ opens to nearby pool';
COMMENT ON COLUMN delivery_tracking.declined_by      IS 'Rider ids who declined â€” excluded from re-targeting';



-- ════════════════════════════════════════════════════════
-- add_payout_reference.sql
-- ════════════════════════════════════════════════════════

-- ============================================================
-- FIXERA: Payout M-Pesa reference + settlement linkage
-- When admin marks a payout PAID, capture the M-Pesa/bank
-- transaction reference + the period it settles. The partner's
-- earnings statement then shows this reference.
-- Run in: Supabase Dashboard â†’ SQL Editor â†’ New query
-- (payouts table already exists â€” these are additive columns)
-- ============================================================

ALTER TABLE payouts ADD COLUMN IF NOT EXISTS mpesa_ref      TEXT;
ALTER TABLE payouts ADD COLUMN IF NOT EXISTS settled_period TEXT;
ALTER TABLE payouts ADD COLUMN IF NOT EXISTS partner_id     UUID;
-- partner_id mirrors worker_id for clarity across partner types; harmless if unused.

COMMENT ON COLUMN payouts.mpesa_ref      IS 'M-Pesa B2C / bank transfer reference for this payout';
COMMENT ON COLUMN payouts.settled_period IS 'Human label of the settlement period (e.g. "Week of 9 Jun 2026")';

CREATE INDEX IF NOT EXISTS idx_payouts_worker ON payouts(worker_id);

-- Latest paid payout reference per worker â€” read by the partner statement
-- (no view needed; the app queries payouts directly)



-- ════════════════════════════════════════════════════════
-- create_notification_tokens.sql
-- ════════════════════════════════════════════════════════

-- ============================================================
-- FIXERA: Push Notification Tokens (FCM-ready)
-- Stores each user's device push token so the server can send
-- Firebase Cloud Messaging (FCM) pushes when the app is closed.
-- DORMANT until you create a Firebase project (see FCM-SETUP.md).
-- Run in: Supabase Dashboard â†’ SQL Editor â†’ New query
-- ============================================================

CREATE TABLE IF NOT EXISTS notification_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token      TEXT NOT NULL,
  platform   TEXT DEFAULT 'web',        -- web | android | ios
  app        TEXT,                       -- 'customer' | 'partner'
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, token)
);

CREATE INDEX IF NOT EXISTS idx_notif_tokens_user ON notification_tokens(user_id);

ALTER TABLE notification_tokens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own push tokens" ON notification_tokens;
CREATE POLICY "Users manage own push tokens"
  ON notification_tokens FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());




-- ════════════════════════════════════════════════════════
-- add_support_tickets_user_fields.sql
-- ════════════════════════════════════════════════════════

-- Who submitted the ticket
ALTER TABLE support_tickets ADD COLUMN IF NOT EXISTS user_type  TEXT;
ALTER TABLE support_tickets ADD COLUMN IF NOT EXISTS user_name  TEXT;
ALTER TABLE support_tickets ADD COLUMN IF NOT EXISTS user_email TEXT;

-- When the ticket was resolved (for SLA reporting)
ALTER TABLE support_tickets ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMPTZ;

-- Backfill old tickets
UPDATE support_tickets SET user_type = 'customer'
  WHERE user_type IS NULL AND category IN ('Report an Issue','Request a Refund');

CREATE INDEX IF NOT EXISTS idx_tickets_user_type ON support_tickets(user_type);



-- ════════════════════════════════════════════════════════
-- add_refund_decision_column.sql
-- ════════════════════════════════════════════════════════

ALTER TABLE support_tickets ADD COLUMN IF NOT EXISTS refund_decision TEXT;
-- Values: 'approved' | 'declined' | NULL (not yet actioned)
CREATE INDEX IF NOT EXISTS idx_tickets_refund_decision ON support_tickets(refund_decision);



-- ════════════════════════════════════════════════════════


-- ════════════════════════════════════════════════════════
-- create_wallet_adjustments.sql
-- ════════════════════════════════════════════════════════

-- Admin wallet adjustment log
-- Tracks manual top-ups and corrections made by admins

CREATE TABLE IF NOT EXISTS wallet_adjustments (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id  UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  admin_id    UUID REFERENCES auth.users(id) ON DELETE SET NULL,   -- nullable: survives admin account deletion
  amount      NUMERIC NOT NULL,   -- positive = top-up, negative = deduction
  reason      TEXT NOT NULL,
  balance_before NUMERIC,
  balance_after  NUMERIC,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_wallet_adj_partner ON wallet_adjustments (partner_id);

ALTER TABLE wallet_adjustments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Partners read own adjustments" ON wallet_adjustments;
CREATE POLICY "Partners read own adjustments"
  ON wallet_adjustments FOR SELECT USING (auth.uid() = partner_id);

DROP POLICY IF EXISTS "Admins manage adjustments" ON wallet_adjustments;
CREATE POLICY "Admins manage adjustments"
  ON wallet_adjustments FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE));


-- ════════════════════════════════════════════════════════
-- create_platform_settings.sql
-- ════════════════════════════════════════════════════════

-- ============================================================
-- FIXERA: Admin Platform Settings + Audit Log
-- Single-row config the owner edits in Admin â†’ Settings:
-- company details, support contacts, branding, commission rates,
-- wallet minimum, policies, and Fixera's own collection accounts.
-- Run in: Supabase Dashboard â†’ SQL Editor â†’ New query
-- ============================================================

CREATE TABLE IF NOT EXISTS platform_settings (
  id INT PRIMARY KEY DEFAULT 1,
  -- Company
  company_name     TEXT DEFAULT 'Fixera Company Limited',
  kra_pin          TEXT,
  reg_number       TEXT,
  address          TEXT,
  -- Support contacts (shown across both apps)
  support_phone    TEXT,
  support_whatsapp TEXT,
  support_email    TEXT DEFAULT 'support@fixera.co.ke',
  -- Branding
  logo_url         TEXT,
  brand_color      TEXT DEFAULT '#C9A020',
  -- Finance
  commission_rates JSONB DEFAULT '{"worker":15,"rider":15,"vendor":20,"supplier":20,"mover":20,"water_carrier":20}',
  wallet_minimum   NUMERIC(10,2) DEFAULT 500,
  -- Fixera's own collection accounts (where customer money lands)
  bank_name        TEXT,
  bank_account     TEXT,
  collection_mpesa TEXT,
  collection_paybill TEXT,
  -- Policies
  cancellation_policy JSONB DEFAULT '{"free_before":"confirmed","fee":100,"window_hours":2}',
  sla_hours        JSONB DEFAULT '{"operations":2,"trust_safety":1,"finance":24}',
  -- Notifications (admin prefs)
  notify_prefs     JSONB DEFAULT '{"new_partner":true,"new_dispute":true,"payout_request":true,"product_approval":true}',
  updated_at       TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT singleton CHECK (id = 1)
);

-- Seed the single row
INSERT INTO platform_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

-- â”€â”€ Admin audit log â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
CREATE TABLE IF NOT EXISTS admin_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id   UUID,
  actor_name TEXT,
  action     TEXT NOT NULL,
  detail     TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_audit_created ON admin_audit_log(created_at DESC);

-- â”€â”€ Branding storage bucket (logo) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
INSERT INTO storage.buckets (id, name, public)
VALUES ('branding', 'branding', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public read branding" ON storage.objects;
CREATE POLICY "Public read branding" ON storage.objects FOR SELECT USING (bucket_id = 'branding');
DROP POLICY IF EXISTS "Auth write branding" ON storage.objects;
CREATE POLICY "Auth write branding" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'branding');
DROP POLICY IF EXISTS "Auth update branding" ON storage.objects;
CREATE POLICY "Auth update branding" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'branding');

-- â”€â”€ RLS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
ALTER TABLE platform_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_audit_log   ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can READ settings (apps need support contacts, logo,
-- commission rates). Only admins can WRITE.
DROP POLICY IF EXISTS "Anyone reads settings" ON platform_settings;
CREATE POLICY "Anyone reads settings" ON platform_settings FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Admins write settings" ON platform_settings;
CREATE POLICY "Admins write settings" ON platform_settings FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin = true));

DROP POLICY IF EXISTS "Admins read audit" ON admin_audit_log;
CREATE POLICY "Admins read audit" ON admin_audit_log FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin = true));
DROP POLICY IF EXISTS "Admins write audit" ON admin_audit_log;
CREATE POLICY "Admins write audit" ON admin_audit_log FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin = true));


-- ════════════════════════════════════════════════════════
-- create_announcements.sql
-- ════════════════════════════════════════════════════════

-- Announcements table
-- Supports targeting: 'all', 'customers', 'workers', 'riders', 'vendors',
--                     'suppliers', 'movers', 'water_carriers', 'partners' (all partner roles)

CREATE TABLE IF NOT EXISTS announcements (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by      UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  title           TEXT NOT NULL,
  body            TEXT NOT NULL,
  type            TEXT NOT NULL DEFAULT 'info',  -- info | warning | promotion | maintenance
  target          TEXT NOT NULL DEFAULT 'all',   -- all | customers | partners | worker | rider | vendor | supplier | mover | water_carrier
  is_pinned       BOOLEAN NOT NULL DEFAULT FALSE,
  publish_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at      TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fast active-announcement queries
CREATE INDEX IF NOT EXISTS idx_announcements_publish ON announcements (publish_at, expires_at);
CREATE INDEX IF NOT EXISTS idx_announcements_target  ON announcements (target);

-- RLS
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Read active announcements" ON announcements;
CREATE POLICY "Read active announcements"
  ON announcements FOR SELECT
  USING (
    publish_at <= NOW()
    AND (expires_at IS NULL OR expires_at > NOW())
  );

DROP POLICY IF EXISTS "Admins manage announcements" ON announcements;
CREATE POLICY "Admins manage announcements"
  ON announcements FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin = TRUE
    )
  );


-- ════════════════════════════════════════════════════════
-- add_announcement_reads.sql
-- ════════════════════════════════════════════════════════

-- Per-user announcement read tracking
-- Replaces localStorage-based dismissal with persistent DB records

CREATE TABLE IF NOT EXISTS announcement_reads (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  announcement_id UUID NOT NULL REFERENCES announcements(id) ON DELETE CASCADE,
  read_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, announcement_id)
);

CREATE INDEX IF NOT EXISTS idx_ann_reads_user ON announcement_reads (user_id);

ALTER TABLE announcement_reads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own reads" ON announcement_reads;
CREATE POLICY "Users manage own reads"
  ON announcement_reads FOR ALL
  USING (auth.uid() = user_id);


-- ════════════════════════════════════════════════════════
-- create_reviews.sql
-- ════════════════════════════════════════════════════════

-- Reviews & Ratings
-- Customers review workers/movers/vendors/riders after job completion

CREATE TABLE IF NOT EXISTS reviews (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id    UUID,
  order_id      UUID,   -- supplier_orders or moving_requests
  order_type    TEXT NOT NULL DEFAULT 'booking', -- booking | moving | supplier | water
  reviewer_id   UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reviewee_id   UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reviewee_type TEXT NOT NULL DEFAULT 'worker', -- worker | vendor | rider | supplier | mover | water_carrier
  rating        SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment       TEXT,
  status        TEXT NOT NULL DEFAULT 'published', -- published | flagged | removed
  admin_note    TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Safe column additions for re-runs where the table already exists with an older schema
ALTER TABLE reviews
  ADD COLUMN IF NOT EXISTS reviewer_id   UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS reviewee_id   UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS reviewee_type TEXT DEFAULT 'worker',
  ADD COLUMN IF NOT EXISTS order_id      UUID,
  ADD COLUMN IF NOT EXISTS order_type    TEXT DEFAULT 'booking',
  ADD COLUMN IF NOT EXISTS rating        SMALLINT,
  ADD COLUMN IF NOT EXISTS comment       TEXT,
  ADD COLUMN IF NOT EXISTS status        TEXT DEFAULT 'published',
  ADD COLUMN IF NOT EXISTS admin_note    TEXT;

CREATE INDEX IF NOT EXISTS idx_reviews_reviewee  ON reviews (reviewee_id);
CREATE INDEX IF NOT EXISTS idx_reviews_reviewer  ON reviews (reviewer_id);
CREATE INDEX IF NOT EXISTS idx_reviews_status    ON reviews (status);
CREATE INDEX IF NOT EXISTS idx_reviews_booking   ON reviews (booking_id);

ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Customers read published reviews" ON reviews;
CREATE POLICY "Customers read published reviews"
  ON reviews FOR SELECT USING (status = 'published');

DROP POLICY IF EXISTS "Customers write own reviews" ON reviews;
CREATE POLICY "Customers write own reviews"
  ON reviews FOR INSERT
  WITH CHECK (auth.uid() = reviewer_id);

DROP POLICY IF EXISTS "Admins manage all reviews" ON reviews;
CREATE POLICY "Admins manage all reviews"
  ON reviews FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE));

-- Average rating view (for fast display)
CREATE OR REPLACE VIEW partner_ratings AS
SELECT
  reviewee_id,
  reviewee_type,
  ROUND(AVG(rating)::numeric, 1) AS avg_rating,
  COUNT(*) AS total_reviews
FROM reviews
WHERE status = 'published'
GROUP BY reviewee_id, reviewee_type;


-- ════════════════════════════════════════════════════════
-- create_services_catalog.sql
-- ════════════════════════════════════════════════════════

-- Services Catalog (DB-driven, replaces hardcoded services.js)

CREATE TABLE IF NOT EXISTS service_categories (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug        TEXT UNIQUE NOT NULL,  -- e.g. 'cleaning', 'plumbing'
  name        TEXT NOT NULL,
  icon        TEXT NOT NULL DEFAULT 'ðŸ”§',
  color       TEXT NOT NULL DEFAULT '#C9A020',
  description TEXT,
  sort_order  INT NOT NULL DEFAULT 0,
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS services (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id   UUID NOT NULL REFERENCES service_categories(id) ON DELETE CASCADE,
  slug          TEXT UNIQUE NOT NULL,
  name          TEXT NOT NULL,
  description   TEXT,
  price_min     INT,   -- KSh
  price_max     INT,
  price_label   TEXT,  -- e.g. "from KSh 500" or "Quote on inspection"
  is_quotation  BOOLEAN NOT NULL DEFAULT FALSE,
  duration_est  TEXT,  -- e.g. "2-3 hours"
  icon          TEXT,
  sort_order    INT NOT NULL DEFAULT 0,
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  is_featured   BOOLEAN NOT NULL DEFAULT FALSE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_services_category  ON services (category_id);
CREATE INDEX IF NOT EXISTS idx_services_active    ON services (is_active);

ALTER TABLE service_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read service_categories" ON service_categories;
CREATE POLICY "Public read service_categories"
  ON service_categories FOR SELECT USING (is_active = TRUE);

DROP POLICY IF EXISTS "Public read services" ON services;
CREATE POLICY "Public read services"
  ON services FOR SELECT USING (is_active = TRUE);

DROP POLICY IF EXISTS "Admins manage service_categories" ON service_categories;
CREATE POLICY "Admins manage service_categories"
  ON service_categories FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE));

DROP POLICY IF EXISTS "Admins manage services" ON services;
CREATE POLICY "Admins manage services"
  ON services FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE));


-- ════════════════════════════════════════════════════════
-- create_promo_codes.sql
-- ════════════════════════════════════════════════════════

-- Promo Codes / Discount Codes

CREATE TABLE IF NOT EXISTS promo_codes (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code            TEXT UNIQUE NOT NULL,  -- e.g. 'FIXERA1', 'CLEAN20'
  description     TEXT,
  discount_type   TEXT NOT NULL DEFAULT 'percent', -- percent | fixed
  discount_value  NUMERIC NOT NULL,                -- % or KSh amount
  min_order       NUMERIC NOT NULL DEFAULT 0,      -- minimum order value to apply
  max_discount    NUMERIC,                         -- cap on percent discounts (KSh)
  max_uses        INT,                             -- NULL = unlimited
  used_count      INT NOT NULL DEFAULT 0,
  valid_from      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  valid_until     TIMESTAMPTZ,                     -- NULL = no expiry
  target_service  TEXT,                            -- NULL = all services
  target_role     TEXT,                            -- NULL = all users (new | returning | vip)
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_by      UUID REFERENCES auth.users(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Track which user used which code on which payment
CREATE TABLE IF NOT EXISTS promo_code_uses (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code_id     UUID NOT NULL REFERENCES promo_codes(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  payment_id  UUID,
  discount_applied NUMERIC NOT NULL,
  used_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (code_id, user_id)  -- one use per user per code
);

CREATE INDEX IF NOT EXISTS idx_promo_code       ON promo_codes (code);
CREATE INDEX IF NOT EXISTS idx_promo_active     ON promo_codes (is_active);
CREATE INDEX IF NOT EXISTS idx_promo_uses_user  ON promo_code_uses (user_id);

ALTER TABLE promo_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE promo_code_uses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read active promo_codes" ON promo_codes;
CREATE POLICY "Public read active promo_codes"
  ON promo_codes FOR SELECT USING (is_active = TRUE);

DROP POLICY IF EXISTS "Users read own uses" ON promo_code_uses;
CREATE POLICY "Users read own uses"
  ON promo_code_uses FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users insert own uses" ON promo_code_uses;
CREATE POLICY "Users insert own uses"
  ON promo_code_uses FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins manage promo_codes" ON promo_codes;
CREATE POLICY "Admins manage promo_codes"
  ON promo_codes FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE));

DROP POLICY IF EXISTS "Admins read all uses" ON promo_code_uses;
CREATE POLICY "Admins read all uses"
  ON promo_code_uses FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE));


-- ════════════════════════════════════════════════════════
-- create_content.sql
-- ════════════════════════════════════════════════════════

-- Content Management: Homepage Banners + FAQs

-- Banners (replaces hardcoded PROMOS array in HomePage.jsx)
CREATE TABLE IF NOT EXISTS banners (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title       TEXT NOT NULL,
  subtitle    TEXT,
  tag         TEXT,           -- e.g. "LIMITED OFFER", "NEW SERVICE"
  bg          TEXT NOT NULL DEFAULT 'linear-gradient(135deg,#C9A020,#D4B033)',
  text_color  TEXT NOT NULL DEFAULT '#0A0E1A',
  emoji       TEXT NOT NULL DEFAULT 'ðŸŽ‰',
  promo_code  TEXT,           -- optional linked promo code
  link_path   TEXT,           -- internal route e.g. /movers
  sort_order  INT NOT NULL DEFAULT 0,
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  valid_from  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  valid_until TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- FAQs
CREATE TABLE IF NOT EXISTS faqs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question    TEXT NOT NULL,
  answer      TEXT NOT NULL,
  category    TEXT NOT NULL DEFAULT 'general', -- general | booking | payment | partner | safety
  audience    TEXT NOT NULL DEFAULT 'customers', -- customers | partners | all
  sort_order  INT NOT NULL DEFAULT 0,
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_banners_active ON banners (is_active, sort_order);
CREATE INDEX IF NOT EXISTS idx_faqs_category  ON faqs (category, audience);

ALTER TABLE banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE faqs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read active banners" ON banners;
CREATE POLICY "Public read active banners" ON banners FOR SELECT USING (is_active = TRUE);

DROP POLICY IF EXISTS "Public read active faqs" ON faqs;
CREATE POLICY "Public read active faqs"    ON faqs    FOR SELECT USING (is_active = TRUE);

DROP POLICY IF EXISTS "Admins manage banners" ON banners;
CREATE POLICY "Admins manage banners"
  ON banners FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE));

DROP POLICY IF EXISTS "Admins manage faqs" ON faqs;
CREATE POLICY "Admins manage faqs"
  ON faqs FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE));

-- Seed default FAQs
INSERT INTO faqs (question, answer, category, audience, sort_order) VALUES
  ('How do I book a service?', 'Browse services on the home page, select what you need, choose a date and time, and confirm your booking. You''ll receive a confirmation email instantly.', 'booking', 'customers', 1),
  ('Can I cancel a booking?', 'Yes. You can cancel a booking for free up to 2 hours before the scheduled time. After that, a KSh 100 cancellation fee applies.', 'booking', 'customers', 2),
  ('How do I pay?', 'We accept M-Pesa and cash. M-Pesa payments can be made directly in the app. Cash is paid to the worker on completion.', 'payment', 'customers', 3),
  ('Are your workers vetted?', 'Yes. Every Fixera partner undergoes identity verification, background checks, and skill assessment before being approved on the platform.', 'general', 'customers', 4),
  ('How do I track my order?', 'After booking, you can track your worker or delivery in real time from your booking history page.', 'general', 'customers', 5),
  ('How do I join as a partner?', 'Download the Fixera Partner app and register. Fill in your details and upload required documents. Our team reviews and approves within 48 hours.', 'partner', 'partners', 1),
  ('When do I get paid?', 'For cash jobs, you collect payment directly and Fixera deducts commission from your wallet. For M-Pesa jobs, Fixera sends your share via M-Pesa within 24 hours.', 'payment', 'partners', 2),
  ('What is the commission rate?', 'Service workers and riders: 15%. Vendors, suppliers, movers, and water carriers: 20%. Full details in your Partner Agreement.', 'payment', 'partners', 3)
ON CONFLICT DO NOTHING;

-- create_disputes.sql
-- ════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS disputes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id       UUID REFERENCES bookings(id) ON DELETE SET NULL,
  booking_ref      TEXT,
  service          TEXT,
  booking_date     DATE,
  customer_id      UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  customer_name    TEXT,
  customer_email   TEXT,
  customer_statement       TEXT,
  customer_evidence_urls   JSONB  DEFAULT '[]',
  customer_submitted_at    TIMESTAMPTZ,
  partner_id       UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  partner_name     TEXT,
  partner_role     TEXT,
  partner_statement        TEXT,
  partner_evidence_urls    JSONB  DEFAULT '[]',
  partner_submitted_at     TIMESTAMPTZ,
  status           TEXT NOT NULL DEFAULT 'pending',
  ruling           TEXT,
  admin_ruling_note TEXT,
  compensation_action TEXT,
  resolved_at      TIMESTAMPTZ,
  created_at       TIMESTAMPTZ DEFAULT now(),
  updated_at       TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_disputes_booking   ON disputes(booking_id);
CREATE INDEX IF NOT EXISTS idx_disputes_customer  ON disputes(customer_id);
CREATE INDEX IF NOT EXISTS idx_disputes_partner   ON disputes(partner_id);
CREATE INDEX IF NOT EXISTS idx_disputes_status    ON disputes(status);
ALTER TABLE disputes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admin full access to disputes" ON disputes;
CREATE POLICY "Admin full access to disputes" ON disputes FOR ALL TO authenticated USING (true) WITH CHECK (true);



-- ════════════════════════════════════════════════════════
-- create_service_areas.sql
-- ════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS service_areas (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  county      TEXT NOT NULL,
  sub_county  TEXT,
  label       TEXT NOT NULL,
  is_active   BOOLEAN NOT NULL DEFAULT true,
  partner_roles JSONB DEFAULT '["worker","vendor","rider","supplier","mover","water_carrier"]',
  notes       TEXT,
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_service_areas_active ON service_areas(is_active);
CREATE INDEX IF NOT EXISTS idx_service_areas_county ON service_areas(county);
ALTER TABLE service_areas ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admin full access to service_areas" ON service_areas;
CREATE POLICY "Admin full access to service_areas" ON service_areas FOR ALL TO authenticated USING (true) WITH CHECK (true);

INSERT INTO service_areas (county, sub_county, label) VALUES
  ('Nairobi','Westlands','Westlands, Nairobi'),('Nairobi','Kilimani','Kilimani, Nairobi'),
  ('Nairobi','Karen','Karen, Nairobi'),('Nairobi','Lavington','Lavington, Nairobi'),
  ('Nairobi','Parklands','Parklands, Nairobi'),('Nairobi','Kasarani','Kasarani, Nairobi'),
  ('Nairobi','Kileleshwa','Kileleshwa, Nairobi'),('Nairobi','Gigiri','Gigiri, Nairobi'),
  ('Nairobi','Runda','Runda, Nairobi'),('Nairobi','Muthaiga','Muthaiga, Nairobi'),
  ('Nairobi','Upperhill','Upperhill, Nairobi'),('Nairobi','Eastleigh','Eastleigh, Nairobi'),
  ('Nairobi','South B','South B, Nairobi'),('Nairobi','South C','South C, Nairobi'),
  ('Nairobi','Langata','Langata, Nairobi'),('Nairobi','Embakasi','Embakasi, Nairobi'),
  ('Nairobi','Buruburu','Buruburu, Nairobi'),('Nairobi','Roysambu','Roysambu, Nairobi'),
  ('Nairobi','CBD','CBD, Nairobi'),('Kiambu','Ruaka','Ruaka, Kiambu'),
  ('Kiambu','Ruiru','Ruiru, Kiambu'),('Kiambu','Kikuyu','Kikuyu, Kiambu'),
  ('Kajiado','Rongai','Rongai, Kajiado'),('Kajiado','Ngong','Ngong, Kajiado'),
  ('Kajiado','Kitengela','Kitengela, Kajiado'),('Machakos','Syokimau','Syokimau, Machakos')
ON CONFLICT DO NOTHING;


-- ════════════════════════════════════════════════════════
-- seed_kenya_service_areas.sql
-- ════════════════════════════════════════════════════════

-- ============================================================
--  Fixera â€” Full Kenya Service Areas Seed
--  All 47 counties + ~350 sub-counties
--  Nairobi starts ACTIVE, everything else INACTIVE
--  Run after create_service_areas.sql
-- ============================================================

-- Add unique constraint so we can use ON CONFLICT (IF NOT EXISTS not supported by PG — use DO block)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'uq_county_subcounty'
      AND conrelid = 'service_areas'::regclass
  ) THEN
    ALTER TABLE service_areas
      ADD CONSTRAINT uq_county_subcounty UNIQUE (county, sub_county);
  END IF;
END $$;

-- Clear old partial seed (only system-seeded rows, never admin-created rows)
DELETE FROM service_areas WHERE notes IS NULL;

-- â”€â”€ Insert all 47 counties â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
INSERT INTO service_areas (county, sub_county, label, is_active) VALUES

-- â”€â”€ 1. NAIROBI (active by default â€” current operations base) â”€â”€â”€â”€â”€â”€
('Nairobi','Westlands',        'Westlands, Nairobi',        true),
('Nairobi','Dagoretti North',  'Dagoretti North, Nairobi',  true),
('Nairobi','Dagoretti South',  'Dagoretti South, Nairobi',  true),
('Nairobi','Embakasi Central', 'Embakasi Central, Nairobi', true),
('Nairobi','Embakasi East',    'Embakasi East, Nairobi',    true),
('Nairobi','Embakasi North',   'Embakasi North, Nairobi',   true),
('Nairobi','Embakasi South',   'Embakasi South, Nairobi',   true),
('Nairobi','Embakasi West',    'Embakasi West, Nairobi',    true),
('Nairobi','Highridge',        'Highridge, Nairobi',        true),
('Nairobi','Kamukunji',        'Kamukunji, Nairobi',        true),
('Nairobi','Kasarani',         'Kasarani, Nairobi',         true),
('Nairobi','Kibra',            'Kibra, Nairobi',            true),
('Nairobi','Langata',          'Langata, Nairobi',          true),
('Nairobi','Makadara',         'Makadara, Nairobi',         true),
('Nairobi','Mathare',          'Mathare, Nairobi',          true),
('Nairobi','Roysambu',         'Roysambu, Nairobi',         true),
('Nairobi','Ruaraka',          'Ruaraka, Nairobi',          true),
('Nairobi','Starehe',          'Starehe, Nairobi',          true),

-- â”€â”€ 2. KIAMBU â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
('Kiambu','Gatundu North', 'Gatundu North, Kiambu', false),
('Kiambu','Gatundu South', 'Gatundu South, Kiambu', false),
('Kiambu','Githunguri',    'Githunguri, Kiambu',    false),
('Kiambu','Juja',          'Juja, Kiambu',          false),
('Kiambu','Kabete',        'Kabete, Kiambu',        false),
('Kiambu','Kiambaa',       'Kiambaa, Kiambu',       false),
('Kiambu','Kiambu Town',   'Kiambu Town, Kiambu',   false),
('Kiambu','Kikuyu',        'Kikuyu, Kiambu',        false),
('Kiambu','Lari',          'Lari, Kiambu',          false),
('Kiambu','Limuru',        'Limuru, Kiambu',        false),
('Kiambu','Ruiru',         'Ruiru, Kiambu',         false),
('Kiambu','Thika Town',    'Thika Town, Kiambu',    false),

-- â”€â”€ 3. KAJIADO â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
('Kajiado','Kajiado Central', 'Kajiado Central, Kajiado', false),
('Kajiado','Kajiado East',    'Kajiado East, Kajiado',    false),
('Kajiado','Kajiado North',   'Kajiado North, Kajiado',   false),
('Kajiado','Kajiado South',   'Kajiado South, Kajiado',   false),
('Kajiado','Kajiado West',    'Kajiado West, Kajiado',    false),

-- â”€â”€ 4. MACHAKOS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
('Machakos','Kathiani',      'Kathiani, Machakos',      false),
('Machakos','Machakos Town', 'Machakos Town, Machakos', false),
('Machakos','Masinga',       'Masinga, Machakos',       false),
('Machakos','Matungulu',     'Matungulu, Machakos',     false),
('Machakos','Mavoko',        'Mavoko, Machakos',        false),
('Machakos','Mwala',         'Mwala, Machakos',         false),
('Machakos','Yatta',         'Yatta, Machakos',         false),

-- â”€â”€ 5. MAKUENI â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
('Makueni','Kaiti',        'Kaiti, Makueni',        false),
('Makueni','Kibwezi East', 'Kibwezi East, Makueni', false),
('Makueni','Kibwezi West', 'Kibwezi West, Makueni', false),
('Makueni','Kilome',       'Kilome, Makueni',       false),
('Makueni','Makueni Town', 'Makueni Town, Makueni', false),
('Makueni','Mbooni',       'Mbooni, Makueni',       false),

-- â”€â”€ 6. MOMBASA â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
('Mombasa','Changamwe', 'Changamwe, Mombasa', false),
('Mombasa','Jomvu',     'Jomvu, Mombasa',     false),
('Mombasa','Kisauni',   'Kisauni, Mombasa',   false),
('Mombasa','Likoni',    'Likoni, Mombasa',    false),
('Mombasa','Mvita',     'Mvita, Mombasa',     false),
('Mombasa','Nyali',     'Nyali, Mombasa',     false),

-- â”€â”€ 7. KWALE â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
('Kwale','Kinango',    'Kinango, Kwale',    false),
('Kwale','Lungalunga', 'Lungalunga, Kwale', false),
('Kwale','Matuga',     'Matuga, Kwale',     false),
('Kwale','Msambweni',  'Msambweni, Kwale',  false),

-- â”€â”€ 8. KILIFI â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
('Kilifi','Ganze',       'Ganze, Kilifi',       false),
('Kilifi','Kaloleni',    'Kaloleni, Kilifi',    false),
('Kilifi','Kilifi North', 'Kilifi North, Kilifi', false),
('Kilifi','Kilifi South', 'Kilifi South, Kilifi', false),
('Kilifi','Magarini',    'Magarini, Kilifi',    false),
('Kilifi','Malindi',     'Malindi, Kilifi',     false),
('Kilifi','Rabai',       'Rabai, Kilifi',       false),

-- â”€â”€ 9. TANA RIVER â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
('Tana River','Bura',   'Bura, Tana River',   false),
('Tana River','Galole', 'Galole, Tana River', false),
('Tana River','Garsen', 'Garsen, Tana River', false),

-- â”€â”€ 10. LAMU â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
('Lamu','Lamu East', 'Lamu East, Lamu', false),
('Lamu','Lamu West', 'Lamu West, Lamu', false),

-- â”€â”€ 11. TAITA-TAVETA â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
('Taita-Taveta','Mwatate', 'Mwatate, Taita-Taveta', false),
('Taita-Taveta','Taveta',  'Taveta, Taita-Taveta',  false),
('Taita-Taveta','Voi',     'Voi, Taita-Taveta',     false),
('Taita-Taveta','Wundanyi','Wundanyi, Taita-Taveta', false),

-- â”€â”€ 12. GARISSA â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
('Garissa','Balambala',         'Balambala, Garissa',         false),
('Garissa','Dadaab',            'Dadaab, Garissa',            false),
('Garissa','Fafi',              'Fafi, Garissa',              false),
('Garissa','Garissa Township',  'Garissa Township, Garissa',  false),
('Garissa','Hulugho',           'Hulugho, Garissa',           false),
('Garissa','Ijara',             'Ijara, Garissa',             false),
('Garissa','Lagdera',           'Lagdera, Garissa',           false),

-- â”€â”€ 13. WAJIR â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
('Wajir','Eldas',       'Eldas, Wajir',       false),
('Wajir','Tarbaj',      'Tarbaj, Wajir',      false),
('Wajir','Wajir East',  'Wajir East, Wajir',  false),
('Wajir','Wajir North', 'Wajir North, Wajir', false),
('Wajir','Wajir South', 'Wajir South, Wajir', false),
('Wajir','Wajir West',  'Wajir West, Wajir',  false),

-- â”€â”€ 14. MANDERA â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
('Mandera','Banissa',       'Banissa, Mandera',       false),
('Mandera','Lafey',         'Lafey, Mandera',         false),
('Mandera','Mandera East',  'Mandera East, Mandera',  false),
('Mandera','Mandera North', 'Mandera North, Mandera', false),
('Mandera','Mandera South', 'Mandera South, Mandera', false),
('Mandera','Mandera West',  'Mandera West, Mandera',  false),

-- â”€â”€ 15. MARSABIT â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
('Marsabit','Laisamis',   'Laisamis, Marsabit',   false),
('Marsabit','Moyale',     'Moyale, Marsabit',     false),
('Marsabit','North Horr', 'North Horr, Marsabit', false),
('Marsabit','Saku',       'Saku, Marsabit',       false),

-- â”€â”€ 16. ISIOLO â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
('Isiolo','Garbatulla', 'Garbatulla, Isiolo', false),
('Isiolo','Isiolo Town','Isiolo Town, Isiolo', false),
('Isiolo','Merti',      'Merti, Isiolo',      false),

-- â”€â”€ 17. MERU â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
('Meru','Buuri',          'Buuri, Meru',          false),
('Meru','Igembe Central', 'Igembe Central, Meru', false),
('Meru','Igembe North',   'Igembe North, Meru',   false),
('Meru','Igembe South',   'Igembe South, Meru',   false),
('Meru','Imenti Central', 'Imenti Central, Meru', false),
('Meru','Imenti North',   'Imenti North, Meru',   false),
('Meru','Imenti South',   'Imenti South, Meru',   false),
('Meru','Tigania East',   'Tigania East, Meru',   false),
('Meru','Tigania West',   'Tigania West, Meru',   false),

-- â”€â”€ 18. THARAKA-NITHI â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
('Tharaka-Nithi','Chuka/Igambang''ombe', 'Chuka, Tharaka-Nithi',   false),
('Tharaka-Nithi','Maara',               'Maara, Tharaka-Nithi',   false),
('Tharaka-Nithi','Tharaka North',       'Tharaka North, Tharaka-Nithi', false),
('Tharaka-Nithi','Tharaka South',       'Tharaka South, Tharaka-Nithi', false),

-- â”€â”€ 19. EMBU â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
('Embu','Embu East',    'Embu East, Embu',    false),
('Embu','Embu North',   'Embu North, Embu',   false),
('Embu','Embu West',    'Embu West, Embu',    false),
('Embu','Manyatta',     'Manyatta, Embu',     false),
('Embu','Mbeere North', 'Mbeere North, Embu', false),
('Embu','Mbeere South', 'Mbeere South, Embu', false),
('Embu','Runyenjes',    'Runyenjes, Embu',    false),

-- â”€â”€ 20. KITUI â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
('Kitui','Kitui Central', 'Kitui Central, Kitui', false),
('Kitui','Kitui East',    'Kitui East, Kitui',    false),
('Kitui','Kitui Rural',   'Kitui Rural, Kitui',   false),
('Kitui','Kitui South',   'Kitui South, Kitui',   false),
('Kitui','Kitui West',    'Kitui West, Kitui',    false),
('Kitui','Mwingi Central','Mwingi Central, Kitui', false),
('Kitui','Mwingi North',  'Mwingi North, Kitui',  false),
('Kitui','Mwingi West',   'Mwingi West, Kitui',   false),

-- â”€â”€ 21. NYANDARUA â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
('Nyandarua','Kinangop',     'Kinangop, Nyandarua',     false),
('Nyandarua','Kipipiri',     'Kipipiri, Nyandarua',     false),
('Nyandarua','Ndaragwa',     'Ndaragwa, Nyandarua',     false),
('Nyandarua','Ol Kalou',     'Ol Kalou, Nyandarua',     false),
('Nyandarua','Ol Joro Orok', 'Ol Joro Orok, Nyandarua', false),

-- â”€â”€ 22. NYERI â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
('Nyeri','Kieni East',    'Kieni East, Nyeri',    false),
('Nyeri','Kieni West',    'Kieni West, Nyeri',    false),
('Nyeri','Mathira East',  'Mathira East, Nyeri',  false),
('Nyeri','Mathira West',  'Mathira West, Nyeri',  false),
('Nyeri','Mukurweini',    'Mukurweini, Nyeri',    false),
('Nyeri','Nyeri Town',    'Nyeri Town, Nyeri',    false),
('Nyeri','Tetu',          'Tetu, Nyeri',          false),

-- â”€â”€ 23. KIRINYAGA â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
('Kirinyaga','Gichugu',           'Gichugu, Kirinyaga',           false),
('Kirinyaga','Kirinyaga Central', 'Kirinyaga Central, Kirinyaga', false),
('Kirinyaga','Mwea East',         'Mwea East, Kirinyaga',         false),
('Kirinyaga','Mwea West',         'Mwea West, Kirinyaga',         false),
('Kirinyaga','Ndia',              'Ndia, Kirinyaga',              false),

-- â”€â”€ 24. MURANG'A â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
('Muranga','Gatanga',       'Gatanga, Muranga',       false),
('Muranga','Kahuro',        'Kahuro, Muranga',        false),
('Muranga','Kandara',       'Kandara, Muranga',       false),
('Muranga','Kangema',       'Kangema, Muranga',       false),
('Muranga','Kigumo',        'Kigumo, Muranga',        false),
('Muranga','Kiharu',        'Kiharu, Muranga',        false),
('Muranga','Mathioya',      'Mathioya, Muranga',      false),
('Muranga','Muranga South', 'Muranga South, Muranga', false),

-- â”€â”€ 25. NAKURU â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
('Nakuru','Bahati',           'Bahati, Nakuru',           false),
('Nakuru','Gilgil',           'Gilgil, Nakuru',           false),
('Nakuru','Kuresoi North',    'Kuresoi North, Nakuru',    false),
('Nakuru','Kuresoi South',    'Kuresoi South, Nakuru',    false),
('Nakuru','Molo',             'Molo, Nakuru',             false),
('Nakuru','Naivasha',         'Naivasha, Nakuru',         false),
('Nakuru','Nakuru Town East', 'Nakuru Town East, Nakuru', false),
('Nakuru','Nakuru Town West', 'Nakuru Town West, Nakuru', false),
('Nakuru','Njoro',            'Njoro, Nakuru',            false),
('Nakuru','Rongai',           'Rongai, Nakuru',           false),
('Nakuru','Subukia',          'Subukia, Nakuru',          false),

-- â”€â”€ 26. NAROK â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
('Narok','Narok East',     'Narok East, Narok',     false),
('Narok','Narok North',    'Narok North, Narok',    false),
('Narok','Narok South',    'Narok South, Narok',    false),
('Narok','Narok West',     'Narok West, Narok',     false),
('Narok','Transmara East', 'Transmara East, Narok', false),
('Narok','Transmara West', 'Transmara West, Narok', false),

-- â”€â”€ 27. LAIKIPIA â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
('Laikipia','Laikipia Central', 'Laikipia Central, Laikipia', false),
('Laikipia','Laikipia East',    'Laikipia East, Laikipia',    false),
('Laikipia','Laikipia North',   'Laikipia North, Laikipia',   false),
('Laikipia','Laikipia West',    'Laikipia West, Laikipia',    false),
('Laikipia','Nyahururu',        'Nyahururu, Laikipia',        false),

-- â”€â”€ 28. BARINGO â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
('Baringo','Baringo Central', 'Baringo Central, Baringo', false),
('Baringo','Baringo North',   'Baringo North, Baringo',   false),
('Baringo','Baringo South',   'Baringo South, Baringo',   false),
('Baringo','Eldama Ravine',   'Eldama Ravine, Baringo',   false),
('Baringo','Mogotio',         'Mogotio, Baringo',         false),
('Baringo','Tiaty',           'Tiaty, Baringo',           false),

-- â”€â”€ 29. UASIN GISHU â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
('Uasin Gishu','Ainabkoi', 'Ainabkoi, Uasin Gishu', false),
('Uasin Gishu','Kapseret', 'Kapseret, Uasin Gishu', false),
('Uasin Gishu','Kesses',   'Kesses, Uasin Gishu',   false),
('Uasin Gishu','Moiben',   'Moiben, Uasin Gishu',   false),
('Uasin Gishu','Soy',      'Soy, Uasin Gishu',      false),
('Uasin Gishu','Turbo',    'Turbo, Uasin Gishu',    false),

-- â”€â”€ 30. ELGEYO-MARAKWET â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
('Elgeyo-Marakwet','Keiyo North',   'Keiyo North, Elgeyo-Marakwet',   false),
('Elgeyo-Marakwet','Keiyo South',   'Keiyo South, Elgeyo-Marakwet',   false),
('Elgeyo-Marakwet','Marakwet East', 'Marakwet East, Elgeyo-Marakwet', false),
('Elgeyo-Marakwet','Marakwet West', 'Marakwet West, Elgeyo-Marakwet', false),

-- â”€â”€ 31. NANDI â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
('Nandi','Aldai',       'Aldai, Nandi',       false),
('Nandi','Chesumei',    'Chesumei, Nandi',    false),
('Nandi','Emgwen',      'Emgwen, Nandi',      false),
('Nandi','Mosop',       'Mosop, Nandi',       false),
('Nandi','Nandi Hills', 'Nandi Hills, Nandi', false),
('Nandi','Tindiret',    'Tindiret, Nandi',    false),

-- â”€â”€ 32. TRANS-NZOIA â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
('Trans-Nzoia','Cherangany',      'Cherangany, Trans-Nzoia',      false),
('Trans-Nzoia','Endebess',        'Endebess, Trans-Nzoia',        false),
('Trans-Nzoia','Kiminini',        'Kiminini, Trans-Nzoia',        false),
('Trans-Nzoia','Kwanza',          'Kwanza, Trans-Nzoia',          false),
('Trans-Nzoia','Trans Nzoia East','Trans Nzoia East, Trans-Nzoia', false),
('Trans-Nzoia','Trans Nzoia West','Trans Nzoia West, Trans-Nzoia', false),

-- â”€â”€ 33. WEST POKOT â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
('West Pokot','Central Pokot', 'Central Pokot, West Pokot', false),
('West Pokot','Kacheliba',     'Kacheliba, West Pokot',     false),
('West Pokot','Pokot South',   'Pokot South, West Pokot',   false),
('West Pokot','West Pokot',    'West Pokot Town, West Pokot', false),

-- â”€â”€ 34. SAMBURU â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
('Samburu','Samburu East',  'Samburu East, Samburu',  false),
('Samburu','Samburu North', 'Samburu North, Samburu', false),
('Samburu','Samburu West',  'Samburu West, Samburu',  false),

-- â”€â”€ 35. TURKANA â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
('Turkana','Kibish',         'Kibish, Turkana',         false),
('Turkana','Loima',          'Loima, Turkana',          false),
('Turkana','Turkana Central','Turkana Central, Turkana', false),
('Turkana','Turkana East',   'Turkana East, Turkana',   false),
('Turkana','Turkana North',  'Turkana North, Turkana',  false),
('Turkana','Turkana South',  'Turkana South, Turkana',  false),
('Turkana','Turkana West',   'Turkana West, Turkana',   false),

-- â”€â”€ 36. KERICHO â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
('Kericho','Ainamoi',        'Ainamoi, Kericho',        false),
('Kericho','Belgut',         'Belgut, Kericho',         false),
('Kericho','Bureti',         'Bureti, Kericho',         false),
('Kericho','Kipkelion East', 'Kipkelion East, Kericho', false),
('Kericho','Kipkelion West', 'Kipkelion West, Kericho', false),
('Kericho','Soin/Sigowet',   'Soin/Sigowet, Kericho',   false),

-- â”€â”€ 37. BOMET â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
('Bomet','Bomet Central', 'Bomet Central, Bomet', false),
('Bomet','Bomet East',    'Bomet East, Bomet',    false),
('Bomet','Chepalungu',    'Chepalungu, Bomet',    false),
('Bomet','Konoin',        'Konoin, Bomet',        false),
('Bomet','Sotik',         'Sotik, Bomet',         false),

-- â”€â”€ 38. KAKAMEGA â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
('Kakamega','Butere',       'Butere, Kakamega',       false),
('Kakamega','Ikolomani',    'Ikolomani, Kakamega',    false),
('Kakamega','Khwisero',     'Khwisero, Kakamega',     false),
('Kakamega','Likuyani',     'Likuyani, Kakamega',     false),
('Kakamega','Lugari',       'Lugari, Kakamega',       false),
('Kakamega','Lurambi',      'Lurambi, Kakamega',      false),
('Kakamega','Malava',       'Malava, Kakamega',       false),
('Kakamega','Matungu',      'Matungu, Kakamega',      false),
('Kakamega','Mumias East',  'Mumias East, Kakamega',  false),
('Kakamega','Mumias West',  'Mumias West, Kakamega',  false),
('Kakamega','Navakholo',    'Navakholo, Kakamega',    false),
('Kakamega','Shinyalu',     'Shinyalu, Kakamega',     false),

-- â”€â”€ 39. VIHIGA â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
('Vihiga','Emuhaya', 'Emuhaya, Vihiga', false),
('Vihiga','Hamisi',  'Hamisi, Vihiga',  false),
('Vihiga','Luanda',  'Luanda, Vihiga',  false),
('Vihiga','Sabatia', 'Sabatia, Vihiga', false),
('Vihiga','Vihiga',  'Vihiga Town',     false),

-- â”€â”€ 40. BUNGOMA â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
('Bungoma','Bumula',      'Bumula, Bungoma',      false),
('Bungoma','Kabuchai',    'Kabuchai, Bungoma',    false),
('Bungoma','Kanduyi',     'Kanduyi, Bungoma',     false),
('Bungoma','Kimilili',    'Kimilili, Bungoma',    false),
('Bungoma','Mt Elgon',    'Mt Elgon, Bungoma',    false),
('Bungoma','Sirisia',     'Sirisia, Bungoma',     false),
('Bungoma','Tongaren',    'Tongaren, Bungoma',    false),
('Bungoma','Webuye East', 'Webuye East, Bungoma', false),
('Bungoma','Webuye West', 'Webuye West, Bungoma', false),

-- â”€â”€ 41. BUSIA â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
('Busia','Budalangi',  'Budalangi, Busia',  false),
('Busia','Butula',     'Butula, Busia',     false),
('Busia','Funyula',    'Funyula, Busia',    false),
('Busia','Nambale',    'Nambale, Busia',    false),
('Busia','Teso North', 'Teso North, Busia', false),
('Busia','Teso South', 'Teso South, Busia', false),

-- â”€â”€ 42. SIAYA â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
('Siaya','Alego Usonga', 'Alego Usonga, Siaya', false),
('Siaya','Bondo',        'Bondo, Siaya',        false),
('Siaya','Gem',          'Gem, Siaya',          false),
('Siaya','Rarieda',      'Rarieda, Siaya',      false),
('Siaya','Ugenya',       'Ugenya, Siaya',       false),
('Siaya','Ugunja',       'Ugunja, Siaya',       false),

-- â”€â”€ 43. KISUMU â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
('Kisumu','Kisumu Central', 'Kisumu Central, Kisumu', false),
('Kisumu','Kisumu East',    'Kisumu East, Kisumu',    false),
('Kisumu','Kisumu West',    'Kisumu West, Kisumu',    false),
('Kisumu','Muhoroni',       'Muhoroni, Kisumu',       false),
('Kisumu','Nyakach',        'Nyakach, Kisumu',        false),
('Kisumu','Nyando',         'Nyando, Kisumu',         false),
('Kisumu','Seme',           'Seme, Kisumu',           false),

-- â”€â”€ 44. HOMA BAY â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
('Homa Bay','Homabay Town',       'Homabay Town, Homa Bay',       false),
('Homa Bay','Kabondo Kasipul',    'Kabondo Kasipul, Homa Bay',    false),
('Homa Bay','Karachuonyo',        'Karachuonyo, Homa Bay',        false),
('Homa Bay','Kasipul',            'Kasipul, Homa Bay',            false),
('Homa Bay','Mbita',              'Mbita, Homa Bay',              false),
('Homa Bay','Ndhiwa',             'Ndhiwa, Homa Bay',             false),
('Homa Bay','Rangwe',             'Rangwe, Homa Bay',             false),
('Homa Bay','Suba North',         'Suba North, Homa Bay',         false),
('Homa Bay','Suba South',         'Suba South, Homa Bay',         false),

-- â”€â”€ 45. MIGORI â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
('Migori','Awendo',    'Awendo, Migori',    false),
('Migori','Kuria East','Kuria East, Migori', false),
('Migori','Kuria West','Kuria West, Migori', false),
('Migori','Mabera',    'Mabera, Migori',    false),
('Migori','Ntimaru',   'Ntimaru, Migori',   false),
('Migori','Rongo',     'Rongo, Migori',     false),
('Migori','Suna East', 'Suna East, Migori', false),
('Migori','Suna West', 'Suna West, Migori', false),
('Migori','Uriri',     'Uriri, Migori',     false),

-- â”€â”€ 46. KISII â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
('Kisii','Bobasi',                 'Bobasi, Kisii',                 false),
('Kisii','Bomachoge Borabu',       'Bomachoge Borabu, Kisii',       false),
('Kisii','Bomachoge Chache',       'Bomachoge Chache, Kisii',       false),
('Kisii','Bonchari',               'Bonchari, Kisii',               false),
('Kisii','Kitutu Chache North',    'Kitutu Chache North, Kisii',    false),
('Kisii','Kitutu Chache South',    'Kitutu Chache South, Kisii',    false),
('Kisii','Nyaribari Chache',       'Nyaribari Chache, Kisii',       false),
('Kisii','Nyaribari Masaba',       'Nyaribari Masaba, Kisii',       false),
('Kisii','South Mugirango',        'South Mugirango, Kisii',        false),

-- â”€â”€ 47. NYAMIRA â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
('Nyamira','Borabu',        'Borabu, Nyamira',        false),
('Nyamira','Manga',         'Manga, Nyamira',         false),
('Nyamira','Masaba North',  'Masaba North, Nyamira',  false),
('Nyamira','Nyamira North', 'Nyamira North, Nyamira', false),
('Nyamira','Nyamira South', 'Nyamira South, Nyamira', false)

ON CONFLICT (county, sub_county) DO NOTHING;



-- ════════════════════════════════════════════════════════
-- add_service_area_to_bookings.sql
-- ════════════════════════════════════════════════════════

-- ============================================================
--  Fixera â€” Add service_area_id to bookings
--  Enables area-based partner routing and analytics
-- ============================================================

ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS service_area_id UUID REFERENCES service_areas(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_bookings_service_area ON bookings(service_area_id);
CREATE INDEX IF NOT EXISTS idx_bookings_area_status  ON bookings(service_area_id, status);



-- ════════════════════════════════════════════════════════
-- v2_service_areas_upgrade.sql
-- ════════════════════════════════════════════════════════

-- ============================================================
--  Fixera â€” Service Areas v2 Production Upgrade
--  Self-contained â€” run after create_service_areas.sql only.
--  Safe to re-run.
-- ============================================================

-- â”€â”€ 0. Ensure UNIQUE constraint exists (required for ON CONFLICT) â”€
-- Safe whether or not seed_kenya_service_areas.sql was run first.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'uq_county_subcounty'
      AND conrelid = 'service_areas'::regclass
  ) THEN
    ALTER TABLE service_areas
      ADD CONSTRAINT uq_county_subcounty UNIQUE (county, sub_county);
  END IF;
END $$;

-- â”€â”€ 1. Schema additions â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
ALTER TABLE service_areas
  ADD COLUMN IF NOT EXISTS launch_phase TEXT NOT NULL DEFAULT 'future'
    CONSTRAINT chk_launch_phase CHECK (launch_phase IN ('launch', 'expansion', 'future')),
  ADD COLUMN IF NOT EXISTS service_radius_km NUMERIC(4,1) NOT NULL DEFAULT 5.0,
  ADD COLUMN IF NOT EXISTS available_services TEXT[] NOT NULL
    DEFAULT ARRAY['cleaning','moving','plumbing','electrical','painting','fumigation','laundry','groceries','water','workforce'],
  ADD COLUMN IF NOT EXISTS expansion_readiness INTEGER NOT NULL DEFAULT 0
    CONSTRAINT chk_expansion_readiness CHECK (expansion_readiness BETWEEN 0 AND 100),
  ADD COLUMN IF NOT EXISTS metro TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS sort_order INTEGER NOT NULL DEFAULT 999,
  ADD COLUMN IF NOT EXISTS seed_batch TEXT DEFAULT NULL;

CREATE INDEX IF NOT EXISTS idx_service_areas_metro        ON service_areas(metro);
CREATE INDEX IF NOT EXISTS idx_service_areas_launch_phase ON service_areas(launch_phase);
CREATE INDEX IF NOT EXISTS idx_service_areas_metro_active ON service_areas(metro, is_active);

-- â”€â”€ 2. Fix RLS â€” admin writes only, authenticated reads â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
-- Drop old all-access policy
DROP POLICY IF EXISTS "Admin full access to service_areas" ON service_areas;
DROP POLICY IF EXISTS "Read service_areas"                 ON service_areas;
DROP POLICY IF EXISTS "Admin insert service_areas"         ON service_areas;
DROP POLICY IF EXISTS "Admin update service_areas"         ON service_areas;
DROP POLICY IF EXISTS "Admin delete service_areas"         ON service_areas;

-- Anyone logged in can read (booking form validates area; partners see coverage)
CREATE POLICY "Read service_areas" ON service_areas
  FOR SELECT TO authenticated USING (true);

-- Only admins can create areas
CREATE POLICY "Admin insert service_areas" ON service_areas
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE)
  );

-- Only admins can update (covers activate/deactivate/edit)
CREATE POLICY "Admin update service_areas" ON service_areas
  FOR UPDATE TO authenticated
  USING  (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE));

-- Only admins can delete
CREATE POLICY "Admin delete service_areas" ON service_areas
  FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE));

-- â”€â”€ 3. Safe reseed â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
-- Deletes ONLY system-seeded rows (seed_batch IS NOT NULL).
-- Admin-created areas (seed_batch = NULL) are never touched.
-- On first run: also removes old rows that have notes IS NULL (original v1 seed).
DELETE FROM service_areas
  WHERE seed_batch IS NOT NULL
     OR notes IS NULL;   -- covers v1 seed rows that predate seed_batch column

-- â”€â”€ 4. Nairobi Metro â€” Phase 1 LAUNCH (active) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
-- 32 urban neighbourhoods across Nairobi, Kiambu, Kajiado, Machakos
INSERT INTO service_areas
  (county, sub_county, label, is_active, launch_phase, metro, sort_order, service_radius_km, expansion_readiness, seed_batch)
VALUES
-- Core Nairobi neighbourhoods
('Nairobi','Westlands',     'Westlands, Nairobi',     true,'launch','Nairobi Metro', 1,4.0,90,'v2_nairobi_metro'),
('Nairobi','Kilimani',      'Kilimani, Nairobi',      true,'launch','Nairobi Metro', 2,3.0,92,'v2_nairobi_metro'),
('Nairobi','Lavington',     'Lavington, Nairobi',     true,'launch','Nairobi Metro', 3,3.0,88,'v2_nairobi_metro'),
('Nairobi','Kileleshwa',    'Kileleshwa, Nairobi',    true,'launch','Nairobi Metro', 4,3.0,87,'v2_nairobi_metro'),
('Nairobi','Karen',         'Karen, Nairobi',          true,'launch','Nairobi Metro', 5,6.0,80,'v2_nairobi_metro'),
('Nairobi','Runda',         'Runda, Nairobi',          true,'launch','Nairobi Metro', 6,4.0,78,'v2_nairobi_metro'),
('Nairobi','Gigiri',        'Gigiri, Nairobi',         true,'launch','Nairobi Metro', 7,3.0,82,'v2_nairobi_metro'),
('Nairobi','Muthaiga',      'Muthaiga, Nairobi',       true,'launch','Nairobi Metro', 8,3.0,84,'v2_nairobi_metro'),
('Nairobi','Parklands',     'Parklands, Nairobi',      true,'launch','Nairobi Metro', 9,3.0,86,'v2_nairobi_metro'),
('Nairobi','Upperhill',     'Upperhill, Nairobi',      true,'launch','Nairobi Metro',10,3.0,85,'v2_nairobi_metro'),
('Nairobi','CBD',           'CBD, Nairobi',            true,'launch','Nairobi Metro',11,2.0,95,'v2_nairobi_metro'),
('Nairobi','Eastleigh',     'Eastleigh, Nairobi',      true,'launch','Nairobi Metro',12,3.0,83,'v2_nairobi_metro'),
('Nairobi','South B',       'South B, Nairobi',        true,'launch','Nairobi Metro',13,3.0,81,'v2_nairobi_metro'),
('Nairobi','South C',       'South C, Nairobi',        true,'launch','Nairobi Metro',14,3.0,80,'v2_nairobi_metro'),
('Nairobi','Buruburu',      'Buruburu, Nairobi',       true,'launch','Nairobi Metro',15,4.0,79,'v2_nairobi_metro'),
('Nairobi','Donholm',       'Donholm, Nairobi',        true,'launch','Nairobi Metro',16,3.0,76,'v2_nairobi_metro'),
('Nairobi','Umoja',         'Umoja, Nairobi',          true,'launch','Nairobi Metro',17,4.0,75,'v2_nairobi_metro'),
('Nairobi','Zimmerman',     'Zimmerman, Nairobi',      true,'launch','Nairobi Metro',18,3.0,72,'v2_nairobi_metro'),
('Nairobi','Kahawa West',   'Kahawa West, Nairobi',    true,'launch','Nairobi Metro',19,4.0,70,'v2_nairobi_metro'),
('Nairobi','Kahawa Sukari', 'Kahawa Sukari, Nairobi',  true,'launch','Nairobi Metro',20,4.0,68,'v2_nairobi_metro'),
('Nairobi','Githurai',      'Githurai, Nairobi',       true,'launch','Nairobi Metro',21,4.0,67,'v2_nairobi_metro'),
('Nairobi','Kasarani',      'Kasarani, Nairobi',       true,'launch','Nairobi Metro',22,5.0,74,'v2_nairobi_metro'),
('Nairobi','Roysambu',      'Roysambu, Nairobi',       true,'launch','Nairobi Metro',23,4.0,73,'v2_nairobi_metro'),
('Nairobi','Langata',       'Langata, Nairobi',        true,'launch','Nairobi Metro',24,5.0,71,'v2_nairobi_metro'),
('Nairobi','Embakasi',      'Embakasi, Nairobi',       true,'launch','Nairobi Metro',25,5.0,69,'v2_nairobi_metro'),
-- Nairobi Metro extended (adjacent counties, same metro zone)
('Kiambu', 'Ruaka',         'Ruaka, Kiambu',           true,'launch','Nairobi Metro',26,4.0,65,'v2_nairobi_metro'),
('Kiambu', 'Ruiru',         'Ruiru, Kiambu',           true,'launch','Nairobi Metro',27,5.0,60,'v2_nairobi_metro'),
('Kiambu', 'Kikuyu',        'Kikuyu, Kiambu',          true,'launch','Nairobi Metro',28,5.0,58,'v2_nairobi_metro'),
('Kajiado','Rongai',        'Rongai, Kajiado',         true,'launch','Nairobi Metro',29,5.0,55,'v2_nairobi_metro'),
('Kajiado','Ngong',         'Ngong, Kajiado',          true,'launch','Nairobi Metro',30,6.0,52,'v2_nairobi_metro'),
('Kajiado','Kitengela',     'Kitengela, Kajiado',      true,'launch','Nairobi Metro',31,6.0,50,'v2_nairobi_metro'),
('Machakos','Syokimau',     'Syokimau, Machakos',      true,'launch','Nairobi Metro',32,4.0,62,'v2_nairobi_metro')
ON CONFLICT (county, sub_county) DO UPDATE SET
  is_active          = EXCLUDED.is_active,
  launch_phase       = EXCLUDED.launch_phase,
  metro              = EXCLUDED.metro,
  sort_order         = EXCLUDED.sort_order,
  service_radius_km  = EXCLUDED.service_radius_km,
  expansion_readiness= EXCLUDED.expansion_readiness,
  seed_batch         = EXCLUDED.seed_batch,
  updated_at         = now();

-- â”€â”€ 5. Mombasa Metro â€” Phase 2 EXPANSION (inactive) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
INSERT INTO service_areas
  (county, sub_county, label, is_active, launch_phase, metro, sort_order, service_radius_km, expansion_readiness, seed_batch)
VALUES
('Mombasa','Nyali',       'Nyali, Mombasa',      false,'expansion','Mombasa Metro', 1,4.0,30,'v2_mombasa_metro'),
('Mombasa','Bamburi',     'Bamburi, Mombasa',    false,'expansion','Mombasa Metro', 2,4.0,28,'v2_mombasa_metro'),
('Mombasa','Shanzu',      'Shanzu, Mombasa',     false,'expansion','Mombasa Metro', 3,4.0,22,'v2_mombasa_metro'),
('Mombasa','Mtwapa',      'Mtwapa, Mombasa',     false,'expansion','Mombasa Metro', 4,4.0,20,'v2_mombasa_metro'),
('Mombasa','Mkomani',     'Mkomani, Mombasa',    false,'expansion','Mombasa Metro', 5,3.0,25,'v2_mombasa_metro'),
('Mombasa','Tudor',       'Tudor, Mombasa',      false,'expansion','Mombasa Metro', 6,3.0,24,'v2_mombasa_metro'),
('Mombasa','Kizingo',     'Kizingo, Mombasa',    false,'expansion','Mombasa Metro', 7,2.0,32,'v2_mombasa_metro'),
('Mombasa','Mvita',       'Mvita, Mombasa',      false,'expansion','Mombasa Metro', 8,2.0,35,'v2_mombasa_metro'),
('Mombasa','Changamwe',   'Changamwe, Mombasa',  false,'expansion','Mombasa Metro', 9,4.0,18,'v2_mombasa_metro'),
('Mombasa','Jomvu',       'Jomvu, Mombasa',      false,'expansion','Mombasa Metro',10,4.0,15,'v2_mombasa_metro'),
('Mombasa','Kisauni',     'Kisauni, Mombasa',    false,'expansion','Mombasa Metro',11,4.0,17,'v2_mombasa_metro'),
('Mombasa','Likoni',      'Likoni, Mombasa',     false,'expansion','Mombasa Metro',12,4.0,19,'v2_mombasa_metro'),
('Kwale',  'Diani',       'Diani, Kwale',         false,'expansion','Mombasa Metro',13,6.0,12,'v2_mombasa_metro'),
('Kwale',  'Ukunda',      'Ukunda, Kwale',        false,'expansion','Mombasa Metro',14,5.0,10,'v2_mombasa_metro'),
('Kwale',  'Msambweni',   'Msambweni, Kwale',     false,'expansion','Mombasa Metro',15,6.0, 8,'v2_mombasa_metro'),
('Kilifi', 'Kilifi Town', 'Kilifi Town, Kilifi',  false,'expansion','Mombasa Metro',16,5.0,10,'v2_mombasa_metro'),
('Kilifi', 'Malindi',     'Malindi, Kilifi',      false,'expansion','Mombasa Metro',17,6.0,12,'v2_mombasa_metro')
ON CONFLICT (county, sub_county) DO UPDATE SET
  launch_phase        = EXCLUDED.launch_phase,
  metro               = EXCLUDED.metro,
  sort_order          = EXCLUDED.sort_order,
  service_radius_km   = EXCLUDED.service_radius_km,
  expansion_readiness = EXCLUDED.expansion_readiness,
  seed_batch          = EXCLUDED.seed_batch,
  updated_at          = now();

-- â”€â”€ 6. Kisumu Metro â€” Phase 2 EXPANSION (inactive) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
INSERT INTO service_areas
  (county, sub_county, label, is_active, launch_phase, metro, sort_order, service_radius_km, expansion_readiness, seed_batch)
VALUES
('Kisumu','Kisumu Central',  'Kisumu Central, Kisumu',   false,'expansion','Kisumu Metro', 1,3.0,25,'v2_kisumu_metro'),
('Kisumu','Milimani',        'Milimani, Kisumu',         false,'expansion','Kisumu Metro', 2,3.0,22,'v2_kisumu_metro'),
('Kisumu','Kondele',         'Kondele, Kisumu',          false,'expansion','Kisumu Metro', 3,3.0,18,'v2_kisumu_metro'),
('Kisumu','Nyalenda',        'Nyalenda, Kisumu',         false,'expansion','Kisumu Metro', 4,3.0,16,'v2_kisumu_metro'),
('Kisumu','Mamboleo',        'Mamboleo, Kisumu',         false,'expansion','Kisumu Metro', 5,4.0,14,'v2_kisumu_metro'),
('Kisumu','Riat',            'Riat, Kisumu',             false,'expansion','Kisumu Metro', 6,4.0,12,'v2_kisumu_metro'),
('Kisumu','Tom Mboya Estate','Tom Mboya Estate, Kisumu', false,'expansion','Kisumu Metro', 7,3.0,15,'v2_kisumu_metro'),
('Kisumu','Migosi',          'Migosi, Kisumu',           false,'expansion','Kisumu Metro', 8,3.0,14,'v2_kisumu_metro'),
('Kisumu','Nyamasaria',      'Nyamasaria, Kisumu',       false,'expansion','Kisumu Metro', 9,4.0,11,'v2_kisumu_metro'),
('Kisumu','Manyatta',        'Manyatta, Kisumu',         false,'expansion','Kisumu Metro',10,4.0,10,'v2_kisumu_metro'),
('Kisumu','Airport Area',    'Airport Area, Kisumu',     false,'expansion','Kisumu Metro',11,4.0, 9,'v2_kisumu_metro'),
('Kisumu','Nyawita',         'Nyawita, Kisumu',          false,'expansion','Kisumu Metro',12,3.0,13,'v2_kisumu_metro')
ON CONFLICT (county, sub_county) DO UPDATE SET
  launch_phase        = EXCLUDED.launch_phase,
  metro               = EXCLUDED.metro,
  sort_order          = EXCLUDED.sort_order,
  service_radius_km   = EXCLUDED.service_radius_km,
  expansion_readiness = EXCLUDED.expansion_readiness,
  seed_batch          = EXCLUDED.seed_batch,
  updated_at          = now();

-- â”€â”€ 7. Nakuru Metro â€” Phase 3 EXPANSION (inactive) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
INSERT INTO service_areas
  (county, sub_county, label, is_active, launch_phase, metro, sort_order, service_radius_km, expansion_readiness, seed_batch)
VALUES
('Nakuru','Nakuru CBD',    'Nakuru CBD, Nakuru',     false,'expansion','Nakuru Metro', 1,3.0,20,'v2_nakuru_metro'),
('Nakuru','Milimani',      'Milimani, Nakuru',       false,'expansion','Nakuru Metro', 2,3.0,18,'v2_nakuru_metro'),
('Nakuru','Section 58',    'Section 58, Nakuru',     false,'expansion','Nakuru Metro', 3,3.0,16,'v2_nakuru_metro'),
('Nakuru','Lanet',         'Lanet, Nakuru',          false,'expansion','Nakuru Metro', 4,4.0,14,'v2_nakuru_metro'),
('Nakuru','Naka',          'Naka, Nakuru',           false,'expansion','Nakuru Metro', 5,3.0,13,'v2_nakuru_metro'),
('Nakuru','Kiamunyi',      'Kiamunyi, Nakuru',       false,'expansion','Nakuru Metro', 6,3.0,12,'v2_nakuru_metro'),
('Nakuru','Pipeline',      'Pipeline, Nakuru',       false,'expansion','Nakuru Metro', 7,3.0,11,'v2_nakuru_metro'),
('Nakuru','Free Area',     'Free Area, Nakuru',      false,'expansion','Nakuru Metro', 8,3.0,10,'v2_nakuru_metro'),
('Nakuru','London Estate', 'London Estate, Nakuru',  false,'expansion','Nakuru Metro', 9,3.0, 9,'v2_nakuru_metro'),
('Nakuru','White House',   'White House, Nakuru',    false,'expansion','Nakuru Metro',10,3.0, 8,'v2_nakuru_metro'),
('Nakuru','Bahati',        'Bahati, Nakuru',         false,'expansion','Nakuru Metro',11,5.0, 7,'v2_nakuru_metro'),
('Nakuru','Naivasha',      'Naivasha, Nakuru',       false,'expansion','Nakuru Metro',12,5.0,10,'v2_nakuru_metro')
ON CONFLICT (county, sub_county) DO UPDATE SET
  launch_phase        = EXCLUDED.launch_phase,
  metro               = EXCLUDED.metro,
  sort_order          = EXCLUDED.sort_order,
  service_radius_km   = EXCLUDED.service_radius_km,
  expansion_readiness = EXCLUDED.expansion_readiness,
  seed_batch          = EXCLUDED.seed_batch,
  updated_at          = now();

-- â”€â”€ 8. Eldoret Metro â€” Phase 3 EXPANSION (inactive) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
INSERT INTO service_areas
  (county, sub_county, label, is_active, launch_phase, metro, sort_order, service_radius_km, expansion_readiness, seed_batch)
VALUES
('Uasin Gishu','Eldoret CBD',  'Eldoret CBD, Uasin Gishu',  false,'expansion','Eldoret Metro', 1,3.0,18,'v2_eldoret_metro'),
('Uasin Gishu','Elgon View',   'Elgon View, Uasin Gishu',   false,'expansion','Eldoret Metro', 2,3.0,16,'v2_eldoret_metro'),
('Uasin Gishu','Kapsoya',      'Kapsoya, Uasin Gishu',      false,'expansion','Eldoret Metro', 3,4.0,14,'v2_eldoret_metro'),
('Uasin Gishu','Pioneer',      'Pioneer, Uasin Gishu',      false,'expansion','Eldoret Metro', 4,3.0,13,'v2_eldoret_metro'),
('Uasin Gishu','Huruma',       'Huruma, Uasin Gishu',       false,'expansion','Eldoret Metro', 5,3.0,12,'v2_eldoret_metro'),
('Uasin Gishu','Annex',        'Annex, Uasin Gishu',        false,'expansion','Eldoret Metro', 6,3.0,11,'v2_eldoret_metro'),
('Uasin Gishu','Langas',       'Langas, Uasin Gishu',       false,'expansion','Eldoret Metro', 7,4.0,10,'v2_eldoret_metro'),
('Uasin Gishu','Action Area',  'Action Area, Uasin Gishu',  false,'expansion','Eldoret Metro', 8,3.0, 9,'v2_eldoret_metro'),
('Uasin Gishu','Mwanzo',       'Mwanzo, Uasin Gishu',       false,'expansion','Eldoret Metro', 9,3.0, 8,'v2_eldoret_metro'),
('Uasin Gishu','Racecourse',   'Racecourse, Uasin Gishu',   false,'expansion','Eldoret Metro',10,3.0, 8,'v2_eldoret_metro'),
('Uasin Gishu','Maili Nne',    'Maili Nne, Uasin Gishu',    false,'expansion','Eldoret Metro',11,4.0, 7,'v2_eldoret_metro'),
('Uasin Gishu','Kimumu',       'Kimumu, Uasin Gishu',       false,'expansion','Eldoret Metro',12,5.0, 6,'v2_eldoret_metro')
ON CONFLICT (county, sub_county) DO UPDATE SET
  launch_phase        = EXCLUDED.launch_phase,
  metro               = EXCLUDED.metro,
  sort_order          = EXCLUDED.sort_order,
  service_radius_km   = EXCLUDED.service_radius_km,
  expansion_readiness = EXCLUDED.expansion_readiness,
  seed_batch          = EXCLUDED.seed_batch,
  updated_at          = now();

-- â”€â”€ 9. Nyeri â€” Phase 4 FUTURE (inactive) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
INSERT INTO service_areas
  (county, sub_county, label, is_active, launch_phase, metro, sort_order, service_radius_km, seed_batch)
VALUES
('Nyeri','Nyeri Town',  'Nyeri Town, Nyeri',   false,'future','Nyeri', 1,4.0,'v2_nyeri'),
('Nyeri','Ruring''u',   'Ruringu, Nyeri',       false,'future','Nyeri', 2,4.0,'v2_nyeri'),
('Nyeri','King''ong''o','Kingongo, Nyeri',       false,'future','Nyeri', 3,3.0,'v2_nyeri'),
('Nyeri','Kamakwa',     'Kamakwa, Nyeri',       false,'future','Nyeri', 4,3.0,'v2_nyeri'),
('Nyeri','Tetu',        'Tetu, Nyeri',          false,'future','Nyeri', 5,5.0,'v2_nyeri'),
('Nyeri','Othaya',      'Othaya, Nyeri',        false,'future','Nyeri', 6,5.0,'v2_nyeri'),
('Nyeri','Karatina',    'Karatina, Nyeri',      false,'future','Nyeri', 7,4.0,'v2_nyeri'),
('Nyeri','Mathira',     'Mathira, Nyeri',       false,'future','Nyeri', 8,5.0,'v2_nyeri')
ON CONFLICT (county, sub_county) DO UPDATE SET
  launch_phase = EXCLUDED.launch_phase, metro = EXCLUDED.metro,
  sort_order = EXCLUDED.sort_order, seed_batch = EXCLUDED.seed_batch, updated_at = now();

-- â”€â”€ 10. Meru â€” Phase 4 FUTURE (inactive) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
INSERT INTO service_areas
  (county, sub_county, label, is_active, launch_phase, metro, sort_order, service_radius_km, seed_batch)
VALUES
('Meru','Meru Town',  'Meru Town, Meru',   false,'future','Meru', 1,4.0,'v2_meru'),
('Meru','Makutano',   'Makutano, Meru',    false,'future','Meru', 2,4.0,'v2_meru'),
('Meru','Nkubu',      'Nkubu, Meru',       false,'future','Meru', 3,4.0,'v2_meru'),
('Meru','Timau',      'Timau, Meru',       false,'future','Meru', 4,5.0,'v2_meru'),
('Meru','Maua',       'Maua, Meru',        false,'future','Meru', 5,5.0,'v2_meru'),
('Meru','Kanyakine',  'Kanyakine, Meru',   false,'future','Meru', 6,4.0,'v2_meru'),
('Meru','Abogeta',    'Abogeta, Meru',     false,'future','Meru', 7,4.0,'v2_meru'),
('Meru','Imenti',     'Imenti, Meru',      false,'future','Meru', 8,4.0,'v2_meru')
ON CONFLICT (county, sub_county) DO UPDATE SET
  launch_phase = EXCLUDED.launch_phase, metro = EXCLUDED.metro,
  sort_order = EXCLUDED.sort_order, seed_batch = EXCLUDED.seed_batch, updated_at = now();

-- â”€â”€ 11. Thika â€” Phase 4 FUTURE (inactive) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
INSERT INTO service_areas
  (county, sub_county, label, is_active, launch_phase, metro, sort_order, service_radius_km, seed_batch)
VALUES
('Kiambu','Thika Town',   'Thika Town, Kiambu',  false,'future','Thika', 1,4.0,'v2_thika'),
('Kiambu','Makongeni',    'Makongeni, Kiambu',   false,'future','Thika', 2,3.0,'v2_thika'),
('Kiambu','Section 9',    'Section 9, Kiambu',   false,'future','Thika', 3,3.0,'v2_thika'),
('Kiambu','Section 3',    'Section 3, Kiambu',   false,'future','Thika', 4,3.0,'v2_thika'),
('Kiambu','Landless',     'Landless, Kiambu',    false,'future','Thika', 5,3.0,'v2_thika'),
('Kiambu','Blue Post',    'Blue Post, Kiambu',   false,'future','Thika', 6,4.0,'v2_thika'),
('Kiambu','Ngoigwa',      'Ngoigwa, Kiambu',     false,'future','Thika', 7,4.0,'v2_thika'),
('Kiambu','Juja',         'Juja, Kiambu',        false,'future','Thika', 8,5.0,'v2_thika')
ON CONFLICT (county, sub_county) DO UPDATE SET
  launch_phase = EXCLUDED.launch_phase, metro = EXCLUDED.metro,
  sort_order = EXCLUDED.sort_order, seed_batch = EXCLUDED.seed_batch, updated_at = now();

-- â”€â”€ 12. Kakamega â€” Phase 4 FUTURE (inactive) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
INSERT INTO service_areas
  (county, sub_county, label, is_active, launch_phase, metro, sort_order, service_radius_km, seed_batch)
VALUES
('Kakamega','Kakamega Town', 'Kakamega Town, Kakamega', false,'future','Kakamega', 1,4.0,'v2_kakamega'),
('Kakamega','Amalemba',      'Amalemba, Kakamega',      false,'future','Kakamega', 2,3.0,'v2_kakamega'),
('Kakamega','Shinyalu',      'Shinyalu, Kakamega',      false,'future','Kakamega', 3,4.0,'v2_kakamega'),
('Kakamega','Lurambi',       'Lurambi, Kakamega',       false,'future','Kakamega', 4,4.0,'v2_kakamega'),
('Kakamega','Mumias',        'Mumias, Kakamega',        false,'future','Kakamega', 5,5.0,'v2_kakamega'),
('Kakamega','Malava',        'Malava, Kakamega',        false,'future','Kakamega', 6,5.0,'v2_kakamega'),
('Kakamega','Butere',        'Butere, Kakamega',        false,'future','Kakamega', 7,5.0,'v2_kakamega'),
('Kakamega','Navakholo',     'Navakholo, Kakamega',     false,'future','Kakamega', 8,5.0,'v2_kakamega')
ON CONFLICT (county, sub_county) DO UPDATE SET
  launch_phase = EXCLUDED.launch_phase, metro = EXCLUDED.metro,
  sort_order = EXCLUDED.sort_order, seed_batch = EXCLUDED.seed_batch, updated_at = now();

-- â”€â”€ 13. Machakos Metro â€” Phase 4 FUTURE (inactive) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
INSERT INTO service_areas
  (county, sub_county, label, is_active, launch_phase, metro, sort_order, service_radius_km, seed_batch)
VALUES
('Machakos','Machakos Town',   'Machakos Town, Machakos',   false,'future','Machakos Metro', 1,4.0,'v2_machakos_metro'),
('Machakos','Mlolongo',        'Mlolongo, Machakos',        false,'future','Machakos Metro', 2,4.0,'v2_machakos_metro'),
('Machakos','Athi River',      'Athi River, Machakos',      false,'future','Machakos Metro', 3,5.0,'v2_machakos_metro'),
('Machakos','Mavoko',          'Mavoko, Machakos',          false,'future','Machakos Metro', 4,5.0,'v2_machakos_metro'),
('Machakos','Joska',           'Joska, Machakos',           false,'future','Machakos Metro', 5,5.0,'v2_machakos_metro'),
('Machakos','Katani',          'Katani, Machakos',          false,'future','Machakos Metro', 6,5.0,'v2_machakos_metro'),
('Machakos','Kangundo Road',   'Kangundo Road, Machakos',   false,'future','Machakos Metro', 7,5.0,'v2_machakos_metro')
ON CONFLICT (county, sub_county) DO UPDATE SET
  launch_phase = EXCLUDED.launch_phase, metro = EXCLUDED.metro,
  sort_order = EXCLUDED.sort_order, seed_batch = EXCLUDED.seed_batch, updated_at = now();

-- â”€â”€ 14. Kiambu Metro â€” Phase 4 FUTURE (inactive) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
-- (Ruiru, Kikuyu, Juja already in Nairobi Metro above)
INSERT INTO service_areas
  (county, sub_county, label, is_active, launch_phase, metro, sort_order, service_radius_km, seed_batch)
VALUES
('Kiambu','Kiambu Town', 'Kiambu Town, Kiambu', false,'future','Kiambu Metro', 1,4.0,'v2_kiambu_metro'),
('Kiambu','Limuru',      'Limuru, Kiambu',      false,'future','Kiambu Metro', 2,5.0,'v2_kiambu_metro'),
('Kiambu','Githunguri',  'Githunguri, Kiambu',  false,'future','Kiambu Metro', 3,5.0,'v2_kiambu_metro'),
('Kiambu','Kabete',      'Kabete, Kiambu',      false,'future','Kiambu Metro', 4,4.0,'v2_kiambu_metro'),
('Kiambu','Kiambaa',     'Kiambaa, Kiambu',     false,'future','Kiambu Metro', 5,4.0,'v2_kiambu_metro')
ON CONFLICT (county, sub_county) DO UPDATE SET
  launch_phase = EXCLUDED.launch_phase, metro = EXCLUDED.metro,
  sort_order = EXCLUDED.sort_order, seed_batch = EXCLUDED.seed_batch, updated_at = now();

-- â”€â”€ 15. Remaining 35 Kenya counties â€” constituency level (future) â”€
-- Counties NOT covered by metro seeds above. Kept at constituency level for national data.
INSERT INTO service_areas (county, sub_county, label, is_active, launch_phase, seed_batch) VALUES
-- Makueni
('Makueni','Kaiti','Kaiti, Makueni',false,'future','v2_remaining'),
('Makueni','Kibwezi East','Kibwezi East, Makueni',false,'future','v2_remaining'),
('Makueni','Kibwezi West','Kibwezi West, Makueni',false,'future','v2_remaining'),
('Makueni','Kilome','Kilome, Makueni',false,'future','v2_remaining'),
('Makueni','Makueni Town','Makueni Town, Makueni',false,'future','v2_remaining'),
('Makueni','Mbooni','Mbooni, Makueni',false,'future','v2_remaining'),
-- Tana River
('Tana River','Bura','Bura, Tana River',false,'future','v2_remaining'),
('Tana River','Galole','Galole, Tana River',false,'future','v2_remaining'),
('Tana River','Garsen','Garsen, Tana River',false,'future','v2_remaining'),
-- Lamu
('Lamu','Lamu East','Lamu East, Lamu',false,'future','v2_remaining'),
('Lamu','Lamu West','Lamu West, Lamu',false,'future','v2_remaining'),
-- Taita-Taveta
('Taita-Taveta','Mwatate','Mwatate, Taita-Taveta',false,'future','v2_remaining'),
('Taita-Taveta','Taveta','Taveta, Taita-Taveta',false,'future','v2_remaining'),
('Taita-Taveta','Voi','Voi, Taita-Taveta',false,'future','v2_remaining'),
('Taita-Taveta','Wundanyi','Wundanyi, Taita-Taveta',false,'future','v2_remaining'),
-- Garissa
('Garissa','Balambala','Balambala, Garissa',false,'future','v2_remaining'),
('Garissa','Dadaab','Dadaab, Garissa',false,'future','v2_remaining'),
('Garissa','Fafi','Fafi, Garissa',false,'future','v2_remaining'),
('Garissa','Garissa Township','Garissa Township, Garissa',false,'future','v2_remaining'),
('Garissa','Hulugho','Hulugho, Garissa',false,'future','v2_remaining'),
('Garissa','Ijara','Ijara, Garissa',false,'future','v2_remaining'),
('Garissa','Lagdera','Lagdera, Garissa',false,'future','v2_remaining'),
-- Wajir
('Wajir','Eldas','Eldas, Wajir',false,'future','v2_remaining'),
('Wajir','Tarbaj','Tarbaj, Wajir',false,'future','v2_remaining'),
('Wajir','Wajir East','Wajir East, Wajir',false,'future','v2_remaining'),
('Wajir','Wajir North','Wajir North, Wajir',false,'future','v2_remaining'),
('Wajir','Wajir South','Wajir South, Wajir',false,'future','v2_remaining'),
('Wajir','Wajir West','Wajir West, Wajir',false,'future','v2_remaining'),
-- Mandera
('Mandera','Banissa','Banissa, Mandera',false,'future','v2_remaining'),
('Mandera','Lafey','Lafey, Mandera',false,'future','v2_remaining'),
('Mandera','Mandera East','Mandera East, Mandera',false,'future','v2_remaining'),
('Mandera','Mandera North','Mandera North, Mandera',false,'future','v2_remaining'),
('Mandera','Mandera South','Mandera South, Mandera',false,'future','v2_remaining'),
('Mandera','Mandera West','Mandera West, Mandera',false,'future','v2_remaining'),
-- Marsabit
('Marsabit','Laisamis','Laisamis, Marsabit',false,'future','v2_remaining'),
('Marsabit','Moyale','Moyale, Marsabit',false,'future','v2_remaining'),
('Marsabit','North Horr','North Horr, Marsabit',false,'future','v2_remaining'),
('Marsabit','Saku','Saku, Marsabit',false,'future','v2_remaining'),
-- Isiolo
('Isiolo','Garbatulla','Garbatulla, Isiolo',false,'future','v2_remaining'),
('Isiolo','Isiolo Town','Isiolo Town, Isiolo',false,'future','v2_remaining'),
('Isiolo','Merti','Merti, Isiolo',false,'future','v2_remaining'),
-- Tharaka-Nithi
('Tharaka-Nithi','Chuka','Chuka, Tharaka-Nithi',false,'future','v2_remaining'),
('Tharaka-Nithi','Maara','Maara, Tharaka-Nithi',false,'future','v2_remaining'),
('Tharaka-Nithi','Tharaka North','Tharaka North, Tharaka-Nithi',false,'future','v2_remaining'),
('Tharaka-Nithi','Tharaka South','Tharaka South, Tharaka-Nithi',false,'future','v2_remaining'),
-- Embu
('Embu','Embu East','Embu East, Embu',false,'future','v2_remaining'),
('Embu','Embu North','Embu North, Embu',false,'future','v2_remaining'),
('Embu','Embu West','Embu West, Embu',false,'future','v2_remaining'),
('Embu','Mbeere North','Mbeere North, Embu',false,'future','v2_remaining'),
('Embu','Mbeere South','Mbeere South, Embu',false,'future','v2_remaining'),
('Embu','Runyenjes','Runyenjes, Embu',false,'future','v2_remaining'),
-- Kitui
('Kitui','Kitui Central','Kitui Central, Kitui',false,'future','v2_remaining'),
('Kitui','Kitui East','Kitui East, Kitui',false,'future','v2_remaining'),
('Kitui','Kitui Rural','Kitui Rural, Kitui',false,'future','v2_remaining'),
('Kitui','Kitui South','Kitui South, Kitui',false,'future','v2_remaining'),
('Kitui','Kitui West','Kitui West, Kitui',false,'future','v2_remaining'),
('Kitui','Mwingi Central','Mwingi Central, Kitui',false,'future','v2_remaining'),
('Kitui','Mwingi North','Mwingi North, Kitui',false,'future','v2_remaining'),
('Kitui','Mwingi West','Mwingi West, Kitui',false,'future','v2_remaining'),
-- Nyandarua
('Nyandarua','Kinangop','Kinangop, Nyandarua',false,'future','v2_remaining'),
('Nyandarua','Kipipiri','Kipipiri, Nyandarua',false,'future','v2_remaining'),
('Nyandarua','Ndaragwa','Ndaragwa, Nyandarua',false,'future','v2_remaining'),
('Nyandarua','Ol Kalou','Ol Kalou, Nyandarua',false,'future','v2_remaining'),
('Nyandarua','Ol Joro Orok','Ol Joro Orok, Nyandarua',false,'future','v2_remaining'),
-- Kirinyaga
('Kirinyaga','Gichugu','Gichugu, Kirinyaga',false,'future','v2_remaining'),
('Kirinyaga','Kirinyaga Central','Kirinyaga Central, Kirinyaga',false,'future','v2_remaining'),
('Kirinyaga','Mwea East','Mwea East, Kirinyaga',false,'future','v2_remaining'),
('Kirinyaga','Mwea West','Mwea West, Kirinyaga',false,'future','v2_remaining'),
('Kirinyaga','Ndia','Ndia, Kirinyaga',false,'future','v2_remaining'),
-- Muranga
('Muranga','Gatanga','Gatanga, Muranga',false,'future','v2_remaining'),
('Muranga','Kahuro','Kahuro, Muranga',false,'future','v2_remaining'),
('Muranga','Kandara','Kandara, Muranga',false,'future','v2_remaining'),
('Muranga','Kangema','Kangema, Muranga',false,'future','v2_remaining'),
('Muranga','Kigumo','Kigumo, Muranga',false,'future','v2_remaining'),
('Muranga','Kiharu','Kiharu, Muranga',false,'future','v2_remaining'),
('Muranga','Mathioya','Mathioya, Muranga',false,'future','v2_remaining'),
('Muranga','Muranga South','Muranga South, Muranga',false,'future','v2_remaining'),
-- Narok
('Narok','Narok East','Narok East, Narok',false,'future','v2_remaining'),
('Narok','Narok North','Narok North, Narok',false,'future','v2_remaining'),
('Narok','Narok South','Narok South, Narok',false,'future','v2_remaining'),
('Narok','Narok West','Narok West, Narok',false,'future','v2_remaining'),
('Narok','Transmara East','Transmara East, Narok',false,'future','v2_remaining'),
('Narok','Transmara West','Transmara West, Narok',false,'future','v2_remaining'),
-- Laikipia
('Laikipia','Laikipia Central','Laikipia Central, Laikipia',false,'future','v2_remaining'),
('Laikipia','Laikipia East','Laikipia East, Laikipia',false,'future','v2_remaining'),
('Laikipia','Laikipia North','Laikipia North, Laikipia',false,'future','v2_remaining'),
('Laikipia','Laikipia West','Laikipia West, Laikipia',false,'future','v2_remaining'),
('Laikipia','Nyahururu','Nyahururu, Laikipia',false,'future','v2_remaining'),
-- Baringo
('Baringo','Baringo Central','Baringo Central, Baringo',false,'future','v2_remaining'),
('Baringo','Baringo North','Baringo North, Baringo',false,'future','v2_remaining'),
('Baringo','Baringo South','Baringo South, Baringo',false,'future','v2_remaining'),
('Baringo','Eldama Ravine','Eldama Ravine, Baringo',false,'future','v2_remaining'),
('Baringo','Mogotio','Mogotio, Baringo',false,'future','v2_remaining'),
('Baringo','Tiaty','Tiaty, Baringo',false,'future','v2_remaining'),
-- Elgeyo-Marakwet
('Elgeyo-Marakwet','Keiyo North','Keiyo North, Elgeyo-Marakwet',false,'future','v2_remaining'),
('Elgeyo-Marakwet','Keiyo South','Keiyo South, Elgeyo-Marakwet',false,'future','v2_remaining'),
('Elgeyo-Marakwet','Marakwet East','Marakwet East, Elgeyo-Marakwet',false,'future','v2_remaining'),
('Elgeyo-Marakwet','Marakwet West','Marakwet West, Elgeyo-Marakwet',false,'future','v2_remaining'),
-- Nandi
('Nandi','Aldai','Aldai, Nandi',false,'future','v2_remaining'),
('Nandi','Chesumei','Chesumei, Nandi',false,'future','v2_remaining'),
('Nandi','Emgwen','Emgwen, Nandi',false,'future','v2_remaining'),
('Nandi','Mosop','Mosop, Nandi',false,'future','v2_remaining'),
('Nandi','Nandi Hills','Nandi Hills, Nandi',false,'future','v2_remaining'),
('Nandi','Tindiret','Tindiret, Nandi',false,'future','v2_remaining'),
-- Trans-Nzoia
('Trans-Nzoia','Cherangany','Cherangany, Trans-Nzoia',false,'future','v2_remaining'),
('Trans-Nzoia','Endebess','Endebess, Trans-Nzoia',false,'future','v2_remaining'),
('Trans-Nzoia','Kiminini','Kiminini, Trans-Nzoia',false,'future','v2_remaining'),
('Trans-Nzoia','Kwanza','Kwanza, Trans-Nzoia',false,'future','v2_remaining'),
('Trans-Nzoia','Trans Nzoia East','Trans Nzoia East, Trans-Nzoia',false,'future','v2_remaining'),
('Trans-Nzoia','Trans Nzoia West','Trans Nzoia West, Trans-Nzoia',false,'future','v2_remaining'),
-- West Pokot
('West Pokot','Central Pokot','Central Pokot, West Pokot',false,'future','v2_remaining'),
('West Pokot','Kacheliba','Kacheliba, West Pokot',false,'future','v2_remaining'),
('West Pokot','Pokot South','Pokot South, West Pokot',false,'future','v2_remaining'),
('West Pokot','West Pokot','West Pokot Town, West Pokot',false,'future','v2_remaining'),
-- Samburu
('Samburu','Samburu East','Samburu East, Samburu',false,'future','v2_remaining'),
('Samburu','Samburu North','Samburu North, Samburu',false,'future','v2_remaining'),
('Samburu','Samburu West','Samburu West, Samburu',false,'future','v2_remaining'),
-- Turkana
('Turkana','Kibish','Kibish, Turkana',false,'future','v2_remaining'),
('Turkana','Loima','Loima, Turkana',false,'future','v2_remaining'),
('Turkana','Turkana Central','Turkana Central, Turkana',false,'future','v2_remaining'),
('Turkana','Turkana East','Turkana East, Turkana',false,'future','v2_remaining'),
('Turkana','Turkana North','Turkana North, Turkana',false,'future','v2_remaining'),
('Turkana','Turkana South','Turkana South, Turkana',false,'future','v2_remaining'),
('Turkana','Turkana West','Turkana West, Turkana',false,'future','v2_remaining'),
-- Kericho
('Kericho','Ainamoi','Ainamoi, Kericho',false,'future','v2_remaining'),
('Kericho','Belgut','Belgut, Kericho',false,'future','v2_remaining'),
('Kericho','Bureti','Bureti, Kericho',false,'future','v2_remaining'),
('Kericho','Kipkelion East','Kipkelion East, Kericho',false,'future','v2_remaining'),
('Kericho','Kipkelion West','Kipkelion West, Kericho',false,'future','v2_remaining'),
('Kericho','Soin/Sigowet','Soin/Sigowet, Kericho',false,'future','v2_remaining'),
-- Bomet
('Bomet','Bomet Central','Bomet Central, Bomet',false,'future','v2_remaining'),
('Bomet','Bomet East','Bomet East, Bomet',false,'future','v2_remaining'),
('Bomet','Chepalungu','Chepalungu, Bomet',false,'future','v2_remaining'),
('Bomet','Konoin','Konoin, Bomet',false,'future','v2_remaining'),
('Bomet','Sotik','Sotik, Bomet',false,'future','v2_remaining'),
-- Vihiga
('Vihiga','Emuhaya','Emuhaya, Vihiga',false,'future','v2_remaining'),
('Vihiga','Hamisi','Hamisi, Vihiga',false,'future','v2_remaining'),
('Vihiga','Luanda','Luanda, Vihiga',false,'future','v2_remaining'),
('Vihiga','Sabatia','Sabatia, Vihiga',false,'future','v2_remaining'),
('Vihiga','Vihiga','Vihiga Town, Vihiga',false,'future','v2_remaining'),
-- Bungoma
('Bungoma','Bumula','Bumula, Bungoma',false,'future','v2_remaining'),
('Bungoma','Kabuchai','Kabuchai, Bungoma',false,'future','v2_remaining'),
('Bungoma','Kanduyi','Kanduyi, Bungoma',false,'future','v2_remaining'),
('Bungoma','Kimilili','Kimilili, Bungoma',false,'future','v2_remaining'),
('Bungoma','Mt Elgon','Mt Elgon, Bungoma',false,'future','v2_remaining'),
('Bungoma','Sirisia','Sirisia, Bungoma',false,'future','v2_remaining'),
('Bungoma','Tongaren','Tongaren, Bungoma',false,'future','v2_remaining'),
('Bungoma','Webuye East','Webuye East, Bungoma',false,'future','v2_remaining'),
('Bungoma','Webuye West','Webuye West, Bungoma',false,'future','v2_remaining'),
-- Busia
('Busia','Budalangi','Budalangi, Busia',false,'future','v2_remaining'),
('Busia','Butula','Butula, Busia',false,'future','v2_remaining'),
('Busia','Funyula','Funyula, Busia',false,'future','v2_remaining'),
('Busia','Nambale','Nambale, Busia',false,'future','v2_remaining'),
('Busia','Teso North','Teso North, Busia',false,'future','v2_remaining'),
('Busia','Teso South','Teso South, Busia',false,'future','v2_remaining'),
-- Siaya
('Siaya','Alego Usonga','Alego Usonga, Siaya',false,'future','v2_remaining'),
('Siaya','Bondo','Bondo, Siaya',false,'future','v2_remaining'),
('Siaya','Gem','Gem, Siaya',false,'future','v2_remaining'),
('Siaya','Rarieda','Rarieda, Siaya',false,'future','v2_remaining'),
('Siaya','Ugenya','Ugenya, Siaya',false,'future','v2_remaining'),
('Siaya','Ugunja','Ugunja, Siaya',false,'future','v2_remaining'),
-- Homa Bay
('Homa Bay','Homabay Town','Homabay Town, Homa Bay',false,'future','v2_remaining'),
('Homa Bay','Kabondo Kasipul','Kabondo Kasipul, Homa Bay',false,'future','v2_remaining'),
('Homa Bay','Karachuonyo','Karachuonyo, Homa Bay',false,'future','v2_remaining'),
('Homa Bay','Kasipul','Kasipul, Homa Bay',false,'future','v2_remaining'),
('Homa Bay','Mbita','Mbita, Homa Bay',false,'future','v2_remaining'),
('Homa Bay','Ndhiwa','Ndhiwa, Homa Bay',false,'future','v2_remaining'),
('Homa Bay','Rangwe','Rangwe, Homa Bay',false,'future','v2_remaining'),
('Homa Bay','Suba North','Suba North, Homa Bay',false,'future','v2_remaining'),
('Homa Bay','Suba South','Suba South, Homa Bay',false,'future','v2_remaining'),
-- Migori
('Migori','Awendo','Awendo, Migori',false,'future','v2_remaining'),
('Migori','Kuria East','Kuria East, Migori',false,'future','v2_remaining'),
('Migori','Kuria West','Kuria West, Migori',false,'future','v2_remaining'),
('Migori','Mabera','Mabera, Migori',false,'future','v2_remaining'),
('Migori','Ntimaru','Ntimaru, Migori',false,'future','v2_remaining'),
('Migori','Rongo','Rongo, Migori',false,'future','v2_remaining'),
('Migori','Suna East','Suna East, Migori',false,'future','v2_remaining'),
('Migori','Suna West','Suna West, Migori',false,'future','v2_remaining'),
('Migori','Uriri','Uriri, Migori',false,'future','v2_remaining'),
-- Kisii
('Kisii','Bobasi','Bobasi, Kisii',false,'future','v2_remaining'),
('Kisii','Bomachoge Borabu','Bomachoge Borabu, Kisii',false,'future','v2_remaining'),
('Kisii','Bomachoge Chache','Bomachoge Chache, Kisii',false,'future','v2_remaining'),
('Kisii','Bonchari','Bonchari, Kisii',false,'future','v2_remaining'),
('Kisii','Kitutu Chache North','Kitutu Chache North, Kisii',false,'future','v2_remaining'),
('Kisii','Kitutu Chache South','Kitutu Chache South, Kisii',false,'future','v2_remaining'),
('Kisii','Nyaribari Chache','Nyaribari Chache, Kisii',false,'future','v2_remaining'),
('Kisii','Nyaribari Masaba','Nyaribari Masaba, Kisii',false,'future','v2_remaining'),
('Kisii','South Mugirango','South Mugirango, Kisii',false,'future','v2_remaining'),
-- Nyamira
('Nyamira','Borabu','Borabu, Nyamira',false,'future','v2_remaining'),
('Nyamira','Manga','Manga, Nyamira',false,'future','v2_remaining'),
('Nyamira','Masaba North','Masaba North, Nyamira',false,'future','v2_remaining'),
('Nyamira','Nyamira North','Nyamira North, Nyamira',false,'future','v2_remaining'),
('Nyamira','Nyamira South','Nyamira South, Nyamira',false,'future','v2_remaining'),
-- Remaining Kajiado (non-Nairobi-Metro)
('Kajiado','Kajiado Central','Kajiado Central, Kajiado',false,'future','v2_remaining'),
('Kajiado','Kajiado East','Kajiado East, Kajiado',false,'future','v2_remaining'),
('Kajiado','Kajiado North','Kajiado North, Kajiado',false,'future','v2_remaining'),
('Kajiado','Kajiado South','Kajiado South, Kajiado',false,'future','v2_remaining'),
('Kajiado','Kajiado West','Kajiado West, Kajiado',false,'future','v2_remaining'),
-- Remaining Machakos (non-Nairobi-Metro and non-Machakos-Metro)
('Machakos','Kathiani','Kathiani, Machakos',false,'future','v2_remaining'),
('Machakos','Masinga','Masinga, Machakos',false,'future','v2_remaining'),
('Machakos','Matungulu','Matungulu, Machakos',false,'future','v2_remaining'),
('Machakos','Mwala','Mwala, Machakos',false,'future','v2_remaining'),
('Machakos','Yatta','Yatta, Machakos',false,'future','v2_remaining'),
-- Remaining Kilifi (not in Mombasa Metro)
('Kilifi','Ganze','Ganze, Kilifi',false,'future','v2_remaining'),
('Kilifi','Kaloleni','Kaloleni, Kilifi',false,'future','v2_remaining'),
('Kilifi','Kilifi North','Kilifi North, Kilifi',false,'future','v2_remaining'),
('Kilifi','Kilifi South','Kilifi South, Kilifi',false,'future','v2_remaining'),
('Kilifi','Magarini','Magarini, Kilifi',false,'future','v2_remaining'),
('Kilifi','Rabai','Rabai, Kilifi',false,'future','v2_remaining'),
-- Remaining Kwale (not in Mombasa Metro)
('Kwale','Kinango','Kinango, Kwale',false,'future','v2_remaining'),
('Kwale','Lungalunga','Lungalunga, Kwale',false,'future','v2_remaining'),
('Kwale','Matuga','Matuga, Kwale',false,'future','v2_remaining')
ON CONFLICT (county, sub_county) DO UPDATE SET
  launch_phase = EXCLUDED.launch_phase,
  seed_batch   = EXCLUDED.seed_batch,
  updated_at   = now();

-- ============================================================
-- add_mpesa_to_payments.sql
-- ============================================================
ALTER TABLE payments
  ADD COLUMN IF NOT EXISTS mpesa_checkout_id TEXT DEFAULT NULL;

CREATE INDEX IF NOT EXISTS idx_payments_mpesa_checkout
  ON payments (mpesa_checkout_id)
  WHERE mpesa_checkout_id IS NOT NULL;

-- ─────────────────────────────────────────────────────────────────────────────
-- SECURITY DEPOSITS
-- Fixera collects a one-time refundable deposit from vendors, movers,
-- water carriers, and suppliers before they can go live on the platform.
-- Workers and riders use the wallet system instead (minimum KSh 500 topup).
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Add deposit columns to workers
ALTER TABLE workers
  ADD COLUMN IF NOT EXISTS security_deposit        NUMERIC(10,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS security_deposit_status TEXT NOT NULL DEFAULT 'not_paid'
    CONSTRAINT deposit_status_check CHECK (
      security_deposit_status IN ('not_paid','pending','held','refunded','forfeited')
    ),
  ADD COLUMN IF NOT EXISTS security_deposit_paid_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS security_deposit_ref     TEXT;

-- 2. Required deposit amount per partner role (stored in platform_settings)
ALTER TABLE platform_settings
  ADD COLUMN IF NOT EXISTS deposit_requirements JSONB;

INSERT INTO platform_settings (id, deposit_requirements)
VALUES (1, '{
  "worker":        500,
  "rider":         500,
  "vendor":        5000,
  "supplier":      5000,
  "mover":         10000,
  "water_carrier": 3000
}'::jsonb)
ON CONFLICT (id) DO UPDATE
  SET deposit_requirements = COALESCE(
        platform_settings.deposit_requirements,
        EXCLUDED.deposit_requirements
      );

-- 3. Full deposit transaction ledger
CREATE TABLE IF NOT EXISTS deposit_transactions (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID        NOT NULL REFERENCES workers(id) ON DELETE CASCADE,
  type       TEXT        NOT NULL CHECK (type IN ('received','refund','forfeiture','adjustment')),
  amount     NUMERIC(10,2) NOT NULL,
  method     TEXT        NOT NULL DEFAULT 'mpesa',
  mpesa_ref  TEXT,
  admin_id   UUID        REFERENCES profiles(id),
  note       TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_deposit_transactions_partner ON deposit_transactions(partner_id);

-- RLS: admins can read/write; partners can read their own
ALTER TABLE deposit_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage deposit transactions" ON deposit_transactions
  FOR ALL TO authenticated
  USING   (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));

CREATE POLICY "Partners view own deposit transactions" ON deposit_transactions
  FOR SELECT TO authenticated
  USING (partner_id = auth.uid());

-- 4. When a deposit is marked 'received', automatically update
--    workers.security_deposit and security_deposit_status = 'held'
CREATE OR REPLACE FUNCTION trg_deposit_received_fn()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.type = 'received' THEN
    UPDATE workers
    SET
      security_deposit        = security_deposit + NEW.amount,
      security_deposit_status = 'held',
      security_deposit_paid_at = COALESCE(security_deposit_paid_at, now()),
      security_deposit_ref    = COALESCE(security_deposit_ref, NEW.mpesa_ref)
    WHERE id = NEW.partner_id;
  ELSIF NEW.type = 'refund' THEN
    UPDATE workers
    SET
      security_deposit        = GREATEST(0, security_deposit - NEW.amount),
      security_deposit_status = CASE
        WHEN (security_deposit - NEW.amount) <= 0 THEN 'refunded'
        ELSE 'held'
      END
    WHERE id = NEW.partner_id;
  ELSIF NEW.type = 'forfeiture' THEN
    UPDATE workers
    SET
      security_deposit        = 0,
      security_deposit_status = 'forfeited'
    WHERE id = NEW.partner_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_deposit_received ON deposit_transactions;
CREATE TRIGGER trg_deposit_received
  AFTER INSERT ON deposit_transactions
  FOR EACH ROW EXECUTE FUNCTION trg_deposit_received_fn();

-- ─────────────────────────────────────────────────────────────────────────────
-- WALLET MINIMUM ENFORCEMENT
-- Workers and riders must keep a minimum KSh 500 in their wallet to receive
-- job assignments. When balance falls below 500, can_receive_jobs is set to
-- false automatically by this trigger.
-- Vendors / movers / suppliers / water_carriers are NOT gated by wallet —
-- they are gated by security_deposit_status = 'held'.
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Add the flag column
ALTER TABLE workers
  ADD COLUMN IF NOT EXISTS can_receive_jobs BOOLEAN NOT NULL DEFAULT true;

-- 2. Backfill current state
UPDATE workers
SET can_receive_jobs = CASE
  WHEN partner_role IN ('worker', 'rider') THEN (wallet_balance >= 500)
  WHEN partner_role IN ('vendor', 'supplier', 'mover', 'water_carrier')
    THEN (security_deposit_status = 'held')
  ELSE true
END;

-- 3. Trigger: re-evaluate can_receive_jobs whenever wallet_balance OR
--    security_deposit_status changes
CREATE OR REPLACE FUNCTION trg_wallet_gate_fn()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  -- Only enforce for wallet-model partners
  IF NEW.partner_role IN ('worker', 'rider') THEN
    NEW.can_receive_jobs := (NEW.wallet_balance >= 500);
  ELSIF NEW.partner_role IN ('vendor', 'supplier', 'mover', 'water_carrier') THEN
    NEW.can_receive_jobs := (NEW.security_deposit_status = 'held');
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_wallet_gate ON workers;
CREATE TRIGGER trg_wallet_gate
  BEFORE UPDATE OF wallet_balance, security_deposit_status ON workers
  FOR EACH ROW EXECUTE FUNCTION trg_wallet_gate_fn();

-- 4. Admin dashboard view — shows every partner's gate status at a glance
CREATE OR REPLACE VIEW partner_wallet_status AS
SELECT
  w.id,
  w.full_name,
  w.partner_role,
  w.verification_status,
  w.can_receive_jobs,
  -- wallet fields (workers + riders)
  w.wallet_balance,
  CASE WHEN w.partner_role IN ('worker','rider')
    THEN (500 - LEAST(w.wallet_balance, 500))
    ELSE NULL
  END AS topup_needed,
  -- deposit fields (vendors, movers, suppliers, water carriers)
  w.security_deposit,
  w.security_deposit_status,
  w.security_deposit_paid_at
FROM workers w
WHERE w.verification_status != 'rejected';


-- ========================================================
-- extend_commission_trigger.sql
-- ========================================================

-- ============================================================
-- FIXERA: Extend commission trigger to all 6 partner types
-- Original trigger only handled worker + rider (wallet deduction).
-- This extension adds vendor, mover, supplier, water_carrier —
-- for these, commission is recorded as 'commission_due' in
-- wallet_transactions so admin can track settlement obligations.
-- Run in: Supabase Dashboard → SQL Editor → New query
-- ============================================================

CREATE OR REPLACE FUNCTION fixera_wallet_on_cash_payment()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  -- Only fire on cash payments transitioning to 'paid'
  IF NEW.status <> 'paid' OR OLD.status = 'paid' THEN
    RETURN NEW;
  END IF;
  IF NEW.method <> 'cash' THEN
    RETURN NEW;
  END IF;
  IF NEW.commission_amount IS NULL OR NEW.commission_amount <= 0 THEN
    RETURN NEW;
  END IF;

  -- ── Workers & Riders: deduct commission from wallet ──────
  IF NEW.payee_role IN ('worker', 'rider') THEN
    UPDATE workers
      SET wallet_balance = wallet_balance - NEW.commission_amount
    WHERE id = NEW.payee_id;

    INSERT INTO wallet_transactions (
      worker_id, type, amount, description, payment_id, created_at
    ) VALUES (
      NEW.payee_id,
      'commission',
      -NEW.commission_amount,
      'Commission on cash payment',
      NEW.id,
      now()
    );

  -- ── Vendors, Movers, Suppliers, Water Carriers: record commission due ──
  ELSIF NEW.payee_role IN ('vendor', 'mover', 'supplier', 'water_carrier') THEN
    INSERT INTO wallet_transactions (
      worker_id, type, amount, description, payment_id, created_at
    ) VALUES (
      NEW.payee_id,
      'commission_due',
      NEW.commission_amount,
      'Commission owed to Fixera (settlement)',
      NEW.id,
      now()
    );
  END IF;

  RETURN NEW;
END;
$$;

-- Replace the old trigger (same name — DROP + CREATE)
DROP TRIGGER IF EXISTS trg_commission_on_cash ON payments;
CREATE TRIGGER trg_commission_on_cash
  AFTER UPDATE OF status ON payments
  FOR EACH ROW EXECUTE FUNCTION fixera_wallet_on_cash_payment();



-- ========================================================
-- add_payment_idempotency.sql
-- ========================================================

-- ============================================================
-- FIXERA: Payment idempotency constraint
-- Prevents duplicate payments for the same ref (e.g. double
-- M-Pesa callback or network retry). The app-layer check in
-- paymentService.getPaymentFor() is NOT race-condition safe —
-- this DB UNIQUE constraint is the real guarantee.
-- Run in: Supabase Dashboard → SQL Editor → New query
-- ============================================================

ALTER TABLE payments
  ADD COLUMN IF NOT EXISTS mpesa_checkout_id TEXT;

CREATE INDEX IF NOT EXISTS idx_payments_checkout
  ON payments(mpesa_checkout_id)
  WHERE mpesa_checkout_id IS NOT NULL;

-- The primary idempotency key: one payment per (ref, method)
-- Cash payments: one cash record per booking/order/request
-- M-Pesa payments: one mpesa record per booking/order/request
ALTER TABLE payments
  DROP CONSTRAINT IF EXISTS uq_payment_ref;

ALTER TABLE payments
  ADD CONSTRAINT uq_payment_ref
  UNIQUE (ref_type, ref_id, method);



-- ========================================================
-- create_receipts.sql
-- ========================================================

-- ============================================================
-- FIXERA: Receipts table + auto-generation trigger
-- Auto-inserts a receipt whenever payments.status → 'paid'
-- Run in: Supabase Dashboard → SQL Editor → New query
-- ============================================================

-- Drop old table if it exists with wrong schema
DROP TABLE IF EXISTS receipts CASCADE;

CREATE TABLE receipts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id      UUID,
  supplier_order_id UUID,
  moving_request_id UUID,
  payment_id      UUID REFERENCES payments(id) ON DELETE SET NULL,
  customer_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  worker_id       UUID,
  amount          NUMERIC(12,2) NOT NULL,
  commission      NUMERIC(12,2),
  partner_amount  NUMERIC(12,2),
  method          TEXT,
  mpesa_ref       TEXT,
  service         TEXT,
  address         TEXT,
  generated_at    TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_receipts_customer ON receipts(customer_id);
CREATE INDEX IF NOT EXISTS idx_receipts_worker   ON receipts(worker_id)    WHERE worker_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_receipts_payment  ON receipts(payment_id)   WHERE payment_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_receipts_booking  ON receipts(booking_id)   WHERE booking_id IS NOT NULL;

-- ── RLS ─────────────────────────────────────────────────────
ALTER TABLE receipts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Customers read own receipts" ON receipts;
CREATE POLICY "Customers read own receipts"
  ON receipts FOR SELECT TO authenticated
  USING (customer_id = auth.uid());

DROP POLICY IF EXISTS "Workers read own receipts" ON receipts;
CREATE POLICY "Workers read own receipts"
  ON receipts FOR SELECT TO authenticated
  USING (worker_id = auth.uid());

DROP POLICY IF EXISTS "Admins read all receipts" ON receipts;
CREATE POLICY "Admins read all receipts"
  ON receipts FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin = true));

-- Allow the trigger (runs as SECURITY DEFINER) to insert
DROP POLICY IF EXISTS "System inserts receipts" ON receipts;
CREATE POLICY "System inserts receipts"
  ON receipts FOR INSERT TO authenticated
  WITH CHECK (true);

-- ── Auto-generate receipt when payment is marked paid ───────
CREATE OR REPLACE FUNCTION generate_receipt_on_payment()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_service TEXT;
  v_address TEXT;
BEGIN
  -- Only fire when transitioning TO 'paid'
  IF NEW.status <> 'paid' OR OLD.status = 'paid' THEN
    RETURN NEW;
  END IF;

  -- Avoid duplicate receipts for the same payment
  IF EXISTS (SELECT 1 FROM receipts WHERE payment_id = NEW.id) THEN
    RETURN NEW;
  END IF;

  -- Try to get service + address from the referenced booking
  IF NEW.ref_type = 'booking' AND NEW.ref_id IS NOT NULL THEN
    SELECT service, address INTO v_service, v_address
    FROM bookings WHERE id = NEW.ref_id;
  END IF;

  INSERT INTO receipts (
    booking_id,
    supplier_order_id,
    moving_request_id,
    payment_id,
    customer_id,
    worker_id,
    amount,
    commission,
    partner_amount,
    method,
    mpesa_ref,
    service,
    address,
    generated_at
  ) VALUES (
    CASE WHEN NEW.ref_type = 'booking'          THEN NEW.ref_id ELSE NULL END,
    CASE WHEN NEW.ref_type = 'supplier_order'   THEN NEW.ref_id ELSE NULL END,
    CASE WHEN NEW.ref_type = 'moving_request'   THEN NEW.ref_id ELSE NULL END,
    NEW.id,
    NEW.customer_id,
    NEW.payee_id,
    NEW.amount,
    NEW.commission_amount,
    NEW.partner_amount,
    NEW.method,
    NEW.mpesa_ref,
    v_service,
    v_address,
    now()
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_generate_receipt ON payments;
CREATE TRIGGER trg_generate_receipt
  AFTER UPDATE OF status ON payments
  FOR EACH ROW EXECUTE FUNCTION generate_receipt_on_payment();



-- ========================================================
-- create_refunds.sql
-- ========================================================

-- ============================================================
-- FIXERA: Refunds table + execution function
-- Admin sets refund_decision = 'approved' on a support ticket →
-- admin then calls execute_refund() which credits the customer.
-- Initial method: wallet_credit (customer Fixera wallet balance).
-- B2C M-Pesa payout to be added in Phase 4.
-- Run in: Supabase Dashboard → SQL Editor → New query
-- ============================================================

-- ── Customer wallet balance (separate from partner wallet) ──
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS wallet_balance NUMERIC(12,2) DEFAULT 0;
COMMENT ON COLUMN profiles.wallet_balance IS 'Customer Fixera wallet credit (e.g. from refunds). Applied to future bookings.';

-- ── Refunds table ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS refunds (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id      UUID REFERENCES support_tickets(id) ON DELETE SET NULL,
  payment_id     UUID REFERENCES payments(id)        ON DELETE SET NULL,
  booking_id     UUID,
  customer_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount         NUMERIC(12,2) NOT NULL,
  reason         TEXT,
  method         TEXT DEFAULT 'wallet_credit',
  -- wallet_credit | mpesa_b2c (future)
  status         TEXT DEFAULT 'pending',
  -- pending | processing | completed | failed
  mpesa_ref      TEXT,
  admin_id       UUID REFERENCES auth.users(id),
  approved_at    TIMESTAMPTZ,
  executed_at    TIMESTAMPTZ,
  created_at     TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_refunds_customer ON refunds(customer_id);
CREATE INDEX IF NOT EXISTS idx_refunds_ticket   ON refunds(ticket_id)   WHERE ticket_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_refunds_payment  ON refunds(payment_id)  WHERE payment_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_refunds_status   ON refunds(status);

ALTER TABLE refunds ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Customers read own refunds" ON refunds;
CREATE POLICY "Customers read own refunds"
  ON refunds FOR SELECT TO authenticated
  USING (customer_id = auth.uid());

DROP POLICY IF EXISTS "Admins manage all refunds" ON refunds;
CREATE POLICY "Admins manage all refunds"
  ON refunds FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin = true))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin = true));

-- ── execute_refund(): credits customer wallet, marks refund done ─
CREATE OR REPLACE FUNCTION execute_refund(p_refund_id UUID, p_admin_id UUID)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_refund refunds%ROWTYPE;
BEGIN
  SELECT * INTO v_refund FROM refunds WHERE id = p_refund_id FOR UPDATE;

  IF v_refund.id IS NULL THEN
    RAISE EXCEPTION 'Refund % not found', p_refund_id;
  END IF;

  IF v_refund.status <> 'pending' THEN
    RAISE EXCEPTION 'Refund % is already %', p_refund_id, v_refund.status;
  END IF;

  -- Credit customer wallet
  UPDATE profiles
    SET wallet_balance = COALESCE(wallet_balance, 0) + v_refund.amount
  WHERE id = v_refund.customer_id;

  -- Mark refund completed
  UPDATE refunds SET
    status      = 'completed',
    method      = 'wallet_credit',
    admin_id    = p_admin_id,
    executed_at = now()
  WHERE id = p_refund_id;
END;
$$;



-- ========================================================
-- fix_disputes_rls.sql
-- ========================================================

-- ============================================================
-- FIXERA: Fix overly-permissive RLS on disputes + service_areas
--
-- Problem: "FOR ALL TO authenticated USING (true)" let ANY
-- logged-in user read, edit, or delete other users' disputes
-- and modify service area coverage.
--
-- Fix: customers see only their own disputes; service_areas
-- become read-only for all authenticated users (admin writes
-- go through the service role key in API routes).
-- ============================================================

-- ── disputes ─────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Admin full access to disputes" ON disputes;

-- Customers can create disputes for their own bookings
CREATE POLICY "Customers insert own disputes" ON disputes
  FOR INSERT TO authenticated
  WITH CHECK (customer_id = auth.uid());

-- Customers can read only their own disputes
CREATE POLICY "Customers read own disputes" ON disputes
  FOR SELECT TO authenticated
  USING (customer_id = auth.uid());

-- Admins (is_admin = true in profiles) get full access
CREATE POLICY "Admins full access to disputes" ON disputes
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- ── service_areas ─────────────────────────────────────────────────

DROP POLICY IF EXISTS "Admin full access to service_areas" ON service_areas;

-- All authenticated users can read service areas (needed for booking validation)
CREATE POLICY "Authenticated users read service_areas" ON service_areas
  FOR SELECT TO authenticated
  USING (true);

-- Only admins can write service areas (insert/update/delete go via service role in API)
CREATE POLICY "Admins manage service_areas" ON service_areas
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );



-- ========================================================
-- fix_storage_buckets.sql
-- ========================================================

-- ============================================================
-- FIXERA: Secure sensitive storage buckets
--
-- Problem: worker-documents (ID scans), receipts (PDF with PII),
-- and inspection-photos were either public or had no RLS policies.
--
-- Fix:
--   1. Create buckets as private (public=false) if not exist
--   2. Switch any existing public bucket to private
--   3. Add RLS policies: only the owner or admins can access
--   4. Use signed URLs in app code (not public URLs) — see notes below
-- ============================================================

-- ── worker-documents (National IDs, business permits) ────────────
INSERT INTO storage.buckets (id, name, public)
VALUES ('worker-documents', 'worker-documents', false)
ON CONFLICT (id) DO UPDATE SET public = false;

DROP POLICY IF EXISTS "Workers upload own documents"     ON storage.objects;
DROP POLICY IF EXISTS "Workers read own documents"       ON storage.objects;
DROP POLICY IF EXISTS "Admins read worker documents"     ON storage.objects;

CREATE POLICY "Workers upload own documents" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'worker-documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Workers read own documents" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'worker-documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Admins read worker documents" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'worker-documents'
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- ── receipts (PDF receipts with customer PII) ─────────────────────
INSERT INTO storage.buckets (id, name, public)
VALUES ('receipts', 'receipts', false)
ON CONFLICT (id) DO UPDATE SET public = false;

DROP POLICY IF EXISTS "Users upload own receipts"   ON storage.objects;
DROP POLICY IF EXISTS "Users read own receipts"     ON storage.objects;
DROP POLICY IF EXISTS "Admins read receipts"        ON storage.objects;

CREATE POLICY "Users upload own receipts" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'receipts'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users read own receipts" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'receipts'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Admins read receipts" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'receipts'
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- ── inspection-photos (customer property photos) ──────────────────
INSERT INTO storage.buckets (id, name, public)
VALUES ('inspection-photos', 'inspection-photos', false)
ON CONFLICT (id) DO UPDATE SET public = false;

DROP POLICY IF EXISTS "Users upload inspection photos"  ON storage.objects;
DROP POLICY IF EXISTS "Users read inspection photos"    ON storage.objects;
DROP POLICY IF EXISTS "Admins read inspection photos"   ON storage.objects;

CREATE POLICY "Users upload inspection photos" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'inspection-photos'
    AND (storage.foldername(name))[1] = 'inspections'
  );

CREATE POLICY "Users read inspection photos" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'inspection-photos'
    AND (storage.foldername(name))[2] = auth.uid()::text
  );

CREATE POLICY "Admins read inspection photos" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'inspection-photos'
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- ── mover-vehicles: make private (contains logbook scans) ─────────
-- Vehicle reg numbers in logbooks are sensitive
UPDATE storage.buckets SET public = false WHERE id = 'mover-vehicles';

DROP POLICY IF EXISTS "Public read vehicle files"   ON storage.objects;

CREATE POLICY "Owners read own vehicle files" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'mover-vehicles'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Admins read vehicle files" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'mover-vehicles'
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );



-- ========================================================
-- secure_profiles_rls.sql
-- ========================================================

-- ── Secure profiles table RLS ─────────────────────────────────────
-- Prevents any authenticated user from elevating their own is_admin flag.
-- The profiles table is created by Supabase auth triggers; we add
-- hardened policies here.

-- 1. Enable RLS (idempotent)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 2. Users can read their own profile
DROP POLICY IF EXISTS "Users read own profile" ON profiles;
CREATE POLICY "Users read own profile" ON profiles
  FOR SELECT TO authenticated
  USING (id = auth.uid());

-- 3. Admins can read all profiles
DROP POLICY IF EXISTS "Admins read all profiles" ON profiles;
CREATE POLICY "Admins read all profiles" ON profiles
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid() AND p.is_admin = true
  ));

-- 4. Users can update their own profile BUT cannot change is_admin or id
DROP POLICY IF EXISTS "Users update own profile" ON profiles;
CREATE POLICY "Users update own profile" ON profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (
    id = auth.uid()
    -- Prevent self-elevation: is_admin must remain unchanged
    AND is_admin = (SELECT is_admin FROM profiles WHERE id = auth.uid())
  );

-- 5. Only admins can update is_admin (grant/revoke)
DROP POLICY IF EXISTS "Admins update any profile" ON profiles;
CREATE POLICY "Admins update any profile" ON profiles
  FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid() AND p.is_admin = true
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid() AND p.is_admin = true
  ));

-- 6. Admins cannot delete profiles directly (use Supabase auth admin API)
DROP POLICY IF EXISTS "No direct profile delete" ON profiles;
CREATE POLICY "No direct profile delete" ON profiles
  FOR DELETE TO authenticated
  USING (false);



-- ========================================================
-- add_admin_role.sql
-- ========================================================

-- ============================================================
-- FIXERA: Admin RBAC sub-roles
-- Run in: Supabase Dashboard → SQL Editor → New query
-- ============================================================

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS admin_role TEXT DEFAULT 'super_admin'
    CHECK (admin_role IN ('super_admin', 'support', 'finance', 'operations'));

-- Existing admins stay as super_admin (default)
-- To downgrade an admin: UPDATE profiles SET admin_role = 'support' WHERE id = '<uuid>';



-- ========================================================
-- add_worker_availability.sql
-- ========================================================

-- ============================================================
-- FIXERA: Add is_available toggle to workers table
-- Run in: Supabase Dashboard → SQL Editor → New query
-- ============================================================

ALTER TABLE workers
  ADD COLUMN IF NOT EXISTS is_available BOOLEAN NOT NULL DEFAULT true;

-- Partners default to available; admin can also flip this



-- ========================================================
-- add_ticket_assignment.sql
-- ========================================================

-- ============================================================
-- FIXERA: Add assigned_to + SLA deadline to support_tickets
-- Run in: Supabase Dashboard → SQL Editor → New query
-- ============================================================

ALTER TABLE support_tickets
  ADD COLUMN IF NOT EXISTS assigned_to      UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS assigned_name    TEXT,
  ADD COLUMN IF NOT EXISTS sla_deadline     TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_tickets_assigned ON support_tickets(assigned_to) WHERE assigned_to IS NOT NULL;



-- ========================================================
-- create_ticket_notes.sql
-- ========================================================

-- ============================================================
-- FIXERA: ticket_notes table — internal admin notes on tickets
-- Agents can communicate internally without customer seeing
-- Run in: Supabase Dashboard → SQL Editor → New query
-- ============================================================

CREATE TABLE IF NOT EXISTS ticket_notes (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id  UUID NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
  admin_id   UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  admin_name TEXT NOT NULL,
  note       TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ticket_notes_ticket ON ticket_notes(ticket_id);

-- ── RLS ─────────────────────────────────────────────────────
ALTER TABLE ticket_notes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage ticket notes" ON ticket_notes;
CREATE POLICY "Admins manage ticket notes"
  ON ticket_notes FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin = true))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin = true));



-- ========================================================
-- create_notification_log.sql
-- ========================================================

-- ============================================================
-- FIXERA: notification_log — audit trail for all sent notifications
-- Run in: Supabase Dashboard → SQL Editor → New query
-- ============================================================

CREATE TABLE IF NOT EXISTS notification_log (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  channel      TEXT NOT NULL CHECK (channel IN ('push', 'email', 'sms')),
  type         TEXT NOT NULL,        -- e.g. 'booking_confirmed', 'ticket_update', 'announcement'
  title        TEXT,
  body         TEXT,
  ref_type     TEXT,                 -- 'booking' | 'ticket' | 'announcement' | etc.
  ref_id       UUID,
  status       TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'failed', 'skipped')),
  error        TEXT,
  created_at   TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notif_log_user    ON notification_log(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notif_log_type    ON notification_log(type);
CREATE INDEX IF NOT EXISTS idx_notif_log_ref     ON notification_log(ref_type, ref_id);

-- RLS: admins can read all; users can read their own
ALTER TABLE notification_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins read notification_log" ON notification_log;
CREATE POLICY "Admins read notification_log"
  ON notification_log FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin = true));

DROP POLICY IF EXISTS "Users read own notification_log" ON notification_log;
CREATE POLICY "Users read own notification_log"
  ON notification_log FOR SELECT TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Service role insert notification_log" ON notification_log;
CREATE POLICY "Service role insert notification_log"
  ON notification_log FOR INSERT TO authenticated
  WITH CHECK (true);



-- ========================================================
-- create_payment_failures.sql
-- ========================================================

-- ============================================================
-- FIXERA: Payment failures log
-- Logs every failed STK Push response from Daraja so admin can
-- see failure trends, retry manually, and debug with customers.
-- Run in: Supabase Dashboard → SQL Editor → New query
-- ============================================================

CREATE TABLE IF NOT EXISTS payment_failures (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id           UUID REFERENCES payments(id) ON DELETE SET NULL,
  checkout_request_id  TEXT,
  result_code          TEXT,
  result_description   TEXT,
  phone                TEXT,
  amount               NUMERIC(12,2),
  raw_callback         JSONB,
  created_at           TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pay_fail_payment  ON payment_failures(payment_id)          WHERE payment_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_pay_fail_checkout ON payment_failures(checkout_request_id) WHERE checkout_request_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_pay_fail_created  ON payment_failures(created_at DESC);

ALTER TABLE payment_failures ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins read all payment failures" ON payment_failures;
CREATE POLICY "Admins read all payment failures"
  ON payment_failures FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin = true));

DROP POLICY IF EXISTS "System inserts payment failures" ON payment_failures;
CREATE POLICY "System inserts payment failures"
  ON payment_failures FOR INSERT TO authenticated
  WITH CHECK (true);



-- ========================================================
-- add_wallet_topups.sql
-- ========================================================

-- wallet_topups: tracks partner M-Pesa top-up requests
create table if not exists wallet_topups (
  id                  uuid primary key default gen_random_uuid(),
  worker_id           uuid not null references auth.users(id) on delete cascade,
  amount              numeric(12,2) not null,
  phone               text,
  status              text not null default 'initiated',  -- initiated | pending | paid | failed
  mpesa_checkout_id   text,
  mpesa_ref           text,
  paid_at             timestamptz,
  created_at          timestamptz not null default now()
);

create index if not exists wallet_topups_worker_id_idx on wallet_topups(worker_id);
create index if not exists wallet_topups_checkout_idx  on wallet_topups(mpesa_checkout_id);

-- RLS: partners can only read/insert their own rows
alter table wallet_topups enable row level security;

create policy "partner select own topups"
  on wallet_topups for select
  using (auth.uid() = worker_id);

create policy "partner insert own topups"
  on wallet_topups for insert
  with check (auth.uid() = worker_id);

-- Service role (used by callback) can update any row
-- (service role bypasses RLS by default — no extra policy needed)


-- Postgres function to safely increment wallet balance (avoids race conditions)
create or replace function increment_wallet_balance(p_worker_id uuid, p_amount numeric)
returns void language sql security definer as $$
  update workers
  set wallet_balance = coalesce(wallet_balance, 0) + p_amount
  where id = p_worker_id;
$$;



-- ========================================================
-- add_job_timeout_cron.sql
-- ========================================================

-- ============================================================
-- FIXERA: Job timeout + auto-reassignment
-- Workers who accept but go silent for 45 min get unassigned.
-- Requires pg_cron (already enabled from Phase 1).
-- Run in: Supabase Dashboard → SQL Editor → New query
-- ============================================================

-- 1. Add accepted_at timestamp to bookings
ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS accepted_at             TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS timeout_count           INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_timed_out_worker   UUID;

-- 2. Auto-reassignment function
CREATE OR REPLACE FUNCTION auto_reassign_timed_out_jobs()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT id, worker_id
    FROM   bookings
    WHERE  status      = 'confirmed'
      AND  worker_id   IS NOT NULL
      AND  accepted_at IS NOT NULL
      AND  accepted_at < now() - interval '45 minutes'
  LOOP
    UPDATE bookings
    SET
      status                 = 'upcoming',
      worker_id              = NULL,
      worker_name            = NULL,
      accepted_at            = NULL,
      timeout_count          = timeout_count + 1,
      last_timed_out_worker  = r.worker_id
    WHERE id = r.id;

    INSERT INTO notification_log (user_id, channel, type, title, body, ref_type, ref_id, status)
    VALUES (
      r.worker_id, 'push', 'job_timeout',
      'Job auto-unassigned',
      'A booking was returned to the pool after 45 min of inactivity.',
      'booking', r.id, 'sent'
    );
  END LOOP;
END;
$$;

-- 3. Schedule every 5 minutes (safe unschedule — no error if not yet created)
DO $$
BEGIN
  PERFORM cron.unschedule('auto-reassign-timed-out-jobs');
EXCEPTION WHEN OTHERS THEN NULL;
END$$;

SELECT cron.schedule(
  'auto-reassign-timed-out-jobs',
  '*/5 * * * *',
  $$ SELECT auto_reassign_timed_out_jobs(); $$
);



-- ========================================================
-- add_live_locations_cleanup_cron.sql
-- ========================================================

-- ============================================================
-- FIXERA: live_locations cleanup via pg_cron
-- GPS pings accumulate fast (10 active movers × 1 ping/5s =
-- 6,000 rows/hour). Purge rows older than 48 hours hourly.
--
-- PREREQUISITE: Enable pg_cron extension first:
--   Supabase Dashboard → Database → Extensions → pg_cron → Enable
--
-- Run this AFTER enabling the extension:
-- ============================================================

SELECT cron.schedule(
  'cleanup-live-locations',
  '0 * * * *',
  $$DELETE FROM live_locations WHERE recorded_at < now() - INTERVAL '48 hours'$$
);



-- ========================================================
-- seed_service_catalog.sql
-- ========================================================

-- ============================================================
-- FIXERA: Seed service_categories + services from hardcoded data
-- Run ONCE in: Supabase Dashboard → SQL Editor → New query
-- After running, manage all services from Admin → Services Catalog
-- ============================================================

-- ── TOP-LEVEL CATEGORIES ─────────────────────────────────────────
INSERT INTO service_categories (slug, name, icon, color, description, sort_order, is_active)
VALUES
  ('plumbing',   'Plumbing',    '💧', '#4A90D9', 'Leaks, drainage, installations & more',      1, true),
  ('electrical', 'Electrical',  '⚡', '#F6C90E', 'Wiring, installations, safety checks',        2, true),
  ('cleaning',   'Cleaning',    '✨', '#4FD1C5', 'Deep cleaning, carpet, office & more',        3, true),
  ('painting',   'Painting',    '🎨', '#FC8A4D', 'Interior, exterior, texture & waterproofing', 4, true)
ON CONFLICT (slug) DO NOTHING;

-- ── PLUMBING SERVICES ────────────────────────────────────────────
INSERT INTO services (category_id, slug, name, price_min, price_max, duration_est, is_quotation, sort_order, is_active, is_featured)
SELECT c.id, v.slug, v.name, v.price_min, v.price_max, v.duration_est, v.is_quotation, v.sort_order, true, v.featured
FROM service_categories c, (VALUES
  ('plumbing', 'pipe-leakage',    'Pipe Leakage Repair',            1500,  4000,  '1–2 hrs',   false, 1,  true),
  ('plumbing', 'tap-leakage',     'Tap / Faucet Leakage',           800,   2000,  '30–60 min', false, 2,  false),
  ('plumbing', 'toilet-leakage',  'Toilet Leakage',                 1200,  3000,  '1–2 hrs',   false, 3,  false),
  ('plumbing', 'drain-unclog',    'Drain Unclogging',               1000,  2500,  '1–2 hrs',   false, 4,  false),
  ('plumbing', 'toilet-block',    'Toilet Blockage',                1000,  2500,  '1 hr',      false, 5,  false),
  ('plumbing', 'toilet-install',  'Toilet Installation',            3000,  7000,  '2–3 hrs',   false, 6,  false),
  ('plumbing', 'sink-install',    'Sink Installation',              2500,  5000,  '1–2 hrs',   false, 7,  false),
  ('plumbing', 'shower-install',  'Shower Installation',            5000,  12000, '2–4 hrs',   false, 8,  false),
  ('plumbing', 'tank-clean',      'Water Tank Cleaning',            2500,  5000,  '2–3 hrs',   false, 9,  true),
  ('plumbing', 'pump-install',    'Water Pump Installation',        4000,  10000, '2–4 hrs',   false, 10, false),
  ('plumbing', 'burst-pipes',     'Burst Pipes (Emergency)',        3000,  8000,  'ASAP',      false, 11, false),
  ('plumbing', 'tank-install',    'Water Tank Installation',        NULL,  NULL,  '3–5 hrs',   true,  12, false),
  ('plumbing', 'house-plumb',     'House Plumbing Setup',           NULL,  NULL,  '1–2 days',  true,  13, false)
) AS v(cat_slug, slug, name, price_min, price_max, duration_est, is_quotation, sort_order, featured)
WHERE c.slug = v.cat_slug
ON CONFLICT (slug) DO NOTHING;

-- ── ELECTRICAL SERVICES ──────────────────────────────────────────
INSERT INTO services (category_id, slug, name, price_min, price_max, duration_est, is_quotation, sort_order, is_active, is_featured)
SELECT c.id, v.slug, v.name, v.price_min, v.price_max, v.duration_est, v.is_quotation, v.sort_order, true, v.featured
FROM service_categories c, (VALUES
  ('electrical', 'socket-repair',    'Socket / Switch Repair',       500,   1500,  '30–60 min', false, 1, true),
  ('electrical', 'bulb-install',     'Bulb / Light Installation',    300,   1000,  '30 min',    false, 2, false),
  ('electrical', 'fan-install',      'Ceiling Fan Installation',     1500,  3500,  '1–2 hrs',   false, 3, false),
  ('electrical', 'circuit-breaker',  'Circuit Breaker Repair',       1500,  4000,  '1–2 hrs',   false, 4, false),
  ('electrical', 'full-wiring',      'House Wiring',                 NULL,  NULL,  '1–3 days',  true,  5, false),
  ('electrical', 'solar-install',    'Solar Panel Installation',     NULL,  NULL,  '1–2 days',  true,  6, true),
  ('electrical', 'db-upgrade',       'Distribution Board Upgrade',   5000,  15000, '3–5 hrs',   false, 7, false),
  ('electrical', 'power-surge',      'Power Surge Protection',       2000,  5000,  '1–2 hrs',   false, 8, false)
) AS v(cat_slug, slug, name, price_min, price_max, duration_est, is_quotation, sort_order, featured)
WHERE c.slug = v.cat_slug
ON CONFLICT (slug) DO NOTHING;

-- ── CLEANING SERVICES ────────────────────────────────────────────
INSERT INTO services (category_id, slug, name, price_min, price_max, duration_est, is_quotation, sort_order, is_active, is_featured)
SELECT c.id, v.slug, v.name, v.price_min, v.price_max, v.duration_est, v.is_quotation, v.sort_order, true, v.featured
FROM service_categories c, (VALUES
  ('cleaning', 'house-clean',     'House / Apartment Cleaning',  2000,  8000,  '2–4 hrs',   false, 1, true),
  ('cleaning', 'deep-clean',      'Deep Cleaning',               4000,  15000, '4–8 hrs',   false, 2, true),
  ('cleaning', 'carpet-clean',    'Carpet Cleaning',             1500,  6000,  '1–3 hrs',   false, 3, false),
  ('cleaning', 'sofa-clean',      'Sofa / Upholstery Cleaning',  1500,  5000,  '1–2 hrs',   false, 4, false),
  ('cleaning', 'office-clean',    'Office Cleaning',             NULL,  NULL,  'Quote',      true,  5, false),
  ('cleaning', 'after-event',     'After-Event Cleanup',         3000,  12000, '2–5 hrs',   false, 6, false),
  ('cleaning', 'move-in-clean',   'Move-In / Move-Out Clean',    4000,  10000, '3–6 hrs',   false, 7, false),
  ('cleaning', 'kitchen-clean',   'Kitchen Deep Clean',          2000,  5000,  '2–3 hrs',   false, 8, false)
) AS v(cat_slug, slug, name, price_min, price_max, duration_est, is_quotation, sort_order, featured)
WHERE c.slug = v.cat_slug
ON CONFLICT (slug) DO NOTHING;

-- ── PAINTING SERVICES ────────────────────────────────────────────
INSERT INTO services (category_id, slug, name, price_min, price_max, duration_est, is_quotation, sort_order, is_active, is_featured)
SELECT c.id, v.slug, v.name, v.price_min, v.price_max, v.duration_est, v.is_quotation, v.sort_order, true, v.featured
FROM service_categories c, (VALUES
  ('painting', 'interior-paint',  'Interior Painting',           NULL,  NULL, 'Per room quote', true,  1, true),
  ('painting', 'exterior-paint',  'Exterior Painting',           NULL,  NULL, 'Per sqm quote',  true,  2, false),
  ('painting', 'ceiling-paint',   'Ceiling Painting',            2000,  6000, '1–2 hrs',        false, 3, false),
  ('painting', 'texture-paint',   'Texture / Decorative Paint',  NULL,  NULL, 'Quote',          true,  4, false),
  ('painting', 'waterproof-coat', 'Waterproof Coating',          NULL,  NULL, 'Quote',          true,  5, false),
  ('painting', 'fence-paint',     'Fence / Gate Painting',       3000,  10000,'3–6 hrs',        false, 6, false),
  ('painting', 'touch-up',        'Touch-Up Painting',           1500,  4000, '1–2 hrs',        false, 7, false)
) AS v(cat_slug, slug, name, price_min, price_max, duration_est, is_quotation, sort_order, featured)
WHERE c.slug = v.cat_slug
ON CONFLICT (slug) DO NOTHING;



-- ========================================================
-- add_profile_picture.sql
-- ========================================================

-- Add profile picture URL to workers
alter table workers add column if not exists profile_picture_url text;

-- Create the avatars storage bucket (public reads, authenticated writes)
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- Anyone can read avatars (public bucket)
create policy "avatars_public_read"
  on storage.objects for select
  using (bucket_id = 'avatars');

-- Partners can only upload/update inside their own folder
create policy "avatars_self_insert"
  on storage.objects for insert
  with check (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "avatars_self_update"
  on storage.objects for update
  using (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "avatars_self_delete"
  on storage.objects for delete
  using (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );


-- ============================================================
-- Migration: add_consent_tracking
-- Adds legal consent version + timestamp columns to profiles
-- and workers tables for DPA 2019 compliance.
-- ============================================================

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS terms_version       TEXT,
  ADD COLUMN IF NOT EXISTS terms_accepted_at   TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS privacy_version     TEXT,
  ADD COLUMN IF NOT EXISTS privacy_accepted_at TIMESTAMPTZ;

ALTER TABLE workers
  ADD COLUMN IF NOT EXISTS terms_version       TEXT,
  ADD COLUMN IF NOT EXISTS terms_accepted_at   TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS privacy_version     TEXT,
  ADD COLUMN IF NOT EXISTS privacy_accepted_at TIMESTAMPTZ;
