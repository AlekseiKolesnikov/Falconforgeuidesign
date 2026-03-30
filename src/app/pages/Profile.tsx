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

  // Post Interaction States
  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false);
  const [newPostContent, setNewPostContent] = useState("");
  const [newPostImage, setNewPostImage] = useState<File | null>(null);
  const [newPostImagePreview, setNewPostImagePreview] = useState<string | null>(null);
  const [editingPostId, setEditingPostId] = useState<number | null>(null);
  const [editPostContent, setEditPostContent] = useState("");
  const [postToDelete, setPostToDelete] = useState<any | null>(null);

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
      const { data } = await supabase.from('posts').select(`*, post_likes(user_id), post_comments(id)`).eq('user_id', profile.id).order('created_at', { ascending: false });
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
      const fileName = `avatar_${Math.random()}.jpg`;
      const filePath = `${profile.id}/${fileName}`;
      await supabase.storage.from('profile_images').upload(filePath, croppedImageBlob, { upsert: true });
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

  const createPostMutation = useMutation({
    mutationFn: async () => {
      if (!profile?.id || !newPostContent.trim()) return;
      let imageUrl = null;
      if (newPostImage) {
        const filePath = `${profile.id}/post_${Math.random()}.${newPostImage.name.split('.').pop()}`;
        await supabase.storage.from('post_images').upload(filePath, newPostImage);
        const { data } = supabase.storage.from('post_images').getPublicUrl(filePath);
        imageUrl = data.publicUrl;
      }
      await supabase.from('posts').insert({
        user_id: profile.id,
        content: newPostContent.trim(),
        image_url: imageUrl,
      });
    },
    onSuccess: () => {
      setIsCreatePostOpen(false);
      setNewPostContent("");
      setNewPostImage(null);
      setNewPostImagePreview(null);
      queryClient.invalidateQueries({ queryKey: ['userPosts', profile?.id] });
    }
  });

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

      {/* 1. TOP LEVEL ALERT DIALOG (Ensures visibility over cards) */}
      <AlertDialog open={postToDelete !== null} onOpenChange={(isOpen) => !isOpen && setPostToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone. This will permanently delete your post.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => { if (postToDelete) deletePostMutation.mutate(postToDelete.id); }}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="container max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* HEADER CARD */}
        <Card className="overflow-hidden shadow-sm border-0">
          <div className="h-64 relative bg-muted">
            <img src={profile.banner_url || FALLBACK_COVER} alt="Cover" className="w-full h-full object-cover" />
            <div className="absolute top-4 right-4 flex gap-2 z-10">
              <label className="cursor-pointer bg-secondary hover:bg-secondary/80 text-secondary-foreground h-9 w-9 flex items-center justify-center rounded-full shadow-md transition-colors">
                <Camera className="h-4 w-4" />
                <input type="file" className="hidden" accept="image/*" onChange={handleBannerUpload} />
              </label>
            </div>
          </div>

          <CardContent className="relative pt-0 pb-6 bg-card">
            <div className="flex justify-between items-start">
              <div className="-mt-20 relative z-10 w-fit">
                <Avatar className="h-40 w-40 border-4 border-card shadow-xl bg-muted">
                  <AvatarImage src={profile.profile_photo_url} className="object-cover" />
                  <AvatarFallback className="text-4xl">{profile.first_name[0]}{profile.last_name[0]}</AvatarFallback>
                </Avatar>
                <Button size="icon" variant="secondary" className="absolute bottom-1 right-1 h-9 w-9 rounded-full shadow-md z-10 hover:bg-secondary/80" onClick={() => { setCropImage(profile.profile_photo_url || null); setZoom(1); setCrop({ x: 0, y: 0 }); setIsPositionImageOpen(true); }}>
                  <Pencil className="h-4 w-4" />
                </Button>
              </div>
              <div className="pt-4 flex gap-2">
                <Button variant="outline" className="gap-2 rounded-full"><Users className="h-4 w-4" />Connect</Button>
                <Button variant="secondary" className="gap-2 rounded-full" onClick={openEditProfile}><Edit className="h-4 w-4" />Edit Profile</Button>
              </div>
            </div>
            <div className="mt-4">
              <h1 className="text-3xl font-bold text-foreground">{profile.first_name} {profile.last_name}</h1>
              <p className="text-lg text-foreground mt-1">{profile.headline || "Student at University of Montevallo"}</p>
            </div>
          </CardContent>
        </Card>

        {/* ACTIVITY CARD */}
        <Card className="shadow-sm border-0">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-xl">Activity</CardTitle>
            <Button variant="outline" className="rounded-full font-semibold border-primary text-primary hover:bg-primary/5" onClick={() => setIsCreatePostOpen(true)}>Create a post</Button>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              {userPosts.map((post: any) => (
                <Card key={post.id} className="border border-border shadow-none overflow-hidden flex flex-col relative group">
                  <CardHeader className="p-4 pb-2">
                    <div className="flex items-start justify-between">
                      {editingPostId === post.id ? (
                        <div className="w-full space-y-3 mt-2">
                          <Textarea value={editPostContent} onChange={(e) => setEditPostContent(e.target.value)} className="min-h-[100px] p-4 border border-border rounded-xl focus-visible:ring-1 bg-background" />
                          <div className="flex justify-end gap-2">
                            <Button variant="outline" size="sm" className="rounded-full" onClick={() => setEditingPostId(null)}>Cancel</Button>
                            <Button size="sm" className="rounded-full" onClick={() => updatePostMutation.mutate({ postId: post.id, content: editPostContent })}>Save</Button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <p className="text-sm text-foreground line-clamp-2 pr-8">{post.content}</p>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity absolute top-2 right-2"><MoreHorizontal className="h-4 w-4" /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onSelect={(e) => { 
                                e.preventDefault();
                                setEditingPostId(post.id); 
                                setEditPostContent(post.content); 
                              }}>
                                <Pencil className="mr-2 h-4 w-4" /> Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-destructive" onSelect={(e) => { 
                                e.preventDefault();
                                setPostToDelete(post); 
                              }}>
                                <Trash2 className="mr-2 h-4 w-4" /> Delete
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
      </div>

      {/* --- MODALS --- */}
      <Dialog open={isEditProfileOpen} onOpenChange={setIsEditProfileOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader><DialogTitle>Edit Profile Info</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>First Name</Label><Input value={editForm.first_name} onChange={(e) => setEditForm({ ...editForm, first_name: e.target.value })} /></div>
              <div className="space-y-2"><Label>Last Name</Label><Input value={editForm.last_name} onChange={(e) => setEditForm({ ...editForm, last_name: e.target.value })} /></div>
            </div>
            <div className="space-y-2"><Label>Headline</Label><Input value={editForm.headline} onChange={(e) => setEditForm({ ...editForm, headline: e.target.value })} /></div>
            <div className="space-y-2"><Label>Bio</Label><Textarea value={editForm.bio} onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })} /></div>
          </div>
          <DialogFooter><Button onClick={() => updateProfileMutation.mutate(editForm)}>Save Changes</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isPositionImageOpen} onOpenChange={setIsPositionImageOpen}>
        <DialogContent className="sm:max-w-[600px] p-10 rounded-2xl flex flex-col items-center">
          <div className="w-[380px] h-[380px] relative overflow-hidden rounded-full border shadow-xl bg-muted mb-6">
            {cropImage && <Cropper image={cropImage} crop={crop} zoom={zoom} aspect={1} cropShape="round" onCropChange={setCrop} onZoomChange={setZoom} onCropComplete={(_, p) => setCroppedAreaPixels(p as any)} />}
          </div>
          <Slider value={[zoom]} min={1} max={3} step={0.1} onValueChange={(v) => setZoom(v[0])} className="w-full max-w-sm mb-8" />
          <DialogFooter className="w-full flex justify-end gap-3">
             <Button variant="outline" onClick={() => setIsPositionImageOpen(false)}>Cancel</Button>
             <Button onClick={async () => { if (cropImage && croppedAreaPixels) { const blob = await getCroppedImg(cropImage, croppedAreaPixels); saveCroppedImageMutation.mutate(blob); } }}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isCreatePostOpen} onOpenChange={setIsCreatePostOpen}>
        <DialogContent className="sm:max-w-[550px] p-6 rounded-2xl flex flex-col">
          <DialogHeader><DialogTitle>Create a post</DialogTitle></DialogHeader>
          <Textarea placeholder="What's on your mind?" className="min-h-[120px] p-4 text-lg border border-border rounded-xl mt-4" value={newPostContent} onChange={(e) => setNewPostContent(e.target.value)} />
          <DialogFooter className="border-t pt-4 mt-4 flex justify-between items-center">
            <label className="cursor-pointer p-2 hover:bg-muted rounded-full">
              <ImageIcon className="h-5 w-5" />
              <input type="file" className="hidden" accept="image/*" onChange={(e) => { const f = e.target.files?.[0]; if(f) { setNewPostImage(f); setNewPostImagePreview(URL.createObjectURL(f)); } }} />
            </label>
            <Button className="rounded-full px-8" onClick={() => createPostMutation.mutate()}>Post</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}