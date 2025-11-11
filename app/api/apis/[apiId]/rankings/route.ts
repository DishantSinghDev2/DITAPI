import { getDatabase } from "@/lib/db"
import { ObjectId } from "mongodb"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(req: NextRequest, { params }: { params: { apiId: string } }) {
  try {
    const db = await getDatabase()
    const apiId = new ObjectId(params.apiId)

    // Calculate API score from ratings and usage
    const [ratings, usage, api] = await Promise.all([
      db.collection("ratings").find({ apiId }).toArray(),
      db.collection("usage").find({ apiId }).toArray(),
      db.collection("apis").findOne({ _id: apiId }),
    ])

    const avgRating = ratings.length > 0 ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length : 0

    // Calculate reliability (% of successful requests)
    const totalRequests = usage.reduce((sum, u) => sum + u.requestCount, 0)
    const successfulRequests = usage.reduce((sum, u) => sum + (u.statusCodes["200"] || u.statusCodes["201"] || 0), 0)
    const reliability = totalRequests > 0 ? (successfulRequests / totalRequests) * 100 : 100

    // Calculate response time score (lower is better)
    const avgResponseTime = usage.length > 0 ? usage.reduce((sum, u) => sum + u.avgResponseTime, 0) / usage.length : 0
    const responseTimeScore = Math.max(0, 100 - avgResponseTime / 10)

    // Calculate documentation score (0-100)
    const docLength = api?.documentation?.length || 0
    const docScore = Math.min(100, (docLength / 5000) * 100)

    // Calculate features score (based on endpoints)
    const endpointCount = api?.endpoints?.length || 0
    const featureScore = Math.min(100, (endpointCount / 20) * 100)

    const overallScore =
      (avgRating * 20 + reliability * 0.3 + responseTimeScore * 0.25 + docScore * 0.15 + featureScore * 0.1) / 100

    const scoreData = {
      apiId,
      rating: avgRating,
      ratingCount: ratings.length,
      reliability: Number.parseFloat(reliability.toFixed(2)),
      responseTime: Number.parseFloat(avgResponseTime.toFixed(2)),
      documentation: Number.parseFloat(docScore.toFixed(2)),
      features: Number.parseFloat(featureScore.toFixed(2)),
      overallScore: Number.parseFloat(overallScore.toFixed(2)),
      totalRequests,
      lastUpdated: new Date(),
    }

    // Update or create score
    await db.collection("api_scores").updateOne({ apiId }, { $set: scoreData }, { upsert: true })

    return NextResponse.json(scoreData)
  } catch (error) {
    console.error("[v0] Ranking error:", error)
    return NextResponse.json({ error: "Failed to get ranking" }, { status: 500 })
  }
}
