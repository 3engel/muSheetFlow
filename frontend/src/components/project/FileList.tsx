import { CheckSquare, CircleX, Scissors } from "lucide-react";
import { Button } from "../ui/button";
import { useState } from "react";
import { Checkbox } from "../ui/checkbox";
import { useMutation, useQuery } from "@tanstack/react-query";
import { projectFilesDeleteMutationOptions, projectSettingsQueryOptions } from "@/lib/queries";
import { queryClient } from "@/main";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { FileInfo } from "@/lib/types";
import { formatFileSize } from "@/lib/utils";
import FileUpload from "./FileUpload";
import { useTranslation } from "react-i18next";
import SplitByVoicesDialog from "./SplitByVoicesDialog";

export default function FileList({
  project,
  files,
}: {
  project: string;
  files: FileInfo[];
}) {
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set([]));
  const [splitFile, setSplitFile] = useState<string | null>(null);
  const { t, i18n } = useTranslation();
  const { data: settings } = useQuery(projectSettingsQueryOptions(project));

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedRows(new Set(files.map((f) => f.filename)));
    } else {
      setSelectedRows(new Set());
    }
  };

  const selectAll = selectedRows.size === files.length && files.length > 0;

  const handleSelectRow = (file: string, checked: boolean) => {
    const newSelected = new Set(selectedRows);
    if (checked) {
      newSelected.add(file);
    } else {
      newSelected.delete(file);
    }
    setSelectedRows(newSelected);
  };

  const removeFilesMutation = useMutation({
    ...projectFilesDeleteMutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["project-files", project],
        refetchType: "all",
      });
      toast.success(t("files.deleted"));
      setSelectedRows(new Set());
    },
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <FileUpload
          project={project}
          onUploadComplete={() =>
            queryClient.invalidateQueries({
              queryKey: ["project-files", project],
              refetchType: "all",
            })
          }
        />
      </div>
      {files.length === 0 ? (
        <p className="text-muted-foreground text-center">
          {t("files.empty")}
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <Checkbox
                  id="select-all-checkbox"
                  name="select-all-checkbox"
                  checked={selectAll}
                  onCheckedChange={(checked) =>
                    handleSelectAll(checked === true)
                  }
                />
              </TableHead>
              <TableHead className="flex items-center">
                {selectedRows.size > 0 ? (
                  <div className="flex items-center gap-2">
                    <div className="flex gap-2">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <CheckSquare className="size-4" />
                        <span>
                          {t("files.selected", { selected: selectedRows.size, total: files.length })}
                        </span>
                      </div>
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      type="button"
                      disabled={
                        selectedRows.size === 0 || removeFilesMutation.isPending
                      }
                      onClick={() => {
                        removeFilesMutation.mutate({
                          projectName: project,
                          files: Array.from(selectedRows),
                        });
                      }}
                    >
                      <CircleX />
                      {t("files.deleteSelected")}
                    </Button>
                  </div>
                ) : (
                  <span>{t("files.filename")}</span>
                )}
              </TableHead>
              <TableHead className="text-right">{t("files.size")}</TableHead>
              <TableHead className="text-right">{t("files.createdAt")}</TableHead>
              <TableHead className="text-right">{t("files.actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {files.map((file) => (
              <TableRow key={file.filename}>
                <TableCell className="w-8">
                  <Checkbox
                    id={`file-${file.filename}-checkbox`}
                    name={`file-${file.filename}-checkbox`}
                    checked={selectedRows.has(file.filename)}
                    onCheckedChange={(checked) =>
                      handleSelectRow(file.filename, checked === true)
                    }
                  />
                </TableCell>
                <TableCell className="w-full">{file.filename}</TableCell>
                <TableCell className="text-right">
                  {" "}
                  {formatFileSize(file.size)}
                </TableCell>
                <TableCell className="text-right">
                  {new Date(file.created_at).toLocaleString(i18n.language === "de" ? "de-DE" : "en-US", {
                    dateStyle: "short",
                    timeStyle: "short",
                  })}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => setSplitFile(file.filename)}
                    aria-label={t("files.splitVoices")}
                    title={t("files.splitVoices")}
                  >
                    <Scissors className="size-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
      {splitFile && (
        <SplitByVoicesDialog
          project={project}
          filename={splitFile}
          targetLanguage={settings?.target_language ?? "Deutsch"}
          open={splitFile !== null}
          onOpenChange={(open) => {
            if (!open) setSplitFile(null);
          }}
        />
      )}
    </div>
  );
}
