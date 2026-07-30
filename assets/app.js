import { categoryMeta, districts } from "./data.js";
import { cloudSyncEnabled, firebaseConfig } from "./config.js";

const app = document.querySelector("#app");
const categoryKeys = Object.keys(categoryMeta);
const STORAGE_KEY = "five-district-dashboard-v1";
const FIREBASE_VERSION = "12.16.0";

const state = {
  completed: new Set(),
  notes: {},
  updatedAt: null,
  cloudEnabled: Boolean(cloudSyncEnabled && firebaseConfig?.projectId),
  cloudReady: false,
  user: null,
  message: "",
  firebase: null,
  unsubscribers: [],
};

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function itemId(districtSlug, category, index) {
  return `${districtSlug}:${category}:${index}`;
}

function noteId(districtSlug, category) {
  return `${districtSlug}:${category}`;
}

function documentId(value) {
  return value.replaceAll(":", "--");
}

function districtTotal(district) {
  return categoryKeys.reduce(
    (sum, key) => sum + district.categories[key].length,
    0,
  );
}

function districtDone(district) {
  return categoryKeys.reduce(
    (sum, key) =>
      sum +
      district.categories[key].filter((_, index) =>
        state.completed.has(itemId(district.slug, key, index)),
      ).length,
    0,
  );
}

function loadLocal() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    state.completed = new Set(saved.completed || []);
    state.notes = saved.notes || {};
    state.updatedAt = saved.updatedAt || null;
  } catch {
    state.completed = new Set();
    state.notes = {};
  }
}

function saveLocal() {
  state.updatedAt = new Date().toISOString();
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      completed: [...state.completed],
      notes: state.notes,
      updatedAt: state.updatedAt,
    }),
  );
}

function canEdit() {
  return !state.cloudEnabled || Boolean(state.user);
}

function formatTime(value) {
  if (!value) return "尚未更新";
  return new Intl.DateTimeFormat("zh-TW", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function setMessage(message) {
  state.message = message;
  const notice = document.querySelector("#notice");
  if (notice) {
    notice.textContent = message;
    notice.hidden = !message;
  }
}

function accountMarkup() {
  if (!state.cloudEnabled) {
    return `
      <div class="team-label">
        <span class="team-dot" aria-hidden="true"></span>
        本機儲存模式
      </div>
    `;
  }

  if (state.user) {
    return `
      <div class="team-label">
        <span class="team-dot" aria-hidden="true"></span>
        ${escapeHtml(state.user.displayName || state.user.email || "團隊成員")}
      </div>
      <button class="text-action link-button" id="auth-button" type="button">登出</button>
    `;
  }

  return `
    <div class="team-label">
      <span class="team-dot" aria-hidden="true"></span>
      公開檢視模式
    </div>
    <button class="sign-in-button" id="auth-button" type="button">Google 登入後編輯</button>
  `;
}

function headerMarkup(home = false) {
  return `
    <header class="site-header ${home ? "home-header" : ""}">
      <a class="brand" href="#/">
        <span class="brand-kicker">2026 地方選舉</span>
        <strong>五選區走訪盤點</strong>
      </a>
      <div class="account-area">${accountMarkup()}</div>
    </header>
  `;
}

function bindAuthButton() {
  const button = document.querySelector("#auth-button");
  if (!button || !state.firebase) return;
  button.addEventListener("click", async () => {
    try {
      if (state.user) {
        await state.firebase.signOut(state.firebase.auth);
      } else {
        await state.firebase.signInWithPopup(
          state.firebase.auth,
          state.firebase.provider,
        );
      }
    } catch (error) {
      console.error(error);
      setMessage("登入操作未完成，請檢查 Firebase 登入設定後再試。");
    }
  });
}

function renderHome() {
  const overallTotal = districts.reduce(
    (sum, district) => sum + districtTotal(district),
    0,
  );
  const overallDone = districts.reduce(
    (sum, district) => sum + districtDone(district),
    0,
  );
  const overallPercentage = overallTotal
    ? Math.round((overallDone / overallTotal) * 100)
    : 0;
  const storageCopy = state.cloudEnabled
    ? "五個選區、五類據點，跨裝置共用同一份勾選與備註。選擇選區後開始盤點。"
    : "五個選區、五類據點，勾選與備註會保存在這個瀏覽器。選擇選區後開始盤點。";

  app.innerHTML = `
    <main>
      ${headerMarkup(true)}
      <p class="notice" id="notice" role="status" ${state.message ? "" : "hidden"}>
        ${escapeHtml(state.message)}
      </p>
      <section class="home-hero">
        <div>
          <p class="eyebrow">團隊走訪進度儀表板</p>
          <h1>把每一次走訪，變成清楚可見的進度。</h1>
          <p>${storageCopy}</p>
        </div>
        <div class="overall-ring" style="--progress: ${overallPercentage}">
          <div>
            <strong>${overallPercentage}%</strong>
            <span>${overallDone} / ${overallTotal} 項</span>
          </div>
        </div>
      </section>

      <section class="district-overview" aria-label="五選區總覽">
        ${districts
          .map((district, index) => {
            const total = districtTotal(district);
            const done = districtDone(district);
            const percentage = total ? Math.round((done / total) * 100) : 0;
            return `
              <a class="district-overview-card" href="#/district/${district.slug}">
                <div class="district-index">0${index + 1}</div>
                <div class="district-card-copy">
                  <span>選區盤點</span>
                  <h2>${escapeHtml(district.name)}</h2>
                  <p>${escapeHtml(district.subtitle)}</p>
                </div>
                <div class="district-mini-progress">
                  <div>
                    <strong>${percentage}%</strong>
                    <span>${done} / ${total}</span>
                  </div>
                  <div class="mini-track"><span style="width: ${percentage}%"></span></div>
                </div>
                <span class="card-arrow" aria-hidden="true">→</span>
              </a>
            `;
          })
          .join("")}
      </section>

      <footer class="home-footer">
        <span>${
          state.cloudEnabled
            ? "資料將即時同步至團隊"
            : "資料保存在此裝置；README 說明如何啟用雲端同步"
        }</span>
        <span>${
          state.cloudEnabled
            ? "未登入可檢視，登入後可勾選及編輯備註"
            : "無需登入即可勾選及編輯備註"
        }</span>
      </footer>
    </main>
  `;
  bindAuthButton();
}

function districtTabs(activeSlug) {
  return `
    <nav class="district-tabs" aria-label="選區切換">
      ${districts
        .map(
          (district) => `
            <a class="${district.slug === activeSlug ? "active" : ""}"
              href="#/district/${district.slug}"
              ${district.slug === activeSlug ? 'aria-current="page"' : ""}>
              <span class="pin" aria-hidden="true">●</span>
              ${escapeHtml(district.shortName)}
            </a>
          `,
        )
        .join("")}
    </nav>
  `;
}

function renderCategory(district, key) {
  const items = district.categories[key];
  const completedCount = items.filter((_, index) =>
    state.completed.has(itemId(district.slug, key, index)),
  ).length;
  const id = noteId(district.slug, key);
  const note = state.notes[id] || "";
  const editable = canEdit();

  return `
    <article class="category-card" data-category="${key}">
      <div class="category-card-header">
        <h2><span>${categoryMeta[key].letter}.</span> ${escapeHtml(
          categoryMeta[key].label,
        )}</h2>
        <span class="category-count">${completedCount} / ${items.length}</span>
      </div>
      <div class="checklist">
        ${items
          .map((label, index) => {
            const idValue = itemId(district.slug, key, index);
            const checked = state.completed.has(idValue);
            return `
              <label class="check-item ${checked ? "checked" : ""} ${
                editable ? "" : "read-only"
              }">
                <input type="checkbox"
                  data-item-id="${idValue}"
                  ${checked ? "checked" : ""}
                  ${editable ? "" : "disabled"} />
                <span class="custom-check" aria-hidden="true">${
                  checked ? "✓" : ""
                }</span>
                <span>${escapeHtml(label)}</span>
              </label>
            `;
          })
          .join("")}
      </div>
      <div class="category-note">
        <label for="note-${id}">備註說明</label>
        <textarea id="note-${id}" data-note-id="${id}" maxlength="4000"
          placeholder="${
            editable
              ? "輸入走訪重點、聯絡資訊或後續事項…"
              : "目前沒有備註"
          }"
          ${editable ? "" : "readonly"}>${escapeHtml(note)}</textarea>
        <div class="note-actions">
          <span class="note-length">${note.length} / 4000</span>
          ${
            editable
              ? `<button type="button" class="save-note" data-note-id="${id}">儲存備註</button>`
              : "<span>登入後可編輯</span>"
          }
        </div>
      </div>
    </article>
  `;
}

function renderDistrict(district) {
  const total = districtTotal(district);
  const completedCount = districtDone(district);
  const percentage = total ? Math.round((completedCount / total) * 100) : 0;
  const statusCopy = canEdit()
    ? "可勾選走訪項目"
    : "登入後即可勾選";

  app.innerHTML = `
    <main>
      ${headerMarkup()}
      ${districtTabs(district.slug)}

      <section class="district-heading">
        <div>
          <p class="eyebrow">選區走訪進度</p>
          <h1>${escapeHtml(district.name)}</h1>
          <p>${escapeHtml(district.subtitle)}</p>
        </div>
        <button class="sync-button" id="sync-button" type="button">
          <span aria-hidden="true">↻</span>
          ${state.cloudEnabled ? "立即同步" : "重新載入"}
        </button>
      </section>

      <section class="progress-panel" aria-label="走訪總進度">
        <div class="progress-primary">
          <span class="section-label">走訪總進度</span>
          <div class="progress-numbers">
            <strong>${completedCount}</strong>
            <span>/ ${total}</span>
            <b>${percentage}%</b>
          </div>
          <div class="progress-track" role="progressbar"
            aria-valuemin="0" aria-valuemax="100" aria-valuenow="${percentage}">
            <span style="width: ${percentage}%"></span>
          </div>
        </div>
        <dl class="progress-stats">
          <div><dt>已完成</dt><dd>${completedCount}</dd></div>
          <div><dt>尚未完成</dt><dd>${total - completedCount}</dd></div>
          <div><dt>總數</dt><dd>${total}</dd></div>
        </dl>
        <div class="progress-status">
          <span class="status-icon" aria-hidden="true">✓</span>
          <strong>${statusCopy}</strong>
          <small>上次更新：${formatTime(state.updatedAt)}</small>
        </div>
      </section>

      <p class="notice" id="notice" role="status" ${state.message ? "" : "hidden"}>
        ${escapeHtml(state.message)}
      </p>

      <section class="category-grid" aria-label="${escapeHtml(
        district.name,
      )}盤點項目">
        ${categoryKeys.map((key) => renderCategory(district, key)).join("")}
      </section>

      <section class="page-actions">
        <button class="danger-button" id="reset-button" type="button"
          ${canEdit() && completedCount ? "" : "disabled"}>
          清除此選區勾選
        </button>
        <span>${
          state.cloudEnabled
            ? "雲端變更會即時同步；勾選後文字變綠色，備註需按下儲存。"
            : "資料儲存在此瀏覽器；勾選後文字變綠色，備註需按下儲存。"
        }</span>
      </section>

      <footer class="sources">
        <h2>資料來源</h2>
        <p>
          清單依專案盤點口徑整理；傳統市場以主管機關名冊中的公有零售市場、
          正式市場與日間攤販集中場為主，排除純夜市、電子商場及已轉型為連鎖
          超市者。場館營運、門市與交通資訊仍以主管機關或業者最新公告為準。
        </p>
        <ul>
          ${district.sources
            .map(
              (source) => `
                <li>
                  <a href="${escapeHtml(source.url)}" target="_blank"
                    rel="noreferrer">${escapeHtml(source.label)}
                    <span aria-hidden="true"> ↗</span>
                  </a>
                </li>
              `,
            )
            .join("")}
        </ul>
      </footer>
    </main>
  `;

  bindAuthButton();
  bindDistrictEvents(district);
}

function renderRoute() {
  const match = location.hash.match(/^#\/district\/([^/?#]+)/);
  if (!match) {
    renderHome();
    return;
  }
  const district = districts.find((item) => item.slug === match[1]);
  if (!district) {
    location.hash = "#/";
    return;
  }
  renderDistrict(district);
}

function bindDistrictEvents(district) {
  document.querySelectorAll("[data-item-id]").forEach((input) => {
    input.addEventListener("change", () => void toggleItem(input.dataset.itemId));
  });

  document.querySelectorAll("[data-note-id]").forEach((textarea) => {
    textarea.addEventListener("input", () => {
      const count = textarea
        .closest(".category-note")
        .querySelector(".note-length");
      count.textContent = `${textarea.value.length} / 4000`;
    });
  });

  document.querySelectorAll(".save-note").forEach((button) => {
    button.addEventListener("click", () => void saveNote(button.dataset.noteId));
  });

  document
    .querySelector("#reset-button")
    ?.addEventListener("click", () => void resetDistrict(district));
  document
    .querySelector("#sync-button")
    ?.addEventListener("click", () => void refreshData());
}

async function toggleItem(id) {
  if (!canEdit()) return;
  const nextValue = !state.completed.has(id);
  if (nextValue) state.completed.add(id);
  else state.completed.delete(id);

  try {
    if (state.cloudEnabled) {
      const { db, doc, setDoc, serverTimestamp } = state.firebase;
      await setDoc(
        doc(db, "dashboard_progress", documentId(id)),
        { itemId: id, completed: nextValue, updatedAt: serverTimestamp() },
        { merge: true },
      );
      state.updatedAt = new Date().toISOString();
    } else {
      saveLocal();
    }
    state.message = "";
  } catch (error) {
    console.error(error);
    if (nextValue) state.completed.delete(id);
    else state.completed.add(id);
    state.message = "儲存失敗，已恢復原本狀態。";
  }
  renderRoute();
}

async function saveNote(id) {
  if (!canEdit()) return;
  const textarea = document.querySelector(`[data-note-id="${id}"]`);
  if (!textarea) return;
  const content = textarea.value;
  state.notes[id] = content;

  try {
    if (state.cloudEnabled) {
      const { db, doc, setDoc, serverTimestamp } = state.firebase;
      await setDoc(
        doc(db, "dashboard_notes", documentId(id)),
        { noteId: id, content, updatedAt: serverTimestamp() },
        { merge: true },
      );
      state.updatedAt = new Date().toISOString();
    } else {
      saveLocal();
    }
    state.message = "";
  } catch (error) {
    console.error(error);
    state.message = "備註儲存失敗，請稍後再試。";
  }
  renderRoute();
}

async function resetDistrict(district) {
  if (!canEdit()) return;
  if (!window.confirm(`確定要清除「${district.shortName}」所有勾選嗎？`)) {
    return;
  }

  const ids = categoryKeys.flatMap((key) =>
    district.categories[key].map((_, index) =>
      itemId(district.slug, key, index),
    ),
  );
  ids.forEach((id) => state.completed.delete(id));

  try {
    if (state.cloudEnabled) {
      const { db, doc, writeBatch, serverTimestamp } = state.firebase;
      const batch = writeBatch(db);
      ids.forEach((id) => {
        batch.set(
          doc(db, "dashboard_progress", documentId(id)),
          { itemId: id, completed: false, updatedAt: serverTimestamp() },
          { merge: true },
        );
      });
      await batch.commit();
      state.updatedAt = new Date().toISOString();
    } else {
      saveLocal();
    }
    state.message = "";
  } catch (error) {
    console.error(error);
    state.message = "清除失敗，請重新整理後再試。";
  }
  renderRoute();
}

async function refreshData() {
  const button = document.querySelector("#sync-button");
  if (button) button.disabled = true;
  try {
    if (state.cloudEnabled && state.firebase) {
      const { db, collection, getDocs } = state.firebase;
      const [progressSnapshot, notesSnapshot] = await Promise.all([
        getDocs(collection(db, "dashboard_progress")),
        getDocs(collection(db, "dashboard_notes")),
      ]);
      state.completed = new Set(
        progressSnapshot.docs
          .map((entry) => entry.data())
          .filter((entry) => entry.completed)
          .map((entry) => entry.itemId),
      );
      state.notes = Object.fromEntries(
        notesSnapshot.docs.map((entry) => {
          const data = entry.data();
          return [data.noteId, data.content || ""];
        }),
      );
    } else {
      loadLocal();
    }
    state.updatedAt = new Date().toISOString();
    state.message = "";
  } catch (error) {
    console.error(error);
    state.message = "目前無法同步，請稍後再試。";
  }
  renderRoute();
}

async function initialiseFirebase() {
  if (!state.cloudEnabled) return;
  try {
    const [appModule, authModule, firestoreModule] = await Promise.all([
      import(
        `https://www.gstatic.com/firebasejs/${FIREBASE_VERSION}/firebase-app.js`
      ),
      import(
        `https://www.gstatic.com/firebasejs/${FIREBASE_VERSION}/firebase-auth.js`
      ),
      import(
        `https://www.gstatic.com/firebasejs/${FIREBASE_VERSION}/firebase-firestore.js`
      ),
    ]);

    const firebaseApp = appModule.initializeApp(firebaseConfig);
    const auth = authModule.getAuth(firebaseApp);
    const db = firestoreModule.getFirestore(firebaseApp);
    const provider = new authModule.GoogleAuthProvider();

    state.firebase = {
      auth,
      db,
      provider,
      signInWithPopup: authModule.signInWithPopup,
      signOut: authModule.signOut,
      onAuthStateChanged: authModule.onAuthStateChanged,
      collection: firestoreModule.collection,
      doc: firestoreModule.doc,
      getDocs: firestoreModule.getDocs,
      onSnapshot: firestoreModule.onSnapshot,
      serverTimestamp: firestoreModule.serverTimestamp,
      setDoc: firestoreModule.setDoc,
      writeBatch: firestoreModule.writeBatch,
    };

    state.unsubscribers.push(
      authModule.onAuthStateChanged(auth, (user) => {
        state.user = user;
        renderRoute();
      }),
    );

    state.unsubscribers.push(
      firestoreModule.onSnapshot(
        firestoreModule.collection(db, "dashboard_progress"),
        (snapshot) => {
          state.completed = new Set(
            snapshot.docs
              .map((entry) => entry.data())
              .filter((entry) => entry.completed)
              .map((entry) => entry.itemId),
          );
          state.updatedAt = new Date().toISOString();
          state.cloudReady = true;
          renderRoute();
        },
        (error) => {
          console.error(error);
          setMessage("無法讀取雲端進度，請檢查 Firestore 規則與設定。");
        },
      ),
    );

    state.unsubscribers.push(
      firestoreModule.onSnapshot(
        firestoreModule.collection(db, "dashboard_notes"),
        (snapshot) => {
          state.notes = Object.fromEntries(
            snapshot.docs.map((entry) => {
              const data = entry.data();
              return [data.noteId, data.content || ""];
            }),
          );
          state.updatedAt = new Date().toISOString();
          renderRoute();
        },
        (error) => {
          console.error(error);
          setMessage("無法讀取雲端備註，請檢查 Firestore 規則與設定。");
        },
      ),
    );
  } catch (error) {
    console.error(error);
    state.cloudEnabled = false;
    state.message = "雲端設定載入失敗，已切換為本機儲存模式。";
    renderRoute();
  }
}

window.addEventListener("hashchange", renderRoute);
window.addEventListener("storage", (event) => {
  if (!state.cloudEnabled && event.key === STORAGE_KEY) {
    loadLocal();
    renderRoute();
  }
});

loadLocal();
renderRoute();
void initialiseFirebase();
