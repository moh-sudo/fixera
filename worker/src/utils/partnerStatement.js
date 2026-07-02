import { jsPDF } from 'jspdf';
import { getLogoDataUrl } from './logoForPdf';

// ─────────────────────────────────────────────────────────────
//  Partner Payout / Earnings Statement (PDF)
//  statement = {
//    partnerName, role, periodLabel,
//    rows: [{ date, detail, gross, commission, net, method }],
//    totals: { gross, commission, net },
//    generatedAt,
//  }
// ─────────────────────────────────────────────────────────────

const ROLE_LABEL = {
  worker: 'Service Worker', mover: 'Mover', water_carrier: 'Water Carrier',
  vendor: 'Vendor', supplier: 'Supplier', rider: 'Rider',
};

export async function buildStatementPDF(s) {
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const W = 210;

  // Header
  pdf.setFillColor(253, 248, 236); pdf.rect(0, 0, W, 40, 'F');
  pdf.setFillColor(72, 187, 120); pdf.rect(0, 40, W, 2, 'F');
  const logo = await getLogoDataUrl();
  if (logo) pdf.addImage(logo, 'PNG', 20, 7, 13, 13);
  pdf.setTextColor(201, 160, 32); pdf.setFontSize(22); pdf.setFont('helvetica', 'bold');
  pdf.text('FIXERA', 37, 18);
  pdf.setTextColor(107, 122, 143); pdf.setFontSize(7.5); pdf.setFont('helvetica', 'normal');
  pdf.text('Partner Earnings & Payout Statement', 37, 26);
  pdf.text('support@fixera.africa  |  www.fixera.africa', 37, 32);

  pdf.setTextColor(10, 22, 40); pdf.setFontSize(16); pdf.setFont('helvetica', 'bold');
  pdf.text('STATEMENT', W - 20, 24, { align: 'right' });

  // Partner + period
  let y = 54;
  pdf.setTextColor(150, 150, 150); pdf.setFontSize(7); pdf.setFont('helvetica', 'bold');
  pdf.text('PARTNER', 20, y);
  pdf.text('PERIOD', W - 80, y);
  y += 6;
  pdf.setTextColor(26, 26, 46); pdf.setFontSize(11); pdf.setFont('helvetica', 'bold');
  pdf.text(s.partnerName || 'Partner', 20, y);
  pdf.setFontSize(10);
  pdf.text(s.periodLabel || 'All time', W - 80, y);
  y += 5;
  pdf.setTextColor(110, 110, 110); pdf.setFontSize(8.5); pdf.setFont('helvetica', 'normal');
  pdf.text(ROLE_LABEL[s.role] || 'Fixera Partner', 20, y);
  pdf.text(`Issued: ${fmt(s.generatedAt)}`, W - 80, y);
  if (s.payoutRef) {
    y += 5;
    pdf.setTextColor(72, 187, 120); pdf.setFontSize(8); pdf.setFont('helvetica', 'bold');
    pdf.text(`Last payout ref: ${s.payoutRef}`, W - 80, y);
    pdf.setTextColor(110, 110, 110); pdf.setFont('helvetica', 'normal');
  }

  // Table header
  y += 12;
  pdf.setFillColor(245, 245, 245); pdf.rect(20, y - 5, W - 40, 9, 'F');
  pdf.setTextColor(120, 120, 120); pdf.setFontSize(7.5); pdf.setFont('helvetica', 'bold');
  pdf.text('DATE', 23, y + 1);
  pdf.text('SERVICE', 44, y + 1);
  pdf.text('GROSS', W - 78, y + 1, { align: 'right' });
  pdf.text('FEE', W - 50, y + 1, { align: 'right' });
  pdf.text('NET', W - 23, y + 1, { align: 'right' });
  y += 11;

  pdf.setFont('helvetica', 'normal'); pdf.setFontSize(8.5);
  (s.rows || []).forEach(r => {
    if (y > 250) { pdf.addPage(); y = 24; }
    pdf.setTextColor(70, 70, 70);
    pdf.text(fmtShort(r.date), 23, y);
    const detail = pdf.splitTextToSize(String(r.detail || '—'), 70);
    pdf.text(detail[0], 44, y);
    pdf.setTextColor(40, 40, 40);
    pdf.text(num(r.gross), W - 78, y, { align: 'right' });
    pdf.setTextColor(246, 130, 80);
    pdf.text(`-${num(r.commission)}`, W - 50, y, { align: 'right' });
    pdf.setTextColor(72, 187, 120);
    pdf.text(num(r.net), W - 23, y, { align: 'right' });
    pdf.setDrawColor(242, 242, 242); pdf.line(23, y + 2.5, W - 23, y + 2.5);
    y += 8;
  });

  if (!s.rows || s.rows.length === 0) {
    pdf.setTextColor(150, 150, 150); pdf.setFontSize(9);
    pdf.text('No completed jobs in this period.', 23, y); y += 8;
  }

  // Totals box
  y += 6;
  pdf.setFillColor(236, 253, 245); pdf.setDrawColor(167, 243, 208);
  pdf.roundedRect(W / 2, y, W / 2 - 20, 30, 2, 2, 'FD');
  const tx = W - 24, lx = W / 2 + 6;
  pdf.setTextColor(107, 122, 143); pdf.setFontSize(9); pdf.setFont('helvetica', 'normal');
  pdf.text('Gross earnings', lx, y + 9);
  pdf.text('Fixera commission', lx, y + 17);
  pdf.setTextColor(10, 22, 40); pdf.setFont('helvetica', 'bold'); pdf.setFontSize(9);
  pdf.text(`KSh ${num(s.totals?.gross)}`, tx, y + 9, { align: 'right' });
  pdf.setTextColor(246, 130, 80);
  pdf.text(`- KSh ${num(s.totals?.commission)}`, tx, y + 17, { align: 'right' });
  pdf.setDrawColor(167, 243, 208); pdf.line(lx, y + 21, tx, y + 21);
  pdf.setTextColor(10, 22, 40); pdf.setFontSize(10);
  pdf.text('NET EARNINGS', lx, y + 27);
  pdf.setTextColor(16, 185, 129); pdf.setFontSize(12);
  pdf.text(`KSh ${num(s.totals?.net)}`, tx, y + 27, { align: 'right' });

  // Footer
  pdf.setFillColor(247, 248, 250); pdf.rect(0, 274, W, 23, 'F');
  pdf.setDrawColor(232, 236, 240); pdf.line(0, 274, W, 274);
  pdf.setTextColor(107, 122, 143); pdf.setFontSize(7.5); pdf.setFont('helvetica', 'normal');
  pdf.text('This statement summarises your Fixera earnings for the period above. Keep it for your records and tax filing.', W / 2, 283, { align: 'center' });
  pdf.text('www.fixera.africa  |  support@fixera.africa  |  Nairobi, Kenya', W / 2, 289, { align: 'center' });

  return pdf;
}

export async function downloadStatement(s) {
  const pdf = await buildStatementPDF(s);
  pdf.save(`Fixera-Statement-${(s.periodLabel||'all').replace(/\s+/g,'-')}.pdf`);
}

// ── Commission Invoice: what the partner OWES Fixera on cash jobs ──
// inv = { partnerName, role, periodLabel, rows:[{date, detail, gross, commission}], totalOwed, generatedAt }
export async function buildCommissionInvoicePDF(inv) {
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const W = 210;

  pdf.setFillColor(253, 248, 236); pdf.rect(0, 0, W, 40, 'F');
  pdf.setFillColor(246, 173, 85); pdf.rect(0, 40, W, 2, 'F');
  const logo = await getLogoDataUrl();
  if (logo) pdf.addImage(logo, 'PNG', 20, 7, 13, 13);
  pdf.setTextColor(201, 160, 32); pdf.setFontSize(22); pdf.setFont('helvetica', 'bold');
  pdf.text('FIXERA', 37, 18);
  pdf.setTextColor(107, 122, 143); pdf.setFontSize(7.5); pdf.setFont('helvetica', 'normal');
  pdf.text('Commission Invoice — amount due to Fixera', 37, 26);
  pdf.text('support@fixera.africa  |  www.fixera.africa', 37, 32);
  pdf.setTextColor(10, 22, 40); pdf.setFontSize(16); pdf.setFont('helvetica', 'bold');
  pdf.text('COMMISSION INVOICE', W - 20, 24, { align: 'right' });

  let y = 54;
  pdf.setTextColor(150,150,150); pdf.setFontSize(7); pdf.setFont('helvetica','bold');
  pdf.text('BILLED TO (PARTNER)', 20, y); pdf.text('PERIOD', W - 80, y); y += 6;
  pdf.setTextColor(26,26,46); pdf.setFontSize(11); pdf.setFont('helvetica','bold');
  pdf.text(inv.partnerName || 'Partner', 20, y);
  pdf.setFontSize(10); pdf.text(inv.periodLabel || 'All time', W - 80, y); y += 5;
  pdf.setTextColor(110,110,110); pdf.setFontSize(8.5); pdf.setFont('helvetica','normal');
  pdf.text(`Issued: ${fmt(inv.generatedAt)}`, W - 80, y);

  y += 10;
  pdf.setTextColor(80,80,80); pdf.setFontSize(9);
  pdf.text('This invoice covers Fixera commission you collected in cash and owe to the Company.', 20, y);

  // Table
  y += 12;
  pdf.setFillColor(245,245,245); pdf.rect(20, y - 5, W - 40, 9, 'F');
  pdf.setTextColor(120,120,120); pdf.setFontSize(7.5); pdf.setFont('helvetica','bold');
  pdf.text('DATE', 23, y + 1); pdf.text('JOB', 44, y + 1);
  pdf.text('GROSS (CASH)', W - 70, y + 1, { align: 'right' });
  pdf.text('COMMISSION', W - 23, y + 1, { align: 'right' });
  y += 11;
  pdf.setFont('helvetica','normal'); pdf.setFontSize(8.5);
  (inv.rows || []).forEach(r => {
    if (y > 250) { pdf.addPage(); y = 24; }
    pdf.setTextColor(70,70,70); pdf.text(fmtShort(r.date), 23, y);
    pdf.text(pdf.splitTextToSize(String(r.detail||'—'), 75)[0], 44, y);
    pdf.setTextColor(40,40,40); pdf.text(num(r.gross), W - 70, y, { align: 'right' });
    pdf.setTextColor(246,130,80); pdf.text(num(r.commission), W - 23, y, { align: 'right' });
    pdf.setDrawColor(242,242,242); pdf.line(23, y + 2.5, W - 23, y + 2.5); y += 8;
  });
  if (!inv.rows || !inv.rows.length) { pdf.setTextColor(150,150,150); pdf.text('No outstanding cash-job commission. You owe nothing — thank you!', 23, y); y += 8; }

  // Total owed
  y += 6;
  pdf.setFillColor(246,173,85); pdf.roundedRect(W/2, y, W/2 - 20, 16, 2, 2, 'F');
  pdf.setTextColor(26,18,5); pdf.setFontSize(10); pdf.setFont('helvetica','normal');
  pdf.text('TOTAL DUE TO FIXERA', W/2 + 6, y + 10);
  pdf.setFontSize(13); pdf.setFont('helvetica','bold');
  pdf.text(`KSh ${num(inv.totalOwed)}`, W - 24, y + 10, { align: 'right' });

  pdf.setFillColor(247,248,250); pdf.rect(0, 274, W, 23, 'F');
  pdf.setDrawColor(232,236,240); pdf.line(0, 274, W, 274);
  pdf.setTextColor(107,122,143); pdf.setFontSize(7.5); pdf.setFont('helvetica','normal');
  pdf.text('Settle this commission via the Fixera app. Outstanding commission may be deducted from your wallet/earnings.', W/2, 283, { align: 'center' });
  pdf.text('www.fixera.africa  |  support@fixera.africa', W/2, 289, { align: 'center' });
  return pdf;
}

export async function downloadCommissionInvoice(inv) {
  const pdf = await buildCommissionInvoicePDF(inv);
  pdf.save(`Fixera-Commission-Invoice-${(inv.periodLabel||'all').replace(/\s+/g,'-')}.pdf`);
}

function num(n) { return Number(n || 0).toLocaleString(); }
function fmt(d) { return new Date(d || Date.now()).toLocaleDateString('en-KE', { day:'numeric', month:'long', year:'numeric' }); }
function fmtShort(d) { return new Date(d || Date.now()).toLocaleDateString('en-KE', { day:'numeric', month:'short' }); }
