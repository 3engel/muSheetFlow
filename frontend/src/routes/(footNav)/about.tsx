import { createFileRoute } from "@tanstack/react-router";
import {
  BadgeInfo,
  Languages,
  LibraryBig,
  ScanSearch,
  Workflow,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const Route = createFileRoute("/(footNav)/about")({
  component: RouteComponent,
  staticData: { title: "Über" },
});

function RouteComponent() {
  const appTitle = import.meta.env.VITE_APP_TITLE || "muSheetFlow";
  const version = import.meta.env.PACKAGE_VERSION || "dev";

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
              Über diese Anwendung
            </Badge>
            <div className="space-y-2">
              <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
                {appTitle}
              </h1>
              <p className="max-w-2xl text-base text-muted-foreground md:text-lg">
                Eine Arbeitsumgebung zum Verwalten, Aufbereiten und Exportieren
                von Noten-PDFs mit OCR-gestützter Instrumentenerkennung.
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
              Projekte verwalten
            </CardTitle>
            <CardDescription>
              PDFs werden projektbezogen organisiert und für die weitere
              Verarbeitung gesammelt.
            </CardDescription>
          </CardHeader>
        </Card>

        <Card className="card-highlight">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ScanSearch className="size-5 text-teal-600" />
              OCR & Erkennung
            </CardTitle>
            <CardDescription>
              Instrumente werden aus den Noten automatisch erkannt und für den
              Export vorbereitet.
            </CardDescription>
          </CardHeader>
        </Card>

        <Card className="card-highlight">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Workflow className="size-5 text-teal-600" />
              Batch-Export
            </CardTitle>
            <CardDescription>
              Zuschnitt, Rotation, Aufbereitung und Ausgabe laufen über einen
              nachvollziehbaren Job-Workflow.
            </CardDescription>
          </CardHeader>
        </Card>

        <Card className="card-highlight">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Languages className="size-5 text-teal-600" />
              Mehrsprachige Ausgabe
            </CardTitle>
            <CardDescription>
              Instrumentnamen können für Dateinamen und Ergebnislisten in
              verschiedenen Sprachen ausgegeben werden.
            </CardDescription>
          </CardHeader>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <Card className="h-full card-highlight">
          <CardHeader>
            <CardTitle>Workflow</CardTitle>
            <CardDescription>
              Der typische Ablauf innerhalb der Anwendung.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2">
            <div className="rounded-xl bg-muted/40 p-4 ring-1 ring-foreground/8">
              <div className="mb-2 text-sm font-medium">1. Projekt anlegen</div>
              <p className="text-sm text-muted-foreground">
                Ein Musikstück oder Satz wird als Projekt erstellt und dient
                als Container für alle zugehörigen PDFs.
              </p>
            </div>
            <div className="rounded-xl bg-muted/40 p-4 ring-1 ring-foreground/8">
              <div className="mb-2 text-sm font-medium">2. Dateien hochladen</div>
              <p className="text-sm text-muted-foreground">
                Mehrere PDFs können gesammelt hochgeladen und anschließend im
                Projekt weiterbearbeitet werden.
              </p>
            </div>
            <div className="rounded-xl bg-muted/40 p-4 ring-1 ring-foreground/8">
              <div className="mb-2 text-sm font-medium">3. Export konfigurieren</div>
              <p className="text-sm text-muted-foreground">
                Rotation, Zuschnitt, Split und Sprachziel werden passend zum
                Material festgelegt.
              </p>
            </div>
            <div className="rounded-xl bg-muted/40 p-4 ring-1 ring-foreground/8">
              <div className="mb-2 text-sm font-medium">4. Ergebnisse pruefen</div>
              <p className="text-sm text-muted-foreground">
                Erkannte Instrumente lassen sich kontrollieren, korrigieren und
                danach gesammelt finalisieren.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="h-full card-highlight">
          <CardHeader>
            <CardTitle>Technik</CardTitle>
            <CardDescription>
              Die App kombiniert ein React-Frontend mit einem Python-Backend
              fuer PDF- und OCR-Verarbeitung.
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
