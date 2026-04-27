import * as React from "react";
import { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Search, Home, Briefcase, Calendar, Bell, LogOut, Zap, Users, UserPlus, CheckCircle } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { useAuth } from "../../contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../lib/supabase";

export function Navigation() {
  const { session } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // SEARCH STATES
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // NOTIFICATION STATES
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setIsNotifOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // CURRENT USER QUERY
  const { data: currentUser } = useQuery({
    queryKey: ['currentUser', session?.user?.id],
    queryFn: async () => {
      if (!session?.user?.id) return null;
      const { data } = await supabase.from('users').select('*').eq('auth_users_uuid', session.user.id).single();
      return data;
    },
    enabled: !!session?.user?.id,
  });

  // SEARCH USERS QUERY
  const { data: searchResults = [], isLoading: isSearching } = useQuery({
    queryKey: ['userSearch', searchQuery],
    queryFn: async () => {
      if (searchQuery.trim().length < 2) return [];

      const { data, error } = await supabase
        .from('users')
        .select('id, first_name, last_name, profile_photo_url, headline')
        .or(`first_name.ilike.%${searchQuery}%,last_name.ilike.%${searchQuery}%`)
        .limit(5);

      if (error) throw error;
      return data || [];
    },
    enabled: searchQuery.trim().length >= 2,
  });

  // FETCH NOTIFICATIONS
  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications', currentUser?.id],
    queryFn: async () => {
      if (!currentUser?.id) return [];
      const { data, error } = await supabase
        .from('notifications')
        .select(`
          id, type, is_read, created_at,
          actor:users!actor_id(id, first_name, last_name, profile_photo_url)
        `)
        .eq('user_id', currentUser.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      return data || [];
    },
    enabled: !!currentUser?.id,
  });

  const unreadCount = notifications.filter((n: any) => !n.is_read).length;

  // MARK NOTIFICATION AS READ MUTATION
  const markReadMutation = useMutation({
    mutationFn: async (id: number) => {
      await supabase.from('notifications').update({ is_read: true }).eq('id', id);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] })
  });

  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      if (!currentUser?.id) return;
      await supabase.from('notifications').update({ is_read: true }).eq('user_id', currentUser.id);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] })
  });

  const timeAgo = (dateString: string) => {
    const minutes = Math.floor((new Date().getTime() - new Date(dateString).getTime()) / 60000);
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h`;
    return `${Math.floor(hours / 24)}d`;
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-card shadow-sm">
      <div className="container max-w-7xl mx-auto h-16 px-4 flex items-center justify-between gap-4">

        {/* 1. LEFT SECTION (Logo & Search) */}
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <Link to="/feed" className="flex items-center gap-2 font-bold text-lg text-foreground hover:opacity-90 shrink-0">
            <div className="bg-primary text-primary-foreground p-1.5 rounded-md flex items-center justify-center">
              <Zap className="h-5 w-5 fill-current" />
            </div>
            <span className="hidden xl:block text-xl tracking-tight">Falcon Forge</span>
          </Link>

          <div className="relative hidden md:block max-w-[280px] w-full" ref={searchRef}>
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
            <Input
              type="search"
              placeholder="Search Falcon Forge..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setIsSearchOpen(true);
              }}
              onFocus={() => setIsSearchOpen(true)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && searchQuery.trim().length > 0) {
                  setIsSearchOpen(false);
                  navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
                }
              }}
              className="w-full bg-muted/50 pl-9 rounded-md border-0 focus-visible:ring-1 h-9"
            />

            {isSearchOpen && searchQuery.trim().length >= 2 && (
              <div className="absolute top-full mt-2 w-full bg-card border rounded-xl shadow-lg overflow-hidden py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                {isSearching ? (
                  <div className="px-4 py-3 text-sm text-muted-foreground">Searching...</div>
                ) : searchResults.length === 0 ? (
                  <div className="px-4 py-3 text-sm text-muted-foreground">No users found for "{searchQuery}"</div>
                ) : (
                  searchResults.map((user: any) => (
                    <Link
                      key={user.id}
                      to={`/profile/${user.id}`}
                      onClick={() => {
                        setIsSearchOpen(false);
                        setSearchQuery("");
                      }}
                      className="flex items-center gap-3 px-4 py-2 hover:bg-muted transition-colors"
                    >
                      <Avatar className="h-8 w-8 border">
                        <AvatarImage src={user.profile_photo_url} className="object-cover" />
                        <AvatarFallback className="text-[10px]">
                          {user.first_name?.[0]}{user.last_name?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="overflow-hidden">
                        <p className="text-sm font-semibold text-foreground truncate">
                          {user.first_name} {user.last_name}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {user.headline || "Student"}
                        </p>
                      </div>
                    </Link>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        {/* 2. CENTER SECTION (Nav Links) */}
        <nav className="hidden md:flex items-center justify-center gap-1 lg:gap-2 h-full shrink-0">
          <Link to="/feed" className={`flex items-center gap-2 px-3 lg:px-4 h-full border-b-2 transition-colors ${isActive('/feed') ? 'border-primary text-primary font-semibold' : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/30'}`}>
            <Home className="h-5 w-5" />
            <span className="hidden lg:inline-block">Feed</span>
          </Link>

          <Link to="/network" className={`flex items-center gap-2 px-3 lg:px-4 h-full border-b-2 transition-colors ${isActive('/network') ? 'border-primary text-primary font-semibold' : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/30'}`}>
            <Users className="h-5 w-5" />
            <span className="hidden lg:inline-block">Network</span>
          </Link>

          <Link to="/opportunities" className={`flex items-center gap-2 px-3 lg:px-4 h-full border-b-2 transition-colors ${isActive('/opportunities') ? 'border-primary text-primary font-semibold' : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/30'}`}>
            <Briefcase className="h-5 w-5" />
            <span className="hidden lg:inline-block">Opportunities</span>
          </Link>

          <Link to="/events" className={`flex items-center gap-2 px-3 lg:px-4 h-full border-b-2 transition-colors ${isActive('/events') ? 'border-primary text-primary font-semibold' : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/30'}`}>
            <Calendar className="h-5 w-5" />
            <span className="hidden lg:inline-block">Events</span>
          </Link>
        </nav>

        {/* 3. RIGHT SECTION (User Actions) */}
        <div className="flex items-center justify-end gap-2 lg:gap-4 flex-1">

          {/* NOTIFICATION BELL WITH DROPDOWN */}
          <div className="relative hidden sm:block" ref={notifRef}>
            <Button
              variant="ghost"
              size="icon"
              className={`relative rounded-full hover:text-foreground ${isNotifOpen ? 'bg-muted text-foreground' : 'text-muted-foreground'}`}
              onClick={() => setIsNotifOpen(!isNotifOpen)}
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-destructive border-2 border-background"></span>
              )}
            </Button>

            {/* THE POP-UP WINDOW */}
            {isNotifOpen && (
              <div className="absolute right-0 mt-2 w-[320px] sm:w-[380px] bg-card border border-border rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
                <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/20">
                  <h3 className="font-semibold text-foreground">Notifications</h3>
                  {unreadCount > 0 && (
                    <Button variant="ghost" size="sm" className="h-auto py-1 text-xs text-primary hover:bg-primary/10" onClick={() => markAllReadMutation.mutate()}>
                      Mark all as read
                    </Button>
                  )}
                </div>

                <div className="max-h-[400px] overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground text-sm">
                      You're all caught up!
                    </div>
                  ) : (
                    <div className="flex flex-col">
                      {notifications.map((notif: any) => (
                        <Link
                          key={notif.id}
                          to={notif.type === 'connection_request' ? '/connections' : `/profile/${notif.actor.id}`}
                          onClick={() => {
                            if (!notif.is_read) markReadMutation.mutate(notif.id);
                            setIsNotifOpen(false);
                          }}
                          className={`flex items-start gap-3 p-4 border-b border-border/50 hover:bg-muted/50 transition-colors ${!notif.is_read ? 'bg-primary/5' : ''}`}
                        >
                          <Avatar className="h-10 w-10 shrink-0 border bg-white">
                            <AvatarImage src={notif.actor.profile_photo_url} className="object-cover" />
                            <AvatarFallback className="bg-primary/10 text-primary">{notif.actor.first_name?.[0]}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 space-y-1">
                            <p className="text-sm text-foreground leading-tight">
                              <span className="font-semibold">{notif.actor.first_name} {notif.actor.last_name}</span>
                              {notif.type === 'connection_request' ? " sent you a connection request." : " accepted your connection request!"}
                            </p>
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              {notif.type === 'connection_request' ? <UserPlus className="h-3 w-3" /> : <CheckCircle className="h-3 w-3 text-green-500" />}
                              {timeAgo(notif.created_at)}
                            </p>
                          </div>
                          {!notif.is_read && <div className="h-2 w-2 rounded-full bg-primary shrink-0 mt-1.5" />}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <Link to="/profile/me" className="cursor-pointer transition-transform hover:scale-105">
            <Avatar className="h-8 w-8 border border-border">
              <AvatarImage src={currentUser?.profile_photo_url} className="object-cover" />
              <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                {currentUser ? `${currentUser.first_name?.[0]}${currentUser.last_name?.[0]}` : "U"}
              </AvatarFallback>
            </Avatar>
          </Link>

          <Button variant="ghost" size="icon" onClick={handleLogout} className="text-muted-foreground hover:text-foreground hover:bg-muted rounded-full">
            <LogOut className="h-5 w-5" />
          </Button>
        </div>

      </div>
    </header>
  );
}