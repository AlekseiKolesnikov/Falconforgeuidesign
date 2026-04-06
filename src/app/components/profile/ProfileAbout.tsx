import * as React from "react";
import { Pencil, Plus, TrendingUp } from "lucide-react";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

interface ProfileAboutProps {
  bio: string;
  skills: any[];
  onEditProfile: () => void;
  onAddSkill: () => void;
}

export function ProfileAbout({ bio, skills, onEditProfile, onAddSkill }: ProfileAboutProps) {
  return (
    <Card className="shadow-sm border-0">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-xl">About</CardTitle>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onEditProfile}>
          <Pencil className="h-4 w-4 text-muted-foreground" />
        </Button>
      </CardHeader>
      <CardContent>
        <p className="text-foreground leading-relaxed whitespace-pre-wrap">{bio || "No bio added yet."}</p>

        <div className="mt-8 border-t pt-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-foreground flex items-center gap-2 text-lg">
              <TrendingUp className="h-5 w-5" /> Top Skills
            </h3>
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-muted" onClick={onAddSkill}>
              <Plus className="h-5 w-5 text-muted-foreground" />
            </Button>
          </div>
          
          {skills.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {skills.map((skill, i) => (
                <Badge key={i} variant="secondary" className="px-3 py-1.5 text-sm bg-muted hover:bg-muted/80 font-medium">
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