# Mac 驗證紀錄

日期：2026-11-05。目標環境 metadata：macOS arm64、Node.js 24.5.0、ChatGPT 26.1027.30824。metadata 查驗不代表介面驗收。

| 項目 | 狀態 | 證據與限制 |
|---|---|---|
| Git 歷史與最新上游 | 已核對 | fork 與 upstream/main 同為 dfea82e；新分支保留歷史 |
| 原版主題、素材與播放器 | 已整合 | 原版核心與主題未改；Mac adapter 呼叫原版 loadPayload / verifySession / opening-client |
| 撤回 CSS | 保持停用 | 不載入 macos-theme.css；研究 CSS 不納入包 |
| Node 回歸 | 52/52 通過 | 包含上游及 Mac 取消／撤回／傳輸／診斷隱私測試 |
| 原版開屏瀏覽器回歸 | 通過 | 隔離 headless Chrome 156.0.8078.80；1080p、向量、同步顯色、跳過、真實階段門控、快取、清理、降低動態效果、壞媒體及取消競態 |
| 分塊傳輸 | 通過（隔離瀏覽器） | 首播 73 次呼叫、最大表達式 262343 字元；重播 3 次、最大 422 字元；不是 ChatGPT 啟動效能數據 |
| Mac 重播及離線預覽 | 通過（合成頁） | 原版 payload、header 正常排列、對話框避讓、header 替換、設定頁切換、窄視窗、快取復用、停用清理與準備中取消 |
| `.app` 編譯與簽名 | 通過 | arm64 Cocoa 編譯、封裝內 --check、codesign --verify --deep --strict；本機臨時簽名，未 Apple 公證 |
| 真實首頁、對話、輸入框與右側立繪 | **待使用者驗收** | 代理未操作受限應用 |
| 真實設定／選單／程式碼／窄視窗 | **待使用者驗收** | 合成頁不能證明目前 app 的 selector、版面或色彩相容 |
| 真實 Mac 重播位置與普通啟動開屏 | **待使用者驗收** | 未啟動或退出使用者的 ChatGPT |
| 真實快取、停用釋放與效能 | **待使用者驗收** | 需手動畫面、允許收集的診斷及主觀回報 |

測試命令及手動步驟見 [README.md](README.md)。Windows 原生附加包不屬於 Mac 成果，未執行 Windows／PowerShell 測試。
