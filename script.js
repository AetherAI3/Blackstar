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
window.matchMedia('(min-width: 681px)').addEventListener('change', e => { if(e.matches) closeMenu(); });

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
form.addEventListener('submit', event => {
  event.preventDefault();
  if (!form.reportValidity()) return;
  const data = new FormData(form);
  const service = serviceSelect.value ? serviceSelect.selectedOptions[0].textContent : 'Let’s discuss';
  const body = `Name: ${data.get('name')}\nEmail: ${data.get('email')}\nService: ${service}\nBudget: ${data.get('budget') || 'Let’s scope it together'}\n\n${data.get('message')}`;
  window.location.href = 'mailto:hello@blackstarentertainment.com?subject=' + encodeURIComponent('Black Star project inquiry') + '&body=' + encodeURIComponent(body);
  document.getElementById('form-success').textContent = 'Your email draft is ready to open. Review and send it from your email app. If nothing opens, email hello@blackstarentertainment.com directly or reach out on Instagram.';
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
