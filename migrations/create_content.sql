-- Content Management: Homepage Banners + FAQs

-- Banners (replaces hardcoded PROMOS array in HomePage.jsx)
CREATE TABLE IF NOT EXISTS banners (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title       TEXT NOT NULL,
  subtitle    TEXT,
  tag         TEXT,           -- e.g. "LIMITED OFFER", "NEW SERVICE"
  bg          TEXT NOT NULL DEFAULT 'linear-gradient(135deg,#C9A020,#D4B033)',
  text_color  TEXT NOT NULL DEFAULT '#0A0E1A',
  emoji       TEXT NOT NULL DEFAULT '🎉',
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
