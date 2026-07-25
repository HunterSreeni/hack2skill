/**
 * Fixed-window per-client rate limiter for the Gemini-backed API routes.
 *
 * Both routes call a paid, rate-limited upstream (Gemini) with user-supplied
 * text, so an unauthenticated flood is both a cost and an availability
 * problem. State is per server instance and in-memory - deliberately simple,
 * with no external store to run or secure. Enough to stop a single abusive
 * client hammering the endpoints; a multi-instance deployment would move this
 * to a shared store.
 */

const WINDOW_MS = 60_000;
const MAX_REQUESTS_PER_WINDOW = 10;
/** Bounds memory if many distinct clients hit the route in one window. */
const MAX_TRACKED_CLIENTS = 5_000;

type Window = { count: number; resetAt: number };

const windows = new Map<string, Window>();

/**
 * Best-effort client identity. Hosting platforms terminate TLS in front of
 * the app, so the socket address is not visible here - the forwarded headers
 * are what we have. They are spoofable, which is why this is a throttle on
 * casual abuse, not an authorization control.
 */
export function clientKey(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return request.headers.get("x-real-ip") ?? "unknown";
}

/**
 * Records a request against the caller's window. Returns a 429 Response to
 * return directly from the handler when the caller is over the limit, or
 * null when the request may proceed.
 */
export function rateLimit(request: Request, now = Date.now()): Response | null {
  const key = clientKey(request);
  const existing = windows.get(key);

  if (!existing || now >= existing.resetAt) {
    if (windows.size >= MAX_TRACKED_CLIENTS) evictExpired(now);
    windows.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return null;
  }

  existing.count += 1;
  if (existing.count <= MAX_REQUESTS_PER_WINDOW) return null;

  const retryAfter = Math.ceil((existing.resetAt - now) / 1000);
  return Response.json(
    { error: "Too many requests. Please wait a moment and try again." },
    { status: 429, headers: { "Retry-After": String(retryAfter) } }
  );
}

function evictExpired(now: number): void {
  for (const [key, window] of windows) {
    if (now >= window.resetAt) windows.delete(key);
  }
  // Every tracked window is still live: drop the oldest insertion to stay bounded.
  if (windows.size >= MAX_TRACKED_CLIENTS) {
    const oldest = windows.keys().next();
    if (!oldest.done) windows.delete(oldest.value);
  }
}

/** Test-only hook so suites do not leak window state between cases. */
export function resetRateLimit(): void {
  windows.clear();
}
