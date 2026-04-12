import { useTranslation } from "react-i18next";
import { TabsList, TabsTrigger } from "../ui/tabs";
import { FileInfo } from "@/lib/types";

export const JobTabs = ({ files, className }: { files: FileInfo[]; className?: string }) => {
  const { t } = useTranslation();
  return (
    <TabsList
      variant="line"
      className={className}
    >
      <TabsTrigger value="upload">{t("project.managePdfs")}</TabsTrigger>
      <TabsTrigger
        value="rotate"
        disabled={files.length === 0}
      >
        {t("project.adjustFormatting")}
      </TabsTrigger>
      <TabsTrigger
        value="crop"
        disabled={files.length === 0}
      >
        {t("project.crop")}
      </TabsTrigger>
      <TabsTrigger
        value="settings"
        disabled={files.length === 0}
      >
        {t("project.exportSettings")}
      </TabsTrigger>
    </TabsList>
  );
};
