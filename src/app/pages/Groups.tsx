import * as React from "react";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { Building2, Plus, MapPin } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { Navigation } from "../components/Navigation";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../components/ui/dialog";
import { Label } from "../components/ui/label";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";

const FALLBACK_BANNER = "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=2070&auto=format&fit=crop";

export function Groups() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  
  // Form state for new organization
  const [formData, setFormData] = useState({
    name: "",
    industry: "",
    location: "",
    about: "",
    website_url: ""
  });

  // 1. FETCH ALL ORGANIZATIONS
  const { data: organizations = [], isLoading } = useQuery({
    queryKey: ['organizations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    }
  });

  // 2. CREATE ORGANIZATION MUTATION
  const createOrgMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase
        .from('organizations')
        .insert([
          {
            name: formData.name.trim(),
            industry: formData.industry.trim() || null,
            location: formData.location.trim() || null,
            about: formData.about.trim() || null,
            website_url: formData.website_url.trim() || null
          }
        ])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (newOrg) => {
      setIsCreateModalOpen(false);
      setFormData({ name: "", industry: "", location: "", about: "", website_url: "" });
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
      
      // Navigate immediately to the new group's page!
      navigate(`/organization/${newOrg.id}`);
    },
    onError: (error: any) => {
      alert(`Failed to create group: ${error.message}`);
    }
  });

  const handleCreate = () => {
    if (!formData.name) return;
    createOrgMutation.mutate();
  };

  return (
    <div className="min-h-screen bg-muted/30 pb-20 lg:pb-0">
      <Navigation />

      <div className="container max-w-5xl mx-auto px-4 py-8">
        
        {/* PAGE HEADER */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Groups & Organizations</h1>
            <p className="text-muted-foreground mt-1">Discover communities and companies on Falcon Forge.</p>
          </div>
          <Button onClick={() => setIsCreateModalOpen(true)} className="rounded-full px-6 gap-2 shadow-sm">
            <Plus className="h-5 w-5" />
            Create Group
          </Button>
        </div>

        {/* ORGANIZATIONS GRID */}
        {isLoading ? (
          <div className="text-center py-20 text-muted-foreground">Loading groups...</div>
        ) : organizations.length === 0 ? (
          <div className="text-center py-20 bg-card rounded-2xl border border-border shadow-sm text-muted-foreground">
            No groups found. Be the first to create one!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {organizations.map((org: any) => (
              <Card key={org.id} className="overflow-hidden shadow-sm border border-border hover:shadow-md transition-shadow group">
                <Link to={`/organization/${org.id}`}>
                  {/* Banner */}
                  <div className="h-24 bg-muted relative overflow-hidden">
                    <img 
                      src={org.banner_url || FALLBACK_BANNER} 
                      alt="Banner" 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                    />
                  </div>
                  
                  {/* Content */}
                  <CardContent className="pt-0 pb-5 px-5 relative">
                    <Avatar className="h-16 w-16 border-4 border-card shadow-sm -mt-8 mb-3 bg-white rounded-lg">
                      <AvatarImage src={org.logo_url} className="object-contain p-1" />
                      <AvatarFallback className="bg-primary/10 text-primary rounded-lg">
                        <Building2 className="h-8 w-8" />
                      </AvatarFallback>
                    </Avatar>
                    
                    <h3 className="font-bold text-lg text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                      {org.name}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-0.5 line-clamp-1">
                      {org.industry || "Organization"}
                    </p>
                    
                    {org.location && (
                      <div className="flex items-center gap-1 mt-3 text-xs text-muted-foreground">
                        <MapPin className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">{org.location}</span>
                      </div>
                    )}
                  </CardContent>
                </Link>
              </Card>
            ))}
          </div>
        )}

      </div>

      {/* CREATE GROUP MODAL */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="sm:max-w-[550px] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl">Create a New Group</DialogTitle>
          </DialogHeader>
          
          <div className="grid gap-5 py-4">
            <div className="space-y-2">
              <Label>Organization Name <span className="text-destructive">*</span></Label>
              <Input 
                placeholder="e.g. Montevallo Swim Club" 
                value={formData.name} 
                onChange={(e) => setFormData({ ...formData, name: e.target.value })} 
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Industry / Category</Label>
                <Input 
                  placeholder="e.g. Athletics" 
                  value={formData.industry} 
                  onChange={(e) => setFormData({ ...formData, industry: e.target.value })} 
                />
              </div>
              <div className="space-y-2">
                <Label>Location</Label>
                <Input 
                  placeholder="e.g. Montevallo, AL" 
                  value={formData.location} 
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })} 
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Website URL</Label>
              <Input 
                placeholder="https://..." 
                value={formData.website_url} 
                onChange={(e) => setFormData({ ...formData, website_url: e.target.value })} 
              />
            </div>

            <div className="space-y-2">
              <Label>About</Label>
              <Textarea 
                placeholder="What is this group about?" 
                className="min-h-[100px]" 
                value={formData.about} 
                onChange={(e) => setFormData({ ...formData, about: e.target.value })} 
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" className="rounded-full px-6" onClick={() => setIsCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button 
              className="rounded-full px-8 font-semibold" 
              onClick={handleCreate} 
              disabled={!formData.name.trim() || createOrgMutation.isPending}
            >
              {createOrgMutation.isPending ? "Creating..." : "Create Group"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}