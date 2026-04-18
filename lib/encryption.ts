import "server-only";

import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

// Utils
function toBase64Url(buffer: Buffer) {
  return buffer.toString("base64url");
}

function fromBase64Url(value: string) {
  return Buffer.from(value, "base64url");
}

// Key
if (!process.env.ENCRYPTION_KEY) {
  throw new Error("ENCRYPTION_KEY is not set");
}

const ENCRYPTION_KEY = Buffer.from(process.env.ENCRYPTION_KEY, "base64");

if (ENCRYPTION_KEY.length !== 32) {
  throw new Error(
    "ENCRYPTION_KEY must be a base64-encoded 32-byte key for AES-256-GCM",
  );
}

// Functions
export function encryptText(plaintext: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", ENCRYPTION_KEY, iv);

  const ciphertext = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  return [
    "v1",
    toBase64Url(iv),
    toBase64Url(ciphertext),
    toBase64Url(authTag),
  ].join(".");
}

export function decryptText(payload: string) {
  const [version, ivValue, ciphertextValue, authTagValue] = payload.split(".");

  if (version !== "v1" || !ivValue || !ciphertextValue || !authTagValue) {
    throw new Error("Encrypted payload format is invalid");
  }

  const decipher = createDecipheriv(
    "aes-256-gcm",
    ENCRYPTION_KEY,
    fromBase64Url(ivValue),
  );
  decipher.setAuthTag(fromBase64Url(authTagValue));

  const plaintext = Buffer.concat([
    decipher.update(fromBase64Url(ciphertextValue)),
    decipher.final(),
  ]);

  return plaintext.toString("utf8");
}
