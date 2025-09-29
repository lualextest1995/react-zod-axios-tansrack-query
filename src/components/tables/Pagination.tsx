import type { Table } from "@tanstack/react-table";

type PaginationProps<T extends object> = {
  table: Table<T>;
  pageSizeOptions?: number[];
};

export function Pagination<T extends object>({
  table,
  pageSizeOptions = [5, 10, 20],
}: PaginationProps<T>) {
  return (
    <div style={{ marginTop: "1rem" }}>
      <button
        onClick={() => table.setPageIndex(0)}
        disabled={!table.getCanPreviousPage()}
      >
        {"<<"}
      </button>
      <button
        onClick={() => table.previousPage()}
        disabled={!table.getCanPreviousPage()}
      >
        {"<"}
      </button>
      <button
        onClick={() => table.nextPage()}
        disabled={!table.getCanNextPage()}
      >
        {">"}
      </button>
      <button
        onClick={() => table.setPageIndex(table.getPageCount() - 1)}
        disabled={!table.getCanNextPage()}
      >
        {">>"}
      </button>
      <span>
        Page{" "}
        <strong>
          {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
        </strong>
      </span>
      <select
        value={table.getState().pagination.pageSize}
        onChange={(e) => table.setPageSize(Number(e.target.value))}
      >
        {pageSizeOptions.map((size) => (
          <option key={size} value={size}>
            Show {size}
          </option>
        ))}
      </select>
    </div>
  );
}
