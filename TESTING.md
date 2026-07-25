# Testing

Three tiers, all real (no mocked GenAI, no mocked security rules - per this
repo's own hard rule in `CLAUDE.md`).

## 1. Unit tests (`npm run test`)

Pure logic, no network, no Firebase. Vitest.

**`test/unit/streak.test.ts`** - `computeStreakUpdate` (lib/streak.ts):
- First check-in starts a streak at 1.
- Consecutive-day check-ins increment the streak.
- Same-day check-in is idempotent (no double count).
- A gap restarts `currentStreak` at 1 but **preserves `longestStreak`**
  (non-punitive design, see project research docs §1a).
- A lapse resets `currentStreak` to 0, never touches `longestStreak`, and is
  appended to (never replaces) `lapseHistory`.
- Multiple lapses accumulate in history rather than overwriting it.
- A user can set a new `longestStreak` after recovering from a lapse.
- Pairing code generation: correct length/alphabet, rejects ambiguous
  characters (0/O/1/I), varies across calls.

**`test/unit/assist-lite.test.ts`** - `scoreCheckIn` (lib/data/assist-lite.ts):
- All-"Never" answers band as low risk.
- A moderate combination bands correctly.
- A high-frequency/high-problem combination bands as high risk.
- Monotonicity: strictly higher answers never score lower.

## 2. Integration tests

### 2a. Real Gemini API (`npm run test:integration`)

`test/integration/gemini-routes.test.ts` calls the actual
`/api/generate-script` and `/api/crisis-response` route handlers directly
(no HTTP server needed - they're plain Web `Request`/`Response`), hitting
the **live Gemini API** with the `GEMINI_API_KEY` from `.env`. Nothing here
is mocked, per this repo's hard rule against mocked GenAI responses.

Covers:
- A real check-in produces a non-empty, correctly-banded script containing
  the real appended helpline number (1800-11-0031).
- Two meaningfully different inputs produce **different** output - proof
  it's a live call, not a canned string.
- Invalid substance / out-of-range frequency / oversized trigger note all
  return 400 **without** calling Gemini (validated before the API call).
- A prompt-injection attempt embedded in the free-text trigger note
  (`"Ignore all previous instructions..."`) does not make the model comply
  literally - validates the system-instruction guard in both routes.
- The crisis-response route produces a real read-back referencing the saved
  script, with the helpline appended, and rejects missing/oversized input.

### 2b. Firestore security rules (`npm run test:rules`)

`test/integration/firestore-rules.test.ts` runs against the **real Firestore
emulator** (a local instance of Firebase's actual rules engine - legitimate
test infrastructure, not a mock) using `@firebase/rules-unit-testing`.
Requires the emulator running first:

```bash
firebase emulators:start --only firestore
```

Covers, per collection:
- `users/{uid}`: owner can read/write their own doc; another user cannot
  write it; unauthenticated reads are denied; a **linked** caregiver can
  read a recovering user's doc; an **unlinked** caregiver cannot; a linked
  caregiver still cannot **write** it.
- `links/{recoveringUid}_{caregiverUid}`: a caregiver can create a link
  naming themself; cannot create a link naming someone else as the
  caregiver (impersonation check).
- `alerts/{alertId}`: a user can create their own alert; cannot create one
  on someone else's behalf; a caregiver not listed on the alert cannot read
  it.
- `pairingCodes/{code}`: cannot create a code claiming another uid as
  owner; any authenticated user can read a code (required for lookup).

This tier caught a real bug during development: the original rules file
used invalid path-interpolation syntax (`$(uid)_$(request.auth.uid)`) which
the Firestore rules compiler rejects - fixed to string concatenation
(`$(uid + '_' + request.auth.uid)`). Real infra caught a real mistake real
mocking would have hidden.

## 3. End-to-end (`npm run test:e2e`, via the `/playwright-cli` skill)

Headless (no `--headed` - no display server on this machine, per global
CLAUDE.md). One critical-path scenario, two real browser contexts:

`test-e2e/critical-path.spec.ts`:
1. Recovering-user context: sign up, complete the check-in, land on the
   script page with a real Gemini-generated script.
2. Caregiver context: sign up, enter the recovering user's real pairing
   code, link successfully.
3. Recovering-user context: hit "I need help right now".
4. Caregiver context: the real-time alert banner appears **without a page
   reload** (Firestore `onSnapshot`, not polling).

## Out of scope for this timebox (explicitly, not an oversight)

- Load/performance testing.
- Cross-browser matrix (Playwright run is Chromium-only here).
- Additional E2E scenarios beyond the one critical path (buddy check-in,
  lapse logging, multi-caregiver fan-out) - the logic they'd exercise is
  covered by unit + rules tests, just not end-to-end in a browser.
- Visual regression testing.
- Rewards catalog: no tests, since it's static illustrative content with no
  logic branches.

## Running everything

```bash
npm run test              # unit - instant, no setup
npm run test:integration  # real Gemini calls - needs GEMINI_API_KEY in .env
firebase emulators:start --only firestore &
npm run test:rules        # real Firestore rules engine
# then, with npm run dev running and Firebase config in .env:
# invoke /playwright-cli to run test-e2e/critical-path.spec.ts headless
```
