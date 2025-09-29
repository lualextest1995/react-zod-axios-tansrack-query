import { getPost } from "@/apis";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

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

  // ✅ queryKey 使用完整的 queryCondition
  const { data, isFetching, refetch } = useQuery({
    queryKey: ["posts", queryCondition],
    queryFn: () =>
      getPost({
        id: queryCondition.dataId,
        page: queryCondition.page,
        page_size: queryCondition.pageSize,
      }),
  });

  const handleSearch = () => {
    const dataId =
      formCondition.dataId === "" ? 1 : Number(formCondition.dataId);

    // 如果 dataId 跟之前一樣，只需要 refetch
    if (dataId === queryCondition.dataId) {
      console.log("dataId 相同，refetch");
      refetch();
    } else {
      console.log("dataId 不同，更新 queryCondition");
      // 如果 dataId 改變了，更新 queryCondition（會自動觸發）
      setQueryCondition({
        dataId,
        page: 1,
        pageSize: queryCondition.pageSize,
      });
    }
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
