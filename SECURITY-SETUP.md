# Fixera Security Setup — Required Actions

## 1. Rotate Gmail App Password (DO THIS NOW)

The file `web/.env.local` contains a real Gmail app password.
Even though it's git-ignored, you must rotate it:

1. Go to https://myaccount.google.com/apppasswords
2. Delete the existing "Fixera" app password
3. Generate a new one
4. Update it in Vercel (see section 2 below)
5. Update `web/.env.local` for local dev

## 2. Set These Environment Variables in Vercel

Go to: Vercel Dashboard → Your Project → Settings → Environment Variables

### Required (production + preview):

| Variable                  | Value                                      |
|---------------------------|--------------------------------------------|
| `GMAIL_EMAIL`             | fixera.service1@gmail.com                  |
| `GMAIL_PASSWORD`          | <new 16-char app password from step 1>     |
| `SUPABASE_URL`            | https://igncnngkbmswomphbhwa.supabase.co   |
| `SUPABASE_SERVICE_ROLE_KEY` | <from Supabase → Settings → API>         |
| `MPESA_CONSUMER_KEY`      | <from Safaricom Daraja>                    |
| `MPESA_CONSUMER_SECRET`   | <from Safaricom Daraja>                    |
| `MPESA_SHORTCODE`         | <your paybill/till number>                 |
| `MPESA_PASSKEY`           | <from Safaricom Daraja>                    |
| `MPESA_CALLBACK_URL`      | https://your-domain.vercel.app/api/mpesa-callback |
| `MPESA_CALLBACK_SECRET`   | <generate with: openssl rand -hex 32>      |
| `MPESA_ENV`               | production  (or 'sandbox' for testing)     |

### Generate MPESA_CALLBACK_SECRET:
Run in any terminal: `openssl rand -hex 32`
Copy the output — this is your secret. Keep it safe, never share it.

## 3. Run This Migration in Supabase SQL Editor

File: `migrations/secure_profiles_rls.sql`

Go to: Supabase Dashboard → SQL Editor → paste the contents → Run

This prevents any user from escalating their own is_admin flag to true.

## 4. Remove Old Env Var Names

In Vercel, remove these if they exist (they were old names):
- `REACT_APP_GMAIL_EMAIL`
- `REACT_APP_GMAIL_PASSWORD`

These are now replaced by `GMAIL_EMAIL` and `GMAIL_PASSWORD`.

## What Was Fixed (Security Hardening Summary)

| Vulnerability | Fix Applied |
|---------------|-------------|
| M-Pesa STK Push endpoint was public — anyone could spam any phone | Requires Supabase JWT |
| M-Pesa Status endpoint was public | Requires Supabase JWT |
| Email send endpoint was public — anyone could phish from Fixera domain | Requires Supabase JWT |
| Email broadcast was public — anyone could blast all users | Requires admin JWT |
| Client controlled payment amount — could pay KSh 1 for any service | Server now reads amount from DB, ignores client |
| M-Pesa callback had no origin check — fake "paid" POST possible | Verified with MPESA_CALLBACK_SECRET query param |
| Callback didn't cross-check CheckoutRequestID in DB | Now verifies row exists before marking paid |
| Admin mutations had no audit trail | auditLog() wired to all mutations |
| Admin mutations ignored Supabase error responses | All mutations now check { error } and alert |
| profiles table had no RLS — self is_admin elevation possible | Migration created: secure_profiles_rls.sql |
