(() => {
  const app = document.getElementById('app'), modal = document.getElementById('modal-root');
  const questions = window.ESCAPE_QUESTIONS;
  const titles = ['Euler Explícito', 'Heun e Implícito', 'Estabilidad', 'RK y Diferencias Finitas'];
  const runes = ['E', 'U', 'L', 'ER'];
  let s = null, stage = 'home', i = 0, clock = null, deadline = 0, stepStarted = 0, order = [], focusBefore;
  const $ = id => document.getElementById(id), escape = x => String(x).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  let pausedAt = 0, pausedTotal = 0, hitUntil = 0;

  const historyPrefix = 'enchanted-energy:v1:' + location.pathname.replace(/index\.html$/, '') + ':attempt:';
  const memoryHistory = new Map(); let storageFailed = false;
  const identity = x => String(x || '').normalize('NFKC').trim().replace(/\s+/g, ' ').toLowerCase();

  function validAttempt(a) { return a && typeof a.id === 'string' && Number.isFinite(a.start) && Array.isArray(a.records) && typeof a.name === 'string' && typeof a.block === 'string'; }

  function readHistory() {
    const result = new Map();
    try {
      for (let n = 0; n < localStorage.length; n++) {
        const key = localStorage.key(n);
        if (!key || !key.startsWith(historyPrefix)) continue;
        try { const a = JSON.parse(localStorage.getItem(key)); if (validAttempt(a)) result.set(a.id, a); } catch { }
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
    a.left = remaining(); a.score = Math.round(a.records.filter(r => r.firstCorrect === true).length / a.records.length * 100);
    if (stage === 'question' && stepStarted && a.records[i]) a.records[i].seconds += (now - stepStarted) / 1000;
    memoryHistory.set(a.id, a);
    try { localStorage.setItem(historyPrefix + a.id, JSON.stringify(a)); storageFailed = false; } catch { storageFailed = true; }
  }

  for (const event of ['click', 'submit', 'change', 'drop']) document.addEventListener(event, () => queueMicrotask(saveAttempt), true);
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
    $('timer').textContent = format(remaining());
    if (!remaining() && stage !== 'dead' && stage !== 'finish') {
      account(); stage = 'dead'; stop(); saveAttempt();
      modal.innerHTML = `<div class="modal-backdrop"><section class="death-modal"><h1>TIEMPO AGOTADO</h1><p>Se ha acabado el tiempo. Reintenta esta sala con un temporizador fresco de 12 minutos.</p><button class="button button-primary" data-do="retry">Reintentar esta sala</button><button class="button button-secondary" data-do="end">Finalizar y descargar resultados</button></section></div>`;
    }
  }

  function startClock() { deadline = Date.now() + 720000; clock = setInterval(tick, 250); tick(); }
  function account() { if (stage === 'question' && stepStarted) { s.records[i].seconds += (Date.now() - stepStarted) / 1000; stepStarted = 0; } }

  function math(tex) {
    const node = document.createElement('span');
    node.className = 'math-inline';
    node.textContent = tex;
    if (window.katex) katex.render(tex, node, { throwOnError: false });
    return node;
  }

  function latex(t) {
    return t.replaceAll('−', '-').replaceAll('½', String.raw`rac{1}{2}`).replaceAll('Δ', String.raw`\Delta `).replaceAll('²', '^2').replaceAll('₁', '_1').replaceAll('₂', '_2').replaceAll('×', String.raw`	imes `);
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
      if (['cards', 'search'].includes(questions[i].type) && !questions[i].eulerSim) el.replaceChildren(math(latex(el.textContent)));
    });
    const walk = document.createTreeWalker(app, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walk.nextNode()) nodes.push(walk.currentNode);
    nodes.filter(n => !n.parentElement.closest('.math-inline,.formula,svg,input,select')).forEach(n => {
      const parts = n.textContent.split(/(\b(?:y_{n\+1}|y_n|f\(t,y\)|h|O\(h\^2\)|O\(h\)|dy/dt)\b)/);
      if (parts.length < 2) return;
      const f = document.createDocumentFragment();
      parts.forEach((t, j) => f.append(j % 2 ? math(t) : document.createTextNode(t)));
      n.replaceWith(f);
    });
  }

  function frame(body) {
    app.innerHTML = `<section class="room-main" style="margin:38px auto;max-width:780px"><div class="room-kicker">SALA ${questions[i].room + 1} / 4 · ${titles[questions[i].room]} · PREGUNTA ${i + 1} / ${questions.length}</div>${body}</section>`;
    typeset();
  }

  function home() {
    saveAttempt(); s = null; stop(); modal.innerHTML = ''; stage = 'home'; $('timer-chip').hidden = true;
    app.innerHTML = `<section class="hero"><div><div class="eyebrow">ESCAPE ROOM DE MÉTODOS NUMÉRICOS</div><h1>Manual Encantado de<br><em>IVPs y ODEs</em></h1><p class="hero-lead">Cuatro salas. Métodos de Euler, Heun, Estabilidad y RK4. Encuentra las runas y escapa.</p><form id="entry"><label>Nombre y Apellido<input name="participant" required maxlength="100" autocomplete="name"></label><label>Curso / Grupo<input name="block" required maxlength="60" placeholder="Métodos Numéricos - G1"></label><p class="lesson-footnote">Descarga tus resultados al finalizar y entrégalos a tu instructor.</p><p>12 minutos. Cada respuesta incorrecta resta 20 segundos. Tu puntaje se basa en la precisión del primer intento.</p><button class="button button-primary">Ingresar al manual →</button></form></div><div class="hero-art"><div class="orbit orbit-a"></div><div class="book"><div class="book-rune">∫</div><div class="book-title">MÉTODOS<br>NUMÉRICOS</div></div></div></section>`;
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

  // Inicializar objeto de sesión del estudiante
  s = {
    name, 
    block, 
    id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    start: Date.now(), 
    retries: 0, 
    penalty: 0, 
    finalErrors: 0,
    records: questions.map((q, j) => ({ 
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
  
  // Mostrar temporizador en el topbar
  const timerChip = $('timer-chip');
  if (timerChip) {
    timerChip.removeAttribute('hidden');
    $('timer').textContent = '12:00';
  }

  // Guardar estado inicial y cambiar de pantalla a la lección
  saveAttempt();
  lesson(); 
  startClock();
}
  function lesson() {
    account(); stage = 'lesson'; const q = questions[i];
    frame(`<div class="room-heading"><h1>${q.title}</h1></div><div class="lesson-card"><div class="lesson-label">NOTA DE CAMPO</div><p>${q.theory}</p><div class="formula">${q.formula}</div></div><div class="room-actions"><button class="button button-primary" data-do="question">Probar el candado →</button></div>`);
  }

  function question() {
    stage = 'question'; stepStarted = Date.now(); const q = questions[i];
    order = q.options ? q.options.map((text, index) => ({ text, index })).sort(() => Math.random() - .5) : [];
    let body = '';

    if (q.type === 'number') {
      body = '<form id="numeric"><label>Resultado numérico<input id="number" inputmode="decimal" required placeholder="Ingrese un valor (ej. 1.10)"></label><button class="button button-primary">Desbloquear</button></form>';
    } else if (q.type === 'dial') {
      body = `<label>Selecciona la respuesta<select id="dial">${order.map((o, n) => `<option value="${n}">${o.text}</option>`).join('')}</select></label><button class="button button-primary" data-do="dial">Desbloquear</button>`;
    } else if (q.type === 'search') {
      const spots = [[16, 22], [73, 20], [25, 75], [76, 70]].sort(() => Math.random() - .5);
      body = `<div class="formula-hunt dark-search" id="choices">${order.map((o, n) => `<button class="answer-option formula-card" style="left:${spots[n][0]}%;top:${spots[n][1]}%" data-do="answer" data-index="${n}">${o.text}</button>`).join('')}<div class="darkness"></div><div class="hunt-lens" aria-hidden="true">⌕</div></div>`;
    } else {
      body = `<div class="answer-list" id="choices">${order.map((o, n) => `<button class="answer-option" data-do="answer" data-index="${n}">${o.text}</button>`).join('')}</div>`;
    }

    frame(`<div class="challenge-card"><div class="challenge-label">${q.type === 'search' ? 'INSCRIPCIONES OCULTAS' : 'EL CANDADO'}</div><h1>${q.text}</h1>${q.type === 'search' ? '<div id="magnifier-controls"><p>Mueve el puntero para iluminar las opciones y selecciona la correcta.</p><button class="button button-secondary" data-do="lens">⌕ Usar lupa</button></div>' : ''}<div id="magnifier-controls"></div>${body}<p id="feedback" role="status" style="color:var(--gold);min-height:2em"></p><button class="back-link" data-do="lesson">← Revisar la nota de campo</button></div>`);

    if (q.eulerSim && window.mountEulerSimulation) {
      window.mountEulerSimulation($('magnifier-controls'), () => stage === 'question');
      const bank = document.createElement('p');
      bank.setAttribute('role', 'status');
      bank.style.color = '#e8c882';
      bank.textContent = 'Ajusta el slider de h para observar la acumulación del error de truncamiento.';
      $('choices').before(bank);
    }

    if (q.type === 'search') {
      const area = $('choices');
      area.addEventListener('pointermove', e => {
        if (!area.classList.contains('holding')) return;
        const r = area.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
        area.style.setProperty('--x', `${x}px`); area.style.setProperty('--y', `${y}px`);
        const lens = area.querySelector('.hunt-lens'); lens.style.left = `${x}px`; lens.style.top = `${y}px`;
      });
      area.addEventListener('focusin', e => {
        const r = e.target.getBoundingClientRect(), a = area.getBoundingClientRect(), x = r.left + r.width / 2 - a.left, y = r.top + r.height / 2 - a.top;
        area.classList.add('holding'); area.style.setProperty('--x', `${x}px`); area.style.setProperty('--y', `${y}px`);
      });
    }
  }

  function answer(value, correct) {
    if (stage !== 'question' || !remaining() || Date.now() < hitUntil) return;
    const r = s.records[i]; r.attempts++; r.responses.push(String(value));
    if (r.firstCorrect === null) r.firstCorrect = correct;
    if (!correct) {
      r.errors++; s.penalty += 20; deadline -= 20000; attack();
      $('feedback').textContent = `−20 segundos. ${questions[i].hint}`; tick(); return;
    }
    if (window.gameAudio) window.gameAudio.effect('success');
    account(); r.solved = true; stage = 'solved';
    const end = i === questions.length - 1 || questions[i + 1].room !== questions[i].room;
    frame(`<div class="reward-card"><div class="reward-seal">✦</div><h1>Candado abierto.</h1><p>${questions[i].solution}</p>${end ? `<p>Sala completada. Conserva esta runa:</p><div class="rune-reward">${runes[questions[i].room]}</div>` : ''}<button class="button button-primary" data-do="next">Continuar →</button></div>`);
  }

  function finalLock() {
    stage = 'final';
    frame(`<div class="final-card"><h1>La puerta final</h1><p>Combina las runas obtenidas en orden de sala.</p><div class="final-runes">${runes.map(x => `<span>${x}</span>`).join('')}</div><form id="exit"><label>Palabra de salida<input name="word" required autocomplete="off" placeholder="Ingresa la palabra completa"></label><button class="button button-primary">Desbloquear salida</button></form><p id="feedback" role="status"></p></div>`);
  }

  function finish(success) {
    account(); stop(); modal.innerHTML = ''; stage = 'finish'; s.end = Date.now();
    s.status = success ? 'escaped' : 'timeout'; s.left = remaining();
    s.score = Math.round(s.records.filter(r => r.firstCorrect === true).length / questions.length * 100);
    saveAttempt(); $('timer-chip').hidden = true;
    app.innerHTML = `<section class="ending"><div class="eyebrow">${success ? '¡HAS ESCAPADO!' : 'INTENTO FINALIZADO'}</div><h1>${escape(s.name)}</h1><p>${escape(s.block)}</p><h2>PUNTAJE FINAL: ${s.score}/100</h2><p>${s.records.filter(r => r.firstCorrect).length} / ${questions.length} correctas al primer intento<br>Tiempo transcurrido: ${format(Math.round((s.end - s.start - pausedTotal) / 1000))}<br>Tiempo restante: ${format(s.left)} · Reintentos: ${s.retries}</p><p>Descarga el archivo CSV y envíalo a tu profesor como comprobante.</p><button class="button button-primary" data-do="csv">Descargar resultados CSV ↓</button><p id="download-note" role="status"></p><button class="text-button" data-do="home">Nuevo participante</button></section>`;
  }

  function csv() {
    saveAttempt(); const history = readHistory().filter(a => identity(a.name) === identity(s.name) && identity(a.block) === identity(s.block));
    const fields = ['attempt_id', 'attempt_number', 'name', 'block', 'started_at', 'last_saved_at', 'ended_at', 'status', 'score_percent', 'elapsed_seconds', 'clock_remaining_seconds', 'penalty_seconds', 'room_retries', 'final_lock_errors', 'question', 'room', 'type', 'question_title', 'attempts', 'errors', 'first_attempt_correct', 'solved', 'question_seconds', 'submitted_responses', 'practice_errors', 'paused_seconds'];
    const safe = v => { let x = String(v ?? ''); if (/^[=+@\-\t\r]/.test(x)) x = "'" + x; return '"' + x.replace(/"/g, '""') + '"'; };
    const rows = history.flatMap((a, n) => a.records.map(r => [a.id, n + 1, a.name, a.block, new Date(a.start).toISOString(), new Date(a.updatedAt || a.start).toISOString(), a.end ? new Date(a.end).toISOString() : '', a.status, a.score, a.elapsedSeconds, a.left, a.penalty, a.retries, a.finalErrors, r.question, r.room, r.type, r.title, r.attempts, r.errors, r.firstCorrect === null ? '' : r.firstCorrect, r.solved, Number(r.seconds || 0).toFixed(2), JSON.stringify(r.responses || []), r.practiceErrors || 0, Math.round((a.pausedMs || 0) / 1000)]));
    const slug = x => x.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9_-]+/g, '_').slice(0, 70);
    const date = new Date(), localDate = [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-');
    const unique = crypto.randomUUID ? crypto.randomUUID() : Date.now() + '-' + Math.random().toString(36).slice(2);
    const filename = `escape_room_ivp_${localDate}_${slug(s.block)}_${slug(s.name)}_${unique}.csv`;
    const url = URL.createObjectURL(new Blob(['\ufeff' + [fields, ...rows].map(row => row.map(safe).join(',')).join('\r\n')], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a'); a.href = url; a.download = filename; document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 2000);
    $('download-note').textContent = `CSV preparado: ${history.length} intento(s).`;
  }

  function attack() {
    if (window.gameAudio) window.gameAudio.effect('error');
    hitUntil = Date.now() + 1500;
    const layer = document.createElement('div'); layer.className = 'spell-attack';
    layer.style.setProperty('--attack-color', ['#55caff', '#b980ff', '#ff5252', '#c4d1dd'][questions[i].room]);
    layer.innerHTML = '<div class="cracks">╲ ╱<br>╱ ╲</div><strong>¡Ataque de error! −20 segundos</strong>';
    document.body.append(layer); setTimeout(() => layer.remove(), 1500);
  }

  document.addEventListener('submit', e => {
    e.preventDefault(); if (Date.now() < hitUntil) return;
    if (e.target.id === 'entry') begin(e.target);
    if (e.target.id === 'numeric') {
      const raw = $('number').value.trim().replace(',', '.');
      if (!raw || !Number.isFinite(Number(raw))) { $('feedback').textContent = 'Ingresa un valor numérico válido.'; return; }
      answer(raw, Math.abs(Number(raw) - questions[i].value) < 0.0005);
    }
    if (e.target.id === 'exit') {
      if (e.target.elements.word.value.trim().toUpperCase() === 'EULER') finish(true);
      else {
        s.finalErrors++; s.penalty += 20; deadline -= 20000; attack();
        $('feedback').textContent = '−20 segundos. Une las runas en orden de las salas.'; tick();
      }
    }
  });

  document.addEventListener('click', e => {
    if (Date.now() < hitUntil) return;
    const b = e.target.closest('[data-do]'); if (!b) return;
    switch (b.dataset.do) {
      case 'question': question(); break;
      case 'lesson': lesson(); break;
      case 'answer': { const o = order[Number(b.dataset.index)]; answer(o.text, o.index === 0); break; }
      case 'dial': { const o = order[Number($('dial').value)]; answer(o.text, o.index === 0); break; }
      case 'lens': $('choices').classList.add('holding'); b.textContent = '⌕ Lupa equipada — muévela sobre una tarjeta'; break;
      case 'next': if (i < questions.length - 1) { i++; lesson(); } else finalLock(); break;
      case 'retry': modal.innerHTML = ''; s.retries++; while (i > 0 && questions[i - 1].room === questions[i].room) i--; lesson(); startClock(); break;
      case 'end': finish(false); break;
      case 'csv': csv(); break;
      case 'home': home(); break;
    }
  });

  if (window.gameAudio && $('sound-toggle')) window.gameAudio.init($('sound-toggle'));
  document.querySelector('.brand').addEventListener('click', e => e.preventDefault());
  home();
})();
game.js
Mostrando game.js.
