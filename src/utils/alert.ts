import type { ReactNode } from "react";
import type { ExternalToast } from "sonner";
import { toast } from "sonner";

const defaultOptions: Readonly<ExternalToast> = {
  duration: 3000,
  position: "top-center",
  richColors: true,
};

const mergeOptions = (options?: ExternalToast) => ({
  ...defaultOptions,
  ...options,
});

const successAlert = (
  message: string,
  options?: ExternalToast
): string | number => toast.success(message, mergeOptions(options));

const errorAlert = (
  message: string,
  options?: ExternalToast
): string | number => toast.error(message, mergeOptions(options));

type ToastAction = NonNullable<Parameters<typeof toast>[1]>["action"];

const actionAlert = (
  message: string,
  action: ToastAction,
  options?: ExternalToast
): string | number => toast(message, { action, ...mergeOptions(options) });

const promiseAlert = <T>(
  promise: Promise<T>,
  messages: {
    loading: ReactNode;
    success: (data: T) => ReactNode;
    error: (err: unknown) => ReactNode;
  },
  options?: ExternalToast
): string | number =>
  toast.promise(promise, { ...messages, ...mergeOptions(options) });

const customAlert = (
  content: ReactNode,
  options?: ExternalToast
): string | number => toast(content, mergeOptions(options));

export { successAlert, errorAlert, actionAlert, promiseAlert, customAlert };
