import { useEffect, useState } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  flexRender,
  type RowSelectionState,
  type PaginationState,
} from "@tanstack/react-table";
import { createSelectionColumn } from "./selectionColumn";
import type { ServerTableProps } from "./types";
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

export function ServerTable<T extends object>({
  columns,
  data,
  total,
  pageIndex,
  pageSize,
  onPaginationChange,
  pageSizeOptions = [5, 10, 20],
  isLoading = false,
  enableRowSelection = false,
  onRowSelectionChange,
}: ServerTableProps<T>) {
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex,
    pageSize,
  });

  const finalColumns = enableRowSelection
    ? [createSelectionColumn<T>(), ...columns]
    : columns;

  const table = useReactTable({
    data,
    columns: finalColumns,
    state: { rowSelection, pagination },
    onRowSelectionChange: setRowSelection,
    onPaginationChange: (updater) => {
      const next =
        typeof updater === "function" ? updater(pagination) : updater;
      setPagination(next);
      onPaginationChange(next);
    },
    enableRowSelection,
    pageCount: Math.ceil(total / pagination.pageSize),
    manualPagination: true,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  useEffect(() => {
    if (onRowSelectionChange) {
      const selected = table
        .getSelectedRowModel()
        .flatRows.map((r) => r.original as T);
      onRowSelectionChange(selected);
    }
  }, [rowSelection, onRowSelectionChange, table]);

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
            {isLoading ? (
              <TableRow>
                <TableCell
                  colSpan={finalColumns.length}
                  className="text-center"
                >
                  Loading...
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
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
