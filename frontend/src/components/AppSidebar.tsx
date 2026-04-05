import * as React from "react";
import { Link, Route, useRouter, useRouterState } from "@tanstack/react-router";
import {
  Archive,
  CircuitBoard,
  FileMusic,
  Folder,
  Hexagon,
  Info,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { AppTitle } from "./layout/AppTitle";
import { RouteTreeMenu } from "./layout/RouteTreeMenu";
import { LinkButton } from "./ui/link-button";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { routeTree } = useRouter();

  const filteredRoutes = (routeTree.children as unknown as Route[])
    .filter((route) => route.path !== "/")
    .sort((a, b) => {
      const aIndex =
        a.options.staticData?.sortIndex ?? Number.POSITIVE_INFINITY;
      const bIndex =
        b.options.staticData?.sortIndex ?? Number.POSITIVE_INFINITY;
      return aIndex - bIndex;
    });

  return (
    <Sidebar {...props}>
      <SidebarHeader className="items-center flex flex-row gap-2 h-16 pl-4 pr-2">
        <Link
          to="/"
          title={import.meta.env.VITE_APP_TITLE}
        >
          <div className="flex aspect-square size-10 items-center justify-center rounded-lg bg-teal-600 text-sidebar-primary-foreground ">
            <FileMusic className="size-6" />
          </div>
        </Link>
        <div className="font-semibold grow truncate">
          <Link
            to="/"
            title={import.meta.env.VITE_APP_TITLE}
          >
            <AppTitle
              isMultiLine
              appTitle={import.meta.env.VITE_APP_TITLE}
              appVersion={`v${import.meta.env.PACKAGE_VERSION}`}
            />
          </Link>
        </div>
      </SidebarHeader>

      <SidebarContent className="gap-0">
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <RouteTreeMenu routes={filteredRoutes} />
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarRail />
      <SidebarFooter>
        <LinkButton
          to="/about"
          title="Über"
          variant="secondary"
        >
          <Info />
          Info
        </LinkButton>
      </SidebarFooter>
    </Sidebar>
  );
}
