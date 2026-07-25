import { test, expect, chromium, type Browser } from "@playwright/test";

/**
 * Critical-path E2E test, headless (no display server on this machine).
 * Real app, real Gemini calls, real Firebase project - nothing mocked.
 *
 * Two real browser contexts standing in for two real people:
 *   - a person in recovery
 *   - their linked caregiver
 *
 * Flow: recovering user signs up -> completes check-in -> gets a real
 * Gemini-generated script -> shares their pairing code. Caregiver signs up
 * -> links via that code -> sees the recovering user's streak live. The
 * recovering user then hits the crisis button, and the caregiver's
 * dashboard shows the alert in real time (Firestore onSnapshot), with NO
 * page reload on the caregiver's side - that's the thing this test exists
 * to prove.
 */

const BASE_URL = process.env.E2E_BASE_URL ?? "http://localhost:3000";
const runId = Date.now();
const recoveringEmail = `recovering-${runId}@example.com`;
const caregiverEmail = `caregiver-${runId}@example.com`;
const password = "test-password-123";

test.describe.configure({ mode: "serial" });

let browser: Browser;

test.beforeAll(async () => {
  browser = await chromium.launch({ headless: true });
});

test.afterAll(async () => {
  await browser.close();
});

test("critical path: signup -> check-in -> pairing -> crisis -> live caregiver alert", async () => {
  const recoveringCtx = await browser.newContext();
  const caregiverCtx = await browser.newContext();
  const recovering = await recoveringCtx.newPage();
  const caregiver = await caregiverCtx.newPage();

  // --- Recovering user signs up ---
  await recovering.goto(`${BASE_URL}/signup`);
  await recovering.getByRole("radio", { name: "In recovery" }).click();
  await recovering.getByLabel("Email").fill(recoveringEmail);
  await recovering.getByLabel("Password").fill(password);
  await recovering.getByRole("button", { name: "Create account" }).click();
  await expect(recovering).toHaveURL(/\/checkin/, { timeout: 15000 });

  // --- Check-in ---
  for (const label of [
    "In the past 3 months, how often have you used this substance?",
    "In the past 3 months, how often has your use led to health, social, legal, or financial problems?",
    "In the past 3 months, how often has a friend, relative, or anyone else expressed concern about your use?",
  ]) {
    await recovering.getByRole("radiogroup", { name: label }).getByText("Weekly").click();
  }
  await recovering
    .getByLabel(/in your own words/i)
    .fill("Friday evenings alone. I want to be present for my daughter's exams next month.");
  await recovering.getByRole("button", { name: "Generate my script" }).click();

  // Real Gemini call - give it real time to respond.
  await expect(recovering).toHaveURL(/\/script/, { timeout: 30000 });
  await expect(recovering.getByRole("heading", { name: "Your script" })).toBeVisible();

  const pairingCode = await recovering
    .getByText(/^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{6}$/)
    .textContent();
  expect(pairingCode).toBeTruthy();

  // --- Caregiver signs up and links ---
  await caregiver.goto(`${BASE_URL}/signup`);
  await caregiver.getByRole("radio", { name: "A caregiver" }).click();
  await caregiver.getByLabel("Email").fill(caregiverEmail);
  await caregiver.getByLabel("Password").fill(password);
  await caregiver.getByRole("button", { name: "Create account" }).click();
  await expect(caregiver).toHaveURL(/\/caregiver/, { timeout: 15000 });

  await caregiver.getByLabel(/enter their share code/i).fill(pairingCode!.trim());
  await caregiver.getByRole("button", { name: "Link" }).click();
  await expect(caregiver.getByText(/-day streak/)).toBeVisible({ timeout: 10000 });

  // --- Recovering user hits the crisis button ---
  await recovering.getByRole("button", { name: "I need help right now" }).click();
  await expect(recovering.getByRole("status")).toBeVisible({ timeout: 30000 });

  // --- Caregiver sees the live alert with NO reload ---
  await expect(caregiver.getByRole("alert").filter({ hasText: "Crisis moment right now" })).toBeVisible({
    timeout: 15000,
  });

  await recoveringCtx.close();
  await caregiverCtx.close();
});
