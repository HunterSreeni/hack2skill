import { describe, it, beforeAll, afterAll, beforeEach } from "vitest";
import {
  initializeTestEnvironment,
  assertSucceeds,
  assertFails,
  type RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import { readFileSync } from "node:fs";
import { doc, getDoc, setDoc, collection, addDoc } from "firebase/firestore";

/**
 * Real integration tests against the local Firestore emulator (not a mock -
 * it's the actual rules engine Firebase ships, running locally). Requires:
 *   firebase emulators:start --only firestore
 * running on localhost:8080 before `npm run test:rules`.
 */

let testEnv: RulesTestEnvironment;

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: "steady-rules-test",
    firestore: {
      rules: readFileSync("firestore.rules", "utf8"),
      host: "localhost",
      port: 8080,
    },
  });
});

afterAll(async () => {
  await testEnv?.cleanup();
});

beforeEach(async () => {
  await testEnv.clearFirestore();
});

describe("users/{uid}", () => {
  it("lets a user read and write their own profile", async () => {
    const alice = testEnv.authenticatedContext("alice").firestore();
    await assertSucceeds(setDoc(doc(alice, "users/alice"), { role: "recovering", currentStreak: 0 }));
    await assertSucceeds(getDoc(doc(alice, "users/alice")));
  });

  it("denies a user writing another user's profile", async () => {
    const bob = testEnv.authenticatedContext("bob").firestore();
    await assertFails(setDoc(doc(bob, "users/alice"), { role: "recovering", currentStreak: 999 }));
  });

  it("denies an unauthenticated read", async () => {
    const anon = testEnv.unauthenticatedContext().firestore();
    await assertFails(getDoc(doc(anon, "users/alice")));
  });

  it("lets a LINKED caregiver read the recovering user's profile", async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      const db = ctx.firestore();
      await setDoc(doc(db, "users/alice"), { role: "recovering", currentStreak: 5 });
      await setDoc(doc(db, "links/alice_bob"), { recoveringUid: "alice", caregiverUid: "bob" });
    });
    const bob = testEnv.authenticatedContext("bob").firestore();
    await assertSucceeds(getDoc(doc(bob, "users/alice")));
  });

  it("denies an UNLINKED caregiver reading the recovering user's profile", async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), "users/alice"), { role: "recovering", currentStreak: 5 });
    });
    const mallory = testEnv.authenticatedContext("mallory").firestore();
    await assertFails(getDoc(doc(mallory, "users/alice")));
  });

  it("does not let a linked caregiver WRITE the recovering user's profile", async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), "links/alice_bob"), { recoveringUid: "alice", caregiverUid: "bob" });
    });
    const bob = testEnv.authenticatedContext("bob").firestore();
    await assertFails(setDoc(doc(bob, "users/alice"), { currentStreak: 999 }));
  });
});

describe("links/{recoveringUid}_{caregiverUid}", () => {
  it("lets a caregiver create a link naming themself", async () => {
    const bob = testEnv.authenticatedContext("bob").firestore();
    await assertSucceeds(
      setDoc(doc(bob, "links/alice_bob"), { recoveringUid: "alice", caregiverUid: "bob" })
    );
  });

  it("denies creating a link naming someone else as the caregiver", async () => {
    const mallory = testEnv.authenticatedContext("mallory").firestore();
    await assertFails(
      setDoc(doc(mallory, "links/alice_bob"), { recoveringUid: "alice", caregiverUid: "bob" })
    );
  });
});

describe("alerts/{alertId}", () => {
  it("lets a user create their own alert", async () => {
    const alice = testEnv.authenticatedContext("alice").firestore();
    await assertSucceeds(
      addDoc(collection(alice, "alerts"), {
        userId: "alice",
        caregiverIds: ["bob"],
        type: "crisis",
        createdAt: Date.now(),
        acknowledged: false,
      })
    );
  });

  it("denies creating an alert on someone else's behalf", async () => {
    const mallory = testEnv.authenticatedContext("mallory").firestore();
    await assertFails(
      addDoc(collection(mallory, "alerts"), {
        userId: "alice",
        caregiverIds: ["bob"],
        type: "crisis",
        createdAt: Date.now(),
        acknowledged: false,
      })
    );
  });

  it("denies a caregiver NOT listed on the alert from reading it", async () => {
    let alertId = "";
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      const ref = await addDoc(collection(ctx.firestore(), "alerts"), {
        userId: "alice",
        caregiverIds: ["bob"],
        type: "crisis",
        createdAt: Date.now(),
        acknowledged: false,
      });
      alertId = ref.id;
    });
    const mallory = testEnv.authenticatedContext("mallory").firestore();
    await assertFails(getDoc(doc(mallory, "alerts", alertId)));
  });
});

describe("pairingCodes/{code}", () => {
  it("denies creating a pairing code naming another uid as owner", async () => {
    const mallory = testEnv.authenticatedContext("mallory").firestore();
    await assertFails(setDoc(doc(mallory, "pairingCodes/ABC123"), { uid: "alice" }));
  });

  it("lets any authenticated user read a pairing code (needed for caregiver lookup)", async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), "pairingCodes/ABC123"), { uid: "alice" });
    });
    const bob = testEnv.authenticatedContext("bob").firestore();
    await assertSucceeds(getDoc(doc(bob, "pairingCodes/ABC123")));
  });
});
