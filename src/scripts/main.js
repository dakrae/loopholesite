import { initAdapt } from './adapt.js';
import { initNav } from './nav.js';

initNav();

const adapt = initAdapt();

// Past shows: visible by default, toggled client-side.
const btn = document.querySelector('#lh-past-toggle');
const past = document.querySelector('#lh-past');
if (btn && past) {
  btn.addEventListener('click', () => {
    const hide = !past.hidden;
    past.hidden = hide;
    btn.textContent = hide ? 'Show past shows' : 'Hide past shows';
    adapt.refresh();
  });
}
