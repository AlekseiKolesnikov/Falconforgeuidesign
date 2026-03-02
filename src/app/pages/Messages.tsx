import { useState } from "react";
import { Navigation } from "@/app/components/Navigation";
import { Card } from "@/app/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/app/components/ui/avatar";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Badge } from "@/app/components/ui/badge";
import { ScrollArea } from "@/app/components/ui/scroll-area";
import { Search, Send, Phone, Video, MoreVertical } from "lucide-react";

const mockConversations = [
  {
    id: 1,
    user: {
      name: "Sarah Johnson",
      role: "CS '24",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah",
      online: true,
    },
    lastMessage: "Thanks for the code review!",
    timestamp: "10m ago",
    unread: 2,
  },
  {
    id: 2,
    user: {
      name: "Dr. Michael Chen",
      role: "Professor",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Michael",
      online: false,
    },
    lastMessage: "Your research proposal looks great",
    timestamp: "1h ago",
    unread: 0,
  },
  {
    id: 3,
    user: {
      name: "Emily Rodriguez",
      role: "Biology '26",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Emily",
      online: true,
    },
    lastMessage: "Are you free for study group tonight?",
    timestamp: "3h ago",
    unread: 1,
  },
  {
    id: 4,
    user: {
      name: "Marcus Williams",
      role: "Marketing '25",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Marcus",
      online: false,
    },
    lastMessage: "The startup project is coming along well",
    timestamp: "Yesterday",
    unread: 0,
  },
];

const mockMessages = [
  {
    id: 1,
    sender: "them",
    text: "Hey! Did you finish the database assignment?",
    timestamp: "2:30 PM",
  },
  {
    id: 2,
    sender: "me",
    text: "Yes, just submitted it. How about you?",
    timestamp: "2:32 PM",
  },
  {
    id: 3,
    sender: "them",
    text: "Almost done. Can you help me with the last query?",
    timestamp: "2:33 PM",
  },
  {
    id: 4,
    sender: "me",
    text: "Sure! What are you stuck on?",
    timestamp: "2:35 PM",
  },
  {
    id: 5,
    sender: "them",
    text: "The JOIN operation isn't returning the right results",
    timestamp: "2:36 PM",
  },
  {
    id: 6,
    sender: "me",
    text: "Try using LEFT JOIN instead of INNER JOIN. That might help!",
    timestamp: "2:38 PM",
  },
  {
    id: 7,
    sender: "them",
    text: "Thanks for the code review!",
    timestamp: "2:45 PM",
  },
];

export function Messages() {
  const [selectedChat, setSelectedChat] = useState(mockConversations[0]);
  const [messageText, setMessageText] = useState("");

  return (
    <div className="min-h-screen bg-muted/30">
      <Navigation />

      <div className="container max-w-7xl mx-auto px-4 py-6 pb-20 lg:pb-6">
        <Card className="overflow-hidden h-[calc(100vh-12rem)]">
          <div className="grid grid-cols-1 md:grid-cols-3 h-full">
            {/* Conversations List */}
            <div className="border-r border-border">
              {/* Search */}
              <div className="p-4 border-b border-border">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    type="search"
                    placeholder="Search messages..."
                    className="pl-10 bg-input-background"
                  />
                </div>
              </div>

              {/* Conversations */}
              <ScrollArea className="h-[calc(100%-5rem)]">
                {mockConversations.map((conversation) => (
                  <button
                    key={conversation.id}
                    onClick={() => setSelectedChat(conversation)}
                    className={`w-full p-4 flex items-center gap-3 border-b border-border hover:bg-accent transition-colors text-left ${
                      selectedChat.id === conversation.id ? "bg-accent" : ""
                    }`}
                  >
                    <div className="relative">
                      <Avatar>
                        <AvatarImage src={conversation.user.avatar} alt={conversation.user.name} />
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          {conversation.user.name.split(" ").map(n => n[0]).join("")}
                        </AvatarFallback>
                      </Avatar>
                      {conversation.user.online && (
                        <div className="absolute bottom-0 right-0 h-3 w-3 bg-green-500 rounded-full border-2 border-background" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-medium truncate">{conversation.user.name}</p>
                        <span className="text-xs text-muted-foreground">
                          {conversation.timestamp}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-muted-foreground truncate">
                          {conversation.lastMessage}
                        </p>
                        {conversation.unread > 0 && (
                          <Badge className="ml-2">{conversation.unread}</Badge>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </ScrollArea>
            </div>

            {/* Chat Area */}
            <div className="col-span-2 flex flex-col">
              {/* Chat Header */}
              <div className="p-4 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Avatar>
                      <AvatarImage src={selectedChat.user.avatar} alt={selectedChat.user.name} />
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {selectedChat.user.name.split(" ").map(n => n[0]).join("")}
                      </AvatarFallback>
                    </Avatar>
                    {selectedChat.user.online && (
                      <div className="absolute bottom-0 right-0 h-3 w-3 bg-green-500 rounded-full border-2 border-background" />
                    )}
                  </div>
                  <div>
                    <p className="font-semibold">{selectedChat.user.name}</p>
                    <p className="text-xs text-muted-foreground">{selectedChat.user.role}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon">
                    <Phone className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon">
                    <Video className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Messages */}
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  {mockMessages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.sender === "me" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[70%] rounded-lg p-3 ${
                          message.sender === "me"
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted"
                        }`}
                      >
                        <p className="text-sm">{message.text}</p>
                        <p
                          className={`text-xs mt-1 ${
                            message.sender === "me"
                              ? "text-primary-foreground/70"
                              : "text-muted-foreground"
                          }`}
                        >
                          {message.timestamp}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>

              {/* Message Input */}
              <div className="p-4 border-t border-border">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (messageText.trim()) {
                      // Handle send message
                      setMessageText("");
                    }
                  }}
                  className="flex items-center gap-2"
                >
                  <Input
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 bg-input-background"
                  />
                  <Button type="submit" size="icon">
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
