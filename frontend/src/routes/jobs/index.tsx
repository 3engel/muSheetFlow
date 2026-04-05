import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Package, RefreshCcw, Trash2, Waypoints } from "lucide-react";
import {
  jobsQueryOptions,
  jobDeleteMutationOptions,
  jobRefreshMutationOptions,
} from "../../lib/queries";
import { toast } from "sonner";
import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useEffect, useState } from "react";
import { Job } from "@/lib/types";
import { queryClient } from "@/main";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { JobStatus } from "@/components/StatusBadges";
import { cn } from "@/lib/utils";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";

export const Route = createFileRoute("/jobs/")({
  component: JobsPage,
  loader: async ({ context: { queryClient } }) => {
    return await queryClient.ensureQueryData(jobsQueryOptions());
  },
});

function JobsPage() {
  const { data: jobs, isPending } = useSuspenseQuery(jobsQueryOptions());
  const [jobToDelete, setJobToDelete] = useState<Job | null>(null);

  const navigate = useNavigate({ from: Route.fullPath });

  const deleteMutation = useMutation({
    ...jobDeleteMutationOptions(),
    onSuccess: (_, job) => {
      queryClient.invalidateQueries({
        queryKey: ["jobs"],
        refetchType: "all",
      });
      toast.success(`Job ${job} erfolgreich gelöscht`);
      setJobToDelete(null);
    },
  });

  const refreshMutation = useMutation(jobRefreshMutationOptions());

  useEffect(() => {
    const eventSource = new EventSource(
      `${import.meta.env.VITE_API_URL}/jobs/stream`,
    );

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.jobs || Array.isArray(data)) {
          queryClient.setQueryData(["jobs"], data.jobs || data || []);
        }
      } catch (err) {
        console.error("Error parsing stream", err);
      }
    };

    return () => eventSource.close();
  }, []);

  return (
    <div className="flex flex-col gap-2">
      <h1 className="text-2xl font-bold">Jobs</h1>

      <Table className="rounded-header-md">
        <TableHeader className="bg-muted">
          <TableRow>
            <TableHead>Projekt</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">
              <Button
                title="Refresh job list"
                variant="ghost"
                onClick={() => refreshMutation.mutate()}
                disabled={refreshMutation.isPending || isPending}
              >
                <RefreshCcw
                  className={cn(
                    refreshMutation.isPending || isPending
                      ? "animate-spin"
                      : "",
                  )}
                />
              </Button>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {jobs.map((job) => (
            <TableRow key={job.id}>
              <TableCell
                className="w-full cursor-pointer"
                onClick={() =>
                  navigate({ to: `/jobs/$jobid`, params: { jobid: job.id } })
                }
              >
                <HoverCard>
                  <HoverCardTrigger className="font-medium">
                    {job.project}
                  </HoverCardTrigger>
                  <HoverCardContent className="flex flex-col gap-2 w-fit">
                    <div className="font-semibold">{job.project}</div>
                    <div className="text-xs text-muted-foreground text-nowrap">
                      {job.id}
                    </div>
                    <JobStatus job={job} />
                  </HoverCardContent>
                </HoverCard>
              </TableCell>
              <TableCell>
                <JobStatus job={job} />
              </TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger render={<Button variant="ghost" />}>
                    ...
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className="w-48"
                  >
                    <DropdownMenuGroup>
                      <DropdownMenuItem
                        onClick={() =>
                          navigate({
                            to: `/jobs/$jobid`,
                            params: { jobid: job.id },
                          })
                        }
                      >
                        <Waypoints /> Instrumente zuweisen
                      </DropdownMenuItem>
                      {job.status === "completed" && job.result_file && (
                        <DropdownMenuItem
                          onClick={() =>
                            window.open(
                              `${import.meta.env.VITE_API_URL}/exports/${job.result_file}`,
                              "_blank",
                            )
                          }
                        >
                          <Package /> ZIP Herunterladen
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuGroup>
                    <DropdownMenuSeparator />
                    <DropdownMenuGroup>
                      <DropdownMenuItem
                        onClick={() => setJobToDelete(job)}
                        variant="destructive"
                      >
                        <Trash2 /> Job löschen
                      </DropdownMenuItem>
                    </DropdownMenuGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
          {jobs.length === 0 && (
            <TableRow>
              <TableCell
                colSpan={4}
                className="text-center text-slate-500 py-8"
              >
                Noch keine Jobs vorhanden.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <Dialog
        open={jobToDelete !== null}
        onOpenChange={(open) => !open && setJobToDelete(null)}
      >
        <DialogContent className="top-[25%]">
          <DialogHeader>
            <DialogTitle>Job {jobToDelete?.project} löschen</DialogTitle>
            <DialogDescription>
              Soll der Job <strong>{jobToDelete?.project}</strong> gelöscht
              werden.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button
              variant="outline"
              onClick={() => setJobToDelete(null)}
            >
              Abbrechen
            </Button>
            <Button
              variant="destructive"
              disabled={deleteMutation.isPending}
              onClick={() => deleteMutation.mutate(jobToDelete!.id)}
            >
              Unwiderruflich löschen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
