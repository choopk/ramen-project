export const SITE = {
  // PLACEHOLDER branding — swap title/tagline/description/url/author when the domain is chosen.
  title: 'Ramen Guide',
  tagline: 'Everything about Japanese ramen. Styles, broths, regional bowls, and where to slurp.',
  description:
    'A field guide to Japanese ramen: broth styles, noodles, toppings, regional variations, and the shops that define them. Researched, sourced, no filler.',
  url: 'https://example.com',
  author: 'Ramen Guide',
  locale: 'en',
  // Public contact address shown on Contact / Privacy / Terms pages. Must be a working inbox.
  contactEmail: 'contact@example.com',
  // Governing-law jurisdiction for the Terms / Privacy "governed by the laws of…" clause.
  // Left blank intentionally: policies are written global-neutral (GDPR + CCPA). Fill with a
  // country/state (e.g. 'Singapore') to harden the governing-law clause before legal review.
  jurisdiction: '',
  // Date the trust pages were last reviewed, surfaced as "Last updated" on policy pages.
  lastPolicyUpdate: '2026-07-05',
  // Email newsletter (new-post capture). Pure HTML form, no client JS. To go live:
  // 1. Create a free Kit (ConvertKit) form, set its success redirect to <url>/subscribed/.
  // 2. Paste the form's POST endpoint into `formAction` (Share -> Embed -> HTML).
  // 3. Flip `enabled` to true. Until then SubscribeForm renders nothing.
  newsletter: {
    provider: 'kit',
    formAction: '',
    enabled: false,
  },
  // Paste the GSC verification token here at launch (see README launch checklist).
  googleSiteVerification: '',
  // GA4 Measurement ID. Loaded only on the production domain (see BaseHead.astro);
  // dev and *.pages.dev previews are excluded so analytics data stays clean.
  googleAnalyticsId: '',
  // Microsoft Clarity project ID. Same production-only, live-domain guard as GA.
  microsoftClarityId: '',
  // Google AdSense publisher ID in the loader form 'ca-pub-XXXXXXXXXXXXXXXX'. LEAVE BLANK
  // until you add the site in your AdSense account and are ready to apply: the connection
  // snippet must be live on the production domain BEFORE Google will review the site (it is a
  // pre-review step, not post-approval). When set, BaseHead.astro emits the AdSense loader in
  // production builds and /ads.txt serves the matching `pub-...` authorized-seller line.
  adsensePublisherId: '',
} as const;
