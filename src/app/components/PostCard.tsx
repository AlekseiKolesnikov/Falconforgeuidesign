import * as React from "react";
import { useState } from "react";
import { Card, CardHeader, CardContent, CardFooter } from "./ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Textarea } from "./ui/textarea";
import { Input } from "./ui/input";
import { Separator } from "./ui/separator";
import { Link } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog";
import { MoreHorizontal, Pencil, Trash2, ThumbsUp, MessageCircle, Send } from "lucide-react";

interface PostCardProps {
  post: any;
  currentUser: any;
  onUpdate: (postId: number, newContent: string) => void;
  onDelete: (post: any) => void;
  isUpdating?: boolean;
  onToggleLike?: (postId: number, hasLiked: boolean) => void;
  onCreateComment?: (postId: number, text: string) => void;
  hideAuthor?: boolean; // <-- Added this new prop
}

export function PostCard({ post, currentUser, onUpdate, onDelete, isUpdating, onToggleLike, onCreateComment, hideAuthor }: PostCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(post.content || "");
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [commentInput, setCommentInput] = useState("");

  const handleSave = () => {
    onUpdate(post.id, editContent);
    setIsEditing(false);
  };

  const handleCommentSubmit = () => {
    if (commentInput.trim() && onCreateComment) {
      onCreateComment(post.id, commentInput);
      setCommentInput("");
    }
  };

  const isOwner = currentUser?.id === post.user_id;
  const user = post.users; // The author of the post
  const postDate = new Date(post.created_at).toLocaleDateString();

  const likeCount = post.post_likes?.length || 0;
  const hasLiked = post.post_likes?.some((like: any) => like.user_id === currentUser?.id);

  return (
    <>
      <Card className="shadow-sm border-0 overflow-hidden">
        {/* POST HEADER (Avatar & Name) */}
        <CardHeader className={hideAuthor ? "p-4 pb-0" : "pb-3 pt-5"}>
          <div className="flex items-start justify-between">

            {/* Conditionally render Author Info or just the Date */}
            {!hideAuthor ? (
              <div className="flex items-center gap-3">
                {user && (
                  <Link to={`/profile/${user.id}`} className="cursor-pointer hover:opacity-80 transition-opacity shrink-0">
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={user.profile_photo_url} className="object-cover" />
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {user.first_name?.[0]}{user.last_name?.[0]}
                      </AvatarFallback>
                    </Avatar>
                  </Link>
                )}

                <div>
                  {user ? (
                    <Link to={`/profile/${user.id}`} className="hover:underline cursor-pointer">
                      <h3 className="font-semibold text-base text-foreground leading-none">
                        {user.first_name} {user.last_name}
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                        {user.headline || 'Student'}
                      </p>
                    </Link>
                  ) : (
                    <h3 className="font-semibold text-base text-foreground leading-none">Unknown User</h3>
                  )}
                </div>
                <span className="text-xs text-muted-foreground ml-2 hidden sm:inline-block">{postDate}</span>
              </div>
            ) : (
              <div className="text-xs text-muted-foreground mt-1">{postDate}</div>
            )}

            <div className="flex items-center gap-2">
              {!hideAuthor && (
                <span className="text-xs text-muted-foreground sm:hidden">{new Date(post.created_at).toLocaleDateString()}</span>
              )}
              {isOwner && (
                <DropdownMenu>
                  <DropdownMenuTrigger className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring">
                    <MoreHorizontal className="h-5 w-5" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-40 z-50 bg-popover text-popover-foreground border shadow-md">
                    <DropdownMenuItem
                      className="cursor-pointer flex items-center p-2 outline-none"
                      onSelect={(e) => {
                        e.preventDefault();
                        setIsEditing(true);
                        setEditContent(post.content || '');
                      }}
                    >
                      <Pencil className="mr-2 h-4 w-4" />
                      <span>Edit Post</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-destructive focus:bg-destructive/10 focus:text-destructive cursor-pointer flex items-center p-2 outline-none"
                      onSelect={(e) => {
                        e.preventDefault();
                        setShowDeleteAlert(true);
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

        {/* POST CONTENT */}
        <CardContent className="pt-1 pb-4">
          {isEditing ? (
            <div className="space-y-3 mb-3 mt-2">
              <Textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="min-h-[100px] resize-none focus-visible:ring-1 bg-background"
              />
              <div className="flex justify-end gap-2">
                <Button variant="outline" size="sm" className="rounded-full" onClick={() => setIsEditing(false)}>
                  Cancel
                </Button>
                <Button size="sm" className="rounded-full" onClick={handleSave} disabled={isUpdating || !editContent.trim()}>
                  {isUpdating ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </div>
          ) : (
            post.content && (
              <p className="whitespace-pre-wrap text-foreground text-[15px] leading-relaxed mb-3 mt-2">
                {post.content}
              </p>
            )
          )}

          {post.image_url && (
            <div className="mt-3 aspect-auto overflow-hidden rounded-xl border border-border">
              <img src={post.image_url} alt="Post attachment" className="w-full h-auto max-h-[500px] object-contain" loading="lazy" />
            </div>
          )}

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

        {/* LIKES & COMMENTS FOOTER */}
        {(onToggleLike || onCreateComment) && (
          <>
            <Separator />
            <CardFooter className="py-2 px-2 flex gap-1 bg-card">
              {onToggleLike && (
                <Button
                  variant="ghost" size="sm"
                  onClick={() => onToggleLike(post.id, hasLiked)}
                  className={`flex-1 sm:flex-none transition-colors ${hasLiked ? 'text-blue-600 font-semibold hover:text-blue-700 hover:bg-blue-50' : 'text-muted-foreground hover:text-foreground hover:bg-muted'}`}
                >
                  <ThumbsUp className={`h-4 w-4 mr-2 ${hasLiked ? 'fill-current' : ''}`} />
                  {likeCount > 0 ? likeCount : 'Like'}
                </Button>
              )}
              {onCreateComment && (
                <Button
                  variant="ghost" size="sm"
                  onClick={() => setShowComments(!showComments)}
                  className="text-muted-foreground hover:text-foreground hover:bg-muted flex-1 sm:flex-none"
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  {post.post_comments?.length > 0 ? post.post_comments.length : 'Comment'}
                </Button>
              )}
            </CardFooter>

            {/* EXPANDED COMMENTS */}
            {showComments && onCreateComment && (
              <div className="px-4 pb-4 pt-2 bg-muted/20 border-t border-border">
                <div className="space-y-4 mb-4 mt-2">
                  {post.post_comments?.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-2">No comments yet. Be the first to reply!</p>
                  ) : (
                    post.post_comments?.sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()).map((comment: any) => (
                      <div key={comment.id} className="flex gap-3">
                        <Avatar className="w-8 h-8 shrink-0">
                          <AvatarImage src={comment.users?.profile_photo_url} className="object-cover" />
                          <AvatarFallback className="text-xs bg-primary text-primary-foreground">{comment.users?.first_name?.[0]}{comment.users?.last_name?.[0]}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 bg-background border shadow-sm rounded-lg p-3 text-sm">
                          <div className="font-semibold text-foreground mb-1">
                            {comment.users?.first_name} {comment.users?.last_name}
                            <span className="text-xs text-muted-foreground font-normal ml-2">{new Date(comment.created_at).toLocaleDateString()}</span>
                          </div>
                          <p className="text-foreground whitespace-pre-wrap">{comment.content_text}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="flex gap-2 items-center">
                  <Avatar className="w-8 h-8 shrink-0 hidden sm:block">
                    <AvatarImage src={currentUser?.profile_photo_url} className="object-cover" />
                    <AvatarFallback className="text-xs bg-primary text-primary-foreground">{currentUser?.first_name?.[0]}{currentUser?.last_name?.[0]}</AvatarFallback>
                  </Avatar>
                  <Input
                    value={commentInput}
                    onChange={(e) => setCommentInput(e.target.value)}
                    placeholder="Write a comment..."
                    className="flex-1 bg-background"
                    onKeyDown={(e) => { if (e.key === 'Enter') handleCommentSubmit(); }}
                  />
                  <Button size="icon" className="shrink-0 rounded-full" disabled={!commentInput.trim()} onClick={handleCommentSubmit}>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </Card>

      {/* ISOLATED ALERT DIALOG */}
      <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone. This will permanently delete your post.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => { onDelete(post); setShowDeleteAlert(false); }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}