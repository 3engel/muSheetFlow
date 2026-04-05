import { createFileRoute } from "@tanstack/react-router";
import { Plus, Save, Trash2, Table as TableIcon, Loader2 } from "lucide-react";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import {
  mappingsQueryOptions,
  mappingSaveMutationOptions,
} from "../lib/queries";
import { Mapping } from "@/lib/types";
import { ScrollArea } from "@/components/ui/scroll-area";
import { queryClient } from "@/main";
import { toast } from "sonner";

export const Route = createFileRoute("/mapping")({
  component: MappingPage,
  loader: async ({ context: { queryClient } }) => {
    return await queryClient.ensureQueryData(mappingsQueryOptions());
  },
  staticData: { title: "Instrumente", icon: TableIcon, sortIndex: 30 },
});

function MappingPage() {
  const { data: mappings } = useSuspenseQuery(mappingsQueryOptions());
  const [mappingCopy, setMappingCopy] = useState(JSON.stringify(mappings));
  const [mapping, setMapping] = useState<Mapping[]>(mappings || []);

  const saveMappingMutation = useMutation({
    ...mappingSaveMutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["mapping"],
        refetchType: "all",
      });
      toast.success("Mapping erfolgreich gespeichert!");
      setMappingCopy(JSON.stringify(mapping));
    },
  });

  const addRow = () => {
    setMapping([{ Term: "", English: "", Deutsch: "" }, ...mapping]);
  };

  const updateRow = (
    index: number,
    field: "Term" | "English" | "Deutsch",
    value: string,
  ) => {
    const next = [...mapping];
    next[index][field] = value;
    setMapping(next);
  };

  const removeRow = (index: number) => {
    const next = [...mapping];
    next.splice(index, 1);
    setMapping(next);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-96px)] gap-2">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold">Instrumente</h1>
        <p className="mb-2">
          Hier können Sie die Zuordnung von OCR-erkannten Suchbegriffen zu den
          entsprechenden Instrumentennamen bearbeiten.
        </p>
        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            size="lg"
            onClick={addRow}
          >
            <Plus /> Neues Mapping
          </Button>
          <Button
            onClick={() => saveMappingMutation.mutate(mapping)}
            size="lg"
            disabled={
              JSON.stringify(mapping) === mappingCopy ||
              saveMappingMutation.isPending
            }
          >
            {saveMappingMutation.isPending ? (
              <Loader2 className="animate-spin" />
            ) : (
              <Save />
            )}
            Speichern
          </Button>
        </div>
      </div>
      <ScrollArea className="grow flex-1 min-h-0">
        <Table className="rounded-header-md">
          <TableHeader className="bg-muted">
            <TableRow>
              <TableHead>Suchbegriff (Regex/Wort)</TableHead>
              <TableHead>Deutsch</TableHead>
              <TableHead>English</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mapping.map((row, idx) => (
              <TableRow key={idx}>
                <TableCell className="w-1/2">
                  <Input
                    value={row.Term}
                    onChange={(e) => updateRow(idx, "Term", e.target.value)}
                    placeholder="z.B. flöte"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    value={row.Deutsch}
                    onChange={(e) => updateRow(idx, "Deutsch", e.target.value)}
                    placeholder="Flöte"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    value={row.English}
                    onChange={(e) => updateRow(idx, "English", e.target.value)}
                    placeholder="Flute"
                  />
                </TableCell>
                <TableCell className="w-16 shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeRow(idx)}
                  >
                    <Trash2 className=" text-red-500" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </ScrollArea>
    </div>
  );
}
