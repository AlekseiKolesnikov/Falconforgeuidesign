import { useEffect, useState } from 'react'
import { Navigation } from "../components/Navigation";
import { Card, CardContent, CardFooter, CardHeader } from "../components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { Button } from "../components/ui/button";
import { Textarea } from "../components/ui/textarea";
import { Separator } from "../components/ui/separator";
import { Badge } from "../components/ui/badge";
import { createClient, User } from '@supabase/supabase-js'
import {
  ThumbsUp, MessageCircle, Share2, MoreHorizontal,
  Image as ImageIcon, Video, FileText,
} from "lucide-react";

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL!,
  import.meta.env.VITE_SUPABASE_ANON_KEY!
)

export function Feed() {  
  const [user, setUser] = useState<User | null>(null)     
  const [posts, setPosts] = useState<any[]>([])            

  useEffect(() => {                                        
    supabase
      .from('posts')
      .select('*, profiles(first_name, last_name)')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        console.log('Real posts:', data)
        setPosts(data || [])  // ✅ Use data
      })
  }, [])

  // Demo fallback posts (if Supabase empty)
  const demoPosts = [
    {
      id: 1, author: { name: "Aleksei K 🏊‍♂️", role: "Swim Captain", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Aleksei" },
      content: "Broke 3 school records this season! Who's ready for NCAAs? 💪 #MontevalloSwim", likes: 42, comments: 12, timestamp: "2h ago"
    },
    {
      id: 2, author: { name: "Montevallo Swim", role: "Team Account", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Team" },
      content: "Congrats Aleksei on All-American honors! 🥈 #FalconPride", likes: 128, comments: 25, timestamp: "1d ago"
    }
  ]

  return (
    <div className="min-h-screen bg-muted/30 pb-20 lg:pb-0">
      <Navigation />
      <div className="container max-w-4xl mx-auto px-4 py-6">
        {/* Create Post Card */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center gap-3">
              <Avatar>
                <AvatarImage src="https://api.dicebear.com/7.x/avataaars/svg?seed=Aleksei" />
                <AvatarFallback className="bg-primary text-primary-foreground">AK</AvatarFallback>
              </Avatar>
              <Textarea placeholder="Share an update with Falcons..." className="min-h-[60px] resize-none" />
            </div>
          </CardHeader>
          <Separator />
          <CardFooter className="pt-4 flex justify-between">
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" className="gap-2"><ImageIcon className="h-4 w-4 text-primary" />Photo</Button>
              <Button variant="ghost" size="sm" className="gap-2"><Video className="h-4 w-4 text-primary" />Video</Button>
              <Button variant="ghost" size="sm" className="gap-2"><FileText className="h-4 w-4 text-primary" />Article</Button>
            </div>
            <Button>Post</Button>
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
                      <AvatarImage src={post.author?.avatar} alt={post.author?.name} />
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {(post.author?.name || "User").split(" ")[0][0]}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold">{post.author?.name || post.profiles?.first_name}</h3>
                      <p className="text-sm text-muted-foreground">{post.author?.role}</p>
                      <p className="text-xs text-muted-foreground">{post.created_at || post.timestamp}</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                </div>
              </CardHeader>
              <CardContent>
                <p>{post.content}</p>
              </CardContent>
              <Separator />
              <CardFooter>
                <div className="flex gap-6">
                  <Button variant="ghost" size="sm"><ThumbsUp className="h-4 w-4 mr-1" /> {post.likes}</Button>
                  <Button variant="ghost" size="sm"><MessageCircle className="h-4 w-4 mr-1" /> {post.comments}</Button>
                  <Button variant="ghost" size="sm"><Share2 className="h-4 w-4 mr-1" /> Share</Button>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}  
