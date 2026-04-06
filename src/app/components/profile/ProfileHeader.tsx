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
}

export function ProfileHeader({ profile, onEditProfile, onAvatarClick, onBannerUpload, onBannerDelete }: ProfileHeaderProps) {
  return (
    <Card className="overflow-hidden shadow-sm border-0">
      {/* BANNER SECTION */}
      <div className="h-64 relative bg-muted">
        <img src={profile.banner_url || FALLBACK_COVER} alt="Cover" className="w-full h-full object-cover" />
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
      </div>

      {/* CENTERED PROFILE INFO SECTION */}
      <CardContent className="relative pt-0 pb-8 bg-card flex flex-col items-center text-center">
        
        {/* Centered Avatar (-mt-20 pulls it up over the banner) */}
        <div className="-mt-20 relative z-10 w-fit mb-4">
          <Avatar className="h-40 w-40 border-4 border-card shadow-xl bg-muted">
            <AvatarImage src={profile.profile_photo_url} className="object-cover" />
            <AvatarFallback className="text-4xl">{profile.first_name[0]}{profile.last_name[0]}</AvatarFallback>
          </Avatar>
          <Button size="icon" variant="secondary" className="absolute bottom-1 right-1 h-9 w-9 rounded-full shadow-md z-10 hover:bg-secondary/80" onClick={onAvatarClick}>
            <Pencil className="h-4 w-4" />
          </Button>
        </div>

        {/* Centered Text Info */}
        <div className="flex flex-col items-center max-w-2xl">
          <h1 className="text-3xl font-bold text-foreground flex items-center justify-center gap-2">
            {profile.first_name} {profile.last_name}
            {profile.is_verified && <span className="text-blue-500 text-xl" title="Verified">✅</span>}
          </h1>
          
          <p className="text-lg text-foreground mt-1">
            {profile.headline || "Student at University of Montevallo"}
          </p>
          
          <div className="flex flex-wrap items-center justify-center gap-4 mt-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4" />{profile.location || "Montevallo, Alabama"}</span>
            <span className="flex items-center gap-1.5"><Mail className="h-4 w-4" />{profile.email}</span>
            {profile.swimmer && <span className="text-blue-600 font-medium">🏊 UM Swim Team</span>}
          </div>
        </div>

        {/* Centered Action Buttons */}
        <div className="mt-6 flex gap-3 justify-center">
          <Button variant="outline" className="gap-2 rounded-full px-6">
            <Users className="h-4 w-4" />Connect
          </Button>
          <Button variant="secondary" className="gap-2 rounded-full px-6" onClick={onEditProfile}>
            <Edit className="h-4 w-4" />Edit Profile
          </Button>
        </div>

      </CardContent>
    </Card>
  );
}