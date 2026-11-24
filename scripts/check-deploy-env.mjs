// Runs before `npm run deploy`. OpenNext copies every .env file into the Worker it builds, so a deploy from a folder
// that holds the OpenAI key would upload the key inside the code. The key belongs in a Cloudflare secret instead.
import { readdirSync } from "node:fs";

const envFiles = readdirSync(".").filter((name) => name.startsWith(".env") && name !== ".env.example");

if (envFiles.length > 0) {
  console.error(`Deploy stopped: ${envFiles.join(", ")} would be copied into the Worker, key included.`);
  console.error("Deploy from a copy of the project without .env files, and keep the key as a Cloudflare secret (README, Deploy to Cloudflare).");
  process.exit(1);
}
