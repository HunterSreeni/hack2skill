# PromptWars - Hack2Skill Submission Rules

## Timeline: two windows, one repo
- **Warm-up: DONE.** Submitted with 1/1 attempt used. Scored **83.95/100** (Code Quality 86, Security 98, Efficiency 80, **Testing 0**, Accessibility 94, Problem Statement Alignment 96). Testing scored 0 because Step 1 shipped with no test suite - do not repeat that mistake in the main challenge.
- **Main challenge (current window, ~3 hours timed):** same problem statement, this is the actual evaluated event, building further on the warm-up repo.
- **Confirmed: same repo carries through both windows** (`git@github.com:HunterSreeni/hack2skill.git`).

## Submission attempts & bonus strategy (main challenge)
- Main challenge allows **up to 3 submission attempts** (confirmed via the platform dashboard, matching the official "[PUB] How to Make a Submission?" doc - this supersedes the earlier "treat as one-shot" caution, which was written before this was confirmed).
- Platform awards bonuses for: an early/first submission, and a large positive score jump between submission 1 and a later resubmission.
- **Strategy: submit a solid, fully-working P0 build as soon as it's ready (attempt 1) rather than waiting for full polish** - captures the early-submission bonus - then use remaining attempts to ship real improvements (P1 items, more tests, polish) for a genuine score jump, not busywork.

## HARD RULES (non-negotiable - violating any of these risks disqualification)
1. **Repo:** git@github.com:HunterSreeni/hack2skill.git
2. **Public visibility, always.** Never flip to private, even temporarily, from now until after evaluation. Private/restricted links are not evaluated - no exceptions, no fix-it-after window.
3. **Single branch only (`main`).** Never create, push, or leave behind a second branch. Commit directly to `main`.
4. **Repo size < 10 MB, checked at submission time, not just during dev.** Verify with `git count-objects -vH` before every push and again immediately before submitting the link. `node_modules`, build output, and any large assets must never be committed (already gitignored).
5. **Every submitted attempt must be genuinely, fully working end-to-end** - a real live deployed link, real Gemini calls, no broken flows. Don't submit half-done work just to "use" an attempt.
6. **Submit the GitHub repo URL itself** via Hack2skill Portal -> Prompt Wars Dashboard -> Submissions tab. The repo IS the submission, not a zip or build artifact.
7. **No em dash character anywhere** - submission form text, README, TESTING.md, commit messages, code comments, any output for this project. Use a period, comma, or regular hyphen instead. Also applies to the submission form's 1024-character fields specifically - every character counts there, so keep sentences tight regardless.

## Primary persona (confirmed)
**Person in recovery** is the primary, fully-built-out flow: check-in -> personalized emergency script -> zero-typing crisis trigger (the "when cognitive load is highest" centerpiece from the problem statement). Caregiver flow is present but lighter/secondary - do not build both at equal depth; depth on one persona beats breadth across two.

## Main challenge scope (current build)
Extends Step 1 into a two-role product per the plan at `/home/huntersreeni/.claude/plans/logical-stirring-hearth.md`:
- Firebase Auth (email/password) + Firestore replace Step 1's localStorage - required for cross-device caregiver alerts.
- Two roles: person in recovery (primary, full depth) and caregiver (linked via a real 6-char pairing code).
- Non-punitive streak system (`lib/streak.ts`) - lapses never wipe longest streak or history.
- Real-time caregiver alerts on crisis-trigger/lapse via Firestore `onSnapshot` - not polling, not mocked.
- Cue -> routine -> reward framing: crisis trigger = cue, Gemini grounding action = routine, streak milestones = reward.
- Rewards catalog is explicitly illustrative (badges + example partner-reward categories), not a live commerce integration - documented as such, not misrepresented.
- Firestore security rules (`firestore.rules`) enforced and tested against the real local emulator, not assumed correct.
- Full test pyramid this time: unit (Vitest), integration (real Gemini calls + real Firestore-emulator rules tests), one critical-path E2E (`/playwright-cli`, headless - no display server on this Kali machine). See `TESTING.md`.

## Persona (clarified - no external verticals list exists)
"Choose one of the provided challenge verticals" refers to the problem statement itself, not a separate menu. The end users ARE the persona: people navigating substance use recovery, and their caregivers. Every feature, script, and piece of copy must stay aligned to this real persona - not drift into a generic wellness/productivity app. If the MVP needs to prioritize depth over breadth, pick ONE of {person-in-recovery, caregiver} as the primary, fully-built-out flow, with the other present but lighter - not both half-built.

## Challenge
Design and build a multi-modal, GenAI-powered recovery and prevention platform for individuals navigating substance use disorders and their caregivers. Must use generative AI as a core engine to provide:
- Zero-typing interventions
- Personalized emergency scripts
- Educational resources
- Contextual safety tools for high-cognitive-load moments

Must pick ONE challenge vertical/persona and design the solution's logic explicitly around that persona - not a generic multi-persona app.

Pro-tip from organizers: functional checks evaluate the app as a whole, not a single feature. A well-rounded, connected workflow (not isolated screens) is more resilient to evaluation than one polished feature.

## What must be demonstrated
- A smart, dynamic assistant with logical decision-making based on user context (not static/scripted flows)
- Practical, real-world usability
- Clean, maintainable code

## Submission requirements
- Public GitHub repo link with complete project code
- README.md must explain:
  - Chosen vertical/persona
  - Approach and logic
  - How the solution works
  - Any assumptions made

## Evaluation criteria (weighted)
Core functionality/logic quality (smart, dynamic, context-driven assistant) drives most of the score - get that right first. Within engineering quality, work in this priority order:
1. **Code Quality & Security (top priority)** - clean structure, no leaked secrets/API keys, input validation, sanitized model outputs, no injectable prompts, safe handling of any user data.
2. **Efficiency** - optimal token/resource use, no redundant model calls, sensible caching, fast response on the core flow.
3. **Testing** - validated functionality, real scenarios exercised, not just happy-path.
4. **Accessibility** - final polish layer (WCAG-aligned, inclusive design); required for a perfect score but do not front-load ahead of 1-3.

## Tech constraints
- **Web app only.** No native mobile app (Android/iOS) - harder to test/evaluate manually. No desktop app.
- **No local LLMs.** Use a real, cloud-hosted GenAI API (Gemini API) as the core engine.
- **No mock data or mocked/simulated GenAI responses anywhere in the submission.** Every GenAI call in the shipped app must hit a real, working API integration. Every reference dataset (screening logic, helpline numbers, educational content, facility lookups) must be a real, sourced dataset - not fabricated placeholder content.

## Working conventions for this repo
- Single branch only (main) - commit directly, no feature branches
- Keep commits small and frequent; push regularly so progress is visible
- Before committing: check for large files/dependencies that would push repo over 10 MB
- Verify the app runs end-to-end before considering work "done" - each submission attempt should be genuinely working
- Never commit API keys/secrets - use environment variables (.env, gitignored) and document required env vars in the README
- **Run `npm run version:bump` before every push to main.** Bumps the semver patch version in package.json and regenerates `lib/version.ts`, which the UI footer displays. No CI in this timebox, so this is a manual-but-required step, not automated via a git hook.
- **All reward/streak-related fields belong only to the "recovering" role's Firestore user doc** (`newUserDoc` in `lib/data/user-doc.ts`) - a caregiver's own profile doc never carries `currentStreak`/`longestStreak`/`lapseHistory`/`pairingCode`/`metBuddyToday`. The caregiver dashboard reading a *linked recovering user's* streak (via `watchStreakStatus`) is a separate, intentional feature (buddy-system support) and stays.
