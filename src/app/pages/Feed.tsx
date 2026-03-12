import { Badge } from "../components/ui/badge";
import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Link } from 'react-router-dom';
import { Navigation } from "../components/Navigation";
import { Card, CardContent, CardFooter, CardHeader } from "../components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { Button } from "../components/ui/button";
import { Textarea } from "../components/ui/textarea";
import { Input } from "../components/ui/input";
import { Separator } from "../components/ui/separator";
import {
  ThumbsUp, MessageCircle, MoreHorizontal,
  Image as ImageIcon, Video, Trash2, Send
} from "lucide-react";
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
import { supabase } from '../../lib/supabase';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';


export function Feed() {
  const { session } = useAuth();
  const queryClient = useQueryClient();
  const [content, setContent] = useState('');
  const [postToDelete, setPostToDelete] = useState<number | null>(null);
  
  // New States for Comments
  const [expandedComments, setExpandedComments] = useState<Record<number, boolean>>({});
  const [commentInputs, setCommentInputs] = useState<Record<number, string>>({});

  // 1. Fetch CURRENT user
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
    enabled: !!session?.user?.id,
  });

  // 2. Posts query - Now pulling post_comments too!
  const { data: posts = [], isLoading } = useQuery({
    queryKey: ['posts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          users:user_id (id, first_name, last_name, profile_photo_url, headline),
          post_likes ( user_id ),
          post_comments (
            id,
            content_text,
            created_at,
            users:user_id (id, first_name, last_name, profile_photo_url)
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
      const rawTags = content.match(/#[a-zA-Z0-9_]+/g) || [];
      const extractedTags = rawTags.map(tag => tag.toLowerCase());

      const { data: newPost, error: postError } = await supabase
        .from('posts')
        .insert({ content: content.trim(), hashtags: extractedTags, user_id: currentUser.id })
        .select().single();
      if (postError) throw postError;

      if (extractedTags.length > 0) {
        for (const tagName of extractedTags) {
          const { data: tagData } = await supabase.from('tags').upsert({ name: tagName }, { onConflict: 'name' }).select().single();
          if (tagData) await supabase.from('post_tags').insert({ post_id: newPost.id, tag_id: tagData.id });
        }
      }
      return newPost;
    },
    onSuccess: () => {
      setContent('');
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    }
  });

  // 4. Delete post mutation
  const deletePost = useMutation({
    mutationFn: async (postId: number) => {
      const { error } = await supabase.from('posts').delete().eq('id', postId);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['posts'] })
  });

  // 5. Toggle Like Mutation
  const toggleLike = useMutation({
    mutationFn: async ({ postId, hasLiked }: { postId: number; hasLiked: boolean }) => {
      if (!currentUser?.id) throw new Error("Not logged in");
      if (hasLiked) {
        const { error } = await supabase.from('post_likes').delete().match({ post_id: postId, user_id: currentUser.id });
        if (error) throw error;
      } else {
        const { error } = await supabase.from('post_likes').insert({ post_id: postId, user_id: currentUser.id });
        if (error) throw error;
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['posts'] })
  });

  // 6. Create Comment Mutation
  const createComment = useMutation({
    mutationFn: async ({ postId, text }: { postId: number; text: string }) => {
      if (!currentUser?.id) throw new Error("Not logged in");
      const { error } = await supabase
        .from('post_comments')
        .insert({ post_id: postId, user_id: currentUser.id, content_text: text.trim() });
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      // Clear the specific input box for this post
      setCommentInputs(prev => ({ ...prev, [variables.postId]: '' }));
      // Ensure the comment section is open so they can see their new comment
      setExpandedComments(prev => ({ ...prev, [variables.postId]: true }));
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    }
  });

  const toggleCommentSection = (postId: number) => {
    setExpandedComments(prev => ({ ...prev, [postId]: !prev[postId] }));
  };

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
            const user = post.users;
            const postDate = new Date(post.created_at).toLocaleString('en-US', {
              month: 'numeric', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit'
            });
            const commentCount = post.post_comments?.length || 0;

            return (
              <Card key={post.id} className="shadow-sm border-0 overflow-hidden">
                <CardHeader className="pb-3 pt-5">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <Link to={`/profile/${user?.id}`} className="cursor-pointer hover:opacity-80 transition-opacity shrink-0">
                        <Avatar className="w-12 h-12">
                          <AvatarImage src={user?.profile_photo_url} className="object-cover" />
                          <AvatarFallback className="bg-primary text-primary-foreground">
                            {user ? `${user.first_name[0]}${user.last_name[0]}` : "?"}
                          </AvatarFallback>
                        </Avatar>
                      </Link>

                      <Link to={`/profile/${user?.id}`} className="hover:underline cursor-pointer">
                        <h3 className="font-semibold text-base text-foreground leading-none">
                          {user?.first_name} {user?.last_name}
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                          {user?.headline || 'Student at University of Montevallo'}
                        </p>
                      </Link>

                      <span className="text-xs text-muted-foreground ml-2 hidden sm:inline-block">• {postDate}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground sm:hidden">{new Date(post.created_at).toLocaleDateString()}</span>

                      {currentUser?.id == post.user_id && (
                        <DropdownMenu>
                          <DropdownMenuTrigger className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring">
                            <MoreHorizontal className="h-5 w-5" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-40 z-50 bg-popover text-popover-foreground border shadow-md">
                            <DropdownMenuItem
                              className="text-destructive focus:bg-destructive/10 focus:text-destructive cursor-pointer flex items-center p-2 outline-none"
                              onClick={(e) => {
                                e.stopPropagation();
                                setPostToDelete(post.id);
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
                </CardHeader>

                <CardContent className="pt-1 pb-4">
                  <p className="whitespace-pre-wrap text-foreground text-[15px] leading-relaxed">{post.content}</p>

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
                  {/* Likes Button */}
                  {(() => {
                    const likeCount = post.post_likes?.length || 0;
                    const hasLiked = post.post_likes?.some((like: any) => like.user_id === currentUser?.id);
                    const isLiking = toggleLike.isPending && toggleLike.variables?.postId === post.id;

                    return (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleLike.mutate({ postId: post.id, hasLiked })}
                        disabled={isLiking}
                        className={`flex-1 sm:flex-none transition-colors ${hasLiked ? 'text-blue-600 font-semibold hover:text-blue-700 hover:bg-blue-50' : 'text-muted-foreground hover:text-foreground hover:bg-muted'}`}
                      >
                        <ThumbsUp className={`h-4 w-4 mr-2 ${hasLiked ? 'fill-current' : ''} ${isLiking ? 'animate-pulse' : ''}`} />
                        {likeCount > 0 ? likeCount : 'Like'}
                      </Button>
                    );
                  })()}

                  {/* Comment Toggle Button */}
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => toggleCommentSection(post.id)}
                    className="text-muted-foreground hover:text-foreground hover:bg-muted flex-1 sm:flex-none"
                  >
                    <MessageCircle className="h-4 w-4 mr-2" />
                    {commentCount > 0 ? commentCount : 'Comment'}
                  </Button>
                </CardFooter>

                {/* THE NEW COMMENTS SECTION */}
                {expandedComments[post.id] && (
                  <div className="px-4 pb-4 pt-2 bg-muted/20 border-t border-border">
                    {/* Render existing comments */}
                    <div className="space-y-4 mb-4 mt-2">
                      {post.post_comments?.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-2">No comments yet. Be the first to reply!</p>
                      ) : (
                        post.post_comments
                          // Sort comments from oldest to newest
                          ?.sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
                          .map((comment: any) => (
                            <div key={comment.id} className="flex gap-3">
                              <Avatar className="w-8 h-8 shrink-0">
                                <AvatarImage src={comment.users?.profile_photo_url} className="object-cover" />
                                <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                                  {comment.users?.first_name?.[0]}{comment.users?.last_name?.[0]}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 bg-background border shadow-sm rounded-lg p-3 text-sm">
                                <div className="font-semibold text-foreground mb-1">
                                  {comment.users?.first_name} {comment.users?.last_name}
                                  <span className="text-xs text-muted-foreground font-normal ml-2">
                                    {new Date(comment.created_at).toLocaleDateString()}
                                  </span>
                                </div>
                                <p className="text-foreground whitespace-pre-wrap">{comment.content_text}</p>
                              </div>
                            </div>
                          ))
                      )}
                    </div>

                    {/* Input to write a new comment */}
                    <div className="flex gap-2 items-center">
                      <Avatar className="w-8 h-8 shrink-0 hidden sm:block">
                        <AvatarImage src={currentUser?.profile_photo_url} className="object-cover" />
                        <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                          {currentUser?.first_name?.[0]}{currentUser?.last_name?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      <Input
                        value={commentInputs[post.id] || ''}
                        onChange={(e) => setCommentInputs({ ...commentInputs, [post.id]: e.target.value })}
                        placeholder="Write a comment..."
                        className="flex-1 bg-background"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && commentInputs[post.id]?.trim()) {
                            createComment.mutate({ postId: post.id, text: commentInputs[post.id] });
                          }
                        }}
                      />
                      <Button 
                        size="icon" 
                        className="shrink-0 rounded-full"
                        disabled={!commentInputs[post.id]?.trim() || createComment.isPending}
                        onClick={() => createComment.mutate({ postId: post.id, text: commentInputs[post.id] })}
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      </div>
      
      {/* Premium Delete Confirmation Modal */}
      <AlertDialog open={postToDelete !== null} onOpenChange={(isOpen) => !isOpen && setPostToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your post from the Falcon Forge feed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (postToDelete) {
                  deletePost.mutate(postToDelete);
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