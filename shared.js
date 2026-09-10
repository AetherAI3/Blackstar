'use strict';
const toggle = document.getElementById('hamburger');
const menu = document.getElementById('nav-menu');
function closeMenu(returnFocus = false) {
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
