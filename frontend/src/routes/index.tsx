import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  loader: () => {
    throw Route.redirect({
      to: "/projects",
    });
  },
});
