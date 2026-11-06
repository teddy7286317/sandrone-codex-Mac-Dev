# 0.7.0 基準 Mac 同步與回歸

日期：2026-11-06。分支 `macos/0.7.0-regression`；上游基準 `3a4f2cb11c82269b155d8b75be212432e088bd52`，Mac adapter 0.3.5。本文件記錄本次程式／隔離驗證；**新版真實介面結果尚未取得**，不繼承舊版通過狀態。

## 基準關係與保留措施

| 項目 | 證據 |
|---|---|
| PR #7 已合併 | GitHub merged=true；merge `3010a498379e609977274ea62cda562b47c50fef`，保留 `bddd653b541b1ab064dba6686651b1aa7f2602a0` 作第二 parent |
| v0.7.0／最新 fetch main | 同為 `3a4f2cb11c82269b155d8b75be212432e088bd52`；`git diff v0.7.0 upstream/main` 為空 |
| PR #7 merge → release | 1 個 release commit；27 檔變更，含 #6 靜態入口搬至 macos/static、POSIX launch-plan、Mac／發行文件，另有 Windows 自動適配與 native 開屏比例修正 |
| 本維護分支 | 從上游 main 建立新 worktree；不 cherry-pick 已合併提交，不合併研究／fork 首頁歷史 |
| 原本地成果 | 原 worktree 停在 `34a80e0146188a1d33bdff1c083390725cb7bbb0`，未追蹤 CONTRIBUTION-PROPOSAL.md 和全部舊 .app 保留；保留清單在原 worktree 的 ignored dist/maintenance-0.7.0-preservation.json |

原 main／公開開發分支沒有重寫，不 force push。新分支只推至 fork；本輪不留言、不建立 PR、不合併 main、不發布 Release。

## 入口與整合核對

- 完整版：Build-Mac.command → macos/build.mjs → Cocoa Dock → engine/macos-skin.mjs。仍預設 baseline、原版 payload／verifier／player；撤回 CSS、主題延遲與手動退出規則不變。
- 靜態版：Build-Mac-Static.command → #6 AppleScript → macos/static/macos-skin.mjs。與完整版分開，保留 #6 姓名、提交及獨立 bundle ID；不把靜態覆蓋層當完整版的錯誤備援。
- 共用 CDP：維護分支沒有改 engine/cdp.mjs；已合併改動包括可選動態 port、sendTo／flattened session 與事件 sessionId，Windows 預設 19337／舊呼叫方式保留。Node 契約與實際隔離 Chrome 路由已覆蓋，無 Windows 官方客戶端實機結果。
- 資源：完整版包含 renderer／opening-client／主題／媒體／vendor／來源與授權；不包含 static runtime、研究、測試、官方 ASAR／原生模組、profile、state、logs。靜態包包含原背景、自己的程式、建置圖示、來源／授權與 SHA256 receipts，沒有官方程序或帳號。
- 授權：保留根 MIT、vendor MIT 與固定 SOURCE.json，並攜帶素材權利說明。程式 MIT 不提供角色圖片／影片的額外再授權；沒有發布美術包或新的 Release。

## 定位與修正

1. #6 的既有 tests/macos-skin.test.mjs 在入口搬移後仍匯入完整版 helper；已改為真正測 macos/static 的實作。
2. 靜態建置原先固定安裝至 ~/Applications，且缺少獨立來源／授權資源。新增 --output 和可選 --icon；回歸包只寫入新 worktree 的 dist，不安裝到使用者 Applications。先保留既有目標，再拒絕覆蓋；附授權、素材權利、#6 來源、upstream 身份與資源 SHA256。
3. 靜態 renderer 從原字串抽成可測函式，selector、CSS、佈局公式不變。新增真實函式的合成頁測試，未猜測新 selector，也沒有回復完整版撤回配色。
4. 兩種包原先不足以區分上游基準。現在名稱／manifest 明列 upstream 0.7.0、3a4f2cb、Mac 0.3.5 及 full/static，舊包保留。
5. 新 worktree 首次跑 macos.browser 時缺少生成的離線預覽；執行 node macos/build-preview.mjs 後回歸通過。這是測試前置產物，沒有因此更改客戶端 selector。

## 本次程式／隔離結果

- Node：75/75 通過；包含 Windows 預設 CDP、動態 port／flattened session、Mac 身份篩選、停用／撤回／取消、Cocoa 通道、素材等測試。
- Chrome 156.0.8078.80：完整版 Mac、Chat／Work、#6 靜態 renderer、原版 opening、既有 startup/CDP fixture、上游 native startup IPC 適配器與六種視窗比例回歸通過。既有 early-document fixture 只是回歸，沒有調整或推定實機 early 成功。
- 原版 opening：首播 73 次傳輸，最大 expression 262343 字元；重播 3 次、最大 422 字元。此為隔離 fixture，不能當成官方啟動效能或穩定幀率。
- Cocoa：五種假子程序情境通過：正常控制、Node 缺失、子程序失敗、清理未確認、退出清理未確認；實際 Dock／Finder／ChatGPT 仍待使用者操作。
- 建置：完整版 arm64／靜態版 AppleScript 編譯、資源／授權檢查、靜態包拒絕覆蓋及兩包 codesign --verify --deep --strict 均通過。僅簽署自有產物，未執行生成的包或修改官方簽名。

重跑順序：

```sh
node --test tests/*.test.mjs
node macos/build-preview.mjs
node engine/macos-skin.mjs --check
# 瀏覽器測試需自行準備 Playwright Core 與獨立 Chrome，設定 PLAYWRIGHT_MODULE／CHROMIUM_EXECUTABLE
node tests/macos.browser.mjs
node tests/macos-mode-toggle.browser.mjs
node tests/macos-static.browser.mjs
node tests/opening.browser.mjs
node tests/macos-startup.browser.mjs
node tests/native-startup.browser.mjs
node tests/startup-window.browser.mjs
node tests/macos-launcher.cocoa.mjs
zsh Build-Mac.command
node tests/macos-bundle.mjs
node tests/macos-static-build.mjs
```

最後一項只編譯與檢查 AppleScript 靜態包，不執行它；需先有完整包的自有 .icns 作測試輸入。所有程序測試不連線受限 ChatGPT、不修改或重簽官方包、不關閉防護。本地 Mac 包使用臨時簽名、Node 仍為外部依賴；未 Apple 公證。

歷史回報與新版待驗收分開見 [VALIDATION.md](VALIDATION.md)。可貼上手動步驟見 [QUICK-ACCEPTANCE.md](QUICK-ACCEPTANCE.md)，給上游的報告草稿見 [UPSTREAM-REPORT.md](UPSTREAM-REPORT.md)，不自動送出。
