import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    exclude: ["e2e/**", "**/*.spec.ts", "**/node_modules/**", "**/dist/**"],
    projects: [
      {
        test: {
          name: "unit",
          include: [
            "backend/**/*.test.ts",
            "frontend/**/*.test.ts",
            "packages/**/*.test.ts"
          ],
          exclude: ["**/*.integration.test.ts", "e2e/**", "**/*.spec.ts"],
          reporters: process.env.CI ? ["verbose", "json"] : ["verbose"],
          outputFile: process.env.CI ? { json: "test-results/unit.json" } : undefined,
          coverage: {
            provider: "v8",
            reporter: process.env.CI ? ["json", "lcov"] : ["text", "html"],
            reportsDirectory: "coverage",
            include: ["backend/api/src/**", "frontend/**", "packages/**"],
            exclude: ["**/*.test.ts", "**/dist/**", "**/node_modules/**"],
            thresholds: {
              "backend/api/src/infrastructure/security/**": { lines: 90, functions: 90 },
              "backend/api/src/shared/**": { lines: 95, functions: 95 }
            }
          }
        }
      },
      {
        test: {
          name: "integration",
          include: ["**/*.integration.test.ts"],
          exclude: ["e2e/**", "**/*.spec.ts"],
          reporters: ["verbose"]
        }
      }
    ]
  }
});
