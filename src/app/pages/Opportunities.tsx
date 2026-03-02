import { Navigation } from "../components/Navigation";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Input } from "../components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  Briefcase,
  MapPin,
  Clock,
  DollarSign,
  Search,
  Bookmark,
  ExternalLink,
  Users,
} from "lucide-react";

const mockOpportunities = {
  internships: [
    {
      id: 1,
      title: "Software Engineering Intern",
      company: "Microsoft",
      location: "Remote",
      type: "Summer 2025",
      salary: "$40-50/hr",
      description: "Work on cutting-edge cloud technologies and collaborate with experienced engineers.",
      skills: ["React", "TypeScript", "Azure"],
      postedBy: "Career Services",
      deadline: "Feb 15, 2025",
    },
    {
      id: 2,
      title: "Data Science Intern",
      company: "Amazon",
      location: "Seattle, WA",
      type: "Summer 2025",
      salary: "$45-55/hr",
      description: "Apply machine learning techniques to solve real-world business problems.",
      skills: ["Python", "Machine Learning", "SQL"],
      postedBy: "Alumni Network",
      deadline: "Feb 28, 2025",
    },
    {
      id: 3,
      title: "Marketing Intern",
      company: "Adobe",
      location: "San Jose, CA",
      type: "Summer 2025",
      salary: "$30-35/hr",
      description: "Support marketing campaigns and digital content creation.",
      skills: ["Marketing", "Analytics", "Adobe Creative Suite"],
      postedBy: "Career Services",
      deadline: "March 1, 2025",
    },
  ],
  jobs: [
    {
      id: 4,
      title: "Junior Web Developer",
      company: "Local Tech Startup",
      location: "Birmingham, AL",
      type: "Full-time",
      salary: "$50-60k",
      description: "Build and maintain web applications for growing startup.",
      skills: ["React", "Node.js", "MongoDB"],
      postedBy: "Alumni",
      deadline: "Rolling",
    },
    {
      id: 5,
      title: "Business Analyst",
      company: "Regions Bank",
      location: "Birmingham, AL",
      type: "Full-time",
      salary: "$55-65k",
      description: "Analyze business processes and provide data-driven recommendations.",
      skills: ["Excel", "SQL", "Business Analysis"],
      postedBy: "Partner Company",
      deadline: "Feb 20, 2025",
    },
  ],
  collaborations: [
    {
      id: 6,
      title: "Research Assistant - AI in Education",
      company: "UM Computer Science Department",
      location: "On Campus",
      type: "Part-time",
      salary: "Paid Position",
      description: "Assist with research on AI applications in educational technology.",
      skills: ["Python", "Research", "Machine Learning"],
      postedBy: "Dr. Chen",
      deadline: "Feb 10, 2025",
    },
    {
      id: 7,
      title: "Co-founder for EdTech Startup",
      company: "Student Entrepreneur",
      location: "Remote/Flexible",
      type: "Partnership",
      salary: "Equity-based",
      description: "Looking for a technical co-founder to build educational platform.",
      skills: ["Web Development", "Mobile Dev", "Entrepreneurship"],
      postedBy: "Marcus Williams",
      deadline: "Open",
    },
  ],
};

export function Opportunities() {
  return (
    <div className="min-h-screen bg-muted/30 pb-20 lg:pb-0">
      <Navigation />

      <div className="container max-w-6xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Opportunities</h1>
          <p className="text-muted-foreground">
            Discover internships, jobs, and collaborative projects tailored for Falcon students
          </p>
        </div>

        {/* Search and Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  type="search"
                  placeholder="Search opportunities..."
                  className="pl-10 bg-input-background"
                />
              </div>
              <Select defaultValue="all">
                <SelectTrigger className="w-full md:w-[180px] bg-input-background">
                  <SelectValue placeholder="Location" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Locations</SelectItem>
                  <SelectItem value="remote">Remote</SelectItem>
                  <SelectItem value="alabama">Alabama</SelectItem>
                  <SelectItem value="other">Other States</SelectItem>
                </SelectContent>
              </Select>
              <Select defaultValue="all">
                <SelectTrigger className="w-full md:w-[180px] bg-input-background">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="fulltime">Full-time</SelectItem>
                  <SelectItem value="parttime">Part-time</SelectItem>
                  <SelectItem value="internship">Internship</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="internships">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="internships">
              Internships ({mockOpportunities.internships.length})
            </TabsTrigger>
            <TabsTrigger value="jobs">
              Jobs ({mockOpportunities.jobs.length})
            </TabsTrigger>
            <TabsTrigger value="collaborations">
              Collaborations ({mockOpportunities.collaborations.length})
            </TabsTrigger>
          </TabsList>

          {/* Internships Tab */}
          <TabsContent value="internships" className="space-y-4">
            {mockOpportunities.internships.map((opp) => (
              <Card key={opp.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex gap-4">
                      <div className="bg-accent p-3 rounded-lg h-fit">
                        <Briefcase className="h-6 w-6 text-accent-foreground" />
                      </div>
                      <div>
                        <CardTitle className="text-xl mb-1">{opp.title}</CardTitle>
                        <CardDescription className="text-base">{opp.company}</CardDescription>
                        <div className="flex flex-wrap gap-2 mt-2">
                          <Badge variant="outline" className="gap-1">
                            <MapPin className="h-3 w-3" />
                            {opp.location}
                          </Badge>
                          <Badge variant="outline" className="gap-1">
                            <Clock className="h-3 w-3" />
                            {opp.type}
                          </Badge>
                          <Badge variant="outline" className="gap-1">
                            <DollarSign className="h-3 w-3" />
                            {opp.salary}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon">
                      <Bookmark className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-foreground mb-4">{opp.description}</p>
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Required Skills:</p>
                    <div className="flex flex-wrap gap-2">
                      {opp.skills.map((skill, i) => (
                        <Badge key={i} variant="secondary">{skill}</Badge>
                      ))}
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-border flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      Posted by {opp.postedBy} • Deadline: {opp.deadline}
                    </span>
                  </div>
                </CardContent>
                <CardFooter className="gap-2">
                  <Button className="flex-1 gap-2">
                    Apply Now
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                  <Button variant="outline">Learn More</Button>
                </CardFooter>
              </Card>
            ))}
          </TabsContent>

          {/* Jobs Tab */}
          <TabsContent value="jobs" className="space-y-4">
            {mockOpportunities.jobs.map((opp) => (
              <Card key={opp.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex gap-4">
                      <div className="bg-primary p-3 rounded-lg h-fit">
                        <Briefcase className="h-6 w-6 text-primary-foreground" />
                      </div>
                      <div>
                        <CardTitle className="text-xl mb-1">{opp.title}</CardTitle>
                        <CardDescription className="text-base">{opp.company}</CardDescription>
                        <div className="flex flex-wrap gap-2 mt-2">
                          <Badge variant="outline" className="gap-1">
                            <MapPin className="h-3 w-3" />
                            {opp.location}
                          </Badge>
                          <Badge variant="outline" className="gap-1">
                            <Clock className="h-3 w-3" />
                            {opp.type}
                          </Badge>
                          <Badge variant="outline" className="gap-1">
                            <DollarSign className="h-3 w-3" />
                            {opp.salary}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon">
                      <Bookmark className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-foreground mb-4">{opp.description}</p>
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Required Skills:</p>
                    <div className="flex flex-wrap gap-2">
                      {opp.skills.map((skill, i) => (
                        <Badge key={i} variant="secondary">{skill}</Badge>
                      ))}
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-border flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      Posted by {opp.postedBy} • Deadline: {opp.deadline}
                    </span>
                  </div>
                </CardContent>
                <CardFooter className="gap-2">
                  <Button className="flex-1 gap-2">
                    Apply Now
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                  <Button variant="outline">Learn More</Button>
                </CardFooter>
              </Card>
            ))}
          </TabsContent>

          {/* Collaborations Tab */}
          <TabsContent value="collaborations" className="space-y-4">
            {mockOpportunities.collaborations.map((opp) => (
              <Card key={opp.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex gap-4">
                      <div className="bg-secondary p-3 rounded-lg h-fit">
                        <Users className="h-6 w-6 text-secondary-foreground" />
                      </div>
                      <div>
                        <CardTitle className="text-xl mb-1">{opp.title}</CardTitle>
                        <CardDescription className="text-base">{opp.company}</CardDescription>
                        <div className="flex flex-wrap gap-2 mt-2">
                          <Badge variant="outline" className="gap-1">
                            <MapPin className="h-3 w-3" />
                            {opp.location}
                          </Badge>
                          <Badge variant="outline" className="gap-1">
                            <Clock className="h-3 w-3" />
                            {opp.type}
                          </Badge>
                          <Badge variant="outline" className="gap-1">
                            <DollarSign className="h-3 w-3" />
                            {opp.salary}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon">
                      <Bookmark className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-foreground mb-4">{opp.description}</p>
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Looking for:</p>
                    <div className="flex flex-wrap gap-2">
                      {opp.skills.map((skill, i) => (
                        <Badge key={i} variant="secondary">{skill}</Badge>
                      ))}
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-border flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      Posted by {opp.postedBy} • Deadline: {opp.deadline}
                    </span>
                  </div>
                </CardContent>
                <CardFooter className="gap-2">
                  <Button className="flex-1">Express Interest</Button>
                  <Button variant="outline">Contact</Button>
                </CardFooter>
              </Card>
            ))}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
