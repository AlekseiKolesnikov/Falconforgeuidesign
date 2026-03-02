import { Navigation } from "@/app/components/Navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/app/components/ui/avatar";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";
import { Separator } from "@/app/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs";
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
} from "lucide-react";

const mockProfile = {
  name: "John Doe",
  role: "Computer Science '25",
  location: "Montevallo, Alabama",
  email: "john.doe@montevallo.edu",
  joinedDate: "August 2022",
  bio: "Passionate software developer and tech enthusiast. Currently exploring AI/ML and web development. Looking for summer 2025 internship opportunities.",
  website: "johndoe.dev",
  avatar: "https://images.unsplash.com/photo-1600178572204-6ac8886aae63?w=400",
  coverImage: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=1200",
  stats: {
    connections: 247,
    posts: 42,
    skills: 12,
  },
};

const skills = [
  { name: "React", level: "Advanced" },
  { name: "TypeScript", level: "Advanced" },
  { name: "Python", level: "Intermediate" },
  { name: "Node.js", level: "Intermediate" },
  { name: "SQL", level: "Intermediate" },
  { name: "Git", level: "Advanced" },
  { name: "Tailwind CSS", level: "Advanced" },
  { name: "Machine Learning", level: "Beginner" },
];

const experience = [
  {
    title: "Software Engineering Intern",
    company: "Tech Solutions Inc.",
    period: "Summer 2024",
    description: "Developed and maintained React-based web applications. Collaborated with cross-functional teams to deliver high-quality software solutions.",
  },
  {
    title: "Web Developer",
    company: "UM Student Organizations",
    period: "Jan 2023 - Present",
    description: "Building and maintaining websites for various student organizations on campus.",
  },
];

const education = [
  {
    degree: "Bachelor of Science in Computer Science",
    institution: "University of Montevallo",
    period: "2022 - 2025",
    gpa: "3.8",
    achievements: ["Dean's List", "CS Department Scholarship Recipient"],
  },
];

const achievements = [
  {
    title: "Hackathon Winner",
    organization: "Alabama College Hackathon 2024",
    date: "March 2024",
    description: "1st Place - Built an AI-powered study assistant",
  },
  {
    title: "Research Paper Published",
    organization: "UM Computer Science Department",
    date: "December 2023",
    description: "Co-authored paper on machine learning applications in education",
  },
  {
    title: "Student Leadership Award",
    organization: "University of Montevallo",
    date: "May 2023",
    description: "Recognized for outstanding leadership in CS Student Association",
  },
];

export function Profile() {
  return (
    <div className="min-h-screen bg-muted/30 pb-20 lg:pb-0">
      <Navigation />

      <div className="container max-w-5xl mx-auto px-4 py-6">
        {/* Cover Image & Profile Header */}
        <Card className="overflow-hidden">
          {/* Cover Image */}
          <div className="h-48 bg-gradient-to-r from-primary via-primary/90 to-primary/80 relative">
            <img
              src={mockProfile.coverImage}
              alt="Cover"
              className="w-full h-full object-cover opacity-20"
            />
          </div>

          {/* Profile Info */}
          <CardContent className="relative pt-0 pb-6">
            {/* Avatar */}
            <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4 -mt-16 sm:-mt-12">
              <Avatar className="h-32 w-32 border-4 border-background">
                <AvatarImage src={mockProfile.avatar} alt={mockProfile.name} />
                <AvatarFallback className="bg-primary text-primary-foreground text-3xl">
                  {mockProfile.name.split(" ").map(n => n[0]).join("")}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 pt-4 sm:pt-0">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <h1 className="text-3xl font-bold">{mockProfile.name}</h1>
                    <p className="text-lg text-muted-foreground">{mockProfile.role}</p>
                  </div>
                  <Button className="gap-2 self-start sm:self-auto">
                    <Edit className="h-4 w-4" />
                    Edit Profile
                  </Button>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="flex gap-6 mt-6 pt-6 border-t">
              <div className="text-center">
                <p className="text-2xl font-bold text-primary">{mockProfile.stats.connections}</p>
                <p className="text-sm text-muted-foreground">Connections</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-primary">{mockProfile.stats.posts}</p>
                <p className="text-sm text-muted-foreground">Posts</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-primary">{mockProfile.stats.skills}</p>
                <p className="text-sm text-muted-foreground">Skills</p>
              </div>
            </div>

            {/* Contact Info */}
            <div className="grid sm:grid-cols-2 gap-3 mt-6">
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span>{mockProfile.location}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span>{mockProfile.email}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>Joined {mockProfile.joinedDate}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <LinkIcon className="h-4 w-4 text-muted-foreground" />
                <a href={`https://${mockProfile.website}`} className="text-primary hover:underline">
                  {mockProfile.website}
                </a>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs Section */}
        <Tabs defaultValue="about" className="mt-6">
          <TabsList className="w-full justify-start">
            <TabsTrigger value="about">About</TabsTrigger>
            <TabsTrigger value="experience">Experience</TabsTrigger>
            <TabsTrigger value="education">Education</TabsTrigger>
            <TabsTrigger value="achievements">Achievements</TabsTrigger>
          </TabsList>

          {/* About Tab */}
          <TabsContent value="about" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle>About</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-foreground leading-relaxed">{mockProfile.bio}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Skills & Expertise
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3">
                  {skills.map((skill, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <span className="font-medium">{skill.name}</span>
                      <Badge variant={
                        skill.level === "Advanced" ? "default" :
                        skill.level === "Intermediate" ? "secondary" :
                        "outline"
                      }>
                        {skill.level}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Experience Tab */}
          <TabsContent value="experience" className="space-y-4 mt-4">
            {experience.map((exp, i) => (
              <Card key={i}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex gap-3">
                      <div className="bg-accent p-3 rounded-lg">
                        <Briefcase className="h-6 w-6 text-accent-foreground" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{exp.title}</CardTitle>
                        <p className="text-sm text-muted-foreground">{exp.company}</p>
                        <p className="text-xs text-muted-foreground mt-1">{exp.period}</p>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-foreground">{exp.description}</p>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          {/* Education Tab */}
          <TabsContent value="education" className="space-y-4 mt-4">
            {education.map((edu, i) => (
              <Card key={i}>
                <CardHeader>
                  <div className="flex gap-3">
                    <div className="bg-primary p-3 rounded-lg">
                      <GraduationCap className="h-6 w-6 text-primary-foreground" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{edu.degree}</CardTitle>
                      <p className="text-sm text-muted-foreground">{edu.institution}</p>
                      <p className="text-xs text-muted-foreground mt-1">{edu.period}</p>
                      <p className="text-sm mt-2">GPA: <span className="font-semibold">{edu.gpa}</span></p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p className="font-medium text-sm">Notable Achievements:</p>
                    <ul className="list-disc list-inside space-y-1">
                      {edu.achievements.map((achievement, j) => (
                        <li key={j} className="text-sm text-foreground">{achievement}</li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          {/* Achievements Tab */}
          <TabsContent value="achievements" className="space-y-4 mt-4">
            {achievements.map((achievement, i) => (
              <Card key={i}>
                <CardHeader>
                  <div className="flex gap-3">
                    <div className="bg-secondary p-3 rounded-lg">
                      <Award className="h-6 w-6 text-secondary-foreground" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{achievement.title}</CardTitle>
                      <p className="text-sm text-muted-foreground">{achievement.organization}</p>
                      <p className="text-xs text-muted-foreground mt-1">{achievement.date}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-foreground">{achievement.description}</p>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
