import { Button } from "./ui/button";
import { LinkButton } from "./ui/link-button";
import { useTranslation } from "react-i18next";

export function NotFound({ children }: { children?: any }) {
  const { t } = useTranslation();
  return (
    <div className="space-y-2">
      <div className="text-muted-foreground">
        {children || <p>{t("common.notFound")}</p>}
      </div>
      <p className="flex items-center gap-4 flex-wrap">
        <Button onClick={() => window.history.back()}>{t("common.goBack")}</Button>
        <LinkButton
          to="/"
          variant="secondary"
        >
          {t("common.goHome")}
        </LinkButton>
      </p>
    </div>
  );
}
