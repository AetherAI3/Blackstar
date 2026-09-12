'use strict';
const toggle = document.getElementById('hamburger');
const menu = document.getElementById('nav-menu');
function closeMenu(returnFocus = false) {
  closeDropdowns();
  menu.classList.remove('open');
  toggle.setAttribute('aria-expanded', 'false');
  toggle.setAttribute('aria-label', 'Open navigation');
  if (returnFocus) toggle.focus();
}
toggle.addEventListener('click', () => {
  const open = menu.classList.toggle('open');
  toggle.setAttribute('aria-expanded', String(open));
  toggle.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
});
menu.querySelectorAll('a').forEach(a => a.addEventListener('click', () => closeMenu()));
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && menu.classList.contains('open')) closeMenu(true);
});
window.matchMedia('(min-width: 961px)').addEventListener('change', e => { if(e.matches) closeMenu(); });

// One shared pointer light, with one update per frame and no perpetual animation.
const ambientRegions = [...document.querySelectorAll('[data-ambient]')];
const glowPreference = window.matchMedia('(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)');
let activeRegion = null, glowFrame = 0, glowX = 0, glowY = 0;
function clearAmbient() {
  if (activeRegion) activeRegion.classList.remove('glow-active');
  activeRegion = null;
  if (glowFrame) window.cancelAnimationFrame(glowFrame);
  glowFrame = 0;
}
function paintAmbient() {
  glowFrame = 0;
  if (!activeRegion) return;
  const rect = activeRegion.getBoundingClientRect();
  if (glowX < rect.left || glowX > rect.right || glowY < rect.top || glowY > rect.bottom) { clearAmbient(); return; }
  activeRegion.style.setProperty('--glow-x', `${glowX - rect.left}px`);
  activeRegion.style.setProperty('--glow-y', `${glowY - rect.top}px`);
}
function requestAmbient() { if (!glowFrame) glowFrame = window.requestAnimationFrame(paintAmbient); }
ambientRegions.forEach(region => {
  region.addEventListener('pointermove', event => {
    if (!glowPreference.matches || event.pointerType === 'touch') return;
    if (activeRegion !== region) { clearAmbient(); activeRegion = region; }
    glowX = event.clientX; glowY = event.clientY;
    region.classList.add('glow-active'); requestAmbient();
  }, { passive: true });
  region.addEventListener('pointerleave', () => { if (activeRegion === region) clearAmbient(); });
  region.addEventListener('pointercancel', clearAmbient);
});
window.addEventListener('blur', clearAmbient);
window.addEventListener('scroll', () => { if (activeRegion) requestAmbient(); }, { passive: true });
glowPreference.addEventListener('change', clearAmbient);

// Anchors remain native links. The active pill follows the current section.
const navAnchors = [...menu.querySelectorAll('a[href^="#"]')];
function markCurrent(id) {
  navAnchors.forEach(link => {
    if (link.hash === '#' + id) link.setAttribute('aria-current', 'location');
    else link.removeAttribute('aria-current');
  });
}
navAnchors.forEach(link => link.addEventListener('click', () => markCurrent(link.hash.slice(1))));
if ('IntersectionObserver' in window) {
  const sectionObserver = new IntersectionObserver(entries => {
    const visible = entries.filter(entry => entry.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
    if (visible.length) markCurrent(visible[0].target.id);
  }, { rootMargin: '-16% 0px -64% 0px', threshold: 0 });
  document.querySelectorAll('main > section[id]').forEach(section => sectionObserver.observe(section));
}
document.addEventListener('pointerdown', event => {
  if (menu.classList.contains('open') && !menu.contains(event.target) && !toggle.contains(event.target)) closeMenu();
});

// Native disclosures remain clickable and keyboard-operable without hover.
const navDrops = [...menu.querySelectorAll('.nav-dropdown')];
const desktopHover = window.matchMedia('(min-width: 961px) and (hover: hover) and (pointer: fine)');
let navCloseTimer;
function closeDropdowns(except = null) {
  window.clearTimeout(navCloseTimer);
  navDrops.forEach(drop => { if (drop !== except) drop.open = false; });
}
navDrops.forEach(drop => {
  drop.addEventListener('toggle', () => { if (drop.open) closeDropdowns(drop); });
  drop.addEventListener('pointerenter', event => {
    if (!desktopHover.matches || event.pointerType === 'touch') return;
    window.clearTimeout(navCloseTimer); closeDropdowns(drop); drop.open = true;
  });
  drop.addEventListener('pointerleave', () => {
    if (!desktopHover.matches) return;
    navCloseTimer = window.setTimeout(() => { if (!drop.contains(document.activeElement)) drop.open = false; }, 180);
  });
  drop.addEventListener('focusout', () => {
    window.setTimeout(() => { if (!drop.contains(document.activeElement) && !drop.matches(':hover')) drop.open = false; }, 0);
  });
  drop.querySelector('summary').addEventListener('keydown', event => {
    if (event.key === 'ArrowDown') {
      event.preventDefault(); closeDropdowns(drop); drop.open = true;
      drop.querySelector('a').focus();
    }
  });
});
menu.addEventListener('keydown', event => {
  if (event.key !== 'Escape') return;
  const open = navDrops.find(drop => drop.open);
  if (open) { event.stopPropagation(); closeDropdowns(); open.querySelector('summary').focus(); }
});
menu.querySelectorAll('a').forEach(link => link.addEventListener('click', () => closeDropdowns()));
document.addEventListener('pointerdown', event => { if (!menu.contains(event.target)) closeDropdowns(); });
desktopHover.addEventListener('change', () => closeDropdowns());

// Scroll-triggered reveals enhance visible content; links never wait on animation.
const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
const revealTargets = [...document.querySelectorAll('.section-heading,.about-content,.about-visual,.service-card,.team-card,.content-callout,.contact-form,.detail-card,.footer-invitation')];
const runningReveals = new Set();
if ('IntersectionObserver' in window) {
  const revealObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      revealObserver.unobserve(entry.target);
      if (motionPreference.matches) return;
      if (entry.target.matches('.scroll-progress') && CSS.supports('animation-timeline: view()')) return;
      const animation = entry.target.animate([
        { opacity: .4, translate: '0 26px', scale: '.98' },
        { opacity: 1, translate: '0 0', scale: '1' }
      ], { duration: 700, easing: 'cubic-bezier(.2,.75,.2,1)' });
      runningReveals.add(animation);
      animation.finished.then(() => runningReveals.delete(animation)).catch(() => runningReveals.delete(animation));
    });
  }, { threshold: .08 });
  revealTargets.forEach(target => revealObserver.observe(target));
  const journeys = document.querySelectorAll('.contact-journey');
  const journeyObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      if (!motionPreference.matches) entry.target.classList.add('journey-playing');
      journeyObserver.unobserve(entry.target);
    });
  }, { threshold: .5 });
  journeys.forEach(journey => journeyObserver.observe(journey));
}
motionPreference.addEventListener('change', () => {
  if (motionPreference.matches) {
    runningReveals.forEach(animation => animation.cancel()); runningReveals.clear();
    document.querySelectorAll('.contact-journey').forEach(journey => journey.classList.remove('journey-playing'));
  }
});

// A brief ambient opening settles automatically; no visible motion control.
const ambientHero = document.querySelector('#hero');
if (ambientHero) {
  let heroInView = true, introSettled = false;
  function updateHeroMotion() {
    ambientHero.classList.toggle('ambient-running', heroInView && !introSettled && !document.hidden && !motionPreference.matches);
  }
  document.addEventListener('visibilitychange', updateHeroMotion);
  motionPreference.addEventListener('change', updateHeroMotion);
  if ('IntersectionObserver' in window) {
    const heroObserver = new IntersectionObserver(entries => {
      heroInView = entries.some(entry => entry.isIntersecting); updateHeroMotion();
    });
    heroObserver.observe(ambientHero);
  }
  updateHeroMotion();
  window.setTimeout(() => { introSettled = true; updateHeroMotion(); }, 4500);
}
