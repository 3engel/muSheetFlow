import { Link, useMatches } from "@tanstack/react-router";

import { Home } from "lucide-react";
import { cn } from "@/lib/utils";
import { Fragment } from "react/jsx-runtime";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator
} from "../ui/breadcrumb";

export function AppBreadcrumb({ classname }: { classname?: string }) {
  const matches = useMatches();

  if (matches.some((match) => match.status === "pending")) return null;

  const matchesWithCrumbs = matches.filter(
    (match) =>
      match.staticData?.title !== undefined ||
      match.staticData?.getDynamicTitle !== undefined
  );

  const homeContent = (path: string, crumb: string) => {
    return path === "/" ? <Home size="16" /> : crumb;
  };

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {matchesWithCrumbs.map((match, index) => {
          const isLast = index === matchesWithCrumbs.length - 1;
          const crumbFn = match.staticData?.getDynamicTitle;

          const crumb =
            typeof crumbFn === "function"
              ? crumbFn(match)
              : match.staticData.title || "[UNSET]";
          return (
            <Fragment key={match.id}>
              {!isLast && (
                <>
                  <BreadcrumbItem className={cn(classname, "hidden md:block")}>
                    <BreadcrumbLink
                      render={
                        <Link
                          to={match.pathname}
                          title={crumb}
                          className={cn(classname, "hover:text-white ")}
                        >
                          {homeContent(match.pathname, crumb)}
                        </Link>
                      }
                    ></BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator
                    className={cn(classname, "hidden md:block")}
                  >
                    /
                  </BreadcrumbSeparator>
                </>
              )}
              {isLast && (
                <BreadcrumbItem>
                  <BreadcrumbPage className={classname}>
                    {homeContent(match.pathname, crumb)}
                  </BreadcrumbPage>
                </BreadcrumbItem>
              )}
            </Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
