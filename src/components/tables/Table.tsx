import { BasicTable } from "./BasicTable";
import { ClientTable } from "./ClientTable";
import { ServerTable } from "./ServerTable";
import type { TableProps } from "./types";

export function Table<T extends object>(props: TableProps<T>) {
  const { mode, columns } = props;

  if (mode === "basic") {
    return <BasicTable columns={columns} data={props.data} />;
  }

  if (mode === "client") {
    return (
      <ClientTable
        columns={columns}
        data={props.data}
        pageSizeOptions={props.pageSizeOptions}
        initialPageSize={props.initialPageSize}
      />
    );
  }

  if (mode === "server") {
    return (
      <ServerTable
        columns={columns}
        data={props.data}
        total={props.total}
        pageIndex={props.pageIndex}
        pageSize={props.pageSize}
        onPaginationChange={props.onPaginationChange}
        pageSizeOptions={props.pageSizeOptions}
        isLoading={props.isLoading}
      />
    );
  }

  return null;
}
