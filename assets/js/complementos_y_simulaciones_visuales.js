/* Audio local sintetizado para efectos del escape room numérico */
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
    o.onended = () => { o.disconnect(); g.disconnect(); };
  }
  return {
    init(button) {
      const update = () => {
        button.hidden = false;
        button.textContent = enabled ? '♫ Sonido ON' : '♫ Sonido OFF';
        button.title = enabled ? 'Silenciar' : 'Activar sonido';
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
    bell(n) { tone([392, 494, 587, 784][n], .55); },
    effect(kind) {
      if (kind === 'success') [523, 659, 784].forEach((f, n) => tone(f, .3, 'sine', n * .1));
      else if (kind === 'error') tone(180, .5, 'triangle', 0, 45);
      else if (kind === 'spell') tone(620, .12, 'triangle', 0, 120);
      else if (kind === 'brew') Array.from({ length: 8 }, (_, n) => tone(100 + n % 3 * 60, .12, 'sine', n * .09, 240 + n * 20));
    }
  };
})();

/* Gráfica interactiva de Métodos Numéricos (Euler vs Solución Exacta) */
window.mountPendulum = function(graph, isActive) {
  const ns = 'http://www.w3.org/2000/svg', panel = document.createElement('div');
  panel.className = 'pendulum-simulation';
  panel.innerHTML = `
    <p>IVP dy/dt = y · Comparación entre Solución Exacta e (línea azul) y Método de Euler con paso h = 0.2 (marcadores amarillos).</p>
    <svg viewBox="0 0 400 240" aria-label="Visualización del error de Euler vs Exacta" role="img">
      <!-- Ejes -->
      <path d="M 40 200 L 360 200 M 40 200 L 40 20" stroke="#a7a2b0" stroke-width="2"/>
      <!-- Solución exacta y(t) = e^t -->
      <path d="M 40 180 Q 180 160 340 30" fill="none" stroke="#73dcca" stroke-width="3"/>
      <!-- Poligonal de Euler -->
      <path d="M 40 180 L 140 148 L 240 110 L 340 64" fill="none" stroke="#e8c882" stroke-width="3" stroke-dasharray="5 4"/>
      <circle cx="40" cy="180" r="5" fill="#e8c882"/>
      <circle cx="140" cy="148" r="5" fill="#e8c882"/>
      <circle cx="240" cy="110" r="5" fill="#e8c882"/>
      <circle cx="340" cy="64" r="5" fill="#ff6270"/>
      <text x="250" y="45" fill="#73dcca" font-size="12">Exacta: y(t)=eᵗ</text>
      <text x="250" y="80" fill="#e8c882" font-size="12">Euler: h=0.2</text>
    </svg>
    <div class="pendulum-controls">
      <button type="button" class="button" id="sim-play">▶ Reiniciar Animación</button>
    </div>`;
  graph.before(panel);
  panel.append(graph);
};

window.mountSpring = function(anchor, isActive) {
  const panel = document.createElement('section');
  panel.className = 'spring-simulation';
  panel.innerHTML = `
    <p>Simulación de Acumulación del Error Global GTE: Al reducir h a la mitad (0.2 ➔ 0.1), el error al final del intervalo se reduce a la mitad O(h) en Euler y a la cuarta parte O(h²) en Heun/Punto Medio.</p>
    <svg class="spring-scene" viewBox="0 0 540 140" role="img">
      <path d="M 40 110 L 500 110" stroke="#aaa" stroke-width="2"/>
      <text x="50" y="40" fill="#73dcca" font-size="14">Curva Exacta</text>
      <text x="50" y="70" fill="#e8c882" font-size="14">Paso h = 0.2 (2 pasos)</text>
      <text x="50" y="100" fill="#70d9b0" font-size="14">Paso h = 0.1 (4 pasos - Mayor precisión)</text>
    </svg>`;
  anchor.before(panel);
};