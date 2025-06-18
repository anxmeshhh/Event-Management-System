import { type NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { executeQuery } from "@/lib/db"

export async function POST(request: NextRequest) {
  try {
    const user = await getSession()
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { title, description, eventDate, eventTime, location, maxCapacity } = await request.json()

    if (!title || !description || !eventDate || !eventTime || !location || !maxCapacity) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 })
    }

    await executeQuery(
      "INSERT INTO events (title, description, event_date, event_time, location, max_capacity, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [title, description, eventDate, eventTime, location, maxCapacity, user.id],
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Create event error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
