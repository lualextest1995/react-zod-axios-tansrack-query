import request from "@/utils/request1";

export type Post = {
  userId: number;
  id: number;
  title: string;
  body: string;
};

export function getPosts() {
  return request<Post>({
    url: "/posts",
    method: "GET",
  });
}

export function getPost({
  id,
  ...others
}: {
  id: number;
  page: number;
  page_size: number;
}) {
  console.log(
    `當前查詢 id: ${id}, page: ${others.page}, page_size: ${others.page_size}`
  );
  return request<Post>({
    url: `/posts/${id}`,
    method: "GET",
  });
}

export function updatePost(data: Post) {
  return request<Post>({
    url: `/posts/1`,
    method: "POST",
    data,
  });
}
