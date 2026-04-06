import * as React from "react";
import { useState } from "react";
import { Card, CardHeader } from "../components/ui/card"; // Adjust paths as needed
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Textarea } from "../components/ui/textarea";
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
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";

interface PostCardProps {
  post: any;
  onUpdate: (postId: number, content: string) => void;
  onDelete: (postId: number) => void;
  isUpdating: boolean;
}

export function PostCard({ post, onUpdate, onDelete, isUpdating }: PostCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(post.content || "");
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);

  const handleSave = () => {
    onUpdate(post.id, editContent);
    setIsEditing(false);
  };

  return (
    <>
      <Card className="border border-border shadow-none overflow-hidden flex flex-col relative group">
        <CardHeader className="p-4 pb-2">
          <div className="flex items-start justify-between">
            {isEditing ? (
              /* INLINE EDIT MODE */
              <div className="w-full space-y-3 mt-2">
                <Textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="min-h-[100px] p-4 border border-border rounded-xl focus-visible:ring-1 bg-background"
                />
                <div className="flex justify-end gap-2">
                  <Button variant="outline" size="sm" className="rounded-full" onClick={() => setIsEditing(false)}>
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    className="rounded-full"
                    onClick={handleSave}
                    disabled={isUpdating || !editContent.trim()}
                  >
                    {isUpdating ? 'Saving...' : 'Save'}
                  </Button>
                </div>
              </div>
            ) : (
              /* VIEW MODE */
              <>
                <div className="w-full pr-8">
                  <p className="text-sm text-foreground line-clamp-2">{post.content}</p>

                  {/* Render Hashtag Badges */}
                  {post.hashtags?.length > 0 && (
                    <div className="flex gap-2 mt-2 flex-wrap">
                      {post.hashtags.map((tag: string) => (
                        <Badge key={tag} variant="secondary" className="text-xs font-normal text-blue-600 bg-blue-50 border-0 hover:bg-blue-100">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
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
              </>
            )}
          </div>
        </CardHeader>
        {post.image_url && <img src={post.image_url} className="w-full h-48 object-cover mt-auto" />}
      </Card>

      {/* ISOLATED ALERT DIALOG - Only handles this specific post */}
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
              onClick={() => {
                onDelete(post.id);
                setShowDeleteAlert(false);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}