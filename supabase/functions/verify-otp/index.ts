// ============================================================
//  Fixera: verify-otp Edge Function
//  Verifies arrival or completion OTP server-side so the OTP
//  value is never sent to the client browser.
//
//  POST body: { bookingId: string, otp: string, type: 'arrival' | 'completion' }
//  Returns:   { valid: boolean, nextStatus?: string }
//
//  Deploy: supabase functions deploy verify-otp
// ============================================================
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  // Verify the caller is authenticated
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return new Response(JSON.stringify({ valid: false, error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { data: { user }, error: authError } = await supabase.auth.getUser(
    authHeader.replace('Bearer ', ''),
  );
  if (authError || !user) {
    return new Response(JSON.stringify({ valid: false, error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let body: { bookingId?: string; otp?: string; type?: string };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ valid: false, error: 'Invalid JSON' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { bookingId, otp, type } = body;

  if (!bookingId || !otp || !['arrival', 'completion'].includes(type || '')) {
    return new Response(JSON.stringify({ valid: false, error: 'bookingId, otp, and type (arrival|completion) required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Fetch OTPs server-side — never exposed to client
  const { data: booking, error: bookingError } = await supabase
    .from('bookings')
    .select('id, user_id, status, arrival_otp, completion_otp')
    .eq('id', bookingId)
    .single();

  if (bookingError || !booking) {
    return new Response(JSON.stringify({ valid: false, error: 'Booking not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Caller must be the booking owner
  if (booking.user_id !== user.id) {
    return new Response(JSON.stringify({ valid: false, error: 'Forbidden' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const isArrival   = type === 'arrival';
  const correctOTP  = isArrival ? booking.arrival_otp : booking.completion_otp;

  if (!correctOTP || otp !== correctOTP) {
    return new Response(JSON.stringify({ valid: false }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // OTP correct — update booking status atomically
  const nextStatus = isArrival ? 'in_progress' : 'completed';
  const timeField  = isArrival ? 'arrived_at'  : 'completed_at';

  const { error: updateError } = await supabase
    .from('bookings')
    .update({ status: nextStatus, [timeField]: new Date().toISOString() })
    .eq('id', bookingId);

  if (updateError) {
    return new Response(JSON.stringify({ valid: false, error: 'Update failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ valid: true, nextStatus }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
