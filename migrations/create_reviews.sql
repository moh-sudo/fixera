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
