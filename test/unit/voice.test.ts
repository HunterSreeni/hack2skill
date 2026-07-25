import { describe, it, expect } from "vitest";
import { matchDistressPhrase } from "@/lib/voice";

describe("matchDistressPhrase", () => {
  it("matches a known distress phrase, case-insensitively", () => {
    expect(matchDistressPhrase("I NEED HELP right now please")).toBe("i need help");
  });

  it("matches when the phrase is embedded mid-sentence", () => {
    expect(matchDistressPhrase("honestly I think I want to use tonight")).toBe("i want to use");
  });

  it("does not match unrelated speech", () => {
    expect(matchDistressPhrase("can you help me fill out this form")).toBeNull();
    expect(matchDistressPhrase("just checking in, feeling okay today")).toBeNull();
  });

  it("does not false-positive on the bare word help alone", () => {
    // Deliberate design choice: bare "help" isn't in the phrase list because
    // it's too common in unrelated speech (see lib/voice.ts comment).
    expect(matchDistressPhrase("help")).toBeNull();
  });

  it("returns null for empty input", () => {
    expect(matchDistressPhrase("")).toBeNull();
  });
});
