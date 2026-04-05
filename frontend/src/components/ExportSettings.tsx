import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import type { Crop } from "react-image-crop";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./ui/card";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldLabel,
  FieldTitle,
} from "./ui/field";
import { Checkbox } from "./ui/checkbox";
import { Label } from "./ui/label";
import { Slider } from "./ui/slider";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import { InfoIcon } from "lucide-react";

export default function ExportSettings({
  project,
  crop,
  rotation,
  doSplit,
  onExportStarted,
}: {
  project: string;
  crop: Crop;
  rotation: number;
  doSplit: boolean;
  onExportStarted: () => void;
}) {
  const [autoDeskew, setAutoDeskew] = useState(true);
  const [autoEnhance, setAutoEnhance] = useState(true);
  const [jpegQuality, setJpegQuality] = useState(75);
  const [targetLang, setTargetLang] = useState("Deutsch");
  const queryClient = useQueryClient();

  const exportMutation = useMutation({
    mutationFn: async () => {
      return api.post(`/projects/${project}/export`, {
        rotation,
        do_split: doSplit,
        crop: { x: crop.x, y: crop.y, width: crop.width, height: crop.height },
        target_language: targetLang,
        auto_deskew: autoDeskew,
        auto_enhance: autoEnhance,
        jpeg_quality: jpegQuality,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
      onExportStarted();
    },
    onError: () => {
      alert("Fehler beim Starten des Exports.");
    },
  });

  const startExport = () => {
    exportMutation.mutate();
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Exporteinstellungen</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-8">
            <Field orientation="horizontal">
              <Checkbox
                id="auto-deskew"
                name="auto-deskew"
                checked={autoDeskew}
                onCheckedChange={setAutoDeskew}
              />

              <FieldContent>
                <FieldTitle>Auto-Begradigung</FieldTitle>
                <FieldDescription>
                  Begradigt automatisch schief eingescannten Noten. Funktioniert
                  am besten, wenn die Schieflage nicht zu extrem ist.
                </FieldDescription>
              </FieldContent>
            </Field>
            <Field orientation="horizontal">
              <Checkbox
                id="auto-enhance"
                name="auto-enhance"
                checked={autoEnhance}
                onCheckedChange={setAutoEnhance}
              />

              <FieldContent>
                <FieldTitle>Auto-Kontrast</FieldTitle>
                <FieldDescription>
                  Verbessert automatisch den Kontrast der eingescannten Noten.
                  Funktioniert am besten, wenn die Noten leicht verblasst oder
                  ungleichmäßig beleuchtet sind.
                </FieldDescription>
              </FieldContent>
            </Field>
            <div className="flex w-full flex-col gap-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="quality">Ausgabequalität</Label>
                <span className="text-sm text-muted-foreground font-semibold">
                  {jpegQuality}%
                </span>
              </div>
              <Slider
                id="quality"
                value={jpegQuality}
                onValueChange={(value) => setJpegQuality(value as number)}
                min={30}
                max={100}
              />
            </div>

            <Field>
              <FieldLabel>OCR Sprache für Texterkennung</FieldLabel>
              <Select
                onValueChange={(value) => {
                  if (value) setTargetLang(value);
                }}
                value={targetLang}
              >
                <SelectTrigger>
                  <SelectValue placeholder="OCR Sprache wählen" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="Deutsch">Deutsch</SelectItem>
                    <SelectItem value="English">English</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>
          </div>
          <Alert>
            <InfoIcon />
            <AlertTitle>Hinweis zur Hintergrundverarbeitung</AlertTitle>
            <AlertDescription>
              Die Dokumente werden im Hintergrund verarbeitet inkl.
              Texterkennung. Das Zuweisen der Instrumente kann danach erfolgen.
            </AlertDescription>
          </Alert>
        </CardContent>
        <CardFooter>
          <Button
            className="w-full"
            onClick={startExport}
            disabled={exportMutation.isPending}
          >
            {exportMutation.isPending
              ? "Starte..."
              : "Hintergrundverarbeitung starten"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
