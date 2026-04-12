import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { supabase } from "../../../lib/supabase";

interface ProfileConnectionsProps {
  userId: number | undefined;
}

export function ProfileConnections({ userId }: ProfileConnectionsProps) {
  const { data: connections = [], isLoading } = useQuery({
    queryKey: ['connections', userId],
    queryFn: async () => {
      if (!userId) return [];

      // 1. Get the IDs of the people this user has connected with (followed)
      const { data: follows, error: followError } = await supabase
        .from('follows')
        .select('followed_id')
        .eq('follower_id', userId);

      if (followError || !follows || follows.length === 0) return [];

      const followedIds = follows.map(f => f.followed_id);

      // 2. Fetch the actual user profiles for those IDs
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('id, first_name, last_name, profile_photo_url, headline')
        .in('id', followedIds);

      if (usersError) throw usersError;
      return users || [];
    },
    enabled: !!userId,
  });

  if (isLoading) {
    return (
      <Card className="shadow-sm border-0 animate-pulse">
        <CardHeader className="pb-3"><CardTitle className="h-6 w-32 bg-muted rounded"></CardTitle></CardHeader>
        <CardContent><div className="h-20 bg-muted rounded-xl"></div></CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-sm border-0">
      <CardHeader className="pb-3">
        <CardTitle className="text-xl flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          Connections ({connections.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {connections.length === 0 ? (
          <p className="text-muted-foreground text-sm">No connections yet.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {connections.map((user) => (
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
  );
}