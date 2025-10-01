// types.ts
import type {
  ColumnDef,
  OnChangeFn,
  PaginationState,
  RowData,
} from "@tanstack/react-table";

export type TableColumns<T extends RowData> = {
  [K in keyof T]: ColumnDef<T, T[K]>;
}[keyof T][];

// ===== Basic =====
export type BasicTableProps<T extends RowData> = {
  columns: TableColumns<T>;
  data: T[];
  enableRowSelection?: boolean;
  onRowSelectionChange?: (rows: T[]) => void;
};

// ===== Client =====
type WithId = { id: string | number };

export type ClientTableProps<T extends RowData> = {
  columns: TableColumns<T>;
  data: T[];
  pageSizeOptions?: number[];
  initialPageSize?: number;
  enableRowSelection?: boolean;
  onRowSelectionChange?: (rows: T[]) => void;
} & (
  | { selectionMode?: "page" }
  | { selectionMode: "global"; data: (T & WithId)[] }
);

// ===== Server =====
export type ServerTableProps<T extends RowData> = {
  columns: TableColumns<T>;
  data: T[];
  total: number;
  pageIndex: number;
  pageSize: number;
  onPaginationChange: OnChangeFn<PaginationState>;
  pageSizeOptions?: number[];
  isLoading?: boolean;
  enableRowSelection?: boolean;
  onRowSelectionChange?: (rows: T[]) => void;
} & (
  | { selectionMode?: "page" }
  | { selectionMode: "global"; data: (T & WithId)[] }
);

export type TableMode = "basic" | "client" | "server";

export type TableProps<T extends RowData> =
  | ({ mode: "basic" } & BasicTableProps<T>)
  | ({ mode: "client" } & ClientTableProps<T>)
  | ({ mode: "server" } & ServerTableProps<T>);
