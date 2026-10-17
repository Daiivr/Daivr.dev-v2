import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

const MAGIC = Buffer.from("DAIVRH01");
export const HOST_HEADER_BYTES = 36;
export const MAX_HOST_BYTES = 64 * 1024 * 1024;

export function hostKey(value) {
  if (!/^[a-f\d]{64}$/i.test(value || "")) throw new Error("HOST_ENCRYPTION_KEY must contain 64 hexadecimal characters.");
  return Buffer.from(value, "hex");
}

export function encryptHost(data, key, id) {
  if (!data.length || data.length > MAX_HOST_BYTES) throw new Error("Host asset must be between 1 byte and 64 MiB.");
  const nonce = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, nonce);
  cipher.setAAD(Buffer.from(`DAIVRH01:${id}`));
  const ciphertext = Buffer.concat([cipher.update(data), cipher.final()]);
  return Buffer.concat([MAGIC, nonce, cipher.getAuthTag(), ciphertext]);
}

export function decryptHost(data, key, id) {
  if (data.length <= HOST_HEADER_BYTES || data.length > MAX_HOST_BYTES + HOST_HEADER_BYTES || !data.subarray(0, 8).equals(MAGIC)) throw new Error("Invalid encrypted host asset.");
  const decipher = createDecipheriv("aes-256-gcm", key, data.subarray(8, 20), { authTagLength: 16 });
  decipher.setAAD(Buffer.from(`DAIVRH01:${id}`));
  decipher.setAuthTag(data.subarray(20, 36));
  return Buffer.concat([decipher.update(data.subarray(36)), decipher.final()]);
}
