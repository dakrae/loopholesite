// Everything is public, so the only job here is pointing crawlers at the
// sitemap — built from the configured site address so it survives a domain
// change.
export function GET({ site }) {
  const body = [
    'User-agent: *',
    'Allow: /',
    '',
    `Sitemap: ${new URL('/sitemap.xml', site).href}`,
    '',
  ].join('\n');

  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
