import { createClient } from "redis"

let redisClient: ReturnType<typeof createClient> | null = null

export async function getRedisClient() {
  if (redisClient) {
    return redisClient
  }

  redisClient = createClient({
    url: process.env.REDIS_URL,
  })

  redisClient.on("error", (err) => console.error("Redis Error:", err))
  await redisClient.connect()

  return redisClient
}

export async function cacheSet(key: string, value: any, ttl?: number) {
  const client = await getRedisClient()
  await client.set(key, JSON.stringify(value), ttl ? { EX: ttl } : undefined)
}

export async function cacheGet<T>(key: string): Promise<T | null> {
  const client = await getRedisClient()
  const data = await client.get(key)
  return data ? JSON.parse(data) : null
}

export async function cacheDel(key: string) {
  const client = await getRedisClient()
  await client.del(key)
}
