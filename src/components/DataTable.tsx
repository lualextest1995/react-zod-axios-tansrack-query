import React from "react";
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  flexRender,
  type ColumnDef,
} from "@tanstack/react-table";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface PaginationInfo {
  pageIndex: number;
  pageSize: number;
  pageCount: number;
  total?: number;
}

interface DataTableProps<TData = any, TValue = any> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  showFooter?: boolean;
  footerContent?: React.ReactNode;
  className?: string;
  initialPageSize?: number;
  // 服務端分頁相關
  manualPagination?: boolean;
  paginationInfo?: PaginationInfo;
  onPaginationChange?: (pageIndex: number, pageSize: number) => void;
  isLoading?: boolean;
}

function DataTable<TData = any, TValue = any>({
  columns,
  data,
  showFooter = false,
  footerContent,
  className = "",
  initialPageSize = 10,
  manualPagination = false,
  paginationInfo,
  onPaginationChange,
  isLoading = false,
}: DataTableProps<TData, TValue>) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    ...(manualPagination
      ? {
          manualPagination: true,
          pageCount: paginationInfo?.pageCount ?? 0,
          state: {
            pagination: {
              pageIndex: paginationInfo?.pageIndex ?? 0,
              pageSize: paginationInfo?.pageSize ?? initialPageSize,
            },
          },
          onPaginationChange: (updater) => {
            const newPagination = typeof updater === 'function'
              ? updater({
                  pageIndex: paginationInfo?.pageIndex ?? 0,
                  pageSize: paginationInfo?.pageSize ?? initialPageSize,
                })
              : updater;
            onPaginationChange?.(newPagination.pageIndex, newPagination.pageSize);
          },
        }
      : {
          getPaginationRowModel: getPaginationRowModel(),
          initialState: {
            pagination: {
              pageSize: initialPageSize,
            },
          },
        }
    ),
  });

  const totalPages = table.getPageCount();
  const currentPage = table.getState().pagination.pageIndex + 1;

  const generatePageNumbers = () => {
    const pages = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= Math.min(4, totalPages); i++) {
          pages.push(i);
        }
        if (totalPages > 4) pages.push('ellipsis');
        if (totalPages > 4) pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        if (totalPages > 4) pages.push('ellipsis');
        for (let i = Math.max(totalPages - 3, 2); i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push('ellipsis');
        pages.push(currentPage - 1);
        pages.push(currentPage);
        pages.push(currentPage + 1);
        pages.push('ellipsis');
        pages.push(totalPages);
      }
    }

    return pages;
  };

  return (
    <div className={`w-full ${className}`}>
      <div className="overflow-hidden rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
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
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  <div className="flex items-center justify-center">
                    <div className="text-lg">Loading...</div>
                  </div>
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows?.length ? (
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
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
          {showFooter && footerContent && (
            <TableFooter>
              {footerContent}
            </TableFooter>
          )}
        </Table>
      </div>

      {totalPages > 1 && (
        <Pagination className="mt-4">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => table.previousPage()}
                className={!table.getCanPreviousPage() ? "pointer-events-none opacity-50" : "cursor-pointer"}
              />
            </PaginationItem>

            {generatePageNumbers().map((page, index) => (
              <PaginationItem key={index}>
                {page === 'ellipsis' ? (
                  <PaginationEllipsis />
                ) : (
                  <PaginationLink
                    onClick={() => table.setPageIndex((page as number) - 1)}
                    isActive={currentPage === page}
                    className="cursor-pointer"
                  >
                    {page}
                  </PaginationLink>
                )}
              </PaginationItem>
            ))}

            <PaginationItem>
              <PaginationNext
                onClick={() => table.nextPage()}
                className={!table.getCanNextPage() ? "pointer-events-none opacity-50" : "cursor-pointer"}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}

      <p className="text-muted-foreground mt-4 text-center text-sm">
        {manualPagination && paginationInfo?.total ? (
          <>
            Showing {(currentPage - 1) * table.getState().pagination.pageSize + 1} to{' '}
            {Math.min(currentPage * table.getState().pagination.pageSize, paginationInfo.total)} of{' '}
            {paginationInfo.total} entries
            {totalPages > 1 && ` • Page ${currentPage} of ${totalPages}`}
          </>
        ) : (
          <>
            Showing {table.getRowModel().rows.length} of {data.length} entries
            {totalPages > 1 && ` • Page ${currentPage} of ${totalPages}`}
          </>
        )}
      </p>
    </div>
  );
}

export { DataTable };
