import { Button } from "./button";
import { createLink, type LinkComponent } from "@tanstack/react-router";

const TanStackLinkComponent = createLink(Button);

export const LinkButton: LinkComponent<typeof TanStackLinkComponent> = (
  props
) => {
  return <TanStackLinkComponent preload={false} {...props} />;
};
