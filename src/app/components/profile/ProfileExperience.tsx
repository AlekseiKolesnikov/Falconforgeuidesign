import * as React from "react";
import { Briefcase, Plus } from "lucide-react";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

interface ProfileExperienceProps {
  experiences: any[];
  onAddExperience: () => void;
}

export function ProfileExperience({ experiences, onAddExperience }: ProfileExperienceProps) {
  return (
    <Card className="shadow-sm border-0">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-xl">Experience</CardTitle>
        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-muted" onClick={onAddExperience}>
          <Plus className="h-5 w-5 text-muted-foreground" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-6">
        {experiences.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">No experience added yet.</p>
        ) : (
          experiences.map((exp, i) => (
            <div key={i} className="flex gap-4">
              <div className="bg-primary/10 p-3 rounded-xl h-fit shrink-0"><Briefcase className="h-6 w-6 text-primary" /></div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg text-foreground">{exp.title}</h3>
                <p className="text-foreground font-medium">{exp.organization_name}</p>
                <p className="text-sm text-muted-foreground mt-0.5">{exp.start_date} - {exp.is_current || !exp.end_date ? 'Present' : exp.end_date} {exp.location && `• ${exp.location}`}</p>
                {exp.description && <p className="text-foreground text-sm mt-2.5 whitespace-pre-wrap leading-relaxed">{exp.description}</p>}
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}