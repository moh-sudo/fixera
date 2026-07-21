import { jsPDF } from 'jspdf';
import { supabase } from '../supabase';
import { getLogoDataUrl } from './logoForPdf';

/**
 * Generates a receipt PDF and uploads it to Supabase Storage.
 * Returns the public URL of the uploaded file.
 */
export async function generateAndUploadReceipt(receipt) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const W = 210; // page width

  // ── Light gold header background ──────────────────────────────
  doc.setFillColor(253, 248, 236);
  doc.rect(0, 0, W, 45, 'F');

  // Gold accent bar
  doc.setFillColor(201, 160, 32);
  doc.rect(0, 45, W, 2, 'F');

  // Logo mark
  const logo = await getLogoDataUrl();
  if (logo) doc.addImage(logo, 'PNG', W / 2 - 6, 5, 12, 12);

  // Company name
  doc.setTextColor(201, 160, 32);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('FIXERA', W / 2, 25, { align: 'center' });

  doc.setTextColor(107, 122, 143);
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.text('PROFESSIONAL HOME SERVICES  |  NAIROBI, KENYA', W / 2, 32, { align: 'center' });
  doc.text('support@fixera.africa  |  www.fixera.africa', W / 2, 38, { align: 'center' });

  // ── Receipt title ───────────────────────────────────────────
  doc.setTextColor(26, 26, 46);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('SERVICE RECEIPT', 20, 60);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text(`Receipt No: ${receipt.receipt_no}`, 20, 68);

  const dateStr = new Date(receipt.generated_at || Date.now())
    .toLocaleDateString('en-KE', { day: 'numeric', month: 'long', year: 'numeric' });
  doc.text(`Date: ${dateStr}`, W - 20, 68, { align: 'right' });

  // Completed badge
  doc.setFillColor(72, 187, 120);
  doc.roundedRect(W - 55, 72, 35, 8, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.text('COMPLETED', W - 37.5, 77.5, { align: 'center' });

  // Divider
  doc.setDrawColor(230, 230, 230);
  doc.line(20, 84, W - 20, 84);

  // ── Sections helper ─────────────────────────────────────────
  let y = 94;

  function sectionTitle(title) {
    doc.setFillColor(245, 245, 245);
    doc.rect(20, y - 4, W - 40, 8, 'F');
    doc.setTextColor(201, 160, 32);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text(title.toUpperCase(), 22, y + 1);
    y += 12;
  }

  function row(label, value) {
    doc.setTextColor(120, 120, 120);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(label, 22, y);
    doc.setTextColor(26, 26, 46);
    doc.setFont('helvetica', 'bold');
    doc.text(String(value || '—'), W - 22, y, { align: 'right' });
    doc.setDrawColor(240, 240, 240);
    doc.line(22, y + 2, W - 22, y + 2);
    y += 10;
  }

  // ── Service Details ─────────────────────────────────────────
  sectionTitle('Service Details');
  row('Service',     receipt.sub_service || receipt.service);
  row('Category',    receipt.service);
  row('Date',        receipt.booking_date);
  row('Time',        receipt.booking_time);
  row('Location',    receipt.address);

  y += 4;

  // ── Professional ────────────────────────────────────────────
  sectionTitle('Service Professional');
  row('Name',    receipt.worker_name || 'Assigned by Fixera');
  row('Service', receipt.service);

  y += 4;

  // ── Payment ─────────────────────────────────────────────────
  sectionTitle('Payment Summary');
  row('Payment Method', 'M-Pesa');
  row('Payment Status', 'Settled');

  // Earnings highlight box
  y += 2;
  doc.setFillColor(72, 187, 120, 0.08);
  doc.setDrawColor(72, 187, 120);
  doc.roundedRect(20, y, W - 40, 16, 3, 3, 'FD');
  doc.setTextColor(60, 60, 60);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text('Total Amount', 28, y + 10);
  doc.setTextColor(72, 187, 120);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(`KSh ${Number(receipt.amount || 0).toLocaleString()}`, W - 28, y + 10, { align: 'right' });

  y += 26;

  // ── Reference ───────────────────────────────────────────────
  doc.setFillColor(248, 249, 250);
  doc.rect(20, y, W - 40, 14, 'F');
  doc.setTextColor(150, 150, 150);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.text('BOOKING REFERENCE', 22, y + 5);
  doc.setTextColor(80, 80, 80);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(receipt.booking_id || '—', 22, y + 11);

  // ── Footer ──────────────────────────────────────────────────
  doc.setFillColor(247, 248, 250);
  doc.rect(0, 267, W, 30, 'F');
  doc.setDrawColor(232, 236, 240);
  doc.line(0, 267, W, 267);
  doc.setTextColor(107, 122, 143);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('Thank you for choosing Fixera!', W / 2, 278, { align: 'center' });
  doc.setFontSize(8);
  doc.text('www.fixera.africa  |  support@fixera.africa  |  Nairobi, Kenya', W / 2, 286, { align: 'center' });

  // ── Upload to Supabase Storage ──────────────────────────────
  const pdfBlob = doc.output('blob');
  const { data: { user } } = await supabase.auth.getUser();
  const fileName = `${user.id}/${receipt.booking_id}.pdf`;

  const { error: uploadError } = await supabase.storage
    .from('receipts')
    .upload(fileName, pdfBlob, {
      contentType: 'application/pdf',
      upsert: true,
    });

  if (uploadError) {
    console.error('PDF upload error:', uploadError.message);
    return null;
  }

  const { data: { signedUrl } } = await supabase.storage
    .from('receipts')
    .createSignedUrl(fileName, 60 * 60 * 24 * 365);

  return signedUrl;
}
