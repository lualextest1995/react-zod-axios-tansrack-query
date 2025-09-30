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
}: ClientTableProps<T>) {
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: initialPageSize,
  });

  const finalColumns = enableRowSelection
    ? [createSelectionColumn<T>(), ...columns]
    : columns;

  const table = useReactTable({
    data,
    columns: finalColumns,
    state: { rowSelection, pagination },
    onRowSelectionChange: setRowSelection,
    onPaginationChange: setPagination, // ✅ 修正: 受控 pagination
    enableRowSelection,
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
