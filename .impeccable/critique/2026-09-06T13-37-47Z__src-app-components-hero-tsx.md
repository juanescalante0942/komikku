---
target: hero section
total_score: 20
max_score: 32
na_heuristics: 7,10
p0_count: 0
p1_count: 3
timestamp: 2026-09-06T13-37-47Z
slug: src-app-components-hero-tsx
---
Method: dual-agent (A: ses_f89118a45ffepN7WnOqtotYbMb · B: ses_f89103028ffeC8SshlS3pYJO8I)

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 2/4 | Continue Reading silently disappears on unavailable history or fetch failure. |
| 2 | Match System / Real World | 3/4 | Language is plain, but the CTA does not match its browsing destination. |
| 3 | User Control and Freedom | 3/4 | Labeled navigation and search provide exits. |
| 4 | Consistency and Standards | 3/4 | Dark/red system is coherent; carousel and hero conventions differ. |
| 5 | Error Prevention | 2/4 | Personalized content has no expectation-setting or recovery path. |
| 6 | Recognition Rather Than Recall | 3/4 | Navigation and the primary CTA are recognizable. |
| 7 | Flexibility and Efficiency | n/a | Landing surface. |
| 8 | Aesthetic and Minimalist Design | 3/4 | Strong hierarchy, but desktop identity depends heavily on optional artwork. |
| 9 | Error Recovery | 1/4 | Continue Reading suppresses failed and first-run states. |
| 10 | Help and Documentation | n/a | Landing surface. |
| Total | | 20/32 | Acceptable (63%) |

## Design Specificity Verdict

Komikku's dark palette, restrained red, manga collage, and curated picks supply reader context, but the hero itself is category-interchangeable. Its welcome copy and library CTA do not demonstrate a specific Komikku advantage.

Deterministic scan: 0 findings in Hero and ContinueReading. Browser/overlay inspection was skipped because browser automation is unavailable.

## Overall Impression

The hero is well ordered but does not put a manga desire in motion. The biggest opportunity is replacing the generic first action with a concrete, product-specific reading path and retaining a visual anchor on mobile.

## What's Working

- Clear scale from headline to lead to primary action.
- Desktop art and copy have independent space rather than competing.
- Labeled mobile navigation supports recognition.

## Priority Issues

### [P1] The hero does not demonstrate Komikku's distinctive value

Welcome, discover, and start reading could belong to any manga catalog. Make the hero's first action concrete: resume a chapter, open the first editorial pick, or start a named discovery route. Suggested command: `/impeccable shape`.

### [P1] Mobile loses the hero's visual identity

The hero artwork is hidden below lg, leaving text, a CTA, and faint color. Introduce a compact mobile crop or featured story module. Suggested command: `/impeccable adapt`.

### [P1] Continue Reading has no first-run or recovery state

The section returns null for empty history and fetch errors, leaving no orientation or recovery. Provide a purposeful first-run bridge and an explicit retry state. Suggested command: `/impeccable onboard`.

### [P2] Hero artwork motion ignores reduced-motion preferences

The 1.5-second infinite loop has no reduced-motion path. Use a one-time entrance or disable the loop under reduced motion. Suggested command: `/impeccable animate`.

### [P2] The CTA's destination is vague

Start Reading Now routes to the library, a browsing page. Rename it to match or route it to a concrete reading experience. Suggested command: `/impeccable clarify`.

## Persona Red Flags

### Jordan, first-timer

The CTA does not tell them whether it opens a chapter, recommendation, or catalog. Missing history means Continue Reading disappears without guidance.

### Casey, distracted mobile user

The mobile hero drops its only visual anchor. The first action remains above the fold but does not offer a compact, obvious story choice.

### Sam, accessibility-dependent user

Hero motion has no reduced-motion adaptation. Decorative image alt text is not informative.

## Minor Observations

- The hero claims clean, fast, and intuitive without visible proof.
- Dev's Top Picks carries a more distinctive human voice than the opening.
- The global background collage is too subdued to carry personality.

## Questions

1. Should the hero point new visitors to the first editorial pick or a genre route?
2. What should appear where Continue Reading would be for a first-time visitor?
