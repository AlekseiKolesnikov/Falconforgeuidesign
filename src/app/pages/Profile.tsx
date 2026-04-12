import * as React from "react";
import { useEffect, useState, useRef } from "react";
import { supabase } from "../../lib/supabase";
import { Navigation } from "../components/Navigation";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../components/ui/dialog";
import { Label } from "../components/ui/label";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { Slider } from "../components/ui/slider";
import { X, Image as ImageIcon, Trash2 } from "lucide-react";
import Cropper from 'react-easy-crop';
import { useParams } from "react-router-dom"; // <-- ADDED FOR DYNAMIC ROUTING

// IMPORT YOUR CLEAN COMPONENTS
import { PostCard } from "../components/PostCard";
import { ProfileExperience } from "../components/profile/ProfileExperience";
import { ProfileEducation } from "../components/profile/ProfileEducation";
import { ProfileAbout } from "../components/profile/ProfileAbout";
import { ProfileHeader } from "../components/profile/ProfileHeader";

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
  ctx.drawImage(image, pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height, 0, 0, pixelCrop.width, pixelCrop.height);

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => { if (blob) resolve(blob); else reject(new Error("Canvas is empty")); }, 'image/jpeg', 0.95);
  });
};

export function Profile() {
  const queryClient = useQueryClient();
  const avatarInputRef = useRef<HTMLInputElement>(null);
  
  // <-- URL PARAMETER GRABBER -->
  const { id } = useParams<{ id: string }>(); 

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null); // Keeps track of who is logged in
  const [isOwner, setIsOwner] = useState(false); // Controls the edit buttons

  const [education, setEducation] = useState<any[]>([]);
  const [experiences, setExperiences] = useState<any[]>([]);
  const [skills, setSkills] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [editForm, setEditForm] = useState({ first_name: "", last_name: "", headline: "", bio: "", major: "", location: "" });
  const [newSkillName, setNewSkillName] = useState("");

  const [isPositionImageOpen, setIsPositionImageOpen] = useState(false);
  const [cropImage, setCropImage] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false);
  const [newPostContent, setNewPostContent] = useState("");
  const [newPostImage, setNewPostImage] = useState<File | null>(null);
  const [newPostImagePreview, setNewPostImagePreview] = useState<string | null>(null);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      // 1. Find out who is currently logged in
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) return;

      const { data: loggedInUser } = await supabase
        .from("users")
        .select("id, profile_photo_url, first_name, last_name")
        .eq("auth_users_uuid", authUser.id)
        .single();
      
      setCurrentUser(loggedInUser);

      // 2. Determine whose profile we are looking at (URL check)
      let targetProfileId = loggedInUser?.id; // Default to 'me'
      if (id && id !== "me") {
        targetProfileId = parseInt(id);
      }

      // 3. Are we looking at our own profile?
      setIsOwner(loggedInUser?.id === targetProfileId);

      // 4. Fetch the target profile's data
      if (targetProfileId) {
        const { data: userData } = await supabase.from("users").select("*").eq("id", targetProfileId).single();

        if (userData) {
          setProfile(userData);
          const { data: eduData } = await supabase.from("education").select("*").eq("user_id", targetProfileId);
          const { data: expData } = await supabase.from("experiences").select("*").eq("user_id", targetProfileId).order("end_date", { ascending: false });
          const { data: skillsData } = await supabase.from("user_skills").select("id, proficiency_level, skills(name)").eq("user_id", targetProfileId);

          setEducation(eduData || []);
          setExperiences(expData || []);
          // @ts-ignore
          setSkills(skillsData?.map(s => ({ id: s.id, name: s.skills?.name, level: s.proficiency_level })) || []);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  // Re-run the fetch whenever the URL changes
  useEffect(() => { fetchProfile(); }, [id]);

  const { data: userPosts = [] } = useQuery({
    queryKey: ['userPosts', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];
      const { data } = await supabase.from('posts').select(`*, post_likes(user_id), post_comments(id)`).eq('user_id', profile.id).order('created_at', { ascending: false }).limit(4);
      return data || [];
    },
    enabled: !!profile?.id,
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (formData: typeof editForm) => { await supabase.from('users').update(formData).eq('id', profile?.id); },
    onSuccess: () => { setIsEditProfileOpen(false); fetchProfile(); }
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
      setCropImage(reader.result as string); setZoom(1); setCrop({ x: 0, y: 0 }); setIsPositionImageOpen(true);
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
    onSuccess: () => { setIsPositionImageOpen(false); setCropImage(null); queryClient.invalidateQueries({ queryKey: ['currentUser'] }); fetchProfile(); }
  });

  const deleteImageMutation = useMutation({
    mutationFn: async () => { if (!profile?.id) return; await supabase.from('users').update({ profile_photo_url: null }).eq('id', profile.id); },
    onSuccess: () => { setIsPositionImageOpen(false); fetchProfile(); }
  });

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
        await supabase.storage.from('post_images').upload(filePath, newPostImage);
        const { data } = supabase.storage.from('post_images').getPublicUrl(filePath);
        imageUrl = data.publicUrl;
      }
      const rawTags = newPostContent.match(/#[a-zA-Z0-9_]+/g) || [];
      const extractedTags = rawTags.map(tag => tag.toLowerCase());
      const { data: newPost, error } = await supabase.from('posts').insert({
        user_id: profile.id, content: newPostContent.trim(), image_url: imageUrl, hashtags: extractedTags
      }).select().single();
      if (error) throw error;
      if (extractedTags.length > 0 && newPost) {
        for (const tagName of extractedTags) {
          const { data: tagData } = await supabase.from('tags').upsert({ name: tagName }, { onConflict: 'name' }).select().single();
          if (tagData) await supabase.from('post_tags').insert({ post_id: newPost.id, tag_id: tagData.id });
        }
      }
    },
    onSuccess: () => {
      setIsCreatePostOpen(false); setNewPostContent(""); setNewPostImage(null); setNewPostImagePreview(null);
      queryClient.invalidateQueries({ queryKey: ['userPosts', profile?.id] });
    }
  });

  const updatePostMutation = useMutation({
    mutationFn: async ({ postId, content }: { postId: number, content: string }) => {
      const rawTags = content.match(/#[a-zA-Z0-9_]+/g) || [];
      const extractedTags = rawTags.map(tag => tag.toLowerCase());
      await supabase.from('posts').update({ content: content.trim(), hashtags: extractedTags }).eq('id', postId);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['userPosts', profile?.id] })
  });

  const deletePostMutation = useMutation({
    mutationFn: async (postId: number) => { await supabase.from('posts').delete().eq('id', postId); },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['userPosts', profile?.id] })
  });

  // --- SKILL MUTATIONS ---
  const addSkillMutation = useMutation({
    mutationFn: async (skillName: string) => {
      if (!profile?.id || !skillName.trim()) return;
      const { data: skillData } = await supabase.from('skills').upsert({ name: skillName.trim() }, { onConflict: 'name' }).select().single();
      if (skillData) {
        await supabase.from('user_skills').insert({ user_id: profile.id, skill_id: skillData.id, proficiency_level: 'Intermediate' });
      }
    },
    onSuccess: () => { setNewSkillName(""); fetchProfile(); }
  });

  const removeSkillMutation = useMutation({
    mutationFn: async (userSkillId: number) => {
      await supabase.from('user_skills').delete().eq('id', userSkillId);
    },
    onSuccess: () => fetchProfile()
  });

  const openEditProfile = () => {
    if (profile) {
      setEditForm({ first_name: profile.first_name || "", last_name: profile.last_name || "", headline: profile.headline || "", bio: profile.bio || "", major: profile.major || "", location: profile.location || "" });
      setIsEditProfileOpen(true);
    }
  };

  if (loading) return <div className="text-center py-20 text-muted-foreground">Loading profile...</div>;
  if (!profile) return <div className="text-center py-20 text-muted-foreground">Profile not found.</div>;

// CHECK IF ALREADY CONNECTED
  const { data: isFollowing = false } = useQuery({
    queryKey: ['isFollowing', currentUser?.id, profile?.id],
    queryFn: async () => {
      if (!currentUser?.id || !profile?.id) return false;
      const { data } = await supabase
        .from('follows')
        .select('*')
        .eq('follower_id', currentUser.id)
        .eq('followed_id', profile.id)
        .maybeSingle(); // maybeSingle doesn't throw an error if no record is found
      return !!data;
    },
    enabled: !!currentUser?.id && !!profile?.id && !isOwner, // Only run if looking at someone else
  });

  // TOGGLE CONNECTION MUTATION
  const toggleConnectMutation = useMutation({
    mutationFn: async () => {
      if (!currentUser?.id || !profile?.id) return;
      
      if (isFollowing) {
        // Disconnect
        await supabase.from('follows').delete()
          .eq('follower_id', currentUser.id)
          .eq('followed_id', profile.id);
      } else {
        // Connect
        await supabase.from('follows').insert({
          follower_id: currentUser.id,
          followed_id: profile.id
        });
      }
    },
    onSuccess: () => {
      // Refresh the button state instantly
      queryClient.invalidateQueries({ queryKey: ['isFollowing', currentUser?.id, profile?.id] });
    }
  });


  return (
    <div className="min-h-screen bg-muted/30 pb-20 lg:pb-0">
      <Navigation />

      <div className="container max-w-4xl mx-auto px-4 py-6 space-y-6">
        
        {/* 1. HEADER */}
        <ProfileHeader 
          profile={profile}
          isOwner={isOwner} // <-- PASS isOwner DOWN
          isFollowing={isFollowing} // <-- ADD THIS
          onToggleConnect={() => toggleConnectMutation.mutate()}
          onEditProfile={openEditProfile}
          onAvatarClick={() => { setCropImage(profile.profile_photo_url || null); setZoom(1); setCrop({ x: 0, y: 0 }); setIsPositionImageOpen(true); }}
          onBannerUpload={handleBannerUpload}
          onBannerDelete={() => { if(confirm('Delete banner?')) supabase.from('users').update({ banner_url: null }).eq('id', profile.id).then(() => fetchProfile()) }}
        />

        {/* 2. ABOUT & SKILLS */}
        <ProfileAbout 
          bio={profile.bio || ""}
          skills={skills}
          isOwner={isOwner} // <-- PASS isOwner DOWN
          onEditProfile={openEditProfile}
        />

        {/* 3. ACTIVITY */}
        <Card className="shadow-sm border-0">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-xl">Activity</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">{userPosts.length} posts</p>
            </div>
            {/* ONLY OWNER CAN CREATE POST FROM HERE */}
            {isOwner && (
              <Button variant="outline" className="rounded-full font-semibold border-primary text-primary hover:bg-primary/5" onClick={() => setIsCreatePostOpen(true)}>
                Create a post
              </Button>
            )}
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              {userPosts.map((post: any) => (
                <PostCard 
                  key={post.id}
                  post={post}
                  currentUser={currentUser} // <-- IMPORTANT: Pass the LOGGED IN user so edit/delete options work correctly
                  hideAuthor={true}
                  onUpdate={(postId, content) => updatePostMutation.mutate({ postId, content })}
                  onDelete={(postId) => deletePostMutation.mutate(postId)}
                  isUpdating={updatePostMutation.isPending}
                />
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 4. EXPERIENCE */}
        <ProfileExperience 
          experiences={experiences}
          userId={profile.id}
          isOwner={isOwner} // <-- PASS isOwner DOWN
          onRefresh={fetchProfile}
        />

        {/* 5. EDUCATION */}
        <ProfileEducation 
          education={education}
          userId={profile.id}
          isOwner={isOwner} // <-- PASS isOwner DOWN
          onRefresh={fetchProfile}
        />
      </div>

      {/* ----------------- MODALS ----------------- */}

      {/* MODAL: EDIT PROFILE WITH SKILLS INCLUDED */}
      {isOwner && (
        <Dialog open={isEditProfileOpen} onOpenChange={setIsEditProfileOpen}>
          <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Edit Profile Info</DialogTitle></DialogHeader>
            
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>First Name</Label><Input value={editForm.first_name} onChange={(e) => setEditForm({ ...editForm, first_name: e.target.value })} /></div>
                <div className="space-y-2"><Label>Last Name</Label><Input value={editForm.last_name} onChange={(e) => setEditForm({ ...editForm, last_name: e.target.value })} /></div>
              </div>
              <div className="space-y-2"><Label>Headline</Label><Input value={editForm.headline} onChange={(e) => setEditForm({ ...editForm, headline: e.target.value })} /></div>
              <div className="space-y-2"><Label>Location</Label><Input placeholder="e.g. Montevallo, Alabama" value={editForm.location} onChange={(e) => setEditForm({ ...editForm, location: e.target.value })} /></div>
              <div className="space-y-2"><Label>Bio</Label><Textarea className="min-h-[100px]" value={editForm.bio} onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })} /></div>

              {/* SKILLS SECTION INSIDE EDIT PROFILE */}
              <div className="space-y-2 pt-4 border-t">
                <Label>Manage Skills</Label>
                <div className="flex flex-wrap gap-2 mb-2 border rounded-md p-3 min-h-[50px] bg-muted/20">
                  {skills.map((skill) => (
                    <Badge key={skill.id} variant="secondary" className="flex items-center gap-1 px-2 py-1 text-sm bg-background border shadow-sm">
                      {skill.name}
                      <button 
                        type="button" 
                        onClick={() => removeSkillMutation.mutate(skill.id)} 
                        className="hover:text-destructive text-muted-foreground ml-1 transition-colors"
                        title="Remove Skill"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                  {skills.length === 0 && <span className="text-sm text-muted-foreground">No skills added yet.</span>}
                </div>
                <div className="flex gap-2">
                  <Input 
                    placeholder="Type a skill and press Add..." 
                    value={newSkillName} 
                    onChange={(e) => setNewSkillName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addSkillMutation.mutate(newSkillName);
                      }
                    }}
                  />
                  <Button 
                    type="button" 
                    variant="secondary" 
                    onClick={() => addSkillMutation.mutate(newSkillName)} 
                    disabled={!newSkillName.trim() || addSkillMutation.isPending}
                  >
                    Add
                  </Button>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" className="rounded-full" onClick={() => setIsEditProfileOpen(false)}>Close</Button>
              <Button className="rounded-full px-6" onClick={() => updateProfileMutation.mutate(editForm)} disabled={updateProfileMutation.isPending}>{updateProfileMutation.isPending ? "Saving..." : "Save Changes"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* MODAL: ADJUST IMAGE POSITION */}
      {isOwner && (
        <Dialog open={isPositionImageOpen} onOpenChange={setIsPositionImageOpen}>
          <DialogContent className="sm:max-w-[700px] h-fit max-h-[95vh] flex flex-col pt-10 px-10 pb-4 rounded-2xl">
            <DialogHeader><DialogTitle>Adjust Image Position & Zoom</DialogTitle></DialogHeader>
            <div className="flex-1 flex flex-col items-center justify-center p-4">
              <p className="text-center text-muted-foreground leading-relaxed mb-6">Drag the image inside the circle to adjust its position, and use the slider to zoom in or out.</p>
              <div className="w-[400px] h-[400px] relative overflow-hidden rounded-full border-4 border-card shadow-xl bg-muted mb-6">
                {cropImage && (
                  <Cropper image={cropImage} crop={crop} zoom={zoom} aspect={1 / 1} cropShape="round" showGrid={false} onCropChange={setCrop} onZoomChange={setZoom} onCropComplete={(_, croppedPixels) => setCroppedAreaPixels(croppedPixels as any)} />
                )}
              </div>
              <div className="w-full max-w-sm mb-4">
                <Slider defaultValue={[1]} max={3} min={1} step={0.1} value={[zoom]} onValueChange={(val) => setZoom(val[0])} className="w-full" />
              </div>
            </div>
            <DialogFooter className="flex gap-3 justify-between items-center mt-2 p-2">
              <Button variant="outline" className="h-10 w-[140px] rounded-full font-semibold shrink-0" onClick={() => { setIsPositionImageOpen(false); setCropImage(null); }}>Cancel</Button>
              <div className="flex gap-3 justify-end items-center">
                <Button variant="destructive" className="h-10 w-[140px] rounded-full font-semibold shrink-0 gap-2" onClick={() => deleteImageMutation.mutate()} disabled={deleteImageMutation.isPending}>
                  <Trash2 className="mr-2 h-4 w-4 shrink-0" />{deleteImageMutation.isPending ? "..." : "Delete"}
                </Button>
                <Button className="h-10 w-[140px] rounded-full font-semibold shrink-0" onClick={async () => { if (cropImage && croppedAreaPixels) { const croppedImageBlob = await getCroppedImg(cropImage, croppedAreaPixels); saveCroppedImageMutation.mutate(croppedImageBlob); } }} disabled={saveCroppedImageMutation.isPending}>
                  {saveCroppedImageMutation.isPending ? "Saving..." : "Save"}
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* MODAL: CREATE POST */}
      {isOwner && (
        <Dialog open={isCreatePostOpen} onOpenChange={setIsCreatePostOpen}>
          <DialogContent className="sm:max-w-[550px] p-6 rounded-2xl flex flex-col gap-0">
            <DialogHeader className="mb-4"><DialogTitle className="text-xl">Create a post</DialogTitle></DialogHeader>
            <div className="flex gap-4 mb-4">
              <Avatar className="h-12 w-12 border border-border">
                <AvatarImage src={profile?.profile_photo_url} className="object-cover" />
              </Avatar>
              <div className="flex flex-col justify-center">
                <span className="font-semibold text-foreground">{profile?.first_name} {profile?.last_name}</span>
              </div>
            </div>
            <Textarea placeholder="What do you want to talk about?" className="min-h-[120px] resize-none text-lg border border-border rounded-xl focus-visible:ring-1 p-4 shadow-none mb-4" value={newPostContent} onChange={(e) => setNewPostContent(e.target.value)} />
            {newPostImagePreview && (
              <div className="relative w-full h-64 bg-muted rounded-xl overflow-hidden mb-4 border">
                <img src={newPostImagePreview} alt="Preview" className="w-full h-full object-cover" />
                <Button variant="destructive" size="icon" className="absolute top-2 right-2 h-8 w-8 rounded-full shadow-md" onClick={() => { setNewPostImage(null); setNewPostImagePreview(null); }}>
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
              <Button className="rounded-full font-semibold px-6" disabled={!newPostContent.trim() || createPostMutation.isPending} onClick={() => createPostMutation.mutate()}>
                {createPostMutation.isPending ? "Posting..." : "Post"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}