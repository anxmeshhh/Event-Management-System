import { type NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { executeQuery } from "@/lib/db"

export async function POST(request: NextRequest) {
  try {
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { eventId } = await request.json()

    if (!eventId) {
      return NextResponse.json({ error: "Event ID is required" }, { status: 400 })
    }

    // Check if event exists and has capacity
    const eventResult = (await executeQuery(
      `
      SELECT e.*, COALESCE(COUNT(r.id), 0) as current_registrations
      FROM events e
      LEFT JOIN registrations r ON e.id = r.event_id AND r.status = 'confirmed'
      WHERE e.id = ?
      GROUP BY e.id
    `,
      [eventId],
    )) as any[]

    if (eventResult.length === 0) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    const event = eventResult[0]
    if (event.current_registrations >= event.max_capacity) {
      return NextResponse.json({ error: "Event is full" }, { status: 400 })
    }

    // Check if user is already registered
    const existingRegistration = (await executeQuery(
      "SELECT id FROM registrations WHERE user_id = ? AND event_id = ?",
      [user.id, eventId],
    )) as any[]

    if (existingRegistration.length > 0) {
      return NextResponse.json({ error: "Already registered for this event" }, { status: 400 })
    }

    // Register user for event
    await executeQuery("INSERT INTO registrations (user_id, event_id, status) VALUES (?, ?, ?)", [
      user.id,
      eventId,
      "confirmed",
    ])

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Registration error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
