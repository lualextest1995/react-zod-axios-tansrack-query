import axios, { type AxiosRequestConfig } from "axios";

const baseURL = "https://jsonplaceholder.typicode.com";

const axiosInstance = axios.create({
  baseURL,
  timeout: 10000, // 请求超时时间
});

axiosInstance.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);
axiosInstance.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    return Promise.reject(error);
  }
);

function request<T>(config: AxiosRequestConfig): Promise<T> {
  return axiosInstance.request(config);
}

export default request;
