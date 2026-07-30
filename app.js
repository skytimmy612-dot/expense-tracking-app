const STORAGE_KEY = "expense-tracking-app-v3";

const EXPENSE_CATS = [
  { id: "餐飲", icon: "🍴", bg: "var(--cat-dining)", fg: "var(--cat-dining-fg)", chart: "var(--chart-1)" },
  { id: "交通", icon: "🚌", bg: "var(--cat-transit)", fg: "var(--cat-transit-fg)", chart: "var(--chart-3)" },
  { id: "購物", icon: "🛍️", bg: "var(--cat-shop)", fg: "var(--cat-shop-fg)", chart: "var(--chart-2)" },
  { id: "娛樂", icon: "🎬", bg: "var(--cat-fun)", fg: "var(--cat-fun-fg)", chart: "var(--chart-4)" },
  { id: "醫療", icon: "❤️", bg: "var(--cat-health)", fg: "var(--cat-health-fg)", chart: "var(--chart-5)" },
  { id: "居家", icon: "🏠", bg: "var(--cat-home)", fg: "var(--cat-home-fg)", chart: "#a78bfa" },
  { id: "學習", icon: "📚", bg: "var(--cat-study)", fg: "var(--cat-study-fg)", chart: "#38bdf8" },
  { id: "其他", icon: "＋", bg: "var(--cat-more)", fg: "var(--cat-more-fg)", chart: "#94a3b8", dashed: true },
];

const INCOME_CATS = [
  { id: "薪資", icon: "💼", bg: "var(--cat-health)", fg: "var(--cat-health-fg)", chart: "var(--chart-3)" },
  { id: "兼職", icon: "💻", bg: "var(--cat-transit)", fg: "var(--cat-transit-fg)", chart: "var(--chart-1)" },
  { id: "投資", icon: "📈", bg: "var(--cat-dining)", fg: "var(--cat-dining-fg)", chart: "var(--chart-2)" },
  { id: "其他收入", icon: "💰", bg: "var(--cat-home)", fg: "var(--cat-home-fg)", chart: "var(--chart-4)" },
];

const QUICK_CATS = ["餐飲", "交通", "購物"];

const state = {
  screen: "home",
  transactions: loadTransactions(),
  showAllRecent: false,
  viewDate: new Date(),
  reportPeriod: "month",
  form: {
    type: "expense",
    amountStr: "0",
    category: "餐飲",
    date: todayStr(),
    note: "",
  },
};

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function loadTransactions() {
  try {
    localStorage.removeItem("expense-tracking-app-v1");
    localStorage.removeItem("expense-tracking-app-v2");
  } catch (_) {}

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (_) {}
  return [];
}

function saveTransactions() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.transactions));
}

function fmt(n) {
  const abs = Math.abs(Number(n) || 0);
  const body = new Intl.NumberFormat("zh-TW", {
    minimumFractionDigits: Number.isInteger(abs) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(abs);
  return `NT$ ${body}`;
}

function catMeta(name, type) {
  const list = type === "income" ? INCOME_CATS : EXPENSE_CATS;
  return list.find((c) => c.id === name) || EXPENSE_CATS[EXPENSE_CATS.length - 1];
}

function monthBounds(d) {
  const y = d.getFullYear();
  const m = d.getMonth();
  const start = new Date(y, m, 1);
  const end = new Date(y, m + 1, 0, 23, 59, 59, 999);
  return { start, end };
}

function weekBounds(d) {
  const day = d.getDay();
  const diff = day === 0 ? 6 : day - 1;
  const start = new Date(d);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - diff);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

function yearBounds(d) {
  const y = d.getFullYear();
  return {
    start: new Date(y, 0, 1),
    end: new Date(y, 11, 31, 23, 59, 59, 999),
  };
}

function periodBounds(period, d) {
  if (period === "week") return weekBounds(d);
  if (period === "year") return yearBounds(d);
  return monthBounds(d);
}

function previousPeriodBounds(period, d) {
  const copy = new Date(d);
  if (period === "week") {
    copy.setDate(copy.getDate() - 7);
    return weekBounds(copy);
  }
  if (period === "year") {
    copy.setFullYear(copy.getFullYear() - 1);
    return yearBounds(copy);
  }
  copy.setMonth(copy.getMonth() - 1);
  return monthBounds(copy);
}

function inRange(tx, start, end) {
  const t = new Date(tx.date + "T12:00:00");
  return t >= start && t <= end;
}

function monthTxs() {
  const { start, end } = monthBounds(state.viewDate);
  return state.transactions.filter((t) => inRange(t, start, end));
}

function monthTotals() {
  const txs = monthTxs();
  const income = txs.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const expense = txs.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  return { income, expense, balance: income - expense };
}

function showToast(msg) {
  const el = document.getElementById("toast");
  el.textContent = msg;
  el.classList.remove("hidden");
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => el.classList.add("hidden"), 1800);
}

function setScreen(name) {
  state.screen = name;
  document.getElementById("screenHome").classList.toggle("hidden", name !== "home");
  document.getElementById("screenAdd").classList.toggle("hidden", name !== "add");
  document.getElementById("screenReport").classList.toggle("hidden", name !== "report");
  if (name === "home") renderHome();
  if (name === "add") renderAdd();
  if (name === "report") renderReport();
}

function relativeTime(dateStr) {
  const d = new Date(dateStr + "T12:00:00");
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const that = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diffDays = Math.round((today - that) / 86400000);
  if (diffDays === 0) return "今天";
  if (diffDays === 1) return "昨天";
  return `${d.getMonth() + 1}月${d.getDate()}日`;
}

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function txTitle(tx) {
  if (tx.note && tx.note.trim()) return tx.note.trim();
  if (tx.desc && tx.desc.trim()) return tx.desc.trim();
  return tx.category;
}

/* ── Home ── */
function renderHome() {
  const d = state.viewDate;
  document.getElementById("homeMonthTitle").textContent = `${d.getFullYear()}年${d.getMonth() + 1}月`;

  const { income, expense, balance } = monthTotals();
  document.getElementById("homeBalance").textContent = fmt(balance);
  document.getElementById("homeIncome").textContent = fmt(income);
  document.getElementById("homeExpense").textContent = fmt(expense);

  const quick = document.getElementById("quickCats");
  quick.innerHTML =
    QUICK_CATS.map((name) => {
      const meta = catMeta(name, "expense");
      return `
        <button type="button" class="quick-cat" data-quick="${name}">
          <span class="quick-cat-icon" style="background:${meta.bg};color:${meta.fg}">${meta.icon}</span>
          <span class="quick-cat-label">${name}</span>
        </button>`;
    }).join("") +
    `
      <button type="button" class="quick-cat" data-quick="更多">
        <span class="quick-cat-icon more">＋</span>
        <span class="quick-cat-label">更多</span>
      </button>`;

  const sorted = [...state.transactions].sort((a, b) => {
    if (a.date === b.date) return b.id - a.id;
    return b.date.localeCompare(a.date);
  });
  const list = state.showAllRecent ? sorted : sorted.slice(0, 5);
  document.getElementById("btnViewAll").textContent = state.showAllRecent ? "收合" : "查看全部";

  const listEl = document.getElementById("recentList");
  if (!list.length) {
    listEl.innerHTML = `<div class="empty-hint">還沒有交易，點下方新增一筆</div>`;
    return;
  }

  listEl.innerHTML = list
    .map((tx) => {
      const meta = catMeta(tx.category, tx.type);
      const sign = tx.type === "income" ? "+" : "-";
      return `
        <div class="tx-item">
          <div class="tx-icon" style="background:${meta.bg}">${meta.icon === "＋" ? "📎" : meta.icon}</div>
          <div>
            <div class="tx-title">${escapeHtml(txTitle(tx))}</div>
            <div class="tx-time">${relativeTime(tx.date)}</div>
          </div>
          <div class="tx-amt ${tx.type}">${sign}${fmt(tx.amount)}</div>
        </div>`;
    })
    .join("");
}

/* ── Add ── */
function openAdd(presetCategory) {
  state.form = {
    type: "expense",
    amountStr: "0",
    category: presetCategory && presetCategory !== "更多" ? presetCategory : "餐飲",
    date: todayStr(),
    note: "",
  };
  setScreen("add");
}

function parseAmount(str) {
  const n = parseFloat(str);
  return Number.isFinite(n) ? n : 0;
}

function formatAmountInput(str) {
  const n = parseAmount(str);
  return fmt(n);
}

function renderAdd() {
  document.querySelectorAll(".seg-btn").forEach((btn) => {
    const t = btn.dataset.type;
    btn.classList.toggle("active", t === state.form.type);
  });

  document.getElementById("addAmountDisplay").textContent = formatAmountInput(state.form.amountStr);
  document.getElementById("addDate").value = state.form.date;
  document.getElementById("addNote").value = state.form.note;

  const cats = state.form.type === "income" ? INCOME_CATS : EXPENSE_CATS;
  const grid = document.getElementById("addCatGrid");
  grid.innerHTML = cats
    .map((c) => {
      const selected = state.form.category === c.id ? "selected" : "";
      const dashed = c.dashed ? "dashed" : "";
      return `
        <button type="button" class="cat-pick ${selected}" data-cat="${c.id}">
          <span class="cat-pick-icon ${dashed}" style="background:${c.dashed ? "transparent" : c.bg};color:${c.fg}">${c.icon}</span>
          <span class="cat-pick-label">${c.id}</span>
        </button>`;
    })
    .join("");
}

function handleKey(key) {
  let s = state.form.amountStr;
  if (key === "ok") {
    saveAdd();
    return;
  }
  if (key === ".") {
    if (!s.includes(".")) state.form.amountStr = s === "" ? "0." : s + ".";
  } else if (/^\d$/.test(key)) {
    if (s === "0") s = key;
    else if (s.includes(".")) {
      const dec = s.split(".")[1] || "";
      if (dec.length >= 2) return;
      s += key;
    } else {
      if (s.length >= 9) return;
      s += key;
    }
    state.form.amountStr = s;
  }
  document.getElementById("addAmountDisplay").textContent = formatAmountInput(state.form.amountStr);
}

function saveAdd() {
  const amount = parseAmount(state.form.amountStr);
  if (!(amount > 0)) {
    showToast("請輸入金額");
    return;
  }
  if (!state.form.category) {
    showToast("請選擇分類");
    return;
  }

  const note = document.getElementById("addNote").value.trim();
  const date = document.getElementById("addDate").value || todayStr();

  state.transactions.push({
    id: Date.now(),
    date,
    desc: state.form.category,
    category: state.form.category,
    type: state.form.type,
    amount,
    account: "現金",
    note: note || undefined,
  });
  saveTransactions();
  state.showAllRecent = false;
  setScreen("home");
  showToast("已儲存");
}

/* ── Report ── */
function expenseBreakdown(txs) {
  const map = {};
  txs
    .filter((t) => t.type === "expense")
    .forEach((t) => {
      map[t.category] = (map[t.category] || 0) + t.amount;
    });
  return Object.entries(map)
    .map(([name, total]) => ({ name, total, meta: catMeta(name, "expense") }))
    .sort((a, b) => b.total - a.total);
}

function renderDonut(items, total) {
  const g = document.getElementById("donutSlices");
  const legend = document.getElementById("donutLegend");
  document.getElementById("donutCenter").textContent = fmt(total);

  if (!total || !items.length) {
    g.innerHTML = "";
    legend.innerHTML = `<span class="empty-hint" style="padding:0">尚無支出資料</span>`;
    return;
  }

  const r = 42;
  const c = 2 * Math.PI * r;
  let offset = 0;
  g.innerHTML = items
    .map((item) => {
      const len = (item.total / total) * c;
      const color = item.meta.chart;
      const html = `<circle cx="60" cy="60" r="${r}" fill="none" stroke="${color}" stroke-width="16"
        stroke-dasharray="${len} ${c - len}" stroke-dashoffset="${-offset}" />`;
      offset += len;
      return html;
    })
    .join("");

  legend.innerHTML = items
    .map((item) => {
      const pct = ((item.total / total) * 100).toFixed(0);
      return `<span class="legend-item"><span class="legend-dot" style="background:${item.meta.chart}"></span>${item.name} ${pct}%</span>`;
    })
    .join("");
}

function renderReport() {
  const d = state.viewDate;
  const period = state.reportPeriod;
  const label =
    period === "week"
      ? "本週報表"
      : period === "year"
        ? `${d.getFullYear()}年報表`
        : `${d.getFullYear()}年${d.getMonth() + 1}月報表`;
  document.getElementById("reportTitle").textContent = label;

  document.querySelectorAll(".period-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.period === period);
  });

  const centerLabel = document.querySelector(".donut-center-label");
  centerLabel.textContent = period === "week" ? "本週支出" : period === "year" ? "本年支出" : "本月支出";

  const { start, end } = periodBounds(period, d);
  const prev = previousPeriodBounds(period, d);
  const txs = state.transactions.filter((t) => inRange(t, start, end));
  const prevTxs = state.transactions.filter((t) => inRange(t, prev.start, prev.end));

  const expense = txs.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const prevExpense = prevTxs.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);

  document.getElementById("reportExpense").textContent = fmt(expense);

  const changeEl = document.getElementById("reportChange");
  if (!prevExpense && !expense) {
    changeEl.textContent = "—";
    changeEl.style.color = "var(--muted)";
  } else if (!prevExpense) {
    changeEl.textContent = "新增";
    changeEl.style.color = "var(--change)";
  } else {
    const pct = ((expense - prevExpense) / prevExpense) * 100;
    const sign = pct > 0 ? "+" : "";
    changeEl.textContent = `${sign}${pct.toFixed(1)}%`;
    changeEl.style.color = pct >= 0 ? "var(--change)" : "var(--income)";
  }

  const items = expenseBreakdown(txs);
  renderDonut(items, expense);

  const list = document.getElementById("reportCatList");
  if (!items.length) {
    list.innerHTML = `<div class="empty-hint">這個區間還沒有支出</div>`;
    return;
  }
  list.innerHTML = items
    .map(
      (item) => `
      <div class="report-cat-row">
        <span class="report-cat-swatch" style="background:${item.meta.chart}"></span>
        <span>${escapeHtml(item.name)}</span>
        <span class="report-cat-amt">${fmt(item.total)}</span>
      </div>`
    )
    .join("");
}

/* ── Events ── */
function bindEvents() {
  document.getElementById("btnOpenAdd").addEventListener("click", () => openAdd());
  document.getElementById("btnOpenReport").addEventListener("click", () => setScreen("report"));
  document.getElementById("btnBackHome").addEventListener("click", () => setScreen("home"));
  document.getElementById("btnCloseAdd").addEventListener("click", () => setScreen("home"));
  document.getElementById("btnSaveAdd").addEventListener("click", saveAdd);

  document.getElementById("btnViewAll").addEventListener("click", () => {
    state.showAllRecent = !state.showAllRecent;
    renderHome();
  });

  document.getElementById("quickCats").addEventListener("click", (e) => {
    const btn = e.target.closest("[data-quick]");
    if (!btn) return;
    openAdd(btn.dataset.quick);
  });

  document.querySelectorAll(".seg-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const t = btn.dataset.type;
      if (t === "transfer") {
        showToast("轉帳功能即將推出");
        return;
      }
      state.form.type = t;
      state.form.category = t === "income" ? INCOME_CATS[0].id : EXPENSE_CATS[0].id;
      renderAdd();
    });
  });

  document.getElementById("addCatGrid").addEventListener("click", (e) => {
    const btn = e.target.closest("[data-cat]");
    if (!btn) return;
    state.form.category = btn.dataset.cat;
    renderAdd();
  });

  document.getElementById("addDate").addEventListener("change", (e) => {
    state.form.date = e.target.value;
  });

  document.getElementById("addNote").addEventListener("input", (e) => {
    state.form.note = e.target.value;
  });

  document.getElementById("keypad").addEventListener("click", (e) => {
    const btn = e.target.closest("[data-key]");
    if (!btn) return;
    handleKey(btn.dataset.key);
  });

  document.getElementById("addAmountDisplay").addEventListener("click", () => {
    state.form.amountStr = "0";
    document.getElementById("addAmountDisplay").textContent = formatAmountInput("0");
  });

  document.querySelectorAll(".period-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.reportPeriod = btn.dataset.period;
      renderReport();
    });
  });
}

bindEvents();
setScreen("home");
