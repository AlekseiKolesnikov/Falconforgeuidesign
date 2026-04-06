import * as React from "react";
import { useState } from "react";
import { GraduationCap, Plus, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../ui/dialog";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { supabase } from "../../../lib/supabase"; 

interface ProfileEducationProps {
  education: any[];
  userId: number | undefined;
  onRefresh: () => void;
}

export function ProfileEducation({ education, userId, onRefresh }: ProfileEducationProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({
    school_name: "",
    degree: "",
    field_of_study: "",
    start_year: "",
    end_year: ""
  });

  const openNew = () => {
    setEditingId(null);
    setForm({ school_name: "", degree: "", field_of_study: "", start_year: "", end_year: "" });
    setIsOpen(true);
  };

  const openEdit = (edu: any) => {
    setEditingId(edu.id);
    setForm({
      school_name: edu.school_name || "",
      degree: edu.degree || "",
      field_of_study: edu.field_of_study || "",
      start_year: edu.start_year ? String(edu.start_year) : "",
      end_year: edu.end_year ? String(edu.end_year) : ""
    });
    setIsOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (confirm("Are you sure you want to delete this education entry?")) {
      await supabase.from('education').delete().eq('id', id);
      onRefresh();
    }
  };

  const handleSave = async () => {
    if (!userId || !form.school_name) return;
    setIsSaving(true);
    
    const payload = {
      user_id: userId,
      school_name: form.school_name.trim(),
      degree: form.degree.trim() || null,
      field_of_study: form.field_of_study.trim() || null,
      start_year: form.start_year ? parseInt(form.start_year) : null,
      end_year: form.end_year ? parseInt(form.end_year) : null
    };

    let error;
    if (editingId) {
      const { error: updateError } = await supabase.from('education').update(payload).eq('id', editingId);
      error = updateError;
    } else {
      const { error: insertError } = await supabase.from('education').insert(payload);
      error = insertError;
    }

    setIsSaving(false);
    
    if (error) {
      console.error("Supabase Error:", error);
      alert("Failed to save education: " + error.message);
    } else {
      setIsOpen(false);
      onRefresh(); 
    }
  };

  return (
    <>
      <Card className="shadow-sm border-0">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-xl">Education</CardTitle>
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-muted" onClick={openNew}>
            <Plus className="h-5 w-5 text-muted-foreground" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-6">
          {education.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">No education added yet.</p>
          ) : (
            education.map((edu, i) => (
              <div key={i} className="flex items-start gap-4 group">
                <div className="bg-muted p-3 rounded-xl h-fit shrink-0">
                  <GraduationCap className="h-6 w-6 text-foreground" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg text-foreground">{edu.school_name}</h3>
                  <p className="text-foreground">{edu.degree ? `${edu.degree}, ` : ''}{edu.field_of_study}</p>
                  <p className="text-sm text-muted-foreground mt-0.5">{edu.start_year || ''} - {edu.end_year || 'Expected'}</p>
                </div>

                {/* 3-Dot Edit Menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted focus:outline-none opacity-0 group-hover:opacity-100 transition-opacity">
                    <MoreHorizontal className="h-5 w-5" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-40 z-50">
                    <DropdownMenuItem className="cursor-pointer" onSelect={() => openEdit(edu)}>
                      <Pencil className="mr-2 h-4 w-4" /> Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive cursor-pointer" onSelect={() => handleDelete(edu.id)}>
                      <Trash2 className="mr-2 h-4 w-4" /> Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[500px] rounded-2xl">
          <DialogHeader><DialogTitle>{editingId ? "Edit" : "Add"} Education</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="space-y-2">
              <Label>School *</Label>
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
                <Input type="number" placeholder="e.g. 2022" value={form.start_year} onChange={(e) => setForm({...form, start_year: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>End Year</Label>
                <Input type="number" placeholder="e.g. 2026" value={form.end_year} onChange={(e) => setForm({...form, end_year: e.target.value})} />
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