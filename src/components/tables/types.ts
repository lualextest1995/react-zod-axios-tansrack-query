import type {
  ColumnDef,
  OnChangeFn,
  PaginationState,
  RowData,
} from "@tanstack/react-table";

// ===== 工具型別 =====
export type TableRow<T extends RowData> = T;
export type TableColumns<T extends RowData> = {
  [K in keyof T]: ColumnDef<T, T[K]>;
}[keyof T][];

// ===== Basic Table =====
export type BasicTableProps<T extends RowData> = {
  columns: TableColumns<T>;
  data: TableRow<T>[];
};

// ===== Client Table =====
export type ClientTableProps<T extends RowData> = {
  columns: TableColumns<T>;
  data: TableRow<T>[];
  pageSizeOptions?: number[];
  initialPageSize?: number;
};

// ===== Server Table =====
export type ServerTableProps<T extends RowData> = {
  columns: TableColumns<T>;
  data: TableRow<T>[];
  total: number;
  pageIndex: number;
  pageSize: number;
  onPaginationChange: OnChangeFn<PaginationState>;
  pageSizeOptions?: number[];
  isLoading?: boolean;
};

// ===== Facade =====
export type TableMode = "basic" | "client" | "server";

export type TableProps<T extends RowData> =
  | ({ mode: "basic" } & BasicTableProps<T>)
  | ({ mode: "client" } & ClientTableProps<T>)
  | ({ mode: "server" } & ServerTableProps<T>);
