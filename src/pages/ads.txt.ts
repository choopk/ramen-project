import { SITE } from '../consts';

// Rendered at /ads.txt. AdSense authorized-seller declaration, derived from the single
// publisher ID in consts.ts so it never drifts. ads.txt is NOT required for AdSense review
// (only for serving ads once approved), so until SITE.adsensePublisherId is set this serves
// an empty file, which correctly declares "no authorized sellers yet". SITE.adsensePublisherId
// stores the loader form `ca-pub-...`; the ads.txt line wants the `pub-...` form, so strip `ca-`.
export function GET() {
  const pub = SITE.adsensePublisherId.replace(/^ca-/, '');
  const body = pub ? `google.com, ${pub}, DIRECT, f08c47fec0942fa0\n` : '';
  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
