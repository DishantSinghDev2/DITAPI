import { connectToDatabase } from "./db"
import { createApisixConsumer, createApisixRoute, createApisixService } from "./apisix"
import { ObjectId } from "mongodb"

export async function syncApiKeyWithApisix(apiKeyId: string, keyValue: string) {
  try {
    const { db } = await connectToDatabase()
    const apiKey = await db.collection("api_keys").findOne({
      _id: new ObjectId(apiKeyId),
    })

    if (!apiKey) return

    const consumerId = `user-${apiKey.userId}`
    await createApisixConsumer(consumerId, keyValue)

    await db.collection("api_keys").updateOne(
      { _id: new ObjectId(apiKeyId) },
      {
        $set: {
          "apisix.consumer": consumerId,
          "apisix.key": keyValue,
        },
      },
    )
  } catch (error) {
    console.error("Error syncing API key to APISIX:", error)
  }
}

export async function syncApiEndpointsWithApisix(apiId: string) {
  try {
    const { db } = await connectToDatabase()

    const api = await db.collection("apis").findOne({
      _id: new ObjectId(apiId),
    })

    if (!api) return

    const endpoints = await db.collection("endpoints").find({ apiId }).toArray()

    const serviceName = `api-${apiId}`
    const upstreamUrl = process.env.API_UPSTREAM_URL || "http://localhost:3001"

    await createApisixService(serviceName, upstreamUrl)

    for (const endpoint of endpoints) {
      const routeId = `route-${endpoint._id}`
      const methods = [endpoint.method]

      await createApisixRoute(routeId, serviceName, endpoint.path, methods)

      await db.collection("endpoints").updateOne({ _id: endpoint._id }, { $set: { "apisix.routeId": routeId } })
    }

    await db.collection("apis").updateOne({ _id: new ObjectId(apiId) }, { $set: { "apisix.serviceId": serviceName } })
  } catch (error) {
    console.error("Error syncing API endpoints to APISIX:", error)
  }
}

export async function revokeApiKeyFromApisix(keyHash: string) {
  try {
    const { db } = await connectToDatabase()
    const apiKey = await db.collection("api_keys").findOne({ keyHash })

    if (apiKey?.apisix?.consumer) {
      await db.collection("api_keys").updateOne({ keyHash }, { $set: { status: "revoked" } })
    }
  } catch (error) {
    console.error("Error revoking API key:", error)
  }
}
