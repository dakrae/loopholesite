import { defineConfig } from 'astro/config';

export default defineConfig({
  // The live address of the site. Canonical links, the sitemap and the
  // structured data are all built from this, so it has to match whichever
  // form you make primary in Netlify — with or without www.
  site: 'https://loophole.ch',
});
