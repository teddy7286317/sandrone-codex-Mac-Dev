# Mac 早期載入：研究結論與隔離原型

2026-11-05～06；**研究用，沒有新版本或可安裝附加包**。保留 0.3.1 已獲使用者確認的修正與現有 0.3.3 診斷包；baseline 及 `--early-document` 原始碼、原版引擎、主題與素材均未改，early 優化暫停。沒有操作或連線受限應用、修改 ChatGPT 安裝、讀取登入資料或關閉系統防護。

**在本輪限制下，尚無可可靠重現 Windows 原生版普通啟動體驗的 Mac 整合入口。** Mac Electron 具備 session preload 與本地影片能力；缺的是官方主程序在首次導航前載入我們程式的可用契約。獨立原型證明前兩者，不證明第三者。外部 CDP 或獨立開屏視窗都不能宣稱等效。

## 研究基準與可追溯證據

- 上游 `main` 經 `git ls-remote` 唯讀確認仍是 `dfea82e39d9d4a42524dc9eed3d61204254d0d3a`；未 fetch 合併任何變更。以下上游連結固定到該 commit。
- 本地產品基準 `4e349a85a476db30da115c90dab52edb7f840b0b`，Mac ChatGPT 封裝 metadata 為 `26.1027.30824`、arm64；不將 Chromium framework 版本誤作 Electron 版本。
- [靜態證據](evidence/installed-static.json)：ASAR／framework／Sparkle SHA256、ASAR header hash、fuse bytes、封裝原始碼的 **UTF-8 byte offset**、resource seal 與簽名查驗結果。只提交識別值及位置，沒有官方程式碼副本。
- [隔離原型結果](evidence/prototype.json)：獨立 Electron 45.2.3／Chromium 156.0.8078.80／Node 24.22.2 的實際 session API、IPC、影片與反向對照結果，附原型和上游來源雜湊。沒有官方登入／app-server，沒有原生首次可見驗收。
- `inspect-installed.py` 僅以讀取方式解析 bundle／ASAR／fuse，並呼叫 `codesign` 的查驗與顯示操作；不執行官方 JS、`.node` 或 app，不查詢程序、port 或 profile。完整版本機結果留在 ignored `dist/native-loading-research/`。

重要例外：本機 `codesign --verify --deep --strict /Applications/ChatGPT.app` 回傳 exit 1、`invalid signature (code or signature have been modified)`。本輪沒有判定原因、修復或重簽；不能把這個安裝副本當成已認證的原廠完整簽名基準。ASAR 和 sparkle.node 的 SHA256 仍各自符合現存 CodeResources 的 hash2，ASAR header 也符合 Info.plist；這些匹配不能取代整包真實性驗證。下述保護機制以讀到的旗標與官方文件推導，不聲稱已在此副本實測攔截所有途徑。

## 上游的三層契約與 Mac 對照

### 1. 取得主程序執行權：Windows 模組轉接

[build.ps1](https://github.com/fengye337/sandrone-codex/blob/dfea82e39d9d4a42524dc9eed3d61204254d0d3a/native-integration/build.ps1#L53) 用 modification package 的 VFS，把指定官方包版本的 `windows-updater.node` 映射為 bridge，原模組另存 `windows-updater.original.node`。這是作業系統的包疊加，並非一般外部 launcher 的功能。[Microsoft modification packages](https://learn.microsoft.com/en-us/windows/msix/modification-packages) 說明了疊加與移除還原。

[bridge.c](https://github.com/fengye337/sandrone-codex/blob/dfea82e39d9d4a42524dc9eed3d61204254d0d3a/native-integration/bridge.c#L49) 先呼叫原 N-API registration、保留 exports 與原模組例外，再在 browser process 載入附加 runtime；僅清除附加入口例外。[main.cjs](https://github.com/fengye337/sandrone-codex/blob/dfea82e39d9d4a42524dc9eed3d61204254d0d3a/native-integration/runtime/main.cjs) 還明確要求 `process.platform==='win32'` 與包身份，不能原樣搬到 Mac。

Mac 對應原生更新模組是 `Contents/Resources/native/sparkle.node`，不是 windows-updater.node。唯讀 `nm` 可見 N-API registration symbols；`otool -L` 顯示其連結 Sparkle.framework 2.9.1。它有可被主程序載入的原生模組形態，**不代表有第三方轉接入口**：主程序 chunk `early-bootstrap-339-aea964a206c655e4.js` 的 byte 94333 指向 bundle 內固定 Sparkle 路徑，且 updater 初始化有條件、可失敗，尚未證明載入時機早於主視窗導航。不能因為找到同類 `.node` 就推定能早載。

本輪沒有找到 macOS 可套用於這個 app、且具 MSIX modification package 同等契約的受支援檔案疊加機制。`PlugIns/` 中的 `CodexDockTilePlugin.docktileplugin` 是 Info.plist 指定的 Dock tile 元件；不是 Electron main/preload 擴充點。原始碼中的 MCP／瀏覽器擴充／主題選單也不等於可在 host main 任意執行 JS 的契約。[Apple extension 模型](https://developer.apple.com/library/archive/documentation/General/Conceptual/ExtensibilityPG/ExtensionOverview.html) 要求各自的 extension point，不能把「存在 plugin 目錄」當作任意模組可載入的證明。這是本輪已查範圍的結論，不宣稱所有未公開功能永久不存在。

### 2. session.registerPreloadScript：Mac 有 API，沒有外部登記權

上游 [startup.cjs:99](https://github.com/fengye337/sandrone-codex/blob/dfea82e39d9d4a42524dc9eed3d61204254d0d3a/native-integration/runtime/startup.cjs#L99) 在 ready 後，向 `defaultSession` 登記原版 `startup-preload.cjs`。這是 **main-process Session 的方法**；[Electron Session 文件](https://www.electronjs.org/docs/latest/api/session#sesregisterpreloadscriptscript) 說明 frame session preload 先於 WebContents 自有 preload 執行，同頁導航不會重跑。外部 Node 程序的 `require('electron')` 不會取得另一個 app 的 Session。

Mac 封裝 chunk `early-bootstrap-339…js` byte 1371940／1372627 可見 Sentry `PreloadInjection`／`registerPreloadScript`，以及舊 API fallback。這是內部 Sentry 主程序初始化，不是接受第三方 preload 路徑的設定。另一個 chunk `early-bootstrap-916…js` byte 4301749 可見官方 `webPreferences.preload`，byte 4302889 建立 BrowserWindow。靜態呼叫字串不是該分支實際執行的證據；獨立原型才驗證了 API 在 Mac Electron 可運作。

登記必須早於目標文件導航，而且要登記 **正確 session**。上游只登記 defaultSession；主 workspace、登入、瀏覽器頁及其他 partition 不應無差別套用。原版 preload 另檢查主 frame、`app://-/index.html`，協調器檢查來源與每文件 token。本輪原型的不同 session 反向對照確認：defaultSession 登記不會自動覆蓋另一個 session。

即使成功登記，最早保證的是 preload 的執行順序。documentElement 出現前不能掛 DOM；原版以 MutationObserver 等待，先放內嵌 poster，再開始影片。**影片第一幀、完整主題驗證、renderer first-paint 與原生視窗 first-visible 是不同事件。** 上游完整主題仍由 integration 協調、等待 workspace 後套用和驗證；本輪沒有證明完整主題 CSS 或影片第一幀能早於首次 paint。

### 3. 本地影片：Mac 已有路由，但不提供載入入口

上游 [startupMedia](https://github.com/fengye337/sandrone-codex/blob/dfea82e39d9d4a42524dc9eed3d61204254d0d3a/native-integration/runtime/startup.cjs#L6) 將影片變成 `app://fs/@fs/<absolute-path>`，poster／still 嵌入 data URL。其原生播放器與現有 CDP 的分塊開屏是不同路徑，本輪沒有替換現有播放器。

Mac `.vite/build/early-bootstrap.js` byte 1054 是 `protocol.handle("app"…)`；byte 3796 是 Accept-Ranges、4402／4601 是 Content-Range。唯讀查得該 handler 解析 `/@fs`、限制媒體 MIME、對 audio/video 使用串流與 Range 200／206／416，並限制 `app://fs` 請求來源。也有遍歷檢查。**這是靜態存在，不是已向官方應用發送檔案請求。** 影片換成本地 URL 可省掉整段 JS/base64 傳輸，但不能因此讓主程序或 preload 更早出現。

隔離原型自己實作只允許四個倉庫媒體的 protocol handler，沒有匯入官方 handler，也沒有擴大官方檔案存取。採 standard／secure／stream／supportFetchAPI，未開 bypassCSP 或放寬 webSecurity；[Electron protocol 文件](https://www.electronjs.org/docs/latest/api/protocol) 說明 session 綁定與串流需求。renderer video 實際發出 `bytes=0-` 並解碼；其他 Range 狀態由原型 main 的 `session.fetch` 驗證。這不保證官方 route 可被任意跨 origin fetch。

## 各方案的取捨

| 方案 | 早於首次頁面 paint？ | 本輪可行性 |
|---|---|---|
| 官方提供 main／preload 擴充契約 | 若在正確 session 導航前登記，可先放 poster；仍要測原生視窗與主題 | 最符合需求；目前未找到可用契約，需要官方合作 |
| 獨立 Electron 原型／自有客戶端 | 自己的文件可；本輪量測通過 | 可研究機制；不是官方 ChatGPT 的原生整合 |
| 在官方包內換 Sparkle bridge | 未知；updater 載入不保證足夠早 | 無合法疊加入口；需改已簽名資源，本輪排除 |
| 改 ASAR main／官方 preload 的獨立重封裝副本 | 理論可控制到導航前，但未驗證官方程式 | 需要不同簽名、授權及更新方案；本輪不製作 |
| NODE_OPTIONS／main inspector／DYLD 類入口 | 沒有已證實的可用路徑 | fuse／簽名與 runtime 限制，未嘗試繞過 |
| 現有外部 CDP baseline／early-document | baseline 是晚套；early 曾在登記前中止，無首 paint 保證 | 保留可用 baseline，暫停 early 優化，不視作原生等效 |
| 外部 Cocoa／WKWebView 開屏或另一個視窗 | 只能控制自己的畫面 | 不能保證官方視窗首次內容；不是同窗原生版 |

**官方支援入口。** 官方簽名與 updater 由官方維持，主程序可沿用原 profile；但附加碼仍需明確信任與權限邊界。停用／解除登記要涵蓋已載入文件清理與下次導航，還原不應刪官方資料。分發需官方允許、相容版本及可撤回契約。目前只有設計可行性，沒有可交付產品。

**獨立自有 Electron app。** 官方安裝／簽名／更新均不受影響，自有 app 自行簽名、公證與更新。必須使用獨立 profile 和登入流程，不能直接複製或打開正在使用的官方資料庫，不能假定原生功能、認證或 Keychain 可沿用。還原是停止並移除自己的 app／資料；分發原型程式不需包含官方 ASAR／模組，但自有客戶端仍需獨立的 API、身份與產品設計。這條路不滿足「官方原生版等效」。

**包內 bridge／重封裝。** ASAR 與 sparkle.node 均在 resource seal 中；換模組或修改 ASAR 會改變封裝內容，無法保留原廠對新內容的簽名。[Apple TN2206](https://developer.apple.com/library/archive/technotes/tn2206/_index.html) 說明資源封存與簽名身份；保留 bundle ID 並不保留 Team ID、designated requirement 或 Keychain 信任。自行重簽還會涉及 nested frameworks、helpers、原廠 application groups、keychain-access-groups、推播等權限，不能承諾登入資料仍可讀。更新可能拒絕、覆蓋改動或改變路徑／ABI；保留原 exports 不等於驗證過 Sparkle 完整更新。還原需要使用原廠安裝來源或移除獨立副本，不能靠刪一個主題目錄冒充恢復原包。分發需要程式碼／素材授權、新的有效簽名／公證與相容矩陣，不能沿用官方公證票據代表修改後內容。本輪未建立、啟動或分發任何官方重封裝。

**環境／動態注入。** 唯讀 fuse wire 為 v1，9 個 byte：`0 1 0 0 1 1 0 0 1`（ASCII 狀態）。RunAsNode、NODE_OPTIONS、Node CLI inspect 關閉；ASAR integrity、OnlyLoadAppFromAsar 開啟。僅設環境變數不是已支持入口；不能把 renderer remote debugging 和 main inspector 混為一談。[Electron fuse 定義](https://github.com/electron/fuses/blob/main/src/config.ts)、[fuse 說明](https://www.electronjs.org/docs/latest/tutorial/fuses) 與 [ASAR integrity](https://www.electronjs.org/docs/latest/tutorial/asar-integrity) 是判讀依據。沒有翻轉任何 fuse。

另讀到 main 的 hardened runtime flag，未見 disable-library-validation、allow-dyld-environment-variables 或 get-task-allow entitlement；[Apple library validation](https://developer.apple.com/documentation/bundleresources/entitlements/com.apple.security.cs.disable-library-validation) 解釋同 Team／Apple 簽名限制。這些證據不授權修改 entitlement 或繞過防護。這類方案若要求改旗標／重簽，就回到上一項的登入、還原和分發問題；沒有可維護的官方更新契約，故不提供安裝做法。

**外部 CDP／外部視窗。** 不改官方包時可保留官方磁碟簽名與更新，登入仍由官方程序管理；載入器本身仍有除錯連線能力，不能聲稱零資料風險。停止載入器與清理自身改動是還原範圍，沒有附加包卸載的系統契約。分發只可分發自己的載入器／合法素材，版本相容仍要驗收。CDP 需要程序／除錯端點與 target 已出現，無法從目前證據保證首 paint 前完成；外部視窗也不能控制官方第一次 show。本輪不再優化或執行這兩條路。

登入限制不是只看 cookie 檔是否存在。[Electron safeStorage](https://www.electronjs.org/docs/latest/api/safe-storage) 在 Mac 使用 Keychain，穩定簽名與身份很重要；現存官方 keychain access groups 為 `2DC432GLL2.*` 與 `2DC432GLL2.com.openai.shared`，換個簽名不能據此取得同樣授權。本輪未呼叫 safeStorage、Keychain 或讀取 profile。

## 隔離原型做了什麼、沒證明什麼

`prototype.cjs` 是自己的 Electron main，直接使用未改的上游 `createStartup`／`startup-preload.cjs`；`fixture-preload.cjs` 代表一個 host 自有 preload，`fixture.html` 是自己的空白工作區。沒有複製或啟動官方 JS／native addon。userData、sessionData、logs 全設到新建暫存目錄，外網請求封鎖；sandbox／contextIsolation／webSecurity 開啟、nodeIntegration 關閉。沒有 `--no-sandbox`，沒有 CDP 或 main inspector。測試窗 `show:false`，不量測原生 first-visible。

驗證：

1. 真正 `registerPreloadScript`、`getPreloadScripts` 和同步 IPC；在導航前完成登記，session bootstrap 先於 stand-in host preload。
2. host preload 執行時可能還沒有 documentElement，因此當時 cover=false；這是預期時序，不宣稱 preload 本身即已繪製。
3. 原版遮罩在第一段頁面 script 與第一個 rAF 前存在；以原版 diagnostics 的 mountedAt 與同文件 Performance Paint Timing 的 first-paint 比較，掛載先於 renderer paint。沒有把主機接收時間與 renderer 時鐘相減。
4. 原版播放器從自有 app route 讀取本地 H.264，實際 1920×1080、未暫停、收到 first-video-frame；poster 內嵌。first-video-frame 晚於遮罩，不宣稱影片能在首 paint 顯示。
5. Range 全檔 200、前 32 bytes／末 16 bytes 的 206、超範圍 416，以及非允許路徑 404；未整段序列化成 JS 注入字串。
6. 另一個 session 不繼承登記；解除登記後的新文件仍會跑 host preload，但不再發出 session bootstrap IPC，也沒有開屏。兩組均檢查實際 registration 清單與 bootstrap 訊息數；不只看 cover 消失，避免上游 show-once 偏好造成假陽性。
7. 沒有偽造官方 app-server 訊息或主題就緒，`data-ready` 保持 false；不驗收登入、主題套用、真實工作區 readiness、官方更新或 native first-visible。

結果 JSON 中的每個 fixture event 以 webContents 固定歸屬案例，晚到的 paint callback 不會被標為下一個案例。證據值只代表這個獨立原型，不能拿其毫秒數作為官方啟動效能。

開發重跑（從倉庫根目錄；不建置任何產品 `.app`）：

```sh
python3 macos/research/early-loading/inspect-installed.py > dist/native-loading-research/installed-static.json
npm install --prefix /private/tmp/sandrone-mac-native-research --cache /private/tmp/sandrone-mac-native-research-npm-cache electron@45.2.3 --no-audit --no-fund
electron_config_cache=/private/tmp/sandrone-mac-native-research-download-cache node /private/tmp/sandrone-mac-native-research/node_modules/electron/install.js
/private/tmp/sandrone-mac-native-research/node_modules/electron/dist/Electron.app/Contents/MacOS/Electron macos/research/early-loading/prototype.cjs --research-output="$PWD/dist/native-loading-research/prototype.json"
```

需先建立 `dist/native-loading-research/`。下載來自獨立 Electron 套件，下載器使用套件的 checksums；不使用 ChatGPT 的 framework 執行原型。測試後暫存 profile 留作隔離診斷，未與官方資料夾共用。原型不在 `Build-Mac.command` 的複製清單，也未加入正式啟動流程。

本輪停止點：保留 baseline 與既有部分實機驗收，不升版、不合併 main、不發布。若要追求同窗原生啟動，下一個必要條件是可用、受支援且可維護的官方 main／preload 入口；目前未取得。不能用加長動畫、改外部視窗或另包一個載入器宣稱已達成。
