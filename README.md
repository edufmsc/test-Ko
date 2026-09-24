# 個人 AI 學習平台

GitHub Pages 提供登入後的課程首頁與學習頁；Apps Script 網頁應用程式負責登入操作紀錄、學習資料讀寫及教材清單。跨裝置紀錄依同一個 Email 識別。

## 網頁入口

- `index.html`：Google 登入及課程首頁，左側列出課程入口。
- `course.html`：既有的 AI 工作應用 20 天計畫，包含每日任務、教材、打卡、計時、成果、作品集及報告；側欄可返回課程首頁。
- `result.html`：既有的 DAY 成果與歷史補登，返回時會進入 `course.html#roadmap`。

從首頁進入課程時，沿用同一分頁的登入狀態；直接開啟課程網址也可使用 Google 帳號登入。首頁讀取學習摘要，Apps Script 仍會記錄登入操作；首頁不修改學習紀錄。課程頁仍使用原本的 `sync.js` 及 `result-sync.js` 進行儲存。

## 設定與部署

在 `config.js` 填入網頁用 Google OAuth 用戶端 ID 與 Apps Script 網頁應用程式 `/exec` 網址。GitHub Pages 發佈目錄須包含本專案所有檔案，並以 `index.html` 為入口。Apps Script 部署、試算表與既有資料不需因這次頁面調整而搬移或重建。

## 未來增加課程

1. 新增一個獨立課程頁面（例如 `course-data.html`）及它需要的教材腳本。
2. 在 `index.html` 的左側課程列表及課程卡片加入該頁連結。
3. 若新課程需要獨立進度與教材，在 Apps Script 規劃課程 ID 與資料分隔；不要把不同課程寫進目前 20 天計畫的相同紀錄欄位。

目前的「更多 AI 課程」是規劃中卡片，不會建立或儲存新課程的紀錄。現有簡化版登入依網頁傳來的 Email 識別學員。
