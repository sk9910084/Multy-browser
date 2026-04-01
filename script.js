/* ═══════════════════════════════════════════════════
   TabBlast — script.js
   Opens URLs in multiple tabs with random delays.
   No automation, no fake traffic — purely local browser action.
═══════════════════════════════════════════════════ */

'use strict';

// ── DOM refs ─────────────────────────────────────
const urlInput     = document.getElementById('url-input');
const urlError     = document.getElementById('url-error');
const tabCount     = document.getElementById('tab-count');
const decrementBtn = document.getElementById('decrement');
const incrementBtn = document.getElementById('increment');
const pasteBtn     = document.getElementById('paste-btn');
const openBtn      = document.getElementById('open-btn');
const stopBtn      = document.getElementById('stop-btn');
const progressText = document.getElementById('progress-text');
const progressCount= document.getElementById('progress-count');
const progressBar  = document.getElementById('progress-bar');
const logWrap      = document.getElementById('log-wrap');
const logList      = document.getElementById('log-list');
const summary      = document.getElementById('summary');

// ── State ─────────────────────────────────────────
let isStopped    = false;
let isRunning    = false;
let timeoutQueue = [];     // holds setTimeout IDs for cleanup

// ── Helpers ──────────────────────────────────────

/**
 * Validate and normalise URL.
 * Returns { valid: bool, url: string, message: string }
 */
function validateURL(raw) {
  if (!raw || !raw.trim()) {
    return { valid: false, message: 'Please enter a URL.' };
  }

  let str = raw.trim();

  // Auto-prepend https:// if missing scheme
  if (!/^https?:\/\//i.test(str)) {
    str = 'https://' + str;
  }

  try {
    const parsed = new URL(str);
    // Must have a real hostname
    if (!parsed.hostname || parsed.hostname.indexOf('.') === -1) {
      return { valid: false, message: 'Invalid URL — no valid hostname found.' };
    }
    return { valid: true, url: str };
  } catch {
    return { valid: false, message: 'Invalid URL format. Example: https://example.com' };
  }
}

/** Returns a random integer between min and max inclusive */
function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/** Returns a promise that resolves after `ms` milliseconds */
function sleep(ms) {
  return new Promise(resolve => {
    const id = setTimeout(resolve, ms);
    timeoutQueue.push(id);
  });
}

/** Add an item to the live log */
function addLog(message, type = 'success') {
  const li = document.createElement('li');
  li.className = `log-item ${type}`;
  li.innerHTML = `<span class="dot"></span><span>${message}</span>`;
  logList.appendChild(li);
  logList.scrollTop = logList.scrollHeight;
}

/** Update progress UI */
function setProgress(current, total) {
  const pct = total > 0 ? Math.round((current / total) * 100) : 0;
  progressBar.style.width = pct + '%';
  progressCount.textContent = total > 0 ? `${current} / ${total}` : '';
}

/** Show error under URL input */
function showError(msg) {
  urlError.textContent = msg;
  urlInput.classList.add('error-state');
}

/** Clear error */
function clearError() {
  urlError.textContent = '';
  urlInput.classList.remove('error-state');
}

/** Set UI to running state */
function setRunning(state) {
  isRunning = state;
  openBtn.disabled = state;
  stopBtn.disabled = !state;
  urlInput.disabled = state;
  tabCount.disabled = state;
  decrementBtn.disabled = state;
  incrementBtn.disabled = state;

  if (state) {
    openBtn.classList.add('running');
  } else {
    openBtn.classList.remove('running');
  }
}

/** Clear all pending timeouts */
function clearQueue() {
  timeoutQueue.forEach(id => clearTimeout(id));
  timeoutQueue = [];
}

// ── Core: open tabs ───────────────────────────────

async function openTabs() {
  const raw   = urlInput.value;
  const count = parseInt(tabCount.value, 10);

  clearError();
  summary.innerHTML = '';

  // Validate URL
  const { valid, url, message } = validateURL(raw);
  if (!valid) {
    showError(message);
    urlInput.focus();
    return;
  }

  // Validate count
  if (isNaN(count) || count < 1 || count > 20) {
    tabCount.value = Math.min(20, Math.max(1, count || 1));
    return;
  }

  // Set canonical URL in input
  urlInput.value = url;

  // Reset state
  isStopped = false;
  logList.innerHTML = '';
  setProgress(0, count);
  progressText.textContent = 'Starting…';
  logWrap.classList.add('open');
  summary.innerHTML = '';

  setRunning(true);

  let opened = 0;

  addLog(`Target: ${url}`, 'pending');
  addLog(`Opening ${count} tab${count > 1 ? 's' : ''} with random delays (1–5 sec)…`, 'pending');

  for (let i = 1; i <= count; i++) {
    if (isStopped) break;

    const delayMs = randInt(1000, 5000);

    // Show "waiting" entry
    addLog(`Tab ${i}: waiting ${(delayMs / 1000).toFixed(1)}s…`, 'pending');
    progressText.textContent = `Opening tab ${i} of ${count}…`;

    await sleep(delayMs);

    if (isStopped) break;

    // Attempt to open tab
    const tab = window.open(url, '_blank', 'noopener,noreferrer');

    if (tab) {
      opened++;
      setProgress(opened, count);
      // Replace last "waiting" log with success
      const items = logList.querySelectorAll('.log-item');
      const last  = items[items.length - 1];
      if (last) {
        last.className = 'log-item success';
        last.querySelector('span:last-child').textContent =
          `Tab ${i} opened ✓  (+${(delayMs / 1000).toFixed(1)}s delay)`;
      }
    } else {
      // Browser blocked the popup
      addLog(`Tab ${i}: blocked by browser (allow popups for this site)`, 'stopped');
    }
  }

  // Done
  setRunning(false);
  clearQueue();

  if (isStopped) {
    progressText.textContent = 'Stopped.';
    progressCount.textContent = `${opened} / ${count}`;
    summary.innerHTML = `<span class="badge warn">⏹ Stopped — ${opened} tab${opened !== 1 ? 's' : ''} opened</span>`;
    addLog(`Stopped by user. ${opened} tab${opened !== 1 ? 's' : ''} opened.`, 'stopped');
  } else {
    progressText.textContent = 'Done!';
    setProgress(count, count);
    summary.innerHTML = `<span class="badge">✓ ${opened} tab${opened !== 1 ? 's' : ''} opened successfully</span>`;
    addLog(`All done! ${opened} tab${opened !== 1 ? 's' : ''} opened.`, 'success');
  }
}

// ── Event Listeners ───────────────────────────────

openBtn.addEventListener('click', () => {
  if (!isRunning) openTabs();
});

stopBtn.addEventListener('click', () => {
  if (isRunning) {
    isStopped = true;
    clearQueue();
    addLog('Stop requested…', 'stopped');
  }
});

// +/− buttons
decrementBtn.addEventListener('click', () => {
  const val = parseInt(tabCount.value, 10);
  if (!isNaN(val) && val > 1) tabCount.value = val - 1;
});

incrementBtn.addEventListener('click', () => {
  const val = parseInt(tabCount.value, 10);
  if (!isNaN(val) && val < 20) tabCount.value = val + 1;
});

// Clamp tab count on change
tabCount.addEventListener('change', () => {
  let v = parseInt(tabCount.value, 10);
  if (isNaN(v) || v < 1) v = 1;
  if (v > 20) v = 20;
  tabCount.value = v;
});

// Clear URL error on typing
urlInput.addEventListener('input', () => {
  if (urlInput.classList.contains('error-state')) clearError();
});

// Keyboard shortcut: Enter to open
urlInput.addEventListener('keydown', e => {
  if (e.key === 'Enter' && !isRunning) openTabs();
});

// Paste button
pasteBtn.addEventListener('click', async () => {
  try {
    if (navigator.clipboard && navigator.clipboard.readText) {
      const text = await navigator.clipboard.readText();
      urlInput.value = text;
      clearError();
    }
  } catch {
    // Clipboard access denied — ignore silently
    urlInput.focus();
  }
});
