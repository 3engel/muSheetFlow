import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { createFileRoute } from "@tanstack/react-router";
import { Download, Loader2, Package, Save } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  jobDetailsQueryOptions,
  jobResultsQueryOptions,
  mappingsQueryOptions,
  jobFinalizeMutationOptions,
  jobLanguageMutationOptions,
  jobResultsMutationOptions,
} from "../../lib/queries";
import { Input } from "@/components/ui/input";
import { JobResult } from "@/lib/types";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { LoadingActivity } from "@/components/LoadingActivity";
import { queryClient } from "@/main";
import { toast } from "sonner";
import { KEYS, VOICES } from "@/lib/constants";

export const Route = createFileRoute("/jobs/$jobid")({
  component: RouteComponent,
  loader: async ({ params: { jobid }, context: { queryClient } }) => {
    return {
      jobDetails: await queryClient.ensureQueryData(
        jobDetailsQueryOptions(jobid),
      ),
      jobResults: await queryClient.ensureQueryData(
        jobResultsQueryOptions(jobid),
      ),
      mappings: await queryClient.ensureQueryData(mappingsQueryOptions()),
    };
  },
  staticData: {
    title: "Job Details",
    getDynamicTitle: ({ loaderData: { jobDetails } }) =>
      `${jobDetails.project}`,
  },
});

function RouteComponent() {
  const { jobid } = Route.useParams();
  const { data: jobDetails, isLoading: isLoadingJobDetails } = useSuspenseQuery(
    jobDetailsQueryOptions(jobid),
  );
  const { data: jobResults, isLoading: isLoadingJobResults } = useSuspenseQuery(
    jobResultsQueryOptions(jobid),
  );
  const { data: mappings, isLoading: isLoadingMappings } = useSuspenseQuery(
    mappingsQueryOptions(),
  );

  const [results, setResults] = useState(jobResults);
  const mutateJobLanguage = useMutation(jobLanguageMutationOptions());
  const mutateJobResults = useMutation(jobResultsMutationOptions());

  const mutateJobFinalize = useMutation({
    ...jobFinalizeMutationOptions(),
    onSuccess: (_, { jobId }) => {
      queryClient.invalidateQueries({
        queryKey: ["jobs"],
        refetchType: "all",
      });
      toast.success("Job erfolgreich fertiggestellt!");
    },
  });

  const instrumentsList = Array.from(
    new Set(
      mappings.map((m) => m.Deutsch || m.English).filter(Boolean) as string[],
    ),
  );

  const [selectedResult, setSelectedResult] = useState<JobResult | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const changeLanguage = async (newLang: string) => {
    mutateJobLanguage.mutate({ newLang, jobId: jobid });
  };

  const showLoader =
    isLoadingJobDetails ||
    isLoadingJobResults ||
    isLoadingMappings ||
    mutateJobLanguage.isPending ||
    mutateJobResults.isPending ||
    mutateJobFinalize.isPending;

  const handleAssignment = (
    index: number,
    field: "instrument" | "voice" | "key",
    val: string,
  ) => {
    setResults((prev) => {
      const copy = [...prev];
      copy[index][field] = val;
      return copy;
    });
  };

  const getPreviewFileName = useMemo(
    () => (r: JobResult) => {
      const instrumentPart = r.instrument ? `${r.instrument} ` : "";
      const voicePart = r.voice ? `${r.voice} ` : "";
      const keyPart = r.key ? `${r.key}` : "";
      return `${jobDetails.project} - ${instrumentPart}${voicePart}${keyPart}.pdf`.trim();
    },
    [jobDetails.project],
  );

  useEffect(() => {
    setIsPreviewOpen(selectedResult !== null);
  }, [selectedResult]);

  useEffect(() => {
    setResults(jobResults);
  }, [jobResults]);

  return (
    <div className="flex flex-col gap-2 h-[calc(100vh-96px)]">
      <LoadingActivity showLoader={showLoader} />
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold">Instrumente zuweisen</h1>
        <div className="flex items-center gap-2 mt-1">
          <span className="">
            Ausgabesprache der Instrumente für Dateinamen
          </span>
          <Select
            value={jobDetails.target_language}
            onValueChange={(value) => value && changeLanguage(value)}
          >
            <SelectTrigger className="">
              <SelectValue placeholder="Sprache für Instrumente auswählen" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Sprachen</SelectLabel>
                <SelectItem value="Deutsch">Deutsch</SelectItem>
                <SelectItem value="English">English</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
        <div className="flex gap-2 justify-end">
          <Button
            variant="outline"
            size="lg"
            onClick={() => mutateJobResults.mutate({ jobId: jobid, results })}
            disabled={mutateJobResults.isPending}
          >
            {mutateJobResults.isPending ? (
              <Loader2 className="animate-spin" />
            ) : (
              <Save />
            )}
            Zwischenspeichern
          </Button>
          <Button
            size="lg"
            onClick={() => mutateJobFinalize.mutate({ jobId: jobid, results })}
            disabled={mutateJobFinalize.isPending}
          >
            {mutateJobFinalize.isPending ? (
              <Loader2 className="animate-spin" />
            ) : (
              <Package />
            )}
            Fertigstellen
          </Button>
          {jobDetails.status === "completed" && jobDetails.result_file && (
            <Button
              size="lg"
              variant="outline"
              nativeButton={false}
              render={
                <a
                  href={`${import.meta.env.VITE_API_URL}/exports/${jobDetails.result_file}`}
                  download
                />
              }
            >
              <Download />
              ZIP Herunterladen
            </Button>
          )}
        </div>
      </div>
      <ScrollArea className="flex-1 grow min-h-90 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 3xl:grid-cols-5 gap-4">
          {results.map((r, idx) => (
            <Card
              className="pt-0"
              key={idx}
            >
              <div className="w-full h-40 overflow-hidden border cursor-zoom-in hover:opacity-80 relative">
                <img
                  src={`${import.meta.env.VITE_API_URL}/exports/${jobid}/${r.temp_file.replace(".pdf", "_thumb.jpg")}`}
                  className="absolute max-w-none"
                  onClick={() => setSelectedResult(r)}
                  style={{
                    width: "800px",
                    top: "0",
                    left: "0",
                  }}
                />
              </div>
              <CardHeader>
                <CardDescription>Export Dateiname</CardDescription>
                <CardTitle
                  className="text-xs truncate"
                  title={getPreviewFileName(r)}
                >
                  {getPreviewFileName(r)}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid-cols-[minmax(100px,1fr)_90px_80px] grid gap-2">
                  <Combobox
                    items={instrumentsList}
                    value={
                      instrumentsList.includes(r.instrument) ? r.instrument : ""
                    }
                    onValueChange={(value) => {
                      if (value !== null) {
                        handleAssignment(idx, "instrument", value);
                      }
                    }}
                  >
                    <ComboboxInput
                      placeholder="Instrument wählen"
                      className="w-full"
                    />
                    <ComboboxContent>
                      <ComboboxEmpty>Instrument nicht vorhanden.</ComboboxEmpty>
                      <ComboboxList>
                        {(item) => (
                          <ComboboxItem
                            key={item}
                            value={item}
                          >
                            {item}
                          </ComboboxItem>
                        )}
                      </ComboboxList>
                    </ComboboxContent>
                  </Combobox>

                  <Select
                    items={VOICES.map((v) => ({ value: v, label: v }))}
                    value={r.voice || ""}
                    onValueChange={(value) => {
                      if (value !== null) {
                        handleAssignment(idx, "voice", value);
                      }
                    }}
                  >
                    <SelectTrigger className="w-full text-xs">
                      <SelectValue placeholder="Stimme" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectLabel>Stimme</SelectLabel>
                        {VOICES.map((item) => (
                          <SelectItem
                            key={item === "" ? "none" : item}
                            value={item}
                          >
                            {item === "" ? "Keine" : item}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>

                  <Select
                    items={KEYS.map((v) => ({ value: v, label: v }))}
                    value={r.key || ""}
                    onValueChange={(value) => {
                      if (value !== null) handleAssignment(idx, "key", value);
                    }}
                  >
                    <SelectTrigger className="w-full text-xs">
                      <SelectValue placeholder="Tonart" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectLabel>Tonart</SelectLabel>
                        {KEYS.map((item) => (
                          <SelectItem
                            key={item === "" ? "none" : item}
                            value={item}
                          >
                            {item === "" ? "Keine" : item}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>

                  <Input
                    value={r.instrument || ""}
                    onChange={(e) =>
                      handleAssignment(idx, "instrument", e.target.value)
                    }
                  />
                  <Input
                    value={r.voice || ""}
                    onChange={(e) =>
                      handleAssignment(idx, "voice", e.target.value)
                    }
                  />
                  <Input
                    value={r.key || ""}
                    onChange={(e) =>
                      handleAssignment(idx, "key", e.target.value)
                    }
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </ScrollArea>
      <Sheet
        open={isPreviewOpen}
        onOpenChange={() => {
          setIsPreviewOpen(false);
        }}
        onOpenChangeComplete={(open) => {
          if (!open) setSelectedResult(null);
        }}
      >
        <SheetContent className="min-w-full md:min-w-3/4 lg:min-w-1/2">
          <SheetHeader>
            <SheetTitle>Vorschau / OCR Ergebnis</SheetTitle>
            <SheetDescription>{selectedResult?.raw_ocr || ""}</SheetDescription>
          </SheetHeader>
          <div className="px-4 overflow-y-auto flex flex-col gap-2">
            <img
              src={`${import.meta.env.VITE_API_URL}/exports/${jobid}/${selectedResult?.temp_file.replace(".pdf", "_thumb.jpg")}`}
              alt="Ausschnitt"
            />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
