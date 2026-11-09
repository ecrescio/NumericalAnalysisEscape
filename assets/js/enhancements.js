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
enhancements.js
Mostrando enhancements.js.
