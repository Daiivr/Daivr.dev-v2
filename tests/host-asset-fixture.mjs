import { readFileSync } from "node:fs";
import { loadLocalEnv } from "../server/env.mjs";
import { decryptHost, hostKey } from "../server/host-crypto.mjs";

loadLocalEnv();
export const hostAssetsAvailable = Boolean(process.env.HOST_ENCRYPTION_KEY);
export function readHostAsset(id) {
  return decryptHost(readFileSync(new URL(`../private/hosts-encrypted/${id}.enc`, import.meta.url)), hostKey(process.env.HOST_ENCRYPTION_KEY), id);
}
