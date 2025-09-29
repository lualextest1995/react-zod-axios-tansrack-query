import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import Test1 from "@/components/Test1";
import Test2 from "./components/Test2";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 0,
      gcTime: 0,
      staleTime: 0,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      {/* <Test1 /> */}
      <br />
      <hr />
      <br />
      <Test2 />
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
