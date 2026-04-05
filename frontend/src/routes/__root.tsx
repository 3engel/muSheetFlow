import { createRootRouteWithContext, Outlet } from "@tanstack/react-router";
import { ThemeProvider } from "@/components/ThemeProvider";
import { BaseLayout } from "@/components/layout/BaseLayout";
import { QueryClient } from "@tanstack/react-query";

type MyRouterContext = {
  queryClient: QueryClient;
};

export const Route = createRootRouteWithContext<MyRouterContext>()({
  staticData: { title: "Home" },
  component: () => (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <BaseLayout>
        <Outlet />
      </BaseLayout>
    </ThemeProvider>
  ),
});
