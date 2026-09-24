'use strict';

/**
 * Learning-AI 正式教材資料檔
 *
 * 使用方式：
 * - 正式教材影片、文件或延伸資源，統一新增在對應 DAY 的陣列中。
 * - 這份檔案存在 GitHub，因此換電腦、清除瀏覽器資料或重新部署網站都不會遺失。
 * - ui-enhancements.js 目前仍以 localStorage 作為執行時資料來源；本檔載入時會把正式教材同步進去。
 * - 使用者先前在瀏覽器中自行新增的教材仍會保留，不會被這份正式教材覆蓋或刪除。
 */

window.AI_COURSE_MATERIALS = {
  version: 1,
  days: {
    1: [],
    2: [],
    3: [],
    4: [],
    5: [],
    6: [],
    7: [],
    8: [],
    9: [],
    10: [],
    11: [],
    12: [],
    13: [],
    14: [],
    15: [],
    16: [],
    17: [],
    18: [],
    19: [],
    20: []
  }
};

(function syncOfficialCourseMaterials() {
  const STORAGE_KEY = 'ai-learning-frontend-materials-v1';
  const catalog = window.AI_COURSE_MATERIALS?.days || {};

  let localStore = {};
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    if (parsed && typeof parsed === 'object') localStore = parsed;
  } catch (_) {
    localStore = {};
  }

  Object.entries(catalog).forEach(([day, officialItems]) => {
    const existing = Array.isArray(localStore[day]) ? localStore[day] : [];
    const official = Array.isArray(officialItems) ? officialItems : [];

    const byId = new Map();

    // 先保留瀏覽器既有資料。
    existing.forEach(item => {
      if (!item || typeof item !== 'object') return;
      const key = String(item.id || `${item.title || ''}|${item.url || ''}`);
      byId.set(key, item);
    });

    // GitHub 正式教材擁有較高優先權，同 ID 會以本檔內容為準。
    official.forEach((item, index) => {
      if (!item || typeof item !== 'object') return;
      const normalized = {
        id: item.id || `official-day-${day}-${index + 1}`,
        category: item.category || 'MATERIAL',
        title: item.title || `DAY ${String(day).padStart(2, '0')} 教材`,
        description: item.description || '',
        url: item.url || '',
        removable: false,
        source: 'official',
        ...item
      };
      normalized.removable = false;
      normalized.source = 'official';
      byId.set(String(normalized.id), normalized);
    });

    localStore[day] = Array.from(byId.values());
  });

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(localStore));
  } catch (error) {
    console.warn('無法同步正式教材到瀏覽器快取：', error);
  }
})();
