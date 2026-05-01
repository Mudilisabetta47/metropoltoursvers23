import { ReactNode, useState, useMemo } from "react";
import { ChevronUp, ChevronDown, Search, Download, Trash2, Mail, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface DataTableColumn<T> {
  key: string;
  header: string;
  accessor: (row: T) => ReactNode;
  sortValue?: (row: T) => string | number | Date;
  className?: string;
  width?: string;
}

export interface BulkAction<T> {
  label: string;
  icon?: typeof Trash2;
  variant?: "default" | "danger";
  onClick: (rows: T[]) => void | Promise<void>;
}

interface DataTableProps<T> {
  data: T[];
  columns: DataTableColumn<T>[];
  rowKey: (row: T) => string;
  searchable?: boolean;
  searchKeys?: (keyof T)[];
  bulkActions?: BulkAction<T>[];
  onRowClick?: (row: T) => void;
  emptyMessage?: string;
  isLoading?: boolean;
  exportFilename?: string;
}

export function DataTable<T>({
  data,
  columns,
  rowKey,
  searchable = true,
  searchKeys,
  bulkActions = [],
  onRowClick,
  emptyMessage = "Keine Daten.",
  isLoading = false,
  exportFilename = "export.csv",
}: DataTableProps<T>) {
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const filtered = useMemo(() => {
    if (!query || !searchable) return data;
    const q = query.toLowerCase();
    return data.filter((row) => {
      const keys = searchKeys ?? (Object.keys(row as any) as (keyof T)[]);
      return keys.some((k) => {
        const v = (row as any)[k];
        return v != null && String(v).toLowerCase().includes(q);
      });
    });
  }, [data, query, searchable, searchKeys]);

  const sorted = useMemo(() => {
    if (!sortKey) return filtered;
    const col = columns.find((c) => c.key === sortKey);
    if (!col?.sortValue) return filtered;
    return [...filtered].sort((a, b) => {
      const va = col.sortValue!(a);
      const vb = col.sortValue!(b);
      if (va < vb) return sortDir === "asc" ? -1 : 1;
      if (va > vb) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
  }, [filtered, sortKey, sortDir, columns]);

  const allSelected = sorted.length > 0 && sorted.every((r) => selected.has(rowKey(r)));
  const someSelected = sorted.some((r) => selected.has(rowKey(r))) && !allSelected;

  const toggleAll = () => {
    if (allSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(sorted.map(rowKey)));
    }
  };

  const toggleRow = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const exportCSV = () => {
    const rows = selected.size > 0 ? sorted.filter((r) => selected.has(rowKey(r))) : sorted;
    const escape = (v: any) => {
      if (v == null) return "";
      const s = String(v).replace(/"/g, '""');
      return `"${s}"`;
    };
    const headers = columns.map((c) => c.header).join(";");
    const lines = rows.map((r) =>
      columns.map((c) => {
        const v = c.sortValue ? c.sortValue(r) : "";
        return escape(v);
      }).join(";")
    );
    const csv = "\uFEFF" + [headers, ...lines].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = exportFilename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const selectedRows = sorted.filter((r) => selected.has(rowKey(r)));

  return (
    <div className="cockpit-glass rounded-xl overflow-hidden">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 p-3 border-b cockpit-border">
        {searchable && (
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Suchen…"
              className="pl-8 h-9 bg-white/5 border-zinc-800 text-white placeholder:text-zinc-500"
            />
          </div>
        )}
        <div className="ml-auto flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={exportCSV}
            className="text-zinc-400 hover:text-white h-9"
          >
            <Download className="w-3.5 h-3.5 mr-1.5" />
            Export {selected.size > 0 && `(${selected.size})`}
          </Button>
        </div>
      </div>

      {/* Bulk action bar */}
      {selected.size > 0 && bulkActions.length > 0 && (
        <div className="flex items-center gap-2 px-3 py-2 bg-[#00CC36]/[0.06] border-b border-[#00CC36]/20">
          <span className="text-xs text-[#00CC36] font-medium">
            {selected.size} ausgewählt
          </span>
          <button
            onClick={() => setSelected(new Set())}
            className="text-zinc-500 hover:text-white"
          >
            <X className="w-3.5 h-3.5" />
          </button>
          <div className="ml-auto flex gap-2">
            {bulkActions.map((action, idx) => {
              const Icon = action.icon ?? Mail;
              return (
                <Button
                  key={idx}
                  variant={action.variant === "danger" ? "destructive" : "secondary"}
                  size="sm"
                  onClick={() => action.onClick(selectedRows)}
                  className="h-8 text-xs"
                >
                  <Icon className="w-3 h-3 mr-1.5" />
                  {action.label}
                </Button>
              );
            })}
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-white/[0.02] border-b cockpit-border text-zinc-400 text-[11px] uppercase tracking-wider">
            <tr>
              {bulkActions.length > 0 && (
                <th className="w-10 px-3 py-3">
                  <Checkbox
                    checked={allSelected}
                    onCheckedChange={toggleAll}
                    aria-label="Alle auswählen"
                    className={someSelected ? "data-[state=checked]:bg-[#00CC36]" : ""}
                  />
                </th>
              )}
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={cn("px-3 py-3 text-left font-medium", col.className)}
                  style={col.width ? { width: col.width } : undefined}
                >
                  {col.sortValue ? (
                    <button
                      onClick={() => handleSort(col.key)}
                      className="flex items-center gap-1 hover:text-white transition-colors"
                    >
                      {col.header}
                      {sortKey === col.key &&
                        (sortDir === "asc" ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
                    </button>
                  ) : (
                    col.header
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={columns.length + (bulkActions.length > 0 ? 1 : 0)} className="text-center py-12 text-zinc-500">
                  Lade Daten…
                </td>
              </tr>
            ) : sorted.length === 0 ? (
              <tr>
                <td colSpan={columns.length + (bulkActions.length > 0 ? 1 : 0)} className="text-center py-12 text-zinc-500">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              sorted.map((row) => {
                const id = rowKey(row);
                const isSel = selected.has(id);
                return (
                  <tr
                    key={id}
                    onClick={onRowClick ? () => onRowClick(row) : undefined}
                    className={cn(
                      "border-b border-zinc-800/50 transition-colors",
                      isSel ? "bg-[#00CC36]/[0.05]" : "hover:bg-white/[0.02]",
                      onRowClick && "cursor-pointer"
                    )}
                  >
                    {bulkActions.length > 0 && (
                      <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={isSel}
                          onCheckedChange={() => toggleRow(id)}
                          aria-label="Auswählen"
                        />
                      </td>
                    )}
                    {columns.map((col) => (
                      <td key={col.key} className={cn("px-3 py-3 text-zinc-200", col.className)}>
                        {col.accessor(row)}
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-3 py-2 border-t cockpit-border text-[11px] text-zinc-500">
        <span>
          {sorted.length} {sorted.length === 1 ? "Eintrag" : "Einträge"}
          {query && ` (gefiltert aus ${data.length})`}
        </span>
        {selected.size > 0 && <span className="text-[#00CC36]">{selected.size} ausgewählt</span>}
      </div>
    </div>
  );
}
