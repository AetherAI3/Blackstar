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
const submitButton = form.querySelector('button[type="submit"]');
const submissionNote = document.getElementById('submission-note');
const contactChallenge = document.getElementById('contact-challenge');
let directDelivery = false;
let challengeWidget;
let pendingPayload;
let pendingId;
let inFlight = false;
let contactStarted = false;
const acceptedIds = new Set();
function trackInquiry(event, properties) {
  try { window.BlackStarAnalytics?.track(event, properties); } catch { /* Analytics never controls delivery. */ }
}
function selectedService() {
  return ['web', 'brand', 'video', 'social', 'automation', 'marketing', 'multiple'].includes(serviceSelect.value) ? serviceSelect.value : 'unspecified';
}
form.addEventListener('input', event => {
  if (contactStarted || !['name', 'email', 'message'].includes(event.target.id) || !event.target.value.trim()) return;
  contactStarted = true;
  trackInquiry('contact_started', {service: selectedService(), source: window.BlackStarContactSource || 'direct'});
});
form.addEventListener('change', event => {
  if (contactStarted || !['service', 'budget', 'timeline'].includes(event.target.id) || !event.target.value) return;
  contactStarted = true;
  trackInquiry('contact_started', {service: selectedService(), source: window.BlackStarContactSource || 'direct'});
});
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
function draftInquiry() {
  window.location.href = 'mailto:inquiries.blackstarent@gmail.com?subject=' + encodeURIComponent('Black Star project inquiry') + '&body=' + encodeURIComponent(projectBrief());
  formStatus.textContent = 'Review and send the draft in your email app. Nothing has been sent from this page. If no app opens, copy your brief and email us directly.';
}
function contactPayload() {
  const data = new FormData(form);
  return {name: String(data.get('name') || '').trim(), email: String(data.get('email') || '').trim(),
    service: String(data.get('service') || ''), budget: String(data.get('budget') || ''),
    timeline: String(data.get('timeline') || ''), message: messageField.value.trim(), website: String(data.get('website') || '')};
}
form.addEventListener('submit', async event => {
  event.preventDefault();
  if (inFlight) return;
  if (!form.reportValidity()) return;
  if (!directDelivery) return draftInquiry();
  const token = window.turnstile?.getResponse(challengeWidget);
  if (!token) {
    formStatus.textContent = 'Please complete the verification, then send your inquiry.';
    return;
  }
  const payload = contactPayload();
  const fingerprint = JSON.stringify(payload);
  if (fingerprint !== pendingPayload) {
    pendingId = crypto.randomUUID();
    pendingPayload = fingerprint;
  }
  submitButton.disabled = true;
  inFlight = true;
  form.setAttribute('aria-busy', 'true');
  formStatus.textContent = 'Sending your inquiry…';
  try {
    const response = await fetch('/api/contact', {method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({...payload, submissionId: pendingId, challengeToken: token}),
      signal: AbortSignal.timeout(15000)});
    if (response.status === 202) {
      if (!acceptedIds.has(pendingId)) {
        acceptedIds.add(pendingId);
        trackInquiry('inquiry_accepted', {service: selectedService()});
      }
      form.reset(); updateMessageCount(); pendingId = pendingPayload = undefined;
      formStatus.textContent = 'Thank you. Our email service accepted your inquiry and confirmation for processing. Delivery is not yet confirmed; our team will reply personally.';
    } else if (response.status === 403) {
      trackInquiry('inquiry_failed', {error_category: 'verification'});
      formStatus.textContent = 'Verification expired or failed. Please try again; your project details are still here.';
    } else if (response.status === 429) {
      trackInquiry('inquiry_failed', {error_category: 'rate_limit'});
      formStatus.textContent = 'Too many attempts right now. Please try again in ten minutes or email us directly.';
    } else if (response.status === 504) {
      trackInquiry('inquiry_status_unknown');
      formStatus.textContent = 'The email service did not confirm the outcome. Your details are still here; retrying will use the same inquiry reference.';
    } else {
      trackInquiry('inquiry_failed', {error_category: response.status === 400 || response.status === 413 ? 'validation' : response.status >= 500 ? 'provider_unavailable' : 'unexpected'});
      formStatus.textContent = 'We could not confirm delivery. Your details are still here. Try again, copy the brief, or email us directly.';
    }
  } catch {
    trackInquiry('inquiry_status_unknown');
    formStatus.textContent = 'The connection was interrupted, so delivery is uncertain. Your details are still here; retry or email us directly.';
  } finally {
    window.turnstile?.reset(challengeWidget);
    submitButton.disabled = false;
    inFlight = false;
    form.removeAttribute('aria-busy');
    formStatus.focus();
  }
});
document.getElementById('copy-brief').addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(projectBrief());
    formStatus.textContent = 'Project brief copied. Paste it into an email to inquiries.blackstarent@gmail.com or a message to our team.';
  } catch {
    formStatus.textContent = 'Clipboard access is unavailable. Select and copy your project details, then email us or reach out on Instagram.';
  }
});

// Enable fields only after the draft/copy handlers are registered.
document.getElementById('contact-fields').disabled = false;
document.getElementById('form-unavailable').hidden = true;

// The static GitHub Pages copy and unconfigured Cloudflare deployments stay in draft mode.
if (location.hostname === 'blackstarentertainment.org') {
  fetch('/api/contact', {signal: AbortSignal.timeout(5000)}).then(response => response.ok ? response.json() : null)
    .then(config => {
      if (!config?.enabled || !config.siteKey) return;
      const script = document.createElement('script');
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
      script.async = true;
      script.onload = () => {
        contactChallenge.hidden = false;
        challengeWidget = window.turnstile.render(contactChallenge, {sitekey: config.siteKey, action: 'contact'});
        directDelivery = true;
        submitButton.innerHTML = 'Send project inquiry <span aria-hidden="true">↗</span>';
        submissionNote.textContent = 'We send your inquiry to our team and an immediate confirmation to your email. No newsletter sign-up.';
      };
      document.head.appendChild(script);
    }).catch(() => { /* Keep the honest email-draft fallback. */ });
}

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

