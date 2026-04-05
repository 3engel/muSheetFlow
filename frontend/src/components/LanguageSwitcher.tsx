import { useTranslation } from "react-i18next";
import { Button } from "./ui/button";
import { Languages } from "lucide-react";
import { LANGUAGES } from "@/lib/constants";

export function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const currentLang = i18n.language?.startsWith("de") ? "de" : "en";

  return (
    <div className="flex gap-1">
      <Languages className="size-4 text-muted-foreground self-center mr-1" />
      {LANGUAGES.map((lang) => (
        <Button
          key={lang.code}
          variant={currentLang === lang.code ? "default" : "ghost"}
          size="sm"
          className="px-2 text-xs"
          onClick={() => i18n.changeLanguage(lang.code)}
        >
          {lang.label}
        </Button>
      ))}
    </div>
  );
}
