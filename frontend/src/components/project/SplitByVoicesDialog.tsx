import { useEffect, useMemo, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight, Loader2, Plus, Trash2 } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Checkbox } from "../ui/checkbox";
import { Label } from "../ui/label";
import { analyzeVoicesMutationOptions, splitVoicesMutationOptions } from "@/lib/queries";
import { queryClient } from "@/main";
import type { VoiceGroup } from "@/lib/types";

type LocalPage = {
  page: number;
  thumbnail?: string;
};

type LocalGroup = {
  name: string;
  pages: LocalPage[];
};

function toLocalGroups(groups: VoiceGroup[]): LocalGroup[] {
  return groups.map((g) => ({
    name: g.name,
    pages: g.pages.map((p, idx) => ({
      page: p,
      thumbnail: g.thumbnails[idx],
    })),
  }));
}

export default function SplitByVoicesDialog({
  project,
  filename,
  targetLanguage,
  open,
  onOpenChange,
}: {
  project: string;
  filename: string;
  targetLanguage: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { t } = useTranslation();
  const [groups, setGroups] = useState<LocalGroup[]>([]);
  const [deleteOriginal, setDeleteOriginal] = useState(false);
  const [pageCount, setPageCount] = useState<number>(0);

  const analyzeMutation = useMutation(analyzeVoicesMutationOptions());
  const splitMutation = useMutation(splitVoicesMutationOptions());

  useEffect(() => {
    if (!open) {
      setGroups([]);
      setDeleteOriginal(false);
      setPageCount(0);
      return;
    }
    analyzeMutation.mutate(
      { projectName: project, filename, targetLanguage },
      {
        onSuccess: (data) => {
          setGroups(toLocalGroups(data.groups));
          setPageCount(data.page_count);
        },
      },
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, project, filename, targetLanguage]);

  const movePage = (groupIdx: number, pageIdx: number, direction: -1 | 1) => {
    const target = groupIdx + direction;
    if (target < 0 || target >= groups.length) return;
    setGroups((prev) => {
      const next = prev.map((g) => ({ ...g, pages: [...g.pages] }));
      const [moved] = next[groupIdx].pages.splice(pageIdx, 1);
      next[target].pages.push(moved);
      next[target].pages.sort((a, b) => a.page - b.page);
      return next;
    });
  };

  const renameGroup = (groupIdx: number, name: string) => {
    setGroups((prev) => prev.map((g, i) => (i === groupIdx ? { ...g, name } : g)));
  };

  const addGroup = () => {
    setGroups((prev) => [...prev, { name: `Voice ${prev.length + 1}`, pages: [] }]);
  };

  const removeGroup = (groupIdx: number) => {
    setGroups((prev) => {
      const next = prev.map((g) => ({ ...g, pages: [...g.pages] }));
      const removed = next.splice(groupIdx, 1)[0];
      if (removed.pages.length > 0) {
        const fallbackIdx = groupIdx > 0 ? groupIdx - 1 : 0;
        if (next.length === 0) {
          next.push({ name: removed.name, pages: removed.pages });
        } else {
          next[fallbackIdx].pages.push(...removed.pages);
          next[fallbackIdx].pages.sort((a, b) => a.page - b.page);
        }
      }
      return next;
    });
  };

  const validation = useMemo(() => {
    const nonEmpty = groups.filter((g) => g.pages.length > 0);
    if (nonEmpty.length === 0) return { ok: false, message: t("voiceSplit.validationEmpty") };
    const assigned = new Set<number>();
    let duplicate = false;
    nonEmpty.forEach((g) => {
      g.pages.forEach((p) => {
        if (assigned.has(p.page)) duplicate = true;
        assigned.add(p.page);
      });
    });
    if (duplicate) return { ok: false, message: t("voiceSplit.validationDuplicates") };
    const orphanCount = pageCount - assigned.size;
    if (orphanCount > 0) {
      return { ok: false, message: t("voiceSplit.validationOrphans", { count: orphanCount }) };
    }
    return { ok: true, message: "" };
  }, [groups, pageCount, t]);

  const handleSplit = () => {
    const payload = groups
      .filter((g) => g.pages.length > 0)
      .map((g) => ({
        name: g.name.trim() || "Voice",
        pages: g.pages.map((p) => p.page),
      }));
    splitMutation.mutate(
      {
        projectName: project,
        filename,
        groups: payload,
        deleteOriginal,
      },
      {
        onSuccess: (data) => {
          queryClient.invalidateQueries({ queryKey: ["project-files", project] });
          toast.success(t("voiceSplit.success", { count: data.created_files.length }));
          onOpenChange(false);
        },
      },
    );
  };

  const isAnalyzing = analyzeMutation.isPending;
  const isSplitting = splitMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>{t("voiceSplit.title", { filename })}</DialogTitle>
          <DialogDescription>{t("voiceSplit.description")}</DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto -mx-4 px-4 py-2">
          {isAnalyzing ? (
            <div className="flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              {t("voiceSplit.analyzing")}
            </div>
          ) : groups.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              {t("voiceSplit.noGroups")}
            </p>
          ) : (
            <div className="flex flex-col gap-3">
              {groups.map((group, gIdx) => (
                <div
                  key={gIdx}
                  className="rounded-lg border bg-card p-3 flex flex-col gap-2"
                >
                  <div className="flex items-center gap-2">
                    <Input
                      value={group.name}
                      onChange={(e) => renameGroup(gIdx, e.target.value)}
                      placeholder={t("voiceSplit.groupNamePlaceholder")}
                      className="flex-1"
                    />
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => removeGroup(gIdx)}
                      aria-label={t("voiceSplit.removeGroup")}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
                    {group.pages.map((p, pIdx) => (
                      <div
                        key={p.page}
                        className="flex flex-col items-center gap-1 rounded-md border bg-background p-2"
                      >
                        {p.thumbnail ? (
                          <img
                            src={p.thumbnail}
                            alt={t("voiceSplit.page", { n: p.page + 1 })}
                            className="h-64 w-full rounded-sm border bg-white object-contain"
                          />
                        ) : (
                          <div className="flex h-64 w-full items-center justify-center rounded-sm border bg-muted text-sm text-muted-foreground">
                            {p.page + 1}
                          </div>
                        )}
                        <span className="text-xs text-muted-foreground">
                          {t("voiceSplit.page", { n: p.page + 1 })}
                        </span>
                        <div className="flex gap-0.5">
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            disabled={gIdx === 0}
                            onClick={() => movePage(gIdx, pIdx, -1)}
                            aria-label={t("voiceSplit.moveLeft")}
                          >
                            <ChevronLeft className="size-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            disabled={gIdx === groups.length - 1}
                            onClick={() => movePage(gIdx, pIdx, 1)}
                            aria-label={t("voiceSplit.moveRight")}
                          >
                            <ChevronRight className="size-3.5" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              <Button variant="outline" onClick={addGroup} className="self-start">
                <Plus className="size-4" /> {t("voiceSplit.addGroup")}
              </Button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 pt-2">
          <Checkbox
            id="voice-split-delete-original"
            checked={deleteOriginal}
            onCheckedChange={(v) => setDeleteOriginal(v === true)}
          />
          <Label htmlFor="voice-split-delete-original">
            {t("voiceSplit.deleteOriginal")}
          </Label>
        </div>

        {!validation.ok && !isAnalyzing && groups.length > 0 && (
          <p className="text-xs text-destructive">{validation.message}</p>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSplitting}
          >
            {t("voiceSplit.cancel")}
          </Button>
          <Button
            onClick={handleSplit}
            disabled={isAnalyzing || isSplitting || !validation.ok}
          >
            {isSplitting ? (
              <>
                <Loader2 className="size-4 animate-spin" /> {t("voiceSplit.splitting")}
              </>
            ) : (
              t("voiceSplit.split")
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
