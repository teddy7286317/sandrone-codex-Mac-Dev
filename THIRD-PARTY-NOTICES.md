# 第三方与素材许可

- 项目自己的源码采用根目录 MIT License；不代表 OpenAI 或 HoYoverse 官方项目。
- Codex Dream Skin：MIT，冻结来源 commit 6fc42df48a6a5365011f55cc349e20c038e56d1d；保留原始 LICENSE 和 SOURCE.json。只分发所需的未修改 runtime、Windows injector 与关联代码。
- Node.js：试用包携带本地核验过签名的 OpenJS Foundation Windows x64 Node.js 24.19.0，以及完整 runtime/LICENSE-node.txt（含其依赖的许可）。源码包不携带 Node 可执行文件，构建时使用用户从官方取得的 Node 与配套许可证。
- Windows .NET Framework 是系统依赖，不在包内分发。启动器与窗口组件由本项目源码本地编译，尚未做商业代码签名。
- 具体素材类别见 asset-edition.json 和 assets/LICENSE.txt。本仓库和完整包包含用户提供的游戏角色图、签名参考、路径和衍生视频，版权仍归原权利人，这些内容不受本项目 MIT 授权。
- 本项目没有附加 Codex 官方程序、账号、付费模型额度或登录凭据。每位使用者须自行安装和登录官方客户端。

上游：https://github.com/Fei-Away/Codex-Dream-Skin
Node 许可参考：https://github.com/nodejs/node/blob/main/LICENSE

## macOS 0.7.0 基準補充

- 完整版 Mac 貢獻：teddy7286317，PR #7；靜態背景：wsqUsaqi537（原 Git 作者 ban1et），PR #6。上游 0.7.0 保留兩者提交歷史，入口及資源來源見 macos/PR6-SOURCE.md。
- 上文附帶 Windows Node 二進制的說明不適用於這兩種 Mac 本地測試包：Mac 只記錄使用者建置時的外部 Node 路徑，沒有分發 Node 或官方 ChatGPT 程式／登入資料。
- Mac 包同樣保留程式 MIT、vendor 原 LICENSE／SOURCE（完整版）與素材權利說明；程式授權不提供第三方美術額外再授權。靜態包的圖示取自本機建置輸入，不隨倉庫另行散布官方圖示。
