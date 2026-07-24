# Pending Legal Addendum — Items to Formalize with Lawyer/Advocate

**Status:** DRAFT NOTE — not legal text, not reviewed by counsel. This
file exists so these two requirements don't get lost before the next
lawyer/advocate consultation. Nothing here overrides or edits any of
the existing drafted documents (`FIXERA-LEGAL-DOCUMENTATION-CORRECTED.txt`,
`FIXERA-LEGAL-DOCUMENTATION-CLEAN.txt`, etc.) — those remain exactly as
counsel prepared them.

Both items below are already enforced in the live partner onboarding
app (`worker/src/pages/auth/OnboardingPage.jsx`) as of 2026-07-24, per
Mohamed's explicit instruction, but are not yet reflected in any of the
formally drafted legal/policy documents.

---

## 1. Background check recency requirement (6 months)

**Current app behavior:** Every partner type that requires a criminal
background check / DCI Certificate of Good Conduct (Service Workers —
all 4 specialties, Riders) must also supply the certificate's issue
date. If that date is older than 6 months, the app shows a warning
telling the partner to upload a current one before submitting.

**Not yet in the legal docs:** The Partner Onboarding & Qualification
Checklist and the Service Worker / Rider Specific Agreements list
"Background check clearance" as a required document, but don't specify
a maximum age/validity period for it.

**Needs counsel to confirm:**
- Is 6 months the right validity window (vs. e.g. 3 or 12 months)?
- Should this be a hard submission block, or (as currently implemented)
  a warning that still allows submission, with Partner Verification
  flagging it for Mohamed's review?
- Should the same rule extend to Mover/Water Carrier crew members'
  background checks, or stay scoped to Workers/Riders only (current
  scope)?

## 2. SHA (Social Health Authority) compliance

**Current app behavior:** Workers and Riders are asked (optionally,
not required to submit) for an SHA registration number and a
compliance certificate, during the Health step of onboarding.

**Not yet in the legal docs:** None of the existing Partner-Specific
Agreements or the Qualification Checklist mention SHA at all — Kenya's
transition from NHIF to SHA post-dates the documents that were read
this session.

**Needs counsel to confirm:**
- Should SHA compliance be a *mandatory* requirement (matching how KRA
  PIN is treated) rather than optional, given it's likely a statutory
  requirement for engaging independent contractors in Kenya now?
- Which partner types should it apply to — currently scoped to
  Workers/Riders only, not Vendors/Suppliers/Movers/Water Carriers.
- Whether this needs its own clause in the Master Partner Agreement
  (alongside the existing tax/KRA independent-contractor language) or
  a separate compliance document.

---

## Also worth raising while consulting

The onboarding app currently presents 5 named policies for partner
acceptance (Partner Agreement, Code of Conduct, Damage & Liability
Policy, Customer Property Protection Policy, Cancellation Policy) as
individual checkboxes across every partner type. Of these, only **Code
of Conduct** exists as a separately-titled, readable section (§6 of
the Master Partner Agreement) in the current drafted documents. The
other 4 are concepts embedded within the Master Partner Agreement's
text rather than standalone documents a partner could open and read on
their own. Worth deciding whether to formalize them as separate
documents, or point the checkboxes at the specific sections of the
Master Partner Agreement that already cover each topic.
