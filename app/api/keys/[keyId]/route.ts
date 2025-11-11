import { connectToDatabase } from "@/lib/db"
import { type NextRequest, NextResponse } from "next/server"
import { ObjectId } from "mongodb"
import { revokeApiKeyFromApisix } from "@/lib/apisix-sync"

export async function DELETE(request: NextRequest, { params }: { params: { keyId: string } }) {
  try {
    const { db } = await connectToDatabase()
    const apiKey = await db.collection("api_keys").findOne({
      _id: new ObjectId(params.keyId),
    })

    if (!apiKey) {
      return NextResponse.json({ error: "Key not found" }, { status: 404 })
    }

    // Revoke from APISIX
    await revokeApiKeyFromApisix(apiKey.keyHash)

    // Update database
    await db.collection("api_keys").updateOne({ _id: new ObjectId(params.keyId) }, { $set: { status: "revoked" } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error revoking key:", error)
    return NextResponse.json({ error: "Failed to revoke key" }, { status: 500 })
  }
}
