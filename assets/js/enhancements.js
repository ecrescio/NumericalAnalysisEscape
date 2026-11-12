/* Local, synthesized audio. No recordings or external audio services. */
window.gameAudio = (() => {
  let ctx, enabled = true, master;
  function unlock() {
    if (!enabled) return;
    try {
      if (!ctx) {
        const Audio = window.AudioContext || window.webkitAudioContext;
        if (!Audio) return;
        ctx = new Audio();
        master = ctx.createGain();
        master.gain.value = .22;
        master.connect(ctx.destination);
      }
      if (ctx.state === 'suspended') ctx.resume().catch(() => {});
    } catch {}
  }
  function tone(f, d = .3, type = 'sine', delay = 0, end = f) {
    if (!enabled) return;
    unlock();
    if (!ctx) return;
    const o = ctx.createOscillator(), g = ctx.createGain(), t = ctx.currentTime + delay;
    o.type = type;
    o.frequency.setValueAtTime(f, t);
    o.frequency.exponentialRampToValueAtTime(Math.max(20, end), t + d);
    g.gain.setValueAtTime(.001, t);
    g.gain.exponentialRampToValueAtTime(.3, t + .015);
    g.gain.exponentialRampToValueAtTime(.001, t + d);
    o.connect(g);
    g.connect(master);
    o.start(t);
    o.stop(t + d + .02);
    o.onended = () => {
      o.disconnect();
      g.disconnect();
    };
  }
  return {
    init(button) {
      const update = () => {
        button.hidden = false;
        button.textContent = enabled ? '♫ Sonido: ON' : '♫ Sonido: OFF';
        button.title = enabled ? 'Silenciar sonidos' : 'Activar sonidos';
        button.setAttribute('aria-label', button.title);
        button.setAttribute('aria-pressed', String(enabled));
      };
      button.onclick = () => {
        enabled = !enabled;
        if (master) master.gain.value = enabled ? .22 : 0;
        unlock();
        update();
      };
      document.addEventListener('pointerdown', unlock, { capture: true });
      document.addEventListener('keydown', unlock, { capture: true });
      update();
    },
    bell(n) {
      tone([392, 494, 587, 784][n], .55);
    },
    effect(kind) {
      if (kind === 'success') [523, 659, 784].forEach((f, n) => tone(f, .3, 'sine', n * .1));
      else if (kind === 'error') tone(180, .5, 'triangle', 0, 45);
      else if (kind === 'spell') tone(620, .12, 'triangle', 0, 120);
      else if (kind === 'brew') Array.from({ length: 8 }, (_, n) => tone(100 + n % 3 * 60, .12, 'sine', n * .09, 240 + n * 20));
    }
  };
})();

/* Simulación interactiva de Métodos Numéricos (IVP: dy/dt = -y, y(0) = 1) */
window.mountEulerSimulation = function(anchor, isActive) {
  const panel = document.createElement('section');
  panel.className = 'euler-simulation';
  
  panel.innerHTML = `
    <div style="background: #181623; border: 1px solid #302a45; padding: 16px; border-radius: 8px; margin-bottom: 20px; color: #e1dfeb;">
      <p style="margin-top:0;"><strong>Simulación IVP:</strong> $dy/dt = -y$, con $y(0) = 1$. Compara la solución exacta $y(t) = e^{-t}$ con el Método de Euler Explícito.</p>
      <div class="euler-controls" style="margin: 12px 0; display: flex; gap: 15px; align-items: center; color: #fff;">
        <label style="display: flex; align-items: center; gap: 10px;">Tamaño de paso ($h$): 
          <input class="euler-h" type="range" min="0.05" max="0.8" step="0.05" value="0.2" style="cursor: pointer;">
          <span class="h-val" style="font-weight: bold; color: #e8c882; min-width: 35px;">0.20</span>
        </label>
      </div>
      <svg class="euler-scene" viewBox="0 0 500 240" role="img" aria-label="Comparación de Euler vs Solución Exacta" style="width: 100%; background: #0f0d17; border-radius: 6px; display: block;">
        <!-- Ejes -->
        <path d="M 40 20 V 200 H 480" fill="none" stroke="#555" stroke-width="2"/>
        <text x="475" y="225" fill="#aaa" font-size="12">t</text>
        <text x="15" y="25" fill="#aaa" font-size="12">y(t)</text>
        
        <!-- Curva Exacta -->
        <path class="curve-exact" fill="none" stroke="#73dcca" stroke-width="2.5"/>
        
        <!-- Curva Euler -->
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
  
  const svg = panel.querySelector('.euler-scene');
  const pathExact = panel.querySelector('.curve-exact');
  const pathEuler = panel.querySelector('.curve-euler');
  const nodesGroup = panel.querySelector('.euler-nodes');
  const sliderH = panel.querySelector('.euler-h');
  const spanH = panel.querySelector('.h-val');
  
  // Mapeo de coordenadas del problema a las coordenadas SVG
  // t: [0, 4] -> X: [40, 460]
  // y: [0, 1.2] -> Y: [200, 30]
  const mapX = t => 40 + (t / 4) * 420;
  const mapY = y => 200 - (y / 1.2) * 170;
  
  // 1. Dibujar Solución Exacta
  let dExact = '';
  for (let i = 0; i <= 100; i++) {
    const t = (i / 100) * 4;
    const y = Math.exp(-t);
    dExact += `${i === 0 ? 'M' : 'L'} ${mapX(t)} ${mapY(y)} `;
  }
  pathExact.setAttribute('d', dExact);
  
  // 2. Actualizar Aproximación de Euler dinámicamente según 'h'
  function updateEuler() {
    const h = parseFloat(sliderH.value);
    spanH.textContent = h.toFixed(2);
    
    let t = 0;
    let y = 1.0;
    let dEuler = `M ${mapX(t)} ${mapY(y)}`;
    
    nodesGroup.innerHTML = `<circle cx="${mapX(t)}" cy="${mapY(y)}" r="4" fill="#ff6270"/>`;
    
    while (t < 4) {
      // Método de Euler Explícito para dy/dt = -y => y_{n+1} = y_n + h * (-y_n)
      const f = -y;
      y = y + h * f;
      t = t + h;
      
      const px = mapX(t);
      const py = mapY(y);
      
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
  
  sliderH.oninput = updateEuler;
  updateEuler();
};
/* Simulación interactiva táctil: Identificación del método en y_{n+1} (IVP: dy/dt = 2y, y(0) = 1, h = 0.5) */
window.mountMethodsComparison = function(anchor) {
  if (!anchor) return;

  const panel = document.createElement('section');
  panel.className = 'methods-simulation';
  panel.innerHTML = `
    <div style="background: #181623; border: 1px solid #302a45; padding: 16px; border-radius: 8px; margin-bottom: 20px; color: #e1dfeb; text-align: left;">
      <p style="margin-top:0; font-size: 0.9em;"><strong>Laboratorio Visual ($dy/dt = 2y, \\; y(0)=1, \\; h=0.5$):</strong> Haz clic o toca el recuadro oscuro para calcular y proyectar el punto misterioso $y_1$.</p>
      
      <div class="touch-canvas-wrapper" style="position: relative; cursor: pointer; user-select: none;">
        <svg class="methods-scene" viewBox="0 0 500 260" role="img" aria-label="Gráfica interactiva de métodos numéricos" style="width: 100%; background: #0f0d17; border: 1px dashed #443c63; border-radius: 6px; display: block;">
          <!-- Cuadrícula de referencia -->
          <line x1="60" y1="220" x2="460" y2="220" stroke="#555" stroke-width="2"/>
          <line x1="60" y1="20" x2="60" y2="220" stroke="#555" stroke-width="2"/>
          <line x1="360" y1="20" x2="360" y2="220" stroke="#333" stroke-dasharray="4 4"/>
          
          <!-- Etiquetas -->
          <text x="55" y="240" fill="#aaa" font-size="12">t₀ = 0</text>
          <text x="345" y="240" fill="#e8c882" font-size="12" font-weight="bold">t₁ = 0.5</text>
          <text x="20" y="165" fill="#aaa" font-size="11">y=1.0</text>
          <text x="20" y="105" fill="#aaa" font-size="11">y=2.0</text>
          <text x="20" y="45" fill="#aaa" font-size="11">y=3.0</text>

          <!-- Curva Exacta y = e^(2t) -->
          <path class="exact-exp" fill="none" stroke="#73dcca" stroke-width="2.5"/>
          
          <!-- Referencia sutil: Tangente inicial (Euler Explícito = 2.0) -->
          <line x1="60" y1="160" x2="360" y2="100" stroke="#666" stroke-width="1.5" stroke-dasharray="3 3"/>
          <circle cx="360" cy="100" r="4" fill="#666"/>
          <text x="370" y="104" fill="#888" font-size="11">Tangente inicial (y=2.0)</text>

          <!-- Punto Inicial (0, 1) -->
          <circle cx="60" cy="160" r="5" fill="#fff"/>

          <!-- Grupo oculto que aparece al tocar la pantalla -->
          <g class="mystery-reveal" style="opacity: 0; transition: opacity 0.35s ease;">
            <line x1="60" y1="160" x2="360" y2="70" stroke="#ff6270" stroke-width="2.5"/>
            <circle cx="360" cy="70" r="7" fill="#ff6270" stroke="#fff" stroke-width="2"/>
            <rect x="220" y="42" width="130" height="24" rx="4" fill="#252136" stroke="#ff6270"/>
            <text x="285" y="58" fill="#fff" font-size="12" font-weight="bold" text-anchor="middle">Punto y₁ = 2.50</text>
          </g>
        </svg>

        <div class="tap-overlay" style="position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; background: rgba(15, 13, 23, 0.55); border-radius: 6px; transition: opacity 0.3s;">
          <span style="background: #e8c882; color: #0f0d17; padding: 10px 18px; border-radius: 20px; font-weight: bold; font-size: 0.9em; box-shadow: 0 4px 15px rgba(0,0,0,0.5);">👆 Toca aquí para proyectar y₁</span>
        </div>
      </div>

      <div style="display: flex; gap: 20px; font-size: 13px; margin-top: 10px;">
        <span style="color: #73dcca; font-weight: 500;">― Solución Exacta ($e^{2t}$, en $t=0.5$ vale $2.72$)</span>
        <span style="color: #ff6270; font-weight: 500;">● Punto Proyectado ($y_1$)</span>
      </div>
    </div>
  `;

  anchor.before(panel);

  // Dibujar curva exacta y = e^(2t) para t en [0, 0.6]
  // Mapeo: t=0 -> X=60, t=0.5 -> X=360 (600px por unidad de t)
  // Mapeo: y=0 -> Y=220, y=1 -> Y=160, y=2 -> Y=100, y=3 -> Y=40 (60px por unidad de y)
  const pathExact = panel.querySelector('.exact-exp');
  let d = '';
  for (let k = 0; k <= 60; k++) {
    const t = (k / 60) * 0.6;
    const y = Math.exp(2 * t);
    const px = 60 + t * 600;
    const py = 220 - y * 60;
    d += `${k === 0 ? 'M' : 'L'} ${px.toFixed(1)} ${py.toFixed(1)} `;
  }
  pathExact.setAttribute('d', d);

  // Evento táctil / clic para revelar el punto
  const wrapper = panel.querySelector('.touch-canvas-wrapper');
  const overlay = panel.querySelector('.tap-overlay');
  const reveal = panel.querySelector('.mystery-reveal');

  wrapper.addEventListener('click', () => {
    overlay.style.opacity = '0';
    overlay.style.pointerEvents = 'none';
    reveal.style.opacity = '1';
    if (window.gameAudio) window.gameAudio.effect('spell');
  });
};
