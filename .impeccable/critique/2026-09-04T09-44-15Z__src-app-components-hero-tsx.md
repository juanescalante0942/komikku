---
target: homepage
total_score: 19
max_score: 32
na_heuristics: 7,10
p0_count: 0
p1_count: 3
timestamp: 2026-09-04T09-44-15Z
slug: src-app-components-hero-tsx
---
Method: dual-agent (A: ses_f94342607ffeDTTjTcSkZdHbfS · B: ses_f9432f3fdffePmSbXHCVU6hgxL)

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 2/4 | Updates turns request failures into an empty state. |
| 2 | Match System / Real World | 3/4 | Manga vocabulary is clear; MangaAI is unexplained. |
| 3 | User Control and Freedom | 2/4 | Search overlay lacks a complete keyboard dismissal flow. |
| 4 | Consistency and Standards | 3/4 | Shared visual patterns are cohesive. |
| 5 | Error Prevention | 2/4 | Network failure handling is uneven between collections. |
| 6 | Recognition Rather Than Recall | 3/4 | Navigation and search are discoverable. |
| 7 | Flexibility and Efficiency | n/a | Landing surface. |
| 8 | Aesthetic and Minimalist Design | 2/4 | Hero detail and repeated shelves dilute the reading action. |
| 9 | Error Recovery | 2/4 | Updates does not explain or recover from its failure state. |
| 10 | Help and Documentation | n/a | Landing surface. |
| Total | | 19/32 | Acceptable (59%) |

## Design Specificity Verdict

The black, off-white, and Komikku-red system is coherent and curated manga imagery supplies genre context. The information architecture remains category-standard: welcome hero followed by latest, picks, popular, and new rails. MangaAI, favorites, and progress are asserted rather than made tangible.

Deterministic scan: 0 findings in Hero, Updates, and MangaShelf markup. Browser inspection was skipped because browser automation is unavailable in this harness.

## Overall Impression

The surface is competent and cohesive but reads as inventory before it reads as a distinct Komikku landing experience. The biggest opportunity is a focused first decision and one differentiated discovery route rather than four equivalent collections.

## What's Working

- The hero makes the core reading action explicit and supports it with a credible no-sign-up promise.
- The palette, cover treatment, type scale, and motion vocabulary are consistent.
- MangaShelf has clear loading, empty, and error states.

## Priority Issues

### [P1] The hero dilutes its conversion goal

The reading CTA shares the opening with a fully weighted donation action and explanatory detail. This splits a first-time visitor's attention before they experience the product. Keep one dominant reading action and move support below demonstrated value. Suggested command: `/impeccable distill`.

### [P1] Discovery is broad but not guided

The page presents updates, picks, popular, and new with a large number of equally clickable titles but no answer to what a visitor should read first. Give every collection a distinct job and make one confident entry point the priority. Suggested command: `/impeccable shape`.

### [P1] Updates hides retrieval failures as an empty feed

Updates logs request errors but renders the same empty message whether there are no chapters or the API failed. Users cannot tell what happened or recover. Add a distinct error state with retry. Suggested command: `/impeccable harden`.

### [P2] The carousel's motion and controls reduce agency

The carousel auto-advances and its arrow buttons are not named. It can interrupt scanning and is inaccessible to assistive technology. This issue is constrained by the current requirement to leave Carousel.tsx unchanged. Suggested command: `/impeccable harden` when that constraint is lifted.

### [P2] Mobile loses the hero's strongest visual anchor

The illustration disappears below the lg breakpoint, leaving mobile with a long copy-and-buttons introduction. Use a compact compositional equivalent rather than removing the visual entirely. Suggested command: `/impeccable adapt`.

## Persona Red Flags

### Jordan, first-timer

MangaAI is promised but never demonstrated. The initial reading versus donation decision then several equally named collections do not provide a confident starting point.

### Casey, distracted mobile user

The bottom navigation helps thumb reach, but the long hero and dense two-column cover grids ask for more scanning than a quick return to reading supports. Carousel auto-advance is interruption-hostile.

### Riley, stress tester

An Updates API failure appears identical to an empty feed, concealing the real failure mode.

## Minor Observations

- Infinite hero art motion has no reduced-motion treatment.
- Hero buttons omit explicit `type="button"`.
- Desktop header and floating navigation compete for the same visual band.
- The background image at 5% opacity does not materially contribute to the page.

## Questions to Consider

1. Should Komikku make one specific recommendation the hero's proof point instead of describing MangaAI in prose?
2. If a visitor only reaches one collection, should it be a generic popular shelf or a more editorial, recognizable Komikku choice?
