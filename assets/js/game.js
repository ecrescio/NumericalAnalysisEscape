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
    if (!t) return '';
    return t.replaceAll('−', '-')
            .replaceAll('½', String.raw`\frac{1}{2}`)
            .replaceAll('Δ', String.raw`\Delta `)
            .replaceAll('²', '^2')
            .replaceAll('₁', '_1')
            .replaceAll('₂', '_2')
            .replaceAll('×', String.raw`\times `);
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

  // Detecta si una opción de respuesta es una fórmula matemática en lugar de una oración en español
  function isMathOption(txt) {
    return /[_^\\]|\\frac|\\approx|^[a-zA-Z0-9\s=+\-*/().<>]+$/.test(txt.trim()) && txt.trim().split(' ').length <= 8;
  }

  function typeset() {
    const mainApp = app();
    if (!mainApp) return;
    requestAnimationFrame(fitFormulae);

    // 1. Renderizar bloques .formula
    mainApp.querySelectorAll('.formula').forEach(el => {
      if (el.dataset.katexRendered) return;
      const t = el.textContent;
      el.replaceChildren();
      t.split(/\\qquad|\s{3,}/).forEach(part => el.append(math(latex(part.trim()))));
      el.dataset.katexRendered = "true";
    });

    // 2. Renderizar opciones de respuesta matemáticas en cualquier tipo de pregunta
    mainApp.querySelectorAll('.answer-option').forEach(el => {
      if (el.dataset.katexRendered) return;
      const txt = el.textContent.trim();
      if (isMathOption(txt)) {
        el.replaceChildren(math(latex(txt)));
        el.dataset.katexRendered = "true";
      }
    });

  
    mainApp.querySelectorAll('h1, p, label, .methods-simulation span').forEach(el => {
      if (el.dataset.katexRendered || el.querySelector('input, select')) return;
      const html = el.innerHTML;
      if (html.includes('$')) {
        el.innerHTML = html.replace(/\$([^$]+)\$/g, (_, formula) => {
          const span = document.createElement('span');
          span.className = 'math-inline';
          if (window.katex) {
            katex.render(latex(formula), span, { throwOnError: false });
          } else {
            span.textContent = formula;
          }
          return span.outerHTML;
        });
        el.dataset.katexRendered = "true";
      }
    });
  }

  // Simulación interactiva integrada (garantiza que siempre aparezca en Pregunta 7)
  function renderEulerSim(anchor) {
    if (!anchor) return;
    if (window.mountEulerSimulation) {
      window.mountEulerSimulation(anchor, () => stage === 'question');
      return;
    }
    
    const panel = document.createElement('section');
    panel.className = 'euler-simulation';
    panel.innerHTML = `
      <div style="background: #181623; border: 1px solid #302a45; padding: 16px; border-radius: 8px; margin-bottom: 20px; color: #e1dfeb; text-align: left;">
        <p style="margin-top:0;"><strong>Simulación IVP:</strong> $\\frac{dy}{dt} = -y$, con $y(0) = 1$. Compara la solución exacta $y(t) = e^{-t}$ con el Método de Euler Explícito.</p>
        <div class="euler-controls" style="margin: 12px 0; display: flex; gap: 15px; align-items: center; color: #fff;">
          <label style="display: flex; align-items: center; gap: 10px; cursor: pointer;">Tamaño de paso (h): 
            <input class="euler-h" type="range" min="0.05" max="0.8" step="0.05" value="0.2" style="cursor: pointer; width: 180px;">
            <span class="h-val" style="font-weight: bold; color: #e8c882; min-width: 40px; display: inline-block;">0.20</span>
          </label>
        </div>
        <svg class="euler-scene" viewBox="0 0 500 240" role="img" aria-label="Comparación de Euler vs Solución Exacta" style="width: 100%; background: #0f0d17; border-radius: 6px; display: block;">
          <path d="M 40 20 V 200 H 480" fill="none" stroke="#555" stroke-width="2"/>
          <text x="475" y="225" fill="#aaa" font-size="12">t</text>
          <text x="15" y="25" fill="#aaa" font-size="12">y(t)</text>
          <path class="curve-exact" fill="none" stroke="#73dcca" stroke-width="2.5"/>
          <path class="curve-euler" fill="none" stroke="#ff6270" stroke-width="2" stroke-dasharray="4 4"/>
          <g class="euler-nodes"></g>
        </svg>
        <div style="display: flex; gap: 20px; font-size: 13px; margin-top: 10px;">
          <span style="color: #73dcca; font-weight: 500;">― Solución Exacta ($e^{-t}$)</span>
          <span style="color: #ff6270; font-weight: 500;">- - Método de Euler</span>
        </div>
      </div>
    `;
    anchor.before(panel);

    const pathExact = panel.querySelector('.curve-exact');
    const pathEuler = panel.querySelector('.curve-euler');
    const nodesGroup = panel.querySelector('.euler-nodes');
    const sliderH = panel.querySelector('.euler-h');
    const spanH = panel.querySelector('.h-val');

    const mapX = t => 40 + (t / 4) * 420;
    const mapY = y => 200 - (y / 1.2) * 170;

    let dExact = '';
    for (let k = 0; k <= 100; k++) {
      const t = (k / 100) * 4;
      const y = Math.exp(-t);
      dExact += `${k === 0 ? 'M' : 'L'} ${mapX(t)} ${mapY(y)} `;
    }
    pathExact.setAttribute('d', dExact);

    function updateEuler() {
      const h = parseFloat(sliderH.value);
      spanH.textContent = h.toFixed(2);
      let t = 0, y = 1.0;
      let dEuler = `M ${mapX(t)} ${mapY(y)}`;
      nodesGroup.innerHTML = `<circle cx="${mapX(t)}" cy="${mapY(y)}" r="4" fill="#ff6270"/>`;

      while (t < 4 - 1e-9) {
        y = y + h * (-y);
        t = t + h;
        const px = mapX(t), py = mapY(y);
        dEuler += ` L ${px} ${py}`;
        const node = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        node.setAttribute('cx', px);
        node.setAttribute('cy', py);
        node.setAttribute('r', '4');
        node.setAttribute('fill', '#ff6270');
        nodesGroup.appendChild(node);
      }
      pathEuler.setAttribute('d', dEuler);
    }

    sliderH.addEventListener('input', updateEuler);
    updateEuler();
  }
  // Simulación interactiva táctil integrada (Pregunta 10)
  // Simulación interactiva táctil comparativa (Pregunta 10: Euler vs Heun vs RK4)
  function renderMethodsSim(anchor) {
    if (!anchor) return;

    const panel = document.createElement('section');
    panel.className = 'methods-simulation';
    panel.innerHTML = `
      <div style="background: #181623; border: 1px solid #302a45; padding: 16px; border-radius: 8px; margin-bottom: 20px; color: #e1dfeb; text-align: left;">
        <p style="margin-top:0; font-size: 0.9em;"><strong>Comparador Visual ($dy/dt = 2y, \\; y(0)=1, \\; h=0.5$):</strong> Haz clic o toca el gráfico para proyectar los tres métodos en $t_1 = 0.5$.</p>
        
        <div class="touch-canvas-wrapper" style="position: relative; cursor: pointer; user-select: none;">
          <svg class="methods-scene" viewBox="0 0 520 270" role="img" aria-label="Comparación visual entre Euler, Heun y RK4" style="width: 100%; background: #0f0d17; border: 1px dashed #443c63; border-radius: 6px; display: block;">
            <!-- Ejes y línea guía en t = 0.5 -->
            <line x1="55" y1="230" x2="490" y2="230" stroke="#555" stroke-width="2"/>
            <line x1="55" y1="20" x2="55" y2="230" stroke="#555" stroke-width="2"/>
            <line x1="335" y1="20" x2="335" y2="230" stroke="#333" stroke-dasharray="4 4"/>
            
            <!-- Etiquetas de ejes -->
            <text x="50" y="250" fill="#aaa" font-size="12">t₀ = 0</text>
            <text x="320" y="250" fill="#e8c882" font-size="12" font-weight="bold">t₁ = 0.5</text>
            <text x="15" y="169" fill="#aaa" font-size="11">y=1.0</text>
            <text x="15" y="104" fill="#aaa" font-size="11">y=2.0</text>
            <text x="15" y="39" fill="#aaa" font-size="11">y=3.0</text>

            <!-- Curva Exacta y = e^(2t) -->
            <path class="exact-exp" fill="none" stroke="#73dcca" stroke-width="2.5"/>
            <circle cx="335" cy="53.3" r="4" fill="#73dcca"/>
            <text x="345" y="42" fill="#73dcca" font-size="11" font-weight="bold">Exacta: 2.718</text>

            <!-- Punto Inicial (0, 1) -> X=55, Y=165 -->
            <circle cx="55" cy="165" r="5" fill="#fff"/>

            <!-- Grupo de los 3 métodos que se revela al tocar -->
            <g class="mystery-reveal" style="opacity: 0; transition: opacity 0.4s ease;">
              <!-- 1. RK4: y1 = 2.708 -> Y = 230 - 2.708*65 = 54.0 -->
              <line x1="55" y1="165" x2="335" y2="54.0" stroke="#55caff" stroke-width="2" stroke-dasharray="5 3"/>
              <circle cx="335" cy="54.0" r="6" fill="#55caff" stroke="#0f0d17" stroke-width="1.5"/>
              <text x="345" y="61" fill="#55caff" font-size="12" font-weight="bold">RK4: 2.708</text>

              <!-- 2. Heun: y1 = 2.500 -> Y = 230 - 2.500*65 = 67.5 -->
              <line x1="55" y1="165" x2="335" y2="67.5" stroke="#e8c882" stroke-width="2" stroke-dasharray="5 3"/>
              <circle cx="335" cy="67.5" r="6" fill="#e8c882" stroke="#0f0d17" stroke-width="1.5"/>
              <text x="345" y="78" fill="#e8c882" font-size="12" font-weight="bold">Heun: 2.500</text>

              <!-- 3. Euler Explícito: y1 = 2.000 -> Y = 230 - 2.000*65 = 100.0 -->
              <line x1="55" y1="165" x2="335" y2="100.0" stroke="#ff6270" stroke-width="2" stroke-dasharray="5 3"/>
              <circle cx="335" cy="100.0" r="6" fill="#ff6270" stroke="#0f0d17" stroke-width="1.5"/>
              <text x="345" y="105" fill="#ff6270" font-size="12" font-weight="bold">Euler: 2.000</text>
            </g>
          </svg>

          <div class="tap-overlay" style="position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; background: rgba(15, 13, 23, 0.65); border-radius: 6px; transition: opacity 0.3s;">
            <span style="background: #e8c882; color: #0f0d17; padding: 10px 18px; border-radius: 20px; font-weight: bold; font-size: 0.9em; box-shadow: 0 4px 15px rgba(0,0,0,0.5);">👆 Toca aquí para proyectar Euler, Heun y RK4</span>
          </div>
        </div>

        <div style="display: flex; flex-wrap: wrap; gap: 16px; font-size: 12.5px; margin-top: 10px;">
          <span style="color: #73dcca; font-weight: 600;">― Exacta ($e^{2t}$)</span>
          <span style="color: #55caff; font-weight: 600;">● RK4 $O(h^4)$</span>
          <span style="color: #e8c882; font-weight: 600;">● Heun $O(h^2)$</span>
          <span style="color: #ff6270; font-weight: 600;">● Euler $O(h)$</span>
        </div>
      </div>
    `;

    anchor.before(panel);

    // Dibujar curva exacta y = e^(2t) para t en [0, 0.58]
    // Escala: X = 55 + t * 560 (t=0.5 -> X=335) | Y = 230 - y * 65 (y=1 -> Y=165)
    const pathExact = panel.querySelector('.exact-exp');
    let d = '';
    for (let k = 0; k <= 60; k++) {
      const t = (k / 60) * 0.58;
      const y = Math.exp(2 * t);
      const px = 55 + t * 560;
      const py = 230 - y * 65;
      d += `${k === 0 ? 'M' : 'L'} ${px.toFixed(1)} ${py.toFixed(1)} `;
    }
    pathExact.setAttribute('d', d);

    // Evento táctil / clic para revelar los tres métodos
    const wrapper = panel.querySelector('.touch-canvas-wrapper');
    const overlay = panel.querySelector('.tap-overlay');
    const reveal = panel.querySelector('.mystery-reveal');

    wrapper.addEventListener('click', () => {
      overlay.style.opacity = '0';
      overlay.style.pointerEvents = 'none';
      reveal.style.opacity = '1';
      if (window.gameAudio) window.gameAudio.effect('spell');
    });
  }

  function home() {
    saveAttempt(); 
    s = null; 
    stop(); 
    const m = modal();
    if (m) m.innerHTML = ''; 
    stage = 'home'; 
    const timerChip = $('timer-chip');
    if (timerChip) timerChip.hidden = true;

    const mainApp = app();
    if (!mainApp) return;

    mainApp.innerHTML = `
      <section class="hero" style="display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 20px; text-align: center; width: 100%;">
        <div style="max-width: 480px; width: 100%; background: #1a1829; padding: 30px; border-radius: 12px; border: 1px solid #322c4a; box-shadow: 0 10px 30px rgba(0,0,0,0.5); box-sizing: border-box;">
          <div class="eyebrow" style="color: #e8c882; font-weight: bold; letter-spacing: 1px; font-size: 0.85em; margin-bottom: 10px; text-transform: uppercase;">ESCAPE ROOM DE MÉTODOS NUMÉRICOS</div>
          <h1 style="margin: 0 0 10px 0; font-size: 1.8em; color: #fff;">Manual Encantado de<br><em style="color: #b8a6ff; font-style: normal;">IVPs y ODEs</em></h1>
          <p class="hero-lead" style="color: #a7a2b0; font-size: 0.9em; margin-bottom: 20px;">Cuatro salas. Métodos de Euler, Heun, Estabilidad y RK4. Encuentra las runas y escapa.</p>
          
          <form id="entry" onsubmit="window.submitEntryForm(event)" style="display: flex; flex-direction: column; gap: 15px; text-align: left;">
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

    const qList = window.ESCAPE_QUESTIONS || [];
    if (qList.length === 0) {
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

  window.submitEntryForm = function(e) {
    if (e) e.preventDefault();
    const form = document.getElementById('entry');
    if (form) begin(form);
  };

  function lesson() {
    account(); stage = 'lesson'; 
    const qList = window.ESCAPE_QUESTIONS || [];
    const q = qList[i];
    if (!q) return;
    frame(`<div class="room-heading"><h1>${q.title}</h1></div><div class="lesson-card"><div class="lesson-label">NOTA DE CAMPO</div><p>${q.theory}</p><div class="formula">${q.formula}</div></div><div class="room-actions"><button type="button" class="button button-primary" data-do="question">Probar el candado →</button></div>`);
  }

  function question() {
    stage = 'question'; stepStarted = Date.now(); 
    const qList = window.ESCAPE_QUESTIONS || [];
    const q = qList[i];
    if (!q) return;
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

    frame(`<div class="challenge-card"><div class="challenge-label">${q.type === 'search' ? 'INSCRIPCIONES OCULTAS' : 'EL CANDADO'}</div><h1>${q.text}</h1>${q.type === 'search' ? '<div id="magnifier-controls"><p>Mueve el puntero para iluminar las opciones y selecciona la correcta.</p><button type="button" class="button button-secondary" data-do="lens">⌕ Usar lupa</button></div>' : '<div id="magnifier-controls"></div>'}${body}<p id="feedback" role="status" style="color:var(--gold);min-height:2em"></p><button type="button" class="back-link" data-do="lesson">← Revisar la nota de campo</button></div>`);

    if (q.eulerSim) {
      renderEulerSim($('magnifier-controls'));
    }
    if (q.methodsSim) {
      renderMethodsSim($('magnifier-controls'));
    }
    if (q.methodsSim && window.mountMethodsComparison) {
      window.mountMethodsComparison($('magnifier-controls'));
    }
    if (q.type === 'search') {
      const area = $('choices');
      if (area) {
        area.addEventListener('pointermove', e => {
          if (!area.classList.contains('holding')) return;
          const r = area.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
          area.style.setProperty('--x', `${x}px`); area.style.setProperty('--y', `${y}px`);
          const lens = area.querySelector('.hunt-lens'); 
          if (lens) { lens.style.left = `${x}px`; lens.style.top = `${y}px`; }
        });
        area.addEventListener('focusin', e => {
          const r = e.target.getBoundingClientRect(), a = area.getBoundingClientRect(), x = r.left + r.width / 2 - a.left, y = r.top + r.height / 2 - a.top;
          area.classList.add('holding'); area.style.setProperty('--x', `${x}px`); area.style.setProperty('--y', `${y}px`);
        });
      }
    }

    typeset();
  }

  function answer(value, correct) {
    if (stage !== 'question' || !remaining() || Date.now() < hitUntil) return;
    const r = s.records[i]; r.attempts++; r.responses.push(String(value));
    if (r.firstCorrect === null) r.firstCorrect = correct;
    
    const qList = window.ESCAPE_QUESTIONS || [];
    
    if (!correct) {
      r.errors++; s.penalty += 20; deadline -= 20000; attack();
      $('feedback').textContent = `−20 segundos. ${qList[i].hint}`; tick(); return;
    }
    if (window.gameAudio) window.gameAudio.effect('success');
    account(); r.solved = true; stage = 'solved';
    const end = i === qList.length - 1 || qList[i + 1].room !== qList[i].room;
    frame(`<div class="reward-card"><div class="reward-seal">✦</div><h1>Candado abierto.</h1><p>${qList[i].solution}</p>${end ? `<p>Sala completada. Conserva esta runa:</p><div class="rune-reward">${runes[qList[i].room]}</div>` : ''}<button type="button" class="button button-primary" data-do="next">Continuar →</button></div>`);
  }

  function finalLock() {
    stage = 'final';
    frame(`<div class="final-card"><h1>La puerta final</h1><p>Combina las runas obtenidas en orden de sala.</p><div class="final-runes">${runes.map(x => `<span>${x}</span>`).join('')}</div><form id="exit"><label>Palabra de salida<input name="word" required autocomplete="off" placeholder="Ingresa la palabra completa"></label><button type="submit" class="button button-primary">Desbloquear salida</button></form><p id="feedback" role="status"></p></div>`);
  }

  function finish(success) {
    account(); stop(); 
    const m = modal();
    if (m) m.innerHTML = ''; 
    stage = 'finish'; s.end = Date.now();
    s.status = success ? 'escaped' : 'timeout'; s.left = remaining();
    const qList = window.ESCAPE_QUESTIONS || [];
    s.score = Math.round(s.records.filter(r => r.firstCorrect === true).length / qList.length * 100);
    saveAttempt(); $('timer-chip').hidden = true;
    
    const mainApp = app();
    if (!mainApp) return;

    mainApp.innerHTML = `<section class="ending"><div class="eyebrow">${success ? '¡HAS ESCAPADO!' : 'INTENTO FINALIZADO'}</div><h1>${escape(s.name)}</h1><p>${escape(s.block)}</p><h2>PUNTAJE FINAL: ${s.score}/100</h2><p>${s.records.filter(r => r.firstCorrect).length} / ${qList.length} correctas al primer intento<br>Tiempo transcurrido: ${format(Math.round((s.end - s.start - pausedTotal) / 1000))}<br>Tiempo restante: ${format(s.left)} · Reintentos: ${s.retries}</p><p>Descarga el archivo CSV y envíalo a tu profesor como comprobante.</p><button type="button" class="button button-primary" data-do="csv">Descargar resultados CSV ↓</button><p id="download-note" role="status"></p><button type="button" class="text-button" data-do="home">Nuevo participante</button></section>`;
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
    const qList = window.ESCAPE_QUESTIONS || [];
    layer.style.setProperty('--attack-color', ['#55caff', '#b980ff', '#ff5252', '#c4d1dd'][qList[i].room]);
    layer.innerHTML = '<div class="cracks">╲ ╱<br>╱ ╲</div><strong>¡Ataque de error! −20 segundos</strong>';
    document.body.append(layer); setTimeout(() => layer.remove(), 1500);
  }

  document.addEventListener('submit', e => {
    if (e.target.id === 'entry') {
      e.preventDefault();
      begin(e.target);
      return;
    }
    
    e.preventDefault();
    if (Date.now() < hitUntil) return;

    const qList = window.ESCAPE_QUESTIONS || [];

    if (e.target.id === 'numeric') {
      const raw = $('number').value.trim().replace(',', '.');
      if (!raw || !Number.isFinite(Number(raw))) { 
        $('feedback').textContent = 'Ingresa un valor numérico válido.'; 
        return; 
      }
      answer(raw, Math.abs(Number(raw) - qList[i].value) < 0.0005);
    }

    if (e.target.id === 'exit') {
      if (e.target.elements.word.value.trim().toUpperCase() === 'EULER') finish(true);
      else {
        s.finalErrors++; 
        s.penalty += 20; 
        deadline -= 20000; 
        attack();
        $('feedback').textContent = '−20 segundos. Une las runas en orden de las salas.'; 
        tick();
      }
    }
  });

  document.addEventListener('click', e => {
    if (Date.now() < hitUntil) return;
    const b = e.target.closest('[data-do]'); 
    if (!b) return;

    const qList = window.ESCAPE_QUESTIONS || [];

    switch (b.dataset.do) {
      case 'question': question(); break;
      case 'lesson': lesson(); break;
      case 'answer': { const o = order[Number(b.dataset.index)]; answer(o.text, o.index === 0); break; }
      case 'dial': { const o = order[Number($('dial').value)]; answer(o.text, o.index === 0); break; }
      case 'lens': $('choices').classList.add('holding'); b.textContent = '⌕ Lupa equipada — muévela sobre una tarjeta'; break;
      case 'next': if (i < qList.length - 1) { i++; lesson(); } else finalLock(); break;
      case 'retry': modal().innerHTML = ''; s.retries++; while (i > 0 && qList[i - 1].room === qList[i].room) i--; lesson(); startClock(); break;
      case 'end': finish(false); break;
      case 'csv': csv(); break;
      case 'home': home(); break;
    }
  });

  function init() {
    if (window.gameAudio && $('sound-toggle')) window.gameAudio.init($('sound-toggle'));
    const brand = document.querySelector('.brand');
    if (brand) brand.addEventListener('click', e => e.preventDefault());
    home();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
