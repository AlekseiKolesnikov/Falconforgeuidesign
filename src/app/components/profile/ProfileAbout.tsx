import * as React from "react";
import { Pencil } from "lucide-react";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

interface ProfileAboutProps {
  bio: string;
  skills: any[];
  onEditProfile: () => void;
  isOwner: boolean;
}

// FIXED: Added isOwner right here in the curly braces!
export function ProfileAbout({ bio, skills, onEditProfile, isOwner }: ProfileAboutProps) {
  return (
    <Card className="shadow-sm border-0">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-xl">About</CardTitle>
        {isOwner && (
          <Button variant="ghost" size="icon" onClick={onEditProfile}>
            <Pencil className="h-4 w-4 text-muted-foreground" />
          </Button>
        )}
      </CardHeader>
      <CardContent>
        <p className="text-foreground leading-relaxed whitespace-pre-wrap">{bio || "No bio added yet."}</p>

        <div className="mt-8 border-t pt-6">
          <h3 className="font-semibold text-foreground text-lg mb-4">
            Top Skills
          </h3>

          {skills.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {skills.map((skill, i) => (
                <Badge key={skill.id || i} variant="secondary" className="px-3 py-1.5 text-sm bg-muted hover:bg-muted/80 font-medium">
                  {skill.name}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No skills added yet.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}