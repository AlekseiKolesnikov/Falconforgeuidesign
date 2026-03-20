import React, { useEffect, useState, useRef } from "react";
import { supabase } from "../../lib/supabase";
import { Navigation } from "../components/Navigation";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "../components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Separator } from "../components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../components/ui/dialog";
import { Label } from "../components/ui/label";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import {
  MapPin, Mail, Calendar, Briefcase, GraduationCap,
  TrendingUp, Users, Share2, Edit, Camera, Trash2, ThumbsUp, MessageCircle
} from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../components/ui/dropdown-menu";

// --- INTERFACES ---
interface ProfileData {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  headline?: string;
  bio?: string;
  major?: string;
  location?: string;
  banner_url?: string;
  graduation_year?: number;
  profile_photo_url?: string;
  university_id?: number;
  user_type: string;
  is_verified: boolean;
  role?: string;
  swimmer?: boolean;
  created_at?: string;
}

const FALLBACK_COVER = "https://images.unsplash.com/photo-1759889392274-246af1a984ba?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx1bml2ZXJzaXR5JTIwY2FtcHVzJTIwcHVycGxlJTIwYnVpbGRpbmd8ZW58MXx8fHwxNzczMDAwMjgyfDA&ixlib=rb-4.1.0&q=80&w=1080";

export function Profile() {
  const queryClient = useQueryClient();
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [education, setEducation] = useState<any[]>([]);
  const [experiences, setExperiences] = useState<any[]>([]);
  const [skills, setSkills] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    first_name: "", last_name: "", headline: "", bio: "", major: "", location: ""
  });

  // --- QUERIES ---
  const fetchProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: userData } = await supabase
        .from("users")
        .select("*")
        .eq("auth_users_uuid", user.id)
        .single();

      if (userData) {
        setProfile(userData);
        // Fetch relations
        const { data: eduData } = await supabase.from("education").select("*").eq("user_id", userData.id);
        const { data: expData } = await supabase.from("experiences").select("*").eq("user_id", userData.id).order("end_date", { ascending: false });
        const { data: skillsData } = await supabase.from("user_skills").select("proficiency_level, skills(name)").eq("user_id", userData.id);

        setEducation(eduData || []);
        setExperiences(expData || []);
        // @ts-ignore
        setSkills(skillsData?.map(s => ({ name: s.skills?.name, level: s.proficiency_level })) || []);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProfile(); }, []);

  // Fetch this user's posts for the Activity section
  const { data: userPosts = [] } = useQuery({
    queryKey: ['userPosts', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];
      const { data } = await supabase
        .from('posts')
        .select(`*, post_likes(user_id), post_comments(id)`)
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false })
        .limit(4);
      return data || [];
    },
    enabled: !!profile?.id,
  });

  // --- MUTATIONS ---
  const updateProfileMutation = useMutation({
    mutationFn: async (formData: typeof editForm) => {
      await supabase.from('users').update(formData).eq('id', profile?.id);
    },
    onSuccess: () => {
      setIsEditProfileOpen(false);
      fetchProfile();
    }
  });

  // Image Upload Logic
  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>, type: 'avatar' | 'banner') => {
    const file = event.target.files?.[0];
    if (!file || !profile?.id) return;

    try {
      const fileExt = file.name.split('.').pop();
      const filePath = `${profile.id}/${type}_${Math.random()}.${fileExt}`;

      await supabase.storage.from('profile_images').upload(filePath, file);
      const { data } = supabase.storage.from('profile_images').getPublicUrl(filePath);

      const updateData = type === 'avatar'
        ? { profile_photo_url: data.publicUrl }
        : { banner_url: data.publicUrl };

      await supabase.from('users').update(updateData).eq('id', profile.id);
      fetchProfile(); // Refresh screen
    } catch (error) {
      console.error("Upload failed", error);
    }
  };

  const deleteImage = async (type: 'avatar' | 'banner') => {
    if (!profile?.id) return;
    const updateData = type === 'avatar' ? { profile_photo_url: null } : { banner_url: null };
    await supabase.from('users').update(updateData).eq('id', profile.id);
    fetchProfile();
  };

  const openEditProfile = () => {
    if (profile) {
      setEditForm({
        first_name: profile.first_name || "", last_name: profile.last_name || "",
        headline: profile.headline || "", bio: profile.bio || "",
        major: profile.major || "", location: profile.location || ""
      });
      setIsEditProfileOpen(true);
    }
  };

  if (loading) return <div className="text-center py-20 text-muted-foreground">Loading profile...</div>;
  if (!profile) return <div className="text-center py-20 text-muted-foreground">Profile not found.</div>;

  return (
    <div className="min-h-screen bg-muted/30 pb-20 lg:pb-0">
      <Navigation />

      {/* SINGLE COLUMN LAYOUT (Max width 4xl for LinkedIn style) */}
      <div className="container max-w-4xl mx-auto px-4 py-6 space-y-6">

        {/* 1. HEADER CARD */}
        <Card className="overflow-hidden shadow-sm border-0">
          {/* Cover Image */}
          <div className="h-64 relative bg-muted">
            <img src={profile.banner_url || FALLBACK_COVER} alt="Cover" className="w-full h-full object-cover" />
            <input type="file" hidden ref={bannerInputRef} accept="image/*" onChange={(e) => handleImageUpload(e, 'banner')} />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="secondary" size="icon" className="absolute top-4 right-4 rounded-full shadow-md z-10">
                  <Camera className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onSelect={(e) => { e.preventDefault(); bannerInputRef.current?.click(); }}
                  className="cursor-pointer"
                >
                  <Camera className="mr-2 h-4 w-4" /> Change Cover
                </DropdownMenuItem>
                {profile.banner_url && (
                  <DropdownMenuItem onClick={() => deleteImage('banner')} className="cursor-pointer text-destructive focus:text-destructive">
                    <Trash2 className="mr-2 h-4 w-4" /> Remove Cover
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <CardContent className="relative pt-0 pb-6 bg-card">
            {/* Avatar & Action Buttons */}
            <div className="flex justify-between items-start">
              <div className="-mt-20 relative z-10">
                <Avatar className="h-40 w-40 border-4 border-card shadow-xl bg-muted">
                  <AvatarImage src={profile.profile_photo_url} className="object-cover" />
                  <AvatarFallback className="text-4xl">{profile.first_name[0]}{profile.last_name[0]}</AvatarFallback>
                </Avatar>
                <input type="file" hidden ref={avatarInputRef} accept="image/*" onChange={(e) => handleImageUpload(e, 'avatar')} />

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="icon" variant="secondary" className="absolute bottom-2 right-2 h-9 w-9 rounded-full shadow-md">
                      <Camera className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    <DropdownMenuItem
                      onSelect={(e) => { e.preventDefault(); avatarInputRef.current?.click(); }}
                      className="cursor-pointer"
                    >
                      <Camera className="mr-2 h-4 w-4" /> Upload Photo
                    </DropdownMenuItem>
                    {profile.profile_photo_url && (
                      <DropdownMenuItem onSelect={() => deleteImage('avatar')} className="cursor-pointer text-destructive focus:text-destructive">
                        <Trash2 className="mr-2 h-4 w-4" /> Remove Photo
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="pt-4 flex gap-2">
                <Button variant="outline" className="gap-2 rounded-full"><Users className="h-4 w-4" />Connect</Button>
                <Button variant="secondary" className="gap-2 rounded-full" onClick={openEditProfile}><Edit className="h-4 w-4" />Edit Profile</Button>
              </div>
            </div>

            {/* Basic Info */}
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

        {/* 2. ABOUT & SKILLS CARD (Full Width) */}
        <Card className="shadow-sm border-0">
          <CardHeader><CardTitle className="text-xl">About</CardTitle></CardHeader>
          <CardContent>
            <p className="text-foreground leading-relaxed whitespace-pre-wrap">
              {profile.bio || "No bio added yet."}
            </p>

            {skills.length > 0 && (
              <div className="mt-6">
                <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" /> Top Skills
                </h3>
                <div className="flex flex-wrap gap-2">
                  {skills.map((skill, i) => (
                    <Badge key={i} variant="secondary" className="px-3 py-1 text-sm bg-muted hover:bg-muted/80">
                      {skill.name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 3. ACTIVITY (Recent Posts) */}
        <Card className="shadow-sm border-0">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-xl">Activity</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">{userPosts.length} posts</p>
            </div>
            <Button variant="outline" className="rounded-full font-semibold border-primary text-primary hover:bg-primary/5">Create a post</Button>
          </CardHeader>
          <CardContent>
            {userPosts.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">No activity yet.</p>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {userPosts.map((post: any) => (
                  <Card key={post.id} className="border border-border shadow-none overflow-hidden flex flex-col">
                    <CardHeader className="p-4 pb-2">
                      <p className="text-sm text-foreground line-clamp-2">{post.content}</p>
                    </CardHeader>
                    {post.image_url && (
                      <div className="w-full h-48 bg-muted mt-2">
                        <img src={post.image_url} alt="Post" className="w-full h-full object-cover" />
                      </div>
                    )}
                    <CardFooter className="p-3 bg-muted/30 flex gap-4 text-xs text-muted-foreground mt-auto">
                      <span className="flex items-center gap-1"><ThumbsUp className="h-3 w-3" /> {post.post_likes?.length || 0}</span>
                      <span className="flex items-center gap-1"><MessageCircle className="h-3 w-3" /> {post.post_comments?.length || 0} comments</span>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* 4. EXPERIENCE */}
        <Card className="shadow-sm border-0">
          <CardHeader><CardTitle className="text-xl">Experience</CardTitle></CardHeader>
          <CardContent className="space-y-6">
            {experiences.length === 0 ? (
              <p className="text-muted-foreground text-center">No experience added yet.</p>
            ) : (
              experiences.map((exp, i) => (
                <div key={i} className="flex gap-4">
                  <div className="bg-primary/10 p-3 rounded-xl h-fit shrink-0"><Briefcase className="h-6 w-6 text-primary" /></div>
                  <div>
                    <h3 className="font-semibold text-lg text-foreground">{exp.title}</h3>
                    <p className="text-primary font-medium">{exp.organization_name}</p>
                    <p className="text-sm text-muted-foreground">{exp.start_date} - {exp.is_current ? 'Present' : exp.end_date} {exp.location && `• ${exp.location}`}</p>
                    {exp.description && <p className="text-foreground text-sm mt-2 whitespace-pre-wrap">{exp.description}</p>}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* 5. EDUCATION */}
        <Card className="shadow-sm border-0">
          <CardHeader><CardTitle className="text-xl">Education</CardTitle></CardHeader>
          <CardContent className="space-y-6">
            {education.length === 0 ? (
              <p className="text-muted-foreground text-center">No education added yet.</p>
            ) : (
              education.map((edu, i) => (
                <div key={i} className="flex gap-4">
                  <div className="bg-muted p-3 rounded-xl h-fit shrink-0"><GraduationCap className="h-6 w-6 text-foreground" /></div>
                  <div>
                    <h3 className="font-semibold text-lg text-foreground">{edu.school_name}</h3>
                    <p className="text-foreground">{edu.degree ? `${edu.degree}, ` : ''}{edu.field_of_study}</p>
                    <p className="text-sm text-muted-foreground">{edu.start_year || ''} - {edu.end_year || 'Expected'}</p>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* EDIT PROFILE MODAL */}
      <Dialog open={isEditProfileOpen} onOpenChange={setIsEditProfileOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader><DialogTitle>Edit Profile Info</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>First Name</Label><Input value={editForm.first_name} onChange={(e) => setEditForm({ ...editForm, first_name: e.target.value })} /></div>
              <div className="space-y-2"><Label>Last Name</Label><Input value={editForm.last_name} onChange={(e) => setEditForm({ ...editForm, last_name: e.target.value })} /></div>
            </div>
            <div className="space-y-2"><Label>Headline</Label><Input value={editForm.headline} onChange={(e) => setEditForm({ ...editForm, headline: e.target.value })} /></div>
            <div className="space-y-2"><Label>Location</Label><Input placeholder="e.g. Montevallo, Alabama" value={editForm.location} onChange={(e) => setEditForm({ ...editForm, location: e.target.value })} /></div>
            <div className="space-y-2"><Label>Bio</Label><Textarea className="min-h-[100px]" value={editForm.bio} onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditProfileOpen(false)}>Cancel</Button>
            <Button onClick={() => updateProfileMutation.mutate(editForm)} disabled={updateProfileMutation.isPending}>{updateProfileMutation.isPending ? "Saving..." : "Save Changes"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}