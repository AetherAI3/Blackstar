'use strict';
(() => {
// A local, deterministic guide: no AI, external requests, or chat data storage.
const guideRoot = document.querySelector('.project-guide');
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
  guideButton('How does a project work?', () => {
    guideResponse.textContent = 'We discuss your goal, agree a clear scope, share the work for review, and hand over the approved result. Your proposal sets cost, timing, and revision rounds.';
    guideOptions.replaceChildren(); guideBack.hidden = false;
    guideButton('Explore the process →', () => { window.location.href = guideRoot.dataset.process; });
    guideButton('Help me choose a service →', () => guideHome(true));
    guideOptions.querySelector('button').focus();
  });
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
    const select = document.getElementById('service');
    if (select) {
      select.value = key;
      document.getElementById('message').placeholder = path[2];
      closeGuide(false); window.location.hash = 'contact';
      document.getElementById('name').focus({ preventScroll: true });
    } else window.location.href = guideRoot.dataset.home + '?service=' + encodeURIComponent(key) + '#contact';
  });
  guideOptions.querySelector('button').focus();
}
guideHome(); guideLauncher.hidden = false;
guideLauncher.addEventListener('click', () => {
  if (!guidePanel.hidden) { closeGuide(); return; }
  dismissHint();
  guidePanel.hidden = false; guideLauncher.setAttribute('aria-expanded', 'true');
  document.getElementById('guide-close').focus();
});
document.getElementById('guide-close').addEventListener('click', () => closeGuide());
guideBack.addEventListener('click', () => guideHome(true));
guidePanel.addEventListener('keydown', event => { if (event.key === 'Escape') { event.stopPropagation(); closeGuide(); } });
document.addEventListener('pointerdown', event => {
  if (!guidePanel.hidden && !event.target.closest('.project-guide')) closeGuide(false);
});

// One quiet invitation per tab session; never open the chat without a click.
const guideNudge = document.getElementById('guide-nudge');
const guideBadge = document.getElementById('guide-badge');
let invitationSeen = false;
try { invitationSeen = sessionStorage.getItem('blackstar-guide-seen') === '1'; } catch {}
function dismissHint() {
  invitationSeen = true;
  guideNudge.hidden = true; guideBadge.hidden = true;
  guideLauncher.classList.remove('guide-invitation');
  try { sessionStorage.setItem('blackstar-guide-seen', '1'); } catch {}
}
document.getElementById('guide-dismiss').addEventListener('click', dismissHint);
window.setTimeout(() => {
  if (invitationSeen || !guidePanel.hidden) return;
  invitationSeen = true;
  try { sessionStorage.setItem('blackstar-guide-seen', '1'); } catch {}
  guideNudge.hidden = false; guideBadge.hidden = false;
  guideLauncher.classList.add('guide-invitation');
  window.setTimeout(() => { guideNudge.hidden = true; }, 12000);
}, 6000);

})();
