# 給上游的 0.7.0 Mac 驗證報告草稿（尚未送出）

感謝合併 #6／#7。這輪直接從 v0.7.0／main `3a4f2cb` 建立 `macos/0.7.0-regression`，沒有重套已合併提交。

在 macOS 26.5.1 arm64、Node 24.5.0、獨立 Chrome 156.0.8078.80，75 項 Node、完整版／Chat–Work／靜態 renderer／原版開屏／CDP startup fixture、native startup IPC 適配器、六種視窗比例，以及 5 種 Cocoa 假子程序情境均通過。這些不代表 Windows 或官方 ChatGPT 實機驗收。

本輪補強：#6 測試改匯入實際 static helper；靜態建置可指定 dist 輸出、不覆蓋舊包，補齊來源／授權與 SHA256 receipts；兩種新包以 upstream 0.7.0／3a4f2cb／Mac 0.3.5 明確標示。未改共用 CDP、原版播放器／素材／配色或 selector，沒有繼續早期載入研究。

完整版 arm64 與靜態版 AppleScript 均建置成功，資源／授權和 codesign strict 檢查通過；靜態包再次建置的拒絕覆蓋也通過。只編譯／簽署自有產物，未啟動或修改官方應用。新版普通啟動、Dock、首頁、對話、輸入、設定／模型、開屏／重播、停用／啟用與停止清理仍待使用者逐項回報；歷史 0.3.x 回報未計入新版結果。保留外部 Node、晚載入、官方圖示不自動套主題、未 Apple 公證及需手動退出關閉除錯端點等限制。

細節見 macos/REGRESSION-0.7.0.md、VALIDATION.md 與 QUICK-ACCEPTANCE.md。此為 fork 維護分支回饋草稿，尚未留言、建立 PR 或發布包。
