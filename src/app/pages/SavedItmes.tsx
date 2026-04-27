import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { Bookmark } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../contexts/AuthContext";
import { Navigation } from "../components/Navigation";
import { Card, CardContent } from "../components/ui/card";
import { PostCard } from "../components/PostCard";

export function SavedItems() {
  const { session } = useAuth();

  // 1. GET CURRENT USER
  const { data: currentUser } = useQuery({
    queryKey: ['currentUser', session?.user?.id],
    queryFn: async () => {
      if (!session?.user?.id) return null;
      const { data } = await supabase.from('users').select('id, first_name, last_name, profile_photo_url').eq('auth_users_uuid', session.user.id).single();
      return data;
    },
    enabled: !!session?.user?.id,
  });

  // 2. FETCH SAVED POSTS
  const { data: savedPosts = [], isLoading } = useQuery({
    queryKey: ['savedItems', currentUser?.id],
    queryFn: async () => {
      if (!currentUser?.id) return [];
      
      const { data, error } = await supabase
        .from('saved_posts')
        .select(`
          id,
          post_id,
          posts (
            id, content, image_url, created_at, user_id,
            users (id, first_name, last_name, profile_photo_url, headline)
          )
        `)
        .eq('user_id', currentUser.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Filter out any null posts (in case a post was deleted but the save record remained)
      return data.map(item => item.posts).filter(Boolean);
    },
    enabled: !!currentUser?.id,
  });

  return (
    <div className="min-h-screen bg-muted/30 pb-20 lg:pb-0">
      <Navigation />

      <div className="container max-w-2xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground">Saved Items</h1>
          <p className="text-muted-foreground mt-1">Posts and updates you've bookmarked to read later.</p>
        </div>

        {isLoading ? (
          <div className="text-center py-20 text-muted-foreground">Loading your saved items...</div>
        ) : savedPosts.length === 0 ? (
          <Card className="shadow-sm border-0">
            <CardContent className="flex flex-col items-center justify-center py-24 text-center">
              <div className="bg-primary/10 p-4 rounded-full mb-4">
                <Bookmark className="h-10 w-10 text-primary" />
              </div>
              <h2 className="text-xl font-semibold text-foreground mb-2">Nothing saved yet</h2>
              <p className="text-muted-foreground max-w-md">
                Keep track of interesting posts by clicking the bookmark icon on any post in your feed. They will automatically appear here for easy access.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {savedPosts.map((post: any) => (
              <PostCard 
                key={post.id} 
                post={post} 
                currentUser={currentUser} 
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}