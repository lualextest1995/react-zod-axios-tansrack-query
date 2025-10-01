// ClientTable.tsx
import { useState } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  flexRender,
  type RowSelectionState,
  type PaginationState,
} from "@tanstack/react-table";
import { createSelectionColumn } from "./selectionColumn";
import { getRowIdSafe } from "./utils";
import type { ClientTableProps } from "./types";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { SharedPagination } from "./Pagination";

export function ClientTable<T extends object>({
  columns,
  data,
  pageSizeOptions = [5, 10, 20],
  initialPageSize = 10,
  enableRowSelection = false,
  onRowSelectionChange,
  selectionMode = "page",
}: ClientTableProps<T>) {
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: initialPageSize,
  });
  const [selectedMap, setSelectedMap] = useState<Map<string, T>>(new Map());

  const finalColumns = enableRowSelection
    ? [createSelectionColumn<T>(), ...columns]
    : columns;

  const table = useReactTable({
    data,
    columns: finalColumns,
    state: { rowSelection, pagination },
    onRowSelectionChange: (updater) => {
      const newSelection =
        typeof updater === "function" ? updater(rowSelection) : updater;
      setRowSelection(newSelection);

      if (!enableRowSelection || !onRowSelectionChange) return;

      if (selectionMode === "global") {
        const nextMap = new Map(selectedMap);
        table.getRowModel().rows.forEach((r, idx) => {
          const id = getRowIdSafe(r.original as T, idx);
          if (newSelection[id]) nextMap.set(id, r.original as T);
          else nextMap.delete(id);
        });
        setSelectedMap(nextMap);
        onRowSelectionChange(Array.from(nextMap.values()));
      } else {
        // page 模式
        const selectedRows = table
          .getRowModel()
          .rows.filter((r) => newSelection[r.id])
          .map((r) => r.original as T);
        onRowSelectionChange(selectedRows);
      }
    },
    onPaginationChange: (updater) => {
      const next =
        typeof updater === "function" ? updater(pagination) : updater;
      setPagination(next);
      if (selectionMode === "page") {
        setRowSelection({});
        setSelectedMap(new Map());
      }
    },
    enableRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getRowId: getRowIdSafe,
  });

  return (
    <div className="w-full">
      <div className="overflow-hidden rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id}>
                {hg.headers.map((h) => (
                  <TableHead key={h.id}>
                    {flexRender(h.column.columnDef.header, h.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.map((row) => (
              <TableRow key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell colSpan={finalColumns.length}>Table footer</TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </div>
      <SharedPagination table={table} pageSizeOptions={pageSizeOptions} />
    </div>
  );
}
