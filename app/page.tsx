import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar, MapPin, Users, Clock } from "lucide-react"
import Link from "next/link"
import { executeQuery } from "@/lib/db"
import { getSession } from "@/lib/session"

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

async function getUpcomingEvents(): Promise<Event[]> {
  try {
    console.log("🔍 Starting to fetch events...")

    // First, let's try a simple query without date filtering
    const allEvents = (await executeQuery("SELECT * FROM events")) as Event[]
    console.log("📊 Total events in database:", allEvents.length)
    console.log("📅 All events:", allEvents)

    // Now try with date filtering
    const query = `
      SELECT e.*, 
             COALESCE(COUNT(r.id), 0) as current_registrations
      FROM events e
      LEFT JOIN registrations r ON e.id = r.event_id AND r.status = 'confirmed'
      WHERE e.event_date >= CURDATE()
      GROUP BY e.id, e.title, e.description, e.event_date, e.event_time, e.location, e.max_capacity
      ORDER BY e.event_date, e.event_time
      LIMIT 6
    `

    console.log("🔍 Executing query:", query)
    const result = (await executeQuery(query)) as Event[]
    console.log("✅ Query result:", result)
    console.log("📈 Number of upcoming events:", result.length)

    return result
  } catch (error) {
    console.error("❌ Error fetching events:", error)
    return []
  }
}

export default async function HomePage() {
  const events = await getUpcomingEvents()
  const user = await getSession()

  console.log("🏠 HomePage rendering with events:", events.length)

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <Calendar className="h-8 w-8 text-indigo-600 mr-3" />
              <h1 className="text-2xl font-bold text-gray-900">EventHub</h1>
            </div>
            <nav className="flex items-center space-x-4">
              {user ? (
                <>
                  <span className="text-gray-700">Welcome, {user.full_name}</span>
                  {user.role === "admin" && (
                    <Button asChild variant="outline">
                      <Link href="/admin">Admin Dashboard</Link>
                    </Button>
                  )}
                  <Button asChild>
                    <Link href="/events">My Events</Link>
                  </Button>
                </>
              ) : (
                <>
                  <Button asChild variant="outline">
                    <Link href="/auth/signin">Sign In</Link>
                  </Button>
                  <Button asChild>
                    <Link href="/auth/signup">Sign Up</Link>
                  </Button>
                </>
              )}
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-6">Discover Amazing Events</h2>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Join workshops, webinars, and seminars that will help you grow professionally and personally.
          </p>
          <Button asChild size="lg" className="bg-indigo-600 hover:bg-indigo-700">
            <Link href="/events">Browse All Events</Link>
          </Button>
        </div>
      </section>

      {/* Debug Info */}
      <section className="py-8 bg-yellow-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-yellow-100 border border-yellow-300 rounded-lg p-4">
            <h3 className="font-bold text-yellow-800">Debug Info:</h3>
            <p className="text-yellow-700">Events found: {events.length}</p>
            <p className="text-yellow-700">Database connection: {events.length >= 0 ? "✅ Working" : "❌ Failed"}</p>
          </div>
        </div>
      </section>

      {/* Upcoming Events */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h3 className="text-3xl font-bold text-gray-900 mb-8 text-center">Upcoming Events</h3>

          {events.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {events.map((event) => (
                <Card key={event.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="text-lg">{event.title}</CardTitle>
                    <CardDescription className="line-clamp-2">{event.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
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
                    <Button asChild className="w-full mt-4">
                      <Link href={`/events/${event.id}`}>View Details</Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No events found</h3>
              <p className="text-gray-600">
                Check the console for debug information or add some events to the database.
              </p>
              <div className="mt-4 p-4 bg-gray-100 rounded-lg text-left max-w-md mx-auto">
                <p className="text-sm text-gray-700 font-semibold">Troubleshooting:</p>
                <ul className="text-sm text-gray-600 mt-2 space-y-1">
                  <li>• Check browser console (F12) for errors</li>
                  <li>• Verify database connection in .env.local</li>
                  <li>• Make sure events have future dates</li>
                  <li>• Check MySQL service is running</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Features */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h3 className="text-3xl font-bold text-gray-900 mb-12 text-center">Why Choose EventHub?</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <Calendar className="h-12 w-12 text-indigo-600 mx-auto mb-4" />
              <h4 className="text-xl font-semibold mb-2">Easy Registration</h4>
              <p className="text-gray-600">Simple and quick event registration process with instant confirmation.</p>
            </div>
            <div className="text-center">
              <Clock className="h-12 w-12 text-indigo-600 mx-auto mb-4" />
              <h4 className="text-xl font-semibold mb-2">Real-time Updates</h4>
              <p className="text-gray-600">Get notified about event changes and updates in real-time.</p>
            </div>
            <div className="text-center">
              <Users className="h-12 w-12 text-indigo-600 mx-auto mb-4" />
              <h4 className="text-xl font-semibold mb-2">Community Driven</h4>
              <p className="text-gray-600">Connect with like-minded individuals and build your network.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
