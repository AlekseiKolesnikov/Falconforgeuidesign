import * as React from "react";
import { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Search, Home, Briefcase, Calendar, Bell, LogOut, Zap, User, Users } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { useAuth } from "../../contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "../../lib/supabase";

export function Navigation() {
  const { session } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // SEARCH STATES
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Close search dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchOpen(false);
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

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-card shadow-sm">
      <div className="container max-w-7xl mx-auto h-16 px-4 flex items-center relative">

        {/* LEFT SECTION (Logo & Search) */}
        <div className="flex items-center gap-4 w-1/3">
          <Link to="/feed" className="flex items-center gap-2 font-bold text-lg text-foreground hover:opacity-90">
            <div className="bg-primary text-primary-foreground p-1.5 rounded-md flex items-center justify-center shrink-0">
              <Zap className="h-5 w-5 fill-current" />
            </div>
            <span className="hidden lg:block text-xl tracking-tight">Falcon Forge</span>
          </Link>

          {/* SEARCH INPUT WRAPPER */}
          <div className="relative hidden md:block max-w-[280px] w-full" ref={searchRef}>
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
            <Input
              type="search"
              placeholder="Search people..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setIsSearchOpen(true);
              }}
              onFocus={() => setIsSearchOpen(true)}
              className="w-full bg-muted/50 pl-9 rounded-md border-0 focus-visible:ring-1 h-9"
            />

            {/* SEARCH RESULTS DROPDOWN */}
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

        {/* CENTER SECTION (Nav Links) */}
        <nav className="hidden md:flex items-center gap-2 absolute left-1/2 transform -translate-x-1/2 h-full">
          <Link to="/feed" className={`flex items-center gap-2 px-4 h-full border-b-2 transition-colors ${isActive('/feed') ? 'border-primary text-primary font-semibold' : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/30'}`}>
            <Home className="h-5 w-5" />
            <span>Feed</span>
          </Link>

          {/* NEW NETWORK TAB LINKED TO GROUPS */}
          <Link to="/network" className={`flex items-center gap-2 px-4 h-full border-b-2 transition-colors ${isActive('/network') ? 'border-primary text-primary font-semibold' : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/30'}`}>
            <Users className="h-5 w-5" />
            <span>Network</span>
          </Link>

          <Link to="/opportunities" className={`flex items-center gap-2 px-4 h-full border-b-2 transition-colors ${isActive('/opportunities') ? 'border-primary text-primary font-semibold' : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/30'}`}>
            <Briefcase className="h-5 w-5" />
            <span>Opportunities</span>
          </Link>

          <Link to="/events" className={`flex items-center gap-2 px-4 h-full border-b-2 transition-colors ${isActive('/events') ? 'border-primary text-primary font-semibold' : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/30'}`}>
            <Calendar className="h-5 w-5" />
            <span>Events</span>
          </Link>
        </nav>

        {/* RIGHT SECTION (User Actions) */}
        <div className="flex items-center justify-end gap-4 w-1/3 ml-auto">
          <Button variant="ghost" size="icon" className="relative rounded-full text-muted-foreground hover:text-foreground">
            <Bell className="h-5 w-5" />
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-destructive border-2 border-background"></span>
          </Button>

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