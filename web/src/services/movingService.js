import { supabase } from '../supabase';
import { ensurePayment } from './paymentService';

async function uploadMovingPhotos(userId, files) {
  const urls = await Promise.all(files.map(async (file) => {
    const path = `moves/${userId}/${Date.now()}_${file.name}`;
    const { error } = await supabase.storage
      .from('moving-photos')
      .upload(path, file);
    if (error) throw error;
    const { data } = supabase.storage
      .from('moving-photos')
      .getPublicUrl(path);
    return data.publicUrl;
  }));
  return urls;
}

export async function createMovingRequest(userId, formData, photoFiles = []) {
  const photoURLs = photoFiles.length > 0
    ? await uploadMovingPhotos(userId, photoFiles)
    : [];

  const { data, error } = await supabase
    .from('moving_requests')
    .insert({
      user_id:         userId,
      pickup_location: formData.pickupLocation,
      destination:     formData.destination,
      property_type:   formData.propertyType,
      photo_urls:      photoURLs,
      inventory:       formData.inventory,
      vehicle_type:    formData.vehicleType,
      moving_date:     formData.movingDate || null,
      notes:           formData.notes || '',
      status:          'awaiting_quotes',
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function getUserMovingRequests(userId) {
  const { data, error } = await supabase
    .from('moving_requests')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function getMovingQuotes(requestId) {
  const { data, error } = await supabase
    .from('moving_quotes')
    .select('*')
    .eq('request_id', requestId)
    .order('price', { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function acceptQuote(requestId, quoteId) {
  const { error: qErr } = await supabase
    .from('moving_quotes')
    .update({ status: 'accepted' })
    .eq('id', quoteId);
  if (qErr) throw qErr;

  const { error: rErr } = await supabase
    .from('moving_requests')
    .update({ status: 'accepted', accepted_quote_id: quoteId, updated_at: new Date().toISOString() })
    .eq('id', requestId);
  if (rErr) throw rErr;
}

export async function declineQuote(quoteId) {
  const { error } = await supabase
    .from('moving_quotes')
    .update({ status: 'declined' })
    .eq('id', quoteId);
  if (error) throw error;
}

export async function getMovingRequest(requestId) {
  const { data, error } = await supabase
    .from('moving_requests')
    .select('*')
    .eq('id', requestId)
    .single();
  if (error) throw error;
  return data;
}

// ── Delivery sign-off (blueprint §13) ───────────────────
// checklist: [{ item, qty, received: bool }] · signature: typed full name
export async function signOffDelivery(requestId, checklist, signature) {
  const { error } = await supabase
    .from('moving_requests')
    .update({
      status:             'completed',
      delivery_checklist: checklist,
      delivery_signature: signature,
      delivery_signed_at: new Date().toISOString(),
      updated_at:         new Date().toISOString(),
    })
    .eq('id', requestId);
  if (error) throw error;

  // Record commission-tracked payment for this move
  try {
    const { data: req } = await supabase
      .from('moving_requests')
      .select('user_id, accepted_quote_id')
      .eq('id', requestId)
      .single();

    if (req?.accepted_quote_id) {
      const { data: quote } = await supabase
        .from('moving_quotes')
        .select('mover_id, price')
        .eq('id', req.accepted_quote_id)
        .single();

      if (quote?.mover_id && quote?.price) {
        await ensurePayment('moving_request', requestId, {
          customerId: req.user_id,
          payeeId:    quote.mover_id,
          payeeRole:  'mover',
          amount:     quote.price,
          method:     'cash',
          status:     'paid',
        });
      }
    }
  } catch (_) {
    // Payment recording failure must not block delivery sign-off
  }
}

export async function reportMovingIssue(requestId, userId, category, description) {
  const { data, error } = await supabase
    .from('moving_support_tickets')
    .insert({
      request_id:       requestId,
      reporter_type:    'customer',
      reporter_user_id: userId,
      category,
      description,
      status:           'open',
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function cancelMovingRequest(requestId) {
  const { error } = await supabase
    .from('moving_requests')
    .update({ status: 'cancelled', updated_at: new Date().toISOString() })
    .eq('id', requestId);
  if (error) throw error;
}
