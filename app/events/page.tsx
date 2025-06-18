import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, MapPin, Users } from "lucide-react"
import Link from "next/link"
import { executeQuery } from "@/lib/db"
import { getSession } from "@/lib/session"
import { redirect } from "next/navigation"

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

async function getAllEvents(userId?: number): Promise<Event[]> {
  try {
    const result = (await executeQuery(
      `
      SELECT e.*, 
             COALESCE(COUNT(r.id), 0) as current_registrations,
             CASE WHEN ur.user_id IS NOT NULL THEN true ELSE false END as is_registered
      FROM events e
      LEFT JOIN registrations r ON e.id = r.event_id AND r.status = 'confirmed'
      LEFT JOIN registrations ur ON e.id = ur.event_id AND ur.user_id = ? AND ur.status = 'confirmed'
      WHERE e.event_date >= CURDATE()
      GROUP BY e.id, ur.user_id
      ORDER BY e.event_date, e.event_time
    `,
      [userId || 0],
    )) as Event[]

    return result
  } catch (error) {
    console.error("Error fetching events:", error)
    return []
  }
}

export default async function EventsPage() {
  const user = await getSession()

  if (!user) {
    redirect("/auth/signin")
  }

  const events = await getAllEvents(user.id)

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">All Events</h1>
            <p className="text-gray-600 mt-2">Discover and register for upcoming events</p>
          </div>
          <Button asChild>
            <Link href="/">← Back to Home</Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => (
            <Card key={event.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{event.title}</CardTitle>
                  {event.is_registered && <Badge variant="secondary">Registered</Badge>}
                </div>
                <CardDescription className="line-clamp-3">{event.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm text-gray-600 mb-4">
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

                <div className="flex gap-2">
                  <Button asChild variant="outline" className="flex-1">
                    <Link href={`/events/${event.id}`}>View Details</Link>
                  </Button>
                  {!event.is_registered && event.current_registrations < event.max_capacity && (
                    <Button asChild className="flex-1">
                      <Link href={`/events/${event.id}/register`}>Register</Link>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {events.length === 0 && (
          <div className="text-center py-12">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No events found</h3>
            <p className="text-gray-600">Check back later for new events!</p>
          </div>
        )}
      </div>
    </div>
  )
}
