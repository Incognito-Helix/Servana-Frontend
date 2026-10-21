import { useQuery } from "@tanstack/react-query"
import { api, unwrap } from "@/lib/api"

export const useCategories = () =>
  useQuery({
    queryKey: ["categories"],
    queryFn: async () => unwrap(await api.get("/categories")),
    staleTime: 5 * 60 * 1000,
  })
