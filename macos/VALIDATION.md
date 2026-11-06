# Mac 驗證紀錄：上游 0.7.0 基準

2026-11-06；維護分支 `macos/0.7.0-regression`，Mac adapter **0.3.5**。上游 `v0.7.0` 與本次 fetch 的 main 均為 `3a4f2cb11c82269b155d8b75be212432e088bd52`，PR #7 已合併。**本輪只有程式／隔離／建置結果，新版實機畫面尚未驗收。** 舊版的使用者回報不算成本輪新版通過。

## 一、本輪程式、隔離與打包測試

環境：macOS 26.5.1 arm64，Node.js 24.5.0，獨立 Chrome 156.0.8078.80。靜態 metadata 檢查讀到 ChatGPT `26.1027.30824`；沒有啟動、連線或操作該應用，不代表介面相容性已驗證。

| 項目 | 本次結果 | 能證明與不能證明 |
|---|---|---|
| Node 回歸 | **75/75 通過** | Windows 預設 CDP、Mac 動態 port／flattened session、取消／撤回、驗證、來源素材、通道等；不是官方程式實機測試 |
| Full Mac 合成頁 | 通過 | 原版 payload／verifier、header 重播、路由／modal／設定 fixture、窄窗、快取、停用、準備中取消；不是實際設定頁驗收 |
| Chat／Work 合成頁 | 通過；最低文字對比 9.04:1 | 一般／選中／懸停／焦點／鍵盤、其他按鈕隔離；不能代表每個實機狀態 |
| #6 static renderer | 通過 | 真正匯入拆分後的 static helper／renderer；錨點未就緒不安裝、重複調用、原版版面、dialog／窄窗隱藏、輸入與原有色彩不變 |
| 原版 opening | 通過 | 完整素材、連續顯色、跳過／焦點、快取、壞媒體回退、減少動態效果、取消／釋放；不能推論實機流暢度 |
| 開屏傳輸 | 首播 73 次、最大 expression 262343 字元；重播 3 次、最大 422 字元 | 獨立 fixture 的資料，不當作官方啟動耗時或穩定幀率 |
| CDP startup fixture | 通過 | 既有 baseline／選用路徑的 port、子 session 路由、verification gate、停用／reload 清理；沒有調整 early-document 或宣稱實機 early 已修復 |
| 上游 native startup | IPC 適配器／瀏覽器通過 | 檢查、恢復、停用／啟用／重播及偏好；不是 Windows MSIX、官方 Mac 或原生啟動驗收 |
| 上游 0.7.0 視窗比例 | 六種比例通過 | 使用獨立 Chrome 檢查 16:9 artwork／進度和可點恢復；不等同 Mac 版已採用原生載入架構 |
| Cocoa | **5 種隔離情境通過** | 真正 Cocoa 事件迴圈 + 假 Node 子程序：正常控制、Node 缺失、子程序錯誤、清理未確認、退出清理未確認；不操作真正 Dock／ChatGPT |
| 完整版建置 | arm64 編譯、包內 --check、codesign strict 通過 | Dock metadata／圖示、資源與來源位元組、授權、baseline/PENDING 標記、無官方程式／使用者資料／靜態 runtime／研究／test 入口 |
| 靜態版建置 | AppleScript 編譯、來源／媒體 receipts、codesign strict、拒絕覆蓋通過 | 輸出至 worktree dist、使用自己的測試圖示，未安裝至 ~/Applications、未執行生成的 app |

程式及 bundle 檢查的 **PENDING** 表示實機驗收未完成；兩種測試包只有本機臨時簽名，未 Apple 公證。原版 player／素材／CSS、已撤回配色、共用 CDP、baseline 預設、動畫與輪詢間隔均未在本輪修改。靜態 renderer 只是從原字串抽出函式，未改 selector／外觀。

最初完整頁瀏覽器檢查因新 worktree 沒有生成 preview 而停止，補執行 `node macos/build-preview.mjs` 後通過；不是修 selector。完整重跑順序、定位修正與基準比較見 [REGRESSION-0.7.0.md](REGRESSION-0.7.0.md)。沒有執行 Windows 官方客戶端、MSIX 安裝／更新或系統防護變更。

## 二、歷史使用者回報（不計入新版驗收）

| 舊版／來源 | 歷史回報 | 保留邊界 |
|---|---|---|
| 早期 0.3.x 原版引擎整合 | 對話與輸入框可讀；開屏重播、停用及重新啟用正常 | 使用者文字回報，沒有本次新版逐項畫面／診斷 |
| 0.3.1 | 首頁 Chat／Work 原白底淺字問題已解決；首頁其他區域及窄視窗對話可接受 | 不是一般、選中、各自懸停、鍵盤焦點與 Enter／Space 全狀態通過 |
| 0.3.4 收尾 | 歷史文件記錄「看起來是可以了」 | 僅整體使用感受，沒有逐項設定、模型、Dock／錯誤恢復或媒體釋放驗收 |
| 0.3.2 的實機 trace | baseline 約 6.338 秒、early 約 7.484 秒 debugger→theme；early 登記在 watchdog 前後中止 | 是舊版本兩次量測，不是本次效能；維持晚載入限制，不把 isolated early 通過當成實機成功 |

這些歷史回報仍可查，沒有被刪掉或升格。研究／本機舊成果保留在原 worktree；本維護分支不重新開始插件或早期載入研究。

## 三、本次新版實機結果：尚未取得

以下對 **0.7.0 基準／Mac 0.3.5** 全部保留 **待使用者手動驗收**：

- 普通 `.app` 啟動、自動開屏、Dock 固定／關窗存續／重開／單一程序。
- 首頁與 Chat／Work 的一般、選中、懸停、鍵盤焦點及切換。
- 對話正文、次級文字、輸入／提示／程式碼、窄視窗。
- 設定頁、模型選單及其他選單的顏色、選中、停用、焦點、關閉與回輸入框。
- 開屏細節、重播、各種跳過、焦點恢復、減少動態效果及主觀流暢度。
- 停用、重新啟用、媒體來源／Blob／解碼快取的實際釋放。
- 停止清理、清理未確認提示、完整退出後由官方圖示還原。
- 已開啟時拒絕接管、再次嘗試，以及自然發生錯誤的恢復；未發生的情境明列未測。
- 右側立繪／標題列／全螢幕／其他布局、#6 靜態包真實畫面、其他客戶端及裝置版本。

簡短可貼上清單見 [QUICK-ACCEPTANCE.md](QUICK-ACCEPTANCE.md)；逐項預期／回報欄位見 [MANUAL-ACCEPTANCE.md](MANUAL-ACCEPTANCE.md)。代理不存取受限 `com.openai.codex`；元素存在、程式驗證、簽名或歷史回報都不等於新版畫面正確。

## 仍然保留的限制

需要外部 Node.js 24+ 與建置時路徑；完整包另需 Xcode Command Line Tools。只有從專用入口啟動才嘗試套主題，**官方圖示不自動套用**；主題和開屏可能晚於官方視窗，不能保證首 paint。沒有 Apple 公證，不關閉 Gatekeeper／SIP。停止載入器不會關閉官方程序的 loopback 除錯端點，必須由使用者儲存並完全退出 ChatGPT。本機其他程序仍可能存取該端點。
