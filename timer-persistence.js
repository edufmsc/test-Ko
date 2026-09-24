'use strict';

(function () {
  // Front-end only timer layer.
  // - actual_seconds = cumulative learning time for the DAY.
  // - focus_remaining_seconds = remaining time for the current focus session.
  // These are intentionally separate so a learner can start another 60/90/120 minute
  // focus session even after the DAY has already accumulated more time than that.

  const CHECKPOINT_MS = 5000;
  let lastCheckpointAt = 0;

  function hasSession() {
    return typeof data !== 'undefined' && data && data.store && data.currentPlan;
  }

  function currentDayNo() {
    return hasSession() ? Number(data.currentPlan.day_no) : 0;
  }

  function plannedSeconds() {
    return Math.max(600, (Number(timer.minutes) || 90) * 60);
  }

  function ensureRecord() {
    if (!hasSession()) return null;

    const day = currentDayNo();
    const plan = data.currentPlan;
    const old = data.store.records[day] || {};
    const planned = Math.max(
      10,
      Math.min(
        360,
        Number(old.planned_minutes || document.getElementById('customMinutes')?.value || plan.default_minutes || 90)
      )
    );

    const oldSeconds = Number.isFinite(Number(old.actual_seconds))
      ? Math.max(0, Math.floor(Number(old.actual_seconds)))
      : Math.max(0, Math.floor((Number(old.actual_minutes) || 0) * 60));

    const hasStoredFocus = Object.prototype.hasOwnProperty.call(old, 'focus_remaining_seconds') &&
      Number.isFinite(Number(old.focus_remaining_seconds));
    const focusRemaining = hasStoredFocus
      ? Math.max(0, Math.min(planned * 60, Math.floor(Number(old.focus_remaining_seconds))))
      : planned * 60;

    const record = {
      ...old,
      day_no: day,
      planned_minutes: planned,
      actual_seconds: oldSeconds,
      actual_minutes: Math.floor(oldSeconds / 60),
      focus_remaining_seconds: focusRemaining,
      status: old.status || 'in_progress',
      updated_at: old.updated_at || new Date().toISOString()
    };

    data.store.records[day] = record;
    return record;
  }

  function totalAccumulatedSeconds() {
    if (!hasSession()) return 0;
    return Object.values(data.store.records || {}).reduce((sum, record) => {
      if (Number.isFinite(Number(record?.actual_seconds))) {
        return sum + Math.max(0, Number(record.actual_seconds));
      }
      return sum + Math.max(0, (Number(record?.actual_minutes) || 0) * 60);
    }, 0);
  }

  function updateDashboardTotal() {
    const el = document.getElementById('statMinutes');
    if (!el || !hasSession()) return;
    el.textContent = `${Math.floor(totalAccumulatedSeconds() / 60)} 分`;
  }

  function ensureAccumulatedLabel() {
    const display = document.getElementById('timerDisplay');
    if (!display || document.getElementById('timerAccumulated')) return;

    const label = document.createElement('div');
    label.id = 'timerAccumulated';
    label.style.margin = '-4px 0 12px';
    label.style.textAlign = 'center';
    label.style.color = '#6d8293';
    label.style.fontSize = '.78rem';
    label.style.fontWeight = '700';
    label.textContent = '本 DAY 已累積 0 分';
    display.insertAdjacentElement('afterend', label);
  }

  function accumulatedText(seconds) {
    const safe = Math.max(0, Math.floor(Number(seconds) || 0));
    const mins = Math.floor(safe / 60);
    const secs = safe % 60;
    return secs > 0
      ? `本 DAY 已累積 ${mins} 分 ${String(secs).padStart(2, '0')} 秒`
      : `本 DAY 已累積 ${mins} 分`;
  }

  function updateAccumulatedLabel(seconds) {
    ensureAccumulatedLabel();
    const text = accumulatedText(seconds);
    const el = document.getElementById('timerAccumulated');
    const floating = document.getElementById('floatingTimerAccumulated');
    if (el) el.textContent = text;
    if (floating) floating.textContent = text;
  }

  function currentRunState() {
    const record = ensureRecord();
    if (!record) return { total: 0, remaining: Math.max(0, Number(timer.remaining) || 0) };

    if (!timer.running || !timer.sessionStartedAt) {
      return {
        total: Math.max(0, Number(record.actual_seconds) || 0),
        remaining: Math.max(0, Number(timer.remaining) || 0)
      };
    }

    const startRemaining = Math.max(0, Number(timer.sessionStartRemaining) || plannedSeconds());
    const rawElapsed = Math.max(0, Math.floor((Date.now() - timer.sessionStartedAt) / 1000));
    const sessionElapsed = Math.min(startRemaining, rawElapsed);

    return {
      total: Math.max(0, Number(timer.sessionStartAccumulated) || 0) + sessionElapsed,
      remaining: Math.max(0, startRemaining - sessionElapsed)
    };
  }

  function writeState(totalSeconds, remainingSeconds, updateTimestamp = true) {
    const record = ensureRecord();
    if (!record) return;

    const total = Math.max(0, Math.floor(Number(totalSeconds) || 0));
    const remaining = Math.max(0, Math.min(plannedSeconds(), Math.floor(Number(remainingSeconds) || 0)));

    record.actual_seconds = total;
    record.actual_minutes = Math.floor(total / 60);
    record.planned_minutes = Number(timer.minutes) || record.planned_minutes || 90;
    record.focus_remaining_seconds = remaining;
    if (!record.status || record.status === 'not_started') record.status = 'in_progress';
    if (updateTimestamp) record.updated_at = new Date().toISOString();

    timer.remaining = remaining;
    saveStore();
    updateDashboardTotal();
    updateAccumulatedLabel(total);
  }

  function refreshClockFromNow() {
    if (!timer.running) return;

    const state = currentRunState();
    timer.remaining = state.remaining;
    syncTimer();
    updateAccumulatedLabel(state.total);

    const now = Date.now();
    if (now - lastCheckpointAt >= CHECKPOINT_MS) {
      writeState(state.total, state.remaining);
      lastCheckpointAt = now;
    }

    if (state.remaining <= 0) {
      pauseAndPersist('本次計時完成');
    }
  }

  function stopIntervalOnly() {
    if (timer.id) clearInterval(timer.id);
    timer.id = null;
  }

  function pauseAndPersist(reason) {
    if (!hasSession()) return;

    const state = currentRunState();
    writeState(state.total, state.remaining);
    stopIntervalOnly();

    timer.running = false;
    timer.sessionStartedAt = null;
    timer.sessionStartAccumulated = state.total;
    timer.sessionStartRemaining = state.remaining;
    syncTimer();

    const message = document.getElementById('saveMessage');
    if (message && reason && reason !== '頁面關閉') {
      message.textContent = `${reason}，學習時間已自動保存。`;
    }
  }

  function restoreCurrentDayTimer() {
    if (!hasSession()) return;

    stopIntervalOnly();
    const record = ensureRecord();
    const plan = data.currentPlan;
    const planned = Math.max(10, Math.min(360, Number(record?.planned_minutes || plan?.default_minutes || 90)));
    const elapsed = Math.max(0, Number(record?.actual_seconds || 0));
    const remaining = Math.max(0, Math.min(planned * 60, Number(record?.focus_remaining_seconds ?? planned * 60)));

    timer.minutes = planned;
    timer.remaining = remaining;
    timer.running = false;
    timer.sessionStartedAt = null;
    timer.sessionStartAccumulated = elapsed;
    timer.sessionStartRemaining = remaining;

    const input = document.getElementById('customMinutes');
    if (input) input.value = planned;

    syncTimer();
    updateAccumulatedLabel(elapsed);
    updateDashboardTotal();
    updateFloatingVisibility();
  }

  function resetFocusSession(showMessage = true) {
    if (!hasSession()) return;
    if (timer.running) pauseAndPersist('');

    const record = ensureRecord();
    const full = plannedSeconds();
    record.focus_remaining_seconds = full;
    record.updated_at = new Date().toISOString();
    timer.remaining = full;
    timer.sessionStartRemaining = full;
    timer.sessionStartAccumulated = Number(record.actual_seconds || 0);
    timer.sessionStartedAt = null;
    timer.running = false;
    saveStore();
    syncTimer();

    if (showMessage) {
      const msg = document.getElementById('saveMessage');
      if (msg) msg.textContent = '本次 Focus Timer 已重設；累積學習時間不會被清除。';
    }
  }

  function startFocusSession() {
    if (!hasSession()) return;
    if (timer.running) return;

    const record = ensureRecord();
    let remaining = Math.max(0, Number(timer.remaining) || 0);

    // A finished focus session can immediately start another full session.
    if (remaining <= 0) {
      remaining = plannedSeconds();
      record.focus_remaining_seconds = remaining;
    }

    timer.remaining = remaining;
    timer.sessionStartRemaining = remaining;
    timer.sessionStartAccumulated = Math.max(0, Number(record.actual_seconds) || 0);
    timer.sessionStartedAt = Date.now();
    timer.running = true;
    lastCheckpointAt = Date.now();
    stopIntervalOnly();
    timer.id = setInterval(refreshClockFromNow, 500);
    saveStore();
    refreshClockFromNow();
  }

  function toggleFocusSession() {
    if (timer.running) pauseAndPersist('已暫停');
    else startFocusSession();
  }

  syncTimer = function () {
    const safeRemaining = Math.max(0, Math.floor(Number(timer.remaining) || 0));
    const text = formatTime(safeRemaining);
    const display = document.getElementById('timerDisplay');
    const toggle = document.getElementById('timerToggle');
    const floatingDisplay = document.getElementById('floatingTimerDisplay');
    const floatingToggle = document.getElementById('floatingTimerToggle');
    const floatingStatus = document.getElementById('floatingTimerStatus');

    if (display) display.textContent = text;
    if (toggle) toggle.textContent = timer.running ? '暫停' : '開始';
    if (floatingDisplay) floatingDisplay.textContent = text;
    if (floatingToggle) floatingToggle.textContent = timer.running ? '暫停' : '開始';
    if (floatingStatus) {
      floatingStatus.textContent = timer.running ? '計時中' : (safeRemaining === 0 ? '本次完成' : '已暫停');
      floatingStatus.classList.toggle('running', !!timer.running);
    }
  };

  const originalRenderToday = renderToday;
  renderToday = function () {
    if (timer.running) pauseAndPersist('');
    originalRenderToday();
    restoreCurrentDayTimer();
  };

  saveRecord = function (status = 'in_progress') {
    if (!hasSession()) return;
    if (timer.running) pauseAndPersist('');

    const p = data.currentPlan;
    const day = Number(p.day_no);
    const existing = ensureRecord() || {};
    const planned = Math.max(
      10,
      Math.min(
        360,
        Number(document.getElementById('customMinutes')?.value) || Number(existing.planned_minutes) || p.default_minutes
      )
    );
    const seconds = Number.isFinite(Number(existing.actual_seconds))
      ? Math.max(0, Math.floor(Number(existing.actual_seconds)))
      : Math.max(0, Math.floor((Number(existing.actual_minutes) || 0) * 60));

    data.store.records[day] = {
      ...existing,
      day_no: day,
      planned_minutes: planned,
      actual_seconds: seconds,
      actual_minutes: Math.floor(seconds / 60),
      focus_remaining_seconds: Math.max(0, Math.min(planned * 60, Number(existing.focus_remaining_seconds ?? planned * 60))),
      status,
      result_note: document.getElementById('resultNote')?.value.trim() || '',
      updated_at: new Date().toISOString(),
      completed_at: status === 'completed' ? new Date().toISOString() : (existing.completed_at || '')
    };

    saveStore();
    const msg = document.getElementById('saveMessage');
    if (msg) {
      msg.textContent = status === 'completed'
        ? 'DAY 已完成；累積學習時間已一併保存。'
        : '今日進度與累積學習時間已儲存。';
    }
    renderAll();
  };

  function applyPlannedMinutes(minutes) {
    if (!hasSession()) return;
    if (timer.running) pauseAndPersist('');

    const m = Math.max(10, Math.min(360, Number(minutes) || 90));
    const record = ensureRecord();
    const elapsed = Math.max(0, Number(record?.actual_seconds || 0));

    timer.minutes = m;
    timer.remaining = m * 60;
    timer.sessionStartRemaining = m * 60;
    timer.sessionStartAccumulated = elapsed;
    timer.sessionStartedAt = null;
    timer.running = false;

    record.planned_minutes = m;
    record.focus_remaining_seconds = m * 60;
    record.updated_at = new Date().toISOString();
    saveStore();

    const input = document.getElementById('customMinutes');
    if (input) input.value = m;
    document.querySelectorAll('[data-minutes]').forEach(button => {
      button.classList.toggle('active', Number(button.dataset.minutes) === m);
    });

    syncTimer();
    updateAccumulatedLabel(elapsed);
  }

  function bindPersistentTimerControls() {
    const toggle = document.getElementById('timerToggle');
    const reset = document.getElementById('timerReset');
    const apply = document.getElementById('applyMinutes');

    document.querySelectorAll('[data-minutes]').forEach(button => {
      button.onclick = () => {
        if (timer.running) return;
        applyPlannedMinutes(Number(button.dataset.minutes));
      };
    });

    if (apply) {
      apply.onclick = () => applyPlannedMinutes(document.getElementById('customMinutes')?.value);
    }

    if (toggle) toggle.onclick = toggleFocusSession;
    if (reset) reset.onclick = () => resetFocusSession(true);
  }

  function injectFloatingTimerStyles() {
    if (document.getElementById('floatingTimerStyles')) return;
    const style = document.createElement('style');
    style.id = 'floatingTimerStyles';
    style.textContent = `
      .floating-timer{position:fixed;right:24px;bottom:24px;z-index:100;width:min(340px,calc(100% - 32px));display:flex;align-items:center;justify-content:space-between;gap:16px;padding:14px 14px 14px 18px;border:1px solid #cddfeb;border-radius:18px;background:rgba(255,255,255,.96);box-shadow:0 18px 48px rgba(41,85,119,.2);backdrop-filter:blur(14px);opacity:0;visibility:hidden;pointer-events:none;transform:translateY(16px);transition:opacity .2s ease,transform .2s ease,visibility .2s ease}
      .floating-timer.visible{opacity:1;visibility:visible;pointer-events:auto;transform:translateY(0)}
      .floating-timer-main{min-width:0;flex:1}
      .floating-timer-label{display:block;color:#2e668c;font-size:.66rem;font-weight:900;letter-spacing:.12em}
      .floating-timer-time{display:block;margin:2px 0;font-size:1.65rem;line-height:1.1;font-weight:900;font-variant-numeric:tabular-nums;color:#173247}
      .floating-timer-meta{display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:#6d8293;font-size:.68rem;font-weight:700}
      .floating-timer-status{display:inline-block;margin-top:2px;color:#6d8293;font-size:.68rem;font-weight:800}
      .floating-timer-status.running{color:#1d7a59}
      .floating-timer-actions{display:grid;grid-template-columns:1fr;gap:6px;flex:0 0 auto}
      .floating-timer-actions button{min-width:72px;padding:8px 10px;border:1px solid #d6e5f0;border-radius:10px;background:#fff;color:#173247;font:inherit;font-size:.76rem;font-weight:900}
      .floating-timer-actions .primary{border-color:#2e668c;background:#2e668c;color:#fff}
      @media(max-width:620px){.floating-timer{right:14px;bottom:14px;width:calc(100% - 28px);padding:12px 12px 12px 15px}.floating-timer-time{font-size:1.45rem}.floating-timer-actions button{min-width:66px}}
    `;
    document.head.appendChild(style);
  }

  function ensureFloatingTimer() {
    if (document.getElementById('floatingTimer')) return;
    injectFloatingTimerStyles();

    const floating = document.createElement('div');
    floating.id = 'floatingTimer';
    floating.className = 'floating-timer';
    floating.setAttribute('aria-live', 'polite');
    floating.innerHTML = `
      <div class="floating-timer-main">
        <span class="floating-timer-label">FOCUS TIMER</span>
        <strong id="floatingTimerDisplay" class="floating-timer-time">00:00:00</strong>
        <span id="floatingTimerAccumulated" class="floating-timer-meta">本 DAY 已累積 0 分</span>
        <span id="floatingTimerStatus" class="floating-timer-status">已暫停</span>
      </div>
      <div class="floating-timer-actions">
        <button id="floatingTimerToggle" class="primary" type="button">開始</button>
        <button id="floatingTimerBack" type="button">回計時器</button>
      </div>
    `;
    document.body.appendChild(floating);

    document.getElementById('floatingTimerToggle').onclick = toggleFocusSession;
    document.getElementById('floatingTimerBack').onclick = () => {
      document.querySelector('.side-card')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    };
  }

  function updateFloatingVisibility() {
    ensureFloatingTimer();
    const floating = document.getElementById('floatingTimer');
    const card = document.querySelector('.side-card');
    const shell = document.getElementById('appShell');

    if (!floating || !card || !shell || shell.classList.contains('hidden') || !hasSession()) {
      floating?.classList.remove('visible');
      return;
    }

    const rect = card.getBoundingClientRect();
    const cardVisible = rect.bottom > 76 && rect.top < window.innerHeight - 12;
    floating.classList.toggle('visible', !cardVisible);
  }

  document.addEventListener('visibilitychange', () => {
    // Switching browser tabs does not pause the timer. Date.now() preserves real elapsed time.
    if (document.visibilityState === 'visible' && timer.running) refreshClockFromNow();
  });

  window.addEventListener('scroll', updateFloatingVisibility, { passive: true });
  window.addEventListener('resize', updateFloatingVisibility);

  // Closing, reloading, or navigating away saves elapsed time and stops this focus session.
  window.addEventListener('pagehide', () => {
    if (timer.running) pauseAndPersist('頁面關閉');
  });
  window.addEventListener('beforeunload', () => {
    if (timer.running) pauseAndPersist('頁面關閉');
  });

  window.addEventListener('pageshow', () => {
    if (!profile || !data) {
      updateFloatingVisibility();
      return;
    }

    try {
      data.store = loadStore();
      hydrate();
      renderAll();
    } catch (error) {
      console.warn('Unable to restore timer data', error);
    }
    updateFloatingVisibility();
  });

  function init() {
    ensureAccumulatedLabel();
    ensureFloatingTimer();
    bindPersistentTimerControls();
    syncTimer();
    updateFloatingVisibility();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
