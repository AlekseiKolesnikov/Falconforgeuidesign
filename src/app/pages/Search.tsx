import * as React from "react";
import { useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Search as SearchIcon, Users, Briefcase, Calendar, MessageSquare, Building2, MapPin } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../contexts/AuthContext";
import { Navigation } from "../components/Navigation";
import { Card, CardContent } from "../components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { PostCard } from "../components/PostCard"; // Reusing your existing post card!

export function Search() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q") || "";
  const { session } = useAuth();
  
  const [activeTab, setActiveTab] = useState("all");

  // 1. GET CURRENT USER (Needed for PostCard)
  const { data: currentUser } = useQuery({
    queryKey: ['currentUser', session?.user?.id],
    queryFn: async () => {
      if (!session?.user?.id) return null;
      const { data } = await supabase.from('users').select('*').eq('auth_users_uuid', session.user.id).single();
      return data;
    },
    enabled: !!session?.user?.id,
  });

  // 2. SEARCH PEOPLE
  const { data: people = [], isLoading: loadingPeople } = useQuery({
    queryKey: ['search_people', query],
    queryFn: async () => {
      if (!query) return [];
      const { data } = await supabase
        .from('users')
        .select('id, first_name, last_name, profile_photo_url, headline, location')
        .or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%,headline.ilike.%${query}%`)
        .limit(10);
      return data || [];
    },
    enabled: !!query,
  });

  // 3. SEARCH OPPORTUNITIES
  const { data: opportunities = [], isLoading: loadingOpps } = useQuery({
    queryKey: ['search_opportunities', query],
    queryFn: async () => {
      if (!query) return [];
      const { data } = await supabase
        .from('opportunities')
        .select('*, organizations(name, logo_url), users(first_name, last_name, profile_photo_url)')
        .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
        .limit(10);
      return data || [];
    },
    enabled: !!query,
  });

  // 4. SEARCH EVENTS
  const { data: events = [], isLoading: loadingEvents } = useQuery({
    queryKey: ['search_events', query],
    queryFn: async () => {
      if (!query) return [];
      const { data } = await supabase
        .from('events')
        .select('*, organizations(name, logo_url), users(first_name, last_name, profile_photo_url)')
        .or(`title.ilike.%${query}%,description.ilike.%${query}%,location.ilike.%${query}%`)
        .limit(10);
      return data || [];
    },
    enabled: !!query,
  });

  // 5. SEARCH POSTS
  const { data: posts = [], isLoading: loadingPosts } = useQuery({
    queryKey: ['search_posts', query],
    queryFn: async () => {
      if (!query) return [];
      const { data } = await supabase
        .from('posts')
        .select(`*, users(id, first_name, last_name, profile_photo_url, headline), post_likes(user_id), post_comments(id)`)
        .ilike('content', `%${query}%`)
        .order('created_at', { ascending: false })
        .limit(10);
      return data || [];
    },
    enabled: !!query,
  });

  const isLoading = loadingPeople || loadingOpps || loadingEvents || loadingPosts;

  const renderTabs = () => {
    const tabs = [
      { id: "all", label: "All Results" },
      { id: "people", label: `People (${people.length})`, icon: Users },
      { id: "opportunities", label: `Opportunities (${opportunities.length})`, icon: Briefcase },
      { id: "events", label: `Events (${events.length})`, icon: Calendar },
      { id: "posts", label: `Posts (${posts.length})`, icon: MessageSquare },
    ];

    return (
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide mb-6 border-b border-border">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`whitespace-nowrap px-4 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === tab.id 
                ? "border-primary text-primary" 
                : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/30"
            }`}
          >
            {tab.icon && <tab.icon className="h-4 w-4" />}
            {tab.label}
          </button>
        ))}
      </div>
    );
  };

  if (!query) {
    return (
      <div className="min-h-screen bg-muted/30">
        <Navigation />
        <div className="container max-w-4xl mx-auto px-4 py-20 text-center">
          <SearchIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
          <h2 className="text-2xl font-bold text-foreground mb-2">Search Falcon Forge</h2>
          <p className="text-muted-foreground">Type something in the search bar above to get started.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30 pb-20 lg:pb-0">
      <Navigation />

      <div className="container max-w-4xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground">
            Search results for "{query}"
          </h1>
        </div>

        {renderTabs()}

        {isLoading ? (
          <div className="text-center py-20 text-muted-foreground">Searching entire network...</div>
        ) : (
          <div className="space-y-8">
            
            {/* PEOPLE SECTION */}
            {(activeTab === "all" || activeTab === "people") && people.length > 0 && (
              <section>
                {activeTab === "all" && <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><Users className="h-5 w-5 text-primary" /> People</h2>}
                <Card className="shadow-sm border-border overflow-hidden">
                  <div className="divide-y divide-border">
                    {people.map((user: any) => (
                      <Link key={user.id} to={`/profile/${user.id}`} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 hover:bg-muted/50 transition-colors gap-4">
                        <div className="flex items-center gap-4 w-full sm:w-auto overflow-hidden">
                          <Avatar className="h-14 w-14 border bg-white shrink-0">
                            <AvatarImage src={user.profile_photo_url} className="object-cover" />
                            <AvatarFallback className="text-lg bg-primary/10 text-primary">{user.first_name?.[0]}{user.last_name?.[0]}</AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <h3 className="font-semibold text-foreground truncate">{user.first_name} {user.last_name}</h3>
                            <p className="text-sm text-muted-foreground truncate">{user.headline || "Student at Montevallo"}</p>
                            {user.location && <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1"><MapPin className="h-3 w-3" />{user.location}</p>}
                          </div>
                        </div>
                        <Button variant="outline" className="w-full sm:w-auto shrink-0 rounded-full">View Profile</Button>
                      </Link>
                    ))}
                  </div>
                </Card>
              </section>
            )}

            {/* OPPORTUNITIES SECTION */}
            {(activeTab === "all" || activeTab === "opportunities") && opportunities.length > 0 && (
              <section>
                {activeTab === "all" && <h2 className="text-xl font-bold mb-4 mt-8 flex items-center gap-2"><Briefcase className="h-5 w-5 text-primary" /> Opportunities</h2>}
                <div className="grid sm:grid-cols-2 gap-4">
                  {opportunities.map((job: any) => {
                    const isUserPost = !!job.user_id;
                    const authorName = isUserPost ? `${job.users?.first_name} ${job.users?.last_name}` : job.organizations?.name;
                    const avatarUrl = isUserPost ? job.users?.profile_photo_url : job.organizations?.logo_url;
                    
                    return (
                      <Card key={job.id} className="shadow-sm border-border hover:border-primary/30 transition-colors p-4 flex flex-col justify-between h-full">
                        <div>
                          <div className="flex items-start gap-3 mb-3">
                            <Avatar className="h-10 w-10 border bg-white rounded-md shrink-0">
                              <AvatarImage src={avatarUrl} className="object-cover" />
                              <AvatarFallback className="rounded-md bg-primary/10 text-primary"><Building2 className="h-5 w-5" /></AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <h4 className="font-bold text-foreground leading-tight truncate">{job.title}</h4>
                              <p className="text-sm text-primary truncate">{authorName}</p>
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-2 text-xs mb-3">
                            <Badge variant="secondary">{job.employment_type}</Badge>
                            {job.location && <Badge variant="outline"><MapPin className="h-3 w-3 mr-1" />{job.location}</Badge>}
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-2 mb-4">{job.description}</p>
                        </div>
                        <Button variant="outline" className="w-full rounded-full" asChild>
                          <Link to="/opportunities">View Board</Link>
                        </Button>
                      </Card>
                    );
                  })}
                </div>
              </section>
            )}

            {/* EVENTS SECTION */}
            {(activeTab === "all" || activeTab === "events") && events.length > 0 && (
              <section>
                {activeTab === "all" && <h2 className="text-xl font-bold mb-4 mt-8 flex items-center gap-2"><Calendar className="h-5 w-5 text-primary" /> Events</h2>}
                <div className="grid sm:grid-cols-2 gap-4">
                  {events.map((event: any) => (
                    <Card key={event.id} className="shadow-sm border-border p-4 flex flex-col">
                      <Badge className="w-fit mb-2">{event.category}</Badge>
                      <h4 className="font-bold text-lg leading-tight mb-2">{event.title}</h4>
                      <div className="space-y-1.5 text-sm text-muted-foreground mb-4 flex-1">
                        <div className="flex items-center gap-2"><Calendar className="h-4 w-4" /> {event.date} • {event.time}</div>
                        <div className="flex items-center gap-2"><MapPin className="h-4 w-4" /> {event.location}</div>
                      </div>
                      <Button className="w-full rounded-full" asChild>
                        <Link to="/events">Go to Events</Link>
                      </Button>
                    </Card>
                  ))}
                </div>
              </section>
            )}

            {/* POSTS SECTION */}
            {(activeTab === "all" || activeTab === "posts") && posts.length > 0 && (
              <section>
                {activeTab === "all" && <h2 className="text-xl font-bold mb-4 mt-8 flex items-center gap-2"><MessageSquare className="h-5 w-5 text-primary" /> Posts</h2>}
                <div className="space-y-4">
                  {posts.map((post: any) => (
                    <PostCard key={post.id} post={post} currentUser={currentUser} />
                  ))}
                </div>
              </section>
            )}

            {/* EMPTY STATE IF NOTHING FOUND */}
            {people.length === 0 && opportunities.length === 0 && events.length === 0 && posts.length === 0 && (
              <div className="text-center py-20 bg-card rounded-2xl border border-border shadow-sm">
                <SearchIcon className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-50" />
                <h3 className="text-lg font-semibold text-foreground">No results found</h3>
                <p className="text-muted-foreground">We couldn't find anything matching "{query}". Try checking for typos or using broader terms.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}