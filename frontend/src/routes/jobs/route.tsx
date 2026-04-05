import { createFileRoute, Outlet } from "@tanstack/react-router";
import { ListMusic } from "lucide-react";

export const Route = createFileRoute("/jobs")({
  component: RouteComponent,
  staticData: { title: "Jobs", icon: ListMusic, sortIndex: 20 },
});

function RouteComponent() {
  return <Outlet />;
}
