import { AxiosRequestConfig as BaseAxiosRequestConfig } from "axios";
import z from "zod";

declare module "axios" {
  interface AxiosRequestConfig extends BaseAxiosRequestConfig {
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
}
