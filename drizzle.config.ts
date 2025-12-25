// import "dotenv/config";
 import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

 config({ path: ".env.local" });

export default defineConfig({
  out: "./src/drizzle/migrations",
  schema: "./src/drizzle/schema.ts",
  dialect: "postgresql",
  verbose: true,
  strict: true,
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
