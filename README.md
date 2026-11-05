# Sandrone Codex Mac

為 macOS 上的 ChatGPT／Codex 桌面客戶端提供桑多涅黑金主題與同窗開屏的非官方移植。

以 [fengye337/sandrone-codex](https://github.com/fengye337/sandrone-codex) 為基礎，沿用原版主題與開屏引擎，另提供 Mac 啟動器、Dock 控制及還原流程。**目前版本為 0.3.4 本地測試版，已有部分使用者實機確認，尚未完成所有情境驗收。**

## 功能

- 右側人物背景、黑金側欄、象牙白文字及深藍輸入框。
- 原版同窗開屏、手寫簽名、影片與重播功能。
- Dock 啟動器提供狀態、停用、重新啟用、重播及停止清理，不必持續開著 Terminal。
- 主題停用、媒體清理及恢復官方外觀的操作入口。
- 首頁 Chat／Work 切換鈕的 Mac 配色適配。

## 先了解使用範圍

- **請從桑多涅啟動器啟動。從官方 ChatGPT 圖示啟動不會自動套用主題。**
- 主題與開屏會稍晚於官方視窗出現，這是目前已知限制。實驗性的 early-document 未證實改善實機啟動，日常預設不啟用。
- 不修改官方應用檔案、簽名、登入資料或系統防護，不是 OpenAI 官方插件。
- 透過只綁定本機回環位址的除錯介面載入。本機其他程序仍可能存取該介面；停止載入器不會關閉它，必須完全退出該次 ChatGPT 程序。
- Windows 原生附加包使用另一套載入架構，不屬於本 Mac 版本。

## 環境與建置

已記錄的開發／測試環境：Apple Silicon Mac、Node.js 24、`/Applications/ChatGPT.app`（bundle ID `com.openai.codex`，版本 `26.1027.30824`）。其他客戶端版本與 Intel Mac 尚未驗證。

需要 Node.js 24 以上及 Xcode Command Line Tools。這個倉庫目前提供原始碼；未提供經 Apple 公證、內建 Node 的免依賴安裝包。

```sh
git clone --branch macos/original-engine-integration https://github.com/teddy7286317/sandrone-codex-Mac-Dev.git
cd sandrone-codex-Mac-Dev
node --test tests/*.test.mjs
node engine/macos-skin.mjs --check
zsh Build-Mac.command
```

產物為 `dist/Sandrone-ChatGPT-0.3.4-Mac-Test.app`。已存在時建置會拒絕覆蓋。產物採本機臨時簽名，未經 Apple 公證；若系統阻擋，請回報，不要關閉系統防護。

**Node 仍是外部依賴**，啟動器會記住建置時的 Node 路徑；刪除或搬動該 Node 版本後需重新建置。應用包本身不依賴原始碼資料夾位置。

## 啟動與 Dock

1. 儲存工作，停止舊的主題載入器，並用 Cmd+Q 完全退出 ChatGPT。
2. 把建置好的 `.app` 放在固定位置，再拖到 Dock。
3. 從這個啟動器開啟，等待主題與開屏載入。官方應用已在運行時不會強制關閉或接管它。
4. 使用啟動器的狀態視窗或 Dock 選單管理主題。

詳見 [Dock、還原與移除說明](macos/DOCK-LAUNCHER.md)。需要先看外觀，可執行 `./macos/preview.command`，但離線預覽不能代替真實客戶端驗收。

## 還原與移除

先停用主題、停止並清理載入器，儲存工作後完全退出 ChatGPT，再由官方圖示啟動即可恢復官方外觀。

移除本工具時，在停止載入器後移除其 Dock 捷徑及獨立 `.app`。本工具不需要刪除官方聊天、登入資料或 Keychain。完整步驟與清理未確認時的處理見 [還原與移除](macos/DOCK-LAUNCHER.md#完整還原至官方使用方式)。

## 驗證狀態

使用者已確認對話與輸入框可讀、開屏重播、停用、重新啟用正常，首頁及窄視窗對話可接受，並確認 0.3.1 修正 Chat／Work 原白底淺字問題。最新回報為目前版本「看起來是可以了」；這不擴大為所有待測項目全面通過。

0.3.4 開發紀錄包括 72 項 Node 測試、5 種 Cocoa 隔離情境、Chrome 合成頁與打包簽名檢查。這些是程式與隔離環境檢查，不代表每個真實畫面、錯誤恢復與媒體生命週期都已驗收。

- [逐項手動驗收](macos/MANUAL-ACCEPTANCE.md)
- [驗證紀錄與待測範圍](macos/VALIDATION.md)
- [Mac 開發與診斷說明](macos/README.md)
- [啟動時間線與限制](macos/STARTUP-TIMING.md)
- [早期載入架構研究](macos/research/early-loading/README.md)

## 來源與授權

感謝原作者 [fengye337](https://github.com/fengye337/sandrone-codex)、Codex Dream Skin，以及 PR #6 的 Mac 原型作者 wsqUsaqi537。來源與改編範圍見 [UPSTREAM.md](macos/UPSTREAM.md) 及 [PR6-SOURCE.md](macos/PR6-SOURCE.md)。

程式碼遵循 [MIT 授權](LICENSE)。桑多涅角色圖片、影片、簽名與衍生素材保留原權利人的權利，**不適用程式碼的 MIT 素材再授權**，詳見 [素材權利說明](ASSET-LICENSE.md) 與 [第三方聲明](THIRD-PARTY-NOTICES.md)。

本專案與 OpenAI、HoYoverse／COGNOSPHERE 無官方隸屬或背書關係，不包含官方客戶端、帳號或模型額度。

[原版 Windows 說明](README-Windows.md) 保留於本倉庫，Windows 下載及原生附加包不能用作 Mac 安裝包。
