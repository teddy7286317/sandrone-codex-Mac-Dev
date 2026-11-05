# 本輪接續狀態（2026-11-05）

目前工作樹為真正 fork 的 `SandroneCodex-Mac`，分支 `macos/original-engine-integration`，保留上游歷史。`origin/main` 與已 fetch 的 `upstream/main` 均為 `dfea82e39d9d4a42524dc9eed3d61204254d0d3a`。舊 `SandroneCodex-Source` 保留，未從它複製舊引擎蓋過新版。

本輪已完成離線程式整合：原版 loadPayload / verifySession、opening-client 分塊準備／快取／顯示／釋放、Mac 正常 header 排列的重播按鈕、Cocoa 打包、獨立離線合成頁與手動診斷。原版 renderer / opening-client / native-ui.css / assets / vendor / theme 均未修改。撤回的 macos-theme.css 維持停用，程式不載入。

代理未啟動、退出、連線或截取受限 ChatGPT 介面；所有瀏覽器測試使用獨立 headless Chrome 與合成頁面。`macos/audit-current.mjs`、正式載入器與控制命令必須由使用者手動執行。不要用它們繞過 Computer Use 限制。

本輪使用者實機回報：對話畫面與輸入框可讀，開屏重播、停用及重新啟用均正常。這四項記為使用者實機確認通過；未附畫面、診斷檔或量測數據，不推定首頁、設定、選單、程式碼、窄視窗、普通啟動、跳過、資源釋放或效能已驗收。代理未存取受限介面。

最新測試及限制見 [macos/VALIDATION.md](macos/VALIDATION.md)，手動步驟見 [macos/README.md](macos/README.md)，上游差異見 [macos/UPSTREAM.md](macos/UPSTREAM.md)。**僅部分實機驗收通過；其餘項目仍待測，不得宣稱全面通過或完整移植已完成。**

最新追加：使用者確認首頁其他區域與窄視窗對話可讀性可接受，但 Chat／Work 切換鈕白底淺字。0.3.1 以唯讀封裝原始碼定位並新增局部樣式，實機修正效果仍待驗收；設定、模型選單與 `.app` 自動開屏繼續待測。參見 [macos/HOME-MODE-TOGGLE.md](macos/HOME-MODE-TOGGLE.md)。原版引擎及撤回 CSS 保持不動。

以下為歷史交接，描述的是舊來源目錄當時的狀態；若與上述狀態不同，以本輪文件為準。

---

# Sandrone Codex macOS 開發交接

## 使用者目標與授權

在此資料夾開發完整的 Sandrone Codex macOS 移植。Fork：https://github.com/teddy7286317/sandrone-codex-Mac-Dev 。階段性成果驗證後推送 fork，未授權向上游送 PR 或留言。使用者現在轉到 Codex CLI 繼續。

目標是原版完整黑金主題與同窗開屏，不是單張透明圖覆蓋。包含人物描邊、齒輪水紋、逐筆手簽、同步影片、跳過、重播、原版文案、右側立繪、透明工具列、黑金側欄、象牙白文字與深藍輸入框，並涵蓋設定／選單／程式碼等可讀性。新上游媒體快取／暫停／停用釋放行為也要核對。

## 真實環境

- macOS arm64，Node.js 24.5.0，Codex CLI 已安裝於 /opt/homebrew/bin/codex。
- 使用者一直使用 ChatGPT Work，不需要另找 Codex.app。
- 實際應用：/Applications/ChatGPT.app，CFBundleIdentifier=com.openai.codex，版本 26.1027.30824。
- Framework 為 Codex Framework.framework。官方 app.asar 只可讀取研究，不修改官方安裝、簽名與系統防護。
- Work 工具網路限制曾使 GitHub DNS 失敗，連本機除錯介面也回報 EPERM。CLI 是否有同樣限制要實測，不能保證無限制。

## 目前狀態：不是完成品

原始來源為父資料夾的 SandroneCodex-0.6.1-Sandrone-Source.zip。此資料夾尚無 .git。不可直接初始化一份無上游歷史的倉庫後當成 fork 推送。先備份自有改動、克隆真正 fork 到同一 SandroneCodex 開發範圍內，再選擇性搬入變更並保留上游歷史、授權與來源。

1. 0.1.0～0.1.2 使用 PR #6 的前景圖片覆蓋層。0.1.2 能顯示，但造成灰白薄霧，使用者不接受。
2. 0.2.0 自寫 CSS 配色失敗：文字變淺，實際聊天區／輸入框依然白色。已明確撤回。engine/macos-theme.css 目前只有停用註解，請勿恢復有問題的樣式。研究副本為 macos/research/theme-0.2.0-unverified.css。
3. 0.2.0 正在運行的載入器約每 3 秒讀取專案 CSS，可即時更新。只支援 CSS 更新，JS 更新仍需重新啟動或實作經身分校驗的重新連接。
4. 新增 engine/macos-upstream.mjs，重新使用原版 loadPayload、verifySession、native-ui.css、openingAssets、showOpening。包含主區域匹配前檢查與失敗撤回。目前未接入日常載入器，未完成實機套用。
5. 最近 JavaScript 測試 17/17 通過，僅證明程式測試通過，不能宣稱真實畫面驗收成功。
6. 未提交、未推送 GitHub。

## 最新實機診斷，使用者已執行

讀 logs/upstream-surface-audit.json。主 target 的原版契約：shell-main、left-panel、header-tint 各 count=1、visible=1，主區域為白底深字。第二個輔助 target 三者皆未匹配，應跳過，不能盲目套用所有 app: 頁面。version=null 表示目前未套原版 Dream Skin。

這份結果證明三個錨點存在，但尚未驗證 composer、訊息、設定頁及其他路由。必須繼續實測，不能因此推論全面相容。

## 重要檔案

- engine/macos-upstream.mjs：原版引擎適配草案。
- engine/session.mjs、target-runner.mjs：原版 Windows 啟動後 renderer 運作方式可參考。
- vendor/dream-skin/windows/scripts/injector.mjs：原版 loadPayload / verifySession。
- vendor/dream-skin/windows/assets/selectors.json：包含實測 Mac 選擇器契約，優先使用。
- engine/renderer.mjs、assets.mjs、native-ui.css：原版動畫與素材驗證。
- engine/macos-skin.mjs：目前本地啟動／監看／CSS 更新／診斷紀錄。
- macos/audit-current.command、audit-current.mjs：使用最近啟動紀錄與 lsof 身分核對做唯讀審查，不收聊天正文。
- macos/Launcher.m、Build-Mac.command：原生 Cocoa 啟動器，產物目前 dist/Sandrone-ChatGPT-0.2.0.app。
- macos/PR6-SOURCE.md：PR #6 原作者與改編記錄。並非已 cherry-pick 該 commit。
- logs/macos-skin.jsonl：啟動與幾何／CSS 狀態診斷，不提交。

## 建議接續步驟

1. 先讀上述診斷、適配器與原版引擎。確認當前程序仍是最近啟動紀錄的程序，禁止強制退出使用者 ChatGPT。
2. 唯讀檢查原版完整契約在真實首頁、thread、composer 的匹配與實際背景來源，不抓取聊天正文／輸入值。
3. 先做可撤回的原版主題套用與 verifySession。檢查白底淺字問題、輸入框、正文、選單、設定及窄視窗。失敗撤回，不能只以元素存在視為完成。
4. 視覺驗收通過後再接入開屏與 Mac 重播入口。不要直接沿用 Windows 右上角 WCO 視窗按鈕幾何。
5. 從 GitHub 取回目前上游（本機來源是 0.6.1），核對 docs/OPENING-PERFORMANCE.zh-CN.md。舊 renderer 開屏結束釋放媒體，與使用者指定的新版快取行為不同。不能宣稱已完成新版需求。
6. 整理功能驗收表與實測證據，通過階段後提交、推送 fork；不提交 profile/state/logs/dist/帳號或官方應用資源。

## 2026-11-05 CLI 接續核對

- 已完整閱讀本交接，重新執行 JavaScript 測試 17/17 通過；doctor 與 `macos-skin.mjs --check` 通過，未啟動或退出 ChatGPT，未套用任何主題。
- `engine/macos-theme.css` 仍只有停用註解；未恢復撤回的 0.2.0 配色。
- 真實介面檢查遭 Computer Use 工具明確拒絕：`Computer Use is not allowed to use the app 'com.openai.codex' for safety reasons.` 本輪未改走 CDP、截圖命令或其他管道繞過此限制，也未執行 audit-current。
- 原始碼核對：`Build-Mac.command` 仍僅打包靜態背景載入器；`installNativeUi` 的重播入口位於 Windows WCO 分支，Mac 入口尚缺；舊 `showOpening` 的 clearMedia / stopSourceTrace 仍移除影片 src，未達新版快取要求。這些均不是已修復項目。
- 已獲網路命令授權並開始將真正 fork 克隆到同層 `../SandroneCodex-Mac`。克隆完成前不得視作可用工作樹，亦未搬入本地變更或推送。原始來源資料夾保留不動。
- 下一步仍須先取得允許存取真實介面的環境或使用者提供的實機驗收證據，再進行原版主題試套與視覺驗收；不能以本輪測試宣稱完整 macOS 移植完成。

## 檢查指令

```sh
node --test tests/*.test.mjs
node macos/doctor.mjs
node engine/macos-skin.mjs --check
```

Build-Mac.command 不覆蓋已存在產物；先自行安排新的版本輸出位置。不要在尚未視覺驗證時再叫使用者重啟「完成版」。
