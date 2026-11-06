# macOS 貢獻來源與整合後入口

## PR #6：靜態背景

- 原貢獻者：GitHub `wsqUsaqi537`；原提交的 Git 作者名稱為 `ban1et`。
- PR：https://github.com/fengye337/sandrone-codex/pull/6
- 原提交：`a661a4063b18d6a8b0637e039d4f49f236f3fdbe`。
- 0.7.0 整合保留該提交歷史。靜態入口為 `Build-Mac-Static.command`、`macos/static/macos-launcher.applescript`、`macos/static/macos-skin.mjs` 與輔助模組；不是完整版的自動備援。

沿用原靜態背景、既有程序保護、從本次啟動 stderr 核對 browser ID、loopback URL 與圖片 SHA256。只提供靜態背景，不提供原版同窗開屏、簽名、進度、重播與完整配色。啟用本機除錯介面後，本機其他程序可能存取該介面；完全退出 ChatGPT 才會關閉。

本輪在 `macos/static/renderer.mjs` 抽出原 renderer 以執行合成頁回歸；selector、CSS 與版面計算不變。建置補上獨立輸出、授權／來源檔及基準識別，沒有將靜態覆蓋層帶回完整版。

## PR #7：原版引擎與 Dock 完整版

- 原貢獻者：GitHub `teddy7286317`。
- PR：https://github.com/fengye337/sandrone-codex/pull/7
- 貢獻提交：`bddd653b541b1ab064dba6686651b1aa7f2602a0`；上游合併提交：`3010a498379e609977274ea62cda562b47c50fef`。
- 完整版 `Build-Mac.command`／Cocoa／`engine/macos-skin.mjs`，基於上游主題及開屏引擎，新增 Mac session 校驗、局部 UI、Dock 控制、建置與清理。參考 #6 的啟動及校驗思路，並非取代或否定該貢獻。

早期開發文件曾記錄無法 fetch 和尚未整合，這是當時的歷史狀態。現在兩項貢獻均已包含於上游 v0.7.0，原提交歷史可查；不再將「尚未建立歷史／未合併上游」當成現況。

程式遵循根目錄 MIT License；Codex Dream Skin 保留其 vendor LICENSE／SOURCE.json。角色圖片、影片、簽名參考與衍生素材的權利保留原權利人；程式 MIT 不提供額外素材再授權。來源核對及限制另見 [UPSTREAM.md](UPSTREAM.md) 與 [ASSET-LICENSE.md](../ASSET-LICENSE.md)。
