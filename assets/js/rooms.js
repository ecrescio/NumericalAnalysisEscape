window.ESCAPE_QUESTIONS = [
  // --- SALA 1: EULER EXPLÍCITO ---
  {
    room: 0,
    type: 'choice',
    title: 'Paso de Integración de Euler',
    theory: 'El método de Euler aproximó la solución de dy/dt = f(t,y) avanzando mediante la tangente en el punto actual.',
    formula: 'y_{n+1} = y_n + h \\cdot f(t_n, y_n)',
    text: 'Dada dy/dt = 2t + y con y(0) = 1 y un paso h = 0.1, ¿cuál es el valor aproximado de y(0.1)?',
    options: ['1.10', '1.20', '1.05', '1.15'],
    hint: 'Calcula f(0, 1) = 2(0) + 1 = 1. Luego y_1 = 1 + 0.1(1).',
    solution: 'f(0,1) = 1. Por lo tanto, y(0.1) ≈ 1 + 0.1(1) = 1.10.'
  },
  {
    room: 0,
    type: 'number',
    title: 'El Candado Numérico de Euler',
    theory: 'Aplica el método de Euler paso a paso.',
    formula: 'y_{n+1} = y_n + h \\cdot f(t_n, y_n)',
    text: 'Para dy/dt = -y con y(0) = 2 y h = 0.2, ingresa el valor calculado para y(0.2).',
    value: 1.6, // Calculado como: 2 + 0.2*(-2) = 1.6
    hint: 'Sustituye t_0 = 0, y_0 = 2 en la ecuación diferencial.',
    solution: 'y_1 = 2 + 0.2(-2) = 1.6.'
  },

  // --- SALA 2: HEUN Y EULER IMPLÍCITO ---
  {
    room: 1,
    type: 'choice',
    title: 'Fórmula del Predictor-Corrector (Heun)',
    theory: 'El método de Heun promedia las pendientes al inicio y al final del intervalo.',
    formula: 'y_{n+1} = y_n + \\frac{h}{2} [f(t_n, y_n) + f(t_{n+1}, y_{n+1}^0)]',
    text: '¿Qué método utiliza Heun para obtener la predicción inicial y_{n+1}^0?',
    options: ['Euler Explícito', 'Euler Implícito', 'Runge-Kutta de 4º orden', 'Diferencias Finitas'],
    hint: 'Es el método explícito más simple para predecir el siguiente valor.',
    solution: 'Heun usa Euler explícito como paso predictor.'
  },
  {
    room: 1,
    type: 'choice',
    title: 'Ecuaciones Implícitas',
    theory: 'En el método de Euler Implícito la derivada se evalúa en el punto futuro t_{n+1}.',
    formula: 'y_{n+1} = y_n + h \\cdot f(t_{n+1}, y_{n+1})',
    text: 'Para la ODE rígida (stiff) dy/dt = -50y, ¿cuál es la ecuación algebraica para y_{n+1} en Euler Implícito?',
    options: [
      'y_{n+1} = \\frac{y_n}{1 + 50h}',
      'y_{n+1} = y_n (1 - 50h)',
      'y_{n+1} = \\frac{y_n}{1 - 50h}',
      'y_{n+1} = y_n + 50h'
    ],
    hint: 'Sustituye f(t_{n+1}, y_{n+1}) = -50 y_{n+1} y despeja y_{n+1}.',
    solution: 'y_{n+1} = y_n - 50h y_{n+1} ⟹ y_{n+1}(1 + 50h) = y_n.'
  },

  // --- SALA 3: ESTABILIDAD Y TAMAÑO DE PASO ---
  {
    room: 2,
    type: 'choice',
    title: 'Región de Estabilidad Absoluta',
    theory: 'Para la ecuación de prueba dy/dt = \\lambda y con \\lambda < 0, el factor de amplificación Q(h\\lambda) debe cumplir |Q(h\\lambda)| < 1.',
    formula: 'Q(h\\lambda) = 1 + h\\lambda',
    text: '¿Cuál es la condición sobre el paso h para que Euler Explícito sea estable si \\lambda = -10?',
    options: ['h < 0.2', 'h < 0.1', 'h < 0.5', 'Estable para todo h'],
    hint: 'Resuelve la desigualdad |1 - 10h| < 1.',
    solution: '-1 < 1 - 10h < 1 ⟹ 0 < 10h < 2 ⟹ h < 0.2.'
  },

  // --- SALA 4: RUNGE-KUTTA Y DIFERENCIAS FINITAS ---
  {
    room: 3,
    type: 'choice',
    title: 'Orden del Método RK4',
    theory: 'Los métodos de Runge-Kutta evalúan la función en puntos intermedios para lograr mayor precisión.',
    formula: 'E_{global} = O(h^p)',
    text: '¿Cuál es el orden del error global de truncamiento en el método de Runge-Kutta de 4º orden (RK4)?',
    options: ['O(h⁴)', 'O(h²)', 'O(h)', 'O(h⁵)'],
    hint: 'El error local es O(h⁵), pero el error acumulado global pierde un orden de h.',
    solution: 'El error global de truncamiento para RK4 es O(h⁴).'
  }
];
{
  room: 2,
  type: 'choice',
  eulerSim: true, // Indica a game.js que debe cargar el gráfico interactivo de Euler
  title: 'Error de Truncamiento Local vs Global',
  theory: 'Al aumentar el tamaño de paso h en el método de Euler, la pendiente estimada se aleja de la trayectoria real, acumulando error en cada paso.',
  formula: 'E_{local} = O(h^2), \\qquad E_{global} = O(h)',
  text: 'Observa la gráfica interactiva superior. ¿Qué sucede con la solución numérica de Euler a medida que incrementas el tamaño de paso h?',
  options: [
    'El error de truncamiento global aumenta y la solución se aleja de la exacta.',
    'La solución numérica se vuelve idéntica a la solución exacta.',
    'El error disminuye porque se realizan menos pasos de cálculo.',
    'El método de Euler se convierte en un método implícito.'
  ],
  hint: 'Mueve el control deslizante de h hacia 0.8 en la gráfica y compara la línea roja punteada con la verde.',
  solution: 'A mayor h, el error acumulado (global) aumenta notablemente debido a que la aproximación por recta tangente se vuelve imprecisa sobre intervalos más grandes.'
}
