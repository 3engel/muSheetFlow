import { Button } from "./ui/button";
import { LinkButton } from "./ui/link-button";

export function NotFound({ children }: { children?: any }) {
  return (
    <div className="space-y-2">
      <div className="text-muted-foreground">
        {children || <p>The page you are looking for does not exist.</p>}
      </div>
      <p className="flex items-center gap-4 flex-wrap">
        <Button onClick={() => window.history.back()}>Go back</Button>
        <LinkButton
          to="/"
          variant="secondary"
        >
          Go to home
        </LinkButton>
      </p>
    </div>
  );
}
