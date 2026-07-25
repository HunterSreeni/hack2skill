# PromptWars - Hack2Skill Submission Rules

## Repo
- GitHub remote: git@github.com:HunterSreeni/hack2skill.git
- Repository must be PUBLIC
- Repository must contain ONLY ONE branch - never create/push a second branch
- Total repo size must stay under 10 MB - avoid committing large assets, datasets, models, node_modules, build artifacts, etc. Use .gitignore aggressively.
- Maximum 1 submission attempt allowed - treat every push to the remote as final-quality, not a draft.

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
Work in this priority order - high impact first:
- **High impact**: core functionality/logic quality - get this right first, it drives most of the score
- **Medium impact**: code quality, security, efficiency, testing - solid engineering practices
- **Low impact**: accessibility/polish - final layer, don't skip but don't over-invest before the above are solid

## Working conventions for this repo
- Single branch only (main) - commit directly, no feature branches
- Keep commits small and frequent; push regularly so progress is visible
- Before committing: check for large files/dependencies that would push repo over 10 MB
- Since only one submission attempt is allowed, verify the app runs end-to-end before considering work "done"
