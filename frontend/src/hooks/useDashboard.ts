import { useQuery } from '@tanstack/react-query'
import { fetchDashboardMetrics } from '@/lib/api'

export function useDashboard() {
  return useQuery({
    queryKey: ['dashboard-metrics'],
    queryFn: fetchDashboardMetrics,
    refetchInterval: 15_000,
  })
}
