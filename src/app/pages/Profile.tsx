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
import { X, Image as ImageIcon, Trash2, ExternalLink, Pencil, Building2, Briefcase, MapPin, Clock } from "lucide-react";
import Cropper from 'react-easy-crop';
import { useParams } from "react-router-dom";

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

  const { id } = useParams<{ id: string }>();

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isOwner, setIsOwner] = useState(false);

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

  // OPPORTUNITY EDIT STATE
  const [isJobModalOpen, setIsJobModalOpen] = useState(false);
  const [editingJobId, setEditingJobId] = useState<number | null>(null);
  const [jobFormData, setJobFormData] = useState({
    organization_id: "", title: "", employment_type: "Internship", location: "", application_url: "", description: ""
  });

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) return;

      const { data: loggedInUser } = await supabase
        .from("users")
        .select("id, profile_photo_url, first_name, last_name")
        .eq("auth_users_uuid", authUser.id)
        .single();

      setCurrentUser(loggedInUser);

      let targetProfileId = loggedInUser?.id;
      if (id && id !== "me") {
        targetProfileId = parseInt(id);
      }

      setIsOwner(loggedInUser?.id === targetProfileId);

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

  // FETCH ORGANIZATIONS OWNED BY LOGGED IN USER (For the Job Edit Dropdown)
  const { data: myOrganizations = [] } = useQuery({
    queryKey: ['myOwnedOrganizations', currentUser?.id],
    queryFn: async () => {
      if (!currentUser?.id) return [];
      const { data } = await supabase.from('organizations').select('id, name, logo_url').eq('owner_id', currentUser.id);
      return data || [];
    },
    enabled: !!currentUser?.id,
  });

  // FETCH OPPORTUNITIES POSTED BY THIS USER
  const { data: profileOpportunities = [] } = useQuery({
    queryKey: ['profileOpportunities', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];
      const { data, error } = await supabase
        .from('opportunities')
        .select(`*, organizations!inner(id, name, logo_url, owner_id)`)
        .eq('organizations.owner_id', profile.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!profile?.id,
  });

  // --- CONNECTIONS ---
  const { data: connectionStatus } = useQuery({
    queryKey: ['connection', currentUser?.id, profile?.id],
    queryFn: async () => {
      if (!currentUser?.id || !profile?.id || currentUser.id === profile.id) return null;
      const { data, error } = await supabase
        .from('connections')
        .select('*')
        .or(`and(sender_id.eq.${currentUser.id},receiver_id.eq.${profile.id}),and(sender_id.eq.${profile.id},receiver_id.eq.${currentUser.id})`)
        .maybeSingle(); 
      if (error) throw error;
      return data || null;
    },
    enabled: !!currentUser?.id && !!profile?.id && !isOwner,
  });

  const connectMutation = useMutation({
    mutationFn: async () => {
      if (!currentUser?.id || !profile?.id) return;
      await supabase.from('connections').insert({ sender_id: currentUser.id, receiver_id: profile.id });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['connection'] })
  });

  const disconnectMutation = useMutation({
    mutationFn: async () => {
      if (!connectionStatus?.id) return;
      await supabase.from('connections').delete().eq('id', connectionStatus.id);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['connection'] })
  });

  // --- JOB POSTING MUTATION ---
  const saveJobMutation = useMutation({
    mutationFn: async () => {
      if (!jobFormData.organization_id || !jobFormData.title) throw new Error("Missing required fields");
      const jobData = {
        organization_id: parseInt(jobFormData.organization_id),
        title: jobFormData.title.trim(),
        employment_type: jobFormData.employment_type,
        location: jobFormData.location.trim() || null,
        application_url: jobFormData.application_url.trim() || null,
        description: jobFormData.description.trim() || null
      };
      if (editingJobId) {
        await supabase.from('opportunities').update(jobData).eq('id', editingJobId);
      }
    },
    onSuccess: () => {
      setIsJobModalOpen(false);
      setEditingJobId(null);
      queryClient.invalidateQueries({ queryKey: ['profileOpportunities'] });
      queryClient.invalidateQueries({ queryKey: ['opportunities'] });
    }
  });

  const openJobModalForEdit = (job: any) => {
    setEditingJobId(job.id);
    setJobFormData({
      organization_id: job.organization_id.toString(),
      title: job.title,
      employment_type: job.employment_type || "Internship",
      location: job.location || "",
      application_url: job.application_url || "",
      description: job.description || ""
    });
    setIsJobModalOpen(true);
  };

  // --- PROFILE MUTATIONS ---
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

  const deleteBannerMutation = useMutation({
    mutationFn: async () => { await supabase.from('users').update({ banner_url: null }).eq('id', profile?.id); },
    onSuccess: () => fetchProfile()
  });

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

  return (
    <div className="min-h-screen bg-muted/30 pb-20 lg:pb-0">
      <Navigation />

      <div className="container max-w-4xl mx-auto px-4 py-6 space-y-6">

        <input type="file" ref={avatarInputRef} className="hidden" accept="image/*" onChange={handleAvatarSelect} />

        <ProfileHeader
          profile={profile} 
          currentUser={currentUser} 
          connectionStatus={connectionStatus} 
          isOwner={isOwner}
          onEditProfile={openEditProfile}
          onAvatarClick={() => { if (avatarInputRef.current) avatarInputRef.current.click(); }}
          onBannerUpload={handleBannerUpload}
          onBannerDelete={() => deleteBannerMutation.mutate()}
          onToggleConnect={() => connectMutation.mutate()} 
          onDisconnect={() => disconnectMutation.mutate()} 
        />

        <ProfileAbout
          bio={profile.bio || ""}
          skills={skills}
          isOwner={isOwner}
          onEditProfile={openEditProfile}
        />

        <Card className="shadow-sm border-0">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-xl">Activity</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">{userPosts.length} posts</p>
            </div>
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
                  currentUser={currentUser}
                  hideAuthor={true}
                  onUpdate={(postId, content) => updatePostMutation.mutate({ postId, content })}
                  onDelete={(postId) => deletePostMutation.mutate(postId)}
                  isUpdating={updatePostMutation.isPending}
                />
              ))}
            </div>
          </CardContent>
        </Card>

        {/* POSTED OPPORTUNITIES (Hiring Section) */}
        {profileOpportunities.length > 0 && (
          <Card className="shadow-sm border-0">
            <CardHeader>
              <CardTitle className="text-xl">Hiring</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-2 gap-4">
                {profileOpportunities.map((job: any) => (
                  <div key={job.id} className="p-4 rounded-xl border bg-card flex flex-col justify-between relative group">
                    
                    {/* Hover Options: Edit & Delete */}
                    {isOwner && (
                      <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10" onClick={() => openJobModalForEdit(job)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10" onClick={() => {
                          if(window.confirm("Are you sure you want to delete this opportunity?")) {
                            supabase.from('opportunities').delete().eq('id', job.id).then(() => {
                              queryClient.invalidateQueries({ queryKey: ['profileOpportunities'] });
                              queryClient.invalidateQueries({ queryKey: ['opportunities'] });
                            });
                          }
                        }}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}

                    <div>
                      <div className="flex items-center gap-3 mb-3 pr-16">
                        {/* NEUTRAL PLACEHOLDER AVATAR */}
                        <Avatar className="h-10 w-10 border bg-white rounded-md shrink-0">
                          <AvatarImage src={job.organizations?.logo_url || undefined} className="object-contain p-1" />
                          <AvatarFallback className="rounded-md bg-muted text-muted-foreground">
                            <Building2 className="h-5 w-5" />
                          </AvatarFallback>
                        </Avatar>
                        <div className="overflow-hidden">
                          <h4 className="font-semibold text-foreground truncate leading-tight">{job.title}</h4>
                          <p className="text-xs text-muted-foreground truncate">{job.organizations?.name}</p>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2 text-xs text-muted-foreground mb-4">
                        <Badge variant="secondary" className="font-normal">{job.employment_type}</Badge>
                        {job.location && <Badge variant="outline" className="font-normal">{job.location}</Badge>}
                      </div>
                    </div>
                    
                    {job.application_url && (
                      <Button variant="outline" size="sm" className="w-full rounded-full gap-2 mt-auto" asChild>
                        <a href={job.application_url.startsWith('http') ? job.application_url : `https://${job.application_url}`} target="_blank" rel="noopener noreferrer">
                          Apply <ExternalLink className="h-3 w-3" />
                        </a>
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <ProfileExperience
          experiences={experiences}
          userId={profile.id}
          isOwner={isOwner}
          onRefresh={fetchProfile}
        />

        <ProfileEducation
          education={education}
          userId={profile.id}
          isOwner={isOwner}
          onRefresh={fetchProfile}
        />
      </div>

      {/* ----------------- MODALS ----------------- */}

      {/* MODAL: EDIT OPPORTUNITY (From Profile) */}
      {isOwner && (
        <Dialog open={isJobModalOpen} onOpenChange={setIsJobModalOpen}>
          <DialogContent className="sm:max-w-[550px] rounded-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle className="text-xl">Edit Opportunity</DialogTitle></DialogHeader>
            <div className="grid gap-4 py-4">
              {myOrganizations.length > 1 && (
                <div className="space-y-2">
                  <Label>Posting as <span className="text-destructive">*</span></Label>
                  <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={jobFormData.organization_id} onChange={(e) => setJobFormData({...jobFormData, organization_id: e.target.value})}>
                    {myOrganizations.map((org: any) => <option key={org.id} value={org.id}>{org.name}</option>)}
                  </select>
                </div>
              )}
              <div className="space-y-2">
                <Label>Job Title <span className="text-destructive">*</span></Label>
                <Input placeholder="e.g. Graphic Design Intern" value={jobFormData.title} onChange={(e) => setJobFormData({ ...jobFormData, title: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Employment Type</Label>
                  <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={jobFormData.employment_type} onChange={(e) => setJobFormData({...jobFormData, employment_type: e.target.value})}>
                    <option value="Internship">Internship</option>
                    <option value="Full-time">Full-time</option>
                    <option value="Part-time">Part-time</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Location</Label>
                  <Input placeholder="e.g. Remote, or Montevallo, AL" value={jobFormData.location} onChange={(e) => setJobFormData({ ...jobFormData, location: e.target.value })} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Application Link (External URL)</Label>
                <Input placeholder="https://..." value={jobFormData.application_url} onChange={(e) => setJobFormData({ ...jobFormData, application_url: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea placeholder="Briefly describe the role and requirements..." className="min-h-[100px]" value={jobFormData.description} onChange={(e) => setJobFormData({ ...jobFormData, description: e.target.value })} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" className="rounded-full px-6" onClick={() => setIsJobModalOpen(false)}>Cancel</Button>
              <Button className="rounded-full px-8 font-semibold" onClick={() => saveJobMutation.mutate()} disabled={!jobFormData.title.trim() || !jobFormData.organization_id || saveJobMutation.isPending}>
                {saveJobMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

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