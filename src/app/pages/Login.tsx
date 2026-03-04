import { useState } from "react"; 
import { useNavigate } from "react-router-dom";       
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL!,
  import.meta.env.VITE_SUPABASE_ANON_KEY!
);

export function Login() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

// Replace ENTIRE handleLogin + handleSignup
const handleLogin = async (e: React.FormEvent) => {
  e.preventDefault();
  setIsLoading(true);
  // DEMO BYPASS
  setTimeout(() => {
    console.log("🚀 Falcon Forge DEMO - Welcome!");
    navigate("/feed");
    setIsLoading(false);
  }, 1000);
};

const handleSignup = async (e: React.FormEvent) => {
  e.preventDefault();
  setIsLoading(true);
  // DEMO BYPASS
  setTimeout(() => {
    console.log("🚀 New Falcon account created!");
    navigate("/feed");
    setIsLoading(false);
  }, 1000);
};

  // const handleLogin = async (e: React.FormEvent) => {
  //   e.preventDefault();
  //   setIsLoading(true);

  //   const formData = new FormData(e.target as HTMLFormElement);
  //   const email = formData.get('email') as string;
  //   const password = formData.get('password') as string;

  //   try {
  //     const { data, error } = await supabase.auth.signInWithPassword({
  //       email,
  //       password
  //     } as any);  // TypeScript bypass

  //     if (error) throw error;
  //     if (data.user) {
  //       navigate("/feed");
  //     }
  //   } catch (error: any) {
  //     alert(error.message);
  //   }

  //   setIsLoading(false);
  // };


  // const handleSignup = async (e: React.FormEvent) => {
  //   e.preventDefault();
  //   setIsLoading(true);

  //   const formData = new FormData(e.target as HTMLFormElement);
  //   const email = formData.get('signupEmail') as string;
  //   const password = formData.get('signupPassword') as string;
  //   const firstName = formData.get('firstName') as string;
  //   const lastName = formData.get('lastName') as string;

  //   // Create user
  //   const { error } = await supabase.auth.signUp({ email, password });

  //   if (error) alert(error.message);
  //   else {
  //     console.log("First Name:", firstName);
  //     console.log("Last Name:", lastName);
  //     console.log("Password:", password);

  //     // Save profile
  //     await supabase.from('profiles').upsert({
  //       id: (await supabase.auth.getUser()).data.user?.id,
  //       first_name: firstName,
  //       last_name: lastName,
  //       email
  //     });
  //     navigate("/feed");
  //   }

  //   setIsLoading(false);
  // };

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Left side - Branding */}
      <div className="hidden lg:flex flex-col justify-center items-center bg-gradient-to-br from-primary via-primary/90 to-primary/80 p-12 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10" />
        <div className="relative z-10 max-w-md space-y-6">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold">Welcome to Falcon Forge</h1>
            <p className="text-xl text-white/90">Connect, Grow, and Succeed</p>
          </div>
          <p className="text-white/80 text-lg">
            Your professional networking platform designed exclusively for the University of Montevallo community.
          </p>
          <div className="space-y-4 pt-6">
            <div className="flex items-start gap-3">
              <div className="bg-secondary rounded-full p-2 mt-1">
                <svg className="w-5 h-5 text-secondary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold">Connect with Peers</h3>
                <p className="text-white/70 text-sm">Build relationships with students, alumni, and faculty</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="bg-secondary rounded-full p-2 mt-1">
                <svg className="w-5 h-5 text-secondary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold">Discover Opportunities</h3>
                <p className="text-white/70 text-sm">Find internships, jobs, and collaborative projects</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="bg-secondary rounded-full p-2 mt-1">
                <svg className="w-5 h-5 text-secondary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold">Showcase Your Skills</h3>
                <p className="text-white/70 text-sm">Highlight your achievements and expertise</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Login/Signup Form */}
      <div className="flex flex-col justify-center items-center p-6 lg:p-12 bg-background">
        <div className="w-full max-w-md space-y-8">
          {/* Logo for mobile */}
          <div className="lg:hidden text-center space-y-2">
            <h1 className="text-3xl font-bold text-primary">Falcon Forge</h1>
            <p className="text-muted-foreground">University of Montevallo</p>
          </div>

          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Log In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>

            {/* Login Tab */}
            <TabsContent value="login">
              <Card>
                <CardHeader>
                  <CardTitle>Welcome Back</CardTitle>
                  <CardDescription>
                    Enter your credentials to access your account
                  </CardDescription>
                </CardHeader>
                <form onSubmit={handleLogin}>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="you@montevallo.edu"
                        required
                        className="bg-input-background"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password">Password</Label>
                      <Input
                        id="password"
                        type="password"
                        placeholder="••••••••"
                        required
                        className="bg-input-background"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <label className="flex items-center gap-2 text-sm">
                        <input type="checkbox" className="rounded border-border" />
                        <span className="text-muted-foreground">Remember me</span>
                      </label>
                      <Button variant="link" type="button" className="px-0 text-sm">
                        Forgot password?
                      </Button>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading ? "Logging in..." : "Log In"}
                    </Button>
                  </CardFooter>
                </form>
              </Card>
            </TabsContent>

            {/* Signup Tab */}
            <TabsContent value="signup">
              <Card>
                <CardHeader>
                  <CardTitle>Create an Account</CardTitle>
                  <CardDescription>
                    Join the Falcon community today
                  </CardDescription>
                </CardHeader>
                <form onSubmit={handleSignup}>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="firstName">First Name</Label>
                        <Input
                          id="firstName"
                          placeholder="John"
                          required
                          className="bg-input-background"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastName">Last Name</Label>
                        <Input
                          id="lastName"
                          placeholder="Doe"
                          required
                          className="bg-input-background"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signupEmail">University Email</Label>
                      <Input
                        id="signupEmail"
                        type="email"
                        placeholder="you@montevallo.edu"
                        required
                        className="bg-input-background"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signupPassword">Password</Label>
                      <Input
                        id="signupPassword"
                        type="password"
                        placeholder="••••••••"
                        required
                        className="bg-input-background"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirm Password</Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        placeholder="••••••••"
                        required
                        className="bg-input-background"
                      />
                    </div>
                    <div className="flex items-start gap-2">
                      <input type="checkbox" required className="rounded border-border mt-1" />
                      <span className="text-sm text-muted-foreground">
                        I agree to the Terms of Service and Privacy Policy
                      </span>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading ? "Creating account..." : "Create Account"}
                    </Button>
                  </CardFooter>
                </form>
              </Card>
            </TabsContent>
          </Tabs>

          

          <p className="text-center text-sm text-muted-foreground">
            By continuing, you agree to Falcon Forge's Terms of Service and Privacy Policy
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;
