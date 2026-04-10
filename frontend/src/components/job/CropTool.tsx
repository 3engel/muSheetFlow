import { useEffect, useMemo, useState } from "react";
import ReactCrop, { type Crop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import { Card, CardDescription, CardHeader } from "../ui/card";
import { Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { API_BASE_URL } from "@/lib/api";

export default function CropTool({
  project,
  rotation,
  doSplit,
  cropValue,
  onCropChange,
}: {
  project: string;
  rotation: number;
  doSplit: boolean;
  cropValue: Crop | null;
  onCropChange: (crop: Crop) => void;
}) {
  const [crop, setCrop] = useState<Crop>(
    cropValue || {
      unit: "%",
      x: 5,
      y: 5,
      width: 90,
      height: 90,
    },
  );
  const [loading, setLoading] = useState(true);
  const { t } = useTranslation();

  useEffect(() => {
    onCropChange(crop);
  }, [crop]);

  const imageUrl = useMemo(() => {
    return `${API_BASE_URL}/projects/${project}/overlay?base_rotation=${rotation}&do_split=${doSplit}&single_file=false`;
  }, [project, rotation, doSplit]);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardDescription>
            <p>
              {t("crop.instruction")}
            </p>
            <p>
              {t("crop.info")}
            </p>
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="border p-4 rounded-xl flex justify-center items-start w-full overflow-auto relative">
        {loading && (
          <div className="absolute inset-0 bg-muted-foreground/20 flex flex-col justify-center items-center z-10">
            <div className="flex flex-col gap-1 justify-center items-center">
              <Loader2 className="h-10 w-10 animate-spin " />
              {t("crop.loading")}
            </div>
          </div>
        )}

        <ReactCrop
          crop={crop}
          onChange={(c, percentCrop) => setCrop(percentCrop)}
          disabled={loading}
        >
          <img
            src={imageUrl}
            alt="Overlay der gesamten Notenblätter"
            className={`max-w-full h-auto min-h-80 object-contain transition-opacity duration-200 ${loading ? "opacity-50" : "opacity-100"}`}
            onLoad={() => setLoading(false)}
            onError={() => setLoading(false)}
          />
        </ReactCrop>
      </div>
    </div>
  );
}
