import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const search = searchParams.get("search") || ""
    const category = searchParams.get("category") || ""
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = 12

    const db = await getDatabase()

    const query: any = { status: "active" }

    if (search) {
      query.$or = [{ name: { $regex: search, $options: "i" } }, { description: { $regex: search, $options: "i" } }]
    }

    const skip = (page - 1) * limit
    const apis = await db.collection("apis").find(query).skip(skip).limit(limit).toArray()

    const total = await db.collection("apis").countDocuments(query)

    // Fetch plans for each API
    const apisWithPlans = await Promise.all(
      apis.map(async (api) => {
        const plans = await db.collection("plans").find({ apiId: api._id, status: "active" }).toArray()
        return { ...api, plans }
      }),
    )

    return NextResponse.json({
      apis: apisWithPlans,
      total,
      pages: Math.ceil(total / limit),
      currentPage: page,
    })
  } catch (error) {
    console.error("Marketplace search error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
