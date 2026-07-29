const INCOME_CATS = ["薪資", "兼職", "投資", "其他收入"];
const EXPENSE_CATS = ["餐飲", "交通", "購物", "住房", "娛樂", "醫療", "教育", "其他支出"];

const CAT_ICONS = {
  薪資: "💼",
  兼職: "🖥️",
  投資: "📈",
  其他收入: "💰",
  餐飲: "🍜",
  交通: "🚇",
  購物: "🛍️",
  住房: "🏠",
  娛樂: "🎬",
  醫療: "💊",
  教育: "📚",
  其他支出: "📎",
};

const SEED = [
  { id: 1, date: "2025-07-01", desc: "七月薪資", category: "薪資", type: "income", amount: 65000 },
  { id: 2, date: "2025-07-02", desc: "捷運月票", category: "交通", type: "expense", amount: 1200 },
  { id: 3, date: "2025-07-03", desc: "超市採購", category: "餐飲", type: "expense", amount: 2340 },
  { id: 4, date: "2025-07-05", desc: "Freelance 案件", category: "兼職", type: "income", amount: 12000 },
  { id: 5, date: "2025-07-07", desc: "網飛訂閱", category: "娛樂", type: "expense", amount: 390 },
  { id: 6, date: "2025-07-08", desc: "房租", category: "住房", type: "expense", amount: 18000 },
  { id: 7, date: "2025-07-10", desc: "午餐便當 ×20", category: "餐飲", type: "expense", amount: 1800 },
  { id: 8, date: "2025-07-12", desc: "股票股利", category: "投資", type: "income", amount: 4200 },
  { id: 9, date: "2025-07-14", desc: "健身房會費", category: "醫療", type: "expense", amount: 1500 },
  { id: 10, date: "2025-07-15", desc: "UNIQLO 購物", category: "購物", type: "expense", amount: 3890 },
  { id: 11, date: "2025-07-18", desc: "線上課程", category: "教育", type: "expense", amount: 2500 },
  { id: 12, date: "2025-07-20", desc: "朋友聚餐", category: "餐飲", type: "expense", amount: 1650 },
  { id: 13, date: "2025-07-22", desc: "Uber 計程車", category: "交通", type: "expense", amount: 280 },
  { id: 14, date: "2025-07-25", desc: "保險費", category: "其他支出", type: "expense", amount: 5400 },
  { id: 15, date: "2025-07-28", desc: "接案尾款", category: "兼職", type: "income", amount: 8000 },
];

const STORAGE_KEY = "expense-tracking-app-v1";

const state = {
  transactions: loadTransactions(),
  tab: "ledger",
  filterType: "all",
  formType: "expense",
};

function loadTransactions() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length) return parsed;
    }
  } catch (_) {
    /* ignore */
  }
  return structuredClone(SEED);
}

function saveTransactions() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.transactions));
}

function fmt(n) {
  return new Intl.NumberFormat("zh-TW", {
    style: "currency",
    currency: "TWD",
    minimumFractionDigits: 0,
  }).format(n);
}

function fmtDate(s) {
  const d = new Date(s);
  return `${d.getMonth() + 1}/${String(d.getDate()).padStart(2, "0")}`;
}

function totals() {
  const totalIncome = state.transactions
    .filter((t) => t.type === "income")
    .reduce((s, t) => s + t.amount, 0);
  const totalExpense = state.transactions
    .filter((t) => t.type === "expense")
    .reduce((s, t) => s + t.amount, 0);
  return {
    totalIncome,
    totalExpense,
    balance: totalIncome - totalExpense,
  };
}

function filteredTransactions() {
  return state.transactions
    .filter((t) => state.filterType === "all" || t.type === state.filterType)
    .sort((a, b) => b.date.localeCompare(a.date));
}

function renderSummaryBanner() {
  const { totalIncome, totalExpense, balance } = totals();
  const balanceEl = document.getElementById("balanceValue");
  balanceEl.textContent = fmt(balance);
  balanceEl.style.color = balance >= 0 ? "var(--income)" : "var(--expense)";
  document.getElementById("incomeValue").textContent = fmt(totalIncome);
  document.getElementById("expenseValue").textContent = fmt(totalExpense);
}

function renderLedger() {
  const rows = filteredTransactions();
  document.getElementById("txCount").textContent = `${rows.length} 筆`;

  const body = document.getElementById("ledgerBody");
  body.innerHTML = rows
    .map((tx) => {
      const sign = tx.type === "income" ? "+" : "-";
      const amountText = `${sign}${fmt(tx.amount).replace("NT$", "").replace("$", "")}`;
      const color = tx.type === "income" ? "income" : "expense";
      return `
        <div class="tx-row" data-id="${tx.id}">
          <span class="tx-date">${fmtDate(tx.date)}</span>
          <div>
            <div class="tx-desc">${escapeHtml(tx.desc)}</div>
          </div>
          <div class="tx-cat">
            <span class="tx-cat-icon">${CAT_ICONS[tx.category] || ""}</span>
            <span class="tx-cat-name">${escapeHtml(tx.category)}</span>
          </div>
          <div class="tx-amount ${color}">${amountText}</div>
          <button type="button" class="tx-delete" data-delete="${tx.id}" aria-label="刪除">×</button>
        </div>
      `;
    })
    .join("");
}

function renderAnalysis() {
  const { totalIncome, totalExpense, balance } = totals();
  const sum = totalIncome + totalExpense || 1;
  const incomePct = ((totalIncome / sum) * 100).toFixed(1);
  const expensePct = ((totalExpense / sum) * 100).toFixed(1);

  document.getElementById("ratioBar").innerHTML = `
    <div class="ratio-seg income" style="width:${incomePct}%">收入 ${incomePct}%</div>
    <div class="ratio-seg expense">支出 ${expensePct}%</div>
  `;
  document.getElementById("ratioIncome").textContent = fmt(totalIncome);
  document.getElementById("ratioExpense").textContent = fmt(totalExpense);

  const map = {};
  state.transactions.forEach((t) => {
    map[t.category] = (map[t.category] ?? 0) + t.amount;
  });
  const catTotals = Object.entries(map).sort((a, b) => b[1] - a[1]);
  const max = catTotals[0]?.[1] || 1;

  document.getElementById("catList").innerHTML = catTotals
    .map(([cat, total]) => {
      const isIncome = INCOME_CATS.includes(cat);
      const color = isIncome ? "var(--income)" : "var(--accent)";
      const width = (total / max) * 100;
      return `
        <div class="cat-row">
          <div class="cat-name">
            <span>${CAT_ICONS[cat] || ""}</span>
            <span>${escapeHtml(cat)}</span>
          </div>
          <div class="cat-bar">
            <div class="cat-bar-fill" style="width:${width}%;background:${color}"></div>
          </div>
          <span class="cat-total" style="color:${isIncome ? "var(--income)" : "var(--expense)"}">${fmt(total)}</span>
        </div>
      `;
    })
    .join("");

  const rate = totalIncome ? ((balance / totalIncome) * 100).toFixed(1) : "0.0";
  const savingsEl = document.getElementById("savingsRate");
  savingsEl.textContent = `${rate}%`;
  savingsEl.style.color = balance >= 0 ? "var(--income)" : "var(--expense)";
  document.getElementById("savingsNote").textContent =
    balance >= 0 ? `節省了 ${fmt(balance)}` : `超支 ${fmt(Math.abs(balance))}`;

  const incomeCount = state.transactions.filter((t) => t.type === "income").length;
  const expenseCount = state.transactions.filter((t) => t.type === "expense").length;
  document.getElementById("txTotal").textContent = String(state.transactions.length);
  document.getElementById("txBreakdown").textContent = `收入 ${incomeCount} 筆 · 支出 ${expenseCount} 筆`;
}

function render() {
  renderSummaryBanner();
  if (state.tab === "ledger") {
    document.getElementById("panelLedger").classList.remove("hidden");
    document.getElementById("panelSummary").classList.add("hidden");
    renderLedger();
  } else {
    document.getElementById("panelLedger").classList.add("hidden");
    document.getElementById("panelSummary").classList.remove("hidden");
    renderAnalysis();
  }
}

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function fillCategories() {
  const cats = state.formType === "income" ? INCOME_CATS : EXPENSE_CATS;
  const select = document.getElementById("formCategory");
  select.innerHTML = cats
    .map((c) => `<option value="${c}">${CAT_ICONS[c]} ${c}</option>`)
    .join("");
}

function openModal() {
  state.formType = "expense";
  document.getElementById("formDate").value = new Date().toISOString().slice(0, 10);
  document.getElementById("formDesc").value = "";
  document.getElementById("formAmount").value = "";
  document.querySelectorAll(".type-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.type === "expense");
    btn.classList.toggle("expense", btn.dataset.type === "expense");
    btn.classList.toggle("income", btn.dataset.type === "income");
  });
  fillCategories();
  document.getElementById("modal").classList.remove("hidden");
}

function closeModal() {
  document.getElementById("modal").classList.add("hidden");
}

function addTransaction() {
  const desc = document.getElementById("formDesc").value.trim();
  const amountRaw = document.getElementById("formAmount").value;
  const amount = parseInt(amountRaw, 10);
  if (!desc || !amount || amount <= 0) return;

  state.transactions.push({
    id: Date.now(),
    date: document.getElementById("formDate").value,
    desc,
    category: document.getElementById("formCategory").value,
    type: state.formType,
    amount,
  });
  saveTransactions();
  closeModal();
  render();
}

function deleteTransaction(id) {
  state.transactions = state.transactions.filter((t) => t.id !== id);
  saveTransactions();
  render();
}

function bindEvents() {
  document.querySelectorAll(".tab-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.tab = btn.dataset.tab;
      document.querySelectorAll(".tab-btn").forEach((b) => b.classList.toggle("active", b === btn));
      render();
    });
  });

  document.querySelectorAll(".filter-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.filterType = btn.dataset.filter;
      document.querySelectorAll(".filter-btn").forEach((b) => b.classList.toggle("active", b === btn));
      renderLedger();
    });
  });

  document.getElementById("btnOpenModal").addEventListener("click", openModal);
  document.getElementById("btnCancel").addEventListener("click", closeModal);
  document.getElementById("btnConfirm").addEventListener("click", addTransaction);

  document.getElementById("modal").addEventListener("click", (e) => {
    if (e.target.id === "modal") closeModal();
  });

  document.querySelectorAll(".type-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.formType = btn.dataset.type;
      document.querySelectorAll(".type-btn").forEach((b) => {
        b.classList.toggle("active", b === btn);
      });
      fillCategories();
    });
  });

  document.getElementById("ledgerBody").addEventListener("click", (e) => {
    const btn = e.target.closest("[data-delete]");
    if (!btn) return;
    deleteTransaction(Number(btn.dataset.delete));
  });
}

bindEvents();
render();
