import { EventRegistrationForm } from "@/components/events/registration-form"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Calendar, MapPin, Users } from "lucide-react"
import Link from "next/link"
import { getSession } from "@/lib/session"
import { redirect, notFound } from "next/navigation"
import { executeQuery } from "@/lib/db"

interface Event {
  id: number
  title: string
  description: string
  event_date: string
  event_time: string
  location: string
  max_capacity: number
  current_registrations: number
  is_registered: boolean
}

async function getEvent(eventId: number, userId?: number): Promise<Event | null> {
  try {
    const result = (await executeQuery(
      `
      SELECT e.*, 
             COALESCE(COUNT(r.id), 0) as current_registrations,
             CASE WHEN ur.user_id IS NOT NULL THEN true ELSE false END as is_registered
      FROM events e
      LEFT JOIN registrations r ON e.id = r.event_id AND r.status = 'confirmed'
      LEFT JOIN registrations ur ON e.id = ur.event_id AND ur.user_id = ? AND ur.status = 'confirmed'
      WHERE e.id = ?
      GROUP BY e.id, ur.user_id
    `,
      [userId || 0, eventId],
    )) as Event[]

    return result[0] || null
  } catch (error) {
    console.error("Error fetching event:", error)
    return null
  }
}

export default async function EventRegistrationPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const user = await getSession()

  if (!user) {
    redirect("/auth/signin")
  }

  const event = await getEvent(Number.parseInt(id), user.id)

  if (!event) {
    notFound()
  }

  if (event.is_registered) {
    redirect(`/events/${id}`)
  }

  const isEventFull = event.current_registrations >= event.max_capacity

  if (isEventFull) {
    redirect(`/events/${id}`)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Button asChild variant="outline">
            <Link href={`/events/${id}`}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Event
            </Link>
          </Button>
        </div>

        <div className="space-y-6">
          {/* Event Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Event Registration</CardTitle>
              <CardDescription>Complete your registration for this event</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <h3 className="font-semibold text-lg">{event.title}</h3>
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-2" />
                    {new Date(event.event_date).toLocaleDateString()} at {event.event_time}
                  </div>
                  <div className="flex items-center">
                    <MapPin className="h-4 w-4 mr-2" />
                    {event.location}
                  </div>
                  <div className="flex items-center">
                    <Users className="h-4 w-4 mr-2" />
                    {event.current_registrations}/{event.max_capacity} registered
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Registration Form */}
          <EventRegistrationForm event={event} user={user} />
        </div>
      </div>
    </div>
  )
}
