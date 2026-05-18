import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
export function loadEnvironmentFiles(cwd = process.cwd()) {
    const nodeEnv = runtimeEnvFrom(process.env.NODE_ENV);
    for (const path of envFilePaths(cwd, nodeEnv)) {
        loadDotEnvFile(path);
    }
    return nodeEnv;
}
function envFilePaths(cwd, nodeEnv) {
    const base = [resolve(cwd, ".env")];
    if (nodeEnv === "development") {
        return [...base, resolve(cwd, ".env.local"), resolve(cwd, ".env.development")];
    }
    if (nodeEnv === "test") {
        return [...base, resolve(cwd, ".env.test")];
    }
    if (nodeEnv === "staging") {
        return [...base, resolve(cwd, ".env.staging")];
    }
    return [...base, resolve(cwd, ".env.production")];
}
function loadDotEnvFile(path) {
    if (!existsSync(path)) {
        return;
    }
    const content = readFileSync(path, "utf8");
    for (const line of content.split(/\r?\n/)) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) {
            continue;
        }
        const separator = trimmed.indexOf("=");
        if (separator === -1) {
            continue;
        }
        const key = trimmed.slice(0, separator).trim();
        const value = trimmed.slice(separator + 1).trim().replace(/^['"]|['"]$/g, "");
        if (!(key in process.env)) {
            process.env[key] = value;
        }
    }
}
function runtimeEnvFrom(value) {
    if (!value) {
        return "development";
    }
    if (value === "development" ||
        value === "test" ||
        value === "staging" ||
        value === "production") {
        return value;
    }
    throw new Error("NODE_ENV must be development, test, staging, or production.");
}
//# sourceMappingURL=env.js.map