-- Services Catalog (DB-driven, replaces hardcoded services.js)

CREATE TABLE IF NOT EXISTS service_categories (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug        TEXT UNIQUE NOT NULL,  -- e.g. 'cleaning', 'plumbing'
  name        TEXT NOT NULL,
  icon        TEXT NOT NULL DEFAULT '🔧',
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
