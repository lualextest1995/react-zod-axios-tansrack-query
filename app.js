const fakeData = [
  {
    name: "儀錶板",
    page: [
      {
        name: "核心指標",
        path: "/keyMetrics",
        sort: 1,
        grant: ["export", "list"],
        i18nKey: "core_metrics",
      },
      {
        name: "圖表",
        path: "/charts",
        sort: 2,
        grant: ["export", "list"],
        i18nKey: "chart",
      },
    ],
    path: "/dashboard",
    sort: 1,
    i18nKey: "dashboard",
  },
  {
    name: "用戶管理",
    page: [
      {
        name: "用戶列表",
        path: "/userList",
        sort: 1,
        grant: ["edit", "list", "matchMode", "setPlatformStatus"],
        i18nKey: "user_list",
      },
      {
        name: "錢包管理",
        path: "/walletManagement",
        sort: 2,
        grant: ["edit", "list"],
        i18nKey: "wallet_management",
      },
      {
        name: "帳戶狀態管理",
        path: "/accountStatusManagement",
        sort: 3,
        grant: ["edit", "list"],
        i18nKey: "account_status_management",
      },
    ],
    path: "/userManagement",
    sort: 2,
    i18nKey: "user_management",
  },
  {
    name: "競爭管理",
    page: [
      {
        name: "競爭列表",
        path: "/competitionList",
        sort: 1,
        grant: ["edit", "list", "matchMode", "setPlatformStatus"],
        i18nKey: "competition_list",
      },
      {
        name: "手動狀態干預",
        path: "/manualStatusIntervention",
        sort: 2,
        grant: ["edit", "list"],
        i18nKey: "manual_status_intervention",
      },
    ],
    path: "/competitionManagement",
    sort: 3,
    i18nKey: "competition_management",
  },
  {
    name: "仲裁審查",
    page: [
      {
        name: "爭議案件列表",
        path: "/disputeList",
        sort: 1,
        grant: ["edit", "list", "matchMode", "setPlatformStatus"],
        i18nKey: "dispute_case_list",
      },
      {
        name: "認證申請審查",
        path: "/certificationApplicationReview",
        sort: 2,
        grant: ["edit", "list"],
        i18nKey: "certification_application_review",
      },
    ],
    path: "/arbitrationReview",
    sort: 4,
    i18nKey: "arbitration_review",
  },
  {
    name: "管理員操作日誌",
    path: "/adminOperationLog",
    sort: 5,
    i18nKey: "admin_operation_log",
  },
  {
    name: "測試用",
    page: [
      {
        name: "test",
        path: "/test",
        sort: 1,
        grant: ["add", "edit", "delete", "list"],
        i18nKey: "test",
      },
      {
        name: "dashboard",
        path: "/dashboard",
        sort: 2,
        grant: ["edit", "list"],
        i18nKey: "dashboard",
      },
      {
        name: "users",
        path: "/users",
        sort: 3,
        grant: ["edit", "list"],
        i18nKey: "users",
      },
      {
        name: "settings",
        path: "/settings",
        sort: 4,
        grant: ["edit", "list"],
        i18nKey: "settings",
      },
    ],
    path: "/test",
    sort: 3,
    i18nKey: "test",
  },
];

const fakeData2 = [
  {
    name: "用戶管理",
    page: [
      {
        grant: ["list"],
        name: "用戶列表",
        path: "/player/list",
      },
    ],
  },
];

const routeComponentMap = {
  welcome: "WelcomePage",
  login: "Login",
  test: "HomePage",
  dashboard: "DashboardPage",
  users: "UsersPage",
  settings: "SettingsPage",
  userList: "UserList",
  "/player/list": "PlayerList",
};

const requireAuth = () => {
  return null;
};

function transformToDynamicRoutes(data) {
  const dynamicRoutes = data.flatMap(
    (module) =>
      module.page
        ?.map((p) => {
          const key = p.path.slice(1);
          const Component = routeComponentMap[key];
          if (!Component) {
            return null;
          }
          return {
            path: module.path + p.path,
            Component,
            loader: requireAuth,
            id: module.path + p.path,
            HydrateFallback: null,
            meta: { keepAlive: true, title: p.name },
          };
        })
        .filter((route) => route !== null) || []
  );
  return dynamicRoutes;
}

function transformToDynamicRoutes2(data) {
  const dynamicRoutes = data.flatMap(
    (module) =>
      module.page
        ?.map((p) => {
          const key = p.path;
          const Component = routeComponentMap[key];
          if (!Component) {
            return null;
          }
          return {
            path: p.path,
            Component,
            loader: requireAuth,
            id: p.path,
            HydrateFallback: null,
            meta: { keepAlive: true, title: p.name },
          };
        })
        .filter((route) => route !== null) || []
  );
  return dynamicRoutes;
}

function transformToMenu(data) {
  const menu = data.map((module) => ({
    title: module.i18nKey,
    url: module.path,
    items: module.page?.map((p) => ({
      title: p.i18nKey,
      url: module.path + p.path,
    })),
  }));
  return menu;
}

function transformToMenu2(data) {
  const menu = data.map((module) => ({
    title: module.name,
    url: module.name,
    items: module.page?.map((p) => ({
      title: p.name,
      url: p.path,
    })),
  }));
  return menu;
}

console.log(JSON.stringify(transformToMenu2(fakeData2), null, 2));
