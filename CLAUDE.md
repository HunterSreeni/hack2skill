# PromptWars - Hack2Skill Submission Rules

## Repo
- GitHub remote: git@github.com:HunterSreeni/hack2skill.git
- Repository must be PUBLIC
- Repository must contain ONLY ONE branch - never create/push a second branch
- Total repo size must stay under 10 MB - avoid committing large assets, datasets, models, node_modules, build artifacts, etc. Use .gitignore aggressively.
- Maximum 1 submission attempt allowed - treat every push to the remote as final-quality, not a draft.

## Submission link (dashboard rules - authoritative at deadline)
- Submit the GitHub repo URL itself on the hack2skill platform - the repo IS the submission, not a zip/build artifact.
- Repo must be **public at the time of evaluation** - private/restricted links are not evaluated at all, no exceptions or resubmission.
- Repo size < 10 MB is re-checked at submission, not just during dev - verify with `git count-objects -vH` (or check .git folder size) before submitting.
- At most ONE submission for this round - there is no fix-it-after window, so do a final end-to-end check before submitting the link.

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
