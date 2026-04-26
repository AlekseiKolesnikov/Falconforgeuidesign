import * as React from "react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Camera, Edit, Mail, MapPin, Pencil, Trash2, Users, UserPlus, Clock, Check, X } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { supabase } from "../../../lib/supabase";

const FALLBACK_COVER = "https://images.unsplash.com/photo-1759889392274-246af1a984ba?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx1bml2ZXJzaXR5JTIwY2FtcHVzJTIwcHVycGxlJTIwYnVpbGRpbmd8ZW58MXx8fHwxNzczMDAwMjgyfDA&ixlib=rb-4.1.0&q=80&w=1080";

interface ProfileHeaderProps {
  profile: any;
  currentUser: any; 
  onEditProfile: () => void;
  onAvatarClick: () => void;
  onBannerUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBannerDelete: () => void;
  isOwner: boolean; 
  connectionStatus: any; 
  onToggleConnect: () => void;
  onDisconnect: () => void; // <-- Added this prop
}

export function ProfileHeader({ profile, currentUser, onEditProfile, onAvatarClick, onBannerUpload, onBannerDelete, isOwner, connectionStatus, onToggleConnect, onDisconnect }: ProfileHeaderProps) {
  const [isConnectionsOpen, setIsConnectionsOpen] = useState(false);

  const { data: connections = [], isLoading } = useQuery({
    queryKey: ['connections', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];
      const { data, error } = await supabase
        .from('connections')
        .select(`
          id, sender_id, receiver_id,
          sender:users!sender_id(id, first_name, last_name, profile_photo_url, headline),
          receiver:users!receiver_id(id, first_name, last_name, profile_photo_url, headline)
        `)
        .eq('status', 'accepted')
        .or(`sender_id.eq.${profile.id},receiver_id.eq.${profile.id}`);
      
      if (error) throw error;
      
      return (data || []).map((conn: any) => {
        const otherPerson = conn.sender_id === profile.id ? conn.receiver : conn.sender;
        return { connection_id: conn.id, ...otherPerson };
      });
    },
    enabled: !!profile?.id,
  });

  return (
    <>
      <Card className="overflow-hidden shadow-sm border-0">
        <div className="h-64 relative bg-muted">
          <img src={profile.banner_url || FALLBACK_COVER} alt="Cover" className="w-full h-full object-cover" />

          {isOwner && (
            <div className="absolute top-4 right-4 flex gap-2 z-10">
              <label className="cursor-pointer bg-secondary hover:bg-secondary/80 text-secondary-foreground h-9 w-9 flex items-center justify-center rounded-full shadow-md transition-colors">
                <Camera className="h-4 w-4" />
                <input type="file" className="hidden" accept="image/*" onChange={onBannerUpload} />
              </label>
              {profile.banner_url && (
                <Button variant="destructive" size="icon" className="h-9 w-9 rounded-full shadow-md" onClick={onBannerDelete}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          )}
        </div>

        <CardContent className="relative pt-0 pb-6 bg-card">
          <div className="flex justify-between items-start">
            <div className="-mt-20 relative z-10 w-fit">
              <Avatar className="h-40 w-40 border-4 border-card shadow-xl bg-muted">
                <AvatarImage src={profile.profile_photo_url} className="object-cover" />
                <AvatarFallback className="text-4xl">{profile.first_name?.[0]}{profile.last_name?.[0]}</AvatarFallback>
              </Avatar>

              {isOwner && (
                <Button size="icon" variant="secondary" className="absolute bottom-1 right-1 h-9 w-9 rounded-full shadow-md z-10 hover:bg-secondary/80" onClick={onAvatarClick}>
                  <Pencil className="h-4 w-4" />
                </Button>
              )}
            </div>

            <div className="pt-4 flex gap-2">
              
              {!isOwner && (
                <>
                  {connectionStatus?.status === 'accepted' ? (
                    <Button 
                      variant="outline" 
                      className="gap-2 rounded-full px-6 hover:bg-destructive/10 hover:text-destructive hover:border-destructive group transition-colors" 
                      onClick={() => {
                        if(confirm(`Are you sure you want to remove ${profile.first_name} from your connections?`)) {
                          onDisconnect();
                        }
                      }}
                    >
                      <Check className="h-4 w-4 group-hover:hidden" />
                      <X className="h-4 w-4 hidden group-hover:block" />
                      <span className="group-hover:hidden">Connected</span>
                      <span className="hidden group-hover:block">Disconnect</span>
                    </Button>
                  ) : connectionStatus?.status === 'pending' ? (
                    connectionStatus.sender_id === currentUser?.id ? (
                      <Button variant="secondary" className="gap-2 rounded-full px-6" disabled>
                        <Clock className="h-4 w-4" /> Pending
                      </Button>
                    ) : (
                      <Button className="gap-2 rounded-full px-6" asChild>
                        <Link to="/connections">Respond</Link>
                      </Button>
                    )
                  ) : (
                    <Button className="gap-2 rounded-full px-6 shadow-sm" onClick={onToggleConnect}>
                      <UserPlus className="h-4 w-4" /> Connect
                    </Button>
                  )}
                  {/* MESSAGE BUTTON HAS BEEN COMPLETELY REMOVED */}
                </>
              )}

              {isOwner && (
                <Button variant="secondary" className="gap-2 rounded-full px-6" onClick={onEditProfile}>
                  <Edit className="h-4 w-4" />Edit Profile
                </Button>
              )}
            </div>
          </div>

          <div className="mt-2">
            <h1 className="text-3xl font-bold text-foreground">
              {profile.first_name} {profile.last_name}
              {profile.is_verified && <span className="text-blue-500 ml-2 text-xl" title="Verified">✅</span>}
            </h1>
            
            <div className="flex justify-between items-center mt-1 gap-4">
              <p className="text-lg text-foreground">
                {profile.headline || "Student at University of Montevallo"}
              </p>
              
              <button 
                onClick={() => setIsConnectionsOpen(true)}
                className="text-[15px] font-semibold text-primary hover:text-primary/80 hover:underline transition-colors shrink-0"
              >
                {connections.length} Connection{connections.length !== 1 ? 's' : ''}
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4" />{profile.location || "Montevallo, Alabama"}</span>
              <span className="flex items-center gap-1.5"><Mail className="h-4 w-4" />{profile.email}</span>
              {profile.swimmer && <span className="text-blue-600 font-medium">🏊 UM Swim Team</span>}
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isConnectionsOpen} onOpenChange={setIsConnectionsOpen}>
        <DialogContent className="sm:max-w-[425px] rounded-2xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Connections ({connections.length})
            </DialogTitle>
          </DialogHeader>

          <div className="overflow-y-auto pr-2 py-4 flex-1">
            {isLoading ? (
              <p className="text-center text-muted-foreground py-4">Loading connections...</p>
            ) : connections.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">No connections yet.</p>
            ) : (
              <div className="flex flex-col gap-3">
                {connections.map((user: any) => (
                  <Link 
                    key={user.id} 
                    to={`/profile/${user.id}`} 
                    onClick={() => setIsConnectionsOpen(false)}
                    className="flex items-center gap-3 p-2 rounded-xl hover:bg-muted/50 transition-colors"
                  >
                    <Avatar className="h-10 w-10 border">
                      <AvatarImage src={user.profile_photo_url} className="object-cover" />
                      <AvatarFallback className="bg-primary/10 text-primary font-semibold text-sm">
                        {user.first_name?.[0]}{user.last_name?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="overflow-hidden flex-1">
                      <p className="font-semibold text-sm text-foreground truncate">
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
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}