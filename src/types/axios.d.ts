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
}
