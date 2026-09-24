'use strict';

(function () {
  const style = document.createElement('style');
  style.textContent = `
    /* 左側清單跳轉時，預留固定導覽列高度，避免主題被 Header 蓋住 */
    #today,
    #courseMaterials,
    #learningFocusSection,
    #workCaseSection,
    #resultRecordSection,
    #roadmap,
    #portfolio,
    #report,
    #dashboard {
      scroll-margin-top: 112px;
    }

    @media (max-width: 900px) {
      #today,
      #courseMaterials,
      #learningFocusSection,
      #workCaseSection,
      #resultRecordSection,
      #roadmap,
      #portfolio,
      #report,
      #dashboard {
        scroll-margin-top: 92px;
      }
    }
  `;
  document.head.appendChild(style);
})();
