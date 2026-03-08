import React, { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { Navigation } from "../components/Navigation";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Separator } from "../components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import {
  MapPin,
  Mail,
  Calendar,
  Link as LinkIcon,
  Edit,
  Briefcase,
  GraduationCap,
  Award,
  TrendingUp,
  Users,
  MessageCircle,
  Share2,
  MoreHorizontal,
} from "lucide-react";

// --- INTERFACES ---
interface ProfileData {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  headline?: string;
  bio?: string;
  major?: string;
  graduation_year?: number;
  profile_photo_url?: string;
  university_id?: number;
  user_type: string;
  is_verified: boolean;
  role?: string;
  swimmer?: boolean;
  avatar?: string;
  created_at?: string;
}

interface Education { school_name: string; degree?: string; field_of_study?: string; start_year?: number; end_year?: number; description?: string; }
interface Experience { organization_name: string; title: string; location?: string; start_date: string; end_date?: string | null; is_current: boolean; description?: string; }
interface Skill { name: string; proficiency_level?: string; }

// --- MOCK FALLBACKS (For UI elements not yet in your DB schema) ---
const FALLBACK_COVER = "https://images.unsplash.com/photo-1759889392274-246af1a984ba?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx1bml2ZXJzaXR5JTIwY2FtcHVzJTIwcHVycGxlJTIwYnVpbGRpbmd8ZW58MXx8fHwxNzczMDAwMjgyfDA&ixlib=rb-4.1.0&q=80&w=1080";

const recentActivity = [
  { type: "post", title: "Shared insights from the Marketing Summit 2024", time: "2 days ago" },
  { type: "connection", title: "Connected with Jennifer Adams from Birmingham Chamber of Commerce", time: "5 days ago" },
];

export function Profile() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [education, setEducation] = useState<Education[]>([]);
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [university, setUniversity] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user authenticated");

      // 1. User data
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("id, first_name, last_name, headline, bio, major, graduation_year, profile_photo_url, university_id, user_type, is_verified, email, created_at")
        .eq("auth_users_uuid", user.id)
        .single();

      if (userError || !userData) throw new Error("User data not found");

      // 2. Profile
      const { data: profileData } = await supabase
        .from("profiles")
        .select("role, swimmer, avatar")
        .eq("email", userData.email)
        .maybeSingle();

      const fullProfile: ProfileData = {
        ...userData,
        role: profileData?.role || "Student",
        swimmer: profileData?.swimmer || false,
        avatar: profileData?.avatar || "",
      };

      // 3. Education
      const { data: eduData } = await supabase.from("education").select("*").eq("user_id", userData.id);

      // 4. Experiences
      const { data: expData } = await supabase
        .from("experiences")
        .select("*")
        .eq("user_id", userData.id)
        .order("end_date", { ascending: false, nullsFirst: true });

      // 5. Skills
      const { data: skillsData } = await supabase
        .from("user_skills")
        .select("proficiency_level, skills(name)")
        .eq("user_id", userData.id);

      // 6. University
      let uniName = "";
      if (userData.university_id) {
        const { data: uniData } = await supabase
          .from("universities")
          .select("name")
          .eq("id", userData.university_id)
          .single();
        uniName = uniData?.name || "";
      }

      setProfile(fullProfile);
      setEducation(eduData || []);
      setExperiences(expData || []);

      // @ts-ignore
      const mappedSkills = skillsData?.map((s: any) => ({
        name: s.skills?.name,
        proficiency_level: s.proficiency_level,
      })) || [];

      setSkills(mappedSkills);
      setUniversity(uniName);
    } catch (error) {
      console.error("Profile error:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/30">
        <div className="animate-pulse text-xl text-muted-foreground">Loading profile...</div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/30">
        <div className="text-xl text-muted-foreground">Profile not found</div>
      </div>
    );
  }

  // Format Join Date
  const joinedDate = profile.created_at 
    ? new Date(profile.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : "Recently";

  return (
    <div className="min-h-screen bg-muted/30 pb-20 lg:pb-0">
      <Navigation />

      <div className="container max-w-6xl mx-auto px-4 py-6">
        {/* Cover Image & Profile Header */}
        <Card className="overflow-hidden shadow-lg border-0">
          {/* Cover Image with Overlay */}
          <div className="h-60 relative">
            <img
              src={FALLBACK_COVER}
              alt="Cover"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-primary/20 via-primary/40 to-primary/60" />
            
            <Button variant="secondary" size="sm" className="absolute top-4 right-4 gap-2">
              <Edit className="h-4 w-4" />
              Edit Cover
            </Button>
          </div>

          {/* Profile Info */}
          <CardContent className="relative pt-0 pb-8 bg-card">
            <div className="flex flex-col lg:flex-row lg:items-end gap-6">
              {/* Avatar */}
              <div className="-mt-20 relative">
                <Avatar className="h-40 w-40 border-4 border-background shadow-xl bg-white">
                  <AvatarImage src={profile.avatar || profile.profile_photo_url} alt={profile.first_name} className="object-cover" />
                  <AvatarFallback className="bg-primary text-primary-foreground text-4xl">
                    {profile.first_name[0]}{profile.last_name[0]}
                  </AvatarFallback>
                </Avatar>
                <Button size="icon" variant="secondary" className="absolute bottom-2 right-2 h-8 w-8 rounded-full shadow-md">
                  <Edit className="h-4 w-4" />
                </Button>
              </div>

              {/* Name & Title */}
              <div className="flex-1 lg:pb-4">
                <div className="space-y-2">
                  <div>
                    <h1 className="text-4xl font-bold text-foreground flex items-center gap-2">
                      {profile.first_name} {profile.last_name}
                      {profile.is_verified && <span className="text-blue-500 text-2xl" title="Verified">✅</span>}
                    </h1>
                    <p className="text-xl text-muted-foreground mt-1">
                      {profile.headline || `${profile.major || "Student"} ${profile.graduation_year ? `'${String(profile.graduation_year).slice(-2)}` : ''}`}
                    </p>
                  </div>
                  
                  {/* Quick Info */}
                  <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="h-4 w-4" />
                      <span>{university || "Montevallo, Alabama"}</span>
                    </div>
                    {profile.swimmer && (
                      <div className="flex items-center gap-1.5 text-blue-600 font-medium">
                        <span>🏊 UM Swim Team</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3 lg:pb-4">
                <Button className="gap-2" size="lg">
                  <MessageCircle className="h-4 w-4" />
                  Message
                </Button>
                <Button variant="outline" className="gap-2" size="lg">
                  <Users className="h-4 w-4" />
                  Connect
                </Button>
                <Button variant="outline" size="lg">
                  <Share2 className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="lg">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <Separator className="my-6" />

            {/* Stats Cards */}
            <div className="grid grid-cols-3 gap-4">
              <Card className="bg-accent/50 border-accent">
                <CardContent className="p-4 text-center">
                  <p className="text-3xl font-bold text-accent-foreground">0</p>
                  <p className="text-sm text-muted-foreground mt-1">Connections</p>
                </CardContent>
              </Card>
              <Card className="bg-primary/5 border-primary/20">
                <CardContent className="p-4 text-center">
                  <p className="text-3xl font-bold text-primary">0</p>
                  <p className="text-sm text-muted-foreground mt-1">Posts</p>
                </CardContent>
              </Card>
              <Card className="bg-secondary/10 border-secondary/30">
                <CardContent className="p-4 text-center">
                  <p className="text-3xl font-bold text-secondary-foreground">{skills.length}</p>
                  <p className="text-sm text-muted-foreground mt-1">Skills</p>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-3 gap-6 mt-6">
          {/* Left Column - About & Contact */}
          <div className="lg:col-span-1 space-y-6">
            
            {/* About Card */}
            <Card className="shadow-md border-0">
              <CardHeader>
                <CardTitle>About</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-foreground leading-relaxed whitespace-pre-wrap">
                  {profile.bio || "No bio added yet. Tell people about yourself!"}
                </p>
                
                <Separator />
                
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <Mail className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <p className="text-xs text-muted-foreground">Email</p>
                      <p className="text-sm font-medium">{profile.email}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Calendar className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <p className="text-xs text-muted-foreground">Joined</p>
                      <p className="text-sm font-medium">{joinedDate}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity Card (Mock Data) */}
            <Card className="shadow-md border-0">
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentActivity.map((activity, i) => (
                    <div key={i} className="flex gap-3">
                      <div className={`h-2 w-2 rounded-full mt-2 ${
                        activity.type === 'post' ? 'bg-primary' : 'bg-secondary'
                      }`} />
                      <div className="flex-1">
                        <p className="text-sm">{activity.title}</p>
                        <p className="text-xs text-muted-foreground mt-1">{activity.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Main Content Tabs */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="experience" className="space-y-6">
              <TabsList className="w-full grid grid-cols-3 h-auto p-1 bg-card border shadow-sm">
                <TabsTrigger value="experience" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  Experience
                </TabsTrigger>
                <TabsTrigger value="education" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  Education
                </TabsTrigger>
                <TabsTrigger value="skills" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  Skills
                </TabsTrigger>
              </TabsList>

              {/* Experience Tab */}
              <TabsContent value="experience" className="space-y-4">
                {experiences.length === 0 ? (
                   <Card className="shadow-md border-0"><CardContent className="p-8 text-center text-muted-foreground">No experience added yet.</CardContent></Card>
                ) : (
                  experiences.map((exp, i) => (
                    <Card key={i} className="shadow-md hover:shadow-lg transition-shadow border-0">
                      <CardContent className="p-6">
                        <div className="flex gap-4">
                          <div className="bg-primary/10 p-3 rounded-xl h-fit">
                            <Briefcase className="h-6 w-6 text-primary" />
                          </div>
                          <div className="flex-1 space-y-2">
                            <div>
                              <h3 className="font-semibold text-lg">{exp.title}</h3>
                              <p className="text-primary font-medium">{exp.organization_name}</p>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                                <span>{exp.start_date} - {exp.is_current ? 'Present' : exp.end_date}</span>
                                {exp.location && (
                                  <>
                                    <span>•</span>
                                    <span className="flex items-center gap-1">
                                      <MapPin className="h-3 w-3" />
                                      {exp.location}
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>
                            {exp.description && (
                              <p className="text-foreground leading-relaxed mt-2 whitespace-pre-wrap">{exp.description}</p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </TabsContent>

              {/* Education Tab */}
              <TabsContent value="education" className="space-y-4">
                {education.length === 0 ? (
                   <Card className="shadow-md border-0"><CardContent className="p-8 text-center text-muted-foreground">No education added yet.</CardContent></Card>
                ) : (
                  education.map((edu, i) => (
                    <Card key={i} className="shadow-md border-0">
                      <CardContent className="p-6">
                        <div className="flex gap-4">
                          <div className="bg-primary p-3 rounded-xl h-fit">
                            <GraduationCap className="h-7 w-7 text-primary-foreground" />
                          </div>
                          <div className="flex-1 space-y-3">
                            <div>
                              <h3 className="font-semibold text-lg">{edu.degree ? `${edu.degree} in ${edu.field_of_study}` : edu.field_of_study}</h3>
                              <p className="text-primary font-medium">{edu.school_name}</p>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                                <span>{edu.start_year || ''} {edu.start_year && edu.end_year ? '-' : ''} {edu.end_year || ''}</span>
                              </div>
                            </div>
                            
                            {edu.description && (
                              <>
                                <Separator />
                                <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{edu.description}</p>
                              </>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </TabsContent>

              {/* Skills Tab */}
              <TabsContent value="skills" className="space-y-4">
                <Card className="shadow-md border-0">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-primary" />
                      Skills & Expertise
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {skills.length === 0 ? (
                      <p className="text-muted-foreground text-center py-4">No skills added yet.</p>
                    ) : (
                      <div className="grid gap-4">
                        {skills.map((skill, i) => (
                          <div key={i} className="space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <span className="font-medium">{skill.name}</span>
                                {skill.proficiency_level && (
                                  <Badge 
                                    variant={
                                      skill.proficiency_level.toLowerCase() === "advanced" || skill.proficiency_level.toLowerCase() === "expert" ? "default" :
                                      skill.proficiency_level.toLowerCase() === "intermediate" ? "secondary" :
                                      "outline"
                                    }
                                    className="text-xs"
                                  >
                                    {skill.proficiency_level}
                                  </Badge>
                                )}
                              </div>
                            </div>
                            {/* Visual Progress Bar based on level */}
                            <div className="h-2 bg-muted rounded-full overflow-hidden">
                              <div 
                                className={`h-full bg-primary/70`}
                                style={{ 
                                  width: (skill.proficiency_level?.toLowerCase() === "advanced" || skill.proficiency_level?.toLowerCase() === "expert") ? "100%" :
                                         (skill.proficiency_level?.toLowerCase() === "intermediate") ? "70%" : "40%" 
                                }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}