# Ledger — Feature Roadmap

## Completed ✅

### 1. Transaction Persistence
Imported transactions, categories, account names, notes, and budgets persist in localStorage and restore on refresh.

### 2. Budgets
Monthly category budgets are implemented with visual status indicators on the Categories tab and persisted locally.

### 3. Recurring Transaction Detection
Recurring spend detection and "Subscriptions & Bills" summary are implemented in Insights.

### 4. More Default Categories
Added Travel, Personal Care, Pet Supplies, Charity & Donations, Bars & Alcohol, Baby & Kids, and split "Medical & Personal" into "Medical" + "Personal Care".

### 5. Date Range Filter
Transactions tab now supports custom date filtering, plus quick presets (Last 30d / Last 90d / Clear).

### 6. Savings Rate on Overview
Savings rate is displayed prominently in the Overview stats.

### 7. Trend Chart
Reports now include a monthly category trend chart.

### 8. Multi-Account Support
CSV imports can be tagged by account name, merged across accounts, and de-duplicated.

### 9. Export to CSV
Filtered transactions can be exported as CSV.

### 10. Transaction Notes
Per-transaction editable notes are implemented and persisted locally.

### 11. Advanced Recurring Detection (v2)
Recurring charge detection now supports monthly/biweekly cadence detection, confidence scoring, and normalized monthly-equivalent totals in Insights.

---

## High Impact

### 1. Budget Alerts & Forecasting
Add "projected end-of-month" budget status and alerts when spend pace suggests likely over-budget outcomes.

### 2. Subscription Governance
Add explicit "keep / review / cancel" status for detected recurring charges and track user decisions over time.

---

## Medium Impact

### 3. Account Management UX
Replace prompt-based account naming with an import modal and manage/rename/archive accounts from Settings.

### 4. Notes & Search Upgrades
Add note-only filters, quick note templates, and optional markdown-lite formatting.

---

## Lower Impact

### 5. Import Mapping Profiles
Save CSV column mappings per bank format so imports are one-click after first setup.
