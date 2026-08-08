// Adaptive per-letter text colour engine, ported from the design prototype
// (Loophole Light v9). Every letter samples the fixed background photo
// beneath itself and picks a colour that reads against it. The numeric
// values (0.44 luminance threshold, 20% veil, contrast floor 3.8 + spread
// * 2.2, sample offsets) are tuned — do not change them casually.
//
// Requirements: the background image must be same-origin (or CORS-enabled),
// because it is read into a canvas. If getImageData throws, the engine
// bails out silently and static colours remain.

const SEL =
  '#lh-content h1, #lh-content h2, #lh-content h3, #lh-content p, #lh-content .t, ' +
  '#lh-content span, #lh-content a, ' +
  '#top h1, #top p, #top a, #top a span, #top a div, #top a div span';

export function initAdapt() {
  const api = { refresh: () => {} };
  const bgEl = document.querySelector('#top img');
  if (!bgEl) return api;

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.src = bgEl.currentSrc || bgEl.src;
  img.onload = () => {
    const W = 640;
    const H = Math.round(640 * img.naturalHeight / img.naturalWidth);
    const c = document.createElement('canvas');
    c.width = W;
    c.height = H;
    const ctx = c.getContext('2d');
    ctx.drawImage(img, 0, 0, W, H);
    let data;
    try {
      data = ctx.getImageData(0, 0, W, H).data;
    } catch (e) {
      return; // CORS-restricted image: leave static colours in place
    }

    function rel(r, g, b) {
      const ch = (v) => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4));
      return 0.2126 * ch(r) + 0.7152 * ch(g) + 0.0722 * ch(b);
    }

    function hsl2rgb(h, s, l) {
      if (s === 0) return [l, l, l];
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      function hk(t) {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1 / 6) return p + (q - p) * 6 * t;
        if (t < 1 / 2) return q;
        if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
        return p;
      }
      return [hk(h + 1 / 3), hk(h), hk(h - 1 / 3)];
    }

    // Complementary hue, boosted saturation, lightness pushed until the
    // WCAG contrast ratio clears 3.8 + spread * 2.2.
    function contrastColor(r, g, b, spread) {
      const rn = r / 255, gn = g / 255, bn = b / 255;
      const mx = Math.max(rn, gn, bn), mn = Math.min(rn, gn, bn);
      const l = (mx + mn) / 2;
      let hue = 0, s = 0;
      if (mx !== mn) {
        const d = mx - mn;
        s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
        if (mx === rn) hue = (gn - bn) / d + (gn < bn ? 6 : 0);
        else if (mx === gn) hue = (bn - rn) / d + 2;
        else hue = (rn - gn) / d + 4;
        hue *= 60;
      }
      const outH = (hue + 180) % 360;
      const outS = Math.min(1, Math.max(0.45, s * 1.7));
      const bgL = rel(rn, gn, bn);
      function pick(L) {
        const cc = hsl2rgb(outH / 360, outS, L);
        const fg = rel(cc[0], cc[1], cc[2]);
        const hi = Math.max(fg, bgL), lo = Math.min(fg, bgL);
        return { L, ratio: (hi + 0.05) / (lo + 0.05) };
      }
      const luma = 0.299 * rn + 0.587 * gn + 0.114 * bn;
      const sp = spread || 0;
      const dark = pick(0.24 - sp * 0.16);
      const light = pick(0.84 + sp * 0.12);
      let best = luma > 0.44 ? dark : light;
      const other = best === dark ? light : dark;
      if (best.ratio < 3 && other.ratio > best.ratio) best = other;
      const dir = best.L < 0.5 ? -1 : 1;
      let L = best.L;
      while (best.ratio < 3.8 + sp * 2.2 && L > 0.04 && L < 0.97) {
        L = Math.max(0.04, Math.min(0.97, L + dir * 0.04));
        const cand = pick(L);
        if (cand.ratio <= best.ratio) break;
        best = cand;
      }
      return 'hsl(' + Math.round(outH) + ',' + Math.round(outS * 100) + '%,' + Math.round(best.L * 100) + '%)';
    }

    // Wrap every character of the selected elements in a span. Words are
    // grouped in nowrap wrappers so lines break between words. Guarded
    // against re-splitting already-split text.
    function wrap() {
      document.querySelectorAll(SEL).forEach((el) => {
        if (el.closest('.noblend') || el.hasAttribute('data-wrapped') || el.closest('[data-wrapped]') || el.hasAttribute('data-ch')) return;
        const kids = Array.prototype.slice.call(el.childNodes);
        let touched = false;
        kids.forEach((n) => {
          if (n.nodeType !== 3 || !n.nodeValue.trim()) return;
          const frag = document.createDocumentFragment();
          n.nodeValue.split(/(\s+)/).forEach((part) => {
            if (!part) return;
            if (/^\s+$/.test(part)) {
              frag.appendChild(document.createTextNode(part));
              return;
            }
            const w = document.createElement('span');
            w.setAttribute('data-w', '1');
            w.style.whiteSpace = 'nowrap';
            part.split('').forEach((chr) => {
              const s = document.createElement('span');
              s.setAttribute('data-ch', '1');
              if (!reducedMotion) s.style.transition = 'color 200ms ease';
              s.style.display = 'inline-block';
              s.textContent = chr;
              w.appendChild(s);
            });
            frag.appendChild(w);
          });
          el.replaceChild(frag, n);
          touched = true;
        });
        if (touched) {
          el.setAttribute('data-wrapped', '1');
          if (!el.hasAttribute('aria-label')) el.setAttribute('aria-label', el.textContent.trim());
          el.querySelectorAll('[data-ch]').forEach((s) => s.setAttribute('aria-hidden', 'true'));
        }
      });
    }

    // Cache document-space positions once; never call getBoundingClientRect
    // during scroll.
    const live = new Set();
    let cacheOK = false;
    function measureAll() {
      const sx = window.scrollX, sy = window.scrollY;
      document.querySelectorAll('[data-ch]').forEach((s) => {
        const r = s.getBoundingClientRect();
        if (r.width === 0) { s._m = null; return; }
        s._m = { x: r.left + sx, y: r.top + sy, w: r.width, h: r.height };
      });
      cacheOK = true;
    }

    // Track visibility per text block, not per letter.
    const vio = new IntersectionObserver((entries) => {
      entries.forEach((e) => (e.isIntersecting ? live.add(e.target) : live.delete(e.target)));
      onAdapt();
    }, { rootMargin: '80px 0px' });

    function observeBlocks() {
      document.querySelectorAll(SEL).forEach((el) => {
        if (el.closest('.noblend') || el.hasAttribute('data-obs') || el.hasAttribute('data-w') || el.hasAttribute('data-ch') || el.closest('[data-w]') || !el.querySelector('[data-ch]')) return;
        el.setAttribute('data-obs', '1');
        el._chars = el.querySelectorAll('[data-ch]');
        vio.observe(el);
      });
    }

    let ticking = false;
    function apply() {
      ticking = false;
      if (document.hidden) return;
      if (!cacheOK) measureAll();
      const vh = window.innerHeight, vw = window.innerWidth;
      const sx = window.scrollX, sy = window.scrollY;
      const sc = Math.max(vw / W, vh / H);
      const ox = (vw - W * sc) / 2, oy = (vh - H * sc) / 2;
      const V = 0.2; // the 20% veil: blend samples toward paper before choosing
      const acc = [0, 0, 0];
      function tap(vx, vy) {
        let ix = ((vx - ox) / sc) | 0, iy = ((vy - oy) / sc) | 0;
        if (ix < 0) ix = 0; else if (ix > W - 1) ix = W - 1;
        if (iy < 0) iy = 0; else if (iy > H - 1) iy = H - 1;
        const i = (iy * W + ix) << 2;
        const r = data[i], g = data[i + 1], b = data[i + 2];
        acc[0] += r; acc[1] += g; acc[2] += b;
        return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
      }
      live.forEach((block) => {
        const chars = block._chars;
        if (!chars) return;
        for (let i = 0; i < chars.length; i++) {
          const el = chars[i];
          const m = el._m;
          if (!m) continue;
          const L = m.x - sx, T = m.y - sy;
          if (T + m.h < -40 || T > vh + 40) continue;
          acc[0] = acc[1] = acc[2] = 0;
          // 4 samples, biased upward so they land on the glyph
          const y1 = T + m.h * 0.2, y2 = T + m.h * 0.44;
          const x1 = L + m.w * 0.25, x2 = L + m.w * 0.75;
          let lo = 1, hi = 0, lum;
          lum = tap(x1, y1); if (lum < lo) lo = lum; if (lum > hi) hi = lum;
          lum = tap(x2, y1); if (lum < lo) lo = lum; if (lum > hi) hi = lum;
          lum = tap(x1, y2); if (lum < lo) lo = lum; if (lum > hi) hi = lum;
          lum = tap(x2, y2); if (lum < lo) lo = lum; if (lum > hi) hi = lum;
          const next = contrastColor(
            acc[0] / 4 * (1 - V) + 246 * V,
            acc[1] / 4 * (1 - V) + 245 * V,
            acc[2] / 4 * (1 - V) + 241 * V,
            (hi - lo) * (1 - V)
          );
          if (el._c !== next) {
            el._c = next;
            el.style.color = next;
          }
        }
      });
    }

    function onAdapt() {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(apply);
      }
    }

    wrap();
    observeBlocks();
    measureAll();
    window.addEventListener('scroll', onAdapt, { passive: true });
    window.addEventListener('resize', () => { cacheOK = false; onAdapt(); });
    document.addEventListener('visibilitychange', () => { if (!document.hidden) onAdapt(); });
    apply();

    // Layout changed (e.g. past-shows toggle): re-measure and repaint.
    api.refresh = () => { cacheOK = false; onAdapt(); };
  };

  return api;
}
