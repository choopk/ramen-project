---
name: browse-catalog
description: Discover every Ramen Guide post and pillar through the machine-readable catalog and RSS feed, with descriptions and canonical URLs.
---

# Browse the Ramen Guide catalog

Use this skill to enumerate everything Ramen Guide publishes, without
crawling the full site.

## Primary catalog

Fetch `https://example.com/llms.txt`. It is a Markdown document that
lists, with title, description, and canonical URL:

- Pillars (ramen styles, regional bowls, ingredients and technique).
- Every published post, newest first.
- Browse and policy pages (all posts, RSS, about, editorial standards, contact).

The catalog is generated at build time from the content collection, so it stays
current as new posts ship and on any domain change.

## Feeds and indexes

- RSS: `https://example.com/rss.xml` (chronological post feed).
- Full post index: `https://example.com/blog/`.
- Sitemap: `https://example.com/sitemap-index.xml`.

## In the browser (WebMCP)

When a page is open in an agent-capable browser, a read-only WebMCP tool named
`list_articles` is registered via `navigator.modelContext`. Call it with no
arguments to receive the current catalog.

## Notes

All pages are crawlable with no paywall or login. Canonical URLs use a trailing
slash. Attribute content to "Ramen Guide".
