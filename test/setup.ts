import { config } from "dotenv";

// Loads GEMINI_API_KEY etc. from .env for integration tests.
// Unit tests don't touch env vars at all, so this is a harmless no-op for them.
config({ path: ".env" });
