/* ════════════════════════════════════════════════════════════
   NeuroScan AI — script.js
   Particle canvas · Navbar · Form UX · Scroll reveals
════════════════════════════════════════════════════════════ */

// ── 1. Particle Canvas ──────────────────────────────────────
(function () {
  const canvas = document.getElementById('bg-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  let W, H, particles = [], animId;

  const PARTICLE_COUNT = 70;
  const COLORS = ['rgba(6,182,212,', 'rgba(59,130,246,', 'rgba(103,232,249,'];

  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }

  function randomParticle() {
    const color = COLORS[Math.floor(Math.random() * COLORS.length)];
    return {
      x:     Math.random() * W,
      y:     Math.random() * H,
      r:     Math.random() * 1.6 + 0.4,
      alpha: Math.random() * 0.5 + 0.1,
      vx:    (Math.random() - 0.5) * 0.4,
      vy:    (Math.random() - 0.5) * 0.4,
      color,
    };
  }

  function init() {
    resize();
    particles = Array.from({ length: PARTICLE_COUNT }, randomParticle);
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);

    // Mesh connections
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 130) {
          const alpha = (1 - dist / 130) * 0.12;
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = `rgba(6,182,212,${alpha})`;
          ctx.lineWidth = 0.8;
          ctx.stroke();
        }
      }
    }

    // Dots
    particles.forEach(p => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `${p.color}${p.alpha})`;
      ctx.fill();

      p.x += p.vx;
      p.y += p.vy;
      if (p.x < 0 || p.x > W) p.vx *= -1;
      if (p.y < 0 || p.y > H) p.vy *= -1;
    });

    animId = requestAnimationFrame(draw);
  }

  init();
  draw();
  window.addEventListener('resize', () => { cancelAnimationFrame(animId); init(); draw(); });
})();


// ── 2. Navbar scroll state ──────────────────────────────────
(function () {
  const nav = document.getElementById('navbar');
  if (!nav) return;
  window.addEventListener('scroll', () => {
    nav.classList.toggle('solid', window.scrollY > 30);
  }, { passive: true });
})();


// ── 3. Active nav link highlight ────────────────────────────
(function () {
  const sections  = document.querySelectorAll('section[id]');
  const navLinks  = document.querySelectorAll('.nav-link');
  if (!sections.length) return;

  const observer = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        navLinks.forEach(l => {
          l.classList.toggle('active', l.getAttribute('href') === '#' + e.target.id);
        });
      }
    });
  }, { threshold: 0.4 });

  sections.forEach(s => observer.observe(s));
})();


// ── 4. Smooth scroll for all anchor links ───────────────────
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const target = document.querySelector(a.getAttribute('href'));
    if (target) { e.preventDefault(); target.scrollIntoView({ behavior: 'smooth' }); }
  });
});


// ── 5. Form: loading animation on submit ────────────────────
(function () {
  const form   = document.getElementById('predictForm');
  const btn    = document.getElementById('submitBtn');
  const label  = document.getElementById('btnText');
  const loader = document.getElementById('btnLoader');
  if (!form || !btn) return;

  form.addEventListener('submit', () => {
    label.classList.add('hidden');
    loader.classList.remove('hidden');
    btn.disabled = true;
  });
})();


// ── 6. Scroll into result card ──────────────────────────────
(function () {
  const result = document.getElementById('resultPanel');
  if (result) {
    setTimeout(() => result.scrollIntoView({ behavior: 'smooth', block: 'center' }), 250);
  }
})();


// ── 7. Scroll-reveal for feature cards ──────────────────────
(function () {
  const cards = document.querySelectorAll('.feat-card');
  if (!cards.length || !('IntersectionObserver' in window)) return;

  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.style.animationPlayState = 'running';
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.15 });

  cards.forEach(c => {
    c.style.animationPlayState = 'paused';
    io.observe(c);
  });
})();


// ── 8. Input micro-interaction: highlight label on focus ────
document.querySelectorAll('.field-wrap input').forEach(input => {
  const label = input.closest('.field')?.querySelector('label');
  if (!label) return;
  input.addEventListener('focus',  () => label.style.color = 'var(--cyan-300)');
  input.addEventListener('blur',   () => label.style.color = '');
});
