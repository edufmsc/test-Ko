'use strict';

(function () {
  const MATERIAL_STORAGE_KEY = 'ai-learning-frontend-materials-v1';

  const style = document.createElement('style');
  style.textContent = `
    .back-to-top {
      position: fixed;
      right: 24px;
      bottom: 24px;
      z-index: 80;
      width: 58px;
      height: 58px;
      border: 0;
      border-radius: 999px;
      display: grid;
      place-items: center;
      background: #2e668c;
      color: #fff;
      font-weight: 900;
      font-size: .78rem;
      box-shadow: 0 12px 30px rgba(31,85,119,.28);
      opacity: 0;
      visibility: hidden;
      transform: translateY(10px);
      transition: opacity .2s ease, transform .2s ease, visibility .2s ease, background .2s ease;
      cursor: pointer;
    }
    .back-to-top.visible { opacity: 1; visibility: visible; transform: translateY(0); }
    .back-to-top:hover { background: #1f5577; }

    .course-materials { padding-top: 10px; }
    .materials-heading {
      display: flex;
      align-items: flex-end;
      justify-content: space-between;
      gap: 20px;
      margin-bottom: 20px;
    }
    .materials-heading-copy { min-width: 0; }
    .materials-heading h2 { margin: 4px 0 6px; font-size: clamp(1.7rem,3vw,2.45rem); }
    .materials-add {
      flex: 0 0 auto;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 11px 16px;
      border: 0;
      border-radius: 12px;
      background: #2e668c;
      color: #fff;
      font-weight: 900;
      box-shadow: 0 8px 20px rgba(46,102,140,.16);
    }
    .materials-add .plus { font-size: 1.35rem; line-height: 1; }

    .materials-carousel { position: relative; }
    .materials-viewport { overflow: hidden; }
    .materials-track {
      display: flex;
      gap: 18px;
      transition: transform .32s ease;
      will-change: transform;
    }
    .material-card {
      flex: 0 0 calc((100% - 36px) / 3);
      min-width: 0;
      overflow: hidden;
      border: 1px solid #d6e5f0;
      border-radius: 18px;
      background: #fff;
      box-shadow: 0 10px 28px rgba(41,85,119,.07);
    }
    .material-media {
      position: relative;
      aspect-ratio: 16/9;
      display: grid;
      place-items: center;
      background: linear-gradient(145deg,#eaf4fb,#dcecf8);
      border-bottom: 1px solid #d6e5f0;
      overflow: hidden;
    }
    .material-media.placeholder::before {
      content: '';
      position: absolute;
      inset: 16px;
      border: 1px dashed rgba(46,102,140,.28);
      border-radius: 13px;
    }
    .material-media iframe,
    .material-media video {
      width: 100%;
      height: 100%;
      border: 0;
      display: block;
      object-fit: cover;
      background: #0f1720;
    }
    .material-link-cover {
      width: 100%;
      height: 100%;
      display: grid;
      place-items: center;
      padding: 24px;
      text-decoration: none;
      color: #2e668c;
      font-weight: 900;
      text-align: center;
      background: linear-gradient(145deg,#eef7fd,#dcecf8);
    }
    .material-play {
      position: relative;
      z-index: 1;
      width: 58px;
      height: 58px;
      border-radius: 50%;
      display: grid;
      place-items: center;
      background: #fff;
      color: #2e668c;
      font-size: 1.3rem;
      box-shadow: 0 8px 22px rgba(41,85,119,.14);
    }
    .material-placeholder {
      position: absolute;
      bottom: 20px;
      z-index: 1;
      color: #6d8293;
      font-size: .76rem;
      font-weight: 800;
      letter-spacing: .04em;
    }
    .material-body { position: relative; padding: 18px 19px 20px; }
    .material-no { color: #2e668c; font-size: .72rem; font-weight: 900; letter-spacing: .12em; }
    .material-body h3 { margin: 5px 0 7px; font-size: 1.08rem; }
    .material-body p { margin: 0; color: #6d8293; font-size: .88rem; min-height: 2.9em; }
    .material-ready {
      display: inline-flex;
      margin-top: 14px;
      padding: 5px 9px;
      border-radius: 999px;
      background: #edf6fd;
      color: #2e668c;
      font-size: .72rem;
      font-weight: 900;
    }
    .material-ready.live { background: #e6f5ed; color: #147657; }
    .material-remove {
      position: absolute;
      right: 14px;
      bottom: 14px;
      border: 0;
      background: transparent;
      color: #8798a5;
      font-size: .74rem;
      font-weight: 800;
      padding: 4px 6px;
    }
    .material-remove:hover { color: #b34444; }

    .carousel-arrow {
      position: absolute;
      top: 34%;
      z-index: 4;
      width: 44px;
      height: 58px;
      border: 1px solid rgba(46,102,140,.18);
      border-radius: 12px;
      display: grid;
      place-items: center;
      background: rgba(255,255,255,.94);
      color: #2e668c;
      font-size: 1.4rem;
      font-weight: 900;
      box-shadow: 0 8px 22px rgba(41,85,119,.12);
    }
    .carousel-arrow.prev { left: -18px; }
    .carousel-arrow.next { right: -18px; }
    .carousel-arrow:disabled { opacity: .28; cursor: default; }

    .materials-dots {
      min-height: 28px;
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 7px;
      margin-top: 14px;
    }
    .materials-dot {
      width: 7px;
      height: 7px;
      padding: 0;
      border: 0;
      border-radius: 999px;
      background: #b8c9d6;
      transition: width .18s ease, background .18s ease;
    }
    .materials-dot.active { width: 24px; background: #2e668c; }

    .material-modal-backdrop {
      position: fixed;
      inset: 0;
      z-index: 120;
      display: none;
      align-items: center;
      justify-content: center;
      padding: 24px;
      background: rgba(16,39,55,.48);
      backdrop-filter: blur(4px);
    }
    .material-modal-backdrop.open { display: flex; }
    .material-modal {
      width: min(560px,100%);
      max-height: min(760px,calc(100vh - 48px));
      overflow: auto;
      background: #fff;
      border: 1px solid #d6e5f0;
      border-radius: 22px;
      box-shadow: 0 24px 70px rgba(16,39,55,.25);
      padding: 24px;
    }
    .material-modal-head { display: flex; justify-content: space-between; gap: 18px; align-items: flex-start; }
    .material-modal-head h3 { margin: 3px 0 0; font-size: 1.5rem; }
    .material-modal-close {
      width: 38px;
      height: 38px;
      border: 0;
      border-radius: 50%;
      background: #eef4f8;
      color: #4e6779;
      font-size: 1.2rem;
    }
    .material-form { display: grid; gap: 13px; margin-top: 20px; }
    .material-form label { display: grid; gap: 6px; color: #526c7e; font-size: .84rem; font-weight: 800; }
    .material-form input,
    .material-form textarea,
    .material-form select {
      width: 100%;
      padding: 11px 12px;
      border: 1px solid #d6e5f0;
      border-radius: 10px;
      background: #fff;
      color: #173247;
      font: inherit;
    }
    .material-form textarea { resize: vertical; min-height: 90px; }
    .material-form-actions { display: flex; justify-content: flex-end; gap: 9px; margin-top: 8px; }
    .material-form-actions button { border: 0; border-radius: 10px; padding: 10px 15px; font-weight: 900; }
    .material-form-cancel { background: #eef3f6; color: #526c7e; }
    .material-form-save { background: #2e668c; color: #fff; }
    .material-form-note { margin: 0; color: #7b8d9b; font-size: .78rem; }

    @media (max-width: 900px) {
      .material-card { flex-basis: calc((100% - 18px) / 2); }
      .carousel-arrow.prev { left: -8px; }
      .carousel-arrow.next { right: -8px; }
    }
    @media (max-width: 620px) {
      .materials-heading { align-items: flex-start; flex-direction: column; }
      .materials-add { width: 100%; justify-content: center; }
      .material-card { flex-basis: 100%; }
      .carousel-arrow { width: 40px; height: 52px; }
      .carousel-arrow.prev { left: 6px; }
      .carousel-arrow.next { right: 6px; }
      .back-to-top { right: 14px; bottom: 14px; width: 52px; height: 52px; }
      .material-modal-backdrop { padding: 12px; }
      .material-modal { padding: 20px; }
    }
  `;
  document.head.appendChild(style);

  function addBackToTop() {
    if (document.querySelector('.back-to-top')) return;
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'back-to-top';
    button.setAttribute('aria-label', '回到頁面頂端');
    button.innerHTML = '↑<br>TOP';
    button.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
    document.body.appendChild(button);

    const toggle = () => button.classList.toggle('visible', window.scrollY > 360);
    window.addEventListener('scroll', toggle, { passive: true });
    toggle();
  }

  function readMaterials() {
    try {
      const raw = JSON.parse(localStorage.getItem(MATERIAL_STORAGE_KEY) || '{}');
      return raw && typeof raw === 'object' ? raw : {};
    } catch (e) {
      return {};
    }
  }

  function writeMaterials(store) {
    localStorage.setItem(MATERIAL_STORAGE_KEY, JSON.stringify(store));
  }

  function dayNumber() {
    const text = document.getElementById('dayBadge')?.textContent || '';
    const match = text.match(/DAY\s*(\d+)/i);
    return match ? Number(match[1]) : 1;
  }

  function dayKey() {
    return String(dayNumber());
  }

  function defaultMaterials(title) {
    return [
      { id: 'default-concept', category: 'CONCEPT', title: `${title}｜核心概念`, description: '先建立今日主題的基本觀念與操作框架。', url: '', removable: false },
      { id: 'default-demo', category: 'DEMO', title: `${title}｜操作示範`, description: '透過實際操作影片，對照今天的學習步驟。', url: '', removable: false },
      { id: 'default-practice', category: 'PRACTICE', title: `${title}｜實作延伸`, description: '完成今日任務後，可再使用延伸教材加強應用。', url: '', removable: false }
    ];
  }

  function savedMaterialsForDay() {
    const store = readMaterials();
    return Array.isArray(store[dayKey()]) ? store[dayKey()] : [];
  }

  function saveMaterialForDay(material) {
    const store = readMaterials();
    const key = dayKey();
    const list = Array.isArray(store[key]) ? store[key] : [];
    list.push(material);
    store[key] = list;
    writeMaterials(store);
  }

  function removeMaterialForDay(id) {
    const store = readMaterials();
    const key = dayKey();
    const list = Array.isArray(store[key]) ? store[key] : [];
    store[key] = list.filter(item => item.id !== id);
    writeMaterials(store);
  }

  function mediaMarkup(item) {
    let url = '';
    try { const parsed = new URL(item.url); if (['http:', 'https:'].includes(parsed.protocol)) url = parsed.href; } catch (_) {}
    if (!url) return '<div class="material-media placeholder"><div class="material-play">▶</div><span class="material-placeholder">教材預留</span></div>';
    return `<div class="material-media"><a class="material-link-cover" href="${escapeAttr(url)}" target="_blank" rel="noopener noreferrer">開啟教材 ↗</a></div>`;
  }

  function escapeHtml(value) {
    const div = document.createElement('div');
    div.textContent = value ?? '';
    return div.innerHTML;
  }

  function escapeAttr(value) {
    return escapeHtml(value).replace(/`/g, '&#96;');
  }

  function addCourseMaterials() {
    const lessonGrid = document.querySelector('.lesson-grid');
    if (!lessonGrid || document.getElementById('courseMaterials')) return;

    const section = document.createElement('section');
    section.id = 'courseMaterials';
    section.className = 'section course-materials';
    section.innerHTML = `
      <div class="materials-heading">
        <div class="materials-heading-copy">
          <p class="eyebrow">COURSE MATERIALS</p>
          <h2>今日課程教材</h2>
          <p id="materialsIntro" class="muted">配合今日主題安排的影片與延伸教材。</p>
        </div>
        <button id="addMaterialBtn" class="materials-add" type="button"><span class="plus">＋</span>新增教材</button>
      </div>
      <div class="materials-carousel">
        <button id="materialsPrev" class="carousel-arrow prev" type="button" aria-label="上一組教材">‹</button>
        <div class="materials-viewport">
          <div id="materialsTrack" class="materials-track"></div>
        </div>
        <button id="materialsNext" class="carousel-arrow next" type="button" aria-label="下一組教材">›</button>
      </div>
      <div id="materialsDots" class="materials-dots" aria-label="教材輪播頁面"></div>
    `;
    lessonGrid.insertAdjacentElement('afterend', section);

    const modal = document.createElement('div');
    modal.className = 'material-modal-backdrop';
    modal.id = 'materialModal';
    modal.innerHTML = `
      <div class="material-modal" role="dialog" aria-modal="true" aria-labelledby="materialModalTitle">
        <div class="material-modal-head">
          <div>
            <p class="eyebrow">ADD COURSE MATERIAL</p>
            <h3 id="materialModalTitle">新增教材</h3>
          </div>
          <button id="materialModalClose" class="material-modal-close" type="button" aria-label="關閉">×</button>
        </div>
        <form id="materialForm" class="material-form">
          <label>教材名稱
            <input id="materialName" type="text" maxlength="100" placeholder="例如：Prompt 實際操作示範" required>
          </label>
          <label>教材分類
            <select id="materialCategory">
              <option value="CONCEPT">核心概念</option>
              <option value="DEMO">操作示範</option>
              <option value="PRACTICE">實作延伸</option>
              <option value="EXTRA">補充教材</option>
            </select>
          </label>
          <label>教材網址
            <input id="materialUrl" type="url" placeholder="請輸入教材完整網址" required>
          </label>
          <label>教材說明
            <textarea id="materialDescription" maxlength="300" placeholder="簡單說明教材內容"></textarea>
          </label>
          <p class="material-form-note">新增教材只保存在目前瀏覽器；點選教材連結後才會開啟外部網頁。</p>
          <div class="material-form-actions">
            <button id="materialFormCancel" class="material-form-cancel" type="button">取消</button>
            <button class="material-form-save" type="submit">新增教材</button>
          </div>
        </form>
      </div>`;
    document.body.appendChild(modal);

    let page = 0;

    function perPage() {
      if (window.matchMedia('(max-width: 620px)').matches) return 1;
      if (window.matchMedia('(max-width: 900px)').matches) return 2;
      return 3;
    }

    function activeTitle() {
      const title = document.getElementById('todayTitle')?.textContent?.trim();
      return title && title !== '載入中…' ? title : '今日課程';
    }

    function allMaterials() {
      return [...defaultMaterials(activeTitle()), ...savedMaterialsForDay()];
    }

    function render() {
      const items = allMaterials();
      const track = document.getElementById('materialsTrack');
      const dots = document.getElementById('materialsDots');
      const count = perPage();
      const pageCount = Math.max(1, Math.ceil(items.length / count));
      page = Math.max(0, Math.min(page, pageCount - 1));

      track.innerHTML = items.map((item, index) => `
        <article class="material-card">
          ${mediaMarkup(item)}
          <div class="material-body">
            <span class="material-no">${String(index + 1).padStart(2,'0')} · ${escapeHtml(item.category || 'MATERIAL')}</span>
            <h3>${escapeHtml(item.title)}</h3>
            <p>${escapeHtml(item.description || '課程補充教材。')}</p>
            <span class="material-ready ${item.url ? 'live' : ''}">${item.url ? '開啟連結查看' : '待新增教材'}</span>
            ${item.removable !== false ? `<button class="material-remove" type="button" data-remove-material="${escapeAttr(item.id)}">移除</button>` : ''}
          </div>
        </article>`).join('');

      const gap = 18;
      const viewportWidth = document.querySelector('.materials-viewport')?.clientWidth || 1;
      const cardWidth = (viewportWidth - gap * (count - 1)) / count;
      track.style.transform = `translateX(-${page * count * (cardWidth + gap)}px)`;

      dots.innerHTML = Array.from({ length: pageCount }, (_, i) => `<button type="button" class="materials-dot ${i === page ? 'active' : ''}" data-material-page="${i}" aria-label="第 ${i + 1} 頁教材"></button>`).join('');
      document.getElementById('materialsPrev').disabled = page === 0;
      document.getElementById('materialsNext').disabled = page >= pageCount - 1;

      track.querySelectorAll('[data-remove-material]').forEach(button => {
        button.addEventListener('click', () => {
          if (!confirm('確定要移除這個教材嗎？')) return;
          removeMaterialForDay(button.dataset.removeMaterial);
          render();
        });
      });

      dots.querySelectorAll('[data-material-page]').forEach(button => {
        button.addEventListener('click', () => {
          page = Number(button.dataset.materialPage) || 0;
          render();
        });
      });
    }

    function updateIntro() {
      const title = activeTitle();
      const day = document.getElementById('dayBadge')?.textContent?.trim() || '今日';
      document.getElementById('materialsIntro').textContent = `${day}｜${title}：可使用左右鍵或下方圓點切換教材。`;
      page = 0;
      render();
    }

    function openModal() {
      document.getElementById('materialName').value = '';
      document.getElementById('materialUrl').value = '';
      document.getElementById('materialDescription').value = '';
      document.getElementById('materialCategory').value = 'DEMO';
      modal.classList.add('open');
      setTimeout(() => document.getElementById('materialName').focus(), 0);
    }

    function closeModal() {
      modal.classList.remove('open');
    }

    document.getElementById('addMaterialBtn').addEventListener('click', openModal);
    document.getElementById('materialModalClose').addEventListener('click', closeModal);
    document.getElementById('materialFormCancel').addEventListener('click', closeModal);
    modal.addEventListener('click', event => { if (event.target === modal) closeModal(); });

    document.getElementById('materialForm').addEventListener('submit', event => {
      event.preventDefault();
      const name = document.getElementById('materialName').value.trim();
      const url = document.getElementById('materialUrl').value.trim();
      const description = document.getElementById('materialDescription').value.trim();
      const category = document.getElementById('materialCategory').value;
      if (!name || !url) return;
      try { if (!['http:', 'https:'].includes(new URL(url).protocol)) throw new Error(); } catch (e) { alert('請輸入有效的教材網址。'); return; }

      saveMaterialForDay({
        id: (crypto.randomUUID && crypto.randomUUID()) || `material-${Date.now()}`,
        category,
        title: name,
        description: description || '課程補充教材。',
        url,
        removable: true,
        createdAt: new Date().toISOString()
      });
      closeModal();
      const items = allMaterials();
      page = Math.max(0, Math.ceil(items.length / perPage()) - 1);
      render();
    });

    document.getElementById('materialsPrev').addEventListener('click', () => { if (page > 0) { page--; render(); } });
    document.getElementById('materialsNext').addEventListener('click', () => {
      const pages = Math.ceil(allMaterials().length / perPage());
      if (page < pages - 1) { page++; render(); }
    });

    window.addEventListener('resize', () => render());

    const todayTitle = document.getElementById('todayTitle');
    const dayBadge = document.getElementById('dayBadge');
    updateIntro();
    if (todayTitle) new MutationObserver(updateIntro).observe(todayTitle, { childList: true, subtree: true, characterData: true });
    if (dayBadge) new MutationObserver(updateIntro).observe(dayBadge, { childList: true, subtree: true, characterData: true });
  }

  function init() {
    addBackToTop();
    addCourseMaterials();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
