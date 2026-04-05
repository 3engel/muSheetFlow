import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import FileList from "@/components/FileList";
import CropTool from "@/components/CropTool";
import RotationTool from "@/components/RotationTool";
import ExportSettings from "@/components/ExportSettings";
import type { Crop } from "react-image-crop";
import { projectFilesQueryOptions } from "@/lib/queries";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
export const Route = createFileRoute("/projects/$project")({
  component: RouteComponent,
  loader: async ({ params, context: { queryClient } }) => {
    const project = decodeURIComponent(params.project);
    await queryClient.ensureQueryData(projectFilesQueryOptions(project));
  },
  staticData: {
    getDynamicTitle: ({ params }) => decodeURIComponent(params.project),
  },
});

function RouteComponent() {
  const { project: encodedProject } = Route.useParams();

  const navigate = useNavigate({ from: Route.fullPath });
  const project = decodeURIComponent(encodedProject);

  const { data: files, isLoading } = useSuspenseQuery(
    projectFilesQueryOptions(project),
  );

  const [rotation, setRotation] = useState<number>(0);
  const [doSplit, setDoSplit] = useState<boolean>(false);
  const [crop, setCrop] = useState<Crop | null>({
    unit: "%",
    x: 5,
    y: 5,
    width: 90,
    height: 90,
  });

  return (
    <div className="flex flex-col gap-2">
      <h1 className="text-2xl font-semibold flex items-center">{project}</h1>
      <Tabs defaultValue="upload">
        <TabsList
          variant="line"
          className="mx-auto"
        >
          <TabsTrigger value="upload">PDFs verwalten</TabsTrigger>
          <TabsTrigger
            value="rotate"
            disabled={files.length === 0}
          >
            Formatierung anpassen
          </TabsTrigger>
          <TabsTrigger
            value="crop"
            disabled={files.length === 0}
          >
            Zuschnitt
          </TabsTrigger>
          <TabsTrigger
            value="settings"
            disabled={files.length === 0}
          >
            Exporteinstellungen
          </TabsTrigger>
        </TabsList>
        <TabsContent value="upload">
          <FileList
            project={project}
            files={files}
          />
        </TabsContent>
        <TabsContent value="rotate">
          <RotationTool
            project={project}
            rotationValue={rotation}
            doSplitValue={doSplit}
            onRotatationChange={(rot) => {
              setRotation(rot);
            }}
            onSplitChange={(split) => {
              setDoSplit(split);
            }}
          />
        </TabsContent>
        <TabsContent value="crop">
          <CropTool
            project={project}
            cropValue={crop}
            rotation={rotation}
            doSplit={doSplit}
            onCropChange={(c) => {
              setCrop(c);
            }}
          />
        </TabsContent>
        <TabsContent value="settings">
          {crop && (
            <ExportSettings
              project={project}
              crop={crop}
              rotation={rotation}
              doSplit={doSplit}
              onExportStarted={() => navigate({ to: "/jobs" })}
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
