/**********************
     * Utilities
     **********************/
    const $ = (sel, root=document) => root.querySelector(sel);
    const $$ = (sel, root=document) => Array.from(root.querySelectorAll(sel));
    const hasPeriodUI = ()=> Boolean($("#periodCollection"));

    const fmtMoney = (n) => {
      if (n === null || n === undefined || Number.isNaN(Number(n))) return "—";
      const x = Number(n);
      return x.toLocaleString("ru-RU", {minimumFractionDigits: 2, maximumFractionDigits: 2});
    };
    const fmtPercent = (v, digits=1) => {
      if (v === null || v === undefined || Number.isNaN(Number(v))) return "—";
      const pct = Number(v) * 100;
      return `${pct.toFixed(digits)}%`;
    };
    const fmtBytes = (bytes) => {
      const value = Number(bytes || 0);
      if (!value) return "0 Б";
      const units = ["Б", "КБ", "МБ", "ГБ"];
      let idx = 0;
      let size = value;
      while (size >= 1024 && idx < units.length - 1){
        size /= 1024;
        idx += 1;
      }
      const digits = size >= 10 || idx === 0 ? 0 : 1;
      return `${size.toFixed(digits)} ${units[idx]}`;
    };
    const fmtShortDate = (iso) => {
      try {
        const d = new Date(iso + "T00:00:00");
        return d.toLocaleDateString("ru-RU", {day:"2-digit", month:"2-digit"});
      } catch { return iso; }
    };
    const fmtLongDate = (iso) => {
      try {
        const d = new Date(iso + "T00:00:00");
        return d.toLocaleDateString("ru-RU", {day:"2-digit", month:"2-digit", year:"numeric"});
      } catch { return iso; }
    };
    const fmtDateTime = (iso) => {
      try {
        const d = new Date(iso);
        if (Number.isNaN(d.getTime())) return iso;
        return d.toLocaleString("ru-RU", {day:"2-digit", month:"2-digit", year:"numeric", hour:"2-digit", minute:"2-digit"});
      } catch { return iso; }
    };
    const toIsoDateLocal = (dateObj) => {
      const y = dateObj.getFullYear();
      const m = String(dateObj.getMonth() + 1).padStart(2, "0");
      const d = String(dateObj.getDate()).padStart(2, "0");
      return `${y}-${m}-${d}`;
    };
    const clamp = (v,min,max)=>Math.max(min,Math.min(max,v));
    const sleep = (ms)=>new Promise(r=>setTimeout(r,ms));
    const ATTACHMENT_LIMIT = 10;
    const ATTACHMENT_MAX_BYTES = 10 * 1024 * 1024;
    const ATTACHMENT_ACCEPT = "image/jpeg,image/png,image/webp,application/pdf";

    function monthNameRu(m){ // 1..12
      const names = ["Январь","Февраль","Март","Апрель","Май","Июнь","Июль","Август","Сентябрь","Октябрь","Ноябрь","Декабрь"];
      return names[(m-1)||0] || "—";
    }

    function setToast(text="Сохранено"){
      const card = $("#toastCard");
      card.querySelector(".bold").textContent = text;
      card.classList.add("show");
      setTimeout(()=>card.classList.remove("show"), 1400);
    }
    function shakeElement(el){
      if (!el) return;
      el.classList.remove("shake");
      void el.offsetWidth;
      el.classList.add("shake");
      setTimeout(()=> el.classList.remove("shake"), 240);
    }
    function notifyMonthClosed(target){
      shakeElement(target);
      setToast("Месяц закрыт");
    }

    /**********************
     * Telegram init + theme
     **********************/
    const tg = window.Telegram?.WebApp;
    const ThemeState = {
      mode: "auto",
      media: window.matchMedia?.("(prefers-color-scheme: dark)")
    };

    function detectTelegramTheme(){
      const p = tg?.themeParams || {};
      if (!p.bg_color) return null;
      const hex = p.bg_color.replace("#","");
      if (hex.length !== 6) return null;
      const r = parseInt(hex.slice(0,2),16);
      const g = parseInt(hex.slice(2,4),16);
      const b = parseInt(hex.slice(4,6),16);
      const lum = 0.2126*r + 0.7152*g + 0.0722*b;
      return (lum > 180) ? "light" : "dark";
    }

    const tgThemeParams = tg?.themeParams || {};

    function applyTelegramThemeVars(theme){
      const root = document.documentElement.style;
      const isDark = theme === "dark";
      if (!isDark) {
        root.removeProperty("--bg");
        root.removeProperty("--card");
        root.removeProperty("--card2");
        root.removeProperty("--text");
        root.removeProperty("--muted");
        root.removeProperty("--muted2");
        return;
      }
      if (tgThemeParams.bg_color) root.setProperty("--bg", tgThemeParams.bg_color);
      if (tgThemeParams.secondary_bg_color) {
        root.setProperty("--card", hexToRgba(tgThemeParams.secondary_bg_color, .65));
        root.setProperty("--card2", hexToRgba(tgThemeParams.secondary_bg_color, .75));
      }
      if (tgThemeParams.text_color) root.setProperty("--text", hexToRgba(tgThemeParams.text_color, .92));
      if (tgThemeParams.hint_color) {
        root.setProperty("--muted", hexToRgba(tgThemeParams.hint_color, .72));
        root.setProperty("--muted2", hexToRgba(tgThemeParams.hint_color, .5));
      }
    }

    function applyTheme(mode){
      const normalized = (mode || "auto").toLowerCase();
      ThemeState.mode = (normalized === "system") ? "auto" : normalized;
      let theme = ThemeState.mode;
      if (theme === "auto") {
        theme = detectTelegramTheme() || (ThemeState.media?.matches ? "dark" : "light");
      }
      document.documentElement.dataset.theme = theme;
      applyTelegramThemeVars(theme);
    }

    if (tg) {
      tg.ready();
      tg.expand();
    }

    ThemeState.media?.addEventListener?.("change", ()=>{
      if (ThemeState.mode === "auto") applyTheme("auto");
    });

    function hexToRgba(hex, a){
      try{
        const h = hex.replace("#","");
        const r = parseInt(h.slice(0,2),16);
        const g = parseInt(h.slice(2,4),16);
        const b = parseInt(h.slice(4,6),16);
        return `rgba(${r},${g},${b},${a})`;
      }catch{ return ""; }
    }

    /**********************
     * API layer
     **********************/
    const API = {
      token: null,
      user: null,
      baseUrl: location.origin, // same host
      async auth(){
        const initData = tg?.initData || "";
        if (!initData) throw new Error("Нет initData. Откройте через Telegram.");
        const res = await fetch(`${API.baseUrl}/api/auth/telegram`,{
          method:"POST",
          headers: {"Content-Type":"application/json"},
          body: JSON.stringify({initData})
        });
        if (!res.ok) {
          const t = await res.text().catch(()=> "");
          throw new Error(`Auth failed: ${res.status} ${t}`);
        }
        const data = await res.json();
        API.token = data.token;
        API.user = data.user;
        localStorage.setItem("sessionToken", API.token);
        localStorage.setItem("sessionUser", JSON.stringify(API.user));
        return data;
      },
      async ensureAuth(){
        if (!API.token) {
          API.token = localStorage.getItem("sessionToken");
          try { API.user = JSON.parse(localStorage.getItem("sessionUser")||"null"); } catch { API.user=null; }
        }
        if (!API.token) return API.auth();
        // cheap /api/me check
        try{
          await API.get("/api/me");
        }catch(e){
          return API.auth();
        }
      },
      async get(path){
        return API.req(path, {method:"GET"});
      },
      async getBlob(path){
        const headers = {};
        if (API.token) headers["Authorization"] = `Bearer ${API.token}`;
        const res = await fetch(`${API.baseUrl}${path}`, { method: "GET", headers });
        if (res.status === 401 || res.status === 403) {
          const txt = await res.text().catch(()=> "");
          throw new Error(`${res.status}: ${txt || "Unauthorized"}`);
        }
        if (!res.ok) {
          const txt = await res.text().catch(()=> "");
          throw new Error(`${res.status}: ${txt || "Request failed"}`);
        }
        return res.blob();
      },
      async post(path, body){
        return API.req(path, {method:"POST", body: JSON.stringify(body)});
      },
      async put(path, body){
        return API.req(path, {method:"PUT", body: JSON.stringify(body)});
      },
      async del(path){
        return API.req(path, {method:"DELETE"});
      },
      async req(path, opts={}){
        const headers = Object.assign({"Content-Type":"application/json"}, opts.headers||{});
        if (API.token) headers["Authorization"] = `Bearer ${API.token}`;
        const res = await fetch(`${API.baseUrl}${path}`, { ...opts, headers });
        if (res.status === 401 || res.status === 403) {
          // bubble for caller to reauth UI if needed
          const txt = await res.text().catch(()=> "");
          throw new Error(`${res.status}: ${txt || "Unauthorized"}`);
        }
        if (!res.ok) {
          const txt = await res.text().catch(()=> "");
          throw new Error(`${res.status}: ${txt || "Request failed"}`);
        }
        const ctype = (res.headers.get("content-type")||"");
        if (ctype.includes("application/json")) return res.json();
        return res.text();
      }
    };

    /**********************
     * App state
     **********************/
    const State = {
      year: null,
      month: null,
      monthId: null,
      role: "viewer",

      summary: null,
      services: [],
      expenses: [],
      monthBudgets: [],
      yearAnalytics: null,
      periodAnalytics: null,
      periodType: "month",
      periodYear: null,
      periodMonth: null,
      periodQuarter: null,

      sundayDates: [],
      sundayIndex: 0,
      otherIncomeDate: null,

      charts: {
        sundayBar: null,
        expensePie: null,
        yearLine: null,
        yearBalanceBar: null,
        periodMini: null,
      },

      historyMode: "don", // don|exp
      monthCache: new Map(), // key "YYYY-MM" -> {id,...}
      monthsList: [],

      templates: [],
      categories: [],
      categoryItems: [],
      attachmentsByExpense: new Map(),
      pendingExpenseFiles: [],
      drafts: [],
      tags: [],
      expenseTags: [],
      historyTags: [],
      historyTagMode: "any",
      monitorTab: "errors",
      monitorOverview: null,
      monitorTab: "errors",
      monitorOverview: null,
      addTab: "don",
      backupItems: [],
      backupKnownNames: new Set(),
      backupRestoreFile: null,
      backupBusy: false,
      settingsPage: null,
      settingsScroll: { menu: 0, page: 0 },
    };

    /**********************
     * Attachments
     **********************/
    const AttachmentBlobCache = new Map();
    function clearAttachmentBlobCache(){
      for (const url of AttachmentBlobCache.values()){
        URL.revokeObjectURL(url);
      }
      AttachmentBlobCache.clear();
    }
    function revokeAttachmentBlob(attachmentId){
      const key = Number(attachmentId);
      const url = AttachmentBlobCache.get(key);
      if (url){
        URL.revokeObjectURL(url);
        AttachmentBlobCache.delete(key);
      }
    }
    async function getAttachmentBlobUrl(attachmentId){
      const key = Number(attachmentId);
      if (AttachmentBlobCache.has(key)) return AttachmentBlobCache.get(key);
      const blob = await API.getBlob(`/api/attachments/${key}?inline=1`);
      const url = URL.createObjectURL(blob);
      AttachmentBlobCache.set(key, url);
      return url;
    }
    async function loadAttachmentImage(img, attachmentId){
      try{
        const url = await getAttachmentBlobUrl(attachmentId);
        img.src = url;
      }catch(e){
        img.alt = "Ошибка загрузки";
      }
    }
    function isMonthClosed(){
      return Boolean(State.summary?.month?.is_closed);
    }
    function getMonthClosedMeta(){
      const monthInfo = State.summary?.month || {};
      if (!monthInfo.is_closed){
        return "Открыт";
      }
      const parts = [];
      if (monthInfo.closed_at){
        parts.push(`Закрыт ${fmtDateTime(monthInfo.closed_at)}`);
      } else {
        parts.push("Закрыт");
      }
      const closedBy = monthInfo.closed_by;
      if (closedBy){
        const name = (closedBy.name || "").trim() || `Пользователь #${closedBy.id}`;
        parts.push(`кем: ${name}`);
      }
      return parts.join(" • ");
    }
    function updateMonthClosedUI(){
      const closed = isMonthClosed();
      const badge = $("#monthClosedBadge");
      if (badge) badge.classList.toggle("hidden", !closed);

      const tabs = $("#screenAdd .tabs");
      const closedCard = $("#addClosedCard");
      const donWrap = $("#addDonationWrap");
      const expWrap = $("#addExpenseWrap");
      if (tabs) tabs.classList.toggle("hidden", closed);
      if (closedCard) closedCard.classList.toggle("hidden", !closed);
      if (donWrap) donWrap.classList.toggle("hidden", closed || State.addTab !== "don");
      if (expWrap) expWrap.classList.toggle("hidden", closed || State.addTab !== "exp");

      updateAddButtonsByRole();
      updateAttachmentControls();
      renderDraftsCard();
      renderSettingsMonthClose();
    }
    function renderSettingsMonthClose(){
      const status = $("#monthCloseStatus");
      const meta = $("#monthCloseMeta");
      const badge = $("#monthCloseBadge");
      if (!status || !meta || !badge) return;
      if (!State.monthId){
        status.textContent = "Месяц не выбран";
        meta.textContent = "—";
        badge.classList.add("hidden");
        return;
      }
      const closed = isMonthClosed();
      status.textContent = closed ? "Месяц закрыт" : "Месяц открыт";
      meta.textContent = getMonthClosedMeta();
      badge.classList.toggle("hidden", !closed);

      const canAdmin = State.role === "admin";
      const closeBtn = $("#closeMonthBtn");
      const reopenBtn = $("#reopenMonthBtn");
      if (closeBtn) {
        closeBtn.classList.toggle("hidden", !canAdmin);
        closeBtn.disabled = closed || !canAdmin;
      }
      if (reopenBtn) {
        reopenBtn.classList.toggle("hidden", !canAdmin);
        reopenBtn.disabled = !closed || !canAdmin;
      }
    }
    function canEditAttachments(){
      const canRole = (State.role === "admin" || State.role === "accountant");
      return canRole && !isMonthClosed();
    }
    function setExpenseAttachments(expenseId, items){
      State.attachmentsByExpense.set(Number(expenseId), items || []);
    }
    function getExpenseAttachments(expenseId){
      return State.attachmentsByExpense.get(Number(expenseId)) || [];
    }
    async function fetchExpenseAttachments(expenseId){
      const data = await API.get(`/api/expenses/${expenseId}/attachments`);
      const items = data.items || [];
      setExpenseAttachments(expenseId, items);
      return items;
    }
    async function deleteAttachment(attachment, expenseId, grid){
      if (!canEditAttachments()) return false;
      const ok = confirm("Удалить файл?");
      if (!ok) return false;
      await API.del(`/api/attachments/${attachment.id}`);
      revokeAttachmentBlob(attachment.id);
      const items = await fetchExpenseAttachments(expenseId);
      if (grid) renderAttachmentGrid(grid, items, expenseId, {showEmpty:true});
      await refreshAll();
      setToast("Удалено");
      return true;
    }
    function buildAttachmentThumb(attachment, expenseId, grid){
      const div = document.createElement("div");
      div.className = "attachThumb";
      const mime = (attachment.mime || "").toLowerCase();
      const isPdf = mime.includes("pdf");
      if (isPdf){
        div.innerHTML = `
          <div class="attachBadge">PDF</div>
          <span class="icon attachIcon">picture_as_pdf</span>
        `;
      } else {
        const img = document.createElement("img");
        img.alt = "Загрузка...";
        div.appendChild(img);
        loadAttachmentImage(img, attachment.id);
      }
      if (canEditAttachments()){
        const removeBtn = document.createElement("button");
        removeBtn.type = "button";
        removeBtn.className = "attachRemove";
        removeBtn.innerHTML = `<span class="icon">close</span>`;
        removeBtn.addEventListener("click", async (e)=>{
          e.stopPropagation();
          try{
            await deleteAttachment(attachment, expenseId, grid);
          }catch(err){
            alert(String(err.message || err));
          }
        });
        div.appendChild(removeBtn);
      }
      div.addEventListener("click", ()=> { void openAttachmentViewer(attachment, expenseId); });
      requestAnimationFrame(()=> div.classList.add("show"));
      return div;
    }
    function buildQueuedThumb(file, index){
      const div = document.createElement("div");
      div.className = "attachThumb attachQueued show";
      const isPdf = (file.type || "").includes("pdf");
      if (isPdf){
        div.innerHTML = `
          <div class="attachBadge">PDF</div>
          <span class="icon attachIcon">schedule</span>
        `;
      } else {
        const img = document.createElement("img");
        img.src = URL.createObjectURL(file);
        div.appendChild(img);
      }
      const removeBtn = document.createElement("button");
      removeBtn.type = "button";
      removeBtn.className = "attachRemove";
      removeBtn.innerHTML = `<span class="icon">close</span>`;
      removeBtn.addEventListener("click", (e)=>{
        e.stopPropagation();
        removePendingExpenseFile(index);
      });
      div.appendChild(removeBtn);
      return div;
    }
    function renderAttachmentGrid(grid, items, expenseId, {showEmpty=false} = {}){
      grid.innerHTML = "";
      if (!items.length){
        if (showEmpty){
          const empty = document.createElement("div");
          empty.className = "tiny muted2";
          empty.textContent = "Нет файлов";
          grid.appendChild(empty);
        }
        return;
      }
      items.forEach((att)=> grid.appendChild(buildAttachmentThumb(att, expenseId, grid)));
    }
    function createUploadSkeleton(){
      const wrap = document.createElement("div");
      wrap.className = "attachSkeleton";
      const progress = document.createElement("div");
      progress.className = "attachProgress";
      wrap.appendChild(progress);
      return {wrap, progress};
    }
    function uploadAttachment(expenseId, file, onProgress){
      return new Promise((resolve, reject)=>{
        const xhr = new XMLHttpRequest();
        xhr.open("POST", `${API.baseUrl}/api/expenses/${expenseId}/attachments`);
        if (API.token) xhr.setRequestHeader("Authorization", `Bearer ${API.token}`);
        xhr.onload = ()=>{
          const ok = xhr.status >= 200 && xhr.status < 300;
          if (!ok){
            reject(new Error(`${xhr.status}: ${xhr.responseText || "Upload failed"}`));
            return;
          }
          try{
            const data = JSON.parse(xhr.responseText);
            resolve(data);
          }catch(e){
            reject(new Error("Invalid upload response"));
          }
        };
        xhr.onerror = ()=> reject(new Error("Upload failed"));
        xhr.upload.onprogress = (e)=>{
          if (e.lengthComputable && typeof onProgress === "function"){
            onProgress(e.loaded / e.total);
          }
        };
        const form = new FormData();
        form.append("file", file);
        xhr.send(form);
      });
    }
    async function uploadExpenseAttachments(expenseId, files, grid){
      if (!canEditAttachments()){
        alert("Загрузка недоступна.");
        return;
      }
      if (!files.length) return;
      const existing = getExpenseAttachments(expenseId);
      if (existing.length >= ATTACHMENT_LIMIT){
        alert("Достигнут лимит вложений (10).");
        return;
      }

      const queue = Array.from(files).filter((file)=> file);
      const filtered = [];
      for (const file of queue){
        if (!ATTACHMENT_ACCEPT.split(",").includes(file.type)){
          alert(`Тип файла не поддерживается: ${file.name}`);
          continue;
        }
        if (file.size > ATTACHMENT_MAX_BYTES){
          alert(`Файл слишком большой (до 10 МБ): ${file.name}`);
          continue;
        }
        filtered.push(file);
      }
      if (!filtered.length) return;
      if (existing.length + filtered.length > ATTACHMENT_LIMIT){
        alert("Превышен лимит вложений на расход (10).");
        return;
      }

      grid.innerHTML = "";
      for (const file of filtered){
        const {wrap, progress} = createUploadSkeleton();
        grid.appendChild(wrap);
        try{
          const result = await uploadAttachment(expenseId, file, (pct)=>{
            progress.style.width = `${Math.round(pct * 100)}%`;
          });
          const attachment = result.attachment;
          if (attachment){
            const thumb = buildAttachmentThumb(attachment, expenseId, grid);
            grid.replaceChild(thumb, wrap);
          }
        }catch(e){
          wrap.classList.add("attachQueued");
          wrap.innerHTML = `<div class="attachBadge">Ошибка</div>`;
          alert(String(e.message || e));
        }
      }
      const items = await fetchExpenseAttachments(expenseId);
      renderAttachmentGrid(grid, items, expenseId, {showEmpty:true});
    }

    const Viewer = { attachment: null, expenseId: null };

    async function openAttachmentViewer(attachment, expenseId){
      Viewer.attachment = attachment;
      Viewer.expenseId = expenseId;
      $("#viewerTitle").textContent = attachment.orig_filename || "Чек/скан";
      const content = $("#viewerContent");
      content.innerHTML = `<div class="tiny muted2">Загрузка...</div>`;
      const mime = (attachment.mime || "").toLowerCase();
      let url = "";
      try{
        url = await getAttachmentBlobUrl(attachment.id);
      }catch(e){
        content.innerHTML = `<div class="tiny muted2">Не удалось загрузить файл</div>`;
        return;
      }
      content.innerHTML = "";
      if (mime.includes("pdf")){
        const frame = document.createElement("iframe");
        frame.src = url;
        content.appendChild(frame);
      } else {
        const img = document.createElement("img");
        img.src = url;
        content.appendChild(img);
      }
      const canDelete = canEditAttachments();
      $("#viewerDeleteBtn").classList.toggle("hidden", !canDelete);
      $("#viewerDeleteBtn").disabled = !canDelete;
      $("#viewerModal").classList.add("show");
    }
    function closeViewerModal(){
      $("#viewerModal").classList.remove("show");
      Viewer.attachment = null;
      Viewer.expenseId = null;
    }
    function renderPendingExpenseAttachments(){
      const grid = $("#expAttachGrid");
      grid.innerHTML = "";
      if (!State.pendingExpenseFiles.length) return;
      State.pendingExpenseFiles.forEach((file, index)=> grid.appendChild(buildQueuedThumb(file, index)));
    }
    function removePendingExpenseFile(index){
      State.pendingExpenseFiles.splice(index, 1);
      renderPendingExpenseAttachments();
    }
    function addPendingExpenseFiles(fileList){
      const queue = Array.from(fileList || []);
      if (!queue.length) return;
      const filtered = [];
      for (const file of queue){
        if (!ATTACHMENT_ACCEPT.split(",").includes(file.type)){
          alert(`Тип файла не поддерживается: ${file.name}`);
          continue;
        }
        if (file.size > ATTACHMENT_MAX_BYTES){
          alert(`Файл слишком большой (до 10 МБ): ${file.name}`);
          continue;
        }
        filtered.push(file);
      }
      if (!filtered.length) return;
      const total = State.pendingExpenseFiles.length + filtered.length;
      if (total > ATTACHMENT_LIMIT){
        alert("Превышен лимит вложений на расход (10).");
        return;
      }
      State.pendingExpenseFiles = State.pendingExpenseFiles.concat(filtered);
      renderPendingExpenseAttachments();
    }

    /**********************
     * Drafts
     **********************/
    function canSeeDrafts(){
      return State.role === "admin" || State.role === "accountant";
    }
    async function loadDrafts(){
      if (!State.monthId || !canSeeDrafts()){
        State.drafts = [];
        renderDraftsCard();
        return;
      }
      const scope = (State.role === "admin") ? "all" : "mine";
      try{
        const data = await API.get(`/api/months/${State.monthId}/drafts?kind=expense&scope=${scope}`);
        State.drafts = data.items || [];
      }catch(e){
        State.drafts = [];
      }
      renderDraftsCard();
    }
    function renderDraftsCard(){
      const card = $("#draftsCard");
      if (!card) return;
      if (!canSeeDrafts() || !State.monthId || isMonthClosed()){
        card.classList.add("hidden");
        return;
      }
      card.classList.remove("hidden");
      $("#draftsCount").textContent = String(State.drafts.length || 0);
    }
    function openDraftsModal(){
      if (!canSeeDrafts() || isMonthClosed()) return; if (!canSeeDrafts()) return;
      renderDraftsList();
      $("#draftsModal").classList.add("show");
    }
    function closeDraftsModal(){
      $("#draftsModal").classList.remove("show");
    }
    function ensureExpenseCategoryOption(category){
      if (!category) return;
      const sel = $("#expCategory");
      const exists = Array.from(sel.options).some((opt)=> opt.value === category);
      if (!exists){
        const o = document.createElement("option");
        o.value = category;
        o.textContent = category;
        sel.appendChild(o);
      }
    }
    function applyDraftToForm(draft){
      const payload = draft.payload || {};
      const date = payload.expense_date || toIsoDateLocal(new Date());
      const category = payload.category || "Прочее";
      const title = payload.title || "Расход";
      const qty = payload.qty ?? 1;
      const unit = payload.unit_amount ?? 0;
      const comment = payload.comment || "";
      const tags = payload.tags || [];

      switchScreen("add");
      setAddTab("exp");
      $("#expDate").value = date;
      ensureExpenseCategoryOption(category);
      $("#expCategory").value = category;
      syncDropdown("expCategory");
      $("#expTitle").value = title;
      $("#expQty").value = String(qty);
      $("#expUnit").value = String(unit);
      $("#expComment").value = comment;
      setExpenseTags(tags);
      recalcExpenseTotals();
      updateWarningsExpenseForm();
      closeDraftsModal();
    }
    function buildDraftPayloadFromForm(){
      const date = $("#expDate").value || toIsoDateLocal(new Date());
      const qtyRaw = $("#expQty").value;
      const unitRaw = $("#expUnit").value;
      const qty = (qtyRaw === "" || qtyRaw === null) ? 1 : Number(qtyRaw || 1);
      const unit_amount = (unitRaw === "" || unitRaw === null) ? 0 : Number(unitRaw || 0);
      const category = ($("#expCategory").value || "").trim() || "Прочее";
      const title = ($("#expTitle").value || "").trim() || "Расход";
      const commentRaw = ($("#expComment").value || "").trim();
      const comment = commentRaw ? commentRaw : null;
      const tags = State.expenseTags.length ? State.expenseTags : null;
      return { expense_date: date, category, title, qty, unit_amount, comment, tags };
    }
    function renderDraftsList(){
      const list = $("#draftsList");
      list.innerHTML = "";
      if (!State.drafts.length){
        list.innerHTML = `<div class="tiny muted">Нет черновиков</div>`;
        return;
      }
      const canEdit = !isMonthClosed();
      State.drafts.forEach((draft)=>{
        const payload = draft.payload || {};
        const summary = draft.summary || {};
        const title = summary.title || payload.title || "Расход";
        const category = summary.category || payload.category || "Прочее";
        const expenseDate = summary.expense_date || payload.expense_date || "";
        const total = summary.total ?? (Number(payload.qty || 0) * Number(payload.unit_amount || 0));

        const item = document.createElement("div");
        item.className = "draftItem";

        const main = document.createElement("div");
        main.className = "draftMain";

        const left = document.createElement("div");
        left.innerHTML = `
          <div class="draftTitle">${escapeHtml(title)}</div>
          <div class="draftMeta">${escapeHtml(category)}${expenseDate ? ` • ${fmtShortDate(expenseDate)}` : ""}</div>
        `;

        const right = document.createElement("div");
        right.className = "draftAmount";
        right.textContent = fmtMoney(total);

        main.appendChild(left);
        main.appendChild(right);

        const actions = document.createElement("div");
        actions.className = "draftActions";

        const openBtn = document.createElement("button");
        openBtn.className = "btn small";
        openBtn.type = "button";
        openBtn.textContent = "Открыть";
        openBtn.addEventListener("click", ()=> applyDraftToForm(draft));

        const submitBtn = document.createElement("button");
        submitBtn.className = "btn primary small";
        submitBtn.type = "button";
        submitBtn.textContent = "Провести";
        submitBtn.disabled = !canEdit;
        submitBtn.style.opacity = canEdit ? "1" : ".55";
        submitBtn.addEventListener("click", async ()=>{
          if (!canEdit) return;
          try{
            await API.post(`/api/drafts/${draft.id}/submit`, {});
            setToast("Проведено");
            await refreshAll();
            await loadDrafts();
            renderDraftsList();
          }catch(e){
            alert(String(e.message || e));
          }
        });

        const deleteBtn = document.createElement("button");
        deleteBtn.className = "btn small";
        deleteBtn.type = "button";
        deleteBtn.textContent = "Удалить";
        deleteBtn.disabled = !canEdit;
        deleteBtn.style.opacity = canEdit ? "1" : ".55";
        deleteBtn.addEventListener("click", async ()=>{
          if (!canEdit) return;
          const ok = confirm("Удалить черновик?");
          if (!ok) return;
          try{
            await API.del(`/api/drafts/${draft.id}`);
            const height = item.offsetHeight;
            item.style.height = `${height}px`;
            requestAnimationFrame(()=>{
              item.classList.add("removing");
              item.style.height = "0px";
            });
            State.drafts = State.drafts.filter((d)=> d.id !== draft.id);
            renderDraftsCard();
            setTimeout(()=>{
              renderDraftsList();
            }, 200);
            setToast("Удалено");
          }catch(e){
            alert(String(e.message || e));
          }
        });

        actions.appendChild(openBtn);
        actions.appendChild(submitBtn);
        actions.appendChild(deleteBtn);

        item.appendChild(main);
        item.appendChild(actions);
        list.appendChild(item);
      });
    }
    async function saveExpenseDraft(){
      if (!State.monthId) {
        alert("Месяц не создан. Попросите админа создать месяц.");
        return;
      }
      if (!canSeeDrafts()){
        alert("У вашей роли нет прав на изменение данных.");
        return;
      }
      if (isMonthClosed()){
        notifyMonthClosed($("#addExpenseCard"));
        return;
      }
      const payload = buildDraftPayloadFromForm();
      await API.post(`/api/months/${State.monthId}/drafts/expenses`, payload);
      setToast("Черновик сохранён");
      await loadDrafts();
      resetExpenseForm();
    }

    /**********************
     * Templates (local)
     **********************/
    function defaultTemplates(){
      return [
        {title:"Оплата за зал", category:"Зал", unit_amount:2500},
        {title:"Аренда офис 1", category:"Аренда", unit_amount:6200},
        {title:"Аренда офис 2", category:"Аренда", unit_amount:10000},
        {title:"Зп пастора", category:"ЗП", unit_amount:10000},
        {title:"Благословение пастора", category:"Благословение", unit_amount:4000},
      ];
    }
    function loadTemplates(){
      const raw = localStorage.getItem("expenseTemplates");
      if (!raw) {
        State.templates = defaultTemplates();
        saveTemplatesToStorage();
        return;
      }
      try {
        const arr = JSON.parse(raw);
        if (Array.isArray(arr)) State.templates = arr;
        else State.templates = defaultTemplates();
      } catch {
        State.templates = defaultTemplates();
      }
    }
    function saveTemplatesToStorage(){
      localStorage.setItem("expenseTemplates", JSON.stringify(State.templates, null, 2));
    }
    function rebuildTemplateSelect(){
      const sel = $("#expTemplate");
      sel.innerHTML = "";
      const opt0 = document.createElement("option");
      opt0.value = "";
      opt0.textContent = "— Выбрать шаблон —";
      sel.appendChild(opt0);
      State.templates.forEach((t, i)=>{
        const o = document.createElement("option");
        o.value = String(i);
        o.textContent = `${t.title} — ${fmtMoney(t.unit_amount)}`;
        sel.appendChild(o);
      });
      syncDropdown("expTemplate");
    }

    /**********************
     * Month utils
     **********************/
    function keyYM(y,m){ return `${y}-${String(m).padStart(2,"0")}`; }

    function todayYMD(){
      const d = new Date();
      return {y:d.getFullYear(), m:d.getMonth()+1, d:d.getDate()};
    }

    function quarterFromMonth(month){
      return Math.floor((Number(month || 1) - 1) / 3) + 1;
    }

    function computeSundays(y, m){
      // JS Date: month 0..11
      const sundays = [];
      const first = new Date(y, m-1, 1);
      const last = new Date(y, m, 0);
      for(let day=1; day<=last.getDate(); day++){
        const d = new Date(y, m-1, day);
        if (d.getDay() === 0) { // Sunday 0
          sundays.push(toIsoDateLocal(d));
        }
      }
      return sundays;
    }

    function setMonthTitle(){
      $("#monthTitle").textContent = `${monthNameRu(State.month)} ${State.year}`;
      $("#monthMeta").textContent = State.monthId ? `ID месяца: ${State.monthId}` : "—";
    }

    async function loadMonthsForYear(y){
      const data = await API.get(`/api/months?year=${encodeURIComponent(y)}`);
      State.monthsList = data.items || [];
      State.monthCache.clear();
      for(const item of State.monthsList){
        State.monthCache.set(keyYM(item.year, item.month), item);
      }
      rebuildHistoryMonthSelect();
    }

    async function loadYearAnalytics(){
      const data = await API.get(`/api/analytics/year?year=${encodeURIComponent(State.year)}`);
      State.yearAnalytics = data;
    }

    async function loadPeriodAnalytics(){
      const type = State.periodType || "month";
      const year = Number(State.periodYear || State.year);
      const month = Number(State.periodMonth || State.month);
      const quarter = Number(State.periodQuarter || quarterFromMonth(month));
      const params = new URLSearchParams({ type, year: String(year) });
      if (type === "month") params.set("month", String(month));
      if (type === "quarter") params.set("quarter", String(quarter));
      const data = await API.get(`/api/analytics/period?${params.toString()}`);
      State.periodAnalytics = data;
    }

    async function loadTags(){
      try{
        const data = await API.get("/api/tags");
        State.tags = data.items || [];
      }catch(e){
        State.tags = [];
      }
    }


    async function loadCategories(){
      try{
        const data = await API.get("/api/categories");
        State.categoryItems = data.items || [];
      }catch(e){
        State.categoryItems = [];
      }
      rebuildCategories();
      renderCategoriesSection();
    }

    async function ensureSelectedMonthExists(){
      const k = keyYM(State.year, State.month);
      const m = State.monthCache.get(k);
      if (m) {
        State.monthId = m.id;
        $("#dashEmptyState").classList.add("hidden");
        return true;
      }
      State.monthId = null;
      $("#dashEmptyState").classList.remove("hidden");
      return false;
    }

    async function loadLatestMonthFallback(){
      const data = await API.get("/api/months/latest");
      if (!data?.item) return false;
      State.year = data.item.year;
      State.month = data.item.month;
      await loadMonthsForYear(State.year);
      await ensureSelectedMonthExists();
      if (!State.monthId) {
        await loadLatestMonthFallback();
      }
      setMonthTitle();
      return Boolean(State.monthId);
    }


    function refreshSundayDates(){
      State.sundayDates = computeSundays(State.year, State.month);
      if (State.sundayDates.length === 0) {
        State.sundayIndex = 0;
        return;
      }
      State.sundayIndex = clamp(findDefaultSundayIndex(), 0, State.sundayDates.length - 1);
    }

    async function createMonthIfAdmin(){
      if (State.role !== "admin") {
        alert("Только admin может создавать месяц.");
        return;
      }
      const body = {
        year: State.year,
        month: State.month,
        monthly_min_needed: 0.0,
        start_balance: null,
        sundays_override: null
      };
      await API.post("/api/months", body);
      await loadMonthsForYear(State.year);
      const hasMonth = await ensureSelectedMonthExists();
      if (!hasMonth) {
        await loadLatestMonthFallback();
      }
      await refreshAll();
      setToast("Месяц создан");
    }

    /**********************
     * Data loading
     **********************/
    async function refreshAll(){
      await loadTags();
      await loadCategories();
      await loadYearAnalytics();
      await loadPeriodAnalytics();
      refreshSundayDates();
      if (!State.monthId) {
        // clear UI
        renderEmptyMonth();
        renderYearAnalytics();
        renderPeriodSummary();
        updateDonationDateUI();
        updateAttachmentControls();
        renderDraftsCard();
        State.monthBudgets = [];
        updateMonthClosedUI();
        return;
      }
      const [summary, services, expenses, budgets] = await Promise.all([
        API.get(`/api/months/${State.monthId}/summary`),
        API.get(`/api/months/${State.monthId}/services`),
        API.get(`/api/months/${State.monthId}/expenses`),
        API.get(`/api/months/${State.monthId}/budget`)
      ]);
      State.summary = summary;
      State.services = services.items || [];
      State.expenses = expenses.items || [];
      State.monthBudgets = budgets.items || [];
      State.attachmentsByExpense.clear();
      clearAttachmentBlobCache();

      rebuildCategories();

      updateDonationDateUI();

      renderDashboard();
      renderHistory();
      updateWarningsExpenseForm();
      updateAttachmentControls();
      renderBudgetSettings();
      await loadDrafts();
      updateMonthClosedUI();
    }

    function findDefaultSundayIndex(){
      const today = new Date();
      const todayISO = toIsoDateLocal(new Date(today.getFullYear(), today.getMonth(), today.getDate()));
      const idx = State.sundayDates.findLastIndex ? State.sundayDates.findLastIndex(d=>d<=todayISO) : (() => {
        let last = -1;
        for (let i=0;i<State.sundayDates.length;i++) if (State.sundayDates[i] <= todayISO) last = i;
        return last;
      })();
      return (idx >= 0) ? idx : 0;
    }

    function renderEmptyMonth(){
      $("#mIncome").textContent = "—";
      $("#mExpenses").textContent = "—";
      $("#mBalance").textContent = "—";
      $("#mFactBalance").textContent = "—";
      $("#mCompletion").textContent = "—";
      $("#mMinNeeded").textContent = "—";
      $("#mCollected").textContent = "—";
      $("#mNeedMore").textContent = "—";
      $("#mSDDR").textContent = "—";
      $("#mPSDPM").textContent = "—";
      $("#mnspsBadge").textContent = "—";
      $("#expenseSum").textContent = "—";
      $("#lastExpensesList").innerHTML = "";
      $("#sundayBadges").innerHTML = "";
      $("#budgetMeta").textContent = "—";
      $("#budgetSubtitle").textContent = "—";
      $("#budgetList").innerHTML = "";

      destroyCharts();
    }

    function destroyCharts(){
      try { State.charts.sundayBar?.destroy(); } catch {}
      try { State.charts.expensePie?.destroy(); } catch {}
      try { State.charts.yearLine?.destroy(); } catch {}
      try { State.charts.yearBalanceBar?.destroy(); } catch {}
      try { State.charts.periodMini?.destroy(); } catch {}
      State.charts.sundayBar = null;
      State.charts.expensePie = null;
      State.charts.yearLine = null;
      State.charts.yearBalanceBar = null;
      State.charts.periodMini = null;
    }

    function setBudgetCollectionExpanded(expanded){
      const card = $("#budgetCollection");
      const toggle = $("#budgetToggle");
      if (!card || !toggle) return;
      card.classList.toggle("expanded", expanded);
      toggle.setAttribute("aria-expanded", expanded ? "true" : "false");
    }

    function renderBudgetCollection(){
      const list = $("#budgetList");
      if (!list) return;
      const items = State.monthBudgets || [];
      list.innerHTML = "";
      $("#budgetMeta").textContent = items.length ? `Категорий: ${items.length}` : "—";
      $("#budgetSubtitle").textContent = items.length ? "Факт / лимит" : "Лимиты не заданы";

      if (!items.length){
        list.innerHTML = `<div class="tiny muted">Лимитов на месяц пока нет.</div>`;
        return;
      }

      items.forEach((item)=> {
        const limit = Number(item.limit_amount || 0);
        const fact = Number(item.fact || 0);
        const warnThreshold = Number(item.warn_threshold || 0.9);
        const usage = limit > 0 ? fact / limit : null;
        const status = item.status || getBudgetStatus(usage, warnThreshold);
        const pct = limit > 0 ? Math.min(Math.max(usage || 0, 0), 1) : 0;

        const row = document.createElement("div");
        row.className = "budgetRow";
        row.classList.toggle("warn", status === "WARN");
        row.classList.toggle("over", status === "OVER");
        row.innerHTML = `
          <div class="budgetMeta">
            <div class="budgetName">${escapeHtml(item.category_name || item.category || "—")}</div>
            <div class="budgetValues">${fmtMoney(fact)} / ${limit > 0 ? fmtMoney(limit) : "—"}</div>
          </div>
          <div class="budgetBar"><div class="budgetBarFill" style="width:${Math.round(pct * 100)}%"></div></div>
        `;
        list.appendChild(row);
      });
    }


    /**********************
     * Rendering: Dashboard
     **********************/
    function renderDashboard(){
      const s = State.summary;
      renderYearAnalytics();
      renderPeriodSummary();
      if (!s) return;

      $("#mIncome").textContent = fmtMoney(s.month_income_sum);
      $("#mExpenses").textContent = fmtMoney(s.month_expenses_sum);
      $("#mBalance").textContent = fmtMoney(s.month_balance);
      $("#mFactBalance").textContent = fmtMoney(s.fact_balance);

      // ring
      const pct = Math.round((Number(s.monthly_completion || 0) * 100) * 10) / 10;
      $("#mCompletion").textContent = `${pct.toFixed(1)}%`;
      const deg = clamp(Number(s.monthly_completion || 0), 0, 1) * 360;
      $("#ring").style.background = `conic-gradient(var(--accent) ${deg}deg, rgba(255,255,255,.08) 0deg)`;

      $("#mMinNeeded").textContent = fmtMoney(s.monthly_min_needed);
      $("#mCollected").textContent = fmtMoney(s.month_income_sum);

      const needMore = Math.max(0, Number(s.monthly_min_needed) - Number(s.month_income_sum));
      $("#mNeedMore").textContent = (needMore > 0)
        ? `Не хватает ${fmtMoney(needMore)} до МНСП`
        : `МНСП выполнено 🎉`;

      // badge
      const badge = $("#mnspsBadge");
      badge.classList.remove("ok","warn","bad");
      if (Number(s.month_income_sum) >= Number(s.monthly_min_needed) && Number(s.monthly_min_needed) > 0){
        badge.classList.add("ok");
        badge.textContent = "МНСП: выполнено";
      } else if (Number(s.monthly_min_needed) > 0 && Number(s.month_income_sum) > 0){
        badge.classList.add("warn");
        badge.textContent = "МНСП: в процессе";
      } else {
        badge.classList.add("bad");
        badge.textContent = "МНСП: нет данных";
      }

      $("#mSDDR").textContent = (Number(s.sddr) > 0) ? fmtMoney(s.sddr) : "Нет суммы";
      $("#mPSDPM").textContent = (typeof s.psdpm === "number") ? `${(s.psdpm*100).toFixed(1)}%` : "—";

      renderBudgetCollection();
      renderSundayChart();
      renderExpensePie();
      renderLastExpenses();
      updateAddButtonsByRole();
    }

    function renderYearAnalytics(){
      const ya = State.yearAnalytics;
      if (!ya || !ya.totals || !ya.months) {
        renderYearEmpty();
        return;
      }

      const totals = ya.totals;
      const monthCount = totals.months_count || 0;

      $("#yearMeta").textContent = `Год ${ya.year} • месяцев: ${monthCount} из 12 • сравнение с ${ya.prev_year?.year ?? "—"}`;
      $("#yIncome").textContent = fmtMoney(totals.income);
      $("#yExpenses").textContent = fmtMoney(totals.expenses);
      $("#yBalance").textContent = fmtMoney(totals.balance);
      $("#yYoY").textContent = fmtPercent(ya.yoy?.income, 1);

      renderYearChips(ya.good_months || [], ya.bad_months || []);
      const isExpanded = $("#yearCollection").classList.contains("expanded");
      if (isExpanded) {
        renderYearCharts(ya.months || []);
      } else {
        try { State.charts.yearLine?.destroy(); } catch {}
        try { State.charts.yearBalanceBar?.destroy(); } catch {}
        State.charts.yearLine = null;
        State.charts.yearBalanceBar = null;
      }
    }

    function renderPeriodSummary(){
      const p = State.periodAnalytics;
      const card = $("#periodCollection");
      if (!card) return;
      if (!p || !p.totals || !p.period) {
        renderPeriodEmpty();
        return;
      }

      const periodLabel = p.period.type === "month"
        ? "Месяц"
        : (p.period.type === "quarter" ? "Квартал" : "Год");
      $("#periodMeta").textContent = `${periodLabel} • ${p.period.start} — ${p.period.end}`;
      $("#periodIncomeValue").textContent = fmtMoney(p.totals.income);
      $("#periodExpensesValue").textContent = fmtMoney(p.totals.expenses);
      $("#periodNetValue").textContent = fmtMoney(p.totals.net);

      formatDeltaBadge($("#periodIncomeDelta"), p.delta?.income_pct, true);
      formatDeltaBadge($("#periodExpensesDelta"), p.delta?.expenses_pct, false);
      formatDeltaBadge($("#periodNetDelta"), p.delta?.net_pct, true);

      const canSeeTop = State.role === "admin" || State.role === "accountant";
      const topCard = $("#periodTopExpensesCard");
      if (topCard) topCard.classList.toggle("hidden", !canSeeTop);
      if (canSeeTop) {
        renderPeriodTopExpenses(p.top_expenses_by_category || []);
      }

      const isExpanded = card?.classList.contains("expanded");
      if (isExpanded) {
        renderPeriodMiniChart(p.totals);
      } else {
        try { State.charts.periodMini?.destroy(); } catch {}
        State.charts.periodMini = null;
      }
    }

    function renderPeriodTopExpenses(items){
      const wrap = $("#periodTopExpenses");
      if (!wrap) return;
      wrap.innerHTML = "";
      if (!items.length) {
        wrap.innerHTML = `<div class="tiny muted">Нет данных</div>`;
        return;
      }
      items.forEach((item)=>{
        const row = document.createElement("div");
        row.className = "periodTopItem";
        row.innerHTML = `
          <div class="small">${escapeHtml(item.category || "—")}</div>
          <div class="bold mono">${fmtMoney(item.sum || 0)}</div>
        `;
        wrap.appendChild(row);
      });
    }

    function renderPeriodMiniChart(totals){
      const income = Number(totals?.income || 0);
      const expenses = Number(totals?.expenses || 0);
      const styles = getComputedStyle(document.documentElement);
      const accent = styles.getPropertyValue("--accent").trim() || "#10b981";
      const danger = styles.getPropertyValue("--danger").trim() || "#ef4444";
      const muted = styles.getPropertyValue("--muted").trim();
      const stroke = styles.getPropertyValue("--stroke").trim();

      try { State.charts.periodMini?.destroy(); } catch {}
      const canvas = $("#periodMiniChart");
      if (!canvas) {
        State.charts.periodMini = null;
        return;
      }
      const ctx = canvas.getContext("2d");
      State.charts.periodMini = new Chart(ctx, {
        type: "bar",
        data: {
          labels: ["Доход", "Расход"],
          datasets: [{
            data: [income, expenses],
            backgroundColor: [accent, danger],
            borderRadius: 10,
            borderWidth: 0,
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          animation: { duration: 700 },
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: (ctx)=> ` ${fmtMoney(ctx.raw)}`
              }
            }
          },
          scales: {
            x: { grid: { display: false }, ticks: { color: muted } },
            y: { beginAtZero: true, grid: { color: stroke }, ticks: { color: muted } }
          }
        }
      });
    }

    function renderPeriodEmpty(){
      if (!hasPeriodUI()) return;
      $("#periodMeta").textContent = "—";
      $("#periodIncomeValue").textContent = "—";
      $("#periodExpensesValue").textContent = "—";
      $("#periodNetValue").textContent = "—";
      formatDeltaBadge($("#periodIncomeDelta"), null, true);
      formatDeltaBadge($("#periodExpensesDelta"), null, false);
      formatDeltaBadge($("#periodNetDelta"), null, true);
      const canSeeTop = State.role === "admin" || State.role === "accountant";
      const topCard = $("#periodTopExpensesCard");
      if (topCard) topCard.classList.toggle("hidden", !canSeeTop);
      const topWrap = $("#periodTopExpenses");
      if (topWrap) topWrap.innerHTML = `<div class="tiny muted">Нет данных</div>`;
      try { State.charts.periodMini?.destroy(); } catch {}
      State.charts.periodMini = null;
    }

    function renderYearEmpty(){
      $("#yearMeta").textContent = "—";
      $("#yIncome").textContent = "—";
      $("#yExpenses").textContent = "—";
      $("#yBalance").textContent = "—";
      $("#yYoY").textContent = "—";
      $("#goodMonths").innerHTML = `<div class="tiny muted">Нет данных</div>`;
      $("#badMonths").innerHTML = `<div class="tiny muted">Нет данных</div>`;
      try { State.charts.yearLine?.destroy(); } catch {}
      try { State.charts.yearBalanceBar?.destroy(); } catch {}
      State.charts.yearLine = null;
      State.charts.yearBalanceBar = null;
    }

    function formatDeltaBadge(el, pct, positiveGood){
      if (!el) return;
      el.classList.remove("positive", "negative", "neutral");
      if (typeof pct !== "number" || !isFinite(pct)){
        el.textContent = "—";
        el.classList.add("neutral");
        return;
      }
      const value = pct * 100;
      const formatted = `${value > 0 ? "+" : ""}${value.toFixed(1)}%`;
      el.textContent = formatted;
      if (value === 0){
        el.classList.add("neutral");
      } else if ((value > 0 && positiveGood) || (value < 0 && !positiveGood)){
        el.classList.add("positive");
      } else {
        el.classList.add("negative");
      }
    }


    function renderYearChips(good, bad){
      const goodWrap = $("#goodMonths");
      const badWrap = $("#badMonths");
      goodWrap.innerHTML = "";
      badWrap.innerHTML = "";

      if (!good.length) {
        goodWrap.innerHTML = `<div class="tiny muted">Нет данных</div>`;
      } else {
        good.forEach((m)=>{
          const chip = document.createElement("div");
          chip.className = "chip ok";
          chip.textContent = `${monthNameRu(m.month)} • ${fmtPercent(m.completion, 0)}`;
          goodWrap.appendChild(chip);
        });
      }

      if (!bad.length) {
        badWrap.innerHTML = `<div class="tiny muted">Нет данных</div>`;
      } else {
        bad.forEach((m)=>{
          const chip = document.createElement("div");
          chip.className = "chip bad";
          chip.textContent = `${monthNameRu(m.month)} • ${fmtPercent(m.completion, 0)}`;
          badWrap.appendChild(chip);
        });
      }
    }

    function renderYearCharts(months){
      const labels = months.map((m)=> monthNameRu(m.month).slice(0,3));
      const incomes = months.map((m)=> m.has_data ? Number(m.income || 0) : null);
      const expenses = months.map((m)=> m.has_data ? Number(m.expenses || 0) : null);
      const balances = months.map((m)=> m.has_data ? Number(m.balance || 0) : null);

      const styles = getComputedStyle(document.documentElement);
      const accent = styles.getPropertyValue("--accent").trim() || "#10b981";
      const danger = styles.getPropertyValue("--danger").trim() || "#ef4444";
      const muted = styles.getPropertyValue("--muted").trim();
      const stroke = styles.getPropertyValue("--stroke").trim();

      try { State.charts.yearLine?.destroy(); } catch {}
      const lineCtx = $("#yearLine").getContext("2d");
      State.charts.yearLine = new Chart(lineCtx, {
        type: "line",
        data: {
          labels,
          datasets: [
            {
              label: "Доход",
              data: incomes,
              borderColor: accent,
              backgroundColor: "rgba(16,185,129,.15)",
              borderWidth: 2,
              tension: 0.35,
              spanGaps: true,
            },
            {
              label: "Расход",
              data: expenses,
              borderColor: danger,
              backgroundColor: "rgba(239,68,68,.15)",
              borderWidth: 2,
              tension: 0.35,
              spanGaps: true,
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          animation: { duration: 700 },
          plugins: {
            legend: {
              display: true,
              position: "bottom",
              labels: { color: muted, boxWidth: 10, boxHeight: 10, padding: 12 }
            },
            tooltip: {
              callbacks: {
                label: (ctx)=> ` ${ctx.dataset.label}: ${fmtMoney(ctx.raw)}`
              }
            }
          },
          scales: {
            x: { grid: { display: false }, ticks: { color: muted } },
            y: { beginAtZero: true, grid: { color: stroke }, ticks: { color: muted } }
          }
        }
      });

      const balanceColors = balances.map((v)=> (v ?? 0) >= 0 ? "rgba(16,185,129,.6)" : "rgba(239,68,68,.6)");
      try { State.charts.yearBalanceBar?.destroy(); } catch {}
      const barCtx = $("#yearBalanceBar").getContext("2d");
      State.charts.yearBalanceBar = new Chart(barCtx, {
        type: "bar",
        data: {
          labels,
          datasets: [
            {
              label: "Баланс",
              data: balances,
              borderRadius: 10,
              borderWidth: 0,
              backgroundColor: balanceColors
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          animation: { duration: 700 },
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: (ctx)=> ` ${fmtMoney(ctx.raw)}`
              }
            }
          },
          scales: {
            x: { grid: { display: false }, ticks: { color: muted } },
            y: { grid: { color: stroke }, ticks: { color: muted } }
          }
        }
      });
    }

    function updateAddButtonsByRole(){
      const canEdit = (State.role === "admin" || State.role === "accountant") && !isMonthClosed();
      $("#addSundayBtn").disabled = !canEdit;
      $("#addSundayBtn").style.opacity = canEdit ? "1" : ".55";
    }

    function applyRoleUI(){
      const canEdit = (State.role === "admin" || State.role === "accountant");
      const isViewer = State.role === "viewer";
      const addBtn = $(".navBtn[data-screen='add']");
      if (addBtn) addBtn.style.display = canEdit ? "" : "none";
      $("#navSettingsBtn").style.opacity = "1";
      const navInner = $("#navInner");
      if (navInner) navInner.classList.toggle("centered", isViewer);
      $("#createMonthBtn").disabled = State.role !== "admin";
      $("#createMonthBtn").style.opacity = (State.role === "admin") ? "1" : ".55";
      updateAddButtonsByRole();
      if (isViewer) {
        $("#tabDonation").disabled = true;
        $("#tabExpense").disabled = true;
      }
      updateAttachmentControls();
      renderDraftsCard();
    }

    function updateAttachmentControls(){
      const btn = $("#expAttachBtn");
      const hint = $("#expAttachHint");
      if (!btn || !hint) return;
      const allowed = canEditAttachments();
      btn.disabled = !allowed;
      btn.style.opacity = allowed ? "1" : ".55";
      hint.textContent = isMonthClosed()
        ? "Месяц закрыт: загрузка и удаление недоступны."
        : "Файлы загрузятся после сохранения расхода.";
    }

    function renderSundayChart(){
      const sundays = State.sundayDates;
      const servicesByDate = new Map(
        State.services
          .filter(s=> (s.income_type || "donation") === "donation")
          .map(s=>[s.service_date, s])
      );

      const labels = sundays.map((d,i)=>String(i+1));
      const data = sundays.map(d => {
        const s = servicesByDate.get(d);
        return s ? Number(s.total || 0) : 0;
      });

      // badges under chart
      const badgeWrap = $("#sundayBadges");
      badgeWrap.innerHTML = "";
      sundays.forEach((d,i)=>{
        const s = servicesByDate.get(d);
        const weeklyMin = s ? Number(s.weekly_min_needed||0) : Number(State.summary?.weekly_min_needed||0);
        const total = s ? Number(s.total||0) : 0;
        const ok = weeklyMin ? (total > weeklyMin) : false;
        const b = document.createElement("div");
        b.className = "badge " + (ok ? "ok" : (total>0 ? "warn" : "bad"));
        b.textContent = `${i+1}: ${ok ? "Собрана" : (total>0 ? "Не собрана" : "—")}`;
        b.style.cursor = "pointer";
        b.onclick = ()=> { switchScreen("add"); selectDonationSundayByDate(d); };
        badgeWrap.appendChild(b);
      });

      // chart
      try { State.charts.sundayBar?.destroy(); } catch {}
      const ctx = $("#sundayBar").getContext("2d");
      State.charts.sundayBar = new Chart(ctx, {
        type: "bar",
        data: {
          labels,
          datasets: [{
            label: "Итого",
            data,
            borderWidth: 0,
            borderRadius: 10,
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          animation: { duration: 700 },
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: (ctx)=> ` ${fmtMoney(ctx.raw)}`
              }
            }
          },
          scales: {
            x: {
              grid: { display: false },
              ticks: { color: getComputedStyle(document.documentElement).getPropertyValue("--muted").trim() }
            },
            y: {
              beginAtZero: true,
              grid: { color: getComputedStyle(document.documentElement).getPropertyValue("--stroke").trim() },
              ticks: { color: getComputedStyle(document.documentElement).getPropertyValue("--muted").trim() }
            }
          }
        }
      });
    }

    function renderExpensePie(){
      // group by category
      const map = new Map();
      for(const e of State.expenses){
        const cat = e.category || "Прочее";
        const v = Number(e.total||0);
        map.set(cat, (map.get(cat)||0) + v);
      }
      const entries = Array.from(map.entries()).sort((a,b)=>b[1]-a[1]).slice(0, 10);
      const labels = entries.map(x=>x[0]);
      const data = entries.map(x=>Math.round(x[1]*100)/100);

      $("#expenseSum").textContent = fmtMoney(State.summary?.month_expenses_sum ?? 0);

      try { State.charts.expensePie?.destroy(); } catch {}
      const ctx = $("#expensePie").getContext("2d");
      State.charts.expensePie = new Chart(ctx, {
        type: "doughnut",
        data: {
          labels,
          datasets: [{
            data,
            borderWidth: 0,
            hoverOffset: 6
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          animation: { duration: 700 },
          plugins: {
            legend: {
              display: true,
              position: "bottom",
              labels: {
                color: getComputedStyle(document.documentElement).getPropertyValue("--muted").trim(),
                boxWidth: 10,
                boxHeight: 10,
                padding: 12
              }
            },
            tooltip: {
              callbacks: {
                label: (ctx)=> ` ${ctx.label}: ${fmtMoney(ctx.raw)}`
              }
            }
          },
          cutout: "62%"
        }
      });
    }

    function renderLastExpenses(){
      const list = $("#lastExpensesList");
      list.innerHTML = "";
      const last = [...State.expenses]
        .sort((a,b)=> (b.expense_date||"").localeCompare(a.expense_date||"") || (b.id-a.id))
        .slice(0, 5);

      if (!last.length){
        list.innerHTML = `<div class="tiny muted">Нет расходов</div>`;
        return;
      }

      for(const e of last){
        list.appendChild(makeExpenseItem(e, {compact:true}));
      }
    }

    /**********************
     * Rendering: History
     **********************/
    function rebuildHistoryMonthSelect(){
      const sel = $("#histMonthSelect");
      sel.innerHTML = "";
      // if list empty, fallback to current month
      let items = State.monthsList;
      if (!items.length) items = [{id:null, year:State.year, month:State.month}];

      for(const m of items){
        const opt = document.createElement("option");
        opt.value = m.id ? String(m.id) : "";
        opt.textContent = `${monthNameRu(m.month)} ${m.year}${m.id ? "" : " (нет в базе)"}`;
        sel.appendChild(opt);
      }
      // pick current if exists
      const current = State.monthCache.get(keyYM(State.year, State.month));
      if (current) sel.value = String(current.id);
      else sel.value = "";
    }

    function rebuildCategories(){
      const items = State.categoryItems || [];
      const activeNames = items.filter(c=>Number(c.is_active||0) === 1).map(c=>c.name);
      const extraNames = new Set((State.expenses || []).map(e=>e.category).filter(Boolean));
      activeNames.forEach(name=>extraNames.delete(name));
      const fallbackNames = Array.from(extraNames).sort((a,b)=>a.localeCompare(b,"ru"));
      const allNames = items.map(c=>c.name).concat(fallbackNames.filter(n=>!items.find(c=>c.name===n)));
      State.categories = allNames;

      const selExp = $("#expCategory");
      if (selExp){
        selExp.innerHTML = "";
        const opt0 = document.createElement("option");
        opt0.value = "";
        opt0.textContent = "— Выбрать категорию —";
        selExp.appendChild(opt0);
        const options = activeNames.length ? activeNames : allNames;
        options.forEach(c=>{
          const o = document.createElement("option");
          o.value = c;
          o.textContent = c;
          selExp.appendChild(o);
        });
        if (!options.includes("Прочее")){
          const o = document.createElement("option");
          o.value = "Прочее";
          o.textContent = "Прочее";
          selExp.appendChild(o);
        }
        syncDropdown("expCategory");
      }

      // history category select
      const sel = $("#histCategorySelect");
      sel.innerHTML = "";
      const opt0 = document.createElement("option");
      opt0.value = "";
      opt0.textContent = "Категории";
      sel.appendChild(opt0);
      allNames.forEach(c=>{
        const o = document.createElement("option");
        o.value = c;
        o.textContent = c;
        sel.appendChild(o);
      });
      syncDropdown("histCategorySelect");
      updateExpenseBudgetIndicator();
      renderBudgetSettings();
    }

    function renderHistory(){
      const list = $("#histList");
      list.innerHTML = "";

      const monthId = $("#histMonthSelect").value ? Number($("#histMonthSelect").value) : null;

      const q = ($("#histSearch").value || "").trim().toLowerCase();
      const cat = ($("#histCategorySelect").value || "").trim();
      const tagFilters = State.historyTags || [];

      let items = [];
      if (State.historyMode === "don"){
        items = (State.services || []).filter(s=> monthId ? (s.month_id === monthId) : (State.monthId ? s.month_id===State.monthId : true));
      } else {
        items = (State.expenses || []).filter(e=> monthId ? (e.month_id === monthId) : (State.monthId ? e.month_id===State.monthId : true));
      }

      if (State.historyMode === "exp" && cat) {
        items = items.filter(e=>String(e.category||"") === cat);
      }
      if (State.historyMode === "exp" && tagFilters.length) {
        if (State.historyTagMode === "all") {
          items = items.filter(e=> tagFilters.every(tag=> (e.tags || []).includes(tag)));
        } else {
          items = items.filter(e=> (e.tags || []).some(tag=> tagFilters.includes(tag)));
        }
      }
      if (q) {
        items = items.filter(x=>{
          const hay = State.historyMode === "don"
            ? `${x.service_date} ${x.idx} ${x.mnsps_status} ${x.income_type || "donation"}`
            : `${x.title||""} ${x.comment||""} ${x.category||""} ${(x.tags || []).join(" ")} ${x.expense_date||""}`;
          return hay.toLowerCase().includes(q);
        });
      }

      // sort
      if (State.historyMode === "don") {
        items.sort((a,b)=> (a.service_date||"").localeCompare(b.service_date||""));
      } else {
        items.sort((a,b)=> (b.expense_date||"").localeCompare(a.expense_date||"") || (b.id-a.id));
      }

      $("#histCatWrap").classList.toggle("hidden", State.historyMode !== "exp");
      $("#histTagsWrap").classList.toggle("hidden", State.historyMode !== "exp");
      renderHistoryTags();

      if (!items.length){
        $("#histEmpty").classList.remove("hidden");
        return;
      }
      $("#histEmpty").classList.add("hidden");

      const canEdit = (State.role === "admin" || State.role === "accountant");
      for(const it of items){
        const node = (State.historyMode === "don")
          ? makeDonationItem(it)
          : makeExpenseItem(it);

        // viewers can open details but cannot save/delete
        node.dataset.canEdit = canEdit ? "1" : "0";
        list.appendChild(node);
      }
    }

    function makeDonationItem(s){
      const total = Number(s.total||0);
      const incomeType = (s.income_type || "donation");
      const isDonation = incomeType === "donation";
      const ok = (isDonation && s.weekly_min_needed && total > Number(s.weekly_min_needed));
      const iconName = isDonation
        ? (ok ? "volunteer_activism" : (total>0 ? "info" : "event_busy"))
        : "paid";
      const sub = isDonation
        ? `${fmtLongDate(s.service_date)} • ${s.mnsps_status} • ПВС ${(Number(s.pvs_ratio||0)*100).toFixed(1)}%`
        : `${fmtLongDate(s.service_date)} • Иной доход`;
      const div = document.createElement("div");
      div.className = "item";
      div.innerHTML = `
        <div class="itemLeft">
          <div class="itemIco"><span class="icon">${iconName}</span></div>
          <div class="itemText">
            <div class="t">${isDonation ? `Воскресенье #${s.idx || "—"}` : "Иной доход"}</div>
            <div class="s">${sub}</div>
          </div>
        </div>
        <div class="itemRight">
          <div class="amt mono">${fmtMoney(total)}</div>
          <div class="dt">${fmtShortDate(s.service_date)}</div>
        </div>
      `;
      div.onclick = ()=> openEditModal("service", s);
      return div;
    }

    function makeExpenseItem(e, {compact=false}={}){
      const total = Number(e.total||0);
      const ico = e.is_system ? "percent" : "receipt_long";
      const sub = compact
        ? `${fmtLongDate(e.expense_date)} • ${e.category}`
        : `${fmtLongDate(e.expense_date)} • ${e.category}${e.is_system ? " • системная" : ""}`;
      const attachCount = Number(e.attachments_count || 0);
      const tagsHtml = renderTagChipsInline(e.tags || []);
      const div = document.createElement("div");
      div.className = "item";
      div.innerHTML = `
        <div class="itemLeft">
          <div class="itemIco"><span class="icon">${ico}</span></div>
          <div class="itemText">
            <div class="t">${escapeHtml(e.title || "Расход")}</div>
            ${tagsHtml}
            <div class="s">${escapeHtml(sub)}</div>
          </div>
        </div>
        <div class="itemRight">
          <div class="amtRow">
            <div class="amt mono">${fmtMoney(total)}</div>
            ${attachCount > 0 ? `<div class="attachCount"><span class="icon">attach_file</span>${attachCount}</div>` : ""}
          </div>
          <div class="dt">${fmtShortDate(e.expense_date)}</div>
        </div>
      `;
      div.onclick = ()=> openEditModal("expense", e);
      return div;
    }

    function escapeHtml(s){
      return String(s||"").replace(/[&<>"']/g, (m)=>({
        "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
      }[m]));
    }

    /**********************
     * Tags helpers
     **********************/
    function normalizeTagList(tags){
      const out = [];
      const seen = new Set();
      (tags || []).forEach((tag)=>{
        const raw = String(tag || "").trim();
        if (!raw) return;
        const norm = raw.toLowerCase();
        if (seen.has(norm)) return;
        seen.add(norm);
        out.push(raw);
      });
      return out;
    }

    function renderTagChips(container, tags, {removable=false, onRemove=null, emptyText="Теги не выбраны"}={}){
      if (!container) return;
      container.innerHTML = "";
      const list = normalizeTagList(tags);
      if (!list.length){
        const empty = document.createElement("div");
        empty.className = "tiny muted2";
        empty.textContent = emptyText;
        container.appendChild(empty);
        return;
      }
      list.forEach((tag)=>{
        const chip = document.createElement("div");
        chip.className = "tagChip";
        const label = document.createElement("span");
        label.textContent = tag;
        chip.appendChild(label);
        if (removable){
          const btn = document.createElement("button");
          btn.type = "button";
          btn.innerHTML = `<span class="icon" style="font-size:16px;">close</span>`;
          btn.addEventListener("click", (e)=>{
            e.stopPropagation();
            if (onRemove) onRemove(tag);
          });
          chip.appendChild(btn);
        }
        container.appendChild(chip);
      });
    }

    function renderTagChipsInline(tags){
      const list = normalizeTagList(tags);
      if (!list.length) return "";
      const shown = list.slice(0, 2);
      const extra = list.length - shown.length;
      const chips = shown.map((tag)=> `<span class="tagChipMini">${escapeHtml(tag)}</span>`).join("");
      const more = extra > 0 ? `<span class="tagChipMini more">+${extra}</span>` : "";
      return `<div class="itemTags">${chips}${more}</div>`;
    }

    function renderExpenseTags(){
      renderTagChips($("#expTagsChips"), State.expenseTags, {
        removable: true,
        emptyText: "Добавьте тег",
        onRemove: (tag)=>{
          State.expenseTags = State.expenseTags.filter((t)=>t !== tag);
          renderExpenseTags();
        }
      });
    }

    function renderHistoryTags(){
      renderTagChips($("#histTagsChips"), State.historyTags, {
        removable: true,
        emptyText: "Без фильтра",
        onRemove: (tag)=>{
          State.historyTags = State.historyTags.filter((t)=>t !== tag);
          renderHistoryTags();
          renderHistory();
        }
      });
      const resetBtn = $("#histTagsResetBtn");
      if (resetBtn) resetBtn.classList.toggle("hidden", State.historyTags.length === 0);
    }

    function renderEditTags(container, canEdit){
      renderTagChips(container, Edit.tags, {
        removable: canEdit,
        emptyText: "Теги не выбраны",
        onRemove: (tag)=>{
          Edit.tags = Edit.tags.filter((t)=>t !== tag);
          renderEditTags(container, canEdit);
        }
      });
    }

    function setExpenseTags(tags){
      State.expenseTags = normalizeTagList(tags);
      renderExpenseTags();
    }

    function setHistoryTags(tags){
      State.historyTags = normalizeTagList(tags);
      renderHistoryTags();
    }

    const TagPicker = {
      selected: new Set(),
      onApply: null,
      allowCreate: false,
      title: "Теги"
    };

    function openTagPicker({selected=[], onApply=null, allowCreate=false, title="Теги"}={}){
      TagPicker.selected = new Set(normalizeTagList(selected));
      TagPicker.onApply = onApply;
      TagPicker.allowCreate = allowCreate;
      TagPicker.title = title;
      $("#tagPickerTitle").textContent = title;
      $("#tagSearchInput").value = "";
      renderTagPickerList();
      $("#tagPickerCreateBtn").classList.toggle("hidden", !allowCreate);
      $("#tagPickerModal").classList.add("show");
      $("#tagSearchInput").focus();
    }

    function closeTagPicker(){
      $("#tagPickerModal").classList.remove("show");
      TagPicker.onApply = null;
    }

    function renderTagPickerList(){
      const list = $("#tagPickerList");
      list.innerHTML = "";
      const q = ($("#tagSearchInput").value || "").trim().toLowerCase();
      const items = (State.tags || []).filter((tag)=>{
        const name = String(tag.name || "");
        return !q || name.toLowerCase().includes(q);
      });
      if (!items.length){
        list.innerHTML = `<div class="tiny muted">Нет тегов</div>`;
        return;
      }
      items.forEach((tag)=>{
        const row = document.createElement("label");
        row.className = "tagPickerRow";
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.checked = TagPicker.selected.has(tag.name);
        checkbox.addEventListener("change", ()=>{
          if (checkbox.checked) TagPicker.selected.add(tag.name);
          else TagPicker.selected.delete(tag.name);
        });
        const text = document.createElement("span");
        text.textContent = tag.name;
        row.appendChild(checkbox);
        row.appendChild(text);
        list.appendChild(row);
      });
    }

    async function createTagFromPicker(){
      if (!TagPicker.allowCreate) return;
      const name = prompt("Название тега");
      if (!name) return;
      try{
        await API.post("/api/tags", {name});
        await loadTags();
        const normName = name.trim();
        if (normName) TagPicker.selected.add(normName);
        renderTagPickerList();
      }catch(e){
        alert(String(e.message || e));
      }
    }


    /**********************
     * UI helpers: dropdowns
     **********************/
    const DropdownRegistry = new Map();

    function initDropdownFromSelect(selectId, dropdownId){
      const select = $(`#${selectId}`);
      const dropdown = $(`#${dropdownId}`);
      if (!select || !dropdown) return;

      const panel = dropdown.querySelector(".dropdownPanel");
      const trigger = dropdown.querySelector(".dropdownTrigger");
      const valueEl = dropdown.querySelector(".dropdownValue");
      if (!panel || !trigger || !valueEl) return;

      let optionButtons = [];
      const buildOptions = ()=>{
        panel.innerHTML = "";
        optionButtons = [];
        Array.from(select.options).forEach((opt)=>{
          const btn = document.createElement("button");
          btn.type = "button";
          btn.className = "dropdownOption";
          btn.dataset.value = opt.value;
          btn.textContent = opt.textContent;
          btn.setAttribute("role", "option");
          panel.appendChild(btn);
          optionButtons.push(btn);
        });
      };
      buildOptions();

      const sync = ()=>{
        buildOptions();
        const selected = select.value || (select.options[0]?.value ?? "");
        const opt = Array.from(select.options).find(o=>o.value === selected) || select.options[0];
        if (opt) {
          select.value = opt.value;
          valueEl.textContent = opt.textContent;
        } else {
          valueEl.textContent = "—";
        }
        optionButtons.forEach(btn=>{
          btn.setAttribute("aria-selected", btn.dataset.value === select.value ? "true" : "false");
        });
      };

      const positionPanel = ()=>{
        const rect = dropdown.getBoundingClientRect();
        const panelHeight = Math.min(panel.scrollHeight, 260);
        const spaceBelow = window.innerHeight - rect.bottom - 8;
        const spaceAbove = rect.top - 8;
        const openUp = spaceBelow < panelHeight && spaceAbove > spaceBelow;
        dropdown.classList.toggle("open-up", openUp);
        const available = openUp ? spaceAbove : spaceBelow;
        if (available > 0) {
          panel.style.maxHeight = `${Math.min(panelHeight, available)}px`;
        } else {
          panel.style.maxHeight = `${panelHeight}px`;
        }
      };

      const open = ()=>{
        positionPanel();
        dropdown.classList.add("open");
        trigger.setAttribute("aria-expanded", "true");
      };
      const close = ()=>{
        dropdown.classList.remove("open");
        dropdown.classList.remove("open-up");
        panel.style.maxHeight = "";
        trigger.setAttribute("aria-expanded", "false");
      };

      sync();
      DropdownRegistry.set(selectId, sync);

      trigger.addEventListener("click", (e)=>{
        e.stopPropagation();
        dropdown.classList.contains("open") ? close() : open();
      });
      window.addEventListener("resize", ()=>{
        if (dropdown.classList.contains("open")) positionPanel();
      });
      panel.addEventListener("click", (e)=>{
        const btn = e.target.closest(".dropdownOption");
        if (!btn) return;
        select.value = btn.dataset.value;
        select.dispatchEvent(new Event("change", {bubbles:true}));
        close();
      });
      document.addEventListener("click", (e)=>{
        if (!dropdown.contains(e.target)) close();
      });
      document.addEventListener("keydown", (e)=>{
        if (e.key === "Escape") close();
      });
      select.addEventListener("change", sync);
    }

    function syncDropdown(selectId){
      const sync = DropdownRegistry.get(selectId);
      if (sync) sync();
    }

    /**********************
     * Add: Donation form helpers
     **********************/
    function getDonationType(){
      return ($("#donIncomeType").value || "donation").trim();
    }

    function setDonationTypeUI(){
      const type = getDonationType();
      syncDropdown("donIncomeType");
      const isDonation = type === "donation";
      $("#donSundayWrap").classList.toggle("hidden", !isDonation);
      $("#donOtherDateWrap").classList.toggle("hidden", isDonation);
      if (!isDonation && !$("#donOtherDate").value) {
        $("#donOtherDate").value = State.otherIncomeDate || toIsoDateLocal(new Date());
      }
      updateDonationDateUI();
    }

    function selectDonationSundayByDate(dateIso){
      const idx = State.sundayDates.indexOf(dateIso);
      if (idx >= 0) {
        State.sundayIndex = idx;
        updateDonationDateUI();
      }
    }

    function updateDonationDateUI(){
      const type = getDonationType();
      const isDonation = type === "donation";
      let d = isDonation ? State.sundayDates[State.sundayIndex] : $("#donOtherDate").value;
      if (!isDonation && !d) {
        d = State.otherIncomeDate || toIsoDateLocal(new Date());
        $("#donOtherDate").value = d;
      }
      if (isDonation) {
        $("#sunDateLabel").textContent = d ? fmtLongDate(d) : "—";
      }

      // prefill from existing service
      const svc = State.services.find(x=>x.service_date === d && (x.income_type || "donation") === type);
      const cashless = svc ? Number(svc.cashless||0) : 0;
      const cash = svc ? Number(svc.cash||0) : 0;
      $("#donCashless").value = cashless ? String(cashless) : "";
      $("#donCash").value = cash ? String(cash) : "";
      recalcDonationTotals();
    }

    function recalcDonationTotals(){
      const cashless = Number($("#donCashless").value||0);
      const cash = Number($("#donCash").value||0);
      const total = Math.round((cashless + cash) * 100)/100;
      $("#donTotal").value = fmtMoney(total);

      const type = getDonationType();
      const isDonation = type === "donation";
      const weeklyMin = isDonation ? Number(State.summary?.weekly_min_needed || 0) : 0;
      $("#donWeeklyMin").textContent = weeklyMin ? fmtMoney(weeklyMin) : "—";

      let status = "—";
      let cls = "";
      if (isDonation && weeklyMin > 0) {
        if (total > weeklyMin) { status="Собрана"; cls="ok"; }
        else { status="Не собрана"; cls=(total>0?"warn":"bad"); }
        const pvs = total / weeklyMin;
        $("#donPvs").textContent = `${(pvs*100).toFixed(1)}%`;
      } else if (!isDonation) {
        status = "Иной доход";
        $("#donPvs").textContent = "—";
      } else {
        $("#donPvs").textContent = "—";
      }

      const b = $("#donStatus");
      b.classList.remove("ok","warn","bad");
      if (cls) b.classList.add(cls);
      b.textContent = status;
    }

    async function copyPreviousSunday(){
      if (getDonationType() !== "donation") return;
      const idx = State.sundayIndex;
      if (idx <= 0) return;
      const prevDate = State.sundayDates[idx-1];
      const prev = State.services.find(x=>x.service_date === prevDate && (x.income_type || "donation") === "donation");
      if (!prev) return;
      $("#donCashless").value = String(Number(prev.cashless||0));
      $("#donCash").value = String(Number(prev.cash||0));
      recalcDonationTotals();
      setToast("Скопировано");
    }

    /**********************
     * Add: Expense form helpers
     **********************/
    function setExpenseToday(){
      const d = new Date();
      const iso = toIsoDateLocal(new Date(d.getFullYear(), d.getMonth(), d.getDate()));
      $("#expDate").value = iso;
    }

    function recalcExpenseTotals(){
      const qty = Number($("#expQty").value||0);
      const unit = Number($("#expUnit").value||0);
      const total = Math.round(qty * unit * 100)/100;
      $("#expTotal").value = fmtMoney(total);
      updateWarningsExpenseForm();
    }

    function updateWarningsExpenseForm(){
      const warn = $("#expWarn");
      warn.classList.add("hidden");
      updateExpenseBudgetIndicator();
      if (!State.summary) return;

      const total = Number($("#expQty").value||0) * Number($("#expUnit").value||0);
      const fact = Number(State.summary.fact_balance||0);
      const sddr = Number(State.summary.sddr||0);

      // if expense > fact balance OR (sddr==0 and mnsp not completed) OR expense > sddr when sddr>0
      const mnspCompleted = Number(State.summary.month_income_sum||0) >= Number(State.summary.monthly_min_needed||0) && Number(State.summary.monthly_min_needed||0) > 0;
      const cond1 = total > fact && total > 0;
      const cond2 = (!mnspCompleted && total > 0);
      const cond3 = (sddr > 0 && total > sddr);

      if (cond1 || cond2 || cond3) warn.classList.remove("hidden");
    }
    function getBudgetStatus(usage, warnThreshold){
      if (usage === null || usage === undefined || Number.isNaN(usage)) return "OK";
      if (usage < warnThreshold) return "OK";
      if (usage < 1) return "WARN";
      return "OVER";
    }
    function getBudgetForCategory(category){
      if (!category) return null;
      return (State.monthBudgets || []).find((b)=> (b.category_name || b.category || "") === category) || null;
    }
    function updateExpenseBudgetIndicator(){
      const indicator = $("#expBudgetIndicator");
      const warn = $("#expBudgetWarn");
      if (!indicator || !warn) return;
      indicator.classList.add("hidden");
      warn.classList.add("hidden");
      indicator.classList.remove("warn","over");

      const category = ($("#expCategory").value || "").trim();
      if (!category) return;
      const budget = getBudgetForCategory(category);
      if (!budget) return;

      const limit = Number(budget.limit_amount || 0);
      const warnThreshold = Number(budget.warn_threshold || 0.9);
      const fact = Number(budget.fact || 0);
      const qty = Number($("#expQty").value || 0);
      const unit = Number($("#expUnit").value || 0);
      const total = Math.round(qty * unit * 100) / 100;
      const projected = fact + total;
      const usage = limit > 0 ? projected / limit : null;
      const status = getBudgetStatus(usage, warnThreshold);
      const pct = limit > 0 ? Math.min(Math.max(usage || 0, 0), 1) : 0;

      indicator.classList.toggle("warn", status === "WARN");
      indicator.classList.toggle("over", status === "OVER");

      if (status === "OVER") warn.classList.remove("hidden");

      indicator.innerHTML = `
        <div class="budgetIndicatorMeta">
          <div class="budgetIndicatorTitle">Бюджет категории</div>
          <div class="budgetIndicatorValue">${fmtMoney(projected)} / ${limit > 0 ? fmtMoney(limit) : "—"}</div>
        </div>
        <div class="budgetBar"><div class="budgetBarFill" style="width:${Math.round(pct * 100)}%"></div></div>
        <div class="budgetIndicatorHint">Факт: ${fmtMoney(fact)} • порог: ${(warnThreshold * 100).toFixed(0)}%</div>
      `;
      indicator.classList.remove("hidden");
    }
    function resetExpenseForm(){
      $("#expTitle").value = "";
      $("#expUnit").value = "";
      $("#expQty").value = "1";
      $("#expComment").value = "";
      setExpenseTags([]);
      State.pendingExpenseFiles = [];
      $("#expAttachGrid").innerHTML = "";
      $("#expAttachInput").value = "";
      recalcExpenseTotals();
    }

    function applyTemplate(idxStr){
      if (!idxStr) return;
      const t = State.templates[Number(idxStr)];
      if (!t) return;
      $("#expTitle").value = t.title || "";
      const catSelect = $("#expCategory");
      const categoryValue = t.category || "";
      if (catSelect){
        if (categoryValue && !Array.from(catSelect.options).some(o=>o.value === categoryValue)){
          const o = document.createElement("option");
          o.value = categoryValue;
          o.textContent = categoryValue;
          catSelect.appendChild(o);
        }
        catSelect.value = categoryValue;
        syncDropdown("expCategory");
      }
      $("#expUnit").value = String(Number(t.unit_amount||0));
      $("#expQty").value = "1";
      recalcExpenseTotals();
    }

    function setYearCollectionExpanded(expanded){
      const card = $("#yearCollection");
      const toggle = $("#yearCollectionToggle");
      card.classList.toggle("expanded", expanded);
      toggle.setAttribute("aria-expanded", expanded ? "true" : "false");
      if (expanded) renderYearAnalytics();
    }

    function setPeriodCollectionExpanded(expanded){
      const card = $("#periodCollection");
      const toggle = $("#periodCollectionToggle");
      if (!card || !toggle) return;
      card.classList.toggle("expanded", expanded);
      toggle.setAttribute("aria-expanded", expanded ? "true" : "false");
      if (expanded) renderPeriodSummary();
    }


    /**********************
     * Navigation + tabs
     **********************/
    function switchScreen(name){
      const map = {
        dashboard: $("#screenDashboard"),
        add: $("#screenAdd"),
        history: $("#screenHistory"),
        settings: $("#screenSettings"),
      };
      for(const k in map){
        map[k].classList.toggle("active", k === name);
      }
      if (name !== "settings") closeSettingsPage({immediate:true});
      // nav
      $$(".navBtn").forEach(b=>b.classList.toggle("active", b.dataset.screen===name));
      // hide sticky actions when not on add
      // (they are inside add screen anyway)
      if (name === "history") renderHistory();
      if (name === "dashboard") renderDashboard();
      if (name === "settings") renderSettingsUI();
      if (name === "add") updateMonthClosedUI();
    }

    function setAddTab(which){
      State.addTab = which;
      const isDon = which === "don";
      $("#tabDonation").classList.toggle("active", isDon);
      $("#tabExpense").classList.toggle("active", !isDon);
      if (isMonthClosed()){
        updateMonthClosedUI();
        return;
      }
      $("#addDonationWrap").classList.toggle("hidden", !isDon);
      $("#addExpenseWrap").classList.toggle("hidden", isDon);
      if (isDon) setDonationTypeUI();
    }

    function setHistoryTab(which){
      State.historyMode = which;
      $("#tabHistDon").classList.toggle("active", which==="don");
      $("#tabHistExp").classList.toggle("active", which==="exp");
      renderHistory();
    }

    /**********************
     * Edit modal
     **********************/
    const Edit = {
      type: null, // "service"|"expense"
      item: null,
      tags: []
    };

    function openEditModal(type, item){
      Edit.type = type;
      Edit.item = JSON.parse(JSON.stringify(item)); // clone
      Edit.tags = (type === "expense") ? normalizeTagList(item.tags || []) : [];
      const serviceType = (type === "service") ? (item.income_type || "donation") : null;
      $("#editTitle").textContent = (type==="service")
        ? (serviceType === "donation" ? "Пожертвование" : "Иной доход")
        : "Расход";
      $("#editHint").textContent = "";

      // build form
      const body = $("#editBody");
      body.innerHTML = "";

      const canEdit = (State.role === "admin" || State.role === "accountant");
      const isSystem = (type==="expense" && Number(item.is_system||0) === 1);
      const isClosed = isMonthClosed();

      // toggle buttons
      const canEditNow = canEdit && !isClosed;
      $("#editSaveBtn").disabled = !canEditNow || isSystem;
      $("#editSaveBtn").style.opacity = (!canEditNow || isSystem) ? ".55" : "1";
      $("#editDeleteBtn").disabled = !canEditNow || isSystem;
      $("#editDeleteBtn").style.opacity = (!canEditNow || isSystem) ? ".55" : "1";
      $("#editDuplicateBtn").disabled = !canEditNow;
      $("#editDuplicateBtn").style.opacity = (!canEditNow) ? ".55" : "1";
      if (isClosed) {
        $("#editHint").textContent = "Откройте месяц у администратора.";
      } else if (isSystem) {
        $("#editHint").textContent = "Системная строка (десятина) редактируется автоматически.";
      }

      if (type==="service"){
        body.appendChild(makeField("Дата", makeInput("date", item.service_date, {field:"service_date"})));
        body.appendChild(makeField(
          "Тип дохода",
          makeSelect(
            [
              {value:"donation", label:"Пожертвование (10% Объединение)"},
              {value:"other", label:"Иной доход (без 10%)"},
            ],
            item.income_type || "donation",
            {field:"income_type"}
          )
        ));
        body.appendChild(makeField("Безнал", makeInput("number", item.cashless, {step:"0.01", field:"cashless"})));
        body.appendChild(makeField("Наличные", makeInput("number", item.cash, {step:"0.01", field:"cash"})));
        const total = Number(item.cashless||0) + Number(item.cash||0);
        body.appendChild(makeField("Итого", makeInput("text", fmtMoney(total), {readonly:true})));
      } else {
        body.appendChild(makeField("Дата", makeInput("date", item.expense_date)));
        body.appendChild(makeField("Категория", makeInput("text", item.category)));
        body.appendChild(makeField("Название", makeInput("text", item.title)));
        body.appendChild(makeField("Количество", makeInput("number", item.qty, {step:"0.01"})));
        body.appendChild(makeField("Сумма", makeInput("number", item.unit_amount, {step:"0.01"})));
        const total = Number(item.qty||0) * Number(item.unit_amount||0);
        body.appendChild(makeField("Итог", makeInput("text", fmtMoney(total), {readonly:true})));
        body.appendChild(makeField("Комментарий", makeTextarea(item.comment||"")));
        const tagField = document.createElement("div");
        tagField.className = "field";
        const tagLabel = document.createElement("label");
        tagLabel.textContent = "Теги";
        const tagChips = document.createElement("div");
        tagChips.id = "editTagsChips";
        tagChips.className = "tagChips";
        tagField.appendChild(tagLabel);
        tagField.appendChild(tagChips);
        if (canEdit){
          const tagBtn = document.createElement("button");
          tagBtn.className = "btn small";
          tagBtn.type = "button";
          tagBtn.innerHTML = `<span class="icon">add</span> Добавить`;
          tagBtn.addEventListener("click", ()=>{
            openTagPicker({
              selected: Edit.tags,
              allowCreate: canEdit,
              onApply: (tags)=> {
                Edit.tags = normalizeTagList(tags);
                renderEditTags(tagChips, canEdit);
              }
            });
          });
          tagField.appendChild(tagBtn);
        }
        body.appendChild(tagField);
        renderEditTags(tagChips, canEdit);
        body.appendChild(buildEditAttachmentSection(item.id));
      }

      $("#editModal").classList.add("show");
    }

    function closeEditModal(){
      $("#editModal").classList.remove("show");
      Edit.type = null;
      Edit.item = null;
    }

    function makeField(label, control){
      const wrap = document.createElement("div");
      wrap.className = "field";
      const l = document.createElement("label");
      l.textContent = label;
      wrap.appendChild(l);
      wrap.appendChild(control);
      return wrap;
    }
    function makeInput(type, value, opts={}){
      const i = document.createElement("input");
      i.className = "input";
      i.type = type;
      if (value !== undefined && value !== null) i.value = String(value);
      Object.assign(i, opts);
      if (opts.field) i.dataset.field = opts.field;
      return i;
    }
    function makeSelect(options, value, opts={}){
      const s = document.createElement("select");
      s.className = "input";
      if (opts.field) s.dataset.field = opts.field;
      options.forEach(opt=>{
        const o = document.createElement("option");
        o.value = opt.value;
        o.textContent = opt.label;
        s.appendChild(o);
      });
      if (value !== undefined && value !== null) s.value = String(value);
      Object.assign(s, opts);
      return s;
    }
    function makeTextarea(value){
      const t = document.createElement("textarea");
      t.className = "input";
      t.rows = 3;
      t.value = String(value||"");
      return t;
    }

    function buildEditAttachmentSection(expenseId){
      const wrap = document.createElement("div");
      wrap.className = "field";
      const header = document.createElement("div");
      header.className = "rowBetween";
      const title = document.createElement("div");
      title.className = "bold";
      title.textContent = "Чек/скан";
      header.appendChild(title);

      const grid = document.createElement("div");
      grid.className = "attachmentGrid";
      const hint = document.createElement("div");
      hint.className = "tiny muted2 attachHint";

      if (canEditAttachments()){
        const btn = document.createElement("button");
        btn.className = "btn small";
        btn.type = "button";
        btn.innerHTML = `<span class="icon">photo_camera</span> Добавить`;
        const input = document.createElement("input");
        input.type = "file";
        input.multiple = true;
        input.accept = ATTACHMENT_ACCEPT;
        input.className = "hidden";
        btn.addEventListener("click", ()=> input.click());
        input.addEventListener("change", async ()=>{
          const files = Array.from(input.files || []);
          input.value = "";
          await uploadExpenseAttachments(expenseId, files, grid);
          await refreshAll();
        });
        header.appendChild(btn);
        wrap.appendChild(input);
        hint.textContent = "Тапните по миниатюре для просмотра.";
      } else {
        hint.textContent = "Только просмотр.";
      }

      wrap.appendChild(header);
      wrap.appendChild(grid);
      wrap.appendChild(hint);
      fetchExpenseAttachments(expenseId)
        .then((items)=> renderAttachmentGrid(grid, items, expenseId, {showEmpty:true}))
        .catch(()=> renderAttachmentGrid(grid, [], expenseId, {showEmpty:true}));
      return wrap;
    }

    async function saveEdit(){
      if (!Edit.type || !Edit.item) return;
      const canEdit = (State.role === "admin" || State.role === "accountant");
      if (!canEdit) return;
      if (isMonthClosed()){
        notifyMonthClosed($("#editModal .modal"));
        return;
      }

      if (Edit.type === "service"){
        const dateI = $("#editBody .input[data-field='service_date']");
        const typeI = $("#editBody .input[data-field='income_type']");
        const cashlessI = $("#editBody .input[data-field='cashless']");
        const cashI = $("#editBody .input[data-field='cash']");
        const body = {
          service_date: dateI.value,
          cashless: Number(cashlessI.value||0),
          cash: Number(cashI.value||0),
          income_type: (typeI?.value || "donation")
        };
        await API.put(`/api/services/${Edit.item.id}`, body);
        closeEditModal();
        setToast("Сохранено");
        await refreshAll();
        return;
      }

      // expense
      if (Number(Edit.item.is_system||0) === 1) return;
      const controls = $$("#editBody .input");
      const [dateI, catI, titleI, qtyI, unitI, totalI, commentI] = controls;
      const body = {
        expense_date: dateI.value,
        category: catI.value.trim() || "Прочее",
        title: titleI.value.trim() || "Расход",
        qty: Number(qtyI.value||1),
        unit_amount: Number(unitI.value||0),
        comment: (commentI.value||"").trim() || null,
        tags: Edit.tags || []
      };
      await API.put(`/api/expenses/${Edit.item.id}`, body);
      closeEditModal();
      setToast("Сохранено");
      await refreshAll();
    }

    async function deleteEdit(){
      if (!Edit.type || !Edit.item) return;
      const canEdit = (State.role === "admin" || State.role === "accountant");
      if (!canEdit) return;
      if (isMonthClosed()){
        notifyMonthClosed($("#editModal .modal"));
        return;
      }

      if (Edit.type === "service"){
        await API.del(`/api/services/${Edit.item.id}`);
        closeEditModal();
        setToast("Удалено");
        await refreshAll();
        return;
      }

      if (Number(Edit.item.is_system||0) === 1) return;
      await API.del(`/api/expenses/${Edit.item.id}`);
      closeEditModal();
      setToast("Удалено");
      await refreshAll();
    }

    async function duplicateEdit(){
      if (!Edit.type || !Edit.item) return;
      const canEdit = (State.role === "admin" || State.role === "accountant");
      if (!canEdit) return;
      if (isMonthClosed()){
        notifyMonthClosed($("#editModal .modal"));
        return;
      }

      if (!State.monthId) return;

      if (Edit.type === "service"){
        // Duplicate to same date (noop) doesn't make sense; instead copy values into add form
        switchScreen("add");
        setAddTab("don");
        $("#donIncomeType").value = (Edit.item.income_type || "donation");
        setDonationTypeUI();
        if ((Edit.item.income_type || "donation") === "donation") {
          selectDonationSundayByDate(Edit.item.service_date);
        } else {
          $("#donOtherDate").value = Edit.item.service_date;
          State.otherIncomeDate = Edit.item.service_date;
          updateDonationDateUI();
        }
        $("#donCashless").value = String(Number(Edit.item.cashless||0));
        $("#donCash").value = String(Number(Edit.item.cash||0));
        recalcDonationTotals();
        closeEditModal();
        setToast("Скопировано в форму");
        return;
      }

      // expense duplicate: create new expense with same fields + today date
      const d = new Date();
      const todayIso = toIsoDateLocal(new Date(d.getFullYear(), d.getMonth(), d.getDate()));
      const body = {
        expense_date: todayIso,
        category: Edit.item.category || "Прочее",
        title: Edit.item.title || "Расход",
        qty: Number(Edit.item.qty||1),
        unit_amount: Number(Edit.item.unit_amount||0),
        comment: Edit.item.comment || null,
        tags: Edit.tags || []
      };
      await API.post(`/api/months/${State.monthId}/expenses`, body);
      closeEditModal();
      setToast("Дублировано");
      await refreshAll();
    }

    /**********************
     * Settings UI
     **********************/
    const CategoryModal = { mode: "create", id: null };
    const MergeState = { targetId: null, sourceIds: new Set() };

    function openCategoryNameModal({mode="create", category=null}={}){
      CategoryModal.mode = mode;
      CategoryModal.id = category ? category.id : null;
      $("#categoryNameTitle").textContent = mode === "rename" ? "Переименовать категорию" : "Новая категория";
      $("#categoryNameInput").value = category?.name || "";
      $("#categoryNameModal").classList.add("show");
      $("#categoryNameInput").focus();
    }
    function closeCategoryNameModal(){
      $("#categoryNameModal").classList.remove("show");
    }

    function buildAliasChip(alias){
      const chip = document.createElement("div");
      chip.className = "aliasChip";
      chip.innerHTML = `
        <span>${escapeHtml(alias.alias || "")}</span>
        <button type="button" aria-label="Удалить алиас"><span class="icon">close</span></button>
      `;
      const btn = chip.querySelector("button");
      btn.addEventListener("click", async (e)=>{
        e.stopPropagation();
        const ok = confirm("Удалить алиас?");
        if (!ok) return;
        try{
          await API.del(`/api/category-aliases/${alias.id}`);
          await loadCategories();
          setToast("Алиас удалён");
        }catch(err){
          alert(String(err.message || err));
        }
      });
      return chip;
    }

    function renderCategoriesSection(){
      const section = $("#categoriesSection");
      if (!section) return;
      const isAdmin = State.role === "admin";
      section.classList.toggle("hidden", !isAdmin);
      if (!isAdmin) return;

      const list = $("#categoriesList");
      const empty = $("#categoriesEmpty");
      list.innerHTML = "";
      const items = State.categoryItems || [];
      empty.classList.toggle("hidden", items.length > 0);

      items.forEach((item)=>{
        const card = document.createElement("div");
        card.className = "card bigCard collectionCard categoryCard";
        const active = Number(item.is_active || 0) === 1;
        const badgeClass = active ? "ok" : "bad";
        const badgeText = active ? "Активна" : "Неактивна";
        const aliasCount = item.aliases ? item.aliases.length : 0;
        card.innerHTML = `
          <div class="categoryHeader">
            <button class="collectionToggle" type="button">
              <div class="categoryMeta">
                <div class="bold">${escapeHtml(item.name)}</div>
                <div class="categoryCount">Расходов: ${Number(item.expense_count || 0)}</div>
              </div>
              <span class="icon collectionChevron">expand_more</span>
            </button>
            <div class="categoryActions">
              <button class="badge ${badgeClass} categoryStatusBtn" type="button">${badgeText}</button>
              <button class="btn small categoryRenameBtn" type="button">Переименовать</button>
              <button class="btn small categoryMergeBtn" type="button">Объединить</button>
              <button class="btn small categoryAliasesBtn" type="button">Алиасы (${aliasCount})</button>
            </div>
          </div>
          <div class="collectionBody">
            <div class="aliasList"></div>
            <div class="row" style="gap:8px; flex-wrap:wrap;">
              <input class="input aliasInput" type="text" placeholder="Новый алиас" />
              <button class="btn small aliasAddBtn" type="button"><span class="icon">add</span> Добавить</button>
            </div>
          </div>
        `;

        const toggleBtn = card.querySelector(".collectionToggle");
        toggleBtn.addEventListener("click", ()=> card.classList.toggle("expanded"));
        const aliasesBtn = card.querySelector(".categoryAliasesBtn");
        aliasesBtn.addEventListener("click", ()=> card.classList.toggle("expanded"));

        const aliasList = card.querySelector(".aliasList");
        (item.aliases || []).forEach(alias=> aliasList.appendChild(buildAliasChip(alias)));

        card.querySelector(".aliasAddBtn").addEventListener("click", async ()=>{
          const input = card.querySelector(".aliasInput");
          const alias = (input.value || "").trim();
          if (!alias) return;
          try{
            await API.post(`/api/categories/${item.id}/aliases`, {alias});
            input.value = "";
            await loadCategories();
            setToast("Алиас добавлен");
          }catch(err){
            alert(String(err.message || err));
          }
        });

        card.querySelector(".categoryRenameBtn").addEventListener("click", ()=>{
          openCategoryNameModal({mode:"rename", category:item});
        });
        card.querySelector(".categoryMergeBtn").addEventListener("click", ()=>{
          openCategoryMergeModal(item.id);
        });
        card.querySelector(".categoryStatusBtn").addEventListener("click", async ()=>{
          try{
            await API.put(`/api/categories/${item.id}`, {is_active: !active});
            await loadCategories();
            setToast("Статус обновлён");
          }catch(err){
            alert(String(err.message || err));
          }
        });

        list.appendChild(card);
      });
    }

    function updateBudgetEmptyState(){
      const table = $("#budgetTable");
      const empty = $("#budgetEmpty");
      if (!table || !empty) return;
      const hasRows = table.children.length > 0;
      empty.classList.toggle("hidden", hasRows);
    }

    function buildBudgetRowForm(item = {}){
      const row = document.createElement("div");
      row.className = "card miniCard budgetRowForm";
      row.innerHTML = `
        <div class="field">
          <label>Категория</label>
          <select class="input budgetCategory"></select>
        </div>
        <div class="field">
          <label>Лимит</label>
          <input class="input budgetLimit" type="number" inputmode="decimal" placeholder="0.00" />
        </div>
        <div class="field">
          <label>Порог (0.9)</label>
          <input class="input budgetWarn" type="number" inputmode="decimal" step="0.01" min="0" max="1" />
        </div>
        <div class="field">
          <label>Системные</label>
          <select class="input budgetInclude">
            <option value="1">С учётом</option>
            <option value="0">Без</option>
          </select>
        </div>
        <div class="field">
          <label>&nbsp;</label>
          <button class="btn small ghost budgetRemoveBtn" type="button"><span class="icon">delete</span> Удалить</button>
        </div>
      `;

      const select = row.querySelector(".budgetCategory");
      const opt0 = document.createElement("option");
      opt0.value = "";
      opt0.textContent = "—";
      select.appendChild(opt0);
      (State.categoryItems || []).forEach((cat)=>{
        const opt = document.createElement("option");
        opt.value = String(cat.id);
        opt.textContent = cat.name;
        select.appendChild(opt);
      });
      if (item.category_id) select.value = String(item.category_id);
      const limit = row.querySelector(".budgetLimit");
      limit.value = (item.limit_amount ?? "") === "" ? "" : String(item.limit_amount);
      const warn = row.querySelector(".budgetWarn");
      warn.value = (item.warn_threshold ?? "") === "" ? "0.9" : String(item.warn_threshold);
      const include = row.querySelector(".budgetInclude");
      include.value = String(Number(item.include_system ?? 1));

      row.querySelector(".budgetRemoveBtn").addEventListener("click", ()=>{
        row.remove();
        updateBudgetEmptyState();
      });
      return row;
    }

    function renderBudgetSettings(){
      const section = $("#budgetSection");
      if (!section) return;
      const canEdit = (State.role === "admin" || State.role === "accountant");
      section.classList.toggle("hidden", !canEdit);
      if (!canEdit) return;
      const table = $("#budgetTable");
      table.innerHTML = "";
      (State.monthBudgets || []).forEach((item)=> table.appendChild(buildBudgetRowForm(item)));
      updateBudgetEmptyState();
    }

    function setBackupBusy(busy){
      State.backupBusy = busy;
      ["backupDbBtn","backupFullBtn","backupRefreshBtn","backupRestoreBtn","backupRestoreConfirmBtn"].forEach((id)=>{
        const el = $("#"+id);
        if (el) el.disabled = busy;
      });
      const input = $("#backupRestoreInput");
      if (input) input.disabled = busy;
      const spinner = $("#backupRestoreSpinner");
      if (spinner) spinner.classList.toggle("hidden", !busy);
    }

    function renderBackupList(){
      const list = $("#backupList");
      const empty = $("#backupEmpty");
      const count = $("#backupCount");
      if (!list || !empty) return;
      list.innerHTML = "";
      const items = State.backupItems || [];
      empty.classList.toggle("hidden", items.length > 0);
      if (count) count.textContent = String(items.length);
      const known = State.backupKnownNames || new Set();
      const isInitial = known.size === 0;
      items.forEach((item)=>{
        const card = document.createElement("div");
        card.className = "card backupItem";
        if (!isInitial && !known.has(item.name)){
          card.classList.add("highlight");
        }
        const title = `${item.type === "full" ? "FULL" : "DB"} • ${fmtDateTime(item.created_at)}`;
        const subtitle = `${item.name} • ${fmtBytes(item.size_bytes)}`;
        card.innerHTML = `
          <div class="backupMeta">
            <div class="title">${escapeHtml(title)}</div>
            <div class="subtitle">${escapeHtml(subtitle)}</div>
          </div>
          <button class="btn small backupDownloadBtn" type="button">
            <span class="icon">download</span> Скачать
          </button>
        `;
        card.querySelector(".backupDownloadBtn").addEventListener("click", ()=>{
          const url = `${API.baseUrl}/api/backups/${encodeURIComponent(item.name)}/download`;
          openDownload(url);
        });
        list.appendChild(card);
      });
      State.backupKnownNames = new Set(items.map((item)=> item.name));
    }

    async function loadBackups(){
      if (State.role !== "admin") return;
      const items = await API.get("/api/backups");
      State.backupItems = items || [];
      renderBackupList();
    }

    async function runBackup(type){
      if (State.backupBusy) return;
      try{
        setBackupBusy(true);
        await API.post(`/api/backups/run?type=${encodeURIComponent(type)}`, {});
        setToast("Бэкап создан");
        await loadBackups();
      }catch(err){
        alert(String(err.message || err));
      }finally{
        setBackupBusy(false);
      }
    }

    function openBackupRestoreModal(){
      const file = State.backupRestoreFile;
      if (!file) return;
      $("#backupRestoreFileName").textContent = `Файл: ${file.name}`;
      $("#backupRestoreModal").classList.add("show");
    }

    function closeBackupRestoreModal(){
      $("#backupRestoreModal").classList.remove("show");
    }

    async function confirmBackupRestore(){
      const file = State.backupRestoreFile;
      if (!file) return;
      try{
        setBackupBusy(true);
        const form = new FormData();
        form.append("file", file);
        const headers = API.token ? {"Authorization": `Bearer ${API.token}`} : {};
        const res = await fetch(`${API.baseUrl}/api/backups/restore`, {
          method: "POST",
          headers,
          body: form
        });
        if (!res.ok){
          const txt = await res.text().catch(()=> "");
          throw new Error(`${res.status}: ${txt || "Ошибка восстановления"}`);
        }
        await res.json().catch(()=> ({}));
        setToast("Данные восстановлены");
        closeBackupRestoreModal();
        $("#backupRestoreInput").value = "";
        State.backupRestoreFile = null;
        $("#backupRestoreBtn").disabled = true;
        await refreshAll();
        await loadBackups();
      }catch(err){
        alert(String(err.message || err));
      }finally{
        setBackupBusy(false);
      }
    }


    function collectBudgetPayload(){
      const table = $("#budgetTable");
      const rows = table ? $$(".budgetRowForm", table) : [];
      const payload = [];
      const seen = new Set();
      for (const row of rows){
        const categoryId = Number(row.querySelector(".budgetCategory")?.value || 0);
        if (!categoryId){
          throw new Error("Выберите категорию для каждой строки бюджета.");
        }
        if (seen.has(categoryId)){
          throw new Error("Категории бюджета не должны повторяться.");
        }
        seen.add(categoryId);
        const limit = Number(row.querySelector(".budgetLimit")?.value || 0);
        const warnRaw = row.querySelector(".budgetWarn")?.value;
        const warnThreshold = warnRaw === "" || warnRaw === null ? 0.9 : Number(warnRaw);
        if (!(warnThreshold > 0 && warnThreshold <= 1)){
          throw new Error("Порог предупреждения должен быть в диапазоне 0–1.");
        }
        const includeSystem = (row.querySelector(".budgetInclude")?.value || "1") === "1";
        payload.push({
          category_id: categoryId,
          limit_amount: limit,
          warn_threshold: warnThreshold,
          include_system: includeSystem
        });
      }
      return payload;
    }


    function openCategoryMergeModal(targetId){
      const items = State.categoryItems || [];
      if (!items.length) return;
      MergeState.targetId = targetId || items[0]?.id || null;
      MergeState.sourceIds = new Set();

      const targetSelect = $("#mergeTargetSelect");
      targetSelect.innerHTML = "";
      items.forEach((item)=>{
        const opt = document.createElement("option");
        opt.value = String(item.id);
        opt.textContent = item.name;
        targetSelect.appendChild(opt);
      });
      if (MergeState.targetId) targetSelect.value = String(MergeState.targetId);

      function buildSources(){
        const sourceWrap = $("#mergeSources");
        sourceWrap.innerHTML = "";
        const targetIdVal = Number(targetSelect.value);
        items.filter(item=>item.id !== targetIdVal).forEach((item)=>{
          const chip = document.createElement("div");
          chip.className = "chip";
          chip.textContent = item.name;
          chip.dataset.id = String(item.id);
          chip.addEventListener("click", ()=>{
            const id = Number(item.id);
            if (MergeState.sourceIds.has(id)){
              MergeState.sourceIds.delete(id);
              chip.classList.remove("selected");
            }else{
              MergeState.sourceIds.add(id);
              chip.classList.add("selected");
            }
            $("#mergeConfirmBtn").disabled = MergeState.sourceIds.size === 0;
          });
          sourceWrap.appendChild(chip);
        });
        $("#mergeConfirmBtn").disabled = true;
      }

      buildSources();
      targetSelect.onchange = ()=>{
        MergeState.sourceIds = new Set();
        buildSources();
      };

      $("#categoryMergeModal").classList.add("show");
    }

    function closeCategoryMergeModal(){
      $("#categoryMergeModal").classList.remove("show");
    }

    const MonitorDetail = { text: "" };

    function monitorIconClass(type, item){
      if (type === "errors"){
        const level = String(item.level || "").toLowerCase();
        if (level === "error") return "danger";
        if (level === "warn" || level === "warning") return "warn";
        return "success";
      }
      if (type === "jobs" || type === "deliveries"){
        const status = String(item.status || "").toLowerCase();
        if (status === "fail" || status === "error") return "danger";
        return "success";
      }
      return "success";
    }

    function monitorIconName(type, item){
      if (type === "errors"){
        const level = String(item.level || "").toLowerCase();
        if (level === "error") return "error";
        if (level === "warn" || level === "warning") return "warning";
        return "info";
      }
      if (type === "jobs"){
        return (String(item.status || "").toLowerCase() === "fail") ? "error" : "check_circle";
      }
      if (type === "deliveries"){
        return (String(item.status || "").toLowerCase() === "fail") ? "error" : "send";
      }
      return "info";
    }

    function openMonitorDetailModal(html, copyText){
      $("#monitorDetailContent").innerHTML = html;
      MonitorDetail.text = copyText || "";
      $("#monitorDetailModal").classList.add("show");
    }

    function closeMonitorDetailModal(){
      $("#monitorDetailModal").classList.remove("show");
    }

    function renderMonitorOverviewJobs(items){
      const wrap = $("#monitorJobsOverview");
      if (!wrap) return;
      wrap.innerHTML = "";
      if (!items || !items.length){
        const empty = document.createElement("div");
        empty.className = "tiny muted2";
        empty.textContent = "Нет запусков";
        wrap.appendChild(empty);
        return;
      }
      items.forEach((item, idx)=>{
        const row = document.createElement("div");
        row.className = "rowBetween";
        row.style.fontSize = "12px";
        row.style.animationDelay = `${0.04 * idx}s`;
        row.innerHTML = `
          <div class="row" style="gap:8px;">
            <span class="icon">${monitorIconName("jobs", item)}</span>
            <span class="bold">${escapeHtml(item.job_id || "job")}</span>
          </div>
          <div class="muted2">${escapeHtml(fmtDateTime(item.started_at))}</div>
        `;
        wrap.appendChild(row);
      });
    }

    async function loadMonitorOverview(){
      if (!(State.role === "admin" || State.role === "accountant")) return;
      const card = $("#monitorOverviewCard");
      if (card) card.classList.add("shimmer");
      try{
        const data = await API.get("/api/admin/monitor/overview");
        State.monitorOverview = data;
        $("#monitorErrors24h").textContent = String(data.errors_24h ?? 0);
        $("#monitorDeliveries24h").textContent = String(data.failed_deliveries_24h ?? 0);
        renderMonitorOverviewJobs(data.jobs || []);
      }catch(err){
        $("#monitorErrors24h").textContent = "—";
        $("#monitorDeliveries24h").textContent = "—";
        renderMonitorOverviewJobs([]);
      }finally{
        if (card) setTimeout(()=> card.classList.remove("shimmer"), 200);
      }
    }

    function renderMonitorList(type, items){
      const list = $("#monitorList");
      const empty = $("#monitorEmpty");
      if (!list || !empty) return;
      list.innerHTML = "";
      empty.classList.toggle("hidden", items.length > 0);
      items.forEach((item, idx)=>{
        const row = document.createElement("div");
        row.className = "monitorItem";
        row.style.animationDelay = `${0.04 * idx}s`;
        const iconClass = monitorIconClass(type, item);
        const iconName = monitorIconName(type, item);
        const time = item.created_at || item.started_at || "";
        let title = "";
        let sub = "";
        if (type === "errors"){
          title = item.message || "Ошибка";
          sub = `${item.source || "api"} • ${fmtDateTime(time)}`;
        } else if (type === "jobs"){
          title = `${item.job_id || "job"} • ${item.status || "—"}`;
          sub = `${fmtDateTime(item.started_at)} • ${item.duration_ms || 0} мс`;
        } else if (type === "deliveries"){
          title = `${item.kind || "report"} → ${item.recipient_id || "—"}`;
          sub = `${item.status || "—"} • ${fmtDateTime(time)}`;
        }
        row.innerHTML = `
          <div class="levelIcon ${iconClass}"><span class="icon">${iconName}</span></div>
          <div class="meta">
            <div class="title">${escapeHtml(title)}</div>
            <div class="sub">${escapeHtml(sub)}</div>
          </div>
        `;
        row.addEventListener("click", ()=>{
          const content = buildMonitorDetailContent(type, item);
          const copyText = buildMonitorDetailText(type, item);
          openMonitorDetailModal(content, copyText);
        });
        list.appendChild(row);
      });
    }

    function buildMonitorDetailContent(type, item){
      const fields = [];
      if (type === "errors"){
        fields.push(["Уровень", item.level]);
        fields.push(["Источник", item.source]);
        fields.push(["Сообщение", item.message]);
        fields.push(["Время", fmtDateTime(item.created_at)]);
        if (item.details_json) fields.push(["Детали", item.details_json]);
        if (item.trace) fields.push(["Trace", item.trace]);
      }
      if (type === "jobs"){
        fields.push(["Job", item.job_id]);
        fields.push(["Статус", item.status]);
        fields.push(["Старт", fmtDateTime(item.started_at)]);
        fields.push(["Финиш", fmtDateTime(item.finished_at)]);
        fields.push(["Длительность", `${item.duration_ms || 0} мс`]);
        if (item.error) fields.push(["Ошибка", item.error]);
      }
      if (type === "deliveries"){
        fields.push(["Тип", item.kind]);
        fields.push(["Получатель", item.recipient_id]);
        fields.push(["Статус", item.status]);
        fields.push(["Время", fmtDateTime(item.created_at)]);
        if (item.error) fields.push(["Ошибка", item.error]);
      }
      const body = fields.map(([label, value])=>{
        const val = value === null || value === undefined || value === "" ? "—" : String(value);
        return `
          <div class="field">
            <label>${escapeHtml(label)}</label>
            <div class="detailBlock">${escapeHtml(val)}</div>
          </div>
        `;
      }).join("");
      return `<div class="form">${body}</div>`;
    }

    function buildMonitorDetailText(type, item){
      if (type === "errors"){
        return [
          `level: ${item.level}`,
          `source: ${item.source}`,
          `message: ${item.message}`,
          `created_at: ${item.created_at}`,
          item.details_json ? `details: ${item.details_json}` : null,
          item.trace ? `trace:\n${item.trace}` : null
        ].filter(Boolean).join("\n");
      }
      if (type === "jobs"){
        return [
          `job_id: ${item.job_id}`,
          `status: ${item.status}`,
          `started_at: ${item.started_at}`,
          `finished_at: ${item.finished_at}`,
          `duration_ms: ${item.duration_ms}`,
          item.error ? `error: ${item.error}` : null
        ].filter(Boolean).join("\n");
      }
      return [
        `kind: ${item.kind}`,
        `recipient_id: ${item.recipient_id}`,
        `status: ${item.status}`,
        `created_at: ${item.created_at}`,
        item.error ? `error: ${item.error}` : null
      ].filter(Boolean).join("\n");
    }

    async function loadMonitorList(type){
      if (!(State.role === "admin" || State.role === "accountant")) return;
      try{
        if (type === "errors"){
          const res = await API.get("/api/admin/monitor/logs?level=ERROR&limit=100");
          renderMonitorList("errors", res.items || []);
        } else if (type === "jobs"){
          const res = await API.get("/api/admin/monitor/jobs?limit=50");
          renderMonitorList("jobs", res.items || []);
        } else {
          const res = await API.get("/api/admin/monitor/deliveries?limit=50&kind=report");
          renderMonitorList("deliveries", res.items || []);
        }
      }catch(err){
        renderMonitorList(type, []);
      }
    }

    function setMonitorTab(which){
      State.monitorTab = which;
      $("#tabMonErrors").classList.toggle("active", which === "errors");
      $("#tabMonJobs").classList.toggle("active", which === "jobs");
      $("#tabMonDeliveries").classList.toggle("active", which === "deliveries");
      loadMonitorList(which);
    }

    const SettingsMenuConfig = [
      {
        id: "reportsSection",
        title: "Отчёты",
        subtitle: "Отправка и тесты",
        icon: "assessment",
        rolesVisible: ["admin"],
        rolesEditable: ["admin"],
      },
      {
        id: "monthSection",
        title: "Параметры месяца",
        subtitle: "МНСП, баланс, часовой пояс",
        icon: "tune",
        rolesVisible: ["admin"],
        rolesEditable: ["admin"],
      },
      {
        id: "monthCloseSection",
        title: "Закрытие месяца",
        subtitle: "Статус и доступы",
        icon: "lock",
        rolesVisible: ["admin", "accountant", "viewer"],
        rolesEditable: ["admin"],
      },
      {
        id: "templatesSection",
        title: "Шаблоны",
        subtitle: "Локальные пресеты расходов",
        icon: "description",
        rolesVisible: ["admin", "accountant"],
        rolesEditable: ["admin", "accountant"],
      },
      {
        id: "exportSection",
        title: "Экспорт",
        subtitle: "CSV и Excel",
        icon: "download",
        rolesVisible: ["admin", "accountant"],
        rolesEditable: ["admin", "accountant"],
      },
      {
        id: "usersSection",
        title: "Пользователи",
        subtitle: "Доступ и роли",
        icon: "group",
        rolesVisible: ["admin"],
        rolesEditable: ["admin"],
      },
      {
        id: "themeSection",
        title: "Тема интерфейса",
        subtitle: "Светлая или тёмная",
        icon: "palette",
        rolesVisible: ["admin", "viewer"],
        rolesEditable: ["admin", "viewer"],
      },
      {
        id: "categoriesSection",
        title: "Категории",
        subtitle: "Список категорий расходов",
        icon: "category",
        rolesVisible: ["admin"],
        rolesEditable: ["admin"],
      },
      {
        id: "budgetSection",
        title: "Бюджет",
        subtitle: "Лимиты по категориям",
        icon: "account_balance_wallet",
        rolesVisible: ["admin", "accountant"],
        rolesEditable: ["admin", "accountant"],
      },
      {
        id: "backupsSection",
        title: "Бэкапы",
        subtitle: "Резервные копии базы",
        icon: "backup",
        rolesVisible: ["admin"],
        rolesEditable: ["admin"],
      },
      {
        id: "monitorSection",
        title: "Мониторинг",
        subtitle: "Ошибки и доставка",
        icon: "monitoring",
        rolesVisible: ["admin", "accountant"],
        rolesEditable: ["admin", "accountant"],
      },
    ];
    const SettingsMenuMap = new Map(SettingsMenuConfig.map((item)=>[item.id, item]));

    function renderSettingsMenu(){
      const list = $("#settingsMenuList");
      if (!list) return [];
      const role = State.role;
      const visibleIds = [];
      list.innerHTML = "";
      SettingsMenuConfig.forEach((item)=>{
        if (!item.rolesVisible.includes(role)) return;
        visibleIds.push(item.id);
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "item settingsMenuItem";
        btn.innerHTML = `
          <div class="itemLeft">
            <div class="itemIco"><span class="icon">${item.icon}</span></div>
            <div class="itemText">
              <div class="t">${escapeHtml(item.title)}</div>
              <div class="s">${escapeHtml(item.subtitle)}</div>
            </div>
          </div>
          <div class="itemRight"><span class="icon">chevron_right</span></div>
        `;
        btn.addEventListener("click", ()=> openSettingsPage(item.id));
        list.appendChild(btn);
      });
      return visibleIds;
    }

    function openSettingsPage(sectionId){
      const config = SettingsMenuMap.get(sectionId);
      if (!config || !config.rolesVisible.includes(State.role)) return;
      State.settingsScroll.menu = window.scrollY || 0;
      State.settingsPage = sectionId;
      const panel = $("#settingsPanel");
      const title = $("#settingsPanelTitle");
      const body = $("#settingsPanelBody");
      if (!panel || !title || !body) return;
      title.textContent = config.title;
      $$("#settingsSectionsHost .section").forEach((sec)=>{
        sec.classList.add("hidden");
        sec.classList.remove("activePage");
      });
      const active = $("#"+sectionId);
      if (active){
        active.classList.remove("hidden");
        active.classList.add("activePage");
      }
      panel.classList.remove("hidden");
      panel.setAttribute("aria-hidden", "false");
      body.scrollTop = State.settingsScroll.page || 0;
      requestAnimationFrame(()=> panel.classList.add("open"));
      if (active){
        const focusable = active.querySelector("input, select, textarea, button");
        if (focusable) {
          setTimeout(()=> focusable.focus({preventScroll:true}), 120);
        }
      }
    }

    function closeSettingsPage({immediate=false}={}){
      const panel = $("#settingsPanel");
      const body = $("#settingsPanelBody");
      if (!panel || panel.classList.contains("hidden")) return;
      State.settingsScroll.page = body ? body.scrollTop : 0;
      const finish = ()=>{
        panel.classList.add("hidden");
        panel.setAttribute("aria-hidden", "true");
        $$("#settingsSectionsHost .section").forEach((sec)=>{
          sec.classList.add("hidden");
          sec.classList.remove("activePage");
        });
        State.settingsPage = null;
        window.scrollTo({top: State.settingsScroll.menu || 0});
      };
      if (immediate){
        panel.classList.remove("open");
        finish();
        return;
      }
      panel.classList.remove("open");
      window.setTimeout(finish, 240);
    }

    async function renderSettingsUI(){
      const canSee = (State.role === "admin" || State.role === "accountant" || State.role === "viewer");
      $("#settingsDenied").classList.toggle("hidden", canSee);
      $("#settingsWrap").classList.toggle("hidden", !canSee);
      if (!canSee) return;

      // accountant: show only local templates section (MVP) + exports
      const isAdmin = State.role === "admin";
      const isViewer = State.role === "viewer";
      const isAccountant = State.role === "accountant";
      const visibleIds = renderSettingsMenu();
      if (State.settingsPage && !visibleIds.includes(State.settingsPage)){
        closeSettingsPage({immediate:true});
      }
      $$("#settingsSectionsHost .section").forEach((sec)=>{
        sec.classList.add("hidden");
      });

      // Admin-only controls
      const adminOnlyIds = [
        "setChatId","setSundayTime","setDailyTime","setDailyEnabled","saveSettingsBtn","sendSundayNowBtn","sendExpensesNowBtn","sendTestReportBtn",
        "setMonthlyMin","setSundaysOverride","setStartBalance","setTimezone","saveMonthSettingsBtn"
      ];
      adminOnlyIds.forEach(id=>{
        const el = $("#"+id);
        if (el) el.closest(".field")?.classList.toggle("hidden", !isAdmin);
      });
      // Admin-only buttons in reports block
      ["saveSettingsBtn","sendSundayNowBtn","sendExpensesNowBtn","sendTestReportBtn","saveMonthSettingsBtn"].forEach(id=>{
        const el = $("#"+id);
        if (el) el.classList.toggle("hidden", !isAdmin);
      });
      const themeBtn = $("#saveThemeBtn");
      if (themeBtn) themeBtn.classList.toggle("hidden", !(isAdmin || isViewer));

      // Load server settings for admin/viewer
      if (isAdmin || isViewer){
        const s = await API.get("/api/settings");
        if (isAdmin) {
          $("#setChatId").value = (s.report_chat_id ?? "");
          $("#setSundayTime").value = (s.sunday_report_time || "18:00");
          $("#setDailyTime").value = (s.month_report_time || "21:00");
          $("#setDailyEnabled").value = s.daily_expenses_enabled ? "1" : "0";
          $("#setTimezone").value = (s.timezone || "Europe/Warsaw");
        }
        $("#setTheme").value = (s.ui_theme || "auto");
      }

      // Month settings (current month)
      if (isAdmin && State.monthId){
        const m = State.monthCache.get(keyYM(State.year, State.month));
        if (m){
          $("#setMonthlyMin").value = (m.monthly_min_needed ?? "");
          $("#setSundaysOverride").value = (m.sundays_override ?? "");
          $("#setStartBalance").value = (m.start_balance ?? "");
        }
      }

      renderSettingsMonthClose();

      // Templates editor
      $("#templatesJson").value = JSON.stringify(State.templates, null, 2);

      renderCategoriesSection();
      renderBudgetSettings();
      if (isAdmin){
        await loadBackups();
      }

      if (isAdmin || isAccountant){
        await loadMonitorOverview();
        if (isAccountant){
          $("#tabMonErrors").classList.add("hidden");
          $("#tabMonJobs").classList.add("hidden");
          $("#monitorJobsBlock").classList.add("hidden");
          $("#monitorErrors24h").textContent = "—";
          renderMonitorOverviewJobs([]);
          setMonitorTab("deliveries");
        } else {
          $("#tabMonErrors").classList.remove("hidden");
          $("#tabMonJobs").classList.remove("hidden");
          $("#monitorJobsBlock").classList.remove("hidden");
          if (!State.monitorTab) State.monitorTab = "errors";
          setMonitorTab(State.monitorTab || "errors");
        }
      }
    }

    async function loadThemeSetting(){
      const s = await API.get("/api/settings");
      applyTheme(s.ui_theme || "auto");
      const themeSelect = $("#setTheme");
      if (themeSelect) themeSelect.value = (s.ui_theme || "auto");
    }

    /**********************
     * Month close actions
     **********************/
    async function closeCurrentMonth(){
      if (!State.monthId) {
        alert("Месяц не выбран.");
        return;
      }
      if (State.role !== "admin"){
        setToast("Нет доступа");
        return;
      }
      const ok = confirm("Закрыть месяц? После закрытия изменения будут запрещены.");
      if (!ok) return;
      await API.post(`/api/months/${State.monthId}/close`, {});
      setToast("Месяц закрыт");
      await refreshAll();
    }
    async function reopenCurrentMonth(){
      if (!State.monthId) {
        alert("Месяц не выбран.");
        return;
      }
      if (State.role !== "admin"){
        setToast("Нет доступа");
        return;
      }
      const ok = confirm("Открыть месяц для изменений?");
      if (!ok) return;
      await API.post(`/api/months/${State.monthId}/reopen`, {});
      setToast("Месяц открыт");
      await refreshAll();
    }

    /**********************
     * Actions: Save donation/expense
     **********************/
    async function saveDonation({andNext=false}={}){
      if (!State.monthId) {
        alert("Месяц не создан. Попросите админа создать месяц.");
        return;
      }
      if (!(State.role === "admin" || State.role === "accountant")) {
        alert("У вашей роли нет прав на изменение данных.");
        return;
      }
      if (isMonthClosed()){
        notifyMonthClosed($("#addDonationCard"));
        return;
      }
      const type = getDonationType();
      const isDonation = type === "donation";
      const d = isDonation ? State.sundayDates[State.sundayIndex] : $("#donOtherDate").value;
      if (!d) return;

      const cashless = Number($("#donCashless").value||0);
      const cash = Number($("#donCash").value||0);

      await API.post(`/api/months/${State.monthId}/services`, {
        service_date: d,
        cashless,
        cash,
        income_type: type
      });
      setToast("Сохранено");
      await refreshAll();

      if (andNext){
        if (isDonation) {
          State.sundayIndex = clamp(State.sundayIndex+1, 0, State.sundayDates.length-1);
          updateDonationDateUI();
        }
      }
    }

    async function saveExpense({andMore=false}={}){
      if (!State.monthId) {
        alert("Месяц не создан. Попросите админа создать месяц.");
        return;
      }
      if (!(State.role === "admin" || State.role === "accountant")) {
        alert("У вашей роли нет прав на изменение данных.");
        return;
      }
      if (isMonthClosed()){
        notifyMonthClosed($("#addExpenseCard"));
        return;
      }

      const date = $("#expDate").value;
      const category = ($("#expCategory").value||"").trim() || "Прочее";
      const title = ($("#expTitle").value||"").trim() || "Расход";
      const qty = Number($("#expQty").value||1);
      const unit = Number($("#expUnit").value||0);
      const comment = ($("#expComment").value||"").trim() || null;
      const tags = State.expenseTags.length ? State.expenseTags : [];

      const balanceWarn = !$("#expWarn").classList.contains("hidden");
      const budgetWarn = !$("#expBudgetWarn").classList.contains("hidden");
      if (balanceWarn || budgetWarn){
        let msg = "Сохранить расход?";
        if (balanceWarn && budgetWarn){
          msg = "Расход может превышать баланс/СДДР и лимит бюджета категории. Сохранить всё равно?";
        } else if (balanceWarn){
          msg = "Расход может превышать доступный баланс/СДДР. Сохранить всё равно?";
        } else if (budgetWarn){
          msg = "Расход превышает лимит бюджета категории. Сохранить всё равно?";
        }
        const ok = confirm(msg);
        if (!ok) return;
      }

      const created = await API.post(`/api/months/${State.monthId}/expenses`, {
        expense_date: date,
        category,
        title,
        qty,
        unit_amount: unit,
        comment,
        tags
      });
      const budgetOver = (created?.warnings || []).find((w)=> w.type === "budget_over");
      if (budgetOver){
        setToast(`Бюджет превышен: ${budgetOver.category}`);
      }
      const expenseId = created?.id;
      if (expenseId && State.pendingExpenseFiles.length){
        await uploadExpenseAttachments(expenseId, State.pendingExpenseFiles, $("#expAttachGrid"));
        State.pendingExpenseFiles = [];
        $("#expAttachInput").value = "";
      }

      setToast("Сохранено");
      await refreshAll();

      if (andMore){
        resetExpenseForm();
      }
    }

    /**********************
     * Exports
     **********************/
    function openDownload(url){
      const token = API.token || localStorage.getItem("sessionToken");
      const finalUrl = token ? (()=> {
        const u = new URL(url, location.origin);
        if (!u.searchParams.has("token")) u.searchParams.set("token", token);
        return u.toString();
      })() : url;
      if (tg?.openLink){
        tg.openLink(finalUrl);
      } else {
        window.open(finalUrl, "_blank");
      }
    }

    /**********************
     * Month picker modal
     **********************/
    function openMonthModal(){
      // year select: current year +- 2
      const ySel = $("#yearSelect");
      const mSel = $("#monthSelect");
      ySel.innerHTML = "";
      mSel.innerHTML = "";

      const now = new Date();
      const y0 = now.getFullYear();
      const years = [y0-1, y0, y0+1, y0+2];
      years.forEach(y=>{
        const o = document.createElement("option");
        o.value = String(y);
        o.textContent = String(y);
        ySel.appendChild(o);
      });

      for(let m=1;m<=12;m++){
        const o = document.createElement("option");
        o.value = String(m);
        o.textContent = monthNameRu(m);
        mSel.appendChild(o);
      }
      ySel.value = String(State.year);
      mSel.value = String(State.month);

      $("#monthModal").classList.add("show");
    }
    function closeMonthModal(){
      $("#monthModal").classList.remove("show");
    }

    async function applyMonthSelection(){
      const y = Number($("#yearSelect").value);
      const m = Number($("#monthSelect").value);
      State.year = y;
      State.month = m;
      setMonthTitle();
      await loadMonthsForYear(State.year);
      await ensureSelectedMonthExists();
      if (!State.monthId) {
        await loadLatestMonthFallback();
      }
      if (State.periodType === "month") {
        State.periodYear = State.year;
        State.periodMonth = State.month;
      } else if (State.periodType === "quarter") {
        State.periodYear = State.year;
        State.periodQuarter = quarterFromMonth(State.month);
      } else {
        State.periodYear = State.year;
      }
      rebuildPeriodSelectors();
      await refreshAll();
      closeMonthModal();
    }

    function rebuildPeriodSelectors(){
      const yearSelect = $("#periodYearSelect");
      const monthSelect = $("#periodMonthSelect");
      const quarterSelect = $("#periodQuarterSelect");
      if (!yearSelect || !monthSelect || !quarterSelect) return;

      const baseYear = Number(State.year || new Date().getFullYear());
      const years = new Set([baseYear - 1, baseYear, baseYear + 1, State.periodYear].filter(Boolean));
      const yearList = Array.from(years).filter((y)=> y && y > 1900).sort((a,b)=>a-b);

      yearSelect.innerHTML = "";
      yearList.forEach((y)=>{
        const opt = document.createElement("option");
        opt.value = String(y);
        opt.textContent = String(y);
        yearSelect.appendChild(opt);
      });

      monthSelect.innerHTML = "";
      for (let i = 1; i <= 12; i++){
        const opt = document.createElement("option");
        opt.value = String(i);
        opt.textContent = monthNameRu(i);
        monthSelect.appendChild(opt);
      }

      quarterSelect.innerHTML = "";
      for (let i = 1; i <= 4; i++){
        const opt = document.createElement("option");
        opt.value = String(i);
        opt.textContent = `Q${i}`;
        quarterSelect.appendChild(opt);
      }

      yearSelect.value = String(State.periodYear || baseYear);
      monthSelect.value = String(State.periodMonth || State.month || 1);
      quarterSelect.value = String(State.periodQuarter || quarterFromMonth(State.periodMonth || State.month || 1));
      updatePeriodSelectorsVisibility();
      updatePeriodSegmentUI();
      syncDropdown("periodYearSelect");
      syncDropdown("periodMonthSelect");
    }

    function updatePeriodSelectorsVisibility(){
      $("#periodMonthWrap")?.classList.toggle("hidden", State.periodType !== "month");
      $("#periodQuarterWrap")?.classList.toggle("hidden", State.periodType !== "quarter");
    }

    function updatePeriodSegmentUI(){
      $$("#periodTypeSegments .segBtn").forEach((btn)=>{
        btn.classList.toggle("active", btn.dataset.type === State.periodType);
      });
    }

    async function applyPeriodSelection(){
      const yearSelect = $("#periodYearSelect");
      const monthSelect = $("#periodMonthSelect");
      const quarterSelect = $("#periodQuarterSelect");
      if (!yearSelect || !monthSelect || !quarterSelect) return;
      State.periodYear = Number(yearSelect.value || State.year);
      if (State.periodType === "month") {
        State.periodMonth = Number(monthSelect.value || State.month);
      }
      if (State.periodType === "quarter") {
        State.periodQuarter = Number(quarterSelect.value || quarterFromMonth(State.month));
      }
      await loadPeriodAnalytics();
      renderPeriodSummary();
    }

    /**********************
     * Bottom nav mount
     **********************/
    const nav = document.createElement("div");
    nav.className = "nav";
    nav.innerHTML = `
      <div class="navInner" id="navInner">
        <button class="navBtn active" data-screen="dashboard" type="button">
          <span class="icon">dashboard</span><span class="lbl">Дашборд</span>
        </button>
        <button class="navBtn" data-screen="add" type="button">
          <span class="icon">add_circle</span><span class="lbl">Добавить</span>
        </button>
        <button class="navBtn" data-screen="history" type="button">
          <span class="icon">history</span><span class="lbl">История</span>
        </button>
        <button class="navBtn" data-screen="settings" type="button" id="navSettingsBtn">
          <span class="icon">settings</span><span class="lbl">Настройки</span>
        </button>
      </div>
    `;
    document.body.appendChild(nav);

    /**********************
     * Event wiring
     **********************/
    function wireEvents(){
      // nav
      $$(".navBtn").forEach(btn=>{
        btn.addEventListener("click", ()=>{
          const screen = btn.dataset.screen;
          if (screen === "add" && !(State.role === "admin" || State.role === "accountant")){
            switchScreen("dashboard");
            setToast("Нет доступа");
            return;
          }
          switchScreen(screen);
        });
      });

      // topbar
      $("#refreshBtn").addEventListener("click", async ()=>{
        try{
          await refreshAll();
          setToast("Обновлено");
        }catch(e){ alert(String(e.message||e)); }
      });
      $("#monthBtn").addEventListener("click", openMonthModal);

      // month modal
      $("#closeMonthModal").addEventListener("click", closeMonthModal);
      $("#monthModal").addEventListener("click", (e)=>{ if (e.target === $("#monthModal")) closeMonthModal(); });
      $("#applyMonthBtn").addEventListener("click", async ()=>{
        try{ await applyMonthSelection(); } catch(e){ alert(String(e.message||e)); }
      });

      // dashboard quick actions
      $("#addSundayBtn").addEventListener("click", ()=>{
        switchScreen("add");
        setAddTab("don");
      });
      $("#allExpensesBtn").addEventListener("click", ()=>{
        switchScreen("history");
        setHistoryTab("exp");
      });
      $("#createMonthBtn").addEventListener("click", async ()=>{
        try{ await createMonthIfAdmin(); } catch(e){ alert(String(e.message||e)); }
      });
      $("#yearCollectionToggle").addEventListener("click", ()=>{
        const isExpanded = $("#yearCollection").classList.contains("expanded");
        setYearCollectionExpanded(!isExpanded);
      });
      if (hasPeriodUI()){
        $("#periodCollectionToggle")?.addEventListener("click", ()=>{
          const isExpanded = $("#periodCollection").classList.contains("expanded");
          setPeriodCollectionExpanded(!isExpanded);
        });
      }

      $("#budgetToggle").addEventListener("click", ()=>{
        const isExpanded = $("#budgetCollection").classList.contains("expanded");
        setBudgetCollectionExpanded(!isExpanded);
      });

      const periodSegments = $("#periodTypeSegments");
      const periodYearSelect = $("#periodYearSelect");
      const periodMonthSelect = $("#periodMonthSelect");
      const periodQuarterSelect = $("#periodQuarterSelect");
      if (periodSegments && periodYearSelect && periodMonthSelect && periodQuarterSelect){
        periodSegments.addEventListener("click", async (e)=>{
          const btn = e.target.closest(".segBtn");
          if (!btn) return;
          const nextType = btn.dataset.type;
          if (!nextType || nextType === State.periodType) return;
          State.periodType = nextType;
          updatePeriodSegmentUI();
          updatePeriodSelectorsVisibility();
          if (State.periodType === "month") {
            State.periodMonth = Number(periodMonthSelect.value || State.month);
          } else if (State.periodType === "quarter") {
            State.periodQuarter = Number(periodQuarterSelect.value || quarterFromMonth(State.month));
          }
          await applyPeriodSelection();
        });
        periodYearSelect.addEventListener("change", async ()=>{ await applyPeriodSelection(); });
        periodMonthSelect.addEventListener("change", async ()=>{ await applyPeriodSelection(); });
        periodQuarterSelect.addEventListener("change", async ()=>{ await applyPeriodSelection(); });
      }


      // add tabs
      $("#tabDonation").addEventListener("click", ()=> setAddTab("don"));
      $("#tabExpense").addEventListener("click", ()=> setAddTab("exp"));

      // donation sunday arrows
      $("#sunPrev").addEventListener("click", ()=>{
        State.sundayIndex = clamp(State.sundayIndex-1, 0, State.sundayDates.length-1);
        updateDonationDateUI();
      });
      $("#sunNext").addEventListener("click", ()=>{
        State.sundayIndex = clamp(State.sundayIndex+1, 0, State.sundayDates.length-1);
        updateDonationDateUI();
      });

      // donation recalc
      $("#donCashless").addEventListener("input", recalcDonationTotals);
      $("#donCash").addEventListener("input", recalcDonationTotals);
      $("#donIncomeType").addEventListener("change", setDonationTypeUI);
      $("#donOtherDate").addEventListener("change", ()=>{
        State.otherIncomeDate = $("#donOtherDate").value;
        updateDonationDateUI();
      });

      // donation chips (active field = focused input)
      let activeDonField = $("#donCashless");
      $("#donCashless").addEventListener("focus", ()=>activeDonField=$("#donCashless"));
      $("#donCash").addEventListener("focus", ()=>activeDonField=$("#donCash"));

      $("#donChips").addEventListener("click", (e)=>{
        const chip = e.target.closest(".chip");
        if (!chip) return;
        if (chip.id === "copyPrevSunday") { copyPreviousSunday(); return; }
        const add = Number(chip.dataset.add||0);
        if (!add) return;
        const cur = Number(activeDonField.value||0);
        activeDonField.value = String(Math.round((cur+add)*100)/100);
        recalcDonationTotals();
      });

      // donation save
      $("#saveDonationBtn").addEventListener("click", async ()=>{
        try{ await saveDonation({andNext:false}); }catch(e){ alert(String(e.message||e)); }
      });
      $("#saveDonationNextBtn").addEventListener("click", async ()=>{
        try{ await saveDonation({andNext:true}); }catch(e){ alert(String(e.message||e)); }
      });

      // expense form
      $("#expQty").addEventListener("input", recalcExpenseTotals);
      $("#expUnit").addEventListener("input", recalcExpenseTotals);
      $("#expCategory").addEventListener("change", updateWarningsExpenseForm);
      $("#expTemplate").addEventListener("change", (e)=> applyTemplate(e.target.value));
      $("#expTagsAddBtn").addEventListener("click", ()=>{
        openTagPicker({
          selected: State.expenseTags,
          allowCreate: (State.role === "admin" || State.role === "accountant"),
          title: "Теги для расхода",
          onApply: (tags)=> setExpenseTags(tags)
        });
      });
      $("#expAttachBtn").addEventListener("click", ()=>{
        if (!canEditAttachments()) return;
        $("#expAttachInput").click();
      });
      $("#expAttachInput").addEventListener("change", (e)=>{
        addPendingExpenseFiles(e.target.files);
        e.target.value = "";
      });

      $("#saveExpenseBtn").addEventListener("click", async ()=>{
        try{ await saveExpense({andMore:false}); }catch(e){ alert(String(e.message||e)); }
      });
      $("#saveExpenseMoreBtn").addEventListener("click", async ()=>{
        try{ await saveExpense({andMore:true}); }catch(e){ alert(String(e.message||e)); }
      });
      $("#saveExpenseDraftBtn").addEventListener("click", async ()=>{
        try{ await saveExpenseDraft(); }catch(e){ alert(String(e.message||e)); }
      });

      $("#openDraftsBtn").addEventListener("click", openDraftsModal);
      $("#closeDraftsModal").addEventListener("click", closeDraftsModal);
      $("#draftsModal").addEventListener("click", (e)=>{ if (e.target === $("#draftsModal")) closeDraftsModal(); });

      // history tabs + filters
      $("#tabHistDon").addEventListener("click", ()=> setHistoryTab("don"));
      $("#tabHistExp").addEventListener("click", ()=> setHistoryTab("exp"));
      $("#histMonthSelect").addEventListener("change", renderHistory);
      $("#histCategorySelect").addEventListener("change", renderHistory);
      $("#histTagsAddBtn").addEventListener("click", ()=>{
        openTagPicker({
          selected: State.historyTags,
          allowCreate: (State.role === "admin" || State.role === "accountant"),
          title: "Фильтр по тегам",
          onApply: (tags)=>{
            setHistoryTags(tags);
            renderHistory();
          }
        });
      });
      $("#histTagsResetBtn").addEventListener("click", ()=>{
        setHistoryTags([]);
        renderHistory();
      });
      $("#histSearch").addEventListener("input", ()=> {
        // small debounce
        clearTimeout(window.__histT);
        window.__histT = setTimeout(renderHistory, 120);
      });

      // tag picker modal
      $("#closeTagPickerModal").addEventListener("click", closeTagPicker);
      $("#tagPickerModal").addEventListener("click", (e)=>{ if (e.target === $("#tagPickerModal")) closeTagPicker(); });
      $("#tagPickerDoneBtn").addEventListener("click", ()=>{
        if (TagPicker.onApply) TagPicker.onApply(Array.from(TagPicker.selected));
        closeTagPicker();
      });
      $("#tagPickerCreateBtn").addEventListener("click", async ()=>{ await createTagFromPicker(); });
      $("#tagSearchInput").addEventListener("input", renderTagPickerList);


      // edit modal
      $("#closeEditModal").addEventListener("click", closeEditModal);
      $("#editModal").addEventListener("click", (e)=>{ if (e.target === $("#editModal")) closeEditModal(); });
      $("#editSaveBtn").addEventListener("click", async ()=>{
        try{ await saveEdit(); } catch(e){ alert(String(e.message||e)); }
      });
      $("#editDeleteBtn").addEventListener("click", async ()=>{
        try{
          const ok = confirm("Удалить запись?");
          if (!ok) return;
          await deleteEdit();
        } catch(e){ alert(String(e.message||e)); }
      });
      $("#editDuplicateBtn").addEventListener("click", async ()=>{
        try{ await duplicateEdit(); } catch(e){ alert(String(e.message||e)); }
      });
      // viewer modal
      $("#closeViewerModal").addEventListener("click", closeViewerModal);
      $("#viewerModal").addEventListener("click", (e)=>{ if (e.target === $("#viewerModal")) closeViewerModal(); });
      $("#viewerDeleteBtn").addEventListener("click", async ()=>{
        if (!Viewer.attachment || !Viewer.expenseId) return;
        try{
          const grid = $("#editBody .attachmentGrid");
          const deleted = await deleteAttachment(Viewer.attachment, Viewer.expenseId, grid);
          if (deleted) closeViewerModal();
        }catch(e){ alert(String(e.message||e)); }
      });

      // monitor
      $("#monitorRefreshBtn").addEventListener("click", async ()=>{
        try{
          await loadMonitorOverview();
          await loadMonitorList(State.monitorTab || "errors");
          setToast("Обновлено");
        }catch(e){ alert(String(e.message||e)); }
      });
      $("#tabMonErrors").addEventListener("click", ()=> setMonitorTab("errors"));
      $("#tabMonJobs").addEventListener("click", ()=> setMonitorTab("jobs"));
      $("#tabMonDeliveries").addEventListener("click", ()=> setMonitorTab("deliveries"));
      $("#closeMonitorDetailModal").addEventListener("click", closeMonitorDetailModal);
      $("#monitorDetailModal").addEventListener("click", (e)=>{ if (e.target === $("#monitorDetailModal")) closeMonitorDetailModal(); });
      $("#copyMonitorDetailBtn").addEventListener("click", async ()=>{
        try{
          if (navigator.clipboard?.writeText) {
            await navigator.clipboard.writeText(MonitorDetail.text || "");
            setToast("Скопировано");
          } else {
            alert("Буфер обмена недоступен");
          }
        }catch(e){ alert(String(e.message||e)); }
      });


      // settings
      $("#settingsPanelBackBtn").addEventListener("click", ()=> closeSettingsPage());
      $("#settingsPanelBackdrop").addEventListener("click", ()=> closeSettingsPage());
      document.addEventListener("keydown", (e)=>{
        if (e.key === "Escape") closeSettingsPage();
      });
      $("#saveSettingsBtn").addEventListener("click", async ()=>{
        try{
          await API.put("/api/settings", {
            report_chat_id: $("#setChatId").value ? Number($("#setChatId").value) : null,
            sunday_report_time: $("#setSundayTime").value || null,
            month_report_time: $("#setDailyTime").value || null,
            daily_expenses_enabled: ($("#setDailyEnabled").value === "1")
          });
          setToast("Сохранено");
        } catch(e){ alert(String(e.message||e)); }
      });

      $("#saveThemeBtn").addEventListener("click", async ()=>{
        try{
          const theme = ($("#setTheme").value || "auto");
          await API.put("/api/settings", { ui_theme: theme });
          applyTheme(theme);
          setToast("Тема сохранена");
        } catch(e){ alert(String(e.message||e)); }
      });
      $("#budgetAddRowBtn").addEventListener("click", ()=>{
        const table = $("#budgetTable");
        table.appendChild(buildBudgetRowForm());
        updateBudgetEmptyState();
      });
      $("#saveBudgetBtn").addEventListener("click", async ()=>{
        try{
          if (!State.monthId) { alert("Месяц не создан."); return; }
          const payload = collectBudgetPayload();
          await API.put(`/api/months/${State.monthId}/budget`, payload);
          await refreshAll();
          setToast("Бюджет сохранён");
        }catch(err){
          alert(String(err.message || err));
        }
      });
      $("#closeCategoryNameModal").addEventListener("click", closeCategoryNameModal);
      $("#closeCategoryMergeModal").addEventListener("click", closeCategoryMergeModal);
      $("#categoryNameModal").addEventListener("click", (e)=>{ if (e.target === $("#categoryNameModal")) closeCategoryNameModal(); });
      $("#categoryMergeModal").addEventListener("click", (e)=>{ if (e.target === $("#categoryMergeModal")) closeCategoryMergeModal(); });
      $("#saveCategoryNameBtn").addEventListener("click", async ()=>{
        const name = ($("#categoryNameInput").value || "").trim();
        if (!name) return;
        try{
          if (CategoryModal.mode === "rename" && CategoryModal.id){
            await API.put(`/api/categories/${CategoryModal.id}`, {name});
            setToast("Категория обновлена");
          }else{
            await API.post("/api/categories", {name});
            setToast("Категория создана");
          }
          closeCategoryNameModal();
          await loadCategories();
        }catch(err){
          alert(String(err.message || err));
        }
      });
      $("#mergeConfirmBtn").addEventListener("click", async ()=>{
        const targetId = Number($("#mergeTargetSelect").value || 0);
        const sourceIds = Array.from(MergeState.sourceIds || []);
        if (!targetId || sourceIds.length === 0) return;
        const ok = confirm("Операция изменит историю. Продолжить?");
        if (!ok) return;
        try{
          await API.post("/api/categories/merge", {target_id: targetId, source_ids: sourceIds});
          closeCategoryMergeModal();
          await refreshAll();
          setToast("Категории объединены");
        }catch(err){
          alert(String(err.message || err));
        }
      });

      $("#sendSundayNowBtn").addEventListener("click", async ()=>{
        try{ await API.post("/api/reports/sunday", {}); setToast("Отправлено"); } catch(e){ alert(String(e.message||e)); }
      });
      $("#sendExpensesNowBtn").addEventListener("click", async ()=>{
        try{ await API.post("/api/reports/month_expenses", {}); setToast("Отправлено"); } catch(e){ alert(String(e.message||e)); }
      });
      $("#sendTestReportBtn").addEventListener("click", async ()=>{
        try{ await API.post("/api/reports/test", {}); setToast("Тест отправлен"); } catch(e){ alert(String(e.message||e)); }
      });

      $("#saveMonthSettingsBtn").addEventListener("click", async ()=>{
        try{
          if (!State.monthId) { alert("Месяц не создан."); return; }
          await API.put(`/api/months/${State.monthId}`, {
            monthly_min_needed: $("#setMonthlyMin").value ? Number($("#setMonthlyMin").value) : null,
            start_balance: $("#setStartBalance").value ? Number($("#setStartBalance").value) : null,
            sundays_override: $("#setSundaysOverride").value ? Number($("#setSundaysOverride").value) : null
          });
          // also timezone global if changed
          const tz = ($("#setTimezone").value||"").trim();
          if (tz) await API.put("/api/settings", { timezone: tz });
          await loadMonthsForYear(State.year);
          await refreshAll();
          setToast("Сохранено");
        } catch(e){ alert(String(e.message||e)); }
      });

      $("#closeMonthBtn").addEventListener("click", async ()=>{
        try{ await closeCurrentMonth(); } catch(e){ alert(String(e.message||e)); }
      });
      $("#reopenMonthBtn").addEventListener("click", async ()=>{
        try{ await reopenCurrentMonth(); } catch(e){ alert(String(e.message||e)); }
      });


      $("#saveTemplatesBtn").addEventListener("click", ()=>{
        try{
          const v = $("#templatesJson").value;
          const arr = JSON.parse(v);
          if (!Array.isArray(arr)) throw new Error("Ожидается массив объектов");
          State.templates = arr;
          saveTemplatesToStorage();
          rebuildTemplateSelect();
          setToast("Сохранено");
        } catch(e){
          alert("Ошибка в JSON шаблонов: " + String(e.message||e));
        }
      });

      $("#exportCsvBtn").addEventListener("click", ()=>{
        if (!State.monthId){ alert("Месяц не выбран/не создан."); return; }
        openDownload(`${API.baseUrl}/api/export/csv?month_id=${encodeURIComponent(State.monthId)}`);
      });
      $("#exportXlsxBtn").addEventListener("click", ()=>{
        openDownload(`${API.baseUrl}/api/export/excel?year=${encodeURIComponent(State.year)}`);
      });

      $("#backupDbBtn").addEventListener("click", async ()=>{
        await runBackup("db");
      });
      $("#backupFullBtn").addEventListener("click", async ()=>{
        await runBackup("full");
      });
      $("#backupRefreshBtn").addEventListener("click", async ()=>{
        if (State.role !== "admin") return;
        await loadBackups();
      });
      $("#backupDropdownToggle").addEventListener("click", ()=>{
        const dropdown = $("#backupDropdown");
        if (!dropdown) return;
        const isOpen = dropdown.classList.toggle("open");
        $("#backupDropdownToggle").setAttribute("aria-expanded", String(isOpen));
      });
      $("#backupRestoreInput").addEventListener("change", (e)=>{
        const file = e.target.files && e.target.files[0];
        State.backupRestoreFile = file || null;
        $("#backupRestoreBtn").disabled = !file;
        const label = $("#backupRestoreFileLabel");
        if (label) label.textContent = file ? file.name : "Файл не выбран";
      });
      $("#backupRestoreBtn").addEventListener("click", ()=>{
        if (!State.backupRestoreFile) return;
        openBackupRestoreModal();
      });
      $("#backupRestoreCloseBtn").addEventListener("click", closeBackupRestoreModal);
      $("#backupRestoreCancelBtn").addEventListener("click", closeBackupRestoreModal);
      $("#backupRestoreConfirmBtn").addEventListener("click", confirmBackupRestore);
    }

    /**********************
     * Boot
     **********************/
    async function boot(){
      applyTheme("auto");
      // load templates early
      loadTemplates();
      rebuildTemplateSelect();

      // init dates
      const t = todayYMD();
      State.year = t.y;
      State.month = t.m;
      setMonthTitle();
      State.periodType = "month";
      State.periodYear = State.year;
      State.periodMonth = State.month;
      State.periodQuarter = quarterFromMonth(State.month);
      State.otherIncomeDate = `${t.y}-${String(t.m).padStart(2,"0")}-${String(t.d).padStart(2,"0")}`;

      wireEvents();
      initDropdownFromSelect("donIncomeType", "donIncomeTypeDropdown");
      initDropdownFromSelect("expCategory", "expCategoryDropdown");
      initDropdownFromSelect("expTemplate", "expTemplateDropdown");
      initDropdownFromSelect("histMonthSelect", "histMonthDropdown");
      initDropdownFromSelect("histCategorySelect", "histCategoryDropdown");
      initDropdownFromSelect("periodYearSelect", "periodYearDropdown");
      initDropdownFromSelect("periodMonthSelect", "periodMonthDropdown");
      setDonationTypeUI();


      // Hide settings tab label for viewer (still present but gated)
      // We'll keep it visible but will block opening.

      try{
        await API.ensureAuth();
      }catch(e){
        alert("Авторизация не удалась: " + String(e.message||e));
        return;
      }

      State.role = API.user?.role || "viewer";
      const displayName = (API.user?.name || "").trim();
      $("#roleBadge").textContent = `роль: ${displayName || State.role}`;
      applyRoleUI();

      try {
        await loadThemeSetting();
      } catch (e) {
        applyTheme("auto");
      }

      await loadMonthsForYear(State.year);
      await ensureSelectedMonthExists();
      setMonthTitle();
      rebuildPeriodSelectors();

      // prefill expense date + totals
      setExpenseToday();
      recalcExpenseTotals();
      setExpenseTags([]);
      setHistoryTags([]);

      // build month selection lists for modal
      await refreshAll();

      // initial render settings UI (lazy)
      renderSettingsUI();

      const initialScreen = new URLSearchParams(window.location.search).get("screen");
      if (["dashboard","add","history","settings"].includes(initialScreen)){
        if (initialScreen === "add" && !(State.role === "admin" || State.role === "accountant")) {
          setToast("Нет доступа");
        } else {
          switchScreen(initialScreen);
          if (initialScreen === "add") setAddTab("don");
        }
      }
    }

    boot().catch(e=> alert(String(e.message||e)));
