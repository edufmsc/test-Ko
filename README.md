# AI Learning System 純前端版

## 開啟與建立新網站
1. 解壓縮，保留資料夾內所有檔案的相對位置。
2. 以瀏覽器開啟 index.html 可預覽；完整跨頁儲存建議使用靜態網站伺服器。
3. 建立新的程式碼儲存庫，將本資料夾內的檔案上傳至網站根目錄，入口為 index.html。
4. 不需安裝套件、建置、登入設定、API 金鑰或後端。

## 保留功能
原有版面與響應式排版、20 天學習計畫、每日勾選與打卡、累積計時與浮動計時器、成果儲存與歷史補登、作品集、能力報告、教材新增／刪除／輪播、側邊導航及回頂端。
課程文字仍保留原本內容；課名中的 Apps Script、Google Workspace 等只是教材主題，沒有執行串接。

## 已移除
Google 登入 SDK、Client ID、憑證解析、登入／登出流程，以及 YouTube、Vimeo、Google Drive 嵌入和遠端影片自動載入。
原始專案未發現資料庫連線、API 請求或後端程式。

## 資料與使用範圍
所有學習紀錄與新增教材只存在目前瀏覽器的 localStorage；不會上傳、同步或區分登入帳號。清除網站資料會清空紀錄，不同裝置不會共用。
使用獨立儲存前綴，不讀取舊網站的帳號紀錄。壓縮檔不含使用者學習紀錄。
教材與作品可保存使用者自行輸入的網址，但只在手動點選時開啟，不嵌入外部服務。
能力報告依課程完成度在前端計算，未呼叫 AI 服務。

## 檔案
- index.html / system.css：主頁與樣式
- app.js：課程資料及主要互動
- config.js：本機儲存名稱
- result.html / result.js：成果明細及補登
- timer-persistence.js：計時及本機保存
- course-materials.js：各天教材清單（目前皆空白）
- ui-enhancements.js：教材輪播及介面互動
- roadmap-results.js / learning-sidebar.js / scroll-offset-fix.js：成果連結、導航與捲動
