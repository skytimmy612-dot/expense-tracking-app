# 帳本 · Expense Tracking App

純 HTML／CSS／JavaScript 記帳 App，依 [Figma Make：Expense-Tracking-App](https://www.figma.com/make/gK6Nr7TM6GI8f0WwBnHDjD/Expense-Tracking-App) 實作。

## 功能

- 明細列表：全部／收入／支出篩選
- 本月結餘、收入、支出摘要
- 分析頁：收支比例、分類明細、儲蓄率
- 新增／刪除記帳（資料存在瀏覽器 `localStorage`）

## 檔案結構

```
記帳App/
├── index.html   # 頁面結構
├── styles.css   # 樣式
└── app.js       # 邏輯與資料
```

## 使用方式

用瀏覽器直接開啟 `index.html`，或在專案目錄啟動本機伺服器：

```bash
python -m http.server 3457
```

然後開啟 [http://localhost:3457](http://localhost:3457)。

## 技術說明

- 無框架：原生 HTML + CSS + JS
- 字型：DM Serif Display、Outfit、JetBrains Mono（Google Fonts）
- 資料：預設為空帳本；新增後會寫入 `localStorage`（key：`expense-tracking-app-v2`）
