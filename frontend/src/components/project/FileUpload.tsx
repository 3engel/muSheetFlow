import { useCallback, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useDropzone } from "react-dropzone";
import {
  CopyX,
  FilePlus,
  FileText,
  Loader2,
  UploadCloud,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn, formatFileSize } from "@/lib/utils";
import { api } from "@/lib/api";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "../ui/sheet";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

type FileUploadProps = {
  project: string;
  onUploadComplete: () => void;
};

export default function FileUpload({
  project,
  onUploadComplete,
}: FileUploadProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const { t } = useTranslation();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setFiles((previousFiles) => {
      const existingKeys = new Set(
        previousFiles.map(
          (file) => `${file.name}-${file.size}-${file.lastModified}`,
        ),
      );

      const uniqueFiles = acceptedFiles.filter((file) => {
        const key = `${file.name}-${file.size}-${file.lastModified}`;
        return !existingKeys.has(key);
      });

      return [...previousFiles, ...uniqueFiles];
    });
  }, []);

  const { getInputProps, getRootProps, isDragActive, open } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"] },
    noClick: true,
  });

  const uploadMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      await api.post(`/projects/${project}/upload`, formData, {
        onUploadProgress: (progressEvent) => {
          const progress = Math.round(
            (progressEvent.loaded * 100) / (progressEvent.total || 1),
          );
          setUploadProgress(progress);
        },
      });
    },
    onSuccess: () => {
      setFiles([]);
      onUploadComplete();
      setUploadOpen(false);
      toast.success(t("upload.success"));
    },
  });

  const uploadFiles = () => {
    if (files.length === 0) {
      return;
    }

    const formData = new FormData();
    files.forEach((file) => formData.append("files", file));
    uploadMutation.mutate(formData);
  };

  const removePendingFile = (fileToRemove: File) => {
    setFiles((currentFiles) =>
      currentFiles.filter(
        (file) =>
          !(
            file.name === fileToRemove.name &&
            file.size === fileToRemove.size &&
            file.lastModified === fileToRemove.lastModified
          ),
      ),
    );
  };

  return (
    <Sheet
      open={uploadOpen}
      onOpenChange={(open) => setUploadOpen(open)}
    >
      <SheetTrigger
        render={
          <Button>
            <FilePlus /> {t("upload.addPdfs")}
          </Button>
        }
      />
      <SheetContent className="min-w-full md:min-w-3/4 lg:min-w-1/2">
        <SheetHeader>
          <SheetTitle>{t("upload.title")}</SheetTitle>
          <SheetDescription>
            {t("upload.description")}
          </SheetDescription>
        </SheetHeader>
        <div className="overflow-y-auto px-4 flex flex-col gap-4">
          <div
            {...getRootProps()}
            className={cn(
              "rounded-xl border border-dashed px-6 py-3 transition-colors",
              isDragActive
                ? "border-primary bg-primary/5"
                : "border-border bg-muted/20",
            )}
          >
            <input {...getInputProps()} />
            <div className="flex flex-col items-center text-center">
              <div className="mb-4 rounded-full bg-background p-3 ring-1 ring-border">
                <UploadCloud className="size-6 text-muted-foreground" />
              </div>
              <p className="text-base font-medium">
                {isDragActive
                  ? t("upload.dropHere")
                  : t("upload.dragDrop")}
              </p>
              <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                {t("upload.multipleAllowed")}
              </p>
              <Button
                className="mt-4"
                variant="outline"
                type="button"
                onClick={open}
              >
                {t("upload.selectFiles")}
              </Button>
            </div>
          </div>

          <div className="flex justify-between">
            <div className="flex flex-col">
              <h2 className="font-semibold">{t("upload.queue")}</h2>
              <span className="text-sm text-muted-foreground">
                {files.length === 0
                  ? t("upload.noFiles")
                  : t("upload.filesReady", { count: files.length })}
              </span>
            </div>
            {files.length > 0 && (
              <Button
                variant="destructive"
                size="sm"
                type="button"
                onClick={() => setFiles([])}
              >
                <CopyX />
                {t("upload.clearQueue")}
              </Button>
            )}
          </div>

          <div className="flex flex-col gap-2">
            {files.map((file) => (
              <div
                key={`${file.name}-${file.size}-${file.lastModified}`}
                className="flex items-center gap-2 rounded-lg border px-3 py-2"
              >
                <div className="rounded-md bg-muted p-2">
                  <FileText className="size-4 text-muted-foreground" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(file.size)}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  type="button"
                  disabled={uploadMutation.isPending}
                  onClick={() => removePendingFile(file)}
                  aria-label={t("upload.remove", { name: file.name })}
                >
                  <X />
                </Button>
              </div>
            ))}
          </div>
        </div>
        <SheetFooter>
          <Button
            type="button"
            onClick={uploadFiles}
            disabled={files.length === 0 || uploadMutation.isPending}
            className="relative overflow-hidden"
          >
            {uploadMutation.isPending && (
              <span
                className="absolute inset-y-0 left-0 bg-white/20 transition-[width]"
                style={{ width: `${uploadProgress}%` }}
                aria-hidden="true"
              />
            )}
            <span className="relative z-10 flex items-center gap-2">
              {uploadMutation.isPending ? (
                <Loader2 className="animate-spin" />
              ) : null}
              {uploadMutation.isPending
                ? uploadProgress > 0 && uploadProgress < 100
                  ? `${uploadProgress}%`
                  : t("upload.uploading")
                : t("upload.startUpload")}
            </span>
          </Button>
          <SheetClose render={<Button variant="outline">{t("upload.cancel")}</Button>} />
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
