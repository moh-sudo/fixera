# 🏗️ FIXERA - MASTER DOCUMENTATION
**Last Updated:** July 3, 2026  
**Status:** EMAIL SYSTEM OVERHAULED — all transactional email was silently broken (serverless fns missing `SUPABASE_URL`/`SUPABASE_SERVICE_ROLE_KEY`); now fixed & proven on BOTH apps via Resend from noreply@fixera.africa ✅ · `fixera.co.ke` → `fixera.africa` everywhere (~24 refs) ✅ · Zoho inboxes support@/partner@/info@/finance@/legal@ created + owner added as member (black hole fixed) ✅ · Partner ticket email alerts + confirmation added ✅ · Partner support UI de-emojified → Lucide ✅ · app.fixera.africa + partners.fixera.africa subdomains LIVE ✅ · Marketing site: Vercel + Google Analytics, real favicon/logo, emoji→Lucide, DNS live ✅ · Supabase Auth SMTP → Resend DONE (signup/reset/magic-link now send from noreply@fixera.africa via smtp.resend.com; verified — reset email arrived branded "Fixera") ✅ · Project now backed up to private GitHub `github.com/moh-sudo/fixera` (auto commit+push established alongside doc updates) ✅ · SPF + DKIM live for fixera.africa (Zoho outbound now authenticated; Resend already was) ✅ · Support/ops contact-center blueprint saved to memory · Agent/Team management system BUILT (admin Team screen, create/list/update/revoke staff via /api/admin-team, Verification/HR + Trust&Safety roles, ticket-assign dropdown) — needs `migrations/extend_admin_roles.sql` run in Supabase ✅ · **PENDING:** run extend_admin_roles.sql, migrate broadcast-announcement.js off Gmail, 8x8 phone layer, workflow automation

---

## 🆕 SESSION SUMMARY (July 2–3, 2026 — Email System Overhaul + Support Operations Blueprint — Session 12)

### The headline: all transactional email was silently broken
Set out to "get the emails working." Discovered via **Vercel runtime logs** (not guessing) that **every transactional email in the customer app was failing before it ever reached Resend**. Root cause: the serverless functions read `process.env.SUPABASE_URL` + `process.env.SUPABASE_SERVICE_ROLE_KEY` (see `web/api/_auth.js`), but only the **`VITE_`-prefixed** frontend versions existed in Vercel — the non-VITE server versions were missing. So `getAdminClient()` threw `Error: supabaseUrl is required` → `requireAuth` 500'd → the email was never attempted. The UI hid it (fire-and-forget, errors swallowed), so it looked like "nothing happened." Fixed by adding `SUPABASE_URL` (public, extracted from the frontend bundle: `https://igncnngkbmswomphbhwa.supabase.co`) + `SUPABASE_SERVICE_ROLE_KEY` (user added via dashboard, kept out of chat) to both projects. **Proven working** — two `POST /api/send-email 200` in logs + real email received.

### Important correction on verification method
Early in the session I reported all email env vars were "EMPTY" based on `vercel env pull`. That was **wrong** — Vercel hides ALL *Sensitive*-marked variable values from pull/CLI (write-only by design). Confirmed by pulling `VITE_SUPABASE_URL` (which the working app obviously has) and seeing it also read empty. Lesson recorded: **you cannot verify Sensitive env var values by reading them — only a live send-test proves them.**

### Consolidated all sending onto Resend (retired Gmail)
Decision: one sending system. The customer app already used **Resend** (`noreply@fixera.africa`); the partner app used **Gmail** (nodemailer). Rewrote `worker/api/send-email.js` from Gmail → Resend (mirrors `web/api/send-email.js` exactly). Added `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` + `RESEND_API_KEY` to the `partner-app` Vercel project. Proven working (statement email + ticket alert both logged `200`, real emails received). Gmail env vars now unused (safe to delete later). NOTE: `web/api/broadcast-announcement.js` still uses Gmail — the one remaining Gmail sender, to migrate later.

### fixera.co.ke → fixera.africa (domain the user actually owns)
`fixera.co.ke` appeared in ~24 places across both apps (support/legal/workers email addresses, PDF receipt/statement footers, Terms pages, admin login placeholder, service fallback URLs) — but the user **only owns `fixera.africa`**. Mail to those `.co.ke` addresses would bounce. Global `sed` replace across `web/src`, `worker/src`, `web/api`, `worker/api`; then deduped the resulting `['@fixera.africa','@fixera.africa']` in both `api/send-email.js` `FIXERA_DOMAINS` allow-lists. Both apps built clean + deployed.

### Zoho inbound mailboxes — the "black hole" fix
Found 4 Zoho **Groups** already existed (`info@`/`support@`/`finance@`/`noreply@`) but **all had 0 members** — meaning mail sent to them reached nobody (address exists so no bounce, but no delivery). Guided the user (Zoho is their account, no API access) to add themselves (`mohamedaminibrahim@fixera.africa`) as a member of `support@`, `info@`, `finance@`, and to **create two new groups**: `partner@fixera.africa` (Partner Support — note SINGULAR; code was aligned from `partners@` → `partner@`) and `legal@fixera.africa` (Legal & Compliance), both Access Level = Everyone. Inbound test **confirmed working** (external Gmail → `support@` → landed in Zoho inbox). `noreply@` intentionally left at 0 members.

### Partner ticket email notifications (NEW feature)
Gap found: **customer** support tickets email the team (`notifySupportTeam` → `support@`), but **partner** tickets only saved to the DB — silent. Added to `worker/src/services/partnerEmailService.js`: `sendPartnerTicketConfirmation()` (to the partner — "we've got your request" + ref) and `notifyPartnerSupportTeam()` (to `partner@fixera.africa` — full ticket details, urgent flagged red). Wired into `worker/src/pages/main/SupportPage.jsx` submit handler (added `.select().single()` to capture the ticket id). Proven working after a hard-refresh (the earlier "no email" was a cached old bundle running pre-feature code — verified via absence of any `send-email` log).

### Partner support UI de-emojified
`worker/src/data/supportCategories.js` had emoji baked into every category label (💰👛📋🚨 etc.) across all 6 roles + emoji department icons. Rewrote it: stripped all emoji from labels, added a Lucide `Icon` field per category + per department. Updated `SupportPage.jsx` to render `<cat.Icon>` in the category cards and `<dept.Icon>` in the "Routes to" badge. Matches the clean Lucide direction used elsewhere.

### Email Support button — no longer a dead tap
Both apps' "Email Support" was a `mailto:` link that silently does nothing on desktop without a mail client. Converted to a **hybrid**: tap copies `support@fixera.africa` to clipboard (shows "Copied ✓") AND fires `mailto:` (opens the mail app on mobile / desktop-with-client). Best of both, never a dead tap.

### Marketing website polish
- **Analytics:** added `@vercel/analytics` (`<Analytics/>`) AND Google Analytics (`G-1998Q2XE8C`, via `next/script`) to `app/layout.tsx`.
- **Subdomains:** `app.fixera.africa` → customer app (`project-xyk3n`), `partners.fixera.africa` → partner app (`partner-app`), both via Vercel domains + A records `76.76.21.21`. Updated `website/app/lib/links.ts` `CUSTOMER_APP_URL`/`PARTNER_APP_URL` to the subdomains.
- **DNS live:** `fixera.africa` + `www` A records added at Namecheap → site live with SSL.
- **Favicon fix:** the tab icon rendered olive-green (Windows `GetHicon()` degrades color depth). Rebuilt using the **real** dark-navy logo emblem cropped from `website/public/logo.png` (icon-only, no wordmark, natural navy background), as a PNG-embedded `.ico` (2.4KB) + `app/icon.png` (192) + `app/apple-icon.png` (180). Browsers render PNG-in-ICO fine (only .NET's `Icon.ToBitmap()` can't preview it).
- **Emoji → Lucide:** installed `lucide-react`; replaced amateur emoji on `become-a-partner/page.tsx` (categories + benefits) and `page.tsx` (Plumbing/Electrical/Cleaning/Painting service icons) with clean gold Lucide icons in rounded tiles.

### Supabase Auth email = the biggest remaining risk (NOW FIXED ✅)
Confirmed in the Supabase dashboard that **Custom SMTP was OFF** — signup-confirmation / password-reset / magic-link emails all used Supabase's **built-in** service (not for production; throttled to a few emails/hour, sends from a `supabase.co` address) — a silent launch blocker for new-user signups. **Fixed:** enabled Custom SMTP in Supabase → Authentication → Emails, pointing at Resend — Host `smtp.resend.com`, Port `465`, Username `resend` (literal word — NOT the Gmail; user initially auto-filled the Gmail, corrected), Password = a dedicated Resend API key named "Supabase SMTP", Sender `noreply@fixera.africa` / `Fixera`, min interval 60s/user. **Verified:** triggered a password reset on app.fixera.africa → email arrived branded **"Fixera"** (built-in would say "Supabase Auth" from supabase.co), confirming it routed through Resend.

### Project backed up to private GitHub
Discovered the project was **not under version control at all** (no git repo, Vercel deploys were direct CLI uploads — code lived only on the local disk). Set up a monorepo at `C:\fixera`, comprehensive root `.gitignore` (excludes `.env*`, `node_modules`, `dist`, `.next`, `.vercel`), verified no secrets staged, pushed to the user's **private** repo `github.com/moh-sudo/fixera` (branch `main`). Auth via Git Credential Manager — a stale cached credential for a wrong account caused repeated "Repository not found" (GitHub returns 404 for private repos when unauthenticated); cleared via `cmdkey /delete:git:https://github.com` then browser-authorized as `moh-sudo`. **Gotcha fixed:** `website/` was its own nested git repo (no remote) so the first commit only stored a gitlink pointer — its 49 files weren't backed up; removed `website/.git` and absorbed the files (final total 499 files: web 228 + worker 129 + website 49 + root docs/migrations). The agent shell can now push directly (stored credential works — `git ls-remote origin` succeeds). **Standing routine (user instruction):** doc update + `git commit && git push` now go together automatically at the end of every Fixera change (memory: `fixera-auto-update-context-doc`).

### SPF / deliverability
Zoho flagged no SPF record on `fixera.africa`. Domain has no root SPF yet; Resend authenticates via its own subdomain + DKIM (no conflict). Guiding user to add TXT `@` = `v=spf1 include:zohomail.com ~all` at Namecheap (Zoho's exact recommended value). DKIM to follow.

### Support / operations blueprint (strategy — saved to memory)
User is building toward a **contact-center operating model** (agents handling departments via calls + email, introducing **8x8** for the phone layer) and wants the structure well-organized BEFORE building workflow automation. Mapped the full operating model (People → Channels → Routing/Automation → Departments → System of Record) and saved it to memory (`fixera-support-ops-blueprint.md`). Key findings on the existing admin RBAC (`web/src/pages/admin/AdminDashboard.jsx` `ROLE_ACCESS`): roles `super_admin`/`support`/`finance`/`operations` exist; ticket assignment exists (`assigned_to`/`assigned_name`/`sla_deadline`) but is a free-text box; **no Team/Agent management UI** (admin_role set manually in Supabase). Gaps to build: Team/Agent management screen, a dedicated **Verification/HR** role (partner-credential vetting, currently bundled in `operations`) and **Trust & Safety** role, then 8x8 IVR (user's tree: route by WHO first — 1 Customer, 2 Partner, 3 Finance→cust/partner, 4 Trust&Safety), then workflow automation LAST. Every complaint (customer + partner) already lands in the Admin Dashboard (`app.fixera.africa/admin` → Support/Dispute Center); Zoho email is the alert layer on top.

### Diagnostics approach
Heavy use of **Vercel runtime logs** (via MCP) to find the *actual* server error instead of guessing — this is what cracked the `supabaseUrl is required` root cause and later proved each channel with real `200`s. Direct `curl` of live `/api/send-email` (401 without auth) confirmed endpoints were correctly deployed.

### Admin dashboard redesign — Phase 1: premium shell (in progress)
User brief: make the admin a true **Operations Command Center** ("what needs my attention right now?"), grouped/collapsible low-scroll sidebar, premium modern-SaaS card look (reference image provided — adapted to Fixera navy+gold, not the reference's purple). Phase 1 shipped: rewrote `web/src/pages/admin/admin.css` into a design system (Inter font, light `#F5F7FB` canvas, rounded 16px cards, soft shadows, navy/gold tokens) which restyles every section's shared classes at once; rebuilt the **shell** in `AdminDashboard.jsx` — white grouped/collapsible sidebar (framer-motion height animation) with Lucide icons (all emoji removed), active = navy pill with gold icon, bottom profile card; regrouped nav into Operations / Support / Partners / Finance / Content / Reports / Platform (section ids unchanged so ROLE_ACCESS + SECTIONS still map); new topbar with section title, global search (Cmd+K), alerts/mail/help buttons, profile dropdown. Also fixed the profiles RLS recursion + admin login (see below). **Next: Phase 2** — the command-center Overview (priority "needs attention" strip, stat cards w/ sparklines, donut, revenue/jobs charts) — then roll the look into remaining sections.

### Login fixes bundled with the admin work (July 5, 2026)
- **profiles RLS infinite recursion** (`migrations/fix_profiles_rls_recursion.sql`): the "Admins read all profiles" policy queried `profiles` from within a `profiles` policy — fine for non-admins (fast false) but **recursed and hung** for admins. This is why admin login went from "Admin profile not found" to an infinite "Logging in…" spinner the instant an account got `is_admin=true`, on every device. Fixed with a `SECURITY DEFINER is_admin_user()` helper. Diagnosed by tracing the login's `try/finally` (can only hang on a never-returning request) + confirming auth/profiles endpoints respond in ~1s.
- **Admin access UX:** `AdminRoute` now redirects logged-out visitors to `/admin/login` (was sending to the customer `/login`); added a dedicated **admin.fixera.africa** subdomain (host redirect in web/vercel.json → /admin/login; A record 76.76.21.21); added **Forgot Password** to the admin login (Supabase reset via Resend); the owner's admin account (`mohamed2002shukri@gmail.com`) had no profiles row — created it as super_admin.
- **Supabase URL config:** Site URL set to `https://app.fixera.africa`; Redirect allow-list = `app.fixera.africa/**`, `partners.fixera.africa/**`, `admin.fixera.africa/**` (both apps share one Supabase project, so auth links were bouncing to the wrong app).

### Agent/Team management system (first block of the support-ops roadmap)
Built the multi-agent support-desk foundation so the owner isn't the only one handling everything. **New files:** `migrations/extend_admin_roles.sql` (widens the `admin_role` CHECK constraint to add `verification` + `trust_safety` — MUST be run in Supabase or creating agents in those roles fails), `web/api/admin-team.js` (server-side, service-role, super_admin-gated: list/create/update_role/revoke agents — `create` uses `supabase.auth.admin.createUser` with `email_confirm:true` then upserts a staff profile `is_admin:true`), `web/src/services/teamService.js` (frontend wrapper + `AGENT_ROLES` list + `roleLabel`). **AdminDashboard.jsx changes:** added `verification` (sees partner-vetting sections) and `trust_safety` (sees support/dispute/fraud) to `ROLE_ACCESS`; added a `team` nav item under Platform (super_admin-only since no sub-role's access set includes it) + `TeamManagementSection` component (add-agent form + roster with per-agent role dropdown + revoke) wired into `SECTIONS`; converted the disputes/support **ticket "Assign"** from a free-text box into a **dropdown of real agents** (queries `profiles where is_admin=true` directly via the client so any admin can assign; sets `assigned_to` = agent's real uuid + `assigned_name`). Build clean, deployed, endpoint live (401 without auth). Roadmap remaining: 8x8 phone/IVR layer, then workflow automation.

---

## 🆕 SESSION SUMMARY (June 30, 2026 — Website Deploy + Real Branding + Honest Stats — Session 11)

### Overview
Worked through the last two open Phase 6 items: 6.7 (deploy website) and 6.8 (real stats, favicon, OG image). Found and fixed several real problems along the way, including one that would have silently blocked deployment.

### 6.8 — Favicon was the wrong logo
`app/favicon.ico` was the **default Vercel/Next.js triangle icon** — confirmed by rendering it to PNG and viewing it. Cropped a clean icon-only version out of the existing full-wordmark `logo-mark.png` (isolated the circular house/F mark from the "FIXERA HOME SERVICES" text below it, located the exact pixel boundary via row-by-row alpha scanning), generated proper sizes, and wired them in via Next.js's native file-based icon convention (`app/icon.png`, `app/apple-icon.png`, `app/favicon.ico`) rather than hand-rolling ICO binary (first attempt at hand-rolling a PNG-embedded ICO produced a corrupt file — `Icon.ToBitmap()` returned garbage noise; switched to .NET's `Bitmap.GetHicon()` → `Icon.FromHandle()` which is the correct, tested API).

### 6.8 — No OG share image
Added `app/opengraph-image.tsx` using Next.js's native `next/og` (`ImageResponse`) — dynamically generates a 1200×630 social card with the real logo, navy/gold brand gradient, "FIXERA" wordmark, and tagline. Added `twitter` card metadata. Caught and fixed a real bug: `metadataBase` wasn't set, so the generated `og:image` URL would have resolved to `localhost:3000` in production — broken link previews on every platform (WhatsApp, X, LinkedIn, Facebook). Verified by extracting the actual built PNG from `.next/server/app/opengraph-image.body` and viewing it — confirmed it renders correctly.

### 6.8 — Fabricated stats (the big one)
Homepage and 5 other pages claimed specific traction numbers — "5,000+ Jobs Completed", "500+ Verified Partners", "4.8★ Average Rating", "thousands of customers", "rated by real customers", "Nairobi's most trusted delivery network", "suppliers recommended and vetted by our customers", "fastest growing platform" — on a platform that has not launched yet and has **zero real partners and no completed jobs** in the database (confirmed in Session 7's live verification). Flagged this to the user explicitly rather than silently rewriting marketing copy — what a company publicly claims is a business/legal decision. User confirmed: replace with honest, defensible claims. Fixed across `page.tsx`, `become-a-partner/page.tsx`, `partners/riders/page.tsx`, `partners/suppliers/page.tsx`, `partners/movers/page.tsx`, `partners/vendors/page.tsx` — replaced fabricated usage/rating numbers with true, verifiable platform facts (4 core services, background-checked partners required at onboarding, M-Pesa payments, mover liability insurance requirement) and softened language that implied an existing customer base into language about the opportunity/access going forward.

### Bonus: production build was completely broken
While verifying, `next build` failed at the TypeScript step — a pre-existing bug (not caused by this session) in 7 files where a shared `fadeUp` framer-motion variants object had `ease: "easeOut"` typed as plain `string` instead of the literal framer-motion expects. This **would have blocked deployment entirely** had it not been caught — `next build` is what Vercel runs. Fixed with `as const` in all 7 files (`page.tsx`, `become-a-partner/page.tsx`, and all 5 `partners/*/page.tsx` files).

### 6.7 — Deployed to Vercel
Deployed via `vercel deploy --prod` — new Vercel project "website" created under the account, live at `https://website-ten-sage-69.vercel.app`. Added both `fixera.africa` and `www.fixera.africa` to the project via `vercel domains add`. **DNS is not yet pointed at Vercel** — the domain is still on its registrar's default nameservers (`dns1/2.registrar-servers.com`, consistent with Namecheap). User needs to add two A records at their registrar: `@` → `76.76.21.21` and `www` → `76.76.21.21`. Vercel auto-detects and issues SSL once DNS propagates — no further action needed on the Vercel side after that.

### Verification
`next build` succeeds clean (no errors, no warnings) after all fixes. Favicon and OG image visually confirmed by rendering and viewing the actual generated files, not just assumed from code.

---

## 🆕 SESSION SUMMARY (June 29, 2026 — Phase 3 Compliance: KRA PIN + Terms Re-acceptance — Session 8)

### 3.4 — Partner KRA PIN storage
`workers.tax_pin` already existed but was only collected from movers (via RegisterPage). Kenyan withholding tax compliance requires it from every partner type. Added a "KRA PIN" field to `OnboardingPage.jsx`'s shared Identity step (applies to all 6 roles), saved on submit alongside the existing ID fields. Updated `AdminDashboard.jsx`'s verification panel — moved the "KRA PIN" row out of the mover-only "Company Information" block into the universal "Identity Documents" card so admins can verify it for every role, not just movers.

### 3.1 — Versioned consent / Terms re-acceptance
Database columns (`terms_version`, `terms_accepted_at`, `privacy_version`, `privacy_accepted_at` on both `profiles` and `workers`) already existed from the earlier consent-tracking migration but were never enforced — signup just wrote a hardcoded `'v1.0'` once and nothing ever checked it again. Built the actual enforcement, mirroring the pattern already used for the Partner Agreement (`AGREEMENT_VERSION` + `ProtectedRoute` redirect):

- **`web/src/data/legalVersions.js`** and **`worker/src/data/legalVersions.js`** — single source of truth: `TERMS_VERSION = 'v1.0'`, `PRIVACY_VERSION = 'v1.0'`. Bump either when TermsPage/PrivacyPage content changes materially, and every existing user gets prompted to re-accept on next login.
- **`TermsReacceptanceModal.jsx`** (new, both apps) — blocking overlay that checks `profile.terms_version !== TERMS_VERSION || profile.privacy_version !== PRIVACY_VERSION` and shows an accept-with-checkbox modal if stale. Unlike the Partner Agreement gate (a full-page redirect via ProtectedRoute), this is a modal mounted in `Layout.jsx` — fires app-wide regardless of which page the user lands on after login, without navigating them away from where they were headed.
- Updated `SignUpPage.jsx` (web) and `RegisterPage.jsx` (worker) to import the version constants instead of hardcoding `'v1.0'` inline.
- Version values intentionally match what was already hardcoded, so no existing user who already accepted gets incorrectly re-prompted at launch — the modal only fires for genuinely new/missing acceptances or future version bumps.

### Verification
Both `web` and `worker` `vite build` succeed clean (only pre-existing, unrelated warnings).

### 🚨 Unrelated critical bugs found + fixed: worker matching in BookingFormPage was completely broken (live-verified, not just build-checked)
While double-checking that the KRA PIN change didn't disturb role-specific onboarding logic for any of the 6 partner types, traced how `workers.service` is set vs. queried and found this chain of pre-existing bugs (none caused by this session). Verified live with a running dev server and real Supabase queries — not just a clean build — per explicit request to be sure of everything.

**Bug 1 — emoji mismatch:** `web/src/pages/main/BookingFormPage.jsx`'s `SERVICE_LABEL` map used emoji-suffixed values (`'Plumbing 💧'`, etc.) in a `.eq('service', label)` query, but `WORKER_SERVICES` in `worker/src/pages/auth/RegisterPage.jsx` (the only place that writes `workers.service`, at registration) has always stored plain text (`'Plumbing'`). Fixed: dropped the emoji to match exactly.

**Bug 2 — the real blocker, found only by live-testing:** even after fixing Bug 1, manually walking through the actual booking flow (Home → Plumbing → Leak Repairs → Tap/Faucet Leakage → Step 2 "Choose Professional") still showed "No professionals available." Network inspection revealed the worker query was returning **HTTP 400**, not an empty result — Postgres error `42703: column workers.avatar does not exist`. The query selected a column (`avatar`) that was never created on `workers`; live introspection confirmed only `profile_photo_url` and `profile_picture_url` exist. Since `w.avatar` was selected but never actually rendered anywhere in the file (the worker cards intentionally show initials only, per an existing code comment), the correct fix was to drop the dead column from the `.select()` rather than wire in an unused photo. Both bugs together meant **the worker-matching query has never successfully returned a single worker, for any service, since this code was written** — Bug 1 alone wouldn't have been enough; Bug 2 was masking it.

Re-verified after both fixes: the live query now returns cleanly with **no error** (confirms the code path is fixed) — it currently returns 0 results because the `workers` table itself has 0 rows in this database (no test partners have completed registration/onboarding yet), which is expected, separate, and not a bug. The fix is real and will surface real workers as soon as partner data exists.

**Bug 3 — found, NOT fixed, flagged for follow-up:** while investigating, also found `HomePage.jsx`'s "Suppliers & Vendors" section query (`vendor_products` joined to `business_id` aliased as `supplier`) also returns HTTP 400 — `column service_businesses_1.full_name does not exist`. The `vendor_products.business_id` foreign key resolves to a `service_businesses` table (columns: `name`, `area` — not `full_name`/`business_name`/`verification_status` as the query assumes). This table is distinct from `workers`, isn't created in any tracked migration, and both `service_businesses` and `vendor_products` currently have **0 rows** — so this bug is presently dormant with no customer impact. Did not fix it: resolving it correctly requires a data-model decision (should `vendor_products.business_id` reference `workers` instead, since that's where vendor/supplier profiles actually live in this schema? Or should the query target `service_businesses.name`/`area` instead?) that shouldn't be guessed at without more context. Worth raising before the Supplies Shop feature goes live with real data.

Verified `vite build` clean for both apps after all fixes.

---

## 🆕 SESSION SUMMARY (June 30, 2026 — Receipt/Invoice/Quotation Branding Pass — Session 9)

### Overview
User asked whether receipts, invoices, and quotations had been brought into the Light & Clean redesign. They hadn't — only `worker/src/pages/main/ReceiptPage.jsx` had been fixed earlier (the dark-theme web receipt view). Audited every receipt/invoice/quotation surface across both apps and found the same dark-navy (`#0A1628`/`#0A0E1A`) header/footer band pattern in four more places, all fixed:

1. **`web/src/pages/main/ReceiptPage.jsx`** (customer receipt web view) — action bar was `CL.navy`, header was a dark gradient (`linear-gradient(135deg,#0A1628,#111827)`) with white/translucent text. Converted to `CL.surface` action bar + `CL.goldSoft` header with gold border, matching the partner app's already-fixed version. Also replaced hardcoded `#f0f2f5` page background and `#fff` card background with `CL.bg`/`CL.surface` so it follows the app's day/night theme.

2. **`worker/src/utils/receiptPDF.js`** (job-completion receipt PDF — generated on every job completion, emailed to the customer, stored in Supabase) — dark navy `setFillColor(10,14,26)` header/footer bands converted to light gold (`253,248,236`) header / light gray (`247,248,250`) footer with a top border, text recolored from white/light-gray-on-dark to dark-navy/muted-gray-on-light.

3. **`worker/src/utils/partnerStatement.js`** (earnings statement PDF + commission invoice PDF, both downloadable from EarningsPage) — same dark-navy → light-gold header conversion on both PDF builders; the statement's dark "Net Earnings" totals box converted to a light green card (matching the in-app deposit-status styling already used elsewhere); footers converted to light gray bands with a top border instead of solid dark navy.

4. **`web/src/utils/fixeraDocument.js`** (unified Receipt/Invoice/Quotation PDF generator used by `downloadDocument()`/`documentPdfBlob()`) — same header/footer treatment applied; this is shared code so the fix covers all three document types it produces in one place.

`QuotationPage.jsx` (the live in-app web quotation view) was checked and required no changes — it already used `useCL()` and the Light & Clean theme throughout; its few `CL.navy` references are intentional accent-button colors, not a dark-theme bug.

### Related but NOT fixed: transactional email templates
While auditing, found `web/src/services/emailService.js` and `worker/src/services/partnerEmailService.js` use the same dark-navy gradient header (`linear-gradient(135deg,#0A0E1A,#1a2f52)`) across welcome emails, support ticket emails, document-ready emails, and statement emails. These are a distinct category from receipts/invoices/quotations (transactional notification emails, not financial documents) and weren't in scope for this pass — flagged for a future, separate branding pass if desired.

### Verification
Both `web` and `worker` `vite build` succeed clean.

---

## 🆕 SESSION SUMMARY (June 30, 2026 — Real Fixera Logo on All Documents — Session 10)

### Overview
User asked whether receipts/invoices/quotations carry the actual Fixera logo — they didn't; the gold-header redesign from the prior session still used a generic gold-square-with-icon placeholder (Wrench/Briefcase icon in a circle) instead of the real logo mark, and the PDF generators rendered the "FIXERA" wordmark as text only, no image.

### What was added
- **`web/public/logo-mark-sm.png`** and **`worker/public/logo-mark-sm.png`** — new 240×240px, ~35KB versions of the existing `logo-mark.png` (which is 1254×1254, ~2MB — far too large to embed in a PDF or inline as base64). Generated via a resize pass so PDF generation stays fast and bundle size stays sane.
- **`web/src/utils/logoForPdf.js`** and **`worker/src/utils/logoForPdf.js`** (new, identical) — `getLogoDataUrl()` fetches the small PNG once, converts it to a base64 data URI via `FileReader`, and caches it in memory so repeated PDF generation (e.g., re-downloading a statement) doesn't re-fetch. Fails silently (returns `null`) if the fetch ever fails, so a missing logo never breaks PDF generation — the document still generates, just without the image.

### Where it's now embedded
- **`worker/src/utils/receiptPDF.js`** (job-completion receipt, emailed + stored on every job) — logo added centered above the "FIXERA" wordmark in the header band.
- **`worker/src/utils/partnerStatement.js`** (earnings statement PDF + commission invoice PDF) — logo added to the left of "FIXERA" in both document headers.
- **`web/src/utils/fixeraDocument.js`** (unified Receipt/Invoice/Quotation generator) — same left-of-wordmark placement; covers all three document types since they share this one builder.
- **`web/src/pages/main/ReceiptPage.jsx`** and **`worker/src/pages/main/ReceiptPage.jsx`** (the live, non-PDF web receipt views) — the gold-square Wrench/Briefcase icon placeholder swapped for the actual `/logo-mark.png` image, matching how `BrandLogo.jsx` renders it everywhere else in the app.

### Technical note: builders became async
`buildStatementPDF`, `buildCommissionInvoicePDF`, and `buildDocumentPDF` were synchronous; embedding the logo requires an async fetch, so all three (plus their `download*`/`documentPdfBlob` wrappers) were converted to `async function` + `await`. Updated all call sites: `EarningsPage.jsx`'s download handlers now `await` properly; the four `downloadDocument()` call sites in the web app (`DocumentsPage.jsx`, `PaymentPrompt.jsx`, `MaterialsEstimateCard.jsx`, `MovingRequestStatusPage.jsx`) were already fire-and-forget `onClick` calls and needed no changes — an async function returning a promise from an `onClick` still triggers the download correctly once the promise resolves.

### Verification — live-rendered, not just build-checked
Per the standing instruction to verify thoroughly: generated a real test receipt PDF in a running dev server, confirmed `getLogoDataUrl()` returns a valid `data:image/png;base64,...` string, confirmed the output PDF blob is ~239KB (consistent with a ~35KB image embedded, not a text-only PDF that would be a few KB), then rendered the actual PDF page to a canvas using pdf.js (bypassing the browser's native PDF viewer, which wasn't rendering content in this headless context) and **visually confirmed the logo appears correctly** — positioned top-left, properly sized, next to the "FIXERA" wordmark, on the light gold header. Both `web` and `worker` `vite build` succeed clean after all changes.

---

## 🆕 SESSION SUMMARY (June 29, 2026 — API Rate Limiting (2.9) + Open Relay Fix — Session 7)

### Overview
Implemented 2.9 — rate limiting on API routes to prevent STK Push spam, the last remaining Phase 2 item before soft launch. While auditing the API routes, found a genuine security issue: `worker/api/send-email.js` had **zero authentication** — a public Vercel endpoint anyone on the internet could POST to and send arbitrary email through Fixera's Gmail account (open relay / phishing-spam vector). Fixed both in the same pass.

### Rate limiting design
Vercel serverless functions are stateless across invocations (may run on a different instance every call), so an in-memory counter is unreliable. Used Postgres (already connected via Supabase) as the shared atomic counter store instead of adding new infra (Upstash Redis):
- **`migrations/create_api_rate_limits.sql`** — `api_rate_limits` table + `check_rate_limit(key, max, window_seconds)` RPC function that atomically checks-and-increments via `INSERT ... ON CONFLICT DO UPDATE`. RLS enabled, no direct client access (service-role key only, via RPC).
- **`web/api/_rateLimit.js`** and **`worker/api/_rateLimit.js`** — shared `rateLimit(req, res, supabase, key, { max, windowSeconds })` helper. Fails open (allows the request) if the check itself errors, so a Supabase hiccup never blocks real traffic. Sends 429 on limit exceeded.

### Routes protected
- `web/api/mpesa-stk-push.js` — 3/min per user (the actual STK spam vector)
- `web/api/mpesa-status.js` — 20/min per user (generous, since it's polled while waiting on payment)
- `web/api/ai-chat.js` — 15/min per user (protects Gemini API cost)
- `web/api/send-email.js` — 10/min per user (protects Resend quota)
- `web/api/validate-promo.js` — 15/min per user (prevents promo-code brute forcing)
- `worker/api/mpesa-topup-push.js` — 3/min per partner
- `worker/api/mpesa-topup-status.js` — 20/min per partner
- `worker/api/send-email.js` — 10/min per partner

Webhook endpoints (`mpesa-callback.js`, `mpesa-topup-callback.js`) were left untouched — those are called by Safaricom, not users, and are gated by a callback secret instead. Admin-only `broadcast-announcement.js` was also left untouched (low spam risk, already gated by `requireAdmin`).

### Open relay fix — worker/api/send-email.js
This file had no `requireAuth` call at all, unlike its web-app counterpart. Fixed to match: added `requireAuth`, recipient-domain restriction (`addr === auth.user.email || addr.endsWith('@fixera.africa'|'@fixera.co.ke')`), and rate limiting. Updated the frontend caller `worker/src/services/partnerEmailService.js` to fetch the Supabase session and attach `Authorization: Bearer <token>` (it previously sent no auth header — mirrored the pattern already used correctly in `web/src/services/emailService.js`). Both call sites (`sendWelcomeEmail` during signup, `sendStatementEmail` from EarningsPage) send to the user's own email, so the recipient restriction doesn't break either flow. Welcome email may silently no-op if signup doesn't return an immediate session (email confirmation enabled) — acceptable since the email was already designed to be non-blocking.

Also caught and fixed a duplicate `const allowed` declaration (SyntaxError) introduced in `web/api/send-email.js` during the same edit pass — renamed to `rateLimitOk` / `recipientsAllowed`.

### Verification
Ran full `vite build` on both `web` and `worker` — clean (only pre-existing, unrelated warnings: FAQPage duplicate CSS key, chunk-size notices). Ran `node --check` on every edited `.js` API file and the modified `partnerEmailService.js` — all pass.

### Status: LIVE
Migration `migrations/create_api_rate_limits.sql` has been run successfully in Supabase. The rate limiter is now actively enforcing on all 8 protected routes.

## 🆕 SESSION SUMMARY (June 29, 2026 — Partner App UI Redesign Complete — Session 6)

### Overview
Finished the remaining partner app (C:/fixera/worker) Light & Clean UI redesign items (6.31–6.36). All emoji icons across dashboards, earnings, receipts, active job tracking, and onboarding were replaced with Lucide icon components for visual consistency with the already-redesigned DashboardPage (6.29).

### Pages updated
- **ReceiptPage.jsx** — full rewrite from old dark theme (`#0A0E1A` header) to Light & Clean (white card, gold brand header, Lucide icons, light print-ready action bar)
- **VendorDashboard.jsx, RiderDashboard.jsx, SupplierDashboard.jsx, MoverDashboard.jsx, WaterCarrierDashboard.jsx** — replaced emoji icons in stat cards, job/order cards, tab labels, and empty states with Lucide icon components
- **EarningsPage.jsx** — `PURPOSE_ICON` / `WALLET_ICON` emoji maps converted to Lucide component maps; deposit status icons, download/email/invoice buttons, and empty state updated
- **ActiveJobPage.jsx** — `STEPS` and `ESTIMATE_STATUS` arrays now carry Lucide `Icon` components instead of emoji strings; status hero, arrival/completion/materials sections, and navigate button updated
- **OnboardingPage.jsx** — `SectionTitle` component changed from emoji-string `icon` prop to Lucide `Icon` component prop; all ~16 call sites updated; service-selection cards (Plumbing/Electrical/Painting/Cleaning) now use Lucide icons instead of emoji; removed stray emoji from `buildServiceDetails()` service labels
- HistoryPage.jsx, ProfilePage.jsx, SupportPage.jsx — already fully Lucide-based, no changes needed

### Result
Partner app Phase 6 redesign (6.22–6.36) is now 100% complete. Every screen in `C:/fixera/worker` uses the Light & Clean theme with Lucide icons — no emoji remain in any dashboard, detail, or onboarding flow component covered by the execution plan.

### Follow-up: framer-motion parity with customer app
User flagged that the partner app was missing the polish layer the customer app already has — the customer app's `HomePage.jsx` uses a staggered `fadeUp` framer-motion entrance pattern (`motion.div` per section with incrementing `custom` delay) that was completely absent from the redesigned partner pages. Retrofitted the identical pattern across all 11 pages:
```js
const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: (i = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.45, delay: i * 0.07, ease: 'easeOut' } }),
};
```
- **VendorDashboard.jsx** — done manually as the reference implementation (header, toggle, stats, tabs, order cards)
- **RiderDashboard, SupplierDashboard, MoverDashboard, WaterCarrierDashboard** — header/stats/tabs/empty-states/list-cards wrapped; Mover and WaterCarrier route motion through their shared `Empty`/`RequestCard`/`OrderCard` sub-components with an `index` prop
- **EarningsPage** — only the page header needed wrapping; its `Panel`/`Kpi` components already had an independent CSS-keyframe `fadeUp` animation, correctly left untouched to avoid double-animating
- **HistoryPage, ProfilePage, SupportPage** — title/stats/lists wrapped, list items get cascading delays via `custom={N + i * 0.4}`
- **ActiveJobPage** — back/title, status hero, OTP/completion/materials cards, progress steps, map, action button
- **ReceiptPage** — single subtle fade on the receipt card + action bar only (kept minimal — it's a print document, not an interactive dashboard)
- **OnboardingPage** — progress bar + all 16 step-content blocks (each `custom={0}` since only one step is visible at a time) + nav buttons

Verified with `npx vite build` — clean build, zero JSX/syntax errors across all 11 files.

---

## 🆕 SESSION SUMMARY (June 29, 2026 — T&C Rewrite + Operational Standards — Session 5 cont.)

### Overview
Rewrote both TermsPage files with exact approved T&C v1.0 wording (14 sections). Then conducted a full comparison between the approved T&C document and the live platform rules. Found 15 discrepancies — operational mechanics built into the platform but absent from the legal document. Added a new Section 4A (Platform Operational Standards) to both TermsPages to cover these rules immediately. Drafted and sent a formal email to the lawyer requesting a T&C V1.1 amendment to formalise the same gaps in the signed legal document.

### T&C Structure (15 sections — approved wording + 4A operational)
1. Definitions and Interpretation (16 defined terms)
2. User Eligibility and Registration (age 18+; OTP/email/ID/background check verification; role certifications; Crew Registry for applicable categories)
3. Commission and Payment Structure (Workers/Riders 15%, others 20%; wallet; refund policy)
4. Service Delivery and Quality Standards (Partner + Customer obligations; rating thresholds)
**4A. Platform Operational Standards** ← NEW
  - 4A.1 OTP verification (arrival OTP = commencement; completion OTP = payment trigger)
  - 4A.2 GPS tracking + photo documentation (Riders, Movers, Water Carriers)
  - 4A.3 Exclusive delivery rule (Vendors/Suppliers — permanent deactivation if breached)
  - 4A.4 Crew Registry (Vendors, Suppliers, Movers, Water Carriers)
  - 4A.5 Category-specific rules (Vendor 2hr acceptance; Supplier counterfeit ban; Water Carrier food-grade + monthly health cert; Mover 2yr minimum + KSh 10M insurance)
5. Dispute Resolution Procedure
6. Deposits and Security Requirements
7. Liability and Limitation of Liability
8. Intellectual Property Rights and Brand Protection
9. Data Privacy and Security
10. Suspension and Termination of Accounts
11. Modifications to Terms
12. Governing Law and Dispute Resolution
13. Severability
14. Contact Information

### Files Modified
- `web/src/pages/main/TermsPage.jsx` — fully rewritten with approved T&C v1.0 + Section 4A; desktop sidebar layout; IntersectionObserver; gold accent; useCL() hook
- `worker/src/pages/main/TermsPage.jsx` — fully rewritten with same content; mobile-first layout; slide-down contents; hardcoded CL object

### T&C vs Platform — Gaps Identified and Actioned
| Gap | In 4A? | Sent to Lawyer? |
|---|---|---|
| OTP verification system | ✅ | ✅ |
| Exclusive delivery rule (Vendors/Suppliers) | ✅ | ✅ |
| GPS tracking (Riders/Movers/Water Carriers) | ✅ | — |
| Photo documentation requirements | ✅ | — |
| Crew Registry requirement | ✅ | ✅ |
| Insurance lapse = immediate suspension | ✅ | ✅ |
| KRA PIN as registration requirement | ✅ (Section 2.3) | ✅ |
| Counterfeit goods = permanent ban | ✅ | — |
| Background check requirement | ✅ (Section 2.3) | ✅ |
| Role-specific certifications | ✅ (Section 2.3) | ✅ |
| Vendor 2hr order acceptance window | ✅ | — |
| Water Carrier food-grade containers | ✅ | — |
| Mover 2yr minimum + 5 references | ✅ | — |
| Mover KSh 10M insurance (amount unspecified in T&C) | ✅ | ✅ |
| Rating 3.5 warning (missing from partner agreement) | — | — |

### Pending
- Lawyer response + T&C V1.1 amendment → update both TermsPages when received
- Rating 3.5 warning threshold to be added to `partnerAgreements.js` (no lawyer needed)

---

## SESSION SUMMARY (June 29, 2026 — Legal Policy Integration — Session 5)

### Overview
Full wiring of finalized legal documents into both customer and partner apps. Includes replacing the placeholder PrivacyPage with the 16-section approved policy (Kenya DPA 2019 compliant), creating the new AIPolicyPage (10-section), routing, consent checkboxes at registration, versioned consent storage in Supabase, and surfacing all three documents in profile/settings and login/footer.

### Files Created
- `migrations/add_consent_tracking.sql` — ALTER TABLE profiles + workers to add terms_version, terms_accepted_at, privacy_version, privacy_accepted_at columns
- `web/src/pages/main/AIPolicyPage.jsx` — 10-section AI Policy (green accent), sticky header + contents dropdown, footer links
- `worker/src/pages/main/PrivacyPage.jsx` — 16-section approved Privacy Policy for partner app (blue accent, mobile-first layout)
- `worker/src/pages/main/AIPolicyPage.jsx` — 10-section AI Policy for partner app (green accent, mobile-first layout)
- `worker/src/pages/main/TermsPage.jsx` — 15-section Terms of Service for partner app (gold accent, mobile-first layout)

### Files Modified
- `web/src/pages/main/PrivacyPage.jsx` — fully rewritten: 16-section approved policy (was 13-section placeholder), Fixera Company Limited, P.O. Box 12997-00100, DPO email, 8 DPA rights, correct retention periods, blue accent
- `web/src/App.jsx` — added `import AIPolicyPage` + `<Route path="/ai-policy" />`
- `worker/src/App.jsx` — added imports + routes for /terms, /privacy, /ai-policy
- `web/src/pages/auth/SignUpPage.jsx` — replaced passive text with two required checkboxes (Terms + Privacy); button disabled until both checked; stores terms_version='v1.0' + privacy_version='v1.0' + timestamps in profiles on signup
- `web/src/pages/auth/LoginPage.jsx` — added legal footer (Terms | Privacy Policy | AI Policy links)
- `web/src/pages/main/ProfilePage.jsx` — split Help & info section; new Legal section with Terms, Privacy, AI Policy
- `worker/src/pages/auth/RegisterPage.jsx` — added agreedTerms + agreedPrivacy state; isDetailsValid() requires both; consent checkboxes + MPA/AI Policy links shown for all roles; stores consent in workers table on success
- `worker/src/pages/main/ProfilePage.jsx` — Legal section added before Logout (Terms, Privacy, AI Policy)
- `worker/src/data/partnerAgreements.js` — AGREEMENT_VERSION bumped from 'v0.9.1-draft' to 'v1.0'
- `migrations/_RUN_ALL_IN_ORDER.sql` — appended add_consent_tracking migration

### Consent Version Tracking
- Consent stored on signup via Supabase `.update()` call immediately after successful registration
- Version string: `'v1.0'` for both Terms and Privacy
- Fields: `terms_version TEXT`, `terms_accepted_at TIMESTAMPTZ`, `privacy_version TEXT`, `privacy_accepted_at TIMESTAMPTZ`
- On `AGREEMENT_VERSION` change in `partnerAgreements.js`, PartnerAgreementPage already records `agreement_version` + `agreement_accepted_at` on acceptance

### Pending SQL
Run in Supabase SQL Editor (already appended to `_RUN_ALL_IN_ORDER.sql`):
```sql
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS terms_version       TEXT,
  ADD COLUMN IF NOT EXISTS terms_accepted_at   TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS privacy_version     TEXT,
  ADD COLUMN IF NOT EXISTS privacy_accepted_at TIMESTAMPTZ;

ALTER TABLE workers
  ADD COLUMN IF NOT EXISTS terms_version       TEXT,
  ADD COLUMN IF NOT EXISTS terms_accepted_at   TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS privacy_version     TEXT,
  ADD COLUMN IF NOT EXISTS privacy_accepted_at TIMESTAMPTZ;
```

---

## PREVIOUS SESSION SUMMARY (June 29, 2026 — Partner App Polish + Pending SQL Migrations)

### Overview
Full partner app (worker app) responsive redesign across all breakpoints, profile pictures for all partner types, typography standardisation, emoji → Lucide icon replacement across all pages. Also catalogued all SQL migrations since the wallet feature and updated `_RUN_ALL_IN_ORDER.sql` with 18 missing files.

### Partner App — Responsive Design (SupportPage)
**File:** `worker/src/pages/main/SupportPage.jsx` — full rewrite using `useWindowWidth()` hook.
- Breakpoints: isTablet (≥768), isDesktop (≥1100), isLarge (≥1440), isXL (≥1920)
- 2-column layout on desktop (contact+links left, tickets right); single column on mobile/tablet
- No `<style>` CSS injection — all responsive via conditional inline styles (prevents React 18 "not loading" bug)
- QuickLink and Tag as internal helper components

```jsx
function useWindowWidth() {
  const [w, setW] = useState(() => window.innerWidth);
  useEffect(() => {
    const fn = () => setW(window.innerWidth);
    window.addEventListener('resize', fn);
    return () => window.removeEventListener('resize', fn);
  }, []);
  return w;
}
```

### Partner App — Profile Pictures (Avatar System)
New reusable avatar component + upload flow across the entire partner app.

| File | Change |
|------|--------|
| `worker/src/components/Avatar.jsx` | NEW — circular avatar, shows photo or gold initials fallback. Props: `url`, `name`, `size`, `ring`, `ringColor` |
| `worker/src/pages/main/ProfilePage.jsx` | 72px avatar with camera badge (tap to upload). Uploads to `supabase.storage.from('avatars')`, cache-busts URL with `?t=Date.now()`, updates `workers.profile_picture_url`, calls `refreshProfile()` |
| `worker/src/pages/main/DashboardPage.jsx` | 56px gold-ring avatar in greeting row, tapping navigates to /profile |
| `worker/src/components/Layout.jsx` | Mobile top bar: 34px avatar. Desktop sidebar profile card: 38px avatar |

**Upload flow:**
1. Partner taps camera badge → file input opens
2. File uploaded to `avatars/{userId}/avatar.{ext}` with `{ upsert: true }`
3. Public URL fetched with `?t=Date.now()` cache-bust appended
4. `workers.profile_picture_url` updated in DB
5. `refreshProfile()` called to propagate to all components

### Partner App — Typography Standardisation
Unified type scale across ALL pages (was inconsistent 12–30px):

| Token | Size | Usage |
|-------|------|-------|
| Page title | 24px / 900 | DashboardPage greeting, HistoryPage, WithdrawPage headings |
| Body text | 13–15px | All labels, descriptions, filter text |
| Small / meta | 11–13px | Timestamps, muted info |
| Stat numbers | 26px / 700 | Dashboard stat cards, History summary cards |
| Large numbers | 36px | Earnings balance display |
| EarningsPage table | 13px (was 12.5px) | `td` cells now 13px |

### Partner App — Emoji → Lucide Icons
All amateur emoji removed across every page. Replaced with Lucide React icons:

| Page | Icons Used |
|------|-----------|
| ProfilePage | Wrench, ShoppingBag, Car, Package, Briefcase, Star, TrendingUp, CheckCircle, BarChart2, RefreshCw, Truck, Clock, Award, Pencil, LogOut, X, Save, Camera |
| HistoryPage | CheckCircle, XCircle, Wrench, MapPin, FileText, Inbox |
| Layout | Lucide icons throughout sidebar nav (unchanged) |

### SQL Migrations — Pending Since Wallet Feature

The following migrations were created but NOT yet run in Supabase. All have now been added to `_RUN_ALL_IN_ORDER.sql`.

**Run these in Supabase → SQL Editor in this order:**

| # | File | What it does |
|---|------|-------------|
| 1 | `extend_commission_trigger.sql` | Extends commission auto-deduction to all 6 partner types (vendor, mover, supplier, water_carrier record `commission_due` instead of wallet deduction) |
| 2 | `add_payment_idempotency.sql` | Adds UNIQUE constraint on `(ref_type, ref_id, method)` in `payments` — prevents duplicate M-Pesa callbacks or network retry charges |
| 3 | `create_receipts.sql` | `receipts` table + `trg_generate_receipt` trigger — auto-generates receipt PDF row whenever `payments.status → 'paid'` |
| 4 | `create_refunds.sql` | `refunds` table + `execute_refund()` RPC — admin approves refund → credits customer `profiles.wallet_balance` |
| 5 | `fix_disputes_rls.sql` | Fixes over-permissive RLS on `disputes` (was FOR ALL — any user could edit others' disputes) and `service_areas` (read-only for regular users) |
| 6 | `fix_storage_buckets.sql` | Secures `worker-documents`, `receipts`, `inspection-photos` buckets (sets `public=false`, adds owner-only + admin RLS policies). Also locks `mover-vehicles` bucket |
| 7 | `secure_profiles_rls.sql` | Hardens `profiles` table — prevents self-elevation of `is_admin` flag; admins can grant/revoke, users cannot touch their own `is_admin` |
| 8 | `add_admin_role.sql` | Adds `admin_role` column to `profiles` (super_admin / support / finance / operations) for admin RBAC sub-roles |
| 9 | `add_worker_availability.sql` | Adds `is_available BOOLEAN` to `workers` — per-partner availability toggle beyond online/offline status |
| 10 | `add_ticket_assignment.sql` | Adds `assigned_to`, `assigned_name`, `sla_deadline` to `support_tickets` — enables admin agents to claim tickets |
| 11 | `create_ticket_notes.sql` | `ticket_notes` table — internal admin-only notes on tickets (customers can't see) |
| 12 | `create_notification_log.sql` | `notification_log` table — audit trail for all push/email/SMS notifications sent by the platform |
| 13 | `create_payment_failures.sql` | `payment_failures` table — logs every failed Daraja STK Push response for admin debugging and retry |
| 14 | `add_wallet_topups.sql` | `wallet_topups` table + `increment_wallet_balance()` RPC — tracks partner M-Pesa top-up requests; called by the M-Pesa topup callback webhook |
| 15 | `add_job_timeout_cron.sql` | `accepted_at` column on bookings + `auto_reassign_timed_out_jobs()` + pg_cron schedule (every 5 min) — auto-unassigns workers silent for 45+ min |
| 16 | `add_live_locations_cleanup_cron.sql` | pg_cron hourly cleanup — deletes `live_locations` rows older than 48 hours to prevent unbounded growth |
| 17 | `seed_service_catalog.sql` | Seeds `service_categories` (Plumbing, Electrical, Cleaning, Painting) + 36 services with prices/durations. Run ONCE — uses ON CONFLICT DO NOTHING |
| 18 | `add_profile_picture.sql` | Adds `profile_picture_url` to `workers` + creates `avatars` public storage bucket with self-scoped RLS policies |

> **NOTE on cron jobs (#15, #16):** Requires `pg_cron` extension. Enable it first: Supabase Dashboard → Database → Extensions → pg_cron → Enable

### New Files This Session

| File | Purpose |
|------|---------|
| `worker/src/components/Avatar.jsx` | Reusable circular avatar component |
| `migrations/add_profile_picture.sql` | Profile picture DB migration |

### Bug Fixed — React 18 "Not Loading" on Deploy
**Root cause:** `<style>{CSS}</style>` injected inside a component div caused React 18 hydration issues in some Vercel deployments. Hash collision with cached Vite bundle (`index-BJglOb0E.js`) masked the fix on first two deploys.  
**Fix:** Replaced CSS injection with `useWindowWidth()` hook + conditional inline styles. Used `vercel deploy --prod --force` to bypass Vite build cache.

### Vercel Env Vars Still Needed
```
MPESA_TOPUP_CALLBACK_URL = https://partner-app-five.vercel.app/api/mpesa-topup-callback
```

---

## 🆕 SESSION SUMMARY (June 27, 2026 — Security Audit + Performance + UI Polish)

### Overview
Full security audit (13 findings), all critical/high/medium issues fixed, image compression (8-11MB PNGs → 80-500KB WebP), Supabase config hardened, and auth page UI polish.

### Security Fixes (13 total — all deployed)

| # | Severity | Fix |
|---|----------|-----|
| 1 | CRITICAL | `bookingService.js` — `getUserBookings` explicit columns (no OTPs). `getBooking` excludes `completion_otp`, adds optional `userId` ownership filter |
| 2 | HIGH | `paymentService.js` — `markCashPaid()` reads auth session + adds `.eq('customer_id', userId)` |
| 3 | HIGH | `send-email.js` — recipient locked to auth user's email or `@fixera.africa`/`@fixera.co.ke` (no open relay) |
| 4 | HIGH | `SupportPage.jsx` — `.eq('user_id', user.id)` always applied before search terms |
| 5 | HIGH | `App.jsx` — `AdminDashboard` lazy-loaded (`React.lazy`) — admin code/walletAdminService removed from customer bundle |
| 6 | MEDIUM | `ai-chat.js` — `requireAuth` added (no anonymous Gemini quota abuse) |
| 7 | MEDIUM | `useAuth.jsx` — guest PII moved from `localStorage` to `sessionStorage` (clears on tab close) |
| 8 | MEDIUM | `mpesa-stk-push.js` — generic error response (no internal details leaked) |
| 9 | MEDIUM | `mpesa-status.js` — generic error response |
| 10 | MEDIUM | `send-email.js` — generic error response |
| 11 | MEDIUM | `broadcast-announcement.js` — generic error + `title`/`body` HTML-escaped before mass email |
| 12 | MEDIUM | `SupportPage.jsx` — user_id always scoped |
| 13 | LOW | `AuthLayout.jsx` two fixes: hardcoded `#F5F6F8` bg → `CL.bg` (dark mode mismatch fixed); `SignUpPage.jsx` tab container `#ECEEF1` → `CL.border` |

### Supabase Config Hardened
- Site URL changed from `http://localhost:3000` → `https://project-xyk3n.vercel.app`
- RLS verified: `bookings` (Users can manage own — ALL), `payments` (Customers manage own — ALL), `support_tickets` (Users see own — SELECT + INSERT) ✅

### Image Performance (98%+ size reduction)
All PNGs converted to WebP using sharp. Previous total: ~80MB for main images alone.

| Image | Before | After |
|-------|--------|-------|
| welcome.png | 9.8MB | 82KB |
| electrical.png | 11MB | 180KB |
| riders.png | 11MB | 529KB |
| cleaning.png | 8.7MB | 78KB |
| plumbing.png | 8.6MB | 80KB |
| movers.png | 8.7MB | 162KB |
| water.png | 8.3MB | 180KB |
| painting.png | 8.1MB | 53KB |
| 19 sub-service images | avg ~3MB | avg ~50KB |

All JSX references updated to `.webp`. `fetchpriority="high"` added to auth layout image. `sharp` installed as devDependency.

### Auth Page UI Polish
- `AuthLayout.jsx` — gold glow added to left-side logo (`drop-shadow`)
- `BrandLogo.jsx` — navy badge size increased (height 46→64), more padding, gold `box-shadow` glow, soft spring bounce on tap (`whileHover scale 1.08`, `whileTap scale 0.92`, `stiffness 300 damping 18`), brightness filter removed (original colors preserved)
- `SignUpPage.jsx` — tab container background uses `CL.border` (dark mode compatible)

---

## 🆕 SESSION SUMMARY (June 27, 2026 — 6.19 Auto Dark/Night Mode + Google OAuth)

### Overview
- **Google OAuth** fully configured and working (Supabase + Google Cloud Console, Web Application credentials).
- **6.19 Auto dark/night mode**: Created `useCL()` hook (`web/src/hooks/useCL.js`) — time-based, 7pm–6am = DARK palette, 6am–7pm = LIGHT palette, rechecks every 60s. Migrated all 30 customer app pages from module-level `const CL` to the hook.
- **Facebook OAuth**: Geo-blocked in Kenya; pending VPN (Proton VPN downloading). Apple OAuth deferred (needs $99 Apple Developer account).

### New File: `web/src/hooks/useCL.js`
Central time-based theme hook. Returns LIGHT palette (6am–7pm) or DARK palette (7pm–6am). Auto-updates every 60 seconds. Exports `useCL()`, `CL_LIGHT`, `CL_DARK`.

### Pages Migrated to useCL()
All 30 customer-facing files now call `const CL = useCL()` inside each component/sub-component:
- **Auth**: LoginPage, SignUpPage, ForgotPasswordPage, ResetPasswordPage
- **Main**: HomePage, WalletPage, ServiceCategoryPage, SubServicePage, AboutPage, DocumentsPage, BookingFormPage, BookingConfirmationPage, WorkerAssignmentPage, PaymentPage, BookingHistoryPage, ProfilePage, FAQPage, SupportPage, TermsPage, PrivacyPage, InspectionDashboardPage, InspectionRequestPage, ReviewPage, ReceiptPage, WaterDeliveryStatusPage, LaundryPage, CarpetWashingPage, MoversPage, QuotationPage
- **Component**: GuestContactModal

### Sub-component pattern (for pages with multiple component functions)
Each sub-component (FAQItem, EditProfileDrawer, StarRating, SmallStars, SectionBlock, List, Highlight, InfoCard, DeptBadge, SuccessView, Panel, RequestCard) gets its own `const CL = useCL()` as first line. Module-level arrays using CL colors were either hardcoded or moved inside the component.

### Deployed
`vercel deploy --prod --yes` — build passed (0 errors, 1 pre-existing FAQPage duplicate key warning).

---

## 🆕 SESSION SUMMARY (June 26, 2026 — Light & Clean UI Redesign COMPLETE — 6.20 ALL DONE)

### Overview
Completed the final 10 screens of the premium "Light & Clean" redesign of the customer web app (`C:/fixera/web`). All 23 screens now fully redesigned. No emoji anywhere in the UI. All dark `C` theme references replaced with inline `CL`. All Lucide React icons. Deployed to production: `https://project-xyk3n.vercel.app`.

### CL Palette (standardised across all pages)
```js
const CL = {
  bg: '#F7F8FA', surface: '#FFFFFF', border: '#E8ECF0',
  text: '#0A1628', muted: '#6B7A8F',
  gold: '#C9A020', goldSoft: '#FDF8EC', goldBorder: '#E8D48A',
  navy: '#0A1628',
  success: '#1A7F3C', successBg: '#F0FAF4', successBorder: '#A3D9B3',
  error: '#C0392B', errorBg: '#FDF2F2', errorBorder: '#F5C6C6',
};
```

### Pages Redesigned This Session (6.20 final batch)

| Page | File | Key Changes |
|------|------|-------------|
| **PaymentPage** | `web/src/pages/main/PaymentPage.jsx` | M-Pesa STK push, method cards with Lucide icons, promo code with Ticket/CheckCircle2/X, shimmer progress bar, gold invoice, ShieldCheck trust badges |
| **ReviewPage** | `web/src/pages/main/ReviewPage.jsx` | Star rating, category ratings (Wrench/Clock/Briefcase), quick tags, worker card, success screen with CheckCircle2 |
| **ReceiptPage** | `web/src/pages/main/ReceiptPage.jsx` | Navy action bar, Wrench logo strip, status badge, FileText reference, print styles, sendReceipt preserved |
| **ResetPasswordPage** | `web/src/pages/auth/ResetPasswordPage.jsx` | KeyRound icon, strength meter (4 bars), invalid/success states, eye toggle, supabase.auth.updateUser preserved |
| **QuotationPage** | `web/src/pages/main/QuotationPage.jsx` | 2-col grid (detail left, price right), category icon with color, professional card with User icon, tag discount, ShieldCheck trust, approve/decline/revision flow |
| **InspectionRequestPage** | `web/src/pages/main/InspectionRequestPage.jsx` | 4-step form (Category/Urgency → Describe → Photos → Location), photo upload with Camera/Video, success screen with 4-step "what next" flow |
| **LaundryPage** | `web/src/pages/main/LaundryPage.jsx` | Browse/Confirm/Booked states, initials avatar (replaced emoji image), GPS location banner, sort filters, service type + mode selection, CSS vars → CL inline |
| **CarpetWashingPage** | `web/src/pages/main/CarpetWashingPage.jsx` | 4-step form + booked state, initials avatars, CARPET_SIZES with Lucide icons, ADD_ONS with FlaskConical/Wind/Zap, delivery flow tracker with Lucide icons, CSS vars → CL inline |
| **WaterDeliveryStatusPage** | `web/src/pages/main/WaterDeliveryStatusPage.jsx` | Dark navy → light CL.bg, STATUS_META with Lucide icons, DriverCard with User/Phone/Truck icons, QualityCertNotice with ShieldCheck, Supabase realtime preserved |
| **MoversPage** | `web/src/pages/main/MoversPage.jsx` | Dark navy → light CL.bg, PROPERTY_TYPES with Lucide icons (BedDouble/Building2/Home), VEHICLES with Truck icon, inventory stepper, sticky bottom nav, createMovingRequest preserved |

### Design Rules Applied Consistently
- Sticky white header: `position: sticky, top: 0, zIndex: 20, background: CL.surface, borderBottom: 1px solid CL.border`
- Framer Motion `fadeUp` variant on all major sections
- All emoji removed from UI — Lucide icons only
- Data-layer identifiers (category icons in DB insert) kept as-is
- No `import { C }` or `import { Btn, Card, Input }` anywhere

### Previous Session Summary (June 25–26, 2026 — Light & Clean Batch 2)
Redesigned: BookingFormPage, LocationPickerMap (dark→light tiles), BookingConfirmationPage, WorkerAssignmentPage, SupportPage, FAQPage, AboutPage, TermsPage, PrivacyPage, DocumentsPage, BookingHistoryPage, InspectionDashboardPage. Also: supportCategories.js emoji removed, HomePage responsive banner + image preloading.

---

## 🆕 SESSION SUMMARY (June 20, 2026 — Rider Live Dispatch)

### What Was Built
Full rebuild of `RiderOpsSection` in `web/src/pages/admin/AdminDashboard.jsx` from a read-only 2-tab view into a 4-tab operational dispatch center.

### Changes Made

| Tab | Detail |
|-----|--------|
| **📡 Dispatch** | Lists all unassigned `delivery_tracking` legs (rider_id IS NULL, status=pending). Click a leg → rider picker slides in. Shows each rider's active leg count + online status. Assigning sets `rider_id` + `status='rider_assigned'`. |
| **📦 All Legs** | Full read-only leg table with status filter pills. Added **Assign** shortcut (jumps to Dispatch tab with leg pre-selected) and **Unassign** button (clears rider_id, resets to pending). |
| **👤 Rider Queue** | Left panel lists all approved riders with active leg count. Click a rider → right panel shows their full active queue (cards with Unassign) + completed/cancelled history table. |
| **👥 Riders** | Enhanced profile table — now shows active leg count per rider alongside wallet, vehicle, verification status. |
| **KPI bar** | Always-visible counts: Unassigned / Active Legs / Delivered / Approved Riders |
| **Realtime** | Supabase channel on `delivery_tracking` — all tabs auto-refresh on any change |

---

## 🆕 SESSION SUMMARY (June 20, 2026 — Dispatch & Tracking Center)

### What Was Built
Full rebuild of `DispatchSection` in `web/src/pages/admin/AdminDashboard.jsx` into a multi-tab operational center.

### Changes Made

| Change | Detail |
|--------|--------|
| New `DispatchSection` (full rebuild) | Replaces minimal single-view dispatch with a 5-tab center |
| **Queue tab** | Unassigned bookings with age badge (red if >4h), click to open PartnerPicker inline |
| **Active Jobs tab** | All confirmed/on_way/in_progress/arrived bookings with partner info + Reassign button |
| **Delayed tab** | Bookings past their scheduled date/time still not completed — shows hours overdue, Reassign button |
| **Workforce tab** | Role-summary cards (online/busy/total per role) + full partner table with GPS status |
| **Analytics tab** | KPI cards, jobs-by-status progress bars, workforce-by-role breakdown, top-10 partners leaderboard |
| **PartnerPicker** | Shared component used for both assignment and reassignment — role filter + name/city search |
| **Real-time** | Supabase channel subscription on `bookings` table — auto-reloads all tabs on any change |
| **Live Map button** | Header button dispatches `fixera-nav` custom event to navigate shell to `live_ops` section |
| **Shell event listener** | `useEffect` in `AdminDashboard` listens for `fixera-nav` and calls `setActive(e.detail)` |
| Nav label | Already updated to `'Dispatch & Tracking'` with `📡` icon |

---

## 🆕 SESSION SUMMARY (June 20, 2026 — Admin Gap Fixes: Rider Ops, Water Ops, Agreement Compliance)

### What Was Found
Three gaps identified by auditing all three apps (customer, worker, admin) and comparing DB table usage:
1. **Rider delivery tracking** — `delivery_tracking` table had zero queries in admin. Riders section was profile-only.
2. **Water delivery orders** — Water Carriers section was also profile-only. No view of water bookings (`service_id = 'water-carriers'`).
3. **Partner agreement compliance** — `agreement_accepted_at` / `agreement_version` fields on `workers` table were invisible to admin.

### Changes Made (all in `web/src/pages/admin/AdminDashboard.jsx`)

| Change | Detail |
|--------|--------|
| New `RiderOpsSection` | Replaces generic `PartnerTypeSection` for riders. Two tabs: **Delivery Legs** (queries `delivery_tracking` with rider + booking join, stat cards, status filter) and **Riders** (profile table). |
| New `WaterOpsSection` | Replaces generic `PartnerTypeSection` for water carriers. Two tabs: **Water Orders** (queries `bookings WHERE service_id='water-carriers'`, status derived from timestamp columns) and **Carriers** (profile table). |
| Agreement column in Partners table | Added `Agreement` column showing ✅ date + version or ⚠️ Not signed for every partner row. |
| Agreement row in partner detail | Added "Partner Agreement" row in the Personal Info card when admin reviews a specific partner. |

### delivery_tracking Schema (for admin queries)
Fields used: `id, rider_id, booking_id, supplier_order_id, status, leg_type, pickup_address, dropoff_address, amount, created_at` + join to `bookings(sub_service, address, booking_date)` and `rider:rider_id(full_name, phone, vehicle_type)`

### Water delivery status logic
Water bookings don't use a `status` enum directly — status is derived from timestamp columns: `delivered_at` → delivered, `arrived_at` → arrived, `departed_at` → departed, `confirmed_at` → confirmed, `status='cancelled'` → cancelled, else pending.

---

## 🆕 SESSION SUMMARY (June 20, 2026 — WithdrawPage + Mobile Layout Fixes)

### Partner Withdrawal Page (Worker App)
New page at `/withdraw` in the partner/worker app where partners request M-Pesa payouts from their wallet.

| File | Change |
|------|--------|
| `worker/src/pages/main/WithdrawPage.jsx` | New page — wallet balance card, amount input with "Withdraw all" shortcut, M-Pesa phone input, submit creates `payouts` row with `status=pending`, payout history list with status badges |
| `worker/src/App.jsx` | Added `/withdraw` route + import |
| `worker/src/pages/main/EarningsPage.jsx` | Replaced disabled "Top Up · M-Pesa soon" button with live "💸 Request Withdrawal" button → navigates to `/withdraw` |

**Withdrawal flow:**
1. Partner opens Earnings → clicks "Request Withdrawal"
2. Enters amount (min KSh 500, max wallet balance) and M-Pesa number
3. Submits → `payouts` row created with `status = pending`
4. Admin sees it in Admin Dashboard → Payouts section → Approve → Mark Paid with M-Pesa ref
5. Partner sees status update in `/withdraw` history (pending → approved → paid)
6. If already has a pending/approved request, form is hidden with a clear message

### Mobile Layout Fixes (Customer Web App)
All 2-column fixed-width grids now collapse to single column on screens ≤700px.

| File | Fix |
|------|-----|
| `web/src/pages/main/BookingFormPage.jsx` | `.booking-grid` CSS class — 1fr 340px → 1col on mobile (steps 0 and 2) |
| `web/src/pages/main/PaymentPage.jsx` | `.payment-grid` CSS class — 1fr 360px → 1col on mobile |
| `web/src/pages/main/BookingConfirmationPage.jsx` | `.confirm-grid` CSS class — 1fr 360px → 1col on mobile |
| `web/src/pages/main/WorkerAssignmentPage.jsx` | `.assign-grid` CSS class — 1fr 360px → 1col on mobile |
| `web/src/pages/main/QuotationPage.jsx` | `.quotation-grid` CSS class — 1fr 340px → 1col on mobile |

All grids use `<style>` + CSS `@media (max-width:700px)` — no JS resize listeners needed.

---

## 🆕 SESSION SUMMARY (June 20, 2026 — M-Pesa Daraja STK Push Integration)

### Overview
Replaced the `setTimeout` M-Pesa stub with a real Safaricom Daraja API integration.  
All three payment paths (PaymentPrompt inline, PaymentPage standalone, callback webhook) are now wired.

### New Files
| File | Purpose |
|------|---------|
| `web/api/mpesa-stk-push.js` | Vercel serverless — authenticates with Daraja, initiates STK Push (USSD PIN prompt on customer's phone), returns `checkoutRequestId` |
| `web/api/mpesa-status.js` | Vercel serverless — queries Daraja STK status (pending / paid / cancelled / timeout / failed) for client-side polling |
| `web/api/mpesa-callback.js` | Vercel serverless — webhook Safaricom POSTs to when payment resolves; updates `payments.status = 'paid'` and stores M-Pesa receipt via service role key |
| `migrations/add_mpesa_to_payments.sql` | Adds `mpesa_checkout_id TEXT` column + index to `payments` table (needed for callback → row lookup) |

### Updated Files
| File | Change |
|------|--------|
| `web/src/services/paymentService.js` | `initiateMpesa(paymentId, phone, amount)` now calls `/api/mpesa-stk-push` and stores `mpesa_checkout_id` on the row. New `pollMpesaStatus(checkoutRequestId)` polls every 3s up to 10× |
| `web/src/components/PaymentPrompt.jsx` | Added phone number input field (shown when "Pay with M-Pesa" is clicked), waiting/success/error states, and real polling via `pollMpesaStatus` |
| `web/src/pages/main/PaymentPage.jsx` | Full rewrite — M-Pesa phone input, real STK Push flow with waiting/success/error states, polling, ensurePayment integration, cash path, promo code preserved |
| `web/src/pages/main/WorkerAssignmentPage.jsx` | "Proceed to Payment" button now passes `{ booking }` in navigate state so PaymentPage has amount/bookingId |

### Daraja Flow
```
1. Customer clicks "Send M-Pesa Prompt" → /api/mpesa-stk-push
2. Daraja sends USSD popup to customer's phone (enters PIN)
3. Client polls /api/mpesa-status every 3s (up to 30s)
4. On success → navigate to /review/:bookingId
5. In parallel, Daraja POSTs /api/mpesa-callback → marks payment 'paid' in DB
```

### Required Vercel Environment Variables
```
MPESA_CONSUMER_KEY       — Daraja app consumer key
MPESA_CONSUMER_SECRET    — Daraja app consumer secret
MPESA_SHORTCODE          — Business shortcode (174379 for sandbox)
MPESA_PASSKEY            — Lipa Na M-Pesa Online Passkey
MPESA_CALLBACK_URL       — https://<your-domain>/api/mpesa-callback
MPESA_ENV                — sandbox | production
SUPABASE_URL             — your project URL (for callback to update DB)
SUPABASE_SERVICE_ROLE_KEY — bypasses RLS for callback writes
```

### Phone Normalisation
Input `07XXXXXXXX` or `+254XXXXXXXXX` or `254XXXXXXXXX` → all normalised to `254XXXXXXXXX` before Daraja API call.

---

## 🗺️ MAP UPGRADE (June 19, 2026 — MapLibre GL + OpenStreetMap)

### Overview
Replaced Leaflet 1.9.4 + react-leaflet 5.0 with **MapLibre GL JS** across both apps.  
All existing business logic, Supabase subscriptions, motion detection, geocoding, and component APIs are **unchanged**.

### What Changed — Map Layer Only
| File | Change |
|------|--------|
| `web/src/components/LiveMap.jsx` | MapLibre GL, CartoDB Dark tiles @2x, GeoJSON route (glow+line+tick layers), animated ETA & motion overlays preserved |
| `web/src/components/TrackingMap.jsx` | MapLibre GL, CartoDB Dark tiles, Supabase realtime GPS preserved, worker pulse animation |
| `web/src/components/LocationPickerMap.jsx` | MapLibre GL, CartoDB Dark tiles, draggable gold pin with CSS pointer, click-to-place, Nominatim reverse geocode preserved |
| `worker/src/components/JobMap.jsx` | MapLibre GL, CartoDB Dark tiles, gold teardrop pin with CSS pointer, easeTo() smooth camera |

### Map Style — All 4 Components
- **Tiles:** CartoDB Dark Matter `@2x` (512px, retina quality) — same visual + WebGL rendering
- **Engine:** MapLibre GL JS WebGL — GPU-accelerated, smooth zoom, sharp at all DPRs
- **Route line:** 3-layer GeoJSON (glow blur → solid line → white dash tick) — production-grade appearance
- **Markers:** Custom DOM elements — gold gradient home pins (with CSS triangle pointer), blue worker circles (pulse animation), vehicle circles (color reflects motion state)

### Dependencies Added
```
web/package.json:    "maplibre-gl": "^5.x"
worker/package.json: "maplibre-gl": "^5.x"
```

### Business Logic — Completely Unchanged
- Supabase Realtime GPS subscriptions (`subscribeToLocationFor`, `workers` table)
- Haversine distance + ETA calculation
- Motion detection (STOP_SPEED_KMH, STOP_MOVE_M, STOP_ALERT_SECS, ARRIVED_M)
- Nominatim geocoding + reverse geocoding
- All component props and event callbacks

---

## 🆕 SESSION SUMMARY (June 19, 2026 — Admin Command Center + 11 Monitoring Sections)

### New Components
| File | Description |
|------|-------------|
| `web/src/components/LiveOpsMap.jsx` | Full-screen MapLibre admin map — all 6 partner roles as GeoJSON circle layers, realtime Supabase GPS, left stats sidebar, click-to-flyTo |
| `web/src/components/BookingHeatmap.jsx` | MapLibre heatmap — 90-day bookings parsed by Nairobi neighbourhood, under-served areas panel, colour-coded intensity scale, 30 known area centroids |

### New Admin Sections (inline in AdminDashboard.jsx)
| Section | What it does |
|---------|-------------|
| `AlertsFeedSection` | Three data sources: urgent tickets (priority=urgent), overdue confirmed bookings (>2h), pending verifications. Realtime INSERT/UPDATE + 30s fallback |
| `VerificationQueueSection` | Two-panel layout: partner list + document viewer. All doc fields (ID, certificate, police clearance, business permit, profile photo). Approve/Reject with email trigger. Reject requires a note |
| `RefundManagementSection` | Filters `support_tickets` by `category IN (refund_request, payment_failed)`. Approve/Decline sets `refund_decision` + `resolved_at`. Two-panel with customer message visible |
| `PartnerPerformanceSection` | Joins workers + bookings + reviews. Calculates avg_rating, completion_rate, cancellation_rate per partner. Sortable by 4 criteria. Role filter pills |
| `ReconciliationSection` | 30-day daily bucketing of payments vs payouts. Recharts AreaChart with gradient fills. Daily table with net position per row |
| `FraudRiskSection` | Three panels: safety incidents (30d), repeat claimants (≥3 tickets in 30d grouped by user), suspended/rejected partners with 1-click reinstate/suspend |
| `RevenueForecastSection` | 16-week weekly revenue buckets. Linear regression slope/intercept → 4-week forecast. 10% rolling target above 4-week avg. MoM growth rate stat card. Combined LineChart: actual (solid) + target (dashed yellow) + forecast (dashed red) |
| `PartnerAvailabilitySection` | Live online/offline count per role (6 role cards with colour bars). Area × role grid — green/yellow/red cell per city. Supabase realtime UPDATE subscription + 30s setInterval. Shows last refresh timestamp |

### New Migrations
| File | Purpose |
|------|---------|
| `migrations/add_support_tickets_user_fields.sql` | Adds `user_type`, `user_name`, `user_email`, `resolved_at` to `support_tickets` |
| `migrations/add_refund_decision_column.sql` | Adds `refund_decision TEXT` to `support_tickets` — values: `approved`, `declined`, NULL |

### Key Patterns
- **Heatmap padding escape:** `['live_ops','heatmap'].includes(active) ? { padding:0, overflow:'hidden' } : {}` on `admin-container`
- **GeoJSON source update:** `map.getSource('partners').setData(geoJSON)` on Supabase realtime events (no re-render)
- **Linear regression forecast:** slope = Σ(x-xMean)(y-yMean) / Σ(x-xMean)² inline in RevenueForecastSection
- **Availability realtime:** `supabase.channel('admin-availability').on('postgres_changes', {event:'UPDATE', table:'workers'}, load)` + 30s interval

---

## 🆕 SESSION SUMMARY (June 19, 2026 — Full Admin Build)

### Migrations Added (23 total)
| File | Tables Created |
|------|---------------|
| `create_announcements.sql` | `announcements`, `announcement_reads` |
| `create_reviews.sql` | `reviews`, `partner_ratings` (VIEW) |
| `create_services_catalog.sql` | `service_categories`, `services` |
| `create_promo_codes.sql` | `promo_codes`, `promo_code_uses` |
| `create_content.sql` | `banners`, `faqs` (seeded 8 FAQs) |
| `create_wallet_adjustments.sql` | `wallet_adjustments` |

### Service Files Added
| File | Purpose |
|------|---------|
| `web/src/services/announcementsService.js` | CRUD + DB read tracking + type metadata |
| `web/src/services/reviewsService.js` | Submit + fetch + moderate reviews |
| `web/src/services/promoService.js` | Validate + apply + CRUD promo codes |
| `web/src/services/contentService.js` | Banners + FAQs CRUD |
| `web/src/services/catalogService.js` | Service categories + services CRUD |
| `web/src/services/walletAdminService.js` | Partner wallets, stats, manual adjustments |
| `web/api/broadcast-announcement.js` | Vercel serverless email broadcast (nodemailer, batched) |

### Admin Dashboard — All Sections (Complete)

#### Command Center
| Section ID | Component | Status | Description |
|-----------|-----------|--------|-------------|
| `live_ops` | `LiveOpsMap` | ✅ | Full-screen MapLibre map — all partner roles as GeoJSON dots, realtime Supabase updates, left stats sidebar, click-to-flyTo |
| `alerts` | `AlertsFeedSection` | ✅ | Urgent tickets + overdue confirmed bookings + pending verifications — realtime INSERT/UPDATE + 30s polling |

#### Main Operations
| Section ID | Component | Status | Description |
|-----------|-----------|--------|-------------|
| `overview` | `OverviewSection` | ✅ | KPI stats, recent activity |
| `users` | `UsersSection` | ✅ | Customer list (renamed from Customers) |
| `orders` | `OrdersSection` | ✅ | Unified bookings + moves + supplier orders |
| `quotations` | `QuotationsSection` | ✅ | Inspections pipeline + quotations tracker |
| `support` | `DisputesSection` | ✅ | Unified support center — 6 department filters, SLA badges, status cycle, admin notes |
| `dispute_center` | `DisputeCenterSection` | ✅ | Two-sided dispute resolution — customer + partner statements side-by-side, 5 ruling options, compensation action, admin note, status pipeline |
| `dispatch` | `DispatchSection` | ✅ | Manual job assignment — unassigned bookings list + searchable partner picker with live online/offline status, one-click assign |
| `notifications` | `NotificationsSection` | ✅ | Realtime channel status + ticket feed |

#### Partners
| Section ID | Component | Status | Description |
|-----------|-----------|--------|-------------|
| `partners` | `PartnersSection` | ✅ | All partner types combined |
| `verification` | `VerificationQueueSection` | ✅ | Two-panel document reviewer — photo + docs viewer, Approve/Reject with email trigger, note required for rejection |
| `performance` | `PartnerPerformanceSection` | ✅ | Per-partner avg rating bar, completion %, cancellation % — sortable by 4 criteria, role filter |
| `vendors` | `PartnerTypeSection` | ✅ | Vendors only, filtered by role |
| `suppliers` | `PartnerTypeSection` | ✅ | Suppliers only, filtered by role |
| `movers` | `PartnerTypeSection` | ✅ | Movers only, filtered by role |
| `riders` | `PartnerTypeSection` | ✅ | Riders only, filtered by role (added this session) |
| `water` | `PartnerTypeSection` | ✅ | Water carriers only, filtered by role |
| `workforce` | `WorkforceSection` | ✅ | Workers + crew registry |

#### Finance
| Section ID | Component | Status | Description |
|-----------|-----------|--------|-------------|
| `payments` | `PaymentsSection` | ✅ | Payment records |
| `payouts` | `PayoutsSection` | ✅ | Partner payout management |
| `wallets` | `WalletsSection` | ✅ | Balances, transaction history, manual top-up/deduction |
| `refunds` | `RefundManagementSection` | ✅ | Refund ticket queue — Approve/Decline with admin note, `refund_decision` column tracks outcome |
| `reconciliation` | `ReconciliationSection` | ✅ | 30-day revenue vs payouts area chart + daily breakdown table, net position stat card |
| `tax_report` | `TaxReportSection` | ✅ | VAT (16%) + platform commission (15%) monthly breakdown — period selector, bar chart, totals row, KRA-ready |
| `earnings` | `PartnerEarningsSection` | ✅ | Per-partner earnings statement — ranked list + monthly bar chart + payout table, role filter |
| `marketing` | `MarketingSection` | ✅ | Promo code CRUD + usage stats |

#### Content
| Section ID | Component | Status | Description |
|-----------|-----------|--------|-------------|
| `services` | `ServicesCatalogSection` | ✅ | Category + service two-column editor |
| `content` | `ContentSection` | ✅ | Banner editor (live preview) + FAQ editor |
| `products` | `ProductApprovalsSection` | ✅ | Vendor product approval queue |
| `reviews` | `ReviewsSection` | ✅ | Review moderation — publish/flag/remove |

#### Reports
| Section ID | Component | Status | Description |
|-----------|-----------|--------|-------------|
| `analytics` | `AnalyticsSection` | ✅ | Charts — renamed to Reports & Analytics |
| `heatmap` | `BookingHeatmap` | ✅ | Full-screen MapLibre heatmap — bookings by Nairobi neighbourhood, under-served areas panel, 30 known neighbourhoods with centroids |
| `revenue_forecast` | `RevenueForecastSection` | ✅ | 16-week actuals + 10% rolling target + 4-week linear regression forecast, MoM growth rate |
| `availability` | `PartnerAvailabilitySection` | ✅ | Live online/offline per role with coverage bars + area × role grid, Supabase realtime + 30s auto-refresh |

#### Platform
| Section ID | Component | Status | Description |
|-----------|-----------|--------|-------------|
| `announcements` | `AnnouncementsSection` | ✅ | Broadcasts with 📧 Email + 📱 SMS stub + 🔔 Push stub |
| `service_areas` | `ServiceAreasSection` | ✅ | All 47 Kenya counties + ~350 sub-counties pre-seeded; accordion by county, one-button bulk activate/deactivate, search filter; Nairobi active by default |
| `fraud` | `FraudRiskSection` | ✅ | Safety incidents (30d), repeat claimants (3+ tickets), suspended/rejected partners with reinstate/suspend actions |
| `security` | `SecuritySection` | ✅ | Audit log + RLS/2FA status cards |
| `settings` | `AdminSettings` | ✅ | 8-tab settings panel (see below) |

### Admin Settings — 8 Tabs (All Built)
| Tab | What it covers |
|-----|---------------|
| 👤 My Profile | Avatar upload, name, phone, email change, password change |
| 🔐 Security & 2FA | TOTP QR enroll/verify/disable via Supabase MFA |
| 🏢 Company | Business logo, company name, KRA PIN, reg number, address, support contacts |
| 💰 Finance | Commission rates per partner role, wallet minimum, bank account, M-Pesa paybill |
| 📋 Policies | Cancellation fee + free-cancel window hours |
| 👥 Admin Team | Grant/revoke admin access by email |
| 🔔 Notifications | Email alert preferences (new partner, dispute, payout, product approval) |
| 🗒️ Audit Log | Full admin action history |

### Admin Nav — Final Structure (NAV_GROUPS, 7 groups, 35 items)
```
🖥️ Command Center: Live Operations · Alerts Feed
Main:              Dashboard · Users · Orders · Quotations · Support Center · Dispute Center · Job Dispatch · Notifications
Partners:          All Partners · Verification Queue · Partner Performance · Vendors · Suppliers · Movers · Riders · Water Carriers · Workforce
Finance:           Payments · Payouts · Wallets · Refund Management · Reconciliation · Tax Report · Partner Earnings · Marketing
Content:           Services Catalog · Content (Banners/FAQ) · Product Approvals · Reviews & Ratings
Reports:           Reports & Analytics · Booking Heatmap · Revenue Forecast · Partner Availability
Platform:          Broadcasts · Service Areas · Fraud & Risk · Security & Audit · Settings
```
**Renames:** Customers→Users · Disputes→Support Center · Analytics→Reports & Analytics · Announcements→Broadcasts  
**Added across sessions:** Command Center group · Verification Queue · Partner Performance · Riders · Refund Management · Reconciliation · Booking Heatmap · Revenue Forecast · Partner Availability · Fraud & Risk · Dispute Center · Job Dispatch · Tax Report · Partner Earnings · Service Areas

---

## 🆕 SESSION SUMMARY (June 19, 2026 — Disputes, Dispatch, Earnings, Tax, Kenya Service Areas)

### New Admin Sections Built
| Section | Component | What it does |
|---------|-----------|-------------|
| `dispute_center` | `DisputeCenterSection` | Two-sided dispute resolution — customer + partner statements side by side, 5 ruling options (Customer Wins / Partner Wins / Split / Dismissed / No Fault), compensation action dropdown, admin note, full status pipeline with Reopen |
| `dispatch` | `DispatchSection` | Manual job assignment board — unassigned bookings list, searchable partner picker showing live online/offline badge, one-click assign button |
| `earnings` | `PartnerEarningsSection` | Per-partner earnings statements — ranked list, monthly Recharts BarChart, payout history table, role filter pills |
| `tax_report` | `TaxReportSection` | KRA-ready tax report — 16% VAT + 15% platform commission bucketed monthly, period selector (6m/12m/24m), bar chart, totals summary row |
| `service_areas` | `ServiceAreasSection` | All 47 Kenya counties + ~350 sub-counties pre-seeded; accordion UI per county, bulk Activate/Deactivate All button per county, per-sub-county toggle switch, search filter, Nairobi active by default |

### New Migrations
| File | Purpose |
|------|---------|
| `migrations/create_disputes.sql` | `disputes` table — two-sided (customer + partner statements, evidence URLs), ruling, compensation_action, full audit timestamps |
| `migrations/create_service_areas.sql` | `service_areas` table — county, sub_county, label, is_active, partner_roles, notes; RLS policy |
| `migrations/seed_kenya_service_areas.sql` | Adds UNIQUE constraint on (county, sub_county); seeds all 47 Kenya counties × ~350 sub-counties; Nairobi (18 sub-counties) active, all others inactive; ON CONFLICT DO NOTHING |

### Key Patterns
- **Dispute status pipeline:** `pending → under_review → resolved`; Reopen resets to `under_review`
- **Bulk county toggle:** `supabase.from('service_areas').update({ is_active: activate }).eq('county', county)` — single query flips entire county
- **VAT_RATE = 0.16** (Kenya), platform commission = 0.15 — both applied in TaxReportSection monthly buckets
- **Kenya administrative data:** 47 counties, ~350 sub-counties, UNIQUE (county, sub_county) prevents duplicate seeds

### Pending (not yet wired)
- `seed_kenya_service_areas.sql` must be run **after** `create_service_areas.sql` (not included in `_RUN_ALL_IN_ORDER.sql`)
- SMS broadcast: wire `AFRICASTALKING_KEY` in `.env`
- Push broadcast: wire `FIREBASE_SERVER_KEY` in `.env`
- Security audit log: nothing yet writes to `admin_audit_log` table

---

### Broadcast Channels (per announcement)
| Channel | Status | Notes |
|---------|--------|-------|
| 📧 Email | ✅ Live | Vercel serverless, nodemailer, batched 10/500ms |
| 📱 SMS | 🔜 Stub | Wire `AFRICASTALKING_KEY` in `.env` to activate |
| 🔔 Push | 🔜 Stub | Wire `FIREBASE_SERVER_KEY` in `.env` to activate |

### Customer/Partner App — Announcement System
- `AnnouncementBanner.jsx` in both web + worker apps
- DB-backed read tracking (`announcement_reads` table, replaces localStorage)
- Supabase Realtime → notification bell for new announcements
- `HomePage.jsx`: banner between carousel and services grid
- Partner `Layout.jsx`: banner in mobile and desktop layouts

---

## ✅ CUSTOMER-FACING FEATURES (All Complete)

| Feature | File(s) | Detail |
|---------|---------|--------|
| Review form after job | `ReviewPage.jsx` (was already built) | Full star rating, category ratings, quick tags, work summary. Triggered from `WorkerAssignmentPage` on OTP completion. Routes: `/review` and `/review/:bookingId` |
| Promo code at checkout | `PaymentPage.jsx` (rebuilt) | Promo code input with real-time validation via `validatePromoCode()`. Shows discount, strikethrough original price, records usage via `applyPromoCode()` on confirm |
| DB-driven homepage banners | `HomePage.jsx` (updated) | Loads from `banners` table via `getActiveBanners()`. Falls back to hardcoded `FALLBACK_PROMOS` if DB returns empty. Banner `link_path` field enables "Learn more →" navigation |
| FAQ page | `FAQPage.jsx` (new) + `App.jsx` route `/faq` | Reads from `faqs` table via `getFAQs('customers')`. Accordion expand/collapse, search, category filter pills, grouped display, contact support CTA. Added to sidebar nav as 💡 FAQ |

---

## 📊 PROJECT OVERVIEW

**Fixera** is a two-sided home services marketplace connecting customers with service providers.

### **Two Applications:**
1. **Customer App** (fixera-web) - For customers to book services
2. **Partner App** - For service providers to manage jobs

### **Tech Stack:**
- React 18.3.1 + Vite 5 (build system)
- Supabase (PostgreSQL database)
- NodeMailer (email service)
- Vercel (cloud deployment)
- Gmail SMTP (email sending)

---

## ✅ COMPLETED FEATURES

### 1️⃣ **EMAIL SYSTEM** ✅ BUILT
**Status:** Fully functional, ready for integration

**Components Built:**
- `C:\fixera\web\src\services\emailService.js` - Main email service
- `C:\fixera\web\.env.local` - Gmail credentials
- `EMAIL-SETUP-GUIDE.md` - Configuration guide

**Features:**
- ✅ Booking confirmation emails
- ✅ Payment receipt emails
- ✅ Support ticket confirmation emails
- ✅ Support team notifications
- ✅ Professional HTML templates (dark navy + gold branding)
- ✅ Responsive design (mobile-friendly)

**Configuration:**
```env
REACT_APP_GMAIL_EMAIL=fixera.service1@gmail.com
REACT_APP_GMAIL_PASSWORD=tlsjjnbxchphwcau
```

**Gmail Setup:**
- Account: fixera.service1@gmail.com
- 2-Step Verification: ✅ Enabled
- App Password: ✅ Generated (16 characters)

**Email Templates:**
1. Booking Confirmation - service details, date, time, worker, price
2. Payment Receipt - receipt number, amount, payment status
3. Support Ticket - ticket ID, category, status, response time
4. Support Team Notification - internal alert for new tickets

**Integration Status (COMPLETE ✅):**
- [x] BookingConfirmationPage - Sends email after booking is saved
  - File: `C:\fixera\web\src\pages\main\BookingConfirmationPage.jsx`
  - Triggers: When user confirms booking
  - Includes: Service, date, time, address, worker, price

- [x] ReceiptPage - Sends email when receipt is loaded
  - File: `C:\fixera\web\src\pages\main\ReceiptPage.jsx`
  - Triggers: When payment receipt is viewed
  - Includes: Receipt number, service, worker, amount, date

- [x] SupportPage - Sends emails for support tickets
  - File: `C:\fixera\web\src\pages\main\SupportPage.jsx`
  - Triggers: When support ticket is submitted
  - Features: 
    - Confirmation email to customer
    - Notification email to support team
    - Database ticket creation

---

### 2️⃣ **ADMIN DASHBOARD** ✅ BUILT (Front-end)
**Status:** UI complete, authentication integrated

**Components Built:**
- `C:\fixera\web\src\pages\admin\AdminDashboard.jsx` - Full dashboard
- `C:\fixera\web\src\pages\admin\AdminLoginPage.jsx` - Separate admin login
- `C:\fixera\web\src\components\AdminRoute.jsx` - Admin protection

**Dashboard Sections (8 total):**
1. **Overview** - Key metrics, quick stats
2. **Partners** - Manage service providers
3. **Users** - Manage customers
4. **Jobs** - View all bookings
5. **Payments** - Transaction history
6. **Analytics** - 5 detailed charts
7. **Disputes** - Handle complaints
8. **Payouts** - Manage partner payouts

**Admin Authentication:**
- Separate login at: `/admin/login`
- Uses Supabase authentication
- Requires `is_admin = true` in profiles table
- Admin only - regular customers cannot access

**Database:**
- Profiles table has `is_admin` boolean column ✅ (already existed)
- User set as admin: ✅

**Routes:**
- `/admin/login` - Admin login page
- `/admin` - Admin dashboard (protected)

---

### 3️⃣ **WORKER APP FEATURE** ✅ BUILT
**Status:** Request Completion Code via WhatsApp

**Feature:** Request Completion Code from Customer
- **File:** `C:\fixera\worker\src\pages\main\JobDetailPage.jsx`
- **Button:** "💬 Request Completion Code via WhatsApp"
- **When it shows:** When worker is viewing their own in-progress job
- **What it does:**
  - Opens WhatsApp automatically
  - Pre-fills message asking for completion code
  - Worker can send with one click
  - No need to type message manually

**Benefits:**
- ✅ Easy customer communication
- ✅ One-click WhatsApp integration
- ✅ Prevents confusion about code request
- ✅ Streamlines job completion process

---

## 🚀 DEPLOYMENTS

### **Customer App**
- **Local:** http://localhost:5173
- **Vercel:** https://fixera-web.vercel.app
- **Admin Dashboard:** https://fixera-web.vercel.app/admin
- **Admin Login:** https://fixera-web.vercel.app/admin/login
- **Status:** ✅ Deployed

### **Partner App**
- **Local:** http://localhost:5174
- **Vercel:** https://partner-app-five.vercel.app
- **Status:** ✅ Deployed

---

## 🔐 ENVIRONMENT VARIABLES

### **Local (.env.local)**
```env
REACT_APP_GMAIL_EMAIL=fixera.service1@gmail.com
REACT_APP_GMAIL_PASSWORD=tlsjjnbxchphwcau
```

### **Vercel (ADDED ✅)**
Location: Vercel Dashboard → fixera-web → Settings → Environments → Production

**Variables Added:**
```
REACT_APP_GMAIL_EMAIL = fixera.service1@gmail.com
REACT_APP_GMAIL_PASSWORD = tlsjjnbxchphwcau
```

**Status:** ✅ COMPLETE - Variables configured in Production environment
**Next:** Redeploy customer app to activate variables

---

## 📁 FILE STRUCTURE

```
C:\fixera\
├── web\
│   ├── src\
│   │   ├── services\
│   │   │   ├── emailService.js              ✅ Email sending
│   │   │   └── movingService.js            ✅ Movers module Supabase ops
│   │   ├── pages\
│   │   │   ├── admin\
│   │   │   │   ├── AdminDashboard.jsx       ✅ Dashboard UI
│   │   │   │   └── AdminLoginPage.jsx       ✅ Admin login
│   │   │   ├── auth\
│   │   │   │   ├── LoginPage.jsx            ✅ Customer login
│   │   │   │   ├── SignUpPage.jsx           ✅ Customer signup
│   │   │   │   └── ... (other auth pages)
│   │   │   └── main\
│   │   │       ├── HomePage.jsx             ✅ Home
│   │   │       ├── MoversPage.jsx          ✅ 6-step movers booking flow
│   │   │       ├── BookingFormPage.jsx      ✅ Booking
│   │   │       ├── ReceiptPage.jsx          ✅ Receipts
│   │   │       └── ... (other pages)
│   │   ├── components\
│   │   │   ├── AdminRoute.jsx               ✅ Admin protection
│   │   │   ├── ProtectedRoute.jsx           ✅ Customer protection
│   │   │   ├── Layout.jsx                   ✅ App layout
│   │   │   ├── FixeraAI.jsx                 ✅ AI chatbot
│   │   │   └── ... (other components)
│   │   ├── App.jsx                          ✅ Routes configured
│   │   └── theme.js                         ✅ Design system
│   ├── .env.local                           ✅ Email config
│   ├── EMAIL-SETUP-GUIDE.md                 ✅ Email guide
│   ├── package.json                         ✅ Dependencies
│   └── vite.config.js                       ✅ Build config
├── worker\
│   ├── src\
│   │   ├── pages\
│   │   │   └── main\
│   │   │       └── JobDetailPage.jsx        ✅ Request code feature
│   │   └── ... (other components)
│   └── ... (worker app files)
└── FIXERA-MASTER-DOCUMENTATION.md           ✅ This file
```

---

## 🔄 ISSUE RESOLUTION LOG

### **Issue 1: Blank Page (Customer App)**
- **Problem:** Customer app showed blank page after email integration
- **Root Cause:** EmailTestPage imported emailService.js (NodeMailer), which is Node.js only
- **Solution:** Removed EmailTestPage import and route from App.jsx
- **Status:** ✅ FIXED - App loads correctly

### **Issue 2: PowerShell Command Syntax**
- **Problem:** `cd C:\fixera\web && npm run dev` failed
- **Root Cause:** PowerShell doesn't support `&&`
- **Solution:** Used `;` instead: `cd C:\fixera\web; npm run dev`
- **Status:** ✅ FIXED

### **Issue 3: Gmail App Password Confusion**
- **Problem:** User unsure about Gmail password vs. App Password
- **Root Cause:** Two different passwords exist
- **Solution:** Clarified: App Password is for Fixera only, Gmail password unchanged
- **Status:** ✅ FIXED - User obtained app password

### **Issue 4: 2-Step Verification Required**
- **Problem:** Couldn't access apppasswords page (broken machine icon)
- **Root Cause:** 2-Step Verification not enabled
- **Solution:** Enabled at myaccount.google.com/security
- **Status:** ✅ FIXED

### **Issue 5: Admin Login Not Showing**
- **Problem:** `/admin/login` redirected to home instead of showing form
- **Root Cause:** Route not properly configured or admin protection interfering
- **Solution:** Created separate AdminLoginPage component with proper routing
- **Status:** ✅ FIXED - Admin login now accessible

---

## 📋 PENDING TASKS (Priority Order)

### **IMMEDIATE (THIS WEEK - IN PROGRESS):**
- [x] **1. Add Env Vars to Vercel** ✅ DONE
  - [x] Added REACT_APP_GMAIL_EMAIL to Vercel Production
  - [x] Added REACT_APP_GMAIL_PASSWORD to Vercel Production
  - ⏳ Redeploy customer app (awaiting user action)
  - [ ] Test email system on production (after redeploy)

- [x] **2. Integrate Email into Pages** ✅ DONE
  - [x] Added sendBookingConfirmation() to BookingConfirmationPage
  - [x] Added sendReceipt() to ReceiptPage
  - [x] Added sendSupportTicketConfirmation() + notifySupportTeam() to SupportPage
  - ⏳ Test all email flows end-to-end (after redeploy)

- [x] **3. Worker App Feature** ✅ DONE
  - [x] Added "Request Completion Code" WhatsApp button
  - [x] Integrated into JobDetailPage
  - [x] Pre-fills message for worker convenience

- [ ] **4. M-Pesa Payment Integration** ⭐⭐⭐ (CRITICAL - NEXT)
  - [ ] Set up M-Pesa API account
  - [ ] Create payment service module
  - [ ] Integrate into checkout flow
  - [ ] Test with test credentials
  - **This MUST be done before launch**

### **THIS MONTH:**
- [ ] Domain Registration
  - Register fixera.co.ke
  - Set up DNS records

- [ ] SSL Certificate
  - Generate SSL for domain
  - Configure HTTPS

- [ ] Email Production Setup
  - Switch from Gmail to professional service (SendGrid/Mailgun)
  - Set up noreply@fixera.co.ke
  - Configure SPF/DKIM/DMARC

- [ ] End-to-End Testing
  - Test entire booking flow on phone
  - Test all email scenarios
  - Test payment processing
  - Test admin dashboard features

### **FUTURE (Nice-to-Have):**
- [ ] SMS Notifications (optional)
- [ ] Push Notifications (optional)
- [ ] Analytics Dashboard improvements
- [ ] Dispute resolution workflow

---

## 🧪 TESTING CHECKLIST

### **Local Testing (COMPLETE ✅):**
- [x] Customer app loads (`npm run dev`)
- [x] Worker app loads
- [x] Admin login accessible at `/admin/login`
- [x] Admin dashboard loads after login
- [x] Email service configured
- [x] Booking confirmation email integrated
- [x] Receipt email integrated
- [x] Support ticket email integrated
- [x] Worker app: Request code button shows
- [x] Worker app: WhatsApp pre-fill works

### **Vercel Testing (IN PROGRESS ⏳):**
- ⏳ Add env vars to Vercel (DONE - awaiting redeploy)
- [ ] Apps load on Vercel after redeploy
- [ ] Admin login works on Vercel
- [ ] Admin dashboard works on production
- [ ] Test emails send from Vercel
- [ ] Booking → email → receipt flow works
- [ ] Support ticket → email flow works
- [ ] Worker app: Request code works on Vercel
- [ ] Phone testing of all features

---

## 🔒 SECURITY NOTES

### **Email:**
- ✅ Gmail app password (revocable anytime)
- ✅ Not committed to git (.env.local in .gitignore)
- ✅ Less risky than main Gmail password
- ⚠️ Production: Switch to professional email service

### **Admin Access:**
- ✅ Separate login page (not customer login)
- ✅ Supabase authentication
- ✅ is_admin check required
- ✅ AdminRoute protects dashboard

### **Environment Variables:**
- ⚠️ Passwords visible in Vercel Settings
- ✅ Use professional email service in production
- ✅ Implement role-based access control (RBAC)

---

## 📞 CONTACT & CREDENTIALS

### **Gmail Account:**
- Email: fixera.service1@gmail.com
- App Password: tlsjjnbxchphwcau (16 chars)
- 2-Step Verification: Enabled

### **Supabase:**
- Project: Fixera
- Database: PostgreSQL
- Auth Method: Email/Password
- Admin Check: is_admin boolean in profiles table

### **Vercel:**
- Team: Personal
- Customer App: fixera-web
- Partner App: partner-app
- Both: Deployed and running

---

## 📚 DOCUMENTATION FILES

1. **EMAIL-SETUP-GUIDE.md** - Email system configuration
   - Gmail setup steps
   - Template details
   - Integration instructions
   - Troubleshooting

2. **FIXERA-MASTER-DOCUMENTATION.md** - This file
   - Complete project overview
   - All systems and components
   - Deployment status
   - Task tracking

---

## 🎯 NEXT IMMEDIATE ACTIONS

1. ✅ **Admin Login:** Done - working locally
2. ✅ **Email Integration:** Done - all pages integrated
3. ✅ **Env Vars to Vercel:** Done - variables configured
4. ⏳ **REDEPLOY CUSTOMER APP** - Next step to activate emails on Vercel
5. ⏳ **M-Pesa Setup:** Critical before launch
6. ⏳ **Phone Testing:** Full end-to-end flow

---

## 📝 SESSION SUMMARY (June 5, 2026)

**COMPLETED THIS SESSION:**

✅ **Email System Integration (COMPLETE)**
- Integrated booking confirmation emails into BookingConfirmationPage
- Integrated receipt emails into ReceiptPage  
- Integrated support ticket emails into SupportPage
- All emails send after relevant actions with customer data

✅ **Admin System (COMPLETE)**
- Created separate AdminLoginPage at `/admin/login`
- Implemented Supabase admin authentication via `is_admin` column
- Admin dashboard fully protected and accessible only to admins
- Tested and verified working locally

✅ **Worker App Feature (COMPLETE)**
- Added "Request Completion Code via WhatsApp" button to JobDetailPage
- Opens WhatsApp with pre-filled message asking for code
- One-click access for workers to contact customers
- Improves job completion workflow

✅ **Vercel Environment Variables (COMPLETE)**
- Added REACT_APP_GMAIL_EMAIL to Vercel Production settings
- Added REACT_APP_GMAIL_PASSWORD to Vercel Production settings
- Ready to redeploy and activate email system on production

**DOCUMENTATION:**
- Created comprehensive FIXERA-MASTER-DOCUMENTATION.md
- Updated with all completed features and current status
- Clear task tracking and testing checklist

**Status:** 🟢 ON TRACK - Email integration complete, ready for Vercel testing

**Critical Path Remaining:**
1. Redeploy customer app (activate email system on Vercel)
2. M-Pesa payment integration (critical before launch)
3. Full end-to-end testing on phone
4. Domain registration & production email setup

---

## 📝 SESSION SUMMARY (June 10, 2026)

### ✅ 1. GUEST MODE / OPTIONAL LOGIN (COMPLETE — Bolt Model)

Customers can now browse Fixera WITHOUT creating an account. Their contacts
are captured up-front (like Bolt), and they convert to a real account only
when confirming a booking.

**The Flow:**
1. Welcome page or Login page → "👋 Continue as Guest"
2. Modal captures Name + Phone (email optional) — validated Kenyan phone format
3. Contact saved to localStorage AND `guest_contacts` table in Supabase (lead capture)
4. Guest browses the full app freely (sidebar shows "Guest")
5. Guest clicks "Confirm Booking" → personalized "One last step!" prompt
6. "Complete My Booking →" → Signup page with name/phone/email PREFILLED
7. After signup → returns to the exact booking they were making (details preserved)
8. Guest lead marked `converted_to_user = true` in database

**Files Created:**
- `web/src/components/GuestContactModal.jsx` — Bolt-style contact capture modal
- `migrations/create_guest_contacts.sql` — guest_contacts table + RLS policies
  ⚠️ MUST RUN in Supabase SQL Editor before deploy!

**Files Modified:**
- `web/src/hooks/useAuth.jsx` — added isGuest, guestContact, continueAsGuest(),
  exitGuestMode(), markGuestConverted(); guest mode auto-clears on real login
- `web/src/components/ProtectedRoute.jsx` — guests pass through (user OR isGuest)
- `web/src/pages/auth/LoginPage.jsx` — "Continue as Guest" button + divider
- `web/src/pages/auth/WelcomePage.jsx` — "Just browsing? Continue as Guest" link
- `web/src/pages/auth/SignUpPage.jsx` — accepts prefill + returnTo state;
  "Almost done!" header for converting guests
- `web/src/pages/main/BookingConfirmationPage.jsx` — guest conversion gate before booking
- `web/src/pages/main/LaundryPage.jsx` — guest guard on handleBook
- `web/src/pages/main/CarpetWashingPage.jsx` — guest guard on handleConfirm
- `web/src/pages/main/InspectionRequestPage.jsx` — guest guard on handleSubmit
- `web/src/pages/main/BookingHistoryPage.jsx` — no infinite spinner for guests
- `web/src/pages/main/ProfilePage.jsx` — no infinite stats loading for guests

**Verified in browser:** full flow tested end-to-end on localhost — zero console errors.

**⚠️ DESIGN RULE — Guest mode is CUSTOMER APP ONLY:**
The partner app (`C:\fixera\worker`) must ALWAYS require compulsory login —
no guest access ever. Verified June 10: partner app's ProtectedRoute enforces
logged-in user + valid profile + completed onboarding + correct partner role,
and contains zero guest code. Any future partner app work must keep it that way.

### ✅ 2. CRITICAL FIX: Email Service Was Crashing The Entire App

**Problem found:** `emailService.js` imported NodeMailer at the top level.
NodeMailer is Node.js-only — it CANNOT run in a browser. Because
BookingConfirmationPage, ReceiptPage and SupportPage import emailService,
the WHOLE customer app rendered a blank page (React never mounted).
This was the real cause of the earlier "blank page" issue.

**Security issue also fixed:** the Gmail App Password was embedded in
client-side code via REACT_APP_ vars — anyone could extract it from the
public JS bundle.

**The Fix (proper architecture):**
- `web/src/services/emailService.js` — REWRITTEN browser-safe. Keeps all
  4 HTML templates; send functions now POST to `/api/send-email`.
  Email failures never block the user flow (non-throwing).
- `web/api/send-email.js` — NEW Vercel serverless function. Runs NodeMailer
  server-side with GMAIL_EMAIL / GMAIL_PASSWORD env vars.

**⚠️ ACTION NEEDED ON VERCEL:** add `GMAIL_EMAIL` and `GMAIL_PASSWORD`
(without REACT_APP_ prefix) as environment variables, then redeploy.
The old REACT_APP_ ones still work as fallback but should be removed
from the client for security.

### ✅ 3. LEGAL DOCUMENTATION (COMPLETE — June 10)
- 6 partner types: Service Workers, Vendors, Riders, Suppliers, Movers, Water Carriers
- Commissions: Workers 15%, Riders 15%, Vendors 20%, Suppliers 20%, Movers 20%, Water Carriers 20%
- Wallet system: ONLY Service Workers & Riders — KSh 500 minimum,
  larger deposits unlock more job opportunities
- Files: `FIXERA-LEGAL-DOCUMENTATION-CORRECTED.txt`, `FIXERA-LEGAL-DOCUMENTATION-CLEAN.txt`,
  `FIXERA-LEGAL-DOCUMENTATION-CORRECTED.docx` (sent to lawyer)

### ✅ 4. MOVERS & WATER CARRIERS CATEGORIES (COMPLETE — June 10)

Two new top-level services added to `web/src/data/services.js` — the entire
app (home grid, category pages, sub-service pages, booking flow) picks them
up automatically because everything is data-driven.

**📦 MOVERS** (`id: movers`, purple #9F7AEA) — 5 categories, 17 services:
- House Moving, Office & Business Moving, Single Item Transport, Packing & Labour, 🚨 Same-Day/Urgent

**⚠️ MOVERS PRICING RULE (June 11, 2026 — owner decision):**
ALL movers services are 100% QUOTATION-based — NO fixed prices displayed.
Reason: price depends on DISTANCE + GOODS VOLUME + VEHICLE SIZE
(pickup/Canter/lorry) + access (floors/stairs) — none known at booking time.
App shows "Quote on inspection" for every movers service.
Flow: customer requests → mover assesses → quote sent → customer approves → job.
Internal guide rates + quote formula documented in MOVERS-WATER-CARRIERS-PRICING.md
(for quote-reasonableness checks only — never customer-facing).
Future: dedicated movers quote form with pickup+destination map pins (after M-Pesa).

**📦 MOVERS MODULE BLUEPRINT (June 11, 2026 — owner specification):**
Full system designed in `FIXERA-MOVERS-MODULE-BLUEPRINT.md` — 17 components:
mover/fleet/worker registration, photo-based booking, digital inventory system,
Uber-style vehicle selection, quotation marketplace (movers bid, customer compares),
team assignment with crew photos, live GPS tracking, loading/delivery verification,
digital sign-off, claims system with evidence chain, ratings, admin controls,
Phase-3 AI features (inventory recognition, truck recommendation, price estimation).
Implementation phased: Phase 1 MVP (registration→quotes→sign-off→claims),
Phase 2 (GPS + chat), Phase 3 (AI). 9 database tables specced.
5 open decisions pending owner: payment timing, quote SLA, cancellation fees,
insurance threshold, service areas.

**💧 WATER DELIVERY** (`id: water-carriers`, cyan #00B5D8) — 5 categories, 14 services:
- Jerrycan Delivery 20L: 1–5 (400–700), 6–10 (700–1,100), 11–20 (1,100–1,800), 20+ (quote)
- Drinking Water: dispenser refill (300–700), 5× bottles (1,200–2,200)
- Bulk Water Bowser: 1,000L (2.5K–5.5K), 5,000L (6K–12K), 10,000L+ (quote), tank filling (quote)
- Scheduled Delivery: weekly (350–650/trip), monthly plan (quote)
- 🚨 Emergency Water: same-day (800–2K), shortage rescue (3K–8K)

**Verified in browser:** home page shows both new cards; Movers page shows
all 5 categories; House Moving + Jerrycan pricing render correctly. Zero errors.

**Pricing strategy document created:** `MOVERS-WATER-CARRIERS-PRICING.md`
- Full price tables + 20% commission breakdowns with examples
- Revenue projections: ~KSh 2.3M/year each → KSh 4.6M/year combined
- Surge rules + anti-gouging cap (never exceed priceMax + 30%)
- Partner requirement links to legal docs

### ✅ 5. MOVERS MODULE — SYSTEMATIC BOOKING FLOW (COMPLETE — June 11)

Replaced the static movers category listing with a full 6-step systematic
booking flow based on the Movers Module Blueprint. Customers now go through
a guided process instead of seeing generic service cards.

**The 6-Step Flow:**
1. **Locations** — Pickup + Destination + preferred date
2. **Property Type** — Studio / 1BR / 2BR / 3BR / House / Office / Warehouse
3. **Photos** — Upload up to 10 photos of rooms, furniture, appliances
4. **Digital Inventory** — Select items + quantities (Furniture, Appliances, Boxes)
   Becomes the legal inventory record for the move
5. **Vehicle Selection** — Uber/Bolt style: Pickup / Van / 3-Ton / 5-Ton / 10-Ton
   with capacity & suitability guidance
6. **Review & Submit** — Summary of all details + "Submit for Quotes"
   → Movers receive request → send competing quotations → customer compares & picks

**Files Created:**
- `web/src/pages/main/MoversPage.jsx` — Multi-step booking page (6 steps)
- `web/src/services/movingService.js` — Supabase operations (create request,
  get quotes, accept/decline quotes, photo upload to moving-photos bucket)
- `migrations/create_movers_module.sql` — moving_requests + moving_quotes tables
  with RLS policies + storage bucket ⚠️ MUST RUN in Supabase SQL Editor

**Files Modified:**
- `web/src/App.jsx` — Added `/movers` route + imported MoversPage
- `web/src/pages/main/HomePage.jsx` — Movers card now navigates to `/movers`
  instead of `/service/movers`
- `web/src/pages/main/ServiceCategoryPage.jsx` — Redirects `/service/movers`
  to `/movers` for any old/direct links

**Design decisions:**
- Guest users hitting "Submit for Quotes" are redirected to signup (same
  pattern as other booking pages)
- Photos are optional (helpful but not required for a quote)
- Inventory is optional (movers can assess from photos + property type)
- Vehicle selection is a "preference" — movers may suggest different in quotes
- "No price yet — that's by design!" card explains the quotation marketplace model
- Fixed bottom navigation bar with Back/Next for smooth step progression

**Verified in browser:** all 6 steps render correctly, progress bar advances,
data flows between steps, review summary shows all selections. Zero console errors.

### ✅ 5b. POST-SUBMISSION FLOW — Quotes, Team & Support (June 11)

After submitting the request, the customer lands on a status page that walks
them through the rest of the move. Continues the blueprint past component 7.

**New page:** `web/src/pages/main/MovingRequestStatusPage.jsx` at route
`/movers/request/:id`. Renders one of 6 states based on `request.status`:

1. **awaiting_quotes** — "Waiting for movers" banner + quotes-as-they-arrive
   list + Cancel Request button
2. **quoted** — Full marketplace: compare all quotes (mover name, ★ rating,
   price, vehicle + plate, # workers, ETA, message). Accept or Decline each
3. **accepted** — TEAM ASSIGNMENT screen the user asked about:
   - 🚚 Assigned Vehicle card with plate number in monospace white tag
   - 👥 Your Moving Team — each crew member as a card with:
     * Profile photo (placeholder when not uploaded)
     * Full name
     * Role icon + label (Driver / Team Leader / Loader / Packer)
     * **⭐ SUPERVISOR badge** highlighted in gold on the Team Leader
     * 📞 Call button per worker
   - Empty state shown until mover assigns the crew
4. **in_progress** — Active move banner + Live GPS placeholder (Phase 2) +
   support panel for any difficulty
5. **completed** — Thanks + "Leave a Review" CTA
6. **cancelled** — Final state + "Start New Request" CTA

**New component:** `web/src/components/MovingSupportSection.jsx` — reusable
support block shown in accepted + in_progress states. Four channels:
- 📞 Call Fixera (24/7)
- 💬 WhatsApp Fixera Support (pre-filled with request ID)
- 🚚 Call Mover (direct line — only shown when mover phone is assigned)
- 🚨 Report Issue (opens form with 7 categories: delay, crew issue, damage,
  missing item, safety concern, payment dispute, other)
  Submits to new `moving_support_tickets` table

**Database changes** (added to `migrations/create_movers_module.sql`):
- `moving_requests` columns: `assigned_crew JSONB`, `assigned_vehicle_plate`,
  `mover_company_name`, `mover_phone`
- New table: `moving_support_tickets` (request_id, reporter_type, category,
  description, status) with RLS
- New storage bucket: `mover-worker-photos` for crew profile pictures

**Service file updates** (`web/src/services/movingService.js`):
- `getMovingRequest(id)` — fetch single request
- `reportMovingIssue(requestId, userId, category, description)` — file ticket
- `cancelMovingRequest(requestId)` — set status to cancelled

**MoversPage updated:** after `createMovingRequest()` succeeds, navigates to
`/movers/request/:id` (replaces the standalone success screen).

**Verified in browser** with mock fixtures (temporary, since DB migration
not yet run): all 6 states render correctly. Specifically confirmed:
- Quoted state shows 3 mover quotes side-by-side with full details
- Accepted state shows 4-person crew with Yusuf Otieno highlighted as
  ⭐ SUPERVISOR (Team Leader), individual 📞 call buttons per worker, and
  vehicle plate "KDA 234B" prominently displayed
- In-progress state shows GPS placeholder + all 4 support channels (Call
  Fixera, WhatsApp, Call Mover with company name, Report Issue)

### ✅ 6. PARTNER APP — MOVER FLOW + UNIVERSAL CREW REGISTRY (June 11)

The customer Movers Module has its full partner-side counterpart, plus a
universal crew dashboard for every partner type that employs workers.

**6a. Universal Crew Registry — Safety-First Fixera Record**

Every worker a mover/vendor/water carrier/supplier employs is **permanently**
registered with Fixera (name, national ID, photo, position). Even when a
worker is brought on "temporarily" for one job, Fixera already has their
verified identity on file — protecting customers and giving Fixera
accountability for disputes, theft, damage, or harassment claims.

**New DB:** `migrations/create_partner_crew.sql`
- `partner_crew_members` table (`partner_user_id`, `partner_type`,
  `full_name`, `national_id` UNIQUE per partner, `phone`, `photo_url`,
  `default_position`, `status`, `fixera_verified`, `notes`)
- RLS: each partner sees only their own crew; Fixera admins see ALL crew
- Storage bucket `crew-photos` for portrait uploads

**New service:** `worker/src/services/crewService.js`
- `listCrew`, `addCrewMember`, `updateCrewMember`, `setCrewStatus`,
  `deleteCrewMember`, `uploadCrewPhoto`
- `POSITION_OPTIONS` per partner type:
  * Movers: Team Leader/Supervisor, Driver, Loader, Packer
  * Vendors: Supervisor, Technician, Washer, Ironer, Delivery
  * Water Carriers: Supervisor, Driver, Loader, Delivery Attendant
  * Suppliers: Supervisor, Warehouse, Driver, Loader

**New page:** `worker/src/pages/crew/CrewManagementPage.jsx` at `/crew`
- Shows safety notice banner explaining Fixera's permanent file rule
- "+ Add Crew Member" → form with photo upload, name, national ID, phone,
  position grid, notes
- Active vs Inactive section split
- Each crew card shows photo, name, ⭐ SUPERVISOR badge if Team
  Leader/Supervisor, ✓ VERIFIED badge once Fixera admin approves, position
  icon+label, ID, phone
- Per-row actions: Edit · Pause/Resume (status toggle) · Delete

**6b. Mover Partner Dashboard**

**New service:** `worker/src/services/moverService.js`
- `listOpenMovingRequests`, `getMovingRequest`, `listMyQuotes`,
  `submitQuote` (auto-bumps request `awaiting_quotes` → `quoted`),
  `assignTeam`, `startMove`, `completeMove`

**New pages:**
- `worker/src/pages/mover/MoverDashboard.jsx` at `/mover/dashboard`
  - Three stats: Open Requests · Accepted Jobs · Total Quotes
  - Three tabs: Open · My Jobs · History
  - Each request card shows pickup → destination route, vehicle preference,
    item count, moving date, "Quote now" / "You quoted" / status badge
- `worker/src/pages/mover/MoverRequestPage.jsx` at `/mover/request/:id`
  - Full customer request: locations, property, prefer vehicle, date, notes
  - Customer's digital inventory + photo gallery
  - **When `awaiting_quotes`/`quoted`** → "💰 Send Quote" form (price,
    vehicle, plate, # workers, ETA, message). Submitting changes status
    to `quoted`
  - **When `accepted`** → "👥 Assign Team Now" panel that:
    * Lists ONLY the mover's active registered crew from
      `partner_crew_members` (cannot assign anyone who isn't on Fixera's file)
    * Tap to pick crew (multi-select with ⭐ badge for Team Leader)
    * Vehicle plate input
    * On confirm: snapshots picked crew (name+role+photo+phone) into
      `moving_requests.assigned_crew`, sets `assigned_vehicle_plate`,
      `mover_company_name`, `mover_phone`
    * Customer status page IMMEDIATELY shows the crew + Supervisor badge
  - **When `in_progress`** → "✅ Mark Move Complete" button
  - Empty crew → guided redirect to `/crew` to register workers first

**6c. Layout + Routing updates**

- `worker/src/App.jsx` — added imports + routes for `/mover/dashboard`,
  `/mover/request/:id`, `/crew`
- `worker/src/components/Layout.jsx` —
  * Added `mover` + `water_carrier` to `NAV_BY_ROLE`, `FULL_NAV_BY_ROLE`,
    `ROLE_LABELS`
  * Bottom nav for movers: Requests / Crew / Earnings / Support
  * Crew tab also added to vendor, supplier, water_carrier bottom nav
- `worker/src/components/ProtectedRoute.jsx` — added `mover` + `water_carrier`
  to `ROLE_HOME` so role-based redirects work

**Verification:** Both apps build cleanly with `npx vite build`:
- Customer app: 843 modules transformed ✓
- Partner app: 300 modules transformed ✓
- Zero errors, only standard chunk-size warnings (unrelated).

### 🗄️ MIGRATIONS TO RUN BEFORE THIS GOES LIVE

New owner-facing guide: `SUPABASE-RUN-MIGRATIONS.md` (step-by-step screens
for clicking through Supabase SQL Editor). Files to run in order:
1. `migrations/create_guest_contacts.sql` — DONE ✅
2. `migrations/create_movers_module.sql` — DONE ✅
3. `migrations/create_partner_crew.sql` — DONE ✅
4. `migrations/add_mover_watercarrier_columns.sql` — ⏳ run for the new signup fields

### ✅ 7. PARTNER APP — MOVER & WATER CARRIER SIGNUP + LEGAL ALIGNMENT (June 11)

The partner app's RegisterPage now shows **all 6 partner types** as
selectable tiles. Anyone can sign up as Mover or Water Carrier directly
— no manual Supabase intervention needed. Signup fields now legally
align with `FIXERA-LEGAL-DOCUMENTATION-CORRECTED.txt` §1007 (Movers) and
§1087 (Water Carriers).

**Changes:**
- `worker/src/pages/auth/RegisterPage.jsx`:
  - Added 🚚 **Mover** (purple #9F7AEA) and 🚰 **Water Carrier** (cyan #00B5D8)
    role tiles to step-0 role picker (now 6 tiles)
  - Mover step-1 fields: Company Name, Registration #, KRA Tax PIN (optional)
    + purple info chip "🛡️ After signup you'll register your fleet (vehicles)
    and crew. Insurance & business license verified by Fixera before going live."
  - Water Carrier step-1 fields: Company Name, Service Areas, Water Source
    (Borehole / County / Private / Mixed) + cyan info chip
  - Updated `isDetailsValid()` for both new roles
  - Generic `${r.color}20` background for selected role tiles (was a 4-color
    hard-coded ternary that wouldn't paint the new tiles)
  - Done-screen "business account will be reviewed" message now also fires
    for movers + water_carriers
- `worker/src/hooks/useAuth.jsx` — `signUp()` now writes
  `registration_number`, `tax_pin`, `service_area`, `water_source` to the
  `workers` row
- `migrations/add_mover_watercarrier_columns.sql` — NEW: adds the 4 nullable
  columns above to the `workers` table. Run in Supabase before testing
  Mover/Water Carrier signup

Build verified clean (300 modules ✓).

### ✅ 7b. LEGAL-ALIGNED SIGNUP FIELDS (June 11)

After cross-checking `FIXERA-LEGAL-DOCUMENTATION-CORRECTED.txt`, the
Mover and Water Carrier signups were upgraded to capture what the legal
agreements actually require at signup time:

**Mover signup now requires** (per legal §1020 — Mandatory Qualifications):
- Owner Full Name (already)
- Email + Phone (already)
- Company Name
- Certificate of Incorporation # (was "Registration #" — relabeled)
- **KRA Tax PIN — now REQUIRED** (was optional)
- **Owner National ID # — NEW REQUIRED**
- **Years in Operation — NEW REQUIRED (min 2 per legal §1042)**
- Acknowledgement checkbox confirming commitment to upload:
  Owner ID, Cert of Incorporation, Business License, KRA PIN cert,
  Address proof, Liability insurance ≥ KSh 10M, Fleet docs, 5+ references

**Water Carrier signup now requires** (per legal §1100 — Mandatory Qualifications):
- Owner Full Name (already)
- Email + Phone (already)
- Company / Business Name
- **Owner National ID # — NEW REQUIRED**
- Service Areas
- Water Source (Borehole / County / Private / Mixed)
- Acknowledgement checkbox confirming commitment to upload:
  National ID, Passport photo, Health certification, Water quality cert,
  Vehicle registration + insurance, Background check, Food-grade containers

**ROLE_STEPS for full onboarding** (post-signup) added to OnboardingPage:
- Mover: General · Owner ID · Payment · Business · **Fleet** · **Insurance** · **References** · Agreement
- Water Carrier: General · Identity · Health · Payment · Business · Vehicle · **Water QC** · Agreement
- 4 new step renderers added with detailed upload checklists referencing
  the relevant legal sections (Phase-2 file-upload UI to follow)

**DB:** extended `add_mover_watercarrier_columns.sql` with two more
columns:
- `years_in_operation INT` — Mover's operating tenure (legal min 2)
- `owner_national_id TEXT` — owner ID for Movers + Water Carriers

⚠️ **Re-run this migration** — if you already ran the earlier version,
re-running is safe (the file uses `ADD COLUMN IF NOT EXISTS`).

**ROLE_HOME** map in OnboardingPage's done-screen updated to route
movers → `/mover/dashboard` and water_carriers → `/dashboard`.

Build verified clean (300 modules ✓, 4.07s).

### ✅ 8. MOVER FLEET REGISTRATION (June 12)

Movers now have a dedicated **🚚 Fleet** dashboard to register every vehicle
they use. Quotes pull plate # from this list — no more free-typed plates.

**New DB:** `migrations/create_mover_fleet.sql`
- `mover_vehicles` table — vehicle type, plate (UNIQUE per mover), make,
  model, year, color, capacity_tons, photo_urls JSONB, logbook_url,
  insurance (provider, policy #, expiry, doc URL), status, fixera_verified
- RLS: movers manage only their own vehicles; Fixera admins see ALL
- Storage bucket `mover-vehicles` for photos + logbook + insurance docs

**New service:** `worker/src/services/fleetService.js`
- `listFleet`, `listActiveFleet`, `addVehicle`, `updateVehicle`,
  `setVehicleStatus`, `deleteVehicle`
- `uploadVehiclePhotos`, `uploadLogbook`, `uploadInsuranceDoc`
- `VEHICLE_TYPES` catalog: Pickup · Van · 3-Ton · 5-Ton · 10-Ton (per blueprint)
- `insuranceDaysLeft()` + `insuranceStatus()` helpers — flags expired
  insurance red, expiring-within-30-days orange, valid green

**New page:** `worker/src/pages/mover/FleetPage.jsx` at `/fleet`
- Add Vehicle form with type picker, plate, make/model/year/color/capacity
- Photo upload (up to 6 — recommend 4 sides + interior)
- Insurance fields with date picker + document upload (PDF/image)
- Logbook upload
- Per-vehicle card: type icon, plate in white monospace badge, ✓ VERIFIED
  badge when Fixera admin approves, insurance expiry banner (color-coded),
  photo strip
- Active vs Inactive/Maintenance split
- Per-row actions: ✏️ Edit · ⏸️/▶️ Status toggle · 🗑️ Delete
- Safety notice referencing legal §1031 (KSh 10M liability min) and §1081
  (insurance lapse = immediate suspension)

**Updates:**
- `worker/src/App.jsx` — added `/fleet` route
- `worker/src/components/Layout.jsx` — Fleet tab added to mover bottom nav:
  Requests · Fleet · Crew · Support
- `worker/src/pages/mover/MoverRequestPage.jsx`:
  - Quote form: replaced free-typed Vehicle Type dropdown + Plate text
    input with a single **Fleet Picker** card list — only active vehicles
    show, with type icon + plate badge + verified checkmark
  - Team Assignment: same Fleet Picker reused for vehicle selection
  - Empty fleet → "No vehicles registered yet → Go to Fleet" CTA
  - On load, fleet pre-selects first active vehicle for convenience

⚠️ **Run new migration:** `migrations/create_mover_fleet.sql` in Supabase
SQL Editor before testing the Fleet dashboard.

Build verified clean (300 modules ✓, 3.76s). `/fleet` route responds 200.

### ✅ 9. ADMIN APPROVAL QUEUE (June 12)

Closed the verification gate — partners can sign up freely but can't accept
jobs until Fixera admins approve them. Crew + Vehicles get individual
verification flags so admins can spot-check each one.

**Admin app updates** (`web/src/pages/admin/AdminDashboard.jsx`):
- `ROLE_COLOR` / `ROLE_ICON` / new `ROLE_LABEL` map now cover all 6 partner
  types (added 🚚 Mover #9F7AEA and 🚰 Water Carrier #00B5D8)
- Partners filter pills now include Movers + Water Carriers
- Partner detail view shows new panels:
  - **🏢 Company Information** — surfaces business_name, owner_national_id,
    registration_number, tax_pin, years_in_operation (with red warning if
    `<` 2 yrs per legal §1042), service_area, water_source
  - **👥 Registered Crew** — per-row card with photo, name, ⭐ SUPERVISOR
    badge, ID, phone, and a **✓ Verify / Unverify** toggle that flips
    `partner_crew_members.fixera_verified`
  - **🚚 Fleet** — per-row card with vehicle type, plate badge, year/make/
    model, capacity, insurance expiry banner (color-coded), photo strip
    (clickable thumbs), insurance + logbook download links, and a
    **✓ Verify / Unverify** toggle on `mover_vehicles.fixera_verified`
- New `PartnerCrewPanel` + `PartnerFleetPanel` components fetch on demand

**Partner app updates** — `worker/src/components/VerificationBanner.jsx`:
- Banner reads `profile.verification_status` and shows:
  - **⏳ Pending** (orange) — "You can register crew + fleet but can't accept
    jobs until our team approves your account"
  - **❌ Rejected** (red) — shows admin's `rejection_reason` inline
  - **🚫 Suspended** (red) — "Contact Support →" CTA button
  - Nothing rendered when `approved`
- `isApproved(profile)` helper exported for gating logic
- Mounted on: MoverDashboard, MoverRequestPage, VendorDashboard,
  RiderDashboard, SupplierDashboard, worker DashboardPage

**Quote gating** (`MoverRequestPage`):
- When viewing a moving request, if `verification_status !== 'approved'`
  the **💰 Send Quote** button is replaced by a locked card:
  "🔒 Verification required — You can browse requests, but quoting is
  locked until Fixera approves your account."
- Movers can still see all request details, register crew + fleet
  meanwhile, so they're ready to start the moment they're verified

**No new SQL needed** — `workers.verification_status` and
`workers.rejection_reason` columns already existed. The Fixera-verified
flags on `partner_crew_members` and `mover_vehicles` were added in the
earlier crew + fleet migrations.

Build verified clean: worker app 4.53s, customer app 34.04s. All routes
respond 200. Zero console errors.

### ✅ 10. WATER DELIVERY MODULE + LIVE GPS (June 12)

End-to-end water delivery flow with **6 status states**, live Leaflet GPS
map driven by Supabase Realtime, broadcast-claim order assignment,
water-specific cancellation policy, delivery photo proof, and one-tap
reorder. Customer + partner sides both built.

**Design decisions (from owner approval):**
- Auto-assign nearest (broadcast queue, first carrier to claim wins)
- Water-specific cancellation: free before confirmed, KSh 100 fee
  during loading, no cancel after dispatched
- Bowsers fold into same 6 states (branched UI later if needed)
- Recurring subscriptions parked for v2 — replaced with "Order Same Again"
  one-tap on the completed state

**New DB:** `migrations/create_water_delivery_module.sql`
- Extends `bookings` with: `carrier_user_id`, `driver_snapshot JSONB`,
  `delivery_photo_urls JSONB`, `confirmed_at`, `departed_at`, `arrived_at`,
  `delivered_at`, `cancellation_reason`, `cancellation_fee`
- New `live_locations` table for GPS streaming (lat, lng, accuracy,
  heading, speed, recorded_at) — Realtime replica identity + publication
- RLS: customer reads their own booking's locations, carriers insert
  their own, admins read all
- Bookings RLS: water carriers can read open + assigned orders, claim
  open ones

**Customer app:**
- `web/src/services/waterDeliveryService.js` — `getWaterDelivery`,
  `cancelDelivery` (with `calcCancellationFee`), `confirmReceipt`,
  `reorderSame`, `subscribeToLocation` via Supabase Realtime,
  `haversineKm` + `etaMinutes` helpers, `isBowserService`
- `web/src/components/LiveMap.jsx` — Leaflet map with destination pin (🏠),
  animated driver marker (🚐), dotted route line, ETA banner ("Arriving
  in 12 min · 3.2 km · 28 km/h"), auto-geocodes address fallback,
  "📡 Waiting for driver location…" overlay when no GPS yet
- `web/src/pages/main/WaterDeliveryStatusPage.jsx` at `/water/delivery/:id` —
  6 states: pending (finding) → confirmed (driver+plate+quality cert) →
  loading → on_the_way (full map) → arrived → delivered (photos + confirm
  receipt) → completed (review + Order Same Again)
- Realtime subscription on `bookings` UPDATE keeps page in sync without
  manual refresh
- `BookingConfirmationPage` now detects water-carriers bookings and
  navigates to the new status page instead of generic `/worker/:id`

**Partner app (water carrier side):**
- `worker/src/services/waterCarrierService.js` — `listOpenOrders`
  (broadcast queue), `listMyDeliveries`, `acceptOrder` (claim with
  driver snapshot — race-safe with `.is('carrier_user_id', null)`),
  state transitions (`startLoading`, `markDeparted`, `markArrived`,
  `markDelivered`), `uploadDeliveryPhotos`, `pingLocation`
- `worker/src/hooks/useLiveLocation.jsx` — `navigator.geolocation.
  watchPosition` with throttled DB pings every 10s while `active`
- `worker/src/pages/water/WaterCarrierDashboard.jsx` at
  `/water/dashboard` — Open / My Jobs / History tabs, stats row
- `worker/src/pages/water/WaterDeliveryPage.jsx` at
  `/water/delivery/:id` — accept flow (pick driver from crew + enter
  plate), state-transition buttons (Start Loading → Mark Departed → Mark
  Arrived → Upload Photos → Mark Delivered), GPS auto-streams during
  `on_the_way`, photo upload required before marking delivered
- Verification banner mounted; orders require approved status to accept

**Routing:**
- `worker/src/App.jsx` — added `/water/dashboard` + `/water/delivery/:id`
- `worker/src/components/Layout.jsx` — water_carrier nav Deliveries tab
  now points to `/water/dashboard`
- `worker/src/components/ProtectedRoute.jsx` — `ROLE_HOME.water_carrier`
  now lands on `/water/dashboard`
- `web/src/App.jsx` — added customer `/water/delivery/:id` route

⚠️ **Run new migration:** `migrations/create_water_delivery_module.sql`
in Supabase SQL Editor before testing. After running, verify Realtime is
enabled for `live_locations` (Supabase Dashboard → Database → Replication).

Build verified clean: worker 2.22s, customer 23.17s. All routes
(`/water/delivery/test` customer + partner, `/water/dashboard` partner)
respond 200. Zero console errors.

### ✅ 11. DEPARTMENT-ROUTED SUPPORT SYSTEM (June 12)

One generic support box couldn't serve 6 different partner types — a mover's
damage-claim dispute and a rider's accident report need different handling.
Support is now structured by partner type AND routed to Fixera departments.

**Fixera departments (with SLAs):**
- 💰 Finance & Payments — 24h response
- 🛠️ Operations — 2h response (job-impacting)
- 🛡️ Trust & Safety — URGENT, 1h response
- 🔐 Accounts & Verification — 24–48h
- 📱 Technical Support — 24h
- 🤝 Partner Success — 48h (catch-all)

**New config:** `worker/src/data/supportCategories.js`
- `DEPARTMENTS` map (name, icon, color, SLA)
- `CATEGORIES_BY_ROLE` — 8 categories per partner type, each mapping to a
  department + priority (urgent/high/normal). Examples:
  * Workers: Earnings/Wallet → Finance · Job Dispute → Operations ·
    Customer Conduct + Safety Incident → Trust & Safety (urgent)
  * Vendors: Order Problem + Rider Pickup → Operations · Settlement →
    Finance · Damage Claim Dispute → Trust & Safety (urgent)
  * Riders: Accident/Breakdown → Trust & Safety (urgent) · Wallet → Finance
  * Suppliers: Bulk Order + Logistics → Operations · Net 30/60 Invoices →
    Finance · Quality Dispute → Trust & Safety (urgent)
  * Movers: Damage/Missing Claim → Trust & Safety (urgent) · Fleet &
    Insurance → Accounts · Settlement → Finance
  * Water Carriers: Water Quality Dispute → Trust & Safety (urgent) ·
    Certificates & Vehicle → Accounts · Friday payout → Finance

**SupportPage.jsx (partner app) updates:**
- Reads `profile.partner_role` → shows that role's 8 categories
- URGENT badge on trust-safety categories
- After picking a category, a routing banner shows: "Routes to: 🛡️ Trust &
  Safety — URGENT, responds within 1 hour"
- Ticket insert now saves `user_type` (real role, was hardcoded 'worker'),
  `department`, `priority`

**Admin DisputesSection updates:**
- Three filter rows: Status · Department (6 pills) · Partner type (6 + customers)
- Urgent tickets sort to the top with red left border + 🚨 URGENT badge
- Department badge displayed per ticket
- Partner-type icon shown per ticket (uses ROLE_ICON/ROLE_LABEL — all 6 types)

**New migration:** `migrations/add_support_departments.sql`
- Adds `department` + `priority` columns to support_tickets
- Backfills legacy tickets from old category names
⚠️ Run in Supabase SQL Editor.

Build verified clean: worker 3.21s, customer 22.81s. `/support` + `/admin`
respond 200. Zero console errors.

### ✅ 12. MOVERS COMPLETION — LIVE GPS + LOADING/DELIVERY VERIFICATION + CLAIMS (June 12)

Movers module is now feature-complete (blueprint §11–13). New status flow:
awaiting_quotes → quoted → accepted → in_progress → **delivered** → completed.

**New migration:** `migrations/add_mover_gps_verification.sql`
- moving_requests new columns: `loading_photo_urls`, `delivery_photo_urls`,
  `delivery_checklist`, `delivery_signature`, `started_at`, `delivered_at`,
  `delivery_signed_at`
- RLS policy "Movers update requests they quoted" (movers can only update
  requests where they have a quote)
- live_locations already supported moving_request_id — no changes needed
⚠️ Run in Supabase SQL Editor.

**GPS generalized (reuses water infrastructure):**
- `worker/src/hooks/useLiveLocation.jsx` — now accepts `bookingId` OR
  `movingRequestId`; ping helper moved inline (generic insert)
- `web/src/services/waterDeliveryService.js` — new `subscribeToLocationFor
  (column, id, cb)`; `subscribeToLocation` delegates for water
- `web/src/components/LiveMap.jsx` — new `movingRequestId` + `vehicleIcon`
  props (movers show 🚚, water 🚐)

**Partner side (`MoverRequestPage`):**
- **Loading Verification gate**: after team assignment, mover must upload
  ≥1 photo of loaded cargo/truck before "Start Move" unlocks. Photos go to
  moving-photos bucket under `{moverId}/{requestId}/loading_*`
- **Start Move** sets `started_at` + status in_progress → `useLiveLocation`
  begins streaming GPS to the customer automatically
- **In progress**: green "GPS broadcasting" banner + Delivery Verification
  card — mover must upload ≥1 delivery photo before "Mark Delivered" unlocks
- **Mark Delivered** sets status `delivered` → customer is asked to sign off
- **Delivered**: purple "waiting for customer sign-off" card
- **Completed**: celebration card showing customer's typed signature + time
- moverService: new `uploadLoadingPhotos`, `uploadDeliveryPhotos`,
  `markDelivered`; `startMove` now stamps started_at
- MoverDashboard "My Jobs" includes `delivered` status (Awaiting Sign-off badge)

**Customer side (`MovingRequestStatusPage`):**
- **in_progress**: GPS placeholder replaced with real `LiveMap` (truck 🚚
  marker, dotted route to destination, ETA banner) + loading photos strip
- **Realtime**: subscribes to moving_requests UPDATE — page advances
  automatically as the mover acts (no manual refresh)
- **NEW delivered state — `DeliverySignOff` component:**
  - Mover's delivery photos grid
  - **Inventory checklist**: every inventory item rendered as a tick row
    (green=received). Unticking marks it MISSING/DAMAGED (red)
  - Unticked items auto-file a `missing_item` claim into
    moving_support_tickets before closing
  - **Digital signature**: customer types full name → "Confirm Delivery &
    Sign" → status completed + delivery_checklist + signature + timestamp
  - Support section available throughout
- **completed**: shows signature record + "Found a problem after the move?"
  late-claim card (files `damage` ticket → Trust & Safety, 1h SLA)
- movingService: new `signOffDelivery(requestId, checklist, signature)`

Build verified clean: worker 2.82s, customer 20.82s. Both mover routes
respond 200. Zero console errors.

**Movers module is now COMPLETE** pending only: M-Pesa payments (parked),
doc-upload onboarding UI (parked for advocate).

### ✅ 13. PARTNER AGREEMENTS — PER-ROLE TERMS + ACCEPTANCE (June 12)

Every partner type now has an in-app Partner Agreement at `/agreement`,
drawn from FIXERA-LEGAL-DOCUMENTATION-CORRECTED.txt v1.1 and marked as an
**interim draft pending advocate verification**. When the verified legal
pack ships: replace content in `worker/src/data/partnerAgreements.js` and
bump `AGREEMENT_VERSION` (currently `v0.9-draft`) — all partners are then
prompted to re-accept.

**New config:** `worker/src/data/partnerAgreements.js`
- `AGREEMENTS_BY_ROLE` — per role: Key Terms (commission/settlement/
  deposit/wallet per legal v1.1: workers 15%, riders 15%, all others 20%;
  KSh 500 deposit all), Requirements, Service Standards, Suspension Rules
- `SHARED_CLAUSES` — independent contractor, conduct, data protection
  (Kenya DPA 2019), off-platform dealing ban, IP, disputes & claims
- `AGREEMENT_VERSION` + `PENDING_VERIFICATION_NOTICE`

**New page:** `worker/src/pages/main/PartnerAgreementPage.jsx` at `/agreement`
- Role-aware: shows the logged-in partner's own agreement
- Orange "pending legal verification" banner
- Checkbox + "✍️ Accept Agreement" → writes `agreement_version` +
  `agreement_accepted_at` to the workers row (audit trail)
- Accepted state shows version + timestamp

**SupportPage:** new "⚖️ My Partner Agreement" card — shows
"✅ Accepted · v0.9-draft" or "⚠️ Not yet accepted — tap to review & sign"

**New migration:** `migrations/add_agreement_acceptance.sql` — adds
`agreement_version` + `agreement_accepted_at` to workers. ⚠️ Run in Supabase.

Build verified clean (3.05s). `/agreement` + `/support` respond 200.

### ✅ 13b. MANDATORY T&C GATE + UPDATED-TERMS POPUP (June 12)

The Partner Agreement is now a **hard gate between login and dashboard**
for all 6 partner types:

Login → onboarding (if incomplete) → **/agreement (if current version
not accepted)** → dashboard.

**ProtectedRoute.jsx:**
- New gate: `profile.agreement_version !== AGREEMENT_VERSION` →
  redirect to `/agreement` (exempts the agreement page itself to avoid
  a loop). Because it compares against the CURRENT version constant, a
  version bump automatically re-gates every partner on next login.

**PartnerAgreementPage.jsx:**
- 🔒 First-time notice: "review and accept to continue to your dashboard"
- 📢 **Updated-terms popup banner**: if the partner accepted an OLDER
  version (`agreement_accepted_at` set but version mismatch), a purple
  "Terms & Conditions have been updated" banner shows the version + date
  they previously accepted and asks them to re-accept
- Back button hidden until accepted (no escaping the gate)
- On accept: writes version+timestamp → `refreshProfile()` (new helper in
  useAuth that refetches the workers row so the gate opens without a
  reload) → auto-redirects to the partner's ROLE_HOME after 1.2s

**useAuth.jsx:** new `refreshProfile()` exposed in context.

How to publish updated terms later: edit content in
`worker/src/data/partnerAgreements.js`, bump `AGREEMENT_VERSION`
(e.g. v0.9-draft → v1.0) — every partner sees the 📢 banner and must
re-accept before reaching their dashboard.

Build verified clean (2.75s). Routes 200. Zero console errors.

### ✅ 13c. QUALIFICATION CHECKLIST (post-login flow) (June 12)

New post-login flow for all 6 partner types:
Login → Onboarding (if incomplete) → **Terms & Conditions gate** →
**Qualification Checklist** → Dashboard.

**New config:** `worker/src/data/qualifications.js`
- `QUALIFICATIONS_BY_ROLE` — per-role requirement list from legal §2, each
  item auto-derives `done` status from live data (no manual ticking):
  * profile fields (business_name, registration_number, tax_pin,
    owner_national_id, years_in_operation ≥ 2, service_area, water_source)
  * onboarding_complete (covers ID/photo/cert uploads)
  * crew count (partner_crew_members), fleet count (mover_vehicles)
  * verification_status === 'approved' (Fixera approval)
  * agreement_accepted_at (terms signed)
- `evaluateQualifications(role, ctx)` returns items with done flags +
  completed/total + allDone
- Wallet-deposit items marked "⏳ Available once M-Pesa is live" (pending)

**New page:** `worker/src/pages/main/QualificationChecklistPage.jsx` at
`/qualifications`
- Progress bar (X of N complete, %)
- Per item: green ✓ when met, hint text, and an action button to the fix
  (e.g. "Register fleet → /fleet", "Add crew → /crew") when not met
- "🎉 All requirements met" banner when complete
- "Continue to Dashboard" — NOT a hard gate (wallet/approval items are
  blocked on M-Pesa/admin, so we inform rather than lock out)

**Flow wiring:**
- Agreement accept → redirects to `/qualifications` (was dashboard)
- Qualification "Continue" → ROLE_HOME dashboard
- SupportPage: new "📋 My Qualifications" card (+ existing "⚖️ My Partner
  Agreement" card) so both are reachable any time

Build verified clean (10.44s). `/qualifications` + `/agreement` respond
200. Zero console errors.

### ✅ 14. UBER/BOLT-STYLE LIVE TRACKING + STOP DETECTION (June 12)

`LiveMap` upgraded to a full Uber/Bolt-grade tracking experience, shared by
Movers, Water Carriers, and now Riders.

**`web/src/components/LiveMap.jsx`:**
- **Movement state machine** derived from incoming GPS pings:
  `waiting → moving → stopped → arrived`
  - stopped = GPS speed < 3 km/h OR moved < 25m between pings
  - escalates to "stopped" alert after 40s stationary (1s evaluator tick)
  - arrived = within 90m of destination
- **Stop alert banner**: "⚠️ Your {mover/rider/driver} has stopped —
  stationary for 1m 20s" (live counter)
- **Status pill** top-left: 🟢 Moving / 🟡 Stopped / 📍 Arrived
- **Marker reflects state**: purple moving, amber pulsing ring when stopped,
  green when arrived
- **ETA banner** turns amber + shows "Paused" while stopped; "arrived"
  banner replaces it on arrival
- New `vehicleLabel` prop for correct copy ("mover"/"rider"/"driver")

**Rider GPS wired** (`worker/src/pages/rider/RiderDashboard.jsx`):
- `useLiveLocation` broadcasts by `booking_id` while a delivery is
  `picked_up` or `out_for_delivery`
- Any customer surface rendering `<LiveMap bookingId={…}/>` shows the rider
  live with full stop detection (Water page already does; rider-delivery
  customer view is wired when the Vendor per-order fulfilment page lands)

Build verified clean: worker 3.29s, customer 21.78s. Routes 200. Zero
console errors.

⚠️ NOTE: stop detection is client-side (derived on the watching device from
live pings). True server-push notifications when the app is closed need FCM
(parked with the broader notifications work).

### ✅ 15. VENDOR ORDER FULFILLMENT (June 12)

Vendors (laundry, carpet wash, sofa, office, curtain cleaning) now have a
proper per-order fulfillment lifecycle instead of a one-tap accept→done.

**New migration:** `migrations/add_vendor_fulfillment.sql`
- bookings: `fulfillment_stage` (received → preparing → ready →
  out_for_delivery → delivered), `prep_photos` JSONB, `received_at`,
  `prep_started_at`, `ready_at`
- workers: `is_open` BOOL, `business_hours` JSONB
⚠️ Run in Supabase.

**New service:** `worker/src/services/vendorService.js`
- `FULFILLMENT_STEPS` catalog + `stageIndex`
- `getVendorOrder`, `acceptOrder`, `setStage` (stamps timestamps, keeps
  coarse bookings.status in sync), `uploadPrepPhotos`
- `setOpen`, `setBusinessHours`

**New page:** `worker/src/pages/vendor/VendorOrderPage.jsx` at
`/vendor/order/:id`
- Customer card with Call button
- New order → "✓ Accept Order"
- Vertical fulfillment timeline (✓ completed, • now)
- Before/after proof photo upload (to moving-photos bucket)
- Stage buttons: vendor controls received → preparing → ready; rider
  handles out_for_delivery + delivered
- "Ready for return delivery" + "Order Complete" states

**VendorDashboard:**
- Open/Closed toggle now **persists** to workers.is_open (was local-only)
- Order cards are tappable → `/vendor/order/:id`, show a fulfillment-stage
  badge (📥 Received / 🧼 Preparing / ✅ Ready / etc.)

Build verified clean (5.37s). `/vendor/dashboard` + `/vendor/order/:id`
respond 200. Zero console errors.

### ✅ 16. RIDER DISPATCH ENGINE — VENDOR↔RIDER LOOP (June 12)

When a vendor marks an order **Ready**, the system auto-creates a return
delivery leg and dispatches it: **original rider first, nearest rider as
fallback.**

**New migration:** `migrations/add_rider_dispatch.sql`
- delivery_tracking: `leg_type` (pickup|return), `dropoff_address`,
  pickup/dropoff lat-lng, `vendor_id`, `customer_name`,
  `preferred_rider_id`, `offered_at`, `amount`
- workers: `last_lat`, `last_lng`, `last_location_at` (rider live position)
- bookings: `assigned_rider_id` (the rider who owns the order)
- RLS: riders read pending + own legs, claim open ones
⚠️ Run in Supabase.

**New service:** `worker/src/services/dispatchService.js`
- `createReturnLeg(booking, vendorProfile)` — preferred = booking.assigned_rider_id
- `listRiderJobs(riderId, riderLoc)` — preferred rider gets a 15-min
  EXCLUSIVE window; after that it opens to all. Jobs ranked
  reserved-first then nearest-by-distance (haversine)
- `acceptLeg(legId, riderId, bookingId)` — race-safe claim; tags
  booking.assigned_rider_id so the same rider is preferred for the return
- `advanceLeg(leg, status)` — syncs booking.fulfillment_stage
  (return out_for_delivery → delivered → completed; pickup delivered → received)
- `updateRiderLocation(riderId, lat, lng)`
- `NEARBY_KM = 8` radius

**Vendor wiring:** `vendorService.setStage(id, 'ready', vendorProfile)`
now calls `createReturnLeg` automatically.

**RiderDashboard:**
- Broadcasts location every 25s while **online** (getCurrentPosition →
  updateRiderLocation) so dispatch can rank by distance
- Available tab uses `listRiderJobs` — cards show 🔄 RETURN vs 📦 PICKUP,
  pickup + dropoff, "📍 X km away", and a gold **⭐ RESERVED FOR YOU**
  badge when the rider is the preferred (original) rider
- Accept is race-safe; status advances sync the vendor order automatically

**The loop:** customer books → rider does pickup leg (becomes order's
assigned_rider) → vendor cleans → taps Ready → return leg offered to that
SAME rider first (15-min head start) → if they're offline/far it opens to
the nearest online rider → delivered syncs the vendor order to completed.

⚠️ Phase-2 polish (not yet): true one-at-a-time offer rotation with
per-rider accept timeouts, and customer-facing live map for the laundry
return leg (rider GPS already flows; needs the customer tracking screen).

Build verified clean (4.61s). Rider + vendor routes 200. Zero console errors.

### ✅ 16b. CUSTOMER LAUNDRY TRACKING + LIVE RIDER MAP (June 12)

Closes the laundry loop on the customer side. After booking, customers can
watch their order move through every stage and see the rider live on the
return trip.

**New page:** `web/src/pages/main/CustomerOrderTrackPage.jsx` at `/track/:id`
- 5-step timeline: Received → Being cleaned → Ready → Out for delivery →
  Delivered (mirrors vendor fulfillment_stage)
- **LiveMap with stop detection** renders during `out_for_delivery` — the
  rider's 🏍️ marker, route to the customer, ETA + 🟡 Stopped alerts
- Rider card (name + call button) while items are being returned
- Realtime subscription on the booking → advances automatically as the
  vendor + rider act (no refresh)
- Delivered state → Leave a Review

**Wiring:**
- `web/src/App.jsx` — `/track/:id` route
- `LaundryPage` booked screen — new "📍 Track My Order" primary button
  (→ /track/:bookingId), "View My Bookings" demoted to secondary

The rider already broadcasts GPS by booking_id during the return leg
(picked_up / out_for_delivery), so the customer map populates automatically.

Build verified clean (customer 13.63s). `/track/:id` responds 200. Zero
console errors.

**Laundry loop now end-to-end:** book → rider pickup → vendor clean →
auto-dispatch return (same rider first, nearest fallback) → customer
watches rider live → delivered + review. Remaining Phase-2: true
one-at-a-time offer rotation with per-rider timeouts (needs a backend
scheduler).

### ✅ 17. SUPPLIER MARKETPLACE — SHOP → ORDER → FULFILL → DELIVER (June 12)

Closed the biggest gap: customers can now actually buy from suppliers.

**New migration:** `migrations/create_supplier_orders.sql`
- `supplier_orders` table (customer_id, supplier_id, items JSONB, total,
  delivery fields, status, fulfillment_stage, assigned_rider_id, timestamps)
- delivery_tracking: `supplier_order_id` column
- RLS: customers manage own, suppliers read/update theirs, riders read
  assigned, admins all; `vendor_products` now readable by any authenticated
  user (so the shop can list)
⚠️ Run in Supabase.

**Customer side:**
- `web/src/services/supplierShopService.js` — `listProducts(category)`,
  `placeOrder`, `getSupplierOrder`, `listMyOrders`, PRODUCT_CATEGORIES
- `web/src/pages/main/SupplierShopPage.jsx` at `/shop` — category chips,
  product cards with qty steppers, cart drawer, single-supplier-per-order
  guard, delivery details, checkout → creates supplier_order
- `web/src/pages/main/SupplierOrderTrackPage.jsx` at `/supplier-order/:id`
  — 5-step timeline (confirmed → packing → ready → out_for_delivery →
  delivered), item list, Realtime auto-advance, "rider on the way" card
- HomePage: new 🛒 Supplies Shop banner → /shop

**Supplier side:**
- `worker/src/services/supplierService.js` — `listSupplierOrders`,
  `acceptOrder`, `setStage` (ready auto-dispatches rider via
  createSupplierDeliveryLeg), SUPPLIER_STEPS
- `worker/src/pages/supplier/SupplierOrderPage.jsx` at
  `/supplier/order/:id` — customer + items, Accept → Packing → Ready
  (dispatches rider) → delivered, progress timeline
- SupplierDashboard: new **Orders / Products tabs**; orders list with
  NEW badge + stage badges, tap → order page

**Dispatch reuse:** `dispatchService.createSupplierDeliveryLeg`,
`acceptLeg` + `advanceLeg` now sync supplier_orders too. Supplier marks
Ready → delivery leg enters the SAME rider queue (nearest-ranked).

⚠️ Phase-2: live GPS map for supplier-order return leg (rider broadcasts
by booking_id; supplier legs use supplier_order_id — needs live_locations
to carry supplier_order_id + rider to ping it). Currently shows a "rider
on the way" status card instead of the live map.

Build verified clean: worker 2.89s, customer 22.43s. `/shop`,
`/supplier-order/:id`, `/supplier/order/:id` respond 200. Zero console errors.

**All 6 partners now have a complete customer-facing path.**

### ✅ 18. PAYMENT LAYER — M-PESA-READY, CASH-CAPABLE NOW (June 13)

Built the full payment system with M-Pesa stubbed behind a clean interface.
Cash capture, commission math, records, and the payment popup all work
today; when Daraja is live, swap ONE function body for the real STK Push —
nothing else changes.

**New migration:** `migrations/create_payments.sql`
- `payments` table: customer_id, payee_id, payee_role, ref_type/ref_id,
  purpose, amount, commission_rate/amount, partner_amount, method
  (cash|mpesa), status (pending|paid|failed), mpesa_ref, settlement_status,
  paid_at. RLS: customer + payee read own, admins all.
⚠️ Run in Supabase.

**New service:** `web/src/services/paymentService.js`
- `COMMISSION_RATES` per legal v1.1 (worker/rider 15%, others 20%) +
  `splitAmount` (commission vs partner take)
- `createPayment`, `getPaymentFor`, `ensurePayment`
- `markCashPaid` → status paid + settlement_status unsettled (Fixera
  reconciles commission from the partner)
- `initiateMpesa` → **STUB**: records method=mpesa, status=pending, returns
  a "not yet active" message. The ONLY thing to replace when Daraja lands.

**New component:** `web/src/components/PaymentPrompt.jsx`
- Reusable customer popup: shows amount + [📱 Pay with M-Pesa] +
  [💵 Paid Cash]. Cash → recorded + Fixera-settlement flagged. M-Pesa →
  pending + "coming soon, pay cash" note. Once paid → green receipt strip
  (method + timestamp). Auto-creates the payment row on mount, idempotent
  via getPaymentFor (no double-charge).

**Wired into every completion point:**
- Service worker job complete (WorkerAssignmentPage)
- Mover move completed (MovingRequestStatusPage)
- Water delivery delivered (WaterDeliveryStatusPage)
- Supplier order delivered (SupplierOrderTrackPage)
- Laundry order delivered (CustomerOrderTrackPage)
(Flows without a stored price simply don't prompt — amount guard.)

Build verified clean (customer 35.95s). `/shop`, `/movers/request`,
`/supplier-order` respond 200. Zero console errors.

**When M-Pesa goes live:** edit only `initiateMpesa()` in
paymentService.js to call Daraja STK Push + handle the callback →
markCashPaid-equivalent. Commission, records, popup, settlement all
already work.

### ✅ 19. PARTNER EARNINGS & WALLET DASHBOARD (June 13)

Each partner now sees a live, auto-calculated financial dashboard built
from the payments table.

**New migration:** `migrations/create_wallet_system.sql`
- `workers.wallet_balance`
- `wallet_transactions` table (topup | commission | payout | adjustment,
  amount, balance_after, ref_payment_id, history)
- **Postgres trigger** `fixera_wallet_on_cash_payment` (SECURITY DEFINER):
  when a payment becomes paid + cash + worker/rider, it deducts the
  commission from that partner's wallet and logs a wallet_transaction —
  server-side so it bypasses RLS (the customer can't write the partner row).
⚠️ Run in Supabase (AFTER create_payments.sql).

**New service:** `worker/src/services/accountingService.js`
- `getFinances(partnerId, role)` computes from payments: total earned
  (net), gross billed, Fixera commission, jobs, this-week / this-month,
  and outstanding balance with Fixera:
  - worker/rider → wallet model (balance + history)
  - vendor/supplier/mover/water → settlement model: "You owe Fixera"
    (commission on cash jobs) vs "Fixera owes you" (pending M-Pesa payout)

**Rebuilt:** `worker/src/pages/main/EarningsPage.jsx` (`/earnings`)
- Hero: Total Earned (your share) + week/month/jobs
- Gross billed + Fixera commission cards
- **Wallet card** (workers/riders): balance, low-balance warning below
  KSh 500, "Top Up · M-Pesa coming soon" (disabled stub), wallet history
- **Balance-with-Fixera card** (other roles): owe-Fixera vs pending-payout
- Recent payments list with per-job net + commission shown

Build verified clean (worker 4.83s). `/earnings` responds 200. Zero
console errors.

⚠️ Wallet top-up is the disabled stub until M-Pesa is live (same one-swap
pattern). The commission auto-deduction works today on cash jobs.

### ✅ 19b. PREMIUM FINTECH EARNINGS DASHBOARD (June 13)

Rebuilt `/earnings` as a Stripe/Uber-Earnings-grade dashboard (within the
existing Vite+React stack — no Next/Tailwind/shadcn; the premium feel comes
from design + Recharts, which was added to the worker app).

**Deps added to worker:** `recharts` + `react-is` (peer).

**accountingService.getFinances** extended with:
- `dailySeries` (last 14 days) + `monthlySeries` (last 6 months): net
  earned + commission per bucket
- `transactions` rows (date, jobId, customer/detail, amount, commission,
  net, method, status)

**EarningsPage rebuilt:**
- **KPI cards** (gradient hero): Net Earnings, Total Earnings, Commission
  Paid, Wallet/Outstanding, Pending Payout — staggered fade-up animation
- **Earnings Analytics** — Recharts AreaChart with gradient fill +
  daily/monthly toggle + custom dark tooltip
- **Commission Trend** — Recharts BarChart
- **Alerts** — low/negative wallet, owed-to-Fixera, pending settlement
- **Wallet Activity** feed (workers/riders) with typed icons + Top-Up stub
- **Transactions table** — sortable columns (click header), method badges,
  net highlighted, horizontal scroll on mobile
- Shimmer skeleton loading state, fadeUp keyframes, fully responsive grid

Build verified clean (worker 7.04s after adding recharts+react-is).
`/earnings` responds 200. Zero console errors.

### ✅ 20. PAINTING MULTI-PARTNER CHAIN (June 13)

The flagship orchestration: one service job pulls in worker + supplier +
rider + payment as a single linked flow. Decisions: catalog-based estimate
(1), existing payment popup (1), supplier auto-selected from catalog (1).

**New migration:** `migrations/add_materials_estimate.sql`
- supplier_orders: `parent_booking_id` (links materials to the service job),
  `estimated_by_worker`; new 'estimate' status before 'pending'
- RLS: assigned service worker can INSERT an estimate for their job;
  worker can read their estimates; customer confirms via existing policy
⚠️ Run in Supabase (AFTER create_supplier_orders.sql).

**Worker side:**
- `worker/src/services/materialsEstimateService.js` — listCatalog,
  submitEstimate (one supplier per estimate), getEstimateForJob
- `worker/src/components/MaterialsEstimateModal.jsx` — catalog browser
  (category chips, qty steppers, single-supplier guard) → "Send Estimate
  to Customer"
- `ActiveJobPage` (in_progress): "🎨 Materials Needed?" → opens modal;
  once sent, shows live estimate status (awaiting → confirmed → delivered)

**Customer side:**
- `web/src/services/materialsService.js` — getEstimateForBooking,
  confirmEstimate (adjust qty → status estimate→pending), declineEstimate
- `web/src/components/MaterialsEstimateCard.jsx` — shows the painter's
  recommendation on the job page; customer adjusts qty → "Confirm & Order"
  → enters the supplier→rider→delivery+payment flow; then "Track Materials
  Delivery" → /supplier-order/:id
- Mounted on `WorkerAssignmentPage`

**The full chain now works:** Painter (on active job) estimates materials
from a supplier catalog → customer confirms/adjusts → linked supplier_order
created → supplier packs → rider delivers to site → customer pays (popup)
→ painter finishes → customer pays labour (popup). Worker + Supplier +
Rider + Payment, one job.

Build verified clean: worker 5.80s, customer 31.94s. Routes 200. Zero
console errors.

⚠️ Reuses existing supplier-order GPS limitation (status card, not live map
for the materials leg) — same Phase-2 wiring as supplier orders.

### ✅ 21. SUPPLIER PRODUCT APPROVAL WORKFLOW (June 13)

Suppliers self-manage their catalog; price changes + new products need
Fixera approval before reaching customers. No more manual catalog entry.

**New migration:** `migrations/add_product_approval.sql`
- vendor_products: `status` (approved/pending/rejected), `pending_price`,
  `rejection_reason`, `submitted_at`. Existing rows → approved. Admin RLS.
- Customer shop + materials catalog now filter `status='approved'`.

**Supplier (`supplierProductService.js` + SupplierDashboard):**
- New product → 'pending' (hidden until approved), shows ⏳ Pending badge
- Edit Price → sets `pending_price`; live price stays until approved
  ("Price change pending: old → new")
- Mark in/out of stock → INSTANT (no approval), approved products only
- Rejected products show the reason

**Admin (`ProductApprovalsSection`, new nav tab 🏷️):**
- Tabs: New products / Price changes / All
- Each shows supplier, old→new price, approve (applies pending_price) or
  reject with reason

### ✅ 22. RIDER CONNECTED ON BOTH SIDES (June 13)

The rider is now visible to BOTH ends of every delivery — the customer
(live tracking, already had it) AND the vendor/supplier handing off.

**New migration:** `migrations/add_rider_snapshot.sql`
- supplier_orders + bookings: `rider_name`, `rider_phone`, `rider_vehicle`
  (snapshot so partners see the rider without cross-RLS to workers)

**dispatchService.acceptLeg** now snapshots the accepting rider's name/
phone/vehicle onto the linked order. RiderDashboard passes its profile.

**VendorOrderPage + SupplierOrderPage** show a live rider card when
assigned ("🏍️ Rider assigned to collect" → "collected — on the way"),
with a call button, via Realtime subscriptions.

Build verified clean (worker 5.29s/5.84s, customer 38.28s). Routes 200.
NOTE: admin Product Approvals console errors until add_product_approval.sql
is run (queries status column) — resolves once migrations are applied.

### ✅ 23. POLISH FIXES 3-5 (June 14)

**Fix 3 — Supplier-order live GPS map:**
- `migrations/add_gps_and_dispatch_rotation.sql`: live_locations +
  supplier_order_id (+ RLS for customer read)
- useLiveLocation + LiveMap + RiderDashboard broadcast now support
  supplierOrderId; SupplierOrderTrackPage renders the live map during
  out_for_delivery (was a status card)

**Fix 4 — Water-carrier fleet:**
- Fleet tab added to water_carrier nav (→ /fleet, reuses mover_vehicles)
- WaterDeliveryPage accept flow now picks the plate from registered fleet
  (vehicle picker + "Go to Fleet" CTA if none) instead of free-typing

**Fix 5 — Sequential rider offer rotation:**
- delivery_tracking: offered_to, offer_expires_at, declined_by
- Legs are offered to ONE rider at a time (preferred/owner first) with a
  120s exclusive countdown shown on the card ("⭐ OFFERED TO YOU · 92s")
- **Decline** button → excludes that rider + opens the job to the nearby
  pool immediately; declined riders never see it again
- Timeout → opens to the pool (nearest-sorted per each rider's location)
- listRiderJobs rewritten around the offer model
- NOTE: true server-pushed "offer the exact next nearest" needs pg_cron;
  this client-driven model (exclusive window + decline + nearest-sorted
  pool) works without a backend scheduler.

Build verified clean: worker 4.61s, customer 55.59s. Routes 200. Zero
console errors.

### ✅ 24. ADMIN WORKFORCE DIRECTORY + MIGRATION GUIDE (June 15)

**Admin Workforce directory** (`web/src/pages/admin/AdminDashboard.jsx`):
- New "🪪 Workforce" nav → `WorkforceSection`
- Two tabs: 👥 Crew (all `partner_crew_members` across every partner) +
  🚚 Vehicles (all `mover_vehicles`)
- Filters: verified status, partner type (crew); search by name/ID/plate
- Per-row Verify/Unverify (flips fixera_verified); insurance expiry badge
  on vehicles; ⭐ supervisor marker; shows owning partner business name
- This is the global cross-partner registry the owner asked for early on —
  one screen to spot-check every worker + vehicle Fixera holds on file

**Migration guide refreshed** (`SUPABASE-RUN-MIGRATIONS.md`): complete
ordered checklist of all 18 migrations with dependency rules, smoke test,
buckets, and Realtime note.

**Notifications — already existed, confirmed:** Both apps already ship a
full notification system (`useNotifications` hook + `NotificationBell` +
`NotificationToast`, mounted in each Layout) — live, role-aware, Realtime
on bookings/delivery_tracking, with browser push when the tab is hidden.
No rebuild needed; redundant scaffolding removed. True FCM push (app
fully closed) remains the only notification add-on, parked.

Build verified clean (customer 19.76s). `/admin` 200. Zero console errors.

### ✅ 25. UNIFIED DOCUMENTS (RECEIPT/INVOICE/QUOTATION) + PARTNER EMAILS (June 15)

**Unified document system** — every partner's customers get receipts,
invoices, and quotations, all branded Fixera PDFs.
- `web/src/utils/fixeraDocument.js` — one jsPDF generator producing
  RECEIPT (green/PAID) · INVOICE (blue/DUE) · QUOTATION (gold/QUOTE) with
  Fixera header, from/to parties, line items, subtotal, commission split,
  total box, status stamp, footer. `downloadDocument(doc)`.
- `web/src/services/documentService.js` — builds the normalized doc from
  any source: `docFromPayment` (receipt/invoice — UNIVERSAL since every
  flow creates a payment), `docFromMoverQuote`, `docFromEstimate`,
  `getPaymentDoc`.
- **Wired via PaymentPrompt** (on every completion screen, all 6 partners):
  paid → "📄 Receipt"; unpaid → "📄 Invoice". One component = receipts +
  invoices everywhere.
- **Quotations:** "Download Quotation" on the mover accepted-quote card +
  the painting materials-estimate card.
- jspdf added to web app.

**Partner lifecycle emails** (`web/src/services/emailService.js`):
- `sendPartnerWelcome`, `sendPartnerApproved`, `sendPartnerRejected`
  (branded). Approved/Rejected wired into admin PartnersSection `act()`.
- Worker app: `worker/api/send-email.js` (serverless copy) +
  `worker/src/services/partnerEmailService.js` → welcome email fired on
  signup in `useAuth.signUp` (non-blocking).
- **Localhost links fixed** → `BASE_URL` (`VITE_APP_URL` || origin) across
  all email templates.

⚠️ Email only sends on deployed Vercel with GMAIL_EMAIL + GMAIL_PASSWORD
env vars set (both apps need them). Silent no-op in local dev by design.

Build verified clean: worker 7.87s, customer 55.73s. Routes 200. Zero
console errors.

### ✅ 26. CUSTOMER DOCUMENTS HUB (June 15)

A central "My Documents" section where customers find ALL their receipts,
invoices, and quotations in one place — newest first — and get each via
app download or email.

- `documentService.listCustomerDocuments(userId)` — aggregates across
  sources: receipts + invoices from `payments` (universal), quotations
  from accepted `moving_quotes` + painting `supplier_orders` estimates.
  Returns normalized list items, newest first. `buildFromListItem()`
  rebuilds the full doc for download/email.
- `emailService.sendDocumentEmail(to, doc)` — branded HTML summary
  (items, total, partner) + "View in App" link.
- `web/src/pages/main/DocumentsPage.jsx` at `/documents`:
  - ⭐ Latest document highlighted at top
  - Tabs: All / Receipts / Invoices / Quotations (with counts)
  - Each row → ⬇️ Download (PDF) + ✉️ Email me
- Entry point: Profile → "📂 My Documents"

So customers can retrieve any receipt/invoice/quote **via app (PDF) or
email**, anytime — across every partner type.

Build verified clean (customer 45.91s). `/documents` 200. Zero console errors.

### ✅ 27. PARTNER PAYOUT / EARNINGS STATEMENT (June 15)

Partners now get their OWN financial document — distinct from the customer
receipt — reflecting what they actually earn (net of commission).

- `worker/src/utils/partnerStatement.js` — branded jsPDF statement:
  partner + period header, per-job table (date · service · gross · fee ·
  net), dark totals box (gross → commission → NET EARNINGS), tax-record
  footer. `downloadStatement()`.
- `partnerEmailService.sendStatementEmail(partner, statement)` — branded
  email summary + link to Earnings.
- EarningsPage: new "📄 Payout Statement" card — period chips
  (This Week / This Month / All Time) → ⬇️ Download PDF + ✉️ Email me.
  Rows built from the partner's payments (gross/commission/net per job).

Serves as both the partner's payout receipt AND their KRA-ready income
record. (Per-payout M-Pesa reference auto-stamps later when B2C is live.
Commission invoice for cash jobs intentionally parked.)

Build verified clean (worker 4.17s). `/earnings` 200. Zero console errors.

### ✅ 28. OPTIONAL POLISH — COMMISSION INVOICE · PAYOUT REF · FCM (June 15)

**Commission Invoice (partners):**
- `partnerStatement.js`: new `buildCommissionInvoicePDF` / `downloadCommissionInvoice`
  — lists the partner's cash jobs + commission owed to Fixera + total due.
- EarningsPage: "🧾 Commission Invoice (cash jobs owed to Fixera)" button.

**Per-payout M-Pesa reference:**
- `migrations/add_payout_reference.sql` — payouts.`mpesa_ref`, `settled_period`, `partner_id`.
- Admin PayoutsSection "mark paid" now prompts for the M-Pesa/bank reference.
- accountingService fetches the latest paid payout; partner statement PDF
  shows "Last payout ref: …" in the header.

**FCM push (dormant, Firebase-ready):**
- `migrations/create_notification_tokens.sql` — device token store + RLS.
- `web/src/services/pushService.js` — `registerPush()` guarded by
  `VITE_FIREBASE_*` env (no-op until set; firebase imports are `@vite-ignore`'d
  so the build needs no firebase package yet).
- `web/public/firebase-messaging-sw.js` — background-message SW template
  (self-disabled via FIREBASE_CONFIGURED=false).
- `FCM-SETUP.md` — exact one-time steps to activate (create Firebase project,
  install firebase, set env vars, flip the SW flag, call registerPush, add
  server send function).
- ⚠️ Genuinely inert until the owner creates a Firebase project + keys.

Build verified clean: worker 7.71s, customer ~78s. `/admin` 200. Zero console errors.

### ✅ 29. ADMIN SETTINGS SECTION (June 15)

Full admin self-service + platform config at Admin → ⚙️ Settings (8 tabs):
- **👤 My Profile** — avatar upload, name, phone, change email (re-verify),
  change password
- **🔐 Security & 2FA** — real TOTP enrolment via Supabase MFA (QR + verify),
  disable
- **🏢 Company** — name, KRA PIN, reg no, address, support phone/WhatsApp/
  email, **business logo** upload, brand colour
- **💰 Finance** — editable **commission rates per role**, wallet minimum,
  Fixera collection accounts (bank, M-Pesa, paybill)
- **📋 Policies** — cancellation fee + free-cancel window
- **👥 Admin Team** — list admins, add admin by email, revoke
- **🔔 Notifications** — admin email-alert preferences
- **🗒️ Audit Log** — recent admin actions (approvals, payouts, settings)

**New migration:** `migrations/create_platform_settings.sql`
- `platform_settings` (single row, all the above) + `admin_audit_log` +
  `branding` storage bucket. RLS: anyone authenticated reads settings
  (apps need support contacts/logo/rates); only admins write.

**New files:** `web/src/services/settingsService.js`,
`web/src/pages/admin/AdminSettings.jsx`. Wired into admin NAV + SECTIONS.

**Commission rates now configurable:** `paymentService.loadCommissionRates()`
reads overrides from platform_settings (cached); `createPayment` applies
them — so editing rates in Settings actually changes the split, with the
v1.1 defaults as fallback.

⚠️ Run `create_platform_settings.sql` in Supabase (migration #21).

Build verified clean (customer 1m31s). `/admin` 200. Zero console errors.

### ✅ 30. ANNOUNCEMENTS SYSTEM (June 19, 2026)

Admin can broadcast messages to customers, all partners, or specific partner roles.

**Migration:** `migrations/create_announcements.sql`
- `announcements` table: title, body, type (info/warning/promotion/maintenance),
  target (all/customers/partners/worker/rider/vendor/supplier/mover/water_carrier),
  is_pinned, publish_at, expires_at, created_by
- RLS: anyone authenticated reads active announcements; only admins write
- Indexes on publish_at + target for fast queries
⚠️ Run in Supabase SQL Editor.

**Service:** `web/src/services/announcementsService.js` (copied to worker app)
- `getActiveAnnouncements(audience)` — filters by target + live date window
- `listAllAnnouncements()` — admin: all including expired/scheduled
- `createAnnouncement`, `updateAnnouncement`, `deleteAnnouncement`
- `TYPE_META` (icon/color/bg per type), `TARGET_LABELS` (human-readable targets)

**Admin Dashboard — 📢 Announcements section (new nav item under Platform):**
- Sidebar now has 3 sections: Main · Finance · **Platform** (Announcements + Settings)
- Create/edit form: title, message, type picker, audience picker, pin toggle,
  publish date (blank = now), expiry date (blank = never)
- **Live preview** of the banner before publishing
- List shows all announcements with 🟢 Live / 🕐 Scheduled / ⏹ Expired badges
- Per-row: 📌 Pin toggle, ✏️ Edit, 🗑️ Delete

**Customer app — `AnnouncementBanner` on HomePage:**
- Appears between the promo carousel and the services grid
- Dismissible per-announcement (stored in localStorage)
- Pagination arrows when multiple announcements are active
- Color-coded by type (info=blue, warning=amber, promotion=gold, maintenance=grey)

**Partner app — `AnnouncementBanner` in Layout:**
- Renders at the top of page content in both mobile and desktop layouts
- Role-targeted: a mover only sees announcements for `all`, `partners`, or `mover`
- Same dismiss-per-announcement behaviour

Build verified clean: customer 1m 22s ✓, partner 14.10s ✓. Zero errors.

### ✅ 30b. ANNOUNCEMENTS — GAP FIXES (June 19, 2026)

**Read/unread tracking (per-user, DB-backed):**
- `migrations/add_announcement_reads.sql` — `announcement_reads` table (user_id, announcement_id, read_at, UNIQUE constraint)
- `announcementsService.js` extended with `getReadIds(userId)` + `markAnnouncementRead(userId, id)`
- Both `AnnouncementBanner` components now read dismissed IDs from DB on mount and write on dismiss — persists across devices and browser clears
⚠️ Run `add_announcement_reads.sql` in Supabase after `create_announcements.sql`

**Notification bell integration (Realtime):**
- `web/src/hooks/useNotifications.jsx` — subscribes to `announcements` INSERT; filters by `all | customers` targets; pushes into the bell with type color + icon
- `worker/src/hooks/useNotifications.jsx` — same, filters by `all | partners | {role}`; live while user is online
- When admin publishes a new announcement, every online matching user sees it in their 🔔 bell immediately with unread badge

**Email broadcast (serverless):**
- `web/api/broadcast-announcement.js` — Vercel serverless function: fetches target emails from `profiles` (customers) + `workers` (partners, filtered by role), sends branded HTML email to each in batches of 10 with 500ms delay between batches
- Admin `AnnouncementsSection` — new 📧 Email button per announcement; shows recipient count + failure count on completion
- Uses `SUPABASE_SERVICE_ROLE_KEY` env var (bypasses RLS for email fetch) — add to Vercel env vars
⚠️ Add `SUPABASE_SERVICE_ROLE_KEY` to Vercel environment variables for broadcast to work

Build verified clean: customer 50s ✓, partner ✓. Zero errors.

### 📋 MIGRATION COUNT: 23 files in migrations/ — newest: create_announcements.sql. Combined: _RUN_ALL_IN_ORDER.sql.

### 📋 NEXT UP (from the 9-task pre-redeploy plan):
1. ✅ Optional login / guest mode — DONE
2. ✅ Add Movers category to app — DONE
3. ✅ Add Water Carriers category to app — DONE
4. ✅ Pricing models for Movers & Water Carriers — DONE (`MOVERS-WATER-CARRIERS-PRICING.md`)
4b. ✅ Movers Module customer-side systematic flow — DONE
4c. ✅ Movers Module status page (quotes, team, supervisor, support) — DONE
4d. ✅ Partner app mover dashboard + universal crew registry — DONE
5. ⏳ **Owner: run the three migrations in Supabase** (`SUPABASE-RUN-MIGRATIONS.md`)
6. ⏳ Contact Safaricom M-Pesa (bisdev@safaricom.co.ke)
7. ⏳ M-Pesa sandbox setup
8. ⏳ Wallet system (UI + logic + database)
9. ⏳ Accounting system (all partner types)
10. ⏳ Testing plan

**Before redeploy checklist:**
- [ ] Run `migrations/create_guest_contacts.sql` in Supabase SQL Editor
- [ ] Add GMAIL_EMAIL + GMAIL_PASSWORD (server-side) env vars on Vercel

---

# 🎨 2026-06-23 → 2026-06-25 — MARKETING WEBSITE + CUSTOMER APP PREMIUM UI REDESIGN

A dedicated UI/UX track (separate from the Phase 1–5 launch plan). Goal: world-class, modern, reliable look benchmarked against Uber / Bolt / Thumbtack / Justlife.

## A. Marketing Website (NEW) — `C:/fixera/website`
Rebuilt from scratch after the old one corrupted. **Next.js 16 (Turbopack) + Tailwind v4 + Framer Motion.** Runs on port 3001.
- **Pages:** Home (`/`), Become a Partner (`/become-a-partner`), 5 partner detail pages (`/partners/movers|water-carriers|vendors|suppliers|riders`), Privacy (`/privacy`), Terms (`/terms`).
- **Home sections:** Hero (African family), How It Works, Services (Plumbing/Electrical/Cleaning/Painting, real Higgsfield photos), Movers (real video `moversvideocar.mp4`), Business Partners (Water/Vendors/Suppliers/Riders with hover-zoom), Partner CTA, Stats, **Get-the-App QR codes** (customer + partner), Footer.
- **Brand:** navy `#0A1628` + gold `#C9A020`. Inter font. Real logo (`logo1.png`).
- **Central config** `app/lib/links.ts` — wired to LIVE app URLs:
  - Customer app → `https://project-xyk3n.vercel.app`
  - Partner app → `https://partner-app-five.vercel.app`
  - Emails: `info@fixera.africa` (general) + `support@fixera.africa` (help)
- **Assets:** real photos in `public/images/`, real movers video, QR codes via `qrcode.react`.
- **PENDING:** deploy to `fixera.africa`, real stats numbers, favicon, OG share image. Lawyer's final Privacy/Terms to replace the templates.

## B. Customer App UI Redesign — `C:/fixera/web` ("Light & Clean" / Option A)
Design direction approved by owner: light backgrounds (`#F5F6F8` page, `#FFFFFF` cards), navy header/accents, **gold** primary actions, Uber/Bolt rounded-rectangle buttons (10px), Inter font, Framer Motion throughout. **Framer Motion installed** in web app.
- **Design system:** `src/design/tokens.js` (single source of truth) + live showcase at `/design-system`.
- **Welcome** (`WelcomePage.jsx`): full-screen family photo, FixeraLogo, **typewriter** "Your home, in **expert hands**" (gold accent, starts instantly), gold Get-started. Guest/login flow preserved.
- **Login / Sign Up / Forgot** (`AuthLayout.jsx` split-screen): photo panel (family) + **looping typewriter** of taglines; **white page + black glowing buttons**; clean fields (NO icons inside); password eye-toggle (lucide); Sign Up has top Sign Up|Log In toggle; **Google/Facebook/Apple social** buttons (wired to Supabase OAuth — providers NOT yet enabled in dashboard, fail gracefully). White-form logo = real transparent logo in a navy badge (`BrandLogo.jsx` + `public/logo-mark.png`, bg removed via Higgsfield).
- **Guest modal** (`GuestContactModal.jsx`): restyled light, black glow button, no field icons.
- **Home** (`HomePage.jsx`): auto-rotating **all-services hero carousel** (Plumbing→Electrical→Cleaning→Painting→Movers→Water, real photos, valid routes), light service cards w/ real photos, supplies shop, top pros, receipts, emergency. All DB hooks preserved.
- **Bookings** (`BookingHistoryPage.jsx`): light cards, status pills, skeleton loaders, lucide icons.
- **Wallet** (`WalletPage.jsx` — NEW, route `/wallet`): credit balance card, top-up packages (display only), gift card, empty state. **Payments deferred** (ties to plan item 4.8) — top-up shows "launching soon", never crashes.
- **Profile** (`ProfilePage.jsx`): light, user card, stat cards, lucide-icon menu, edit drawer. Dark-mode toggle REMOVED (committed to light-only).
- **Nav** (`Layout.jsx`): slimmed 6 → **4 tabs** (Home · Bookings · Wallet · Profile) with **lucide line icons** (gold when active). Inspections/FAQ/Support relocated into Profile menu (FAQ link added).
- **Photos:** real Higgsfield images copied to `web/public/services/` (welcome, plumbing, electrical, cleaning, painting, movers, water, vendors, suppliers, riders).
- **Reliability:** booking flow code UNTOUCHED. All redesigned files backed up as `*.BACKUP.jsx`. Every change verified to compile clean (routes 200, no errors).

## C. Pending design tasks
- [ ] **Auto dark/night mode** — owner wants auto-switch by local timezone (no toggle). Theme system (`useTheme`) already switches by device time; redesigned screens are currently light-only. Plan: finish redesigning ALL screens light, then ONE consistent auto-dark pass (define dark palette once, apply everywhere).
- [ ] Redesign remaining ~19 screens (booking flow: ServiceCategory → SubService → BookingForm → Confirmation → WorkerAssignment → Payment → Review → Receipt; specials: Movers, Laundry, Carpet, Water status, Shop, tracking; Inspections, Documents, About, FAQ, Support).
- [ ] Enable Google/Facebook OAuth providers in Supabase dashboard (social buttons already in UI).
- [ ] Complete remaining pre-redeploy tasks above
