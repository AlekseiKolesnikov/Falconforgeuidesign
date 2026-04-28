import * as React from "react";
import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { MoreHorizontal, Pencil, Trash2, Heart, MessageCircle, Share2, Check, Bookmark } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Button } from "./ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "./ui/card";
import { Textarea } from "./ui/textarea";
import { supabase } from "../../lib/supabase";

const FALLBACK_AVATAR = "https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=400&h=400&fit=crop&q=80";

interface PostCardProps {
  post: any;
  currentUser: any;
  hideAuthor?: boolean; 
  onUpdate?: (postId: number, content: string) => void;
  onDelete?: (postId: number) => void;
  isUpdating?: boolean;
}

export function PostCard({ post, currentUser, hideAuthor = false, onUpdate, onDelete, isUpdating }: PostCardProps) {
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(post.content);
  const [showMenu, setShowMenu] = useState(false);
  const [isCopied, setIsCopied] = useState(false); // NEW STATE FOR SHARE
  const menuRef = useRef<HTMLDivElement>(null);

  const isOwner = currentUser?.id === post.user_id;
  const avatarUrl = post.users?.profile_photo_url || FALLBACK_AVATAR;
  const initials = post.users ? `${post.users.first_name?.[0] || ""}${post.users.last_name?.[0] || ""}` : "U";

  const formattedDate = post.created_at 
    ? new Date(post.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    : "Just now";

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSave = () => {
    if (onUpdate && editContent.trim() !== post.content) {
      onUpdate(post.id, editContent);
    }
    setIsEditing(false);
  };

  // --- SHARE POST LOGIC ---
  const handleShare = async () => {
    // Generate a direct link to this specific post
    const postUrl = `${window.location.origin}/post/${post.id}`;

    // Use Native Share API if available (Mobile devices, Safari, Edge)
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Post by ${post.users?.first_name} ${post.users?.last_name}`,
          text: "Check out this post on Falcon Forge!",
          url: postUrl,
        });
      } catch (error) {
        console.log("Share canceled or failed", error);
      }
    } else {
      // Fallback: Copy to clipboard for Desktop Chrome/Firefox
      try {
        await navigator.clipboard.writeText(postUrl);
        setIsCopied(true);
        // Reset the button text after 2 seconds
        setTimeout(() => setIsCopied(false), 2000);
      } catch (error) {
        console.error("Failed to copy link", error);
      }
    }
  };

  // --- SAVED POSTS LOGIC ---
  const { data: isSaved = false } = useQuery({
    queryKey: ['isSaved', post.id, currentUser?.id],
    queryFn: async () => {
      if (!currentUser?.id || !post.id) return false;
      const { data } = await supabase
        .from('saved_posts')
        .select('id')
        .eq('post_id', post.id)
        .eq('user_id', currentUser.id)
        .maybeSingle();
      return !!data;
    },
    enabled: !!currentUser?.id && !!post.id,
  });

  const toggleSaveMutation = useMutation({
    mutationFn: async () => {
      if (!currentUser?.id || !post.id) return;
      if (isSaved) {
        await supabase.from('saved_posts').delete().eq('post_id', post.id).eq('user_id', currentUser.id);
      } else {
        await supabase.from('saved_posts').insert({ post_id: post.id, user_id: currentUser.id });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['isSaved', post.id] });
      queryClient.invalidateQueries({ queryKey: ['savedItems'] }); 
    }
  });

  return (
    <Card className="mb-4 shadow-sm border border-border bg-card relative overflow-visible">
      {isOwner && (
        <div className="absolute top-3 right-3 z-20" ref={menuRef}>
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-muted-foreground hover:bg-muted" onClick={() => setShowMenu(!showMenu)}>
            <MoreHorizontal className="h-5 w-5" />
          </Button>
          {showMenu && (
            <div className="absolute right-0 top-full mt-1 w-36 bg-card border border-border rounded-xl shadow-lg overflow-hidden animate-in fade-in zoom-in-95">
              <button className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-foreground hover:bg-muted transition-colors" onClick={() => { setIsEditing(true); setShowMenu(false); }}>
                <Pencil className="h-4 w-4" /> Edit Post
              </button>
              <button className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-destructive hover:bg-destructive/10 transition-colors" onClick={() => { if(window.confirm("Are you sure you want to delete this post?")) { onDelete?.(post.id); } setShowMenu(false); }}>
                <Trash2 className="h-4 w-4" /> Delete
              </button>
            </div>
          )}
        </div>
      )}

      {!hideAuthor && (
        <CardHeader className="p-4 pb-2 flex flex-row items-start gap-3">
          <Avatar className="h-10 w-10 border bg-white shrink-0">
            <AvatarImage src={avatarUrl} className="object-cover" />
            <AvatarFallback className="bg-primary/10 text-primary font-semibold">{initials}</AvatarFallback>
          </Avatar>
          <div className="flex-1 pr-10">
            <p className="font-semibold text-sm text-foreground leading-tight">{post.users?.first_name} {post.users?.last_name}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{post.users?.headline || "Student"} • {formattedDate}</p>
          </div>
        </CardHeader>
      )}

      <CardContent className={`p-4 ${!hideAuthor ? 'pt-2' : ''}`}>
        {isEditing ? (
          <div className="space-y-3 mt-4">
            <Textarea value={editContent} onChange={(e) => setEditContent(e.target.value)} className="min-h-[100px] text-sm focus-visible:ring-1" autoFocus />
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" className="rounded-full" onClick={() => { setIsEditing(false); setEditContent(post.content); }}>Cancel</Button>
              <Button size="sm" className="rounded-full gap-1" onClick={handleSave} disabled={isUpdating}><Check className="h-4 w-4" /> {isUpdating ? "Saving..." : "Save"}</Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3 mt-2">
            <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed pr-8">{post.content}</p>
            {post.image_url && (
              <div className="rounded-xl overflow-hidden border">
                <img src={post.image_url} alt="Post attachment" className="w-full h-auto object-cover max-h-[400px]" />
              </div>
            )}
          </div>
        )}
      </CardContent>

      <CardFooter className="p-2 px-4 border-t border-border flex justify-between">
        <div className="flex gap-1">
          <Button variant="ghost" size="sm" className="text-muted-foreground gap-2 rounded-full hover:text-primary hover:bg-primary/5">
            <Heart className="h-4 w-4" /> <span>Like</span>
          </Button>
          <Button variant="ghost" size="sm" className="text-muted-foreground gap-2 rounded-full hover:text-primary hover:bg-primary/5">
            <MessageCircle className="h-4 w-4" /> <span>Comment</span>
          </Button>
          
          {/* UPDATED SHARE BUTTON */}
          <Button 
            variant="ghost" 
            size="sm" 
            className={`gap-2 rounded-full hover:bg-primary/5 ${isCopied ? 'text-primary' : 'text-muted-foreground hover:text-primary'}`}
            onClick={handleShare}
          >
            {isCopied ? <Check className="h-4 w-4" /> : <Share2 className="h-4 w-4" />} 
            <span className="hidden sm:inline">{isCopied ? "Copied!" : "Share"}</span>
          </Button>
        </div>
        
        <Button 
          variant="ghost" 
          size="icon" 
          className={`rounded-full hover:bg-primary/5 ${isSaved ? 'text-primary' : 'text-muted-foreground hover:text-primary'}`}
          onClick={() => toggleSaveMutation.mutate()}
        >
          <Bookmark className={`h-4 w-4 ${isSaved ? 'fill-current' : ''}`} />
        </Button>
      </CardFooter>
    </Card>
  );
}