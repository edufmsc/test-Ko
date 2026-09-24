'use strict';
const CFG=window.AI_LMS_CONFIG||{};
let profile=null;
let data=null;
let timer={minutes:90,remaining:5400,id:null,running:false};
const $=id=>document.getElementById(id);
const esc=s=>{const d=document.createElement('div');d.textContent=s??'';return d.innerHTML};

const PLAN=[
{day_no:1,phase:'基礎',title:'AI 基礎與工作任務拆解',tool:'ChatGPT',default_minutes:90,deliverable:'完成 3 組工作提示詞',tags:['prompt']},
{day_no:2,phase:'基礎',title:'提示詞進階與品質檢查',tool:'ChatGPT',default_minutes:90,deliverable:'建立 Prompt 範本',tags:['prompt']},
{day_no:3,phase:'文件',title:'文件摘要與重點提取',tool:'ChatGPT / NotebookLM',default_minutes:90,deliverable:'完成 1 份摘要表',tags:['document','research']},
{day_no:4,phase:'文件',title:'訓練手冊與 SOP 協作',tool:'ChatGPT',default_minutes:120,deliverable:'完成 1 頁 SOP',tags:['document','workflow']},
{day_no:5,phase:'文件',title:'Email、公告與內部溝通',tool:'ChatGPT',default_minutes:60,deliverable:'建立 3 種訊息模板',tags:['document','prompt']},
{day_no:6,phase:'研究',title:'AI 搜尋與資料查核',tool:'ChatGPT Search',default_minutes:90,deliverable:'完成來源比較表',tags:['research']},
{day_no:7,phase:'研究',title:'比較分析與決策建議',tool:'ChatGPT',default_minutes:90,deliverable:'完成決策矩陣',tags:['research','data']},
{day_no:8,phase:'研究',title:'問卷與需求調查設計',tool:'ChatGPT / Forms',default_minutes:90,deliverable:'完成 10 題問卷',tags:['research','document']},
{day_no:9,phase:'資料',title:'Sheets 公式與資料清理',tool:'ChatGPT + Sheets',default_minutes:120,deliverable:'完成自動計算表',tags:['data']},
{day_no:10,phase:'資料',title:'數據分析與 HRD 洞察',tool:'ChatGPT',default_minutes:90,deliverable:'完成 3 點數據洞察',tags:['data','research']},
{day_no:11,phase:'自動化',title:'Forms × Sheets 工作流',tool:'Forms / Sheets',default_minutes:120,deliverable:'完成流程草圖',tags:['workflow','automation']},
{day_no:12,phase:'自動化',title:'Apps Script 入門',tool:'Apps Script',default_minutes:120,deliverable:'完成 1 個簡單自動化',tags:['automation']},
{day_no:13,phase:'自動化',title:'建立 AI 工作流程 SOP',tool:'ChatGPT',default_minutes:90,deliverable:'完成 1 份 AI SOP',tags:['workflow','prompt']},
{day_no:14,phase:'資料',title:'AI 輔助月報與視覺化',tool:'ChatGPT / Sheets',default_minutes:120,deliverable:'完成一頁月報',tags:['data','visual']},
{day_no:15,phase:'視覺',title:'AI 圖像與教材視覺',tool:'Image AI',default_minutes:90,deliverable:'完成 2 張教材圖',tags:['visual','prompt']},
{day_no:16,phase:'視覺',title:'AI 簡報架構與設計',tool:'ChatGPT / Slides',default_minutes:120,deliverable:'完成 5 頁簡報',tags:['visual','document']},
{day_no:17,phase:'整合',title:'NotebookLM 知識整理',tool:'NotebookLM',default_minutes:90,deliverable:'建立 1 個知識庫',tags:['research','document']},
{day_no:18,phase:'整合',title:'多工具 AI 工作流',tool:'AI + Google Workspace',default_minutes:120,deliverable:'完成一條跨工具流程',tags:['workflow','automation']},
{day_no:19,phase:'整合',title:'AI 工作效益量化',tool:'ChatGPT / Sheets',default_minutes:90,deliverable:'完成效益比較表',tags:['data','workflow']},
{day_no:20,phase:'成果',title:'作品集與能力總結',tool:'ChatGPT',default_minutes:120,deliverable:'完成個人 AI 作品集',tags:['prompt','document','research','data','automation','visual','workflow']}
].map(p=>({...p,summary:`以實際工作情境練習「${p.title}」，把學習轉成可重複使用的成果。`,points:[`了解「${p.title}」的核心方法`,'完成一個與工作相關的實作','檢查成果是否可重複使用'],checklist:['閱讀今日學習重點','完成至少一次實際操作','留下成果或學習紀錄',`完成今日成果：${p.deliverable}`],case_text:'選擇一項目前工作上的真實任務，使用今日方法完成改善。',practice_prompt:'請依今日主題協助我拆解任務、提出步驟，並在輸出前檢查遺漏與風險。',output_task:`完成並記錄：${p.deliverable}`}));

function userKey(){return (CFG.STORAGE_PREFIX||'ai-learning-frontend-v1:')+'local'}
function localToday(){return new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Taipei',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date())}
function blankStore(){return{startDate:localToday(),records:{},checklist:{},checkins:[],portfolio:[],report:null}}
function loadStore(){try{return {...blankStore(),...JSON.parse(localStorage.getItem(userKey())||'{}')}}catch(e){return blankStore()}}
function saveStore(){localStorage.setItem(userKey(),JSON.stringify(data.store))}
function businessDate(start,day){const d=new Date(start+'T12:00:00');let n=1;while(n<day){d.setDate(d.getDate()+1);if(d.getDay()!==0&&d.getDay()!==6)n++}return d.toISOString().slice(0,10)}
function streakDays(arr){const dates=[...new Set(arr)].sort().reverse();if(!dates.length)return 0;let cur=new Date();cur.setHours(12,0,0,0);let n=0;for(const ds of dates){while(cur.getDay()===0||cur.getDay()===6)cur.setDate(cur.getDate()-1);const c=cur.toISOString().slice(0,10);if(ds===c){n++;cur.setDate(cur.getDate()-1)}else if(ds<c)break}return n}
function currentData(){
  const s=data.store, completed=PLAN.filter(p=>s.records[p.day_no]?.status==='completed').map(p=>p.day_no);
  const currentNo=PLAN.find(p=>!completed.includes(p.day_no))?.day_no||20;
  const plan=PLAN.map(p=>({...p,schedule_date:businessDate(s.startDate,p.day_no)}));
  const currentPlan=plan.find(p=>p.day_no===currentNo);
  const record=s.records[currentNo]||null;
  const checks=(s.checklist[currentNo]||{});
  return{user:profile,plan,currentPlan,currentRecord:record,currentChecklist:Object.entries(checks).map(([k,v])=>({item_no:+k,checked:!!v.checked,item_text:v.item_text||''})),todayCheckin:s.checkins.includes(localToday()),portfolio:s.portfolio,report:s.report,stats:{completedDays:completed.length,streakDays:streakDays(s.checkins),totalMinutes:Object.values(s.records).reduce((a,x)=>a+(+x.actual_minutes||0),0),portfolioCount:s.portfolio.length}};
}
function hydrate(){const view=currentData();Object.assign(data,view)}

function initLocalApp(){
  profile={name:'學習者'};
  data={store:loadStore()};
  saveStore();
  renderAll();
}

function renderAll(){hydrate();const u=data.user,s=data.stats,p=data.currentPlan;$('userName').textContent=u.name;$('statCompleted').textContent=`${s.completedDays} / ${data.plan.length}`;$('statStreak').textContent=`${s.streakDays} 天`;$('statMinutes').textContent=`${s.totalMinutes} 分`;$('statPortfolio').textContent=s.portfolioCount;$('scheduleText').textContent=s.completedDays>=data.plan.length?'20 天計畫已完成，可持續更新作品集與能力報告。':`目前進行 DAY ${String(p.day_no).padStart(2,'0')}；依工作日排程為 ${p.schedule_date||'今日'}。`;renderToday();renderRoadmap();renderPortfolio();renderReport(data.report)}
function renderToday(){const p=data.currentPlan,r=data.currentRecord||{};if(!p)return;$('dayBadge').textContent=`DAY ${String(p.day_no).padStart(2,'0')} · ${p.phase}`;$('scheduledDate').textContent=p.schedule_date||'';$('todayTitle').textContent=p.title;$('todaySummary').textContent=p.summary;$('todayMinutes').textContent=`${r.planned_minutes||p.default_minutes} 分鐘`;$('todayTool').textContent=p.tool;$('todayDeliverable').textContent=p.deliverable;$('learningPoints').innerHTML=p.points.map(x=>`<li>${esc(x)}</li>`).join('');$('caseText').textContent=p.case_text;$('promptText').textContent=p.practice_prompt;$('outputTask').textContent=p.output_task;$('resultNote').value=r.result_note||'';const checks=data.currentChecklist||[];$('checklist').innerHTML=p.checklist.map((x,i)=>{const c=checks.find(v=>Number(v.item_no)===i+1);return `<li><label><input type="checkbox" data-check="${i+1}" ${c?.checked?'checked':''}><span>${esc(x)}</span></label></li>`}).join('');updateCheckProgress();$('checkinStatus').textContent=data.todayCheckin?'✓ 今日已打卡':'尚未打卡';$('checkinBtn').disabled=!!data.todayCheckin;timer.minutes=Number(r.planned_minutes||p.default_minutes||90);timer.remaining=timer.minutes*60;$('customMinutes').value=timer.minutes;syncTimer()}
function updateCheckProgress(){const a=[...document.querySelectorAll('[data-check]')];$('checkProgress').textContent=`${a.filter(x=>x.checked).length} / ${a.length}`}
function renderRoadmap(){const rec=data.store.records;$('roadmapBody').innerHTML=data.plan.map(p=>{const r=rec[p.day_no];const st=r?.status==='completed'?'<span class="status-done">已完成</span>':p.day_no===data.currentPlan?.day_no?'<span class="status-current">進行中</span>':'尚未開始';return `<tr><td>DAY ${String(p.day_no).padStart(2,'0')}</td><td><strong>${esc(p.title)}</strong></td><td>${esc(p.tool)}</td><td>${esc(p.deliverable)}</td><td>${esc(p.schedule_date||'')}</td><td>${st}</td></tr>`}).join('');const pct=Math.round(data.stats.completedDays/data.plan.length*100);$('progressPercent').textContent=pct+'%';$('progressBar').style.width=pct+'%'}
function renderPortfolio(){const arr=data.portfolio||[];$('portfolioGrid').innerHTML=arr.length?arr.map(x=>`<article class="portfolio-item"><small>DAY ${String(x.day_no||'').padStart(2,'0')} · ${esc(x.tools||'')}</small><h3>${esc(x.title)}</h3><p>${esc(x.result)}</p>${x.result_link?`<a href="${esc(x.result_link)}" target="_blank" rel="noopener">查看作品 ↗</a>`:''}</article>`).join(''):'<p class="muted">尚未加入作品。</p>'}
function reportFromStore(){const keys=['prompt','document','research','data','automation','visual','workflow'],tot=Object.fromEntries(keys.map(k=>[k,0])),got=Object.fromEntries(keys.map(k=>[k,0]));PLAN.forEach(p=>p.tags.forEach(k=>{tot[k]++;if(data.store.records[p.day_no]?.status==='completed')got[k]++}));const score=k=>tot[k]?Math.round(got[k]/tot[k]*100):0;const scores=Object.fromEntries(keys.map(k=>[k+'_score',score(k)]));const labels={prompt_score:'Prompt',document_score:'文件處理',research_score:'搜尋研究',data_score:'資料分析',automation_score:'自動化',visual_score:'視覺表達',workflow_score:'工作流程整合'};const pairs=Object.entries(scores).sort((a,b)=>b[1]-a[1]);return{completion_rate:Math.round(data.stats.completedDays/20*100),total_minutes:data.stats.totalMinutes,...scores,strengths:pairs.slice(0,2).map(x=>labels[x[0]]).join('、'),skill_gaps:pairs.slice(-2).map(x=>labels[x[0]]).join('、'),next_steps:'優先加強目前完成度較低的能力，並挑選 1 個作品持續優化。'}}
function renderReport(r){if(!r){$('reportContent').innerHTML='<p class="muted">尚未產生報告。完成更多學習後按「更新能力報告」。</p>';return}const scores=[['Prompt',r.prompt_score],['文件',r.document_score],['研究',r.research_score],['資料',r.data_score],['自動化',r.automation_score],['視覺',r.visual_score],['工作流',r.workflow_score]];$('reportContent').innerHTML=`<h3>${esc(data.user.name)}｜AI 能力摘要</h3><p>完成率 ${r.completion_rate}%｜總學習 ${r.total_minutes} 分鐘</p><div class="score-grid">${scores.map(([k,v])=>`<div class="score"><span>${k}</span><strong>${v}</strong></div>`).join('')}</div><div class="report-note"><strong>目前優勢</strong><p>${esc(r.strengths)}</p><strong>能力缺口</strong><p>${esc(r.skill_gaps)}</p><strong>下一步</strong><p>${esc(r.next_steps)}</p></div>`}

function saveRecord(status='in_progress'){const p=data.currentPlan;const minutes=Number($('customMinutes').value)||p.default_minutes;const actual=Math.max(0,Math.round((minutes*60-timer.remaining)/60));data.store.records[p.day_no]={day_no:p.day_no,planned_minutes:minutes,actual_minutes:actual,status,result_note:$('resultNote').value.trim(),updated_at:new Date().toISOString()};saveStore();$('saveMessage').textContent=status==='completed'?'DAY 已完成，正在同步至試算表。':'今日進度已暫存，正在同步。';renderAll()}
function formatTime(s){return [Math.floor(s/3600),Math.floor(s%3600/60),s%60].map(v=>String(v).padStart(2,'0')).join(':')}function syncTimer(){$('timerDisplay').textContent=formatTime(timer.remaining);$('timerToggle').textContent=timer.running?'暫停':'開始'}function stopTimer(){if(timer.id)clearInterval(timer.id);timer.id=null;timer.running=false;syncTimer()}

$('checklist').addEventListener('change',e=>{const box=e.target.closest('[data-check]');if(!box)return;const day=data.currentPlan.day_no,idx=Number(box.dataset.check);data.store.checklist[day]=data.store.checklist[day]||{};data.store.checklist[day][idx]={checked:box.checked,item_text:data.currentPlan.checklist[idx-1]};saveStore();updateCheckProgress()});
$('checkinBtn').onclick=()=>{const today=localToday();if(!data.store.checkins.includes(today))data.store.checkins.push(today);saveStore();renderAll()};
$('saveDayBtn').onclick=()=>saveRecord('in_progress');
$('completeDayBtn').onclick=()=>saveRecord('completed');
$('addPortfolioBtn').onclick=()=>{const title=$('portfolioTitle').value.trim();if(!title){alert('請輸入作品名稱');return}const item={id:crypto.randomUUID?.()||Date.now(),day_no:data.currentPlan?.day_no||20,title,tools:$('portfolioTools').value.trim(),result:$('portfolioResult').value.trim(),result_link:$('portfolioLink').value.trim(),created_at:new Date().toISOString()};data.store.portfolio.push(item);saveStore();['portfolioTitle','portfolioTools','portfolioResult','portfolioLink'].forEach(id=>$(id).value='');renderAll()};
$('generateReportBtn').onclick=()=>{data.store.report=reportFromStore();saveStore();renderAll()};
document.querySelectorAll('[data-minutes]').forEach(b=>b.onclick=()=>{if(timer.running)return;timer.minutes=Number(b.dataset.minutes);timer.remaining=timer.minutes*60;$('customMinutes').value=timer.minutes;document.querySelectorAll('[data-minutes]').forEach(x=>x.classList.toggle('active',x===b));syncTimer()});
$('applyMinutes').onclick=()=>{const m=Math.max(10,Math.min(360,Number($('customMinutes').value)||90));stopTimer();timer.minutes=m;timer.remaining=m*60;syncTimer()};
$('timerToggle').onclick=()=>{if(timer.running){stopTimer();return}timer.running=true;syncTimer();timer.id=setInterval(()=>{timer.remaining--;syncTimer();if(timer.remaining<=0)stopTimer()},1000)};
$('timerReset').onclick=()=>{stopTimer();timer.remaining=timer.minutes*60;syncTimer()};

window.addEventListener('DOMContentLoaded', () => initLocalApp());
