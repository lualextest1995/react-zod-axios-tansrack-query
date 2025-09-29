import React from "react";
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  flexRender,
} from "@tanstack/react-table";
import { Pagination } from "./Pagination";
import type { ServerTableProps } from "./types";

export function ServerTable<T extends object>({
  columns,
  data,
  total,
  pageIndex,
  pageSize,
  onPaginationChange,
  pageSizeOptions,
  isLoading = false,
}: ServerTableProps<T>) {
  const table = useReactTable({
    data,
    columns,
    pageCount: Math.ceil(total / pageSize),
    state: { pagination: { pageIndex, pageSize } },
    onPaginationChange,
    manualPagination: true,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  return (
    <div>
      <table>
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th key={header.id}>
                  {flexRender(
                    header.column.columnDef.header,
                    header.getContext()
                  )}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {isLoading ? (
            <tr>
              <td colSpan={columns.length}>Loading...</td>
            </tr>
          ) : (
            table.getRowModel().rows.map((row) => (
              <tr key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>

      <Pagination table={table} pageSizeOptions={pageSizeOptions} />
    </div>
  );
}
