# Sandrone Mac 0.3.0 離線整合測試版

本輪已實作原版主題、開屏快取介面、Mac 重播入口、封裝與離線預覽。**真實 ChatGPT/Work 介面尚未驗收。** 不代表完整 macOS 移植已完成。

原始碼位於真正 fork 的 `macos/original-engine-integration` 分支；上游來源與範圍見 [UPSTREAM.md](UPSTREAM.md)。舊 `../SandroneCodex-Source` 保留不動，請在新資料夾執行以下指令。

撤回的 `engine/macos-theme.css` 保持停用，載入器也不讀取它；歷史研究 CSS 不會打包執行。新的外觀全部來自上游主題 payload 與原版 `native-ui.css`。

## 先看離線預覽，不用退出 Work

雙擊 `macos/preview.command`，或在 Terminal 執行：

```sh
cd '/path/to/SandroneCodex-Mac'  # 換成新克隆資料夾的實際路徑
node macos/build-preview.mjs
open dist/Sandrone-Mac-preview.html
```

頁面可測首頁／對話、設定、選單表單、播放／重播、跳過、停用及再次啟用。Esc、雙擊、連按兩次空格或 Enter 可跳過。開屏結束保留隱藏媒體快取，停用才完整釋放。減少動態效果模式不準備影片。

這是合成 DOM，沒有連線 ChatGPT、帳號或網路，不含官方應用資源。頁面上的示例文字、版面與各類錨點不能代替真實介面驗收；預覽看起來正確不代表實機的聊天、設定和輸入框都相容。

## 程式檢查與建置

```sh
node --test tests/*.test.mjs
node engine/macos-skin.mjs --check
zsh Build-Mac.command
```

`--check` 只讀取應用 metadata 並驗證原版主題與素材，不啟動應用、不連線除錯介面。建置使用本機 Node.js 24 與 Xcode Command Line Tools。輸出：`dist/Sandrone-ChatGPT-0.3.0-Mac-Test.app`。已存在時拒絕覆蓋。

測試版以目前架構編譯、使用本機臨時簽名，未 Apple 公證；需保留建置時的 Node 路徑。包內包含原版引擎、vendor、主題、素材、來源及授權，**不複製官方 app.asar、帳號、profile、logs 或 state**。包的執行不依賴原始碼資料夾。若只保留 `.app`，包內 `Contents/Resources/macos/` 也包含 control 與 audit-current，可由 Node 手動執行；它們使用相同資料目錄。

使用者手動執行載入器、控制和診斷時，資料寫入：

```text
~/Library/Application Support/SandroneMacDev/
  state/macos-session.json
  state/macos-control.json
  logs/macos-skin.jsonl
  logs/manual-<情境>.json
```

可用同一個 `SANDRONE_DATA_DIR` 環境變數將所有命令指向其他資料夾。這些檔案不屬於 Git 成果。

## 手動實機驗收：第一階段只套主題

以下步驟**由你手動操作**；代理不執行載入器、控制命令或 audit-current，也不透過其他工具繞過 Computer Use 對 `com.openai.codex` 的存取限制。

1. 先儲存 Work 中的工作，等目前對話工作結束。開啟獨立 Terminal，進入上面的新專案資料夾。使用 Cmd+Q 完全退出 ChatGPT；不要只關視窗。
2. 在 Terminal A 執行下列命令並保持它運行：

   ```sh
   node engine/macos-skin.mjs --theme-only
   ```

   它只會啟動新的官方應用程序，不會強制退出或接管現有程序。`--theme-only` 不自動播放開屏，但保留手動重播功能。若原版程式驗證失敗，會撤回；錯誤仍需回報，不能因此推定畫面正確。
3. 先不要播放開屏。手動檢查首頁與一個不含敏感資訊的對話：背景、右側立繪、側欄、標題列、正文、次級文字、程式碼、輸入框、提示文字、模型選單、一般選單和設定表單。輸入框可輸入不送出的示例字。將視窗縮窄至約 600px 再檢查。特別留意白底淺字、對話或輸入框消失、遮蓋按鈕、橫向溢位、跳動與不可點擊。
4. 在 Terminal B 逐個對應目前畫面執行（先 `cd` 同一新專案資料夾）：

   ```sh
   node macos/audit-current.mjs --manual home
   node macos/audit-current.mjs --manual thread
   node macos/audit-current.mjs --manual menu
   node macos/audit-current.mjs --manual settings
   node macos/audit-current.mjs --manual narrow
   ```

   每個命令只在你已切到相應畫面後執行，不會幫你操作介面。它會核對啟動紀錄的 PID、實際 binary、監聽 port、browser ID，再收集契約錨點數量、幾何、計算色彩、祖先背景與媒體狀態；不收聊天正文、輸入值、HTML、頁面 URL 或截圖。設定頁／輔助頁缺少主 shell 可能是合法情況，仍需畫面判讀。
5. 回傳你願意分享的畫面及相應 `manual-*.json`。畫面建議包括首頁全窗、對話及輸入框、開啟的選單／設定、窄視窗；請自行避開帳號與私人對話。只需分享這些明確的診斷檔，不必分享整個資料目錄或啟動 state。

## 手動實機驗收：第二階段開屏與重播

第一階段畫面沒有可讀性問題後，才執行：

```sh
node macos/control.mjs replay
```

或點擊原版 header 中的 `↻`（可透過輔助使用標籤辨認「重播桑多涅開屏」）。確認原版人物描邊、齒輪水紋、逐筆手簽、同步影片與原版文案；動畫應在同一個視窗內淡出，回到原來內容與焦點。逐一測 Esc、雙擊、兩次空格／Enter，再重播。記錄主觀卡頓，不以離線測試的耗時替代。

播放中可在 Terminal B 執行 `node macos/audit-current.mjs --manual opening`；結束後執行 `node macos/audit-current.mjs --manual replay`。結束後預期影片仍有來源且暫停，第二次重播可復用快取。

若希望測試普通啟動時的自動開屏：在 Terminal A 按 Ctrl+C，確認清理後手動 Cmd+Q 退出 ChatGPT，再雙擊測試版 `.app`。它走同一套原版驗證與快取流程，驗證通過後才顯示開屏；此路徑仍需單獨實機確認。不要同時啟動兩個載入器。

## 停用、再次啟用與還原

Terminal B：

```sh
node macos/control.mjs disable
node macos/audit-current.mjs --manual disabled
```

控制命令只寫入本次啟動的請求檔，須由仍運行的載入器處理；看到命令成功不代表清理已驗證。請確認動畫、Mac 重播與原版主題已移除，診斷顯示 `cached:false`。停用可在準備或播放中測試，遲到回調不應再次顯示。

```sh
node macos/control.mjs enable
```

這只作用於目前這次測試，不改寫 ChatGPT 的外觀偏好。再次確認主題與重播能恢復。若異常，保持停用並回傳畫面與診斷。

完整還原：Terminal A 按 Ctrl+C（若透過 `.app` 啟動，先送出 disable），手動完全退出 ChatGPT，再由官方圖示正常啟動。官方檔案、簽名與系統防護均不改動。除錯端點只綁定 loopback，但會留到該官方應用程序完全退出；只停載入器不會關閉端點。此工具不會幫你強制退出應用。

## 驗證邊界

程式測試、離線瀏覽器測試、打包及簽名結果見 [VALIDATION.md](VALIDATION.md)。真正 ChatGPT 首頁／對話／設定、Mac 標題列布局、啟動及主觀流暢度均標記為待驗收。尚未向上游送 PR 或留言。
