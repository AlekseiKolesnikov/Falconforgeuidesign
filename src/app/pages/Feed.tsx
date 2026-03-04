import { Badge } from "../components/ui/badge";
import { useEffect, useState } from 'react'
import { useAuth } from '../../contexts/AuthContext';
import { Navigation } from "../components/Navigation";
import { Card, CardContent, CardFooter, CardHeader } from "../components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { Button } from "../components/ui/button";
import { Textarea } from "../components/ui/textarea";
import { Separator } from "../components/ui/separator";
import {
  ThumbsUp, MessageCircle, Share2, MoreHorizontal,
  Image as ImageIcon, Video, FileText,
} from "lucide-react";
import { supabase } from '../../lib/supabase';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const demoPosts = [
  {
    id: 'demo1',
    profiles: { first_name: 'Aleksei', last_name: 'Kolesnikov' },
    content: '🏊‍♂️ Swim captain ready! #MontevalloSwim',
    hashtags: ['#MontevalloSwim'],
    likes: 42,
    created_at: new Date().toISOString()
  }
];

export function Feed() {
  const { session } = useAuth();
  const queryClient = useQueryClient();
  const [content, setContent] = useState('');

  // Posts query
  const { data: posts = [] } = useQuery({
    queryKey: ['posts'],
    queryFn: async () => {
      const { data } = await supabase
        .from('posts')
        .select('*, profiles(first_name, last_name, avatar)')
        .order('created_at', { ascending: false });
      return data || [];
    }
  });

  // Create post
  const createPost = useMutation({
    mutationFn: async () => {
      const hashtags = content.match(/#\w+/g) || [];
      const { data, error } = await supabase
        .from('posts')
        .insert({
          content,
          hashtags,
          profile_id: session?.user?.id || '00000000-0000-0000-0000-000000000001'  //
        })
        .select()
        .single();
      if (error) console.error(error);  // Debug
      throw error || undefined;
      return data;
    },
    onSuccess: () => {
      setContent('');
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    }
  });

  return (
    <div className="min-h-screen bg-muted/30 pb-20 lg:pb-0">
      <Navigation />
      <div className="container max-w-4xl mx-auto px-4 py-6">
        {/* Create Post */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center gap-3">
              <Avatar>
                <AvatarImage src="https://api.dicebear.com/7.x/avataaars/svg?seed=Aleksei" />
                <AvatarFallback>AK</AvatarFallback>
              </Avatar>
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="What's new Falcons? #Swim #Jobs #Montevallo"
                className="min-h-[60px] resize-none"
              />
            </div>
          </CardHeader>
          <Separator />
          <CardFooter className="pt-4 flex justify-between">
            <div className="flex gap-2">
              <Button variant="ghost" size="sm"><ImageIcon className="h-4 w-4" />Photo</Button>
              <Button variant="ghost" size="sm"><Video className="h-4 w-4" />Video</Button>
            </div>
            <Button
              onClick={() => createPost.mutate()}
              disabled={!session || createPost.isPending || !content.trim()}
            >
              {createPost.isPending ? 'Posting...' : 'Post'}
            </Button>
          </CardFooter>
        </Card>

        {/* Posts */}
        <div className="space-y-4">
          {(posts.length ? posts : demoPosts).map((post) => (
            <Card key={post.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={post.profiles?.avatar} />
                      <AvatarFallback>
                        {post.profiles?.first_name?.[0]}{post.profiles?.last_name?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold">
                        {post.profiles?.first_name} {post.profiles?.last_name}
                      </h3>
                      <p className="text-sm text-muted-foreground">Student</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(post.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="whitespace-pre-wrap">{post.content}</p>
                {post.hashtags?.length ? (
                  <div className="flex gap-2 mt-3 flex-wrap">
                    {post.hashtags.map((tag: string) => (
                      <Badge key={tag} variant="secondary" className="cursor-pointer">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                ) : null}
              </CardContent>
              <Separator />
              <CardFooter>
                <div className="flex gap-6">
                  <Button variant="ghost" size="sm">
                    <ThumbsUp className="h-4 w-4 mr-1" /> {post.likes || 0}
                  </Button>
                  <Button variant="ghost" size="sm">
                    <MessageCircle className="h-4 w-4 mr-1" /> 0
                  </Button>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
