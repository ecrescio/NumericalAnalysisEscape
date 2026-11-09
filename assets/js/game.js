(() => {
  const app = document.getElementById('app'), modal = document.getElementById('modal-root');
  const questions = window.ESCAPE_QUESTIONS;
  const titles = ['Euler Explícito', 'Heun e Implícito', 'Estabilidad', 'RK y Diferencias Finitas'];
  const runes = ['E', 'U', 'L', 'ER'];
  
  let s = null, stage = 'home', i = 0, clock = null, deadline = 0, stepStarted = 0, order = [];
  let pausedAt = 0, pausedTotal = 0, hitUntil = 0;

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
      modal.innerHTML = `<div class="modal-backdrop"><section class="death-modal"><h1>TIEMPO AGOTADO</h1><p>Se ha acabado el tiempo. Reintenta esta sala con un temporizador de 12 minutos.</p><button type="button" class="button button-primary" data-do="retry">Reintentar esta sala</button><button type="button" class="button button-secondary" data-do="end">Finalizar y descargar resultados</button></section></div>`;
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
    app.querySelectorAll('.formula > .math-inline,.answer-option > .math-inline').forEach(el => {
      el.style.fontSize = '';
      const box = el.parentElement, style = getComputedStyle(box), available = box.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight) - 12;
      const width = el.getBoundingClientRect().width;
      if (available > 0 && width > available) el.style.fontSize = (parseFloat(getComputedStyle(el).fontSize) * available / width) + 'px';
    });
  }

  window.addEventListener('resize', fitFormulae);

  function typeset() {
    requestAnimationFrame(fitFormulae);
    app.querySelectorAll('.formula').forEach(el => {
      const t = el.textContent;
      el.replaceChildren();
      t.split(/\\qquad|\s{3,}/).forEach(part => el.append(math(latex(part.trim()))));
    });
    app.querySelectorAll('.answer-option').forEach(el => {
      const qList = window.ESCAPE_QUESTIONS || questions;
      if (['cards', 'search'].includes(qList[i].type) && !qList[i].eulerSim) el.replaceChildren(math(latex(el.textContent)));
    });
    const walk = document.createTreeWalker(app, NodeFilter.SHOW_TEXT);
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
    const qList = window.ESCAPE_QUESTIONS || questions;
    app.innerHTML = `<section class="room-main" style="margin:38px auto;max-width:780px"><div class="room-kicker">SALA ${qList[i].room + 1} / 4 · ${titles[qList[i].room]} · PREGUNTA ${i + 1} / ${qList.length}</div>${body}</section>`;
    typeset();
  }

  function home() {
    saveAttempt(); 
    s = null; 
    stop(); 
    if (modal) modal.innerHTML = ''; 
    stage = 'home'; 
    const timerChip = $('timer-chip');
    if (timerChip) timerChip.hidden = true;

    app.innerHTML = `
      <section class="hero" style="display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 60vh; padding: 20px; text-align: center;">
        <div style="max-width: 500px; width: 100%; background: #1a1829; padding: 30px; border-radius: 12px; border: 1px solid #322c4a; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
          <div class="eyebrow" style="color: #e8c882; font-weight: bold; letter-spacing: 1px; font-size: 0.85em; margin-bottom: 10px; text-transform: uppercase;">ESCAPE ROOM DE MÉTODOS NUMÉRICOS</div>
          <h1 style="margin: 0 0 10px 0; font-size: 1.8em; color: #fff;">Manual Encantado de<br><em style="color: #b8a6ff; font-style: normal;">IVPs y ODEs</em></h1>
          <p class="hero-lead" style="color: #a7a2b0; font-size: 0.9em; margin-bottom: 20px;">Cuatro salas. Métodos de Euler, Heun, Estabilidad y RK4. Encuentra las runas y escapa.</p>
          
          <form id="entry" style="display: flex; flex-direction: column; gap: 15px; text-align: left;">
            <label style="display: flex; flex-direction: column; gap: 5px; color: #ddd; font-size: 0.9em;">
              <strong>Nombre y Apellido:</strong>
              <input name="participant" required maxlength="100" autocomplete="name" placeholder="Ej. Ana García" style="padding: 12px; border-radius: 6px; border: 1px solid #443c63; background: #0f0d17; color: #fff; font-size: 1em; width: 100%; box-sizing: border-box;">
            </label>
            <label style="display: flex; flex-direction: column; gap: 5px; color: #ddd; font-size: 0.9em;">
              <strong>Curso / Grupo:</strong>
              <input name="block" required maxlength="60" placeholder="Ej. Métodos Numéricos - G1" style="padding: 12px; border-radius: 6px; border: 1px solid #443c63; background: #0f0d17; color: #fff; font-size: 1em; width: 100%; box-sizing: border-box;">
            </label>
            <p style="font-size: 0.85em; color: #e8c882; margin: 5px 0 0 0; background: rgba(232, 200, 130, 0.1); padding: 10px; border-radius: 6px; border-left: 3px solid #e8c882;">⏱ 12 minutos. Cada respuesta incorrecta resta 20 segundos.</p>
            <button type="submit" class="button button-primary" style="padding: 14px; font-weight: bold; background: #73dcca; color: #0f0d17; border: none; border-radius: 6px; cursor: pointer; font-size: 1em; margin-top: 5px;">Ingresar al manual →</button>
          </form>
        </div>
      </section>
    `;
  }

  function begin(form) {
    pausedAt = 0; 
    pausedTotal = 0; 
    hitUntil = 0;

    const nameInput = form.querySelector('[name="participant"]');
    const blockInput = form.querySelector('[name="block"]');

    if (!nameInput || !blockInput) return;

    const name = nameInput.value.trim();
    const block = blockInput.value.trim();

    if (!name || !block) return;

    const qList = window.ESCAPE_QUESTIONS || questions;
    if (!qList || qList.length === 0) {
      alert("Error: No se han encontrado las preguntas de rooms.js");
      return;
    }

    s = {
      name, 
      block, 
      id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      start: Date.now(), 
      retries: 0, 
      penalty: 0, 
      finalErrors: 0,
      records: qList.map((q, j) => ({ 
        question: j + 1, 
        room: q.room + 1, 
        type: q.type, 
        title: q.title, 
        attempts: 0, 
        errors: 0, 
        firstCorrect: null, 
        solved: false, 
        seconds: 0, 
        responses: [] 
      }))
    };

    i = 0; 
    const timerChip = $('timer-chip');
    if (timerChip) {
      timerChip.removeAttribute('hidden');
      $('timer').textContent = '12:00';
    }

    lesson(); 
    startClock(); 
    saveAttempt();
  }

  // Hacer la función de inicio accesible globalmente
  window.beginGame = begin;

  function lesson() {
    account(); stage = 'lesson'; 
    const qList = window.ESCAPE_QUESTIONS || questions;
    const q = qList[i];
    frame(`<div class="room-heading"><h1>${q.title}</h1></div><div class="lesson-card"><div class="lesson-label">NOTA DE CAMPO</div><p>${q.theory}</p><div class="formula">${q.formula}</div></div><div class="room-actions"><button type="button" class="button button-primary" data-do="question">Probar el candado →</button></div>`);
  }

  function question() {
    stage = 'question'; stepStarted = Date.now(); 
    const qList = window.ESCAPE_QUESTIONS || questions;
    const q = qList[i];
    order = q.options ? q.options.map((text, index) => ({ text, index })).sort(() => Math.random() - .5) : [];
    let body = '';

    if (q.type === 'number') {
      body = '<form id="numeric"><label>Resultado numérico<input id="number" inputmode="decimal" required placeholder="Ingrese un valor (ej. 1.10)"></label><button type="submit" class="button button-primary">Desbloquear</button></form>';
    } else if (q.type === 'dial') {
      body = `<label>Selecciona la respuesta<select id="dial">${order.map((o, n) => `<option value="${n}">${o.text}</option>`).join('')}</select></label><button type="button" class="button button-primary" data-do="dial">Desbloquear</button>`;
    } else if (q.type === 'search') {
      const spots = [[16, 22], [73, 20], [25, 75], [76, 70]].sort(() => Math.random() - .5);
      body = `<div class="formula-hunt dark-search" id="choices">${order.map((o, n) => `<button type="button" class="answer-option formula-card" style="left:${spots[n][0]}%;top:${spots[n][1]}%" data-do="answer" data-index="${n}">${o.text}</button>`).join('')}<div class="darkness"></div><div class="hunt-lens" aria-hidden="true">⌕</div></div>`;
    } else {
      body = `<div class="answer-list" id="choices">${order.map((o, n) => `<button type="button" class="answer-option" data-do="answer" data-index="${n}">${o.text}</button>`).join('')}</div>`;
    }

    frame(`<div class="challenge-card"><div class="challenge-label">${q.type === 'search
