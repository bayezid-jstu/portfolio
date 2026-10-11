import { h, announce } from '../lib/dom.js';
import { icon, hasIcon } from '../lib/icons.js';
import { isConfigured } from '../lib/format.js';
import { copyText } from '../lib/clipboard.js';
import { profile } from '../config.js';
import { buttonLink, pageHeader } from '../components/ui.js';

const MAX_MAILTO = 1800;

function field(id, label, control, hint) {
  return h('div', { class: 'field' },
    h('label', { for: id }, label),
    control,
    hint ? h('span', { class: 'field-hint' }, hint) : null);
}

function buildForm() {
  const hasEndpoint = isConfigured(profile.formAction);
  const hasEmail = isConfigured(profile.email);
  if (!hasEndpoint && !hasEmail) return null;

  const status = h('p', { class: 'form-status', role: 'status', 'aria-live': 'polite' });

  const form = h('form', {
    class: 'contact-form',
    ...(hasEndpoint ? { action: profile.formAction, method: 'POST' } : {}),
    novalidate: false,
  },
  field('contact-name', 'Your name', h('input', { class: 'input', id: 'contact-name', name: 'name', type: 'text', autocomplete: 'name', required: true })),
  field('contact-email', 'Your email', h('input', { class: 'input', id: 'contact-email', name: 'email', type: 'email', autocomplete: 'email', inputmode: 'email', required: hasEndpoint }),
    hasEndpoint ? 'So I can reply to you.' : 'Optional. Your email app will use your own address when it opens.'),
  field('contact-subject', 'Subject', h('input', { class: 'input', id: 'contact-subject', name: 'subject', type: 'text', autocomplete: 'off', required: true })),
  field('contact-message', 'Message', h('textarea', { class: 'textarea', id: 'contact-message', name: 'message', required: true, rows: 6 })),
  h('div', { class: 'btn-row' }, h('button', { type: 'submit', class: 'btn' }, icon('mail', { size: 18 }), hasEndpoint ? 'Send message' : 'Open in my email app')),
  status);

  if (!hasEndpoint) {
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const data = new FormData(form);
      const from = String(data.get('name') || '').trim();
      const replyTo = String(data.get('email') || '').trim();
      const body = `${data.get('message')}\n\n${from}${replyTo ? ` (${replyTo})` : ''}`;
      const url = `mailto:${profile.email}?subject=${encodeURIComponent(String(data.get('subject')))}&body=${encodeURIComponent(body)}`;
      if (url.length > MAX_MAILTO) {
        status.textContent = 'That message is too long for an email link. Please shorten it, or write to me directly.';
        announce(status.textContent);
        return;
      }
      status.textContent = 'Your email app should open with the message ready to send. If nothing happens, copy my email address and write to me directly.';
      window.location.href = url;
    });
  }
  return form;
}

export async function contactView() {
  const hasEmail = isConfigured(profile.email);
  const links = profile.links.filter((l) => isConfigured(l.url));
  const form = buildForm();

  const copyStatus = h('span', { class: 'sr-only', 'aria-live': 'polite' });

  const reachCard = h('section', { class: 'contact-card', 'aria-labelledby': 'reach-title' },
    h('h2', { id: 'reach-title' }, 'Find me online'),
    hasEmail || links.length
      ? h('div', null,
        hasEmail
          ? h('div', { class: 'btn-row' },
            buttonLink({ href: `mailto:${profile.email}`, label: profile.email, iconName: 'mail', variant: 'secondary' }),
            h('button', {
              type: 'button',
              class: 'btn btn--quiet',
              onclick: async () => {
                const ok = await copyText(profile.email);
                copyStatus.textContent = ok ? 'Email address copied' : 'Could not copy automatically';
              },
            }, icon('copy', { size: 18 }), 'Copy address'))
          : null,
        copyStatus,
        links.length
          ? h('ul', { class: 'link-list mt-4', 'aria-label': 'Professional links' }, links.map((l) => h('li', null,
            h('a', { href: l.url, target: '_blank', rel: 'noopener noreferrer' },
              icon(hasIcon(l.icon) ? l.icon : 'link', { size: 18 }), l.label,
              h('span', { class: 'sr-only' }, ' (opens in a new tab)')))))
          : null)
      : h('p', { class: 'muted' }, 'Contact details have not been added to this site yet. Please check back soon.'));

  const formCard = form
    ? h('section', { class: 'contact-card', 'aria-labelledby': 'form-title' },
      h('h2', { id: 'form-title' }, 'Send a message'),
      isConfigured(profile.formAction)
        ? h('p', { class: 'muted' }, 'Messages are delivered to my inbox through an external form service.')
        : h('p', { class: 'muted' }, 'This form opens your email app with the message filled in. Nothing is sent from this website itself.'),
      form)
    : null;

  const node = h('div', { class: 'page' },
    h('div', { class: 'container listing' },
      pageHeader({ title: 'Contact', lead: 'For internships, research, collaboration or questions about a project.' }),
      h('div', { class: 'contact-grid' }, reachCard, formCard)));

  return { title: 'Contact', description: `Get in touch with ${profile.name}.`, node };
}
