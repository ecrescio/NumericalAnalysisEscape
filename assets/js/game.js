(() => {
  const app = () => document.getElementById('app');
  const modal = () => document.getElementById('modal-root');
  
  let s = null, stage = 'home', i = 0, clock = null, deadline = 0, stepStarted = 0, order = [];
  let pausedAt = 0, pausedTotal = 0, hitUntil = 0;

  const titles = ['Euler Explícito', 'Heun e Implícito', 'Estabilidad', 'RK y Diferencias Finitas'];
  const runes = ['E', 'U', 'L', 'ER'];

  const $ = id => document.getElementById(id);
  const escape = x => String(x).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  const historyPrefix = 'enchanted-energy:v1:' + location.pathname.replace(/index\.html$/, '') + ':attempt:';
  const memoryHistory = new Map(); 
  let storageFailed = false;
  const identity = x => String(x || '').normalize('NFKC').trim().replace(/\s+/g, ' ').toLowerCase();

  function validAttempt(a) { 
    return a && typeof a.id === 'string' && Number.isFinite(a.start) && Array.isArray(a.records) && typeof a.name === 'string' && typeof a.block === 'string'; 
  }

  function readHistory() {
    const result = new Map();
    try {
      for (let n = 0; n < localStorage.length; n++) {
        const key = localStorage.key(n);
        if (!key || !key.startsWith(historyPrefix)) continue;
        try { const a = JSON.parse(localStorage.getItem(key)); if (validAttempt(a)) result.set(a.id, a); } catch {}
      }
    } catch { storageFailed = true; }
    for (const [id, a] of memoryHistory) result.set(id, a);
    return [...result.values()].sort((a, b) => a.start - b.start || a.id.localeCompare(b.id));
  }

  function saveAttempt() {
    if (!s) return;
    const now = Date.now(), a = JSON.parse(JSON.stringify(s));
    a.updatedAt = now; a.stage = stage; a.questionIndex = i; a.schemaVersion = 1;
    a.status = s.status || (stage === 'dead' ? 'timeout' : 'incomplete');
    a.pausedMs = pausedTotal + (pausedAt ? now - pausedAt : 0);
    a.elapsedSeconds = Math.max(0, Math.round(((s.end || now) - s.start - a.pausedMs) / 1000));
    a.left = remaining(); 
    a.score = Math.round(a.records.filter(r => r.firstCorrect === true).length / a.records.length * 100);
    if (stage === 'question' && stepStarted && a.records[i]) a.records[i].seconds += (now - stepStarted) / 1000;
    memoryHistory.set(a.id, a);
    try { localStorage.setItem(historyPrefix + a.id, JSON.stringify(a)); storageFailed = false; } catch { storageFailed = true; }
  }

  window.addEventListener('pagehide', saveAttempt);
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') saveAttempt(); });
  setInterval(() => { if (s && stage !== 'home' && stage !== 'finish') saveAttempt(); }, 5000);

  function remaining() {
    if (pausedAt) return Math.max(0, Math.ceil((deadline - pausedAt) / 1000));
    return Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
  }

  function format(n) { return `${Math.floor(n / 60).toString().padStart(2, '0')}:${(n % 60).toString().padStart(2, '0')}`; }
  function stop() { clearInterval(clock); clock = null; }

  function tick() {
    if (pausedAt) return;
    const timerEl = $('timer');
    if (timerEl) timerEl.textContent = format(remaining());
    if (!remaining() && stage !== 'dead' && stage !== 'finish') {
      account(); stage = 'dead'; stop(); saveAttempt();
      const m = modal();
      if (m) m.innerHTML = `<div class="modal-backdrop"><section class="death-modal"><h1>TIEMPO AGOTADO</h1><p>Se ha acabado el tiempo. Reintenta esta sala con un temporizador de 12 minutos.</p><button type="button" class="button button-primary" data-do="retry">Reintentar esta sala</button><button type="button" class="button button-secondary" data-do="end">Finalizar y descargar resultados</button></section></div>`;
    }
  }

  function startClock() { deadline = Date.now() + 720000; clock = setInterval(tick, 250); tick(); }
  function account() { if (stage === 'question' && stepStarted && s && s.records && s.records[i]) { s.records[i].seconds += (Date.now() - stepStarted) / 1000; stepStarted = 0; } }

  function math(tex) {
    const node = document.createElement('span');
    node.className = 'math-inline';
    node.textContent = tex;
    if (window.katex) katex.render(tex, node, { throwOnError: false });
    return node;
  }

  function latex(t) {
    return t.replaceAll('−', '-').replaceAll('½', String.raw`\frac{1}{2}`).replaceAll('Δ', String.raw`\Delta `).replaceAll('²', '^2').replaceAll('₁', '_1').replaceAll('₂', '_2').replaceAll('×', String.raw`\times `);
  }

  function fitFormulae() {
    const mainApp = app();
    if (!mainApp) return;
    mainApp.querySelectorAll('.formula > .math-inline,.answer-option > .math-inline').forEach(el => {
      el.style.fontSize = '';
      const box = el.parentElement, style = getComputedStyle(box), available = box.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight) - 12;
      const width = el.getBoundingClientRect().width;
      if (available > 0 && width > available) el.style.fontSize = (parseFloat(getComputedStyle(el).fontSize) * available / width) + 'px';
    });
  }

  window.addEventListener('resize', fitFormulae);

  function typeset() {
    const mainApp = app();
    if (!mainApp) return;
    requestAnimationFrame(fitFormulae);
    mainApp.querySelectorAll('.formula').forEach(el => {
      const t = el.textContent;
      el.replaceChildren();
      t.split(/\\qquad|\s{3,}/).forEach(part => el.append(math(latex(part.trim()))));
    });
    const qList = window.ESCAPE_QUESTIONS || [];
    mainApp.querySelectorAll('.answer-option').forEach(el => {
      if (qList[i] && ['cards', 'search'].includes(qList[i].type) && !qList[i].eulerSim) el.replaceChildren(math(latex(el.textContent)));
    });
    const walk = document.createTreeWalker(mainApp, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walk.nextNode()) nodes.push(walk.currentNode);
    nodes.filter(n => !n.parentElement.closest('.math-inline,.formula,svg,input,select')).forEach(n => {
      const parts = n.textContent.split(/(\b(?:y_{n\+1}|y_n|f\(t,y\)|h|O\(h\^2\)|O\(h\)|dy\/dt)\b)/);
      if (parts.length < 2) return;
      const f = document.createDocumentFragment();
      parts.forEach((t, j) => f.append(j % 2 ? math(t) : document.createTextNode(t)));
      n.replaceWith(f);
    });
  }

  function frame(body) {
    const mainApp = app();
    const qList = window.ESCAPE_QUESTIONS || [];
    if (!mainApp || !qList[i]) return;
    mainApp.innerHTML = `<section class="room-main" style="margin:38px auto;max-width:780px"><div class="room-kicker">SALA ${qList[i].room + 1} / 4 ·${titles[qList[i].room]} · PRE
