/* eslint-disable @typescript-eslint/no-explicit-any */
import "axios";
import z from "zod";

declare module "axios" {
  interface AxiosRequestConfig {
    isPreprocessing?: boolean;
    removeUrlParams?: boolean;
    _internalRetry?: boolean;
    codec?: {
      request?: {
        frontendSchema: z.ZodTypeAny;
        backendSchema: z.ZodTypeAny;
      };
      response?: {
        frontendSchema: z.ZodTypeAny;
        backendSchema: z.ZodTypeAny;
      };
      dataKeyMap?: Record<string, string>;
    };
  }
  interface AxiosError {
    isHandled?: boolean;
    success?: boolean;
    traceId?: string;
    isRefreshingTokenError?: boolean;
    isUnauthorizedError?: boolean;
  }

  interface AxiosInstance {
    request<T = any, R = T, D = any>(config: AxiosRequestConfig<D>): Promise<R>;
    get<T = any, R = T, D = any>(url: string, config?: AxiosRequestConfig<D>): Promise<R>;
    delete<T = any, R = T, D = any>(url: string, config?: AxiosRequestConfig<D>): Promise<R>;
    head<T = any, R = T, D = any>(url: string, config?: AxiosRequestConfig<D>): Promise<R>;
    options<T = any, R = T, D = any>(url: string, config?: AxiosRequestConfig<D>): Promise<R>;
    post<T = any, R = T, D = any>(url: string, data?: D, config?: AxiosRequestConfig<D>): Promise<R>;
    put<T = any, R = T, D = any>(url: string, data?: D, config?: AxiosRequestConfig<D>): Promise<R>;
    patch<T = any, R = T, D = any>(url: string, data?: D, config?: AxiosRequestConfig<D>): Promise<R>;
    postForm<T = any, R = T, D = any>(url: string, data?: D, config?: AxiosRequestConfig<D>): Promise<R>;
    putForm<T = any, R = T, D = any>(url: string, data?: D, config?: AxiosRequestConfig<D>): Promise<R>;
    patchForm<T = any, R = T, D = any>(url: string, data?: D, config?: AxiosRequestConfig<D>): Promise<R>;
  }
}
