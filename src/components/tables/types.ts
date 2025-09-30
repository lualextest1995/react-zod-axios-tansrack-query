import type {
  ColumnDef,
  OnChangeFn,
  PaginationState,
  RowData,
} from "@tanstack/react-table";

export type TableColumns<T extends RowData> = {
  [K in keyof T]: ColumnDef<T, T[K]>;
}[keyof T][];

export type TableSelectionProps<T extends RowData> = {
  enableRowSelection?: boolean;
  onRowSelectionChange?: (selectedRows: T[]) => void;
};

export type BasicTableProps<T extends RowData> = {
  columns: TableColumns<T>;
  data: T[];
} & TableSelectionProps<T>;

export type ClientTableProps<T extends RowData> = {
  columns: TableColumns<T>;
  data: T[];
  pageSizeOptions?: number[];
  initialPageSize?: number;
} & TableSelectionProps<T>;

export type ServerTableProps<T extends RowData> = {
  columns: TableColumns<T>;
  data: T[];
  total: number;
  pageIndex: number;
  pageSize: number;
  onPaginationChange: OnChangeFn<PaginationState>;
  pageSizeOptions?: number[];
  isLoading?: boolean;
} & TableSelectionProps<T>;

export type TableMode = "basic" | "client" | "server";

export type TableProps<T extends RowData> =
  | ({ mode: "basic" } & BasicTableProps<T>)
  | ({ mode: "client" } & ClientTableProps<T>)
  | ({ mode: "server" } & ServerTableProps<T>);
