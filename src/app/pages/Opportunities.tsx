import * as React from "react";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Briefcase, MapPin, ExternalLink, Plus, Building2, Clock } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../contexts/AuthContext";
import { Navigation } from "../components/Navigation";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../components/ui/dialog";
import { Label } from "../components/ui/label";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";

export function Opportunities() {
  const { session } = useAuth();
  const queryClient = useQueryClient();

  // STATES
  const [activeTab, setActiveTab] = useState("All");
  const [selectedJob, setSelectedJob] = useState<any>(null); // For the Details Modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    organization_id: "",
    title: "",
    employment_type: "Internship",
    location: "",
    application_url: "",
    description: ""
  });

  // 1. GET CURRENT USER
  const { data: currentUser } = useQuery({
    queryKey: ['currentUser', session?.user?.id],
    queryFn: async () => {
      if (!session?.user?.id) return null;
      const { data } = await supabase.from('users').select('id').eq('auth_users_uuid', session.user.id).single();
      return data;
    },
    enabled: !!session?.user?.id,
  });

  // 2. CHECK IF USER OWNS ANY ORGANIZATIONS
  const { data: myOrganizations = [] } = useQuery({
    queryKey: ['myOwnedOrganizations', currentUser?.id],
    queryFn: async () => {
      if (!currentUser?.id) return [];
      const { data } = await supabase.from('organizations').select('id, name, logo_url').eq('owner_id', currentUser.id);
      if (data && data.length > 0 && !formData.organization_id) {
        setFormData(prev => ({ ...prev, organization_id: data[0].id.toString() }));
      }
      return data || [];
    },
    enabled: !!currentUser?.id,
  });

  // 3. FETCH ALL OPPORTUNITIES
  const { data: opportunities = [], isLoading } = useQuery({
    queryKey: ['opportunities'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('opportunities')
        .select(`*, organizations (id, name, logo_url)`)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    }
  });

  // 4. CREATE OPPORTUNITY MUTATION
  const createJobMutation = useMutation({
    mutationFn: async () => {
      if (!formData.organization_id || !formData.title) throw new Error("Missing required fields");
      const { error } = await supabase.from('opportunities').insert([{
        organization_id: parseInt(formData.organization_id),
        title: formData.title.trim(),
        employment_type: formData.employment_type,
        location: formData.location.trim() || null,
        application_url: formData.application_url.trim() || null,
        description: formData.description.trim() || null
      }]);
      if (error) throw error;
    },
    onSuccess: () => {
      setIsCreateModalOpen(false);
      setFormData({ ...formData, title: "", location: "", application_url: "", description: "" });
      queryClient.invalidateQueries({ queryKey: ['opportunities'] });
    }
  });

  const timeAgo = (dateString: string) => {
    const days = Math.floor((new Date().getTime() - new Date(dateString).getTime()) / (1000 * 3600 * 24));
    return days === 0 ? "Today" : `${days}d ago`;
  };

  // FILTER LOGIC
  const filteredOpportunities = opportunities.filter((job: any) => {
    if (activeTab === "All") return true;
    return job.employment_type === activeTab;
  });

  return (
    <div className="min-h-screen bg-muted/30 pb-20 lg:pb-0">
      <Navigation />

      <div className="container max-w-5xl mx-auto px-4 py-8">
        
        {/* PAGE HEADER */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Opportunities</h1>
            <p className="text-muted-foreground mt-1">Find your next internship or career move.</p>
          </div>
          
          {myOrganizations.length > 0 && (
            <Button onClick={() => setIsCreateModalOpen(true)} className="rounded-full px-6 gap-2 shadow-sm shrink-0">
              <Plus className="h-5 w-5" />
              Post Opportunity
            </Button>
          )}
        </div>

        {/* FILTER TABS */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
          {["All", "Full-time", "Part-time", "Internship"].map((tab) => (
            <Button 
              key={tab} 
              variant={activeTab === tab ? "default" : "outline"}
              className="rounded-full px-6 whitespace-nowrap shadow-sm"
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </Button>
          ))}
        </div>

        {/* JOB BOARD GRID */}
        {isLoading ? (
          <div className="text-center py-20 text-muted-foreground">Loading opportunities...</div>
        ) : filteredOpportunities.length === 0 ? (
          <div className="text-center py-20 bg-card rounded-2xl border border-border shadow-sm text-muted-foreground">
            No {activeTab !== "All" ? activeTab.toLowerCase() : ""} opportunities posted yet. Check back soon!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredOpportunities.map((job: any) => (
              <Card key={job.id} className="overflow-hidden shadow-sm border border-border hover:shadow-md transition-shadow flex flex-col h-full">
                <CardContent className="p-5 flex flex-col h-full">
                  <div className="flex justify-between items-start mb-4 gap-3">
                    <Avatar className="h-12 w-12 border bg-white rounded-lg">
                      <AvatarImage src={job.organizations?.logo_url} className="object-contain p-1" />
                      <AvatarFallback className="rounded-lg bg-primary/10 text-primary">
                        <Building2 className="h-6 w-6" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="text-xs text-muted-foreground flex items-center gap-1 shrink-0 bg-muted px-2 py-1 rounded-md">
                      <Clock className="h-3 w-3" /> {timeAgo(job.created_at)}
                    </div>
                  </div>

                  <h3 className="font-bold text-lg text-foreground line-clamp-2 mb-1">{job.title}</h3>
                  <p className="font-medium text-primary text-sm mb-3">{job.organizations?.name}</p>

                  <div className="space-y-2 text-sm text-muted-foreground mb-4">
                    {job.location && (
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 shrink-0" />
                        <span className="truncate">{job.location}</span>
                      </div>
                    )}
                    {job.employment_type && (
                      <div className="flex items-center gap-2">
                        <Briefcase className="h-4 w-4 shrink-0" />
                        <span>{job.employment_type}</span>
                      </div>
                    )}
                  </div>

                  <div className="mt-auto pt-4 flex gap-2">
                    <Button className="w-full rounded-full" variant="secondary" onClick={() => setSelectedJob(job)}>
                      View Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* VIEW DETAILS MODAL */}
      <Dialog open={!!selectedJob} onOpenChange={(isOpen) => !isOpen && setSelectedJob(null)}>
        {selectedJob && (
          <DialogContent className="sm:max-w-[600px] rounded-2xl max-h-[85vh] overflow-y-auto flex flex-col">
            <DialogHeader className="flex flex-row items-start gap-4 pb-4 border-b">
              <Avatar className="h-16 w-16 border bg-white rounded-lg shrink-0">
                <AvatarImage src={selectedJob.organizations?.logo_url} className="object-contain p-1" />
                <AvatarFallback className="rounded-lg bg-primary/10 text-primary"><Building2 className="h-8 w-8" /></AvatarFallback>
              </Avatar>
              <div>
                <DialogTitle className="text-2xl font-bold">{selectedJob.title}</DialogTitle>
                <p className="text-primary font-medium mt-1">{selectedJob.organizations?.name}</p>
                <div className="flex flex-wrap gap-3 text-sm text-muted-foreground mt-2">
                  {selectedJob.location && <span className="flex items-center gap-1"><MapPin className="h-4 w-4" />{selectedJob.location}</span>}
                  {selectedJob.employment_type && <span className="flex items-center gap-1"><Briefcase className="h-4 w-4" />{selectedJob.employment_type}</span>}
                  <span className="flex items-center gap-1"><Clock className="h-4 w-4" />Posted {timeAgo(selectedJob.created_at)}</span>
                </div>
              </div>
            </DialogHeader>
            
            <div className="py-4 flex-1">
              <h4 className="font-semibold text-lg mb-2">About the role</h4>
              <p className="text-foreground whitespace-pre-wrap leading-relaxed">
                {selectedJob.description || "No description provided."}
              </p>
            </div>

            <DialogFooter className="border-t pt-4 mt-auto">
              {selectedJob.application_url && (
                <Button className="w-full sm:w-auto rounded-full px-8 gap-2" asChild>
                  <a href={selectedJob.application_url.startsWith('http') ? selectedJob.application_url : `https://${selectedJob.application_url}`} target="_blank" rel="noopener noreferrer">
                    Apply Now <ExternalLink className="h-4 w-4" />
                  </a>
                </Button>
              )}
              <Button variant="outline" className="w-full sm:w-auto rounded-full" onClick={() => setSelectedJob(null)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>

      {/* CREATE OPPORTUNITY MODAL (Kept exactly the same as you had it) */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="sm:max-w-[550px] rounded-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="text-xl">Post an Opportunity</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4">
            {myOrganizations.length > 1 && (
              <div className="space-y-2">
                <Label>Posting as <span className="text-destructive">*</span></Label>
                <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={formData.organization_id} onChange={(e) => setFormData({...formData, organization_id: e.target.value})}>
                  {myOrganizations.map((org: any) => <option key={org.id} value={org.id}>{org.name}</option>)}
                </select>
              </div>
            )}
            <div className="space-y-2">
              <Label>Job Title <span className="text-destructive">*</span></Label>
              <Input placeholder="e.g. Graphic Design Intern" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Employment Type</Label>
                <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={formData.employment_type} onChange={(e) => setFormData({...formData, employment_type: e.target.value})}>
                  <option value="Internship">Internship</option>
                  <option value="Full-time">Full-time</option>
                  <option value="Part-time">Part-time</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>Location</Label>
                <Input placeholder="e.g. Remote, or Montevallo, AL" value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Application Link (External URL)</Label>
              <Input placeholder="https://..." value={formData.application_url} onChange={(e) => setFormData({ ...formData, application_url: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea placeholder="Briefly describe the role and requirements..." className="min-h-[100px]" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" className="rounded-full px-6" onClick={() => setIsCreateModalOpen(false)}>Cancel</Button>
            <Button className="rounded-full px-8 font-semibold" onClick={() => createJobMutation.mutate()} disabled={!formData.title.trim() || !formData.organization_id || createJobMutation.isPending}>{createJobMutation.isPending ? "Posting..." : "Post Job"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}