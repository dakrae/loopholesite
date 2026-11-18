// The page is statically built, so which gigs count as upcoming is decided
// when Netlify builds, not when someone visits. Without this, a show stays
// in the upcoming list until the next deploy. Re-check it in the visitor's
// browser so a gig files itself away the day after it happened.

export function initShows() {
  const upcoming = document.querySelector('[data-upcoming]');
  const past = document.querySelector('#lh-past');
  if (!upcoming || !past) return;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Upcoming runs soonest-first and past runs most-recent-first, so
  // prepending each row as we walk forward keeps the past list in order.
  upcoming.querySelectorAll('.gig-row[data-date]').forEach((row) => {
    if (new Date(`${row.dataset.date}T00:00:00`) >= today) return;
    // Past rows carry no ticket column — the grid has no room for one.
    row.querySelector('.gig-ticket')?.remove();
    past.prepend(row);
  });

  const left = upcoming.querySelectorAll('.gig-row');

  const empty = document.querySelector('[data-no-shows]');
  if (empty) empty.hidden = left.length > 0;

  updateHeroLine(left[0]);
}

// The hero announces the next show. If that one has just passed, it has to
// name the one after it — or drop the announcement and keep only the link to
// the dates when the calendar has run out.
function updateHeroLine(row) {
  const line = document.querySelector('.hero-next-line');
  if (!line) return;

  if (!row) {
    line.hidden = true;
    return;
  }

  const read = (sel) => row.querySelector(sel)?.textContent.trim() ?? '';
  const when = line.querySelector('.hero-next-when');
  const where = line.querySelector('.hero-next-where');
  if (when) when.textContent = `Next show — ${read('.gig-date')}`;
  if (where) where.textContent = `${read('.gig-venue')} · ${read('.gig-city')}`;
}
