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

const items = [...document.querySelectorAll('.project-card')];
const filters = [...document.querySelectorAll('.filter-btn')];
filters.forEach(button => button.addEventListener('click', () => {
  filters.forEach(b => { b.classList.toggle('active', b === button); b.setAttribute('aria-pressed', String(b === button)); });
  const filter = button.dataset.filter;
  items.forEach(item => { item.hidden = filter !== 'all' && item.dataset.category !== filter; });
  const count = items.filter(item => !item.hidden).length;
  document.getElementById('project-count').textContent = filter === 'all' ? `Showing all ${count} projects.` : `Showing ${count} ${count === 1 ? 'project' : 'projects'}.`;
}));

const serviceSelect = document.getElementById('service');
document.querySelectorAll('[data-service]').forEach(link => link.addEventListener('click', () => {
  serviceSelect.value = link.dataset.service;
}));
const form = document.getElementById('contact-form');
const messageField = document.getElementById('message');
const formStatus = document.getElementById('form-success');
function updateMessageCount() {
  document.getElementById('message-count').textContent = `${messageField.value.length.toLocaleString()} / 1,800`;
}
['name', 'message'].forEach(id => {
  const field = document.getElementById(id);
  field.addEventListener('input', () => field.setCustomValidity(field.value.trim() ? '' : 'Please add a little detail.'));
});
messageField.addEventListener('input', updateMessageCount);
function projectBrief() {
  const data = new FormData(form);
  const service = serviceSelect.value ? serviceSelect.selectedOptions[0].textContent : 'Let’s discuss';
  return `Name: ${String(data.get('name')).trim()}\nEmail: ${String(data.get('email')).trim()}\nService: ${service}\nBudget: ${data.get('budget') || 'Let’s scope it together'}\nTiming: ${data.get('timeline') || 'Still exploring'}\n\n${messageField.value.trim()}`;
}
form.addEventListener('submit', event => {
  event.preventDefault();
  if (!form.reportValidity()) return;
  window.location.href = 'mailto:hello@blackstarentertainment.com?subject=' + encodeURIComponent('Black Star project inquiry') + '&body=' + encodeURIComponent(projectBrief());
  formStatus.textContent = 'Review and send the draft in your email app. Nothing has been sent from this page. If no app opens, copy your brief and email us directly.';
});
document.getElementById('copy-brief').addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(projectBrief());
    formStatus.textContent = 'Project brief copied. Paste it into an email to hello@blackstarentertainment.com or a message to our team.';
  } catch {
    formStatus.textContent = 'Clipboard access is unavailable. Select and copy your project details, then email us or reach out on Instagram.';
  }
});

// A local, deterministic guide: no AI, external requests, or chat data storage.
const guideLauncher = document.getElementById('guide-launcher');
const guidePanel = document.getElementById('guide-panel');
const guideOptions = document.getElementById('guide-options');
const guideResponse = document.getElementById('guide-response');
const guideBack = document.getElementById('guide-back');
const servicePaths = {
  web: ['Websites & web apps', 'A business website, landing page, or custom portal built around what your visitors need to do.', 'What should your website or app help people do?'],
  brand: ['Brand identity & design', 'A clear identity, visual direction, and everyday design that make your business feel consistent.', 'Tell us about your business and the identity you want to build.'],
  video: ['Photography & video', 'Brand films, automotive photography, product shoots, and short edits that put your work in focus.', 'What are we shooting, and where will the content be used?'],
  social: ['Social content & management', 'Content planning, platform-ready creative, and publishing support to help you show up consistently.', 'Which platforms do you use, and what do you want your content to achieve?'],
  automation: ['AI agents & automation', 'Practical agents and connected workflows that help with repetitive tasks and keep your tools working together.', 'Which task or workflow would you like to simplify?'],
  marketing: ['Marketing & launch support', 'Campaign creative, launch pages, and coordinated content to help your next offer reach the right people.', 'What are you launching, and who is it for?'],
  multiple: ['Help me choose', 'We can shape the scope together. Start with your goal and we’ll work out which mix of creative and technical support fits.', 'What would you like to improve or bring to life?']
};
function guideButton(label, action) {
  const button = document.createElement('button');
  button.type = 'button'; button.textContent = label;
  button.addEventListener('click', action); guideOptions.append(button);
}
function guideHome(focus = false) {
  guideResponse.textContent = 'What would you like help with?';
  guideOptions.replaceChildren(); guideBack.hidden = true;
  Object.entries(servicePaths).forEach(([key, path]) => guideButton(path[0] + ' →', () => guideChoose(key)));
  if (focus) guideOptions.querySelector('button').focus();
}
function closeGuide(restoreFocus = true) {
  guidePanel.hidden = true; guideLauncher.setAttribute('aria-expanded', 'false');
  if (restoreFocus) guideLauncher.focus();
}
function guideChoose(key) {
  const path = servicePaths[key];
  guideResponse.textContent = path[1]; guideOptions.replaceChildren(); guideBack.hidden = false;
  guideButton('Tell us about your project ↗', () => {
    serviceSelect.value = key;
    messageField.placeholder = path[2];
    closeGuide(false);
    window.location.hash = 'contact';
    document.getElementById('name').focus({ preventScroll: true });
  });
  guideOptions.querySelector('button').focus();
}
guideHome(); guideLauncher.hidden = false;
guideLauncher.addEventListener('click', () => {
  if (!guidePanel.hidden) { closeGuide(); return; }
  guidePanel.hidden = false; guideLauncher.setAttribute('aria-expanded', 'true');
  document.getElementById('guide-close').focus();
});
document.getElementById('guide-close').addEventListener('click', () => closeGuide());
guideBack.addEventListener('click', () => guideHome(true));
guidePanel.addEventListener('keydown', event => { if (event.key === 'Escape') { event.stopPropagation(); closeGuide(); } });
document.addEventListener('pointerdown', event => {
  if (!guidePanel.hidden && !event.target.closest('.project-guide')) closeGuide(false);
});
// Keep artwork readable if an optional preview cannot load.
document.querySelectorAll('.project-visual > img').forEach(img => img.addEventListener('error', () => { img.hidden = true; }));

// A static starfield retains the original atmosphere without an animation loop.
const canvas = document.getElementById('starCanvas');
const ctx = canvas.getContext('2d');
if (ctx) {
  function drawStars() {
    const box = canvas.getBoundingClientRect(), dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = box.width * dpr; canvas.height = box.height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, box.width, box.height);
    let seed = 31;
    const random = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    for (let i = 0; i < 60; i++) {
      const x = random() * box.width, y = random() * box.height;
      ctx.beginPath(); ctx.arc(x, y, random() + .2, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(225,212,183,${random() * .35 + .08})`; ctx.fill();
    }
  }
  drawStars(); window.addEventListener('resize', drawStars);
}

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
