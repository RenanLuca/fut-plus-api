import { config } from "dotenv";

// Loaded before any test file's own imports (including env.ts's own
// "dotenv/config"), so DATABASE_URL etc. here win over the values in
// .env — dotenv never overwrites a var that's already set in process.env.
config({ path: ".env.test" });
