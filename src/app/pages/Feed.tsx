import { Badge } from "../components/ui/badge";
import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Link } from 'react-router-dom';
import { Navigation } from "../components/Navigation";
import { Card, CardContent, CardFooter, CardHeader } from "../components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { Button } from "../components/ui/button";
import { Textarea } from "../components/ui/textarea";
import { Separator } from "../components/ui/separator";
import {
  ThumbsUp, MessageCircle, MoreHorizontal,
  Image as ImageIcon, Video, Trash2
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";
import { supabase } from '../../lib/supabase';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';


export function Feed() {
  const { session } = useAuth();
  const queryClient = useQueryClient();
  const [content, setContent] = useState('');

  // 1. Fetch the CURRENT logged-in user's public integer ID so they can post
  const { data: currentUser } = useQuery({
    queryKey: ['currentUser', session?.user?.id],
    queryFn: async () => {
      if (!session?.user?.id) return null;
      const { data } = await supabase
        .from('users')
        .select('id, first_name, last_name, profile_photo_url')
        .eq('auth_users_uuid', session.user.id)
        .single();
      return data;
    },
    enabled: !!session?.user?.id, // Only run if we have an active session
  });

  // 2. Posts query - JOIN directly to the users table using your new schema
  const { data: posts = [], isLoading } = useQuery({
    queryKey: ['posts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          users:user_id (
            id,
            first_name,
            last_name,
            profile_photo_url,
            headline
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    }
  });

  // 3. Create post mutation
  const createPost = useMutation({
    mutationFn: async () => {
      if (!currentUser?.id) throw new Error("No user ID found");

      const hashtags = content.match(/#[a-zA-Z0-9_]+/g) || [];
      const { data, error } = await supabase
        .from('posts')
        .insert({
          content: content.trim(),
          hashtags,
          user_id: currentUser.id // Uses the integer ID from public.users
        })
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      setContent('');
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
    onError: (error) => {
      console.error("Failed to post:", error);
      alert("Failed to create post. Please try again.");
    }
  });

  // 4. Delete post mutation
  const deletePost = useMutation({
    mutationFn: async (postId: number) => {
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', postId);

      if (error) throw error;
    },
    onSuccess: () => {
      // Magically removes the post from the screen without reloading
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
    onError: (error) => {
      console.error("Failed to delete post:", error);
      alert("Failed to delete post.");
    }
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
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="What's new, Falcons? #Swim #Jobs #Montevallo"
                className="min-h-[60px] resize-none border-none focus-visible:ring-0 px-0 text-lg placeholder:text-muted-foreground bg-transparent"
              />
            </div>
          </CardHeader>
          <Separator />
          <CardFooter className="pt-3 pb-3 flex justify-between items-center bg-card rounded-b-xl">
            <div className="flex gap-1">
              <Button variant="ghost" size="sm" className="text-muted-foreground rounded-full">
                <ImageIcon className="h-5 w-5 mr-2" />Photo
              </Button>
              <Button variant="ghost" size="sm" className="text-muted-foreground rounded-full">
                <Video className="h-5 w-5 mr-2" />Video
              </Button>
            </div>
            <Button
              onClick={() => createPost.mutate()}
              disabled={!session || createPost.isPending || !content.trim()}
              className="rounded-full px-6 font-semibold"
            >
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

          {posts.map((post: any) => {
            const user = post.users; // The joined user data
            const postDate = new Date(post.created_at).toLocaleString('en-US', {
              month: 'numeric', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit'
            });

            return (
              <Card key={post.id} className="shadow-sm border-0 overflow-hidden">
                <CardHeader className="pb-3 pt-5">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      {/* CLICKABLE AVATAR */}
                      <Link
                        to={`/profile/${user?.id}`}
                        className="cursor-pointer hover:opacity-80 transition-opacity shrink-0"
                      >
                        <Avatar className="w-12 h-12">
                          <AvatarImage src={user?.profile_photo_url} className="object-cover" />
                          <AvatarFallback className="bg-primary text-primary-foreground">
                            {user ? `${user.first_name[0]}${user.last_name[0]}` : "?"}
                          </AvatarFallback>
                        </Avatar>
                      </Link>

                      {/* CLICKABLE NAME & HEADLINE */}
                      <Link to={`/profile/${user?.id}`} className="hover:underline cursor-pointer">
                        <h3 className="font-semibold text-base text-foreground leading-none">
                          {user?.first_name} {user?.last_name}
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                          {user?.headline || 'Student at University of Montevallo'}
                        </p>
                      </Link>

                      <span className="text-xs text-muted-foreground ml-2 hidden sm:inline-block">
                        • {postDate}
                      </span>
                    </div>

                    {/* Right aligned items (Mobile Date & More button) */}
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground sm:hidden">
                        {new Date(post.created_at).toLocaleDateString()}
                      </span>
                      {/* Right aligned items (Mobile Date & More button) */}
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground sm:hidden">
                          {new Date(post.created_at).toLocaleDateString()}
                        </span>

                        {/* FIX 1: Using == instead of === in case one ID is a string and the other is a number */}
                        {currentUser?.id == post.user_id && (
                          <DropdownMenu>
                            {/* FIX 2: Removed 'asChild' and the <Button> wrapper. Using a standard trigger guarantees the menu opens. */}
                            <DropdownMenuTrigger className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring">
                              <MoreHorizontal className="h-5 w-5" />
                            </DropdownMenuTrigger>

                            {/* FIX 3: Added z-index and explicit background colors just in case it was opening behind the card */}
                            <DropdownMenuContent align="end" className="w-40 z-50 bg-popover text-popover-foreground border shadow-md">
                              <DropdownMenuItem
                                className="text-destructive focus:bg-destructive/10 focus:text-destructive cursor-pointer flex items-center p-2 outline-none"
                                onClick={(e) => {
                                  e.stopPropagation(); // Prevents click events from bubbling up
                                  if (window.confirm("Are you sure you want to delete this post?")) {
                                    deletePost.mutate(post.id);
                                  }
                                }}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                <span>Delete Post</span>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="pt-1 pb-4">
                  <p className="whitespace-pre-wrap text-foreground text-[15px] leading-relaxed">
                    {post.content}
                  </p>

                  {post.hashtags?.length > 0 && (
                    <div className="flex gap-2 mt-4 flex-wrap">
                      {post.hashtags.map((tag: string) => (
                        <Badge key={tag} variant="secondary" className="cursor-pointer hover:bg-secondary/80 text-blue-600 bg-blue-50 border-0">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </CardContent>

                <Separator />

                <CardFooter className="py-2 px-2 flex gap-1 bg-card">
                  <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground hover:bg-muted flex-1 sm:flex-none">
                    <ThumbsUp className="h-4 w-4 mr-2" />
                    {post.likes || 0}
                  </Button>
                  <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground hover:bg-muted flex-1 sm:flex-none">
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Comment
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}