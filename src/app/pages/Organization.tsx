import * as React from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Building2, MapPin, Link as LinkIcon, Users, ExternalLink } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { Navigation } from "../components/Navigation";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { Button } from "../components/ui/button";

const FALLBACK_BANNER = "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=2070&auto=format&fit=crop";

export function Organization() {
  const { id } = useParams<{ id: string }>();

  // 1. FETCH ORGANIZATION DETAILS
  const { data: org, isLoading: orgLoading } = useQuery({
    queryKey: ['organization', id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  // 2. FETCH EMPLOYEES / ALUMNI
  const { data: employees = [], isLoading: employeesLoading } = useQuery({
    queryKey: ['organization_employees', id],
    queryFn: async () => {
      if (!id) return [];
      
      // Find all experiences linked to this organization
      const { data: expData } = await supabase
        .from('experiences')
        .select('user_id')
        .eq('organization_id', id);

      if (!expData || expData.length === 0) return [];

      // Extract unique user IDs
      const userIds = [...new Set(expData.map(e => e.user_id))];

      // Fetch those users
      const { data: users } = await supabase
        .from('users')
        .select('id, first_name, last_name, profile_photo_url, headline')
        .in('id', userIds);

      return users || [];
    },
    enabled: !!id,
  });

  if (orgLoading) return <div className="text-center py-20 text-muted-foreground">Loading organization...</div>;
  if (!org) return <div className="text-center py-20 text-muted-foreground">Organization not found.</div>;

  return (
    <div className="min-h-screen bg-muted/30 pb-20 lg:pb-0">
      <Navigation />

      <div className="container max-w-4xl mx-auto px-4 py-6 space-y-6">
        
        {/* HEADER SECTION */}
        <Card className="overflow-hidden shadow-sm border-0">
          <div className="h-64 relative bg-muted">
            <img src={org.banner_url || FALLBACK_BANNER} alt="Cover" className="w-full h-full object-cover" />
          </div>

          <CardContent className="relative pt-0 pb-6 bg-card flex flex-col items-start text-left">
            <div className="-mt-16 relative z-10 mb-4">
              <Avatar className="h-32 w-32 border-4 border-card shadow-xl bg-white rounded-xl">
                <AvatarImage src={org.logo_url} className="object-contain p-2" />
                <AvatarFallback className="text-3xl rounded-xl bg-primary/10 text-primary">
                  <Building2 className="h-12 w-12" />
                </AvatarFallback>
              </Avatar>
            </div>

            <div className="w-full flex justify-between items-start">
              <div>
                <h1 className="text-3xl font-bold text-foreground">{org.name}</h1>
                <p className="text-lg text-muted-foreground mt-1">{org.industry || "Company"}</p>
                
                <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-muted-foreground">
                  {org.location && (
                    <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4" />{org.location}</span>
                  )}
                  {org.website_url && (
                    <a href={org.website_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-primary hover:underline">
                      <LinkIcon className="h-4 w-4" /> Visit Website <ExternalLink className="h-3 w-3 ml-0.5" />
                    </a>
                  )}
                </div>
              </div>

              <Button className="rounded-full px-8 shadow-sm">
                Follow
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* ABOUT SECTION */}
        <Card className="shadow-sm border-0">
          <CardHeader>
            <CardTitle className="text-xl">About</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-foreground leading-relaxed whitespace-pre-wrap">
              {org.about || `No description provided for ${org.name} yet.`}
            </p>
          </CardContent>
        </Card>

        {/* PEOPLE SECTION */}
        <Card className="shadow-sm border-0">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              People ({employees.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {employeesLoading ? (
              <p className="text-muted-foreground text-sm">Loading people...</p>
            ) : employees.length === 0 ? (
              <p className="text-muted-foreground text-sm">No Falcon Forge members work here yet.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {employees.map((user: any) => (
                  <Link 
                    key={user.id} 
                    to={`/profile/${user.id}`} 
                    className="flex items-center gap-3 p-3 rounded-xl border bg-card hover:bg-muted/50 transition-colors"
                  >
                    <Avatar className="h-12 w-12 border">
                      <AvatarImage src={user.profile_photo_url} className="object-cover" />
                      <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                        {user.first_name?.[0]}{user.last_name?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="overflow-hidden">
                      <p className="font-semibold text-foreground truncate">
                        {user.first_name} {user.last_name}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {user.headline || "Student"}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

      </div>
    </div>
  );
}