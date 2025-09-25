import { getPosts } from "./apis";
import {
  useQuery,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";

const queryClient = new QueryClient();

async function fetchPosts() {
  const response = await getPosts();
  console.log("res1", response.userId);
}

fetchPosts();

function Todos() {
  const { data } = useQuery({
    queryKey: ["todos"],
    queryFn: () => getPosts(),
  });
  console.log("data", data?.title);
  return <div>My Todos</div>;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Todos />
    </QueryClientProvider>
  );
}
