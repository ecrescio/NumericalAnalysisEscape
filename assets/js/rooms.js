window.ESCAPE_QUESTIONS = [
  // ==========================================
  // SALA 1: EULER EXPLÍCITO (room: 0)
  // ==========================================
  {
    room: 0,
    type: 'choice',
    title: 'El Paso de Euler Explícito',
    theory: 'El método de Euler aproxima la solución de un IVP ($dy/dt = f(t,y)$) avanzando a lo largo de la recta tangente en el punto actual.',
    formula: 'y_{n+1} = y_n + h \\cdot f(t_n, y_n)',
    text: 'Dada $dy/dt = 2t + y$ con $y(0) = 1$ y paso $h = 0.1$, ¿cuál es el valor aproximado de $y(0.1)$?',
    options: ['1.10', '1.20', '1.05', '1.15'],
    hint: 'Calcula f(0, 1) = 2(0) + 1 = 1. Luego y_1 = 1 + 0.1(1).',
    solution: 'f(0,1) = 1. Aplicando Euler: y(0.1) ≈ 1 + 0.1(1) = 1.10.'
  },
  {
    room: 0,
    type: 'number',
    title: 'El Candado Numérico de Euler',
    theory: 'Calcula la aproximación en el primer paso para una ecuación diferencial lineal.',
    formula: 'y_{n+1} = y_n + h \\cdot f(t_n, y_n)',
    text: 'Para $dy/dt = -y$ con $y(0) = 2$ y $h = 0.2$, ingresa el valor aproximado para $y(0.2)$.',
    value: 1.6,
    hint: 'Evalúa f(0, 2) = -2. Luego calcula 2 + 0.2(-2).',
    solution: '$y_1 = 2 + 0.2(-2) = 1.6$.'
  },

  // ==========================================
  // SALA 2: HEUN Y EULER IMPLÍCITO (room: 1)
  // ==========================================
  {
    room: 1,
    type: 'choice',
    title: 'El Predictor-Corrector de Heun',
    theory: 'El método de Heun promedia las pendientes al inicio y al final del intervalo para mejorar la precisión a $O(h^2)$.',
    formula: 'y_{n+1} = y_n + \\frac{h}{2} [f(t_n, y_n) + f(t_{n+1}, y_{n+1}^0)]',
    text: '¿Qué método utiliza Heun para obtener el valor estimado inicial $y_{n+1}^0$ (paso predictor)?',
    options: [
      'Euler Explícito', 
      'Euler Implícito', 
      'Runge-Kutta de 4º orden', 
      'Diferencias Finitas centradas'
    ],
    hint: 'Es el método de avance por tangente más básico evaluado en t_n.',
    solution: 'Heun utiliza el método de Euler Explícito como paso predictor para estimar la pendiente futura.'
  },
  {
    room: 1,
    type: 'choice',
    title: 'Despeje en Euler Implícito',
    theory: 'En el método de Euler Implícito la derivada se evalúa en el punto futuro $t_{n+1}$, lo que requiere resolver una ecuación algebraica.',
    formula: 'y_{n+1} = y_n + h \\cdot f(t_{n+1}, y_{n+1})',
    text: 'Para la ODE rígida $dy/dt = -50y$, ¿cuál es la ecuación para $y_{n+1}$ mediante Euler Implícito?',
    options: [
      'y_{n+1} = \\frac{y_n}{1 + 50h}',
      'y_{n+1} = y_n (1 - 50h)',
      'y_{n+1} = \\frac{y_n}{1 - 50h}',
      'y_{n+1} = y_n + 50h'
    ],
    hint: 'Sustituye f(t_{n+1}, y_{n+1}) = -50 y_{n+1} y despeja y_{n+1}.',
    solution: '$y_{n+1} = y_n - 50h y_{n+1} ⟹ y_{n+1}(1 + 50h) = y_n ⟹ y_{n+1} = y_n / (1 + 50h)$.'
  },
  {
    room: 1,
    type: 'dial',
    title: 'Cómputo en Euler Implícito',
    theory: 'Aplica la fórmula obtenida para Euler Implícito.',
    formula: 'y_{n+1} = \\frac{y_n}{1 - h \\lambda}',
    text: 'Dada $dy/dt = -10y$ con $y(0) = 1$ y paso $h = 0.1$, selecciona el valor exacto de $y(0.1)$ usando Euler Implícito.',
    options: ['0.50', '0.00', '1.00', '0.20'],
    hint: 'Sustituye h = 0.1 y λ = -10 en 1 / (1 - 0.1(-10)) = 1 / (1 + 1) = 1/2.',
    solution: '$y_1 = 1 / (1 - 0.1(-10)) = 1 / 2 = 0.50$.'
  },

  // ==========================================
  // SALA 3: ESTABILIDAD Y TAMAÑO DE PASO (room: 2)
  // ==========================================
  {
    room: 2,
    type: 'choice',
    title: 'Condición de Estabilidad Absoluta',
    theory: 'Para la ecuación de prueba $dy/dt = \\lambda y$ (con $\\lambda < 0$), el factor de amplificación $Q(h\\lambda)$ debe cumplir $|Q(h\\lambda)| < 1$ para no oscilar o divergir.',
    formula: 'Q(h\\lambda) = 1 + h\\lambda \\qquad |1 + h\\lambda| < 1',
    text: '¿Cuál es el límite máximo del paso $h$ para que el método de Euler Explícito sea estable si $\\lambda = -10$?',
    options: ['$h < 0.2$', '$h < 0.1$', '$h < 0.5$', 'Estable para todo h'],
    hint: 'Resuelve la desigualdad -1 < 1 - 10h < 1.',
    solution: '$-1 < 1 - 10h < 1 ⟹ -2 < -10h < 0 ⟹ h < 0.2$.'
  },
  {
    room: 2,
    type: 'choice',
    eulerSim: true,
    title: 'Error de Truncamiento Global',
    theory: 'Al aumentar el tamaño de paso $h$, las rectas tangentes se desvían más de la curva real, acumulando error de truncamiento global.',
    formula: 'E_{local} = O(h^2) \\qquad E_{global} = O(h)',
    text: 'Usa el control slider interactivo arriba. ¿Qué le sucede a la curva de Euler (punteada roja) respecto a la exacta (verde) al aumentar el paso $h$?',
    options: [
      'El error global de truncamiento aumenta y la aproximación se aleja de la solución real.',
      'La solución numérica coincide perfectamente con la solución exacta.',
      'El error disminuye porque el sistema realiza menos cálculos numéricos.',
      'El método se vuelve incondicionalmente estable.'
    ],
    hint: 'Mueve el slider a h = 0.8 y observa la separación entre la línea punteada roja y la verde.',
    solution: 'A mayor paso h, la aproximación lineal acumula un error global O(h) más pronunciado.'
  },

  // ==========================================
  // SALA 4: RUNGE-KUTTA Y DIFERENCIAS FINITAS (room: 3)
  // ==========================================
  {
    room: 3,
    type: 'choice',
    title: 'Orden del Método RK4',
    theory: 'Los métodos de Runge-Kutta evalúan pendientes intermedias ($k_1, k_2, k_3, k_4$) dentro de cada paso para obtener alta precisión.',
    formula: 'y_{n+1} = y_n + \\frac{h}{6}(k_1 + 2k_2 + 2k_3 + k_4)',
    text: '¿Cuál es el orden del error global de truncamiento en el método de Runge-Kutta clásico (RK4)?',
    options: ['O(h^4)', 'O(h^2)', 'O(h)', 'O(h^5)'],
    hint: 'Aunque el error local de un paso es O(h⁵), el error global acumulado pierde un orden.',
    solution: 'El método RK4 tiene un error de truncamiento global de orden O(h⁴).'
  },
  {
    room: 3,
    type: 'search',
    title: 'Aproximación por Diferencias Finitas',
    theory: 'Las diferencias finitas sustituyen derivadas continuas por combinaciones discretas de nodos vecinales.',
    formula: 'y\'(t_n) \\approx \\frac{y_{n+1} - y_{n-1}}{2h}',
    text: 'Usa la lupa para encontrar las fórmulas. ¿Cuál representa la aproximación en Diferencias Finitas Centradas para $y\'(t_n)$?',
    options: [
      'y\'(t_n) \\approx \\frac{y_{n+1} - y_{n-1}}{2h}',
      'y\'(t_n) \\approx \\frac{y_{n+1} - y_n}{h}',
      'y\'(t_n) \\approx \\frac{y_n - y_{n-1}}{h}',
      'y\'(t_n) \\approx \\frac{y_{n+1} + y_n}{2}'
    ],
    hint: 'Busca la expresión que evalúa los nodos a la izquierda (n-1) y a la derecha (n+1) divididos entre 2h.',
    solution: 'La diferencia finita centrada usa el nodo posterior y anterior: ($y_{n+1} - y_{n-1}) / (2h)$, logrando un error O(h²).'
  },

  {
    room: 3,
    type: 'choice',
    methodsSim: true, // Activa la gráfica interactiva al tocar la pantalla
    title: 'Identificación Visual de Métodos',
    theory: 'Para una función convexa y creciente como $y\' = 2y$ ($y(0)=1$), Euler Explícito siempre subestima la curva real porque usa únicamente la pendiente inicial. Los métodos de orden superior (Heun, RK4) corrigen esa curvatura.',
    formula: 'y(t) = e^{2t} \\qquad t_0 = 0, \\; h = 0.5',
    text: 'Toca o haz clic sobre la gráfica para proyectar el paso $y_1$ en $t = 0.5$. Observando su posición respecto a la curva exacta (verde) y la tangente inicial, ¿qué método generó el punto proyectado?',
    options: [
      'Método de Heun (Trapecio / Predictor-Corrector)',
      'Método de Euler Explícito',
      'Método de Euler Implícito',
      'Aproximación constante (Orden 0)'
    ],
    hint: 'Observa que el punto cae por encima de la recta tangente inicial (Euler Explícito) pero ligeramente por debajo de la curva exacta e^{2t}.',
    solution: '¡Correcto! Para $y\'=2y$ con h=0.5: Euler Explícito da $y_1$ = 2.00 (sobre la tangente gris), la exacta es $e^1 ≈ 2.72$, y Heun promedia las pendientes dando $y_1 = 2.50$.'
  }
];
