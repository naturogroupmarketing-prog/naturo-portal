# Agent Guidelines — trackio Portal

When making any decision, agents must evaluate options using the following priority order. Higher priorities always win over lower ones.

---

## Priority Order

### 1. Quality — Always comes first
- Code must be correct, complete, and production-ready before anything else
- No shortcuts, half-fixes, or "good enough for now" solutions
- Every change must be TypeScript error-free and not break existing functionality
- UI must render correctly at mobile, tablet, and desktop breakpoints
- Prefer thorough, well-structured implementations over quick patches

### 2. Ease of Use — Second priority
- The UI must be intuitive — users should not need a manual
- Prefer fewer steps to complete a task
- Use clear, plain-English labels (no jargon, no acronyms without explanation)
- Confirmation dialogs must explain consequences in plain language
- Error messages must tell the user what went wrong and what to do next
- Destructive actions (delete, archive) must have confirmation with context

### 3. Speed — Third priority
- Pages and actions should feel fast
- Prefer server components over client components where possible
- Avoid unnecessary re-renders and redundant data fetches
- Optimistic UI updates are preferred for common actions
- Do not sacrifice Quality or Ease of Use for performance

### 4. Security — Fourth priority
- All server actions must verify authentication and authorisation before executing
- Role-based access must be enforced at the server level, never only in the UI
- Never expose sensitive data (IDs, tokens, org data) to unauthorised users
- Validate and sanitise all user input server-side
- Do not sacrifice Quality, Ease of Use, or Speed for security theatre

### 5. Privacy — Fifth priority
- Do not log or expose personal user data unnecessarily
- Audit logs should record actions, not personal content
- Minimise data collected — only store what is needed for the feature
- Do not sacrifice any higher priority for privacy features

---

## Decision Guide

When two options conflict, ask: *"Which priority level does each option serve?"*
Always choose the option that serves the higher priority.

**Example:** A faster implementation that is harder to use → choose the easier one (Ease of Use #2 beats Speed #3).

**Example:** A simpler UI that skips a security check → add the check (Security #4 must not be skipped, but evaluate whether the implementation still meets Quality #1 and Ease of Use #2).

---

## Design Skill — Mandatory UI Rule

**Before making any UI, UX, layout, dashboard, form, component, or styling change, read `docs/DESIGN_SKILL.md` and follow it strictly.**

This applies to every agent session, every PR, and every edit — no exceptions. The design skill defines the authoritative colour palette, typography scale, spacing system, component library, animation rules, accessibility standards, and dark mode conventions for this app. Any UI work that does not follow it will be considered a quality failure (Priority #1).

---

## Additional Rules

- Always read the relevant files before editing
- Never amend previous commits — always create new ones
- Never push to `main` directly without approval
- TypeScript must compile with zero errors after every change
- Responsive design is not optional — every UI change must work on mobile, tablet, and desktop
