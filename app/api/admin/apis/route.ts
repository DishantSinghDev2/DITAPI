import { auth } from "@/lib/auth"
import { getDatabase } from "@/lib/db"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session || session.user.role !== "admin") return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const db = await getDatabase()
    const searchParams = request.nextUrl.searchParams
    const search = searchParams.get("search") || ""
    const status = searchParams.get("status") || "all"

    const query: any = {}

    if (search) {
      query.name = { $regex: search, $options: "i" }
    }

    if (status !== "all") {
      query.status = status
    }

    const apis = await db
      .collection("apis")
      .aggregate([
        { $match: query },
        {
          $lookup: {
            from: "users",
            localField: "organizationId",
            foreignField: "_id",
            as: "provider",
          },
        },
        {
          $lookup: {
            from: "subscriptions",
            localField: "_id",
            foreignField: "apiId",
            as: "subscribers",
          },
        },
        {
          $project: {
            name: 1,
            status: 1,
            provider: { $arrayElemAt: ["$provider", 0] },
            subscriberCount: { $size: "$subscribers" },
            monthlyRequests: 50000,
          },
        },
        { $sort: { createdAt: -1 } },
        { $limit: 100 },
      ])
      .toArray()

    return NextResponse.json(apis)
  } catch (error) {
    console.error("Error fetching admin APIs:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
