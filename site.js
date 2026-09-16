(() => {
  // ---- Nav
  const burger = document.querySelector('.burger');
  const nav = document.querySelector('#nav');
  burger?.addEventListener('click', () => {
    const open = nav.classList.toggle('open');
    burger.setAttribute('aria-expanded', open ? 'true' : 'false');
  });
  nav?.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
    nav.classList.remove('open');
    burger?.setAttribute('aria-expanded', 'false');
  }));

  // ---- Reveal
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('is-in'); });
  }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
  document.querySelectorAll('.reveal, .reveal-line').forEach(el => io.observe(el));
  requestAnimationFrame(() => {
    document.querySelectorAll('.hero .reveal-line').forEach(el => el.classList.add('is-in'));
  });

  // ---- Lightbox
  const lb = document.getElementById('lightbox');
  const img = document.getElementById('lb-img');
  const title = document.getElementById('lb-title');
  const desc = document.getElementById('lb-desc');
  let last = null;
  function open(btn){
    last = btn;
    img.src = btn.dataset.full;
    img.alt = btn.dataset.title || '';
    title.textContent = btn.dataset.title || '';
    desc.textContent = btn.dataset.desc || '';
    lb.hidden = false;
    document.body.style.overflow = 'hidden';
    lb.querySelector('.lb-close')?.focus();
  }
  function close(){
    lb.hidden = true;
    img.removeAttribute('src');
    document.body.style.overflow = '';
    last?.focus();
  }
  document.querySelectorAll('.project-hit').forEach(btn => btn.addEventListener('click', () => open(btn)));
  lb?.querySelectorAll('[data-close]').forEach(el => el.addEventListener('click', close));
  window.addEventListener('keydown', e => { if (e.key === 'Escape' && !lb.hidden) close(); });

  // ---- Starfield wallpaper (full viewport, twinkle + aura)
  const canvas = document.getElementById('field');
  if (!canvas) return;
  const ctx = canvas.getContext('2d', { alpha: true });
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let w = 0, h = 0, dpr = 1;
  const mouse = { x: 0.65, y: 0.38, tx: 0.65, ty: 0.38 };
  const stars = [];

  function rand(a, b){ return a + Math.random() * (b - a); }

  function starCount(){
    const area = window.innerWidth * window.innerHeight;
    if (reduce) return Math.min(140, Math.max(70, Math.floor(area / 18000)));
    if (window.innerWidth < 720) return Math.min(180, Math.max(120, Math.floor(area / 9000)));
    return Math.min(320, Math.max(220, Math.floor(area / 5500)));
  }

  function spawnStar(){
    // Full-sky wallpaper; slightly denser mid / upper-right so left hero copy stays readable
    const roll = Math.random();
    let bx, by;
    if (roll < 0.48) {
      const ang = rand(0, Math.PI * 2);
      const rad = Math.pow(Math.random(), 0.5) * 0.52;
      bx = 0.68 + Math.cos(ang) * rad * 0.92;
      by = 0.36 + Math.sin(ang) * rad * 0.78;
    } else if (roll < 0.78) {
      bx = rand(0.18, 0.98);
      by = rand(0.04, 0.72);
    } else {
      bx = rand(0.01, 0.99);
      by = rand(0.02, 0.98);
    }
    bx = Math.min(0.995, Math.max(0.005, bx));
    by = Math.min(0.995, Math.max(0.005, by));

    const bright = Math.random() < 0.2; // ~20% aura stars
    return {
      bx, by,
      ox: rand(-0.012, 0.012),
      oy: rand(-0.012, 0.012),
      r: bright ? rand(1.1, 2.4) : rand(0.45, 1.55),
      baseA: bright ? rand(0.55, 0.95) : rand(0.18, 0.72),
      phase: rand(0, Math.PI * 2),
      twinkle: rand(0.55, 2.1),
      pulse: rand(0.08, 0.28),
      wind: rand(0.15, 1),
      driftX: rand(-0.006, 0.006),
      driftY: rand(-0.004, 0.004),
      bright,
      glow: bright ? rand(3.5, 11) : 0,
      glowA: bright ? rand(0.12, 0.32) : 0,
    };
  }

  function rebuild(){
    stars.length = 0;
    const n = starCount();
    for (let i = 0; i < n; i++) stars.push(spawnStar());
  }

  function resize(){
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = Math.max(1, Math.floor(window.innerWidth));
    h = Math.max(1, Math.floor(window.innerHeight));
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  resize();
  rebuild();
  window.addEventListener('resize', () => {
    const prev = stars.length;
    resize();
    const next = starCount();
    if (Math.abs(next - prev) > 40) rebuild();
  }, { passive: true });
  requestAnimationFrame(resize);

  // pointer on window so mouse react works with pointer-events:none on canvas
  window.addEventListener('pointermove', (e) => {
    mouse.tx = e.clientX / Math.max(1, w);
    mouse.ty = e.clientY / Math.max(1, h);
  }, { passive: true });

  let t0 = performance.now();

  function drawStar(s, t){
    // gentle wind + personal drift
    const windX = Math.sin(t * 0.11 + s.phase) * 0.018 * s.wind;
    const windY = Math.cos(t * 0.09 + s.phase * 0.7) * 0.012 * s.wind;
    let x = s.bx + s.ox + s.driftX * Math.sin(t * 0.07 + s.phase) + windX;
    let y = s.by + s.oy + s.driftY * Math.cos(t * 0.06 + s.phase) + windY;

    // subtle mouse repulsion + soft glow follow (not gamey)
    const dx = x - mouse.x;
    const dy = y - mouse.y;
    const dist = Math.sqrt(dx * dx + dy * dy) + 0.0001;
    const near = Math.max(0, 0.22 - dist) / 0.22;
    x += (dx / dist) * near * 0.055;
    y += (dy / dist) * near * 0.055;
    x += (mouse.x - 0.65) * 0.035;
    y += (mouse.y - 0.38) * 0.025;

    // scintillation: alpha + slight radius pulse
    const tw = 0.55 + 0.45 * Math.sin(t * s.twinkle + s.phase);
    const alpha = Math.min(1, s.baseA * tw * (0.75 + near * 0.35));
    const radius = s.r * (1 + s.pulse * Math.sin(t * s.twinkle * 1.35 + s.phase));

    const px = x * w;
    const py = y * h;

    if (s.bright && s.glow > 0) {
      const gR = s.glow * (0.85 + 0.25 * tw) * (1 + near * 0.4);
      const g = ctx.createRadialGradient(px, py, 0, px, py, gR);
      const ga = s.glowA * tw * (0.7 + near * 0.5);
      g.addColorStop(0, `rgba(255,255,255,${ga})`);
      g.addColorStop(0.35, `rgba(255,255,255,${ga * 0.35})`);
      g.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(px, py, gR, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.beginPath();
    ctx.fillStyle = `rgba(255,255,255,${alpha})`;
    ctx.arc(px, py, Math.max(0.35, radius), 0, Math.PI * 2);
    ctx.fill();
  }

  function frame(now){
    const t = (now - t0) / 1000;
    mouse.x += (mouse.tx - mouse.x) * 0.045;
    mouse.y += (mouse.ty - mouse.y) * 0.045;

    ctx.clearRect(0, 0, w, h);

    // soft mouse glow veil (very subtle sky warmth)
    if (!reduce) {
      const cx = mouse.x * w;
      const cy = mouse.y * h;
      const veil = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(w, h) * 0.38);
      veil.addColorStop(0, 'rgba(255,255,255,0.06)');
      veil.addColorStop(0.4, 'rgba(255,255,255,0.02)');
      veil.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = veil;
      ctx.fillRect(0, 0, w, h);
    }

    ctx.globalCompositeOperation = 'lighter';
    for (const s of stars) drawStar(s, reduce ? s.phase : t);
    ctx.globalCompositeOperation = 'source-over';

    if (!reduce) requestAnimationFrame(frame);
  }

  if (reduce) {
    frame(performance.now());
  } else {
    requestAnimationFrame(frame);
  }
})();
