# Ledger — Feature Roadmap

## High Impact

### 1. Transaction Persistence ✳️ (in progress)
Save imported transactions and their categories to localStorage so data survives page refreshes. Currently everything resets when the user closes or refreshes the tab.

### 2. Budgets
Let users set a monthly spending limit per category (e.g. Groceries: $400/mo). Show a progress bar on the Categories tab — green when under budget, amber when close, red when over. Store budgets in localStorage.

### 3. Recurring Transaction Detection
Automatically flag transactions that appear monthly at the same merchant. Surface a "Subscriptions & Bills" summary showing fixed monthly obligations (rent, Netflix, car payment, etc.) and their total.

---

## Medium Impact

### 4. More Default Categories
Add missing common categories:
- Travel (airlines, hotels, Airbnb, Uber, Lyft, rental cars)
- Beauty & Personal Care (Sephora, salon, spa, barber)
- Pet Supplies (Petco, Petsmart, Chewy, vet)
- Charity & Donations (GoFundMe, PayPal Giving, church)
- Bars & Alcohol (liquor store, brewery, winery)
- Baby & Kids (Buy Buy Baby, Carter's, daycare, pediatrician)
- Split "Medical & Personal" → "Medical" + "Personal Care"

### 5. Date Range Filter
A date picker on the Transactions tab to filter by custom range (last 30 days, a specific pay period, etc.). More flexible than the monthly/quarterly report groupings.

### 6. Savings Rate on Overview
A single prominent "Savings Rate" stat: `(income − spending) / income × 100`. One of the most useful personal finance metrics, trivially computed from existing data.

### 7. Trend Chart
A bar or line chart on the Reports tab showing monthly spending by category over time. The data already exists in `monthlyReports` — just needs a visualization layer.

---

## Lower Impact

### 8. Multi-Account Support
Allow importing multiple CSVs and tagging each with an account name (Chase Checking, Amex, etc.). Merge transactions across accounts with duplicate detection.

### 9. Export to CSV
Download the currently filtered and categorized transactions as a clean CSV file. Useful for sharing with an accountant or importing into Excel/Sheets.

### 10. Transaction Notes
A small editable text field on each transaction row for personal annotations (e.g. "reimbursed by work", "split with roommate"). Saved to localStorage.
