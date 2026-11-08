window.ESCAPE_QUESTIONS = [
  {
    room: 0,
    type: 'choice',
    title: 'Paso de Euler Explícito',
    theory: 'El método de Euler simple calcula la siguiente aproximación utilizando la pendiente al inicio del intervalo: y_{n+1} = y_n + h f(t_n, y_n).',
    formula: 'y_{n+1} = y_n + h \\cdot f(t_n, y_n)',
    text: 'Dado el IVP dy/dt = y con y(0) = 1 y paso h = 0.2, ¿cuál es la aproximación y_1 en t = 0.2?',
    options: ['1.2000', '1.2214', '1.1000', '1.4400'],
    hint: 'Sustituye t_0 = 0, y_0 = 1 en y_1 = 1 + 0.2*(1).',
    solution: 'y_1 = 1.0 + 0.2 * (1.0) = 1.2000.'
  },
  {
    room: 1,
    type: 'choice',
    title: 'Error de Truncamiento Local (LTE)',
    theory: 'El método de Euler comete un error local de orden O(h²) por paso debido a la omisión de los términos de la serie de Taylor a partir de la segunda derivada.',
    formula: 'LTE = \\frac{h^2}{2} y\'\'(\\xi) = \\mathcal{O}(h^2)',
    text: 'Si reduces el tamaño de paso h a la mitad (h/2) en Euler simple, ¿qué le ocurre al Error Local en un solo paso?',
    options: ['Se reduce aproximadamente a 1/4', 'Se reduce a la mitad (1/2)', 'Se reduce a 1/8', 'Permanece igual'],
    hint: 'Recuerda que el error local es proporcional al cuadrado del paso: (h/2)² = h²/4.',
    solution: 'Como LTE = O(h²), reducir h a la mitad hace que el error local disminuya por un factor de (1/2)² = 1/4.'
  },
  {
    room: 1,
    type: 'cards',
    title: 'Identifica la fórmula del Método del Punto Medio',
    theory: 'El Método del Punto Medio (Euler Modificado) evalúa la derivada a la mitad del paso (t_n + h/2) para lograr un orden de convergencia superior.',
    formula: 'y_{n+1} = y_n + h \\cdot f\\left(t_n + \\frac{h}{2}, y_n + \\frac{h}{2}k_1\\right)',
    text: '¿Cuál ecuación representa el paso de actualización del Método del Punto Medio?',
    options: [
      'y_{n+1} = y_n + h \\cdot f(t_n + h/2, y_n + h/2 k_1)',
      'y_{n+1} = y_n + h \\cdot f(t_n, y_n)',
      'y_{n+1} = y_n + \\frac{h}{2} [f(t_n, y_n) + f(t_{n+1}, y_{n+1})]',
      'y_{n+1} = y_n / (1 - h)'
    ],
    hint: 'Busca la fórmula que evalúa f en t_n + h/2.',
    solution: 'La aproximación evalúa la pendiente en la mitad del intervalo: y_{n+1} = y_n + h k_2, donde k_2 utiliza t_n + h/2.'
  },
  {
    room: 1,
    type: 'number',
    title: 'Cálculo numérico con Método del Punto Medio',
    theory: 'Para dy/dt = 2t con y(0) = 0 y h = 0.2: k_1 = 2(0) = 0. El punto medio es t = 0.1, y el valor aproximado es y + 0.1(0) = 0. Por tanto k_2 = 2(0.1) = 0.2.',
    formula: 'k_1 = f(t_n, y_n) \\qquad k_2 = f(t_n + h/2, y_n + h/2 k_1) \\qquad y_{n+1} = y_n + h k_2',
    text: 'Para dy/dt = 2t con y(0) = 0 y paso h = 0.2, calcula el valor aproximado y_1 en t = 0.2 usando el Método del Punto Medio.',
    value: 0.04,
    hint: 'Calcula k_1 = 0, k_2 = 2*(0.1) = 0.2, y luego y_1 = 0 + 0.2*(0.2).',
    solution: 'y_1 = 0 + 0.2 * (2 * 0.1) = 0.0400.'
  },
  {
    room: 2,
    type: 'dial',
    title: 'Método de Heun (Euler Mejorado)',
    theory: 'Heun calcula un predictor y*_{n+1} con Euler explícito y luego promedia la pendiente inicial k_1 y la pendiente final k_2.',
    formula: 'k_1 = f(t_n, y_n) \\qquad k_2 = f(t_n+h, y_n+h k_1) \\qquad y_{n+1} = y_n + \\frac{h}{2}(k_1 + k_2)',
    text: 'Dado dy/dt = y con y(0) = 1 y paso h = 0.2, ¿cuál es el valor de y_1 usando el método de Heun?',
    options: ['1.2200', '1.2000', '1.2400', '1.2214'],
    hint: 'k_1 = 1.0, predictor y* = 1.2, k_2 = 1.2. El promedio es (1.0 + 1.2)/2 = 1.1. Por tanto y_1 = 1 + 0.2*(1.1).',
    solution: 'y_1 = 1 + (0.2/2)*(1.0 + 1.2) = 1.2200.'
  },
  {
    room: 2,
    type: 'choice',
    title: 'Comparación de Orden de Error Global (GTE)',
    theory: 'Mientras Euler Simple tiene un error global O(h), los métodos de Heun y Punto Medio son de 2º orden con GTE de O(h²).',
    formula: 'GTE_{Euler} = \\mathcal{O}(h) \\qquad GTE_{Heun/PuntoMid} = \\mathcal{O}(h^2)',
    text: 'Si reduces el tamaño de paso h a la mitad (h/2) al resolver un IVP en el intervalo completo hasta T, ¿cómo se reduce el Error Global en Heun o Punto Medio?',
    options: [
      'Se reduce aproximadamente a la cuarta parte (1/4)',
      'Se reduce a la mitad (1/2)',
      'Se reduce a la octava parte (1/8)',
      'No cambia'
    ],
    hint: 'Como el error global es O(h²), la reducción al cambiar h por h/2 es (1/2)².',
    solution: 'Al ser métodos de segundo orden, el GTE es O(h²), por lo que al dividir h por 2, el error global disminuye a 1/4 de su valor anterior.'
  },
  {
    room: 3,
    type: 'graph',
    title: 'Análisis de la Pendiente Promedio en Heun',
    theory: 'Geométricamente, el método de Heun sustituye la pendiente en el extremo izquierdo por el promedio de las pendientes evaluadas en ambos extremos del intervalo.',
    formula: 'y_{n+1} = y_n + h \\cdot \\frac{f(t_n, y_n) + f(t_{n+1}, y_{n+1}^*)}{2}',
    text: 'Si k_1 = 2.0 y k_2 = 4.0 con un paso h = 0.1 y un valor actual y_n = 5.0, ¿cuál es el nuevo valor y_{n+1}?',
    options: ['5.300', '5.600', '5.200', '5.400'],
    hint: 'Promedia k_1 y k_2: (2+4)/2 = 3. Luego calcula 5.0 + 0.1 * 3.',
    solution: 'y_{n+1} = 5.0 + 0.1 * ((2.0 + 4.0) / 2) = 5.300.'
  },
  {
    room: 3,
    type: 'cards',
    title: 'Orden de Truncamiento Local de Heun y Punto Medio',
    theory: 'Tanto el método de Heun como el del Punto Medio eliminan el término de segundo orden en la serie de Taylor, por lo que su primer término de error no nulo es proporcional a h³.',
    formula: 'LTE_{Heun} = \\mathcal{O}(h^3)',
    text: '¿Cuál es el Orden del Error de Truncamiento Local (LTE) por paso en el método de Heun y Punto Medio?',
    options: ['O(h³)', 'O(h)', 'O(h²)', 'O(h⁴)'],
    hint: 'Al ser métodos de 2º orden, su error global es O(h²) y su error local por paso es un orden superior.',
    solution: 'El Error de Truncamiento Local (LTE) por paso es de orden O(h³).'
  },
  {
    room: 3,
    type: 'search',
    spring: false,
    title: 'Desafío Integración Numérica No Lineal',
    theory: 'Para dy/dt = -2t y², con y(0) = 1 y paso h = 0.2: En Euler simple, y_1 = 1 + 0.2*(-2*0*1) = 1.0000. La solución exacta es y(0.2) = 1 / (1 + 0.2²) = 1 / 1.04 ≈ 0.961538.',
    formula: 'Error = |y_{exacto} - y_{numérico}|',
    text: 'Encuentra las mediciones numéricas. Calcula el Error de Truncamiento Local en t = 0.2 para dy/dt = -2t y² con Euler simple (h = 0.2).',
    options: ['y_1 aproximado: 1.000000', 'y(0.2) exacto: 0.961538', 'Paso h: 0.200000'],
    value: 0.038462,
    hint: 'Resta el valor obtenido por Euler (1.000000) del valor exacto (0.961538).',
    solution: '|0.961538 - 1.000000| = 0.038462.'
  }
];