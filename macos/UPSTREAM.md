# 上游 0.7.0 與 Mac 維護基準

2026-11-06 核對 [PR #7](https://github.com/fengye337/sandrone-codex/pull/7) 已合併；貢獻提交 `bddd653b541b1ab064dba6686651b1aa7f2602a0` 由 merge `3010a498379e609977274ea62cda562b47c50fef` 保留。`v0.7.0^{commit}` 與 fetch 的 `upstream/main` 均為 `3a4f2cb11c82269b155d8b75be212432e088bd52`，兩者無差異。

本次維護分支 `macos/0.7.0-regression` 直接從該上游基準建立，沒有再 cherry-pick PR #7，也沒有合併 fork 的開發／研究歷史。原 worktree、`macos/original-engine-integration`、未追蹤的提案草稿及舊包均保留。Fork 的 main 不是本次基準，也不會被改寫。

- 上游：https://github.com/fengye337/sandrone-codex
- Fork：https://github.com/teddy7286317/sandrone-codex-Mac-Dev
- 完整版：`Build-Mac.command` → `macos/build.mjs` → Cocoa → `engine/macos-skin.mjs`。
- 靜態版：`Build-Mac-Static.command` → #6 AppleScript → `macos/static/macos-skin.mjs`。本輪抽出原 renderer 供測試，沒有改其 selector、色彩或版面公式。靜態版不作完整版的自動失敗備援，不同時運行。
- 新包標示 upstream `0.7.0`、base `3a4f2cb`、Mac adapter `0.3.5`、`full`／`static`；metadata 保存在 `upstream.json` 與各包 `build-manifest.json`。這是本地回歸包，不是新的上游 Release。

相對 v0.7.0，本輪保持 `engine/cdp.mjs`、原版 renderer／opening-client／native-ui.css、主題、素材與 vendor 不變。Mac 完整版繼續呼叫 `loadPayload`／`verifySession` 與 `prepareOpening`／`showOpening`／`releaseOpening`。`macos-controls.css` 的局部修正保留，撤回的 `macos-theme.css` 維持停用。

共用 CDP 在已合併 #7 中增加可選 port、flattened 子 session 命令及事件的 sessionId；預設 port 仍為 Windows 的 19337，舊 `Session(url)`／`send` 呼叫不變。新版 Node 與隔離 Chrome 回歸驗證其契約，不代表已執行 Windows 官方客戶端實機測試。本輪不改此共用模組。

原版 Windows 原生附加包的早期 preload、local-video 與 0.7.0 視窗比例修正，不等於 Mac 外部載入器已有相同入口。既有隔離回歸可重跑，但不重新研究或優化早期載入。baseline 預設、輪詢間隔、動畫長度及失敗撤回保留；主題與開屏稍晚載入、官方圖示不自動套用等限制不變。

來源署名見 [PR6-SOURCE.md](PR6-SOURCE.md)，完整核對與本輪回歸見 [REGRESSION-0.7.0.md](REGRESSION-0.7.0.md)。程式 MIT／vendor MIT 與角色素材權利分開處理；保留 LICENSE、ASSET-LICENSE、THIRD-PARTY-NOTICES，不將程式授權當成第三方美術再授權。本次沒有分發官方程式或登入資料，沒有修改或重簽已安裝的 ChatGPT。
