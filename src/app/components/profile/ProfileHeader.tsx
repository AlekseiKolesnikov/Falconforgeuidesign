import * as React from "react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Camera, Edit, Mail, MapPin, Pencil, Trash2, Users } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { supabase } from "../../../lib/supabase";

const FALLBACK_COVER = "https://images.unsplash.com/photo-1759889392274-246af1a984ba?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx1bml2ZXJzaXR5JTIwY2FtcHVzJTIwcHVycGxlJTIwYnVpbGRpbmd8ZW58MXx8fHwxNzczMDAwMjgyfDA&ixlib=rb-4.1.0&q=80&w=1080";

interface ProfileHeaderProps {
  profile: any;
  onEditProfile: () => void;
  onAvatarClick: () => void;
  onBannerUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBannerDelete: () => void;
  isOwner: boolean; 
  isFollowing: boolean; 
  onToggleConnect: () => void;
}

export function ProfileHeader({ profile, onEditProfile, onAvatarClick, onBannerUpload, onBannerDelete, isOwner, isFollowing, onToggleConnect }: ProfileHeaderProps) {
  const [isConnectionsOpen, setIsConnectionsOpen] = useState(false);

  // FETCH CONNECTIONS JUST FOR THE HEADER MODAL
  const { data: connections = [], isLoading } = useQuery({
    queryKey: ['connections', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];

      const { data: follows } = await supabase
        .from('follows')
        .select('followed_id')
        .eq('follower_id', profile.id);

      if (!follows || follows.length === 0) return [];

      const followedIds = follows.map(f => f.followed_id);
      
      const { data: users } = await supabase
        .from('users')
        .select('id, first_name, last_name, profile_photo_url, headline')
        .in('id', followedIds);

      return users || [];
    },
    enabled: !!profile?.id,
  });

  return (
    <>
      <Card className="overflow-hidden shadow-sm border-0">
        <div className="h-64 relative bg-muted">
          <img src={profile.banner_url || FALLBACK_COVER} alt="Cover" className="w-full h-full object-cover" />

          {/* ONLY SHOW BANNER EDIT BUTTONS IF OWNER */}
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

              {/* ONLY SHOW AVATAR EDIT BUTTON IF OWNER */}
              {isOwner && (
                <Button size="icon" variant="secondary" className="absolute bottom-1 right-1 h-9 w-9 rounded-full shadow-md z-10 hover:bg-secondary/80" onClick={onAvatarClick}>
                  <Pencil className="h-4 w-4" />
                </Button>
              )}
            </div>

            {/* ACTION BUTTONS (Moved connections link out of here) */}
            <div className="pt-4 flex gap-2">
              {/* SHOW CONNECT IF VIEWING SOMEONE ELSE */}
              {!isOwner && (
                <Button
                  variant={isFollowing ? "secondary" : "outline"}
                  className="gap-2 rounded-full px-6"
                  onClick={onToggleConnect}
                >
                  <Users className="h-4 w-4" />
                  {isFollowing ? "Connected" : "Connect"}
                </Button>
              )}

              {/* SHOW EDIT PROFILE IF VIEWING YOURSELF */}
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
            
            {/* NEW LAYOUT: Headline and Connections on the exact same row */}
            <div className="flex justify-between items-center mt-1 gap-4">
              <p className="text-lg text-foreground">
                {profile.headline || "Student at University of Montevallo"}
              </p>
              
              {/* CLICKABLE CONNECTIONS TEXT (Now exactly 1px larger using text-[15px]) */}
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

      {/* CONNECTIONS POP-UP MODAL */}
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
                    onClick={() => setIsConnectionsOpen(false)} // Closes modal when navigating
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