# Accessibility

> Stage: 2 · Professional
> Accessible interfaces are a baseline of professional work, not a feature. Learn it early so you build it in rather than bolt it on.

## Foundations

- [ ] Who it's for - describe permanent, temporary, and situational disabilities across vision, hearing, motor, and cognition
- [ ] WCAG - know the POUR principles and what levels A, AA, and AAA mean
- [ ] Legal context - know that laws like the ADA and European Accessibility Act apply to websites
- [ ] The accessibility tree - how browsers expose roles, names, and states to assistive tech
- [ ] Semantic HTML first - reach for native elements before ARIA

## Keyboard and focus

- [ ] Keyboard operability - everything reachable and usable without a mouse
- [ ] Focus order - logical DOM order; `tabindex` values `0` and `-1`, never positive
- [ ] Visible focus - `:focus-visible` styles that are obvious
- [ ] Focus management - move focus on route changes, dialogs, and deletions
- [ ] Focus trapping - in modals, via `dialog` or `inert`
- [ ] Skip links - let keyboard users bypass navigation

## ARIA

- [ ] The first rule of ARIA - don't use it if a native element does the job
- [ ] Accessible names - `aria-label`, `aria-labelledby`, `aria-describedby`, and name computation
- [ ] Roles, states, properties - `aria-expanded`, `aria-selected`, `aria-current`, `aria-hidden`
- [ ] Live regions - announce dynamic updates with `aria-live` and `role="status"`
- [ ] Authoring patterns - implement tabs, combobox, menu, and disclosure per the ARIA APG

## Content and visuals

- [ ] Colour contrast - meet 4.5:1 for text and 3:1 for UI; never convey meaning by colour alone
- [ ] Text alternatives - alt text, captions, transcripts
- [ ] Zoom and reflow - usable at 200% zoom and 320px width
- [ ] Target size - touch targets large enough to hit
- [ ] WCAG 2.2 additions - dragging alternatives, accessible authentication, redundant entry, and consistent help
- [ ] Reduced motion - respect `prefers-reduced-motion`
- [ ] Forced colours mode - test in Windows contrast themes; `forced-colors`, `prefers-contrast`, and system colours
- [ ] Accessible forms - labels, grouped controls, error messages tied to fields, error summaries
- [ ] Clear language - plain wording, descriptive link text and headings

## Testing

- [ ] Keyboard-only pass - complete core flows without a pointer
- [ ] Screen reader basics - operate NVDA or VoiceOver well enough to test your own work
- [ ] Mobile screen readers - test with VoiceOver on iOS and TalkBack on Android using touch gestures
- [ ] Voice control - make controls operable by speech; visible labels must match accessible names
- [ ] Automated checks - run axe or Lighthouse and know they catch only a fraction of issues
- [ ] Accessibility in CI - add axe checks to component or end-to-end tests
- [ ] Accessibility DevTools - inspect the accessibility tree and computed names

## Projects

- [ ] Audit a real site - write up issues against WCAG with severity and fixes
- [ ] Accessible modal and combobox - build both from scratch and verify with a screen reader

## Resources

- [web.dev: Learn Accessibility](https://web.dev/learn/accessibility)
- [ARIA Authoring Practices Guide](https://www.w3.org/WAI/ARIA/apg/)
- [WCAG 2.2 quick reference](https://www.w3.org/WAI/WCAG22/quickref/)
- [The A11Y Project](https://www.a11yproject.com/)
