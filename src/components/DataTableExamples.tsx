import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { createColumnHelper } from "@tanstack/react-table";
import { DataTable } from "./DataTable";
import { Button } from "./ui/button";

// ===== 服務端分頁相關類型和函數 =====
interface ServerUser {
  id: number;
  name: string;
  email: string;
  department: string;
  role: string;
  status: 'active' | 'inactive';
  joinDate: string;
  salary: number;
}

interface PaginationRequest {
  page: number;
  pageSize: number;
  search?: string;
}

interface PaginationResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// 模擬 API 數據生成
const generateMockUsers = (count: number): ServerUser[] => {
  const departments = ['工程部', '產品部', '設計部', '行銷部', '人資部', '財務部'];
  const roles = ['經理', '資深工程師', '工程師', '實習生', '主任', '專員'];
  const firstNames = ['小明', '小華', '小美', '小強', '小芳', '小傑', '小雅', '小威', '小玲', '小文'];
  const lastNames = ['王', '李', '張', '劉', '陳', '楊', '黃', '趙', '吳', '周'];

  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    name: `${lastNames[i % lastNames.length]}${firstNames[i % firstNames.length]}`,
    email: `user${i + 1}@company.com`,
    department: departments[i % departments.length],
    role: roles[i % roles.length],
    status: Math.random() > 0.2 ? 'active' : 'inactive' as const,
    joinDate: new Date(2020 + Math.floor(Math.random() * 4), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1).toISOString().split('T')[0],
    salary: Math.floor(Math.random() * 100000) + 40000,
  }));
};

// 模擬大量數據（1000筆）
const MOCK_USERS = generateMockUsers(1000);

// 模擬 API 調用
const fetchUsers = async ({ page, pageSize, search }: PaginationRequest): Promise<PaginationResponse<ServerUser>> => {
  // 模擬網路延遲
  await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 500));

  let filteredUsers = MOCK_USERS;

  // 搜尋功能
  if (search && search.trim()) {
    const searchLower = search.toLowerCase();
    filteredUsers = MOCK_USERS.filter(user =>
      user.name.toLowerCase().includes(searchLower) ||
      user.email.toLowerCase().includes(searchLower) ||
      user.department.toLowerCase().includes(searchLower)
    );
  }

  const total = filteredUsers.length;
  const totalPages = Math.ceil(total / pageSize);
  const start = page * pageSize;
  const end = start + pageSize;
  const data = filteredUsers.slice(start, end);

  return {
    data,
    total,
    page,
    pageSize,
    totalPages,
  };
};

// ===== 範例 1: 用戶數據表格 =====
interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  status: 'active' | 'inactive';
  joinDate: string;
}

const userColumnHelper = createColumnHelper<User>();

const userColumns = [
  userColumnHelper.accessor("id", {
    header: "ID",
    cell: (info) => <div className="font-mono text-sm">{info.getValue()}</div>,
  }),
  userColumnHelper.accessor("name", {
    header: "姓名",
    cell: (info) => <div className="font-medium">{info.getValue()}</div>,
  }),
  userColumnHelper.accessor("email", {
    header: "Email",
    cell: (info) => <div className="text-blue-600">{info.getValue()}</div>,
  }),
  userColumnHelper.accessor("role", {
    header: "角色",
    cell: (info) => (
      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
        {info.getValue()}
      </span>
    ),
  }),
  userColumnHelper.accessor("status", {
    header: "狀態",
    cell: (info) => {
      const status = info.getValue();
      return (
        <span
          className={`px-2 py-1 rounded-full text-xs ${
            status === 'active'
              ? 'bg-green-100 text-green-800'
              : 'bg-red-100 text-red-800'
          }`}
        >
          {status === 'active' ? '啟用' : '停用'}
        </span>
      );
    },
  }),
  userColumnHelper.accessor("joinDate", {
    header: "加入日期",
    cell: (info) => new Date(info.getValue()).toLocaleDateString('zh-TW'),
  }),
];

const sampleUsers: User[] = [
  {
    id: 1,
    name: "張小明",
    email: "ming@example.com",
    role: "管理員",
    status: "active",
    joinDate: "2023-01-15"
  },
  {
    id: 2,
    name: "李小華",
    email: "hua@example.com",
    role: "編輯",
    status: "active",
    joinDate: "2023-03-20"
  },
  {
    id: 3,
    name: "王大明",
    email: "daming@example.com",
    role: "查看者",
    status: "inactive",
    joinDate: "2023-02-10"
  },
  {
    id: 4,
    name: "陳小花",
    email: "flower@example.com",
    role: "編輯",
    status: "active",
    joinDate: "2023-04-05"
  },
  {
    id: 5,
    name: "林大偉",
    email: "david@example.com",
    role: "管理員",
    status: "active",
    joinDate: "2023-01-30"
  },
];

// ===== 範例 2: 產品數據表格 =====
interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  rating: number;
}

const productColumnHelper = createColumnHelper<Product>();

const productColumns = [
  productColumnHelper.accessor("id", {
    header: "商品ID",
    cell: (info) => <div className="font-mono text-sm">{info.getValue()}</div>,
  }),
  productColumnHelper.accessor("name", {
    header: "商品名稱",
    cell: (info) => <div className="font-medium">{info.getValue()}</div>,
  }),
  productColumnHelper.accessor("category", {
    header: "分類",
    cell: (info) => (
      <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-xs">
        {info.getValue()}
      </span>
    ),
  }),
  productColumnHelper.accessor("price", {
    header: "價格",
    cell: (info) => (
      <div className="text-right font-medium">
        NT$ {info.getValue().toLocaleString()}
      </div>
    ),
  }),
  productColumnHelper.accessor("stock", {
    header: "庫存",
    cell: (info) => {
      const stock = info.getValue();
      return (
        <div className={`text-center ${stock < 10 ? 'text-red-600 font-medium' : ''}`}>
          {stock}
        </div>
      );
    },
  }),
  productColumnHelper.accessor("rating", {
    header: "評分",
    cell: (info) => (
      <div className="text-center">
        ⭐ {info.getValue().toFixed(1)}
      </div>
    ),
  }),
];

const sampleProducts: Product[] = [
  { id: "P001", name: "iPhone 15", category: "手機", price: 32900, stock: 15, rating: 4.8 },
  { id: "P002", name: "MacBook Air", category: "筆電", price: 36900, stock: 8, rating: 4.9 },
  { id: "P003", name: "iPad Pro", category: "平板", price: 26900, stock: 3, rating: 4.7 },
  { id: "P004", name: "AirPods Pro", category: "耳機", price: 7490, stock: 25, rating: 4.6 },
  { id: "P005", name: "Apple Watch", category: "智慧錶", price: 12900, stock: 12, rating: 4.5 },
];

// ===== 範例 3: 簡單表格（無分頁） =====
interface SimpleItem {
  name: string;
  value: string;
  description: string;
}

const simpleColumnHelper = createColumnHelper<SimpleItem>();

const simpleColumns = [
  simpleColumnHelper.accessor("name", {
    header: "名稱",
    cell: (info) => <div className="font-medium">{info.getValue()}</div>,
  }),
  simpleColumnHelper.accessor("value", {
    header: "值",
    cell: (info) => <div className="font-mono text-sm">{info.getValue()}</div>,
  }),
  simpleColumnHelper.accessor("description", {
    header: "描述",
    cell: (info) => <div className="text-gray-600">{info.getValue()}</div>,
  }),
];

const simpleData: SimpleItem[] = [
  { name: "API URL", value: "https://api.example.com", description: "主要 API 端點" },
  { name: "版本", value: "v1.2.3", description: "目前系統版本" },
  { name: "狀態", value: "運行中", description: "系統運行狀態" },
];

// ===== 範例 4: 服務端分頁 =====
const serverUserColumnHelper = createColumnHelper<ServerUser>();

const serverUserColumns = [
  serverUserColumnHelper.accessor("id", {
    header: "ID",
    cell: (info) => <div className="font-mono text-sm">{info.getValue()}</div>,
  }),
  serverUserColumnHelper.accessor("name", {
    header: "姓名",
    cell: (info) => <div className="font-medium">{info.getValue()}</div>,
  }),
  serverUserColumnHelper.accessor("email", {
    header: "Email",
    cell: (info) => <div className="text-blue-600 text-sm">{info.getValue()}</div>,
  }),
  serverUserColumnHelper.accessor("department", {
    header: "部門",
    cell: (info) => (
      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
        {info.getValue()}
      </span>
    ),
  }),
  serverUserColumnHelper.accessor("role", {
    header: "職位",
    cell: (info) => (
      <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-xs">
        {info.getValue()}
      </span>
    ),
  }),
  serverUserColumnHelper.accessor("status", {
    header: "狀態",
    cell: (info) => {
      const status = info.getValue();
      return (
        <span
          className={`px-2 py-1 rounded-full text-xs ${
            status === 'active'
              ? 'bg-green-100 text-green-800'
              : 'bg-red-100 text-red-800'
          }`}
        >
          {status === 'active' ? '在職' : '離職'}
        </span>
      );
    },
  }),
  serverUserColumnHelper.accessor("joinDate", {
    header: "入職日期",
    cell: (info) => new Date(info.getValue()).toLocaleDateString('zh-TW'),
  }),
  serverUserColumnHelper.accessor("salary", {
    header: "薪資",
    cell: (info) => (
      <div className="text-right font-medium">
        NT$ {info.getValue().toLocaleString()}
      </div>
    ),
  }),
];

// ===== 主要組件 =====
export default function DataTableExamples() {
  const [currentExample, setCurrentExample] = useState(1);

  // 服務端分頁相關狀態
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");

  // 使用 TanStack Query 來管理服務端分頁數據
  const { data: response, isLoading, error } = useQuery({
    queryKey: ['users', pagination.pageIndex, pagination.pageSize, search],
    queryFn: () => fetchUsers({
      page: pagination.pageIndex,
      pageSize: pagination.pageSize,
      search,
    }),
    enabled: currentExample === 4, // 只有在範例 4 時才執行
    staleTime: 1000,
  });

  const handlePaginationChange = (pageIndex: number, pageSize: number) => {
    setPagination({ pageIndex, pageSize });
  };

  const handleSearch = () => {
    setSearch(searchInput);
    setPagination(prev => ({ ...prev, pageIndex: 0 })); // 搜尋時重置到第一頁
  };

  const handleClearSearch = () => {
    setSearchInput("");
    setSearch("");
    setPagination(prev => ({ ...prev, pageIndex: 0 }));
  };

  return (
    <div className="space-y-8 p-6">
      <div>
        <h1 className="text-2xl font-bold mb-4">DataTable 使用範例</h1>
        <p className="text-gray-600 mb-6">
          以下展示了 DataTable 組件的各種使用方式和功能
        </p>

        {/* 範例選擇器 */}
        <div className="flex gap-2 mb-6">
          <Button
            variant={currentExample === 1 ? "default" : "outline"}
            onClick={() => setCurrentExample(1)}
          >
            用戶管理
          </Button>
          <Button
            variant={currentExample === 2 ? "default" : "outline"}
            onClick={() => setCurrentExample(2)}
          >
            商品列表
          </Button>
          <Button
            variant={currentExample === 3 ? "default" : "outline"}
            onClick={() => setCurrentExample(3)}
          >
            簡單表格
          </Button>
          <Button
            variant={currentExample === 4 ? "default" : "outline"}
            onClick={() => setCurrentExample(4)}
          >
            服務端分頁
          </Button>
        </div>
      </div>

      {/* 範例 1: 用戶管理表格 */}
      {currentExample === 1 && (
        <div className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold mb-2">範例 1: 用戶管理表格</h2>
            <p className="text-gray-600 mb-4">
              展示用戶列表，包含狀態標籤、日期格式化、自定義樣式等功能
            </p>
          </div>

          <DataTable
            // @ts-expect-error - TanStack Table complex generic inference issue
            columns={userColumns}
            data={sampleUsers}
            initialPageSize={5}
          />

          <details className="mt-6">
            <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-800">
              查看代碼
            </summary>
            <pre className="mt-2 text-xs bg-gray-100 p-4 rounded overflow-auto">
{`const userColumns = [
  userColumnHelper.accessor("id", {
    header: "ID",
    cell: (info) => <div className="font-mono text-sm">{info.getValue()}</div>,
  }),
  userColumnHelper.accessor("status", {
    header: "狀態",
    cell: (info) => {
      const status = info.getValue();
      return (
        <span
          className={\`px-2 py-1 rounded-full text-xs \${
            status === 'active'
              ? 'bg-green-100 text-green-800'
              : 'bg-red-100 text-red-800'
          }\`}
        >
          {status === 'active' ? '啟用' : '停用'}
        </span>
      );
    },
  }),
  // ... 其他列
];

<DataTable
  columns={userColumns}
  data={userData}
  initialPageSize={5}
/>`}
            </pre>
          </details>
        </div>
      )}

      {/* 範例 2: 商品列表表格 */}
      {currentExample === 2 && (
        <div className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold mb-2">範例 2: 商品列表表格</h2>
            <p className="text-gray-600 mb-4">
              展示商品數據，包含價格格式化、庫存警告、評分顯示等功能
            </p>
          </div>

          <DataTable
            // @ts-expect-error - TanStack Table complex generic inference issue
            columns={productColumns}
            data={sampleProducts}
            initialPageSize={3}
          />

          <details className="mt-6">
            <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-800">
              查看代碼
            </summary>
            <pre className="mt-2 text-xs bg-gray-100 p-4 rounded overflow-auto">
{`const productColumns = [
  productColumnHelper.accessor("price", {
    header: "價格",
    cell: (info) => (
      <div className="text-right font-medium">
        NT$ {info.getValue().toLocaleString()}
      </div>
    ),
  }),
  productColumnHelper.accessor("stock", {
    header: "庫存",
    cell: (info) => {
      const stock = info.getValue();
      return (
        <div className={\`text-center \${stock < 10 ? 'text-red-600 font-medium' : ''}\`}>
          {stock}
        </div>
      );
    },
  }),
  // ... 其他列
];`}
            </pre>
          </details>
        </div>
      )}

      {/* 範例 3: 簡單表格 */}
      {currentExample === 3 && (
        <div className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold mb-2">範例 3: 簡單表格（無分頁）</h2>
            <p className="text-gray-600 mb-4">
              簡單的配置表格，數據較少時可以不使用分頁功能
            </p>
          </div>

          <DataTable
            columns={simpleColumns}
            data={simpleData}
            initialPageSize={10} // 設定較大的頁面大小，實際上會顯示所有數據
          />

          <details className="mt-6">
            <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-800">
              查看代碼
            </summary>
            <pre className="mt-2 text-xs bg-gray-100 p-4 rounded overflow-auto">
{`// 簡單的三列表格
const simpleColumns = [
  simpleColumnHelper.accessor("name", {
    header: "名稱",
    cell: (info) => <div className="font-medium">{info.getValue()}</div>,
  }),
  simpleColumnHelper.accessor("value", {
    header: "值",
    cell: (info) => <div className="font-mono text-sm">{info.getValue()}</div>,
  }),
  simpleColumnHelper.accessor("description", {
    header: "描述",
    cell: (info) => <div className="text-gray-600">{info.getValue()}</div>,
  }),
];

<DataTable
  columns={simpleColumns}
  data={simpleData}
  initialPageSize={10}
/>`}
            </pre>
          </details>
        </div>
      )}

      {/* 範例 4: 服務端分頁 */}
      {currentExample === 4 && (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold mb-4">服務端分頁範例</h2>
            <p className="text-gray-600 mb-4">
              展示如何使用 DataTable 組件實現服務端分頁，包含搜尋功能和載入狀態
            </p>
            <p className="text-sm text-gray-500 mb-4">
              📊 模擬數據：1000 筆員工資料 | 🔍 支援姓名、Email、部門搜尋 | ⚡ 真實的網路延遲體驗
            </p>
          </div>

          {/* 搜尋區域 */}
          <div className="flex gap-2 items-center">
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="搜尋姓名、Email 或部門..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSearch();
                }
              }}
            />
            <Button onClick={handleSearch}>搜尋</Button>
            <Button variant="outline" onClick={handleClearSearch}>
              清除
            </Button>
          </div>

          {error ? (
            <div className="text-center py-8">
              <div className="text-red-600">載入失敗，請重試</div>
            </div>
          ) : (
            <>
              {/* 服務端分頁表格 */}
              <DataTable
                // @ts-expect-error - TanStack Table complex generic inference issue
                columns={serverUserColumns}
                data={response?.data ?? []}
                manualPagination={true}
                paginationInfo={response ? {
                  pageIndex: response.page,
                  pageSize: response.pageSize,
                  pageCount: response.totalPages,
                  total: response.total,
                } : {
                  pageIndex: 0,
                  pageSize: 10,
                  pageCount: 0,
                  total: 0,
                }}
                onPaginationChange={handlePaginationChange}
                isLoading={isLoading}
              />

              {/* 統計信息 */}
              {response && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-medium mb-2">📈 統計信息</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <div className="text-gray-600">總數據量</div>
                      <div className="font-semibold">{response.total.toLocaleString()} 筆</div>
                    </div>
                    <div>
                      <div className="text-gray-600">當前頁面</div>
                      <div className="font-semibold">{response.page + 1} / {response.totalPages}</div>
                    </div>
                    <div>
                      <div className="text-gray-600">每頁顯示</div>
                      <div className="font-semibold">{response.pageSize} 筆</div>
                    </div>
                    <div>
                      <div className="text-gray-600">載入狀態</div>
                      <div className="font-semibold">{isLoading ? '載入中...' : '完成'}</div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {/* 代碼示例 */}
          <details className="mt-6">
            <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-800">
              查看服務端分頁代碼
            </summary>
            <pre className="mt-2 text-xs bg-gray-100 p-4 rounded overflow-auto max-h-96">
{`// 使用 TanStack Query 管理服務端數據
const { data: response, isLoading } = useQuery({
  queryKey: ['users', pagination.pageIndex, pagination.pageSize, search],
  queryFn: () => fetchUsers({
    page: pagination.pageIndex,
    pageSize: pagination.pageSize,
    search,
  }),
  staleTime: 1000, // 避免頁面切換時的閃爍
});

// 服務端分頁配置
<DataTable
  columns={userColumns}
  data={response?.data ?? []}
  manualPagination={true}  // 啟用服務端分頁
  paginationInfo={{
    pageIndex: response.page,
    pageSize: response.pageSize,
    pageCount: response.totalPages,
    total: response.total,
  }}
  onPaginationChange={handlePaginationChange}
  isLoading={isLoading}
/>

// 分頁變更處理
const handlePaginationChange = (pageIndex: number, pageSize: number) => {
  setPagination({ pageIndex, pageSize });
};`}
            </pre>
          </details>
        </div>
      )}

      {/* 使用說明 */}
      <div className="mt-12 p-6 bg-blue-50 rounded-lg">
        <h3 className="text-lg font-semibold mb-4">💡 使用提示</h3>
        <div className="space-y-2 text-sm text-gray-700">
          <p><strong>1. 基本使用:</strong> 只需要定義 columns 和 data，DataTable 會自動處理分頁、排序等功能</p>
          <p><strong>2. 自定義單元格:</strong> 使用 cell 函數可以自定義每個單元格的顯示內容和樣式</p>
          <p><strong>3. 客戶端分頁:</strong> 通過 initialPageSize 設置每頁顯示的數據量</p>
          <p><strong>4. 服務端分頁:</strong> 設置 manualPagination={true}，提供 paginationInfo 和 onPaginationChange</p>
          <p><strong>5. 載入狀態:</strong> 使用 isLoading prop 在數據載入時顯示載入指示</p>
          <p><strong>6. 樣式自定義:</strong> 通過 className prop 可以添加自定義的 CSS 類別</p>
          <p><strong>7. Footer 支援:</strong> 可以通過 showFooter 和 footerContent 添加表格底部內容</p>
        </div>
      </div>
    </div>
  );
}