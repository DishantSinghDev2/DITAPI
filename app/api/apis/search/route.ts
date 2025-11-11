import { getDatabase } from "@/lib/db"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(req: NextRequest) {
  try {
    const db = await getDatabase()
    const searchParams = req.nextUrl.searchParams
    const query = searchParams.get("q") || ""
    const category = searchParams.get("category")
    const sortBy = searchParams.get("sortBy") || "rating"
    const limit = Math.min(Number.parseInt(searchParams.get("limit") || "50"), 100)
    const skip = Number.parseInt(searchParams.get("skip") || "0")

    // Build MongoDB search pipeline
    const pipeline: any[] = [
      {
        $match: {
          status: "active",
          ...(query && {
            $text: { $search: query },
          }),
          ...(category && { category }),
        },
      },
      {
        $lookup: {
          from: "api_scores",
          localField: "_id",
          foreignField: "apiId",
          as: "score",
        },
      },
      {
        $unwind: {
          path: "$score",
          preserveNullAndEmptyArrays: true,
        },
      },
    ]

    // Sorting options
    const sortStages: Record<string, any> = {
      rating: { "score.overallScore": -1 },
      newest: { createdAt: -1 },
      popular: { "score.totalRequests": -1 },
      trending: { "score.reliability": -1 },
    }

    pipeline.push({ $sort: sortStages[sortBy] || sortStages.rating })
    pipeline.push({ $skip: skip })
    pipeline.push({ $limit: limit })

    const results = await db.collection("apis").aggregate(pipeline).toArray()
    const total = await db.collection("apis").countDocuments({
      status: "active",
      ...(query && { $text: { $search: query } }),
      ...(category && { category }),
    })

    return NextResponse.json({
      data: results,
      total,
      skip,
      limit,
      hasMore: skip + limit < total,
    })
  } catch (error) {
    console.error("[v0] Search error:", error)
    return NextResponse.json({ error: "Search failed" }, { status: 500 })
  }
}
