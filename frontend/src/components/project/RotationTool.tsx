import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { RotateCw, RotateCcw, Loader2 } from "lucide-react";
import { Field, FieldGroup } from "../ui/field";
import { Checkbox } from "../ui/checkbox";
import { Label } from "../ui/label";
import { Card, CardContent, CardDescription, CardHeader } from "../ui/card";
import { useTranslation } from "react-i18next";
import { API_BASE_URL } from "@/lib/api";

export default function RotationTool({
  project,
  rotationValue,
  doSplitValue,
  onRotatationChange,
  onSplitChange,
}: {
  project: string;
  rotationValue: number;
  doSplitValue: boolean;
  onRotatationChange: (rotation: number) => void;
  onSplitChange: (doSplit: boolean) => void;
}) {
  const [rotation, setRotation] = useState<number>(rotationValue);
  const [doSplit, setDoSplit] = useState<boolean>(doSplitValue);
  const [loading, setLoading] = useState(true);
  const { t } = useTranslation();

  const handleRotateRight = () => {
    setLoading(true);
    setRotation((prev) => (prev - 90 < 0 ? 270 : prev - 90));
  };
  const handleRotateLeft = () => {
    setLoading(true);
    setRotation((prev) => (prev + 90) % 360);
  };
  const handleSplitChange = (val: boolean) => {
    setLoading(true);
    setDoSplit(val);
  };

  const imageUrl = useMemo(() => {
    return `${API_BASE_URL}/projects/${project}/overlay?base_rotation=${rotation}&do_split=${doSplit}&single_file=true&t=${Date.now()}`;
  }, [project, rotation, doSplit]);

  useEffect(() => {
    onRotatationChange(rotation);
  }, [rotation]);

  useEffect(() => {
    onSplitChange(doSplit);
  }, [doSplit]);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardDescription>{t("rotation.description")}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <FieldGroup className="max-w-sm">
            <Field orientation="horizontal">
              <Checkbox
                id="split"
                name="split"
                checked={doSplit}
                onCheckedChange={handleSplitChange}
              />
              <Label htmlFor="split">{t("rotation.splitA3")}</Label>
            </Field>
          </FieldGroup>
          <div className="flex gap-2 justify-end">
            <Button
              variant="outline"
              onClick={handleRotateLeft}
            >
              <RotateCcw /> {t("rotation.left")}
            </Button>
            <Button
              variant="outline"
              onClick={handleRotateRight}
            >
              <RotateCw /> {t("rotation.right")}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="border p-4 rounded-xl flex justify-center items-start w-full overflow-auto relative">
        {loading && (
          <div className="absolute inset-0 bg-muted-foreground/20 flex flex-col justify-center items-center z-10">
            <Loader2 className="h-10 w-10 animate-spin text-muted" />
          </div>
        )}
        <img
          src={imageUrl}
          alt="Vorschau"
          className={`max-w-full h-auto object-contain transition-opacity duration-200 ${loading ? "opacity-50" : "opacity-100"}`}
          onLoad={() => setLoading(false)}
          onError={() => setLoading(false)}
        />
      </div>
    </div>
  );
}
