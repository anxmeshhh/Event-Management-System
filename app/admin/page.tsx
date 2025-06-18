import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, Users, Plus, Edit } from "lucide-react"
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
}

async function getAdminEvents(): Promise<Event[]> {
  try {
    const result = (await executeQuery(`
      SELECT e.*, 
             COALESCE(COUNT(r.id), 0) as current_registrations
      FROM events e
      LEFT JOIN registrations r ON e.id = r.event_id AND r.status = 'confirmed'
      GROUP BY e.id
      ORDER BY e.event_date, e.event_time
    `)) as Event[]

    return result
  } catch (error) {
    console.error("Error fetching admin events:", error)
    return []
  }
}

export default async function AdminDashboard() {
  const user = await getSession()

  if (!user || user.role !== "admin") {
    redirect("/")
  }

  const events = await getAdminEvents()

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-gray-600 mt-2">Manage events and registrations</p>
          </div>
          <div className="flex gap-4">
            <Button asChild>
              <Link href="/">← Back to Home</Link>
            </Button>
            <Button asChild>
              <Link href="/admin/events/new">
                <Plus className="h-4 w-4 mr-2" />
                Create Event
              </Link>
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Events</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{events.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Registrations</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {events.reduce((sum, event) => sum + event.current_registrations, 0)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Upcoming Events</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {events.filter((event) => new Date(event.event_date) >= new Date()).length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Events List */}
        <Card>
          <CardHeader>
            <CardTitle>All Events</CardTitle>
            <CardDescription>Manage your events and view registration details</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {events.map((event) => {
                const eventDate = new Date(event.event_date)
                const isPastEvent = eventDate < new Date()
                const isEventFull = event.current_registrations >= event.max_capacity

                return (
                  <div key={event.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold">{event.title}</h3>
                        {isPastEvent && <Badge variant="secondary">Past</Badge>}
                        {isEventFull && <Badge variant="destructive">Full</Badge>}
                      </div>
                      <p className="text-sm text-gray-600 mb-2 line-clamp-1">{event.description}</p>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span>
                          {eventDate.toLocaleDateString()} at {event.event_time}
                        </span>
                        <span>{event.location}</span>
                        <span>
                          {event.current_registrations}/{event.max_capacity} registered
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/admin/events/${event.id}`}>
                          <Edit className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/admin/events/${event.id}/registrations`}>
                          <Users className="h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>

            {events.length === 0 && (
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No events yet</h3>
                <p className="text-gray-600 mb-4">Create your first event to get started.</p>
                <Button asChild>
                  <Link href="/admin/events/new">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Event
                  </Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
