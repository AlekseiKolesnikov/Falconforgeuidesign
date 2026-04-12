import * as React from "react";
import { Camera, Edit, Mail, MapPin, Pencil, Trash2, Users } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";

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
  return (
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
              <AvatarFallback className="text-4xl">{profile.first_name[0]}{profile.last_name[0]}</AvatarFallback>
            </Avatar>

            {/* ONLY SHOW AVATAR EDIT BUTTON IF OWNER */}
            {isOwner && (
              <Button size="icon" variant="secondary" className="absolute bottom-1 right-1 h-9 w-9 rounded-full shadow-md z-10 hover:bg-secondary/80" onClick={onAvatarClick}>
                <Pencil className="h-4 w-4" />
              </Button>
            )}
          </div>

          <div className="mt-6 flex gap-3 justify-center">

            {/* UPDATED CONNECT BUTTON */}
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

        <div className="mt-4">
          <h1 className="text-3xl font-bold text-foreground">
            {profile.first_name} {profile.last_name}
            {profile.is_verified && <span className="text-blue-500 ml-2 text-xl" title="Verified">✅</span>}
          </h1>
          <p className="text-lg text-foreground mt-1">{profile.headline || "Student at University of Montevallo"}</p>
          <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4" />{profile.location || "Montevallo, Alabama"}</span>
            <span className="flex items-center gap-1.5"><Mail className="h-4 w-4" />{profile.email}</span>
            {profile.swimmer && <span className="text-blue-600 font-medium">🏊 UM Swim Team</span>}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}