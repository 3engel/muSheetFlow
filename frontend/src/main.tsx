import React from "react";
import ReactDOM from "react-dom/client";
import {
  AnyRouteMatch,
  RouterProvider,
  createRouter,
} from "@tanstack/react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "./globals.css";
import "./i18n/i18n";
import { LucideIcon } from "lucide-react";
import { routeTree } from "./routeTree.gen";
import { NotFound } from "./components/NotFound";
import { DefaultCatchBoundary } from "./components/DetaultCatchBoundary";

export const queryClient = new QueryClient();

const router = createRouter({
  routeTree,
  context: {
    queryClient,
  },
  defaultPreload: "intent",
  defaultPreloadStaleTime: 0,
  scrollRestoration: true,

  defaultNotFoundComponent: () => <NotFound />,
  defaultErrorComponent: DefaultCatchBoundary,
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }

  interface StaticDataRouteOption {
    title?: string;
    icon?: LucideIcon;
    sortIndex?: number;
    getDynamicTitle?: (match: AnyRouteMatch) => string;
  }
}

const documentElement = document.getElementById("root");

if (!documentElement) {
  throw new Error("No root element found");
}

ReactDOM.createRoot(documentElement).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </React.StrictMode>,
);
