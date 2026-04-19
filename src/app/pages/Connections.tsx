import * as React from "react";
import { Users } from "lucide-react";
import { Navigation } from "../components/Navigation";
import { Card, CardContent } from "../components/ui/card";

export function Connections() {
  return (
    <div className="min-h-screen bg-muted/30 pb-20 lg:pb-0">
      <Navigation />

      <div className="container max-w-5xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">My Connections</h1>
          <p className="text-muted-foreground mt-1">Manage your professional network.</p>
        </div>

        <Card className="shadow-sm border-0">
          <CardContent className="flex flex-col items-center justify-center py-24 text-center">
            <div className="bg-primary/10 p-4 rounded-full mb-4">
              <Users className="h-10 w-10 text-primary" />
            </div>
            <h2 className="text-xl font-semibold text-foreground mb-2">No connections yet</h2>
            <p className="text-muted-foreground max-w-md">
              When you connect with other Falcons, they will show up here. Head over to the Network tab to start building your professional circle!
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}