'use strict';

(function () {
  const style = document.createElement('style');
  style.textContent = `
    .learning-sidebar {
      display: none;
      color: #173247;
    }
    .learning-sidebar-card {
      background: rgba(255,255,255,.96);
      border: 1px solid #d6e5f0;
      border-radius: 20px;
      box-shadow: 0 12px 34px rgba(41,85,119,.09);
      overflow: hidden;
    }
    .learning-sidebar-section {
      padding: 17px 18px;
      border-bottom: 1px solid #e6eef4;
    }
    .learning-sidebar-section:last-child { border-bottom: 0; }
    .learning-sidebar-label {
      margin: 0 0 8px;
      color: #2e668c;
      font-size: .68rem;
      font-weight: 900;
      letter-spacing: .14em;
    }
    .learning-sidebar-day {
      display: inline-flex;
      padding: 5px 9px;
      border-radius: 999px;
      background: #e7f2fa;
      color: #1f5577;
      font-size: .72rem;
      font-weight: 900;
    }
    .learning-sidebar-title {
      margin: 8px 0 4px;
      font-size: 1rem;
      line-height: 1.45;
      font-weight: 900;
    }
    .learning-sidebar-level {
      margin: 0;
      color: #6d8293;
      font-size: .8rem;
    }
    .learning-sidebar-progress {
      height: 6px;
      margin: 12px 0 7px;
      overflow: hidden;
      border-radius: 99px;
      background: #e3edf4;
    }
    .learning-sidebar-progress > span {
      display: block;
      height: 100%;
      width: 0;
      border-radius: inherit;
      background: #2e668c;
      transition: width .2s ease;
    }
    .learning-sidebar-progress-text {
      display: flex;
      justify-content: space-between;
      gap: 10px;
      color: #6d8293;
      font-size: .75rem;
    }
    .learning-sidebar-nav {
      display: grid;
      gap: 5px;
    }
    .learning-sidebar-nav a {
      display: flex;
      align-items: center;
      gap: 9px;
      min-height: 36px;
      padding: 7px 9px;
      border-radius: 9px;
      color: #4f687a;
      text-decoration: none;
      font-size: .82rem;
      font-weight: 800;
      transition: background .15s ease,color .15s ease;
    }
    .learning-sidebar-nav a:hover,
    .learning-sidebar-nav a.active {
      background: #edf6fd;
      color: #1f5577;
    }
    .learning-sidebar-nav .nav-no {
      width: 22px;
      color: #9ab2c3;
      font-size: .68rem;
      font-weight: 900;
    }
    .learning-info-list,
    .learning-source-list,
    .learning-reading-list {
      display: grid;
      gap: 8px;
      margin: 0;
      padding: 0;
      list-style: none;
    }
    .learning-info-row {
      display: grid;
      grid-template-columns: 52px 1fr;
      gap: 8px;
      font-size: .79rem;
      line-height: 1.45;
    }
    .learning-info-row span:first-child { color: #8799a7; }
    .learning-info-row strong { font-weight: 800; }
    .learning-source-list li,
    .learning-reading-list li {
      display: flex;
      align-items: flex-start;
      gap: 8px;
      color: #536c7e;
      font-size: .79rem;
      line-height: 1.45;
    }
    .learning-source-list .source-no {
      flex: 0 0 auto;
      color: #2e668c;
      font-size: .67rem;
      font-weight: 900;
      letter-spacing: .05em;
    }
    .learning-reading-list a {
      color: #536c7e;
      text-decoration: none;
    }
    .learning-reading-list a:hover { color: #1f5577; text-decoration: underline; }
    .learning-sidebar-note {
      margin: 9px 0 0;
      color: #97a7b2;
      font-size: .7rem;
      line-height: 1.45;
    }

    @media (min-width: 1180px) {
      .learning-sidebar {
        display: block;
        position: fixed;
        left: 22px;
        top: 92px;
        z-index: 24;
        width: 250px;
        max-height: calc(100vh - 112px);
        overflow: auto;
        scrollbar-width: thin;
      }
      #appShell > main .section {
        width: min(1120px, calc(100% - 330px));
        margin-left: 300px;
        margin-right: 30px;
      }
    }

    @media (min-width: 1560px) {
      .learning-sidebar { left: max(28px, calc((100vw - 1510px) / 2)); width: 270px; }
      #appShell > main .section {
        width: min(1180px, calc(100% - 390px));
        margin-left: max(330px, calc((100vw - 1510px) / 2 + 310px));
        margin-right: auto;
      }
    }

    @media (max-width: 1179px) {
      .learning-sidebar {
        display: block;
        position: static;
        width: min(100% - 40px,1180px);
        margin: 26px auto 0;
      }
      .learning-sidebar-card {
        display: grid;
        grid-template-columns: repeat(2,minmax(0,1fr));
      }
      .learning-sidebar-section { border-right: 1px solid #e6eef4; }
    }

    @media (max-width: 680px) {
      .learning-sidebar { width: min(100% - 28px,1180px); }
      .learning-sidebar-card { grid-template-columns: 1fr; }
      .learning-sidebar-section { border-right: 0; }
    }
  `;
  document.head.appendChild(style);

  const courseByPhase = {
    '基礎': 'AI 工作基礎',
    '文件': 'AI 文件應用',
    '研究': 'AI 搜尋研究',
    '資料': 'AI 資料處理',
    '自動化': 'AI 自動化應用',
    '視覺': 'AI 視覺應用',
    '整合': 'AI 工作流程整合',
    '成果': 'AI 綜合應用'
  };

  function parseDay() {
    const badge = document.getElementById('dayBadge')?.textContent || '';
    const dayMatch = badge.match(/DAY\s*(\d+)/i);
    const phase = badge.split('·')[1]?.trim() || '基礎';
    return { day: dayMatch ? Number(dayMatch[1]) : 1, phase };
  }

  function levelForDay(day) {
    if (day <= 5) return 'L1｜基礎應用';
    if (day <= 10) return 'L1 → L2｜獨立運用';
    if (day <= 15) return 'L2｜工作應用';
    if (day <= 18) return 'L2 → L3｜流程整合';
    return 'L3｜綜合應用';
  }

  function ensureSectionIds() {
    const lessonGrid = document.querySelector('.lesson-grid');
    if (!lessonGrid) return;
    const cards = lessonGrid.querySelectorAll(':scope > article');
    if (cards[0]) cards[0].id = 'learningFocusSection';
    if (cards[1]) cards[1].id = 'workCaseSection';
    if (cards[2]) cards[2].id = 'resultRecordSection';
  }

  function createSidebar() {
    const appShell = document.getElementById('appShell');
    if (!appShell || document.getElementById('learningSidebar')) return;
    ensureSectionIds();

    const aside = document.createElement('aside');
    aside.id = 'learningSidebar';
    aside.className = 'learning-sidebar';
    aside.setAttribute('aria-label', '今日學習導航與課程資訊');
    aside.innerHTML = `
      <div class="learning-sidebar-card">
        <section class="learning-sidebar-section">
          <p class="learning-sidebar-label">TODAY</p>
          <span id="sidebarDay" class="learning-sidebar-day">DAY 01</span>
          <h2 id="sidebarTitle" class="learning-sidebar-title">今日課程</h2>
          <p id="sidebarLevel" class="learning-sidebar-level">L1｜基礎應用</p>
          <div class="learning-sidebar-progress"><span id="sidebarProgressBar"></span></div>
          <div class="learning-sidebar-progress-text">
            <span>今日進度</span>
            <strong id="sidebarCheckProgress">0 / 4</strong>
          </div>
        </section>

        <section class="learning-sidebar-section">
          <p class="learning-sidebar-label">快速前往</p>
          <nav class="learning-sidebar-nav">
            <a href="#today" data-sidebar-target="today"><span class="nav-no">01</span>今日任務</a>
            <a href="#courseMaterials" data-sidebar-target="courseMaterials"><span class="nav-no">02</span>課程教材</a>
            <a href="#learningFocusSection" data-sidebar-target="learningFocusSection"><span class="nav-no">03</span>學習重點</a>
            <a href="#workCaseSection" data-sidebar-target="workCaseSection"><span class="nav-no">04</span>工作案例</a>
            <a href="#resultRecordSection" data-sidebar-target="resultRecordSection"><span class="nav-no">05</span>成果紀錄</a>
            <a href="#roadmap" data-sidebar-target="roadmap"><span class="nav-no">06</span>20 天計畫</a>
          </nav>
        </section>

        <section class="learning-sidebar-section">
          <p class="learning-sidebar-label">COURSE INFO</p>
          <div class="learning-info-list">
            <div class="learning-info-row"><span>課程</span><strong id="sidebarCourse">AI 工作基礎</strong></div>
            <div class="learning-info-row"><span>主題</span><strong id="sidebarTopic">今日課程</strong></div>
            <div class="learning-info-row"><span>分級</span><strong id="sidebarLevelInfo">L1</strong></div>
            <div class="learning-info-row"><span>工具</span><strong id="sidebarTool">ChatGPT</strong></div>
          </div>
        </section>

        <section class="learning-sidebar-section">
          <p class="learning-sidebar-label">SOURCE</p>
          <ul class="learning-source-list">
            <li><span class="source-no">01</span><span>官方說明文件 <small>（待設定）</small></span></li>
            <li><span class="source-no">02</span><span>今日課程影片</span></li>
            <li><span class="source-no">03</span><span>工作案例與實作提示</span></li>
          </ul>
          <p class="learning-sidebar-note">之後可依每個 DAY 替換成實際來源網址。</p>
        </section>

        <section class="learning-sidebar-section">
          <p class="learning-sidebar-label">FURTHER READING</p>
          <ul class="learning-reading-list">
            <li>→ <a href="#courseMaterials">今日工具延伸應用</a></li>
            <li>→ <a href="#learningFocusSection">主題重點複習</a></li>
            <li>→ <a href="#roadmap">下一個 DAY 課程</a></li>
          </ul>
        </section>
      </div>`;

    appShell.appendChild(aside);
    bindSmoothNav(aside);
    observeActiveSection(aside);
    updateSidebar();
  }

  function bindSmoothNav(aside) {
    aside.querySelectorAll('a[href^="#"]').forEach(link => {
      link.addEventListener('click', event => {
        const target = document.querySelector(link.getAttribute('href'));
        if (!target) return;
        event.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        history.replaceState(null, '', link.getAttribute('href'));
      });
    });
  }

  function observeActiveSection(aside) {
    if (!('IntersectionObserver' in window)) return;
    const links = [...aside.querySelectorAll('[data-sidebar-target]')];
    const targets = links.map(link => document.getElementById(link.dataset.sidebarTarget)).filter(Boolean);
    if (!targets.length) return;

    const observer = new IntersectionObserver(entries => {
      const visible = entries.filter(entry => entry.isIntersecting).sort((a,b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (!visible) return;
      links.forEach(link => link.classList.toggle('active', link.dataset.sidebarTarget === visible.target.id));
    }, { rootMargin: '-20% 0px -60% 0px', threshold: [0,.15,.35,.6] });

    targets.forEach(target => observer.observe(target));
  }

  function updateSidebar() {
    const sidebar = document.getElementById('learningSidebar');
    if (!sidebar) return;
    ensureSectionIds();

    const { day, phase } = parseDay();
    const title = document.getElementById('todayTitle')?.textContent?.trim() || '今日課程';
    const tool = document.getElementById('todayTool')?.textContent?.trim() || 'ChatGPT';
    const progressText = document.getElementById('checkProgress')?.textContent?.trim() || '0 / 4';
    const nums = progressText.match(/(\d+)\s*\/\s*(\d+)/);
    const done = nums ? Number(nums[1]) : 0;
    const total = nums ? Math.max(1,Number(nums[2])) : 4;
    const pct = Math.max(0,Math.min(100,Math.round(done / total * 100)));
    const level = levelForDay(day);

    document.getElementById('sidebarDay').textContent = `DAY ${String(day).padStart(2,'0')} · ${phase}`;
    document.getElementById('sidebarTitle').textContent = title;
    document.getElementById('sidebarLevel').textContent = level;
    document.getElementById('sidebarCheckProgress').textContent = progressText;
    document.getElementById('sidebarProgressBar').style.width = `${pct}%`;
    document.getElementById('sidebarCourse').textContent = courseByPhase[phase] || 'AI 工作應用';
    document.getElementById('sidebarTopic').textContent = title;
    document.getElementById('sidebarLevelInfo').textContent = level;
    document.getElementById('sidebarTool').textContent = tool;
  }

  function watchTodayData() {
    ['dayBadge','todayTitle','todayTool','checkProgress'].forEach(id => {
      const node = document.getElementById(id);
      if (!node) return;
      new MutationObserver(updateSidebar).observe(node, { childList: true, subtree: true, characterData: true });
    });
    document.getElementById('checklist')?.addEventListener('change', () => setTimeout(updateSidebar, 0));
  }

  function init() {
    createSidebar();
    watchTodayData();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
