# 💳 M-PESA PAYMENT INTEGRATION PLAN
## Comprehensive Implementation Guide for Fixera Marketplace

**Date:** June 5, 2026  
**Status:** Detailed Specification Ready  
**Timeline:** 6-8 weeks (including testing & compliance)  
**Priority:** ⭐⭐⭐ CRITICAL - Blocking feature for launch

---

## 📋 EXECUTIVE SUMMARY

This document provides a complete blueprint for integrating M-Pesa into Fixera's payment system. M-Pesa is critical for the business model because:

- ✅ 90%+ of Kenya uses M-Pesa (vs 20% with bank cards)
- ✅ Matches Kenya's cash-heavy economy
- ✅ Enables worker payouts (B2C)
- ✅ Enables customer payments (STK Push)
- ✅ Reduces cash handling for Fixera

**Key Insight:** This plan supports 5 different user types (Customer, Worker, Vendor, Rider, Supplier) with different payment models.

---

## 🎯 M-PESA PAYMENT METHODS

### ✅ RECOMMENDED FOR FIXERA:

**1. Lipa Na M-Pesa Online (STK Push)** - CUSTOMER PAYMENTS
- Customer gets M-Pesa prompt on their phone
- No redirect to M-Pesa website needed
- Payment completes in 40 seconds
- "Enter PIN" screen appears automatically

**Use Case:** Customers paying for bookings, deposits, and large services
- Min: KSh 100
- Max: KSh 150,000/transaction
- Daily max: KSh 300,000

**2. B2C (Business to Consumer)** - WORKER/VENDOR PAYOUTS
- Fixera sends money to worker's M-Pesa account
- Settlement payouts after service completion
- Money appears in recipient's wallet instantly
- Fixera initiates, fully automated

**Use Case:** Worker salary settlement (weekly), vendor commission payout

**3. C2B (Consumer to Business)** - OPTIONAL
- Customers send money via USSD/M-Pesa app
- Good for offline payments
- Manual reconciliation needed
- Status: Optional, build later if needed

---

## 💰 PAYMENT FLOWS BY USER TYPE

### **1. CUSTOMER PAYMENT FLOW** (STK Push)

**Refund Policy:**
```
Cancellation <2 hours before: Full refund
Cancellation 2-24 hours: 50% refund
Cancellation >24 hours: No refund
Refund window: 48 hours from booking
Processing: 24 hours to same M-Pesa account
```

**Example Transaction:**
```
Booking confirmed: KSh 1,000 (Plumbing repair)
    ↓
Customer clicks [Pay Now]
    ↓
STK prompt: "Enter M-Pesa PIN for KSh 1,000"
    ↓
Customer enters PIN
    ↓
M-Pesa: "Confirmed. You sent KSh 1,000 to Fixera"
    ↓
App: "Payment confirmed! Booking locked in."
```

---

### **2. WORKER PAYMENT FLOW** (B2C Settlement)

**Settlement Timing:**
```
T=0: Service completed
T+24h: Dispute window closed, settlement created
T+3 days: Batch B2C processed
T+4 days: Money in worker's M-Pesa account
```

**Commission Structure:**
```
Service amount: KSh 1,000
Commission (15%): -KSh 150
M-Pesa B2C fee: -KSh 30 (Fixera absorbs)
Worker receives: KSh 820
```

**Weekly Earnings Example:**
```
Week 1:
- 5 jobs @ KSh 1,000 each = KSh 5,000
- Total commission: -KSh 750
- M-Pesa fees: -KSh 150 (Fixera)
- Worker earns: KSh 4,250
- Settlement date: Next Friday
```

**Minimum Payout:** KSh 500 per transaction (held for next settlement if below)

---

### **3. VENDOR PAYMENT FLOW** (Net 7/30 Terms)

**Settlement Timing:**
- Net 7: Payment 7 days after invoice acceptance
- Net 30: Payment 30 days after invoice acceptance
- Batch process: Monday & Thursday mornings

**Commission Structure:**
```
Service amount: KSh 10,000
Commission (10%): -KSh 1,000 (lower than workers)
Vendor receives: KSh 9,000
```

---

### **4. RIDER PAYMENT FLOW** (Per-Delivery)

**Per-Delivery Model:**
```
Delivery distance: 1-3 km
Rider payment: KSh 100-300 (varies by distance)
Platform fee: -KSh 25/delivery (fixed)
Rider receives: KSh 75-275
```

**Example:** 20 deliveries/day @ avg KSh 125 = KSh 2,500/day

**Daily Threshold:**
- Daily total <KSh 500: Consolidated Friday
- Daily total >KSh 500: Same-day settlement (by 11 PM)

---

### **5. SUPPLIER PAYMENT FLOW** (Bulk Monthly)

**Settlement Timing:**
```
Order placed: Day 1
Order delivered: Day 5
Net 30 starts: Day 5
Payment due: Day 35
Batch processing: End of month
```

**Commission Structure:**
```
Supplier invoice: KSh 100,000
Commission (5% - lowest): -KSh 5,000
Supplier receives: KSh 95,000
```

---

## 🗄️ DATABASE SCHEMA CHANGES

### **1. PAYMENTS TABLE** (All transactions)
```sql
CREATE TABLE payments (
  id UUID PRIMARY KEY,
  booking_id UUID REFERENCES bookings(id),
  user_id UUID REFERENCES users(id),
  user_type VARCHAR(20),
  payment_type VARCHAR(20),
  amount_cents BIGINT,
  currency VARCHAR(3) DEFAULT 'KES',
  mpesa_transaction_id VARCHAR(50) UNIQUE,
  phone_number VARCHAR(15),
  till_number VARCHAR(20),
  merchant_request_id VARCHAR(100),
  checkout_request_id VARCHAR(100),
  status VARCHAR(20),
  error_code VARCHAR(10),
  error_message TEXT,
  description TEXT,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  mpesa_callback_received_at TIMESTAMP,
  CONSTRAINT valid_amount CHECK (amount_cents > 0)
);

CREATE INDEX idx_payments_user_id ON payments(user_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_mpesa_tx ON payments(mpesa_transaction_id);
```

### **2. SETTLEMENTS TABLE** (Aggregate payouts)
```sql
CREATE TABLE payment_settlements (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  user_type VARCHAR(20),
  settlement_period_start DATE,
  settlement_period_end DATE,
  gross_amount_cents BIGINT,
  commission_cents BIGINT,
  mpesa_fee_cents BIGINT,
  net_amount_cents BIGINT,
  status VARCHAR(20),
  mpesa_b2c_request_id VARCHAR(100) UNIQUE,
  mpesa_b2c_result_code VARCHAR(10),
  settled_at TIMESTAMP,
  scheduled_for TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_settlements_user_id ON settlements(user_id);
CREATE INDEX idx_settlements_status ON settlements(status);
```

### **3. PAYMENT_DISPUTES TABLE** (Chargebacks)
```sql
CREATE TABLE payment_disputes (
  id UUID PRIMARY KEY,
  payment_id UUID REFERENCES payments(id),
  dispute_type VARCHAR(20),
  reason TEXT,
  status VARCHAR(20),
  resolution TEXT,
  resolved_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_disputes_payment_id ON disputes(payment_id);
CREATE INDEX idx_disputes_status ON disputes(status);
```

### **4. PAYMENT_WEBHOOKS TABLE** (Audit log)
```sql
CREATE TABLE payment_webhooks (
  id UUID PRIMARY KEY,
  webhook_type VARCHAR(50),
  mpesa_request_id VARCHAR(100),
  raw_payload JSONB,
  processed BOOLEAN DEFAULT FALSE,
  processed_at TIMESTAMP,
  processing_error TEXT,
  received_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_webhooks_request_id ON webhooks(mpesa_request_id);
```

---

## 🔧 IMPLEMENTATION PHASES

### **PHASE 1: FOUNDATION** (Weeks 1-2)

**Week 1: M-Pesa Account Setup**
- [ ] Register Fixera with Safaricom (3-5 business days)
- [ ] Get M-Pesa shortcode (6-digit till)
- [ ] Get API consumer key & secret
- [ ] Get B2C credentials for payouts
- [ ] Create Daraja API Account at https://developer.safaricom.co.ke
- [ ] Generate OAuth credentials
- [ ] Configure Webhooks with callback URLs
- [ ] Sandbox Testing with test phone: 254708374149

**Week 2: Database Setup**
- [ ] Create migrations for all 4 tables
- [ ] Add indexes for performance
- [ ] Modify existing tables (add payment_id to bookings)
- [ ] Add wallet fields to users
- [ ] Add settlement fields to workers/vendors

---

### **PHASE 2: PAYMENT SERVICE** (Weeks 2-3)

**STK Push Service** (/services/mpesa/stk-push.js)
- Validate customer KYC
- Initiate STK prompt
- Handle timeout callback
- Handle success/failure callback
- Implement retry logic

**B2C Service** (/services/mpesa/b2c.js)
- Calculate worker payout
- Initiate B2C transaction
- Handle B2C callback
- Track settlement status
- Implement failed retry

**Webhook Handler** (/services/mpesa/webhook-handler.js)
- Verify HMAC signature
- Process STK callback
- Process B2C callback
- Handle out-of-order delivery
- Idempotency checks

**Settlement Service** (/services/settlements/settlement-service.js)
- Aggregate weekly payments
- Calculate commissions
- Handle holds/disputes
- Batch B2C initiation
- Send notifications

---

### **PHASE 3: INTEGRATION** (Weeks 3-4)

**Frontend Updates**
- Update PaymentPage.jsx with STK UI
- Add STK prompt waiting screen
- Implement status polling
- Add error handling & retry

**Settlement Automation**
- Weekly batch job (Friday 2 AM)
- Calculate commissions
- Hold for disputes
- Initiate B2C payouts
- Send settlement notifications

**Admin Dashboard**
- Payment transaction history
- Settlement status tracking
- Dispute management
- B2C payout tracking
- Revenue analytics

---

### **PHASE 4: TESTING** (Weeks 5-6)

**Unit Tests**
- STK Push calculation
- Commission deduction
- Dispute logic
- Settlement batch logic

**Integration Tests**
- Customer payment (STK) flow
- Worker settlement (B2C) flow
- Dispute resolution flow
- Webhook processing

**End-to-End Tests**
- Full booking → payment → receipt
- Full work → settlement → payout
- Payment failure & recovery
- Dispute workflow

**Sandbox Testing**
- All flows with test numbers
- Edge cases (network failures)
- Concurrent payments
- Failed settlement retry

---

## 🔐 SECURITY & COMPLIANCE

### **Webhook Signature Verification**
```javascript
const HMAC_SECRET = process.env.MPESA_WEBHOOK_SECRET;

function verifyWebhook(payload, signature) {
  const computed = crypto
    .createHmac('sha256', HMAC_SECRET)
    .update(JSON.stringify(payload))
    .digest('base64');
  
  return computed === signature;
}
```

### **Critical Security Measures:**
- ✓ Webhook signature verification on all callbacks
- ✓ Idempotency keys prevent duplicate payments
- ✓ PCI DSS compliance (TLS 1.3, encrypted fields)
- ✓ KYC verification with tier limits
- ✓ Device fingerprinting & IP geolocation
- ✓ Velocity checks for unusual patterns
- ✓ Daily M-Pesa balance reconciliation
- ✓ Rate limiting (10 payment attempts/hour)

### **KYC Tiers**
```
Tier 1 (Unverified): KSh 10,000/day limit
Tier 2 (Phone verified): KSh 100,000/day limit
Tier 3 (Full KYC): KSh 300,000/day limit
Workers: Phone + National ID required
Vendors: Business registration required
```

---

## 📊 COMMISSION STRUCTURE

| User Type | Commission | M-Pesa Fee | Notes |
|-----------|-----------|-----------|-------|
| **Customer** | N/A | Included | Embedded in pricing |
| **Worker** | 15% | KSh 30 (Fixera) | Per service |
| **Vendor** | 10% | KSh 30 (Fixera) | Lower rate |
| **Rider** | 15% | KSh 25 | Per delivery |
| **Supplier** | 5% | KSh 30 (Fixera) | Bulk discount |

---

## 📈 FINANCIAL PROJECTIONS - MULTI-PARTNER MODEL

**Year 1 Realistic Estimate (200 workers + 50 vendors + 10 suppliers + 50 riders):**

### **MONTHLY BREAKDOWN:**
```
WORKERS (200):
Jobs: 200 × 10 = 2,000/month
Volume: 2,000 × KSh 1,500 = KSh 3,000,000
Commission (15%): KSh 450,000

VENDORS (50):
Jobs: 50 × 3 = 150/month
Volume: 150 × KSh 10,000 = KSh 1,500,000
Commission (10%): KSh 150,000

SUPPLIERS (10):
Orders: 10 × 2 = 20/month
Volume: 20 × KSh 50,000 = KSh 1,000,000
Commission (5%): KSh 50,000

RIDERS (50):
Deliveries: 50 × 20 = 1,000/month
Volume: 1,000 × KSh 500 = KSh 500,000
Commission (15%): KSh 75,000
```

### **MONTHLY TOTALS:**
```
Total Monthly Volume: KSh 6,000,000
Total Monthly Commission: KSh 725,000
```

### **ANNUAL TOTALS:**
```
Total Annual Volume: KSh 72,000,000
Total Annual Commission: KSh 8,700,000

Breakdown by Partner:
- Workers: KSh 5,400,000
- Vendors: KSh 1,800,000
- Suppliers: KSh 600,000
- Riders: KSh 900,000
```

### **ACQUISITION & PAYBACK:**
```
Customer acquisition cost: KSh 500
Worker acquisition cost: KSh 500
Vendor acquisition cost: KSh 1,000
Supplier acquisition cost: KSh 2,000
Rider acquisition cost: KSh 500

Annual payback at KSh 8.7M revenue: <1 month
```

---

## ✅ GO-LIVE CHECKLIST

**Pre-Launch (Week 6):**
- [ ] All M-Pesa flows tested in sandbox
- [ ] B2C working for worker payouts
- [ ] STK working for customer payments
- [ ] Webhook signature verification working
- [ ] Settlement automation tested
- [ ] Dispute flow tested
- [ ] Admin dashboard functional
- [ ] Documentation complete
- [ ] Support team trained
- [ ] Kill-switch configured
- [ ] Monitoring/alerts set up
- [ ] Compliance audit passed

**Launch Strategy:**
```
Week 1: Beta (10% of users)
├─ Payment limits: KSh 5,000 max
├─ Manual settlement review
└─ 24/7 support team monitoring

Week 2: Expanded (25% of users)
├─ Payment limits: KSh 25,000 max
├─ Semi-automated settlement
└─ Monitor for issues

Week 3: Full Rollout (100%)
├─ All limits enabled
├─ Full automation
└─ Continuous monitoring
```

---

## 🚨 CRITICAL SUCCESS FACTORS

1. **M-Pesa Account Setup** - Longest lead time (5-10 business days)
2. **Safaricom Approval** - Can be unpredictable, start early
3. **Webhook Reliability** - Out-of-order delivery handling essential
4. **Settlement Automation** - Must be 99.9% reliable
5. **Monitoring & Alerts** - Real-time issue detection required
6. **Support Preparedness** - Team needs payment troubleshooting training

---

## 📞 SAFARICOM CONTACTS

**M-Pesa Business:**
- Website: https://www.safaricom.co.ke/business
- Email: bisdev@safaricom.co.ke
- Phone: 0722 205 000

**Daraja Developer:**
- Website: https://developer.safaricom.co.ke
- Sandbox login: Use test credentials

---

**Document Version:** 1.0  
**Status:** Ready for Implementation  
**Last Updated:** June 5, 2026  
**Contact:** development@fixera.co.ke
