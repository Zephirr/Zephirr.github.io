
(() => {
  const toggle = document.querySelector('.nav-toggle');
  const menu = document.querySelector('#menu');
  toggle?.addEventListener('click', () => {
    const open = menu.classList.toggle('open');
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
  });
  menu?.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
    menu.classList.remove('open');
    toggle?.setAttribute('aria-expanded', 'false');
  }));

  const lightbox = document.getElementById('lightbox');
  const img = document.getElementById('lightbox-img');
  const title = document.getElementById('lightbox-title');
  const desc = document.getElementById('lightbox-desc');
  let lastFocus = null;

  function openLightbox(card) {
    lastFocus = card;
    img.src = card.dataset.full;
    img.alt = card.dataset.title || '';
    title.textContent = card.dataset.title || '';
    desc.textContent = card.dataset.desc || '';
    lightbox.hidden = false;
    document.body.style.overflow = 'hidden';
    lightbox.querySelector('.lightbox-close')?.focus();
  }
  function closeLightbox() {
    lightbox.hidden = true;
    img.removeAttribute('src');
    document.body.style.overflow = '';
    lastFocus?.focus();
  }

  document.querySelectorAll('.card').forEach(card => {
    card.addEventListener('click', () => openLightbox(card));
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openLightbox(card); }
    });
  });
  lightbox?.querySelectorAll('[data-close]').forEach(el => el.addEventListener('click', closeLightbox));
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !lightbox.hidden) closeLightbox();
  });
})();
