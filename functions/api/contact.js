// Cloudflare Pages Function. Secrets are runtime bindings, never browser code.
const SITE_HOST = 'blackstarentertainment.org';
const INBOX = 'inquiries.blackstarent@gmail.com';
const FROM = 'Black Star Entertainment <contact@blackstarentertainment.org>';
const SERVICES = Object.freeze({
  '': 'General project', web: 'Websites & web apps', brand: 'Brand identity & design',
  video: 'Photography & video', social: 'Social content & management',
  automation: 'AI agents & automation', marketing: 'Marketing & launch support',
  multiple: 'Multiple services'
});
const BUDGETS = new Set(['', 'Under $1,000', '$1,000–$3,000', '$3,000–$10,000', '$10,000+']);
const TIMELINES = new Set(['', 'As soon as possible', 'Within 1–3 months', 'Later this year']);
const FIELDS = new Set(['submissionId', 'name', 'email', 'service', 'budget', 'timeline', 'message', 'website', 'challengeToken']);

function json(status, body, extra = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff', ...extra}
  });
}

function configured(env) {
  return env.CONTACT_ENABLED === 'true' && Boolean(env.RESEND_API_KEY && env.TURNSTILE_SECRET_KEY &&
    env.TURNSTILE_SITE_KEY && env.CONTACT_RATE_KV && env.CONTACT_RATE_SALT);
}

function allowedHost(request) {
  return new URL(request.url).hostname === SITE_HOST;
}

export function onRequestGet({request, env}) {
  const enabled = allowedHost(request) && configured(env);
  return json(200, {enabled, ...(enabled ? {siteKey: env.TURNSTILE_SITE_KEY} : {})});
}

function bounded(value, max, required = false) {
  return typeof value === 'string' && value.length <= max && (!required || value.trim().length > 0);
}

function validate(data) {
  if (!data || typeof data !== 'object' || Array.isArray(data) || Object.keys(data).some(key => !FIELDS.has(key))) return null;
  const id = data.submissionId;
  if (!bounded(id, 36, true) || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) return null;
  if (!bounded(data.name, 120, true) || /[\r\n]/.test(data.name)) return null;
  if (!bounded(data.email, 254, true) || /[\r\n\s]/.test(data.email) || !/^[^@]+@[^@.]+(?:\.[^@.]+)+$/.test(data.email)) return null;
  if (!bounded(data.message, 1800, true)) return null;
  for (const field of ['service', 'budget', 'timeline', 'website']) if (typeof data[field] !== 'string') return null;
  if (!Object.hasOwn(SERVICES, data.service) || !BUDGETS.has(data.budget) || !TIMELINES.has(data.timeline) || data.website) return null;
  if (!bounded(data.challengeToken, 2048, true)) return null;
  return {submissionId: id.toLowerCase(), name: data.name.trim(), email: data.email.trim(),
    message: data.message.trim(), service: data.service, budget: data.budget, timeline: data.timeline,
    challengeToken: data.challengeToken};
}

async function verifyChallenge(env, token, ip) {
  const body = new URLSearchParams({secret: env.TURNSTILE_SECRET_KEY, response: token, remoteip: ip});
  const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {method: 'POST', body});
  if (!response.ok) return false;
  const result = await response.json();
  return result.success === true && result.hostname === SITE_HOST && result.action === 'contact';
}

async function rateLimit(env, ip) {
  // KV is persistent across isolates. Turnstile is the primary abuse gate; KV counters are best effort.
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(env.CONTACT_RATE_SALT),
    {name: 'HMAC', hash: 'SHA-256'}, false, ['sign']);
  const digest = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(ip));
  const hash = [...new Uint8Array(digest)].map(byte => byte.toString(16).padStart(2, '0')).join('');
  const now = Date.now();
  const windowKey = `ip:${Math.floor(now / 600000)}:${hash}`;
  const dayKey = `day:${Math.floor(now / 86400000)}`;
  const [ipCount, dayCount] = await Promise.all([env.CONTACT_RATE_KV.get(windowKey), env.CONTACT_RATE_KV.get(dayKey)]);
  if (Number(ipCount || 0) >= 5 || Number(dayCount || 0) >= 100) return false;
  await Promise.all([
    env.CONTACT_RATE_KV.put(windowKey, String(Number(ipCount || 0) + 1), {expirationTtl: 1200}),
    env.CONTACT_RATE_KV.put(dayKey, String(Number(dayCount || 0) + 1), {expirationTtl: 172800})
  ]);
  return true;
}

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, char => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[char]));
}

function messages(data) {
  const service = SERVICES[data.service];
  const first = data.name.split(/\s+/)[0];
  const owner = `New project inquiry\n\nName: ${data.name}\nEmail: ${data.email}\nService: ${service}\nBudget: ${data.budget || 'Not specified'}\nTiming: ${data.timeline || 'Not specified'}\n\nProject brief:\n${data.message}\n\nSubmission ID: ${data.submissionId}`;
  const thanks = `Hi ${first},\n\nThank you for contacting Black Star Entertainment. Your project inquiry has been submitted, and our team will review it. We will reply personally as soon as we can.\n\nIf you have an important detail to add, reply to this email.\n\nBrandon and Edwin\nBlack Star Entertainment\nhttps://blackstarentertainment.org/`;
  return [
    {from: FROM, to: [INBOX], reply_to: data.email, subject: `New Black Star inquiry — ${service}`, text: owner},
    {from: FROM, to: [data.email], reply_to: INBOX, subject: 'We received your Black Star inquiry',
      text: thanks,
      html: `<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;color:#222;line-height:1.6"><p style="color:#9b793c;letter-spacing:.12em;font-size:12px">BLACK STAR ENTERTAINMENT</p><h1 style="font-size:24px">Thank you for reaching out.</h1><p>Hi ${escapeHtml(first)},</p><p>Your project inquiry has been submitted, and our team will review it. We will reply personally as soon as we can.</p><p>If you have an important detail to add, reply to this email.</p><p>Brandon and Edwin<br>Black Star Entertainment</p><p><a href="https://blackstarentertainment.org/">blackstarentertainment.org</a></p></div>`}
  ];
}

export async function onRequestPost({request, env}) {
  if (!allowedHost(request) || !configured(env)) return json(503, {code: 'DELIVERY_UNAVAILABLE'});
  if (request.headers.get('Origin') !== `https://${SITE_HOST}`) return json(403, {code: 'VERIFICATION_FAILED'});
  if (!/^application\/json(?:\s*;|$)/i.test(request.headers.get('Content-Type') || '')) return json(415, {code: 'UNSUPPORTED_MEDIA_TYPE'});
  if (Number(request.headers.get('Content-Length') || 0) > 16384) return json(413, {code: 'VALIDATION_ERROR'});
  let raw;
  try { raw = await request.text(); } catch { return json(400, {code: 'VALIDATION_ERROR'}); }
  if (new TextEncoder().encode(raw).length > 16384) return json(413, {code: 'VALIDATION_ERROR'});
  let data;
  try { data = validate(JSON.parse(raw)); } catch { /* malformed JSON */ }
  if (!data) return json(400, {code: 'VALIDATION_ERROR'});
  const ip = request.headers.get('CF-Connecting-IP');
  if (!ip) return json(403, {code: 'VERIFICATION_FAILED'});
  try {
    if (!await verifyChallenge(env, data.challengeToken, ip)) return json(403, {code: 'VERIFICATION_FAILED'});
    if (!await rateLimit(env, ip)) return json(429, {code: 'RATE_LIMITED'}, {'Retry-After': '600'});
    const response = await fetch('https://api.resend.com/emails/batch', {
      method: 'POST',
      headers: {'Authorization': `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json',
        'Idempotency-Key': `blackstar-contact/${data.submissionId}`},
      body: JSON.stringify(messages(data))
    });
    if (!response.ok) return json(502, {code: 'DELIVERY_UNAVAILABLE'});
    const result = await response.json();
    if (!Array.isArray(result.data) || result.data.length !== 2 || result.data.some(item => !item.id))
      return json(502, {code: 'DELIVERY_UNAVAILABLE'});
    return json(202, {ok: true});
  } catch {
    return json(503, {code: 'DELIVERY_UNAVAILABLE'});
  }
}
