// A finite, visitor-controlled showcase. No auto-rotation or scroll hijacking.
(() => {
  const carousel = document.querySelector('.project-carousel');
  if (!carousel) return;
  const stage = carousel.querySelector('.portfolio-grid');
  const cards = [...stage.querySelectorAll('.project-card')];
  const choices = [...carousel.querySelectorAll('[data-carousel-index]')];
  const status = carousel.querySelector('#project-count');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  if (cards.length !== choices.length || cards.length < 2) return;
  let current = 0, pointer = null, suppressClickUntil = 0, frame = 0, inView = true;
  const names = cards.map(card => card.querySelector('h3').firstChild.textContent.trim());

  function show(index, announce = true) {
    const previous = cards[current];
    current = (index + cards.length) % cards.length;
    // Keep keyboard focus out of a card that is becoming a visual preview.
    if (previous === document.activeElement && previous !== cards[current]) choices[current].focus();
    cards.forEach((card, i) => {
      const slot = (i - current + cards.length) % cards.length;
      card.dataset.position = slot === 0 ? 'current' : slot === 1 ? 'next' : slot === cards.length - 1 ? 'previous' : 'back';
      card.tabIndex = i === current ? 0 : -1;
      card.setAttribute('aria-hidden', String(i !== current));
      choices[i].setAttribute('aria-pressed', String(i === current));
    });
    if (announce) status.textContent = `${names[current]}, project ${current + 1} of ${cards.length}. Open the card to explore the website in a new tab.`;
  }
  choices.forEach((button, i) => button.addEventListener('click', () => show(i)));
  carousel.querySelectorAll('[data-carousel-step]').forEach(button => button.addEventListener('click', () => show(current + Number(button.dataset.carouselStep))));
  carousel.addEventListener('keydown', event => {
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    const targets = { ArrowRight: current + 1, ArrowLeft: current - 1, Home: 0, End: cards.length - 1 };
    if (!(event.key in targets)) return;
    event.preventDefault(); show(targets[event.key]);
  });
  cards.forEach((card, i) => card.addEventListener('click', event => {
    if (Date.now() < suppressClickUntil) { event.preventDefault(); return; }
    if (i !== current) { event.preventDefault(); show(i); }
  }));
  stage.addEventListener('dragstart', event => event.preventDefault());
  stage.addEventListener('pointerdown', event => {
    if (!event.isPrimary || event.button !== 0) return;
    pointer = { id: event.pointerId, x: event.clientX, y: event.clientY };
  }, { passive: true });
  stage.addEventListener('pointerup', event => {
    if (!pointer || pointer.id !== event.pointerId) return;
    const dx = event.clientX - pointer.x, dy = event.clientY - pointer.y;
    pointer = null;
    if (Math.abs(dx) > 55 && Math.abs(dx) > Math.abs(dy) * 1.5) {
      suppressClickUntil = Date.now() + 400;
      show(current + (dx < 0 ? 1 : -1));
    }
  }, { passive: true });
  stage.addEventListener('pointercancel', () => { pointer = null; });

  function paintEntrance() {
    frame = 0;
    if (!inView || document.hidden) return;
    const top = stage.getBoundingClientRect().top;
    const progress = reduced.matches ? 1 : Math.min(1, Math.max(0, (innerHeight - top) / (innerHeight * .65)));
    stage.style.setProperty('--arrival', progress.toFixed(3));
  }
  function scheduleEntrance() {
    if (inView && !frame && !document.hidden) frame = requestAnimationFrame(paintEntrance);
  }
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      inView = entries[0].isIntersecting;
      if (!inView && frame) { cancelAnimationFrame(frame); frame = 0; }
      if (inView) scheduleEntrance();
    });
    observer.observe(stage);
  }
  window.addEventListener('scroll', scheduleEntrance, { passive: true });
  window.addEventListener('resize', scheduleEntrance, { passive: true });
  document.addEventListener('visibilitychange', scheduleEntrance);
  reduced.addEventListener('change', () => { stage.style.setProperty('--arrival', '1'); scheduleEntrance(); });
  show(0, false);
  carousel.classList.add('carousel-ready');
  carousel.querySelector('.carousel-controls').hidden = false;
  carousel.querySelector('.carousel-hint').hidden = false;
  // Reserve the tallest card's real layout height, including wrapped mobile text.
  function fitStage() {
    stage.style.height = `${Math.ceil(Math.max(...cards.map(card => card.offsetHeight))) + 70}px`;
    scheduleEntrance();
  }
  if ('ResizeObserver' in window) {
    const sizeObserver = new ResizeObserver(fitStage);
    cards.forEach(card => sizeObserver.observe(card));
  } else {
    window.addEventListener('resize', fitStage, { passive: true });
    window.addEventListener('load', fitStage);
  }
  fitStage();
  scheduleEntrance();
})();
