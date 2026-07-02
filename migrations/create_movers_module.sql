-- ============================================================
-- FIXERA: Movers Module — Phase 1 MVP tables
-- Blueprint: FIXERA-MOVERS-MODULE-BLUEPRINT.md
-- Run this in: Supabase Dashboard → SQL Editor → New query
-- ============================================================

-- ── Moving requests (customer side) ─────────────────────────
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
  -- awaiting_quotes → quoted → accepted → in_progress → completed | cancelled

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

-- ── Quotations from movers (marketplace) ────────────────────
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

-- ── Storage bucket for moving photos ────────────────────────
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

-- ── Storage bucket for mover crew photos ────────────────────
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

-- ── Moving job support tickets ──────────────────────────────
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

-- ── Row Level Security ───────────────────────────────────────
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
