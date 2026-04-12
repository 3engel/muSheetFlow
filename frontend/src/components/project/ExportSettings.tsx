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
} from "../ui/card";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldLabel,
  FieldTitle,
} from "../ui/field";
import { Checkbox } from "../ui/checkbox";
import { Label } from "../ui/label";
import { Slider } from "../ui/slider";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import { InfoIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { OUTPUT_FORMATS } from "@/lib/constants";

export default function ExportSettings({
  project,
  crop,
  rotation,
  doSplit,
  autoDeskew,
  autoEnhance,
  removeWhitePages,
  jpegQuality,
  targetLang,
  outputFormat,
  onAutoDeskewChange,
  onAutoEnhanceChange,
  onRemoveWhitePagesChange,
  onJpegQualityChange,
  onTargetLangChange,
  onOutputFormatChange,
  onExportStarted,
}: {
  project: string;
  crop: Crop;
  rotation: number;
  doSplit: boolean;
  autoDeskew: boolean;
  autoEnhance: boolean;
  removeWhitePages: boolean;
  jpegQuality: number;
  targetLang: string;
  outputFormat: string;
  onAutoDeskewChange: (v: boolean) => void;
  onAutoEnhanceChange: (v: boolean) => void;
  onRemoveWhitePagesChange: (v: boolean) => void;
  onJpegQualityChange: (v: number) => void;
  onTargetLangChange: (v: string) => void;
  onOutputFormatChange: (v: string) => void;
  onExportStarted: () => void;
}) {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  const exportMutation = useMutation({
    mutationFn: async () => {
      return api.post(`/projects/${project}/export`, {
        rotation,
        do_split: doSplit,
        crop: { x: crop.x, y: crop.y, width: crop.width, height: crop.height },
        target_language: targetLang,
        output_format: outputFormat,
        auto_deskew: autoDeskew,
        auto_enhance: autoEnhance,
        remove_white_pages: removeWhitePages,
        jpeg_quality: jpegQuality,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
      onExportStarted();
    },
    onError: (error) => {
      toast.error(t("export.error"), {
        description: error instanceof Error ? error.message : undefined,
        duration: 5000,
      });
    },
  });

  const translated_output_format = OUTPUT_FORMATS.map((f) => ({
    ...f,
    label: t(f.label),
  }));

  const startExport = () => {
    exportMutation.mutate();
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{t("export.title")}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-8">
            <Field orientation="horizontal">
              <Checkbox
                id="auto-deskew"
                name="auto-deskew"
                checked={autoDeskew}
                onCheckedChange={(v) => onAutoDeskewChange(!!v)}
              />

              <FieldContent>
                <FieldTitle>{t("export.deskew")}</FieldTitle>
                <FieldDescription>{t("export.deskewDesc")}</FieldDescription>
              </FieldContent>
            </Field>
            <Field orientation="horizontal">
              <Checkbox
                id="auto-enhance"
                name="auto-enhance"
                checked={autoEnhance}
                onCheckedChange={(v) => onAutoEnhanceChange(!!v)}
              />

              <FieldContent>
                <FieldTitle>{t("export.contrast")}</FieldTitle>
                <FieldDescription>{t("export.contrastDesc")}</FieldDescription>
              </FieldContent>
            </Field>
            <Field orientation="horizontal">
              <Checkbox
                id="remove-white-pages"
                name="remove-white-pages"
                checked={removeWhitePages}
                onCheckedChange={(v) => onRemoveWhitePagesChange(!!v)}
              />

              <FieldContent>
                <FieldTitle>{t("export.removeWhitePages")}</FieldTitle>
                <FieldDescription>
                  {t("export.removeWhitePagesDesc")}
                </FieldDescription>
              </FieldContent>
            </Field>
            <div className="flex w-full flex-col gap-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium1">
                  {t("export.quality")}
                </span>
                <span className="text-sm text-muted-foreground font-semibold">
                  {jpegQuality}%
                </span>
              </div>
              <Slider
                value={jpegQuality}
                onValueChange={(value) => onJpegQualityChange(value as number)}
                min={30}
                max={100}
              />
            </div>

            <Field>
              <FieldLabel htmlFor="output-format">
                {t("export.outputFormat")}
              </FieldLabel>
              <Select
                items={translated_output_format}
                id="output-format"
                onValueChange={(value) => {
                  if (value) onOutputFormatChange(value);
                }}
                value={outputFormat}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("export.selectOutputFormat")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {translated_output_format.map((format) => (
                      <SelectItem
                        key={format.value}
                        value={format.value}
                      >
                        {format.label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>

            <Field>
              <FieldLabel htmlFor="ocr-language">
                {t("export.ocrLanguage")}
              </FieldLabel>
              <Select
                id="ocr-language"
                onValueChange={(value) => {
                  if (value) onTargetLangChange(value);
                }}
                value={targetLang}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("export.selectLanguage")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="Deutsch">
                      {t("export.german")}
                    </SelectItem>
                    <SelectItem value="English">
                      {t("export.english")}
                    </SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>
          </div>
          <Alert>
            <InfoIcon />
            <AlertTitle>{t("export.bgNote")}</AlertTitle>
            <AlertDescription>{t("export.bgNoteDesc")}</AlertDescription>
          </Alert>
        </CardContent>
        <CardFooter>
          <Button
            className="w-full"
            onClick={startExport}
            disabled={exportMutation.isPending}
          >
            {exportMutation.isPending
              ? t("export.starting")
              : t("export.startProcessing")}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
