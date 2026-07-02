// ─────────────────────────────────────────────────────────────────
//  Service Area Service
//  - Area lookup from address text
//  - Active area validation (blocks bookings in inactive areas)
//  - Partner routing (workers in matching area only)
// ─────────────────────────────────────────────────────────────────
import { supabase } from '../supabase';

let _areaCache = null;
let _cacheAt   = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

async function loadAreas() {
  const now = Date.now();
  if (_areaCache && now - _cacheAt < CACHE_TTL) return _areaCache;
  const { data } = await supabase
    .from('service_areas')
    .select('id, county, sub_county, label, is_active, metro, service_radius_km, available_services, launch_phase')
    .order('sort_order');
  _areaCache = data || [];
  _cacheAt   = now;
  return _areaCache;
}

export function clearAreaCache() {
  _areaCache = null;
}

// Match a plain-text address to a known service area.
// Tries sub_county name first, then metro name, then county.
// Returns the area object or null.
export async function matchAddressToArea(addressText) {
  if (!addressText) return null;
  const areas  = await loadAreas();
  const lower  = addressText.toLowerCase();

  // 1. Exact sub_county match (most specific)
  let found = areas.find(a =>
    lower.includes(a.sub_county.toLowerCase())
  );

  // 2. Partial label match (e.g., "Westlands, Nairobi")
  if (!found) {
    found = areas.find(a =>
      lower.includes(a.label.toLowerCase())
    );
  }

  // 3. County-only fallback — picks first active area in that county
  if (!found) {
    found = areas.find(a =>
      lower.includes(a.county.toLowerCase()) && a.is_active
    );
  }

  return found || null;
}

// Returns the matched area OR throws if the area is inactive.
// Call this before creating a booking.
export async function validateServiceArea(addressText) {
  const area = await matchAddressToArea(addressText);

  if (!area) {
    // Unknown area — allow booking but log a warning
    // (prevents hard failure from a missed address keyword)
    console.warn('[ServiceArea] No match for address:', addressText);
    return null;
  }

  if (!area.is_active) {
    throw Object.assign(
      new Error(`Service not yet available in ${area.label}. We're launching there soon!`),
      { code: 'AREA_INACTIVE', area }
    );
  }

  return area;
}

// Fetch all active service areas (for booking form area selector).
export async function getActiveAreas() {
  const areas = await loadAreas();
  return areas.filter(a => a.is_active);
}

// Check if a specific service is available in a given area.
export async function isServiceAvailableInArea(areaId, serviceName) {
  const areas = await loadAreas();
  const area  = areas.find(a => a.id === areaId);
  if (!area || !area.is_active) return false;
  if (!area.available_services || area.available_services.length === 0) return true;
  return area.available_services.includes(serviceName);
}

// Get workers operating in the matched area.
// Uses workers.area (text) matched against sub_county + metro name.
export async function getPartnersInArea(addressText, role) {
  const area = await matchAddressToArea(addressText);
  if (!area || !area.is_active) return [];

  // Build a list of location keywords for this area
  const areaKeywords = [
    area.sub_county,
    area.metro,
    area.county,
  ].filter(Boolean);

  // Fetch online workers of the given role
  const { data: workers } = await supabase
    .from('workers')
    .select('id, full_name, role, area, is_online, last_lat, last_lng')
    .eq('role', role)
    .eq('is_online', true)
    .eq('status', 'approved');

  if (!workers) return [];

  // Filter to workers whose area field matches any of the area keywords
  return workers.filter(w => {
    if (!w.area) return false;
    const wArea = w.area.toLowerCase();
    return areaKeywords.some(k => k && wArea.includes(k.toLowerCase()));
  });
}

// Admin: get real-time stats for a service area (partner + job counts).
export async function getAreaStats(areaId) {
  const area = _areaCache?.find(a => a.id === areaId);
  if (!area) return { partnerCount: 0, activeJobCount: 0 };

  const keywords = [area.sub_county, area.metro, area.county].filter(Boolean);
  const likeClause = keywords.map(k => `area.ilike.%${k}%`).join(',');

  const [{ count: partnerCount }, { count: activeJobCount }] = await Promise.all([
    supabase.from('workers')
      .select('id', { count: 'exact', head: true })
      .or(likeClause),
    supabase.from('bookings')
      .select('id', { count: 'exact', head: true })
      .eq('service_area_id', areaId)
      .in('status', ['upcoming', 'confirmed', 'in_progress']),
  ]);

  return {
    partnerCount: partnerCount || 0,
    activeJobCount: activeJobCount || 0,
  };
}
