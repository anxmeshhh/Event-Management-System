import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, MapPin, Users, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { executeQuery } from "@/lib/db"
import { getSession } from "@/lib/session"
import { redirect, notFound } from "next/navigation"

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

export default async function EventDetailPage({
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

  const eventDate = new Date(event.event_date)
  const isEventFull = event.current_registrations >= event.max_capacity

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Button asChild variant="outline">
            <Link href="/events">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Events
            </Link>
          </Button>
        </div>

        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-2xl mb-2">{event.title}</CardTitle>
                <div className="flex flex-wrap gap-2 mb-4">
                  {event.is_registered && <Badge variant="secondary">You're Registered</Badge>}
                  {isEventFull && <Badge variant="destructive">Event Full</Badge>}
                </div>
              </div>
            </div>
            <CardDescription className="text-base">{event.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Event Details</h3>
                <div className="space-y-3">
                  <div className="flex items-center">
                    <Calendar className="h-5 w-5 mr-3 text-gray-500" />
                    <div>
                      <p className="font-medium">Date & Time</p>
                      <p className="text-gray-600">
                        {eventDate.toLocaleDateString("en-US", {
                          weekday: "long",
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </p>
                      <p className="text-gray-600">{event.event_time}</p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <MapPin className="h-5 w-5 mr-3 text-gray-500" />
                    <div>
                      <p className="font-medium">Location</p>
                      <p className="text-gray-600">{event.location}</p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <Users className="h-5 w-5 mr-3 text-gray-500" />
                    <div>
                      <p className="font-medium">Capacity</p>
                      <p className="text-gray-600">
                        {event.current_registrations} / {event.max_capacity} registered
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Registration</h3>
                {event.is_registered ? (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <p className="text-green-800 font-medium">✓ You're registered for this event!</p>
                    <p className="text-green-600 text-sm mt-1">You'll receive event updates and reminders via email.</p>
                  </div>
                ) : isEventFull ? (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-red-800 font-medium">This event is currently full</p>
                    <p className="text-red-600 text-sm mt-1">Check back later or contact us to join the waitlist.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <p className="text-gray-600">
                      Secure your spot at this event. Registration is free and takes just a moment.
                    </p>
                    <Button asChild size="lg" className="w-full">
                      <Link href={`/events/${event.id}/register`}>Register for Event</Link>
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
