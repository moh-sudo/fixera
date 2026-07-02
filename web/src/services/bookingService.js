// ─────────────────────────────────────────────
//  Booking Service — Supabase
// ─────────────────────────────────────────────
import { supabase } from '../supabase';
import { validateServiceArea } from './serviceAreaService';

// Generate a random 4-digit OTP
function genOTP() {
  return String(Math.floor(1000 + Math.random() * 9000));
}

// Create a new booking — returns full booking object.
// Throws AREA_INACTIVE if the address is in an inactive service area.
export async function createBooking(userId, data) {
  const arrival_otp    = genOTP();
  const completion_otp = genOTP();

  // Validate service area — blocks bookings in inactive areas
  const area = await validateServiceArea(data.address || '');

  // If customer pre-selected a worker → mark as confirmed immediately
  const status = data.worker_id ? 'confirmed' : 'upcoming';

  const { data: row, error } = await supabase
    .from('bookings')
    .insert({
      ...data,
      user_id:          userId,
      status,
      arrival_otp,
      completion_otp,
      service_area_id:  area?.id ?? null,
    })
    .select()
    .single();
  if (error) throw error;
  return row; // return full row so caller can use row.id, row.arrival_otp etc.
}

const BOOKING_SAFE_COLS = 'id,user_id,worker_id,worker_name,service,sub_service,address,booking_date,booking_time,date,time,status,amount,price,method,notes,arrived_at,completed_at,created_at,updated_at,service_area_id';

// Get all bookings for a user — excludes OTP columns
export async function getUserBookings(userId) {
  const { data, error } = await supabase
    .from('bookings')
    .select(BOOKING_SAFE_COLS)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

// Get a single booking — always scoped to the requesting user, excludes completion_otp
export async function getBooking(bookingId, userId) {
  let query = supabase
    .from('bookings')
    .select(BOOKING_SAFE_COLS + ',arrival_otp')
    .eq('id', bookingId);
  if (userId) query = query.eq('user_id', userId);
  const { data, error } = await query.single();
  if (error) throw error;
  return data;
}

// Update booking status
export async function updateBookingStatus(bookingId, status) {
  const { error } = await supabase
    .from('bookings')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', bookingId);
  if (error) throw error;
}
