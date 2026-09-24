'use strict';

// app.js 之後載入：沿用原本的 20 天介面，把本機保存加上跨裝置同步。
(() => {
  const originalSave = saveStore;
  let queued = null;
  let sending = null;
  let scheduled = null;
  let lastSent = '';
  let lastStart = 0;

  const storageKey = email => (CFG.STORAGE_PREFIX || 'ai-learning-sync-v1:') + email.toLowerCase();
  const pendingKey = email => storageKey(email) + ':pending';
  const status = message => {
    const el = document.getElementById('syncStatus');
    if (el) el.textContent = message;
  };

  userKey = function () { return storageKey(profile?.email || ''); };

  saveStore = function () {
    if (!profile?.email || !data?.store) return;
    originalSave();
    queued = JSON.stringify(data.store);
    localStorage.setItem(pendingKey(profile.email), queued);
    status('等待同步');
    planSync();
  };

  function planSync(immediate = false) {
    if (scheduled) clearTimeout(scheduled);
    const delay = immediate ? 0 : Math.max(1200, 12000 - (Date.now() - lastStart));
    scheduled = setTimeout(() => { scheduled = null; flush(); }, delay);
  }

  async function flush(force = false) {
    if (!profile?.email) return;
    if (sending) return sending;
    if (!queued) return;
    if (force && scheduled) { clearTimeout(scheduled); scheduled = null; }
    const snapshot = queued;
    if (snapshot === lastSent) {
      queued = null;
      localStorage.removeItem(pendingKey(profile.email));
      status('已同步');
      return;
    }
    const email = profile.email;
    lastStart = Date.now();
    status('同步中…');
    sending = AI_BRIDGE.save(email, JSON.parse(snapshot));
    try {
      await sending;
      lastSent = snapshot;
      if (queued === snapshot) {
        queued = null;
        localStorage.removeItem(pendingKey(email));
        status('已同步');
      } else {
        planSync(true);
      }
    } catch (error) {
      status('同步失敗，點此重試');
      console.error('學習紀錄同步失敗', error);
    } finally {
      sending = null;
    }
  }

  function decodeGoogleCredential(token) {
    const part = String(token || '').split('.')[1];
    if (!part) throw new Error('無法取得 Google 帳號資訊');
    const base64 = part.replace(/-/g, '+').replace(/_/g, '/');
    const bytes = atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, '='));
    return JSON.parse(decodeURIComponent(Array.from(bytes, c => '%' + c.charCodeAt(0).toString(16).padStart(2, '0')).join('')));
  }

  async function signIn(response) {
    const msg = document.getElementById('loginMessage');
    try {
      const account = decodeGoogleCredential(response.credential);
      const email = String(account.email || '').trim().toLowerCase();
      if (!email.includes('@')) throw new Error('Google 帳號未提供 Email');
      msg.textContent = '正在讀取學習紀錄…';
      const loaded = await AI_BRIDGE.login(email, account.name || '');
      const remote = loaded.store;
      (loaded.catalog.courses || []).forEach(course => {
        const plan = PLAN.find(item => item.day_no === Number(course.day_no));
        if (!plan) return;
        Object.assign(plan, course);
        plan.summary = `以實際工作情境練習「${plan.title}」，把學習轉成可重複使用的成果。`;
        plan.checklist[3] = `完成今日成果：${plan.deliverable}`;
        plan.output_task = `完成並記錄：${plan.deliverable}`;
      });
      const materialKey = 'ai-learning-frontend-materials-v1';
      let savedMaterials = {};
      try { savedMaterials = JSON.parse(localStorage.getItem(materialKey) || '{}'); } catch (_) {}
      const official = loaded.catalog.materials || {};
      for (let day = 1; day <= 20; day++) {
        const personal = (Array.isArray(savedMaterials[day]) ? savedMaterials[day] : [])
          .filter(item => item.source !== 'official');
        savedMaterials[day] = [...personal, ...(official[day] || [])];
      }
      localStorage.setItem(materialKey, JSON.stringify(savedMaterials));
      profile = {email, name: account.name || email, picture: account.picture || ''};
      sessionStorage.setItem('ai-learning-current-email', email);
      sessionStorage.setItem('ai-learning-current-name', profile.name);

      let store = remote;
      const pending = localStorage.getItem(pendingKey(email));
      if (pending && window.confirm('此裝置上次有尚未同步完成的學習紀錄，是否先用該紀錄繼續？')) {
        try { store = JSON.parse(pending); } catch (_) {}
      } else if (pending) {
        localStorage.removeItem(pendingKey(email));
      }
      if (!store) {
        // 舊純前端版的資料沒有帳號識別，僅在首次登入且使用者同意時匯入。
        const legacy = localStorage.getItem('ai-learning-frontend-v1:local');
        if (legacy && window.confirm('發現此瀏覽器舊版學習紀錄，是否匯入到目前的 Google 帳號？')) {
          try { store = JSON.parse(legacy); } catch (_) {}
        }
      }
      data = {store: store && typeof store === 'object' ? store : blankStore()};
      localStorage.setItem(userKey(), JSON.stringify(data.store));
      lastSent = remote ? JSON.stringify(remote) : '';
      document.getElementById('userEmail').textContent = email;
      document.getElementById('loginScreen').classList.add('hidden');
      document.getElementById('appShell').classList.remove('hidden');
      renderAll();
      status('已讀取雲端紀錄');
      if (!remote || JSON.stringify(data.store) !== lastSent) saveStore();
    } catch (error) {
      profile = null;
      data = null;
      msg.textContent = '無法登入／讀取：' + error.message;
    }
  }

  // 覆寫 app.js 在 DOMContentLoaded 時會呼叫的初始化函式。
  initLocalApp = function () {
    document.getElementById('appShell').classList.add('hidden');
    document.getElementById('loginScreen').classList.remove('hidden');
    const msg = document.getElementById('loginMessage');
    if (!AI_BRIDGE.configured() || !CFG.GOOGLE_CLIENT_ID || CFG.GOOGLE_CLIENT_ID.includes('PASTE_')) {
      msg.textContent = '請先完成 config.js 的兩項設定，再重新整理網頁。';
      return;
    }
    let attempts = 0;
    const setup = () => {
      if (!window.google?.accounts?.id) {
        if (++attempts < 40) setTimeout(setup, 500);
        else msg.textContent = '無法載入 Google 登入，請檢查網路後重新整理。';
        return;
      }
      google.accounts.id.initialize({client_id: CFG.GOOGLE_CLIENT_ID, callback: signIn, auto_select: false});
      google.accounts.id.renderButton(document.getElementById('googleButton'), {
        theme: 'outline', size: 'large', shape: 'pill', text: 'signin_with', width: 300
      });
      msg.textContent = '請使用個人 Google 帳號登入。';
    };
    setup();
  };

  document.getElementById('syncStatus').addEventListener('click', () => { if (queued) flush(true); });
  document.getElementById('logoutBtn').addEventListener('click', async () => {
    const email = profile?.email;
    if (!email) return;
    if (timer.running) document.getElementById('timerToggle').click();
    if (scheduled) { clearTimeout(scheduled); scheduled = null; }
    await flush(true);
    try { await AI_BRIDGE.logout(email); } catch (error) { console.warn('登出紀錄未寫入', error); }
    google?.accounts?.id?.disableAutoSelect();
    profile = null;
    data = null;
    queued = null;
    lastSent = '';
    sessionStorage.removeItem('ai-learning-current-email');
    sessionStorage.removeItem('ai-learning-current-name');
    document.getElementById('appShell').classList.add('hidden');
    document.getElementById('loginScreen').classList.remove('hidden');
    document.getElementById('loginMessage').textContent = '已登出，請重新使用 Google 帳號登入。';
  });

  window.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden' && queued) flush(true);
  });
  window.addEventListener('pageshow', () => {
    if (profile?.email && localStorage.getItem(pendingKey(profile.email))) {
      queued = localStorage.getItem(pendingKey(profile.email));
      planSync(true);
    }
  });
})();
