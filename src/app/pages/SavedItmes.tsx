import * as React from "react";
import { Bookmark } from "lucide-react";
import { Navigation } from "../components/Navigation";
import { Card, CardContent } from "../components/ui/card";

export function SavedItems() {
  return (
    <div className="min-h-screen bg-muted/30 pb-20 lg:pb-0">
      <Navigation />

      <div className="container max-w-5xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Saved Items</h1>
          <p className="text-muted-foreground mt-1">Posts, jobs, and events you want to revisit.</p>
        </div>

        <Card className="shadow-sm border-0">
          <CardContent className="flex flex-col items-center justify-center py-24 text-center">
            <div className="bg-primary/10 p-4 rounded-full mb-4">
              <Bookmark className="h-10 w-10 text-primary" />
            </div>
            <h2 className="text-xl font-semibold text-foreground mb-2">Nothing saved yet</h2>
            <p className="text-muted-foreground max-w-md">
              Keep track of interesting posts or opportunities by clicking the save icon. They will automatically appear here for easy access.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}