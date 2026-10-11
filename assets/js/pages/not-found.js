import { h } from '../lib/dom.js';
import { buttonLink } from '../components/ui.js';

export function notFoundView({
  title = 'Page not found',
  text = 'The page you are looking for does not exist, or it has moved.',
  backHref = '#/',
  backLabel = 'Back to the home page',
} = {}) {
  return {
    title,
    description: text,
    node: h('div', { class: 'page' },
      h('div', { class: 'container' },
        h('section', { class: 'not-found' },
          h('p', { class: 'not-found__code', 'aria-hidden': 'true' }, '404'),
          h('h1', { tabindex: '-1' }, title),
          h('p', null, text),
          h('div', { class: 'btn-row' },
            buttonLink({ href: backHref, label: backLabel, iconName: 'arrow-left' }),
            backHref !== '#/' ? buttonLink({ href: '#/', label: 'Home page', variant: 'quiet' }) : null)))),
  };
}
