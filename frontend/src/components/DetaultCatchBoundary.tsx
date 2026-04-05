import {
  ErrorComponent,
  rootRouteId,
  useMatch,
  useRouter,
} from "@tanstack/react-router";
import type { ErrorComponentProps } from "@tanstack/react-router";
import { Button } from "./ui/button";
import { LinkButton } from "./ui/link-button";
import { useTranslation } from "react-i18next";

export function DefaultCatchBoundary({ error }: ErrorComponentProps) {
  const router = useRouter();
  const isRoot = useMatch({
    strict: false,
    select: (state) => state.id === rootRouteId,
  });
  const { t } = useTranslation();

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
          {t("common.tryAgain")}
        </Button>
        {isRoot ? (
          <LinkButton
            to="/"
            variant="secondary"
          >
            {t("common.home")}
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
            {t("common.goBack")}
          </LinkButton>
        )}
      </div>
    </div>
  );
}
