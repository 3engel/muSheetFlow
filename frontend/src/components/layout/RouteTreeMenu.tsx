import { useNavigate, type Route } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";
import { useRouterState } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  useSidebar,
} from "@/components/ui/sidebar";
import { useState } from "react";

export function RouteTreeMenu({ routes }: { routes: Route[] }) {
  if (!routes || routes.length === 0) {
    return null;
  }

  routes = routes.filter(
    (route) =>
      route.path !== "/" &&
      route.id.indexOf("/_") === -1 &&
      route.id.indexOf("/(") === -1 &&
      route.id.indexOf("/$") === -1,
  );

  const [isOpen, setIsOpen] = useState(true);

  const filterChildren = (route: Route) => {
    if (!route.children || !Array.isArray(route.children)) return route;
    const filteredChildren = route.children.filter(
      (child) =>
        child.path !== "/" &&
        child.id.indexOf("/_") === -1 &&
        child.id.indexOf("/$") === -1,
    );
    return { ...route, children: filteredChildren };
  };

  return routes.map((route) => {
    const filteredRoute = filterChildren(route);

    return (
      <SidebarMenuItem key={route.id}>
        {!filteredRoute.children ||
        (Array.isArray(filteredRoute.children) &&
          filteredRoute.children.length === 0) ? (
          <RouteTreeMenuItem route={route} />
        ) : (
          <Collapsible
            className="group/collapsible [&[data-state=open]>button>svg:first-child]:rotate-90"
            open={isOpen}
            onOpenChange={setIsOpen}
          >
            <CollapsibleTrigger
              render={
                <RouteTreeMenuItem
                  route={route}
                  hasArrow
                />
              }
            />
            <CollapsibleContent>
              <SidebarMenuSub>
                <RouteTreeMenu routes={filteredRoute.children as Route[]} />
              </SidebarMenuSub>
            </CollapsibleContent>
          </Collapsible>
        )}
      </SidebarMenuItem>
    );
  });
}

function RouteTreeMenuItem({
  route,
  hasArrow = false,
}: {
  route: Route;
  hasArrow?: boolean;
}) {
  const normalizedFullPath = route.fullPath.endsWith("/")
    ? route.fullPath.slice(0, -1)
    : route.fullPath;

  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const { t } = useTranslation();
  const isActive = normalizedFullPath === pathname;

  const { isMobile, toggleSidebar } = useSidebar();

  return (
    <SidebarMenuButton
      isActive={isActive}
      className="data-[active=true]:bg-transparent flex flex-row items-center gap-2"
      onClick={() => navigate({ to: route.fullPath as string })}
    >
      {route.options.staticData?.icon && (
        <route.options.staticData.icon className="size-4 text-muted-foreground" />
      )}
      <span>{t(route.options.staticData?.title ?? "")}</span>

      {hasArrow && (
        <CollapsibleTrigger
          render={
            <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
          }
        />
      )}
    </SidebarMenuButton>
  );
}
