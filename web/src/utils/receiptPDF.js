import { buildDocumentPDF } from './fixeraDocument';
import { supabase } from '../supabase';

// Generates a branded receipt PDF (reusing the same generator used for
// invoices/quotations elsewhere in the app), uploads it to the public
// `receipts` storage bucket, and caches the URL on the receipts row so
// it's only ever generated once per booking.
export async function generateAndUploadReceipt({ bookingId, receiptId, doc }) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const pdf = await buildDocumentPDF({ type: 'receipt', ...doc });
  const blob = pdf.output('blob');
  const fileName = `${user.id}/${bookingId}.pdf`;

  const { error: uploadError } = await supabase.storage
    .from('receipts')
    .upload(fileName, blob, { contentType: 'application/pdf', upsert: true });
  if (uploadError) {
    console.error('Receipt PDF upload failed:', uploadError.message);
    return null;
  }

  const { data: { publicUrl } } = supabase.storage.from('receipts').getPublicUrl(fileName);

  if (receiptId) {
    await supabase.from('receipts').update({ pdf_url: publicUrl }).eq('id', receiptId);
  }

  return publicUrl;
}
