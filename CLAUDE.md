# PromptWars - Hack2Skill Submission Rules

## HARD RULES (non-negotiable - violating any of these risks disqualification)
1. **Repo:** git@github.com:HunterSreeni/hack2skill.git
2. **Public visibility, always.** Never flip to private, even temporarily, from now until after evaluation. Private/restricted links are not evaluated - no exceptions, no fix-it-after window.
3. **Single branch only (`main`).** Never create, push, or leave behind a second branch. Commit directly to `main`.
4. **Repo size < 10 MB, checked at submission time, not just during dev.** Verify with `git count-objects -vH` before every push and again immediately before submitting the link. `node_modules`, build output, and any large assets must never be committed (already gitignored).
5. **Treat this as a ONE-SHOT submission.** Source docs disagree on the attempt count - the dashboard screenshot said "maximum 1 attempt," the official "[PUB] How to Make a Submission?" doc says "maximum of 3 submission attempts." We work to the stricter number (1) as our operating discipline regardless of which is technically true - every push to `main` should be final-submission-quality, and we do a full end-to-end check before ever submitting the link on the Hack2skill portal. (If we ever confirm 3 is correct and truly need a resubmission, that's a fallback, not the plan.)
6. **Submit the GitHub repo URL itself** via Hack2skill Portal -> Prompt Wars Dashboard -> Submissions tab. The repo IS the submission, not a zip or build artifact.

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
- Since only one submission attempt is allowed, verify the app runs end-to-end before considering work "done"
- Never commit API keys/secrets - use environment variables (.env, gitignored) and document required env vars in the README
