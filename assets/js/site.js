/* Arjun Bhardwaj portfolio: particles, scroll and menu */
(function(){
class DCLogic{}
var CHUNKS = ['assets/data/brain-0.json', 'assets/data/brain-1.json', 'assets/data/brain-2.json', 'assets/data/brain-3.json', 'assets/data/brain-4.json', 'assets/data/brain-5.json'];
var CH_SIZE = 5500;
/* one target shape per section; brain variants share the same particles so the camera can travel through them */
var CFG = {
  bLoad:   { spin: 'osc', pulse: 0.7, dim: 1.3, brain: true, imp: 0.4 },
  brain:   { rect: [-0.1, 0.97, -0.76, 0.72], spin: 'osc', pulse: 0.7, dim: 1.25, brain: true, imp: 0.4 },
  inside:  { spin: 'none', pulse: 0.45, dim: 1, brain: true },
  words:   { spin: 'none', pulse: 0.25, dim: 1 },
  web:     { spin: 'tiny', pulse: 0.6, dim: 1 },
  ball:    { rect: [-0.86, -0.2, -0.62, 0.58], spin: 'ball', pulse: 0.55, dim: 1, rot: true },
  neuron:  { spin: 'sway', pulse: 0.8, dim: 1 },
  dna:     { spin: 'scroll', pulse: 0.6, dim: 1, rot: true },
  play:    { spin: 'sway', pulse: 0.55, dim: 1 },
  coach:   { spin: 'none', pulse: 0.2, dim: 1 },
  ecg:     { spin: 'none', pulse: 0.2, dim: 1, ecg: 1 },
  brainAI: { rect: [0.14, 0.94, -0.66, 0.6], spin: 'aiosc', pulse: 0.5, dim: 1.1, brain: true, imp: 1 },
  arch:    { spin: 'none', pulse: 0.3, dim: 1 }
};
var CAR_KEYS = ['neuron', 'dna', 'play', 'coach'];
var RECT_MOB = [-0.8, 0.8, 0.2, 0.72];
var RECT_MOB_CAR = [-0.8, 0.8, -0.12, 0.5];
/* brain regions, MNI millimetres: centre used for the camera and the label */
var REGIONS = [null,
  { name: 'Hippocampus', c: [-27, -22, -14] },
  { name: 'Limbic system', c: [-14, -4, 4] },
  { name: 'Prefrontal cortex', c: [-26, 46, 18] },
  { name: 'Motor cortex · Cerebellum', c: [-36, -20, 56] },
  { name: 'Broca’s · Wernicke’s areas', c: [-52, -14, 12] }
];
function mniToRaw(m) { return [-(m[1] + 16.44) / 70, (m[2] - 5.36) / 70, -m[0] / 70]; }
function regionOf(mx, my, mz) {
  const ax = Math.abs(mx), d = (a, b, c) => Math.sqrt(a * a + b * b + c * c);
  if (d(ax - 27, my + 22, mz + 14) < 25) return 1;
  if (d(ax - 22, my + 4, mz + 18) < 19 || (ax < 18 && mz > 8 && mz < 48 && my > -46 && my < 38)) return 2;
  if (mx < 0 && (d(mx + 50, my - 18, mz - 8) < 24 || d(mx + 54, my + 46, mz - 16) < 25)) return 5;
  if ((my > -32 && my < -6 && mz > 38) || (mz < -24 && my < -44)) return 4;
  if (my > 30) return 3;
  return 0;
}

var VERT = [
'attribute vec3 aFrom; attribute vec3 aTo; attribute float aGA; attribute float aGB; attribute float aLA; attribute float aLB; attribute float aSeed; attribute float aOrder; attribute float aReg;',
'uniform float uT; uniform vec3 uCA; uniform vec3 uCB; uniform float uRA; uniform float uRB; uniform float uSA; uniform float uSB;',
'uniform float uNoStag; uniform vec3 uOffA; uniform vec3 uOffB; uniform float uStrand; uniform float uSag; uniform float uImp;',
'uniform float uKaS; uniform float uKA; uniform float uKB; uniform float uScA; uniform float uScB; uniform vec3 uM; uniform float uEcg; uniform float uHWv;',
'uniform float uForm; uniform float uGold;',
'uniform float uRW[6]; uniform float uRAct; uniform float uFire; uniform vec3 uFA[12]; uniform vec3 uFB[12];',
'uniform float uTime; uniform float uReveal; uniform float uPix; uniform float uPulse; uniform float uDim;',
'varying vec3 vCol; varying float vA;',
'vec3 rotY(vec3 p, vec3 c, float a, float s){ vec3 v = (p - c) * s; float cs = cos(a), sn = sin(a); return c + vec3(v.x * cs + v.z * sn, v.y, -v.x * sn + v.z * cs); }',
'float hsh(float n){ return fract(sin(n * 91.345 + 7.13) * 43758.5453); }',
'vec3 strand(float s, float side, float rung, float r1, float r2){',
'  vec3 m = uM;',
'  vec3 c = (1.0 - s) * (1.0 - s) * uCA + 2.0 * s * (1.0 - s) * m + s * s * uCB;',
'  vec3 tg = normalize(2.0 * (1.0 - s) * (m - uCA) + 2.0 * s * (uCB - m) + vec3(1e-4, 0.0, 0.0));',
'  vec3 nrm = normalize(vec3(-tg.y, tg.x, 0.0) + vec3(0.0, 1e-4, 0.0));',
'  vec3 bn = cross(tg, nrm);',
'  float th = s * 10.5 + side * 3.14159 - uTime * 1.1;',
'  float env = 0.1 + 0.9 * sin(3.14159 * s);',
'  vec3 dir = nrm * cos(th) + bn * sin(th);',
'  vec3 ctr = c + dir * 0.42 * env * rung;',
'  float ang = r1 * 6.2832;',
'  float rad = 0.052 * env * sqrt(-2.0 * log(max(r2, 0.002))) * (abs(rung) < 0.999 ? 0.26 : 1.0);',
'  return ctr + (nrm * cos(ang) + bn * sin(ang) + tg * sin(ang * 1.7) * 0.6) * rad;',
'}',
'float sceneDy(float c){ return c < 4.5 ? 0.0 : (c < 5.5 ? 0.0 : (c < 6.5 ? -0.04 : (c < 7.5 ? 0.05 : (c < 8.5 ? 0.065 : 0.0)))); }',
'void main(){',
'  vec3 jit = vec3(fract(aSeed * 91.3), fract(aSeed * 57.1), fract(aSeed * 23.7)) - 0.5;',
'  float icA = step(4.5, aGA), icB = step(4.5, aGB);',
'  vec3 fa0 = aFrom + uOffA + vec3(0.0, sceneDy(aGA) * uKA * uScA, 0.0), fb0 = aTo + uOffB + vec3(0.0, sceneDy(aGB) * uKB * uScB, 0.0);',
'  vec3 pa = rotY(fa0, uCA, uRA, uSA); vec3 pb = rotY(fb0, uCB, uRB, uSB);',
'  vec3 p; float onStrand = 0.0; float isRung = 0.0; float rungFace = 1.0;',
'  if (uNoStag > 0.5) { float d = uT * uT * (3.0 - 2.0 * uT); p = mix(pa, pb, d); }',
'  else {',
'    float d = clamp(uT * 3.0 - aSeed * 2.0, 0.0, 1.0);',
'    float side = step(0.5, hsh(aSeed + 0.91));',
'    float rung = hsh(aSeed + 0.31) < 0.15 ? (hsh(aSeed + 0.77) * 2.0 - 1.0) : 1.0;',
'    float r1 = hsh(aSeed + 0.11), r2 = hsh(aSeed + 0.53);',
'    if (d <= 0.0) p = pa;',
'    else if (d >= 1.0) p = pb;',
'    else {',
'      float s = d;',
'      if (abs(rung) < 0.999) { s = (floor(s * 18.0) + 0.5) / 18.0; isRung = 1.0; rungFace = abs(cos(s * 10.5 + side * 3.14159 - uTime * 1.1)); }',
'      float ka = 1.0 - smoothstep(0.0, uKaS, d), kb = smoothstep(0.68, 1.0, d);',
'      p = strand(s, side, rung, r1, r2) + (pa - uCA) * ka + (pb - uCB) * kb;',
'      onStrand = 1.0 - max(ka, kb);',
'    }',
'  }',
'  p += 0.008 * vec3(sin(uTime * 0.5 + aSeed * 40.0), cos(uTime * 0.4 + aSeed * 23.0), sin(uTime * 0.3 + aSeed * 11.0));',
'  float fireOn = 0.0, firePulse = 0.0;',
'  if (uFire > 0.0 && hsh(aSeed + 0.63) < 0.1) {',
'    int kk = int(floor(hsh(aSeed + 0.29) * 12.0));',
'    vec3 A = vec3(0.0), Bq = vec3(0.0);',
'    for (int k = 0; k < 12; k++) { if (k == kk) { A = uFA[k]; Bq = uFB[k]; } }',
'    float tt = hsh(aSeed + 0.81);',
'    vec3 lp = mix(A, Bq, tt) + uOffA + jit * 0.008;',
'    float ph = fract(uTime * 0.45 + float(kk) * 0.37);',
'    firePulse = exp(-pow((tt - ph) * 9.0, 2.0));',
'    p = mix(p, lp, uFire); fireOn = uFire;',
'  }',
'  float fk = clamp(uForm * 1.45 - aOrder * 0.3 - hsh(aSeed + 0.37) * 0.15, 0.0, 1.0); fk = fk * fk * (3.0 - 2.0 * fk);',
'  if (uForm < 1.0) p = mix(p + normalize(jit + vec3(0.001)) * (1.4 + hsh(aSeed + 0.71) * 2.2) + vec3(0.0, 0.0, 1.2 * hsh(aSeed + 0.19)), p, fk);',
'  float vis = step(aOrder, uReveal) * mix(0.55, 1.0, fk) * clamp(uForm * 6.0 + 0.25, 0.0, 1.0);',
'  float pop = vis * (1.0 - clamp((uReveal - aOrder) / 0.035, 0.0, 1.0));',
'  float kind = fract(aSeed * 13.7);',
'  float isGold = step(0.86, kind) * (1.0 - uRAct * 0.8);',
'  int ri = int(aReg + 0.5);',
'  float rw = 0.0;',
'  for (int k = 1; k < 6; k++) { if (k == ri) rw = uRW[k]; }',
'  float dd = uNoStag > 0.5 ? uT : clamp(uT * 3.0 - aSeed * 2.0, 0.0, 1.0);',
'  float sprinkle = step(0.9, hsh(aSeed + 0.47));',
'  float gA = icA > 0.5 ? (aGA > 9.5 ? sprinkle : step(7.5, aGA)) : min(aGA, 1.0); float gB = icB > 0.5 ? (aGB > 9.5 ? sprinkle : step(7.5, aGB)) : min(aGB, 1.0);',
'  float cream = mix(step(9.5, aGA), step(9.5, aGB), uNoStag > 0.5 ? uT : clamp(uT * 3.0 - aSeed * 2.0, 0.0, 1.0));',
'  float noRnd = mix(icA, icB, dd);',
'  float g = max(max(isGold * (1.0 - noRnd), mix(gA, gB, dd)), max(rw, onStrand * 0.12));',
'  float arcA = 1.0, arcB = 1.0;',
'  float icVis = mix(arcA, arcB, dd);',
'  float isBall = mix(step(7.5, aGA) * step(aGA, 8.5), step(7.5, aGB) * step(aGB, 8.5), dd);',
'  float rungGold = isRung * step(0.6, hsh(aSeed + 0.2));',
'  float light = mix(aLA, aLB, dd) * (1.0 - 0.72 * uRAct * (1.0 - rw)) * (1.0 + 2.2 * rw);',
'  light = mix(light, (0.55 + 0.6 * clamp(p.z * 0.9 + 0.5, 0.0, 1.0)) * (isRung > 0.5 ? 1.05 * (0.35 + 0.65 * rungFace) : 1.0), step(0.01, onStrand));',
'  light *= icVis;',
'  float band = smoothstep(0.92, 1.0, sin(dot(p, vec3(1.0, 0.45, 0.25)) * 4.0 - uTime * 2.0)) + smoothstep(0.95, 1.0, sin(dot(p, vec3(-0.35, 1.0, 0.55)) * 5.0 - uTime * 1.6 + 1.3));',
'  float imp = 0.0;',
'  if (uImp > 0.0) {',
'    imp += smoothstep(0.965, 1.0, sin(dot(p, vec3(0.8, -0.5, 0.3)) * 9.0 - uTime * 3.1 + aSeed * 0.6));',
'    imp += smoothstep(0.965, 1.0, sin(dot(p, vec3(-0.6, -0.7, 0.4)) * 8.0 - uTime * 2.6 + 2.0));',
'    imp += smoothstep(0.965, 1.0, sin(dot(p, vec3(0.1, 0.9, -0.5)) * 10.0 - uTime * 3.6 + 4.0));',
'    imp += smoothstep(0.965, 1.0, sin(length(p - vec3(0.4, 0.1, 0.0)) * 11.0 - uTime * 2.8));',
'    imp += smoothstep(0.97, 1.0, sin(dot(p, vec3(-0.9, 0.2, -0.3)) * 7.0 - uTime * 2.2 + 1.0));',
'    imp *= uImp * step(0.35, fract(aSeed * 3.71));',
'  }',
'  float ecgP = 0.0;',
'  if (uEcg > 0.0) { float span = uHWv * 2.6; float x0 = mod(uTime * 1.5, span) - span * 0.5; float x1 = mod(uTime * 1.5 + span * 0.5, span) - span * 0.5; ecgP = (exp(-pow((p.x - x0) / 0.28, 2.0)) + exp(-pow((p.x - x1) / 0.28, 2.0))) * uEcg; }',
'  float pulse = clamp(band * (uPulse + rw * 0.6) + imp * 1.2 + ecgP * 1.4, 0.0, 1.6);',
'  vec3 blue = vec3(0.6, 0.78, 1.0); vec3 white = vec3(0.97, 0.96, 0.94); vec3 gold = vec3(1.0, 0.77, 0.4);',
'  vec3 base = kind < 0.6 ? blue : white;',
'  base = mix(base, vec3(1.0, 0.95, 0.86), cream);',
'  g *= uGold; pulse *= uGold; imp *= uGold;',
'  base = mix(vec3(0.94, 0.95, 0.97), base, uGold);',
'  vCol = mix(base, gold, clamp(g + pulse, 0.0, 1.0)) + pop * 0.4 + imp * vec3(0.25, 0.18, 0.05);',
'  vCol = mix(vCol, rungGold > 0.5 ? vec3(1.0, 0.8, 0.46) : vec3(1.0, 0.9, 0.7), onStrand * 0.88);',
'  vec4 mv = modelViewMatrix * vec4(p, 1.0);',
'  float depth = max(-mv.z, 0.05);',
'  float far = clamp(1.15 - (depth - 6.2) * 0.32, 0.35, 1.2);',
'  float size = uPix * (1.25 + aSeed * 0.5 + g * 0.5 + pulse * 1.0 + rw * 1.1 + isBall * 0.6) * (6.2 / depth) * (1.0 + pop * 2.4);',
'  gl_PointSize = clamp(size, 1.0, 22.0);',
'  vCol = mix(vCol, vec3(1.0, 0.78, 0.4) + firePulse * 0.4, fireOn);',
'  vA = vis * uDim * far * mix(light, 0.5 + 2.4 * firePulse, fireOn) * (0.6 + g * 0.3 + pulse * 0.7 + pop * 1.1) * smoothstep(0.35, 1.8, depth);',
'  gl_Position = projectionMatrix * mv;',
'}'
].join('\n');
var FRAG = 'varying vec3 vCol; varying float vA; void main(){ float r = length(gl_PointCoord - vec2(0.5)); float a = vA * (1.0 - smoothstep(0.08, 0.5, r)); if (a < 0.004) discard; gl_FragColor = vec4(vCol * a, a); }';

class Component extends DCLogic {
  componentDidMount() { this._offs = []; this._dead = false; this._t = setTimeout(() => this.boot(0), 20); }
  componentWillUnmount() { this._dead = true; clearTimeout(this._t); clearTimeout(this._rt); this.teardown(); }
  renderVals() { return {}; }
  on(el, ev, fn, opt) { if (!el) return; el.addEventListener(ev, fn, opt); this._offs.push(() => el.removeEventListener(ev, fn, opt)); }
  boot(n) {
    if (this._dead) return;
    if (!window.gsap || !window.ScrollTrigger) { if (n < 60) this._t = setTimeout(() => this.boot(n + 1), 80); return; }
    try { this.setup(); } catch (e) { try { console.warn('[site] plain page fallback', e); this.teardown(); } catch (_) {} }
  }
  teardown() {
    const root = this.root;
    if (this.closeViewer) { try { this.closeViewer(); } catch (e) {} }
    (this._offs || []).forEach((f) => { try { f(); } catch (e) {} });
    this._offs = [];
    this._run = false;
    if (this._raf) cancelAnimationFrame(this._raf);
    if (this.lenis) { try { this.lenis.destroy(); } catch (e) {} this.lenis = null; }
    if (this._tick && window.gsap) { gsap.ticker.remove(this._tick); this._tick = null; }
    if (this.rctx) { try { this.rctx.revert(); } catch (e) {} this.rctx = null; }
    if (this.ctx) { try { this.ctx.revert(); } catch (e) {} this.ctx = null; }
    if (this.G) { try { this.G.pts.geometry.dispose(); this.G.pts.material.dispose(); this.G.renderer.dispose(); } catch (e) {} this.G = null; }
    this.brainShape = null; this.shapes = null; this._secEl = null; this._blk = null; this.slidesEl = null; this.bHero = this.bAI = this.bIn = null;
    if (root) {
      root.classList.remove('js-on', 'gl-on', 'loading', 'menu-open', 'mob', 'nopin', 'viewer-open');
      root.querySelectorAll('.cnt').forEach((el) => { el.textContent = el.dataset.to; });
    }
  }

  setup() {
    const root = this.root = document.querySelector('.fm-root');
    if (!root) return;
    const W = window.innerWidth, H = window.innerHeight;
    if (H > 1500 || H < 300) return;
    this.W = W; this.H = H;
    /* phones: lock the layout height to the tall viewport so Safari's address bar showing or hiding never re-measures the page */
    if (W < 820) { const pr = document.createElement('div'); pr.style.cssText = 'position:absolute;top:0;left:0;width:1px;height:100vh;visibility:hidden;pointer-events:none'; document.body.appendChild(pr); const lv = pr.offsetHeight; pr.remove(); if (lv > H && lv < H * 1.4) this.H = lv; }
    { const fld = root.querySelector('.field'); if (fld) { fld.style.height = W < 820 ? this.H + 'px' : ''; fld.style.bottom = W < 820 ? 'auto' : ''; } }
    this.q = (s) => root.querySelector(s);
    this.qa = (s, el) => Array.prototype.slice.call((el || root).querySelectorAll(s));
    this.reduced = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    this.mob = W < 820;
    this.carPin = !this.reduced;
    root.classList.add('js-on');
    if (this.mob) root.classList.add('mob');
    if (!this.carPin) root.classList.add('nopin');
    gsap.registerPlugin(ScrollTrigger);
    ScrollTrigger.config({ ignoreMobileResize: true });
    this.ctx = gsap.context(() => {}, root);
    this.mx = this.my = this.mxs = this.mys = 0;
    this.st = { reveal: 0, push: 0, form: 1, gold: 1, mv: 1 };
    this.sc = this.findScroller();
    if (this.sc) ScrollTrigger.defaults({ scroller: this.sc });
    if (!this.reduced && !this.sc && window.Lenis) {
      try {
        const lenis = new window.Lenis({ lerp: 0.09, smoothWheel: true, syncTouch: this.mob, syncTouchLerp: 0.1, touchInertiaMultiplier: 28, virtualScroll: (e) => {
          /* lighter scrolling between miGRIND, TAAP and the carousel, and from How I use AI to the end */
          const y = this.scrollY(), z = this.fastZones || [];
          for (let i = 0; i < z.length; i++) if (y >= z[i][0] && y <= z[i][1]) { e.deltaY *= 1.4; break; }
          return true;
        } });
        lenis.on('scroll', ScrollTrigger.update);
        this._tick = (t) => lenis.raf(t * 1000);
        gsap.ticker.add(this._tick); gsap.ticker.lagSmoothing(0);
        this.lenis = lenis;
      } catch (e) { this.lenis = null; }
    }
    this.chrome();
    this.viewer();
    this.glOk = this.makeGL();
    if (this.glOk) root.classList.add('gl-on');
    this.buildScroll();
    this.relayout();
    ScrollTrigger.addEventListener('refresh', this._onRefresh = () => { this.relayout(); });
    this._offs.push(() => ScrollTrigger.removeEventListener('refresh', this._onRefresh));
    const rs = () => { clearTimeout(this._rt); this._rt = setTimeout(() => this.onResize(), 200); };
    this.on(window, 'resize', rs); this.on(window, 'orientationchange', rs); this.on(document, 'fullscreenchange', rs); this.on(document, 'webkitfullscreenchange', rs);
    if (window.visualViewport) this.on(window.visualViewport, 'resize', rs);
    /* watchdog: if the viewport or page height changed without an event, rebuild anyway */
    this._wd = setInterval(() => { if (this._dead) return; if (window.innerWidth !== this._vw || (!this.mob && window.innerHeight !== this._vh)) rs(); else if (Math.abs(document.documentElement.scrollHeight - this._docH) > 4) { ScrollTrigger.refresh(); } }, 700);
    this._offs.push(() => clearInterval(this._wd));
    this.on(document, 'visibilitychange', () => {
      if (document.hidden) { this._run = false; if (this._raf) cancelAnimationFrame(this._raf); }
      else if (!this._run) { this._run = true; this._raf = requestAnimationFrame(this._frame); }
    });
    this.on(document, 'mousemove', (e) => { this.mx = (e.clientX / window.innerWidth) * 2 - 1; this.my = (e.clientY / window.innerHeight) * 2 - 1; });
    /* any late layout change (fonts, images) re-measures every section so shapes stay tied to their own scroll range */
    const relayout = () => { clearTimeout(this._lt); this._lt = setTimeout(() => { if (this._dead) return; ScrollTrigger.refresh(); }, 120); };
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(relayout, () => {});
    if (document.fonts && document.fonts.load) document.fonts.load('120px Allura').then(() => { if (!this._dead && this.G && this.shapes) { this.shapes.words = this.genWords(); this.pairKey = ''; } }, () => {});
    this.on(window, 'load', relayout);
    if (window.ResizeObserver) { let lastH = 0; const ro = new ResizeObserver(() => { const h = this.root.offsetHeight; if (Math.abs(h - lastH) > 2) { lastH = h; relayout(); } }); ro.observe(this.root); this._offs.push(() => ro.disconnect()); }
    this._frame = (now) => this.frame(now);
    this._run = true; this._raf = requestAnimationFrame(this._frame);
    this.loader();
  }
  findScroller() {
    let el = this.root.parentElement;
    while (el && el !== document.body && el !== document.documentElement) {
      const cs = getComputedStyle(el);
      if (/(auto|scroll)/.test(cs.overflowY) && el.scrollHeight > el.clientHeight + 4) return el;
      el = el.parentElement;
    }
    return null;
  }
  scrollY() { return this.sc ? this.sc.scrollTop : (window.scrollY || document.documentElement.scrollTop || 0); }
  VH() { return this.mob ? this.H : window.innerHeight; }
  maxScroll() { return this.sc ? this.sc.scrollHeight - this.sc.clientHeight : document.documentElement.scrollHeight - this.VH(); }
  docTop(el) { const base = this.sc ? this.sc.getBoundingClientRect().top : 0; return el.getBoundingClientRect().top - base + this.scrollY(); }
  scrollToY(y) {
    y = Math.max(0, Math.min(this.maxScroll(), y));
    if (this.lenis) this.lenis.scrollTo(y, { duration: 1.5, force: true });
    else (this.sc || window).scrollTo({ top: y, behavior: this.reduced ? 'auto' : 'smooth' });
  }

  /* ---------- menu and jumps ---------- */
  chrome() {
    const root = this.root, btn = this.q('.menu-btn');
    const setMenu = (o) => { root.classList.toggle('menu-open', o); if (btn) btn.setAttribute('aria-expanded', o ? 'true' : 'false'); if (this.lenis) { if (o) this.lenis.stop(); else this.lenis.start(); } };
    this.setMenu = setMenu;
    this.on(btn, 'click', () => setMenu(!root.classList.contains('menu-open')));
    this.on(document, 'keydown', (e) => { if (e.key === 'Escape') setMenu(false); });
    this.qa('[data-go]').forEach((a) => this.on(a, 'click', (e) => {
      e.preventDefault();
      setMenu(false);
      this.jumpTo(a.dataset.go, a.dataset.slide != null ? Number(a.dataset.slide) : null);
    }));
  }
  jumpTo(id, slide) {
    if (id === 'top') { this.scrollToY(0); return; }
    if (id === 'learned' && slide != null) {
      if (this.carST) { const hd = (this.slideHold || [])[slide] || [0, 0]; this.scrollToY(this.carST.start + (hd[0] + hd[1]) / 2 * (this.carST.end - this.carST.start)); return; }
      const sec = document.getElementById('learned'), track = this.q('.car-track'), sl = this.qa('.slide')[slide];
      this.scrollToY(this.docTop(sec));
      if (track && sl) setTimeout(() => track.scrollTo({ left: sl.offsetLeft - track.offsetLeft, behavior: this.reduced ? 'auto' : 'smooth' }), this.reduced ? 0 : 900);
      return;
    }
    const el = document.getElementById(id);
    if (!el) return;
    let y = this.docTop(el);
    if (id === 'learned' && this.carST) y = this.carST.start + 2;
    this.scrollToY(y);
  }

  /* ---------- scroll-scrubbed text ---------- */
  buildScroll() {
    if (this.rctx) { this.rctx.revert(); this.rctx = null; }
    this.carST = null;
    this.rctx = gsap.context(() => {
      if (!this.reduced) {
        this.qa('.rv').forEach((el) => {
          const words = this.qa('.w', el), lines = [];
          let lastTop = null;
          words.forEach((w) => {
            const t = Math.round(w.parentNode.getBoundingClientRect().top);
            if (lastTop === null || Math.abs(t - lastTop) > 6) { lines.push([]); lastTop = t; }
            lines[lines.length - 1].push(w);
          });
          lines.forEach((ln) => {
            gsap.fromTo(ln, { yPercent: 120 }, { yPercent: 0, ease: 'none', scrollTrigger: { trigger: ln[0].parentNode, start: 'top bottom', end: 'top 78%', scrub: 0.4 } });
          });
        });
        this.qa('.rv-fade').forEach((el) => {
          gsap.fromTo(el, { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, ease: 'none', scrollTrigger: { trigger: el, start: 'top bottom', end: 'top 80%', scrub: 0.4 } });
        });
        gsap.to('.hero-in', { y: -70, autoAlpha: 0, ease: 'none', scrollTrigger: { trigger: '.hero', start: '15% top', end: '75% top', scrub: true } });
        gsap.to('.cue', { autoAlpha: 0, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: '12% top', scrub: true } });
      }
      this.qa('.rv-row').forEach((row) => {
        const tl = gsap.timeline({ paused: true });
        tl.fromTo(row, { autoAlpha: 0, y: 18 }, { autoAlpha: 1, y: 0, duration: 0.5, ease: 'power2.out' }, 0);
        this.qa('.cnt', row).forEach((el) => {
          const to = Number(el.dataset.to) || 0, o = { v: 0 };
          tl.fromTo(o, { v: 0 }, { v: to, duration: 0.7, ease: 'power2.out', onUpdate: () => { el.textContent = String(Math.round(o.v)); } }, 0);
        });
        if (this.reduced) { tl.progress(1); return; }
        ScrollTrigger.create({ trigger: row, start: 'top 94%', onEnter: () => tl.play(), onLeaveBack: () => tl.pause(0) });
        if (row.getBoundingClientRect().top < this.VH() * 0.94) tl.progress(1);
      });
      const track = this.q('.car-track'), slides = this.qa('.slide');
      if (this.carPin && track) {
        const dist = () => Math.max(0, track.scrollWidth - window.innerWidth);
        const nS = slides.length, units = nS - 1;
        const tw = gsap.timeline({ defaults: { ease: 'none' } });
        for (let k = 1; k < nS; k++) tw.to(track, { x: () => -slides[k].offsetLeft, duration: 1 });
        this.slideHold = slides.map((s, k) => [k / units, k / units]);
        const fade = this._fade = () => slides.forEach((s) => { const sc = s.querySelector('.sc'); if (!sc) return; const L = s.getBoundingClientRect().left; const o = Math.max(0, Math.min(1, 1 - Math.abs(L) / (window.innerWidth * 0.55))); sc.style.opacity = String(o); sc.style.transform = 'translate3d(' + (Math.max(0, L) * 0.08) + 'px,0,0)'; });
        this.carST = ScrollTrigger.create({ trigger: '.car', pin: true, start: 'top top', end: () => '+=' + Math.round(this.VH() * 0.58 * units), scrub: 0.3, animation: tw, invalidateOnRefresh: true, onUpdate: fade, onRefresh: fade });
      }
    }, this.root);
  }
  /* miGRIND screens: a focused viewer opened from the phone */
  viewer() {
    const root = this.root, vw = this.q('.viewer'), strip = vw && vw.querySelector('.strip'), btn = this.q('.view-btn');
    if (!vw || !strip || !btn) return;
    const n = strip.children.length, num = vw.querySelector('.v-n'), prev = vw.querySelector('.v-prev'), next = vw.querySelector('.v-next');
    let idx = 0, open = false, lock = 0, tx = null;
    const go = (i) => {
      idx = Math.max(0, Math.min(n - 1, i));
      strip.style.transform = 'translate3d(' + (-idx * 100) + '%,0,0)';
      if (num) num.textContent = '0' + (idx + 1);
      if (prev) prev.disabled = idx === 0;
      if (next) next.disabled = idx === n - 1;
    };
    const setOpen = (o) => {
      open = o; root.classList.toggle('viewer-open', o); vw.setAttribute('aria-hidden', o ? 'false' : 'true');
      if (this.lenis) { if (o) this.lenis.stop(); else this.lenis.start(); }
      document.documentElement.style.overflow = o ? 'hidden' : '';
      if (o) { go(0); const ph = vw.querySelector('.v-phone'); if (ph) vw.style.setProperty('--vw', (ph.offsetWidth / 2) + 'px'); setTimeout(() => { const c = vw.querySelector('.v-close'); if (c) c.focus(); }, 50); }
      else btn.focus();
    };
    this.closeViewer = () => { if (open) setOpen(false); };
    this.on(btn, 'click', () => setOpen(true));
    const ph = this.q('.phone-wrap .phone');
    if (ph) { ph.setAttribute('role', 'button'); ph.setAttribute('tabindex', '0'); ph.setAttribute('aria-label', 'View miGRIND app screens'); this.on(ph, 'click', () => setOpen(true)); this.on(ph, 'keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setOpen(true); } }); }
    this.on(vw.querySelector('.v-close'), 'click', () => setOpen(false));
    this.on(prev, 'click', (e) => { e.stopPropagation(); go(idx - 1); });
    this.on(next, 'click', (e) => { e.stopPropagation(); go(idx + 1); });
    this.on(vw, 'click', (e) => { if (e.target === vw || e.target.classList.contains('v-stage')) setOpen(false); });
    this.on(document, 'keydown', (e) => {
      if (!open) return;
      if (e.key === 'Escape') setOpen(false);
      else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); go(idx + 1); }
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); go(idx - 1); }
    });
    this.on(vw, 'wheel', (e) => {
      e.preventDefault();
      const d = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY, now = performance.now();
      if (Math.abs(d) < 12 || now < lock) return;
      lock = now + 550; go(idx + (d > 0 ? 1 : -1));
    }, { passive: false });
    this.on(vw, 'touchstart', (e) => { tx = e.touches[0].clientX; }, { passive: true });
    this.on(vw, 'touchend', (e) => { if (tx == null) return; const dx = e.changedTouches[0].clientX - tx; tx = null; if (Math.abs(dx) > 40) go(idx + (dx < 0 ? 1 : -1)); }, { passive: true });
    go(0);
  }
  slideCenters() {
    const track = this.q('.car-track'), slides = this.qa('.slide');
    if (!track) return [];
    const vw = window.innerWidth, dist = Math.max(1, track.scrollWidth - vw);
    return slides.map((s) => Math.max(0, Math.min(1, (s.offsetLeft + s.offsetWidth / 2 - vw / 2) / dist)));
  }
  onResize() {
    if (this._dead) return;
    const W = window.innerWidth, H = window.innerHeight;
    if (this.mob && W === this.W) return;
    if ((W < 820) !== this.mob || H > 1500 || !this.root) { this.teardown(); this.setup(); return; }
    this.W = W; this.H = this.mob ? this.H : H;
    if (this.G) {
      this.G.renderer.setSize(W, H, false);
      this.G.camera.aspect = W / H; this.G.camera.updateProjectionMatrix();
    }
    this.slidesEl = null;
    this.buildScroll();
    ScrollTrigger.refresh(true);
    this.relayout();
  }
  /* re-measure every section and rebuild every target at the current viewport, then re-sync to the scroll position */
  /* gold neural firing lines between pairs of points inside the brain */
  /* neural pathways: each region gets its own set of connections between real brain points near it */
  fireLines() { this._fireSets = null; this._fireReg = -1; }
  buildFireSets() {
    const B = this.bIn, n = this.N, S = this.insideS || 2.4;
    if (!B || !this.brainRaw) return null;
    let any = 0; for (let i = 0; i < 300; i++) any += Math.abs(B.p[i * 3]); if (!any) return null;
    const sets = {}, r = this.rng(4711);
    [1, 2, 3].forEach((reg) => {
      const R = mniToRaw(REGIONS[reg].c), C = [R[0] * S, R[1] * S, R[2] * S], near = [];
      for (let i = 0; i < n; i += 3) { const dx = B.p[i * 3] - C[0], dy = B.p[i * 3 + 1] - C[1], dz = B.p[i * 3 + 2] - C[2]; const d = dx * dx + dy * dy + dz * dz; if (d < 1.6 && this.brainL[i] > 0.7) near.push(i); }
      const A = [], Bv = [];
      for (let k = 0; k < 12 && near.length; k++) {
        const ia = near[Math.floor(r() * near.length)];
        let ib = ia, best = 1e9;
        for (let t = 0; t < 120; t++) { const c = near[Math.floor(r() * near.length)]; const dx = B.p[c * 3] - B.p[ia * 3], dy = B.p[c * 3 + 1] - B.p[ia * 3 + 1], dz = B.p[c * 3 + 2] - B.p[ia * 3 + 2]; const d = Math.sqrt(dx * dx + dy * dy + dz * dz); const score = Math.abs(d - (0.45 + r() * 0.5)); if (score < best) { best = score; ib = c; } }
        A.push([B.p[ia * 3], B.p[ia * 3 + 1], B.p[ia * 3 + 2]]); Bv.push([B.p[ib * 3], B.p[ib * 3 + 1], B.p[ib * 3 + 2]]);
      }
      sets[reg] = [A, Bv];
    });
    return sets;
  }
  relayout() {
    this.measureStops();
    if (this.G) { this.buildShapes(); this.pairKey = ''; this.fireLines(); }
    this._vw = window.innerWidth; this._vh = window.innerHeight; this._docH = document.documentElement.scrollHeight;
  }
  /* every shape holds beside its own text block and scrolls with it; the helix starts as the block's last line nears 60% of the screen
     and the next shape is formed by the time the next heading reaches the middle */
  /* one shape per section, fixed at the middle of the screen beside its copy. The DNA transition starts when the bottom of a
     section's text reaches 85% of the viewport and finishes when the next section's heading reaches 40% */
  measureStops() {
    const vh = this.VH(), list = [], mob = this.mob;
    const byId = (id) => document.getElementById(id);
    const T = (el) => this.docTop(el), B = (el) => this.docTop(el) + el.offsetHeight;
    const mid = (el) => T(el) + el.offsetHeight / 2 - vh / 2;
    const add = (y, k, extra) => { const o = { y: y, k: k }; if (extra) Object.assign(o, extra); list.push(o); };
    const enter = (head) => T(head) - 0.4 * vh, leave = (block) => B(block) - 0.85 * vh;
    /* each section's shape is complete when the middle of its text block reaches the middle of the viewport, and starts flowing on from that same point */
    /* a shape is fully formed when its text block's top reaches the middle of the screen, and starts flowing on when the block's centre reaches 70% */
    const holdAt = (top, h, k, extra) => { const ar = top - 0.42 * vh, dp = mob ? Math.max(top + h - 0.38 * vh, ar + 2) : Math.max(top + h / 2 - 0.7 * vh, top - 0.35 * vh); const ex = Object.assign({ track: mob ? top - 0.55 * vh : top + h / 2 - vh / 2 }, extra || {}); add(ar, k, ex); add(dp, k, ex); return [ar, dp]; };
    const hold = (head, block, k, extra) => holdAt(T(block), block.offsetHeight, k, extra);
    add(0, 'brain');
    const paras = this.qa('.story p.big'), regs = [1, 3], scol = this.q('.story .col');
    paras.forEach((p, i) => { const ex = { reg: regs[i] || 3, off: this.insideOff(regs[i] || 3) }; if (i === 0) { add(T(p) - (mob ? 0.75 : 0.62) * vh, 'inside', ex); add(Math.max(T(p) - 0.45 * vh, mid(p) - 0.05 * vh), 'inside', ex); } else add(mid(p), 'inside', ex); });
    if (paras.length) { const lp = paras[paras.length - 1], ri = regs[paras.length - 1] || 3; add(mid(lp) + 0.15 * vh, 'inside', { reg: ri, off: this.insideOff(ri) }); }
    const bld = byId('building');
    if (bld) holdAt(T(bld) + 0.4 * vh, 0.2 * vh, 'words');
    const mhead = this.q('#migrind .p-title'), mcol = this.q(mob ? '#migrind .mg-in' : '#migrind .mg-in .col'), phn = this.q('.phone-wrap .phone');
    if (mhead && mcol) {
      this.webScreenY = null;
      hold(mhead, mcol, 'web', phn ? { track: T(phn) + phn.offsetHeight / 2 - (mob ? 0.32 : 0.5) * vh } : null);
    }
    const thead = this.q('#taap .p-title'), tcol = this.q('#taap .col');
    if (thead && tcol) hold(thead, tcol, 'ball');
    const car = this.q('.car'), ch = this.q('.car-head');
    if (car) {
      if (this.carST && ch) {
        const a = this.carST.start, e = this.carST.end, len = e - a, nS = CAR_KEYS.length;
        const ct = { carTrack: [a, e] };
        add(Math.min(T(ch) - 0.5 * vh, a - 1), 'neuron', ct);
        for (let i = 0; i < nS; i++) add(a + (i / (nS - 1)) * len, CAR_KEYS[i], ct);
        const last = this.qa('.slide')[nS - 1], sc = last && last.querySelector('.sc');
        const scy = sc ? sc.offsetTop + sc.offsetHeight / 2 : vh * 0.5;
        add(e + Math.max(1, scy - 0.7 * vh), CAR_KEYS[nS - 1], ct);
      } else if (ch) { add(enter(car), 'neuron', { car: true, track: T(car) }); add(Math.max(enter(car) + 2, B(car) - 0.75 * vh), 'neuron', { car: true, track: T(car) }); }
    }
    const ahead = this.q('#ai .h2'), acol = this.q('#ai .col');
    if (ahead && acol) hold(ahead, acol, 'brainAI');
    const chd = this.q('#care .care-h'), ccol = this.q('#care .care-in');
    if (chd && ccol) hold(chd, ccol, 'ecg', { track: mid(ccol) });
    const fin = byId('contact'), fn = this.q('.fname');
    if (fin) { const fb = fn ? fn.parentNode : fin; const ay = Math.min(this.maxScroll(), Math.max(T(fb) - 0.5 * vh, mid(fb) - 0.15 * vh)); add(ay, 'arch', { track: ay }); }
    /* phones: every change of shape gets at least half a screen of scrolling so the helix never snaps */
    if (mob) for (let i = 1; i < list.length; i++) { const p0 = list[i - 1], p1 = list[i]; if (p0.k !== p1.k && p0.k !== 'brain' && p1.y - p0.y < 0.55 * vh && i >= 2 && list[i - 2].k === p0.k) p0.y = Math.max(list[i - 2].y + 2, p1.y - 0.55 * vh); }
    const mx = this.maxScroll();
    list.forEach((x) => { x.y = Math.max(0, Math.min(mx, x.y)); if (x.track != null) x.track = Math.min(mx, x.track); });
    for (let i = 1; i < list.length; i++) if (list[i].y <= list[i - 1].y) list[i].y = list[i - 1].y + 1;
    this.stops = list;
    this.carIdx = list.findIndex((x) => x.car);
    this.archY = list[list.length - 1].y;
    this._docH = document.documentElement.scrollHeight;
    { const mgEl = document.getElementById('migrind'), aiEl = document.getElementById('ai'), z = [];
      if (mgEl && this.carST) z.push([this.docTop(mgEl) - 0.2 * vh, this.carST.start - 2]);
      if (aiEl) z.push([this.docTop(aiEl) - 0.3 * vh, this.maxScroll() + 10]);
      this.fastZones = z; }
  }
  insideOff(reg) {
    const S = this.insideS || 2.4, R = mniToRaw(REGIONS[reg].c), T = this.mob ? [0, 1.05, 2.5] : [1.2, 0.05, 2.7];
    return [T[0] - R[0] * S, T[1] - R[1] * S, T[2] - R[2] * S];
  }
  mAt(y) {
    const S = this.stops;
    if (!S || !S.length || y <= S[0].y) return 0;
    for (let i = 0; i < S.length - 1; i++) {
      if (y < S[i + 1].y) {
        const f = (y - S[i].y) / Math.max(1, S[i + 1].y - S[i].y);
        const e = i === 0 ? Math.min(1, f / 0.9) : f;
        return i + (i === 0 ? e : e * e * (3 - 2 * e));
      }
    }
    return S.length - 1;
  }

  /* ---------- particles ---------- */
  makeGL() {
    const THREE = window.THREE;
    if (!THREE) return false;
    let renderer;
    try { renderer = new THREE.WebGLRenderer({ canvas: this.q('.field'), antialias: false, alpha: true, premultipliedAlpha: true, powerPreference: 'high-performance' }); } catch (e) { return false; }
    if (!renderer || !renderer.getContext()) return false;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, this.mob ? 1.5 : 1.75));
    renderer.setSize(this.W, this.H, false);
    renderer.setClearColor(0x000000, 0);
    const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(40, this.W / this.H, 0.05, 120);
    camera.position.set(0, 0, 6.6);
    this.G = { THREE: THREE, renderer: renderer, scene: scene, camera: camera };
    const n = this.mob ? 9000 : 24000;
    this.N = n;
    const geo = new THREE.BufferGeometry();
    const r = this.rng(11), seed = new Float32Array(n), ord = new Float32Array(n).fill(2);
    for (let i = 0; i < n; i++) seed[i] = r();
    this.seed = seed;
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 3), 3));
    ['aFrom', 'aTo'].forEach((k) => geo.setAttribute(k, new THREE.BufferAttribute(new Float32Array(n * 3), 3)));
    ['aGA', 'aGB', 'aLA', 'aLB'].forEach((k) => geo.setAttribute(k, new THREE.BufferAttribute(new Float32Array(n), 1)));
    geo.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1));
    geo.setAttribute('aOrder', new THREE.BufferAttribute(ord, 1));
    this.reg = new Float32Array(n);
    geo.setAttribute('aReg', new THREE.BufferAttribute(this.reg, 1));
    const V3 = () => new THREE.Vector3();
    const mat = new THREE.ShaderMaterial({
      vertexShader: VERT, fragmentShader: FRAG, transparent: true, depthWrite: false, depthTest: false, blending: THREE.CustomBlending,
      blendEquation: THREE.AddEquation, blendSrc: THREE.OneFactor, blendDst: THREE.OneFactor,
      uniforms: {
        uT: { value: 0 }, uCA: { value: V3() }, uCB: { value: V3() }, uRA: { value: 0 }, uRB: { value: 0 }, uSA: { value: 1 }, uSB: { value: 1 }, uVC: { value: V3() },
        uNoStag: { value: 0 }, uStrand: { value: 1 }, uSag: { value: 0.3 }, uImp: { value: 0 }, uKaS: { value: 0.32 }, uKA: { value: 0 }, uKB: { value: 0 }, uScA: { value: 1 }, uScB: { value: 1 }, uM: { value: V3() }, uEcg: { value: 0 }, uHWv: { value: 3 }, uOffA: { value: V3() }, uOffB: { value: V3() },
        uForm: { value: 1 }, uGold: { value: 1 }, uRW: { value: [0, 0, 0, 0, 0, 0] }, uRAct: { value: 0 }, uFire: { value: 0 }, uFA: { value: Array.from({ length: 12 }, () => V3()) }, uFB: { value: Array.from({ length: 12 }, () => V3()) },
        uTime: { value: 0 }, uReveal: { value: 0 }, uPix: { value: renderer.getPixelRatio() }, uPulse: { value: 0.5 }, uDim: { value: 1 }
      }
    });
    const pts = new THREE.Points(geo, mat); pts.frustumCulled = false;
    scene.add(pts);
    this.G.pts = pts; this.G.mat = mat; this.G.ord = ord;
    /* one bright point that leads the flow along the helix */
    const lg = new THREE.BufferGeometry(); lg.setAttribute('position', new THREE.BufferAttribute(new Float32Array(3), 3));
    const lm = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending, uniforms: { uA: { value: 0 }, uS: { value: 30 * renderer.getPixelRatio() } },
      vertexShader: 'uniform float uS; void main(){ vec4 mv = modelViewMatrix * vec4(position, 1.0); gl_PointSize = uS * 6.2 / max(-mv.z, 0.5); gl_Position = projectionMatrix * mv; }',
      fragmentShader: 'uniform float uA; void main(){ float r = length(gl_PointCoord - vec2(0.5)); float a = exp(-r * r * 38.0) + 0.6 * exp(-r * r * 260.0); gl_FragColor = vec4(vec3(1.0, 0.93, 0.78) * a * uA, a * uA); }' });
    const lead = new THREE.Points(lg, lm); lead.frustumCulled = false; scene.add(lead); this.G.lead = lead;
    this.brainRaw = new Float32Array(n * 3); this.brainL = new Float32Array(n).fill(0.6);
    this.buildShapes();
    return true;
  }
  rng(seed) { let s = seed >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
  gauss(r) { return Math.sqrt(-2 * Math.log(Math.max(1e-6, r()))) * Math.cos(2 * Math.PI * r()); }
  catmull(pts, u) {
    const n = pts.length - 1, s = Math.min(n - 1e-6, Math.max(0, u * n)), i = Math.floor(s), f = s - i;
    const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(n, i + 2)], f2 = f * f, f3 = f2 * f, o = [0, 0, 0];
    for (let k = 0; k < 3; k++) o[k] = 0.5 * (2 * p1[k] + (-p0[k] + p2[k]) * f + (2 * p0[k] - 5 * p1[k] + 4 * p2[k] - p3[k]) * f2 + (-p0[k] + 3 * p1[k] - 3 * p2[k] + p3[k]) * f3);
    return o;
  }
  H0() { return 6.6 * Math.tan((40 * Math.PI / 180) / 2); }
  HW() { return this.H0() * this.W / this.H; }

  gen(id, n) {
    const r = this.rng(id === 'heart' ? 100 + 4 * 37 + 98 : 100 + id.length * 37 + id.charCodeAt(0)), G = (x) => this.gauss(r) * x;
    const p = new Float32Array(n * 3), g = new Float32Array(n), l = new Float32Array(n).fill(1), obj = new Int8Array(n).fill(-1);
    let i = 0, cur = -1;
    const put = (x, y, z, gold, lt) => { if (i >= n) return; p[i * 3] = x; p[i * 3 + 1] = y; p[i * 3 + 2] = z; g[i] = gold ? 1 : 0; l[i] = lt == null ? 1 : lt; obj[i] = cur; i++; };
    const sph = (cx, cy, cz, rad, gold, lt) => { const u = r() * 2 - 1, a = r() * 6.2832, s = Math.sqrt(1 - u * u); put(cx + rad * s * Math.cos(a), cy + rad * u, cz + rad * s * Math.sin(a), gold, lt); };
    const seg = (A, B, jit, gold, lt) => { const t = r(); put(A[0] + (B[0] - A[0]) * t + G(jit), A[1] + (B[1] - A[1]) * t + G(jit), A[2] + (B[2] - A[2]) * t + G(jit), gold, lt); };
    const curve = (pts, jit, gold, lt) => { const q = this.catmull(pts, r()); put(q[0] + G(jit), q[1] + G(jit), q[2] + G(jit), gold, lt); };
    const ring = (cx, cy, cz, rad, axis, jit, gold, lt, a0, a1) => { const a = (a0 || 0) + r() * ((a1 == null ? 6.2832 : a1) - (a0 || 0)); const c = Math.cos(a) * rad, s = Math.sin(a) * rad; if (axis === 'z') put(cx + c + G(jit), cy + s + G(jit), cz + G(jit), gold, lt); else if (axis === 'x') put(cx + G(jit), cy + s + G(jit), cz + c + G(jit), gold, lt); else put(cx + c + G(jit), cy + G(jit), cz + s + G(jit), gold, lt); };
    const share = (f) => Math.floor(n * f);
    if (id === 'web') {
      const C = { book: [-1.15, 0.72, 0], ball: [1.15, 0.78, 0], apple: [-1.1, -0.78, 0], dumb: [1.15, -0.78, 0] };
      cur = 0;
      for (let k = 0; k < share(0.21); k++) {
        const side = r() < 0.5 ? -1 : 1, ang = 0.42, w = 0.62, h = 0.82, mode = r();
        let uu, vv;
        if (mode < 0.4) { const e = r() * 4; if (e < 1) { uu = e; vv = 0.5; } else if (e < 2) { uu = e - 1; vv = -0.5; } else if (e < 3) { uu = 1; vv = e - 2.5; } else { uu = 0; vv = e - 3.5; } }
        else if (mode < 0.85) { const ln = Math.floor(r() * 7); uu = 0.12 + r() * 0.76; vv = 0.36 - ln * 0.12; if (r() < 0.25) continue; }
        else { uu = r(); vv = r() - 0.5; }
        const x = side * uu * w * Math.cos(ang), z = uu * w * Math.sin(ang) * 0.9 - uu * uu * 0.08;
        put(C.book[0] + x, C.book[1] + vv * h, C.book[2] + z, mode < 0.05, mode >= 0.85 ? 0.3 : 1);
      }
      cur = 1;
      for (let k = 0; k < share(0.2); k++) {
        const c = C.ball, rad = 0.42, m = r();
        if (m < 0.7) sph(c[0], c[1], c[2], rad, false, 0.9);
        else { const s = Math.floor(r() * 4); if (s === 0) ring(c[0], c[1], c[2], rad, 'y', 0.006, true); else if (s === 1) ring(c[0], c[1], c[2], rad, 'x', 0.006, true); else { const xo = s === 2 ? 0.26 : -0.26; ring(c[0] + xo, c[1], c[2], Math.sqrt(rad * rad - xo * xo), 'x', 0.006, true); } }
      }
      cur = 2;
      for (let k = 0; k < share(0.2); k++) {
        const c = C.apple, m = r();
        if (m < 0.86) {
          const u = r() * 2 - 1, a = r() * 6.2832, s = Math.sqrt(1 - u * u);
          let x = s * Math.cos(a) * 0.44, y = u * 0.4; const z = s * Math.sin(a) * 0.44;
          const rr2 = x * x + z * z;
          if (y > 0) y -= 0.12 * Math.exp(-rr2 / 0.02); else y += 0.07 * Math.exp(-rr2 / 0.02);
          x *= 1 + 0.08 * u; put(c[0] + x, c[1] + y, c[2] + z, false, 0.95);
        } else if (m < 0.92) seg([c[0], c[1] + 0.28, c[2]], [c[0] + 0.05, c[1] + 0.52, c[2]], 0.008, true);
        else { const a = r() * 6.2832, rr = Math.sqrt(r()); const lx = Math.cos(a) * 0.14 * rr, ly = Math.sin(a) * 0.06 * rr; put(c[0] + 0.14 + lx * 0.9 - ly * 0.4, c[1] + 0.5 + lx * 0.4 + ly * 0.9, c[2], true, 0.9); }
      }
      cur = 3;
      for (let k = 0; k < share(0.2); k++) {
        const c = C.dumb, m = r();
        if (m < 0.22) { const a = r() * 6.2832; put(c[0] + (r() - 0.5) * 1.0, c[1] + Math.cos(a) * 0.035, c[2] + Math.sin(a) * 0.035, false, 1); }
        else { const sgn = r() < 0.5 ? -1 : 1, pl = Math.floor(r() * 2), x = sgn * (0.32 + pl * 0.1), rad = pl ? 0.2 : 0.26, a = r() * 6.2832, rr = r() < 0.6 ? 1 : Math.sqrt(r()); put(c[0] + x + (r() - 0.5) * 0.06, c[1] + Math.cos(a) * rad * rr, c[2] + Math.sin(a) * rad * rr, rr === 1 && r() < 0.15, 1); }
      }
      /* threads: every object feeds into the app at the centre */
      const keys = ['book', 'ball', 'dumb', 'apple'];
      while (i < n) {
        const oi = Math.floor(r() * 4); cur = 4 + [0, 1, 3, 2][oi]; const A = C[keys[oi]];
        const mid = [A[0] * 0.55, A[1] * 0.2, -0.25], end = [A[0] * 0.08, A[1] * 0.05, -0.4];
        curve([A, mid, end], 0.005, true, 0.6);
      }
    } else if (id === 'ball' || id === 'heart') {
      /* identical shell in both; only the small core changes, so the ball stays intact */
      for (let k = 0; k < share(0.66); k++) sph(0, 0, 0, 1, false, 0.82);
      for (let k = 0; k < share(0.2); k++) {
        const s = Math.floor(r() * 4);
        if (s === 0) ring(0, 0, 0, 1, 'y', 0.007, true, 1.05); else if (s === 1) ring(0, 0, 0, 1, 'x', 0.007, true, 1.05);
        else { const xo = s === 2 ? 0.6 : -0.6; ring(xo, 0, 0, 0.8, 'x', 0.007, true, 1.05); }
      }
      const r2 = this.rng(909);
      while (i < n) {
        if (id === 'ball') { const u = r2() * 2 - 1, a = r2() * 6.2832, s = Math.sqrt(1 - u * u), rr = 0.16 * Math.cbrt(r2()); put(rr * s * Math.cos(a), rr * u, rr * s * Math.sin(a), false, 0.18); }
        else {
          const t = r2() * 6.2832, hx = 16 * Math.pow(Math.sin(t), 3), hy = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
          const s = Math.sqrt(r2()), sc = 0.36 / 16;
          put(hx * sc * s, (hy * sc + 0.03) * s + 0.04, this.gauss(r2) * 0.05 * (1 - s * s * 0.7), true, 1.1);
        }
      }
    } else if (id === 'neuron') {
      const soma = [-0.95, 0.08, 0];
      for (let k = 0; k < share(0.13); k++) sph(soma[0], soma[1], soma[2], 0.22 + G(0.01), false, 1.05);
      for (let k = 0; k < share(0.03); k++) sph(soma[0], soma[1], soma[2], 0.08 * Math.sqrt(r()), true, 1.2);
      const dend = [];
      for (let d = 0; d < 7; d++) {
        const a = 1.2 + d * 0.62 + (r() - 0.5) * 0.2, L = 0.55 + r() * 0.35;
        const p0 = [soma[0] + Math.cos(a) * 0.2, soma[1] + Math.sin(a) * 0.2, 0], p1 = [soma[0] + Math.cos(a) * L * 0.55, soma[1] + Math.sin(a) * L * 0.55 + (r() - 0.5) * 0.1, (r() - 0.5) * 0.2], p2 = [soma[0] + Math.cos(a + 0.2) * L, soma[1] + Math.sin(a + 0.2) * L, (r() - 0.5) * 0.3];
        dend.push([p0, p1, p2]);
        dend.push([p1, [p1[0] + Math.cos(a - 0.6) * 0.25, p1[1] + Math.sin(a - 0.6) * 0.25, p1[2]], [p1[0] + Math.cos(a - 0.8) * 0.4, p1[1] + Math.sin(a - 0.8) * 0.4, p1[2] + 0.05]]);
      }
      for (let k = 0; k < share(0.32); k++) curve(dend[Math.floor(r() * dend.length)], 0.011, false, 0.95);
      const axon = [[soma[0] + 0.2, soma[1] - 0.03, 0], [-0.2, -0.12, 0.05], [0.4, 0.05, -0.05], [0.95, -0.08, 0]];
      for (let k = 0; k < share(0.22); k++) { const u = r(); if ((u * 9) % 1 < 0.18) continue; const q = this.catmull(axon, u); put(q[0] + G(0.018), q[1] + G(0.018), q[2] + G(0.018), (u * 9) % 1 > 0.9, 1); }
      const ends = [];
      for (let t = 0; t < 5; t++) { const a = -0.9 + t * 0.45; ends.push([[0.95, -0.08, 0], [1.1 + Math.cos(a) * 0.12, -0.08 + Math.sin(a) * 0.18, 0.05], [1.12 + Math.cos(a) * 0.28, -0.08 + Math.sin(a) * 0.36, (r() - 0.5) * 0.2]]); }
      for (let k = 0; k < share(0.11); k++) curve(ends[Math.floor(r() * ends.length)], 0.008, false, 1);
      for (let k = 0; k < share(0.1); k++) { const e = ends[Math.floor(r() * ends.length)][2]; sph(e[0], e[1], e[2], 0.05, true, 1.2); }
      while (i < n) { const e = ends[Math.floor(r() * ends.length)][2]; put(e[0] + 0.07 + Math.abs(G(0.06)), e[1] + G(0.06), e[2] + G(0.04), true, 0.8); }
    } else if (id === 'dna') {
      const H2 = 1.6, turns = 2.4;
      for (let k = 0; k < share(0.6); k++) { const y = (r() * 2 - 1) * H2, th = (y / H2) * Math.PI * turns + (r() < 0.5 ? 0 : Math.PI); put(Math.cos(th) * 0.45 + G(0.018), y + G(0.01), Math.sin(th) * 0.45 + G(0.018), false, 1.05); }
      while (i < n) { const rung = Math.floor(r() * 27), y = -H2 + (rung + 0.5) * (2 * H2 / 27), th = (y / H2) * Math.PI * turns, t = r(); const ax = Math.cos(th) * 0.45, az = Math.sin(th) * 0.45; put(ax + (-2 * ax) * t + G(0.007), y + G(0.005), az + (-2 * az) * t + G(0.007), true, 1.0); }
    } else if (id === 'play') {
      const T = (x, y) => [x, y * Math.cos(0.5), -y * Math.sin(0.5)];
      const line = (a, b, gold, lt) => { const t = r(); const q = T(a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t); put(q[0] + G(0.005), q[1] + G(0.005), q[2] + G(0.005), gold, lt); };
      const arc = (cx, cy, rad, a0, a1, gold, lt) => { const a = a0 + r() * (a1 - a0); const q = T(cx + Math.cos(a) * rad, cy + Math.sin(a) * rad); put(q[0] + G(0.005), q[1] + G(0.005), q[2], gold, lt); };
      for (let k = 0; k < share(0.17); k++) { const e = r() * 4; if (e < 1) line([-1.2, 0.8], [1.2, 0.8]); else if (e < 2) line([-1.2, -0.8], [1.2, -0.8]); else if (e < 3) line([-1.2, -0.8], [-1.2, 0.8]); else line([1.2, -0.8], [1.2, 0.8]); }
      for (let k = 0; k < share(0.07); k++) { const e = r() * 3; if (e < 1) line([-0.3, 0.8], [-0.3, 0.15]); else if (e < 2) line([0.3, 0.8], [0.3, 0.15]); else line([-0.3, 0.15], [0.3, 0.15]); }
      for (let k = 0; k < share(0.05); k++) arc(0, 0.15, 0.3, Math.PI, 2 * Math.PI);
      for (let k = 0; k < share(0.09); k++) arc(0, 0.66, 0.95, Math.PI * 1.08, Math.PI * 1.92);
      for (let k = 0; k < share(0.03); k++) arc(0, 0.66, 0.06, 0, 6.28, true, 1.2);
      const O = [[-0.75, -0.25], [-0.2, -0.55], [0.5, -0.4], [0.85, 0.15], [-0.6, 0.35]], X = [[-0.6, -0.05], [-0.1, -0.3], [0.4, -0.15], [0.65, 0.3], [-0.4, 0.5]];
      for (let k = 0; k < share(0.14); k++) { const o = O[Math.floor(r() * 5)]; arc(o[0], o[1], 0.07, 0, 6.28, false, 1.15); }
      for (let k = 0; k < share(0.14); k++) { const x = X[Math.floor(r() * 5)], s = r() < 0.5 ? 1 : -1, t = r() * 2 - 1; const q = T(x[0] + t * 0.06, x[1] + s * t * 0.06); put(q[0], q[1], q[2], false, 1.15); }
      const arrows = [[O[0], [-0.55, -0.1], [-0.35, 0.05]], [O[1], [0.0, -0.35], [0.15, -0.12]], [O[2], [0.65, -0.2], [0.72, 0.0]], [O[3], [0.5, 0.35], [0.15, 0.45]]];
      while (i < n) {
        const a = arrows[Math.floor(r() * arrows.length)], u = r();
        if (u < 0.85) { const pts = a.map((v) => [v[0], v[1], 0]); const q = this.catmull(pts, u / 0.85 * 0.92 + 0.04); const t3 = T(q[0], q[1]); put(t3[0] + G(0.004), t3[1] + G(0.004), t3[2], true, 1.1); }
        else { const e = a[2], d0 = a[1], dx = e[0] - d0[0], dy = e[1] - d0[1], L = Math.hypot(dx, dy), ux = dx / L, uy = dy / L, side = r() < 0.5 ? 1 : -1, t = r() * 0.1; const q = T(e[0] - ux * t + (-uy) * side * t * 0.7, e[1] - uy * t + ux * side * t * 0.7); put(q[0], q[1], q[2], true, 1.15); }
      }
    } else if (id === 'coach') {
      /* a young athlete in a set shooting position (three-quarter view, facing right) with his coach just behind;
         g codes: 5 still, 6 athlete upper body, 7 shooting arms, 8 ball */
      const C = (ax, ay, bx, by, ra, rb, code, w, z, lt) => ({ t: 'c', ax: ax, ay: ay, bx: bx, by: by, ra: ra, rb: rb == null ? ra : rb, code: code, w: w, z: z || 0, lt: lt || 1 });
      const E = (cx, cy, rx, ry, code, w, z, lt) => ({ t: 'e', cx: cx, cy: cy, rx: rx, ry: ry, code: code, w: w, z: z || 0, lt: lt || 1 });
      const Rc = (x0, y0, x1, y1, code, w, z, lt) => ({ t: 'r', x0: x0, y0: y0, x1: x1, y1: y1, code: code, w: w, z: z || 0, lt: lt || 1 });
      const cz = -0.28, cl = 0.78;
      const parts = [
        /* coach: hoodie, joggers, facing the athlete */
        E(0.86, 1.83, 0.105, 0.13, 5, 0.026, cz, cl), E(0.93, 1.69, 0.1, 0.075, 5, 0.012, cz, cl),
        C(0.87, 1.69, 0.88, 1.6, 0.055, 0.06, 5, 0.008, cz, cl),
        C(0.88, 1.52, 0.9, 1.08, 0.2, 0.18, 5, 0.085, cz, cl), C(0.72, 1.55, 1.04, 1.55, 0.09, 0.09, 5, 0.03, cz, cl),
        C(0.76, 1.02, 1.0, 1.02, 0.1, 0.1, 5, 0.026, cz, cl),
        C(0.8, 0.96, 0.78, 0.52, 0.095, 0.075, 5, 0.03, cz, cl), C(0.78, 0.52, 0.79, 0.12, 0.072, 0.058, 5, 0.024, cz, cl),
        C(0.96, 0.96, 0.98, 0.52, 0.095, 0.075, 5, 0.03, cz, cl), C(0.98, 0.52, 0.99, 0.12, 0.072, 0.058, 5, 0.024, cz, cl),
        C(0.68, 0.06, 0.82, 0.06, 0.05, 0.05, 5, 0.008, cz, cl), C(0.9, 0.06, 1.03, 0.06, 0.05, 0.05, 5, 0.008, cz, cl),
        C(0.73, 1.52, 0.65, 1.26, 0.07, 0.06, 5, 0.018, cz, cl), C(0.65, 1.26, 0.6, 1.47, 0.058, 0.05, 5, 0.014, cz, cl), E(0.595, 1.53, 0.04, 0.065, 5, 0.006, cz, cl),
        C(1.03, 1.52, 1.08, 1.24, 0.07, 0.06, 5, 0.018, cz, cl), C(1.08, 1.24, 1.02, 1.1, 0.058, 0.05, 5, 0.012, cz, cl),
        Rc(0.98, 0.94, 1.15, 1.26, 5, 0.026, cz + 0.05, 0.9), Rc(1.04, 1.25, 1.1, 1.29, 5, 0.003, cz + 0.05, 1.1),
        /* athlete: jersey, shorts, knees slightly bent, ball set in front of his face */
        E(0.22, 1.56, 0.095, 0.115, 6, 0.024, 0.08), E(0.2, 1.64, 0.1, 0.055, 6, 0.008, 0.08, 1.1),
        C(0.18, 1.45, 0.17, 1.38, 0.045, 0.048, 6, 0.006, 0.06),
        C(0.04, 1.33, 0.25, 1.33, 0.06, 0.06, 6, 0.016, 0.06), C(0.13, 1.32, 0.12, 1.02, 0.135, 0.12, 6, 0.05, 0.06), C(0.11, 1.0, 0.1, 0.88, 0.12, 0.125, 6, 0.016, 0.06),
        C(0.02, 0.86, 0.2, 0.86, 0.1, 0.1, 5, 0.018, 0.06), C(0.05, 0.84, 0.09, 0.63, 0.1, 0.095, 5, 0.022, 0.03), C(0.17, 0.84, 0.25, 0.63, 0.1, 0.095, 5, 0.022, 0.09),
        C(0.09, 0.62, 0.11, 0.5, 0.06, 0.055, 5, 0.007, 0.03), C(0.11, 0.5, 0.03, 0.1, 0.055, 0.045, 5, 0.018, 0.03),
        C(0.25, 0.62, 0.27, 0.48, 0.06, 0.055, 5, 0.007, 0.09), C(0.27, 0.48, 0.21, 0.1, 0.055, 0.045, 5, 0.018, 0.09),
        C(-0.01, 0.05, 0.12, 0.05, 0.045, 0.04, 5, 0.007, 0.03), C(0.19, 0.05, 0.33, 0.05, 0.045, 0.04, 5, 0.007, 0.09),
        C(0.21, 1.31, 0.34, 1.21, 0.048, 0.042, 7, 0.012, 0.14), C(0.34, 1.21, 0.38, 1.44, 0.042, 0.036, 7, 0.012, 0.16), E(0.39, 1.49, 0.04, 0.06, 7, 0.006, 0.17),
        C(0.06, 1.31, 0.24, 1.24, 0.045, 0.04, 7, 0.01, 0.0), C(0.24, 1.24, 0.37, 1.58, 0.04, 0.034, 7, 0.01, 0.02), E(0.39, 1.63, 0.035, 0.055, 7, 0.005, 0.04)
      ];
      const tot = parts.reduce((s0, q) => s0 + q.w, 0), body = 0.88;
      parts.forEach((q) => {
        const cnt = Math.floor(n * body * q.w / tot);
        for (let k = 0; k < cnt; k++) {
          const edge = r() < 0.5;
          let x, y, dz = 0;
          if (q.t === 'c') { const tt = r(), rad = q.ra + (q.rb - q.ra) * tt, a = r() * 6.2832, rr = rad * (edge ? 0.88 + r() * 0.12 : Math.sqrt(r())); x = q.ax + (q.bx - q.ax) * tt + Math.cos(a) * rr; y = q.ay + (q.by - q.ay) * tt + Math.sin(a) * rr; dz = Math.sin(a) * rad * 0.6; }
          else if (q.t === 'e') { const a = r() * 6.2832, rr = edge ? 0.88 + r() * 0.12 : Math.sqrt(r()); x = q.cx + Math.cos(a) * q.rx * rr; y = q.cy + Math.sin(a) * q.ry * rr; dz = Math.sin(a) * q.rx * 0.5; }
          else { if (edge) { const e = r() * 4; if (e < 1) { x = q.x0 + (q.x1 - q.x0) * e; y = q.y0; } else if (e < 2) { x = q.x0 + (q.x1 - q.x0) * (e - 1); y = q.y1; } else if (e < 3) { x = q.x0; y = q.y0 + (q.y1 - q.y0) * (e - 2); } else { x = q.x1; y = q.y0 + (q.y1 - q.y0) * (e - 3); } } else { x = q.x0 + (q.x1 - q.x0) * r(); y = q.y0 + (q.y1 - q.y0) * (0.25 + Math.floor(r() * 4) * 0.17); } }
          /* simple depth shading: lit from the upper right */
          const shade = 0.75 + 0.35 * Math.max(-1, Math.min(1, (x - (q.t === 'c' ? (q.ax + q.bx) / 2 : (q.t === 'e' ? q.cx : (q.x0 + q.x1) / 2))) * 6));
          const st = i; put(x + G(0.004), y + G(0.004), q.z + dz + G(0.01), false, (edge ? 1.9 : 0.95) * q.lt * shade); if (i > st) g[st] = q.code;
        }
      });
      const bc = [0.47, 1.57], br = 0.125;
      while (i < n * 0.985) {
        const st = i, m = r();
        if (m < 0.82) { const u = r() * 2 - 1, a = r() * 6.2832, s0 = Math.sqrt(1 - u * u), rr = br * (r() < 0.6 ? 1 : Math.cbrt(r())); put(bc[0] + rr * s0 * Math.cos(a), bc[1] + rr * u, 0.2 + rr * s0 * Math.sin(a), true, 0.75); }
        else { const a = r() * 6.2832, sm = Math.floor(r() * 3); if (sm === 0) put(bc[0] + Math.cos(a) * br, bc[1] + Math.sin(a) * br * 0.22, 0.24, true, 0.95); else put(bc[0] + Math.cos(a) * br * (sm === 1 ? 0.3 : 0.92), bc[1] + Math.sin(a) * br, 0.26, true, 0.95); }
        if (i > st) g[st] = 8;
      }
    }
    while (i < n) { const st = i; if (id === 'coach') { put(0.47 + G(0.03), 1.57 + G(0.03), 0.2, true, 0); g[st] = 8; } else put(G(0.3), G(0.3), G(0.3), false, 0.15); }
    return { p: p, g: g, l: l, obj: obj };
  }

  /* sample the script lettering so the particles themselves write the line */
  genWords() {
    const n = this.N, mob = this.mob, fs = 160, font = fs + 'px Allura, "Snell Roundhand", cursive';
    const lines = mob ? ['So I started', 'building'] : ['So I started building'];
    const cv = document.createElement('canvas'), cx = cv.getContext('2d');
    cx.font = font;
    const widths = lines.map((s) => cx.measureText(s).width);
    const lh = fs * 1.05, pad = fs * 0.4, dotsW = fs * 0.55;
    const cw = Math.ceil(Math.max.apply(null, widths) + dotsW + pad * 2), ch = Math.ceil(lh * lines.length + pad * 2);
    cv.width = cw; cv.height = ch;
    cx.font = font; cx.fillStyle = '#fff'; cx.textBaseline = 'alphabetic';
    const lastW = widths[widths.length - 1], baseLast = pad + lh * (lines.length - 1) + fs * 0.8;
    lines.forEach((s, k) => cx.fillText(s, mob ? (cw - dotsW - widths[k]) / 2 : pad, pad + lh * k + fs * 0.8));
    const img = cx.getImageData(0, 0, cw, ch).data, pix = [];
    for (let y = 0; y < ch; y += 1) for (let x = 0; x < cw; x += 1) if (img[(y * cw + x) * 4 + 3] > 120) pix.push(x, y);
    const r = this.rng(31), p = new Float32Array(n * 3), g = new Float32Array(n), l = new Float32Array(n);
    const nd = Math.floor(n * 0.03), nt = n - nd * 3, cnt = pix.length / 2;
    const s = 0.01;
    for (let i = 0; i < nt; i++) {
      const k = cnt ? Math.floor(r() * cnt) : 0;
      const x = cnt ? pix[k * 2] + r() - 0.5 : r() * cw, y = cnt ? pix[k * 2 + 1] + r() - 0.5 : r() * ch;
      p[i * 3] = x * s; p[i * 3 + 1] = -y * s; p[i * 3 + 2] = this.gauss(r) * 0.02; g[i] = 10; l[i] = 0.95;
    }
    const x0 = (mob ? (cw - dotsW - lastW) / 2 : pad) + lastW;
    for (let dI = 0; dI < 3; dI++) {
      const dcx = x0 + fs * (0.1 + dI * 0.16), dcy = baseLast - fs * 0.04, rad = fs * 0.032;
      for (let j = 0; j < nd; j++) {
        const i = nt + dI * nd + j, a = r() * 6.2832, rr = Math.sqrt(r()) * rad;
        p[i * 3] = (dcx + Math.cos(a) * rr) * s; p[i * 3 + 1] = -(dcy + Math.sin(a) * rr) * s; p[i * 3 + 2] = 0; g[i] = 10; l[i] = 0.9;
      }
    }
    return this.fit({ p: p, g: g, l: l }, mob ? [-0.9, 0.9, -0.32, 0.32] : [-0.84, 0.84, -0.3, 0.3], false, mob ? [-0.9, 0.9, -0.32, 0.32] : null);
  }
  fit(raw, rect, rot, mobRect) {
    const n = this.N, P = raw.p, H0 = this.H0(), hw = this.HW();
    let minx = 1e9, maxx = -1e9, miny = 1e9, maxy = -1e9, minz = 1e9, maxz = -1e9;
    /* size from the visible structure only, ignoring faint background speckles */
    for (let i = 0; i < n; i++) { if (raw.l[i] < 0.3) continue; const x = P[i * 3], y = P[i * 3 + 1], z = P[i * 3 + 2]; if (x < minx) minx = x; if (x > maxx) maxx = x; if (y < miny) miny = y; if (y > maxy) maxy = y; if (z < minz) minz = z; if (z > maxz) maxz = z; }
    const cx = (minx + maxx) / 2, cy = (miny + maxy) / 2, cz = (minz + maxz) / 2;
    let rw = maxx - minx;
    if (rot) { let m = 0; for (let i = 0; i < n; i++) { if (raw.l[i] < 0.3) continue; const dx = P[i * 3] - cx, dz = P[i * 3 + 2] - cz; const d = dx * dx + dz * dz; if (d > m) m = d; } rw = 2 * Math.sqrt(m); }
    const rh = maxy - miny;
    const R = this.mob ? (mobRect || RECT_MOB) : rect;
    const tw = (R[1] - R[0]) * hw, th = (R[3] - R[2]) * H0;
    const s = Math.min(tw / Math.max(rw, 1e-3), th / Math.max(rh, 1e-3)) * 0.9;
    const ox = (R[0] + R[1]) / 2 * hw, oy = (R[2] + R[3]) / 2 * H0;
    const out = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) { out[i * 3] = ox + (P[i * 3] - cx) * s; out[i * 3 + 1] = oy + (P[i * 3 + 1] - cy) * s; out[i * 3 + 2] = (P[i * 3 + 2] - cz) * s; }
    return { p: out, g: raw.g, l: raw.l, c: [ox, oy, 0], s: s };
  }
  buildShapes() {
    const sh = this.shapes = {}, n = this.N;
    this.webRaw = this.gen('web', n);
    sh.web = this.fitWeb();
    sh.ball = this.fit(this.gen('heart', n), CFG.ball.rect, true, this.mob ? this.slotRect(this.q('#taap .shape-slot')) : null);
    this.qa('.slide').forEach((sl, i) => { const k = CAR_KEYS[i]; if (k) sh[k] = this.fitSlide(this.gen(k, n), sl, k === 'dna'); });
    this.brainFit();
    sh.brain = this.bHero; sh.bLoad = this.bLoad; sh.brainAI = this.bAI; sh.inside = this.bIn;
    sh.words = this.genWords();
    sh.ecg = this.genEcg();
    sh.arch = this.genArch();
    this.pairKey = '';
  }
  slotRect(el) {
    if (!el || !el.offsetHeight) return null;
    const hy = el.offsetHeight / this.VH(), hx = Math.min(0.92, el.offsetWidth / this.W);
    return [-hx, hx, -hy, hy];
  }
  /* each experience's shape sits right beside its own copy, 64px away */
  fitSlide(raw, slide, rot) {
    if (this.mob) return this.fit(raw, null, rot, this.slotRect(slide.querySelector('.shape-slot')) || RECT_MOB_CAR);
    const sc = slide.querySelector('.sc'), vh = this.VH();
    const big = slide.id === 'training';
    const left = Math.max(this.W * 0.5, (sc ? sc.offsetLeft - slide.offsetLeft + sc.offsetWidth : this.W * 0.48) + 56);
    const right = this.W * 0.96;
    let top = 170, bot = vh - 30;
    if (sc) { const cy = sc.offsetTop + sc.offsetHeight / 2; const hh = Math.min(cy - 150, vh - 30 - cy, vh * 0.4); top = cy - hh; bot = cy + hh; }
    const R = [left / this.W * 2 - 1, right / this.W * 2 - 1, 1 - bot / vh * 2, 1 - top / vh * 2];
    const out = this.fit(raw, R, rot);
    for (let i = 0; i < this.N; i++) { out.p[i * 3] = out.c[0] + (out.p[i * 3] - out.c[0]) * 1.1; out.p[i * 3 + 1] = out.c[1] + (out.p[i * 3 + 1] - out.c[1]) * 1.1; out.p[i * 3 + 2] *= 1.1; }
    /* pull the shape left so it sits 64px from the copy */
    const xs = []; for (let i = 0; i < this.N; i += 7) if (raw.l[i] > 0.3) xs.push(out.p[i * 3]);
    xs.sort((p, q) => p - q);
    const minx = xs.length ? xs[Math.floor(xs.length * 0.01)] : out.c[0], want = R[0] * this.HW();
    const dx = want - minx;
    if (dx < 0) { for (let i = 0; i < this.N; i++) out.p[i * 3] += dx; out.c[0] += dx; }
    return out;
  }

  /* the four objects sit around the phone, each feeding a gold thread into it */
  fitWeb() {
    const n = this.N, raw = this.webRaw, hw = this.HW(), H0 = this.H0(), vh = this.VH(), k = 2 * hw / this.W;
    const ph = this.q('.phone-wrap .phone'), pw = this.q('.phone-wrap'), mgIn = this.q('.mg-in');
    let cxPx = this.W * 0.74, cyPx = vh * 0.5, halfW = 160, halfH = 330;
    if (ph) {
      const saved = pw ? pw.style.transform : '';
      if (pw) pw.style.transform = 'none';
      const pr = ph.getBoundingClientRect();
      if (pw) pw.style.transform = saved;
      cxPx = pr.left + pr.width / 2; halfW = pr.width / 2; halfH = pr.height / 2;
      cyPx = this.webScreenY != null ? this.webScreenY : vh * (this.mob ? 0.32 : 0.5);
    }
    const objR = this.mob ? 27 : 54, gap = this.mob ? 4 : 30;
    const dx = Math.min(halfW + gap + objR, Math.min(cxPx, this.W - cxPx) - objR - 6), dy = Math.min(halfH * 0.42, vh * 0.3);
    const toW = (x, y) => [(x / this.W * 2 - 1) * hw, (1 - y / vh * 2) * H0];
    const C0 = [[-1.15, 0.72], [1.15, 0.78], [-1.1, -0.78], [1.15, -0.78]];
    const Cw = [toW(cxPx - dx, cyPx - dy), toW(cxPx + dx, cyPx - dy), toW(cxPx - dx, cyPx + dy), toW(cxPx + dx, cyPx + dy)];
    const ctr = toW(cxPx, cyPx), sz = objR * k / 0.45;
    const out = new Float32Array(n * 3), P = raw.p, r = this.rng(4545);
    for (let i = 0; i < n; i++) {
      const o = raw.obj[i];
      if (o >= 0 && o < 4) {
        out[i * 3] = Cw[o][0] + (P[i * 3] - C0[o][0]) * sz; out[i * 3 + 1] = Cw[o][1] + (P[i * 3 + 1] - C0[o][1]) * sz; out[i * 3 + 2] = P[i * 3 + 2] * sz;
      } else {
        const oi = o >= 4 ? o - 4 : Math.floor(r() * 4), A = [Cw[oi][0], Cw[oi][1], 0];
        const E = [ctr[0] + (A[0] - ctr[0]) * 0.12, ctr[1] + (A[1] - ctr[1]) * 0.12, -0.3];
        const M = [(A[0] + E[0]) / 2, (A[1] + E[1]) / 2 + (A[1] > ctr[1] ? 0.12 : -0.12), -0.15];
        const q = this.catmull([A, M, E], r());
        out[i * 3] = q[0] + this.gauss(r) * 0.006; out[i * 3 + 1] = q[1] + this.gauss(r) * 0.006; out[i * 3 + 2] = q[2];
      }
    }
    return { p: out, g: raw.g, l: raw.l, c: [ctr[0], ctr[1], 0] };
  }
  brainFit() {
    const n = this.N, H0 = this.H0(), hw = this.HW(), raw = this.brainRaw;
    const mk = (R, prev) => {
      const tw = (R[1] - R[0]) * hw, th = (R[3] - R[2]) * H0;
      const s = Math.min(tw / 2.75, th / 2.05) * 0.95;
      const ox = (R[0] + R[1]) / 2 * hw, oy = (R[2] + R[3]) / 2 * H0;
      const B = prev || { p: new Float32Array(n * 3), g: new Float32Array(n), l: this.brainL };
      B.c = [ox, oy, 0]; B.s = s;
      for (let i = 0; i < n; i++) { B.p[i * 3] = ox + raw[i * 3] * s; B.p[i * 3 + 1] = oy + raw[i * 3 + 1] * s; B.p[i * 3 + 2] = raw[i * 3 + 2] * s; }
      return B;
    };
    this.bHero = mk(this.mob ? RECT_MOB : CFG.brain.rect, this.bHero);
    this.bLoad = mk(this.mob ? [-0.86, 0.86, -0.42, 0.42] : [-0.42, 0.42, -0.6, 0.6], this.bLoad);
    this.bAI = mk(this.mob ? RECT_MOB : CFG.brainAI.rect, this.bAI);
    const S = this.insideS = this.mob ? 2.1 : 2.4;
    if (!this.bIn) this.bIn = { p: new Float32Array(n * 3), g: new Float32Array(n), l: this.brainL, c: [0, 0, 0] };
    for (let i = 0; i < n * 3; i++) this.bIn.p[i] = raw[i] * S;
  }
  addChunk(k, j, nUsed, chunk) {
    const n = this.N, off = k * CH_SIZE, m = Math.min(chunk.r.length, n - off);
    if (m <= 0 || !this.G) return;
    const raw = this.brainRaw, L = this.brainL, ord = this.G.ord, reg = this.reg;
    for (let i = 0; i < m; i++) {
      const x = chunk.p[i * 3] / 1000, y = chunk.p[i * 3 + 1] / 1000, z = chunk.p[i * 3 + 2] / 1000;
      raw[(off + i) * 3] = z; raw[(off + i) * 3 + 1] = y; raw[(off + i) * 3 + 2] = -x;
      L[off + i] = 0.28 + 1.5 * Math.pow(chunk.r[i] / 100, 0.85);
      ord[off + i] = (j + Math.random()) / nUsed;
      reg[off + i] = regionOf(x * 70, -z * 70 - 16.44, y * 70 + 5.36);
    }
    this.brainFit();
    this.G.pts.geometry.getAttribute('aOrder').needsUpdate = true;
    this.G.pts.geometry.getAttribute('aReg').needsUpdate = true;
    this._fireSets = null; this._fireReg = -1;
    this.pairKey = '';
  }
  /* the arched frame outline, built in screen space at the finale's resting scroll position */
  /* a long heartbeat line across the screen, behind and below the healthcare copy */
  genEcg() {
    const n = this.N, r = this.rng(616), p = new Float32Array(n * 3), g = new Float32Array(n), l = new Float32Array(n), hw = this.HW(), H0 = this.H0();
    const cc = this.q('#care .care-in'), ybPx = Math.min(this.VH() * 0.97, this.VH() * 0.5 + (cc ? cc.offsetHeight / 2 : 200) + (this.mob ? 60 : 115)), yb = (1 - ybPx / this.VH() * 2) * H0, amp = (this.mob ? 0.16 : 0.24) * H0, period = this.mob ? 1.1 : 1.7, x0 = -hw * 1.15, x1 = hw * 1.15;
    const wave = (x) => {
      const ph = ((x - x0) % period + period) % period / period;
      const bump = (c, w, h) => h * Math.exp(-Math.pow((ph - c) / w, 2));
      return bump(0.18, 0.04, 0.12) - bump(0.36, 0.012, 0.25) + bump(0.4, 0.014, 1.0) - bump(0.44, 0.014, 0.42) + bump(0.66, 0.06, 0.22);
    };
    for (let i = 0; i < n; i++) {
      const x = x0 + (x1 - x0) * r(), halo = r() < 0.1;
      const y = yb + wave(x) * amp, gs = this.gauss(r) * (halo ? 0.06 : 0.008);
      p[i * 3] = x + this.gauss(r) * 0.004; p[i * 3 + 1] = y + gs; p[i * 3 + 2] = this.gauss(r) * (halo ? 0.08 : 0.01);
      g[i] = r() < 0.12 ? 1 : 0; l[i] = halo ? 0.25 : 0.9;
    }
    return { p: p, g: g, l: l, c: [0, yb, 0] };
  }
  genArch() {
    const n = this.N, p = new Float32Array(n * 3), g = new Float32Array(n), l = new Float32Array(n);
    const line = this.q('.arch-line'), fin = document.getElementById('contact');
    const out = { p: p, g: g, l: l, c: [0, 0, 0] };
    if (!line || !fin || !this.seed) return out;
    const H0 = this.H0(), hw = this.HW(), vh = this.VH();
    const yS = this.archY != null ? this.archY : Math.min(this.maxScroll(), this.docTop(fin) + fin.offsetHeight / 2 - vh / 2);
    const shot = line.parentNode, fr = fin.getBoundingClientRect();
    const top = this.docTop(fin) + shot.offsetTop + line.offsetTop - yS, left = fr.left + shot.offsetLeft + line.offsetLeft, w = line.offsetWidth, h = line.offsetHeight;
    const rad = w / 2, side = Math.max(0, h - rad), per = side * 2 + Math.PI * rad + w;
    const toW = (px, py) => [(px / this.W * 2 - 1) * hw, (1 - py / vh * 2) * H0];
    const r = this.rng(55), seed = this.seed;
    for (let i = 0; i < n; i++) {
      let d = seed[i] * per, x, y;
      if (d < side) { x = left; y = top + h - d; }
      else if ((d -= side) < Math.PI * rad) { const a = Math.PI - d / rad; x = left + rad + Math.cos(a) * rad; y = top + rad - Math.sin(a) * rad; }
      else if ((d -= Math.PI * rad) < side) { x = left + w; y = top + rad + d; }
      else { d -= side; x = left + w - d; y = top + h; }
      const sp = r() < 0.025;
      const q = toW(x + (sp ? this.gauss(r) * 26 : this.gauss(r) * 1.1), y + (sp ? this.gauss(r) * 26 : this.gauss(r) * 1.1));
      p[i * 3] = q[0]; p[i * 3 + 1] = q[1]; p[i * 3 + 2] = sp ? this.gauss(r) * 0.15 : 0;
      g[i] = sp ? 0 : 1; l[i] = sp ? 0.9 : 0.3;
    }
    const c = toW(left + w / 2, top + h / 2);
    out.c = [c[0], c[1], 0];
    return out;
  }
  placeArch() { if (this.G && this.shapes) { this.shapes.arch = this.genArch(); this.pairKey = ''; } }
  upload(a, b) {
    const geo = this.G.pts.geometry, A = this.shapes[a], B = this.shapes[b];
    const set = (k, v) => { const at = geo.getAttribute(k); at.array.set(v); at.needsUpdate = true; };
    set('aFrom', A.p); set('aTo', B.p); set('aGA', A.g); set('aGB', B.g); set('aLA', A.l); set('aLB', B.l);
  }
  spinAngle(k, t) {
    const m = CFG[k].spin;
    if (m === 'osc') return 0.3 * Math.sin(t * 0.16);
    if (m === 'aiosc') return 0.08 * Math.sin(t * 0.2);
    if (m === 'tiny') return 0.05 * Math.sin(t * 0.2);
    if (m === 'sway') return 0.16 * Math.sin(t * 0.22);
    if (m === 'ball') return 0.5 * Math.sin(t * 0.25);
    if (m === 'scroll') return this.scrollY() * 0.0032;
    return 0;
  }
  /* ---------- loader ---------- */
  loader() {
    const root = this.root, num = this.q('.ld-n');
    const reveal = () => {
      root.classList.remove('loading');
      if (this.lenis) this.lenis.start();
      ScrollTrigger.refresh();
      this.ctx.add(() => {
        gsap.fromTo('.hero .name', { autoAlpha: 0, y: 30 }, { autoAlpha: 1, y: 0, duration: 1.0, ease: 'power3.out', delay: 0.25 });
        if (!this.reduced) gsap.fromTo(this.qa('.hero .stmt .w'), { yPercent: 120 }, { yPercent: 0, duration: 0.9, stagger: 0.04, ease: 'power3.out', delay: 0.45 });
        gsap.fromTo('.hero .small, .cue', { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.8, delay: 0.85 });
      });
    };
    if (!this.glOk) { reveal(); return; }
    /* a 2 second intro every visit: white specks gather into the brain, gold lights it, then the page opens */
    root.classList.add('loading'); if (this.lenis) this.lenis.stop();
    window.scrollTo(0, 0);
    this.st.form = 0; this.st.gold = 0; this.st.mv = 0; this.st.reveal = 0;
    const nUsed = this.mob ? 2 : 5;
    const prog = { bytes: new Array(nUsed).fill(0), lens: new Array(nUsed).fill(89000), parsed: 0, fonts: 0 };
    const real = () => Math.min(1, prog.bytes.reduce((a, v) => a + v, 0) / prog.lens.reduce((a, v) => a + v, 0)) * 0.86 + prog.fonts * 0.14;
    let finished = false, arrived = 0;
    const t0 = performance.now(), MIN = 2000, MAX = 6000;
    const fontP = document.fonts && document.fonts.load ? Promise.all([document.fonts.load('80px Allura'), document.fonts.load('40px Fraunces'), document.fonts.load('16px Inter')]) : Promise.resolve();
    fontP.then(() => { prog.fonts = 1; }, () => { prog.fonts = 1; });
    for (let k = 0; k < nUsed; k++) {
      fetch(CHUNKS[k]).then((r) => {
        const len = Number(r.headers.get('Content-Length')); if (len) prog.lens[k] = len;
        if (!r.body || !r.body.getReader) return r.json();
        const reader = r.body.getReader(), parts = [];
        const pump = () => reader.read().then((res) => { if (res.done) return new Blob(parts).text().then((t) => JSON.parse(t)); parts.push(res.value); prog.bytes[k] += res.value.length; return pump(); });
        return pump();
      }).then((chunk) => {
        if (this._dead || !this.G) return;
        prog.bytes[k] = prog.lens[k];
        this.addChunk(k, arrived, nUsed, chunk);
        arrived++; prog.parsed = arrived;
      }).catch(() => { prog.bytes[k] = prog.lens[k]; prog.parsed++; });
    }
    const tick = () => {
      if (this._dead || finished) return;
      const el = performance.now() - t0, rr = real(), done = rr >= 0.999 && prog.parsed >= nUsed;
      const tf = Math.min(1, el / (MIN * 0.85));
      const shown = Math.min(done ? 1 : rr, tf);
      if (num) num.textContent = String(Math.round(shown * 100));
      this.st.reveal = Math.min(1.05, prog.parsed / nUsed + 0.05);
      this.st.form += (Math.min(shown, 1) - this.st.form) * 0.12;
      if ((done && el >= MIN) || el > MAX) {
        finished = true;
        if (num) num.textContent = '100';
        this.ctx.add(() => {
          const tl = gsap.timeline();
          tl.to(this.st, { form: 1, reveal: 1.05, duration: 0.25 }, 0);
          tl.to(this.st, { gold: 1, duration: 0.8, ease: 'power2.out' }, 0.05);
          tl.add(reveal, 0.65);
          if (!this.reduced) tl.to(this.st, { mv: 1, duration: 1.4, ease: 'power3.inOut' }, 0.6);
          else tl.set(this.st, { mv: 1 }, 0.6);
          this.st.push = 1;
        });
        return;
      }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  /* ---------- render ---------- */
  frame(now) {
    if (!this._run || this._dead) return;
    this._raf = requestAnimationFrame(this._frame);
    const G = this.G;
    if (!G || !this.shapes) return;
    this.mxs += (this.mx - this.mxs) * 0.05; this.mys += (this.my - this.mys) * 0.05;
    const loading = this.root.classList.contains('loading');
    const sy = this.scrollY(), vh = this.VH(), H0 = this.H0();
    let m = loading ? 0 : this.mAt(sy);
    if (this.reduced) m = Math.round(m);
    const S = this.stops || [{ k: 'brain', y: 0 }];
    const i0 = Math.max(0, Math.min(S.length - 1, Math.floor(m))), i1 = Math.min(S.length - 1, i0 + 1);
    let f = m - i0, a = S[i0].k, b = S[i1].k, sa = S[i0], sb = S[i1];
    if (this.carIdx >= 0 && (Math.abs(m - this.carIdx) < 0.02 || (S[i0].car && S[i1].car))) {
      const track = this.q('.car-track'), sl = this.qa('.slide');
      if (track && sl.length) {
        const w = sl[0].offsetWidth || 1, qv = Math.min(3, Math.max(0, track.scrollLeft / w));
        a = CAR_KEYS[Math.floor(qv)]; b = CAR_KEYS[Math.min(3, Math.ceil(qv))]; f = qv - Math.floor(qv);
        if (this.reduced) { a = b = CAR_KEYS[Math.round(qv)]; f = 0; }
        sa = sb = {};
      }
    }
    /* intro: the brain forms at the centre of the screen, lights up gold, then glides into the hero */
    if (this.st.mv < 1) { a = 'bLoad'; b = 'brain'; f = this.st.mv; sa = sb = {}; }
    if (!this.shapes[a]) a = 'brain';
    if (!this.shapes[b]) b = 'brain';
    /* every shape is tied to its own section: it can only show while that section is on screen */
    if (a !== b && !this.reduced) {
      const va = this.secVis(a), vb = this.secVis(b);
      if (!vb && va) f = 0; else if (!va && vb) f = 1;
    }
    const same = a === b;
    const key = a + ':' + b;
    if (key !== this.pairKey) { this.upload(a, b); this.pairKey = key; }
    const u = G.mat.uniforms, t = now / 1000, A = this.shapes[a], B = this.shapes[b], CA = CFG[a], CB = CFG[b];
    const lerp = (x, y, q) => x + (y - x) * q;
    /* holds inside one section never re-run the morph: only the camera, rotation and glow move */
    u.uT.value = same ? 0 : f;
    u.uNoStag.value = ((a === 'brain' && b === 'inside') || a === 'bLoad') ? 1 : 0;
    u.uForm.value = this.st.form; u.uGold.value = this.st.gold;
    const offOf = (st) => st && st.off ? st.off : [0, 0, 0];
    const oa = offOf(sa), ob = offOf(sb);
    const kx = 2 * this.HW() / this.W, sl = this.slidesEl || (this.slidesEl = this.qa('.slide'));
    const offX = (k) => { const ix = CAR_KEYS.indexOf(k); return ix >= 0 && sl[ix] ? sl[ix].getBoundingClientRect().left * kx : 0; };
    /* shapes stay fixed at the middle of the screen; only the finale outline follows its photo frame */
    const trk = (st) => {
      if (!st) return 0;
      if (st.carTrack) { const cs = st.carTrack[0], ce = st.carTrack[1]; return (sy < cs ? sy - cs : (sy > ce ? sy - ce : 0)) / vh * 2 * H0; }
      return st.track != null ? (sy - st.track) / vh * 2 * H0 : 0;
    };
    /* on phones the TAAP ball and each experience shape sit in a slot inside their own text column */
    const slotDy = (k) => {
      if (!this.mob || !this.shapes[k]) return null;
      let el = null;
      if (k === 'ball') el = this.q('#taap .shape-slot');
      else { const ix = CAR_KEYS.indexOf(k); if (ix >= 0 && sl[ix]) el = sl[ix].querySelector('.shape-slot'); }
      if (!el) return null;
      const r = el.getBoundingClientRect(), shapeY = (1 - this.shapes[k].c[1] / H0) / 2 * vh;
      return -((r.top + r.height / 2) - shapeY) / vh * 2 * H0;
    };
    const ya = slotDy(a), yb = slotDy(b);
    let offA = [oa[0] + offX(a), oa[1] + (ya != null ? ya : trk(sa)), oa[2]];
    const offB = [ob[0] + offX(b), ob[1] + (yb != null ? yb : trk(sb)), ob[2]];
    if (same) offA = [lerp(offA[0], offB[0], f), lerp(offA[1], offB[1], f), lerp(offA[2], offB[2], f)];
    u.uOffA.value.set(offA[0], offA[1], offA[2]);
    if (same) u.uOffB.value.copy(u.uOffA.value); else u.uOffB.value.set(offB[0], offB[1], offB[2]);
    u.uCA.value.set(A.c[0] + u.uOffA.value.x, A.c[1] + u.uOffA.value.y, A.c[2] + u.uOffA.value.z);
    u.uCB.value.set(B.c[0] + u.uOffB.value.x, B.c[1] + u.uOffB.value.y, B.c[2] + u.uOffB.value.z);
    /* the heartbeat line feeds the helix from the point on the line under the next shape, and its speckles run along the line into it */
    if (a === 'ecg' && !same) { u.uCA.value.x = u.uCB.value.x; u.uKaS.value = 0.7; } else u.uKaS.value = 0.32;
    /* coach scene: the athlete dips and the ball rises as the slide settles */
    let K = 0;
    if (a === 'coach' || b === 'coach') {
      const ts = sl[3]; const L = ts ? ts.getBoundingClientRect().left : 0;
      const pr = Math.max(0, Math.min(1, 1 - Math.abs(L) / this.W));
      const x = Math.max(0, Math.min(1, (pr - 0.55) / 0.45)); K = x * x * (3 - 2 * x);
    }
    const C = this.shapes.coach || {};
    u.uKA.value = a === 'coach' ? K : 0; u.uKB.value = b === 'coach' ? K : 0; u.uScA.value = u.uScB.value = C.s || 1;
    const rotA = (sa && sa.rot) || 0, rotB = (sb && sb.rot) || 0;
    u.uRA.value = this.spinAngle(a, t) + (same ? lerp(rotA, rotB, f) : rotA);
    u.uRB.value = same ? u.uRA.value : this.spinAngle(b, t) + rotB;
    const br = 1 + 0.012 * Math.sin(t * 1.2);
    u.uSA.value = (a === 'brain' || a === 'brainAI' || a === 'bLoad') ? br : 1; u.uSB.value = (b === 'brain' || b === 'brainAI') ? br : 1;
    /* route the helix through the gap between the two text blocks (or under the slides), never across text */
    {
      const ca = u.uCA.value, cb = u.uCB.value, inCar = CAR_KEYS.indexOf(a) >= 0 && CAR_KEYS.indexOf(b) >= 0;
      let gy;
      if (inCar) gy = this.mob ? 0.06 * vh : 0.93 * vh;
      else { const ea = this.blockEl(a), eb = this.blockEl(b); const ya = ea ? ea.getBoundingClientRect().bottom : vh * 0.5, yb = eb ? eb.getBoundingClientRect().top : vh * 0.5; gy = Math.max(0.08 * vh, Math.min(0.94 * vh, (ya + yb) / 2)); }
      const gx = (ca.x + cb.x) / 2, gw = (1 - gy / vh * 2) * H0;
      u.uM.value.set(2 * gx - (ca.x + cb.x) / 2, 2 * gw - (ca.y + cb.y) / 2, 0.6);
    }
    u.uImp.value = lerp(CA.imp || 0, CB.imp || 0, f);
    {
      let fire = (a === 'inside' && b === 'inside') ? 1 : (a === 'inside' ? 1 - f : (b === 'inside' ? f : 0));
      const ra2 = sa && sa.reg, rb2 = sb && sb.reg;
      let reg = ra2 || rb2 || 1;
      if (a === 'inside' && b === 'inside' && ra2 && rb2 && ra2 !== rb2) { reg = f < 0.5 ? ra2 : rb2; fire *= Math.abs(1 - 2 * f); }
      if (fire > 0) {
        if (!this._fireSets) this._fireSets = this.buildFireSets();
        if (this._fireSets && reg !== this._fireReg && this._fireSets[reg]) {
          const st = this._fireSets[reg];
          for (let k = 0; k < 12; k++) { const p0 = st[0][k % st[0].length], p1 = st[1][k % st[1].length]; u.uFA.value[k].set(p0[0], p0[1], p0[2]); u.uFB.value[k].set(p1[0], p1[1], p1[2]); }
          this._fireReg = reg;
        }
        if (!this._fireSets) fire = 0;
      }
      u.uFire.value = fire * (this.mob ? 0.5 : 1);
    }
    u.uEcg.value = lerp(CA.ecg || 0, CB.ecg || 0, f); u.uHWv.value = this.HW();
    /* region glow */
    const rw = [0, 0, 0, 0, 0, 0];
    const ra = CA.brain && sa ? (sa.reg || 0) : 0, rb = CB.brain && sb ? (sb.reg || 0) : 0;
    if (ra) rw[ra] += 1 - f;
    if (rb) rw[rb] += f;
    const act = Math.min(1, Math.max.apply(null, rw));
    for (let k = 0; k < 6; k++) u.uRW.value[k] = Math.min(1, rw[k]);
    u.uRAct.value = act;
    this.updLabel(a, b, f, ra, rb, rw, act);
    u.uTime.value = t; u.uReveal.value = this.st.reveal;
    u.uPulse.value = CA.pulse + (CB.pulse - CA.pulse) * f;
    let dim = CA.dim + (CB.dim - CA.dim) * f;
    dim *= lerp((sa && sa.dm) || 1, (sb && sb.dm) || 1, same ? f : f);
    u.uDim.value = dim;
    const par = 1 - (a === 'arch' ? 1 - f : 0) - (b === 'arch' ? f : 0);
    G.camera.position.set(this.mxs * 0.14 * par, -this.mys * 0.09 * par, 6.6 + (1 - this.st.push) * 0.35);
    G.camera.lookAt(0, 0, 0);
    if (this._fade && this.carST && sy > this.carST.start - vh && sy < this.carST.end + vh) this._fade();
    /* leading glow point on the helix */
    if (G.lead) {
      const live = !same && !u.uNoStag.value && f > 0 && f < 1;
      const s = 3.0 * f - 1.0;
      if (live && s > 0 && s < 1) {
        const ca = u.uCA.value, cb = u.uCB.value, mx = u.uM.value.x, my = u.uM.value.y, mz = u.uM.value.z, q = 1 - s;
        const arr = G.lead.geometry.getAttribute('position').array;
        arr[0] = q * q * ca.x + 2 * s * q * mx + s * s * cb.x; arr[1] = q * q * ca.y + 2 * s * q * my + s * s * cb.y; arr[2] = q * q * ca.z + 2 * s * q * mz + s * s * cb.z;
        G.lead.geometry.getAttribute('position').needsUpdate = true;
        G.lead.material.uniforms.uA.value = Math.sin(Math.PI * s) * 0.9;
      } else G.lead.material.uniforms.uA.value = 0;
    }
    G.renderer.render(G.scene, G.camera);
  }
  blockEl(k) {
    const sel = { inside: '.story .col', words: '#building', web: this.mob ? '#migrind .mg-in' : '#migrind .mg-in .col', ball: '#taap .col', brainAI: '#ai .col', ecg: '#care .care-in', arch: '#contact' }[k] || (CAR_KEYS.indexOf(k) >= 0 ? '.car-head' : null);
    if (!sel) return null;
    this._blk = this._blk || {};
    return this._blk[sel] || (this._blk[sel] = this.q(sel));
  }
  secVis(k) {
    const sel = { brain: '.hero', inside: '#story', words: '#building', web: '#migrind', ball: '#taap', brainAI: '#ai', ecg: '#care', arch: '#contact' }[k] || (CAR_KEYS.indexOf(k) >= 0 ? '.car' : null);
    if (!sel) return true;
    const el = this._secEl && this._secEl[sel] || ((this._secEl = this._secEl || {})[sel] = this.q(sel));
    if (!el) return true;
    const r = el.getBoundingClientRect(), vh = this.VH();
    return r.top < vh * 0.97 && r.bottom > vh * 0.03;
  }
  /* small gold label beside the glowing region */
  updLabel(a, b, f, ra, rb, rw, act) {
    const el = this.lbl || (this.lbl = this.q('.rlabel'));
    if (!el || !this.G) return;
    const reg = rw.indexOf(Math.max.apply(null, rw));
    const gl = this.rglow || (this.rglow = this.q('.rglow'));
    if (!act || !reg) { if (el._o !== 0) { el.style.opacity = '0'; if (gl) gl.style.opacity = '0'; el._o = 0; } return; }
    const key = (rw[ra] >= rw[rb] ? a : b);
    const R = mniToRaw(REGIONS[reg].c), V = new this.G.THREE.Vector3();
    if (key === 'inside') {
      const T = this.mob ? [0, 1.05, 2.5] : [1.2, 0.05, 2.7];
      V.set(T[0], T[1], T[2]);
    } else {
      const B = key === 'brain' ? this.bHero : this.bAI, s = B.s || 1, ang = this.G.mat.uniforms.uRA.value;
      const x = R[0] * s, z = R[2] * s, cs = Math.cos(ang), sn = Math.sin(ang);
      V.set(B.c[0] + x * cs + z * sn, B.c[1] + R[1] * s, -x * sn + z * cs);
    }
    V.project(this.G.camera);
    const px = (V.x + 1) / 2 * this.W, py = (1 - V.y) / 2 * this.VH();
    if (el._r !== reg) { el.textContent = REGIONS[reg].name; el._r = reg; }
    const w = el.offsetWidth || 160, ins = key === 'inside', x = Math.max(12, Math.min(this.W - w - 12, ins ? px - w / 2 : px + 30)), y = Math.max(150, Math.min(this.VH() - 40, ins ? py + (this.mob ? 150 : 250) : py - 30));
    el.style.transform = 'translate3d(' + x + 'px,' + y + 'px,0)';
    const o = Math.max(0, Math.min(1, (act - 0.6) / 0.35)) * 0.9;
    el.style.opacity = o.toFixed(3); el._o = o;
    if (gl) { gl.style.transform = 'translate3d(' + (px - 230) + 'px,' + (py - 230) + 'px,0)'; gl.style.opacity = (act * 0.75).toFixed(3); }
  }
}
function start(){ window.__site = new Component(); window.__site.componentDidMount(); }
if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start); else start();
})();
