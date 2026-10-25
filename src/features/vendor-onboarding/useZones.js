import { useQuery } from "@tanstack/react-query"
import { api, unwrap } from "@/lib/api"

export const useZones = () =>
  useQuery({
    queryKey: ["zones"],
    queryFn: async () => unwrap(await api.get("/zones")),
    staleTime: 5 * 60 * 1000,
  })
