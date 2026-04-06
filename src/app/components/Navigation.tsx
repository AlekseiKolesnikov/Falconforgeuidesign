import * as React from "react";
import { Link, useLocation } from "react-router-dom";
import { Search, Home, Briefcase, Calendar, Bell, LogOut, Zap } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { useAuth } from "../../contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "../../lib/supabase";

export function Navigation() {
  // FIXED: Removed signOut from here
  const { session } = useAuth();
  const location = useLocation();

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser', session?.user?.id],
    queryFn: async () => {
      if (!session?.user?.id) return null;
      const { data } = await supabase
        .from('users')
        .select('*')
        .eq('auth_users_uuid', session.user.id)
        .single();
      return data;
    },
    enabled: !!session?.user?.id,
  });

  // Helper to highlight the active tab
  const isActive = (path: string) => location.pathname === path;

  // FIXED: Added a simple logout handler using Supabase directly
  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-card shadow-sm">
      <div className="container max-w-7xl mx-auto h-16 px-4 flex items-center relative">
        
        {/* 1. LEFT SECTION (Logo & Search) - Takes up 1/3 of the space */}
        <div className="flex items-center gap-4 w-1/3">
          <Link to="/feed" className="flex items-center gap-2 font-bold text-lg text-foreground hover:opacity-90">
            <div className="bg-primary text-primary-foreground p-1.5 rounded-md flex items-center justify-center">
              <Zap className="h-5 w-5 fill-current" />
            </div>
            <span className="hidden lg:block text-xl tracking-tight">Falcon Forge</span>
          </Link>
          
          <div className="relative hidden md:block max-w-[240px] w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              type="search" 
              placeholder="Search people, posts..." 
              className="w-full bg-muted/50 pl-9 rounded-md border-0 focus-visible:ring-1 h-9" 
            />
          </div>
        </div>

        {/* 2. CENTER SECTION (Nav Links) - Absolutely Centered */}
        <nav className="hidden md:flex items-center gap-2 absolute left-1/2 transform -translate-x-1/2 h-full">
          <Link to="/feed" className={`flex items-center gap-2 px-4 h-full border-b-2 transition-colors ${isActive('/feed') ? 'border-primary text-primary font-semibold' : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/30'}`}>
            <Home className="h-5 w-5" />
            <span>Feed</span>
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

        {/* 3. RIGHT SECTION (User Actions) - Takes up 1/3 of the space and aligns right */}
        <div className="flex items-center justify-end gap-4 w-1/3 ml-auto">
          
          <Button variant="ghost" size="icon" className="relative rounded-full text-muted-foreground hover:text-foreground">
            <Bell className="h-5 w-5" />
            {/* Notification Dot */}
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-destructive border-2 border-background"></span>
          </Button>

          <Link to="/profile/me" className="cursor-pointer transition-transform hover:scale-105">
            <Avatar className="h-8 w-8 border border-border">
              <AvatarImage src={currentUser?.profile_photo_url} className="object-cover" />
              <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                {currentUser ? `${currentUser.first_name[0]}${currentUser.last_name[0]}` : "U"}
              </AvatarFallback>
            </Avatar>
          </Link>

          {/* FIXED: Using the direct supabase handler here */}
          <Button variant="ghost" size="icon" onClick={handleLogout} className="text-muted-foreground hover:text-foreground hover:bg-muted rounded-full">
            <LogOut className="h-5 w-5" />
          </Button>
          
        </div>

      </div>
    </header>
  );
}