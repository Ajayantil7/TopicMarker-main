import { createFileRoute, Link } from '@tanstack/react-router';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { Button } from "@/components/ui/button";

export const Route = createFileRoute('/_authenticated/')({
  component: Index,
})

function Index() {
  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-center mb-8">
        Welcome to Topic Marker
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* MDX Editor Card */}
        <Card className="w-full shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader>
            <CardTitle className="text-xl md:text-2xl">MDX Editor</CardTitle>
            <CardDescription>Create and edit MDX content</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-2">
              <Button asChild className="w-full justify-start">
                <Link to="/mdx">
                  Open MDX Editor
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full justify-start">
                <Link to="/mdxPublic">
                  View Public MDX
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
