// Burger menu for narrow screens. The markup carries the full menu on every
// screen size; CSS decides whether it is a row in the header or a panel
// behind the toggle, and this only manages the open/closed state.

const DESKTOP = '(min-width: 821px)';

export function initNav() {
  const toggle = document.querySelector('[data-nav-toggle]');
  const menu = toggle && document.getElementById(toggle.getAttribute('aria-controls'));
  if (!toggle || !menu) return;

  const desktop = window.matchMedia(DESKTOP);

  const isOpen = () => toggle.getAttribute('aria-expanded') === 'true';

  function setOpen(open) {
    toggle.setAttribute('aria-expanded', String(open));
    menu.toggleAttribute('data-open', open);
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  }

  function close({ refocus = false } = {}) {
    if (!isOpen()) return;
    setOpen(false);
    if (refocus) toggle.focus();
  }

  toggle.addEventListener('click', () => setOpen(!isOpen()));

  // Jumping to a section should leave the menu out of the way.
  menu.addEventListener('click', (e) => {
    if (e.target.closest('a')) close();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') close({ refocus: true });
  });

  document.addEventListener('click', (e) => {
    if (isOpen() && !menu.contains(e.target) && !toggle.contains(e.target)) close();
  });

  // Widening past the breakpoint hands the menu back to the header row, so
  // any open state has to be cleared with it.
  desktop.addEventListener('change', (e) => {
    if (e.matches) close();
  });
}
