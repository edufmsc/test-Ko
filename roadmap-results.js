'use strict';

(function () {
  const roadmapBody = document.getElementById('roadmapBody');
  if (!roadmapBody) return;

  function enhanceRoadmapLinks() {
    [...roadmapBody.querySelectorAll('tr')].forEach(row => {
      const dayCell = row.cells?.[0];
      const topicCell = row.cells?.[1];
      if (!dayCell || !topicCell) return;

      const match = dayCell.textContent.match(/(\d+)/);
      if (!match) return;
      const dayNo = Number(match[1]);
      const strong = topicCell.querySelector('strong');
      if (!strong || topicCell.querySelector('.roadmap-topic-link')) return;

      const title = strong.textContent.trim();
      const link = document.createElement('a');
      link.className = 'roadmap-topic-link';
      link.href = `result.html?day=${dayNo}`;
      link.textContent = title;
      link.title = `查看 DAY ${String(dayNo).padStart(2, '0')} 的學習成果紀錄`;
      strong.replaceChildren(link);
    });
  }

  const style = document.createElement('style');
  style.textContent = `
    .roadmap-topic-link {
      color: #174f78;
      text-decoration: none;
      font-weight: 900;
      border-bottom: 1px solid transparent;
      transition: color .18s ease, border-color .18s ease;
    }
    .roadmap-topic-link:hover {
      color: #2e668c;
      border-bottom-color: #2e668c;
    }
    .roadmap-topic-link::after {
      content: '  ↗';
      font-size: .72em;
      opacity: .55;
    }
  `;
  document.head.appendChild(style);

  const observer = new MutationObserver(enhanceRoadmapLinks);
  observer.observe(roadmapBody, { childList: true, subtree: true });
  enhanceRoadmapLinks();
})();
