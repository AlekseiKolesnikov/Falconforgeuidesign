import { Navigation } from "../components/Navigation";
import { Card, CardContent, CardFooter, CardHeader } from "../components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { Button } from "../components/ui/button";
import { Textarea } from "../components/ui/textarea";
import { Separator } from "../components/ui/separator";
import { Badge } from "../components/ui/badge";
import {
  ThumbsUp,
  MessageCircle,
  Share2,
  MoreHorizontal,
  Image as ImageIcon,
  Video,
  FileText,
} from "lucide-react";

const mockPosts = [
  {
    id: 1,
    author: {
      name: "Sarah Johnson",
      role: "Computer Science '24",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah",
    },
    timestamp: "2 hours ago",
    content: "Excited to announce that I'll be starting my internship at Microsoft this summer! Grateful for all the support from the Montevallo CS department. 🎉",
    likes: 24,
    comments: 8,
    image: null,
  },
  {
    id: 2,
    author: {
      name: "Dr. Michael Chen",
      role: "Assistant Professor, Business",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Michael",
    },
    timestamp: "5 hours ago",
    content: "Reminder: Applications for the Spring 2026 Business Analytics Research Program are due next Friday. This is a great opportunity for juniors and seniors interested in data science. Check the link in the opportunities section!",
    likes: 45,
    comments: 12,
    image: null,
  },
  {
    id: 3,
    author: {
      name: "Alumni Association",
      role: "Official",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Alumni",
    },
    timestamp: "1 day ago",
    content: "Join us for the Annual Falcon Networking Mixer on March 15th! Connect with successful alumni across various industries. Register now - limited spots available!",
    likes: 67,
    comments: 23,
    image: "https://images.unsplash.com/photo-1511578314322-379afb476865?w=800",
  },
  {
    id: 4,
    author: {
      name: "Marcus Williams",
      role: "Marketing '25",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Marcus",
    },
    timestamp: "2 days ago",
    content: "Looking for a team member for our startup project in the Entrepreneurship course. Need someone with web development skills. DM me if interested!",
    likes: 18,
    comments: 15,
    image: null,
  },
];

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
          {mockPosts.map((post) => (
            <Card key={post.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={post.author.avatar} alt={post.author.name} />
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {post.author.name.split(" ").map(n => n[0]).join("")}
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
