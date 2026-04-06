import * as React from "react";
import { GraduationCap, Plus } from "lucide-react";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

interface ProfileEducationProps {
  education: any[];
  onAddEducation: () => void;
}

export function ProfileEducation({ education, onAddEducation }: ProfileEducationProps) {
  return (
    <Card className="shadow-sm border-0">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-xl">Education</CardTitle>
        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-muted" onClick={onAddEducation}>
          <Plus className="h-5 w-5 text-muted-foreground" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-6">
        {education.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">No education added yet.</p>
        ) : (
          education.map((edu, i) => (
            <div key={i} className="flex gap-4">
              <div className="bg-muted p-3 rounded-xl h-fit shrink-0"><GraduationCap className="h-6 w-6 text-foreground" /></div>
              <div>
                <h3 className="font-semibold text-lg text-foreground">{edu.school_name}</h3>
                <p className="text-foreground">{edu.degree ? `${edu.degree}, ` : ''}{edu.field_of_study}</p>
                <p className="text-sm text-muted-foreground mt-0.5">{edu.start_year || ''} - {edu.end_year || 'Expected'}</p>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}