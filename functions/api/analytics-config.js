// Public browser configuration. The personal PostHog API key must never be bound here.
export function onRequestGet({request, env}) {
  const production = new URL(request.url).hostname === 'blackstarentertainment.org';
  const token = env.POSTHOG_PROJECT_TOKEN;
  const enabled = production && typeof token === 'string' && /^phc_[A-Za-z0-9]+$/.test(token);
  return new Response(JSON.stringify(enabled ? {enabled: true, token} : {enabled: false}), {
    headers: {'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff'}
  });
}
