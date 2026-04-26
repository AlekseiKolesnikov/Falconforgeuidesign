import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Users, Check, X } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../contexts/AuthContext";
import { Navigation } from "../components/Navigation";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { Button } from "../components/ui/button";

export function Connections() {
  const { session } = useAuth();
  const queryClient = useQueryClient();

  // 1. GET CURRENT USER
  const { data: currentUser } = useQuery({
    queryKey: ['currentUser', session?.user?.id],
    queryFn: async () => {
      if (!session?.user?.id) return null;
      const { data } = await supabase.from('users').select('id').eq('auth_users_uuid', session.user.id).single();
      return data;
    },
    enabled: !!session?.user?.id,
  });

  // 2. FETCH PENDING INCOMING REQUESTS
  const { data: pendingRequests = [] } = useQuery({
    queryKey: ['pendingRequests', currentUser?.id],
    queryFn: async () => {
      if (!currentUser?.id) return [];
      const { data, error } = await supabase
        .from('connections')
        .select(`id, sender_id, users!connections_sender_id_fkey(id, first_name, last_name, profile_photo_url, headline)`)
        .eq('receiver_id', currentUser.id)
        .eq('status', 'pending');
      if (error) throw error;
      return data || [];
    },
    enabled: !!currentUser?.id,
  });

  // 3. FETCH FULLY ACCEPTED CONNECTIONS
  const { data: myConnections = [] } = useQuery({
    queryKey: ['myConnections', currentUser?.id],
    queryFn: async () => {
      if (!currentUser?.id) return [];
      const { data, error } = await supabase
        .from('connections')
        .select(`
          id, sender_id, receiver_id,
          sender:users!connections_sender_id_fkey(id, first_name, last_name, profile_photo_url, headline),
          receiver:users!connections_receiver_id_fkey(id, first_name, last_name, profile_photo_url, headline)
        `)
        .eq('status', 'accepted')
        .or(`sender_id.eq.${currentUser.id},receiver_id.eq.${currentUser.id}`);
      if (error) throw error;
      
      // Flatten the data so it's easy to render (grab the details of the *other* person, not you)
      return (data || []).map((conn: any) => {
        const otherPerson = conn.sender_id === currentUser.id ? conn.receiver : conn.sender;
        return { connection_id: conn.id, ...otherPerson };
      });
    },
    enabled: !!currentUser?.id,
  });

  // --- MUTATIONS ---
  const acceptMutation = useMutation({
    mutationFn: async (connectionId: number) => {
      await supabase.from('connections').update({ status: 'accepted' }).eq('id', connectionId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pendingRequests'] });
      queryClient.invalidateQueries({ queryKey: ['myConnections'] });
    }
  });

  const removeMutation = useMutation({
    mutationFn: async (connectionId: number) => {
      await supabase.from('connections').delete().eq('id', connectionId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pendingRequests'] });
      queryClient.invalidateQueries({ queryKey: ['myConnections'] });
    }
  });

  return (
    <div className="min-h-screen bg-muted/30 pb-20 lg:pb-0">
      <Navigation />

      <div className="container max-w-4xl mx-auto px-4 py-8 space-y-6">
        <div className="mb-4">
          <h1 className="text-3xl font-bold text-foreground">My Network</h1>
        </div>

        {/* INVITATIONS SECTION */}
        {pendingRequests.length > 0 && (
          <Card className="shadow-sm border-0">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-lg flex items-center justify-between">
                <span>Invitations</span>
                <span className="bg-primary text-primary-foreground text-xs px-2.5 py-0.5 rounded-full">{pendingRequests.length}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              {pendingRequests.map((req: any) => (
                <div key={req.id} className="flex items-center justify-between gap-4">
                  <Link to={`/profile/${req.users.id}`} className="flex items-center gap-3 flex-1 overflow-hidden hover:bg-muted/50 p-2 rounded-xl transition-colors">
                    <Avatar className="h-14 w-14 border">
                      <AvatarImage src={req.users.profile_photo_url} className="object-cover" />
                      <AvatarFallback className="bg-primary/10 text-primary font-semibold">{req.users.first_name[0]}{req.users.last_name[0]}</AvatarFallback>
                    </Avatar>
                    <div className="overflow-hidden">
                      <p className="font-semibold text-foreground truncate">{req.users.first_name} {req.users.last_name}</p>
                      <p className="text-sm text-muted-foreground truncate">{req.users.headline || "Student"}</p>
                    </div>
                  </Link>
                  <div className="flex items-center gap-2 pr-2 shrink-0">
                    <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive rounded-full" onClick={() => removeMutation.mutate(req.id)} disabled={removeMutation.isPending}>
                      <X className="h-5 w-5" />
                    </Button>
                    <Button size="icon" className="rounded-full bg-primary hover:bg-primary/90" onClick={() => acceptMutation.mutate(req.id)} disabled={acceptMutation.isPending}>
                      <Check className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* CONNECTIONS SECTION */}
        <Card className="shadow-sm border-0">
          <CardHeader className="pb-3 border-b">
            <CardTitle className="text-lg">Connections ({myConnections.length})</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            {myConnections.length === 0 ? (
              <div className="text-center py-16">
                <div className="bg-primary/10 p-4 rounded-full mx-auto w-fit mb-4">
                  <Users className="h-8 w-8 text-primary" />
                </div>
                <h2 className="text-lg font-semibold text-foreground mb-1">No connections yet</h2>
                <p className="text-muted-foreground text-sm max-w-md mx-auto">Head over to the Network tab to start building your professional circle!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {myConnections.map((conn: any) => (
                  <div key={conn.connection_id} className="flex items-center justify-between p-3 rounded-xl border bg-card hover:border-primary/30 transition-colors">
                    <Link to={`/profile/${conn.id}`} className="flex items-center gap-3 overflow-hidden flex-1">
                      <Avatar className="h-12 w-12 border">
                        <AvatarImage src={conn.profile_photo_url} className="object-cover" />
                        <AvatarFallback className="bg-primary/10 text-primary font-semibold">{conn.first_name[0]}{conn.last_name[0]}</AvatarFallback>
                      </Avatar>
                      <div className="overflow-hidden">
                        <p className="font-semibold text-foreground truncate text-sm">{conn.first_name} {conn.last_name}</p>
                        <p className="text-xs text-muted-foreground truncate">{conn.headline || "Student"}</p>
                      </div>
                    </Link>
                    <Button variant="ghost" size="sm" className="text-xs text-muted-foreground ml-2 hover:text-destructive" onClick={() => { if(confirm("Remove connection?")) removeMutation.mutate(conn.connection_id); }}>
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}