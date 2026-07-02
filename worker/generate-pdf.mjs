import PDFDocument from 'pdfkit';
import fs from 'fs';

const doc = new PDFDocument({ margin: 50, size: 'A4' });
const out = fs.createWriteStream('Fixera_Worker_Portal_Documentation.pdf');
doc.pipe(out);

// ── Colours ──
const GOLD   = '#C9A020';
const NAVY   = '#0A0E1A';
const NAVY2  = '#111827';
const SLATE  = '#1E2D45';
const GREY   = '#475569';
const LGREY  = '#94A3B8';
const GREEN  = '#48BB78';
const BLUE   = '#63B3ED';
const RED    = '#FC8181';
const WHITE  = '#FFFFFF';

const PW = doc.page.width  - 100; // usable width

// ─────────────────────────────────────
// HELPERS
// ─────────────────────────────────────
function hLine(y, color = SLATE, opacity = 1) {
  doc.save().opacity(opacity).strokeColor(color).lineWidth(1)
     .moveTo(50, y).lineTo(545, y).stroke().restore();
}

function badge(x, y, text, bg, textColor = WHITE) {
  const pad = 8, th = 16;
  const tw = doc.fontSize(8).widthOfString(text);
  doc.save().roundedRect(x, y, tw + pad * 2, th, 4).fill(bg).restore();
  doc.fillColor(textColor).fontSize(8).font('Helvetica-Bold')
     .text(text, x + pad, y + 3, { lineBreak: false });
}

function sectionTitle(text, y) {
  doc.save()
     .roundedRect(50, y, PW, 28, 6).fill(SLATE).restore();
  doc.fillColor(GOLD).fontSize(11).font('Helvetica-Bold')
     .text(text, 62, y + 8, { lineBreak: false });
  return y + 40;
}

function bullet(text, y, indent = 62) {
  doc.fillColor(GOLD).fontSize(10).font('Helvetica-Bold')
     .text('•', indent - 12, y, { lineBreak: false, width: 10 });
  doc.fillColor(GREY).font('Helvetica').fontSize(10)
     .text(text, indent, y, { width: PW - (indent - 50) });
  return doc.y + 2;
}

function kv(key, val, y) {
  doc.fillColor(LGREY).font('Helvetica-Bold').fontSize(9)
     .text(key + ':', 62, y, { lineBreak: false, width: 120 });
  doc.fillColor('#E8E8E8').font('Helvetica').fontSize(9)
     .text(val, 190, y, { lineBreak: false, width: PW - 140 });
  return y + 16;
}

function pageCard(num, title, y, items) {
  const startY = y;
  const cardH  = 18 + items.length * 14 + 14;
  doc.save().roundedRect(50, startY, PW, cardH, 8)
     .fill(NAVY2).restore();
  doc.save().roundedRect(50, startY, PW, cardH, 8)
     .lineWidth(1).strokeColor(SLATE).stroke().restore();

  // number badge
  doc.save().circle(72, startY + 14, 11).fill(GOLD).restore();
  doc.fillColor(NAVY).font('Helvetica-Bold').fontSize(9)
     .text(String(num), 68, startY + 9, { lineBreak: false });

  doc.fillColor(WHITE).font('Helvetica-Bold').fontSize(11)
     .text(title, 90, startY + 8, { lineBreak: false });

  let cy = startY + 26;
  for (const item of items) {
    doc.fillColor(GOLD).fontSize(8).font('Helvetica-Bold')
       .text('›', 66, cy, { lineBreak: false });
    doc.fillColor(GREY).font('Helvetica').fontSize(9)
       .text(item, 78, cy, { lineBreak: false, width: PW - 40 });
    cy += 14;
  }
  return startY + cardH + 10;
}

// ─────────────────────────────────────
// PAGE 1 — COVER
// ─────────────────────────────────────
// Dark background
doc.save().rect(0, 0, doc.page.width, doc.page.height).fill(NAVY).restore();

// Gold accent bar top
doc.save().rect(0, 0, doc.page.width, 6).fill(GOLD).restore();

// Gold circle decoration
doc.save().opacity(0.07).circle(480, 120, 180).fill(GOLD).restore();
doc.save().opacity(0.05).circle(100, 680, 140).fill(GOLD).restore();

// Wrench icon box
doc.save().roundedRect(195, 90, 80, 80, 18).fill(GOLD).restore();
doc.fillColor(NAVY).font('Helvetica-Bold').fontSize(42)
   .text('W', 222, 113, { lineBreak: false });

// Title
doc.fillColor(GOLD).font('Helvetica-Bold').fontSize(32)
   .text('FIXERA', 50, 200, { align: 'center', width: PW });
doc.fillColor(WHITE).font('Helvetica-Bold').fontSize(18)
   .text('Worker Portal', 50, 240, { align: 'center', width: PW });

// Subtitle line
doc.save().opacity(0.3).moveTo(150, 272).lineTo(400, 272)
   .strokeColor(GOLD).lineWidth(1).stroke().restore();

doc.fillColor(LGREY).font('Helvetica').fontSize(11)
   .text('Technical Documentation & Feature Overview', 50, 282, { align: 'center', width: PW });

// Info pills
const pills = [
  { label: 'React 18 + Vite', x: 100 },
  { label: 'Supabase', x: 222 },
  { label: 'Port 5175', x: 318 },
];
for (const p of pills) {
  const w = doc.fontSize(9).widthOfString(p.label) + 20;
  doc.save().roundedRect(p.x, 318, w, 20, 10)
     .fill('rgba(201,160,32,0.15)').restore();
  doc.save().roundedRect(p.x, 318, w, 20, 10)
     .lineWidth(1).strokeColor(GOLD).stroke().restore();
  doc.fillColor(GOLD).font('Helvetica-Bold').fontSize(9)
     .text(p.label, p.x + 10, 323, { lineBreak: false });
}

// Separator
doc.save().opacity(0.2).moveTo(50, 360).lineTo(545, 360)
   .strokeColor(SLATE).lineWidth(1).stroke().restore();

// Quick stats
const stats = [
  { val: '8', label: 'Pages Built' },
  { val: '2', label: 'DB Tables' },
  { val: '1', label: 'Shared DB' },
  { val: '85%', label: 'Worker Cut' },
];
const sw = PW / 4;
for (let i = 0; i < stats.length; i++) {
  const sx = 50 + i * sw;
  doc.fillColor(GOLD).font('Helvetica-Bold').fontSize(28)
     .text(stats[i].val, sx, 385, { width: sw, align: 'center' });
  doc.fillColor(LGREY).font('Helvetica').fontSize(9)
     .text(stats[i].label, sx, 418, { width: sw, align: 'center' });
}

// Description box
doc.save().roundedRect(50, 450, PW, 65, 10).fill(NAVY2).restore();
doc.save().roundedRect(50, 450, PW, 65, 10)
   .lineWidth(1).strokeColor(SLATE).stroke().restore();
doc.fillColor(LGREY).font('Helvetica').fontSize(10)
   .text(
     'The Fixera Worker Portal is a standalone web application built for home service professionals ' +
     '(plumbers, electricians, cleaners, painters) operating in Nairobi, Kenya. It connects seamlessly ' +
     'with the Fixera customer app through a shared Supabase database, enabling real-time job management.',
     64, 463, { width: PW - 28, lineGap: 3 }
   );

// Footer
doc.save().rect(0, doc.page.height - 40, doc.page.width, 40).fill('#050810').restore();
doc.fillColor(LGREY).font('Helvetica').fontSize(9)
   .text('Fixera Worker Portal  ·  v1.0.0  ·  2025  ·  Nairobi, Kenya', 50, doc.page.height - 26,
         { align: 'center', width: PW });

// ─────────────────────────────────────
// PAGE 2 — PROJECT STRUCTURE & TECH
// ─────────────────────────────────────
doc.addPage({ margin: 50 });
doc.save().rect(0, 0, doc.page.width, doc.page.height).fill(NAVY).restore();
doc.save().rect(0, 0, doc.page.width, 6).fill(GOLD).restore();

// Page header
doc.fillColor(GOLD).font('Helvetica-Bold').fontSize(18).text('Project Structure', 50, 30);
hLine(58, SLATE);

// Tech stack row
let cy = 70;
cy = sectionTitle('Tech Stack', cy);

const techs = [
  { name: 'React 18', desc: 'UI framework — component-based frontend' },
  { name: 'Vite 5',   desc: 'Build tool — fast dev server on port 5175' },
  { name: 'React Router DOM', desc: 'Client-side routing between pages' },
  { name: 'Supabase', desc: 'Backend — auth, PostgreSQL database, real-time' },
  { name: 'PDFKit',   desc: 'Used to generate this documentation file' },
];
for (const t of techs) {
  doc.fillColor(WHITE).font('Helvetica-Bold').fontSize(10)
     .text(t.name, 62, cy, { lineBreak: false, width: 150 });
  doc.fillColor(GREY).font('Helvetica').fontSize(10)
     .text(t.desc, 220, cy, { lineBreak: false, width: PW - 170 });
  cy += 18;
}

cy += 10;
cy = sectionTitle('File & Folder Structure', cy);

// File tree
const tree = [
  { indent: 0, text: 'fixera-worker/',       color: GOLD,  bold: true  },
  { indent: 1, text: 'src/',                  color: BLUE,  bold: true  },
  { indent: 2, text: 'pages/',               color: LGREY, bold: false },
  { indent: 3, text: 'auth/',                color: LGREY, bold: false },
  { indent: 4, text: 'LoginPage.jsx',        color: WHITE, bold: false },
  { indent: 4, text: 'RegisterPage.jsx',     color: WHITE, bold: false },
  { indent: 3, text: 'main/',               color: LGREY,  bold: false },
  { indent: 4, text: 'DashboardPage.jsx',    color: WHITE, bold: false },
  { indent: 4, text: 'JobDetailPage.jsx',    color: WHITE, bold: false },
  { indent: 4, text: 'ActiveJobPage.jsx',    color: WHITE, bold: false },
  { indent: 4, text: 'HistoryPage.jsx',      color: WHITE, bold: false },
  { indent: 4, text: 'EarningsPage.jsx',     color: WHITE, bold: false },
  { indent: 4, text: 'ProfilePage.jsx',      color: WHITE, bold: false },
  { indent: 2, text: 'components/',          color: LGREY, bold: false },
  { indent: 3, text: 'Layout.jsx',           color: WHITE, bold: false },
  { indent: 3, text: 'ProtectedRoute.jsx',   color: WHITE, bold: false },
  { indent: 2, text: 'hooks/',              color: LGREY,  bold: false },
  { indent: 3, text: 'useAuth.jsx',          color: WHITE, bold: false },
  { indent: 3, text: 'useTheme.js',          color: WHITE, bold: false },
  { indent: 2, text: 'supabase.js',          color: GREEN, bold: false },
  { indent: 2, text: 'theme.js',             color: GREEN, bold: false },
  { indent: 2, text: 'index.css',            color: GREEN, bold: false },
  { indent: 1, text: 'vite.config.js',       color: LGREY, bold: false },
  { indent: 1, text: 'package.json',         color: LGREY, bold: false },
];

// Code box
const treeH = tree.length * 14 + 16;
doc.save().roundedRect(50, cy, PW, treeH, 8).fill(NAVY2).restore();
doc.save().roundedRect(50, cy, PW, treeH, 8)
   .lineWidth(1).strokeColor(SLATE).stroke().restore();

let ty = cy + 10;
for (const node of tree) {
  const prefix = '  '.repeat(node.indent);
  const connector = node.indent > 0 ? '├─ ' : '';
  doc.fillColor(node.color)
     .font(node.bold ? 'Helvetica-Bold' : 'Helvetica-Oblique')
     .fontSize(9)
     .text(prefix + connector + node.text, 60, ty, { lineBreak: false });
  ty += 14;
}

// Footer
doc.save().rect(0, doc.page.height - 30, doc.page.width, 30).fill('#050810').restore();
doc.fillColor(LGREY).font('Helvetica').fontSize(8)
   .text('2', 50, doc.page.height - 18, { align: 'center', width: PW });

// ─────────────────────────────────────
// PAGE 3 — DATABASE DESIGN
// ─────────────────────────────────────
doc.addPage({ margin: 50 });
doc.save().rect(0, 0, doc.page.width, doc.page.height).fill(NAVY).restore();
doc.save().rect(0, 0, doc.page.width, 6).fill(GOLD).restore();

doc.fillColor(GOLD).font('Helvetica-Bold').fontSize(18).text('Database Design', 50, 30);
hLine(58, SLATE);

cy = 70;
cy = sectionTitle('Supabase Database — Same Project as Customer App', cy);

// Workers table card
doc.save().roundedRect(50, cy, PW, 200, 10).fill(NAVY2).restore();
doc.save().roundedRect(50, cy, PW, 200, 10)
   .lineWidth(1.5).strokeColor(GOLD).stroke().restore();

doc.fillColor(GOLD).font('Helvetica-Bold').fontSize(13)
   .text('workers', 68, cy + 14);
doc.fillColor(LGREY).font('Helvetica').fontSize(9)
   .text('New table — stores professional profiles', 68, cy + 32);

hLine(cy + 46, SLATE, 0.5);

const workerFields = [
  { col: 'id',         type: 'UUID',      note: 'Primary key — references auth.users' },
  { col: 'full_name',  type: 'TEXT',      note: 'Worker\'s full name' },
  { col: 'email',      type: 'TEXT',      note: 'Login email' },
  { col: 'phone',      type: 'TEXT',      note: 'M-Pesa phone number for payouts' },
  { col: 'service',    type: 'TEXT',      note: 'Plumbing / Electrical / Cleaning / Painting' },
  { col: 'status',     type: 'TEXT',      note: 'online / offline — updated in real-time' },
  { col: 'rating',     type: 'NUMERIC',   note: 'Default 5.0 — customer ratings' },
  { col: 'total_jobs', type: 'INTEGER',   note: 'Incremented on job completion' },
  { col: 'earnings',   type: 'NUMERIC',   note: 'Gross earnings in KSh' },
  { col: 'created_at', type: 'TIMESTAMPTZ', note: 'Auto timestamp' },
];

let fy = cy + 54;
for (const f of workerFields) {
  doc.fillColor(GREEN).font('Helvetica-Bold').fontSize(9)
     .text(f.col, 62, fy, { lineBreak: false, width: 110 });
  doc.save().roundedRect(178, fy - 1, 74, 13, 3).fill(SLATE).restore();
  doc.fillColor(BLUE).font('Helvetica-Bold').fontSize(8)
     .text(f.type, 182, fy + 1, { lineBreak: false });
  doc.fillColor(LGREY).font('Helvetica').fontSize(8.5)
     .text(f.note, 260, fy, { lineBreak: false });
  fy += 14;
}

cy += 210;

// Bookings table (shared)
doc.save().roundedRect(50, cy, PW, 148, 10).fill(NAVY2).restore();
doc.save().roundedRect(50, cy, PW, 148, 10)
   .lineWidth(1.5).strokeColor(BLUE).stroke().restore();

doc.fillColor(BLUE).font('Helvetica-Bold').fontSize(13)
   .text('bookings', 68, cy + 14);
doc.fillColor(LGREY).font('Helvetica').fontSize(9)
   .text('Shared with customer app — both apps read and write', 68, cy + 32);
hLine(cy + 46, SLATE, 0.5);

const bookingFields = [
  { col: 'id',          type: 'UUID',    note: 'Booking identifier' },
  { col: 'user_id',     type: 'UUID',    note: 'Customer who made the booking' },
  { col: 'worker_id',   type: 'UUID',    note: 'Worker who accepted — NULL until accepted', highlight: true },
  { col: 'worker_name', type: 'TEXT',    note: 'Worker\'s name — set on acceptance', highlight: true },
  { col: 'service',     type: 'TEXT',    note: 'Service category' },
  { col: 'status',      type: 'TEXT',    note: 'upcoming / confirmed / in_progress / completed / cancelled' },
  { col: 'address',     type: 'TEXT',    note: 'Job location' },
  { col: 'booking_date / booking_time', type: 'TEXT', note: 'Scheduled date and time' },
];

fy = cy + 54;
for (const f of bookingFields) {
  const col = f.highlight ? GOLD : GREEN;
  doc.fillColor(col).font('Helvetica-Bold').fontSize(9)
     .text(f.col, 62, fy, { lineBreak: false, width: 110 });
  doc.save().roundedRect(178, fy - 1, 74, 13, 3).fill(SLATE).restore();
  doc.fillColor(BLUE).font('Helvetica-Bold').fontSize(8)
     .text(f.type, 182, fy + 1, { lineBreak: false });
  doc.fillColor(f.highlight ? GOLD : LGREY).font('Helvetica').fontSize(8.5)
     .text(f.note, 260, fy, { lineBreak: false });
  fy += 14;
}

// RLS note
cy += 158;
doc.save().roundedRect(50, cy, PW, 42, 8).fill('rgba(99,179,237,0.08)').restore();
doc.save().roundedRect(50, cy, PW, 42, 8)
   .lineWidth(1).strokeColor(BLUE).stroke().restore();
doc.fillColor(BLUE).font('Helvetica-Bold').fontSize(9)
   .text('Row Level Security (RLS)', 62, cy + 8);
doc.fillColor(LGREY).font('Helvetica').fontSize(9)
   .text('Workers can only manage their own profile row. Bookings table has open read/write for workers to accept and update jobs.', 62, cy + 22, { width: PW - 24 });

// Footer
doc.save().rect(0, doc.page.height - 30, doc.page.width, 30).fill('#050810').restore();
doc.fillColor(LGREY).font('Helvetica').fontSize(8)
   .text('3', 50, doc.page.height - 18, { align: 'center', width: PW });

// ─────────────────────────────────────
// PAGE 4 — HOW THE TWO APPS CONNECT
// ─────────────────────────────────────
doc.addPage({ margin: 50 });
doc.save().rect(0, 0, doc.page.width, doc.page.height).fill(NAVY).restore();
doc.save().rect(0, 0, doc.page.width, 6).fill(GOLD).restore();

doc.fillColor(GOLD).font('Helvetica-Bold').fontSize(18).text('How the Apps Connect', 50, 30);
hLine(58, SLATE);

cy = 70;
cy = sectionTitle('Real-Time Data Flow Between Customer & Worker App', cy);

// Flow steps
const flow = [
  { num: '1', icon: '📱', title: 'Customer Books',       color: GOLD,  desc: 'Customer selects service, picks date/time, confirms booking. Record saved to bookings table with status = "upcoming" and worker_id = NULL.' },
  { num: '2', icon: '🔔', title: 'Worker Sees Job',      color: BLUE,  desc: 'Worker\'s Dashboard (New Jobs tab) queries bookings where worker_id IS NULL and service matches the worker\'s skill. Job appears in real-time.' },
  { num: '3', icon: '✅', title: 'Worker Accepts',       color: GREEN, desc: 'Worker taps Accept. System writes worker_id, worker_name and updates status to "confirmed". The job moves from New Jobs to My Jobs.' },
  { num: '4', icon: '👀', title: 'Customer Notified',    color: GOLD,  desc: 'Customer\'s Booking History and confirmation page now show the worker\'s name and status "confirmed" — professional has been assigned.' },
  { num: '5', icon: '🚗', title: 'Worker Updates Status', color: BLUE, desc: 'Worker progresses through steps: On My Way → Arrived → In Progress → Completed. Each click updates the status field in bookings.' },
  { num: '6', icon: '🎉', title: 'Job Complete',         color: GREEN, desc: 'Status set to "completed". Worker\'s total_jobs increments, earnings updated. Customer sees completed status in their booking history.' },
];

for (const step of flow) {
  const h = 56;
  doc.save().roundedRect(50, cy, PW, h, 8).fill(NAVY2).restore();
  doc.save().roundedRect(50, cy, PW, h, 8).lineWidth(1).strokeColor(SLATE).stroke().restore();
  doc.save().rect(50, cy, 4, h).fill(step.color).restore();

  // Number circle
  doc.save().circle(78, cy + h / 2, 14).fill(step.color).restore();
  doc.fillColor(NAVY).font('Helvetica-Bold').fontSize(11)
     .text(step.num, 74, cy + h / 2 - 7, { lineBreak: false });

  doc.fillColor(WHITE).font('Helvetica-Bold').fontSize(11)
     .text(step.title, 100, cy + 10, { lineBreak: false });
  doc.fillColor(GREY).font('Helvetica').fontSize(9)
     .text(step.desc, 100, cy + 26, { width: PW - 60 });

  cy += h + 8;
}

// Shared DB note
cy += 4;
doc.save().roundedRect(50, cy, PW, 48, 8)
   .fill('rgba(201,160,32,0.06)').restore();
doc.save().roundedRect(50, cy, PW, 48, 8)
   .lineWidth(1).strokeColor(GOLD).stroke().restore();
doc.fillColor(GOLD).font('Helvetica-Bold').fontSize(10)
   .text('Single Source of Truth', 62, cy + 10);
doc.fillColor(LGREY).font('Helvetica').fontSize(9)
   .text('Both apps share one Supabase project (igncnngkbmswomphbhwa). The bookings table acts as the bridge — customers write to it and workers read/update it. No separate API needed.', 62, cy + 24, { width: PW - 24 });

// Footer
doc.save().rect(0, doc.page.height - 30, doc.page.width, 30).fill('#050810').restore();
doc.fillColor(LGREY).font('Helvetica').fontSize(8)
   .text('4', 50, doc.page.height - 18, { align: 'center', width: PW });

// ─────────────────────────────────────
// PAGE 5 — PAGES (Auth + Dashboard)
// ─────────────────────────────────────
doc.addPage({ margin: 50 });
doc.save().rect(0, 0, doc.page.width, doc.page.height).fill(NAVY).restore();
doc.save().rect(0, 0, doc.page.width, 6).fill(GOLD).restore();

doc.fillColor(GOLD).font('Helvetica-Bold').fontSize(18).text('Pages — Auth & Dashboard', 50, 30);
hLine(58, SLATE);

cy = 70;

cy = pageCard(1, 'Login Page  (/login)', cy, [
  'Worker-specific login — separate from the customer app login',
  'Email + password fields with gold focus borders',
  'Error message displayed on invalid credentials',
  'Dark navy background with gold wrench icon branding',
  'Link to Register page for new workers',
  'On success → redirected to /dashboard',
]);

cy = pageCard(2, 'Register Page  (/register)', cy, [
  'Fields: Full Name, Email, Phone (M-Pesa number), Password',
  'Visual service picker grid: Plumbing / Electrical / Cleaning / Painting',
  'Selected service highlighted with gold border',
  'On submit: creates Supabase auth user then inserts into workers table',
  'Confirmation screen shown after successful registration',
  'Worker must confirm email before signing in',
]);

cy = pageCard(3, 'Dashboard Page  (/dashboard)', cy, [
  'Stats row: Total Jobs completed, Total Earnings (KSh), Current Rating',
  'Greeting changes with time of day: Good Morning / Afternoon / Evening',
  'Tab 1 — New Jobs: unassigned bookings matching worker\'s service type',
  'Tab 2 — My Jobs: all bookings where worker_id = current worker',
  'Job cards show: service, address, date, time, customer notes',
  'Accept button on New Jobs tab — one tap claims the job',
  'Refresh button to manually reload the job list',
  'Click any card to go to full Job Detail page',
]);

// Footer
doc.save().rect(0, doc.page.height - 30, doc.page.width, 30).fill('#050810').restore();
doc.fillColor(LGREY).font('Helvetica').fontSize(8)
   .text('5', 50, doc.page.height - 18, { align: 'center', width: PW });

// ─────────────────────────────────────
// PAGE 6 — PAGES (Job Detail + Active)
// ─────────────────────────────────────
doc.addPage({ margin: 50 });
doc.save().rect(0, 0, doc.page.width, doc.page.height).fill(NAVY).restore();
doc.save().rect(0, 0, doc.page.width, 6).fill(GOLD).restore();

doc.fillColor(GOLD).font('Helvetica-Bold').fontSize(18).text('Pages — Job Detail & Active Job', 50, 30);
hLine(58, SLATE);

cy = 70;

cy = pageCard(4, 'Job Detail Page  (/job/:id)', cy, [
  'Full job information: service type, address, date, time, payment, notes',
  'Status banner colour-coded: Gold=upcoming, Blue=confirmed, Green=in_progress, Red=cancelled',
  'Google Maps link — opens navigation to customer address',
  'Accept Job button — shown for unassigned jobs',
  'Start Job button — shown when status is confirmed (changes to in_progress)',
  'View Active Job button — shown when job is already in progress',
  'Cancel Job button — available for confirmed or in-progress jobs',
  'Buttons shown/hidden dynamically based on current job status',
]);

cy = pageCard(5, 'Active Job Page  (/active/:id)', cy, [
  'Visual 5-step progress tracker with icons and connecting lines',
  'Step 1: Job Accepted  |  Step 2: On My Way  |  Step 3: Arrived',
  'Step 4: Job In Progress  |  Step 5: Job Complete',
  'Completed steps shown in green with checkmark',
  'Current step highlighted with gold ring and description',
  'One large action button advances to the next step',
  'Navigate to Customer button opens Google Maps',
  'On completion: total_jobs +1, earnings +1500 KSh written to workers table',
  'Completion celebration screen with green success card',
]);

// Active job step diagram
cy += 5;
doc.save().roundedRect(50, cy, PW, 70, 8).fill(NAVY2).restore();
doc.save().roundedRect(50, cy, PW, 70, 8).lineWidth(1).strokeColor(SLATE).stroke().restore();

doc.fillColor(LGREY).font('Helvetica-Bold').fontSize(8)
   .text('PROGRESS STEPS', 62, cy + 10);

const steps = ['Accepted', 'On My Way', 'Arrived', 'In Progress', 'Complete'];
const colors = [GREEN, GREEN, GOLD, SLATE, SLATE];
const sw2 = (PW - 20) / 5;
for (let i = 0; i < steps.length; i++) {
  const sx = 60 + i * sw2;
  doc.save().circle(sx + sw2 / 2 - 10, cy + 32, 12)
     .fill(colors[i]).restore();
  doc.fillColor(i < 3 ? NAVY : LGREY).font('Helvetica-Bold').fontSize(7)
     .text(i < 2 ? '✓' : i === 2 ? '!' : String(i + 1), sx + sw2 / 2 - 13, cy + 27, { lineBreak: false });
  doc.fillColor(LGREY).font('Helvetica').fontSize(7)
     .text(steps[i], sx, cy + 50, { width: sw2, align: 'center' });
  if (i < 4) {
    doc.save().moveTo(sx + sw2 / 2 + 2, cy + 32)
       .lineTo(sx + sw2 - 8, cy + 32)
       .strokeColor(i < 2 ? GREEN : SLATE).lineWidth(1).stroke().restore();
  }
}

// Footer
doc.save().rect(0, doc.page.height - 30, doc.page.width, 30).fill('#050810').restore();
doc.fillColor(LGREY).font('Helvetica').fontSize(8)
   .text('6', 50, doc.page.height - 18, { align: 'center', width: PW });

// ─────────────────────────────────────
// PAGE 7 — PAGES (History, Earnings, Profile)
// ─────────────────────────────────────
doc.addPage({ margin: 50 });
doc.save().rect(0, 0, doc.page.width, doc.page.height).fill(NAVY).restore();
doc.save().rect(0, 0, doc.page.width, 6).fill(GOLD).restore();

doc.fillColor(GOLD).font('Helvetica-Bold').fontSize(18).text('Pages — History, Earnings & Profile', 50, 30);
hLine(58, SLATE);

cy = 70;

cy = pageCard(6, 'History Page  (/history)', cy, [
  'Summary cards: Jobs Completed count and Jobs Cancelled count',
  'Filter buttons: All / Completed / Cancelled',
  'Job list with colour-coded status badges',
  'Each row shows service, address, date/time',
  'Click any job card to navigate to Job Detail',
]);

cy = pageCard(7, 'Earnings Page  (/earnings)', cy, [
  'Hero card: Total Earnings in KSh (large prominent display)',
  'Period breakdown: This Week earnings and This Month earnings',
  'M-Pesa Payout section: method, registered phone, payout schedule (every Friday)',
  'Commission breakdown: Fixera takes 15%, worker keeps 85%',
  'Recent payments list — last 10 completed jobs at KSh 1,275 each (after fee)',
]);

cy = pageCard(8, 'Profile Page  (/profile)', cy, [
  'Avatar displays service emoji: Plumbing=💧, Electrical=⚡, Cleaning=✨, Painting=🎨',
  'Stats row: Jobs done, Star rating, Total earned (85% of gross)',
  'Edit Profile form: update Full Name and Phone number',
  'Changes saved directly to Supabase workers table',
  'Light / Dark mode toggle — same auto day/night system as customer app',
  'Log Out button — clears Supabase session and redirects to /login',
  'App version: Fixera Worker App v1.0.0',
]);

// Sidebar section
cy += 4;
cy = sectionTitle('Sidebar Navigation (Layout Component)', cy);

const sidebarItems = [
  { icon: '🔧', label: 'Branding', desc: 'Wrench icon + "FIXERA / WORKER APP" label at top' },
  { icon: '👷', label: 'Worker Card', desc: 'Avatar, name, service and online/offline toggle' },
  { icon: '📋', label: 'Jobs', desc: 'Dashboard — job feed' },
  { icon: '🔧', label: 'Active', desc: 'Active job progress tracker' },
  { icon: '📜', label: 'History', desc: 'Past jobs' },
  { icon: '💰', label: 'Earnings', desc: 'Money dashboard' },
  { icon: '👤', label: 'Profile', desc: 'Settings page' },
  { icon: '◀', label: 'Collapse', desc: 'Sidebar collapses to icon-only mode (72px wide)' },
  { icon: '⚫', label: 'Online Toggle', desc: 'Syncs worker status to Supabase in real-time' },
];

for (const item of sidebarItems) {
  doc.fillColor(GOLD).font('Helvetica-Bold').fontSize(10)
     .text(item.icon, 62, cy, { lineBreak: false, width: 22 });
  doc.fillColor(WHITE).font('Helvetica-Bold').fontSize(10)
     .text(item.label, 84, cy, { lineBreak: false, width: 100 });
  doc.fillColor(GREY).font('Helvetica').fontSize(10)
     .text(item.desc, 192, cy, { lineBreak: false });
  cy += 16;
}

// Footer
doc.save().rect(0, doc.page.height - 30, doc.page.width, 30).fill('#050810').restore();
doc.fillColor(LGREY).font('Helvetica').fontSize(8)
   .text('7', 50, doc.page.height - 18, { align: 'center', width: PW });

// ─────────────────────────────────────
// PAGE 8 — DESIGN & SQL SETUP
// ─────────────────────────────────────
doc.addPage({ margin: 50 });
doc.save().rect(0, 0, doc.page.width, doc.page.height).fill(NAVY).restore();
doc.save().rect(0, 0, doc.page.width, 6).fill(GOLD).restore();

doc.fillColor(GOLD).font('Helvetica-Bold').fontSize(18).text('Design System & Setup Guide', 50, 30);
hLine(58, SLATE);

cy = 70;
cy = sectionTitle('Colour Palette', cy);

const colours = [
  { name: 'Gold Primary',   hex: '#C9A020', swatch: '#C9A020' },
  { name: 'Gold Light',     hex: '#D4B033', swatch: '#D4B033' },
  { name: 'Navy Dark',      hex: '#0A0E1A', swatch: '#0A0E1A' },
  { name: 'Navy Mid',       hex: '#111827', swatch: '#111827' },
  { name: 'Navy Border',    hex: '#1E2D45', swatch: '#1E2D45' },
  { name: 'Success Green',  hex: '#48BB78', swatch: '#48BB78' },
  { name: 'Info Blue',      hex: '#63B3ED', swatch: '#63B3ED' },
  { name: 'Danger Red',     hex: '#FC8181', swatch: '#FC8181' },
];

const cols = 4;
const cw = PW / cols;
for (let i = 0; i < colours.length; i++) {
  const cx2 = 50 + (i % cols) * cw;
  const rowY = cy + Math.floor(i / cols) * 46;
  doc.save().roundedRect(cx2 + 4, rowY, cw - 8, 38, 6).fill(NAVY2).restore();
  doc.save().roundedRect(cx2 + 4, rowY, cw - 8, 38, 6)
     .lineWidth(1).strokeColor(SLATE).stroke().restore();
  doc.save().circle(cx2 + 20, rowY + 19, 11).fill(colours[i].swatch).restore();
  doc.fillColor(WHITE).font('Helvetica-Bold').fontSize(8)
     .text(colours[i].name, cx2 + 34, rowY + 8, { lineBreak: false });
  doc.fillColor(LGREY).font('Helvetica').fontSize(7.5)
     .text(colours[i].hex, cx2 + 34, rowY + 21, { lineBreak: false });
}

cy += 102;
cy = sectionTitle('Theme System', cy);
cy = bullet('Dark mode is default — CSS variables in :root (navy backgrounds, light text)', cy);
cy = bullet('Light mode applied via html.light-mode class (white backgrounds, dark text)', cy);
cy = bullet('Auto-switch: Light mode 6am–6pm, Dark mode 6pm–6am (useTheme hook)', cy);
cy = bullet('Manual toggle available on Profile page with animated switch', cy);
cy += 8;

cy = sectionTitle('Supabase Setup SQL', cy);

const sql = `-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS workers (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name   TEXT,
  email       TEXT,
  phone       TEXT,
  service     TEXT,
  status      TEXT DEFAULT 'offline',
  rating      NUMERIC DEFAULT 5.0,
  total_jobs  INTEGER DEFAULT 0,
  earnings    NUMERIC DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE workers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Workers manage own profile"
  ON workers FOR ALL USING (auth.uid() = id);

CREATE POLICY "Bookings visible to workers"
  ON bookings FOR SELECT USING (true);

CREATE POLICY "Workers update bookings"
  ON bookings FOR UPDATE USING (true);`;

const sqlLines = sql.split('\n');
const sqlH = sqlLines.length * 12 + 16;
doc.save().roundedRect(50, cy, PW, sqlH, 8).fill(NAVY2).restore();
doc.save().roundedRect(50, cy, PW, sqlH, 8)
   .lineWidth(1).strokeColor(SLATE).stroke().restore();

let sy = cy + 10;
for (const line of sqlLines) {
  let color = LGREY;
  if (line.trim().startsWith('--'))          color = '#5A7A5A';
  else if (/^(CREATE|ALTER|DROP)/i.test(line.trim())) color = BLUE;
  else if (/^(POLICY|ON|FOR|USING)/i.test(line.trim())) color = GREEN;

  doc.fillColor(color).font('Helvetica').fontSize(8)
     .text(line, 60, sy, { lineBreak: false, width: PW - 20 });
  sy += 12;
}

cy = sy + 14;

// How to run
doc.save().roundedRect(50, cy, PW, 46, 8)
   .fill('rgba(72,187,120,0.07)').restore();
doc.save().roundedRect(50, cy, PW, 46, 8)
   .lineWidth(1).strokeColor(GREEN).stroke().restore();
doc.fillColor(GREEN).font('Helvetica-Bold').fontSize(10)
   .text('To run the Worker Portal', 62, cy + 10);
doc.fillColor(LGREY).font('Helvetica').fontSize(9)
   .text('1. Run the SQL above in Supabase SQL Editor\n2. Open a terminal → cd C:\\fixera-worker → npm run dev\n3. Open http://localhost:5175 in your browser', 62, cy + 24, { width: PW - 24 });

// Footer
doc.save().rect(0, doc.page.height - 30, doc.page.width, 30).fill('#050810').restore();
doc.fillColor(LGREY).font('Helvetica').fontSize(8)
   .text('8', 50, doc.page.height - 18, { align: 'center', width: PW });

// ── Done ──
doc.end();
out.on('finish', () => console.log('PDF saved: Fixera_Worker_Portal_Documentation.pdf'));
out.on('error',  (e) => console.error('Error:', e));
