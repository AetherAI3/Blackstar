'use strict';
(() => {
  // Loading and every event are gated by an affirmative local preference.
  if (location.hostname !== 'blackstarentertainment.org') return;
  const storageKey = 'blackstar-analytics-consent-v1';
  const services = new Set(['web', 'brand', 'video', 'social', 'automation', 'marketing', 'multiple']);
  const sources = new Set(['hero', 'services', 'navigation', 'guide', 'footer', 'direct']);
  const categories = new Set(['validation', 'verification', 'rate_limit', 'provider_unavailable', 'unexpected']);
  const events = new Set(['$pageview', 'service_selected', 'contact_started', 'inquiry_accepted', 'inquiry_failed', 'inquiry_status_unknown']);
  const route = location.pathname.replace(/index\.html$/, '') || '/';
  let consent = null;
  let token = null;
  let sdkStarted = false;
  let pageviewSent = false;
  let panel;
  try { consent = localStorage.getItem(storageKey); } catch { /* A disabled store means no prior consent. */ }

  function safeProperties(event, props = {}) {
    const clean = {route};
    if (event === '$pageview') {
      clean.environment = 'production';
      // Referrer domain only. Never send its path, query, or fragment.
      try { if (document.referrer) clean.referrer_domain = new URL(document.referrer).hostname; } catch {}
    }
    if (['service_selected', 'contact_started', 'inquiry_accepted'].includes(event)) {
      clean.service = services.has(props.service) ? props.service : 'unspecified';
    }
    if (['service_selected', 'contact_started'].includes(event)) clean.source = sources.has(props.source) ? props.source : 'direct';
    if (event === 'inquiry_failed') clean.error_category = categories.has(props.error_category) ? props.error_category : 'unexpected';
    return clean;
  }

  function sanitize(event) {
    if (!events.has(event.event)) return null;
    const custom = safeProperties(event.event, event.properties);
    // Only bounded device data from SDK enrichment is allowed through.
    for (const key of ['$browser', '$os', '$device_type', '$screen_height', '$screen_width', '$session_id', '$device_id', '$insert_id']) {
      const value = event.properties?.[key];
      if ((typeof value === 'string' && value.length <= 100) || (typeof value === 'number' && Number.isFinite(value))) custom[key] = value;
    }
    event.properties = custom;
    delete event.$set;
    delete event.$set_once;
    return event;
  }

  function track(event, props) {
    if (consent !== 'accepted' || !sdkStarted || !events.has(event)) return;
    try { window.posthog?.capture(event, safeProperties(event, props)); } catch { /* Analytics is optional. */ }
  }

  function loadSdk() {
    if (sdkStarted || consent !== 'accepted' || !token) return;
    sdkStarted = true;
    // PostHog's documented browser snippet, installed only after consent.
    !function(t,e){var o,n,p,r;e.__SV||(window.posthog=e,e._i=[],e.init=function(i,s,a){function g(t,e){var o=e.split('.');2==o.length&&(t=t[o[0]],e=o[1]),t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}}(p=t.createElement('script')).type='text/javascript',p.crossOrigin='anonymous',p.async=!0,p.src=s.api_host.replace('.i.posthog.com','-assets.i.posthog.com')+'/static/array.js',(r=t.getElementsByTagName('script')[0]).parentNode.insertBefore(p,r);var u=e;for(void 0!==a?u=e[a]=[]:a='posthog',u.people=u.people||[],Object.defineProperty(u,'toString',{configurable:!0,enumerable:!0,writable:!0,value:function(t){var e='posthog';return'posthog'!==a&&(e+='.'+a),t||(e+=' (stub)'),e}}),Object.defineProperty(u.people,'toString',{configurable:!0,enumerable:!0,writable:!0,value:function(){return u.toString(1)+'.people (stub)'}}),o='init capture opt_in_capturing opt_out_capturing'.split(' '),n=0;n<o.length;n++)g(u,o[n]);e._i.push([i,s,a])},e.__SV=1)}(document,window.posthog||[]);
    try {
      window.posthog.init(token, {
        api_host: 'https://us.i.posthog.com', defaults: '2026-05-30',
        autocapture: false, capture_pageview: false, capture_pageleave: false,
        disable_session_recording: true, disable_surveys: true, capture_exceptions: false,
        capture_heatmaps: false, capture_dead_clicks: false, person_profiles: 'never',
        respect_dnt: true, before_send: sanitize
      });
      if (!pageviewSent) { pageviewSent = true; track('$pageview'); }
    } catch { sdkStarted = false; }
  }

  function choose(value) {
    consent = value;
    try { localStorage.setItem(storageKey, value); } catch {}
    if (panel) panel.hidden = true;
    if (value === 'accepted') {
      if (sdkStarted) { try { window.posthog?.opt_in_capturing(); } catch {} }
      else loadSdk();
    }
    else if (sdkStarted) {
      try { window.posthog?.opt_out_capturing(); } catch {}
    }
  }

  function showPanel() {
    if (!panel) {
      panel = document.createElement('aside');
      panel.className = 'analytics-consent';
      panel.setAttribute('aria-label', 'Analytics choice');
      const message = document.createElement('p');
      message.textContent = 'May we use optional, anonymous website analytics to improve our services and contact experience? We do not record form details or sessions.';
      const actions = document.createElement('div');
      for (const [label, value] of [['Allow analytics', 'accepted'], ['No thanks', 'declined']]) {
        const button = document.createElement('button');
        button.type = 'button';
        button.textContent = label;
        button.className = value === 'accepted' ? 'btn btn-gold' : 'btn';
        button.addEventListener('click', () => choose(value));
        actions.append(button);
      }
      panel.append(message, actions);
      document.body.append(panel);
    }
    panel.hidden = false;
  }

  window.BlackStarAnalytics = Object.freeze({track});
  document.addEventListener('click', event => {
    const link = event.target.closest?.('a[href]');
    if (!link) return;
    let destination;
    try { destination = new URL(link.href); } catch { return; }
    if (destination.hostname !== location.hostname) return;
    const source = link.closest('.site-header') ? 'navigation' : link.closest('.service-card') ? 'services' :
      link.closest('.detail-hero, #hero') ? 'hero' : link.closest('#footer') ? 'footer' : 'direct';
    if (destination.hash === '#contact' || destination.searchParams.has('service')) window.BlackStarContactSource = source;
    const pathService = destination.pathname.match(/\/services\/([^/]+)\/?$/)?.[1];
    const slugs = {'websites-and-apps': 'web', 'brand-and-design': 'brand', 'photography-and-video': 'video',
      'social-content': 'social', 'ai-and-automation': 'automation', 'marketing-and-launches': 'marketing'};
    const service = link.dataset.service || destination.searchParams.get('service') || slugs[pathService];
    if (services.has(service)) track('service_selected', {service, source});
  });
  document.addEventListener('DOMContentLoaded', () => {
    fetch('/api/analytics-config', {signal: AbortSignal.timeout(5000)})
      .then(response => response.ok ? response.json() : null)
      .then(config => {
        if (!config?.enabled || typeof config.token !== 'string' || !/^phc_[A-Za-z0-9]+$/.test(config.token)) return;
        token = config.token;
        const footer = document.querySelector('.footer-bottom');
        if (footer) {
          const button = document.createElement('button');
          button.type = 'button';
          button.className = 'analytics-preferences';
          button.textContent = 'Analytics preferences';
          button.addEventListener('click', showPanel);
          footer.insertBefore(button, footer.lastElementChild);
        }
        if (consent === 'accepted') loadSdk();
        else if (consent !== 'declined') showPanel();
      }).catch(() => { /* No analytics if configuration is unavailable. */ });
  });
})();
