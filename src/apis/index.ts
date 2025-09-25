import axiosInstance from "@/utils/request1";

export type Post = {
  userId: number;
  id: number;
  title: string;
  body: string;
};

export function getPosts() {
  return axiosInstance.request<Post>({
    url: "/posts/1",
    method: "GET",
  });
}

export function getPost() {
  return axiosInstance.get<Post>("/posts/1");
}
