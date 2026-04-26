import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { UserPlus, Clock, Check } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../contexts/AuthContext";
import { Navigation } from "../components/Navigation";
import { Card, CardContent } from "../components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { Button } from "../components/ui/button";

const FALLBACK_BANNER = "https://images.unsplash.com/photo-1759889392274-246af1a984ba?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx1bml2ZXJzaXR5JTIwY2FtcHVzJTIwcHVycGxlJTIwYnVpbGRpbmd8ZW58MXx8fHwxNzczMDAwMjgyfDA&ixlib=rb-4.1.0&q=80&w=1080";

export function Network() {
  const { session } = useAuth();
  const queryClient = useQueryClient();

  // 1. GET CURRENT USER ID
  const { data: currentUser } = useQuery({
    queryKey: ['currentUser', session?.user?.id],
    queryFn: async () => {
      if (!session?.user?.id) return null;
      const { data } = await supabase.from('users').select('id').eq('auth_users_uuid', session.user.id).single();
      return data;
    },
    enabled: !!session?.user?.id,
  });

  // 2. FETCH ALL OTHER USERS
  const { data: suggestedUsers = [], isLoading } = useQuery({
    queryKey: ['suggestedUsers', currentUser?.id],
    queryFn: async () => {
      if (!currentUser?.id) return [];
      
      const { data, error } = await supabase
        .from('users')
        .select('id, first_name, last_name, profile_photo_url, banner_url, headline')
        .neq('id', currentUser.id) // Exclude the logged-in user
        .limit(20); 
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!currentUser?.id,
  });

  // 3. FETCH CONNECTION STATUSES
  const { data: connections = [] } = useQuery({
    queryKey: ['connections_status', currentUser?.id],
    queryFn: async () => {
      if (!currentUser?.id) return [];
      const { data, error } = await supabase
        .from('connections')
        .select('*')
        .or(`sender_id.eq.${currentUser.id},receiver_id.eq.${currentUser.id}`);
      if (error) throw error;
      return data || [];
    },
    enabled: !!currentUser?.id,
  });

  // 4. CONNECT MUTATION
  const connectMutation = useMutation({
    mutationFn: async (receiverId: number) => {
      if (!currentUser?.id) throw new Error("Not logged in");
      const { error } = await supabase
        .from('connections')
        .insert({ sender_id: currentUser.id, receiver_id: receiverId });
      if (error) throw error;
    },
    onSuccess: () => {
      // Refresh the connection statuses so the button immediately changes to "Pending"
      queryClient.invalidateQueries({ queryKey: ['connections_status'] });
    }
  });

  // 5. HELPER: RENDER THE CORRECT BUTTON STATE
  const renderConnectionButton = (userId: number) => {
    const connection = connections.find((c: any) => c.sender_id === userId || c.receiver_id === userId);

    if (connection?.status === 'accepted') {
      return (
        <Button variant="ghost" className="w-full rounded-full mt-4 gap-2 text-muted-foreground" disabled>
          <Check className="h-4 w-4" /> Connected
        </Button>
      );
    }
    
    if (connection?.status === 'pending') {
      if (connection.sender_id === currentUser?.id) {
        return (
          <Button variant="secondary" className="w-full rounded-full mt-4 gap-2" disabled>
            <Clock className="h-4 w-4" /> Pending
          </Button>
        );
      } else {
        return (
          <Button className="w-full rounded-full mt-4 gap-2" asChild>
            <Link to="/connections">Respond</Link>
          </Button>
        );
      }
    }

    return (
      <Button 
        variant="outline" 
        className="w-full rounded-full mt-4 gap-2 border-primary text-primary hover:bg-primary/5" 
        onClick={() => connectMutation.mutate(userId)}
        disabled={connectMutation.isPending}
      >
        <UserPlus className="h-4 w-4" />
        Connect
      </Button>
    );
  };

  return (
    <div className="min-h-screen bg-muted/30 pb-20 lg:pb-0">
      <Navigation />

      <div className="container max-w-5xl mx-auto px-4 py-8">
        
        {/* PAGE HEADER */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Grow Your Network</h1>
          <p className="text-muted-foreground mt-1">Discover other Falcons and expand your professional connections.</p>
        </div>

        {/* PEOPLE GRID */}
        {isLoading ? (
          <div className="text-center py-20 text-muted-foreground">Finding people...</div>
        ) : suggestedUsers.length === 0 ? (
          <div className="text-center py-20 bg-card rounded-2xl border border-border shadow-sm text-muted-foreground">
            No new people to discover right now.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {suggestedUsers.map((user: any) => (
              <Card key={user.id} className="overflow-hidden shadow-sm border border-border hover:shadow-md transition-shadow flex flex-col h-full">
                
                {/* Top Half: Banner & Avatar */}
                <div className="h-16 bg-muted relative">
                  <img 
                    src={user.banner_url || FALLBACK_BANNER} 
                    alt="Cover" 
                    className="w-full h-full object-cover" 
                  />
                </div>
                
                <CardContent className="pt-0 pb-4 px-4 flex flex-col items-center text-center flex-1">
                  <Link to={`/profile/${user.id}`}>
                    <Avatar className="h-16 w-16 border-2 border-card shadow-sm -mt-8 mb-3 hover:opacity-90 transition-opacity bg-white">
                      <AvatarImage src={user.profile_photo_url} className="object-cover" />
                      <AvatarFallback className="font-bold text-primary">
                        {user.first_name?.[0]}{user.last_name?.[0]}
                      </AvatarFallback>
                    </Avatar>
                  </Link>

                  <Link to={`/profile/${user.id}`} className="font-semibold text-foreground hover:underline decoration-2 underline-offset-2 line-clamp-1 w-full">
                    {user.first_name} {user.last_name}
                  </Link>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2 w-full flex-1">
                    {user.headline || "Student"}
                  </p>

                  {/* DYNAMIC BUTTON RENDERER INSTEAD OF STATIC LINK */}
                  {renderConnectionButton(user.id)}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}