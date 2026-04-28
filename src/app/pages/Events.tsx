import * as React from "react";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Navigation } from "../components/Navigation";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Calendar } from "../components/ui/calendar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../components/ui/dialog";
import { Label } from "../components/ui/label";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { Calendar as CalendarIcon, MapPin, Clock, Users, ExternalLink, Plus, Trash2, Building2, User } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../contexts/AuthContext";

const eventCategories = [
  { value: "all", label: "All Events" },
  { value: "Networking", label: "Networking" },
  { value: "Career", label: "Career" },
  { value: "Workshop", label: "Workshop" },
  { value: "Academic", label: "Academic" },
  { value: "Social", label: "Social" },
];

export function Events() {
  const { session } = useAuth();
  const queryClient = useQueryClient();
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [selectedCategory, setSelectedCategory] = useState("all");
  
  // NEW: State for the "My Registered Events" toggle
  const [showOnlyRegistered, setShowOnlyRegistered] = useState(false);

  // CREATE EVENT MODAL STATES
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    authorId: "", title: "", date: "", time: "", location: "", category: "Networking", description: ""
  });

  // 1. GET CURRENT USER
  const { data: currentUser } = useQuery({
    queryKey: ['currentUser', session?.user?.id],
    queryFn: async () => {
      if (!session?.user?.id) return null;
      const { data } = await supabase.from('users').select('id, first_name, last_name').eq('auth_users_uuid', session.user.id).single();
      if (data && !formData.authorId) setFormData(prev => ({ ...prev, authorId: `user_${data.id}` }));
      return data;
    },
    enabled: !!session?.user?.id,
  });

  // 2. GET OWNED ORGANIZATIONS
  const { data: myOrganizations = [] } = useQuery({
    queryKey: ['myOwnedOrganizations', currentUser?.id],
    queryFn: async () => {
      if (!currentUser?.id) return [];
      const { data } = await supabase.from('organizations').select('id, name').eq('owner_id', currentUser.id);
      return data || [];
    },
    enabled: !!currentUser?.id,
  });

  // 3. GET EVENTS & RSVPS
  const { data: events = [], isLoading } = useQuery({
    queryKey: ['events'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('events')
        .select(`*, organizations (id, name, logo_url), users (id, first_name, last_name, profile_photo_url), event_rsvps(user_id)`)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    }
  });

  // --- MUTATIONS ---
  const saveEventMutation = useMutation({
    mutationFn: async () => {
      if (!formData.authorId || !formData.title) throw new Error("Missing required fields");
      const isUser = formData.authorId.startsWith('user_');
      const authorIdNum = parseInt(formData.authorId.replace(/^(user_|org_)/, ''));

      const { error } = await supabase.from('events').insert([{
        user_id: isUser ? authorIdNum : null,
        organization_id: !isUser ? authorIdNum : null,
        title: formData.title.trim(),
        date: formData.date.trim(),
        time: formData.time.trim(),
        location: formData.location.trim(),
        category: formData.category,
        description: formData.description.trim()
      }]);
      if (error) throw error;
    },
    onSuccess: () => {
      setIsModalOpen(false);
      setFormData({ authorId: `user_${currentUser?.id}`, title: "", date: "", time: "", location: "", category: "Networking", description: "" });
      queryClient.invalidateQueries({ queryKey: ['events'] });
    }
  });

  const deleteEventMutation = useMutation({
    mutationFn: async (id: number) => { await supabase.from('events').delete().eq('id', id); },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['events'] })
  });

  const rsvpMutation = useMutation({
    mutationFn: async ({ eventId, isAttending }: { eventId: number, isAttending: boolean }) => {
      if (!currentUser?.id) return;
      if (isAttending) {
        await supabase.from('event_rsvps').delete().eq('event_id', eventId).eq('user_id', currentUser.id);
      } else {
        await supabase.from('event_rsvps').insert({ event_id: eventId, user_id: currentUser.id });
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['events'] })
  });

  // FILTER LOGIC
  const filteredEvents = events.filter((event: any) => {
    // 1. Filter by category
    if (selectedCategory !== "all" && event.category !== selectedCategory) return false;
    
    // 2. Filter by Registered status
    if (showOnlyRegistered) {
      const isAttending = event.event_rsvps?.some((rsvp: any) => rsvp.user_id === currentUser?.id);
      if (!isAttending) return false;
    }
    
    return true;
  });

  const upcomingEvents = filteredEvents;

  return (
    <div className="min-h-screen bg-muted/30 pb-20 lg:pb-0">
      <Navigation />

      <div className="container max-w-7xl mx-auto px-4 py-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">Events</h1>
            <p className="text-muted-foreground">Stay connected with campus events, workshops, and networking opportunities</p>
          </div>
          <Button onClick={() => setIsModalOpen(true)} className="rounded-full px-6 gap-2 shadow-sm shrink-0">
            <Plus className="h-5 w-5" /> Create Event
          </Button>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-wrap gap-2">
                  {eventCategories.map((cat) => (
                    <Button key={cat.value} variant={selectedCategory === cat.value ? "default" : "outline"} size="sm" onClick={() => setSelectedCategory(cat.value)}>
                      {cat.label}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Tabs defaultValue="upcoming">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="upcoming">
                  {showOnlyRegistered ? "Registered Events" : "Upcoming"} ({upcomingEvents.length})
                </TabsTrigger>
                <TabsTrigger value="past">Past Events (0)</TabsTrigger>
              </TabsList>

              <TabsContent value="upcoming" className="space-y-4 mt-4">
                {isLoading ? (
                  <div className="text-center py-10 text-muted-foreground">Loading events...</div>
                ) : upcomingEvents.length === 0 ? (
                  <div className="text-center py-10 bg-card rounded-xl border border-border">
                    {showOnlyRegistered ? "You haven't registered for any events yet." : "No events found."}
                  </div>
                ) : (
                  upcomingEvents.map((event: any) => {
                    const isUserPost = !!event.user_id;
                    const isOwner = isUserPost ? event.user_id === currentUser?.id : myOrganizations.some((org: any) => org.id === event.organization_id);
                    const authorName = isUserPost ? `${event.users?.first_name} ${event.users?.last_name}` : event.organizations?.name;
                    const avatarUrl = isUserPost ? event.users?.profile_photo_url : event.organizations?.logo_url;
                    
                    const isAttending = event.event_rsvps?.some((rsvp: any) => rsvp.user_id === currentUser?.id);
                    const attendeeCount = event.event_rsvps?.length || 0;

                    return (
                      <Card key={event.id} className="overflow-visible relative group">
                        {isOwner && (
                          <Button variant="destructive" size="icon" className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity z-10" onClick={() => { if(window.confirm("Delete this event?")) deleteEventMutation.mutate(event.id); }}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                        <CardHeader>
                          <div className="flex items-start justify-between mb-2">
                            <Badge variant="secondary">{event.category}</Badge>
                          </div>
                          <CardTitle className="text-2xl pr-8">{event.title}</CardTitle>
                          <CardDescription className="text-base flex items-center gap-2 mt-1">
                            <Avatar className="h-6 w-6 border bg-white">
                              <AvatarImage src={avatarUrl} className="object-cover" />
                              <AvatarFallback className="bg-primary/10 text-primary text-[10px]">{isUserPost ? <User className="h-3 w-3"/> : <Building2 className="h-3 w-3"/>}</AvatarFallback>
                            </Avatar>
                            Organized by {authorName}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <p className="text-foreground">{event.description}</p>
                          <div className="grid sm:grid-cols-2 gap-3">
                            <div className="flex items-center gap-2 text-sm"><CalendarIcon className="h-4 w-4 text-muted-foreground" /><span>{event.date}</span></div>
                            <div className="flex items-center gap-2 text-sm"><Clock className="h-4 w-4 text-muted-foreground" /><span>{event.time}</span></div>
                            <div className="flex items-center gap-2 text-sm"><MapPin className="h-4 w-4 text-muted-foreground" /><span>{event.location}</span></div>
                            <div className="flex items-center gap-2 text-sm"><Users className="h-4 w-4 text-muted-foreground" /><span>{attendeeCount} attending</span></div>
                          </div>
                        </CardContent>
                        <CardFooter className="gap-2">
                          <Button className="flex-1" variant={isAttending ? "secondary" : "default"} onClick={() => rsvpMutation.mutate({ eventId: event.id, isAttending })}>
                            {isAttending ? "Cancel RSVP" : "Register"}
                          </Button>
                        </CardFooter>
                      </Card>
                    );
                  })
                )}
              </TabsContent>
              <TabsContent value="past" className="mt-4"><div className="text-center py-10 bg-card rounded-xl border border-border">No past events.</div></TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader><CardTitle>Calendar</CardTitle></CardHeader>
              <CardContent><Calendar mode="single" selected={date} onSelect={setDate} className="rounded-md" /></CardContent>
            </Card>
            
            <Card>
              <CardHeader><CardTitle>Quick Actions</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                <Button className="w-full justify-start gap-2" variant="outline" onClick={() => setIsModalOpen(true)}>
                  <CalendarIcon className="h-4 w-4" />Create Event
                </Button>
                
                {/* UPDATED: Toggle Registered Events */}
                <Button 
                  className="w-full justify-start gap-2" 
                  variant={showOnlyRegistered ? "default" : "outline"} 
                  onClick={() => setShowOnlyRegistered(!showOnlyRegistered)}
                >
                  <Users className="h-4 w-4" />
                  {showOnlyRegistered ? "View All Events" : "My Registered Events"}
                </Button>
                
                {/* UPDATED: Link to the official campus calendar. */}
                <Button className="w-full justify-start gap-2" variant="outline" asChild>
                  <a href="https://www.montevallo.edu/campus-life/campus-events/university-calendar/" target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4" />Campus Calendar
                  </a>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* CREATE EVENT MODAL */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[550px] rounded-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="text-xl">Create Event</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Hosting as <span className="text-destructive">*</span></Label>
              <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-medium" value={formData.authorId} onChange={(e) => setFormData({...formData, authorId: e.target.value})}>
                <option value={`user_${currentUser?.id}`}>Myself ({currentUser?.first_name} {currentUser?.last_name})</option>
                {myOrganizations.map((org: any) => <option key={org.id} value={`org_${org.id}`}>{org.name}</option>)}
              </select>
            </div>
            <div className="space-y-2"><Label>Event Title <span className="text-destructive">*</span></Label><Input value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Date</Label><Input placeholder="e.g. March 15, 2025" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} /></div>
              <div className="space-y-2"><Label>Time</Label><Input placeholder="e.g. 6:00 PM - 9:00 PM" value={formData.time} onChange={(e) => setFormData({ ...formData, time: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Location</Label><Input placeholder="e.g. Alumni Hall" value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} /></div>
              <div className="space-y-2">
                <Label>Category</Label>
                <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})}>
                  {eventCategories.filter(c => c.value !== 'all').map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
            </div>
            <div className="space-y-2"><Label>Description</Label><Textarea className="min-h-[100px]" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" className="rounded-full px-6" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button className="rounded-full px-8 font-semibold" onClick={() => saveEventMutation.mutate()} disabled={!formData.title.trim() || saveEventMutation.isPending}>
              {saveEventMutation.isPending ? "Saving..." : "Create Event"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}