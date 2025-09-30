import { useEffect, useState } from "react";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  type RowSelectionState,
} from "@tanstack/react-table";
import { createSelectionColumn } from "./selectionColumn";
import type { BasicTableProps } from "./types";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export function BasicTable<T extends object>({
  columns,
  data,
  enableRowSelection = false,
  onRowSelectionChange,
}: BasicTableProps<T>) {
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const finalColumns = enableRowSelection
    ? [createSelectionColumn<T>(), ...columns]
    : columns;

  const table = useReactTable({
    data,
    columns: finalColumns,
    state: { rowSelection },
    onRowSelectionChange: setRowSelection,
    enableRowSelection,
    getCoreRowModel: getCoreRowModel(),
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
    </div>
  );
}
