import * as React from "react";
import { useState, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Building2, MapPin, Link as LinkIcon, Users, ExternalLink, Camera, Edit, Trash2, X, Image as ImageIcon } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../contexts/AuthContext";
import { Navigation } from "../components/Navigation";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "../components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { Button } from "../components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../components/ui/dialog";
import { Label } from "../components/ui/label";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";

// IMPORT POST CARD
import { PostCard } from "../components/PostCard";

const FALLBACK_BANNER = "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=2070&auto=format&fit=crop";

export function Organization() {
  const { id } = useParams<{ id: string }>();
  const { session } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({ name: "", industry: "", location: "", about: "", website_url: "" });

  // Post states
  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false);
  const [newPostContent, setNewPostContent] = useState("");
  const [newPostImage, setNewPostImage] = useState<File | null>(null);
  const [newPostImagePreview, setNewPostImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  // 2. GET ORGANIZATION
  const { data: org, isLoading: orgLoading } = useQuery({
    queryKey: ['organization', id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase.from('organizations').select('*').eq('id', id).single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  // 3. GET EMPLOYEES
  const { data: employees = [], isLoading: employeesLoading } = useQuery({
    queryKey: ['organization_employees', id],
    queryFn: async () => {
      if (!id) return [];
      const { data: expData } = await supabase.from('experiences').select('user_id').eq('organization_id', id);
      if (!expData || expData.length === 0) return [];
      const userIds = [...new Set(expData.map(e => e.user_id))];
      const { data: users } = await supabase.from('users').select('id, first_name, last_name, profile_photo_url, headline').in('id', userIds);
      return users || [];
    },
    enabled: !!id,
  });

  // 4. GET ORGANIZATION POSTS
  const { data: orgPosts = [], isLoading: postsLoading } = useQuery({
    queryKey: ['organization_posts', id],
    queryFn: async () => {
      if (!id) return [];
      const { data } = await supabase
        .from('posts')
        .select(`*, post_likes(user_id), post_comments(id)`)
        .eq('organization_id', id)
        .order('created_at', { ascending: false });
      return data || [];
    },
    enabled: !!id,
  });

  const isOwner = currentUser?.id === org?.owner_id;

  // --- ORGANIZATION MUTATIONS ---
  const updateOrgMutation = useMutation({
    mutationFn: async () => { await supabase.from('organizations').update(editForm).eq('id', id); },
    onSuccess: () => { setIsEditModalOpen(false); queryClient.invalidateQueries({ queryKey: ['organization', id] }); }
  });

  const deleteOrgMutation = useMutation({
    mutationFn: async () => { await supabase.from('organizations').delete().eq('id', id); },
    onSuccess: () => { navigate('/groups'); } // Send them back to groups directory!
  });

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>, type: 'banner' | 'logo') => {
    const file = event.target.files?.[0];
    if (!file || !id) return;
    try {
      const fileExt = file.name.split('.').pop();
      const filePath = `org_${id}/${type}_${Math.random()}.${fileExt}`;
      await supabase.storage.from('profile_images').upload(filePath, file); 
      const { data } = supabase.storage.from('profile_images').getPublicUrl(filePath);
      
      const updateData = type === 'banner' ? { banner_url: data.publicUrl } : { logo_url: data.publicUrl };
      await supabase.from('organizations').update(updateData).eq('id', id);
      queryClient.invalidateQueries({ queryKey: ['organization', id] });
    } catch (error) { console.error("Upload failed", error); }
  };

  const openEditModal = () => {
    if (org) {
      setEditForm({ name: org.name || "", industry: org.industry || "", location: org.location || "", about: org.about || "", website_url: org.website_url || "" });
      setIsEditModalOpen(true);
    }
  };

  // --- POST MUTATIONS ---
  const handlePostImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setNewPostImage(file);
      setNewPostImagePreview(URL.createObjectURL(file));
    }
  };

  const createPostMutation = useMutation({
    mutationFn: async () => {
      if (!currentUser?.id || !id || !newPostContent.trim()) return;
      let imageUrl = null;
      if (newPostImage) {
        const filePath = `org_${id}/post_${Math.random()}.${newPostImage.name.split('.').pop()}`;
        await supabase.storage.from('post_images').upload(filePath, newPostImage);
        const { data } = supabase.storage.from('post_images').getPublicUrl(filePath);
        imageUrl = data.publicUrl;
      }
      const rawTags = newPostContent.match(/#[a-zA-Z0-9_]+/g) || [];
      const extractedTags = rawTags.map(tag => tag.toLowerCase());
      
      const { data: newPost, error } = await supabase.from('posts').insert({
        user_id: currentUser.id, 
        organization_id: id, // THIS MAKES IT AN ORG POST
        content: newPostContent.trim(), 
        image_url: imageUrl, 
        hashtags: extractedTags
      }).select().single();
      
      if (error) throw error;
    },
    onSuccess: () => {
      setIsCreatePostOpen(false); setNewPostContent(""); setNewPostImage(null); setNewPostImagePreview(null);
      queryClient.invalidateQueries({ queryKey: ['organization_posts', id] });
    }
  });

  const updatePostMutation = useMutation({
    mutationFn: async ({ postId, content }: { postId: number, content: string }) => {
      const tags = (content.match(/#[a-zA-Z0-9_]+/g) || []).map(t => t.toLowerCase());
      await supabase.from('posts').update({ content: content.trim(), hashtags: tags }).eq('id', postId);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['organization_posts', id] })
  });

  const deletePostMutation = useMutation({
    mutationFn: async (postId: number) => { await supabase.from('posts').delete().eq('id', postId); },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['organization_posts', id] })
  });

  // FORMAT POSTS: We hijack the 'users' object so PostCard displays the Organization's name and logo!
  const formattedOrgPosts = orgPosts.map((post: any) => ({
    ...post,
    users: {
      id: post.user_id, 
      first_name: org?.name,
      last_name: "",
      profile_photo_url: org?.logo_url,
      headline: org?.industry || "Organization"
    }
  }));

  if (orgLoading) return <div className="text-center py-20 text-muted-foreground">Loading organization...</div>;
  if (!org) return <div className="text-center py-20 text-muted-foreground">Organization not found.</div>;

  return (
    <div className="min-h-screen bg-muted/30 pb-20 lg:pb-0">
      <Navigation />

      <div className="container max-w-4xl mx-auto px-4 py-6 space-y-6">
        
        {/* HEADER SECTION */}
        <Card className="overflow-hidden shadow-sm border-0">
          <div className="h-64 relative bg-muted">
            <img src={org.banner_url || FALLBACK_BANNER} alt="Cover" className="w-full h-full object-cover" />
            {isOwner && (
              <div className="absolute top-4 right-4 flex gap-2 z-10">
                <label className="cursor-pointer bg-secondary hover:bg-secondary/80 text-secondary-foreground h-9 w-9 flex items-center justify-center rounded-full shadow-md transition-colors">
                  <Camera className="h-4 w-4" />
                  <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, 'banner')} />
                </label>
              </div>
            )}
          </div>

          <CardContent className="relative pt-0 pb-6 bg-card flex flex-col items-start text-left">
            <div className="-mt-16 relative z-10 mb-4 w-fit">
              <Avatar className="h-32 w-32 border-4 border-card shadow-xl bg-white rounded-xl">
                <AvatarImage src={org.logo_url} className="object-contain p-2" />
                <AvatarFallback className="text-3xl rounded-xl bg-primary/10 text-primary"><Building2 className="h-12 w-12" /></AvatarFallback>
              </Avatar>
              {isOwner && (
                <label className="absolute bottom-1 right-1 cursor-pointer bg-secondary hover:bg-secondary/80 text-secondary-foreground h-8 w-8 flex items-center justify-center rounded-full shadow-md transition-colors z-10">
                  <Camera className="h-4 w-4" />
                  <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, 'logo')} />
                </label>
              )}
            </div>

            <div className="w-full flex justify-between items-start">
              <div>
                <h1 className="text-3xl font-bold text-foreground">{org.name}</h1>
                <p className="text-lg text-muted-foreground mt-1">{org.industry || "Company"}</p>
                <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-muted-foreground">
                  {org.location && <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4" />{org.location}</span>}
                  {org.website_url && <a href={org.website_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-primary hover:underline"><LinkIcon className="h-4 w-4" /> Visit Website <ExternalLink className="h-3 w-3 ml-0.5" /></a>}
                </div>
              </div>
              <div className="flex gap-2">
                {!isOwner && <Button className="rounded-full px-8 shadow-sm">Follow</Button>}
                {isOwner && <Button variant="secondary" className="gap-2 rounded-full px-6" onClick={openEditModal}><Edit className="h-4 w-4" /> Edit Page</Button>}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ABOUT SECTION */}
        <Card className="shadow-sm border-0">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xl">About</CardTitle>
            {isOwner && <Button variant="ghost" size="icon" onClick={openEditModal}><Edit className="h-4 w-4 text-muted-foreground" /></Button>}
          </CardHeader>
          <CardContent><p className="text-foreground leading-relaxed whitespace-pre-wrap">{org.about || `No description provided for ${org.name} yet.`}</p></CardContent>
        </Card>

        {/* ACTIVITY / POSTS SECTION */}
        <Card className="shadow-sm border-0">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-xl">Activity</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">{orgPosts.length} posts</p>
            </div>
            {isOwner && (
              <Button variant="outline" className="rounded-full font-semibold border-primary text-primary hover:bg-primary/5" onClick={() => setIsCreatePostOpen(true)}>
                Create a post
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {postsLoading ? (
               <p className="text-muted-foreground text-sm">Loading posts...</p>
            ) : formattedOrgPosts.length === 0 ? (
               <p className="text-muted-foreground text-sm">No activity yet.</p>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {formattedOrgPosts.map((post: any) => (
                  <PostCard 
                    key={post.id}
                    post={post}
                    currentUser={currentUser} // Passes the logged-in user so they can edit/delete their own org posts
                    onUpdate={(postId, content) => updatePostMutation.mutate({ postId, content })}
                    onDelete={(postId) => deletePostMutation.mutate(postId)}
                    isUpdating={updatePostMutation.isPending}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* PEOPLE SECTION */}
        <Card className="shadow-sm border-0">
          <CardHeader><CardTitle className="text-xl flex items-center gap-2"><Users className="h-5 w-5 text-primary" /> People ({employees.length})</CardTitle></CardHeader>
          <CardContent>
            {employeesLoading ? <p className="text-muted-foreground text-sm">Loading people...</p> : employees.length === 0 ? <p className="text-muted-foreground text-sm">No Falcon Forge members work here yet.</p> : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {employees.map((user: any) => (
                  <Link key={user.id} to={`/profile/${user.id}`} className="flex items-center gap-3 p-3 rounded-xl border bg-card hover:bg-muted/50 transition-colors">
                    <Avatar className="h-12 w-12 border"><AvatarImage src={user.profile_photo_url} className="object-cover" /><AvatarFallback className="bg-primary/10 text-primary font-semibold">{user.first_name?.[0]}{user.last_name?.[0]}</AvatarFallback></Avatar>
                    <div className="overflow-hidden"><p className="font-semibold text-foreground truncate">{user.first_name} {user.last_name}</p><p className="text-xs text-muted-foreground truncate">{user.headline || "Student"}</p></div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* EDIT ORGANIZATION MODAL */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-[550px] rounded-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="text-xl">Edit Organization</DialogTitle></DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="space-y-2"><Label>Organization Name</Label><Input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Industry</Label><Input value={editForm.industry} onChange={(e) => setEditForm({ ...editForm, industry: e.target.value })} /></div>
              <div className="space-y-2"><Label>Location</Label><Input value={editForm.location} onChange={(e) => setEditForm({ ...editForm, location: e.target.value })} /></div>
            </div>
            <div className="space-y-2"><Label>Website URL</Label><Input value={editForm.website_url} onChange={(e) => setEditForm({ ...editForm, website_url: e.target.value })} /></div>
            <div className="space-y-2"><Label>About</Label><Textarea className="min-h-[120px]" value={editForm.about} onChange={(e) => setEditForm({ ...editForm, about: e.target.value })} /></div>
          </div>

          <DialogFooter className="flex justify-between items-center w-full">
            <Button variant="ghost" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => { if(confirm("Are you sure you want to permanently delete this organization?")) deleteOrgMutation.mutate(); }}>
              <Trash2 className="h-4 w-4 mr-2" /> Delete Group
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" className="rounded-full px-6" onClick={() => setIsEditModalOpen(false)}>Cancel</Button>
              <Button className="rounded-full px-8 font-semibold" onClick={() => updateOrgMutation.mutate()} disabled={updateOrgMutation.isPending || !editForm.name.trim()}>{updateOrgMutation.isPending ? "Saving..." : "Save Changes"}</Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* CREATE POST MODAL */}
      <Dialog open={isCreatePostOpen} onOpenChange={setIsCreatePostOpen}>
        <DialogContent className="sm:max-w-[550px] p-6 rounded-2xl flex flex-col gap-0">
          <DialogHeader className="mb-4"><DialogTitle className="text-xl">Post as {org?.name}</DialogTitle></DialogHeader>
          <div className="flex gap-4 mb-4">
            <Avatar className="h-12 w-12 border border-border bg-white"><AvatarImage src={org?.logo_url} className="object-contain p-1" /></Avatar>
            <div className="flex flex-col justify-center"><span className="font-semibold text-foreground">{org?.name}</span></div>
          </div>
          <Textarea placeholder="Share an update with your followers..." className="min-h-[120px] resize-none text-lg border border-border rounded-xl focus-visible:ring-1 p-4 shadow-none mb-4" value={newPostContent} onChange={(e) => setNewPostContent(e.target.value)} />
          {newPostImagePreview && (
            <div className="relative w-full h-64 bg-muted rounded-xl overflow-hidden mb-4 border">
              <img src={newPostImagePreview} alt="Preview" className="w-full h-full object-cover" />
              <Button variant="destructive" size="icon" className="absolute top-2 right-2 h-8 w-8 rounded-full shadow-md" onClick={() => { setNewPostImage(null); setNewPostImagePreview(null); }}><X className="h-4 w-4" /></Button>
            </div>
          )}
          <DialogFooter className="flex justify-between items-center sm:justify-between border-t pt-4 mt-auto">
            <div className="flex items-center gap-2">
              <label className="cursor-pointer text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors p-2.5 rounded-full">
                <ImageIcon className="h-5 w-5" />
                <input type="file" className="hidden" accept="image/*" onChange={handlePostImageSelect} />
              </label>
            </div>
            <Button className="rounded-full font-semibold px-6" disabled={!newPostContent.trim() || createPostMutation.isPending} onClick={() => createPostMutation.mutate()}>{createPostMutation.isPending ? "Posting..." : "Post"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}