import { getPosts, type Post } from "@/apis";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Table } from "@/components/tables";
import { Button } from "./ui/button";
import { createColumnHelper } from "@tanstack/react-table";

type QueryCondition = {
  page: number;
  pageSize: number;
};

const columnHelper = createColumnHelper<Post>();

const postColumns = [
  columnHelper.accessor("id", {
    header: "ID",
    cell: (info) => <div className="font-medium">{info.getValue()}</div>,
  }),
  columnHelper.accessor("userId", {
    header: "User ID",
    cell: (info) => info.getValue(),
  }),
  columnHelper.accessor("title", {
    header: "Title",
    cell: (info) => (
      <div className="max-w-xs truncate" title={info.getValue()}>
        {info.getValue()}
      </div>
    ),
  }),
  columnHelper.accessor("body", {
    header: "Content",
    cell: (info) => (
      <div className="max-w-md truncate" title={info.getValue()}>
        {info.getValue()}
      </div>
    ),
  }),
  columnHelper.display({
    id: "actions",
    header: "Actions",
    cell: (info) => {
      const id = info.row.original.id;
      return (
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => handleEdit(id)}>
            Edit
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={() => handleDelete(id)}
          >
            Delete
          </Button>
        </div>
      );
    },
  }),
];

function handleEdit(id: number) {
  alert(`Edit post ID: ${id}`);
}

function handleDelete(id: number) {
  alert(`Delete post ID: ${id}`);
}

export default function Test2() {
  console.log("Test2 render");

  const [queryCondition, setQueryCondition] = useState<QueryCondition>({
    page: 1,
    pageSize: 10,
  });

  // ✅ 固定 queryKey，只靠手動 refetch
  const { data, isFetching, refetch } = useQuery({
    queryKey: ["posts"],
    queryFn: () => getPosts(),
    enabled: false, // ❌ 初始不打
  });

  // ✅ page / pageSize 改變時，自動 refetch
  useEffect(() => {
    refetch();
  }, [queryCondition.page, queryCondition.pageSize, refetch]);

  const handleSearch = async () => {
    setQueryCondition((prev) => ({
      ...prev,
      page: 1, // 搜尋時重置 page
    }));

    if (queryCondition.page !== 1) return;
    refetch(); // ✅ 搜尋永遠打
  };

  return (
    <div className="space-y-6">
      <div className="flex gap-2">
        <Button onClick={handleSearch}>search</Button>
        <Button
          onClick={() =>
            setQueryCondition((prev) => ({ ...prev, page: prev.page + 1 }))
          }
        >
          page++
        </Button>
        <Button
          onClick={() =>
            setQueryCondition((prev) => ({
              ...prev,
              pageSize: prev.pageSize + 1,
            }))
          }
        >
          pageSize++
        </Button>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">API Posts Data</h3>
        {isFetching ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-lg">Loading...</div>
          </div>
        ) : data && Array.isArray(data) && data.length > 0 ? (
          <div className="mb-6">
            <Table
              mode="basic"
              columns={postColumns}
              data={data}
              enableRowSelection
              onRowSelectionChange={(rows) => {
                console.log("選中的使用者:", rows);
              }}
            />
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            No data available. Click "search" to load posts.
          </div>
        )}
      </div>

      {data && (
        <details className="mt-6">
          <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-800">
            Show Raw API Response
          </summary>
          <pre className="mt-2 text-xs bg-gray-100 p-4 rounded overflow-auto max-h-96">
            {JSON.stringify(data, null, 2)}
          </pre>
        </details>
      )}
    </div>
  );
}
