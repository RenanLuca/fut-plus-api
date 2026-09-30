import { config } from "dotenv";
import { execSync } from "child_process";

// Loads .env.test into this process only, then runs prisma against that
// DATABASE_URL — never touches whatever the plain .env points to.
config({ path: ".env.test" });

execSync("npx prisma migrate reset --force", {
  stdio: "inherit",
  env: process.env,
});
