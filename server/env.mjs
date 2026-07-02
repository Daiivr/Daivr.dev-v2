import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

export function loadLocalEnv(root = process.cwd()) {
  for (const filename of [".env", ".env.local"]) {
    const path = join(root, filename);
    if (!existsSync(path)) continue;

    const source = readFileSync(path, "utf8");
    for (const rawLine of source.split(/\r?\n/)) {
      const line = rawLine.trim();
      if (!line || line.startsWith("#")) continue;

      const separator = line.indexOf("=");
      if (separator === -1) continue;

      const key = line.slice(0, separator).trim();
      let value = line.slice(separator + 1).trim();
      if (!key || process.env[key] !== undefined) continue;

      if (
        (value.startsWith("\"") && value.endsWith("\"")) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }

      process.env[key] = value;
    }
  }
}
