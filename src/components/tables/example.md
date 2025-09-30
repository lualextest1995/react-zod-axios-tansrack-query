# 📖 Table 元件使用說明

這個 `Table` 是基於 **@tanstack/react-table v8** 封裝的高階表格元件，支援 **三種模式**：

- `basic` → 最簡單的靜態表格。
- `client` → 前端分頁、排序，資料一次載入。
- `server` → 後端分頁，搭配 API 請求使用。

額外功能：

- ✅ 勾選列 (row selection) & 全選
- ✅ Callback 回傳勾選資料
- ✅ 分頁 (client / server)
- ✅ 支援自訂 columns、行為與樣式

---

## 📦 安裝需求

```bash
npm install @tanstack/react-table @tanstack/react-query
```

另外需要 [shadcn/ui](https://ui.shadcn.com) 提供的 `Table`、`Checkbox`、`Pagination` 等元件。

---

## 🔹 基本使用方式

### 1. 定義型別與欄位

```tsx
import { createColumnHelper } from "@tanstack/react-table";
import { Table } from "@/components/tables";

type User = { id: number; name: string; age: number };
const columnHelper = createColumnHelper<User>();

const columns = [
  columnHelper.accessor("id", { header: "ID" }),
  columnHelper.accessor("name", { header: "Name" }),
  columnHelper.accessor("age", { header: "Age" }),
];

const data: User[] = [
  { id: 1, name: "Alice", age: 22 },
  { id: 2, name: "Bob", age: 28 },
];
```

---

### 2. Basic Table (無分頁)

```tsx
<Table mode="basic" columns={columns} data={data} />
```

---

### 3. Client Table (前端分頁)

```tsx
<Table
  mode="client"
  columns={columns}
  data={data}
  initialPageSize={5}
  pageSizeOptions={[5, 10, 20]}
/>
```

---

### 4. Server Table (後端分頁)

```tsx
<Table
  mode="server"
  columns={columns}
  data={serverData}
  total={100} // 總筆數
  pageIndex={pageIndex} // 當前頁
  pageSize={pageSize} // 每頁筆數
  onPaginationChange={(updater) => {
    const next =
      typeof updater === "function"
        ? updater({ pageIndex, pageSize })
        : updater;
    setPageIndex(next.pageIndex);
    setPageSize(next.pageSize);
    fetchData(next); // 重新打 API
  }}
  isLoading={loading}
/>
```

---

## 🔹 勾選功能 (Row Selection)

所有模式都支援 `enableRowSelection` 與 `onRowSelectionChange`：

```tsx
<Table
  mode="client"
  columns={columns}
  data={data}
  enableRowSelection
  onRowSelectionChange={(rows) => {
    console.log("被選取的列：", rows);
  }}
/>
```

---

## 🔹 Actions 欄位範例

你可以在欄位中新增自訂操作按鈕，例如編輯 / 刪除：

```tsx
import { Button } from "@/components/ui/button";

const columns = [
  columnHelper.accessor("id", { header: "ID" }),
  columnHelper.accessor("name", { header: "Name" }),
  columnHelper.accessor("age", { header: "Age" }),
  columnHelper.display({
    id: "actions",
    header: "Actions",
    cell: (info) => {
      const row = info.row.original;
      return (
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => alert(`Edit user ${row.id}`)}
          >
            Edit
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={() => alert(`Delete user ${row.id}`)}
          >
            Delete
          </Button>
        </div>
      );
    },
  }),
];
```

---

## 🔹 Props 總覽

### BasicTableProps

```ts
{
  columns: TableColumns<T>
  data: T[]
  enableRowSelection?: boolean
  onRowSelectionChange?: (rows: T[]) => void
}
```

### ClientTableProps

```ts
{
  columns: TableColumns<T>
  data: T[]
  pageSizeOptions?: number[]
  initialPageSize?: number
  enableRowSelection?: boolean
  onRowSelectionChange?: (rows: T[]) => void
}
```

### ServerTableProps

```ts
{
  columns: TableColumns<T>
  data: T[]
  total: number
  pageIndex: number
  pageSize: number
  onPaginationChange: OnChangeFn<PaginationState>
  pageSizeOptions?: number[]
  isLoading?: boolean
  enableRowSelection?: boolean
  onRowSelectionChange?: (rows: T[]) => void
}
```

---

## 🔹 目錄結構

```
/tables
  ├── selectionColumn.tsx   # 勾選欄位
  ├── BasicTable.tsx        # 基本表格
  ├── ClientTable.tsx       # 前端分頁表格
  ├── ServerTable.tsx       # 後端分頁表格
  ├── Pagination.tsx        # 共用分頁元件
  ├── Table.tsx             # Facade，統一入口
  ├── types.ts              # 型別定義
  └── index.ts              # 匯出入口
```

---

## 🔑 功能總結

- 三種模式：basic / client / server
- 可插入自訂 columns (含操作欄)
- 支援 row selection（含全選）
- 分頁支援 client & server
- 類型安全，完全基於泛型 T
