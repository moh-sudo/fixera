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
