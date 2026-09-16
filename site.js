
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

  // ---- Astra-like particle cloud / wind (B/W), mouse interactive
  const canvas = document.getElementById('hero-field') || document.getElementById('field');
  if (!canvas) return;
  const ctx = canvas.getContext('2d', { alpha: true });
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const parent = canvas.parentElement;

  let w = 0, h = 0, dpr = 1;
  const mouse = { x: 0.62, y: 0.45, tx: 0.62, ty: 0.45 };
  const COUNT = reduce ? 90 : 220;
  const parts = [];

  function rand(a,b){ return a + Math.random()*(b-a); }

  function spawn(i){
    // cluster around center-right like Astra nebula
    const ang = rand(0, Math.PI*2);
    const rad = Math.pow(Math.random(), 0.65) * 0.42;
    return {
      // base cloud position in normalized coords
      bx: 0.55 + Math.cos(ang)*rad*0.9,
      by: 0.48 + Math.sin(ang)*rad*0.75,
      ox: rand(-0.03, 0.03),
      oy: rand(-0.03, 0.03),
      r: rand(0.6, 2.8),
      a: rand(0.15, 0.85),
      phase: rand(0, Math.PI*2),
      speed: rand(0.15, 0.55),
      wind: rand(0.002, 0.01),
    };
  }
  for (let i=0;i<COUNT;i++) parts.push(spawn(i));

  function resize(){
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = (parent || canvas).getBoundingClientRect();
    w = Math.max(1, Math.floor(rect.width));
    h = Math.max(1, Math.floor(rect.height));
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();
  window.addEventListener('resize', resize, { passive:true });

  function onMove(e){
    const rect = canvas.getBoundingClientRect();
    mouse.tx = (e.clientX - rect.left) / Math.max(1, rect.width);
    mouse.ty = (e.clientY - rect.top) / Math.max(1, rect.height);
  }
  // listen on stage + window so interaction feels attached to hero visual
  parent?.addEventListener('pointermove', onMove, { passive:true });
  window.addEventListener('pointermove', (e) => {
    // soft global influence when pointer near hero
    const rect = canvas.getBoundingClientRect();
    if (e.clientY < rect.bottom + 80) onMove(e);
  }, { passive:true });

  let t0 = performance.now();
  function frame(now){
    const t = (now - t0) / 1000;
    mouse.x += (mouse.tx - mouse.x) * 0.05;
    mouse.y += (mouse.ty - mouse.y) * 0.05;

    ctx.clearRect(0, 0, w, h);

    // soft core glow
    const cx = mouse.x * w;
    const cy = mouse.y * h;
    const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(w,h)*0.42);
    glow.addColorStop(0, 'rgba(255,255,255,0.10)');
    glow.addColorStop(0.35, 'rgba(255,255,255,0.04)');
    glow.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0,0,w,h);

    // wind field drifts
    const windX = Math.sin(t * 0.22) * 0.03;
    const windY = Math.cos(t * 0.18) * 0.02;

    for (const p of parts) {
      // organic swirl around cluster + mouse attraction/repulsion
      const swirl = t * p.speed + p.phase;
      let x = p.bx + p.ox + Math.cos(swirl) * 0.028 + windX * (0.5 + p.wind*40);
      let y = p.by + p.oy + Math.sin(swirl * 1.15) * 0.022 + windY * (0.5 + p.wind*40);

      // mouse interaction: particles gently flow away/around cursor
      const dx = x - mouse.x;
      const dy = y - mouse.y;
      const dist = Math.sqrt(dx*dx + dy*dy) + 0.0001;
      const force = Math.max(0, 0.18 - dist) / 0.18;
      x += (dx / dist) * force * 0.12;
      y += (dy / dist) * force * 0.12;
      // slight pull of the whole cloud toward mouse
      x += (mouse.x - 0.55) * 0.08;
      y += (mouse.y - 0.48) * 0.06;

      const px = x * w;
      const py = y * h;
      const alpha = p.a * (0.55 + force * 0.45);
      ctx.beginPath();
      ctx.fillStyle = `rgba(255,255,255,${alpha})`;
      ctx.arc(px, py, p.r, 0, Math.PI*2);
      ctx.fill();
    }

    // faint connecting haze (cloud body)
    ctx.globalCompositeOperation = 'lighter';
    const haze = ctx.createRadialGradient(0.58*w, 0.48*h, 0, 0.58*w, 0.48*h, Math.max(w,h)*0.33);
    haze.addColorStop(0, 'rgba(255,255,255,0.05)');
    haze.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = haze;
    ctx.fillRect(0,0,w,h);
    ctx.globalCompositeOperation = 'source-over';

    if (!reduce) requestAnimationFrame(frame);
  }

  if (reduce) {
    // static cloud once
    frame(performance.now());
  } else {
    requestAnimationFrame(frame);
  }
})();
