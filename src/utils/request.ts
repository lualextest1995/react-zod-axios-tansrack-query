import axios, {
  AxiosError,
  type AxiosInstance,
  type AxiosRequestConfig,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from "axios";
import { getCookie, removeCookie, setCookie } from "@/utils/cookie";
import { getExpiredTime } from "@/utils/jwt";
import { getLocalStorage, getSessionStorage } from "@/utils/storage";

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

  public constructor() {
    this.queue = [];
  }

  public enqueue(config: AxiosRequestConfig): Promise<AxiosResponse> {
    return new Promise<AxiosResponse>((resolve, reject) => {
      console.log("加入佇列", config.url);
      this.queue.push({ config, resolve, reject });
    });
  }

  public async resolveAll(instance: AxiosInstance): Promise<void> {
    for (const task of this.queue) {
      if (isLogout) {
        task.reject(new UnauthorizedError(task.config, "未授權，請重新登入"));
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
            new UnauthorizedError(task.config, "登入已失效，請重新登入")
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

  public rejectAll(err: AxiosError): void {
    this.queue.forEach((task) => task.reject(err));
    this.clear();
  }

  public clear(): void {
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

  public constructor(
    message: string,
    errorName: string,
    requestConfig: AxiosRequestConfig,
    flags: ErrorFlags = {}
  ) {
    super(message);
    const name = errorName;
    const config = requestConfig;
    this.name = name;
    this.config = config;
    this.handled = true;
    Object.assign(this, flags);
  }
}

class OfflineError extends BaseHttpError {
  public constructor(
    config: AxiosRequestConfig,
    message: string = "設備目前離線，請檢查網路連線"
  ) {
    super(message, "OfflineError", config, { isOfflineError: true });
  }
}

class UnauthorizedError extends BaseHttpError {
  public constructor(
    config: AxiosRequestConfig,
    message: string = "未授權，請重新登入"
  ) {
    super(message, "UnauthorizedError", config, { isUnauthorizedError: true });
  }
}

class IsRefreshingTokenError extends BaseHttpError {
  public constructor(
    config: AxiosRequestConfig,
    message: string = "正在刷新 token，請稍後再試"
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
  AUTHORIZATION: "authorization",
  X_REFRESH_TOKEN: "x-refresh-token",
  X_LOCALE: "x-locale",
  LANGUAGE: "language",
  CURRENCY: "currency",
  TOKEN: "token",
} as const;

const baseURL = "/api";
const failedQueue = new QueueManager();
let isRefreshing = false;
let isLogout = false;
let refreshAttempts = 0;
let lastResetTime = Date.now();
const MAX_REFRESH_ATTEMPTS = 10;
const RESET_INTERVAL = 60 * 1000;

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
      requestValidate,
      processUrlTemplate,
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
    return await applyPipeline<AxiosResponse>(response, [
      preprocessResponse,
      responseValidate,
      updateAuth,
      parseBinaryResponse,
    ]).then((res) => res.data);
  },
  async (error: AxiosError) => {
    const newError = preprocessError(error);
    const isLogin = getCookie("token") === "token";
    const status401 = newError.response?.status === 401;
    const status400 = newError.response?.status === 400;
    const canRefreshToken =
      status401 || error.isUnauthorizedError || (!isLogin && status400);
    // const isBlob =
    //   typeof Blob !== "undefined" && newError.response?.data instanceof Blob;

    // // 二進位錯誤直接拋出(todo)
    // if (isBlob) {
    //   const parsedError = await parseBlobError(newError);
    //   return Promise.reject(parsedError);
    // }

    // 已重試過 → 清除憑證
    if (newError.config?._internalRetry) {
      resetAuth(newError);
      return Promise.reject(newError);
    }

    // 正在刷新 token，加入佇列等待
    if (newError.isRefreshingTokenError && newError.config) {
      return failedQueue.enqueue(newError.config);
    }

    // 嘗試刷新 token
    if (canRefreshToken && newError.config) {
      checkAndResetCounter(); // 檢查是否需要重置
      refreshAttempts++;
      // 超過限制直接登出
      if (refreshAttempts > MAX_REFRESH_ATTEMPTS) {
        refreshAttempts = 0;
        lastResetTime = Date.now();
        resetAuth(newError);
        return Promise.reject({
          ...newError,
          message: "refresh token 頻率過高",
        });
      }

      const queuePromise = failedQueue.enqueue(newError.config);
      if (!isRefreshing) {
        isRefreshing = true;
        await refreshTokenHandler();
      }
      return queuePromise;
    }

    // 其他錯誤直接拋出
    return Promise.reject(newError);
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

/** ---------- 請求成功工具函數 ---------- */
// 檢查網路狀態
function checkNetwork(
  config: InternalAxiosRequestConfig
): InternalAxiosRequestConfig {
  console.log("檢查網路狀態");
  if (!navigator.onLine) {
    throw new OfflineError(config, "設備目前離線，請檢查網路連線");
  }
  return config;
}

// 檢查是否正在刷新 token
function checkIsRefreshing(
  config: InternalAxiosRequestConfig
): InternalAxiosRequestConfig {
  if (isRefreshing) {
    throw new IsRefreshingTokenError(config, "正在刷新 token，請稍後再試");
  }
  return config;
}

// 請求資料驗證
function requestValidate(
  config: InternalAxiosRequestConfig
): InternalAxiosRequestConfig {
  if (config.isPreprocessing) {
    return config;
  }
  const newConfig = { ...config };
  const { codec, data, url } = newConfig;

  if (!codec?.request) {
    return newConfig;
  }

  try {
    const { frontendSchema, backendSchema } = codec.request;
    const dataKeyMap = codec.dataKeyMap ?? {};

    // 1. 驗證前端 schema
    const parsedF = frontendSchema.parse(data);
    // 2. 鍵名轉換（camel → snake）
    const hasKeyMap = Object.keys(dataKeyMap).length > 0;
    const mapped = hasKeyMap ? mapKeys(parsedF, dataKeyMap, "f2b") : parsedF;
    // 3. 驗證後端 schema
    const parsedB = backendSchema.parse(mapped);

    newConfig.data = parsedB;
  } catch (err) {
    console.warn(`路徑 ${url} 請求資料格式錯誤`, err);
  }

  return newConfig;
}

// 處理 URL 模板參數，例如 /api/users/{userId}
function processUrlTemplate(
  config: InternalAxiosRequestConfig
): InternalAxiosRequestConfig {
  if (config.isPreprocessing) {
    return config;
  }
  const newConfig = { ...config };
  const { url, data } = newConfig;
  // 早期返回，避免不必要的處理
  if (!url || typeof data !== "object" || data === null) {
    return newConfig;
  }

  const urlParams = new Set<string>();

  // 替換 URL 模板並記錄使用的參數
  const newUrl = url.replace(/\{(\w+)\}/g, (match, key) => {
    if (key in data) {
      urlParams.add(key);
      return String(data[key]);
    }
    return match;
  });

  // 決定是否要移除 URL 參數
  const shouldRemoveParams = newConfig.removeUrlParams !== false;
  const newData =
    shouldRemoveParams && urlParams.size > 0
      ? Object.fromEntries(
          Object.entries(data).filter(([key]) => !urlParams.has(key))
        )
      : data;

  return {
    ...newConfig,
    url: newUrl,
    data: newData,
  };
}

// 預處理請求，將 data 與 params 分流
function preprocessRequest(
  config: InternalAxiosRequestConfig
): InternalAxiosRequestConfig {
  if (config.isPreprocessing) {
    return config;
  }

  const method = config.method?.toLowerCase() || "get";
  const isWrite = ["post", "put", "patch", "delete"].includes(method);

  const newConfig = {
    ...config,
    params: isWrite ? undefined : config.data,
    data: isWrite ? config.data : undefined,
    isPreprocessing: true,
  };

  return newConfig;
}

// 設定貨幣標頭
function setCurrency(
  config: InternalAxiosRequestConfig
): InternalAxiosRequestConfig {
  const newConfig = { ...config };
  const currency = getSessionStorage(magicWord.CURRENCY);
  if (currency) {
    newConfig.headers[magicWord.CURRENCY] = currency;
  }
  return newConfig;
}

// 設定語言標頭
function setLanguage(
  config: InternalAxiosRequestConfig
): InternalAxiosRequestConfig {
  const newConfig = { ...config };
  const lang = getLocalStorage(magicWord.LANGUAGE);
  if (lang) {
    newConfig.headers[magicWord.X_LOCALE] = lang;
  }
  return newConfig;
}

// 設定 Access Token 標頭
function setAccessToken(
  config: InternalAxiosRequestConfig
): InternalAxiosRequestConfig {
  const newConfig = { ...config };
  const accessToken = getCookie(magicWord.ACCESS_TOKEN);

  if (accessToken) {
    newConfig.headers[magicWord.AUTHORIZATION] = `Bearer ${accessToken}`;
  }

  return newConfig;
}

/** ---------- 回應成功工具函數 ---------- */
// 預處理回應，在 data 裡面新增 success 欄位
function preprocessResponse(response: AxiosResponse): AxiosResponse {
  const newResponse = { ...response };
  const { data } = response;

  const isObject =
    typeof data === "object" && data !== null && !Array.isArray(data);

  if (isObject) {
    newResponse.data = { success: true, ...data };
  }

  return newResponse;
}

// 回應資料驗證
function responseValidate(response: AxiosResponse): AxiosResponse {
  const newResponse = { ...response };
  const { config, data } = response;
  const { codec, url } = config;

  if (!codec?.response) {
    return newResponse;
  }

  try {
    const { frontendSchema, backendSchema } = codec.response;
    const dataKeyMap = codec.dataKeyMap ?? {};

    // 1. 驗證後端 schema
    const parsedB = backendSchema.parse(data);
    // 2. 鍵名轉換（snake → camel）
    const hasKeyMap = Object.keys(dataKeyMap).length > 0;
    const mapped = hasKeyMap ? mapKeys(parsedB, dataKeyMap, "b2f") : parsedB;
    // 3. 驗證前端 schema
    const parsedF = frontendSchema.parse(mapped);

    newResponse.data = parsedF;
  } catch (err) {
    console.warn(`路徑 ${url} 回應資料格式錯誤`, err);
  }
  return newResponse;
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

/** ---------- 回應失敗工具函數 ---------- */
// 預處理錯誤，加入 success 欄位
function preprocessError(error: AxiosError): AxiosError {
  if (error.isHandled) {
    return error;
  }
  if (!error.config) {
    return error;
  }

  // 從回應標頭取得 traceId
  const traceId = error.response?.headers?.["x-trace-id"] || "N/A";
  const message = error.response?.data?.message || error.message || "未知錯誤";
  // 組合新的錯誤訊息
  const newMessage = `${message} (${traceId})`;

  return { ...error, success: false, traceId, message: newMessage };
}

// 解析 Blob 格式錯誤訊息
// async function parseBlobError(error: AxiosError): Promise<AxiosError> {
//   try {
//     const data = error.response?.data;
//     if (!data || !(data instanceof Blob)) {
//       return error;
//     }
//     const text = await data?.text();
//     let responseJson;

//     try {
//       responseJson = JSON.parse(text);
//     } catch {
//       responseJson = { message: text };
//     }

//     // 確保 traceId 存在
//     if (!responseJson.traceId) {
//       responseJson.traceId = "N/A";
//     }

//     // 塞回 response.data
//     error.response.data = responseJson;

//     // 若沒有 HTTP status，但有 code，則補上
//     if (responseJson.code && !error.response.status) {
//       error.response.status = responseJson.code;
//     }

//     // 🔹 保證 error.message 帶 traceId
//     error.message =
//       (responseJson.message || error.message || "未知錯誤") +
//       ` (${responseJson.traceId})`;
//     error.traceId = responseJson.traceId;
//   } catch (_error: unknown) {
//     error.response.data = { message: "未知的 Blob 錯誤", traceId: "N/A" };
//     error.message = "未知的 Blob 錯誤 (N/A)";
//     error.traceId = "N/A";
//   }

//   return error;
// }

/** --------- 遞迴 key 映射工具 --------- */
type KeyMap = Record<string, string>; // backend_key -> frontendKey

const isPlainObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" &&
  v !== null &&
  !Array.isArray(v) &&
  Object.prototype.toString.call(v) === "[object Object]";

const reverseKeyMap = (map: KeyMap): KeyMap => {
  const rev: KeyMap = {};
  for (const [bk, fk] of Object.entries(map)) {
    rev[fk] = bk;
  }
  return rev;
};

export function mapKeys(
  input: unknown,
  keyMap: KeyMap,
  direction: "b2f" | "f2b"
): unknown {
  const table = direction === "b2f" ? keyMap : reverseKeyMap(keyMap);

  const walk = (val: unknown): unknown => {
    if (Array.isArray(val)) {
      return val.map(walk);
    }
    if (!isPlainObject(val)) {
      return val;
    }

    return Object.fromEntries(
      Object.entries(val).map(([k, v]) => {
        const mappedKey = table[k] ?? k;
        return [mappedKey, walk(v)];
      })
    );
  };

  return walk(input);
}

/** ---------- 工具函式 ---------- */
function resetAuth(error: AxiosError): void {
  removeCookie(magicWord.ACCESS_TOKEN);
  removeCookie(magicWord.REFRESH_TOKEN);
  removeCookie(magicWord.TOKEN);
  isLogout = true;
  error.isHandled = true;
  alert(error.message || "認證失效，請重新登入");
  // 如果不是login頁面，導向至login頁面
  if (!window.location.pathname.includes("/login")) {
    window.location.href = "/login";
  }
}

// 刷新 token
function refreshToken() {
  const access = getCookie(magicWord.ACCESS_TOKEN) || "noAccess";
  const refresh = getCookie(magicWord.REFRESH_TOKEN) || "noRefresh";
  const isLogin = getCookie(magicWord.TOKEN) === "token";
  const url = isLogin
    ? "/authorization/refreshToken"
    : "/authorization/initializeToken";
  const headers = {
    "Content-Type": "application/json;charset=UTF-8",
    [magicWord.AUTHORIZATION]: `Bearer ${access}`,
    [magicWord.X_REFRESH_TOKEN]: `Bearer ${refresh}`,
  };
  return axios.request({
    baseURL,
    url,
    method: "get",
    headers,
  });
}

// 處理刷新 token 流程
async function refreshTokenHandler() {
  try {
    const res = await refreshToken();
    const newAccessToken = res.data.access_token;
    const newRefreshToken = res.data.refresh_token;
    const expiredTime = getExpiredTime(newRefreshToken);
    const expiredDate = new Date(expiredTime * 1000);

    setCookie(magicWord.ACCESS_TOKEN, newAccessToken);
    setCookie(magicWord.REFRESH_TOKEN, newRefreshToken, {
      expires: expiredDate,
    });
    failedQueue.resolveAll(axiosInstance);
  } catch (err: unknown) {
    if (err instanceof AxiosError) {
      resetAuth(err);
      failedQueue.rejectAll(err);
    }
  } finally {
    isRefreshing = false;
  }
}

// 檢查並重置 refresh token 計數器
function checkAndResetCounter() {
  const now = Date.now();
  if (now - lastResetTime >= RESET_INTERVAL) {
    if (refreshAttempts > 0) {
      // console.log( '重置 refresh token 計數器' )
    }
    refreshAttempts = 0;
    lastResetTime = now;
  }
}
