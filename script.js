const serviceSelect = document.getElementById('service');
document.querySelectorAll('[data-service]').forEach(link => link.addEventListener('click', () => {
  serviceSelect.value = link.dataset.service;
}));
// Service pages hand off only an allowlisted service value; no personal data in the URL.
const requestedService = new URLSearchParams(window.location.search).get('service');
if ([...serviceSelect.options].some(option => option.value === requestedService)) serviceSelect.value = requestedService;
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

