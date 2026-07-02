# 💰 DEPOSIT COMMISSION DEDUCTION RULES - CRITICAL

**Added:** June 5, 2026  
**Priority:** HIGH - Core commission collection mechanism  
**This is:** The KEY rule for automatic commission collection

---

## 🎯 THE RULE: KSh 500 Deposit = Commission Pool for Cash Payments

### **CASH PAYMENT MODEL vs M-PESA MODEL**

**CASH PAYMENT (Default):**
```
Customer pays CASH to Worker
        ↓
Commission deducted FROM DEPOSIT (not from earnings!)
        ↓
Worker keeps: Job amount - commission
Deposit: Gets consumed/depleted over time
        ↓
When deposit runs out → MUST REDEPOSIT
```

**M-PESA PAYMENT (Alternative):**
```
Customer pays M-PESA
        ↓
Commission deducted from JOB EARNINGS (not deposit!)
        ↓
Deposit: NEVER TOUCHED, stays at KSh 500
        ↓
Worker: One-time deposit, forever protected
```

---

## 📊 REAL EXAMPLE: How Deposit Depletes with Cash

### **Starting Position:**
```
Deposit: KSh 500
Available: KSh 0
Total wallet: KSh 500
```

### **After Job 1 (KSh 1,000 - CASH):**
```
Job amount: KSh 1,000
Commission (15%): KSh 150
WHERE IS COMMISSION PAID FROM?
└─ FROM DEPOSIT! (deducted automatically)

New wallet state:
├─ Deposit: KSh 350 (was 500, minus 150 commission)
├─ Available: KSh 1,000 (worker can keep/withdraw)
├─ On Hold: KSh 0
└─ TOTAL: KSh 1,350

Worker's view in app:
┌──────────────────────────────┐
│ Deposit:     KSh 350   ⚠️    │
│ ████████░░░░░░░░░░░░░ 70%   │
│ Available:   KSh 1,000       │
│ Total:       KSh 1,350       │
└──────────────────────────────┘
```

### **After Job 2 (KSh 500 - CASH):**
```
Job amount: KSh 500
Commission (15%): KSh 75
Deducted from DEPOSIT: -KSh 75

New wallet state:
├─ Deposit: KSh 275 (350 - 75)
├─ Available: KSh 1,500
└─ TOTAL: KSh 1,775
```

### **After Job 3 (KSh 400 - CASH):**
```
Job amount: KSh 400
Commission (15%): KSh 60

New wallet state:
├─ Deposit: KSh 215 (275 - 60)
├─ Available: KSh 1,900
└─ TOTAL: KSh 2,115
```

### **After Job 4 (KSh 300 - CASH):**
```
Job amount: KSh 300
Commission (15%): KSh 45

New wallet state:
├─ Deposit: KSh 170 (215 - 45)
├─ Available: KSh 2,200
└─ TOTAL: KSh 2,245
```

### **After Job 5 (KSh 350 - CASH):**
```
Job amount: KSh 350
Commission (15%): KSh 52.50 ≈ KSh 53

New wallet state:
├─ Deposit: KSh 117 (170 - 53) ⚠️ GETTING LOW!
├─ Available: KSh 2,550
└─ TOTAL: KSh 2,667
```

### **CRITICAL MOMENT - Deposit Hits KSh 500 Limit:**

```
If worker accepts more jobs and deposit drops back to KSh 500:

System triggers warning:
┌─────────────────────────────────┐
│ ⚠️  DEPOSIT DEPLETED            │
├─────────────────────────────────┤
│ Deposit: KSh 500                │
│ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│
│ Status: Commission pool empty   │
│                                 │
│ Your commission has consumed    │
│ your initial deposit.           │
│                                 │
│ To continue accepting CASH jobs,│
│ you must redeposit KSh 500      │
│                                 │
│ [REDEPOSIT KSh 500] [USE M-PESA] │
└─────────────────────────────────┘
```

### **If Deposit Drops BELOW KSh 500:**

```
Example: Deposit now = KSh 50

System BLOCKS:
┌─────────────────────────────────┐
│ ❌ CANNOT ACCEPT CASH JOBS      │
├─────────────────────────────────┤
│ Your deposit is critically low: │
│ KSh 50                          │
│                                 │
│ Next job (KSh 1,000):           │
│ Commission needed: KSh 150      │
│ But you only have: KSh 50       │
│ Shortfall: KSh 100              │
│                                 │
│ SOLUTION:                       │
│ 1. Redeposit KSh 500            │
│ 2. Accept only M-Pesa payments  │
│ 3. Switch to M-Pesa mode        │
│                                 │
│ [REDEPOSIT] [M-PESA ONLY]       │
└─────────────────────────────────┘

If worker ignores:
├─ Next job attempted: ❌ BLOCKED
├─ Error: "Insufficient deposit to cover commission"
├─ Options: Redeposit or switch to M-Pesa
└─ After 30 days of this: Account deactivated
```

---

## 🔄 M-PESA COMPARISON: Deposit Never Depletes

### **M-Pesa Jobs - Deposit Stays Protected**

```
Initial Deposit: KSh 500
M-Pesa Job 1: KSh 1,000
├─ Commission (15%): KSh 150 (from earnings, not deposit!)
├─ Worker gets: KSh 850
├─ Deposit: KSh 500 (UNCHANGED!)
└─ Available: KSh 850

M-Pesa Job 2: KSh 1,000
├─ Commission (15%): KSh 150 (from earnings)
├─ Worker gets: KSh 850
├─ Deposit: KSh 500 (STILL UNCHANGED!)
└─ Available: KSh 1,700

...After 5 M-Pesa jobs...

Total earned: KSh 5,000
Total commission: KSh 750 (deducted from earnings)
Total to worker: KSh 4,250
Deposit: KSh 500 (ALWAYS THE SAME!)

WALLET STATE:
┌──────────────────────────┐
│ Deposit:     KSh 500  ✅ │
│ ████████████████░░░░ 100%│
│ Available:   KSh 4,250   │
│ TOTAL:       KSh 4,750   │
└──────────────────────────┘

KEY DIFFERENCE:
- With CASH: Deposit depletes in ~1 week (need redeposit)
- With M-PESA: Deposit protected forever (redeposit never needed)
```

---

## 🚨 REDEPOSIT SYSTEM

### **When Worker Must Redeposit**

**Trigger: Deposit Balance Reaches KSh 500 or Below**

```
SCENARIO 1: After 6 cash jobs
├─ Initial deposit: KSh 500
├─ Commission paid: ~KSh 500 (6 jobs × ~KSh 83 each)
├─ Current deposit: KSh 0-50
├─ System action: BLOCKS cash jobs
└─ Solution: Redeposit KSh 500

SCENARIO 2: Busy worker (10 jobs in 3 days)
├─ Initial deposit: KSh 500
├─ Commission paid: ~KSh 1,500 (10 jobs × ~KSh 150 each)
├─ Current deposit: NEGATIVE! (overspent)
├─ System action: BLOCKED immediately
└─ Solution: Redeposit KSh 500 (or switch to M-Pesa)

SCENARIO 3: Worker ignores warnings
├─ Deposit = KSh 50
├─ Tries to accept KSh 2,000 job
├─ Commission needed: KSh 300
├─ Can't deduct (only KSh 50 available)
├─ System: ❌ JOB BLOCKED
└─ Message: "Redeposit to accept more cash jobs"
```

### **Redeposit Process (Step-by-Step)**

**Step 1: Worker sees warning**
```
App notification:
"Your commission pool is running low (KSh 175 left).
Consider redepositing or switching to M-Pesa."

Wallet shows visual:
┌─────────────────────┐
│ Deposit: KSh 175 🔴 │
│ ███░░░░░░░░░░ 35%  │
│ [REDEPOSIT] [INFO]  │
└─────────────────────┘
```

**Step 2: Worker clicks "REDEPOSIT KSh 500"**
```
Confirmation screen:
"Redeposit KSh 500 to continue accepting cash jobs?"
├─ Current deposit: KSh 175
├─ After redeposit: KSh 675
├─ This will: Unlock cash jobs again
└─ [CONFIRM] [CANCEL]
```

**Step 3: M-Pesa payment**
```
M-Pesa STK prompt received on phone
Worker enters PIN
Payment confirmed: KSh 500 deducted
```

**Step 4: Wallet updated**
```
BEFORE:
├─ Deposit: KSh 175
└─ Available: KSh 2,300

AFTER:
├─ Deposit: KSh 675 (175 + 500)
├─ Available: KSh 2,300 (unchanged)
└─ Status: ✅ CASH JOBS UNLOCKED

Notification: "Redeposit successful! 
Ready to accept cash jobs again."
```

**Step 5: Cycle continues**
```
Worker accepts more cash jobs
Commission keeps depleting from deposit
After ~1-2 weeks: Must redeposit again
```

---

## 💡 WHY THIS SYSTEM?

### **For Fixera:**
```
✅ Automatic commission collection
✅ No cash handling (digital withdrawal)
✅ Clear audit trail (every job tracked)
✅ Recurring revenue (redeposits = repeated deposits)
✅ Workers invest (skin in the game)
✅ Incentivizes M-Pesa (avoid redeposits)
```

### **For Workers (Cash Model):**
```
✅ Commission transparent (see it deducted)
✅ Flexible (can redeposit anytime)
✅ Recurring revenue (keep earning)
✅ Protection (deposit refundable after 30 days)
```

### **For Workers (M-Pesa Model):**
```
✅ No redeposits needed (deposit protected)
✅ Simpler experience (one-time setup)
✅ Better for volume (no deposit management)
✅ Higher earnings (no deposit depletion)
```

---

## 📈 DEPOSIT DEPLETION RATE (How Long Before Redeposit?)

**Depends on job size & frequency:**

```
SCENARIO 1: Small jobs (avg KSh 500/job)
├─ Commission per job: KSh 75
├─ Deposit consumed: 500 ÷ 75 = ~6-7 jobs
├─ Timeline: At 1 job/day = ~1 week
└─ Redeposit frequency: Weekly

SCENARIO 2: Medium jobs (avg KSh 1,000/job)
├─ Commission per job: KSh 150
├─ Deposit consumed: 500 ÷ 150 = ~3 jobs
├─ Timeline: At 2 jobs/day = ~2 days
└─ Redeposit frequency: Every few days

SCENARIO 3: Large jobs (avg KSh 5,000/job)
├─ Commission per job: KSh 750
├─ Deposit consumed: 500 ÷ 750 < 1 job
├─ Timeline: First job depletes it!
├─ Must redeposit BEFORE 2nd job
└─ Redeposit frequency: After each job!

SCENARIO 4: Busy worker (5 jobs/day, avg KSh 1,000)
├─ Daily commission: 5 × KSh 150 = KSh 750
├─ Days until depleted: 500 ÷ 750 < 1 day
├─ Timeline: Depletes same day!
└─ RECOMMENDATION: Switch to M-Pesa (no redeposits)
```

---

## 🎯 M-PESA INCENTIVE: Why Switch?

### **The Problem with Cash (repeated deposits):**
```
Worker doing 5 cash jobs/day @ KSh 1,000 each:
├─ Daily commission: KSh 750
├─ Deposit depletes: Same day!
├─ Must redeposit: Daily
├─ Cost: KSh 500 × 30 days = KSh 15,000/month in deposits
├─ Hassle: Pay M-Pesa fee 30 times
└─ Result: Tedious, expensive, frustrating
```

### **The Solution (M-Pesa):**
```
Switch to M-Pesa only:
├─ Deposit: KSh 500 (one-time, protected)
├─ Never depletes: ✅ No redeposits
├─ Commission: Deducted from earnings (not deposit)
├─ Cost: KSh 0 in repeated deposits
├─ Timeline: "Set it and forget it"
└─ Result: Clean, simple, professional

COMPARISON:
├─ CASH model: KSh 500/week in redeposits
├─ M-PESA model: KSh 0 in redeposits
├─ Savings: KSh 2,000/month for busy workers
└─ Bonus: Digital payment ecosystem
```

### **Optional Incentive Structure:**

```
Fixera could incentivize M-Pesa adoption:

OPTION 1: Lower commission for M-Pesa
├─ Cash commission: 15%
├─ M-Pesa commission: 14% (save 1%)
└─ Worker earning on KSh 30K: Saves KSh 300/month

OPTION 2: Free redeposits
├─ Normal: KSh 500 per redeposit
├─ M-Pesa users: "Free redeposit if needed" (rare)
└─ Encourages switching without punishment

OPTION 3: Deposit protection bonus
├─ M-Pesa users: Bonus KSh 100 when first M-Pesa job completes
├─ Creates goodwill
└─ Softens "forced switch" feeling

OPTION 4: No incentive (pure choice)
├─ Workers choose based on preference
├─ Those valuing simplicity → M-Pesa
├─ Those accepting recurring deposits → Cash
└─ Both valid models
```

---

## 📋 DEPOSIT MONITORING UI

### **Visual Indicator in Wallet App:**

**HEALTHY (> KSh 300):**
```
┌──────────────────────────┐
│ Deposit: KSh 450    ✅   │
│ ████████████░░░░░░ 90%  │
│ Status: All systems go   │
│ Next redeposit needed:   │
│ Not soon (est. 5 days)   │
└──────────────────────────┘
```

**CAUTION (KSh 150-300):**
```
┌──────────────────────────┐
│ Deposit: KSh 240    ⚠️   │
│ ████████░░░░░░░░░░ 48%  │
│ Status: Caution zone     │
│ Next redeposit needed:   │
│ Soon (est. 2-3 days)     │
│ [REDEPOSIT NOW?]         │
└──────────────────────────┘
```

**CRITICAL (KSh 50-150):**
```
┌──────────────────────────┐
│ Deposit: KSh 85     🔴   │
│ ██░░░░░░░░░░░░░░░░ 17%  │
├──────────────────────────┤
│ ⚠️ CASH JOBS AT RISK    │
│ Next redeposit needed:   │
│ URGENT (today!)          │
│ [REDEPOSIT KSh 500]      │
│ [SWITCH TO M-PESA]       │
└──────────────────────────┘
```

**DEPLETED (< KSh 50):**
```
┌──────────────────────────┐
│ Deposit: KSh 15     ❌   │
│ ░░░░░░░░░░░░░░░░░░ 3%   │
├──────────────────────────┤
│ ❌ CASH JOBS BLOCKED     │
│ Action required NOW:     │
│                          │
│ [REDEPOSIT KSh 500]  ← Urgent
│ [M-PESA ONLY MODE]   ← Alternative
│                          │
│ Support: disputes@...    │
└──────────────────────────┘
```

---

## ✅ SUMMARY TABLE

| Metric | Cash Jobs | M-Pesa Jobs |
|--------|-----------|-------------|
| **Commission source** | From deposit | From earnings |
| **Deposit change** | ⬇️ Depletes | ➡️ Stays same |
| **Redeposit needed** | Every 1-2 weeks | Never |
| **Frequency of deposit payment** | Multiple times/month | Once (initial) |
| **Total cost/month** | KSh 2,000+ | KSh 0 |
| **Hassle level** | High (repetitive) | Low (one-time) |
| **Best for** | Low-volume workers | High-volume workers |
| **Worker preference** | Those who like cash | Those who like digital |

---

**DOCUMENT VERSION:** 1.0  
**EFFECTIVE:** June 5, 2026  
**STATUS:** CRITICAL OPERATING RULE

*This is the core mechanism that makes the wallet system work for both Fixera (commission collection) and workers (simple earnings). Make this rule clear to all workers before they start accepting jobs.*
