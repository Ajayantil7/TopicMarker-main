import { createFileRoute, Outlet } from "@tanstack/react-router";
import { userQueryOptions } from "@/lib/api";
import { Button } from "@/components/ui/button";

const Login = () => {
  return (
    <div className="flex flex-col gap-y-2 items-center">
      <p>You have to login or register</p>
      <Button asChild>
        <a href="/api/login">Login!</a>
      </Button>
      <Button asChild>
        <a href="/api/register">Register!</a>
      </Button>
    </div>
  );
};

const Component = () => {
  // For testing purposes, we're bypassing authentication
  // const { user } = Route.useRouteContext();
  // if (!user) {
  //   return <Login />;
  // }

  return <Outlet />;
};

// src/routes/_authenticated.tsx
export const Route = createFileRoute("/_authenticated")({
  beforeLoad: async ({ context }) => {
    // For testing purposes, we're returning a mock user
    // const queryClient = context.queryClient;
    // try {
    //   const data = await queryClient.fetchQuery(userQueryOptions);
    //   return data;
    // } catch (e) {
    //   return { user: null };
    // }

    // Mock user for testing
    return {
      user: {
        id: "test-user-id",
        given_name: "Test",
        family_name: "User",
        email: "test@example.com"
      }
    };
  },
  component: Component,
});
