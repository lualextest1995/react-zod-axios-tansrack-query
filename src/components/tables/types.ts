import type { ColumnDef } from "@tanstack/react-table";

// ===== 工具型別 =====
export type TableRow<T extends object> = T;
export type TableColumns<T extends object> = ColumnDef<T, any>[];

// Helper: 建立型別安全的欄位
export function createColumns<T extends object>() {
  return <C extends TableColumns<T>>(cols: C) => cols;
}

// ===== Basic Table =====
export type BasicTableProps<T extends object> = {
  columns: TableColumns<T>;
  data: TableRow<T>[];
};

// ===== Client Table =====
export type ClientTableProps<T extends object> = {
  columns: TableColumns<T>;
  data: TableRow<T>[];
  pageSizeOptions?: number[];
  initialPageSize?: number;
};

// ===== Server Table =====
export type ServerTableProps<T extends object> = {
  columns: TableColumns<T>;
  data: TableRow<T>[];
  total: number;
  pageIndex: number;
  pageSize: number;
  onPaginationChange: (updater: any) => void;
  pageSizeOptions?: number[];
  isLoading?: boolean;
};

// ===== Facade =====
export type TableMode = "basic" | "client" | "server";

export type TableProps<T extends object> =
  | ({ mode: "basic" } & BasicTableProps<T>)
  | ({ mode: "client" } & ClientTableProps<T>)
  | ({ mode: "server" } & ServerTableProps<T>);
