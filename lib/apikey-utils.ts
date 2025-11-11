import crypto from "crypto"

export function generateAPIKey() {
  return crypto.randomBytes(32).toString("hex")
}

export function hashAPIKey(apiKey: string) {
  return crypto.createHash("sha256").update(apiKey).digest("hex")
}

export function verifyAPIKey(apiKey: string, hash: string) {
  const hash2 = hashAPIKey(apiKey)
  return crypto.timingSafeEqual(Buffer.from(hash2), Buffer.from(hash))
}
