import { h } from '../lib/dom.js';
import { skills, skillLevels } from '../config.js';
import { emptyState, pageHeader, sampleNotice } from '../components/ui.js';

export async function skillsView() {
  const groups = skills.filter((g) => g.items.length > 0);
  const hasSample = groups.some((g) => g.sample);

  const node = h('div', { class: 'page' },
    h('div', { class: 'container listing' },
      pageHeader({
        title: 'Skills',
        lead: 'What I work with, described plainly: where I am still learning and where I have shipped something.',
      }),
      hasSample ? sampleNotice('These skills are sample entries. Replace them in data/skills.js with your own.') : null,
      groups.length
        ? h('div', null,
          h('dl', { class: 'legend mt-5' },
            skillLevels.flatMap((l) => [h('dt', null, l.level), h('dd', null, l.meaning)])),
          groups.map((group, index) => h('section', { class: 'skill-group', 'aria-labelledby': `skills-${index}` },
            h('h2', { id: `skills-${index}` }, group.group),
            group.description ? h('p', null, group.description) : null,
            h('ul', { class: 'skill-list' }, group.items.map((item) => h('li', { class: 'skill' },
              h('span', { class: 'skill__name' }, item.name),
              h('span', { class: 'skill__level' }, item.level || ''),
              h('span', { class: 'skill__note' }, item.note || '')))))))
        : emptyState({ title: 'No skills listed yet', text: 'Skills will appear here once they are added to data/skills.js.' })));

  return { title: 'Skills', description: 'Programming languages, engineering software, laboratory skills and more, with honest levels.', node };
}
