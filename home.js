'use strict';

(() => {
  const CFG = window.AI_LMS_CONFIG || {};
  const byId = id => document.getElementById(id);
  let loading = false;

  function credentialAccount(token) {
    const part = String(token || '').split('.')[1];
    if (!part) throw new Error('無法取得 Google 帳號資訊');
    const base64 = part.replace(/-/g, '+').replace(/_/g, '/');
    const bytes = atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, '='));
    return JSON.parse(decodeURIComponent(Array.from(bytes, c => '%' + c.charCodeAt(0).toString(16).padStart(2, '0')).join('')));
  }

  function renderStats(email, store) {
    const records = store && store.records && typeof store.records === 'object' ? store.records : {};
    const done = Object.values(records).filter(record => record && record.status === 'completed').length;
    const seconds = Object.values(records).reduce((sum, record) => {
      if (!record) return sum;
      return sum + (Number(record.actual_seconds) || Number(record.actual_minutes) * 60 || 0);
    }, 0);
    const works = Array.isArray(store?.portfolio) ? store.portfolio.length : 0;
    const next = Array.from({length: 20}, (_, i) => i + 1).find(day => records[day]?.status !== 'completed');

    byId('homeCompleted').textContent = done + ' / 20';
    byId('homeMinutes').textContent = Math.floor(seconds / 60) + ' 分';
    byId('homePortfolio').textContent = works + ' 件';
    byId('homeNextDay').textContent = next ? '接續 DAY ' + String(next).padStart(2, '0') : '20 天計畫已完成';

    const pending = (CFG.STORAGE_PREFIX || 'ai-learning-sync-v1:') + email + ':pending';
    byId('homeStatus').textContent = localStorage.getItem(pending)
      ? '此裝置有尚未同步的資料，請進入課程確認並完成同步。'
      : '已讀取你的學習紀錄。';
  }

  async function openAccount(account) {
    if (loading) return;
    loading = true;
    const message = byId('loginMessage');
    try {
      const email = String(account?.email || '').trim().toLowerCase();
      if (!email.includes('@')) throw new Error('Google 帳號未提供 Email');
      const name = String(account.name || email);
      message.textContent = '正在讀取學習紀錄…';
      const result = await window.AI_BRIDGE.login(email, name);
      sessionStorage.setItem('ai-learning-current-email', email);
      sessionStorage.setItem('ai-learning-current-name', name);
      byId('homeAccount').textContent = name === email ? email : name + ' · ' + email;
      renderStats(email, result.store);
      byId('loginScreen').classList.add('hidden');
      byId('homeApp').classList.remove('hidden');
    } catch (error) {
      sessionStorage.removeItem('ai-learning-current-email');
      sessionStorage.removeItem('ai-learning-current-name');
      byId('homeApp').classList.add('hidden');
      byId('loginScreen').classList.remove('hidden');
      message.textContent = '無法登入／讀取：' + error.message;
    } finally {
      loading = false;
    }
  }

  function prepareGoogleButton() {
    const message = byId('loginMessage');
    if (!window.AI_BRIDGE?.configured() || !String(CFG.GOOGLE_CLIENT_ID || '').endsWith('.apps.googleusercontent.com')) {
      message.textContent = '請先完成 config.js 的 Google 用戶端 ID 與 Apps Script 網址設定。';
      return;
    }
    let attempts = 0;
    const setup = () => {
      if (!window.google?.accounts?.id) {
        if (++attempts < 40) setTimeout(setup, 500);
        else message.textContent = '無法載入 Google 登入，請檢查網路後重新整理。';
        return;
      }
      google.accounts.id.initialize({
        client_id: CFG.GOOGLE_CLIENT_ID,
        callback: response => {
          try { openAccount(credentialAccount(response.credential)); }
          catch (error) { message.textContent = '無法取得帳號：' + error.message; }
        },
        auto_select: false
      });
      google.accounts.id.renderButton(byId('googleButton'), {
        theme: 'outline', size: 'large', shape: 'pill', text: 'signin_with',
        width: Math.min(300, Math.max(190, window.innerWidth - 110))
      });
      if (!sessionStorage.getItem('ai-learning-current-email')) message.textContent = '請使用個人 Google 帳號登入。';
    };
    setup();
    const email = sessionStorage.getItem('ai-learning-current-email');
    if (email) openAccount({email, name: sessionStorage.getItem('ai-learning-current-name') || email});
  }

  byId('homeLogout').addEventListener('click', async () => {
    const email = sessionStorage.getItem('ai-learning-current-email');
    if (email) {
      try { await window.AI_BRIDGE.logout(email); }
      catch (error) { console.warn('登出紀錄未寫入', error); }
    }
    sessionStorage.removeItem('ai-learning-current-email');
    sessionStorage.removeItem('ai-learning-current-name');
    window.google?.accounts?.id?.disableAutoSelect();
    byId('homeApp').classList.add('hidden');
    byId('loginScreen').classList.remove('hidden');
    byId('loginMessage').textContent = '已登出，請重新使用 Google 帳號登入。';
  });

  prepareGoogleButton();
})();
