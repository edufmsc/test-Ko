'use strict';

(() => {
  const email = sessionStorage.getItem('ai-learning-current-email');
  if (!email) {
    location.replace('index.html');
    return;
  }
  const pendingKey = (window.AI_LMS_CONFIG.STORAGE_PREFIX || 'ai-learning-sync-v1:') + email + ':pending';
  let inFlight = false;
  let queued = null;

  async function send() {
    if (inFlight || !queued) return;
    const snapshot = queued;
    inFlight = true;
    const status = document.getElementById('supplementMessage');
    if (status) status.textContent = '正在同步補登資料…';
    try {
      await AI_BRIDGE.save(email, JSON.parse(snapshot));
      if (queued === snapshot) {
        queued = null;
        localStorage.removeItem(pendingKey);
        if (status) status.textContent = '補登內容已同步至試算表。';
      } else {
        setTimeout(send, 0);
      }
    } catch (error) {
      if (status) status.textContent = '同步失敗：' + error.message + '。資料已留在此瀏覽器，請再按一次儲存。';
    } finally {
      inFlight = false;
      if (queued && queued !== snapshot) setTimeout(send, 0);
    }
  }

  window.AI_SYNC_SAVE = (currentEmail, store) => {
    if (currentEmail !== email) return;
    queued = JSON.stringify(store);
    localStorage.setItem(pendingKey, queued);
    send();
  };
})();
