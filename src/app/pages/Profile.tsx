import * as React from "react";
import { useEffect, useState, useRef } from "react";
import { supabase } from "../../lib/supabase";
import { Navigation } from "../components/Navigation";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "../components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../components/ui/dialog";
import { Label } from "../components/ui/label";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { Slider } from "../components/ui/slider";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../components/ui/alert-dialog";
import {
  MapPin, Mail, Briefcase, GraduationCap,
  TrendingUp, Users, Edit, Camera, Trash2, ThumbsUp, MessageCircle, Pencil,
  X, Image as ImageIcon, MoreHorizontal
} from "lucide-react";
import Cropper from 'react-easy-crop';
import 'react-easy-crop/react-easy-crop.css';

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

// --- UTILITY: Generate Cropped Image Blob ---
const getCroppedImg = async (imageSrc: string, pixelCrop: any): Promise<Blob> => {
  const image = new Image();
  image.src = imageSrc;
  image.crossOrigin = "anonymous";
  await image.decode();

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) throw new Error("Could not create canvas context");

  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("Canvas is empty"));
    }, 'image/jpeg', 0.95);
  });
};

export function Profile() {
  const queryClient = useQueryClient();
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  // --- STATE ---
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [education, setEducation] = useState<any[]>([]);
  const [experiences, setExperiences] = useState<any[]>([]);
  const [skills, setSkills] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals State
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    first_name: "", last_name: "", headline: "", bio: "", major: "", location: ""
  });

  // Image Cropper State
  const [isPositionImageOpen, setIsPositionImageOpen] = useState(false);
  const [cropImage, setCropImage] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  // Create Post State
  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false);
  const [newPostContent, setNewPostContent] = useState("");
  const [newPostImage, setNewPostImage] = useState<File | null>(null);
  const [newPostImagePreview, setNewPostImagePreview] = useState<string | null>(null);
  const [editingPostId, setEditingPostId] = useState<number | null>(null);
  const [editPostContent, setEditPostContent] = useState("");

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

  // --- MUTATIONS & HANDLERS ---
  const updateProfileMutation = useMutation({
    mutationFn: async (formData: typeof editForm) => {
      await supabase.from('users').update(formData).eq('id', profile?.id);
    },
    onSuccess: () => {
      setIsEditProfileOpen(false);
      fetchProfile();
    }
  });

  const handleBannerUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !profile?.id) return;
    try {
      const fileExt = file.name.split('.').pop();
      const filePath = `${profile.id}/banner_${Math.random()}.${fileExt}`;
      await supabase.storage.from('profile_images').upload(filePath, file);
      const { data } = supabase.storage.from('profile_images').getPublicUrl(filePath);
      await supabase.from('users').update({ banner_url: data.publicUrl }).eq('id', profile.id);
      fetchProfile();
    } catch (error) { console.error("Banner upload failed", error); }
  };

  const handleAvatarSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setCropImage(reader.result as string);
      setZoom(1);
      setCrop({ x: 0, y: 0 });
      setIsPositionImageOpen(true);
      if (avatarInputRef.current) avatarInputRef.current.value = "";
    };
    reader.readAsDataURL(file);
  };

  const saveCroppedImageMutation = useMutation({
    mutationFn: async (croppedImageBlob: Blob) => {
      if (!profile?.id) throw new Error("No profile ID found");

      const fileExt = 'jpg';
      const fileName = `avatar_${Math.random()}.${fileExt}`;
      const filePath = `${profile.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('profile_images')
        .upload(filePath, croppedImageBlob, { upsert: true });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('profile_images').getPublicUrl(filePath);
      await supabase.from('users').update({ profile_photo_url: data.publicUrl }).eq('id', profile.id);
    },
    onSuccess: () => {
      setIsPositionImageOpen(false);
      setCropImage(null);
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      fetchProfile();
    }
  });

  const deleteImageMutation = useMutation({
    mutationFn: async () => {
      if (!profile?.id) return;
      await supabase.from('users').update({ profile_photo_url: null }).eq('id', profile.id);
    },
    onSuccess: () => {
      setIsPositionImageOpen(false);
      fetchProfile();
    }
  });

  const deleteBanner = async () => {
    if (!profile?.id) return;
    await supabase.from('users').update({ banner_url: null }).eq('id', profile.id);
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

  // --- POST INTERACTION LOGIC (Matches Feed.tsx patterns) ---
  const [postToDelete, setPostToDelete] = useState<any | null>(null);

  const handlePostImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setNewPostImage(file);
      const reader = new FileReader();
      reader.onloadend = () => setNewPostImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const createPostMutation = useMutation({
    mutationFn: async () => {
      if (!profile?.id || !newPostContent.trim()) return;
      let imageUrl = null;
      if (newPostImage) {
        const filePath = `${profile.id}/post_${Math.random()}.${newPostImage.name.split('.').pop()}`;
        const { error: uploadError } = await supabase.storage.from('post_images').upload(filePath, newPostImage);
        if (uploadError) throw uploadError;
        const { data } = supabase.storage.from('post_images').getPublicUrl(filePath);
        imageUrl = data.publicUrl;
      }
      const { error } = await supabase.from('posts').insert({
        user_id: profile.id,
        content: newPostContent.trim(),
        image_url: imageUrl,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setIsCreatePostOpen(false);
      setNewPostContent("");
      setNewPostImage(null);
      setNewPostImagePreview(null);
      queryClient.invalidateQueries({ queryKey: ['userPosts', profile?.id] });
    }
  });

  const deletePostMutation = useMutation({
    mutationFn: async (postId: number) => {
      const { error } = await supabase.from('posts').delete().eq('id', postId);
      if (error) throw error;
    },
    onSuccess: () => {
      setPostToDelete(null);
      queryClient.invalidateQueries({ queryKey: ['userPosts', profile?.id] });
    }
  });

  const updatePostMutation = useMutation({
    mutationFn: async ({ postId, content }: { postId: number, content: string }) => {
      const { error } = await supabase.from('posts').update({ content: content.trim() }).eq('id', postId);
      if (error) throw error;
    },
    onSuccess: () => {
      setEditingPostId(null);
      queryClient.invalidateQueries({ queryKey: ['userPosts', profile?.id] });
    }
  });

  // Early returns must stay AFTER the hooks above
  if (loading) return <div className="text-center py-20 text-muted-foreground">Loading profile...</div>;
  if (!profile) return <div className="text-center py-20 text-muted-foreground">Profile not found.</div>;

  return (
    <div className="min-h-screen bg-muted/30 pb-20 lg:pb-0">
      <Navigation />

      <div className="container max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* 1. HEADER CARD */}
        <Card className="overflow-hidden shadow-sm border-0">

          {/* Cover Image */}
          <div className="h-64 relative bg-muted">
            <img src={profile.banner_url || FALLBACK_COVER} alt="Cover" className="w-full h-full object-cover" />

            <div className="absolute top-4 right-4 flex gap-2 z-10">
              <label className="cursor-pointer bg-secondary hover:bg-secondary/80 text-secondary-foreground h-9 w-9 flex items-center justify-center rounded-full shadow-md transition-colors">
                <Camera className="h-4 w-4" />
                <input type="file" className="hidden" accept="image/*" onChange={handleBannerUpload} />
              </label>

              {profile.banner_url && (
                <Button variant="destructive" size="icon" className="h-9 w-9 rounded-full shadow-md" onClick={deleteBanner}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          <CardContent className="relative pt-0 pb-6 bg-card">
            <div className="flex justify-between items-start">

              {/* Avatar & Action Buttons */}
              <div className="-mt-20 relative z-10 w-fit">
                <Avatar className="h-40 w-40 border-4 border-card shadow-xl bg-muted">
                  <AvatarImage src={profile.profile_photo_url} className="object-cover" />
                  <AvatarFallback className="text-4xl">{profile.first_name[0]}{profile.last_name[0]}</AvatarFallback>
                </Avatar>

                {profile.profile_photo_url ? (
                  <Button
                    size="icon"
                    variant="secondary"
                    className="absolute bottom-1 right-1 h-9 w-9 rounded-full shadow-md z-10 hover:bg-secondary/80"
                    onClick={() => {
                      setCropImage(profile.profile_photo_url || null);
                      setZoom(1);
                      setCrop({ x: 0, y: 0 });
                      setIsPositionImageOpen(true);
                    }}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                ) : (
                  <label className="cursor-pointer bg-secondary hover:bg-secondary/80 text-secondary-foreground absolute bottom-1 right-1 h-9 w-9 flex items-center justify-center rounded-full shadow-md transition-colors z-10">
                    <Camera className="h-4 w-4" />
                    <input type="file" className="hidden" accept="image/*" onChange={handleAvatarSelect} />
                  </label>
                )}
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

        {/* 2. ABOUT CARD */}
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

        {/* 3. ACTIVITY CARD */}
        <Card className="shadow-sm border-0">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-xl">Activity</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">{userPosts.length} posts</p>
            </div>
            <Button variant="outline" className="rounded-full font-semibold border-primary text-primary hover:bg-primary/5" onClick={() => setIsCreatePostOpen(true)}>Create a post</Button>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              {userPosts.map((post: any) => (
                <Card key={post.id} className="border border-border shadow-none overflow-hidden flex flex-col relative group">
                  <CardHeader className="p-4 pb-2">
                    <div className="flex items-start justify-between">

                      {editingPostId === post.id ? (
                        /* INLINE EDIT MODE */
                        <div className="w-full space-y-3 mt-2">
                          <Textarea
                            value={editPostContent}
                            onChange={(e) => setEditPostContent(e.target.value)}
                            className="min-h-[100px] p-4 border border-border rounded-xl focus-visible:ring-1 bg-background"
                          />
                          <div className="flex justify-end gap-2">
                            <Button variant="outline" size="sm" className="rounded-full" onClick={() => setEditingPostId(null)}>Cancel</Button>
                            <Button
                              size="sm"
                              className="rounded-full"
                              onClick={() => updatePostMutation.mutate({ postId: post.id, content: editPostContent })}
                              disabled={updatePostMutation.isPending || !editPostContent.trim()}
                            >
                              {updatePostMutation.isPending ? 'Saving...' : 'Save'}
                            </Button>
                          </div>
                        </div>
                      ) : (
                        /* VIEW MODE */
                        <>
                          <p className="text-sm text-foreground line-clamp-2 pr-8">{post.content}</p>
                          
                          {/* EXACT MATCH OF FEED.TSX DROPDOWN */}
                          <DropdownMenu>
                            <DropdownMenuTrigger className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <MoreHorizontal className="h-5 w-5" />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-40 z-50 bg-popover text-popover-foreground border shadow-md">
                              <DropdownMenuItem
                                className="cursor-pointer flex items-center p-2 outline-none"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingPostId(post.id);
                                  setEditPostContent(post.content || '');
                                }}
                              >
                                <Pencil className="mr-2 h-4 w-4" />
                                <span>Edit Post</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-destructive focus:bg-destructive/10 focus:text-destructive cursor-pointer flex items-center p-2 outline-none"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setPostToDelete(post);
                                }}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                <span>Delete Post</span>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </>
                      )}
                    </div>
                  </CardHeader>
                  {post.image_url && <img src={post.image_url} className="w-full h-48 object-cover mt-auto" />}
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 4. EXPERIENCE CARD */}
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

        {/* 5. EDUCATION CARD */}
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

      {/* ----------------- MODALS ----------------- */}

      {/* MODAL: EDIT PROFILE */}
      <Dialog open={isEditProfileOpen} onOpenChange={setIsEditProfileOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Profile Info</DialogTitle>
          </DialogHeader>

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

      {/* MODAL: ADJUST IMAGE POSITION */}
      <Dialog open={isPositionImageOpen} onOpenChange={setIsPositionImageOpen}>
        <DialogContent className="sm:max-w-[700px] h-fit max-h-[95vh] flex flex-col pt-10 px-10 pb-4 rounded-2xl">
          <DialogHeader>
            <DialogTitle>Adjust Image Position & Zoom</DialogTitle>
          </DialogHeader>

          <div className="flex-1 flex flex-col items-center justify-center p-4">
            <p className="text-center text-muted-foreground leading-relaxed mb-6">
              Drag the image inside the circle to adjust its position, and use the slider to zoom in or out.
            </p>

            <div className="w-[400px] h-[400px] relative overflow-hidden rounded-full border-4 border-card shadow-xl bg-muted mb-6">
              {cropImage && (
                <Cropper
                  image={cropImage}
                  crop={crop}
                  zoom={zoom}
                  aspect={1 / 1}
                  cropShape="round"
                  showGrid={false}
                  onCropChange={setCrop}
                  onZoomChange={setZoom}
                  onCropComplete={(_, croppedPixels) => setCroppedAreaPixels(croppedPixels as any)}
                />
              )}
            </div>

            <div className="w-full max-w-sm mb-4">
              <Slider
                defaultValue={[1]}
                max={3}
                min={1}
                step={0.1}
                value={[zoom]}
                onValueChange={(val) => setZoom(val[0])}
                className="w-full"
              />
            </div>
          </div>

          <DialogFooter className="flex gap-3 justify-between items-center mt-2 p-2">
            <Button variant="outline" className="h-10 w-[140px] rounded-full font-semibold shrink-0" onClick={() => { setIsPositionImageOpen(false); setCropImage(null); }}>
              Cancel
            </Button>

            <div className="flex gap-3 justify-end items-center">
              <label className="cursor-pointer bg-secondary hover:bg-secondary/80 text-secondary-foreground text-sm whitespace-nowrap h-10 w-[140px] shrink-0 inline-flex items-center justify-center rounded-full font-semibold transition-colors">
                <Camera className="mr-2 h-4 w-4 shrink-0" /> Upload New
                <input type="file" className="hidden" accept="image/*" onChange={handleAvatarSelect} />
              </label>

              {profile.profile_photo_url && (
                <Button
                  variant="destructive"
                  className="h-10 w-[140px] rounded-full font-semibold shrink-0 gap-2"
                  onClick={() => {
                    deleteImageMutation.mutate();
                    setIsPositionImageOpen(false);
                  }}
                  disabled={deleteImageMutation.isPending}
                >
                  <Trash2 className="mr-2 h-4 w-4 shrink-0" />
                  {deleteImageMutation.isPending ? "..." : "Delete"}
                </Button>
              )}

              <Button
                className="h-10 w-[140px] rounded-full font-semibold shrink-0"
                onClick={async () => {
                  if (cropImage && croppedAreaPixels) {
                    const croppedImageBlob = await getCroppedImg(cropImage, croppedAreaPixels);
                    saveCroppedImageMutation.mutate(croppedImageBlob);
                  }
                }}
                disabled={saveCroppedImageMutation.isPending}
              >
                {saveCroppedImageMutation.isPending ? "Saving..." : "Save"}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL: CREATE POST */}
      <Dialog open={isCreatePostOpen} onOpenChange={setIsCreatePostOpen}>
        <DialogContent className="sm:max-w-[550px] p-6 rounded-2xl flex flex-col gap-0">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-xl">Create a post</DialogTitle>
          </DialogHeader>

          <div className="flex gap-4 mb-4">
            <Avatar className="h-12 w-12 border border-border">
              <AvatarImage src={profile?.profile_photo_url} className="object-cover" />
              <AvatarFallback>{profile?.first_name?.[0]}{profile?.last_name?.[0]}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col justify-center">
              <span className="font-semibold text-foreground">{profile?.first_name} {profile?.last_name}</span>
            </div>
          </div>

          <Textarea
            placeholder="What do you want to talk about?"
            className="min-h-[120px] resize-none text-lg border border-border rounded-xl focus-visible:ring-1 p-4 shadow-none mb-4"
            value={newPostContent}
            onChange={(e) => setNewPostContent(e.target.value)}
          />

          {newPostImagePreview && (
            <div className="relative w-full h-64 bg-muted rounded-xl overflow-hidden mb-4 border">
              <img src={newPostImagePreview} alt="Preview" className="w-full h-full object-cover" />
              <Button
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2 h-8 w-8 rounded-full shadow-md"
                onClick={() => {
                  setNewPostImage(null);
                  setNewPostImagePreview(null);
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}

          <DialogFooter className="flex justify-between items-center sm:justify-between border-t pt-4 mt-auto">
            <div className="flex items-center gap-2">
              <label className="cursor-pointer text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors p-2.5 rounded-full">
                <ImageIcon className="h-5 w-5" />
                <input type="file" className="hidden" accept="image/*" onChange={handlePostImageSelect} />
              </label>
            </div>
            <Button
              className="rounded-full font-semibold px-6"
              disabled={!newPostContent.trim() || createPostMutation.isPending}
              onClick={() => createPostMutation.mutate()}
            >
              {createPostMutation.isPending ? "Posting..." : "Post"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* EXACT MATCH OF FEED.TSX ALERT DIALOG */}
      <AlertDialog open={postToDelete !== null} onOpenChange={(isOpen) => !isOpen && setPostToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone. This will permanently delete your post.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90" 
              onClick={() => { 
                if (postToDelete) { 
                  deletePostMutation.mutate(postToDelete.id); 
                  setPostToDelete(null); 
                } 
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}