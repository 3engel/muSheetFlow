import {
  ErrorComponent,
  rootRouteId,
  useMatch,
  useRouter,
} from "@tanstack/react-router";
import type { ErrorComponentProps } from "@tanstack/react-router";
import { Button } from "./ui/button";
import { LinkButton } from "./ui/link-button";

export function DefaultCatchBoundary({ error }: ErrorComponentProps) {
  const router = useRouter();
  const isRoot = useMatch({
    strict: false,
    select: (state) => state.id === rootRouteId,
  });

  console.error(error);

  return (
    <div className="min-w-0 flex-1 flex flex-col items-center justify-center">
      <ErrorComponent error={error} />
      <div className="flex items-center flex-wrap">
        <Button
          onClick={() => {
            router.invalidate();
          }}
        >
          Try again
        </Button>
        {isRoot ? (
          <LinkButton
            to="/"
            variant="secondary"
          >
            Home
          </LinkButton>
        ) : (
          <LinkButton
            to="/"
            variant="secondary"
            onClick={(e) => {
              e.preventDefault();
              window.history.back();
            }}
          >
            Go back
          </LinkButton>
        )}
      </div>
    </div>
  );
}
