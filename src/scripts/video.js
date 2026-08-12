// Click-to-load video. The page ships a still image and a Play button; the
// YouTube player is only fetched once someone actually asks for it, so the
// page stays light and YouTube gets to set nothing until then.

export function initVideo() {
  document.querySelectorAll('[data-video]').forEach((card) => {
    const facade = card.querySelector('.video-facade');
    if (!facade) return;

    facade.addEventListener('click', () => {
      const frame = document.createElement('iframe');
      const params = new URLSearchParams({ autoplay: '1', rel: '0', playsinline: '1' });
      // nocookie host: no tracking cookie until the video is played.
      frame.src = `https://www.youtube-nocookie.com/embed/${card.dataset.video}?${params}`;
      frame.title = card.dataset.videoTitle || 'Video';
      frame.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
      frame.referrerPolicy = 'strict-origin-when-cross-origin';
      frame.allowFullscreen = true;
      frame.className = 'video-frame';

      card.replaceChildren(frame);
      card.classList.add('is-playing');
      frame.focus({ preventScroll: true });
    });
  });
}
