# Task queue — the agent takes the FIRST unchecked [ ] item, top to bottom.

# States: [ ] todo · [~] in progress · [x] done · [!] blocked (needs human) · [H] human-only

# Attempts tracked inline: "(attempt 2/3)". At 3 failed attempts → [!], move to Blocked.

# Source of truth for scope/keywords/links: ramen-content-cluster-plan.md

## Queue

- [ ] SMOKE TEST: append a "harness ok" entry to memory/JOURNAL.md and add one real
      lesson about this repo to memory/MEMORY.md. Do NOT touch src/. Mark this [x].
- [ ] Expand live stub src/content/blog/tonkotsu-vs-shoyu-broth-explained.mdx into
      spoke #11 (~1,800 words). Already published — revise in place, set updatedDate.
- [ ] Expand live stub src/content/blog/regional-ramen-across-japan.mdx into
      spoke #8 (~3,000 words). Already published — revise in place, set updatedDate.
- [x] Write spoke #1: Shoyu Ramen guide (kw "shoyu ramen", ~2,000 words, draft: true)
- [x] Write spoke #2: Shio Ramen (kw "shio ramen", ~1,800 words, draft: true)
- [x] Write spoke #5: Ramen Noodles Explained (kw "ramen noodles types", ~2,000 words, draft: true)
- [ ] Write spoke #3: Miso Ramen (kw "miso ramen", ~2,000 words, draft: true)
- [ ] Write spoke #4: Tonkotsu Ramen (kw "tonkotsu ramen", ~2,200 words, draft: true)
- [ ] Write spoke #6: Ramen Toppings (kw "ramen toppings", ~2,000 words, draft: true)
- [ ] Expand hub src/content/blog/guide-to-japanese-ramen-styles.mdx into the pillar
      (4,000+ words, TOC, links to all live spokes). Do this only AFTER the six
      spokes above are written. Already published — revise in place, set updatedDate.
- [ ] Write spoke #7: Tare explainer (kw "what is tare ramen", ~1,500 words, draft: true)
- [ ] Write spoke #9: How to Eat Ramen (kw "how to eat ramen", ~1,500 words, draft: true)
- [ ] Write spoke #10: Tsukemen/Mazesoba/Abura Soba (kw "tsukemen mazesoba aburasoba", ~2,000 words, draft: true)
- [ ] Write spoke #13: Ajitama ramen egg (kw "ramen egg", ~1,500 words, draft: true)
- [ ] Write spoke #14: Chashu (kw "chashu pork", ~1,800 words, draft: true)
- [ ] Write spoke #12: History of Ramen (kw "history of ramen", ~2,000 words, draft: true)
- [ ] Write spoke #15: Ramen vs Pho vs Udon (kw "ramen vs pho", ~1,800 words, draft: true)

## Blocked

(agent moves [!] items here with a one-line reason)

## Human review / publish queue

(agent adds "- [H] review & publish <slug>" here; human flips draft:false)
