import { useState, useMemo, useCallback, useRef, useEffect } from "react";

const CATEGORY_RULES = [
  { category: "Groceries", keywords: ["kroger", "meijer", "wal-mart", "walmart", "sam's club", "samsclub", "target", "dollar general", "dollar-general", "family dollar", "united dairy", "troy dairy", "bayers melon", "us international foods"] },
  { category: "Restaurants & Food", keywords: ["chipotle", "domino", "jimmy john", "little caesars", "taco bell", "taco shop", "victor's", "olive garden", "dairy queen", "chick-fil-a", "raising cane", "rusty taco", "marcos pizza", "hoshi ramen", "milano", "kung fu tea", "tropical smoothie", "dave", "hot chicken", "north dayton drive", "baker benji", "doordash", "panda"] },
  { category: "Gas & Auto", keywords: ["shell", "speedway", "sheetz", "bp#", "casey", "sunoco", "murphy", "o'reilly", "glassman auto", "bob ross buick", "germain honda", "rocky's ace"] },
  { category: "Subscriptions", keywords: ["disney", "tradingview", "openai", "chatgpt", "steamgames", "patreon", "x corp", "google *brawl", "apple.com"] },
  { category: "Phone & Internet", keywords: ["tmobile", "t-mobile"] },
  { category: "Insurance", keywords: ["progressive"] },
  { category: "Entertainment", keywords: ["scene75", "kings island", "air force museum", "arkham tower", "best buy", "bestbuy", "kohls", "burlington", "ross store", "office depot", "home depot", "minutekey", "lumpkins glass"] },
  { category: "Transfers & Payments", keywords: ["zelle", "online realtime transfer", "transfer to savings", "chase credit crd", "payment to chase", "wells fargo"] },
  { category: "Car Wash", keywords: ["white water express"] },
  { category: "Gas Station Snacks", keywords: ["fairborn kk"] },
  { category: "Education", keywords: ["parchment", "university of ariz", "osu-campusparc", "hrb online tax"] },
  { category: "Government & Taxes", keywords: ["irs", "ohtxsdirn", "dayton municipal", "oh bureau motor", "usps change"] },
  { category: "Payroll", keywords: ["robinson's janit", "payroll"] },
  { category: "Deposits", keywords: ["remote online deposit", "atm cash deposit"] },
  { category: "Medical & Personal", keywords: ["walgreens", "nbs-uaz"] },
  { category: "Clothing", keywords: ["jd 159"] },
];

const LEARNED_CATEGORIES_STORAGE_KEY = "finance-dashboard-learned-categories";
const CATEGORY_OPTIONS = Array.from(new Set(CATEGORY_RULES.map((rule) => rule.category)));

function normalizeTransactionKey(description) {
  return String(description || "")
    .split(/\s{2,}/)[0]
    .replace(/[0-9#*]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase()
    .substring(0, 60);
}

function categorize(description, learnedCategories = {}) {
  const learnedCategory = learnedCategories[normalizeTransactionKey(description)];
  if (learnedCategory) return learnedCategory;

  const lower = description.toLowerCase();
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

function parseCSV(text, learnedCategories = {}) {
  const parsedRows = parseCSVRows(text);
  if (parsedRows.length < 2) return [];

  const headers = parsedRows[0].map(normalizeHeader);
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
    const amount = parseAmount(getValue(parts, "Amount"));
    const balance = parseAmount(getValue(parts, "Balance"));
    const date = new Date(getValue(parts, "Transaction Date", "Date", "Post Date"));

    if (!description || Number.isNaN(amount) || Number.isNaN(date.getTime())) continue;

    transactions.push({
      details: getValue(parts, "Details", "Memo", "Description"),
      date,
      description,
      amount,
      type: getValue(parts, "Type"),
      balance: Number.isNaN(balance) ? 0 : balance,
      memo,
      category: category && category !== "Other"
        ? category
        : categorize(description, learnedCategories),
    });
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
  const [transactions, setTransactions] = useState([]);
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [sortCol, setSortCol] = useState("date");
  const [sortDir, setSortDir] = useState(-1);
  const [searchTerm, setSearchTerm] = useState("");
  const [learnedCategories, setLearnedCategories] = useState(() => {
    if (typeof window === "undefined") return {};

    try {
      const saved = window.localStorage.getItem(LEARNED_CATEGORIES_STORAGE_KEY);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });
  const uploadInputRef = useRef(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      window.localStorage.setItem(
        LEARNED_CATEGORIES_STORAGE_KEY,
        JSON.stringify(learnedCategories)
      );
    } catch {
      // Ignore storage failures so the dashboard still works without persistence.
    }
  }, [learnedCategories]);

  const handleFile = useCallback((file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const parsed = parseCSV(e.target.result, learnedCategories);
      setTransactions(parsed);
      setActiveTab("overview");
    };
    reader.readAsText(file);
  }, [learnedCategories]);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    const file = e.dataTransfer?.files?.[0];
    if (file) handleFile(file);
  }, [handleFile]);

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

  // Computed data
  const spending = useMemo(() => transactions.filter((t) => t.amount < 0 && t.category !== "Transfers & Payments" && t.category !== "Payroll" && t.category !== "Deposits"), [transactions]);
  const income = useMemo(() => transactions.filter((t) => t.amount > 0 && (t.category === "Payroll" || t.category === "Deposits" || t.type === "ACH_CREDIT" || t.type === "CHECK_DEPOSIT" || t.type === "QUICKPAY_CREDIT" || t.type === "PARTNERFI_TO_CHASE")), [transactions]);
  const incomeTransactions = useMemo(() => transactions.filter((t) => t.amount > 0), [transactions]);

  const categoryTotals = useMemo(() => {
    const map = {};
    spending.forEach((t) => {
      if (!map[t.category]) map[t.category] = 0;
      map[t.category] += Math.abs(t.amount);
    });
    return Object.entries(map)
      .map(([name, value], i) => ({ name, value: Math.round(value * 100) / 100, color: COLORS[i % COLORS.length] }))
      .sort((a, b) => b.value - a.value);
  }, [spending]);

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

  const topMerchants = useMemo(() => {
    const map = {};
    spending.forEach((t) => {
      const name = t.description.split(/\s{2,}/)[0].replace(/[0-9#*]+/g, "").trim().substring(0, 30);
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
      const name = t.description.split(/\s{2,}/)[0].replace(/[0-9#*]+/g, "").trim().substring(0, 30);
      if (!map[name]) map[name] = [];
      map[name].push({ amount: Math.abs(t.amount), date: t.date });
    });
    return Object.entries(map)
      .filter(([, arr]) => arr.length >= 2)
      .map(([name, arr]) => {
        const amounts = arr.map((a) => a.amount);
        const avg = amounts.reduce((s, a) => s + a, 0) / amounts.length;
        const variance = amounts.reduce((s, a) => s + Math.pow(a - avg, 2), 0) / amounts.length;
        const isConsistent = variance / (avg * avg + 0.01) < 0.05;
        return { name, count: arr.length, avg: Math.round(avg * 100) / 100, consistent: isConsistent, total: Math.round(amounts.reduce((s, a) => s + a, 0) * 100) / 100 };
      })
      .filter((r) => r.consistent && r.count >= 2)
      .sort((a, b) => b.avg - a.avg);
  }, [transactions]);

  const learnedRules = useMemo(() => Object.entries(learnedCategories)
    .map(([merchantKey, category]) => ({ merchantKey, category }))
    .sort((a, b) => a.merchantKey.localeCompare(b.merchantKey)), [learnedCategories]);

  const filteredTransactions = useMemo(() => {
    const baseList = activeTab === "income"
      ? [...incomeTransactions]
      : selectedCategory
        ? spending.filter((t) => t.category === selectedCategory)
        : [...spending];

    let list = baseList;
    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      list = list.filter((t) => t.description.toLowerCase().includes(lower) || t.category.toLowerCase().includes(lower));
    }
    return list.sort((a, b) => {
      if (sortCol === "date") return sortDir * (a.date - b.date);
      if (sortCol === "amount") return sortDir * (a.amount - b.amount);
      if (sortCol === "desc") return sortDir * a.description.localeCompare(b.description);
      if (sortCol === "category") return sortDir * a.category.localeCompare(b.category);
      return 0;
    });
  }, [activeTab, incomeTransactions, spending, selectedCategory, searchTerm, sortCol, sortDir]);

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
          {hasData && (
            <label style={{
              padding: "8px 20px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 10, cursor: "pointer", fontSize: 13, color: "#a09888", fontWeight: 500,
            }}>
              Upload new CSV
              <input type="file" accept=".csv" style={{ display: "none" }} onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
            </label>
          )}
        </div>

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
              {["overview", "categories", "transactions", "income", "rules", "insights"].map((tab) => (
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
              </div>
            )}

            {activeTab === "categories" && (
              <div style={{ animation: "fadeUp 0.4s ease" }}>
                <div style={{ display: "grid", gap: 8 }}>
                  {categoryTotals.map((cat, i) => (
                    <div
                      key={cat.name}
                      style={{
                        ...cardStyle, padding: "16px 20px", cursor: "pointer", display: "grid",
                        gridTemplateColumns: "200px 1fr 100px 60px", alignItems: "center", gap: 16,
                        animation: `fadeUp 0.3s ease ${i * 0.04}s both`,
                        border: selectedCategory === cat.name ? `1px solid ${cat.color}44` : cardStyle.border,
                      }}
                      onClick={() => { setSelectedCategory(cat.name); setActiveTab("transactions"); }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ width: 10, height: 10, borderRadius: "50%", background: cat.color, flexShrink: 0 }} />
                        <span style={{ fontSize: 14, fontWeight: 600 }}>{cat.name}</span>
                      </div>
                      <MiniBar value={cat.value} max={maxCatValue} color={cat.color} />
                      <span style={{ fontSize: 15, fontWeight: 700, textAlign: "right", color: cat.color }}>${cat.value.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                      <span style={{ fontSize: 11, color: "#665e52", textAlign: "right" }}>{((cat.value / totalSpent) * 100).toFixed(1)}%</span>
                    </div>
                  ))}
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
                    <span style={{ color: "#665e52", fontSize: 12 }}>
                      Assign a category to any "Other" transaction to teach future imports.
                    </span>
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
                                    background: "rgba(255,255,255,0.04)",
                                    border: "1px solid rgba(255,255,255,0.08)",
                                    borderRadius: 8,
                                    padding: "6px 10px",
                                    color: "#f0ece4",
                                    fontSize: 11,
                                    fontFamily: "'DM Sans', sans-serif",
                                  }}
                                >
                                  <option value="" disabled>
                                    Categorize
                                  </option>
                                  {CATEGORY_OPTIONS.map((option) => (
                                    <option key={option} value={option}>
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
                              background: "rgba(255,255,255,0.04)",
                              border: "1px solid rgba(255,255,255,0.08)",
                              borderRadius: 8,
                              padding: "9px 12px",
                              color: "#f0ece4",
                              fontSize: 12,
                              fontFamily: "'DM Sans', sans-serif",
                            }}
                          >
                            {CATEGORY_OPTIONS.map((option) => (
                              <option key={option} value={option}>
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
              </div>
            )}

            {activeTab === "insights" && (
              <div style={{ animation: "fadeUp 0.4s ease", display: "grid", gap: 16 }}>
                {/* Recurring Charges */}
                <div style={cardStyle}>
                  <p style={{ color: "#786e60", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 16 }}>Detected Recurring Charges</p>
                  <p style={{ color: "#665e52", fontSize: 12, marginBottom: 16 }}>
                    Monthly subscriptions & recurring payments: <strong style={{ color: "#f39c12" }}>${recurringCharges.reduce((s, r) => s + r.avg, 0).toFixed(2)}/mo estimated</strong>
                  </p>
                  <div style={{ display: "grid", gap: 6 }}>
                    {recurringCharges.map((r, i) => (
                      <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", background: "rgba(255,255,255,0.02)", borderRadius: 8 }}>
                        <span style={{ fontSize: 13 }}>{r.name}</span>
                        <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
                          <span style={{ fontSize: 11, color: "#665e52" }}>{r.count}x</span>
                          <span style={{ fontSize: 14, fontWeight: 600, color: "#f39c12" }}>${r.avg.toFixed(2)}</span>
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
                          You have ~{recurringCharges.length} recurring charges totaling an estimated ${recurringCharges.reduce((s, r) => s + r.avg, 0).toFixed(2)}/month. Review if you're using all of them.
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
    </div>
  );
}


