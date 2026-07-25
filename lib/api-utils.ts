import { getAI, GEMINI_MODEL } from "@/lib/gemini";
import { HELPLINES } from "@/lib/data/helplines";

/** Shared request/response plumbing for the two Gemini-backed API routes -
 * keeps body parsing, validation errors, and the Gemini call/error pattern
 * in one place instead of duplicated across both route handlers. */

export async function parseJsonBody(request: Request): Promise<Record<string, unknown> | null> {
  const body = await request.json().catch(() => null);
  return body && typeof body === "object" ? (body as Record<string, unknown>) : null;
}

export function badRequest(message: string): Response {
  return Response.json({ error: message }, { status: 400 });
}

export function isValidFrequency(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 0 && value <= 4;
}

/**
 * Calls Gemini with the given prompt and returns the trimmed text, or an
 * error Response ready to return directly from the route handler. Centralizes
 * the try/catch + empty-response handling both routes need identically.
 */
export async function callGemini(
  systemInstruction: string,
  userContent: string,
  errorContext: string
): Promise<{ text: string } | { errorResponse: Response }> {
  try {
    const response = await getAI().models.generateContent({
      model: GEMINI_MODEL,
      contents: userContent,
      config: { systemInstruction },
    });

    const text = response.text?.trim();
    if (!text) {
      return { errorResponse: Response.json({ error: "Gemini returned an empty response." }, { status: 502 }) };
    }
    return { text };
  } catch (err) {
    console.error(`${errorContext} Gemini call failed:`, err);
    return { errorResponse: Response.json({ error: `Failed to ${errorContext}.` }, { status: 502 }) };
  }
}

export function appendHelplineFooter(body: string, leadIn: string): string {
  const helpline = HELPLINES[0];
  return `${body}\n\n${leadIn} ${helpline.name}: ${helpline.number} (${helpline.availability}).`;
}
