import { createFileRoute, Outlet } from "@tanstack/react-router";
import { ListMusic } from "lucide-react";

export const Route = createFileRoute("/jobs")({
  component: RouteComponent,
  staticData: { title: "nav.jobs", icon: ListMusic, sortIndex: 20 },
});

function RouteComponent() {
  return <Outlet />;
}
