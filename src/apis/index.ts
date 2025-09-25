import request from "@/utils/request1";

export type Post = {
  userId: number;
  id: number;
  title: string;
  body: string;
};

export function getPosts() {
  return request<Post>({
    url: "/posts/1",
    method: "GET",
  });
}

export function getPost() {
  return request<Post>({
    url: "/posts/1",
    method: "GET",
  });
}
