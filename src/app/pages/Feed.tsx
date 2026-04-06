import { useState, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Link } from 'react-router-dom';
import { Navigation } from "../components/Navigation";
import { Card, CardFooter, CardHeader } from "../components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { Button } from "../components/ui/button";
import { Textarea } from "../components/ui/textarea";
import { Separator } from "../components/ui/separator";
import { Image as ImageIcon, X } from "lucide-react";
import { supabase } from '../../lib/supabase';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// IMPORT OUR NEW COMPONENT
import { PostCard } from "../components/PostCard"; 

export function Feed() {
  const { session } = useAuth();
  const queryClient = useQueryClient();
  const [content, setContent] = useState('');
  
  // Image Upload States
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 1. Fetch CURRENT user
  const { data: currentUser } = useQuery({
    queryKey: ['currentUser', session?.user?.id],
    queryFn: async () => {
      if (!session?.user?.id) return null;
      const { data } = await supabase.from('users').select('id, first_name, last_name, profile_photo_url').eq('auth_users_uuid', session.user.id).single();
      return data;
    },
    enabled: !!session?.user?.id,
  });

  // 2. Posts query
  const { data: posts = [], isLoading } = useQuery({
    queryKey: ['posts'],
    queryFn: async () => {
      const { data, error } = await supabase.from('posts').select(`*, users:user_id (id, first_name, last_name, profile_photo_url, headline), post_likes ( user_id ), post_comments (id, content_text, created_at, users:user_id (id, first_name, last_name, profile_photo_url))`).order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    }
  });

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) return alert("Image must be less than 5MB");
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const clearImage = () => { setImageFile(null); setImagePreview(null); if (fileInputRef.current) fileInputRef.current.value = ''; };

  // 3. Create post mutation
  const createPost = useMutation({
    mutationFn: async () => {
      if (!currentUser?.id) throw new Error("No user ID found");
      let imageUrl = null;
      if (imageFile) {
        const filePath = `${currentUser.id}/${Math.random()}.${imageFile.name.split('.').pop()}`;
        await supabase.storage.from('post_images').upload(filePath, imageFile);
        const { data } = supabase.storage.from('post_images').getPublicUrl(filePath);
        imageUrl = data.publicUrl;
      }
      const rawTags = content.match(/#[a-zA-Z0-9_]+/g) || [];
      const extractedTags = rawTags.map(tag => tag.toLowerCase());
      const { data: newPost, error } = await supabase.from('posts').insert({ content: content.trim(), hashtags: extractedTags, user_id: currentUser.id, image_url: imageUrl }).select().single();
      if (error) throw error;
      if (extractedTags.length > 0) {
        for (const tagName of extractedTags) {
          const { data: tagData } = await supabase.from('tags').upsert({ name: tagName }, { onConflict: 'name' }).select().single();
          if (tagData) await supabase.from('post_tags').insert({ post_id: newPost.id, tag_id: tagData.id });
        }
      }
    },
    onSuccess: () => { setContent(''); clearImage(); queryClient.invalidateQueries({ queryKey: ['posts'] }); }
  });

  // 4. Delete post mutation
  const deletePost = useMutation({
    mutationFn: async (post: any) => {
      if (post.image_url) {
        const pathMatches = post.image_url.match(/post_images\/(.+)$/);
        if (pathMatches && pathMatches[1]) await supabase.storage.from('post_images').remove([pathMatches[1]]);
      }
      await supabase.from('posts').delete().eq('id', post.id);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['posts'] })
  });

  // 5. Toggle Like Mutation
  const toggleLike = useMutation({
    mutationFn: async ({ postId, hasLiked }: { postId: number; hasLiked: boolean }) => {
      if (!currentUser?.id) return;
      if (hasLiked) await supabase.from('post_likes').delete().match({ post_id: postId, user_id: currentUser.id });
      else await supabase.from('post_likes').insert({ post_id: postId, user_id: currentUser.id });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['posts'] })
  });

  // 6. Create Comment Mutation
  const createComment = useMutation({
    mutationFn: async ({ postId, text }: { postId: number; text: string }) => {
      if (!currentUser?.id) return;
      await supabase.from('post_comments').insert({ post_id: postId, user_id: currentUser.id, content_text: text.trim() });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['posts'] })
  });

  // 7. Update Post Mutation
  const updatePost = useMutation({
    mutationFn: async ({ postId, newContent }: { postId: number; newContent: string }) => {
      const rawTags = newContent.match(/#[a-zA-Z0-9_]+/g) || [];
      const extractedTags = rawTags.map(tag => tag.toLowerCase());
      await supabase.from('posts').update({ content: newContent.trim(), hashtags: extractedTags }).eq('id', postId);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['posts'] })
  });

  return (
    <div className="min-h-screen bg-muted/30 pb-20 lg:pb-0">
      <Navigation />

      <div className="container max-w-3xl mx-auto px-4 py-6">
        {/* Create Post Card */}
        <Card className="mb-6 shadow-sm border-0">
          <CardHeader className="pb-4">
            <div className="flex items-start gap-4">
              <Link to="/profile/me" className="cursor-pointer hover:scale-105 transition-transform shrink-0">
                <Avatar className="w-12 h-12 border border-border">
                  <AvatarImage src={currentUser?.profile_photo_url} className="object-cover" />
                  <AvatarFallback className="bg-primary text-primary-foreground font-medium">
                    {currentUser ? `${currentUser.first_name[0]}${currentUser.last_name[0]}` : "U"}
                  </AvatarFallback>
                </Avatar>
              </Link>
              <div className="flex-1">
                <Textarea
                  value={content} onChange={(e) => setContent(e.target.value)}
                  placeholder="What's new, Falcons? #Swim #Jobs #Montevallo"
                  className="min-h-[60px] resize-none border-none focus-visible:ring-0 px-0 text-lg placeholder:text-muted-foreground bg-transparent"
                />
                {imagePreview && (
                  <div className="relative mt-3 inline-block">
                    <img src={imagePreview} alt="Preview" className="max-h-64 rounded-lg object-cover border border-border" />
                    <Button variant="destructive" size="icon" className="absolute top-2 right-2 h-7 w-7 rounded-full shadow-md" onClick={clearImage}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </CardHeader>
          <Separator />
          <CardFooter className="pt-3 pb-3 flex justify-between items-center bg-card rounded-b-xl">
            <div className="flex gap-1">
              <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleImageSelect} />
              <Button variant="ghost" size="sm" className="text-muted-foreground rounded-full" onClick={() => fileInputRef.current?.click()}>
                <ImageIcon className="h-5 w-5 mr-2" />Photo
              </Button>
            </div>
            <Button onClick={() => createPost.mutate()} disabled={!session || createPost.isPending || (!content.trim() && !imageFile)} className="rounded-full px-6 font-semibold">
              {createPost.isPending ? 'Posting...' : 'Post'}
            </Button>
          </CardFooter>
        </Card>

        {/* Posts Feed */}
        <div className="space-y-4">
          {isLoading && <div className="text-center py-8 text-muted-foreground">Loading posts...</div>}
          {posts.length === 0 && !isLoading && (
            <div className="text-center py-12 text-muted-foreground bg-card rounded-xl border border-border shadow-sm">
              No posts yet. Be the first to share something!
            </div>
          )}

          {posts.map((post: any) => (
            <PostCard 
              key={post.id}
              post={post}
              currentUser={currentUser}
              onUpdate={(postId, content) => updatePost.mutate({ postId, newContent: content })}
              onDelete={(postObj) => deletePost.mutate(postObj)}
              isUpdating={updatePost.isPending}
              onToggleLike={(postId, hasLiked) => toggleLike.mutate({ postId, hasLiked })}
              onCreateComment={(postId, text) => createComment.mutate({ postId, text })}
            />
          ))}
        </div>
      </div>
    </div>
  );
}