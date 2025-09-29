import { Table, createColumns } from '@/tables'

type User = {
id: number
name: string
age: number
}

const userColumns = createColumns<User>()([
{ header: 'ID', accessorKey: 'id' },
{ header: 'Name', accessorKey: 'name' },
{ header: 'Age', accessorKey: 'age' },
])

const users: User[] = [
{ id: 1, name: 'Alice', age: 22 },
{ id: 2, name: 'Bob', age: 28 },
]

// Basic

<Table mode="basic" columns={userColumns} data={users} />

// Client

<Table mode="client" columns={userColumns} data={users} pageSizeOptions={[5, 10, 20]} />

// Server

<Table
  mode="server"
  columns={userColumns}
  data={apiData.rows}
  total={apiData.total}
  pageIndex={pagination.pageIndex}
  pageSize={pagination.pageSize}
  onPaginationChange={setPagination}
  isLoading={query.isLoading}
/>
