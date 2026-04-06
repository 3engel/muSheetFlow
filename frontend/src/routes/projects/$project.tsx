import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useRef } from "react";
import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import FileList from "@/components/job/FileList";
import CropTool from "@/components/CropTool";
import RotationTool from "@/components/job/RotationTool";
import ExportSettings from "@/components/job/ExportSettings";
import type { Crop } from "react-image-crop";
import type { ProjectSettings } from "@/lib/types";
import {
  projectFilesQueryOptions,
  projectSettingsQueryOptions,
  projectSettingsMutationOptions,
} from "@/lib/queries";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { useTranslation } from "react-i18next";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { JobTabs } from "@/components/job/JobTabs";
import { queryClient } from "@/main";

export const Route = createFileRoute("/projects/$project")({
  component: RouteComponent,
  loader: async ({ params, context: { queryClient } }) => {
    const project = decodeURIComponent(params.project);
    await Promise.all([
      queryClient.ensureQueryData(projectFilesQueryOptions(project)),
      queryClient.ensureQueryData(projectSettingsQueryOptions(project)),
    ]);
  },
  staticData: {
    getDynamicTitle: ({ params }) => decodeURIComponent(params.project),
  },
});

function RouteComponent() {
  const { project: encodedProject } = Route.useParams();

  const navigate = useNavigate({ from: Route.fullPath });
  const project = decodeURIComponent(encodedProject);

  const { data: files } = useSuspenseQuery(projectFilesQueryOptions(project));

  const { data: settings } = useSuspenseQuery(
    projectSettingsQueryOptions(project),
  );

  const settingsMutation = useMutation(projectSettingsMutationOptions());

  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);
  const updateSettings = useCallback(
    (updates: Partial<ProjectSettings>) => {
      const next = { ...settings, ...updates };

      queryClient.setQueryData(["project-settings", project], next);

      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        settingsMutation.mutate({ projectName: project, settings: next });
      }, 500);
    },
    [settings, project, settingsMutation],
  );

  const crop: Crop = {
    unit: "%",
    x: settings.crop_x,
    y: settings.crop_y,
    width: settings.crop_w,
    height: settings.crop_h,
  };

  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-2">
      <h1 className="text-2xl font-semibold flex items-center">{project}</h1>
      <Tabs
        value={settings.tab}
        onValueChange={(v) => updateSettings({ tab: v })}
      >
        <ScrollArea className="md:hidden">
          <JobTabs
            files={files}
            className="mb-3"
          />
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
        <JobTabs
          files={files}
          className="hidden md:block mx-auto"
        />

        <TabsContent value="upload">
          <FileList
            project={project}
            files={files}
          />
        </TabsContent>
        <TabsContent value="rotate">
          <RotationTool
            project={project}
            rotationValue={settings.rotation}
            doSplitValue={settings.do_split}
            onRotatationChange={(rot) => updateSettings({ rotation: rot })}
            onSplitChange={(split) => updateSettings({ do_split: split })}
          />
        </TabsContent>
        <TabsContent value="crop">
          <CropTool
            project={project}
            cropValue={crop}
            rotation={settings.rotation}
            doSplit={settings.do_split}
            onCropChange={(c) =>
              updateSettings({
                crop_x: c.x,
                crop_y: c.y,
                crop_w: c.width,
                crop_h: c.height,
              })
            }
          />
        </TabsContent>
        <TabsContent value="settings">
          <ExportSettings
            project={project}
            crop={crop}
            rotation={settings.rotation}
            doSplit={settings.do_split}
            autoDeskew={settings.auto_deskew}
            autoEnhance={settings.auto_enhance}
            jpegQuality={settings.jpeg_quality}
            targetLang={settings.target_language}
            onAutoDeskewChange={(v) => updateSettings({ auto_deskew: v })}
            onAutoEnhanceChange={(v) => updateSettings({ auto_enhance: v })}
            onJpegQualityChange={(v) => updateSettings({ jpeg_quality: v })}
            onTargetLangChange={(v) => updateSettings({ target_language: v })}
            onExportStarted={() => navigate({ to: "/jobs" })}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
