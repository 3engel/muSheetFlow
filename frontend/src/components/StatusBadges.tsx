import { Loader2 } from "lucide-react";
import { Badge } from "./ui/badge";
import { Job } from "@/lib/types";
import { useTranslation } from "react-i18next";

export const SuccessBadge = ({ children }: { children: React.ReactNode }) => {
  return (
    <Badge className="border-none bg-green-600/10 text-green-600 focus-visible:ring-green-600/20 focus-visible:outline-none dark:bg-green-400/10 dark:text-green-400 dark:focus-visible:ring-green-400/40 [a&]:hover:bg-green-600/5 dark:[a&]:hover:bg-green-400/5">
      <span
        className="size-1.5 rounded-full bg-green-600 dark:bg-green-400"
        aria-hidden="true"
      />
      {children}
    </Badge>
  );
};

export const WarningBadge = ({ children }: { children: React.ReactNode }) => {
  return (
    <Badge className="border-none bg-amber-600/10 text-amber-600 focus-visible:ring-amber-600/20 focus-visible:outline-none dark:bg-amber-400/10 dark:text-amber-400 dark:focus-visible:ring-amber-400/40 [a&]:hover:bg-amber-600/5 dark:[a&]:hover:bg-amber-400/5">
      <span
        className="size-1.5 rounded-full bg-amber-600 dark:bg-amber-400"
        aria-hidden="true"
      />
      {children}
    </Badge>
  );
};

export const DestructiveBadge = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  return (
    <Badge className="bg-destructive/10 [a&]:hover:bg-destructive/5 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 text-destructive border-none focus-visible:outline-none">
      <span
        className="bg-destructive size-1.5 rounded-full"
        aria-hidden="true"
      />
      {children}
    </Badge>
  );
};

export const ProcessingBadge = ({
  processingStatus,
  children,
}: {
  processingStatus?: string;
  children: React.ReactNode;
}) => {
  return (
    <Badge className="flex gap-2 pr-0.5 bg-blue-600/10 [a&]:hover:bg-blue-600/5 focus-visible:ring-blue-600/20 dark:focus-visible:ring-blue-400/40 text-blue-600 border-none focus-visible:outline-none">
      <Loader2 className="animate-spin" />
      {children}
      {processingStatus && (
        <span className="min-w-5 px-2 tabular-nums bg-blue-200 rounded-full font-semibold text-xs">
          {processingStatus}
        </span>
      )}
    </Badge>
  );
};

export const JobStatus = ({ job }: { job: Job }) => {
  const { t } = useTranslation();
  return job.status === "processing" ? (
    <ProcessingBadge processingStatus={`${job.progress} / ${job.total || "?"}`}>
      {t("status.processing")}
    </ProcessingBadge>
  ) : job.status === "awaiting_assignment" ? (
    <WarningBadge>{t("status.waitingAssignment")}</WarningBadge>
  ) : job.status === "completed" ? (
    <SuccessBadge>{t("status.completed")}</SuccessBadge>
  ) : job.status === "failed" ? (
    <DestructiveBadge>{t("status.error", { error: job.error })}</DestructiveBadge>
  ) : job.status === "pending" ? (
    <WarningBadge>{t("status.pending")}</WarningBadge>
  ) : (
    <Badge>{job.status}</Badge>
  );
};
