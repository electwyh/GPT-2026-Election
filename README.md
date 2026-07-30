# 五選區走訪進度儀表板（GitHub Pages 版）

這是一個不需要建置工具的靜態網站。將此資料夾內的檔案放到 GitHub
Pages 發布來源的最上層，即可開啟首頁、五個選區頁面、勾選變色、進度統計、
備註與資料來源連結。

## 直接發布

1. 建立 GitHub repository。
2. 把本資料夾內所有檔案上傳到 repository 根目錄。
3. 到 `Settings` → `Pages`。
4. 在 `Build and deployment` 的 `Source` 選擇 `Deploy from a branch`。
5. 選擇 `main` 與 `/(root)`，再按 `Save`。
6. 等候 GitHub 完成發布後，開啟 Pages 網址。

`index.html` 與 `.nojekyll` 必須保留在發布來源最上層。

## 預設資料保存方式

預設使用瀏覽器 `localStorage`：

- 不需登入即可勾選、取消、填寫備註。
- 同一瀏覽器重新整理或再次開啟時，進度仍會保留。
- 同一裝置的不同分頁會同步更新。
- 不會自動同步到另一台手機或電腦。

## 啟用多人／跨裝置同步（選用）

GitHub Pages 只託管靜態檔案，因此多人同步需要外接資料庫與登入服務。本專案已
預留 Firebase Authentication + Cloud Firestore 介面：

1. 到 Firebase Console 建立專案，並註冊 Web App。
2. 建立 Cloud Firestore 資料庫。
3. 在 Authentication 的 Sign-in method 啟用 Google。
4. 在 Authentication 的 Authorized domains 加入你的
   `<帳號或組織>.github.io` 網域。
5. 將 `firestore.rules` 的內容貼到 Firestore → Rules 並發布。
6. 打開 `assets/config.js`：
   - 把 `cloudSyncEnabled` 改成 `true`。
   - 把 `firebaseConfig` 改成 Firebase 控制台提供的 Web App 設定物件。
7. 提交修改，等待 GitHub Pages 重新發布。

啟用後的權限為：

- 未登入者：可查看全體共用進度與備註。
- 使用 Google 登入者：可勾選、取消、重設及編輯備註。
- Firestore 會即時推送變更到其他已開啟的裝置。

Firebase Web 設定物件會出現在前端原始碼中，這是正常設計；實際存取權限應由
`firestore.rules` 控制。若只允許特定團隊成員修改，請勿直接使用目前的
「任何已登入者皆可寫入」規則，需改成電郵白名單或自訂 claims 規則。

## 修改資料

五個選區、a–e 清單與資料來源都集中在 `assets/data.js`。介面樣式在
`assets/styles.css`，互動功能在 `assets/app.js`。

## 官方參考資料

- GitHub Pages：https://docs.github.com/en/pages
- Firebase Web 設定：https://firebase.google.com/docs/web/setup
- Firebase Authentication：https://firebase.google.com/docs/auth/web/start
- Firestore Security Rules：https://firebase.google.com/docs/firestore/security/get-started
