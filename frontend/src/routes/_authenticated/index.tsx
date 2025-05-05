import { createFileRoute, Link } from '@tanstack/react-router';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";

import { api } from "@/lib/api";

export const Route = createFileRoute('/_authenticated/')({
  component: Index,
})

async function getTotalSpent() {
  const res = await api.expenses["total-spent"].$get();
  if (!res.ok) {
    throw new Error("server error");
  }
  const data = await res.json();
  return data;
}

function Index() {
  const { isPending, error, data } = useQuery({
    queryKey: ["get-total-spent"],
    queryFn: getTotalSpent,
  });

  if (error) return (
    <div className="text-center p-4 text-red-500">
      An error has occurred: {error.message}
    </div>
  );

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-center mb-8">
        Welcome to Expense Tracker
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Total Spent Card */}
        <Card className="w-full shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader>
            <CardTitle className="text-xl md:text-2xl">Total Spent</CardTitle>
            <CardDescription>The total amount you've spent</CardDescription>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">
            {isPending ? "..." : data.total}
          </CardContent>
        </Card>

        {/* Quick Actions Card */}
        <Card className="w-full shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader>
            <CardTitle className="text-xl md:text-2xl">Quick Actions</CardTitle>
            <CardDescription>Common tasks you might want to do</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-2">
              <Button asChild className="w-full justify-start">
                <Link to="/create-expense">
                  Create New Expense
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full justify-start">
                <Link to="/expenses">
                  View All Expenses
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

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
