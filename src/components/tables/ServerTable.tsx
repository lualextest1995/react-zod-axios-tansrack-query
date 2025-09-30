import type { OnChangeFn, PaginationState } from "@tanstack/react-table";
import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
} from "@tanstack/react-table";
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
import type { ServerTableProps } from "./types";

export function ServerTable<T extends object>({
  columns,
  data,
  total,
  pageIndex,
  pageSize,
  onPaginationChange,
  pageSizeOptions = [10, 20, 50, 100],
  isLoading = false,
}: ServerTableProps<T>) {
  // 攔截 pagination 變更,處理 pageSize 改變時重置 pageIndex
  const handlePaginationChange: OnChangeFn<PaginationState> = (updater) => {
    onPaginationChange?.((prev) => {
      const newPagination =
        typeof updater === "function" ? updater(prev) : updater;

      // 如果 pageSize 改變了,重置 pageIndex 為 0
      if (newPagination.pageSize !== prev.pageSize) {
        return { ...newPagination, pageIndex: 0 };
      }

      return newPagination;
    });
  };

  const table = useReactTable({
    data,
    columns,
    pageCount: Math.ceil(total / pageSize),
    state: { pagination: { pageIndex, pageSize } },
    onPaginationChange: handlePaginationChange,
    manualPagination: true,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  return (
    <div className="w-full">
      <div className="overflow-hidden rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} colSpan={header.colSpan}>
                    {flexRender(
                      header.column.columnDef.header,
                      header.getContext()
                    )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="text-center">
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
              <TableCell colSpan={columns.length}>Table footer</TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </div>

      <SharedPagination table={table} pageSizeOptions={pageSizeOptions} />
    </div>
  );
}
