import * as React from "react";
import { useState } from "react";
import { Briefcase, Plus } from "lucide-react";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../ui/dialog";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { supabase } from "../../../lib/supabase"; // Adjust path if needed

interface ProfileExperienceProps {
  experiences: any[];
  userId: number | undefined;
  onRefresh: () => void;
}

export function ProfileExperience({ experiences, userId, onRefresh }: ProfileExperienceProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState({
    title: "",
    organization_name: "",
    location: "",
    start_date: "",
    end_date: "",
    description: ""
  });

  const handleSave = async () => {
    if (!userId || !form.title || !form.organization_name) return;
    setIsSaving(true);
    
    const { error } = await supabase.from('experiences').insert({
      user_id: userId,
      ...form,
      is_current: !form.end_date // Automatically true if no end date provided
    });

    setIsSaving(false);
    
    if (!error) {
      setIsOpen(false);
      setForm({ title: "", organization_name: "", location: "", start_date: "", end_date: "", description: "" });
      onRefresh(); // Tells the main profile page to fetch the new data
    }
  };

  return (
    <>
      <Card className="shadow-sm border-0">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-xl">Experience</CardTitle>
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-muted" onClick={() => setIsOpen(true)}>
            <Plus className="h-5 w-5 text-muted-foreground" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-6">
          {experiences.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">No experience added yet.</p>
          ) : (
            experiences.map((exp, i) => (
              <div key={i} className="flex gap-4">
                <div className="bg-primary/10 p-3 rounded-xl h-fit shrink-0">
                  <Briefcase className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg text-foreground">{exp.title}</h3>
                  <p className="text-foreground font-medium">{exp.organization_name}</p>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {exp.start_date} - {exp.is_current || !exp.end_date ? 'Present' : exp.end_date} {exp.location && `• ${exp.location}`}
                  </p>
                  {exp.description && (
                    <p className="text-foreground text-sm mt-2.5 whitespace-pre-wrap leading-relaxed">{exp.description}</p>
                  )}
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* ISOLATED ADD EXPERIENCE MODAL */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[550px] rounded-2xl">
          <DialogHeader><DialogTitle>Add Experience</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input placeholder="e.g. Software Engineer" value={form.title} onChange={(e) => setForm({...form, title: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>Company Name</Label>
              <Input placeholder="e.g. Google" value={form.organization_name} onChange={(e) => setForm({...form, organization_name: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>Location</Label>
              <Input placeholder="e.g. New York, NY" value={form.location} onChange={(e) => setForm({...form, location: e.target.value})} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Date</Label>
                <Input placeholder="e.g. Jan 2023" value={form.start_date} onChange={(e) => setForm({...form, start_date: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>End Date</Label>
                <Input placeholder="e.g. Present (or leave blank)" value={form.end_date} onChange={(e) => setForm({...form, end_date: e.target.value})} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea className="min-h-[100px]" placeholder="What did you do?" value={form.description} onChange={(e) => setForm({...form, description: e.target.value})} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" className="rounded-full" onClick={() => setIsOpen(false)}>Cancel</Button>
            <Button className="rounded-full px-6" onClick={handleSave} disabled={isSaving || !form.title || !form.organization_name}>
              {isSaving ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}