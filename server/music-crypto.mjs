import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

// Envelope: version (8 bytes), nonce (12), authentication tag (16), ciphertext.
const MAGIC = Buffer.from("DAIVRM01");
export const MUSIC_HEADER_BYTES = 36;
export const MAX_MUSIC_BYTES = 32 * 1024 * 1024;

export function musicKey(value) {
  if (!/^[a-f\d]{64}$/i.test(value || "")) throw new Error("MUSIC_ENCRYPTION_KEY must contain 64 hexadecimal characters.");
  return Buffer.from(value, "hex");
}

export function encryptMusic(data, key, id) {
  if (!data.length || data.length > MAX_MUSIC_BYTES) throw new Error("Music must be between 1 byte and 32 MiB.");
  const nonce = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, nonce);
  cipher.setAAD(Buffer.from(`DAIVRM01:${id}`));
  const encrypted = Buffer.concat([cipher.update(data), cipher.final()]);
  return Buffer.concat([MAGIC, nonce, cipher.getAuthTag(), encrypted]);
}

export function decryptMusic(data, key, id) {
  if (data.length <= MUSIC_HEADER_BYTES || data.length > MAX_MUSIC_BYTES + MUSIC_HEADER_BYTES
      || !data.subarray(0, 8).equals(MAGIC)) throw new Error("Invalid encrypted music file.");
  const decipher = createDecipheriv("aes-256-gcm", key, data.subarray(8, 20), { authTagLength: 16 });
  decipher.setAAD(Buffer.from(`DAIVRM01:${id}`));
  decipher.setAuthTag(data.subarray(20, 36));
  // Verify authenticity before any plaintext is returned to the caller.
  return Buffer.concat([decipher.update(data.subarray(36)), decipher.final()]);
}
