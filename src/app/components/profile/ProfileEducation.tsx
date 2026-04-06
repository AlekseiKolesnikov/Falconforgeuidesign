import * as React from "react";
import { useState } from "react";
import { GraduationCap, Plus } from "lucide-react";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../ui/dialog";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { supabase } from "../../../lib/supabase"; // Adjust path if needed

interface ProfileEducationProps {
  education: any[];
  userId: number | undefined;
  onRefresh: () => void;
}

export function ProfileEducation({ education, userId, onRefresh }: ProfileEducationProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState({
    school_name: "",
    degree: "",
    field_of_study: "",
    start_year: "",
    end_year: ""
  });

  const handleSave = async () => {
    if (!userId || !form.school_name) return;
    setIsSaving(true);
    
    const { error } = await supabase.from('education').insert({
      user_id: userId,
      ...form
    });

    setIsSaving(false);
    
    if (!error) {
      setIsOpen(false);
      setForm({ school_name: "", degree: "", field_of_study: "", start_year: "", end_year: "" });
      onRefresh(); // Refresh profile data
    }
  };

  return (
    <>
      <Card className="shadow-sm border-0">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-xl">Education</CardTitle>
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-muted" onClick={() => setIsOpen(true)}>
            <Plus className="h-5 w-5 text-muted-foreground" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-6">
          {education.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">No education added yet.</p>
          ) : (
            education.map((edu, i) => (
              <div key={i} className="flex gap-4">
                <div className="bg-muted p-3 rounded-xl h-fit shrink-0">
                  <GraduationCap className="h-6 w-6 text-foreground" />
                </div>
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

      {/* ISOLATED ADD EDUCATION MODAL */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[500px] rounded-2xl">
          <DialogHeader><DialogTitle>Add Education</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="space-y-2">
              <Label>School</Label>
              <Input placeholder="e.g. University of Montevallo" value={form.school_name} onChange={(e) => setForm({...form, school_name: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>Degree</Label>
              <Input placeholder="e.g. Bachelor's" value={form.degree} onChange={(e) => setForm({...form, degree: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>Field of Study</Label>
              <Input placeholder="e.g. Business Management" value={form.field_of_study} onChange={(e) => setForm({...form, field_of_study: e.target.value})} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Year</Label>
                <Input placeholder="e.g. 2022" value={form.start_year} onChange={(e) => setForm({...form, start_year: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>End Year</Label>
                <Input placeholder="e.g. 2026" value={form.end_year} onChange={(e) => setForm({...form, end_year: e.target.value})} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" className="rounded-full" onClick={() => setIsOpen(false)}>Cancel</Button>
            <Button className="rounded-full px-6" onClick={handleSave} disabled={isSaving || !form.school_name}>
              {isSaving ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}