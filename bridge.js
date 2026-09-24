'use strict';

// GitHub Pages 與 Apps Script 之間的傳送層。
window.AI_BRIDGE = (() => {
  const config = window.AI_LMS_CONFIG || {};
  let serial = 0;
  const endpoint = () => String(config.APPS_SCRIPT_URL || '').trim();

  function configured() {
    return /^https:\/\/script\.google\.com\/macros\/s\/[^/]+\/exec$/.test(endpoint());
  }

  function login(email, name) {
    return new Promise((resolve, reject) => {
      if (!configured()) { reject(new Error('請先在 config.js 填入 Apps Script 部署網址')); return; }
      const callback = `__AI_LMS_CB_${++serial}`;
      const script = document.createElement('script');
      const timer = setTimeout(() => finish(new Error('讀取逾時，請檢查 Apps Script 部署權限與網址')), 20000);
      let done = false;
      function finish(error, result) {
        if (done) return;
        done = true;
        clearTimeout(timer);
        script.remove();
        delete window[callback];
        if (error) reject(error);
        else if (!result?.ok) reject(new Error(result?.error || '登入讀取失敗'));
        else resolve({store: result.store, catalog: result.catalog || {courses: [], materials: {}}});
      }
      window[callback] = result => finish(null, result);
      script.onerror = () => finish(new Error('無法連線 Apps Script；請檢查部署網址及公開存取設定'));
      const url = new URL(endpoint());
      url.searchParams.set('action', 'login');
      url.searchParams.set('email', email);
      url.searchParams.set('name', name || '');
      url.searchParams.set('callback', callback);
      url.searchParams.set('_', String(Date.now()));
      script.src = url.href;
      document.head.appendChild(script);
    });
  }

  function post(action, email, payload) {
    return new Promise((resolve, reject) => {
      if (!configured()) { reject(new Error('尚未設定 Apps Script 部署網址')); return; }
      const requestId = `save-${Date.now()}-${++serial}`;
      const iframe = document.createElement('iframe');
      iframe.hidden = true;
      iframe.name = requestId;
      const form = document.createElement('form');
      form.hidden = true;
      form.action = endpoint();
      form.method = 'POST';
      form.target = requestId;
      const values = {action, email, requestId, payload: payload ? JSON.stringify(payload) : ''};
      Object.keys(values).forEach(key => {
        const field = document.createElement('input');
        field.type = 'hidden';
        field.name = key;
        field.value = values[key];
        form.appendChild(field);
      });
      let done = false;
      const timeout = setTimeout(() => finish(new Error('儲存逾時；請確認 Apps Script 的存取權設定')), 30000);
      function finish(error, result) {
        if (done) return;
        done = true;
        clearTimeout(timeout);
        window.removeEventListener('message', onMessage);
        iframe.remove();
        form.remove();
        if (error) reject(error);
        else if (!result.ok) reject(new Error(result.error || '儲存失敗'));
        else resolve(result.data || {});
      }
      function onMessage(event) {
        const result = event.data;
        if (!result || result.source !== 'ai-lms-apps-script' || result.requestId !== requestId) return;
        finish(null, result);
      }
      window.addEventListener('message', onMessage);
      document.body.append(iframe, form);
      form.submit();
    });
  }

  return {configured, login, save: (email, store) => post('save', email, store), logout: email => post('logout', email)};
})();
