import { defineConfig } from "vitest/config";

// Repo/unit tests run against an in-memory SQLite DB (per the MABOUTIQUE_DB env that
// lib/db.ts reads), so they never touch the real data/ file. Each test file is module-
// isolated by default, so it gets its own fresh in-memory database.
export default defineConfig({
  test: {
    environment: "node",
    env: { MABOUTIQUE_DB: ":memory:" },
    include: ["test/**/*.test.ts"],
  },
});
