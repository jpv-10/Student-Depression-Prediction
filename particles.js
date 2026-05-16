/**
 * NeuroScan AI — Particle Background System
 * particles.js — Premium Neural Network Visualization
 * Theme: Futuristic AI SaaS | Purple × Pink × Blue × Dark
 */

'use strict';

/* ============================================================
   PARTICLE ENGINE
   ============================================================ */
class NeuroParticleEngine {
  constructor(options = {}) {
    this.config = {
      canvasId:        options.canvasId        || 'particles-canvas',
      count:           options.count           || this._autoCount(),
      connectDistance: options.connectDistance || 130,
      speed:           options.speed           || 0.55,
      minRadius:       options.minRadius       || 1.2,
      maxRadius:       options.maxRadius       || 3.5,
      mouse: {
        radius:    options.mouseRadius    || 160,
        repel:     options.mouseRepel     !== false,
        attract:   options.mouseAttract   || false,
      },
      colors: options.colors || [
        { r: 168, g: 85,  b: 247 },  // purple
        { r: 236, g: 72,  b: 153 },  // pink
        { r:  59, g: 130, b: 246 },  // blue
        { r:   6, g: 182, b: 212 },  // cyan
        { r: 139, g: 92,  b: 246 },  // violet
      ],
      pulseColors: options.pulseColors || ['#a855f7', '#ec4899', '#3b82f6'],
      enableNeural:    options.enableNeural    !== false,
      enablePulse:     options.enablePulse     !== false,
      enableGlow:      options.enableGlow      !== false,
      enableOrbit:     options.enableOrbit     !== false,
      bgColor:         options.bgColor         || 'transparent',
      fps:             options.fps             || 60,
    };

    this.canvas      = null;
    this.ctx         = null;
    this.particles   = [];
    this.pulses      = [];
    this.orbitNodes  = [];
    this.mouse       = { x: -9999, y: -9999, active: false };
    this.animFrame   = null;
    this.lastTime    = 0;
    this.frameInterval = 1000 / this.config.fps;
    this.width       = 0;
    this.height      = 0;
    this.dpr         = Math.min(window.devicePixelRatio || 1, 2);

    this._init();
  }

  /* ----- init ----- */
  _init() {
    this._createCanvas();
    this._bindEvents();
    this._spawnParticles();
    if (this.config.enableOrbit) this._spawnOrbitNodes();
    this._startLoop();
  }

  _autoCount() {
    const area = window.innerWidth * window.innerHeight;
    if (area < 400000)  return 50;
    if (area < 900000)  return 90;
    if (area < 1800000) return 130;
    return 170;
  }

  _createCanvas() {
    // Look for existing canvas first
    let canvas = document.getElementById(this.config.canvasId);

    if (!canvas) {
      canvas = document.createElement('canvas');
      canvas.id = this.config.canvasId;
      canvas.style.cssText = `
        position:fixed; top:0; left:0; width:100%; height:100%;
        pointer-events:none; z-index:0;
        opacity:1;
      `;
      // Insert as first child of body
      document.body.insertBefore(canvas, document.body.firstChild);
    }

    this.canvas = canvas;
    this.ctx    = canvas.getContext('2d');
    this._resize();
  }

  _resize() {
    this.width  = window.innerWidth;
    this.height = window.innerHeight;
    this.canvas.width  = this.width  * this.dpr;
    this.canvas.height = this.height * this.dpr;
    this.canvas.style.width  = this.width  + 'px';
    this.canvas.style.height = this.height + 'px';
    this.ctx.scale(this.dpr, this.dpr);
  }

  /* ----- particle factory ----- */
  _makeParticle() {
    const color = this.config.colors[Math.floor(Math.random() * this.config.colors.length)];
    const r     = this.config.minRadius + Math.random() * (this.config.maxRadius - this.config.minRadius);
    return {
      x:     Math.random() * this.width,
      y:     Math.random() * this.height,
      vx:    (Math.random() - 0.5) * this.config.speed * 2,
      vy:    (Math.random() - 0.5) * this.config.speed * 2,
      r,
      color,
      alpha:     0.3 + Math.random() * 0.6,
      alphaDir:  Math.random() > 0.5 ? 1 : -1,
      alphaDelta:0.003 + Math.random() * 0.005,
      glowPhase: Math.random() * Math.PI * 2,
      glowSpeed: 0.02 + Math.random() * 0.03,
      pulseOffset: Math.random() * Math.PI * 2,
      type: Math.random() > 0.85 ? 'star' : 'circle',
    };
  }

  _spawnParticles() {
    this.particles = Array.from({ length: this.config.count }, () => this._makeParticle());
  }

  /* ----- orbit nodes (large glowing centers) ----- */
  _spawnOrbitNodes() {
    const n = 3 + Math.floor(Math.random() * 3);
    this.orbitNodes = Array.from({ length: n }, () => ({
      x:     80 + Math.random() * (this.width  - 160),
      y:     80 + Math.random() * (this.height - 160),
      r:     4 + Math.random() * 4,
      phase: Math.random() * Math.PI * 2,
      speed: 0.008 + Math.random() * 0.01,
      color: this.config.colors[Math.floor(Math.random() * this.config.colors.length)],
      orbitR: 30 + Math.random() * 50,
      orbitSpeed: (Math.random() > 0.5 ? 1 : -1) * (0.005 + Math.random() * 0.01),
      satellites: Math.floor(Math.random() * 3 + 1),
    }));
  }

  /* ----- pulse factory ----- */
  _createPulse(x, y) {
    const color = this.config.pulseColors[Math.floor(Math.random() * this.config.pulseColors.length)];
    this.pulses.push({ x, y, r: 0, maxR: 80 + Math.random() * 60, alpha: 0.6, color });
  }

  /* ----- events ----- */
  _bindEvents() {
    const onResize = this._debounce(() => {
      this._resize();
      this._repositionParticles();
    }, 200);

    window.addEventListener('resize', onResize);

    // Mouse tracking
    window.addEventListener('mousemove', (e) => {
      this.mouse.x = e.clientX;
      this.mouse.y = e.clientY;
      this.mouse.active = true;
    });

    window.addEventListener('mouseleave', () => {
      this.mouse.active = false;
      this.mouse.x = -9999;
      this.mouse.y = -9999;
    });

    // Touch
    window.addEventListener('touchmove', (e) => {
      const t = e.touches[0];
      this.mouse.x = t.clientX;
      this.mouse.y = t.clientY;
      this.mouse.active = true;
    }, { passive: true });

    // Click: create pulse
    if (this.config.enablePulse) {
      window.addEventListener('click', (e) => {
        if (e.target === this.canvas || e.target === document.body) {
          this._createPulse(e.clientX, e.clientY);
        }
      });
    }

    // Visibility API — pause when tab hidden
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) this._stopLoop();
      else this._startLoop();
    });
  }

  _repositionParticles() {
    this.particles.forEach(p => {
      if (p.x > this.width)  p.x = Math.random() * this.width;
      if (p.y > this.height) p.y = Math.random() * this.height;
    });
  }

  /* ----- main loop ----- */
  _startLoop() {
    if (this.animFrame) return;
    const loop = (timestamp) => {
      this.animFrame = requestAnimationFrame(loop);
      const delta = timestamp - this.lastTime;
      if (delta < this.frameInterval) return;
      this.lastTime = timestamp - (delta % this.frameInterval);
      this._tick();
    };
    this.animFrame = requestAnimationFrame(loop);
  }

  _stopLoop() {
    if (this.animFrame) {
      cancelAnimationFrame(this.animFrame);
      this.animFrame = null;
    }
  }

  _tick() {
    const { ctx, width, height } = this;

    ctx.clearRect(0, 0, width, height);

    if (this.config.bgColor !== 'transparent') {
      ctx.fillStyle = this.config.bgColor;
      ctx.fillRect(0, 0, width, height);
    }

    this._updateAndDrawParticles();
    if (this.config.enableNeural)  this._drawConnections();
    if (this.config.enableOrbit)   this._drawOrbitNodes();
    if (this.config.enablePulse)   this._updateAndDrawPulses();
  }

  /* ----- particles ----- */
  _updateAndDrawParticles() {
    const { ctx, config, mouse } = this;

    this.particles.forEach(p => {
      // Move
      p.x += p.vx;
      p.y += p.vy;

      // Wrap edges
      if (p.x < -20)           p.x = this.width  + 10;
      if (p.x > this.width + 20)  p.x = -10;
      if (p.y < -20)           p.y = this.height + 10;
      if (p.y > this.height + 20) p.y = -10;

      // Alpha breathing
      p.alpha += p.alphaDelta * p.alphaDir;
      if (p.alpha > 0.9 || p.alpha < 0.15) p.alphaDir *= -1;

      // Glow pulse
      p.glowPhase += p.glowSpeed;

      // Mouse interaction
      if (mouse.active) {
        const dx  = p.x - mouse.x;
        const dy  = p.y - mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < config.mouse.radius && config.mouse.repel) {
          const force = (config.mouse.radius - dist) / config.mouse.radius;
          p.vx += (dx / dist) * force * 0.3;
          p.vy += (dy / dist) * force * 0.3;

          // Speed cap
          const spd = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
          const maxSpd = config.speed * 4;
          if (spd > maxSpd) { p.vx = (p.vx / spd) * maxSpd; p.vy = (p.vy / spd) * maxSpd; }
        }

        // Gradually return to base speed
        p.vx *= 0.98;
        p.vy *= 0.98;
        if (Math.abs(p.vx) < config.speed * 0.3) p.vx += (Math.random() - 0.5) * 0.04;
        if (Math.abs(p.vy) < config.speed * 0.3) p.vy += (Math.random() - 0.5) * 0.04;
      }

      // Draw
      const { r, g, b } = p.color;
      const glow = 0.5 + 0.5 * Math.sin(p.glowPhase);

      if (config.enableGlow) {
        ctx.shadowColor = `rgba(${r},${g},${b},${0.5 + glow * 0.5})`;
        ctx.shadowBlur  = p.r * (3 + glow * 4);
      }

      ctx.beginPath();

      if (p.type === 'star') {
        this._drawStar(ctx, p.x, p.y, p.r * 1.4, 4);
      } else {
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      }

      ctx.fillStyle = `rgba(${r},${g},${b},${p.alpha})`;
      ctx.fill();

      ctx.shadowBlur  = 0;
      ctx.shadowColor = 'transparent';
    });
  }

  _drawStar(ctx, x, y, r, points) {
    const step = Math.PI / points;
    ctx.save();
    ctx.translate(x, y);
    ctx.beginPath();
    for (let i = 0; i < 2 * points; i++) {
      const rad  = i % 2 === 0 ? r : r * 0.45;
      const angle = i * step - Math.PI / 2;
      i === 0 ? ctx.moveTo(Math.cos(angle) * rad, Math.sin(angle) * rad)
              : ctx.lineTo(Math.cos(angle) * rad, Math.sin(angle) * rad);
    }
    ctx.closePath();
    ctx.restore();
  }

  /* ----- neural network connections ----- */
  _drawConnections() {
    const { ctx, particles, config } = this;
    const len = particles.length;
    const distSq = config.connectDistance * config.connectDistance;

    for (let i = 0; i < len; i++) {
      for (let j = i + 1; j < len; j++) {
        const a = particles[i], b = particles[j];
        const dx = a.x - b.x, dy = a.y - b.y;
        const d2 = dx * dx + dy * dy;

        if (d2 > distSq) continue;

        const strength = 1 - Math.sqrt(d2) / config.connectDistance;
        if (strength < 0.05) continue;

        // Color mix between the two particles
        const cr = Math.round((a.color.r + b.color.r) / 2);
        const cg = Math.round((a.color.g + b.color.g) / 2);
        const cb = Math.round((a.color.b + b.color.b) / 2);
        const alpha = strength * 0.35;

        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.strokeStyle = `rgba(${cr},${cg},${cb},${alpha})`;
        ctx.lineWidth   = strength * 1.2;

        if (config.enableGlow && strength > 0.6) {
          ctx.shadowColor = `rgba(${cr},${cg},${cb},0.3)`;
          ctx.shadowBlur  = 4;
        }

        ctx.stroke();
        ctx.shadowBlur = 0;

        // Occasional data-pulse along the line
        if (Math.random() > 0.9998) {
          this._spawnLinePulse(a, b);
        }
      }
    }
  }

  /* ----- orbit decorations ----- */
  _drawOrbitNodes() {
    const { ctx, orbitNodes } = this;

    orbitNodes.forEach(node => {
      node.phase += node.orbitSpeed;

      const { r, g, b } = node.color;

      // Draw orbit ring
      ctx.beginPath();
      ctx.arc(node.x, node.y, node.orbitR, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(${r},${g},${b},0.06)`;
      ctx.lineWidth = 1;
      ctx.stroke();

      // Core glow
      const gradient = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, node.r * 4);
      gradient.addColorStop(0,   `rgba(${r},${g},${b},0.4)`);
      gradient.addColorStop(0.5, `rgba(${r},${g},${b},0.1)`);
      gradient.addColorStop(1,   `rgba(${r},${g},${b},0)`);

      ctx.beginPath();
      ctx.arc(node.x, node.y, node.r * 4, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.fill();

      // Core dot
      ctx.shadowColor = `rgba(${r},${g},${b},0.9)`;
      ctx.shadowBlur  = 12;
      ctx.beginPath();
      ctx.arc(node.x, node.y, node.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${r},${g},${b},0.85)`;
      ctx.fill();
      ctx.shadowBlur = 0;

      // Satellites
      for (let s = 0; s < node.satellites; s++) {
        const angle = node.phase + (s / node.satellites) * Math.PI * 2;
        const sx    = node.x + Math.cos(angle) * node.orbitR;
        const sy    = node.y + Math.sin(angle) * node.orbitR;

        ctx.shadowColor = `rgba(${r},${g},${b},0.7)`;
        ctx.shadowBlur  = 6;
        ctx.beginPath();
        ctx.arc(sx, sy, node.r * 0.45, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${r},${g},${b},0.6)`;
        ctx.fill();
        ctx.shadowBlur = 0;

        // Connection line satellite → core
        ctx.beginPath();
        ctx.moveTo(node.x, node.y);
        ctx.lineTo(sx, sy);
        ctx.strokeStyle = `rgba(${r},${g},${b},0.08)`;
        ctx.lineWidth = 0.7;
        ctx.stroke();
      }
    });
  }

  /* ----- pulses ----- */
  _updateAndDrawPulses() {
    const { ctx } = this;
    this.pulses = this.pulses.filter(p => p.alpha > 0.01);

    this.pulses.forEach(p => {
      p.r     += 2.5;
      p.alpha *= 0.94;

      const grad = ctx.createRadialGradient(p.x, p.y, p.r * 0.5, p.x, p.y, p.r);
      grad.addColorStop(0, `${p.color}00`);
      grad.addColorStop(0.5, p.color + this._alphaHex(p.alpha * 0.5));
      grad.addColorStop(1, `${p.color}00`);

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.strokeStyle = p.color + this._alphaHex(p.alpha);
      ctx.lineWidth   = 1.5;
      ctx.stroke();
    });
  }

  /* ----- data pulse along a line ----- */
  _spawnLinePulse(a, b) {
    // A small dot that travels from a to b
    const color = this.config.pulseColors[Math.floor(Math.random() * this.config.pulseColors.length)];
    const duration = 60 + Math.random() * 60;
    let frame = 0;

    const tick = () => {
      if (frame > duration) return;
      const t  = frame / duration;
      const px = a.x + (b.x - a.x) * t;
      const py = a.y + (b.y - a.y) * t;

      this.ctx.beginPath();
      this.ctx.arc(px, py, 2.5, 0, Math.PI * 2);
      this.ctx.fillStyle = color;
      this.ctx.shadowColor = color;
      this.ctx.shadowBlur  = 8;
      this.ctx.fill();
      this.ctx.shadowBlur = 0;

      frame++;
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  /* ----- utils ----- */
  _alphaHex(alpha) {
    return Math.round(Math.min(1, Math.max(0, alpha)) * 255)
              .toString(16).padStart(2, '0').toUpperCase();
  }

  _debounce(fn, delay) {
    let t;
    return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), delay); };
  }

  /* ----- public API ----- */
  destroy() {
    this._stopLoop();
    this.canvas.remove();
  }

  pause()  { this._stopLoop(); }
  resume() { this._startLoop(); }

  setCount(n) {
    this.config.count = n;
    while (this.particles.length < n) this.particles.push(this._makeParticle());
    if (this.particles.length > n)    this.particles.splice(n);
  }

  addPulse(x, y) { this._createPulse(x, y); }

  updateConfig(partial) {
    Object.assign(this.config, partial);
  }
}

/* ============================================================
   FLOATING TEXT / MATRIX RAIN OVERLAY (optional ambient effect)
   ============================================================ */
class MatrixRainOverlay {
  constructor(options = {}) {
    this.config = {
      canvasId: options.canvasId || 'matrix-canvas',
      chars:    options.chars    || '01アイウエオカキクケコ∇∑∏∫≈≠∞αβγδεΩΨΦΘΛΠΣ',
      columns:  options.columns  || null,
      speed:    options.speed    || 0.3,
      color:    options.color    || { r: 168, g: 85, b: 247 },
      opacity:  options.opacity  || 0.07,
      fontSize: options.fontSize || 13,
    };

    this.drops  = [];
    this.canvas = null;
    this.ctx    = null;
    this.frame  = null;
    this._init();
  }

  _init() {
    const canvas = document.createElement('canvas');
    canvas.id = this.config.canvasId;
    canvas.style.cssText = `
      position:fixed; top:0; left:0; width:100%; height:100%;
      pointer-events:none; z-index:0; opacity:0.45;
    `;
    document.body.insertBefore(canvas, document.body.firstChild);
    this.canvas = canvas;
    this.ctx    = canvas.getContext('2d');
    this._resize();
    window.addEventListener('resize', this._debounce(() => this._resize(), 200));
    this._startLoop();
  }

  _resize() {
    this.canvas.width  = window.innerWidth;
    this.canvas.height = window.innerHeight;
    const cols = Math.floor(window.innerWidth / this.config.fontSize);
    this.drops = Array.from({ length: cols }, () => Math.random() * -100);
  }

  _startLoop() {
    const { ctx, drops, config, canvas } = this;
    const { r, g, b } = config.color;
    const chars = config.chars.split('');

    const tick = () => {
      this.frame = requestAnimationFrame(tick);

      ctx.fillStyle = `rgba(5,3,15,${config.speed})`;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = `rgba(${r},${g},${b},${config.opacity})`;
      ctx.font = `${config.fontSize}px monospace`;

      for (let i = 0; i < drops.length; i++) {
        const char = chars[Math.floor(Math.random() * chars.length)];
        ctx.fillText(char, i * config.fontSize, drops[i] * config.fontSize);
        drops[i]++;
        if (drops[i] * config.fontSize > canvas.height && Math.random() > 0.975) {
          drops[i] = 0;
        }
      }
    };
    tick();
  }

  stop() { cancelAnimationFrame(this.frame); }

  _debounce(fn, d) { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), d); }; }
}

/* ============================================================
   AURORA BACKGROUND (subtle animated mesh gradients)
   ============================================================ */
class AuroraBackground {
  constructor(options = {}) {
    this.config = {
      canvasId: options.canvasId || 'aurora-canvas',
      blobs: options.blobs || [
        { x: 0.15, y: 0.2,  r: 0.38, color: [168, 85,  247], speed: 0.0008 },
        { x: 0.75, y: 0.35, r: 0.30, color: [236, 72,  153], speed: 0.0012 },
        { x: 0.45, y: 0.75, r: 0.35, color: [59,  130, 246], speed: 0.0010 },
        { x: 0.85, y: 0.85, r: 0.25, color: [6,   182, 212], speed: 0.0007 },
      ],
      opacity: options.opacity || 0.12,
    };

    this.blobs = this.config.blobs.map(b => ({
      ...b,
      ox: b.x, oy: b.y,
      phase: Math.random() * Math.PI * 2,
      drift: Math.random() * 0.04 + 0.02,
    }));

    this.canvas = null;
    this.ctx    = null;
    this.frame  = null;
    this._init();
  }

  _init() {
    const canvas = document.createElement('canvas');
    canvas.id = this.config.canvasId;
    canvas.style.cssText = `
      position:fixed; top:0; left:0; width:100%; height:100%;
      pointer-events:none; z-index:0;
    `;
    document.body.insertBefore(canvas, document.body.firstChild);
    this.canvas = canvas;
    this.ctx    = canvas.getContext('2d');
    this._resize();
    window.addEventListener('resize', () => this._resize());
    this._startLoop();
  }

  _resize() {
    this.canvas.width  = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  _startLoop() {
    const tick = (t) => {
      this.frame = requestAnimationFrame(tick);
      this._draw(t);
    };
    requestAnimationFrame(tick);
  }

  _draw(t) {
    const { ctx, canvas, blobs, config } = this;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    blobs.forEach(b => {
      b.phase += b.speed * 60;
      const px = (b.ox + Math.sin(b.phase)           * b.drift) * canvas.width;
      const py = (b.oy + Math.cos(b.phase * 0.7 + 1) * b.drift) * canvas.height;
      const pr = b.r * Math.min(canvas.width, canvas.height);

      const grad = ctx.createRadialGradient(px, py, 0, px, py, pr);
      const [r, g, bl] = b.color;
      grad.addColorStop(0,   `rgba(${r},${g},${bl},${config.opacity})`);
      grad.addColorStop(0.5, `rgba(${r},${g},${bl},${config.opacity * 0.4})`);
      grad.addColorStop(1,   `rgba(${r},${g},${bl},0)`);

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(px, py, pr, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  stop()   { cancelAnimationFrame(this.frame); }
}

/* ============================================================
   AUTO-INIT ON DOM READY
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {
  // Determine particle density from body attribute or default
  const bodyData     = document.body.dataset;
  const particleMode = bodyData.particles || 'full';  // full | minimal | none

  if (particleMode === 'none') return;

  // 1. Aurora mesh background (subtle, always on)
  const aurora = new AuroraBackground({ opacity: 0.13 });

  if (particleMode === 'minimal') {
    // Just particles, no matrix rain
    const engine = new NeuroParticleEngine({ count: 60, enableOrbit: false });
    exposeAPI(engine, aurora, null);
    return;
  }

  // 2. Main particle engine
  const engine = new NeuroParticleEngine({
    count:           150,
    connectDistance: 125,
    speed:           0.5,
    enableNeural:    true,
    enablePulse:     true,
    enableGlow:      true,
    enableOrbit:     true,
    mouseRadius:     160,
  });

  // 3. Optional subtle matrix rain (very low opacity)
  let matrix = null;
  if (!bodyData.noMatrix) {
    matrix = new MatrixRainOverlay({
      opacity:  0.04,
      speed:    0.25,
      fontSize: 14,
    });
  }

  exposeAPI(engine, aurora, matrix);

  // Auto-create pulses periodically for ambience
  setInterval(() => {
    if (document.hidden) return;
    const x = Math.random() * window.innerWidth;
    const y = Math.random() * window.innerHeight;
    engine.addPulse(x, y);
  }, 4000);
});

/* ============================================================
   EXPORT PUBLIC API
   ============================================================ */
function exposeAPI(engine, aurora, matrix) {
  window.NeuroParticles = {
    engine,
    aurora,
    matrix,
    pause:  () => { engine.pause(); },
    resume: () => { engine.resume(); },
    addPulse: (x, y) => engine.addPulse(x, y),
    setCount: (n)    => engine.setCount(n),
    destroy:  () => { engine.destroy(); aurora?.stop(); matrix?.stop(); },
    updateConfig: (cfg) => engine.updateConfig(cfg),
  };
}
