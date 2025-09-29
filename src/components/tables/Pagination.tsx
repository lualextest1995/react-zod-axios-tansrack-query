import type { Table } from "@tanstack/react-table";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

type SharedPaginationProps<T extends object> = {
  table: Table<T>;
  pageSizeOptions?: number[];
};

export function SharedPagination<T extends object>({
  table,
  pageSizeOptions = [5, 10, 20],
}: SharedPaginationProps<T>) {
  const pageCount = table.getPageCount();
  const currentPage = table.getState().pagination.pageIndex;
  const pageSize = table.getState().pagination.pageSize;

  return (
    <div className="flex items-center justify-between mt-4">
      {/* 頁碼 */}
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              onClick={() => table.previousPage()}
              className={
                table.getCanPreviousPage()
                  ? ""
                  : "opacity-50 pointer-events-none"
              }
            />
          </PaginationItem>

          {Array.from({ length: pageCount }).map((_, idx) => (
            <PaginationItem key={idx}>
              <PaginationLink
                onClick={() => table.setPageIndex(idx)}
                isActive={currentPage === idx}
              >
                {idx + 1}
              </PaginationLink>
            </PaginationItem>
          ))}

          {pageCount > 5 && (
            <PaginationItem>
              <PaginationEllipsis />
            </PaginationItem>
          )}

          <PaginationItem>
            <PaginationNext
              onClick={() => table.nextPage()}
              className={
                table.getCanNextPage() ? "" : "opacity-50 pointer-events-none"
              }
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>

      {/* Page size 選擇器 */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Rows per page:</span>
        <select
          className="border rounded-md p-1 text-sm"
          value={pageSize}
          onChange={(e) => table.setPageSize(Number(e.target.value))}
        >
          {pageSizeOptions.map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
