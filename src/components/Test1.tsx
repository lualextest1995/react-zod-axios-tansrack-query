import { getPost } from "@/apis";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";

type FormCondition = {
  dataId: string;
};

type QueryCondition = {
  dataId: number;
  page: number;
  pageSize: number;
};

export default function Test1() {
  console.log("Test1 render");

  const [formCondition, setFormCondition] = useState<FormCondition>({
    dataId: "",
  });

  const [queryCondition, setQueryCondition] = useState<QueryCondition>({
    dataId: 1,
    page: 1,
    pageSize: 10,
  });

  // ✅ 固定 queryKey，只靠手動 refetch
  const { data, isFetching, refetch } = useQuery({
    queryKey: ["posts"],
    queryFn: () =>
      getPost({
        id: queryCondition.dataId,
        page: queryCondition.page,
        page_size: queryCondition.pageSize,
      }),
    enabled: false, // ❌ 初始不打
  });

  // ✅ page / pageSize 改變時，自動 refetch
  useEffect(() => {
    refetch();
  }, [queryCondition.page, queryCondition.pageSize, refetch]);

  const handleSearch = async () => {
    const dataId =
      formCondition.dataId === "" ? 1 : Number(formCondition.dataId);

    setQueryCondition((prev) => ({
      ...prev,
      dataId,
      page: 1, // 搜尋時重置 page
    }));

    if (queryCondition.page !== 1) return;
    refetch(); // ✅ 搜尋永遠打
  };

  return (
    <div>
      <div>
        <label htmlFor="id">id</label>
        <input
          id="id"
          type="number"
          value={formCondition.dataId}
          onChange={(e) =>
            setFormCondition({
              dataId: e.target.value,
            })
          }
        />
        <button onClick={handleSearch}>search</button>
        <button
          onClick={() =>
            setQueryCondition((prev) => ({ ...prev, page: prev.page + 1 }))
          }
        >
          page++
        </button>
        <button
          onClick={() =>
            setQueryCondition((prev) => ({
              ...prev,
              pageSize: prev.pageSize + 1,
            }))
          }
        >
          pageSize++
        </button>
      </div>
      <div>
        {isFetching ? "Loading..." : <pre>{JSON.stringify(data, null, 2)}</pre>}
      </div>
    </div>
  );
}
