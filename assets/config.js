/**
 * 預設為本機儲存模式，直接上傳 GitHub Pages 即可使用。
 *
 * 若要啟用多人／跨裝置同步：
 * 1. 依 README.md 建立 Firebase 專案。
 * 2. 把 cloudSyncEnabled 改為 true。
 * 3. 將 firebaseConfig 的 null 改成 Firebase 控制台提供的設定物件。
 */
export const cloudSyncEnabled = false;

export const firebaseConfig = null;

// 範例（請勿直接使用）：
// export const firebaseConfig = {
//   apiKey: "YOUR_API_KEY",
//   authDomain: "YOUR_PROJECT.firebaseapp.com",
//   projectId: "YOUR_PROJECT",
//   storageBucket: "YOUR_PROJECT.firebasestorage.app",
//   messagingSenderId: "YOUR_SENDER_ID",
//   appId: "YOUR_APP_ID",
// };
