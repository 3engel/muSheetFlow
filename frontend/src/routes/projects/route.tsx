import { createFileRoute, Outlet } from '@tanstack/react-router'
import { List } from "lucide-react";

export const Route = createFileRoute('/projects')({
  component: RouteComponent,
  staticData: { title: "Notenprojekte", icon: List, sortIndex: 10 },
})

function RouteComponent() {
  return <Outlet />;
}

