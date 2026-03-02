import { Navigation } from "../components/Navigation";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Calendar } from "../components/ui/calendar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import {
  Calendar as CalendarIcon,
  MapPin,
  Clock,
  Users,
  Share2,
  ExternalLink,
} from "lucide-react";
import { useState } from "react";

const mockEvents = {
  upcoming: [
    {
      id: 1,
      title: "Annual Falcon Networking Mixer",
      date: "March 15, 2025",
      time: "6:00 PM - 9:00 PM",
      location: "Alumni Hall",
      organizer: "Alumni Association",
      attendees: 127,
      category: "Networking",
      description: "Connect with successful alumni across various industries. Food and refreshments provided.",
      image: "https://images.unsplash.com/photo-1511578314322-379afb476865?w=600",
    },
    {
      id: 2,
      title: "Spring Career Fair 2025",
      date: "February 20, 2025",
      time: "10:00 AM - 4:00 PM",
      location: "University Center",
      organizer: "Career Services",
      attendees: 234,
      category: "Career",
      description: "Meet with 50+ employers looking to hire Montevallo students for internships and full-time positions.",
      image: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600",
    },
    {
      id: 3,
      title: "Tech Talk: AI in Modern Applications",
      date: "February 10, 2025",
      time: "3:00 PM - 4:30 PM",
      location: "CS Department, Room 201",
      organizer: "CS Student Association",
      attendees: 45,
      category: "Workshop",
      description: "Guest speaker from Microsoft will discuss practical applications of AI in software development.",
      image: "https://images.unsplash.com/photo-1591115765373-5207764f72e7?w=600",
    },
    {
      id: 4,
      title: "Study Abroad Information Session",
      date: "February 25, 2025",
      time: "5:00 PM - 6:30 PM",
      location: "Palmer Hall",
      organizer: "International Programs",
      attendees: 68,
      category: "Academic",
      description: "Learn about study abroad opportunities for Summer and Fall 2025.",
      image: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=600",
    },
  ],
  past: [
    {
      id: 5,
      title: "Hackathon 2024",
      date: "November 15, 2024",
      time: "9:00 AM - 9:00 PM",
      location: "Innovation Lab",
      organizer: "CS Department",
      attendees: 82,
      category: "Competition",
      description: "24-hour coding competition with prizes for top 3 teams.",
    },
  ],
};

const eventCategories = [
  { value: "all", label: "All Events", color: "default" },
  { value: "networking", label: "Networking", color: "default" },
  { value: "career", label: "Career", color: "secondary" },
  { value: "workshop", label: "Workshop", color: "default" },
  { value: "academic", label: "Academic", color: "outline" },
  { value: "social", label: "Social", color: "default" },
];

export function Events() {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [selectedCategory, setSelectedCategory] = useState("all");

  return (
    <div className="min-h-screen bg-muted/30 pb-20 lg:pb-0">
      <Navigation />

      <div className="container max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Events</h1>
          <p className="text-muted-foreground">
            Stay connected with campus events, workshops, and networking opportunities
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Category Filters */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-wrap gap-2">
                  {eventCategories.map((category) => (
                    <Button
                      key={category.value}
                      variant={selectedCategory === category.value ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedCategory(category.value)}
                    >
                      {category.label}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Events Tabs */}
            <Tabs defaultValue="upcoming">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="upcoming">
                  Upcoming ({mockEvents.upcoming.length})
                </TabsTrigger>
                <TabsTrigger value="past">
                  Past Events ({mockEvents.past.length})
                </TabsTrigger>
              </TabsList>

              {/* Upcoming Events */}
              <TabsContent value="upcoming" className="space-y-4 mt-4">
                {mockEvents.upcoming.map((event) => (
                  <Card key={event.id} className="overflow-hidden">
                    {event.image && (
                      <div className="h-48 overflow-hidden">
                        <img
                          src={event.image}
                          alt={event.title}
                          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    )}
                    <CardHeader>
                      <div className="flex items-start justify-between mb-2">
                        <Badge>{event.category}</Badge>
                        <Button variant="ghost" size="icon">
                          <Share2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <CardTitle className="text-2xl">{event.title}</CardTitle>
                      <CardDescription className="text-base">
                        Organized by {event.organizer}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-foreground">{event.description}</p>
                      <div className="grid sm:grid-cols-2 gap-3">
                        <div className="flex items-center gap-2 text-sm">
                          <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                          <span>{event.date}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span>{event.time}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span>{event.location}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span>{event.attendees} attending</span>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="gap-2">
                      <Button className="flex-1">Register</Button>
                      <Button variant="outline">Learn More</Button>
                    </CardFooter>
                  </Card>
                ))}
              </TabsContent>

              {/* Past Events */}
              <TabsContent value="past" className="space-y-4 mt-4">
                {mockEvents.past.map((event) => (
                  <Card key={event.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between mb-2">
                        <Badge variant="outline">{event.category}</Badge>
                      </div>
                      <CardTitle className="text-xl">{event.title}</CardTitle>
                      <CardDescription>Organized by {event.organizer}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-foreground">{event.description}</p>
                      <div className="grid sm:grid-cols-2 gap-3">
                        <div className="flex items-center gap-2 text-sm">
                          <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                          <span>{event.date}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span>{event.time}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span>{event.location}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span>{event.attendees} attended</span>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Button variant="outline" className="w-full">
                        View Recap
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Calendar */}
            <Card>
              <CardHeader>
                <CardTitle>Calendar</CardTitle>
              </CardHeader>
              <CardContent>
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  className="rounded-md"
                />
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button className="w-full justify-start gap-2" variant="outline">
                  <CalendarIcon className="h-4 w-4" />
                  Create Event
                </Button>
                <Button className="w-full justify-start gap-2" variant="outline">
                  <Users className="h-4 w-4" />
                  My Registered Events
                </Button>
                <Button className="w-full justify-start gap-2" variant="outline">
                  <ExternalLink className="h-4 w-4" />
                  Campus Calendar
                </Button>
              </CardContent>
            </Card>

            {/* Trending Events */}
            <Card>
              <CardHeader>
                <CardTitle>Trending Events</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {mockEvents.upcoming.slice(0, 3).map((event) => (
                  <button
                    key={event.id}
                    className="w-full text-left p-3 rounded-lg hover:bg-accent transition-colors"
                  >
                    <p className="font-medium text-sm mb-1">{event.title}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <CalendarIcon className="h-3 w-3" />
                      <span>{event.date}</span>
                    </div>
                  </button>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
