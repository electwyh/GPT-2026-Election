/**
 * 預設為本機儲存模式，直接上傳 GitHub Pages 即可使用。
 *
 * 若要啟用多人／跨裝置同步：
 * 1. 依 README.md 建立 Firebase 專案。
 * 2. 把 cloudSyncEnabled 改為 true。
 * 3. 將 firebaseConfig 的 null 改成 Firebase 控制台提供的設定物件。
 */
export const cloudSyncEnabled = true;

export const firebaseConfig = {
  apiKey: "AIzaSyCq4eWW1-zDgM_ax52SiC6kQha_pyspHQg",
  authDomain: "gpt-2026-ground-game.firebaseapp.com",
  projectId: "gpt-2026-ground-game",
  storageBucket: "gpt-2026-ground-game.firebasestorage.app",
  messagingSenderId: "882763549427",
  appId: "1:882763549427:web:7af4395ebe46afebab4586"
};

// 範例（請勿直接使用）：
// export const firebaseConfig = {
//   apiKey: "YOUR_API_KEY",
//   authDomain: "YOUR_PROJECT.firebaseapp.com",
//   projectId: "YOUR_PROJECT",
//   storageBucket: "YOUR_PROJECT.firebasestorage.app",
//   messagingSenderId: "YOUR_SENDER_ID",
//   appId: "YOUR_APP_ID",
// };
