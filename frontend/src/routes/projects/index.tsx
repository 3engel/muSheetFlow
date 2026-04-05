import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  AlertCircleIcon,
  Edit2,
  FileText,
  Loader2,
  Music,
  Plus,
  Trash2,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  projectsQueryOptions,
  projectCreateMutationOptions,
  projectDeleteMutationOptions,
} from "../../lib/queries";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { queryClient } from "@/main";
import { Project } from "@/lib/types";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

export const Route = createFileRoute("/projects/")({
  component: RouteComponent,
  loader: async ({ context: { queryClient } }) => {
    return await queryClient.ensureQueryData(projectsQueryOptions());
  },
});

function RouteComponent() {
  const [newProjectName, setNewProjectName] = useState("");
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const { data: projects } = useSuspenseQuery(projectsQueryOptions());
  const navigate = useNavigate({ from: Route.fullPath });
  const { t } = useTranslation();

  const newProjectMutation = useMutation({
    ...projectCreateMutationOptions(),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast.success(t("projects.created", { name: variables }));
      navigate({ to: `/projects/$project`, params: { project: variables } });
    },
  });

  const deleteProjectMutation = useMutation({
    ...projectDeleteMutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["projects"],
        refetchType: "all",
      });
      toast.success(t("projects.deleted", { name: projectToDelete?.name }));
      setProjectToDelete(null);
    },
  });

  return (
    <div>
      <Card className="w-full max-w-xl lg:w-xl shadow-lg mx-auto card-highlight">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto bg-primary/50 w-12 h-12 flex items-center justify-center rounded-full mb-4 ring-4">
            <Plus className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">
            {t("projects.newProject")}
          </CardTitle>
          <CardDescription className="text-base mt-2">
            {t("projects.newProjectDesc")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-4">
          <Input
            className="h-12 text-lg shadow-sm"
            placeholder={t("projects.placeholder")}
            value={newProjectName}
            onChange={(e) => setNewProjectName(e.target.value)}
            onKeyDown={(e) =>
              e.key === "Enter" && newProjectMutation.mutate(newProjectName)
            }
          />
        </CardContent>
        <CardFooter>
          <Button
            onClick={() => newProjectMutation.mutate(newProjectName)}
            size="lg"
            className="w-full text-base"
            disabled={newProjectMutation.isPending || newProjectName.trim() === ""}
          >
            {newProjectMutation.isPending ? (
              <>
                <Loader2 className="animate-spin" />
                {t("projects.creating")}
              </>
            ) : (
              t("projects.startProject")
            )}
          </Button>
        </CardFooter>
      </Card>
      <div className="mt-12 space-y-6">
        <div className="flex flex-col items-center gap-2 mb-4">
          <Separator />
          <h3 className="font-medium uppercase tracking-wider  px-4">
            {t("projects.continueProject")}
          </h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 border-t-0">
          {projects.map((p) => (
            <Card
              key={p.name}
              className="hover:bg-muted transition-all cursor-pointer card-highlight"
              onClick={() =>
                navigate({
                  to: `/projects/$project`,
                  params: { project: p.name },
                })
              }
            >
              <CardHeader>
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <Music />
                  <h4>{p.name}</h4>
                </CardTitle>
              </CardHeader>
              <CardContent className="flex items-center justify-end gap-2">
                <span>{t("projects.contains")}</span>
                <Badge
                  variant="secondary"
                  className="text-sm p-3"
                >
                  <FileText />
                  {t("projects.file", { count: p.file_count })}
                </Badge>
              </CardContent>
              <CardFooter className="gap-2 flex-col">
                <Button
                  size="lg"
                  className="w-full"
                  onClick={() =>
                    navigate({
                      to: `/projects/$project`,
                      params: { project: p.name },
                    })
                  }
                >
                  <Edit2 /> {t("projects.edit")}
                </Button>
                <Button
                  variant="destructive"
                  className="w-full"
                  onClick={(e) => {
                    e.stopPropagation();
                    setProjectToDelete(p);
                  }}
                >
                  <Trash2 /> {t("projects.delete")}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        <Dialog
          open={projectToDelete !== null}
          onOpenChange={(open) => !open && setProjectToDelete(null)}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {t("projects.deleteTitle", { name: projectToDelete?.name })}
              </DialogTitle>
              <DialogDescription
                className="flex flex-col gap-2"
                render={<div />}
              >
                <p>
                  {t("projects.deleteConfirm", { name: projectToDelete?.name })}
                </p>
                <Alert
                  variant="destructive"
                  className="max-w-md"
                >
                  <AlertCircleIcon />

                  <AlertDescription>
                    {t("projects.deleteWarning")}
                  </AlertDescription>
                </Alert>
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="mt-4">
              <Button
                variant="outline"
                onClick={() => setProjectToDelete(null)}
              >
                {t("projects.cancel")}
              </Button>
              <Button
                variant="destructive"
                onClick={() =>
                  deleteProjectMutation.mutate(projectToDelete!.name)
                }
              >
                {t("projects.deleteForever")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
