# UI layout rules (client-approved — do not change silently)

These layouts were requested by the client and have already had to be restored
once after being changed. They are requirements, not defaults. If you believe a
change improves things, raise it before shipping it.

> Machine-readable copy for AI agents: `.cursor/rules/marketplace-layout.mdc`.

## 1. Offer and category lists: two per row on phones

**Rule:** every offer/product list fits **two cards per row below `sm` (640px)**.
Category preview rows are a 2-column grid on phones and only become a horizontal
swipe row from `sm` upward.

**Why it regressed:** the category previews used a flex row of fixed-width cards
(`min-w-[220px] w-[240px]`, and `min-w-[240px] w-[260px]` on Producer Market).
On a ~360px phone only about one and a half cards fit, so the list read as one
per row that you had to swipe sideways. Nothing in the code said "one per row" —
the fixed card widths caused it, which is why it is easy to reintroduce.

**Where this is enforced:**

| File                                         | Location                                                                              |
| -------------------------------------------- | ------------------------------------------------------------------------------------- |
| `pages/marketplace/AtiStore.tsx`             | collapsed category row                                                                |
| `components/skeletons/OfferCardSkeleton.tsx` | `OfferCardSkeleton` + `OfferRowSkeleton` (`variant="ati"` only — see exception below) |

The skeleton must match the real grid. If it stays one-up while the real list is
two-up, the layout visibly jumps as data loads.

The pattern:

```tsx
<div className="grid grid-cols-2 gap-3 sm:flex sm:gap-5 sm:overflow-x-auto">
  <div className="w-full min-w-0 sm:min-w-[220px] sm:w-[240px] sm:flex-shrink-0">
    …
  </div>
</div>
```

Two things break it: dropping the base `grid-cols-2`, and putting an unprefixed
`min-w-[…]`/`w-[…]` back on a card inside these rows. Prefix fixed widths with
`sm:` so they never apply on phones.

The expanded ("See all") view is already a `grid-cols-2` grid and needs no change.

**Exception — Producer Market (2026-08-03, client-requested reversal):**
`pages/marketplace/ProducerMarket.tsx`'s collapsed category row + Recommended row,
and the `variant="producer"` branch of `OfferCardSkeleton`/`OfferRowSkeleton`, were
deliberately switched to an unconditional horizontal-scroll row (matching the
homepage's carousel), on explicit client instruction to look/behave like the
homepage. This intentionally reintroduces the flex/fixed-width pattern described
above as "why it regressed" — but with the mobile card narrowed to `w-40`
(`min-w-[250px]`) instead of the ~220-260px width that caused the original
regression, so ~2 cards plus a peek of the next stay visible on a ~360px phone
instead of ~1.5. **AtiStore.tsx is unaffected and still follows the 2-per-row
rule above.** If Producer Market's mobile carousel is ever reported as looking
like "one per row" again, the fix is to narrow the card further, not to revert
to a grid — that reversal was intentional and client-approved, don't restore the
grid without re-confirming with the client first.

### Card text has to fit the narrower card

Two per row leaves roughly 150px of usable width, so the card typography must
scale down on phones. Getting the grid right but leaving desktop font sizes in
place is what made the first attempt look broken: the price rendered at
`text-lg` and wrapped `12,321 FCFA (XAF)` onto three lines, and because the
stock column was `shrink-0` it refused to give up any width, so the two columns
visually collided.

- Price: `text-sm` (Producer Market) or `text-base` (ATI Store) on phones,
  `md:text-lg` from desktop. Never `text-lg` at the base width.
- Card footers stack (`flex-col`) below `sm` and only become two columns at
  `sm:flex-row`. Do not mark either column `shrink-0` at the base width.
- Unit and label lines get `min-w-0` + `truncate` so a long unit name cannot
  stretch the layout.

## 2. The chat composer must stay reachable on small screens

`components/SupportChatWidget.tsx` is a fixed-height (`h-[70dvh]`) panel with
`overflow-hidden`, so anything that grows pushes the send button past the bottom
edge where it cannot be scrolled into view.

Three separate guards keep it visible — keep all three:

1. **`flex-1 min-h-0` on the message list.** A flex child defaults to
   `min-height:auto` and refuses to shrink below its content, which clips the
   composer once the messages or banners get long.
2. **The guest form is capped and scrollable** (`max-h-[70%] overflow-y-auto`).
   It is much taller than the plain composer (intro copy, two labelled fields, a
   button) and the intro wraps to more lines in French, so unbounded it pushed
   its own submit button off the panel and squeezed the messages to nothing.
3. **The dragged position is re-clamped when things change size.** The panel is
   draggable and `position: fixed`. Dragging clamps against the widget height at
   drop time only, so afterwards a shorter viewport (rotation, the mobile URL bar
   collapsing, the on-screen keyboard) or a taller widget (a handover banner
   appearing) leaves the bottom below the fold. The effect listens to `resize`,
   `orientationchange`, `visualViewport` resize, and a `ResizeObserver` — the
   observer is the only thing that catches content growth, which fires no
   window event.

---

## 2026-08-10 — AtiStore joins the carousel exception (client request)

The two-per-row phone rule above **no longer applies to `AtiStore.tsx`**. The client
asked for the retail store's category rows to scroll horizontally on mobile, "as in
the marketplace". `AtiStore.tsx` now uses the same unconditional carousel classes as
`ProducerMarket.tsx`:

- row: `flex gap-3 px-1 pb-8 pt-2 overflow-x-auto -mx-1 snap-x snap-mandatory md:gap-6`
- card: `min-w-[250px] w-40 flex-shrink-0 snap-start sm:min-w-[240px] sm:w-[260px] md:min-w-[280px] md:w-[300px]`

The unprefixed `min-w-[250px]` is deliberate — it is what makes the row swipeable on a
phone. **Do not "restore" `grid grid-cols-2` on these rows.**

Still unchanged: the expanded "See all" grid (`AtiStore.tsx` ~line 384) keeps
`grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4`, mirroring ProducerMarket's
expanded view. Only the collapsed category rows are carousels.
