import { useQueryClient } from '@tanstack/react-query'

/** Variables affect references across the whole project, so refresh everything derived from it. */
export function useInvalidateProject(projectId: string) {
  const queryClient = useQueryClient()
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: ['entity'] }),
      queryClient.invalidateQueries({ queryKey: ['project', projectId] }),
      queryClient.invalidateQueries({ queryKey: ['projects'] }),
    ])
}
