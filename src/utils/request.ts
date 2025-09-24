import axios, {
  type AxiosRequestConfig,
  type AxiosResponse,
  type AxiosInstance,
  type InternalAxiosRequestConfig,
  type AxiosError,
} from "axios";

import { getLocalStorage, getSessionStorage } from "./storage";
import { getCookie, setCookie } from "./cookie";
import { getExpiredTime } from "./jwt";

interface QueueTask {
  config: AxiosRequestConfig;
  resolve: (value: AxiosResponse) => void;
  reject: (reason?: Error) => void;
}

interface HttpError extends Error {
  config: AxiosRequestConfig;
  handled?: boolean;
  isOfflineError?: boolean;
  isUnauthorizedError?: boolean;
  isRefreshingTokenError?: boolean;
  status?: number;
  response?: {
    status: number;
    data?: unknown;
    headers?: Record<string, string>;
  };
}

interface ErrorFlags {
  isOfflineError?: boolean;
  isUnauthorizedError?: boolean;
  isRefreshingTokenError?: boolean;
  [key: string]: unknown;
}

type PipelineFunction<T> = (input: T) => Promise<T> | T;

/** ---------- QueueManager ---------- */
class QueueManager {
  private queue: QueueTask[];

  constructor() {
    this.queue = [];
  }

  enqueue(config: AxiosRequestConfig): Promise<AxiosResponse> {
    return new Promise<AxiosResponse>((resolve, reject) => {
      this.queue.push({ config, resolve, reject });
    });
  }

  async resolveAll(instance: AxiosInstance): Promise<void> {
    for (const task of this.queue) {
      if (isLogout) {
        task.reject(new UnauthorizedError("未授權，請重新登入", task.config));
        continue;
      }
      try {
        const retryConfig = { ...task.config, _internalRetry: true };
        const res = await instance(retryConfig);
        task.resolve(res);
      } catch (err: unknown) {
        const error = err as HttpError;
        if (error.status === 401 || error.response?.status === 401) {
          task.reject(
            new UnauthorizedError("登入已失效，請重新登入", task.config)
          );
          isLogout = true;
        } else {
          task.reject(error);
        }
      }
    }
    this.clear();
    isLogout = false;
  }

  rejectAll(err: Error): void {
    this.queue.forEach((task) => task.reject(err));
    this.clear();
  }

  clear(): void {
    this.queue = [];
  }
}

/** ---------- 錯誤類別 ---------- */
class BaseHttpError extends Error implements HttpError {
  public name: string;
  public config: AxiosRequestConfig;
  public handled: boolean;
  public isOfflineError?: boolean;
  public isUnauthorizedError?: boolean;
  public isRefreshingTokenError?: boolean;
  public status?: number;
  public response?: {
    status: number;
    data?: unknown;
    headers?: Record<string, string>;
  };

  constructor(
    message: string,
    name: string,
    config: AxiosRequestConfig,
    flags: ErrorFlags = {}
  ) {
    super(message);
    this.name = name;
    this.config = config;
    this.handled = true;
    Object.assign(this, flags);
  }
}

class OfflineError extends BaseHttpError {
  constructor(
    message: string = "設備目前離線，請檢查網路連線",
    config: AxiosRequestConfig
  ) {
    super(message, "OfflineError", config, { isOfflineError: true });
  }
}

class UnauthorizedError extends BaseHttpError {
  constructor(
    message: string = "未授權，請重新登入",
    config: AxiosRequestConfig
  ) {
    super(message, "UnauthorizedError", config, { isUnauthorizedError: true });
  }
}

class IsRefreshingTokenError extends BaseHttpError {
  constructor(
    message: string = "正在刷新 token，請稍後再試",
    config: AxiosRequestConfig
  ) {
    super(message, "IsRefreshingTokenError", config, {
      isRefreshingTokenError: true,
    });
  }
}

/** ---------- 常數定義 ---------- */
const magicWord = {
  ACCESS_TOKEN: "accessToken",
  REFRESH_TOKEN: "refreshToken",
  X_ACCESS_TOKEN: "x-access-token",
  X_REFRESH_TOKEN: "x-refresh-token",
  X_LOCALE: "x-locale",
  LANGUAGE: "language",
  CURRENCY: "currency",
} as const;

const baseURL = "/api";
const failedQueue = new QueueManager();
let isRefreshing = false;
let isLogout = false;
let refreshAttempts = 0;
let lastResetTime = Date.now();
const MAX_REFRESH_ATTEMPTS = 10; // 1分鐘內最多10次
const RESET_INTERVAL = 60 * 1000; // 1分鐘

/** ---------- axios instance ---------- */
const axiosInstance = axios.create({
  baseURL,
  timeout: 24 * 60 * 60 * 1000,
  headers: { "Content-Type": "application/json;charset=UTF-8" },
});

/** ---------- Request Interceptor ---------- */
axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) =>
    applyPipeline<InternalAxiosRequestConfig>(config, [
      checkNetwork,
      checkIsRefreshing,
      preprocessRequest,
      setCurrency,
      setLanguage,
      setAccessToken,
    ]),
  (error: AxiosError) => Promise.reject(error)
);

/** ---------- Response Interceptor ---------- */
axiosInstance.interceptors.response.use(
  async (response: AxiosResponse) => {
    return applyPipeline<AxiosResponse>(response, [
      preprocessResponse,
      updateAuth,
      parseBinaryResponse,
    ]).then((res) => res.data);
  },
  async (error: AxiosError) => {
    const { config, status, response } = error;

    // 已重試過 → 清除憑證
    if (config && config._internalRetry) {
      resetAuth("重試失敗", error);
      return Promise.reject(error);
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;

/** ---------- Pipeline 函數 ---------- */
async function applyPipeline<T>(
  input: T,
  fns: PipelineFunction<T>[]
): Promise<T> {
  let result: T = input;
  for (const fn of fns) {
    result = await fn(result);
  }
  return result;
}

/** ---------- 請求工具函數 ---------- */
// 檢查網路狀態
function checkNetwork(
  config: InternalAxiosRequestConfig
): InternalAxiosRequestConfig {
  if (!navigator.onLine)
    throw new OfflineError("設備目前離線，請檢查網路連線", config);
  return config;
}

// 檢查是否正在刷新 token
function checkIsRefreshing(
  config: InternalAxiosRequestConfig
): InternalAxiosRequestConfig {
  if (isRefreshing)
    throw new IsRefreshingTokenError("正在刷新 token，請稍後再試", config);
  return config;
}

// 預處理請求，將 data 與 params 分流
function preprocessRequest(
  config: InternalAxiosRequestConfig
): InternalAxiosRequestConfig {
  if (config.isPreprocessing) return config;
  const method = config.method?.toLowerCase() || "get";
  const isWrite = ["post", "put", "patch", "delete"].includes(method);

  config = requestValidate(config);

  config = processUrlTemplate(config);

  if (isWrite) {
    config.params = undefined;
  } else {
    config.params = config.data;
    config.data = undefined;
  }

  config.isPreprocessing = true;
  return config;
}

// 請求資料驗證
function requestValidate(
  config: InternalAxiosRequestConfig
): InternalAxiosRequestConfig {
  const { codec, data, url } = config;
  if (!codec?.request) return config;
  try {
    const { frontendSchema, backendSchema } = codec.request;
    const dataKeyMap = codec.dataKeyMap ?? {};
    // 1. 驗證 frontendSchema
    const parsedF = frontendSchema.parse(data);
    // 2. keyMap camel → snake
    const mapped =
      Object.keys(dataKeyMap).length > 0
        ? mapKeys(parsedF, dataKeyMap, "f2b")
        : parsedF;
    // 3. 驗證 backendSchema
    const parsedB = backendSchema.parse(mapped);
    config.data = parsedB;
  } catch (err) {
    console.warn(`路徑 ${url} 請求資料格式錯誤`, err);
  }
  return config;
}

// 處理 URL 模板參數，例如 /api/users/{userId}
function processUrlTemplate(
  config: InternalAxiosRequestConfig
): InternalAxiosRequestConfig {
  if (!config.url || typeof config.data !== "object" || config.data === null)
    return config;
  const urlParams: Record<string, string> = {};
  config.url = config.url.replace(
    /\{(\w+)\}/g,
    (match: string, key: string) => {
      if (key in config.data) {
        urlParams[key] = config.data[key];
        return config.data[key];
      }
      return match;
    }
  );
  if (config.removeUrlParams !== false) {
    config.data = Object.fromEntries(
      Object.entries(config.data).filter(([k]) => !(k in urlParams))
    );
  }
  return config;
}

// 設定貨幣標頭
function setCurrency(
  config: InternalAxiosRequestConfig
): InternalAxiosRequestConfig {
  const currency = getSessionStorage(magicWord.CURRENCY);
  if (currency) config.headers[magicWord.CURRENCY] = currency;
  return config;
}

// 設定語言標頭
function setLanguage(
  config: InternalAxiosRequestConfig
): InternalAxiosRequestConfig {
  const lang = getLocalStorage(magicWord.LANGUAGE);
  if (lang) config.headers[magicWord.X_LOCALE] = lang;
  return config;
}

// 設定 Access Token 標頭
function setAccessToken(
  config: InternalAxiosRequestConfig
): InternalAxiosRequestConfig {
  const accessToken = getCookie(magicWord.ACCESS_TOKEN);
  if (accessToken) config.headers[magicWord.X_ACCESS_TOKEN] = accessToken;
  return config;
}

/** ---------- 回應工具函數 ---------- */
// 預處理回應，包含資料驗證與 key 映射
function preprocessResponse(response: AxiosResponse): AxiosResponse {
  response = responseValidate(response);
  // 將 response.data 加入 success 欄位為 true
  response.data = {
    success: true,
    ...response.data,
  };

  return response;
}

// 回應資料驗證
function responseValidate(response: AxiosResponse): AxiosResponse {
  const { config, data } = response;
  const { codec, url } = config;
  if (!codec?.response) return response;
  try {
    const { frontendSchema, backendSchema } = codec.response;
    const dataKeyMap = codec.dataKeyMap ?? {};
    // 1. 驗證 backendSchema
    const parsedB = backendSchema.parse(data);
    // 2. keyMap snake → camel
    const mapped =
      Object.keys(dataKeyMap).length > 0
        ? mapKeys(parsedB, dataKeyMap, "b2f")
        : parsedB;
    // 3. 驗證 frontendSchema
    const parsedF = frontendSchema.parse(mapped);
    response.data = parsedF;
  } catch (err) {
    console.warn(`路徑 ${url} 回應資料格式錯誤`, err);
  }
  return response;
}

// 更新認證資訊
function updateAuth(response: AxiosResponse): AxiosResponse {
  const { data } = response;
  const newAccessToken = data?.[magicWord.ACCESS_TOKEN];
  const newRefreshToken = data?.[magicWord.REFRESH_TOKEN];
  if (newAccessToken && newRefreshToken) {
    const expiredTime = getExpiredTime(newRefreshToken);
    const expiredDate = new Date(expiredTime * 1000);
    setCookie(magicWord.ACCESS_TOKEN, newAccessToken);
    setCookie(magicWord.REFRESH_TOKEN, newRefreshToken, {
      expires: expiredDate,
    });
  }
  return response;
}

// 處理二進位回應
function parseBinaryResponse(response: AxiosResponse): AxiosResponse {
  const { data } = response;
  if (data instanceof Blob || data instanceof ArrayBuffer) {
    // 先不動
  }

  return response;
}

/** --------- 遞迴 key 映射工具 --------- */
type KeyMap = Record<string, string>; // backend_key -> frontendKey

const isPlainObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" &&
  v !== null &&
  !Array.isArray(v) &&
  Object.prototype.toString.call(v) === "[object Object]";

export function mapKeys(
  input: unknown,
  keyMap: KeyMap,
  direction: "b2f" | "f2b"
): unknown {
  if (Array.isArray(input)) {
    return input.map((x) => mapKeys(x, keyMap, direction));
  }
  if (!isPlainObject(input)) {
    return input;
  }
  const result: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(input)) {
    const mapped =
      direction === "b2f"
        ? keyMap[k] ?? k // 後端 → 前端
        : Object.keys(keyMap).find((bk) => keyMap[bk] === k) ?? k; // 前端 → 後端 (反查)

    result[mapped] = mapKeys(v, keyMap, direction);
  }
  return result;
}

/** ---------- 工具函式 ---------- */
function resetAuth(reason, error = null) {
  Cookies.remove(magicWord.ACCESS_TOKEN);
  Cookies.remove(magicWord.REFRESH_TOKEN);
  Cookies.remove(TOKEN);
  isLogout = true;
  errorHandler(error || new UnauthorizedError("登入已失效，請重新登入"));
  if (router.currentRoute.value.path !== "/login") {
    router.push("/login");
  }
}
