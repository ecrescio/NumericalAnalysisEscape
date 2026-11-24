function renderInlineMath(el) {
    if (!el || el.querySelector('input, select')) return;
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
    }
  }

  function typeset() {
    const mainApp = app();
    if (!mainApp) return;
    requestAnimationFrame(fitFormulae);

    mainApp.querySelectorAll('.formula').forEach(el => {
      if (el.dataset.katexRendered) return;
      const t = el.textContent;
      el.replaceChildren();
      t.split(/\\qquad|\s{3,}/).forEach(part => el.append(math(latex(part.trim()))));
      el.dataset.katexRendered = "true";
    });

    mainApp.querySelectorAll('.answer-option').forEach(el => {
      if (el.dataset.katexRendered) return;
      const txt = el.textContent.trim();
      if (isMathOption(txt)) {
        el.replaceChildren(math(latex(txt)));
        el.dataset.katexRendered = "true";
      }
    });

    mainApp.querySelectorAll('h1, p, label, .methods-simulation span, .euler-simulation span').forEach(el => {
      renderInlineMath(el);
    });
  }