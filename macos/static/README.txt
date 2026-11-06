桑多涅 macOS 靜態背景測試包
上游 v0.7.0 / 3a4f2cb；Mac adapter 0.3.5；來源 wsqUsaqi537 的 PR #6。

這是獨立靜態背景，不是原版完整主題／開屏／Dock 控制包。不要與完整版同時運行。
先儲存工作、完全退出 ChatGPT，再雙擊本 .app。可把包放到固定位置後拖入 Dock。
需要建置時使用的外部 Node.js 24+；路徑在本 Resources/node-path.txt。
只從專用入口啟動才嘗試套用背景；官方圖示不會自動套用。

本地編譯及簽名不代表實機畫面通過；本次新版真實背景與 Dock 仍待使用者驗收。
包僅採本機臨時簽名，未 Apple 公證。不要關閉系統防護。

還原：儲存工作並手動 Cmd+Q 完全退出 ChatGPT，再從官方圖示啟動。
只停止載入器不保證除錯端點關閉；完全退出 ChatGPT 才會關閉。
移除：退出後從 Dock 移除捷徑，把本靜態 .app 移到垃圾桶；不要刪除官方程序或登入資料。
此包沒有完整版的停用／重新啟用／重播控制，也不會接管已在運行的 ChatGPT。

程式授權見 LICENSE、THIRD-PARTY-NOTICES.md；素材權利見 ASSET-LICENSE.md、assets/LICENSE.txt、themes/sandrone/LICENSE.txt。
MIT 只適用程式，不提供第三方遊戲美術的額外再授權。本輪不發布此包。
來源記錄見 macos/PR6-SOURCE.md、macos/upstream.json、build-manifest.json。
docs/MACOS.zh-CN.md 是來源倉庫中的建置說明；其中跨文件連結可在倉庫查看：
https://github.com/fengye337/sandrone-codex
