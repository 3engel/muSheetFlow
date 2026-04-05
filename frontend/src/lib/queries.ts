import { api } from "@/lib/api";
import { FileInfo, Job, JobResult, Mapping, Project } from "@/lib/types";
import { queryClient } from "@/main";
import { mutationOptions, queryOptions } from "@tanstack/react-query";
import { toast } from "sonner";

export const mappingsQueryOptions = () =>
  queryOptions({
    queryKey: ["mapping"],
    queryFn: async () => {
      const res = await api.get<Mapping[]>("/mapping");
      return res.data;
    },
  })

export const jobsQueryOptions = () =>
  queryOptions({
    queryKey: ["jobs"],
    queryFn: async () => {
      const res = await api.get<Job[]>("/jobs");
      return res.data;
    },
  })

export const jobDetailsQueryOptions = (jobId: string) =>
  queryOptions({
    queryKey: ["jobs", jobId],
    queryFn: async () => {
      const res = await api.get<Job>(`/jobs/${jobId}`);
      return res.data;
    },

  })

export const jobResultsQueryOptions = (jobId: string) =>
  queryOptions({
    queryKey: ["jobs", jobId, "results"],
    queryFn: async () => {
      const res = await api.get<JobResult[]>(`/jobs/${jobId}/results`);
      return res.data;
    },
  })

export const jobLanguageMutationOptions = () => {
  return mutationOptions({
    // mutationKey: ['invoices', 'create'],
    mutationFn: ({ newLang, jobId }: { newLang: string; jobId: string }) =>
      api.post(`/jobs/${jobId}/language`, { language: newLang }),
    onSuccess: (_, { jobId }) => queryClient.invalidateQueries({
      queryKey: ["jobs", jobId],
      refetchType: "all",
    }),
  })
}

export const jobRefreshMutationOptions = () => {
  return mutationOptions({
    mutationFn: () =>
      api.put(`/jobs`),
    onSuccess: () => queryClient.invalidateQueries({
      queryKey: ["jobs"],
      refetchType: "all",
    }),
  })
}

export const jobResultsMutationOptions = () => {
  return mutationOptions({
    mutationFn: ({ results, jobId }: { results: JobResult[]; jobId: string }) =>
      api.post(`/jobs/${jobId}/results`, results),
    onSuccess: (_, { jobId }) => queryClient.invalidateQueries({
      queryKey: ["jobs", jobId],
      refetchType: "all",
    }),
  })
}

export const jobFinalizeMutationOptions = () => {
  return mutationOptions({
    mutationFn: async ({ results, jobId }: { results: JobResult[]; jobId: string }) => {
      const assignments: Record<string, string> = {};
      results.forEach((r) => {
        let finalName = (r.instrument || "Unknown").trim();
        if (r.voice) finalName += ` ${r.voice}`;
        if (r.key) finalName += ` ${r.key}`;
        assignments[r.temp_file] = finalName;
      });
      return await api.post(`/jobs/${jobId}/finalize`, { assignments });
    },
    onError: (error) => {
      console.error(error);
      toast.error(`Fehler beim Fertigstellen des Jobs.`, {
        description: error.message
      });
    }
  })
}

export const jobDeleteMutationOptions = () => {
  return mutationOptions({
    mutationFn: (id: string) => api.delete(`/jobs/${id}`),
    onError: (error) => {
      console.error(error);
      toast.error(`Fehler beim Löschen des Jobs.`, {
        description: error.message
      });
    }
  })
}

export const mappingSaveMutationOptions = () => {
  return mutationOptions({
    mutationFn: (mappingModified: Mapping[]) =>
      api.post("/mapping", mappingModified),
    onError: (error) => {
      console.error(error);
      toast.error(`Fehler beim Speichern der Mappings.`, {
        description: error.message
      });
    }
  })
}

export const projectsQueryOptions = () =>
  queryOptions({
    queryKey: ['projects'],
    queryFn: async () => {
      const res = await api.get<Project[]>('/projects');
      return res.data || [];
    }
  })


export const projectCreateMutationOptions = () => {
  return mutationOptions({
    mutationFn: (newProjectName: string) => {
      return api.post("/projects/", { name: newProjectName });
    },

    onError: (error, variables) => {
      console.error(error);
      toast.error(`Fehler beim Erstellen des Projekts "${variables}".`, {
        description: error.message
      });
    }
  });
}

export const projectDeleteMutationOptions = () => {
  return mutationOptions({
    mutationFn: (id: string) => api.delete(`/projects/${id}`),
    onError: (error, variables) => {
      console.error(error);
      toast.error(`Fehler beim Löschen des Projekts "${variables}".`, {
        description: error.message
      });
    }
  })
}


export const projectFilesQueryOptions = (projectName: string) =>
  queryOptions({
    queryKey: ["project-files", projectName],
    queryFn: async () => {
      const res = await api.get<FileInfo[]>(`/projects/${projectName}/files`);
      return res.data || [];
    },
  })

export const projectFilesDeleteMutationOptions = () => {
  return mutationOptions({
    mutationFn: ({ projectName, files }: { projectName: string; files: string[] }) => api.delete(`/projects/${projectName}/files`, { data: files }),
    onError: (error, variables) => {
      console.error(error);
      toast.error(`Fehler beim Löschen der Dateien im Projekt "${variables.projectName}".`, {
        description: error.message
      });
    }
  });
}