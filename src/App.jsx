import { useState, useMemo, useCallback, useRef, useEffect } from "react";

const CATEGORY_RULES = [
  { category: "Groceries", keywords: ["grocery", "supermarket", "whole foods", "aldi", "meijer", "publix", "safeway", "trader joe", "food lion", "stop & shop", "giant food", "h-e-b", "heb", "wegmans", "sprouts"] },
  { category: "General Retail", keywords: ["walmart", "target", "kroger", "kohl", "kohls", "sam's club", "costco", "bj's wholesale", "dollar general", "dollar tree", "five below", "marshalls", "tj maxx", "tjmaxx", "ross stores", "tuesday morning", "big lots"] },
  { category: "Restaurants & Food", keywords: ["restaurant", "cafe", "coffee", "pizza", "burger", "grill", "bar", "bakery", "doordash", "uber eats", "grubhub", "chipotle", "domino", "taco bell", "subway", "starbucks", "mcdonald", "chick-fil-a"] },
  { category: "Gas & Fuel", keywords: ["shell", "speedway", "sheetz", "exxon", "mobil", "sunoco", "chevron", "marathon", "wawa fuel", "circle k gas", "bp gas", "fuel pump"] },
  { category: "Auto & Maintenance", keywords: ["valvoline", "auto parts", "o'reilly", "autozone", "advance auto", "firestone", "pep boys", "jiffy lube", "meineke", "midas", "mavis", "ntb", "car repair"] },
  { category: "Subscriptions", keywords: ["subscription", "netflix", "spotify", "hulu", "youtube premium", "disney+", "patreon", "dropbox", "icloud", "google one", "chatgpt", "openai", "tradingview", "apple one"] },
  { category: "Phone & Internet", keywords: ["phone", "wireless", "mobile plan", "xfinity", "spectrum", "verizon wireless", "at&t wireless", "t-mobile", "tmobile plan", "metro pcs", "boost mobile"] },
  { category: "Online Shopping", keywords: ["amazon", "ebay", "etsy", "shopify", "instacart", "walmart.com", "target.com", "bestbuy.com"] },
  { category: "Gaming", keywords: ["steam", "playstation", "xbox", "nintendo", "epic games", "riot games", "blizzard", "roblox", "minecraft", "gamestop", "twitch", "discord nitro", "battle.net"] },
  { category: "Insurance", keywords: ["insurance", "progressive", "geico", "state farm", "allstate", "liberty mutual", "aaa insurance", "nationwide ins", "travelers ins", "usaa"] },
  { category: "Entertainment", keywords: ["movie", "theater", "cinema", "concert", "ticket", "museum", "theme park", "bowling", "arcade", "best buy", "ticketmaster"] },
  { category: "Rent & Mortgage", keywords: ["rent", "mortgage", "lease payment", "landlord", "apartment", "hoa", "homeowners assoc", "condo fee", "property management"] },
  { category: "Electric Bill", keywords: ["electric", "electricity", "duke energy", "dominion energy", "con edison", "pg&e", "pge electric", "entergy", "consumers energy", "nv energy", "evergy", "national grid electric", "eversource"] },
  { category: "Water Bill", keywords: ["water bill", "water utility", "water service", "sewer", "waste water", "city water", "municipal water", "american water"] },
  { category: "Gas Bill", keywords: ["gas bill", "natural gas", "national grid gas", "columbia gas", "nicor gas", "peoples gas", "atmos energy", "piedmont natural gas", "southwest gas", "spire energy"] },
  { category: "Car Payment", keywords: ["car payment", "auto loan", "vehicle payment", "toyota financial", "honda financial", "ford motor credit", "gm financial", "ally financial", "carmax auto", "bmw financial", "mercedes financial", "nissan motor"] },
  { category: "Debt Payment", keywords: ["student loan", "personal loan", "sallie mae", "navient", "sofi loan", "earnest loan", "discover personal", "lending club", "prosper loan", "loan repayment"] },
  { category: "Credit Card Payment", keywords: ["credit card pmt", "credit card pay", "chase card", "amex payment", "american express pmt", "capital one pmt", "citi payment", "discover payment", "boa credit", "wells fargo card", "barclays", "synchrony"] },
  { category: "Transfers & Payments", keywords: ["zelle", "transfer", "venmo", "cash app", "paypal transfer", "ach transfer", "wire transfer", "online payment", "online transfer"] },
  { category: "Car Wash", keywords: ["car wash", "wash express", "wash club"] },
  { category: "Gas Station Snacks", keywords: ["7-eleven", "circle k", "wawa snack", "quick mart", "quick trip", "quiktrip"] },
  { category: "Education", keywords: ["tuition", "university", "college", "school", "course", "udemy", "coursera", "textbook", "chegg"] },
  { category: "Government & Taxes", keywords: ["irs", "tax", "dmv", "bureau of motor", "usps", "city of", "county", "state of", "department of taxation"] },
  { category: "Payroll", keywords: ["payroll", "salary", "direct deposit", "employer", "wages"] },
  { category: "Deposits", keywords: ["deposit", "check deposit", "cash deposit", "remote deposit"] },
  { category: "Medical", keywords: ["pharmacy", "walgreens", "cvs", "doctor", "hospital", "dental", "vision", "clinic", "urgent care", "optometrist", "dermatology", "pediatrician", "vet"] },
  { category: "Personal Care", keywords: ["sephora", "ulta", "salon", "spa", "barber", "nail", "cosmetics", "skincare", "hair care", "personal care"] },
  { category: "Travel", keywords: ["airbnb", "uber", "lyft", "hotel", "airline", "delta", "united", "southwest", "american airlines", "booking.com", "expedia", "rental car", "hertz", "enterprise"] },
  { category: "Pet Supplies", keywords: ["petco", "petsmart", "chewy", "veterinary", "pet supplies", "pet food"] },
  { category: "Charity & Donations", keywords: ["gofundme", "paypal giving", "charity", "donation", "church", "nonprofit", "tithe"] },
  { category: "Bars & Alcohol", keywords: ["liquor", "brewery", "winery", "bar tab", "total wine", "bevmo"] },
  { category: "Baby & Kids", keywords: ["buy buy baby", "carter's", "carters", "daycare", "kids", "baby", "toys r us", "childcare"] },
  { category: "Clothing", keywords: ["clothing", "apparel", "shoe", "shoes", "nike", "adidas", "old navy", "gap", "h&m", "zara", "macy", "nordstrom", "tjmaxx", "marshall"] },
  { category: "Home & Garden", keywords: ["home depot", "lowe's", "lowes", "ikea", "bed bath", "wayfair", "hardware", "garden center", "ace hardware"] },
];

const LEARNED_CATEGORIES_STORAGE_KEY = "finance-dashboard-learned-categories";
const CUSTOM_CATEGORIES_STORAGE_KEY = "finance-dashboard-custom-categories";
const TRANSACTIONS_STORAGE_KEY = "finance-dashboard-transactions";
const BUDGETS_STORAGE_KEY = "finance-dashboard-budgets";
const DEFAULT_CATEGORY_OPTIONS = Array.from(new Set([...CATEGORY_RULES.map((rule) => rule.category), "Other"]));

function deserializeTransactions(raw) {
  return raw.map((t) => ({
    ...t,
    date: new Date(t.date),
    account: t.account || "Primary",
    note: t.note || "",
  }));
}

function normalizeAccountName(name) {
  const trimmed = String(name || "").trim();
  return trimmed || "Primary";
}

function getTransactionFingerprint(transaction) {
  let dateKey = "";
  if (transaction?.date) {
    const parsed = transaction.date instanceof Date ? transaction.date : new Date(transaction.date);
    const ms = parsed.getTime();
    if (!Number.isNaN(ms)) dateKey = parsed.toISOString().slice(0, 10);
  }
  return [
    dateKey,
    String(transaction.description || "").trim().toLowerCase(),
    Number(transaction.amount || 0).toFixed(2),
    normalizeAccountName(transaction.account).toLowerCase(),
  ].join("|");
}

function mergeTransactions(existing, incoming) {
  const seen = new Set(existing.map(getTransactionFingerprint));
  const merged = [...existing];
  incoming.forEach((t) => {
    const key = getTransactionFingerprint(t);
    if (!seen.has(key)) {
      merged.push(t);
      seen.add(key);
    }
  });
  return merged.sort((a, b) => a.date - b.date);
}

function average(values) {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function stdDev(values) {
  if (values.length < 2) return 0;
  const mean = average(values);
  const variance = values.reduce((sum, value) => sum + Math.pow(value - mean, 2), 0) / values.length;
  return Math.sqrt(variance);
}

function daysBetween(a, b) {
  const dateA = a instanceof Date ? a : new Date(a);
  const dateB = b instanceof Date ? b : new Date(b);
  const msA = dateA.getTime();
  const msB = dateB.getTime();
  if (Number.isNaN(msA) || Number.isNaN(msB)) return NaN;
  return Math.abs((msA - msB) / (1000 * 60 * 60 * 24));
}

function normalizeTransactionKey(description) {
  return String(description || "")
    .split(/\s{2,}/)[0]
    .replace(/[0-9#*]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase()
    .substring(0, 60);
}

function categorize(description, learnedCategories = {}, customRules = []) {
  const learnedCategory = learnedCategories[normalizeTransactionKey(description)];
  if (learnedCategory) return learnedCategory;

  const lower = description.toLowerCase();
  // User-defined rules take priority over defaults
  for (const rule of customRules) {
    for (const kw of rule.keywords) {
      if (kw && lower.includes(kw.toLowerCase())) return rule.name;
    }
  }
  for (const rule of CATEGORY_RULES) {
    for (const kw of rule.keywords) {
      if (lower.includes(kw)) return rule.category;
    }
  }
  return "Other";
}

function normalizeHeader(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function parseAmount(value) {
  if (typeof value === "number") return value;

  const raw = String(value || "").trim();
  if (!raw) return NaN;

  const negative = raw.startsWith("(") && raw.endsWith(")");
  const cleaned = raw.replace(/[$,\s()]/g, "");
  const amount = parseFloat(cleaned);

  if (Number.isNaN(amount)) return NaN;
  return negative ? -amount : amount;
}

function normalizeTransactionAmount(amount, details, type) {
  if (Number.isNaN(amount)) return amount;

  const detailsKey = String(details || "").trim().toLowerCase();
  const typeKey = String(type || "").trim().toLowerCase();

  const isDebit =
    detailsKey === "debit" ||
    typeKey.includes("debit") ||
    typeKey.includes("withdrawal") ||
    typeKey.includes("purchase");

  const isCredit =
    detailsKey === "credit" ||
    typeKey.includes("credit") ||
    typeKey.includes("deposit") ||
    typeKey.includes("payment");

  if (isDebit) return -Math.abs(amount);
  if (isCredit) return Math.abs(amount);
  return amount;
}

function formatCurrency(value) {
  return `$${Math.abs(value).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function parseCSVRows(text) {
  const parsedRows = [];
  let currentRow = [];
  let currentCell = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const next = text[i + 1];

    if (ch === '"') {
      if (inQuotes && next === '"') {
        currentCell += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (ch === "," && !inQuotes) {
      currentRow.push(currentCell.trim());
      currentCell = "";
      continue;
    }

    if ((ch === "\n" || ch === "\r") && !inQuotes) {
      if (ch === "\r" && next === "\n") i++;
      currentRow.push(currentCell.trim());
      currentCell = "";
      if (currentRow.some((cell) => cell !== "")) parsedRows.push(currentRow);
      currentRow = [];
      continue;
    }

    currentCell += ch;
  }

  currentRow.push(currentCell.trim());
  if (currentRow.some((cell) => cell !== "")) parsedRows.push(currentRow);

  return parsedRows;
}

function parseCSV(text, learnedCategories = {}, customRules = [], accountName = "Primary") {
  const parsedRows = parseCSVRows(text);
  if (parsedRows.length < 2) {
    throw new Error("This CSV does not contain enough rows to import.");
  }

  const headers = parsedRows[0].map(normalizeHeader);
  const hasDateColumn = ["transaction date", "posting date", "post date", "date"].some((name) =>
    headers.includes(name)
  );
  const hasDescriptionColumn = ["description", "details"].some((name) =>
    headers.includes(name)
  );
  const hasAmountColumn = headers.includes("amount");

  if (!hasDateColumn || !hasDescriptionColumn || !hasAmountColumn) {
    throw new Error(
      "Unsupported CSV format. Required columns include a date, description, and amount field."
    );
  }

  const getValue = (parts, ...names) => {
    for (const name of names) {
      const index = headers.indexOf(normalizeHeader(name));
      if (index !== -1) return parts[index] ?? "";
    }
    return "";
  };

  const transactions = [];
  for (let i = 1; i < parsedRows.length; i++) {
    const parts = parsedRows[i];
    const description = getValue(parts, "Description", "Details");
    const category = getValue(parts, "Category");
    const memo = getValue(parts, "Memo");
    const details = getValue(parts, "Details");
    const type = getValue(parts, "Type");
    const amount = normalizeTransactionAmount(
      parseAmount(getValue(parts, "Amount")),
      details,
      type
    );
    const balance = parseAmount(getValue(parts, "Balance"));
    const date = new Date(
      getValue(parts, "Transaction Date", "Posting Date", "Post Date", "Date")
    );

    if (!description || Number.isNaN(amount) || Number.isNaN(date.getTime())) continue;

    transactions.push({
      details: details || getValue(parts, "Memo", "Description"),
      date,
      description,
      amount,
      type,
      balance: Number.isNaN(balance) ? 0 : balance,
      memo,
      account: normalizeAccountName(accountName),
      note: getValue(parts, "Note", "Notes"),
      category: category && category !== "Other"
        ? category
        : categorize(description, learnedCategories, customRules),
    });
  }

  if (transactions.length === 0) {
    throw new Error(
      "No valid transactions were found in this CSV. Check the date and amount columns, then try again."
    );
  }

  return transactions.sort((a, b) => a.date - b.date);
}

const COLORS = [
  "#e74c3c", "#3498db", "#2ecc71", "#f39c12", "#9b59b6",
  "#1abc9c", "#e67e22", "#34495e", "#e91e63", "#00bcd4",
  "#8bc34a", "#ff5722", "#607d8b", "#795548", "#cddc39", "#4dd0e1",
];

function MiniBar({ value, max, color }) {
  const pct = max > 0 ? (Math.abs(value) / max) * 100 : 0;
  return (
    <div style={{ width: "100%", height: 8, background: "rgba(255,255,255,0.06)", borderRadius: 4 }}>
      <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: 4, transition: "width 0.6s ease" }} />
    </div>
  );
}

function DonutChart({ data, size = 220 }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  if (total <= 0) {
    const cx = size / 2;
    const cy = size / 2;
    const radius = size * 0.38;
    const strokeWidth = size * 0.14;

    return (
      <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size}>
        <circle
          cx={cx}
          cy={cy}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth={strokeWidth}
        />
        <text x={cx} y={cy - 6} textAnchor="middle" fill="#f0ece4" fontSize="22" fontWeight="700" fontFamily="'DM Sans', sans-serif">
          $0
        </text>
        <text x={cx} y={cy + 14} textAnchor="middle" fill="#a09888" fontSize="10" fontFamily="'DM Sans', sans-serif">
          TOTAL SPENT
        </text>
      </svg>
    );
  }
  const cx = size / 2, cy = size / 2, r = size * 0.38, sw = size * 0.14;
  let cum = 0;
  const arcs = data.map((d, i) => {
    const frac = d.value / total;
    const startAngle = cum * 2 * Math.PI - Math.PI / 2;
    cum += frac;
    const endAngle = cum * 2 * Math.PI - Math.PI / 2;
    const large = frac > 0.5 ? 1 : 0;
    const x1 = cx + r * Math.cos(startAngle);
    const y1 = cy + r * Math.sin(startAngle);
    const x2 = cx + r * Math.cos(endAngle);
    const y2 = cy + r * Math.sin(endAngle);
    return (
      <path
        key={i}
        d={`M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`}
        fill="none"
        stroke={d.color}
        strokeWidth={sw}
        strokeLinecap="round"
        style={{ opacity: 0, animation: `fadeSlice 0.5s ease ${i * 0.08}s forwards` }}
      />
    );
  });
  return (
    <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size}>
      {arcs}
      <text x={cx} y={cy - 6} textAnchor="middle" fill="#f0ece4" fontSize="22" fontWeight="700" fontFamily="'DM Sans', sans-serif">
        ${total.toLocaleString(undefined, { maximumFractionDigits: 0 })}
      </text>
      <text x={cx} y={cy + 14} textAnchor="middle" fill="#a09888" fontSize="10" fontFamily="'DM Sans', sans-serif">
        TOTAL SPENT
      </text>
    </svg>
  );
}

function SparkLine({ points, width = 200, height = 50, color = "#2ecc71" }) {
  if (points.length < 2) return null;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;
  const coords = points.map((p, i) => ({
    x: (i / (points.length - 1)) * width,
    y: height - ((p - min) / range) * (height - 8) - 4,
  }));
  const pathD = coords.map((c, i) => `${i === 0 ? "M" : "L"} ${c.x} ${c.y}`).join(" ");
  const areaD = pathD + ` L ${width} ${height} L 0 ${height} Z`;
  return (
    <svg viewBox={`0 0 ${width} ${height}`} width="100%" height={height} preserveAspectRatio="none">
      <defs>
        <linearGradient id={`spark-${color.replace('#','')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaD} fill={`url(#spark-${color.replace('#','')})`} />
      <path d={pathD} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export default function FinanceDashboard() {
  const [transactions, setTransactions] = useState(() => {
    if (typeof window === "undefined") return [];
    try {
      const saved = window.localStorage.getItem(TRANSACTIONS_STORAGE_KEY);
      return saved ? deserializeTransactions(JSON.parse(saved)) : [];
    } catch { return []; }
  });
  const [persistError, setPersistError] = useState("");
  const [showRestoredBanner, setShowRestoredBanner] = useState(() =>
    typeof window !== "undefined" && !!window.localStorage.getItem(TRANSACTIONS_STORAGE_KEY)
  );
  const [importError, setImportError] = useState("");
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [sortCol, setSortCol] = useState("date");
  const [sortDir, setSortDir] = useState(-1);
  const [searchTerm, setSearchTerm] = useState("");
  const [startDateFilter, setStartDateFilter] = useState("");
  const [endDateFilter, setEndDateFilter] = useState("");
  const [selectedAccountFilter, setSelectedAccountFilter] = useState("all");
  const [expandedReportPeriod, setExpandedReportPeriod] = useState(null);
  const [showEmptyCategories, setShowEmptyCategories] = useState(false);
  const [pdfPreviewPeriod, setPdfPreviewPeriod] = useState(null);
  const [learnedCategories, setLearnedCategories] = useState(() => {
    if (typeof window === "undefined") return {};

    try {
      const saved = window.localStorage.getItem(LEARNED_CATEGORIES_STORAGE_KEY);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });
  const [customCategoryRules, setCustomCategoryRules] = useState(() => {
    if (typeof window === "undefined") return [];
    try {
      const saved = window.localStorage.getItem(CUSTOM_CATEGORIES_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryKeywords, setNewCategoryKeywords] = useState("");
  const [budgets, setBudgets] = useState(() => {
    if (typeof window === "undefined") return {};
    try {
      const saved = window.localStorage.getItem(BUDGETS_STORAGE_KEY);
      return saved ? JSON.parse(saved) : {};
    } catch { return {}; }
  });
  const [editingBudget, setEditingBudget] = useState(null);
  const [budgetInput, setBudgetInput] = useState("");
  const uploadInputRef = useRef(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(LEARNED_CATEGORIES_STORAGE_KEY, JSON.stringify(learnedCategories));
    } catch {}
  }, [learnedCategories]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (transactions.length === 0) return;
    try {
      window.localStorage.setItem(TRANSACTIONS_STORAGE_KEY, JSON.stringify(transactions));
      setPersistError("");
    } catch (e) {
      if (e instanceof DOMException && e.name === "QuotaExceededError") {
        setPersistError("Storage full — your browser's localStorage limit was reached. Data will not persist after refresh.");
      }
    }
  }, [transactions]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(CUSTOM_CATEGORIES_STORAGE_KEY, JSON.stringify(customCategoryRules));
    } catch {}
  }, [customCategoryRules]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(BUDGETS_STORAGE_KEY, JSON.stringify(budgets));
    } catch {}
  }, [budgets]);

  const handleFile = useCallback((file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const accountName = normalizeAccountName(window.prompt("Account name for this CSV import?", "Primary"));
        const parsed = parseCSV(e.target.result, learnedCategories, customCategoryRules, accountName);
        setTransactions((prev) => mergeTransactions(prev, parsed));
        setImportError("");
        setShowRestoredBanner(false);
        setActiveTab("overview");
      } catch (error) {
        setImportError(error instanceof Error ? error.message : "This CSV file could not be imported.");
      }
    };
    reader.onerror = () => {
      setImportError("The selected file could not be read. Please try again with a different CSV.");
    };
    reader.readAsText(file);
  }, [learnedCategories, customCategoryRules]);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    const file = e.dataTransfer?.files?.[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleClearData = useCallback(() => {
    setTransactions([]);
    setPersistError("");
    setShowRestoredBanner(false);
    try { window.localStorage.removeItem(TRANSACTIONS_STORAGE_KEY); } catch {}
  }, []);

  const handleCategoryAssign = useCallback((transaction, category) => {
    if (!category) return;

    const transactionKey = normalizeTransactionKey(transaction.description);

    setLearnedCategories((prev) => ({
      ...prev,
      [transactionKey]: category,
    }));

    setTransactions((prev) =>
      prev.map((item) =>
        normalizeTransactionKey(item.description) === transactionKey
          ? { ...item, category }
          : item
      )
    );
  }, []);

  const handleTransactionNoteChange = useCallback((transaction, note) => {
    const txKey = getTransactionFingerprint(transaction);
    setTransactions((prev) =>
      prev.map((item) =>
        getTransactionFingerprint(item) === txKey
          ? { ...item, note }
          : item
      )
    );
  }, []);

  const handleRuleCategoryChange = useCallback((ruleKey, category) => {
    if (!category) return;

    setLearnedCategories((prev) => ({
      ...prev,
      [ruleKey]: category,
    }));

    setTransactions((prev) =>
      prev.map((item) =>
        normalizeTransactionKey(item.description) === ruleKey
          ? { ...item, category }
          : item
      )
    );
  }, []);

  const handleRuleDelete = useCallback((ruleKey) => {
    setLearnedCategories((prev) => {
      const next = { ...prev };
      delete next[ruleKey];

      setTransactions((currentTransactions) =>
        currentTransactions.map((item) =>
          normalizeTransactionKey(item.description) === ruleKey
            ? { ...item, category: categorize(item.description, next) }
            : item
        )
      );

      return next;
    });
  }, []);

  const getTransactionsForPeriod = useCallback((period, periodType) => {
    return transactions.filter((t) => {
      if (periodType === "monthly") {
        const key = `${t.date.getFullYear()}-${String(t.date.getMonth() + 1).padStart(2, "0")}`;
        return key === period;
      } else if (periodType === "quarterly") {
        const monthIndex = t.date.getMonth();
        const quarter = Math.floor(monthIndex / 3) + 1;
        const key = `${t.date.getFullYear()}-Q${quarter}`;
        return key === period;
      } else if (periodType === "yearly") {
        return String(t.date.getFullYear()) === period;
      }
      return false;
    });
  }, [transactions]);

  const getSpendingForPeriod = useCallback((period, periodType) => {
    return getTransactionsForPeriod(period, periodType).filter((t) => t.amount < 0 && t.category !== "Transfers & Payments" && t.category !== "Payroll" && t.category !== "Deposits");
  }, [getTransactionsForPeriod]);

  const getIncomeForPeriod = useCallback((period, periodType) => {
    return getTransactionsForPeriod(period, periodType).filter((t) => t.amount > 0 && t.category !== "Transfers & Payments");
  }, [getTransactionsForPeriod]);

  const getCategoryBreakdownForPeriod = useCallback((period, periodType) => {
    const periodSpending = getSpendingForPeriod(period, periodType);
    const map = {};
    periodSpending.forEach((t) => {
      if (!map[t.category]) map[t.category] = 0;
      map[t.category] += Math.abs(t.amount);
    });
    return Object.entries(map)
      .map(([name, value], i) => ({ name, value: Math.round(value * 100) / 100, color: COLORS[i % COLORS.length] }))
      .sort((a, b) => b.value - a.value);
  }, [getSpendingForPeriod]);

  const buildPDFHTML = useCallback((label, periodType, row, income, spending, categories) => {
    const totalSpent = spending.reduce((s, t) => s + Math.abs(t.amount), 0);
    const maxCat = Math.max(...categories.map(c => c.value), 1);
    const generatedDate = new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
    const periodTypeLabel = periodType === "monthly" ? "Monthly Report" : periodType === "quarterly" ? "Quarterly Report" : "Yearly Report";

    const fmt = (v) => v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    const statsHTML = `
      <div class="stats-grid">
        <div class="stat-card"><div class="stat-label">Income</div><div class="stat-value income">$${fmt(row.income)}</div></div>
        <div class="stat-card"><div class="stat-label">Spent</div><div class="stat-value spent">$${fmt(row.spent)}</div></div>
        <div class="stat-card"><div class="stat-label">Net</div><div class="stat-value ${row.net >= 0 ? "net-pos" : "net-neg"}">${row.net >= 0 ? "+" : "-"}$${fmt(Math.abs(row.net))}</div></div>
        <div class="stat-card"><div class="stat-label">Transactions</div><div class="stat-value">${row.count}</div></div>
      </div>`;

    const incomeHTML = income.length > 0 ? `
      <div class="section-header">Income Sources (${income.length})</div>
      ${[...income].sort((a, b) => b.amount - a.amount).map(t => `
        <div class="income-row">
          <div><div class="income-desc">${t.description}</div><div class="income-date">${t.date.toLocaleDateString()}</div></div>
          <div class="income-amount">+$${t.amount.toFixed(2)}</div>
        </div>`).join("")}` : "";

    const categoriesHTML = categories.length > 0 ? `
      <div class="section-header">Spending by Category</div>
      ${categories.map(cat => `
        <div class="cat-row">
          <div class="cat-name">${cat.name}</div>
          <div class="bar-track"><div class="bar-fill" style="width:${((cat.value / maxCat) * 100).toFixed(1)}%;background:${cat.color}"></div></div>
          <div class="cat-amount">$${cat.value.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
          <div class="cat-pct">${totalSpent > 0 ? ((cat.value / totalSpent) * 100).toFixed(1) : "0.0"}%</div>
        </div>`).join("")}` : "";

    const transactionsHTML = spending.length > 0 ? `
      <div class="section-header">Transactions (${spending.length})</div>
      <table>
        <thead><tr><th>Date</th><th>Description</th><th>Category</th><th style="text-align:right">Amount</th></tr></thead>
        <tbody>
          ${[...spending].sort((a, b) => a.date - b.date).map(t => `
            <tr>
              <td class="td-date">${t.date.toLocaleDateString()}</td>
              <td class="td-desc">${t.description}</td>
              <td>${t.category}</td>
              <td class="td-amount">-$${Math.abs(t.amount).toFixed(2)}</td>
            </tr>`).join("")}
        </tbody>
      </table>` : "";

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Ledger – ${label}</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    @page{size:A4 portrait;margin:32px 40px}
    body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;color:#111;background:#fff;padding:48px;max-width:800px;margin:0 auto;font-size:13px;line-height:1.5}
    .header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:28px;padding-bottom:16px;border-bottom:2px solid #111}
    .brand{font-size:22px;font-weight:800;letter-spacing:-1px}
    .brand-sub{font-size:10px;color:#999;letter-spacing:.06em;margin-top:2px}
    .report-meta{text-align:right;font-size:11px;color:#999}
    .period-title{font-size:30px;font-weight:800;letter-spacing:-1px;margin-bottom:3px}
    .period-type{font-size:11px;color:#888;text-transform:uppercase;letter-spacing:.12em;margin-bottom:24px}
    .stats-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px}
    .stat-card{border:1px solid #e5e5e5;border-radius:8px;padding:14px 16px}
    .stat-label{font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.12em;color:#aaa;margin-bottom:6px}
    .stat-value{font-size:17px;font-weight:800}
    .income{color:#16a34a}.spent{color:#dc2626}.net-pos{color:#16a34a}.net-neg{color:#ea580c}
    .section-header{font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.14em;color:#aaa;border-bottom:1px solid #e8e8e8;padding-bottom:7px;margin-bottom:10px;margin-top:28px}
    .income-row{display:flex;justify-content:space-between;align-items:center;padding:7px 0;border-bottom:1px solid #f5f5f5}
    .income-row:last-child{border-bottom:none}
    .income-desc{font-weight:500;font-size:12px}
    .income-date{font-size:10px;color:#aaa;margin-top:1px}
    .income-amount{font-weight:700;color:#16a34a;font-size:13px}
    .cat-row{display:grid;grid-template-columns:160px 1fr 90px 55px;gap:12px;align-items:center;margin-bottom:8px}
    .cat-name{font-size:11px;font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .bar-track{background:#f0f0f0;border-radius:3px;height:6px}
    .bar-fill{height:6px;border-radius:3px}
    .cat-amount{text-align:right;font-weight:700;font-size:11px}
    .cat-pct{text-align:right;font-size:10px;color:#aaa}
    table{width:100%;border-collapse:collapse}
    thead th{font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:#aaa;padding:8px 10px;background:#f9f9f9;text-align:left;border-bottom:1px solid #e8e8e8}
    tbody td{padding:7px 10px;border-bottom:1px solid #f5f5f5;font-size:11px}
    .td-amount{text-align:right;font-weight:700;color:#dc2626}
    .td-date{color:#999;white-space:nowrap}
    .td-desc{max-width:240px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
    .footer{margin-top:36px;padding-top:12px;border-top:1px solid #e8e8e8;display:flex;justify-content:space-between;font-size:10px;color:#ccc}
    @media print{body{padding:0}}
  </style>
</head>
<body>
  <div class="header">
    <div><div class="brand">Ledger.</div><div class="brand-sub">Personal Finance Tracker</div></div>
    <div class="report-meta"><div>${periodTypeLabel}</div><div>Generated ${generatedDate}</div></div>
  </div>
  <div class="period-title">${label}</div>
  <div class="period-type">${periodTypeLabel}</div>
  ${statsHTML}${incomeHTML}${categoriesHTML}${transactionsHTML}
  <div class="footer"><span>Ledger · Personal Finance Tracker</span><span>Generated ${generatedDate}</span></div>
</body>
</html>`;
  }, []);

  const handlePrintPDF = useCallback((label, periodKey, periodType, row) => {
    const income = getIncomeForPeriod(periodKey, periodType);
    const spending = getSpendingForPeriod(periodKey, periodType);
    const categories = getCategoryBreakdownForPeriod(periodKey, periodType);
    const html = buildPDFHTML(label, periodType, row, income, spending, categories);
    const win = window.open("", "_blank", "width=920,height=720,scrollbars=yes");
    if (!win) return;
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 500);
  }, [buildPDFHTML, getIncomeForPeriod, getSpendingForPeriod, getCategoryBreakdownForPeriod]);

  const downloadTextReport = useCallback((reportText) => {
    if (typeof window === "undefined" || !reportText) return;

    const blob = new Blob([reportText], { type: "text/plain;charset=utf-8" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    const stamp = new Date().toISOString().slice(0, 10);

    link.href = url;
    link.download = `spending-report-${stamp}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }, []);

  // Computed data
  const spending = useMemo(() => transactions.filter((t) => t.amount < 0 && t.category !== "Transfers & Payments" && t.category !== "Payroll" && t.category !== "Deposits"), [transactions]);
  const income = useMemo(() => transactions.filter((t) => t.amount > 0 && (t.category === "Payroll" || t.category === "Deposits" || t.type === "ACH_CREDIT" || t.type === "CHECK_DEPOSIT" || t.type === "QUICKPAY_CREDIT" || t.type === "PARTNERFI_TO_CHASE")), [transactions]);
  const incomeTransactions = useMemo(() => transactions.filter((t) => t.amount > 0), [transactions]);
  const accountOptions = useMemo(
    () => ["all", ...Array.from(new Set(transactions.map((t) => t.account || "Primary"))).sort((a, b) => a.localeCompare(b))],
    [transactions]
  );

  // Single source of truth for all category names — same list that feeds every dropdown
  const allCategoryOptions = useMemo(() =>
    Array.from(new Set([
      ...DEFAULT_CATEGORY_OPTIONS.filter(o => o !== "Other"),
      ...customCategoryRules.map(r => r.name),
      "Other",
    ])).sort((a, b) => a === "Other" ? 1 : b === "Other" ? -1 : a.localeCompare(b)),
  [customCategoryRules]);

  const categoryTotals = useMemo(() => {
    // Build spending map from transactions
    const map = {};
    spending.forEach((t) => {
      if (!map[t.category]) map[t.category] = 0;
      map[t.category] += Math.abs(t.amount);
    });
    // Canonical list = allCategoryOptions + any organic categories from old data not yet in the list
    const organicExtras = Object.keys(map).filter(name => !allCategoryOptions.includes(name));
    const allNames = [...allCategoryOptions.filter(n => n !== "Other"), ...organicExtras, "Other"];
    // Assign stable colors by name position so a category always gets the same color
    return allNames
      .map((name, i) => ({ name, value: Math.round((map[name] || 0) * 100) / 100, color: COLORS[i % COLORS.length] }))
      .sort((a, b) => b.value - a.value);
  }, [spending, allCategoryOptions]);

  const maxCatValue = useMemo(() => Math.max(...categoryTotals.map((c) => c.value), 1), [categoryTotals]);

  const totalSpent = useMemo(() => spending.reduce((s, t) => s + Math.abs(t.amount), 0), [spending]);
  const totalIncome = useMemo(() => income.reduce((s, t) => s + t.amount, 0), [income]);

  const monthlyData = useMemo(() => {
    const map = {};
    spending.forEach((t) => {
      const key = `${t.date.getFullYear()}-${String(t.date.getMonth() + 1).padStart(2, "0")}`;
      if (!map[key]) map[key] = { spent: 0, income: 0, label: `${MONTHS[t.date.getMonth()]} ${t.date.getFullYear()}` };
      map[key].spent += Math.abs(t.amount);
    });
    income.forEach((t) => {
      const key = `${t.date.getFullYear()}-${String(t.date.getMonth() + 1).padStart(2, "0")}`;
      if (!map[key]) map[key] = { spent: 0, income: 0, label: `${MONTHS[t.date.getMonth()]} ${t.date.getFullYear()}` };
      map[key].income += t.amount;
    });
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b)).map(([, v]) => v);
  }, [spending, income]);

  const balanceHistory = useMemo(() => transactions
    .map((t) => t.balance)
    .filter((value) => value !== null && value !== undefined && !Number.isNaN(value)), [transactions]);

  const avgMonthlyCategorySpend = useMemo(() => {
    const numMonths = monthlyData.length || 1;
    const result = {};
    categoryTotals.forEach((cat) => { result[cat.name] = cat.value / numMonths; });
    return result;
  }, [categoryTotals, monthlyData]);

  const topMerchants = useMemo(() => {
    const map = {};
    spending.forEach((t) => {
      const name = String(t.description || "")
        .split(/\s{2,}/)[0]
        .replace(/[0-9#*]+/g, "")
        .trim()
        .substring(0, 30);
      if (!name) return;
      if (!map[name]) map[name] = { total: 0, count: 0 };
      map[name].total += Math.abs(t.amount);
      map[name].count++;
    });
    return Object.entries(map).map(([name, d]) => ({ name, ...d })).sort((a, b) => b.total - a.total).slice(0, 10);
  }, [spending]);

  const recurringCharges = useMemo(() => {
    const map = {};
    transactions.forEach((t) => {
      if (t.amount >= 0) return;
      const safeDescription = String(t.description || "").trim();
      if (!safeDescription) return;
      const name = safeDescription.split(/\s{2,}/)[0].replace(/[0-9#*]+/g, "").trim().substring(0, 30);
      if (!name) return;
      if (!map[name]) map[name] = [];
      map[name].push({ amount: Math.abs(t.amount), date: t.date });
    });
    return Object.entries(map)
      .filter(([, arr]) => arr.length >= 3)
      .map(([name, arr]) => {
        const sorted = [...arr].sort((a, b) => a.date - b.date);
        const amounts = sorted.map((a) => a.amount);
        const avgAmount = average(amounts);
        const amountStd = stdDev(amounts);
        const amountCv = avgAmount > 0 ? amountStd / avgAmount : 1;

        const intervals = [];
        for (let i = 1; i < sorted.length; i++) {
          const intervalDays = daysBetween(sorted[i].date, sorted[i - 1].date);
          if (!Number.isNaN(intervalDays)) intervals.push(intervalDays);
        }
        if (!intervals.length) return null;
        const avgInterval = average(intervals);
        const intervalStd = stdDev(intervals);
        const intervalCv = avgInterval > 0 ? intervalStd / avgInterval : 1;

        const isMonthly = avgInterval >= 25 && avgInterval <= 35;
        const isBiweekly = avgInterval >= 12 && avgInterval <= 17;
        const cadence = isMonthly ? "Monthly" : isBiweekly ? "Biweekly" : "Irregular";

        const amountConfidence = Math.max(0, Math.min(1, 1 - amountCv * 1.6));
        const intervalConfidence = Math.max(0, Math.min(1, 1 - intervalCv * 1.8));
        const cadenceBonus = cadence === "Irregular" ? 0 : 0.15;
        const confidence = Math.max(0, Math.min(1, amountConfidence * 0.45 + intervalConfidence * 0.55 + cadenceBonus));

        const monthlyEquivalent = cadence === "Biweekly"
          ? avgAmount * (26 / 12)
          : avgAmount;

        return {
          name,
          count: sorted.length,
          avg: Math.round(avgAmount * 100) / 100,
          total: Math.round(amounts.reduce((s, a) => s + a, 0) * 100) / 100,
          cadence,
          confidence,
          monthlyEquivalent: Math.round(monthlyEquivalent * 100) / 100,
        };
      })
      .filter(Boolean)
      .filter((r) => r.cadence !== "Irregular" && r.confidence >= 0.55)
      .sort((a, b) => b.monthlyEquivalent - a.monthlyEquivalent);
  }, [transactions]);

  const budgetForecastRows = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const elapsedDays = Math.min(daysInMonth, now.getDate());

    const monthSpendingByCategory = {};
    spending.forEach((t) => {
      if (!(t.date instanceof Date) || Number.isNaN(t.date.getTime())) return;
      if (t.date.getMonth() !== currentMonth || t.date.getFullYear() !== currentYear) return;
      monthSpendingByCategory[t.category] = (monthSpendingByCategory[t.category] || 0) + Math.abs(t.amount);
    });

    const rows = Object.entries(budgets)
      .map(([category, budget]) => {
        const spentSoFar = monthSpendingByCategory[category] || 0;
        const pacePerDay = elapsedDays > 0 ? spentSoFar / elapsedDays : 0;
        const projected = pacePerDay * daysInMonth;
        const usedPct = budget > 0 ? (spentSoFar / budget) * 100 : 0;
        const projectedPct = budget > 0 ? (projected / budget) * 100 : 0;
        const status = projectedPct >= 110 ? "Likely Over" : projectedPct >= 95 ? "At Risk" : "On Track";
        const statusColor = status === "Likely Over" ? "#e74c3c" : status === "At Risk" ? "#f39c12" : "#2ecc71";
        return {
          category,
          budget,
          spentSoFar,
          projected,
          remaining: budget - spentSoFar,
          usedPct,
          projectedPct,
          status,
          statusColor,
        };
      })
      .sort((a, b) => b.projectedPct - a.projectedPct);

    return {
      rows,
      atRisk: rows.filter((r) => r.status !== "On Track"),
      totalBudget: rows.reduce((s, r) => s + r.budget, 0),
      totalProjected: rows.reduce((s, r) => s + r.projected, 0),
      elapsedDays,
      daysInMonth,
    };
  }, [budgets, spending]);

  const handleAddCustomCategory = useCallback(() => {
    const name = newCategoryName.trim();
    if (!name) return;
    const keywords = newCategoryKeywords.split(",").map(k => k.trim().toLowerCase()).filter(Boolean);
    setCustomCategoryRules(prev => {
      if (prev.some(r => r.name.toLowerCase() === name.toLowerCase())) return prev;
      return [...prev, { name, keywords }];
    });
    setNewCategoryName("");
    setNewCategoryKeywords("");
  }, [newCategoryName, newCategoryKeywords]);

  const handleDeleteCustomCategory = useCallback((name) => {
    setCustomCategoryRules(prev => prev.filter(r => r.name !== name));
  }, []);

  const learnedRules = useMemo(() => Object.entries(learnedCategories)
    .map(([merchantKey, category]) => ({ merchantKey, category }))
    .sort((a, b) => a.merchantKey.localeCompare(b.merchantKey)), [learnedCategories]);

  const monthlyReports = useMemo(() => {
    const map = {};

    transactions.forEach((transaction) => {
      const key = `${transaction.date.getFullYear()}-${String(transaction.date.getMonth() + 1).padStart(2, "0")}`;
      if (!map[key]) {
        map[key] = {
          label: `${MONTHS[transaction.date.getMonth()]} ${transaction.date.getFullYear()}`,
          spent: 0,
          income: 0,
          count: 0,
        };
      }

      if (transaction.amount < 0 && transaction.category !== "Transfers & Payments") {
        map[key].spent += Math.abs(transaction.amount);
      }

      if (transaction.amount > 0) {
        map[key].income += transaction.amount;
      }

      map[key].count += 1;
    });

    return Object.entries(map)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([, value]) => ({
        ...value,
        net: value.income - value.spent,
      }));
  }, [transactions]);

  const quarterlyReports = useMemo(() => {
    const map = {};

    monthlyReports.forEach((month) => {
      const [monthName, year] = month.label.split(" ");
      const monthIndex = MONTHS.indexOf(monthName);
      const quarter = Math.floor(monthIndex / 3) + 1;
      const key = `${year}-Q${quarter}`;

      if (!map[key]) {
        map[key] = {
          label: `Q${quarter} ${year}`,
          spent: 0,
          income: 0,
          count: 0,
        };
      }

      map[key].spent += month.spent;
      map[key].income += month.income;
      map[key].count += month.count;
    });

    return Object.entries(map)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([, value]) => ({
        ...value,
        net: value.income - value.spent,
      }));
  }, [monthlyReports]);

  const yearlyReports = useMemo(() => {
    const map = {};

    monthlyReports.forEach((month) => {
      const year = month.label.split(" ")[1];
      if (!map[year]) {
        map[year] = {
          label: year,
          spent: 0,
          income: 0,
          count: 0,
        };
      }

      map[year].spent += month.spent;
      map[year].income += month.income;
      map[year].count += month.count;
    });

    return Object.entries(map)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([, value]) => ({
        ...value,
        net: value.income - value.spent,
      }));
  }, [monthlyReports]);

  const reportText = useMemo(() => {
    if (!transactions.length) return "";

    const buildSection = (title, rows) => {
      const lines = [title];

      if (!rows.length) {
        lines.push("No data");
        return lines.join("\n");
      }

      rows.forEach((row) => {
        lines.push(
          `${row.label}: income ${formatCurrency(row.income)}, spent ${formatCurrency(row.spent)}, net ${row.net >= 0 ? "" : "-"}${formatCurrency(row.net)}, transactions ${row.count}`
        );
      });

      return lines.join("\n");
    };

    return [
      "Finance Dashboard Report",
      `Generated: ${new Date().toLocaleString()}`,
      "",
      buildSection("Monthly Summary", monthlyReports),
      "",
      buildSection("Quarterly Summary", quarterlyReports),
      "",
      buildSection("Yearly Summary", yearlyReports),
    ].join("\n");
  }, [monthlyReports, quarterlyReports, yearlyReports, transactions]);

  const filteredTransactions = useMemo(() => {
    const baseList = activeTab === "income"
      ? [...incomeTransactions]
      : selectedCategory
        ? spending.filter((t) => t.category === selectedCategory)
        : [...spending];

    let list = baseList;
    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      list = list.filter((t) =>
        t.description.toLowerCase().includes(lower) ||
        t.category.toLowerCase().includes(lower) ||
        String(t.account || "").toLowerCase().includes(lower) ||
        String(t.note || "").toLowerCase().includes(lower)
      );
    }
    if (selectedAccountFilter !== "all") {
      list = list.filter((t) => (t.account || "Primary") === selectedAccountFilter);
    }
    if (startDateFilter) {
      const start = new Date(`${startDateFilter}T00:00:00`);
      list = list.filter((t) => t.date >= start);
    }
    if (endDateFilter) {
      const end = new Date(`${endDateFilter}T23:59:59`);
      list = list.filter((t) => t.date <= end);
    }
    return list.sort((a, b) => {
      if (sortCol === "date") return sortDir * (a.date - b.date);
      if (sortCol === "amount") return sortDir * (a.amount - b.amount);
      if (sortCol === "desc") return sortDir * a.description.localeCompare(b.description);
      if (sortCol === "category") return sortDir * a.category.localeCompare(b.category);
      if (sortCol === "account") return sortDir * String(a.account || "").localeCompare(String(b.account || ""));
      if (sortCol === "note") return sortDir * String(a.note || "").localeCompare(String(b.note || ""));
      return 0;
    });
  }, [activeTab, incomeTransactions, spending, selectedCategory, searchTerm, selectedAccountFilter, startDateFilter, endDateFilter, sortCol, sortDir]);

  const exportTransactionsToCSV = useCallback((rows) => {
    if (!rows.length || typeof window === "undefined") return;
    const escapeCell = (value) => `"${String(value ?? "").replace(/"/g, '""')}"`;
    const header = ["Date", "Description", "Category", "Account", "Note", "Amount"];
    const lines = rows.map((t) => [
      t.date.toISOString().slice(0, 10),
      t.description,
      t.category,
      t.account || "Primary",
      t.note || "",
      t.amount.toFixed(2),
    ]);
    const csv = [header, ...lines].map((row) => row.map(escapeCell).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `ledger-transactions-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }, []);

  const applyDateRangePreset = useCallback((days) => {
    if (!days) {
      setStartDateFilter("");
      setEndDateFilter("");
      return;
    }
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - days);
    const fmt = (d) => d.toISOString().slice(0, 10);
    setStartDateFilter(fmt(start));
    setEndDateFilter(fmt(end));
  }, []);

  const monthlyCategoryTrend = useMemo(() => {
    const byMonth = {};
    spending.forEach((t) => {
      const key = `${t.date.getFullYear()}-${String(t.date.getMonth() + 1).padStart(2, "0")}`;
      if (!byMonth[key]) byMonth[key] = {};
      byMonth[key][t.category] = (byMonth[key][t.category] || 0) + Math.abs(t.amount);
    });
    const months = Object.keys(byMonth).sort();
    const topCategories = categoryTotals.slice(0, 4).map((c) => c.name);
    return months.map((monthKey) => {
      const [year, month] = monthKey.split("-");
      const label = `${MONTHS[Number(month) - 1]} ${year}`;
      const values = {};
      topCategories.forEach((name) => { values[name] = byMonth[monthKey]?.[name] || 0; });
      return { key: monthKey, label, values };
    });
  }, [spending, categoryTotals]);

  const avgMonthlySpend = monthlyData.length > 0 ? totalSpent / monthlyData.length : 0;
  const savingsRate = totalIncome > 0 ? ((totalIncome - totalSpent) / totalIncome) * 100 : 0;
  const monthlyMax = useMemo(() => Math.max(...monthlyData.map((d) => Math.max(d.spent, d.income)), 1), [monthlyData]);

  const hasData = transactions.length > 0;

  const tabStyle = (tab) => ({
    padding: "8px 20px",
    border: "none",
    background: activeTab === tab ? "rgba(255,255,255,0.1)" : "transparent",
    color: activeTab === tab ? "#f0ece4" : "#786e60",
    cursor: "pointer",
    fontSize: 13,
    fontWeight: 600,
    borderRadius: 8,
    fontFamily: "'DM Sans', sans-serif",
    letterSpacing: "0.02em",
    transition: "all 0.2s",
  });

  const cardStyle = {
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: 16,
    padding: 24,
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "#0f0e0c",
      color: "#f0ece4",
      fontFamily: "'DM Sans', sans-serif",
      position: "relative",
      overflow: "hidden",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Playfair+Display:wght@700&display=swap');
        @keyframes fadeSlice { from { opacity: 0; } to { opacity: 1; } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulse { 0%, 100% { opacity: 0.4; } 50% { opacity: 0.8; } }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 3px; }
        input::placeholder { color: #665e52; }
      `}</style>

      {/* Ambient glow */}
      <div style={{ position: "fixed", top: -200, right: -200, width: 600, height: 600, background: "radial-gradient(circle, rgba(231,76,60,0.04) 0%, transparent 70%)", pointerEvents: "none" }} />
      <div style={{ position: "fixed", bottom: -300, left: -100, width: 500, height: 500, background: "radial-gradient(circle, rgba(52,152,219,0.03) 0%, transparent 70%)", pointerEvents: "none" }} />

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 24px" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 32, flexWrap: "wrap", gap: 16 }}>
          <div>
            <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, fontWeight: 700, letterSpacing: "-0.02em", marginBottom: 4 }}>
              Ledger<span style={{ color: "#e74c3c" }}>.</span>
            </h1>
            <p style={{ color: "#786e60", fontSize: 13 }}>Personal finance clarity</p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            {hasData && (
              <>
                <label style={{
                  padding: "8px 20px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 10, cursor: "pointer", fontSize: 13, color: "#a09888", fontWeight: 500,
                }}>
                  Upload new CSV
                  <input type="file" accept=".csv" style={{ display: "none" }} onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
                </label>
                <button
                  onClick={() => { if (window.confirm("Clear all transaction data? This cannot be undone.")) handleClearData(); }}
                  style={{ padding: "8px 16px", background: "rgba(231,76,60,0.08)", border: "1px solid rgba(231,76,60,0.18)", borderRadius: 10, cursor: "pointer", fontSize: 13, color: "#e74c3c", fontWeight: 500, fontFamily: "'DM Sans', sans-serif" }}
                >
                  Clear data
                </button>
              </>
            )}
          </div>
        </div>

        {persistError && (
          <div style={{ ...cardStyle, marginBottom: 16, padding: "12px 16px", border: "1px solid rgba(243,156,18,0.28)", background: "rgba(243,156,18,0.06)" }}>
            <p style={{ color: "#f39c12", fontSize: 12 }}>{persistError}</p>
          </div>
        )}

        {showRestoredBanner && (
          <div style={{ ...cardStyle, marginBottom: 16, padding: "12px 18px", border: "1px solid rgba(46,204,113,0.2)", background: "rgba(46,204,113,0.05)", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
            <p style={{ color: "#2ecc71", fontSize: 12 }}>
              ✓ Your data was restored from your last session — {transactions.length} transactions loaded.
            </p>
            <button
              onClick={() => setShowRestoredBanner(false)}
              style={{ background: "none", border: "none", color: "#504840", fontSize: 16, cursor: "pointer", lineHeight: 1, padding: "0 4px", fontFamily: "'DM Sans', sans-serif" }}
            >
              ×
            </button>
          </div>
        )}

        {importError && (
          <div
            style={{
              ...cardStyle,
              marginBottom: 16,
              padding: "14px 18px",
              border: "1px solid rgba(231,76,60,0.28)",
              background: "rgba(231,76,60,0.08)",
            }}
          >
            <p style={{ color: "#ffb3a8", fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
              CSV import failed
            </p>
            <p style={{ color: "#f0cec8", fontSize: 12, lineHeight: 1.6 }}>
              {importError}
            </p>
          </div>
        )}

        {!hasData ? (
          /* Upload Screen */
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            style={{
              border: "2px dashed rgba(255,255,255,0.08)", borderRadius: 24, padding: "80px 40px",
              textAlign: "center", animation: "fadeUp 0.6s ease", cursor: "pointer",
              background: "rgba(255,255,255,0.01)", transition: "border-color 0.3s",
            }}
            onMouseEnter={(e) => e.currentTarget.style.borderColor = "rgba(231,76,60,0.3)"}
            onMouseLeave={(e) => e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"}
            onClick={() => uploadInputRef.current?.click()}
          >
            <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.3 }}>&uarr;</div>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 24, marginBottom: 12 }}>
              Drop your bank CSV here
            </h2>
            <p style={{ color: "#786e60", fontSize: 14, maxWidth: 400, margin: "0 auto", lineHeight: 1.7 }}>
              Your data stays in your browser. Nothing is uploaded to any server. Drag and drop or click to browse.
            </p>
            <input ref={uploadInputRef} id="csv-input" type="file" accept=".csv" style={{ display: "none" }} onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
          </div>
        ) : (
          <>
            {/* Tabs */}
            <div style={{ display: "flex", gap: 4, marginBottom: 28, background: "rgba(255,255,255,0.02)", borderRadius: 12, padding: 4, width: "fit-content" }}>
              {["overview", "categories", "transactions", "income", "reports", "rules", "budgets", "insights"].map((tab) => (
                <button key={tab} style={tabStyle(tab)} onClick={() => { setActiveTab(tab); setSelectedCategory(null); }}>
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>

            {activeTab === "overview" && (
              <div style={{ animation: "fadeUp 0.4s ease" }}>
                {/* Stats Row */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 28 }}>
                  {[
                    { label: "Total Spent", value: `$${totalSpent.toLocaleString(undefined, { maximumFractionDigits: 0 })}`, sub: `${spending.length} transactions`, color: "#e74c3c" },
                    { label: "Total Income", value: `$${totalIncome.toLocaleString(undefined, { maximumFractionDigits: 0 })}`, sub: `${income.length} deposits`, color: "#2ecc71" },
                    { label: "Avg Monthly", value: `$${avgMonthlySpend.toLocaleString(undefined, { maximumFractionDigits: 0 })}`, sub: `over ${monthlyData.length} months`, color: "#3498db" },
                    { label: "Savings Rate", value: `${savingsRate.toFixed(1)}%`, sub: savingsRate > 0 ? "positive" : "negative", color: savingsRate > 0 ? "#2ecc71" : "#e74c3c" },
                  ].map((stat, i) => (
                    <div key={i} style={{ ...cardStyle, animation: `fadeUp 0.4s ease ${i * 0.08}s both` }}>
                      <p style={{ color: "#786e60", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>{stat.label}</p>
                      <p style={{ fontSize: 26, fontWeight: 700, color: stat.color, fontFamily: "'DM Sans', sans-serif" }}>{stat.value}</p>
                      <p style={{ color: "#665e52", fontSize: 12, marginTop: 4 }}>{stat.sub}</p>
                    </div>
                  ))}
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  {/* Donut */}
                  <div style={{ ...cardStyle, display: "flex", flexDirection: "column", alignItems: "center" }}>
                    <p style={{ color: "#786e60", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 16, alignSelf: "flex-start" }}>Spending by Category</p>
                    <DonutChart data={categoryTotals.slice(0, 10)} />
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 16, justifyContent: "center" }}>
                      {categoryTotals.slice(0, 8).map((c) => (
                        <div key={c.name} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "#a09888" }}>
                          <div style={{ width: 8, height: 8, borderRadius: "50%", background: c.color }} />
                          {c.name}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Balance Trend */}
                  <div style={cardStyle}>
                    <p style={{ color: "#786e60", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 16 }}>Balance Over Time</p>
                    <SparkLine points={balanceHistory} height={140} color="#3498db" />
                    <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, fontSize: 11, color: "#665e52" }}>
                      <span>{transactions[0]?.date.toLocaleDateString()}</span>
                      <span>{transactions[transactions.length - 1]?.date.toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                {/* Monthly Bar Chart */}
                <div style={{ ...cardStyle, marginTop: 16 }}>
                  <p style={{ color: "#786e60", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 16 }}>Monthly Spending vs Income</p>
                  <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 160 }}>
                    {monthlyData.map((m, i) => {
                      return (
                        <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
                          <div style={{ display: "flex", gap: 2, alignItems: "flex-end", height: 120 }}>
                            <div style={{ width: 14, height: `${(m.income / monthlyMax) * 100}%`, background: "#2ecc71", borderRadius: "3px 3px 0 0", opacity: 0.7, transition: "height 0.6s ease" }} title={`Income: $${m.income.toFixed(0)}`} />
                            <div style={{ width: 14, height: `${(m.spent / monthlyMax) * 100}%`, background: "#e74c3c", borderRadius: "3px 3px 0 0", opacity: 0.7, transition: "height 0.6s ease" }} title={`Spent: $${m.spent.toFixed(0)}`} />
                          </div>
                          <span style={{ fontSize: 9, color: "#665e52", writingMode: "vertical-rl", transform: "rotate(180deg)", height: 36 }}>{m.label}</span>
                        </div>
                      );
                    })}
                  </div>
                  <div style={{ display: "flex", gap: 16, marginTop: 12, justifyContent: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "#a09888" }}>
                      <div style={{ width: 10, height: 10, borderRadius: 2, background: "#2ecc71", opacity: 0.7 }} /> Income
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "#a09888" }}>
                      <div style={{ width: 10, height: 10, borderRadius: 2, background: "#e74c3c", opacity: 0.7 }} /> Spending
                    </div>
                  </div>
                </div>

                <div style={{ ...cardStyle, marginTop: 16 }}>
                  <p style={{ color: "#786e60", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12 }}>
                    Top Budget Risks
                  </p>
                  {budgetForecastRows.rows.length === 0 ? (
                    <p style={{ color: "#a09888", fontSize: 13 }}>
                      No budgets set yet. Add monthly limits in Categories to see risk forecasting.
                    </p>
                  ) : budgetForecastRows.atRisk.length === 0 ? (
                    <p style={{ color: "#2ecc71", fontSize: 13 }}>
                      All budgeted categories are currently on track.
                    </p>
                  ) : (
                    <div style={{ display: "grid", gap: 8 }}>
                      {budgetForecastRows.atRisk.slice(0, 3).map((risk) => (
                        <div key={risk.category} style={{ display: "grid", gridTemplateColumns: "minmax(120px, 1fr) 140px 140px 100px", gap: 12, alignItems: "center", padding: "10px 12px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)", borderRadius: 10 }}>
                          <span style={{ fontSize: 13, fontWeight: 600 }}>{risk.category}</span>
                          <span style={{ fontSize: 12, color: "#a09888" }}>
                            ${risk.spentSoFar.toFixed(0)} / ${risk.budget.toFixed(0)}
                          </span>
                          <span style={{ fontSize: 12, color: "#a09888" }}>
                            Projected ${risk.projected.toFixed(0)}
                          </span>
                          <span style={{ fontSize: 11, color: risk.statusColor, fontWeight: 700, textAlign: "right" }}>
                            {risk.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === "categories" && (
              <div style={{ animation: "fadeUp 0.4s ease" }}>
                <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 10 }}>
                  <button
                    onClick={() => setShowEmptyCategories(v => !v)}
                    style={{ background: "none", border: "none", color: "#665e52", fontSize: 12, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", padding: "4px 0" }}
                  >
                    {showEmptyCategories ? "Hide empty categories" : `Show all (${categoryTotals.filter(c => c.value === 0).length} empty)`}
                  </button>
                </div>
                <div style={{ display: "grid", gap: 8 }}>
                  {categoryTotals
                    .filter(cat => showEmptyCategories || cat.value > 0)
                    .map((cat, i) => {
                      const isEmpty = cat.value === 0;
                      const budget = budgets[cat.name];
                      const monthlyAvg = avgMonthlyCategorySpend[cat.name] || 0;
                      const budgetPct = budget ? Math.min((monthlyAvg / budget) * 100, 999) : 0;
                      const budgetColor = budgetPct >= 100 ? "#e74c3c" : budgetPct >= 80 ? "#f39c12" : "#2ecc71";
                      const isEditingThisBudget = editingBudget === cat.name;

                      return (
                        <div
                          key={cat.name}
                          style={{
                            ...cardStyle, padding: "16px 20px",
                            cursor: isEmpty ? "default" : "pointer",
                            display: "grid",
                            gridTemplateColumns: "minmax(160px, 200px) 1fr 100px 56px minmax(160px, 200px)",
                            alignItems: "center", gap: 16,
                            animation: `fadeUp 0.3s ease ${i * 0.04}s both`,
                            border: selectedCategory === cat.name ? `1px solid ${cat.color}44` : cardStyle.border,
                            opacity: isEmpty ? 0.35 : 1,
                          }}
                          onClick={() => { if (!isEmpty && !isEditingThisBudget) { setSelectedCategory(cat.name); setActiveTab("transactions"); } }}
                        >
                          {/* Name */}
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <div style={{ width: 10, height: 10, borderRadius: "50%", background: isEmpty ? "#504840" : cat.color, flexShrink: 0 }} />
                            <span style={{ fontSize: 14, fontWeight: 600, color: isEmpty ? "#665e52" : "#f0ece4" }}>{cat.name}</span>
                          </div>

                          {/* Spend bar */}
                          <MiniBar value={cat.value} max={maxCatValue} color={cat.color} />

                          {/* Total spent */}
                          <span style={{ fontSize: 15, fontWeight: 700, textAlign: "right", color: isEmpty ? "#504840" : cat.color }}>
                            {isEmpty ? "—" : `$${cat.value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
                          </span>

                          {/* % of total */}
                          <span style={{ fontSize: 11, color: "#665e52", textAlign: "right" }}>
                            {isEmpty ? "0%" : `${((cat.value / totalSpent) * 100).toFixed(1)}%`}
                          </span>

                          {/* Budget column */}
                          <div onClick={(e) => e.stopPropagation()} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                            {isEditingThisBudget ? (
                              <form
                                onSubmit={(e) => {
                                  e.preventDefault();
                                  const val = parseFloat(budgetInput);
                                  if (!isNaN(val) && val > 0) {
                                    setBudgets(prev => ({ ...prev, [cat.name]: val }));
                                  } else if (budgetInput === "") {
                                    setBudgets(prev => { const n = { ...prev }; delete n[cat.name]; return n; });
                                  }
                                  setEditingBudget(null);
                                  setBudgetInput("");
                                }}
                                style={{ display: "flex", gap: 6, alignItems: "center" }}
                              >
                                <span style={{ fontSize: 10, color: "#786e60" }}>$/mo</span>
                                <input
                                  autoFocus
                                  type="number"
                                  min="1"
                                  placeholder={budget ? String(budget) : "e.g. 400"}
                                  value={budgetInput}
                                  onChange={(e) => setBudgetInput(e.target.value)}
                                  style={{ width: 80, background: "#1c1a17", border: "1px solid rgba(255,255,255,0.18)", borderRadius: 6, padding: "4px 8px", color: "#f0ece4", fontSize: 12, fontFamily: "'DM Sans', sans-serif", outline: "none" }}
                                />
                                <button type="submit" style={{ background: "rgba(46,204,113,0.16)", border: "1px solid rgba(46,204,113,0.3)", borderRadius: 6, padding: "4px 10px", color: "#2ecc71", fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>Set</button>
                                <button type="button" onClick={() => { setEditingBudget(null); setBudgetInput(""); }} style={{ background: "none", border: "none", color: "#665e52", fontSize: 18, lineHeight: 1, cursor: "pointer", padding: "0 2px" }}>×</button>
                              </form>
                            ) : budget ? (
                              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                  <span style={{ fontSize: 11, color: budgetColor, fontWeight: 600 }}>
                                    ${monthlyAvg.toFixed(0)}<span style={{ color: "#504840", fontWeight: 400 }}> / ${budget}/mo</span>
                                  </span>
                                  <button
                                    onClick={() => { setEditingBudget(cat.name); setBudgetInput(String(budget)); }}
                                    style={{ background: "none", border: "none", color: "#504840", fontSize: 10, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", padding: "0 0 0 6px" }}
                                  >
                                    Edit
                                  </button>
                                </div>
                                <div style={{ width: "100%", height: 5, background: "rgba(255,255,255,0.06)", borderRadius: 3 }}>
                                  <div style={{ width: `${Math.min(budgetPct, 100)}%`, height: "100%", background: budgetColor, borderRadius: 3, transition: "width 0.5s ease" }} />
                                </div>
                                {budgetPct >= 100 && (
                                  <span style={{ fontSize: 10, color: "#e74c3c" }}>Over budget by ${(monthlyAvg - budget).toFixed(0)}/mo avg</span>
                                )}
                              </div>
                            ) : (
                              <button
                                onClick={() => { setEditingBudget(cat.name); setBudgetInput(""); }}
                                style={{ background: "none", border: "none", color: "#504840", fontSize: 11, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", padding: 0, textAlign: "left" }}
                              >
                                + Set budget
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}

            {(activeTab === "transactions" || activeTab === "income") && (
              <div style={{ animation: "fadeUp 0.4s ease" }}>
                <div style={{ display: "flex", gap: 12, marginBottom: 16, alignItems: "center", flexWrap: "wrap" }}>
                  <input
                    type="text"
                    placeholder={activeTab === "income" ? "Search income..." : "Search transactions..."}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{
                      background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
                      borderRadius: 10, padding: "10px 16px", color: "#f0ece4", fontSize: 13, flex: 1, minWidth: 200,
                      outline: "none", fontFamily: "'DM Sans', sans-serif",
                    }}
                  />
                  {selectedCategory && (
                    <button
                      onClick={() => setSelectedCategory(null)}
                      style={{
                        background: "rgba(231,76,60,0.15)", border: "1px solid rgba(231,76,60,0.3)",
                        borderRadius: 8, padding: "8px 14px", color: "#e74c3c", fontSize: 12, cursor: "pointer",
                        fontFamily: "'DM Sans', sans-serif",
                      }}
                    >
                      {selectedCategory} x
                    </button>
                  )}
                  {activeTab === "transactions" && (
                    <>
                      <select
                        value={selectedAccountFilter}
                        onChange={(e) => setSelectedAccountFilter(e.target.value)}
                        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, padding: "9px 12px", color: "#a09888", fontSize: 12, fontFamily: "'DM Sans', sans-serif" }}
                      >
                        {accountOptions.map((opt) => (
                          <option key={opt} value={opt} style={{ background: "#1c1a17", color: "#f0ece4" }}>
                            {opt === "all" ? "All accounts" : opt}
                          </option>
                        ))}
                      </select>
                      <input
                        type="date"
                        value={startDateFilter}
                        onChange={(e) => setStartDateFilter(e.target.value)}
                        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, padding: "9px 12px", color: "#a09888", fontSize: 12, fontFamily: "'DM Sans', sans-serif" }}
                      />
                      <input
                        type="date"
                        value={endDateFilter}
                        onChange={(e) => setEndDateFilter(e.target.value)}
                        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, padding: "9px 12px", color: "#a09888", fontSize: 12, fontFamily: "'DM Sans', sans-serif" }}
                      />
                      <button
                        onClick={() => applyDateRangePreset(30)}
                        style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "8px 10px", color: "#a09888", fontSize: 12, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}
                      >
                        Last 30d
                      </button>
                      <button
                        onClick={() => applyDateRangePreset(90)}
                        style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "8px 10px", color: "#a09888", fontSize: 12, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}
                      >
                        Last 90d
                      </button>
                      <button
                        onClick={() => applyDateRangePreset(0)}
                        style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "8px 10px", color: "#a09888", fontSize: 12, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}
                      >
                        Clear dates
                      </button>
                      <button
                        onClick={() => exportTransactionsToCSV(filteredTransactions)}
                        style={{ background: "rgba(52,152,219,0.14)", border: "1px solid rgba(52,152,219,0.25)", borderRadius: 8, padding: "8px 12px", color: "#7fc7ff", fontSize: 12, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}
                      >
                        Export CSV
                      </button>
                      <span style={{ color: "#665e52", fontSize: 12 }}>
                        Assign a category to any "Other" transaction to teach future imports.
                      </span>
                    </>
                  )}
                  <span style={{ color: "#665e52", fontSize: 12 }}>{filteredTransactions.length} results</span>
                </div>

                <div style={{ ...cardStyle, padding: 0, overflow: "hidden" }}>
                  <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                      <thead>
                        <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                          {[
                            { key: "date", label: "Date" },
                            { key: "desc", label: "Description" },
                            { key: "category", label: "Category" },
                            { key: "account", label: "Account" },
                            { key: "note", label: "Notes" },
                            { key: "amount", label: "Amount" },
                          ].map((col) => (
                            <th
                              key={col.key}
                              onClick={() => { if (sortCol === col.key) setSortDir(-sortDir); else { setSortCol(col.key); setSortDir(-1); }}}
                              style={{
                                padding: "12px 16px", textAlign: col.key === "amount" ? "right" : "left",
                                color: "#786e60", fontWeight: 600, fontSize: 11, textTransform: "uppercase",
                                letterSpacing: "0.08em", cursor: "pointer", userSelect: "none", whiteSpace: "nowrap",
                              }}
                            >
                              {col.label} {sortCol === col.key ? (sortDir > 0 ? "^" : "v") : ""}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {filteredTransactions.slice(0, 100).map((t, i) => (
                          <tr key={i} style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}
                            onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.02)"}
                            onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                          >
                            <td style={{ padding: "10px 16px", color: "#a09888", whiteSpace: "nowrap" }}>{t.date.toLocaleDateString()}</td>
                            <td style={{ padding: "10px 16px", maxWidth: 350, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.description}</td>
                            <td style={{ padding: "10px 16px" }}>
                              {t.category === "Other" ? (
                                <select
                                  defaultValue=""
                                  onChange={(e) => {
                                    handleCategoryAssign(t, e.target.value);
                                    e.target.value = "";
                                  }}
                                  style={{
                                    background: "#1c1a17",
                                    border: "1px solid rgba(255,255,255,0.12)",
                                    borderRadius: 8,
                                    padding: "6px 10px",
                                    color: "#f0ece4",
                                    fontSize: 11,
                                    fontFamily: "'DM Sans', sans-serif",
                                  }}
                                >
                                  <option value="" disabled style={{ background: "#1c1a17", color: "#f0ece4" }}>
                                    Categorize
                                  </option>
                                  {allCategoryOptions.map((option) => (
                                    <option key={option} value={option} style={{ background: "#1c1a17", color: "#f0ece4" }}>
                                      {option}
                                    </option>
                                  ))}
                                </select>
                              ) : (
                                <span style={{
                                  background: "rgba(255,255,255,0.05)", padding: "3px 10px", borderRadius: 20,
                                  fontSize: 11, color: "#a09888", whiteSpace: "nowrap",
                                }}>{t.category}</span>
                              )}
                            </td>
                            <td style={{ padding: "10px 16px", color: "#665e52", whiteSpace: "nowrap", fontSize: 12 }}>
                              {t.account || "Primary"}
                            </td>
                            <td style={{ padding: "10px 16px", minWidth: 170 }}>
                              <input
                                type="text"
                                value={t.note || ""}
                                onChange={(e) => handleTransactionNoteChange(t, e.target.value)}
                                placeholder="Add note..."
                                style={{ width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, padding: "6px 10px", color: "#f0ece4", fontSize: 11, fontFamily: "'DM Sans', sans-serif", outline: "none" }}
                              />
                            </td>
                            <td style={{
                              padding: "10px 16px", textAlign: "right", fontWeight: 600,
                              color: t.amount >= 0 ? "#2ecc71" : "#e74c3c", fontVariantNumeric: "tabular-nums",
                            }}>
                              {t.amount >= 0 ? "+" : ""}${Math.abs(t.amount).toFixed(2)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "rules" && (
              <div style={{ animation: "fadeUp 0.4s ease", display: "grid", gap: 16 }}>
                <div style={cardStyle}>
                  <p style={{ color: "#786e60", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12 }}>
                    Rule Manager
                  </p>
                  <p style={{ color: "#a09888", fontSize: 13, lineHeight: 1.7 }}>
                    Learned rules are saved in your browser and automatically applied to future CSV imports on this device.
                  </p>
                </div>

                <div style={cardStyle}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, marginBottom: 16, flexWrap: "wrap" }}>
                    <p style={{ color: "#786e60", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.1em" }}>
                      Saved Rules
                    </p>
                    <span style={{ color: "#665e52", fontSize: 12 }}>
                      {learnedRules.length} saved
                    </span>
                  </div>

                  {learnedRules.length === 0 ? (
                    <p style={{ color: "#a09888", fontSize: 13, lineHeight: 1.7 }}>
                      No learned rules yet. Categorize an "Other" transaction from the Transactions or Income tab to add one.
                    </p>
                  ) : (
                    <div style={{ display: "grid", gap: 10 }}>
                      {learnedRules.map((rule) => (
                        <div
                          key={rule.merchantKey}
                          style={{
                            display: "grid",
                            gridTemplateColumns: "minmax(160px, 1fr) 220px 110px",
                            gap: 12,
                            alignItems: "center",
                            padding: "12px 14px",
                            background: "rgba(255,255,255,0.02)",
                            border: "1px solid rgba(255,255,255,0.04)",
                            borderRadius: 12,
                          }}
                        >
                          <div>
                            <p style={{ fontSize: 13, fontWeight: 600, color: "#f0ece4" }}>{rule.merchantKey}</p>
                            <p style={{ fontSize: 11, color: "#665e52", marginTop: 4 }}>Matches similar merchant descriptions</p>
                          </div>

                          <select
                            value={rule.category}
                            onChange={(e) => handleRuleCategoryChange(rule.merchantKey, e.target.value)}
                            style={{
                              background: "#1c1a17",
                              border: "1px solid rgba(255,255,255,0.12)",
                              borderRadius: 8,
                              padding: "9px 12px",
                              color: "#f0ece4",
                              fontSize: 12,
                              fontFamily: "'DM Sans', sans-serif",
                            }}
                          >
                            {allCategoryOptions.map((option) => (
                              <option key={option} value={option} style={{ background: "#1c1a17", color: "#f0ece4" }}>
                                {option}
                              </option>
                            ))}
                          </select>

                          <button
                            onClick={() => handleRuleDelete(rule.merchantKey)}
                            style={{
                              background: "rgba(231,76,60,0.12)",
                              border: "1px solid rgba(231,76,60,0.24)",
                              borderRadius: 8,
                              padding: "9px 12px",
                              color: "#e74c3c",
                              cursor: "pointer",
                              fontSize: 12,
                              fontWeight: 600,
                              fontFamily: "'DM Sans', sans-serif",
                            }}
                          >
                            Delete
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Custom Categories */}
                <div style={cardStyle}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 8 }}>
                    <div>
                      <p style={{ color: "#786e60", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4 }}>Custom Categories</p>
                      <p style={{ color: "#665e52", fontSize: 12 }}>Create your own categories with keywords for automatic matching on import.</p>
                    </div>
                    <span style={{ color: "#665e52", fontSize: 12 }}>{customCategoryRules.length} custom</span>
                  </div>

                  {/* Add form */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: 10, marginBottom: customCategoryRules.length > 0 ? 16 : 0, alignItems: "flex-end" }}>
                    <div>
                      <p style={{ fontSize: 10, color: "#786e60", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>Category Name</p>
                      <input
                        type="text"
                        placeholder="e.g. Pet Supplies"
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleAddCustomCategory()}
                        style={{ width: "100%", background: "#1c1a17", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 8, padding: "9px 12px", color: "#f0ece4", fontSize: 12, fontFamily: "'DM Sans', sans-serif", outline: "none" }}
                      />
                    </div>
                    <div>
                      <p style={{ fontSize: 10, color: "#786e60", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>Keywords <span style={{ color: "#504840", fontWeight: 400 }}>(comma-separated)</span></p>
                      <input
                        type="text"
                        placeholder="e.g. petco, petsmart, chewy"
                        value={newCategoryKeywords}
                        onChange={(e) => setNewCategoryKeywords(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleAddCustomCategory()}
                        style={{ width: "100%", background: "#1c1a17", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 8, padding: "9px 12px", color: "#f0ece4", fontSize: 12, fontFamily: "'DM Sans', sans-serif", outline: "none" }}
                      />
                    </div>
                    <button
                      onClick={handleAddCustomCategory}
                      disabled={!newCategoryName.trim()}
                      style={{ padding: "9px 18px", borderRadius: 8, border: "none", background: newCategoryName.trim() ? "rgba(52,152,219,0.18)" : "rgba(255,255,255,0.04)", color: newCategoryName.trim() ? "#7fc7ff" : "#504840", fontSize: 12, fontWeight: 600, cursor: newCategoryName.trim() ? "pointer" : "not-allowed", fontFamily: "'DM Sans', sans-serif", whiteSpace: "nowrap" }}
                    >
                      + Add
                    </button>
                  </div>

                  {/* Custom category list */}
                  {customCategoryRules.length > 0 && (
                    <div style={{ display: "grid", gap: 8 }}>
                      {customCategoryRules.map((rule) => (
                        <div key={rule.name} style={{ display: "grid", gridTemplateColumns: "minmax(140px, auto) 1fr auto", gap: 12, alignItems: "center", padding: "10px 14px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10 }}>
                          <p style={{ fontSize: 13, fontWeight: 600, color: "#f0ece4" }}>{rule.name}</p>
                          <p style={{ fontSize: 11, color: "#504840", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {rule.keywords.length > 0 ? rule.keywords.join(", ") : <span style={{ color: "#3a3228", fontStyle: "italic" }}>no keywords — assign manually per transaction</span>}
                          </p>
                          <button
                            onClick={() => handleDeleteCustomCategory(rule.name)}
                            style={{ background: "rgba(231,76,60,0.1)", border: "1px solid rgba(231,76,60,0.2)", borderRadius: 7, padding: "6px 12px", color: "#e74c3c", cursor: "pointer", fontSize: 11, fontWeight: 600, fontFamily: "'DM Sans', sans-serif", whiteSpace: "nowrap" }}
                          >
                            Delete
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === "reports" && (
              <div style={{ animation: "fadeUp 0.4s ease", display: "grid", gap: 16 }}>
                <div style={{ ...cardStyle, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
                  <div>
                    <p style={{ color: "#786e60", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>
                      Spending Reports
                    </p>
                    <p style={{ color: "#a09888", fontSize: 13, lineHeight: 1.7 }}>
                      Click any period to see detailed breakdown of income sources, spending by category, and individual transactions.
                    </p>
                  </div>
                  <button
                    onClick={() => downloadTextReport(reportText)}
                    disabled={!reportText}
                    style={{
                      padding: "10px 16px",
                      borderRadius: 10,
                      border: "1px solid rgba(52,152,219,0.24)",
                      background: reportText ? "rgba(52,152,219,0.14)" : "rgba(255,255,255,0.04)",
                      color: reportText ? "#7fc7ff" : "#786e60",
                      cursor: reportText ? "pointer" : "not-allowed",
                      fontSize: 12,
                      fontWeight: 600,
                      fontFamily: "'DM Sans', sans-serif",
                    }}
                  >
                    Download TXT Report
                  </button>
                </div>

                {[
                  { title: "Monthly Summary", rows: monthlyReports, type: "monthly" },
                  { title: "Quarterly Summary", rows: quarterlyReports, type: "quarterly" },
                  { title: "Yearly Summary", rows: yearlyReports, type: "yearly" },
                ].map((section) => (
                  <div key={section.title} style={cardStyle}>
                    <p style={{ color: "#786e60", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 16 }}>
                      {section.title}
                    </p>
                    {section.rows.length === 0 ? (
                      <p style={{ color: "#a09888", fontSize: 13 }}>Upload a CSV to generate this report.</p>
                    ) : (
                      <div style={{ display: "grid", gap: 10 }}>
                        {section.rows.map((row, idx) => {
                          const periodKey = section.type === "monthly" 
                            ? (() => {
                                const [month, year] = row.label.split(" ");
                                const monthNum = String(MONTHS.indexOf(month) + 1).padStart(2, "0");
                                return `${year}-${monthNum}`;
                              })()
                            : section.type === "quarterly"
                              ? (() => {
                                  const [quarter, year] = row.label.split(" ");
                                  return `${year}-${quarter}`;
                                })()
                              : row.label;
                          const isExpanded = expandedReportPeriod === `${section.type}-${periodKey}`;
                          const periodSpending = getSpendingForPeriod(periodKey, section.type);
                          const periodIncome = getIncomeForPeriod(periodKey, section.type);
                          const categoryBreakdown = getCategoryBreakdownForPeriod(periodKey, section.type);
                          const maxCatValueForPeriod = Math.max(...categoryBreakdown.map((c) => c.value), 1);
                          const totalSpentInPeriod = periodSpending.reduce((s, t) => s + Math.abs(t.amount), 0);

                          return (
                            <div key={`${section.title}-${row.label}`}>
                              <div
                                onClick={() => setExpandedReportPeriod(isExpanded ? null : `${section.type}-${periodKey}`)}
                                style={{
                                  display: "grid",
                                  gridTemplateColumns: "minmax(120px, 1fr) repeat(4, minmax(90px, auto)) auto",
                                  gap: 12,
                                  alignItems: "center",
                                  padding: "12px 14px",
                                  background: "rgba(255,255,255,0.02)",
                                  borderRadius: 12,
                                  border: isExpanded ? "1px solid rgba(231,76,60,0.3)" : "1px solid rgba(255,255,255,0.04)",
                                  cursor: "pointer",
                                  transition: "all 0.2s",
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.04)"}
                                onMouseLeave={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.02)"}
                              >
                                <span style={{ fontSize: 13, fontWeight: 600 }}>{row.label} {isExpanded ? "▼" : "▶"}</span>
                                <span style={{ fontSize: 12, color: "#2ecc71" }}>Income {formatCurrency(row.income)}</span>
                                <span style={{ fontSize: 12, color: "#e74c3c" }}>Spent {formatCurrency(row.spent)}</span>
                                <span style={{ fontSize: 12, color: row.net >= 0 ? "#2ecc71" : "#f39c12" }}>
                                  Net {row.net >= 0 ? formatCurrency(row.net) : `-${formatCurrency(row.net)}`}
                                </span>
                                <span style={{ fontSize: 12, color: "#a09888" }}>{row.count} transactions</span>
                                <button
                                  onClick={(e) => { e.stopPropagation(); setPdfPreviewPeriod({ label: row.label, periodKey, periodType: section.type, row }); }}
                                  style={{
                                    background: "rgba(255,255,255,0.06)",
                                    border: "1px solid rgba(255,255,255,0.1)",
                                    borderRadius: 6,
                                    padding: "4px 10px",
                                    color: "#a09888",
                                    fontSize: 11,
                                    fontWeight: 600,
                                    cursor: "pointer",
                                    whiteSpace: "nowrap",
                                    letterSpacing: "0.03em",
                                  }}
                                  onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.12)"; e.currentTarget.style.color = "#f0ece4"; }}
                                  onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.06)"; e.currentTarget.style.color = "#a09888"; }}
                                >
                                  PDF
                                </button>
                              </div>

                              {isExpanded && (
                                <div style={{ marginTop: 12, display: "grid", gap: 12 }}>
                                  {/* Income Sources */}
                                  {periodIncome.length > 0 && (
                                    <div style={{ background: "rgba(46,204,113,0.06)", border: "1px solid rgba(46,204,113,0.15)", borderRadius: 12, padding: 16 }}>
                                      <p style={{ color: "#2ecc71", fontSize: 12, fontWeight: 600, marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                                        Income Sources
                                      </p>
                                      <div style={{ display: "grid", gap: 6 }}>
                                        {periodIncome.sort((a, b) => b.amount - a.amount).map((t, i) => (
                                          <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", background: "rgba(255,255,255,0.02)", borderRadius: 8, fontSize: 13 }}>
                                            <div>
                                              <div style={{ color: "#f0ece4", marginBottom: 4 }}>{t.description}</div>
                                              <div style={{ color: "#665e52", fontSize: 11 }}>{t.date.toLocaleDateString()}</div>
                                            </div>
                                            <span style={{ color: "#2ecc71", fontWeight: 600 }}>+${t.amount.toFixed(2)}</span>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}

                                  {/* Category Breakdown */}
                                  {categoryBreakdown.length > 0 && (
                                    <div style={{ background: "rgba(231,76,60,0.06)", border: "1px solid rgba(231,76,60,0.15)", borderRadius: 12, padding: 16 }}>
                                      <p style={{ color: "#e74c3c", fontSize: 12, fontWeight: 600, marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                                        Spending by Category
                                      </p>
                                      <div style={{ display: "grid", gap: 8 }}>
                                        {categoryBreakdown.map((cat, i) => (
                                          <div key={cat.name} style={{ display: "grid", gridTemplateColumns: "140px 1fr 100px", gap: 12, alignItems: "center" }}>
                                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                              <div style={{ width: 8, height: 8, borderRadius: "50%", background: cat.color, flexShrink: 0 }} />
                                              <span style={{ fontSize: 12, color: "#a09888", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{cat.name}</span>
                                            </div>
                                            <MiniBar value={cat.value} max={maxCatValueForPeriod} color={cat.color} />
                                            <div style={{ textAlign: "right" }}>
                                              <div style={{ fontSize: 12, fontWeight: 600, color: cat.color }}>${cat.value.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
                                              <div style={{ fontSize: 10, color: "#665e52" }}>({((cat.value / totalSpentInPeriod) * 100).toFixed(1)}%)</div>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}

                                  {/* Transactions with Category Editing */}
                                  {periodSpending.length > 0 && (
                                    <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)", borderRadius: 12, padding: "0", overflow: "hidden" }}>
                                      <div style={{ padding: 16, borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                                        <p style={{ color: "#786e60", fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                                          Transactions ({periodSpending.length})
                                        </p>
                                      </div>
                                      <div style={{ overflowX: "auto", maxHeight: 400, overflowY: "auto" }}>
                                        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                                          <thead style={{ position: "sticky", top: 0, background: "#0f0e0c" }}>
                                            <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                                              <th style={{ padding: "12px 16px", textAlign: "left", color: "#786e60", fontWeight: 600, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em" }}>Date</th>
                                              <th style={{ padding: "12px 16px", textAlign: "left", color: "#786e60", fontWeight: 600, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em" }}>Description</th>
                                              <th style={{ padding: "12px 16px", textAlign: "left", color: "#786e60", fontWeight: 600, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em" }}>Category</th>
                                              <th style={{ padding: "12px 16px", textAlign: "right", color: "#786e60", fontWeight: 600, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em" }}>Amount</th>
                                            </tr>
                                          </thead>
                                          <tbody>
                                            {periodSpending.sort((a, b) => b.amount - a.amount).map((t, i) => (
                                              <tr key={i} style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}
                                                onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.02)"}
                                                onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                                              >
                                                <td style={{ padding: "10px 16px", color: "#a09888", whiteSpace: "nowrap", fontSize: 11 }}>{t.date.toLocaleDateString()}</td>
                                                <td style={{ padding: "10px 16px", maxWidth: 250, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: 11 }}>{t.description}</td>
                                                <td style={{ padding: "10px 16px", minWidth: 140 }}>
                                                  <select
                                                    value={t.category}
                                                    onChange={(e) => handleCategoryAssign(t, e.target.value)}
                                                    style={{
                                                      background: "#1c1a17",
                                                      border: "1px solid rgba(255,255,255,0.12)",
                                                      borderRadius: 6,
                                                      padding: "5px 8px",
                                                      color: "#f0ece4",
                                                      fontSize: 10,
                                                      fontFamily: "'DM Sans', sans-serif",
                                                      cursor: "pointer",
                                                    }}
                                                  >
                                                    {allCategoryOptions.map((option) => (
                                                      <option key={option} value={option} style={{ background: "#1c1a17", color: "#f0ece4" }}>
                                                        {option}
                                                      </option>
                                                    ))}
                                                  </select>
                                                </td>
                                                <td style={{ padding: "10px 16px", textAlign: "right", fontWeight: 600, color: "#e74c3c", fontVariantNumeric: "tabular-nums", fontSize: 11 }}>-${Math.abs(t.amount).toFixed(2)}</td>
                                              </tr>
                                            ))}
                                          </tbody>
                                        </table>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ))}
                <div style={cardStyle}>
                  <p style={{ color: "#786e60", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12 }}>
                    Monthly Category Trend
                  </p>
                  {monthlyCategoryTrend.length === 0 ? (
                    <p style={{ color: "#a09888", fontSize: 13 }}>Not enough spending data for trend chart yet.</p>
                  ) : (
                    <div style={{ display: "grid", gap: 8 }}>
                      {monthlyCategoryTrend.map((month) => {
                        const monthMax = Math.max(...Object.values(month.values), 1);
                        return (
                          <div key={month.key} style={{ display: "grid", gridTemplateColumns: "120px 1fr", gap: 12, alignItems: "center" }}>
                            <span style={{ fontSize: 12, color: "#a09888" }}>{month.label}</span>
                            <div style={{ display: "grid", gap: 4 }}>
                              {Object.entries(month.values).map(([category, value], idx) => (
                                <div key={`${month.key}-${category}`} style={{ display: "grid", gridTemplateColumns: "110px 1fr 70px", gap: 8, alignItems: "center" }}>
                                  <span style={{ fontSize: 11, color: "#665e52", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{category}</span>
                                  <div style={{ height: 6, borderRadius: 6, background: "rgba(255,255,255,0.06)" }}>
                                    <div style={{ width: `${(value / monthMax) * 100}%`, height: "100%", borderRadius: 6, background: COLORS[idx % COLORS.length] }} />
                                  </div>
                                  <span style={{ fontSize: 11, color: "#a09888", textAlign: "right" }}>${value.toFixed(0)}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === "budgets" && (
              <div style={{ animation: "fadeUp 0.4s ease", display: "grid", gap: 16 }}>
                <div style={cardStyle}>
                  <p style={{ color: "#786e60", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>
                    Budget Forecast
                  </p>
                  <p style={{ color: "#a09888", fontSize: 13, lineHeight: 1.7 }}>
                    Month-to-date pacing across {budgetForecastRows.elapsedDays}/{budgetForecastRows.daysInMonth} days. Projections estimate where each category lands by month end.
                  </p>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
                  {[
                    { label: "Budgeted Categories", value: budgetForecastRows.rows.length, color: "#7fc7ff" },
                    { label: "At Risk", value: budgetForecastRows.atRisk.length, color: budgetForecastRows.atRisk.length > 0 ? "#f39c12" : "#2ecc71" },
                    { label: "Total Budget", value: `$${budgetForecastRows.totalBudget.toFixed(0)}`, color: "#2ecc71" },
                    { label: "Projected Spend", value: `$${budgetForecastRows.totalProjected.toFixed(0)}`, color: budgetForecastRows.totalProjected > budgetForecastRows.totalBudget ? "#e74c3c" : "#f39c12" },
                  ].map((stat) => (
                    <div key={stat.label} style={cardStyle}>
                      <p style={{ color: "#786e60", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>{stat.label}</p>
                      <p style={{ fontSize: 24, fontWeight: 700, color: stat.color }}>{stat.value}</p>
                    </div>
                  ))}
                </div>

                <div style={cardStyle}>
                  <p style={{ color: "#786e60", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 14 }}>
                    Category Forecasts
                  </p>
                  {budgetForecastRows.rows.length === 0 ? (
                    <p style={{ color: "#a09888", fontSize: 13 }}>No budgets set yet. Add category budgets in the Categories tab to unlock forecasting.</p>
                  ) : (
                    <div style={{ display: "grid", gap: 8 }}>
                      {budgetForecastRows.rows.map((row) => (
                        <div key={row.category} style={{ padding: "12px 14px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)", borderRadius: 10 }}>
                          <div style={{ display: "grid", gridTemplateColumns: "minmax(120px, 1fr) 90px 90px 110px 110px 100px", gap: 12, alignItems: "center" }}>
                            <span style={{ fontSize: 13, fontWeight: 600 }}>{row.category}</span>
                            <span style={{ fontSize: 12, color: "#a09888" }}>Budget ${row.budget.toFixed(0)}</span>
                            <span style={{ fontSize: 12, color: "#a09888" }}>Spent ${row.spentSoFar.toFixed(0)}</span>
                            <span style={{ fontSize: 12, color: "#a09888" }}>Projected ${row.projected.toFixed(0)}</span>
                            <span style={{ fontSize: 12, color: row.remaining < 0 ? "#e74c3c" : "#2ecc71" }}>
                              {row.remaining < 0 ? `Over $${Math.abs(row.remaining).toFixed(0)}` : `Left $${row.remaining.toFixed(0)}`}
                            </span>
                            <span style={{ fontSize: 11, color: row.statusColor, fontWeight: 700, textAlign: "right" }}>
                              {row.status}
                            </span>
                          </div>
                          <div style={{ marginTop: 8, height: 6, borderRadius: 6, background: "rgba(255,255,255,0.06)" }}>
                            <div style={{ width: `${Math.min(row.projectedPct, 100)}%`, height: "100%", borderRadius: 6, background: row.statusColor }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === "insights" && (
              <div style={{ animation: "fadeUp 0.4s ease", display: "grid", gap: 16 }}>
                {/* Recurring Charges */}
                <div style={cardStyle}>
                  <p style={{ color: "#786e60", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 16 }}>Detected Recurring Charges</p>
                  <p style={{ color: "#665e52", fontSize: 12, marginBottom: 16 }}>
                    Monthly subscriptions & recurring payments: <strong style={{ color: "#f39c12" }}>${recurringCharges.reduce((s, r) => s + r.monthlyEquivalent, 0).toFixed(2)}/mo estimated</strong>
                  </p>
                  <div style={{ display: "grid", gap: 6 }}>
                    {recurringCharges.map((r, i) => (
                      <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", background: "rgba(255,255,255,0.02)", borderRadius: 8 }}>
                        <span style={{ fontSize: 13 }}>{r.name}</span>
                        <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
                          <span style={{ fontSize: 11, color: "#665e52" }}>{r.count}x</span>
                          <span style={{ fontSize: 11, color: "#665e52" }}>{r.cadence}</span>
                          <span style={{ fontSize: 11, color: r.confidence >= 0.8 ? "#2ecc71" : r.confidence >= 0.65 ? "#f39c12" : "#a09888" }}>
                            {Math.round(r.confidence * 100)}% confidence
                          </span>
                          <span style={{ fontSize: 14, fontWeight: 600, color: "#f39c12" }}>${r.monthlyEquivalent.toFixed(2)}/mo</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Top Merchants */}
                <div style={cardStyle}>
                  <p style={{ color: "#786e60", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 16 }}>Top Merchants by Total Spend</p>
                  <div style={{ display: "grid", gap: 6 }}>
                    {topMerchants.map((m, i) => (
                      <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", background: "rgba(255,255,255,0.02)", borderRadius: 8 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <span style={{ color: "#665e52", fontSize: 11, width: 20 }}>#{i + 1}</span>
                          <span style={{ fontSize: 13 }}>{m.name}</span>
                        </div>
                        <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
                          <span style={{ fontSize: 11, color: "#665e52" }}>{m.count} visits</span>
                          <span style={{ fontSize: 14, fontWeight: 600, color: "#e74c3c" }}>${m.total.toFixed(2)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Spending Alerts */}
                <div style={cardStyle}>
                  <p style={{ color: "#786e60", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 16 }}>Smart Observations</p>
                  <div style={{ display: "grid", gap: 10 }}>
                    {categoryTotals.slice(0, 1).map((c) => (
                      <div key={c.name} style={{ padding: "12px 16px", background: "rgba(231,76,60,0.06)", borderRadius: 10, border: "1px solid rgba(231,76,60,0.1)" }}>
                        <p style={{ fontSize: 13, color: "#e74c3c", fontWeight: 600 }}>Biggest category: {c.name}</p>
                        <p style={{ fontSize: 12, color: "#a09888", marginTop: 4 }}>${c.value.toFixed(2)} - that's {((c.value / totalSpent) * 100).toFixed(1)}% of all spending.</p>
                      </div>
                    ))}
                    {totalIncome > 0 && (
                      <div style={{ padding: "12px 16px", background: savingsRate > 20 ? "rgba(46,204,113,0.06)" : "rgba(243,156,18,0.06)", borderRadius: 10, border: `1px solid ${savingsRate > 20 ? "rgba(46,204,113,0.1)" : "rgba(243,156,18,0.1)"}` }}>
                        <p style={{ fontSize: 13, color: savingsRate > 20 ? "#2ecc71" : "#f39c12", fontWeight: 600 }}>
                          {savingsRate > 20 ? "Great savings rate!" : savingsRate > 0 ? "Room to save more" : "Spending exceeds income"}
                        </p>
                        <p style={{ fontSize: 12, color: "#a09888", marginTop: 4 }}>
                          Your savings rate is {savingsRate.toFixed(1)}%. {savingsRate > 20 ? "You're keeping a solid buffer." : savingsRate > 0 ? "Aim for 20%+ to build a stronger cushion." : "Consider reviewing discretionary spending."}
                        </p>
                      </div>
                    )}
                    {recurringCharges.length > 0 && (
                      <div style={{ padding: "12px 16px", background: "rgba(52,152,219,0.06)", borderRadius: 10, border: "1px solid rgba(52,152,219,0.1)" }}>
                        <p style={{ fontSize: 13, color: "#3498db", fontWeight: 600 }}>Subscription check</p>
                        <p style={{ fontSize: 12, color: "#a09888", marginTop: 4 }}>
                          You have ~{recurringCharges.length} recurring charges totaling an estimated ${recurringCharges.reduce((s, r) => s + r.monthlyEquivalent, 0).toFixed(2)}/month. Review if you're using all of them.
                        </p>
                      </div>
                    )}
                    {(() => {
                      const foodCats = categoryTotals.filter((c) => c.name === "Restaurants & Food");
                      const foodTotal = foodCats.reduce((s, c) => s + c.value, 0);
                      if (foodTotal > 0 && monthlyData.length > 0) {
                        const monthly = foodTotal / monthlyData.length;
                        return (
                          <div style={{ padding: "12px 16px", background: "rgba(155,89,182,0.06)", borderRadius: 10, border: "1px solid rgba(155,89,182,0.1)" }}>
                            <p style={{ fontSize: 13, color: "#9b59b6", fontWeight: 600 }}>Dining out</p>
                            <p style={{ fontSize: 12, color: "#a09888", marginTop: 4 }}>
                              You spend ~${monthly.toFixed(0)}/month eating out. Cooking more could save you ${(monthly * 0.5).toFixed(0)}+/month.
                            </p>
                          </div>
                        );
                      }
                      return null;
                    })()}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

    {/* PDF Preview Modal */}
    {pdfPreviewPeriod && (() => {
      const { label, periodKey, periodType, row } = pdfPreviewPeriod;
      const income = getIncomeForPeriod(periodKey, periodType);
      const spending = getSpendingForPeriod(periodKey, periodType);
      const categories = getCategoryBreakdownForPeriod(periodKey, periodType);
      const totalSpent = spending.reduce((s, t) => s + Math.abs(t.amount), 0);
      const maxCat = Math.max(...categories.map(c => c.value), 1);
      const generatedDate = new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
      const periodTypeLabel = periodType === "monthly" ? "Monthly Report" : periodType === "quarterly" ? "Quarterly Report" : "Yearly Report";

      return (
        <div
          onClick={(e) => { if (e.target === e.currentTarget) setPdfPreviewPeriod(null); }}
          style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)", display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "32px 16px", overflowY: "auto" }}
        >
          <div style={{ background: "#fff", color: "#111", borderRadius: 14, width: "100%", maxWidth: 760, padding: 48, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif", boxShadow: "0 24px 80px rgba(0,0,0,0.5)", marginBottom: 32 }}>

            {/* Modal action bar */}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginBottom: 36 }}>
              <button onClick={() => setPdfPreviewPeriod(null)} style={{ padding: "8px 20px", borderRadius: 8, border: "1px solid #e0e0e0", background: "#fff", color: "#555", fontSize: 13, cursor: "pointer" }}>
                Close
              </button>
              <button
                onClick={() => handlePrintPDF(label, periodKey, periodType, row)}
                style={{ padding: "8px 20px", borderRadius: 8, border: "none", background: "#111", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" }}
              >
                ↓ Download PDF
              </button>
            </div>

            {/* Report header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28, paddingBottom: 16, borderBottom: "2px solid #111" }}>
              <div>
                <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: -1 }}>Ledger.</div>
                <div style={{ fontSize: 10, color: "#999", letterSpacing: "0.06em", marginTop: 2 }}>Personal Finance Tracker</div>
              </div>
              <div style={{ textAlign: "right", fontSize: 11, color: "#999" }}>
                <div>{periodTypeLabel}</div>
                <div>Generated {generatedDate}</div>
              </div>
            </div>

            {/* Period title */}
            <div style={{ fontSize: 30, fontWeight: 800, letterSpacing: -1, marginBottom: 3 }}>{label}</div>
            <div style={{ fontSize: 11, color: "#888", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 24 }}>{periodTypeLabel}</div>

            {/* Summary stats */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
              {[
                { label: "Income", value: `$${row.income.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, color: "#16a34a" },
                { label: "Spent", value: `$${row.spent.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, color: "#dc2626" },
                { label: "Net", value: `${row.net >= 0 ? "+" : "-"}$${Math.abs(row.net).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, color: row.net >= 0 ? "#16a34a" : "#ea580c" },
                { label: "Transactions", value: row.count, color: "#111" },
              ].map(s => (
                <div key={s.label} style={{ border: "1px solid #e5e5e5", borderRadius: 8, padding: "14px 16px" }}>
                  <div style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: "#aaa", marginBottom: 6 }}>{s.label}</div>
                  <div style={{ fontSize: 17, fontWeight: 800, color: s.color }}>{s.value}</div>
                </div>
              ))}
            </div>

            {/* Income sources */}
            {income.length > 0 && (
              <>
                <div style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.14em", color: "#aaa", borderBottom: "1px solid #e8e8e8", paddingBottom: 7, marginBottom: 10, marginTop: 28 }}>
                  Income Sources ({income.length})
                </div>
                {[...income].sort((a, b) => b.amount - a.amount).map((t, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "7px 0", borderBottom: "1px solid #f5f5f5" }}>
                    <div>
                      <div style={{ fontWeight: 500, fontSize: 12 }}>{t.description}</div>
                      <div style={{ fontSize: 10, color: "#aaa", marginTop: 1 }}>{t.date.toLocaleDateString()}</div>
                    </div>
                    <div style={{ fontWeight: 700, color: "#16a34a", fontSize: 13 }}>+${t.amount.toFixed(2)}</div>
                  </div>
                ))}
              </>
            )}

            {/* Spending by category */}
            {categories.length > 0 && (
              <>
                <div style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.14em", color: "#aaa", borderBottom: "1px solid #e8e8e8", paddingBottom: 7, marginBottom: 12, marginTop: 28 }}>
                  Spending by Category
                </div>
                {categories.map(cat => (
                  <div key={cat.name} style={{ display: "grid", gridTemplateColumns: "160px 1fr 90px 55px", gap: 12, alignItems: "center", marginBottom: 8 }}>
                    <div style={{ fontSize: 11, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{cat.name}</div>
                    <div style={{ background: "#f0f0f0", borderRadius: 3, height: 6 }}>
                      <div style={{ width: `${((cat.value / maxCat) * 100).toFixed(1)}%`, height: 6, borderRadius: 3, background: cat.color }} />
                    </div>
                    <div style={{ textAlign: "right", fontWeight: 700, fontSize: 11 }}>${cat.value.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
                    <div style={{ textAlign: "right", fontSize: 10, color: "#aaa" }}>{totalSpent > 0 ? ((cat.value / totalSpent) * 100).toFixed(1) : "0.0"}%</div>
                  </div>
                ))}
              </>
            )}

            {/* Transactions table */}
            {spending.length > 0 && (
              <>
                <div style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.14em", color: "#aaa", borderBottom: "1px solid #e8e8e8", paddingBottom: 7, marginBottom: 0, marginTop: 28 }}>
                  Transactions ({spending.length})
                </div>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr>
                      {["Date", "Description", "Category", "Amount"].map(h => (
                        <th key={h} style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#aaa", padding: "8px 10px", background: "#f9f9f9", textAlign: h === "Amount" ? "right" : "left", borderBottom: "1px solid #e8e8e8" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[...spending].sort((a, b) => a.date - b.date).map((t, i) => (
                      <tr key={i}>
                        <td style={{ padding: "7px 10px", borderBottom: "1px solid #f5f5f5", fontSize: 11, color: "#999", whiteSpace: "nowrap" }}>{t.date.toLocaleDateString()}</td>
                        <td style={{ padding: "7px 10px", borderBottom: "1px solid #f5f5f5", fontSize: 11, maxWidth: 240, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.description}</td>
                        <td style={{ padding: "7px 10px", borderBottom: "1px solid #f5f5f5", fontSize: 11 }}>{t.category}</td>
                        <td style={{ padding: "7px 10px", borderBottom: "1px solid #f5f5f5", fontSize: 11, textAlign: "right", fontWeight: 700, color: "#dc2626" }}>-${Math.abs(t.amount).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}

            {/* Footer */}
            <div style={{ marginTop: 36, paddingTop: 12, borderTop: "1px solid #e8e8e8", display: "flex", justifyContent: "space-between", fontSize: 10, color: "#ccc" }}>
              <span>Ledger · Personal Finance Tracker</span>
              <span>Generated {generatedDate}</span>
            </div>
          </div>
        </div>
      );
    })()}
    </div>
  );
}


