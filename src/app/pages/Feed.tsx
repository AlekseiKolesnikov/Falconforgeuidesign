import { Navigation } from "../components/Navigation";
import { Card, CardContent, CardFooter, CardHeader } from "../components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { Button } from "../components/ui/button";
import { Textarea } from "../components/ui/textarea";
import { Separator } from "../components/ui/separator";
import { Badge } from "../components/ui/badge";
import { useEffect, useState } from 'react'
import { createClient, User } from '@supabase/supabase-js'
import {
  ThumbsUp,
  MessageCircle,
  Share2,
  MoreHorizontal,
  Image as ImageIcon,
  Video,
  FileText,
} from "lucide-react";


const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL!,
  import.meta.env.VITE_SUPABASE_ANON_KEY!
)

const [user, setUser] = useState<User | null>(null)
const [posts, setPosts] = useState<any[]>([])


useEffect(() => {
  supabase
    .from('posts')
    .select('*, profiles(first_name, last_name)')
    .order('created_at', { ascending: false })
    .then(({ data }) => console.log('Real posts:', data))
}, [])


export function Feed() {
  return (
    <div className="min-h-screen bg-muted/30 pb-20 lg:pb-0">
      <Navigation />

      <div className="container max-w-4xl mx-auto px-4 py-6">
        {/* Create Post Card */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center gap-3">
              <Avatar>
                <AvatarImage src="https://api.dicebear.com/7.x/avataaars/svg?seed=John" alt="Your profile" />
                <AvatarFallback className="bg-primary text-primary-foreground">JD</AvatarFallback>
              </Avatar>
              <Textarea
                placeholder="Share an update with the Falcon community..."
                className="min-h-[60px] resize-none bg-input-background"
              />
            </div>
          </CardHeader>
          <Separator />
          <CardFooter className="pt-4 flex justify-between">
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" className="gap-2">
                <ImageIcon className="h-4 w-4 text-primary" />
                Photo
              </Button>
              <Button variant="ghost" size="sm" className="gap-2">
                <Video className="h-4 w-4 text-primary" />
                Video
              </Button>
              <Button variant="ghost" size="sm" className="gap-2">
                <FileText className="h-4 w-4 text-primary" />
                Article
              </Button>
            </div>
            <Button>Post</Button>
          </CardFooter>
        </Card>

        {/* Feed Posts */}
        <div className="space-y-4">
          {posts.map((post) => (
            <Card key={post.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={post.author.avatar} alt={post.author.name} />
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {(post.author?.name || "User").split(" ").map((n: string) => n[0]).join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold">{post.author.name}</h3>
                      <p className="text-sm text-muted-foreground">{post.author.role}</p>
                      <p className="text-xs text-muted-foreground">{post.timestamp}</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-foreground whitespace-pre-wrap">{post.content}</p>
                {post.image && (
                  <img
                    src={post.image}
                    alt="Post image"
                    className="w-full rounded-lg object-cover max-h-96"
                  />
                )}
              </CardContent>
              <Separator />
              <CardFooter className="pt-4">
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-6">
                    <Button variant="ghost" size="sm" className="gap-2">
                      <ThumbsUp className="h-4 w-4" />
                      <span>{post.likes}</span>
                    </Button>
                    <Button variant="ghost" size="sm" className="gap-2">
                      <MessageCircle className="h-4 w-4" />
                      <span>{post.comments}</span>
                    </Button>
                    <Button variant="ghost" size="sm" className="gap-2">
                      <Share2 className="h-4 w-4" />
                      Share
                    </Button>
                  </div>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>

        {/* Suggested Connections */}
        <Card className="mt-6">
          <CardHeader>
            <h3 className="font-semibold">Suggested Connections</h3>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { name: "Emily Rodriguez", role: "Biology '26", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Emily" },
              { name: "James Taylor", role: "Alumni - Engineering", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=James" },
              { name: "Dr. Lisa Anderson", role: "Professor, English", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Lisa" },
            ].map((person, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={person.avatar} alt={person.name} />
                    <AvatarFallback className="bg-accent text-accent-foreground">
                      {person.name.split(" ").map(n => n[0]).join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-sm">{person.name}</p>
                    <p className="text-xs text-muted-foreground">{person.role}</p>
                  </div>
                </div>
                <Button size="sm" variant="outline">Connect</Button>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
