# 帳本 · Expense Tracking App

純 HTML／CSS／JavaScript 記帳 App（iPhone 17 Pro Max 風格面板：首頁／新增交易／月報表）。

## 功能

- 首頁：本月結餘、快捷分類、最近交易
- 新增交易：支出／收入、分類、數字鍵盤（轉帳僅 UI）
- 月報表：週／月／年、甜甜圈圖、分類明細
- 資料存在瀏覽器 `localStorage`（`expense-tracking-app-v3`）

## UI

- 桌面預覽為 **iPhone 17 Pro Max** 機框（440×956）：Dynamic Island、狀態列、側鍵、Home Indicator
- 毛玻璃面板、系統色分段控制、畫面滑入／縮放轉場與按壓回饋

## 使用方式

```bash
python -m http.server 3458
```

開啟 [http://localhost:3458](http://localhost:3458)。電腦會以 440×956 的 17 Pro Max 框預覽；窄螢幕則全螢幕顯示。
