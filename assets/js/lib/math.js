// Converts a practical subset of LaTeX maths into MathML, which every current
// browser (Chrome/Edge/Android, Safari/iOS, Firefox) renders natively.
// No external library, no network request. Unknown commands show as plain
// text instead of breaking the page.
//
// Supported: letters, numbers, + - = < > ( ) [ ] | , ! etc, ^ and _ (sub/superscripts),
// \frac \sqrt \text \mathrm \mathbf \vec \hat \bar \overline \dot \left \right,
// Greek letters, \sum \prod \int \lim, \sin \cos \log \ln \exp ..., \cdot \times \pm
// \approx \neq \leq \geq \infty \partial \nabla \rightarrow and spacing (\, \; \quad).

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const GREEK_LOWER = {
  alpha: 'α', beta: 'β', gamma: 'γ', delta: 'δ', epsilon: 'ϵ', varepsilon: 'ε', zeta: 'ζ', eta: 'η',
  theta: 'θ', vartheta: 'ϑ', iota: 'ι', kappa: 'κ', lambda: 'λ', mu: 'μ', nu: 'ν', xi: 'ξ', pi: 'π',
  rho: 'ρ', sigma: 'σ', tau: 'τ', upsilon: 'υ', phi: 'ϕ', varphi: 'φ', chi: 'χ', psi: 'ψ', omega: 'ω',
};

const GREEK_UPPER = {
  Gamma: 'Γ', Delta: 'Δ', Theta: 'Θ', Lambda: 'Λ', Xi: 'Ξ', Pi: 'Π', Sigma: 'Σ', Upsilon: 'Υ',
  Phi: 'Φ', Psi: 'Ψ', Omega: 'Ω',
};

const OPERATORS = {
  cdot: '⋅', times: '×', div: '÷', pm: '±', mp: '∓', approx: '≈', neq: '≠', ne: '≠', equiv: '≡',
  leq: '≤', le: '≤', geq: '≥', ge: '≥', ll: '≪', gg: '≫', infty: '∞', partial: '∂', nabla: '∇',
  rightarrow: '→', to: '→', leftarrow: '←', Rightarrow: '⇒', Leftarrow: '⇐', leftrightarrow: '↔',
  Leftrightarrow: '⇔', propto: '∝', sim: '∼', angle: '∠', circ: '∘', bullet: '•', ldots: '…',
  dots: '…', cdots: '⋯', perp: '⊥', parallel: '∥', in: '∈', forall: '∀', exists: '∃', cap: '∩',
  cup: '∪', subset: '⊂', therefore: '∴', ast: '∗', star: '⋆', oplus: '⊕', otimes: '⊗',
  langle: '⟨', rangle: '⟩', degree: '°',
};

const BIG_OPERATORS = { sum: '∑', prod: '∏', int: '∫', iint: '∬', oint: '∮', lim: 'lim' };
const LIMIT_OPERATORS = new Set(['sum', 'prod', 'lim']);

const FUNCTIONS = new Set([
  'sin', 'cos', 'tan', 'cot', 'sec', 'csc', 'arcsin', 'arccos', 'arctan', 'sinh', 'cosh', 'tanh',
  'log', 'ln', 'exp', 'max', 'min', 'sup', 'inf', 'det', 'dim', 'ker', 'arg', 'deg', 'gcd', 'mod', 'Pr',
]);

const SPACES = { ',': '0.1667em', ':': '0.2222em', ';': '0.2778em', quad: '1em', qquad: '2em', ' ': '0.25em' };

const BLACKBOARD = { R: 'ℝ', N: 'ℕ', Z: 'ℤ', Q: 'ℚ', C: 'ℂ' };

class Parser {
  constructor(source) {
    this.s = source;
    this.i = 0;
    this.upright = 0;
  }

  eof() { return this.i >= this.s.length; }
  peek() { return this.s[this.i]; }
  skipSpace() { while (!this.eof() && /\s/.test(this.s[this.i])) this.i++; }

  readCommandName() {
    // assumes this.s[this.i] === '\\'
    this.i++;
    const letters = this.s.slice(this.i).match(/^[A-Za-z]+/);
    if (letters) {
      this.i += letters[0].length;
      return letters[0];
    }
    const ch = this.s[this.i] ?? '';
    this.i++;
    return ch;
  }

  atCommand(name) {
    return this.s.startsWith('\\' + name, this.i) && !/[A-Za-z]/.test(this.s[this.i + name.length + 1] ?? '');
  }

  mi(text) {
    return `<mi${this.upright ? ' mathvariant="normal"' : ''}>${esc(text)}</mi>`;
  }

  parseExpression(until) {
    const parts = [];
    for (;;) {
      this.skipSpace();
      if (this.eof()) break;
      const ch = this.peek();
      if (ch === '}') {
        if (until === '}') break;
        this.i++;
        continue;
      }
      if (until === 'right' && this.atCommand('right')) break;
      const atom = this.parseAtom();
      if (atom) parts.push(this.parseScripts(atom));
    }
    return parts.join('');
  }

  parseGroup() {
    // assumes this.peek() === '{'
    this.i++;
    const inner = this.parseExpression('}');
    if (this.peek() === '}') this.i++;
    return inner;
  }

  /** One argument: either {group} or a single token. Returns MathML. */
  parseArgument() {
    this.skipSpace();
    if (this.peek() === '{') return `<mrow>${this.parseGroup()}</mrow>`;
    if (/\d/.test(this.peek() ?? '')) {
      const d = this.peek();
      this.i++;
      return `<mn>${d}</mn>`;
    }
    const atom = this.parseAtom();
    return atom ? atom.ml : '<mrow></mrow>';
  }

  /** Raw text inside {...} with no nesting (for \text and similar). */
  readRawGroup() {
    this.skipSpace();
    if (this.peek() !== '{') {
      const ch = this.peek() ?? '';
      this.i++;
      return ch;
    }
    let depth = 0;
    let out = '';
    while (!this.eof()) {
      const ch = this.s[this.i++];
      if (ch === '{') { depth++; if (depth === 1) continue; }
      if (ch === '}') { depth--; if (depth === 0) break; }
      out += ch;
    }
    return out;
  }

  parseScripts(atom) {
    let sub = null;
    let sup = null;
    for (;;) {
      this.skipSpace();
      const ch = this.peek();
      if (ch === '^' && sup === null) { this.i++; sup = this.parseArgument(); }
      else if (ch === '_' && sub === null) { this.i++; sub = this.parseArgument(); }
      else break;
    }
    if (sub === null && sup === null) return atom.ml;
    const base = atom.ml;
    if (atom.limits) {
      if (sub !== null && sup !== null) return `<munderover>${base}${sub}${sup}</munderover>`;
      if (sub !== null) return `<munder>${base}${sub}</munder>`;
      return `<mover>${base}${sup}</mover>`;
    }
    if (sub !== null && sup !== null) return `<msubsup>${base}${sub}${sup}</msubsup>`;
    if (sub !== null) return `<msub>${base}${sub}</msub>`;
    return `<msup>${base}${sup}</msup>`;
  }

  parseDelimiter() {
    this.skipSpace();
    const ch = this.peek();
    if (ch === '\\') {
      const name = this.readCommandName();
      if (name === '{' || name === '}') return name;
      if (name === '|') return '‖';
      if (name === 'langle') return '⟨';
      if (name === 'rangle') return '⟩';
      return '';
    }
    this.i++;
    return ch === '.' ? '' : ch;
  }

  parseAtom() {
    const ch = this.peek();

    if (ch === '{') return { ml: `<mrow>${this.parseGroup()}</mrow>` };
    if (ch === '\\') return this.parseCommand();

    if (/\d/.test(ch)) {
      const num = this.s.slice(this.i).match(/^\d+(?:\.\d+)?/)[0];
      this.i += num.length;
      return { ml: `<mn>${num}</mn>` };
    }
    if (/[A-Za-z]/.test(ch)) {
      this.i++;
      return { ml: this.mi(ch) };
    }
    if (ch === '^' || ch === '_') {
      // a script with no base: give it an empty base so it still renders
      return { ml: '<mrow></mrow>' };
    }
    if (ch === '&') { this.i++; return null; }
    if (ch === '~') { this.i++; return { ml: '<mspace width="0.25em"></mspace>' }; }

    this.i++;
    const map = { '-': '−', '*': '∗', "'": '′' };
    const text = map[ch] ?? ch;
    const fence = '()[]|'.includes(ch) ? ' stretchy="false"' : '';
    return { ml: `<mo${fence}>${esc(text)}</mo>` };
  }

  parseCommand() {
    const name = this.readCommandName();

    if (GREEK_LOWER[name]) return { ml: this.mi(GREEK_LOWER[name]) };
    if (GREEK_UPPER[name]) return { ml: `<mi mathvariant="normal">${GREEK_UPPER[name]}</mi>` };
    if (OPERATORS[name]) return { ml: `<mo>${esc(OPERATORS[name])}</mo>` };
    if (BIG_OPERATORS[name]) {
      const limits = LIMIT_OPERATORS.has(name);
      const body = name === 'lim' ? '<mi>lim</mi>' : `<mo>${BIG_OPERATORS[name]}</mo>`;
      return { ml: body, limits };
    }
    if (FUNCTIONS.has(name)) return { ml: `<mrow><mi>${name}</mi><mo>&#x2061;</mo></mrow>` };

    if (Object.prototype.hasOwnProperty.call(SPACES, name)) return { ml: `<mspace width="${SPACES[name]}"></mspace>` };
    if (name === '!') return null;
    if (name === '\\') return null;
    if ('{}%$&#_'.includes(name) && name !== '') return { ml: `<mo>${esc(name)}</mo>` };
    if (name === '|') return { ml: '<mo stretchy="false">‖</mo>' };

    switch (name) {
      case 'frac':
      case 'dfrac':
      case 'tfrac': {
        const a = this.parseArgument();
        const b = this.parseArgument();
        return { ml: `<mfrac>${a}${b}</mfrac>` };
      }
      case 'sqrt': {
        this.skipSpace();
        let index = null;
        if (this.peek() === '[') {
          const end = this.s.indexOf(']', this.i);
          if (end > -1) {
            const inner = new Parser(this.s.slice(this.i + 1, end));
            index = `<mrow>${inner.parseExpression()}</mrow>`;
            this.i = end + 1;
          }
        }
        const radicand = this.parseArgument();
        return { ml: index ? `<mroot>${radicand}${index}</mroot>` : `<msqrt>${radicand}</msqrt>` };
      }
      case 'text':
      case 'textrm':
      case 'mbox': {
        const raw = this.readRawGroup().replace(/^ /, '\u00a0').replace(/ $/, '\u00a0');
        return { ml: `<mtext>${esc(raw)}</mtext>` };
      }
      case 'operatorname': {
        return { ml: `<mi>${esc(this.readRawGroup())}</mi>` };
      }
      case 'mathrm':
      case 'rm': {
        this.upright++;
        const arg = this.parseArgument();
        this.upright--;
        return { ml: arg };
      }
      case 'mathbf':
      case 'boldsymbol':
      case 'bf':
      case 'bm': {
        return { ml: `<mrow class="m-bold">${this.parseArgument()}</mrow>` };
      }
      case 'mathit': return { ml: this.parseArgument() };
      case 'mathbb': {
        const raw = this.readRawGroup();
        return { ml: `<mi>${esc(BLACKBOARD[raw] ?? raw)}</mi>` };
      }
      case 'mathcal':
      case 'mathscr': return { ml: this.parseArgument() };
      case 'vec': return { ml: `<mover accent="true">${this.parseArgument()}<mo>→</mo></mover>` };
      case 'hat': return { ml: `<mover accent="true">${this.parseArgument()}<mo>^</mo></mover>` };
      case 'bar':
      case 'overline': return { ml: `<mover accent="true">${this.parseArgument()}<mo>‾</mo></mover>` };
      case 'dot': return { ml: `<mover accent="true">${this.parseArgument()}<mo>˙</mo></mover>` };
      case 'ddot': return { ml: `<mover accent="true">${this.parseArgument()}<mo>¨</mo></mover>` };
      case 'underline': return { ml: `<munder>${this.parseArgument()}<mo>_</mo></munder>` };
      case 'left': {
        const open = this.parseDelimiter();
        const inner = this.parseExpression('right');
        let close = '';
        if (this.atCommand('right')) {
          this.i += '\\right'.length;
          close = this.parseDelimiter();
        }
        const o = open ? `<mo fence="true" stretchy="true">${esc(open)}</mo>` : '';
        const c = close ? `<mo fence="true" stretchy="true">${esc(close)}</mo>` : '';
        return { ml: `<mrow>${o}${inner}${c}</mrow>` };
      }
      case 'right': return null;
      default:
        return { ml: `<mtext class="math-error">\\${esc(name)}</mtext>` };
    }
  }
}

/**
 * texToMathML('V_{out} = \\frac{1}{1 + j\\omega RC}', true) -> '<math display="block">...</math>'
 * Never throws: on a failure the source is shown as plain code.
 */
export function texToMathML(tex, display = false) {
  const source = String(tex).trim();
  try {
    const body = new Parser(source).parseExpression();
    const attrs = display ? ' display="block"' : '';
    return `<math${attrs}><semantics><mrow>${body}</mrow><annotation encoding="application/x-tex">${esc(source)}</annotation></semantics></math>`;
  } catch {
    return `<code class="math-error">${esc(source)}</code>`;
  }
}
