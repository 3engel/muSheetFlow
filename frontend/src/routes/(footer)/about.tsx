import { createFileRoute } from "@tanstack/react-router";
import {
  BadgeInfo,
  Languages,
  LibraryBig,
  ScanSearch,
  Workflow,
} from "lucide-react";
import { useTranslation } from "react-i18next";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const Route = createFileRoute("/(footer)/about")({
  component: RouteComponent,
  staticData: { title: "nav.about" },
});

function RouteComponent() {
  const appTitle = import.meta.env.VITE_APP_TITLE || "muSheetFlow";
  const version = import.meta.env.PACKAGE_VERSION || "dev";
  const { t } = useTranslation();

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 pb-8">
      <section className="rounded-2xl bg-linear-to-br from-teal-600/10 via-background to-amber-500/10 p-6 ring-1 ring-foreground/10 md:p-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="max-w-3xl space-y-3">
            <Badge
              variant="outline"
              className="gap-1.5"
            >
              <BadgeInfo />
              {t("about.badge")}
            </Badge>
            <div className="space-y-2">
              <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
                {appTitle}
              </h1>
              <p className="max-w-2xl text-base text-muted-foreground md:text-lg">
                {t("about.description")}
              </p>
            </div>
          </div>
          <Badge className="self-start md:self-end">v{version}</Badge>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className="card-highlight">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LibraryBig className="size-5 text-teal-600" />
              {t("about.projectManagement")}
            </CardTitle>
            <CardDescription>
              {t("about.projectManagementDesc")}
            </CardDescription>
          </CardHeader>
        </Card>

        <Card className="card-highlight">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ScanSearch className="size-5 text-teal-600" />
              {t("about.ocrRecognition")}
            </CardTitle>
            <CardDescription>
              {t("about.ocrRecognitionDesc")}
            </CardDescription>
          </CardHeader>
        </Card>

        <Card className="card-highlight">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Workflow className="size-5 text-teal-600" />
              {t("about.batchExport")}
            </CardTitle>
            <CardDescription>
              {t("about.batchExportDesc")}
            </CardDescription>
          </CardHeader>
        </Card>

        <Card className="card-highlight">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Languages className="size-5 text-teal-600" />
              {t("about.multiLanguage")}
            </CardTitle>
            <CardDescription>
              {t("about.multiLanguageDesc")}
            </CardDescription>
          </CardHeader>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <Card className="h-full card-highlight">
          <CardHeader>
            <CardTitle>{t("about.workflow")}</CardTitle>
            <CardDescription>
              {t("about.workflowDesc")}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2">
            <div className="rounded-xl bg-muted/40 p-4 ring-1 ring-foreground/8">
              <div className="mb-2 text-sm font-medium">{t("about.step1Title")}</div>
              <p className="text-sm text-muted-foreground">
                {t("about.step1Desc")}
              </p>
            </div>
            <div className="rounded-xl bg-muted/40 p-4 ring-1 ring-foreground/8">
              <div className="mb-2 text-sm font-medium">{t("about.step2Title")}</div>
              <p className="text-sm text-muted-foreground">
                {t("about.step2Desc")}
              </p>
            </div>
            <div className="rounded-xl bg-muted/40 p-4 ring-1 ring-foreground/8">
              <div className="mb-2 text-sm font-medium">{t("about.step3Title")}</div>
              <p className="text-sm text-muted-foreground">
                {t("about.step3Desc")}
              </p>
            </div>
            <div className="rounded-xl bg-muted/40 p-4 ring-1 ring-foreground/8">
              <div className="mb-2 text-sm font-medium">{t("about.step4Title")}</div>
              <p className="text-sm text-muted-foreground">
                {t("about.step4Desc")}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="h-full card-highlight">
          <CardHeader>
            <CardTitle>{t("about.tech")}</CardTitle>
            <CardDescription>
              {t("about.techDesc")}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Badge variant="secondary">React</Badge>
            <Badge variant="secondary">TanStack Router</Badge>
            <Badge variant="secondary">TanStack Query</Badge>
            <Badge variant="secondary">Tailwind CSS</Badge>
            <Badge variant="secondary">FastAPI</Badge>
            <Badge variant="secondary">PyMuPDF</Badge>
            <Badge variant="secondary">Tesseract OCR</Badge>
            <Badge variant="secondary">OpenCV</Badge>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
